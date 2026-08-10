-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — Supabase Linter (0011_function_search_path_mutable) Security Hardening
-- Migration: 20260810090000_fix_all_function_search_path_mutable.sql
--
-- Objective:
-- Fix all "Function Search Path Mutable" (WARN 0011) linter warnings in Supabase.
-- Ensures every stored function in schema `public` explicitly sets an immutable
-- search_path (`SET search_path = public, extensions, pg_temp`), preventing schema
-- shadowing / search_path manipulation security vulnerabilities.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. DYNAMIC PL/PGSQL BLOCK: HARDEN ALL EXISTING & NEW FUNCTIONS IN PUBLIC SCHEMA
DO $$
DECLARE
    r RECORD;
    v_sql TEXT;
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
          AND p.prokind IN ('f', 'p') -- functions and procedures
          AND (
            p.proconfig IS NULL
            OR NOT EXISTS (
                SELECT 1
                FROM unnest(p.proconfig) s
                WHERE s LIKE 'search_path=%'
            )
          )
    LOOP
        v_sql := format(
            'ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions, pg_temp;',
            r.schema_name,
            r.function_name,
            r.args
        );
        BEGIN
            EXECUTE v_sql;
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- In case function is overloaded or has procedure specifics
            BEGIN
                v_sql := format(
                    'ALTER ROUTINE %I.%I(%s) SET search_path = public, extensions, pg_temp;',
                    r.schema_name,
                    r.function_name,
                    r.args
                );
                EXECUTE v_sql;
                v_count := v_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Could not alter search_path for %.%(%): %', r.schema_name, r.function_name, r.args, SQLERRM;
            END;
        END;
    END LOOP;

    RAISE NOTICE 'ZEGA AI Security Audit: Applied immutable search_path to % functions in public schema.', v_count;
END;
$$;

-- 2. VERIFICATION QUERY (For manual audit/check in Supabase SQL Editor)
-- SELECT
--     n.nspname AS schema_name,
--     p.proname AS function_name,
--     p.proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND (
--     p.proconfig IS NULL
--     OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) s WHERE s LIKE 'search_path=%')
--   );
