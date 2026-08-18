-- ============================================================================
-- ZEGA AI
-- Migration:
-- 20260818200000_fix_min_uuid_aggregate_and_finance_ai.sql
--
-- PURPOSE
--   Fix "function min(uuid) does not exist" error in PostgreSQL by casting
--   u.id to text before applying MIN() aggregate in public.fn_current_app_user_id().
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID;
    v_app_user_id UUID;
    v_match_count INTEGER;
BEGIN

    v_auth_uid := auth.uid();

    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    /*
     * Canonical mapping:
     * auth.users.id -> public.users.auth_user_id -> public.users.id
     * Note: Cast u.id to text for MIN() aggregate to prevent PostgreSQL error "function min(uuid) does not exist".
     */
    SELECT
        COUNT(*)::INTEGER,
        MIN(u.id::text)::uuid
    INTO
        v_match_count,
        v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid;

    /*
     * Exactly one mapping is required.
     * 0  -> unresolved
     * >1 -> ambiguous / corrupted
     * 1  -> valid
     */
    IF v_match_count = 1 THEN
        RETURN v_app_user_id;
    END IF;

    RETURN NULL;

END;
$function$;

REVOKE EXECUTE
ON FUNCTION public.fn_current_app_user_id()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_current_app_user_id()
TO authenticated, service_role;

COMMIT;
