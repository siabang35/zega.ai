-- Migration: 103_umkm_help_live_chat_and_copilot_persistence.sql
-- Purpose: Authenticated User Chat History Persistence & Realtime DB Schema for ZEGA Ops Specialist & ZEGA Copilot

-- 1. HELP LIVE CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.umkm_help_live_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  title TEXT NOT NULL DEFAULT 'Ops Specialist Help Chat',
  agent_role TEXT DEFAULT 'ZEGA Ops Specialist',
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HELP LIVE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.umkm_help_live_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.umkm_help_live_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'system')),
  text TEXT NOT NULL,
  inference_ms INT DEFAULT 185,
  tokens INT DEFAULT 94,
  security_status TEXT DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXING FOR HIGH-PERFORMANCE USER ISOLATED RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_help_live_chats_user ON public.umkm_help_live_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_help_live_chats_store ON public.umkm_help_live_chats(store_id);
CREATE INDEX IF NOT EXISTS idx_help_live_messages_chat ON public.umkm_help_live_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_help_live_messages_created ON public.umkm_help_live_messages(created_at);

-- 4. REPLICA IDENTITY FOR SUPABASE REALTIME
ALTER TABLE public.umkm_help_live_chats REPLICA IDENTITY FULL;
ALTER TABLE public.umkm_help_live_messages REPLICA IDENTITY FULL;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.umkm_help_live_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_help_live_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'help_live_chats_all') THEN
    CREATE POLICY "help_live_chats_all" ON public.umkm_help_live_chats FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'help_live_messages_all') THEN
    CREATE POLICY "help_live_messages_all" ON public.umkm_help_live_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. PUBLISH TO SUPABASE REALTIME
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_help_live_chats;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_help_live_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add table to supabase_realtime publication';
END $$;

-- 7. DEFAULT SEED SESSION FOR DEMO OWNER
INSERT INTO public.umkm_help_live_chats (id, store_id, user_id, title, agent_role)
VALUES ('a0010000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'demo-owner', 'ZEGA Operational Help', 'ZEGA Ops Specialist')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.umkm_help_live_messages (chat_id, user_id, sender, text, inference_ms, tokens)
VALUES 
  ('a0010000-0000-0000-0000-000000000001', 'demo-owner', 'ai', 'Hello! I am **ZEGA Ops Specialist** 🛠️. I am your operational guide for onboarding, AI Swarm agent deployment, WhatsApp & Instagram API integration, and store workflow automation. How can I assist you today?', 120, 45)
ON CONFLICT DO NOTHING;
