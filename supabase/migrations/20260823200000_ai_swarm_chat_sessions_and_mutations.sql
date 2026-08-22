-- ============================================================================
-- SQL MIGRATION: AI SWARM PERSISTENT CHAT SESSIONS & MUTATION CONFIRMATIONS
-- ============================================================================
-- Migration: 20260823200000_ai_swarm_chat_sessions_and_mutations.sql
-- Purpose: Persistent chat sessions, message history, swarm memories,
--          and multi-tenant RLS isolation for AI Stock Swarms.
-- ============================================================================

BEGIN;

-- 1. Create public.ai_chat_sessions Table
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swarm_id UUID NOT NULL REFERENCES public.ai_swarms(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Stock Swarm Chat',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'ARCHIVED'
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create public.ai_chat_messages Table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    swarm_id UUID NOT NULL REFERENCES public.ai_swarms(id) ON DELETE CASCADE,
    organization_id UUID,
    store_id UUID,
    user_id UUID,
    sender_type TEXT NOT NULL, -- 'USER', 'SWARM', 'SYSTEM', 'AGENT'
    sender_name TEXT,
    content TEXT NOT NULL,
    structured_payload JSONB,
    agent_activity JSONB,
    requires_confirmation BOOLEAN NOT NULL DEFAULT false,
    pending_mutation JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create public.ai_swarm_memories Table
CREATE TABLE IF NOT EXISTS public.ai_swarm_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swarm_id UUID NOT NULL REFERENCES public.ai_swarms(id) ON DELETE CASCADE,
    organization_id UUID,
    store_id UUID,
    user_id UUID,
    memory_key TEXT NOT NULL,
    memory_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_swarm_memory_key UNIQUE (swarm_id, memory_key)
);

-- 4. Indexes for Multi-Tenant Lookup & Query Performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_swarm ON public.ai_chat_sessions(swarm_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_org ON public.ai_chat_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_store ON public.ai_chat_sessions(store_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON public.ai_chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON public.ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_swarm ON public.ai_chat_messages(swarm_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_org ON public.ai_chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created ON public.ai_chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_swarm_memories_swarm ON public.ai_swarm_memories(swarm_id);
CREATE INDEX IF NOT EXISTS idx_ai_swarm_memories_org ON public.ai_swarm_memories(organization_id);

-- 5. Enable Row Level Security
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_swarm_memories ENABLE ROW LEVEL SECURITY;

-- 6. Tenant-Scoped RLS Policies: ai_chat_sessions
CREATE POLICY "chat_sessions_select_tenant"
  ON public.ai_chat_sessions FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "chat_sessions_insert_tenant"
  ON public.ai_chat_sessions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "chat_sessions_update_tenant"
  ON public.ai_chat_sessions FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "chat_sessions_delete_tenant"
  ON public.ai_chat_sessions FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
    OR user_id = auth.uid()
  );

-- 7. Tenant-Scoped RLS Policies: ai_chat_messages
CREATE POLICY "chat_messages_select_tenant"
  ON public.ai_chat_messages FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM public.ai_chat_sessions s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert_tenant"
  ON public.ai_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM public.ai_chat_sessions s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_delete_tenant"
  ON public.ai_chat_messages FOR DELETE TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM public.ai_chat_sessions s
      WHERE s.organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.status = 'active'
      )
      OR s.user_id = auth.uid()
    )
  );

-- 8. Tenant-Scoped RLS Policies: ai_swarm_memories
CREATE POLICY "swarm_memories_select_tenant"
  ON public.ai_swarm_memories FOR SELECT TO authenticated
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

CREATE POLICY "swarm_memories_insert_tenant"
  ON public.ai_swarm_memories FOR INSERT TO authenticated
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

CREATE POLICY "swarm_memories_update_tenant"
  ON public.ai_swarm_memories FOR UPDATE TO authenticated
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

-- 9. Add Tables to Supabase Realtime Publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_sessions;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_messages;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

COMMIT;
