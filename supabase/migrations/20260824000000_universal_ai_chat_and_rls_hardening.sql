-- ============================================================================
-- SQL MIGRATION: UNIVERSAL AI CHAT & RLS HARDENING
-- ============================================================================
-- Migration: 20260824000000_universal_ai_chat_and_rls_hardening.sql
-- Purpose:
--   1. Add capabilities column to ai_swarms for multi-domain routing
--   2. Make swarm_id nullable on ai_chat_sessions for universal chat sessions
--   3. Replace open USING(true) RLS policies on ai_swarms/agents/skills/executions
--      with strict tenant-scoped policies
-- ============================================================================

BEGIN;

-- 1. Add capabilities array column to ai_swarms (for capability-based routing)
ALTER TABLE public.ai_swarms
  ADD COLUMN IF NOT EXISTS capabilities TEXT[] NOT NULL DEFAULT '{}';

-- 2. Make swarm_id NULLABLE on ai_chat_sessions (universal sessions don't need a specific swarm)
ALTER TABLE public.ai_chat_sessions
  ALTER COLUMN swarm_id DROP NOT NULL;

-- 3. Make swarm_id NULLABLE on ai_chat_messages (universal messages are not swarm-specific)
ALTER TABLE public.ai_chat_messages
  ALTER COLUMN swarm_id DROP NOT NULL;

-- ============================================================================
-- 4. HARDEN RLS ON ai_swarms: Replace USING(true) with tenant-scoped policies
-- ============================================================================

-- Drop existing open policies
DROP POLICY IF EXISTS "Allow select ai_swarms" ON public.ai_swarms;
DROP POLICY IF EXISTS "Allow insert/update ai_swarms" ON public.ai_swarms;

-- Tenant-scoped SELECT
CREATE POLICY "ai_swarms_select_tenant"
  ON public.ai_swarms FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- Tenant-scoped INSERT
CREATE POLICY "ai_swarms_insert_tenant"
  ON public.ai_swarms FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- Tenant-scoped UPDATE
CREATE POLICY "ai_swarms_update_tenant"
  ON public.ai_swarms FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- Tenant-scoped DELETE
CREATE POLICY "ai_swarms_delete_tenant"
  ON public.ai_swarms FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- ============================================================================
-- 5. HARDEN RLS ON ai_swarm_agents: Via swarm ownership
-- ============================================================================

DROP POLICY IF EXISTS "Allow select ai_swarm_agents" ON public.ai_swarm_agents;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_agents" ON public.ai_swarm_agents;

CREATE POLICY "ai_swarm_agents_select_tenant"
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

CREATE POLICY "ai_swarm_agents_insert_tenant"
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

-- ============================================================================
-- 6. HARDEN RLS ON ai_swarm_skills: Via agent → swarm ownership
-- ============================================================================

DROP POLICY IF EXISTS "Allow select ai_swarm_skills" ON public.ai_swarm_skills;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_skills" ON public.ai_swarm_skills;

CREATE POLICY "ai_swarm_skills_select_tenant"
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

CREATE POLICY "ai_swarm_skills_insert_tenant"
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

-- ============================================================================
-- 7. HARDEN RLS ON ai_swarm_executions: Tenant-scoped by org_id/user_id
-- ============================================================================

DROP POLICY IF EXISTS "Allow select ai_swarm_executions" ON public.ai_swarm_executions;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_executions" ON public.ai_swarm_executions;

CREATE POLICY "ai_swarm_executions_select_tenant"
  ON public.ai_swarm_executions FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "ai_swarm_executions_insert_tenant"
  ON public.ai_swarm_executions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- ============================================================================
-- 8. HARDEN RLS ON ai_swarm_execution_steps: Via execution ownership
-- ============================================================================

DROP POLICY IF EXISTS "Allow select ai_swarm_execution_steps" ON public.ai_swarm_execution_steps;
DROP POLICY IF EXISTS "Allow insert/update ai_swarm_execution_steps" ON public.ai_swarm_execution_steps;

CREATE POLICY "ai_swarm_exec_steps_select_tenant"
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

CREATE POLICY "ai_swarm_exec_steps_insert_tenant"
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

-- ============================================================================
-- 9. SERVICE ROLE BYPASS (for server-side orchestrator operations)
-- ============================================================================
-- The backend API uses the Supabase service_role key.
-- By default, service_role bypasses all RLS policies.
-- This ensures our Node.js orchestrator can still read/write swarm data
-- while individual users are restricted by tenant policies.

COMMIT;
