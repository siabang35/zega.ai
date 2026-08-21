-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — Migration: 20260822040000_idempotent_profile_persistence.sql
-- IDEMPOTENT PROFILE PERSISTENCE & ZERO-RESET SECURITY CONTRACT
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure Table Structure & Constraints
DO $$
BEGIN
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS account_id VARCHAR;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS last_login_label VARCHAR NOT NULL DEFAULT '';
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    ALTER TABLE public.umkm_user_profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
END $$;

-- 2. Fully Idempotent fn_get_or_create_umkm_user_profile
CREATE OR REPLACE FUNCTION public.fn_get_or_create_umkm_user_profile(
    p_store_id UUID,
    p_email VARCHAR(150),
    p_fullname VARCHAR(150) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_email VARCHAR(150);
    v_profile RECORD;
    v_security RECORD;
    v_pref RECORD;
    v_name VARCHAR(150);
    v_account_id VARCHAR(50);
    v_store RECORD;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));
    
    -- 1. CHECK IF PROFILE ALREADY EXISTS FOR STORE AND EMAIL / ACCOUNT
    SELECT * INTO v_profile 
    FROM public.umkm_user_profiles 
    WHERE (store_id = p_store_id OR p_store_id IS NULL)
      AND (LOWER(TRIM(email)) = v_clean_email OR account_id = v_clean_email)
    ORDER BY updated_at DESC 
    LIMIT 1;

    -- IF PROFILE EXISTS, RETURN UNCHANGED IMMEDIATELY (NEVER OVERWRITE persisted CUSTOM DATA)
    IF v_profile IS NOT NULL THEN
        SELECT * INTO v_security FROM public.umkm_user_security WHERE store_id = v_profile.store_id AND LOWER(TRIM(email)) = v_clean_email LIMIT 1;
        SELECT * INTO v_pref FROM public.umkm_user_preferences WHERE store_id = v_profile.store_id LIMIT 1;

        RETURN jsonb_build_object(
            'profile', to_jsonb(v_profile),
            'security', to_jsonb(v_security),
            'preferences', to_jsonb(v_pref)
        );
    END IF;

    -- 2. IF PROFILE DOES NOT EXIST, RESOLVE OR CREATE CANONICAL STORE
    SELECT * INTO v_store FROM public.umkm_stores WHERE id = p_store_id LIMIT 1;
    IF v_store IS NULL THEN
        SELECT * INTO v_store FROM public.umkm_stores LIMIT 1;
    END IF;

    v_name := COALESCE(NULLIF(TRIM(p_fullname), ''), split_part(v_clean_email, '@', 1));
    v_account_id := 'acc_' || substr(md5(v_clean_email), 1, 12);

    -- INSERT DEFAULTS ONCE
    INSERT INTO public.umkm_user_profiles (
        store_id, account_id, fullname, email, phone, job_title, store_name, description, avatar_url,
        account_role, joined_date, account_status, organization_id, workspace_id
    ) VALUES (
        COALESCE(v_store.id, p_store_id, gen_random_uuid()),
        v_account_id,
        v_name,
        v_clean_email,
        '+62 812-3456-7890',
        'Owner',
        'Toko ' || INITCAP(v_name),
        'Toko resmi ZEGA AI platform.',
        '/assets/avatars/user-avatar.jpg',
        'owner',
        TO_CHAR(NOW(), 'DD Month YYYY'),
        'active',
        COALESCE(v_store.organization_id, gen_random_uuid()),
        v_store.workspace_id
    ) ON CONFLICT (store_id, account_id) DO UPDATE SET
        updated_at = NOW()
    RETURNING * INTO v_profile;

    -- Security record setup
    INSERT INTO public.umkm_user_security (
        store_id, email, is_2fa_enabled, recovery_email, recovery_phone
    ) VALUES (
        v_profile.store_id,
        v_clean_email,
        true,
        v_clean_email,
        '+62 812-3456-7890'
    ) ON CONFLICT (store_id, email) DO UPDATE SET
        updated_at = NOW()
    RETURNING * INTO v_security;

    -- Fetch Preferences
    SELECT * INTO v_pref FROM public.umkm_user_preferences WHERE store_id = v_profile.store_id LIMIT 1;

    RETURN jsonb_build_object(
        'profile', to_jsonb(v_profile),
        'security', to_jsonb(v_security),
        'preferences', to_jsonb(v_pref)
    );
END;
$$;

-- 3. Fully Idempotent fn_ensure_umkm_user_profile
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

    -- 1. CHECK IF PROFILE ALREADY EXISTS
    SELECT * INTO v_profile 
    FROM public.umkm_user_profiles 
    WHERE account_id = v_account_id 
       OR LOWER(TRIM(email)) = v_email
    ORDER BY updated_at DESC 
    LIMIT 1;

    -- IF PROFILE EXISTS, RETURN UNCHANGED IMMEDIATELY
    IF v_profile IS NOT NULL THEN
        RETURN to_jsonb(v_profile);
    END IF;

    -- 2. IF MISSING, RESOLVE STORE AND INSERT
    v_fullname := COALESCE(NULLIF(TRIM(v_app_user.full_name), ''), split_part(v_email, '@', 1));
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

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.fn_get_or_create_umkm_user_profile(UUID, VARCHAR, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_ensure_umkm_user_profile() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.fn_get_or_create_umkm_user_profile(UUID, VARCHAR, VARCHAR) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_ensure_umkm_user_profile() FROM anon;
