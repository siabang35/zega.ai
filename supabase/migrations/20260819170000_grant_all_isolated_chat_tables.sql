-- ============================================================================
-- ZEGA AI PLATFORM — ISOLATED CHAT TABLES GRANT & RLS HARDENING MIGRATION
-- Migration: 20260819170000_grant_all_isolated_chat_tables.sql
--
-- PURPOSE:
--   Fix 401 (Unauthorized) PostgREST REST API failures on direct table insertions/queries
--   for umkm_zega_copilot_chats, umkm_ai_assistant_chats, umkm_finance_ai_chats, and umkm_live_help_chats.
--   Grants table-level permissions to `authenticated` and `service_role` and enforces RLS.
-- ============================================================================

BEGIN;

-- 1. Table Level Grants for Authenticated Users & Service Role
GRANT ALL ON TABLE public.umkm_zega_copilot_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_zega_copilot_messages TO authenticated, service_role;

GRANT ALL ON TABLE public.umkm_ai_assistant_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_ai_assistant_messages TO authenticated, service_role;

GRANT ALL ON TABLE public.umkm_finance_ai_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_ai_messages TO authenticated, service_role;

GRANT ALL ON TABLE public.umkm_live_help_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_live_help_messages TO authenticated, service_role;

-- 2. Enable Row Level Security (RLS) on all isolated chat tables
ALTER TABLE public.umkm_zega_copilot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_zega_copilot_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_assistant_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_finance_ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_finance_ai_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_live_help_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_live_help_messages ENABLE ROW LEVEL SECURITY;

-- 3. Strict RLS Tenant Isolation Policies for ZEGA Copilot Chats
DROP POLICY IF EXISTS "zega_copilot_chats_tenant_isolation" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "Authenticated users can access copilot chats" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "zega_copilot_chats_all" ON public.umkm_zega_copilot_chats;

CREATE POLICY "zega_copilot_chats_tenant_isolation"
ON public.umkm_zega_copilot_chats
FOR ALL
TO authenticated
USING (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
)
WITH CHECK (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
);

DROP POLICY IF EXISTS "zega_copilot_messages_tenant_isolation" ON public.umkm_zega_copilot_messages;
DROP POLICY IF EXISTS "zega_copilot_messages_all" ON public.umkm_zega_copilot_messages;

CREATE POLICY "zega_copilot_messages_tenant_isolation"
ON public.umkm_zega_copilot_messages
FOR ALL
TO authenticated
USING (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND (c.user_id = public.fn_current_app_user_id()::text OR c.user_id = auth.uid()::text)
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND (c.user_id = public.fn_current_app_user_id()::text OR c.user_id = auth.uid()::text)
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);

-- 4. RLS Tenant Isolation Policies for Live Help Chats
DROP POLICY IF EXISTS "live_help_chats_tenant_isolation" ON public.umkm_live_help_chats;
DROP POLICY IF EXISTS "live_help_chats_all" ON public.umkm_live_help_chats;

CREATE POLICY "live_help_chats_tenant_isolation"
ON public.umkm_live_help_chats
FOR ALL
TO authenticated
USING (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
)
WITH CHECK (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
);

DROP POLICY IF EXISTS "live_help_messages_tenant_isolation" ON public.umkm_live_help_messages;
DROP POLICY IF EXISTS "live_help_messages_all" ON public.umkm_live_help_messages;

CREATE POLICY "live_help_messages_tenant_isolation"
ON public.umkm_live_help_messages
FOR ALL
TO authenticated
USING (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.umkm_live_help_chats AS c
        WHERE c.id = chat_id
          AND (c.user_id = public.fn_current_app_user_id()::text OR c.user_id = auth.uid()::text)
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.umkm_live_help_chats AS c
        WHERE c.id = chat_id
          AND (c.user_id = public.fn_current_app_user_id()::text OR c.user_id = auth.uid()::text)
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);

-- 5. RLS Tenant Isolation Policies for Finance AI Chats
DROP POLICY IF EXISTS "finance_ai_chats_tenant_isolation" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_all" ON public.umkm_finance_ai_chats;

CREATE POLICY "finance_ai_chats_tenant_isolation"
ON public.umkm_finance_ai_chats
FOR ALL
TO authenticated
USING (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
)
WITH CHECK (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
);

DROP POLICY IF EXISTS "finance_ai_messages_tenant_isolation" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_all" ON public.umkm_finance_ai_messages;

CREATE POLICY "finance_ai_messages_tenant_isolation"
ON public.umkm_finance_ai_messages
FOR ALL
TO authenticated
USING (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.id = chat_id
          AND (c.user_id = public.fn_current_app_user_id()::text OR c.user_id = auth.uid()::text)
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (user_id = public.fn_current_app_user_id()::text OR user_id = auth.uid()::text)
    AND EXISTS (
        SELECT 1
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.id = chat_id
          AND (c.user_id = public.fn_current_app_user_id()::text OR c.user_id = auth.uid()::text)
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);

COMMIT;
