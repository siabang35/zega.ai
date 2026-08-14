-- ═══════════════════════════════════════════════════════════════════════
-- ZEGA AI — Foundation Engineering Hardening Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- This migration addresses the following audit findings:
--
-- F-ARCH-10: RLS policies are user-scoped, not org-scoped
--   → Adds organization-level RLS policies so org members can see
--     shared resources within their organization.
--
-- F-PERF-05: rate_limit_logs and security_audit_logs grow unbounded
--   → Adds automatic retention cleanup (90 days for audit, 30 days for rate limits).
--
-- F-PERF-03: Missing indexes on high-query columns
--   → Adds indexes for tenant-scoped lookups.
--
-- F-ARCH-12: No idempotency tracking for financial operations
--   → Adds idempotency_keys table for payment/settlement deduplication.
--
-- All changes are ADDITIVE (no data loss) and IDEMPOTENT (safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════
-- 1. ORG-SCOPED RLS POLICIES (F-ARCH-10)
-- ══════════════════════════════════════════════════════

-- Agents: Org members can view agents belonging to their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'agents_org_read' AND tablename = 'agents'
  ) THEN
    EXECUTE format(
      'CREATE POLICY agents_org_read ON public.agents FOR SELECT USING (
        organization_id IS NOT NULL
        AND organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid()
        )
      )');
  END IF;
END
$$;

-- Workflows: Org members can view workflows in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'workflows_org_read' AND tablename = 'workflows'
  ) THEN
    EXECUTE format(
      'CREATE POLICY workflows_org_read ON public.workflows FOR SELECT USING (
        organization_id IS NOT NULL
        AND organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid()
        )
      )');
  END IF;
END
$$;

-- Integrations: Org members can view integrations in their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'integrations_org_read' AND tablename = 'integrations'
  ) THEN
    EXECUTE format(
      'CREATE POLICY integrations_org_read ON public.integrations FOR SELECT USING (
        organization_id IS NOT NULL
        AND organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid()
        )
      )');
  END IF;
END
$$;


-- ══════════════════════════════════════════════════════
-- 2. QUERY PERFORMANCE INDEXES (F-PERF-03)
-- ══════════════════════════════════════════════════════

-- Tenant-scoped lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_org_id ON public.agents(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org_id ON public.workflows(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);

-- Security log lookups (for audit trail queries)
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created ON public.rate_limit_logs(created_at);

-- ZeroClaw financial record lookups
CREATE INDEX IF NOT EXISTS idx_zeroclaw_invoices_user ON public.zeroclaw_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_invoices_ref ON public.zeroclaw_invoices(reference_key);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_invoices_status ON public.zeroclaw_invoices(status);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_ref ON public.zeroclaw_solana_settlements(reference_key);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_sig ON public.zeroclaw_solana_settlements(tx_signature);


-- ══════════════════════════════════════════════════════
-- 3. LOG RETENTION POLICIES (F-PERF-05)
-- ══════════════════════════════════════════════════════

-- Automated cleanup function for log tables
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Rate limit logs: retain 30 days
  DELETE FROM public.rate_limit_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Security audit logs: retain 90 days
  DELETE FROM public.security_audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  RAISE NOTICE 'Log cleanup completed at %', NOW();
END;
$$;

-- NOTE: Schedule this function via pg_cron or application-level cron:
-- SELECT cron.schedule('cleanup-logs', '0 3 * * *', 'SELECT public.cleanup_old_logs()');


-- ══════════════════════════════════════════════════════
-- 4. IDEMPOTENCY KEY TABLE (F-ARCH-12)
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key          TEXT        PRIMARY KEY,
  user_id      UUID        NOT NULL,
  operation    TEXT        NOT NULL,  -- 'payment_create', 'settlement_record', 'invoice_create'
  request_hash TEXT        NOT NULL,  -- SHA-256 of request body for collision detection
  response     JSONB,                 -- Cached response for replay
  status       TEXT        NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  CONSTRAINT idempotency_keys_status_check CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Auto-cleanup expired idempotency keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user ON public.idempotency_keys(user_id);

-- Enable RLS on idempotency_keys
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own idempotency keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'idempotency_keys_user_isolation' AND tablename = 'idempotency_keys'
  ) THEN
    EXECUTE format(
      'CREATE POLICY idempotency_keys_user_isolation ON public.idempotency_keys
       FOR ALL USING (user_id = auth.uid())
       WITH CHECK (user_id = auth.uid())');
  END IF;
END
$$;


-- ══════════════════════════════════════════════════════
-- 5. GRANT PERMISSIONS
-- ══════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE ON public.idempotency_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idempotency_keys TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs() TO service_role;
