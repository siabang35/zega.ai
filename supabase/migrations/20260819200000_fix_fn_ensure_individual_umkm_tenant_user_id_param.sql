-- ============================================================================
-- ZEGA AI PLATFORM — HARDEN TENANT PROVISIONING RPC & CHAT TRIGGER BOUNDARY
-- Migration: 20260819200000_fix_fn_ensure_individual_umkm_tenant_user_id_param.sql
--
-- PURPOSE:
--   1. Redefine fn_ensure_individual_umkm_tenant to accept optional p_user_id UUID parameter.
--   2. Dynamically set default store_name to 'Toko <full_name/username>' derived from public.users.
--   3. Update fn_trg_auto_fill_chat_tenant_boundary trigger to invoke fn_ensure_individual_umkm_tenant(v_app_user_id).
--   4. Guarantee that workspace_id is populated from v_store_workspace_id or valid workspaces row during chat creation.
-- ============================================================================

BEGIN;

-- Drop existing function overloads to prevent 42P13 (cannot remove parameter defaults)
DROP FUNCTION IF EXISTS public.fn_ensure_individual_umkm_tenant(UUID, TEXT);
DROP FUNCTION IF EXISTS public.fn_ensure_individual_umkm_tenant(TEXT);

-- 1. Create fn_ensure_individual_umkm_tenant with p_user_id support & username-based default store naming
CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_user_id UUID DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_user_id UUID := auth.uid();
    v_target_user_id UUID := p_user_id;
    v_canonical_user_id UUID;
    v_user_email TEXT;
    v_owner_name TEXT;
    v_org_id UUID;
    v_workspace_id UUID;
    v_store_id UUID;
    v_store_record RECORD;
    v_clean_store_name TEXT;
BEGIN
    -- Resolve canonical application user ID
    IF v_target_user_id IS NOT NULL THEN
        SELECT id INTO v_canonical_user_id
        FROM public.users
        WHERE id = v_target_user_id OR auth_user_id = v_target_user_id
        LIMIT 1;

        IF v_canonical_user_id IS NULL THEN
            v_canonical_user_id := v_target_user_id;
        END IF;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        v_canonical_user_id := public.fn_current_app_user_id();
    END IF;

    IF v_canonical_user_id IS NULL AND v_auth_user_id IS NOT NULL THEN
        v_canonical_user_id := public.fn_get_or_create_current_app_user();
        IF v_canonical_user_id IS NULL THEN
            SELECT id INTO v_canonical_user_id
            FROM public.users
            WHERE auth_user_id = v_auth_user_id
            LIMIT 1;
        END IF;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION 'IDENTITY_MAPPING_ERROR: Could not resolve canonical application user'
            USING ERRCODE = '23503';
    END IF;

    -- Retrieve user identity details for default store naming
    SELECT email, full_name INTO v_user_email, v_owner_name
    FROM public.users WHERE id = v_canonical_user_id;

    IF p_store_name IS NULL OR TRIM(p_store_name) = '' OR TRIM(p_store_name) = 'Toko UMKM ZEGA' THEN
        IF v_owner_name IS NOT NULL AND TRIM(v_owner_name) <> '' THEN
            v_clean_store_name := 'Toko ' || TRIM(v_owner_name);
        ELSIF v_user_email IS NOT NULL AND TRIM(v_user_email) <> '' THEN
            v_clean_store_name := 'Toko ' || SPLIT_PART(TRIM(v_user_email), '@', 1);
        ELSE
            v_clean_store_name := 'Toko UMKM ZEGA';
        END IF;
    ELSE
        v_clean_store_name := TRIM(p_store_name);
    END IF;

    -- Serialize provisioning per canonical application user with advisory lock
    PERFORM pg_advisory_xact_lock(
        hashtextextended(v_canonical_user_id::text, 421283)
    );

    -- Check for existing store (Idempotent check matching canonical user ID or auth user ID)
    SELECT s.id, s.organization_id, s.workspace_id, s.store_name
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND s.user_id = v_auth_user_id)
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_store_record.id IS NOT NULL THEN
        v_store_id := v_store_record.id;
        v_org_id := v_store_record.organization_id;
        v_workspace_id := v_store_record.workspace_id;

        IF v_org_id IS NULL THEN
            SELECT organization_id INTO v_org_id
            FROM public.organization_members
            WHERE user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND user_id = v_auth_user_id)
            LIMIT 1;

            IF v_org_id IS NULL THEN
                v_org_id := gen_random_uuid();
                INSERT INTO public.organizations (id, name, slug, created_at, updated_at)
                VALUES (v_org_id, v_clean_store_name || ' Organization', 'org-' || substring(v_canonical_user_id::text from 1 for 8), NOW(), NOW());
            END IF;

            UPDATE public.umkm_stores SET organization_id = v_org_id WHERE id = v_store_id;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = v_org_id AND (user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND user_id = v_auth_user_id))
        ) THEN
            INSERT INTO public.organization_members (
                id, organization_id, user_id, role, status, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;

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

    -- Provision New Tenant Graph atomically
    v_org_id := gen_random_uuid();
    v_workspace_id := gen_random_uuid();
    v_store_id := gen_random_uuid();

    INSERT INTO public.organizations (
        id, name, slug, created_at, updated_at
    ) VALUES (
        v_org_id,
        v_clean_store_name || ' Organization',
        'org-' || substring(v_canonical_user_id::text from 1 for 8),
        NOW(), NOW()
    );

    INSERT INTO public.organization_members (
        id, organization_id, user_id, role, status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.workspaces (
        id, organization_id, name, slug, status, created_at, updated_at
    ) VALUES (
        v_workspace_id, v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW()
    );

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

    SELECT s.id, s.organization_id, s.workspace_id, s.store_name
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND s.user_id = v_auth_user_id)
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

-- Provide backward compatibility helper overload for single TEXT parameter
CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_store_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
    RETURN public.fn_ensure_individual_umkm_tenant(NULL::UUID, p_store_name);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(UUID, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) TO authenticated, service_role;

-- 2. Update Database Trigger for Chat Tenant Boundaries
CREATE OR REPLACE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID;
    v_app_user_id UUID;

    v_found_store_id UUID := NULL;
    v_store_org_id UUID := NULL;
    v_store_workspace_id UUID := NULL;
    v_store_user_id UUID := NULL;

    v_workspace_org_id UUID;
    v_has_store_access BOOLEAN := FALSE;
BEGIN
    -- A. AUTHENTICATION & USER IDENTITY RESOLUTION
    v_auth_uid := auth.uid();
    v_app_user_id := public.fn_current_app_user_id();

    IF v_app_user_id IS NULL AND NEW.user_id IS NOT NULL AND NEW.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT id INTO v_app_user_id
        FROM public.users
        WHERE id = NEW.user_id::UUID OR auth_user_id = NEW.user_id::UUID
        LIMIT 1;
    END IF;

    IF v_app_user_id IS NULL THEN
        v_app_user_id := public.fn_get_or_create_current_app_user();
    END IF;

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: authentication context and canonical user identity unavailable';
    END IF;

    NEW.user_id := v_app_user_id::TEXT;

    -- B. RESOLVE EXACT STORE & TENANT GRAPH (WITH STALE STORE FALLBACK)
    -- Step C1: Check if NEW.store_id exists in umkm_stores
    IF NEW.store_id IS NOT NULL THEN
        SELECT
            s.id,
            s.organization_id,
            s.workspace_id,
            s.user_id
        INTO
            v_found_store_id,
            v_store_org_id,
            v_store_workspace_id,
            v_store_user_id
        FROM public.umkm_stores AS s
        WHERE s.id = NEW.store_id
        LIMIT 1;
    END IF;

    -- Step C2: Fallback — if NEW.store_id was invalid/missing, resolve user's store in umkm_stores
    IF v_found_store_id IS NULL THEN
        SELECT
            s.id,
            s.organization_id,
            s.workspace_id,
            s.user_id
        INTO
            v_found_store_id,
            v_store_org_id,
            v_store_workspace_id,
            v_store_user_id
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_app_user_id
           OR (v_auth_uid IS NOT NULL AND s.user_id = v_auth_uid)
        ORDER BY s.created_at DESC
        LIMIT 1;

        IF v_found_store_id IS NOT NULL THEN
            NEW.store_id := v_found_store_id;
        END IF;
    END IF;

    -- Step C3: Fallback — if user has no store in umkm_stores, attempt auto-provisioning store passing v_app_user_id
    IF v_found_store_id IS NULL THEN
        BEGIN
            PERFORM public.fn_ensure_individual_umkm_tenant(v_app_user_id, NULL);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        SELECT
            s.id,
            s.organization_id,
            s.workspace_id,
            s.user_id
        INTO
            v_found_store_id,
            v_store_org_id,
            v_store_workspace_id,
            v_store_user_id
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_app_user_id
           OR (v_auth_uid IS NOT NULL AND s.user_id = v_auth_uid)
        ORDER BY s.created_at DESC
        LIMIT 1;

        IF v_found_store_id IS NOT NULL THEN
            NEW.store_id := v_found_store_id;
        END IF;
    END IF;

    -- Final Store Assertion
    IF NEW.store_id IS NULL OR v_found_store_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: store_id is required and store record does not exist in database';
    END IF;

    IF v_store_org_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: store %s has no organization', NEW.store_id);
    END IF;

    -- Authorization Check
    v_has_store_access :=
        (v_store_user_id = v_app_user_id)
        OR
        (v_auth_uid IS NOT NULL AND v_store_user_id = v_auth_uid)
        OR
        public.fn_is_org_member(v_store_org_id);

    IF NOT v_has_store_access THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: user %s is not authorized for store %s', v_app_user_id, NEW.store_id);
    END IF;

    -- Organization Assignment
    NEW.organization_id := v_store_org_id;

    -- Workspace Assignment & Auto-Repair
    IF v_store_workspace_id IS NOT NULL THEN
        NEW.workspace_id := v_store_workspace_id;
    ELSE
        SELECT id INTO v_store_workspace_id
        FROM public.workspaces
        WHERE organization_id = v_store_org_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_store_workspace_id IS NULL THEN
            v_store_workspace_id := gen_random_uuid();
            INSERT INTO public.workspaces (
                id, organization_id, name, slug, status, created_at, updated_at
            ) VALUES (
                v_store_workspace_id, v_store_org_id, 'Main Workspace', 'workspace-' || substring(v_app_user_id::text from 1 for 8), 'active', NOW(), NOW()
            );
        END IF;

        UPDATE public.umkm_stores
        SET workspace_id = v_store_workspace_id
        WHERE id = NEW.store_id;

        NEW.workspace_id := v_store_workspace_id;
    END IF;

    RETURN NEW;
END;
$function$;

COMMIT;
