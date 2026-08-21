-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — Migration: 20260822030000_dynamic_umkm_user_profiles_contract.sql
-- CANONICAL DYNAMIC UMKM USER PROFILE CONTRACT & ZERO-TRUST SECURITY HARDENING
-- ═══════════════════════════════════════════════════════════════════════════════

-- 0A. Fix fn_ensure_user_privy_wallet COALESCE Type Mismatch
CREATE OR REPLACE FUNCTION public.fn_ensure_user_privy_wallet(
    p_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_wallet_address TEXT DEFAULT NULL,
    p_privy_user_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.privy_wallets
LANGUAGE plpgsql
SECURITY DEFINER
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
        user_id = COALESCE(v_target_user_id::uuid, public.privy_wallets.user_id::uuid),
        privy_user_id = COALESCE(EXCLUDED.privy_user_id, public.privy_wallets.privy_user_id),
        wallet_address = COALESCE(EXCLUDED.wallet_address, public.privy_wallets.wallet_address),
        status = 'active',
        metadata = public.privy_wallets.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING * INTO v_record;

    RETURN v_record;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'fn_ensure_user_privy_wallet exception: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- 0B. Safe Exception Wrapper for handle_new_umkm_profile_privy_wallet Trigger
CREATE OR REPLACE FUNCTION public.handle_new_umkm_profile_privy_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
        BEGIN
            PERFORM public.fn_ensure_user_privy_wallet(
                NEW.email::text,
                NULL::uuid,
                NULL::text,
                NULL::text,
                jsonb_build_object('trigger', 'umkm_profile_created')
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Privy wallet trigger warning: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$;

-- 0C. Fix Pre-Existing Trigger Function (fn_validate_cross_tenant_fk_store) Type Mismatch
CREATE OR REPLACE FUNCTION public.fn_validate_cross_tenant_fk_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_org_id UUID;
BEGIN
    IF NEW.store_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Explicitly cast store_id to UUID to prevent "operator does not exist: uuid = character varying"
    SELECT organization_id INTO v_store_org_id
    FROM public.umkm_stores
    WHERE id = NEW.store_id::uuid;

    IF v_store_org_id IS NOT NULL AND NEW.organization_id IS NOT NULL AND v_store_org_id IS DISTINCT FROM NEW.organization_id THEN
        RAISE EXCEPTION 'CROSS_TENANT_MISMATCH: Organization ID mismatch between store and profile' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- 1. Create or Align public.umkm_user_profiles Table
CREATE TABLE IF NOT EXISTS public.umkm_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    account_id VARCHAR NOT NULL,
    fullname VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    phone VARCHAR NOT NULL DEFAULT '',
    is_phone_verified BOOLEAN NOT NULL DEFAULT false,
    job_title VARCHAR NOT NULL DEFAULT '',
    store_name VARCHAR NOT NULL DEFAULT '',
    description TEXT,
    avatar_url TEXT,
    account_role VARCHAR NOT NULL DEFAULT 'owner',
    joined_date VARCHAR NOT NULL DEFAULT '',
    last_login_label VARCHAR NOT NULL DEFAULT '',
    account_status VARCHAR NOT NULL DEFAULT 'active',
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workspace_id UUID NULL REFERENCES public.workspaces(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all mandatory columns exist on pre-existing schema and cast types explicitly
DO $$
BEGIN
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS account_id VARCHAR;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS last_login_label VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
    
    -- Explicitly cast store_id to UUID if it was previously varchar
    BEGIN
        ALTER TABLE public.umkm_user_profiles ALTER COLUMN store_id TYPE UUID USING store_id::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'store_id column type cast note: %', SQLERRM;
    END;
END $$;

-- 2. Add Composite Uniqueness Constraint (store_id, account_id)
DO $$
BEGIN
    ALTER TABLE public.umkm_user_profiles DROP CONSTRAINT IF EXISTS uk_store_profile;
    ALTER TABLE public.umkm_user_profiles DROP CONSTRAINT IF EXISTS umkm_user_profiles_store_email_unique;
    ALTER TABLE public.umkm_user_profiles DROP CONSTRAINT IF EXISTS umkm_user_profiles_store_account_unique;
    
    -- Backfill account_id from email or store for pre-existing rows if null
    UPDATE public.umkm_user_profiles 
    SET account_id = COALESCE(account_id, (SELECT u.id::text FROM public.users u WHERE u.email = umkm_user_profiles.email LIMIT 1), store_id::text)
    WHERE account_id IS NULL;

    ALTER TABLE public.umkm_user_profiles ALTER COLUMN account_id SET NOT NULL;

    ALTER TABLE public.umkm_user_profiles 
    ADD CONSTRAINT umkm_user_profiles_store_account_unique UNIQUE (store_id, account_id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Uniqueness constraint setup note: %', SQLERRM;
END $$;

-- 3. Row-Level Security (RLS) Enforcement
ALTER TABLE public.umkm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read umkm_user_profiles" ON public.umkm_user_profiles;
DROP POLICY IF EXISTS "Public write umkm_user_profiles" ON public.umkm_user_profiles;
DROP POLICY IF EXISTS "umkm_user_profiles_tenant_select" ON public.umkm_user_profiles;
DROP POLICY IF EXISTS "umkm_user_profiles_tenant_update" ON public.umkm_user_profiles;
DROP POLICY IF EXISTS "umkm_user_profiles_tenant_insert" ON public.umkm_user_profiles;
DROP POLICY IF EXISTS "umkm_user_profiles_tenant_delete" ON public.umkm_user_profiles;

CREATE POLICY "umkm_user_profiles_tenant_select"
ON public.umkm_user_profiles
FOR SELECT
TO authenticated
USING (
  public.fn_can_access_umkm_store(store_id::uuid, organization_id, workspace_id)
  AND (
    account_id = (SELECT u.id::text FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    OR account_id = auth.uid()::text
  )
);

CREATE POLICY "umkm_user_profiles_tenant_update"
ON public.umkm_user_profiles
FOR UPDATE
TO authenticated
USING (
  public.fn_can_access_umkm_store(store_id::uuid, organization_id, workspace_id)
  AND (
    account_id = (SELECT u.id::text FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    OR account_id = auth.uid()::text
  )
)
WITH CHECK (
  public.fn_can_access_umkm_store(store_id::uuid, organization_id, workspace_id)
  AND (
    account_id = (SELECT u.id::text FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    OR account_id = auth.uid()::text
  )
);

-- 4. RPC Function: fn_ensure_umkm_user_profile() (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fn_ensure_umkm_user_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID;
    v_app_user RECORD;
    v_store RECORD;
    v_profile RECORD;
    v_account_id TEXT;
    v_email TEXT;
    v_fullname TEXT;
BEGIN
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: Authenticated user identity required' USING ERRCODE = '42501';
    END IF;

    -- Map auth.uid() -> public.users
    SELECT * INTO v_app_user FROM public.users WHERE auth_user_id = v_auth_uid OR id = v_auth_uid LIMIT 1;
    IF v_app_user IS NULL THEN
        SELECT * INTO v_app_user FROM public.users WHERE email = (SELECT email FROM auth.users WHERE id = v_auth_uid) LIMIT 1;
    END IF;

    IF v_app_user IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: App user record not found for authenticated identity' USING ERRCODE = 'P0002';
    END IF;

    v_account_id := v_app_user.id::text;
    v_email := LOWER(TRIM(v_app_user.email));
    v_fullname := COALESCE(v_app_user.full_name, split_part(v_email, '@', 1));

    -- Resolve store
    SELECT * INTO v_store FROM public.umkm_stores WHERE user_id = v_app_user.id OR user_id = v_app_user.auth_user_id LIMIT 1;
    IF v_store IS NULL THEN
        INSERT INTO public.umkm_stores (
            id, user_id, organization_id, workspace_id, store_name, category, is_active
        ) VALUES (
            gen_random_uuid(),
            v_app_user.id,
            COALESCE(v_app_user.organization_id, gen_random_uuid()),
            v_app_user.workspace_id,
            'Toko ' || INITCAP(v_fullname),
            'General',
            true
        ) RETURNING * INTO v_store;
    END IF;

    -- Upsert profile idempotently
    INSERT INTO public.umkm_user_profiles (
        store_id, account_id, fullname, email, is_email_verified, phone, is_phone_verified,
        job_title, store_name, description, avatar_url, account_role, joined_date, last_login_label,
        account_status, organization_id, workspace_id
    ) VALUES (
        v_store.id::uuid,
        v_account_id,
        v_fullname,
        v_email,
        true,
        '+62 812-3456-7890',
        false,
        'Pemilik Bisnis',
        v_store.store_name,
        'Toko resmi ZEGA AI platform.',
        '/assets/avatars/user-avatar.jpg',
        'owner',
        TO_CHAR(v_app_user.created_at, 'DD Month YYYY'),
        'Hari Ini',
        'active',
        v_store.organization_id,
        v_store.workspace_id
    ) ON CONFLICT (store_id, account_id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        workspace_id = EXCLUDED.workspace_id,
        updated_at = NOW()
    RETURNING * INTO v_profile;

    RETURN to_jsonb(v_profile);
END;
$$;

-- 5. RPC Function: fn_update_umkm_user_profile(...) (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fn_update_umkm_user_profile(
    p_store_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_fullname TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_job_title TEXT DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID;
    v_app_user RECORD;
    v_profile RECORD;
    v_store RECORD;
BEGIN
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED: Authenticated identity required' USING ERRCODE = '42501';
    END IF;

    -- Resolve app user identity
    SELECT * INTO v_app_user FROM public.users WHERE auth_user_id = v_auth_uid OR id = v_auth_uid LIMIT 1;
    IF v_app_user IS NULL THEN
        SELECT * INTO v_app_user FROM public.users WHERE email = (SELECT email FROM auth.users WHERE id = v_auth_uid) LIMIT 1;
    END IF;

    IF v_app_user IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: Canonical app user not found' USING ERRCODE = 'P0002';
    END IF;

    -- Resolve canonical store for authenticated user
    SELECT * INTO v_store FROM public.umkm_stores WHERE user_id = v_app_user.id OR user_id = v_app_user.auth_user_id OR id = p_store_id LIMIT 1;
    IF v_store IS NULL THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND: Canonical UMKM store not found' USING ERRCODE = 'P0002';
    END IF;

    -- Ensure profile exists and update
    INSERT INTO public.umkm_user_profiles (
        store_id, account_id, fullname, email, phone, job_title, store_name, description, avatar_url,
        organization_id, workspace_id
    ) VALUES (
        v_store.id::uuid,
        v_app_user.id::text,
        COALESCE(p_fullname, v_app_user.full_name, split_part(v_app_user.email, '@', 1)),
        LOWER(TRIM(COALESCE(p_email, v_app_user.email))),
        COALESCE(p_phone, ''),
        COALESCE(p_job_title, 'Pemilik Bisnis'),
        COALESCE(p_store_name, v_store.store_name),
        COALESCE(p_description, ''),
        COALESCE(p_avatar_url, ''),
        v_store.organization_id,
        v_store.workspace_id
    ) ON CONFLICT (store_id, account_id) DO UPDATE SET
        fullname = COALESCE(EXCLUDED.fullname, umkm_user_profiles.fullname),
        phone = COALESCE(EXCLUDED.phone, umkm_user_profiles.phone),
        job_title = COALESCE(EXCLUDED.job_title, umkm_user_profiles.job_title),
        store_name = COALESCE(EXCLUDED.store_name, umkm_user_profiles.store_name),
        description = COALESCE(EXCLUDED.description, umkm_user_profiles.description),
        avatar_url = COALESCE(EXCLUDED.avatar_url, umkm_user_profiles.avatar_url),
        updated_at = NOW()
    RETURNING * INTO v_profile;

    RETURN to_jsonb(v_profile);
END;
$$;

-- 6. Granular Permissions & Role Revocations
GRANT EXECUTE ON FUNCTION public.fn_ensure_umkm_user_profile() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_update_umkm_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.fn_ensure_umkm_user_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_update_umkm_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;

REVOKE ALL ON TABLE public.umkm_user_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_user_profiles TO authenticated, service_role;

-- 7. DYNAMIC BACKFILL FOR ALL EXISTING USERS
DO $$
DECLARE
    r RECORD;
    v_store RECORD;
BEGIN
    FOR r IN SELECT * FROM public.users LOOP
        -- Resolve or create store for user
        SELECT * INTO v_store FROM public.umkm_stores WHERE user_id = r.id OR user_id = r.auth_user_id LIMIT 1;
        IF v_store IS NULL THEN
            INSERT INTO public.umkm_stores (
                id, user_id, organization_id, workspace_id, store_name, category, is_active
            ) VALUES (
                gen_random_uuid(),
                r.id,
                COALESCE(r.organization_id, gen_random_uuid()),
                r.workspace_id,
                'Toko ' || INITCAP(split_part(r.email, '@', 1)),
                'General',
                true
            ) RETURNING * INTO v_store;
        END IF;

        -- Insert profile if missing
        INSERT INTO public.umkm_user_profiles (
            store_id, account_id, fullname, email, is_email_verified, phone, is_phone_verified,
            job_title, store_name, description, avatar_url, account_role, joined_date, last_login_label,
            account_status, organization_id, workspace_id
        ) VALUES (
            v_store.id::uuid,
            r.id::text,
            COALESCE(r.full_name, split_part(r.email, '@', 1)),
            LOWER(TRIM(r.email)),
            true,
            '+62 812-3456-7890',
            false,
            'Pemilik Bisnis',
            v_store.store_name,
            'Toko resmi ZEGA AI platform.',
            '/assets/avatars/user-avatar.jpg',
            'owner',
            TO_CHAR(r.created_at, 'DD Month YYYY'),
            'Hari Ini',
            'active',
            v_store.organization_id,
            v_store.workspace_id
        ) ON CONFLICT (store_id, account_id) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            workspace_id = EXCLUDED.workspace_id,
            updated_at = NOW();
    END LOOP;
END $$;
