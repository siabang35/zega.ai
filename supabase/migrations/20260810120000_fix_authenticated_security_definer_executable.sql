-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — Supabase Linter Hardening Migration
-- Migration: 20260810120000_fix_authenticated_security_definer_executable.sql
--
-- Objective:
-- Fix `authenticated_security_definer_function_executable` (WARN 0029):
-- 1. Switch user-facing application functions in schema `public` from `SECURITY DEFINER`
--    to `SECURITY INVOKER` so they run with caller privileges and enforce RLS policies.
-- 2. Restrict system, maintenance, and administrative functions in `public` strictly
--    to `service_role` by revoking `EXECUTE` from `authenticated` and `anon`.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    r RECORD;
    v_sql TEXT;
    v_invoker_count INT := 0;
    v_admin_count INT := 0;
BEGIN
    FOR r IN
        SELECT
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true -- SECURITY DEFINER functions in schema public
    LOOP
        -- Identify internal maintenance, cron, audit, or system-level functions
        IF r.function_name ILIKE 'cleanup_%'
           OR r.function_name ILIKE 'clean_%'
           OR r.function_name ILIKE 'audit_%'
           OR r.function_name ILIKE 'fn_cleanup_%'
           OR r.function_name ILIKE 'fn_auto_%'
           OR r.function_name ILIKE 'autofix_%'
        THEN
            -- Revoke execution from authenticated role, keeping execution strictly for service_role
            v_sql := format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated, PUBLIC, anon;', r.schema_name, r.function_name, r.args);
            BEGIN
                EXECUTE v_sql;
                v_admin_count := v_admin_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not revoke execute on admin function %I.%I: %', r.schema_name, r.function_name, SQLERRM;
            END;
        ELSE
            -- Convert user-facing RPC functions to SECURITY INVOKER to enforce RLS
            v_sql := format('ALTER FUNCTION %I.%I(%s) SECURITY INVOKER;', r.schema_name, r.function_name, r.args);
            BEGIN
                EXECUTE v_sql;
                v_invoker_count := v_invoker_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not switch function %I.%I to SECURITY INVOKER: %', r.schema_name, r.function_name, SQLERRM;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE 'ZEGA AI Security Audit: Converted % RPC functions to SECURITY INVOKER and restricted % admin functions strictly to service_role.', v_invoker_count, v_admin_count;
END;
$$;
