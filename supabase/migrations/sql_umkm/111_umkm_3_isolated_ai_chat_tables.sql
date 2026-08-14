-- Migration: 111_umkm_3_isolated_ai_chat_tables.sql
-- Purpose: Complete Isolation of Chat History Tables for:
--   1. AI Assistant (Home Dashboard): umkm_ai_assistant_chats & umkm_ai_assistant_messages
--   2. ZEGA Copilot (Floating Drawer): umkm_zega_copilot_chats & umkm_zega_copilot_messages
--   3. Live Chat with AI (Help View): umkm_live_help_chats & umkm_live_help_messages

-- ============================================================================
-- 1. MODULE 1: HOME DASHBOARD AI ASSISTANT TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.umkm_ai_assistant_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  title TEXT NOT NULL DEFAULT 'Sesi AI Assistant Utama',
  agent_role TEXT DEFAULT 'ZEGA Ops Specialist',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_ai_assistant_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.umkm_ai_assistant_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'system', 'assistant')),
  text TEXT NOT NULL,
  inference_ms INT DEFAULT 185,
  tokens INT DEFAULT 94,
  security_status TEXT DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. MODULE 2: ZEGA COPILOT TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.umkm_zega_copilot_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  title TEXT NOT NULL DEFAULT 'Diskusi ZEGA Copilot AI',
  copilot_type TEXT DEFAULT 'zega_copilot',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_zega_copilot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.umkm_zega_copilot_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system', 'ai')),
  sender_name TEXT DEFAULT 'ZEGA Copilot AI',
  message TEXT NOT NULL,
  model_engine TEXT DEFAULT '9Router-Llama-3.3-70B',
  tokens_used INT DEFAULT 94,
  latency_ms INT DEFAULT 185,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward Compatibility View for umkm_copilot_chats & umkm_copilot_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'umkm_copilot_chats') THEN
    CREATE VIEW public.umkm_copilot_chats AS SELECT * FROM public.umkm_zega_copilot_chats;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'umkm_copilot_messages') THEN
    CREATE VIEW public.umkm_copilot_messages AS SELECT * FROM public.umkm_zega_copilot_messages;
  END IF;
END $$;

-- ============================================================================
-- 3. MODULE 3: HELP PAGE LIVE CHAT WITH AI TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.umkm_live_help_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  title TEXT NOT NULL DEFAULT 'Percakapan Live Chat Support',
  agent_role TEXT DEFAULT 'ZEGA AI Specialist Direct',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_live_help_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.umkm_live_help_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'system', 'assistant')),
  text TEXT NOT NULL,
  inference_ms INT DEFAULT 185,
  tokens INT DEFAULT 94,
  security_status TEXT DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward Compatibility View for umkm_help_live_chats & umkm_help_live_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'umkm_help_live_chats') THEN
    CREATE VIEW public.umkm_help_live_chats AS SELECT * FROM public.umkm_live_help_chats;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'umkm_help_live_messages') THEN
    CREATE VIEW public.umkm_help_live_messages AS SELECT * FROM public.umkm_live_help_messages;
  END IF;
END $$;

-- ============================================================================
-- 4. AUTO-TOUCH TRIGGERS FOR ALL 3 ISOLATED CHAT MODULES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.touch_umkm_isolated_chat_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'umkm_ai_assistant_messages' THEN
    UPDATE public.umkm_ai_assistant_chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  ELSIF TG_TABLE_NAME = 'umkm_zega_copilot_messages' OR TG_TABLE_NAME = 'umkm_copilot_messages' THEN
    UPDATE public.umkm_zega_copilot_chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  ELSIF TG_TABLE_NAME = 'umkm_live_help_messages' OR TG_TABLE_NAME = 'umkm_help_live_messages' THEN
    UPDATE public.umkm_live_help_chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_umkm_ai_assistant_chat_updated_at ON public.umkm_ai_assistant_messages;
CREATE TRIGGER trg_touch_umkm_ai_assistant_chat_updated_at
AFTER INSERT ON public.umkm_ai_assistant_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_umkm_isolated_chat_session_updated_at();

DROP TRIGGER IF EXISTS trg_touch_umkm_zega_copilot_chat_updated_at ON public.umkm_zega_copilot_messages;
CREATE TRIGGER trg_touch_umkm_zega_copilot_chat_updated_at
AFTER INSERT ON public.umkm_zega_copilot_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_umkm_isolated_chat_session_updated_at();

DROP TRIGGER IF EXISTS trg_touch_umkm_live_help_chat_updated_at ON public.umkm_live_help_messages;
CREATE TRIGGER trg_touch_umkm_live_help_chat_updated_at
AFTER INSERT ON public.umkm_live_help_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_umkm_isolated_chat_session_updated_at();

-- ============================================================================
-- 5. RPC FUNCTION FOR MULTI-MODULE RECENT CHAT HISTORY (ISOLATED UNION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_umkm_recent_chat_history(p_user_id TEXT, p_chat_type TEXT DEFAULT 'all')
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  title TEXT,
  last_message TEXT,
  last_sender TEXT,
  message_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH combined_chats AS (
    -- 1. AI Assistant Sessions (Home Dashboard)
    SELECT 
      c.id AS chat_id,
      'ai_assistant'::TEXT AS chat_type,
      c.title,
      c.created_at,
      c.updated_at
    FROM public.umkm_ai_assistant_chats c
    WHERE c.user_id = p_user_id 
      AND (p_chat_type = 'all' OR p_chat_type = 'ai_assistant' OR p_chat_type = 'ops_specialist')
      AND (SELECT COUNT(*) FROM public.umkm_ai_assistant_messages m WHERE m.chat_id = c.id AND m.sender = 'user') > 0

    UNION ALL

    -- 2. ZEGA Copilot Sessions (Floating Robot Drawer)
    SELECT 
      cc.id AS chat_id,
      'copilot'::TEXT AS chat_type,
      cc.title,
      cc.created_at,
      cc.updated_at
    FROM public.umkm_zega_copilot_chats cc
    WHERE cc.user_id = p_user_id 
      AND (p_chat_type = 'all' OR p_chat_type = 'copilot' OR p_chat_type = 'zega_copilot')
      AND (SELECT COUNT(*) FROM public.umkm_zega_copilot_messages cm WHERE cm.chat_id = cc.id AND cm.sender = 'user') > 0

    UNION ALL

    -- 3. Live Help Sessions (Help Page Direct Chat)
    SELECT 
      hc.id AS chat_id,
      'live_help'::TEXT AS chat_type,
      hc.title,
      hc.created_at,
      hc.updated_at
    FROM public.umkm_live_help_chats hc
    WHERE hc.user_id = p_user_id 
      AND (p_chat_type = 'all' OR p_chat_type = 'live_help' OR p_chat_type = 'help')
      AND (SELECT COUNT(*) FROM public.umkm_live_help_messages lm WHERE lm.chat_id = hc.id AND lm.sender = 'user') > 0
  )
  SELECT 
    ch.chat_id,
    ch.chat_type,
    ch.title,
    COALESCE(
      CASE 
        WHEN ch.chat_type = 'ai_assistant' THEN (
          SELECT m.text FROM public.umkm_ai_assistant_messages m WHERE m.chat_id = ch.chat_id ORDER BY m.created_at DESC LIMIT 1
        )
        WHEN ch.chat_type = 'copilot' THEN (
          SELECT cm.message FROM public.umkm_zega_copilot_messages cm WHERE cm.chat_id = ch.chat_id ORDER BY cm.created_at DESC LIMIT 1
        )
        ELSE (
          SELECT lm.text FROM public.umkm_live_help_messages lm WHERE lm.chat_id = ch.chat_id ORDER BY lm.created_at DESC LIMIT 1
        )
      END,
      'Pesan kosong'
    ) AS last_message,
    COALESCE(
      CASE 
        WHEN ch.chat_type = 'ai_assistant' THEN (
          SELECT m.sender FROM public.umkm_ai_assistant_messages m WHERE m.chat_id = ch.chat_id ORDER BY m.created_at DESC LIMIT 1
        )
        WHEN ch.chat_type = 'copilot' THEN (
          SELECT cm.sender FROM public.umkm_zega_copilot_messages cm WHERE cm.chat_id = ch.chat_id ORDER BY cm.created_at DESC LIMIT 1
        )
        ELSE (
          SELECT lm.sender FROM public.umkm_live_help_messages lm WHERE lm.chat_id = ch.chat_id ORDER BY lm.created_at DESC LIMIT 1
        )
      END,
      'system'
    ) AS last_sender,
    CASE 
      WHEN ch.chat_type = 'ai_assistant' THEN (
        SELECT COUNT(*) FROM public.umkm_ai_assistant_messages m WHERE m.chat_id = ch.chat_id
      )
      WHEN ch.chat_type = 'copilot' THEN (
        SELECT COUNT(*) FROM public.umkm_zega_copilot_messages cm WHERE cm.chat_id = ch.chat_id
      )
      ELSE (
        SELECT COUNT(*) FROM public.umkm_live_help_messages lm WHERE lm.chat_id = ch.chat_id
      )
    END AS message_count,
    ch.created_at,
    ch.updated_at
  FROM combined_chats ch
  ORDER BY ch.updated_at DESC;
END;
$$;

-- ============================================================================
-- 6. RLS SECURITY POLICIES FOR ALL 3 MODULES
-- ============================================================================
ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_zega_copilot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_zega_copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_live_help_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_live_help_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_assistant_chats_all') THEN
    CREATE POLICY "ai_assistant_chats_all" ON public.umkm_ai_assistant_chats FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_assistant_messages_all') THEN
    CREATE POLICY "ai_assistant_messages_all" ON public.umkm_ai_assistant_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'zega_copilot_chats_all') THEN
    CREATE POLICY "zega_copilot_chats_all" ON public.umkm_zega_copilot_chats FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'zega_copilot_messages_all') THEN
    CREATE POLICY "zega_copilot_messages_all" ON public.umkm_zega_copilot_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'live_help_chats_all') THEN
    CREATE POLICY "live_help_chats_all" ON public.umkm_live_help_chats FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'live_help_messages_all') THEN
    CREATE POLICY "live_help_messages_all" ON public.umkm_live_help_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 7. ADD TO SUPABASE REALTIME PUBLICATION
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_assistant_chats;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_assistant_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_zega_copilot_chats;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_zega_copilot_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_live_help_chats;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_live_help_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add tables to supabase_realtime publication';
END $$;
