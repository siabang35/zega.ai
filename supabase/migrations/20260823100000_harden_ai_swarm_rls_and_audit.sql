-- ============================================================================
-- SQL MIGRATION: HARDEN AI SWARM RLS & ADD AUDIT LOGGING
-- ============================================================================
-- Migration: 20260823100000_harden_ai_swarm_rls_and_audit.sql
-- Purpose: Replace insecure USING(true) RLS with tenant-scoped policies
--          and add ai_swarm_audit_logs table for operational auditability.
-- ============================================================================

BEGIN;

-- ============================
-- 1. DROP INSECURE RLS POLICIES
-- ============================
DROP POLICY IF EXISTS "Allow select ai_swarms" ON public.ai_swarms;
DROP POLICY IF EXISTS "Allow insert/update ai_swarms" ON public.ai_swarms;
DROP POLICY IF EXISTS "Allow select ai_swarm_agents" ON public.ai_swarm_agents;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_agents" ON public.ai_swarm_agents;
DROP POLICY IF EXISTS "Allow select ai_swarm_skills" ON public.ai_swarm_skills;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_skills" ON public.ai_swarm_skills;
DROP POLICY IF EXISTS "Allow select ai_swarm_executions" ON public.ai_swarm_executions;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_executions" ON public.ai_swarm_executions;
DROP POLICY IF EXISTS "Allow select ai_swarm_execution_steps" ON public.ai_swarm_execution_steps;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_execution_steps" ON public.ai_swarm_execution_steps;

-- ============================
-- 2. TENANT-SCOPED RLS: ai_swarms
-- ============================
-- The backend uses service-role key for all queries (bypasses RLS),
-- so these policies act as defense-in-depth for direct client queries.
-- Users can only see/modify swarms belonging to their organization.

CREATE POLICY "swarm_select_tenant"
  ON public.ai_swarms FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "swarm_insert_tenant"
  ON public.ai_swarms FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "swarm_update_tenant"
  ON public.ai_swarms FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "swarm_delete_tenant"
  ON public.ai_swarms FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- ============================
-- 3. TENANT-SCOPED RLS: ai_swarm_agents
-- ============================
-- Access via parent swarm's tenant ownership.

CREATE POLICY "swarm_agents_select"
  ON public.ai_swarm_agents FOR SELECT TO authenticated
  USING (
    swarm_id IN (
      SELECT s.id FROM public.ai_swarms s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

CREATE POLICY "swarm_agents_insert"
  ON public.ai_swarm_agents FOR INSERT TO authenticated
  WITH CHECK (
    swarm_id IN (
      SELECT s.id FROM public.ai_swarms s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

CREATE POLICY "swarm_agents_update"
  ON public.ai_swarm_agents FOR UPDATE TO authenticated
  USING (
    swarm_id IN (
      SELECT s.id FROM public.ai_swarms s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

CREATE POLICY "swarm_agents_delete"
  ON public.ai_swarm_agents FOR DELETE TO authenticated
  USING (
    swarm_id IN (
      SELECT s.id FROM public.ai_swarms s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

-- ============================
-- 4. TENANT-SCOPED RLS: ai_swarm_skills
-- ============================

CREATE POLICY "swarm_skills_select"
  ON public.ai_swarm_skills FOR SELECT TO authenticated
  USING (
    agent_id IN (
      SELECT a.id FROM public.ai_swarm_agents a
      WHERE a.swarm_id IN (
        SELECT s.id FROM public.ai_swarms s
        WHERE s.organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "swarm_skills_insert"
  ON public.ai_swarm_skills FOR INSERT TO authenticated
  WITH CHECK (
    agent_id IN (
      SELECT a.id FROM public.ai_swarm_agents a
      WHERE a.swarm_id IN (
        SELECT s.id FROM public.ai_swarms s
        WHERE s.organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "swarm_skills_update"
  ON public.ai_swarm_skills FOR UPDATE TO authenticated
  USING (
    agent_id IN (
      SELECT a.id FROM public.ai_swarm_agents a
      WHERE a.swarm_id IN (
        SELECT s.id FROM public.ai_swarms s
        WHERE s.organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "swarm_skills_delete"
  ON public.ai_swarm_skills FOR DELETE TO authenticated
  USING (
    agent_id IN (
      SELECT a.id FROM public.ai_swarm_agents a
      WHERE a.swarm_id IN (
        SELECT s.id FROM public.ai_swarms s
        WHERE s.organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid() AND om.status = 'active'
        )
        OR s.user_id = auth.uid()
      )
    )
  );

-- ============================
-- 5. TENANT-SCOPED RLS: ai_swarm_executions
-- ============================

CREATE POLICY "swarm_executions_select"
  ON public.ai_swarm_executions FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "swarm_executions_insert"
  ON public.ai_swarm_executions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "swarm_executions_update"
  ON public.ai_swarm_executions FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- ============================
-- 6. TENANT-SCOPED RLS: ai_swarm_execution_steps
-- ============================

CREATE POLICY "swarm_exec_steps_select"
  ON public.ai_swarm_execution_steps FOR SELECT TO authenticated
  USING (
    execution_id IN (
      SELECT e.id FROM public.ai_swarm_executions e
      WHERE e.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR e.user_id = auth.uid()
    )
  );

CREATE POLICY "swarm_exec_steps_insert"
  ON public.ai_swarm_execution_steps FOR INSERT TO authenticated
  WITH CHECK (
    execution_id IN (
      SELECT e.id FROM public.ai_swarm_executions e
      WHERE e.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR e.user_id = auth.uid()
    )
  );

-- ============================
-- 7. CREATE AUDIT LOG TABLE
-- ============================

CREATE TABLE IF NOT EXISTS public.ai_swarm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  workspace_id UUID,
  store_id UUID,
  user_id UUID,
  swarm_id UUID,
  execution_id UUID,
  agent_id UUID,
  action TEXT NOT NULL,  -- SWARM_CREATED, SWARM_UPDATED, SWARM_EXECUTED, etc.
  result TEXT NOT NULL DEFAULT 'SUCCESS',  -- SUCCESS, DENIED, FAILED
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.ai_swarm_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_store ON public.ai_swarm_audit_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_swarm ON public.ai_swarm_audit_logs(swarm_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.ai_swarm_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.ai_swarm_audit_logs(created_at);

ALTER TABLE public.ai_swarm_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_tenant"
  ON public.ai_swarm_audit_logs FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.ai_swarm_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Grant to authenticated role
GRANT SELECT, INSERT ON public.ai_swarm_audit_logs TO authenticated;

COMMIT;
