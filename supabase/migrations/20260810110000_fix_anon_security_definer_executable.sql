-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — Supabase Linter Hardening Migration
-- Migration: 20260810110000_fix_anon_security_definer_executable.sql
--
-- Objective:
-- Fix `anon_security_definer_function_executable` (WARN 0028):
-- Revoke execution rights on SECURITY DEFINER functions in schema `public`
-- from unauthenticated `anon` and `PUBLIC` roles, restricting execution
-- strictly to `authenticated` and `service_role`.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- PART 1: DEFAULT PRIVILEGES HARDENING FOR FUTURE FUNCTIONS
-- ───────────────────────────────────────────────────────────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ───────────────────────────────────────────────────────────────────────────────
-- PART 2: DYNAMIC PL/PGSQL BLOCK TO REVOKE EXECUTE FROM ANON & PUBLIC ON ALL SECURITY DEFINER FUNCTIONS
-- ───────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
    v_revoke_sql TEXT;
    v_grant_sql TEXT;
    v_count INT := 0;
BEGIN
    FOR r IN
        SELECT
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true -- SECURITY DEFINER
    LOOP
        -- Revoke EXECUTE from PUBLIC and anon
        v_revoke_sql := format(
            'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;',
            r.schema_name, r.function_name, r.args
        );
        -- Grant EXECUTE to authenticated and service_role
        v_grant_sql := format(
            'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role;',
            r.schema_name, r.function_name, r.args
        );

        BEGIN
            EXECUTE v_revoke_sql;
            EXECUTE v_grant_sql;
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not update privileges for function %I.%I: %', r.schema_name, r.function_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'ZEGA AI Security Audit: Revoked unauthenticated execution rights on % SECURITY DEFINER functions.', v_count;
END;
$$;
