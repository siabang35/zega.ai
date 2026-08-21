-- ============================================================================
-- ZEGA AI PLATFORM — AUTHENTICATED-ONLY EXECUTE PERMISSIONS FOR AI CHAT RPCS
-- Migration: 20260821040000_fix_ai_chat_rpc_anon_permissions.sql
--
-- PURPOSE:
--   1. Revoke EXECUTE ON ALL signatures of fn_resolve_or_create_ai_chat from anon and PUBLIC.
--   2. Grant EXECUTE ON ALL signatures of fn_resolve_or_create_ai_chat strictly to authenticated and service_role.
--   3. Apply same authenticated-only EXECUTE rules for fn_save_ai_assistant_message & fn_save_zega_copilot_message.
--   4. Force PostgREST schema cache reload (NOTIFY pgrst, 'reload schema').
-- ============================================================================

BEGIN;

-- 1. fn_resolve_or_create_ai_chat (All overloaded signatures)
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
            'REVOKE EXECUTE ON FUNCTION public.fn_resolve_or_create_ai_chat(%s) FROM anon, PUBLIC',
            r.fn_signature
        );

        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.fn_resolve_or_create_ai_chat(%s) TO authenticated, service_role',
            r.fn_signature
        );
    END LOOP;
END
$$;

-- 2. fn_save_ai_assistant_message (All overloaded signatures)
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
          AND p.proname = 'fn_save_ai_assistant_message'
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(%s) FROM anon, PUBLIC',
            r.fn_signature
        );

        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(%s) TO authenticated, service_role',
            r.fn_signature
        );
    END LOOP;
END
$$;

-- 3. fn_save_zega_copilot_message (All overloaded signatures)
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
          AND p.proname = 'fn_save_zega_copilot_message'
    LOOP
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.fn_save_zega_copilot_message(%s) FROM anon, PUBLIC',
            r.fn_signature
        );

        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.fn_save_zega_copilot_message(%s) TO authenticated, service_role',
            r.fn_signature
        );
    END LOOP;
END
$$;

-- 4. Helper & tenant functions (Authenticated & service_role)
GRANT EXECUTE ON FUNCTION public.fn_current_app_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_get_or_create_current_app_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) TO authenticated, service_role;

-- 5. Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';

COMMIT;
