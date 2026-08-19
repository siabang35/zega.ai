-- ============================================================================
-- ZEGA AI PLATFORM — STRICT AUTHENTICATED USER ONLY RLS POLICIES
-- Migration: 20260820060000_fix_all_ai_assistant_chats_rls_policies.sql
-- SECURITY RULE: Access granted EXCLUSIVELY TO authenticated & service_role. NO ANON ACCESS.
-- ============================================================================

BEGIN;

-- 1. Ensure Table Grants for authenticated and service_role ONLY (Revoke anon)
REVOKE ALL ON TABLE public.umkm_finance_ai_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_ai_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_insights FROM anon;

GRANT ALL ON TABLE public.umkm_finance_ai_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_ai_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_insights TO authenticated, service_role;

-- 2. Drop Restrictive & Legacy Policies on Finance AI Chat Tables
DROP POLICY IF EXISTS "finance_ai_chats_tenant_isolation" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_all" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_anon_read_write" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_authenticated_read_write" ON public.umkm_finance_ai_chats;

DROP POLICY IF EXISTS "finance_ai_messages_tenant_isolation" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_all" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_anon_read_write" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_authenticated_read_write" ON public.umkm_finance_ai_messages;

DROP POLICY IF EXISTS "Public read umkm_finance_insights" ON public.umkm_finance_insights;
DROP POLICY IF EXISTS "Public write umkm_finance_insights" ON public.umkm_finance_insights;
DROP POLICY IF EXISTS "finance_insights_anon_read_write" ON public.umkm_finance_insights;
DROP POLICY IF EXISTS "finance_insights_authenticated_read_write" ON public.umkm_finance_insights;

-- 3. Create Strict Policies for authenticated Role ONLY
CREATE POLICY "finance_ai_chats_authenticated_read_write"
ON public.umkm_finance_ai_chats
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "finance_ai_messages_authenticated_read_write"
ON public.umkm_finance_ai_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "finance_insights_authenticated_read_write"
ON public.umkm_finance_insights
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;
