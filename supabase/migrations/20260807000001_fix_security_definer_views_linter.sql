-- ============================================================================
-- ZEGA AI ENTERPRISE ORCHESTRATOR HUB: LINT 0010 SECURITY DEFINER VIEW FIX
-- MIGRATION: 20260807000001_fix_security_definer_views_linter.sql
-- DESCRIPTION: Remediates Supabase Database Linter LINT 0010 security errors by
--              recreating view_enterprise_api_log_stats_24h and
--              view_enterprise_system_log_stats_24h WITH (security_invoker = true).
-- REFERENCE: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
-- ============================================================================

-- 1. RECREATE view_enterprise_api_log_stats_24h WITH (security_invoker = true)
DROP VIEW IF EXISTS public.view_enterprise_api_log_stats_24h;

CREATE VIEW public.view_enterprise_api_log_stats_24h
WITH (security_invoker = true)
AS
SELECT
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE status >= 200 AND status < 300) AS success_requests,
  COUNT(*) FILTER (WHERE status >= 400) AS failed_requests,
  ROUND(AVG(response_time_ms), 2) AS avg_response_time_ms
FROM public.enterprise_api_logs
WHERE "time" >= NOW() - INTERVAL '24 hours';

-- Grant appropriate SELECT permissions to authenticated and service roles
GRANT SELECT ON public.view_enterprise_api_log_stats_24h TO authenticated, service_role, anon;

-- 2. RECREATE view_enterprise_system_log_stats_24h WITH (security_invoker = true)
DROP VIEW IF EXISTS public.view_enterprise_system_log_stats_24h;

CREATE VIEW public.view_enterprise_system_log_stats_24h
WITH (security_invoker = true)
AS
SELECT
  COUNT(*) AS total_logs,
  COUNT(*) FILTER (WHERE level = 'INFO') AS info_count,
  COUNT(*) FILTER (WHERE level = 'WARN') AS warn_count,
  COUNT(*) FILTER (WHERE level = 'ERROR') AS error_count,
  COUNT(*) FILTER (WHERE level = 'CRITICAL') AS critical_count
FROM public.enterprise_system_logs
WHERE "time" >= NOW() - INTERVAL '24 hours';

-- Grant appropriate SELECT permissions to authenticated and service roles
GRANT SELECT ON public.view_enterprise_system_log_stats_24h TO authenticated, service_role, anon;

-- 3. ENSURE IDEMPOTENT ALTER STATEMENTS IF VIEWS PRE-EXIST WITHOUT RECREATION
ALTER VIEW IF EXISTS public.view_enterprise_api_log_stats_24h SET (security_invoker = true);
ALTER VIEW IF EXISTS public.view_enterprise_system_log_stats_24h SET (security_invoker = true);
