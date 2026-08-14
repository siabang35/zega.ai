-- Migration: 110_umkm_tier_based_chat_history_and_limits.sql
-- Purpose: Multi-Tenant Enterprise Tier Enforcement, Copilot Persistence, Recent Chat History RPC, and Auto-Touch Triggers

-- 1. CHAT TIER RULES CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.umkm_chat_tier_rules (
  tier_slug TEXT PRIMARY KEY,
  tier_name TEXT NOT NULL,
  max_active_sessions INT NOT NULL DEFAULT 10,
  max_messages_per_session INT NOT NULL DEFAULT 50,
  retention_days INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER SUBSCRIPTION TIER MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.umkm_user_subscription_tiers (
  user_id TEXT PRIMARY KEY,
  store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  tier_slug TEXT NOT NULL REFERENCES public.umkm_chat_tier_rules(tier_slug) DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COPILOT CHAT SESSIONS & MESSAGES TABLES
CREATE TABLE IF NOT EXISTS public.umkm_copilot_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  title TEXT NOT NULL DEFAULT 'Diskusi Utama ZEGA Copilot',
  copilot_type TEXT DEFAULT 'zega_copilot',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_copilot_chats ADD COLUMN IF NOT EXISTS copilot_type TEXT DEFAULT 'zega_copilot';

CREATE TABLE IF NOT EXISTS public.umkm_copilot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.umkm_copilot_chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'demo-owner',
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  sender_name TEXT DEFAULT 'ZEGA AI',
  message TEXT NOT NULL,
  model_engine TEXT DEFAULT 'gemini-3.6-flash',
  tokens_used INT DEFAULT 94,
  latency_ms INT DEFAULT 185,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_copilot_messages ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'ZEGA AI';

-- 4. SEED DEFAULT TIER DEFINITIONS
INSERT INTO public.umkm_chat_tier_rules (tier_slug, tier_name, max_active_sessions, max_messages_per_session, retention_days)
VALUES 
  ('starter', 'Starter (UMKM)', 10, 50, 30),
  ('pro', 'Pro (Growth)', 50, 250, 90),
  ('enterprise', 'Enterprise (Swarm)', 999999, 999999, 3650)
ON CONFLICT (tier_slug) DO UPDATE SET 
  tier_name = EXCLUDED.tier_name,
  max_active_sessions = EXCLUDED.max_active_sessions,
  max_messages_per_session = EXCLUDED.max_messages_per_session,
  retention_days = EXCLUDED.retention_days;

INSERT INTO public.umkm_user_subscription_tiers (user_id, store_id, tier_slug, status)
VALUES ('demo-owner', '11111111-1111-1111-1111-111111111111', 'starter', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- 5. AUTO-TOUCH UPDATED_AT TRIGGER FOR RECENT CHATS
CREATE OR REPLACE FUNCTION public.touch_umkm_chat_session_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'umkm_help_live_messages' THEN
    UPDATE public.umkm_help_live_chats
    SET updated_at = NOW()
    WHERE id = NEW.chat_id;
  ELSIF TG_TABLE_NAME = 'umkm_copilot_messages' THEN
    UPDATE public.umkm_copilot_chats
    SET updated_at = NOW()
    WHERE id = NEW.chat_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_umkm_help_live_chat_updated_at ON public.umkm_help_live_messages;
CREATE TRIGGER trg_touch_umkm_help_live_chat_updated_at
AFTER INSERT ON public.umkm_help_live_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_umkm_chat_session_updated_at();

DROP TRIGGER IF EXISTS trg_touch_umkm_copilot_chat_updated_at ON public.umkm_copilot_messages;
CREATE TRIGGER trg_touch_umkm_copilot_chat_updated_at
AFTER INSERT ON public.umkm_copilot_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_umkm_chat_session_updated_at();

-- 6. RPC FUNCTION FOR COMPREHENSIVE RECENT CHAT HISTORY
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
    -- Ops Specialist Sessions (Home AI Assistant)
    SELECT 
      c.id AS chat_id,
      'ops_specialist'::TEXT AS chat_type,
      c.title,
      c.created_at,
      c.updated_at
    FROM public.umkm_help_live_chats c
    WHERE c.user_id = p_user_id 
      AND (c.agent_role = 'ZEGA Ops Specialist' OR c.agent_role IS NULL OR c.title LIKE '%Ops%')
      AND (p_chat_type = 'all' OR p_chat_type = 'ops_specialist')

    UNION ALL

    -- Live Help Queue Sessions (Help Page Direct Live Chat)
    SELECT 
      c.id AS chat_id,
      'live_help'::TEXT AS chat_type,
      c.title,
      c.created_at,
      c.updated_at
    FROM public.umkm_help_live_chats c
    WHERE c.user_id = p_user_id 
      AND (c.agent_role = 'ZEGA AI Specialist Direct' OR c.agent_role LIKE '%Direct%' OR c.agent_role LIKE '%Queue%')
      AND (p_chat_type = 'all' OR p_chat_type = 'live_help' OR p_chat_type = 'help')

    UNION ALL

    -- ZEGA Copilot Sessions (Floating Robot Drawer)
    SELECT 
      cc.id AS chat_id,
      'copilot'::TEXT AS chat_type,
      cc.title,
      cc.created_at,
      cc.updated_at
    FROM public.umkm_copilot_chats cc
    WHERE cc.user_id = p_user_id AND (p_chat_type = 'all' OR p_chat_type = 'copilot')
  )
  SELECT 
    ch.chat_id,
    ch.chat_type,
    ch.title,
    COALESCE(
      CASE WHEN ch.chat_type = 'help' THEN (
        SELECT m.text FROM public.umkm_help_live_messages m WHERE m.chat_id = ch.chat_id ORDER BY m.created_at DESC LIMIT 1
      ) ELSE (
        SELECT cm.message FROM public.umkm_copilot_messages cm WHERE cm.chat_id = ch.chat_id ORDER BY cm.created_at DESC LIMIT 1
      ) END,
      'Pesan kosong'
    ) AS last_message,
    COALESCE(
      CASE WHEN ch.chat_type = 'help' THEN (
        SELECT m.sender FROM public.umkm_help_live_messages m WHERE m.chat_id = ch.chat_id ORDER BY m.created_at DESC LIMIT 1
      ) ELSE (
        SELECT cm.sender FROM public.umkm_copilot_messages cm WHERE cm.chat_id = ch.chat_id ORDER BY cm.created_at DESC LIMIT 1
      ) END,
      'system'
    ) AS last_sender,
    CASE WHEN ch.chat_type = 'help' THEN (
      SELECT COUNT(*) FROM public.umkm_help_live_messages m WHERE m.chat_id = ch.chat_id
    ) ELSE (
      SELECT COUNT(*) FROM public.umkm_copilot_messages cm WHERE cm.chat_id = ch.chat_id
    ) END AS message_count,
    ch.created_at,
    ch.updated_at
  FROM combined_chats ch
  ORDER BY ch.updated_at DESC;
END;
$$;

-- 7. RPC FUNCTION TO GET USER CHAT TIER USAGE & QUOTA AUDIT
CREATE OR REPLACE FUNCTION public.get_umkm_chat_tier_usage(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_slug TEXT := 'starter';
  v_tier_name TEXT := 'Starter (UMKM)';
  v_max_sessions INT := 10;
  v_max_messages INT := 50;
  v_retention INT := 30;
  v_current_sessions INT := 0;
  v_total_messages INT := 0;
  v_result JSONB;
BEGIN
  SELECT u.tier_slug, r.tier_name, r.max_active_sessions, r.max_messages_per_session, r.retention_days
  INTO v_tier_slug, v_tier_name, v_max_sessions, v_max_messages, v_retention
  FROM public.umkm_user_subscription_tiers u
  JOIN public.umkm_chat_tier_rules r ON r.tier_slug = u.tier_slug
  WHERE u.user_id = p_user_id AND u.status = 'active';

  IF NOT FOUND THEN
    v_tier_slug := 'starter';
    v_tier_name := 'Starter (UMKM)';
    v_max_sessions := 10;
    v_max_messages := 50;
    v_retention := 30;
  END IF;

  SELECT COUNT(*) INTO v_current_sessions
  FROM (
    SELECT id FROM public.umkm_help_live_chats WHERE user_id = p_user_id AND status = 'active'
    UNION ALL
    SELECT id FROM public.umkm_copilot_chats WHERE user_id = p_user_id AND status = 'active'
  ) sessions;

  SELECT COUNT(*) INTO v_total_messages
  FROM (
    SELECT id FROM public.umkm_help_live_messages WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM public.umkm_copilot_messages WHERE user_id = p_user_id
  ) msgs;

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'tier_slug', v_tier_slug,
    'tier_name', v_tier_name,
    'max_active_sessions', v_max_sessions,
    'max_messages_per_session', v_max_messages,
    'retention_days', v_retention,
    'current_active_sessions', v_current_sessions,
    'total_messages_stored', v_total_messages,
    'quota_used_pct', CASE WHEN v_max_sessions > 0 THEN LEAST(100, ROUND((v_current_sessions::NUMERIC / v_max_sessions::NUMERIC) * 100)) ELSE 0 END
  );

  RETURN v_result;
END;
$$;

-- 8. TRIGGER PROCEDURE TO PRUNE OVERFLOW MESSAGES AUTOMATICALLY
CREATE OR REPLACE FUNCTION public.prune_umkm_chat_messages_by_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_messages INT := 50;
  v_chat_message_count INT := 0;
  v_user_id TEXT;
BEGIN
  v_user_id := NEW.user_id;

  SELECT r.max_messages_per_session INTO v_max_messages
  FROM public.umkm_user_subscription_tiers u
  JOIN public.umkm_chat_tier_rules r ON r.tier_slug = u.tier_slug
  WHERE u.user_id = v_user_id;

  IF v_max_messages IS NULL THEN
    v_max_messages := 50;
  END IF;

  IF TG_TABLE_NAME = 'umkm_help_live_messages' THEN
    SELECT COUNT(*) INTO v_chat_message_count
    FROM public.umkm_help_live_messages
    WHERE chat_id = NEW.chat_id;

    IF v_chat_message_count >= v_max_messages THEN
      DELETE FROM public.umkm_help_live_messages
      WHERE id IN (
        SELECT id FROM public.umkm_help_live_messages
        WHERE chat_id = NEW.chat_id
        ORDER BY created_at ASC
        LIMIT (v_chat_message_count - v_max_messages + 1)
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'umkm_copilot_messages' THEN
    SELECT COUNT(*) INTO v_chat_message_count
    FROM public.umkm_copilot_messages
    WHERE chat_id = NEW.chat_id;

    IF v_chat_message_count >= v_max_messages THEN
      DELETE FROM public.umkm_copilot_messages
      WHERE id IN (
        SELECT id FROM public.umkm_copilot_messages
        WHERE chat_id = NEW.chat_id
        ORDER BY created_at ASC
        LIMIT (v_chat_message_count - v_max_messages + 1)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_umkm_chat_messages ON public.umkm_help_live_messages;
CREATE TRIGGER trg_prune_umkm_chat_messages
BEFORE INSERT ON public.umkm_help_live_messages
FOR EACH ROW
EXECUTE FUNCTION public.prune_umkm_chat_messages_by_tier();

DROP TRIGGER IF EXISTS trg_prune_umkm_copilot_messages ON public.umkm_copilot_messages;
CREATE TRIGGER trg_prune_umkm_copilot_messages
BEFORE INSERT ON public.umkm_copilot_messages
FOR EACH ROW
EXECUTE FUNCTION public.prune_umkm_chat_messages_by_tier();

-- 9. RLS & REPLICA IDENTITY FOR ALL TABLES
ALTER TABLE public.umkm_chat_tier_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_copilot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_copilot_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'chat_tier_rules_read_all') THEN
    CREATE POLICY "chat_tier_rules_read_all" ON public.umkm_chat_tier_rules FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_sub_tiers_all') THEN
    CREATE POLICY "user_sub_tiers_all" ON public.umkm_user_subscription_tiers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'copilot_chats_all') THEN
    CREATE POLICY "copilot_chats_all" ON public.umkm_copilot_chats FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'copilot_messages_all') THEN
    CREATE POLICY "copilot_messages_all" ON public.umkm_copilot_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10. PUBLISH TO SUPABASE REALTIME
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_chat_tier_rules;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_subscription_tiers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_copilot_chats;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_copilot_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add tables to supabase_realtime publication';
END $$;
