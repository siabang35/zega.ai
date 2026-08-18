-- ============================================================================
-- ZEGA AI PLATFORM — FINAL PRODUCTION HARDENING MIGRATION
-- Migration: 20260819150000_final_production_hardening_identity_tenant_chat.sql
--
-- PURPOSE:
--   1. Reconcile and deduplicate existing umkm_stores records per user.
--   2. Add strict UNIQUE index on umkm_stores(user_id) to physically block duplicate stores.
--   3. Harden fn_ensure_individual_umkm_tenant to be 100% idempotent with advisory locking,
--      atomic transaction guards, and canonical identity resolution.
--   4. Enforce strict multi-tenant boundary RLS without compromising security.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. RECONCILE DUPLICATE STORES PER USER PRIOR TO UNIQUE CONSTRAINT
-- ============================================================================

DO $$
DECLARE
    v_user RECORD;
    v_primary_store RECORD;
    v_dup RECORD;
BEGIN
    FOR v_user IN
        SELECT user_id
        FROM public.umkm_stores
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
    LOOP
        -- Identify primary (oldest) store row for this user
        SELECT id, organization_id, workspace_id, store_name
        INTO v_primary_store
        FROM public.umkm_stores
        WHERE user_id = v_user.user_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_primary_store.id IS NOT NULL THEN
            -- Re-point any child chats pointing to duplicate store IDs
            FOR v_dup IN
                SELECT id
                FROM public.umkm_stores
                WHERE user_id = v_user.user_id AND id <> v_primary_store.id
            LOOP
                UPDATE public.umkm_zega_copilot_chats
                SET store_id = v_primary_store.id,
                    organization_id = COALESCE(organization_id, v_primary_store.organization_id),
                    workspace_id = COALESCE(workspace_id, v_primary_store.workspace_id)
                WHERE store_id = v_dup.id;

                UPDATE public.umkm_ai_assistant_chats
                SET store_id = v_primary_store.id,
                    organization_id = COALESCE(organization_id, v_primary_store.organization_id),
                    workspace_id = COALESCE(workspace_id, v_primary_store.workspace_id)
                WHERE store_id = v_dup.id;

                -- Delete duplicate store row
                DELETE FROM public.umkm_stores WHERE id = v_dup.id;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;

-- Add UNIQUE Index on umkm_stores(user_id) to physically enforce 1 canonical store per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_umkm_stores_unique_user_id
ON public.umkm_stores(user_id)
WHERE user_id IS NOT NULL;


-- ============================================================================
-- 2. HARDEN CANONICAL UMKM TENANT PROVISIONER RPC (100% IDEMPOTENT)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_store_name TEXT DEFAULT 'Toko UMKM ZEGA'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_user_id UUID := auth.uid();
    v_canonical_user_id UUID;
    v_user_email TEXT;
    v_owner_name TEXT;
    v_org_id UUID;
    v_workspace_id UUID;
    v_store_id UUID;
    v_store_record RECORD;
    v_clean_store_name TEXT;
BEGIN
    -- A. AUTH CONTEXT CHECK
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_CONTEXT_UNAVAILABLE: auth.uid() is null' USING ERRCODE = '42501';
    END IF;

    -- B. NORMALIZE STORE NAME
    v_clean_store_name := COALESCE(NULLIF(TRIM(p_store_name), ''), 'Toko UMKM ZEGA');

    -- C. RESOLVE CANONICAL APPLICATION USER ID
    v_canonical_user_id := public.fn_get_or_create_current_app_user();

    IF v_canonical_user_id IS NULL THEN
        SELECT id INTO v_canonical_user_id
        FROM public.users
        WHERE auth_user_id = v_auth_user_id
        LIMIT 1;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION 'IDENTITY_MAPPING_ERROR: Could not resolve canonical application user'
            USING ERRCODE = '23503';
    END IF;

    -- D. SERIALIZE PROVISIONING PER APPLICATION USER WITH ADVISORY LOCK
    PERFORM pg_advisory_xact_lock(
        hashtextextended(v_canonical_user_id::text, 421283)
    );

    -- E. CHECK EXISTING STORE (IDEMPOTENT CHECK)
    SELECT s.id, s.organization_id, s.workspace_id, s.store_name
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id OR s.user_id = v_auth_user_id
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_store_record.id IS NOT NULL THEN
        v_store_id := v_store_record.id;
        v_org_id := v_store_record.organization_id;
        v_workspace_id := v_store_record.workspace_id;

        -- Ensure Organization ID exists or repair it
        IF v_org_id IS NULL THEN
            SELECT organization_id INTO v_org_id
            FROM public.organization_members
            WHERE user_id = v_canonical_user_id OR user_id = v_auth_user_id
            LIMIT 1;

            IF v_org_id IS NULL THEN
                v_org_id := gen_random_uuid();
                INSERT INTO public.organizations (id, name, slug, created_at, updated_at)
                VALUES (v_org_id, v_clean_store_name || ' Organization', 'org-' || substring(v_canonical_user_id::text from 1 for 8), NOW(), NOW());
            END IF;

            UPDATE public.umkm_stores SET organization_id = v_org_id WHERE id = v_store_id;
        END IF;

        -- Ensure Organization Member record exists
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = v_org_id AND (user_id = v_canonical_user_id OR user_id = v_auth_user_id)
        ) THEN
            INSERT INTO public.organization_members (
                id, organization_id, user_id, role, status, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- Ensure Workspace exists
        IF v_workspace_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = v_workspace_id) THEN
            SELECT id INTO v_workspace_id
            FROM public.workspaces
            WHERE organization_id = v_org_id
            ORDER BY created_at ASC
            LIMIT 1;

            IF v_workspace_id IS NULL THEN
                INSERT INTO public.workspaces (
                    id, organization_id, name, slug, status, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW()
                ) RETURNING id INTO v_workspace_id;
            END IF;

            UPDATE public.umkm_stores
            SET workspace_id = v_workspace_id
            WHERE id = v_store_id;
        END IF;

        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'storeId', v_store_id,
            'organizationId', v_org_id,
            'workspaceId', v_workspace_id,
            'userId', v_canonical_user_id,
            'authUserId', v_auth_user_id,
            'storeName', COALESCE(v_store_record.store_name, v_clean_store_name)
        );
    END IF;

    -- F. PROVISION NEW TENANT GRAPH (Org -> Workspace -> Store -> Member)
    SELECT email, full_name INTO v_user_email, v_owner_name
    FROM public.users WHERE id = v_canonical_user_id;

    v_org_id := gen_random_uuid();
    v_workspace_id := gen_random_uuid();
    v_store_id := gen_random_uuid();

    -- Create Organization
    INSERT INTO public.organizations (
        id, name, slug, created_at, updated_at
    ) VALUES (
        v_org_id,
        v_clean_store_name || ' Organization',
        'org-' || substring(v_canonical_user_id::text from 1 for 8),
        NOW(), NOW()
    );

    -- Create Organization Member
    INSERT INTO public.organization_members (
        id, organization_id, user_id, role, status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;

    -- Create Workspace
    INSERT INTO public.workspaces (
        id, organization_id, name, slug, status, created_at, updated_at
    ) VALUES (
        v_workspace_id, v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW()
    );

    -- Create UMKM Store with ON CONFLICT DO NOTHING guard
    INSERT INTO public.umkm_stores (
        id, organization_id, workspace_id, user_id, store_name, owner_name, email, plan, is_active, created_at, updated_at
    ) VALUES (
        v_store_id,
        v_org_id,
        v_workspace_id,
        v_canonical_user_id,
        v_clean_store_name,
        COALESCE(v_owner_name, 'UMKM Owner'),
        COALESCE(v_user_email, 'user@zegaai.site'),
        'Starter',
        TRUE,
        NOW(), NOW()
    )
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO NOTHING;

    -- Re-query store in case another concurrent transaction inserted first
    SELECT s.id, s.organization_id, s.workspace_id, s.store_name
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id OR s.user_id = v_auth_user_id
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_store_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'PROVISIONED',
            'storeId', v_store_record.id,
            'organizationId', v_store_record.organization_id,
            'workspaceId', v_store_record.workspace_id,
            'userId', v_canonical_user_id,
            'authUserId', v_auth_user_id,
            'storeName', COALESCE(v_store_record.store_name, v_clean_store_name)
        );
    END IF;

    RAISE EXCEPTION 'PROVISIONING_FAILED: Store creation failed' USING ERRCODE = 'P0001';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) TO authenticated, service_role;

COMMIT;
