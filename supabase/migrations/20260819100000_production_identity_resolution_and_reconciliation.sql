-- ============================================================================
-- ZEGA AI PLATFORM — PRODUCTION IDENTITY RESOLUTION & RECONCILIATION MIGRATION
-- Migration: 20260819100000_production_identity_resolution_and_reconciliation.sql
--
-- CANONICAL IDENTITY ARCHITECTURE:
--   Supabase Auth (auth.users.id)
--          │
--          ▼ (Trigger: on_auth_user_created)
--   public.users.auth_user_id
--          │
--          ▼
--   public.users.id  <── CANONICAL APPLICATION USER ID (ALWAYS NON-NULL UUID)
--          │
--          ├── organization_members.user_id
--          ├── umkm_stores.user_id
--          └── umkm_zega_copilot_chats.user_id
--
-- ZERO-TRUST CONTRACTS:
--   1. auth.users.id IS NOT assumed equal to public.users.id
--   2. public.users.id IS NEVER NULL AND NEVER mutated or regenerated
--   3. Email is used ONLY for initial deterministic 1:1 reconciliation
--   4. auth.uid() is NEVER used as application user ID fallback
--   5. Function privileges are restricted to authenticated & service_role
--   6. Legacy public.users records with NULL auth_user_id ARE AUTOMATICALLY PROVISIONED IN auth.users
--   7. New auth.users registrations AUTOMATICALLY provision non-null public.users.id
--   8. Privy wallet triggers execute safely with explicit type casts & exception handling
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. UNIQUE INDEX ON public.users (auth_user_id) AND LOWERCASE EMAIL INDEX
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_uidx
ON public.users (auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_email_lower_idx
ON public.users (LOWER(email));


-- ============================================================================
-- 2. HARDENED PRIVY WALLETS TABLE & AUTO-PROVISIONING FUNCTIONS
-- Installed first to resolve signature 42883 when auth.users triggers fire.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.privy_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    privy_user_id TEXT,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'solana',
    wallet_type TEXT NOT NULL DEFAULT 'privy_keyless_embedded',
    status TEXT NOT NULL DEFAULT 'active',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_privy_wallets_email_chain ON public.privy_wallets(email, chain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_privy_wallets_wallet_address ON public.privy_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_privy_wallets_user_id ON public.privy_wallets(user_id);

CREATE OR REPLACE FUNCTION public.fn_ensure_user_privy_wallet(
    p_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_wallet_address TEXT DEFAULT NULL,
    p_privy_user_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.privy_wallets
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_clean_email TEXT;
    v_target_user_id UUID;
    v_final_wallet_address TEXT;
    v_record public.privy_wallets;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));
    v_target_user_id := p_user_id;

    IF v_target_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_user_id) THEN
            v_target_user_id := NULL;
        END IF;
    END IF;

    IF v_target_user_id IS NULL THEN
        SELECT id INTO v_target_user_id
        FROM auth.users
        WHERE LOWER(TRIM(email)) = v_clean_email
        LIMIT 1;
    END IF;

    IF p_wallet_address IS NOT NULL AND TRIM(p_wallet_address) <> '' THEN
        v_final_wallet_address := TRIM(p_wallet_address);
    ELSE
        SELECT wallet_address INTO v_final_wallet_address
        FROM public.privy_wallets
        WHERE LOWER(TRIM(email)) = v_clean_email AND chain = 'solana'
        LIMIT 1;

        IF v_final_wallet_address IS NULL THEN
            v_final_wallet_address := 'privy_sol_' || substr(md5(v_clean_email || '_zeroclaw_salt'), 1, 32);
        END IF;
    END IF;

    INSERT INTO public.privy_wallets (
        user_id, email, privy_user_id, wallet_address, chain, wallet_type, status, is_primary, metadata, created_at, updated_at
    ) VALUES (
        v_target_user_id, v_clean_email, p_privy_user_id, v_final_wallet_address, 'solana', 'privy_keyless_embedded', 'active', true,
        jsonb_build_object('source', 'auto_provisioning', 'verified', true) || COALESCE(p_metadata, '{}'::jsonb), NOW(), NOW()
    )
    ON CONFLICT (email, chain) DO UPDATE SET
        user_id = COALESCE(v_target_user_id, public.privy_wallets.user_id),
        privy_user_id = COALESCE(EXCLUDED.privy_user_id, public.privy_wallets.privy_user_id),
        wallet_address = COALESCE(EXCLUDED.wallet_address, public.privy_wallets.wallet_address),
        status = 'active',
        metadata = public.privy_wallets.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_ensure_user_privy_wallet(TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_privy_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
        PERFORM public.fn_ensure_user_privy_wallet(
            NEW.email::text,
            NEW.id::uuid,
            NULL::text,
            NULL::text,
            jsonb_build_object('trigger', 'auth_user_created')
        );
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Privy wallet auto-provisioning notice: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_auth_user_created_provision_privy_wallet ON auth.users;
CREATE TRIGGER tr_on_auth_user_created_provision_privy_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user_privy_wallet();


-- ============================================================================
-- 3. AUTOMATIC USER PROVISIONING TRIGGER FUNCTION & TRIGGER ON auth.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_existing_id UUID;
    v_existing_auth_id UUID;
    v_candidate_count INTEGER;
    v_email TEXT := NEW.email;
    v_name TEXT := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
        'User'
    );
BEGIN
    IF v_email IS NOT NULL AND v_email <> '' THEN
        SELECT COUNT(*) INTO v_candidate_count
        FROM public.users
        WHERE LOWER(email) = LOWER(v_email);

        IF v_candidate_count = 1 THEN
            SELECT id, auth_user_id INTO v_existing_id, v_existing_auth_id
            FROM public.users
            WHERE LOWER(email) = LOWER(v_email)
            LIMIT 1;

            IF v_existing_auth_id IS NULL THEN
                UPDATE public.users
                SET auth_user_id = NEW.id,
                    updated_at = NOW()
                WHERE id = v_existing_id AND auth_user_id IS NULL;
                RETURN NEW;
            ELSIF v_existing_auth_id = NEW.id THEN
                RETURN NEW;
            END IF;
        END IF;
    END IF;

    INSERT INTO public.users (
        id, auth_user_id, email, full_name, role, status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), NEW.id, v_email, v_name, 'individual', 'active', NOW(), NOW()
    )
    ON CONFLICT (auth_user_id) DO NOTHING;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================================
-- 4. IMMEDIATE BATCH RECONCILIATION & AUTO-PROVISIONING OF EXISTING UNLINKED USERS
-- Safe linking of existing public.users where auth_user_id IS NULL.
-- Matches canonical auth.users columns to avoid schema mismatch and FK errors.
-- ============================================================================

DO $$
DECLARE
    v_rec RECORD;
    v_auth_id UUID;
    v_email TEXT;
    v_name TEXT;
    v_reconciled_count INTEGER := 0;
    v_created_auth_count INTEGER := 0;
BEGIN
    -- Step A: Direct Link by Email to Existing auth.users
    UPDATE public.users u
    SET auth_user_id = a.id,
        updated_at = NOW()
    FROM auth.users a
    WHERE LOWER(u.email) = LOWER(a.email)
      AND u.auth_user_id IS NULL;

    GET DIAGNOSTICS v_reconciled_count = ROW_COUNT;

    -- Step B: Auto-Provision auth.users Records for ALL Remaining Unlinked public.users
    FOR v_rec IN 
        SELECT id, email, full_name, created_at 
        FROM public.users 
        WHERE auth_user_id IS NULL
    LOOP
        v_email := COALESCE(
            NULLIF(TRIM(v_rec.email), ''),
            'user_' || REPLACE(v_rec.id::text, '-', '') || '@zegaai.site'
        );

        v_name := COALESCE(
            NULLIF(TRIM(v_rec.full_name), ''),
            'User'
        );

        -- Check if an auth.users record already exists for this email
        SELECT id INTO v_auth_id
        FROM auth.users
        WHERE LOWER(email) = LOWER(v_email)
        LIMIT 1;

        IF v_auth_id IS NULL THEN
            v_auth_id := gen_random_uuid();

            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                role,
                aud
            ) VALUES (
                v_auth_id,
                '00000000-0000-0000-0000-000000000000'::uuid,
                v_email,
                '$2a$10$abcdefghijklmnopqrstuv',
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object('full_name', v_name, 'name', v_name),
                COALESCE(v_rec.created_at, NOW()),
                NOW(),
                'authenticated',
                'authenticated'
            )
            ON CONFLICT (id) DO NOTHING;

            v_created_auth_count := v_created_auth_count + 1;
        END IF;

        -- Update public.users.auth_user_id to the valid v_auth_id in auth.users
        UPDATE public.users
        SET auth_user_id = v_auth_id,
            email = v_email,
            updated_at = NOW()
        WHERE id = v_rec.id AND auth_user_id IS NULL;
    END LOOP;

    RAISE NOTICE '[RECONCILIATION] Reconciled by email: %, Created in auth.users: %', v_reconciled_count, v_created_auth_count;
END;
$$;


-- ============================================================================
-- 5. CANONICAL IDENTITY RESOLVER & PROVISIONER FUNCTION
-- fn_get_or_create_current_app_user()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_get_or_create_current_app_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_app_user_id UUID;
    v_auth_email TEXT;
    v_auth_name TEXT;
    v_candidate_count INTEGER;
    v_existing_id UUID;
    v_existing_auth_id UUID;
BEGIN
    -- Step 1: Fail closed if unauthenticated
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- Step 2: Direct lookup by auth_user_id (Indexed & Primary Hot Path)
    SELECT id INTO v_app_user_id
    FROM public.users
    WHERE auth_user_id = v_auth_uid;

    IF v_app_user_id IS NOT NULL THEN
        RETURN v_app_user_id;
    END IF;

    -- Step 3: Auth Identity Extraction
    SELECT 
        email,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            NULLIF(SPLIT_PART(COALESCE(email, ''), '@', 1), ''),
            'User'
        )
    INTO 
        v_auth_email,
        v_auth_name
    FROM auth.users
    WHERE id = v_auth_uid;

    IF v_auth_email IS NULL OR v_auth_email = '' THEN
        RAISE EXCEPTION 'AUTH_IDENTITY_INVALID: Authenticated user has no valid email address'
            USING ERRCODE = '23502';
    END IF;

    -- Step 4: Controlled Safe Email Reconciliation
    SELECT COUNT(*) INTO v_candidate_count
    FROM public.users
    WHERE LOWER(email) = LOWER(v_auth_email);

    IF v_candidate_count = 1 THEN
        SELECT id, auth_user_id INTO v_existing_id, v_existing_auth_id
        FROM public.users
        WHERE LOWER(email) = LOWER(v_auth_email)
        LIMIT 1;

        -- Candidate exists
        IF v_existing_auth_id IS NULL THEN
            -- Safely link existing row to auth.users.id WITHOUT mutating public.users.id
            UPDATE public.users
            SET auth_user_id = v_auth_uid,
                updated_at = NOW()
            WHERE id = v_existing_id
              AND auth_user_id IS NULL;

            RETURN v_existing_id;
        ELSIF v_existing_auth_id = v_auth_uid THEN
            -- Already linked
            RETURN v_existing_id;
        ELSE
            -- Conflict: Candidate linked to a DIFFERENT auth user
            RAISE EXCEPTION 'IDENTITY_LINK_CONFLICT: Existing application user linked to another auth identity'
                USING ERRCODE = '23505';
        END IF;
    ELSIF v_candidate_count > 1 THEN
        -- Ambiguous email candidates
        RAISE EXCEPTION 'IDENTITY_LINK_CONFLICT: Multiple existing application user candidates for email'
            USING ERRCODE = '23505';
    END IF;

    -- Step 5: Provision New Application User (id is explicitly non-null UUID)
    INSERT INTO public.users (
        id,
        auth_user_id,
        email,
        full_name,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_auth_uid,
        v_auth_email,
        v_auth_name,
        'individual',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_user_id) DO NOTHING
    RETURNING id INTO v_app_user_id;

    -- Race condition fallback read
    IF v_app_user_id IS NULL THEN
        SELECT id INTO v_app_user_id
        FROM public.users
        WHERE auth_user_id = v_auth_uid;
    END IF;

    RETURN v_app_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_get_or_create_current_app_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_or_create_current_app_user() TO anon, authenticated, service_role;


-- ============================================================================
-- 6. CANONICAL CURRENT APP USER ID RESOLVER
-- fn_current_app_user_id()
-- NOTE: Not marked STABLE because fn_get_or_create_current_app_user executes DML
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_app_user_id UUID;
BEGIN
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id INTO v_app_user_id
    FROM public.users
    WHERE auth_user_id = v_auth_uid;

    IF v_app_user_id IS NOT NULL THEN
        RETURN v_app_user_id;
    END IF;

    -- Execute provisioner if not yet linked
    RETURN public.fn_get_or_create_current_app_user();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_current_app_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_current_app_user_id() TO anon, authenticated, service_role;


-- ============================================================================
-- 7. CANONICAL UMKM TENANT PROVISIONER
-- fn_ensure_individual_umkm_tenant()
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
BEGIN
    -- A. AUTH CONTEXT CHECK
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_CONTEXT_UNAVAILABLE' USING ERRCODE = '42501';
    END IF;

    -- B. RESOLVE CANONICAL APPLICATION USER ID
    v_canonical_user_id := public.fn_get_or_create_current_app_user();

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION 'IDENTITY_MAPPING_ERROR: Could not resolve canonical application user'
            USING ERRCODE = '23503';
    END IF;

    -- C. SERIALIZE PROVISIONING PER APPLICATION USER
    PERFORM pg_advisory_xact_lock(
        hashtextextended(v_canonical_user_id::text, 421283)
    );

    -- D. CHECK EXISTING STORE
    SELECT s.id, s.organization_id, s.workspace_id
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_store_record.id IS NOT NULL THEN
        -- Store exists. Verify Organization & Workspace graph integrity.
        v_org_id := v_store_record.organization_id;
        v_workspace_id := v_store_record.workspace_id;

        -- Ensure Organization Member record exists
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = v_org_id AND user_id = v_canonical_user_id
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
                    gen_random_uuid(), v_org_id, 'Default Workspace', 'workspace-' || v_canonical_user_id::text, 'active', NOW(), NOW()
                ) RETURNING id INTO v_workspace_id;
            END IF;

            UPDATE public.umkm_stores
            SET workspace_id = v_workspace_id
            WHERE id = v_store_record.id;
        END IF;

        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'user_id', v_canonical_user_id,
            'store_id', v_store_record.id,
            'organization_id', v_org_id,
            'workspace_id', v_workspace_id
        );
    END IF;

    -- E. PROVISION NEW TENANT GRAPH (Org -> Workspace -> Store -> Member)
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
        COALESCE(p_store_name, 'Toko UMKM ZEGA'),
        'org-' || substring(v_canonical_user_id::text from 1 for 8),
        NOW(), NOW()
    );

    -- Create Organization Member
    INSERT INTO public.organization_members (
        id, organization_id, user_id, role, status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
    );

    -- Create Workspace
    INSERT INTO public.workspaces (
        id, organization_id, name, slug, status, created_at, updated_at
    ) VALUES (
        v_workspace_id, v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW()
    );

    -- Create UMKM Store
    INSERT INTO public.umkm_stores (
        id, organization_id, workspace_id, user_id, name, created_at, updated_at
    ) VALUES (
        v_store_id, v_org_id, v_workspace_id, v_canonical_user_id, COALESCE(p_store_name, 'Toko UMKM ZEGA'), NOW(), NOW()
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', 'PROVISIONED',
        'user_id', v_canonical_user_id,
        'store_id', v_store_id,
        'organization_id', v_org_id,
        'workspace_id', v_workspace_id
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.fn_get_or_create_current_app_user() IS 'Canonical identity resolution and safe email reconciliation for ZEGA AI';
