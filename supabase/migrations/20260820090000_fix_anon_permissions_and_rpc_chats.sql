-- ============================================================================
-- ZEGA AI PLATFORM — Secure RPC Permissions for AI Chat
-- Migration: 20260820090000_fix_rpc_permissions_and_postgrest_cache.sql
--
-- PURPOSE:
--   1. Ensure canonical AI chat RPC is executable by authenticated callers.
--   2. Keep SECURITY DEFINER RPC inaccessible to anon.
--   3. Preserve strict multi-tenant authorization inside the RPC.
--   4. Ensure PostgREST can discover the RPC after deployment.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. fn_resolve_or_create_ai_chat
-- ============================================================================
--
-- IMPORTANT:
-- DO NOT grant EXECUTE to anon.
--
-- The RPC creates/resolves tenant-scoped chat state and therefore must not
-- become callable by an unauthenticated PostgREST role.
--
-- SECURITY DEFINER does NOT mean "safe for anon".
-- It means the function executes with the owner's privileges.
--
-- Therefore the function itself MUST enforce identity and tenant boundaries.
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.oid,
               pg_get_function_identity_arguments(p.oid) AS fn_signature
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'fn_resolve_or_create_ai_chat'
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fn_resolve_or_create_ai_chat(%s) FROM PUBLIC',
            r.fn_signature
        );

        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fn_resolve_or_create_ai_chat(%s) FROM anon',
            r.fn_signature
        );

        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.fn_resolve_or_create_ai_chat(%s) TO authenticated, service_role',
            r.fn_signature
        );
    END LOOP;
END
$$;


-- ============================================================================
-- 2. fn_save_ai_assistant_message
-- ============================================================================
--
-- Only grant EXECUTE if the exact function signature exists.
-- Do not use an ambiguous function-name-only GRANT.
-- ============================================================================

DO $$
DECLARE
    fn_oid oid;
    fn_signature text;
BEGIN
    SELECT p.oid,
           pg_get_function_identity_arguments(p.oid)
    INTO fn_oid, fn_signature
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_save_ai_assistant_message'
    LIMIT 1;

    IF fn_oid IS NOT NULL THEN

        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(%s) FROM PUBLIC',
            fn_signature
        );

        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(%s) FROM anon',
            fn_signature
        );

        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(%s) TO authenticated',
            fn_signature
        );

    END IF;
END
$$;


-- ============================================================================
-- 3. Verify SECURITY DEFINER
-- ============================================================================
--
-- Do not silently trust an RPC merely because it is SECURITY DEFINER.
-- SECURITY DEFINER functions must explicitly validate the caller.
--
-- This migration does not alter the function implementation because the
-- authorization logic must be reviewed separately.
-- ============================================================================


-- ============================================================================
-- 4. Reload PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';


COMMIT;