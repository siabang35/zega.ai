-- ============================================================================
-- ZEGA AI
-- Migration:
-- 20260819010000_fix_auth_user_identity_reconciliation.sql
--
-- PURPOSE
--   Canonical identity reconciliation between:
--
--     auth.users.id
--          ↓
--     public.users.auth_user_id
--          ↓
--     public.users.id
--
--   Supports:
--     - Google / Gmail OAuth
--     - GitHub OAuth
--     - Email/password
--     - Existing legacy users
--     - New users
--
-- SECURITY:
--   - Fail closed on ambiguity
--   - Never trust client user_id
--   - Never authorize by email
--   - Never replace existing public.users.id
--   - Never silently merge accounts
--   - Never weaken RLS
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. UNIQUE IDENTITY MAPPING
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS
    ux_public_users_auth_user_id
ON public.users (auth_user_id)
WHERE auth_user_id IS NOT NULL;


-- ============================================================================
-- 2. FAST LOOKUP INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS
    ix_public_users_auth_user_id
ON public.users (auth_user_id)
WHERE auth_user_id IS NOT NULL;


-- ============================================================================
-- 3. CANONICAL IDENTITY RESOLVER / PROVISIONER
--
-- IMPORTANT:
--   This function MUST be called only inside an authenticated Supabase
--   request where auth.uid() is available.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_resolve_current_app_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID;
    v_app_user_id UUID;

    v_auth_email TEXT;
    v_auth_email_normalized TEXT;

    v_existing_count INTEGER;
    v_existing_user_id UUID;

    v_full_name TEXT;

    v_provider TEXT;
BEGIN

    -- ========================================================================
    -- A. AUTHENTICATION MUST EXIST
    -- ========================================================================

    v_auth_uid := auth.uid();

    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'AUTH_REQUIRED: Supabase authentication context unavailable';
    END IF;


    -- ========================================================================
    -- B. FAST PATH
    --
    -- Existing canonical mapping:
    --
    -- auth.users.id
    --      ↓
    -- public.users.auth_user_id
    -- ========================================================================

    SELECT u.id
    INTO v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid
    LIMIT 1;

    IF v_app_user_id IS NOT NULL THEN
        RETURN v_app_user_id;
    END IF;


    -- ========================================================================
    -- C. READ AUTH USER
    -- ========================================================================

    SELECT
        au.email,
        COALESCE(
            au.raw_user_meta_data ->> 'full_name',
            au.raw_user_meta_data ->> 'name',
            au.raw_user_meta_data ->> 'user_name'
        )
    INTO
        v_auth_email,
        v_full_name
    FROM auth.users AS au
    WHERE au.id = v_auth_uid
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'AUTH_USER_NOT_FOUND';
    END IF;


    -- ========================================================================
    -- D. NORMALIZE EMAIL ONLY FOR SAFE RECONCILIATION
    --
    -- EMAIL IS NOT USED FOR AUTHORIZATION.
    --
    -- It is used ONLY to determine whether an existing legacy application
    -- user can be deterministically linked to this authenticated identity.
    -- ========================================================================

    v_auth_email_normalized :=
        NULLIF(
            lower(trim(v_auth_email)),
            ''
        );


    -- ========================================================================
    -- E. PROVIDER FORENSICS
    --
    -- Provider information is diagnostic only.
    -- It is NOT used as application identity.
    -- ========================================================================

    SELECT
        COALESCE(
            ai.provider,
            'unknown'
        )
    INTO
        v_provider
    FROM auth.identities AS ai
    WHERE ai.user_id = v_auth_uid
    ORDER BY ai.created_at ASC
    LIMIT 1;


    -- ========================================================================
    -- F. EXISTING LEGACY USER RECONCILIATION
    --
    -- Only consider:
    --
    --   auth_user_id IS NULL
    --   exact normalized email match
    --
    -- If more than one candidate exists:
    -- FAIL CLOSED.
    --
    -- NEVER guess.
    -- ========================================================================

    IF v_auth_email_normalized IS NOT NULL THEN

        SELECT COUNT(*)
        INTO v_existing_count
        FROM public.users AS u
        WHERE u.auth_user_id IS NULL
          AND lower(trim(u.email)) = v_auth_email_normalized;

        IF v_existing_count > 1 THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = format(
                    'IDENTITY_LINK_CONFLICT: multiple legacy users match authenticated email for provider %s',
                    COALESCE(v_provider, 'unknown')
                );
        END IF;


        -- ====================================================================
        -- EXACTLY ONE LEGACY USER
        -- ====================================================================

        IF v_existing_count = 1 THEN

            SELECT u.id
            INTO v_existing_user_id
            FROM public.users AS u
            WHERE u.auth_user_id IS NULL
              AND lower(trim(u.email)) = v_auth_email_normalized
            LIMIT 1;


            -- ================================================================
            -- ATOMIC IDENTITY LINK
            -- ================================================================

            UPDATE public.users
            SET
                auth_user_id = v_auth_uid,
                updated_at = now()
            WHERE id = v_existing_user_id
              AND auth_user_id IS NULL
            RETURNING id
            INTO v_app_user_id;


            -- ================================================================
            -- CONCURRENT REQUEST PROTECTION
            -- ================================================================

            IF v_app_user_id IS NOT NULL THEN
                RETURN v_app_user_id;
            END IF;


            -- Another concurrent request may have linked it.
            SELECT u.id
            INTO v_app_user_id
            FROM public.users AS u
            WHERE u.auth_user_id = v_auth_uid
            LIMIT 1;

            IF v_app_user_id IS NOT NULL THEN
                RETURN v_app_user_id;
            END IF;

            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'IDENTITY_LINK_FAILED';
        END IF;

    END IF;


    -- ========================================================================
    -- G. NO EXISTING USER
    --
    -- Create a brand-new application user.
    -- ========================================================================

    INSERT INTO public.users (
        id,
        auth_user_id,
        email,
        full_name,
        role,
        audience_segment,
        billing_plan,
        credits_balance,
        is_verified,
        status,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_auth_uid,
        v_auth_email,
        COALESCE(
            NULLIF(trim(v_full_name), ''),
            'ZEGA User'
        ),
        'individual',
        'individual',
        'starter',
        1000.00,
        true,
        'active',
        now(),
        now()
    )
    ON CONFLICT (auth_user_id)
    DO NOTHING
    RETURNING id
    INTO v_app_user_id;


    -- ========================================================================
    -- H. CONCURRENT INSERT SAFETY
    -- ========================================================================

    IF v_app_user_id IS NULL THEN

        SELECT u.id
        INTO v_app_user_id
        FROM public.users AS u
        WHERE u.auth_user_id = v_auth_uid
        LIMIT 1;

    END IF;


    -- ========================================================================
    -- I. FINAL FAIL-CLOSED CHECK
    -- ========================================================================

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'CANONICAL_USER_PROVISIONING_FAILED';
    END IF;


    RETURN v_app_user_id;

END;
$function$;


-- ============================================================================
-- 4. LOCK DOWN FUNCTION
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.fn_resolve_current_app_user()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_resolve_current_app_user()
TO authenticated, service_role;


-- ============================================================================
-- 5. REPLACE CURRENT USER RESOLVER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID;
    v_app_user_id UUID;
BEGIN

    v_auth_uid := auth.uid();

    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;


    -- ========================================================================
    -- PRIMARY CANONICAL MAPPING
    -- ========================================================================

    SELECT u.id
    INTO v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid
    LIMIT 1;

    IF v_app_user_id IS NOT NULL THEN
        RETURN v_app_user_id;
    END IF;


    -- ========================================================================
    -- RECONCILE / PROVISION
    -- ========================================================================

    RETURN public.fn_resolve_current_app_user();

END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.fn_current_app_user_id()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_current_app_user_id()
TO authenticated, service_role;


-- ============================================================================
-- 6. COMMENT
-- ============================================================================

COMMENT ON FUNCTION public.fn_resolve_current_app_user()
IS
'Canonical authenticated identity resolver. Maps auth.users.id to public.users.auth_user_id and returns public.users.id. Safely reconciles deterministic legacy users or creates a new application user. Fails closed on ambiguity and never authorizes by email.';

COMMENT ON FUNCTION public.fn_current_app_user_id()
IS
'Returns canonical public.users.id for the authenticated Supabase user. Never falls back to auth.uid() as an application identity.';


COMMIT;