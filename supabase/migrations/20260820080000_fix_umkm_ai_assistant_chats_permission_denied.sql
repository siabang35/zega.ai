-- ============================================================================
-- ZEGA AI PLATFORM — FIX PERMISSION DENIED FOR umkm_ai_assistant_chats & CHAT TABLES
-- Migration: 20260820080000_fix_umkm_ai_assistant_chats_permission_denied.sql
-- ============================================================================

BEGIN;

-- 1. Grant Table Permissions strictly to authenticated & service_role
GRANT ALL ON TABLE public.umkm_ai_assistant_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_ai_assistant_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_live_help_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_live_help_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_ai_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_ai_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_zega_copilot_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_zega_copilot_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_knowledge_documents TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_knowledge_docs TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_insights TO authenticated, service_role;

-- 2. Configure RLS Policies for umkm_ai_assistant_chats
ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistant_chats_tenant_isolation" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_all" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_anon_read_write" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_auth_all" ON public.umkm_ai_assistant_chats;

CREATE POLICY "assistant_chats_auth_all"
ON public.umkm_ai_assistant_chats
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Configure RLS Policies for umkm_ai_assistant_messages
ALTER TABLE public.umkm_ai_assistant_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistant_messages_tenant_isolation" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_all" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_anon_read_write" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_auth_all" ON public.umkm_ai_assistant_messages;

CREATE POLICY "assistant_messages_auth_all"
ON public.umkm_ai_assistant_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Configure RLS Policies for umkm_live_help_chats & messages
ALTER TABLE public.umkm_live_help_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "live_help_chats_auth_all" ON public.umkm_live_help_chats;
CREATE POLICY "live_help_chats_auth_all"
ON public.umkm_live_help_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.umkm_live_help_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "live_help_messages_auth_all" ON public.umkm_live_help_messages;
CREATE POLICY "live_help_messages_auth_all"
ON public.umkm_live_help_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Configure RLS Policies for umkm_finance_ai_chats & messages
ALTER TABLE public.umkm_finance_ai_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_ai_chats_auth_all" ON public.umkm_finance_ai_chats;
CREATE POLICY "finance_ai_chats_auth_all"
ON public.umkm_finance_ai_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.umkm_finance_ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_ai_messages_auth_all" ON public.umkm_finance_ai_messages;
CREATE POLICY "finance_ai_messages_auth_all"
ON public.umkm_finance_ai_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Configure RLS Policies for umkm_zega_copilot_chats & messages
ALTER TABLE public.umkm_zega_copilot_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_chats_auth_all" ON public.umkm_zega_copilot_chats;
CREATE POLICY "copilot_chats_auth_all"
ON public.umkm_zega_copilot_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.umkm_zega_copilot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_messages_auth_all" ON public.umkm_zega_copilot_messages;
CREATE POLICY "copilot_messages_auth_all"
ON public.umkm_zega_copilot_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Grant Schema & RPC Execution Rights
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

COMMIT;
