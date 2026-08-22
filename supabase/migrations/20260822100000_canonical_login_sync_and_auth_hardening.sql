-- ============================================================================
-- ZEGA AI PLATFORM — CANONICAL AUTH & LOGIN SYNCHRONIZATION HARDENING
-- Migration: 20260822100000_canonical_login_sync_and_auth_hardening.sql
--
-- PURPOSE:
--   1. Ensure public.users password_hash column is absent and UNIQUE index on auth_user_id exists.
--   2. Define public.fn_sync_auth_user_to_public_user() trigger function on auth.users (AFTER INSERT OR UPDATE).
--      CRITICAL: This trigger function MUST NOT mutate last_login_at.
--   3. Create security-definer RPC public.fn_record_user_login() (and record_user_login alias)
--      which strictly checks auth.uid() and sets last_login_at = NOW() on real user authentication.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. DATABASE SCHEMA INTEGRITY ASSERTIONS
-- ----------------------------------------------------------------------------

-- Ensure legacy password_hash column does not exist on public.users
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Ensure UNIQUE index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_uidx
    ON public.users (auth_user_id)
    WHERE auth_user_id IS NOT NULL;

-- Index on lowercase email for fast reconciliation lookups
CREATE INDEX IF NOT EXISTS users_email_lower_idx
    ON public.users (LOWER(email));


-- ----------------------------------------------------------------------------
-- 2. CANONICAL AUTH SYNCHRONIZATION TRIGGER FUNCTION
-- fn_sync_auth_user_to_public_user()
-- Executed on AFTER INSERT OR UPDATE on auth.users.
-- Synchronizes identity & profile state WITHOUT touching last_login_at.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_sync_auth_user_to_public_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_existing_id UUID;
    v_email TEXT;
    v_name TEXT;
    v_avatar TEXT;
BEGIN
    -- Extract email safely with fallback to raw_user_meta_data or synthetic email
    v_email := LOWER(TRIM(COALESCE(
        NEW.email,
        NEW.raw_user_meta_data->>'email',
        'user_' || REPLACE(NEW.id::text, '-', '') || '@zegaai.site'
    )));

    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULLIF(SPLIT_PART(v_email, '@', 1), ''),
        'User'
    );

    v_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
    );

    -- Advisory lock per email to prevent concurrent insert race conditions
    PERFORM pg_advisory_xact_lock(
        hashtextextended(v_email, 882910)
    );

    -- 1. Check if public.users already has a row with matching auth_user_id
    SELECT id INTO v_existing_id
    FROM public.users
    WHERE auth_user_id = NEW.id
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Row exists, update identity & profile metadata ONLY (DO NOT touch last_login_at)
        UPDATE public.users
        SET email = COALESCE(v_email, email),
            full_name = COALESCE(v_name, full_name),
            avatar_url = COALESCE(v_avatar, avatar_url),
            updated_at = NOW()
        WHERE id = v_existing_id;

        RETURN NEW;
    END IF;

    -- 2. Check for existing candidate matching email (unlinked or previously created)
    SELECT id INTO v_existing_id
    FROM public.users
    WHERE LOWER(email) = v_email
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Link existing record to this auth user ID
        UPDATE public.users
        SET auth_user_id = NEW.id,
            email = v_email,
            full_name = COALESCE(v_name, full_name),
            avatar_url = COALESCE(v_avatar, avatar_url),
            updated_at = NOW()
        WHERE id = v_existing_id;

        RETURN NEW;
    END IF;

    -- 3. Provision new canonical public.users record safely
    BEGIN
        INSERT INTO public.users (
            id,
            auth_user_id,
            email,
            full_name,
            avatar_url,
            role,
            status,
            billing_plan,
            credits_balance,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            v_email,
            v_name,
            v_avatar,
            'individual',
            'active',
            'starter',
            1000.00,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        -- Fallback update if a race condition occurred on auth_user_id or email
        UPDATE public.users
        SET auth_user_id = NEW.id,
            full_name = COALESCE(v_name, full_name),
            avatar_url = COALESCE(v_avatar, avatar_url),
            updated_at = NOW()
        WHERE auth_user_id = NEW.id OR LOWER(email) = v_email;
    END;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'fn_sync_auth_user_to_public_user notice: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Bind canonical trigger to auth.users
DROP TRIGGER IF EXISTS trg_auth_user_canonical_identity_sync ON auth.users;
CREATE TRIGGER trg_auth_user_canonical_identity_sync
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_auth_user_to_public_user();


-- ----------------------------------------------------------------------------
-- 3. CENTRALIZED AUTHENTICATED LOGIN SYNCHRONIZATION RPC
-- fn_record_user_login()
-- Strictly uses auth.uid() from authenticated session.
-- Updates last_login_at = NOW() and updated_at = NOW().
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_record_user_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_user_id UUID;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Security assertion: Fail-closed if unauthenticated
    IF v_auth_uid IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '42501',
            'error', 'UNAUTHENTICATED: Valid Supabase session required to record login timestamp'
        );
    END IF;

    -- 2. Target exact matching public.users row
    UPDATE public.users
    SET last_login_at = v_now,
        updated_at = v_now
    WHERE auth_user_id = v_auth_uid
    RETURNING id INTO v_user_id;

    -- 3. Fallback: Reconcile/provision canonical user if auth_user_id linkage is pending
    IF v_user_id IS NULL THEN
        v_user_id := public.fn_get_or_create_current_app_user();

        IF v_user_id IS NOT NULL THEN
            UPDATE public.users
            SET last_login_at = v_now,
                updated_at = v_now
            WHERE id = v_user_id;
        END IF;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', 'P0001',
            'error', 'IDENTITY_NOT_FOUND: Could not resolve canonical application user for auth.uid()'
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'userId', v_user_id,
        'authUserId', v_auth_uid,
        'lastLoginAt', v_now
    );
END;
$function$;

-- Alias procedure for direct PostgREST RPC call compatibility
CREATE OR REPLACE FUNCTION public.record_user_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
    RETURN public.fn_record_user_login();
END;
$function$;

-- Grant execute permissions to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.fn_record_user_login() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_user_login() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_record_user_login() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.record_user_login() TO authenticated, service_role, anon;

COMMENT ON FUNCTION public.fn_record_user_login() IS 'Centralized, security-definer login timestamp synchronizer for ZEGA AI authenticated users';

COMMIT;
