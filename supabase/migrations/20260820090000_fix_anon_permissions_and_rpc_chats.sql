-- ============================================================================
-- ZEGA AI PLATFORM — STRICT AUTHENTICATED USER PERMISSIONS & CHAT RPC
-- Migration: 20260820090000_fix_anon_permissions_and_rpc_chats.sql
-- ============================================================================

BEGIN;

-- 1. Table Grants strictly to authenticated and service_role ONLY
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_ai_assistant_chats TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_ai_assistant_messages TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_zega_copilot_chats TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_zega_copilot_messages TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_finance_ai_chats TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_finance_ai_messages TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_live_help_chats TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.umkm_live_help_messages TO authenticated, service_role;

-- Revoke all table permissions from anon for strict Zero-Trust isolation
REVOKE ALL ON TABLE public.umkm_ai_assistant_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_ai_assistant_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_zega_copilot_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_zega_copilot_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_ai_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_ai_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_live_help_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_live_help_messages FROM anon;

-- 2. Strict RLS Policies for authenticated users ON umkm_ai_assistant_chats
ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistant_chats_authenticated_policy" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_anon_auth_policy" ON public.umkm_ai_assistant_chats;

CREATE POLICY "assistant_chats_authenticated_policy"
ON public.umkm_ai_assistant_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    OR user_id = public.fn_current_app_user_id()::text
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
)
WITH CHECK (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    OR user_id = public.fn_current_app_user_id()::text
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
);

-- 3. Strict RLS Policies for authenticated users ON umkm_zega_copilot_chats
ALTER TABLE public.umkm_zega_copilot_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_chats_authenticated_policy" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "copilot_chats_anon_auth_policy" ON public.umkm_zega_copilot_chats;

CREATE POLICY "copilot_chats_authenticated_policy"
ON public.umkm_zega_copilot_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    OR user_id = public.fn_current_app_user_id()::text
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
)
WITH CHECK (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    OR user_id = public.fn_current_app_user_id()::text
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
);

-- 4. SECURITY DEFINER RPC: fn_get_ai_assistant_chats
CREATE OR REPLACE FUNCTION public.fn_get_ai_assistant_chats(
    p_store_id UUID,
    p_user_id TEXT,
    p_agent_role TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    user_id TEXT,
    title TEXT,
    agent_role TEXT,
    organization_id UUID,
    workspace_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
    IF p_store_id IS NULL OR p_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Strict multi-tenant access check
    IF NOT (
        public.fn_can_access_umkm_store(p_store_id, NULL, NULL)
        OR p_user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND p_user_id = auth.uid()::text)
    ) THEN
        RAISE EXCEPTION 'TENANT_ACCESS_DENIED: User does not have access to store %', p_store_id;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.store_id,
        c.user_id,
        c.title,
        c.agent_role,
        c.organization_id,
        c.workspace_id,
        c.created_at,
        c.updated_at
    FROM public.umkm_ai_assistant_chats AS c
    WHERE c.store_id = p_store_id
      AND c.user_id = p_user_id
      AND (p_agent_role IS NULL OR c.agent_role = p_agent_role)
    ORDER BY c.created_at DESC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_get_ai_assistant_chats(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_ai_assistant_chats(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 5. SECURITY DEFINER RPC: fn_get_zega_copilot_chats
CREATE OR REPLACE FUNCTION public.fn_get_zega_copilot_chats(
    p_store_id UUID,
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    user_id TEXT,
    title TEXT,
    organization_id UUID,
    workspace_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
    IF p_store_id IS NULL OR p_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Strict multi-tenant access check
    IF NOT (
        public.fn_can_access_umkm_store(p_store_id, NULL, NULL)
        OR p_user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND p_user_id = auth.uid()::text)
    ) THEN
        RAISE EXCEPTION 'TENANT_ACCESS_DENIED: User does not have access to store %', p_store_id;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.store_id,
        c.user_id,
        c.title,
        c.organization_id,
        c.workspace_id,
        c.created_at,
        c.updated_at
    FROM public.umkm_zega_copilot_chats AS c
    WHERE c.store_id = p_store_id
      AND c.user_id = p_user_id
    ORDER BY c.created_at DESC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_get_zega_copilot_chats(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_zega_copilot_chats(UUID, TEXT) TO authenticated, service_role;

COMMIT;
