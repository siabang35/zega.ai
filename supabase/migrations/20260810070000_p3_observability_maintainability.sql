-- ═══════════════════════════════════════════════════════════════════════
-- ZEGA AI — P3 Observability & Maintainability Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- Addresses:
--   F-019: System & RPC Health Telemetry Metrics Persistence
--
-- All operations are IDEMPOTENT and SAFE for zero-downtime deployment.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.health_telemetry_logs (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  node_id                TEXT          NOT NULL DEFAULT 'api-node-1',
  memory_rss_mb          NUMERIC(10,2) NOT NULL DEFAULT 0,
  memory_heap_used_mb    NUMERIC(10,2) NOT NULL DEFAULT 0,
  rpc_pool_healthy_count INT           NOT NULL DEFAULT 0,
  rpc_pool_cooldown_count INT          NOT NULL DEFAULT 0,
  db_pool_healthy        BOOLEAN       NOT NULL DEFAULT true,
  metrics_json           JSONB         NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.health_telemetry_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'telemetry_service_role_only' AND tablename = 'health_telemetry_logs'
  ) THEN
    EXECUTE 'CREATE POLICY telemetry_service_role_only ON public.health_telemetry_logs
      FOR ALL USING (false)'; -- Service-role access only
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.health_telemetry_logs(timestamp);

-- Cleanup function to prune telemetry logs older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_expired_telemetry_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM public.health_telemetry_logs WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$;

GRANT SELECT, INSERT, DELETE ON public.health_telemetry_logs TO service_role;
