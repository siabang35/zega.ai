-- =====================================================================
-- ZEGA AI — Production Security Hardening Migration
-- Migration ID: 20260810000000_production_security_rls_hardening
-- Purpose: Remediate insecure USING (true) RLS policies with tenant-aware
--          and user-scoped row-level security constraints.
-- =====================================================================

-- 1. Hardening public.agents RLS
ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public agents read policy" ON public.agents;
DROP POLICY IF EXISTS "Public agents insert policy" ON public.agents;
DROP POLICY IF EXISTS "Public agents full access" ON public.agents;
DROP POLICY IF EXISTS "Tenant-aware agents select policy" ON public.agents;
DROP POLICY IF EXISTS "Tenant-aware agents insert policy" ON public.agents;
DROP POLICY IF EXISTS "Tenant-aware agents update policy" ON public.agents;

CREATE POLICY "Tenant-aware agents select policy"
  ON public.agents
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.uid()::text
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Tenant-aware agents insert policy"
  ON public.agents
  FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Tenant-aware agents update policy"
  ON public.agents
  FOR UPDATE
  USING (
    user_id::text = auth.uid()::text OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id::text = auth.uid()::text
    ) OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 2. Hardening public.zeroclaw_solana_settlements RLS
ALTER TABLE IF EXISTS public.zeroclaw_solana_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public zeroclaw_settlements full access" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Tenant-aware zeroclaw_settlements select policy" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Service-role zeroclaw_settlements insert policy" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Tenant-aware zeroclaw_solana_settlements select policy" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Service-role zeroclaw_solana_settlements insert policy" ON public.zeroclaw_solana_settlements;

CREATE POLICY "Tenant-aware zeroclaw_solana_settlements select policy"
  ON public.zeroclaw_solana_settlements
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service-role zeroclaw_solana_settlements insert policy"
  ON public.zeroclaw_solana_settlements
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR
    user_id::text = auth.uid()::text
  );

-- 3. Hardening public.security_audit_logs RLS (Append-Only & Service-Role Readable)
ALTER TABLE IF EXISTS public.security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public security_audit_logs full access" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Security audit logs viewable by owner or service role" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Security audit logs append only" ON public.security_audit_logs;

CREATE POLICY "Security audit logs viewable by owner or service role"
  ON public.security_audit_logs
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Security audit logs append only"
  ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 4. Hardening public.zeroclaw_invoices RLS
ALTER TABLE IF EXISTS public.zeroclaw_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public zeroclaw_invoices full access" ON public.zeroclaw_invoices;
DROP POLICY IF EXISTS "Tenant-aware zeroclaw_invoices select policy" ON public.zeroclaw_invoices;
DROP POLICY IF EXISTS "Tenant-aware zeroclaw_invoices insert policy" ON public.zeroclaw_invoices;

CREATE POLICY "Tenant-aware zeroclaw_invoices select policy"
  ON public.zeroclaw_invoices
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Tenant-aware zeroclaw_invoices insert policy"
  ON public.zeroclaw_invoices
  FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- 5. Hardening public.privy_r2_audit_certificates RLS
ALTER TABLE IF EXISTS public.privy_r2_audit_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public privy_r2_audit_certificates full access" ON public.privy_r2_audit_certificates;
DROP POLICY IF EXISTS "Users and service can select privy r2 audit certificates" ON public.privy_r2_audit_certificates;
DROP POLICY IF EXISTS "Service role can insert privy r2 audit certificates" ON public.privy_r2_audit_certificates;
DROP POLICY IF EXISTS "Privy R2 certificates select policy" ON public.privy_r2_audit_certificates;

CREATE POLICY "Privy R2 certificates select policy"
  ON public.privy_r2_audit_certificates
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    auth.jwt() ->> 'role' = 'service_role'
  );
