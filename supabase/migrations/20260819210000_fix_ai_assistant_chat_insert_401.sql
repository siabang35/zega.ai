-- ============================================================================
-- ZEGA AI PLATFORM — STRICT FIX FOR CHAT INSERT RLS 401 & CANONICAL AUTH FALLBACK
-- Migration: 20260819210000_fix_ai_assistant_chat_insert_401.sql
--
-- PURPOSE:
--   1. Harden public.fn_current_app_user_id() to auto-reconcile and provision canonical application user when auth.uid() is present.
--   2. Upgrade public.fn_can_access_umkm_store() to support direct auth_user_id matching & fallbacks when app_user_id is resolving.
--   3. Re-attach hardened RLS policies on ALL chat tables (umkm_ai_assistant_chats, umkm_zega_copilot_chats, umkm_live_help_chats, umkm_finance_ai_chats)
--      allowing insertion/access if fn_can_access_umkm_store() is TRUE and user_id matches app_user_id OR auth.uid().
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. HARDENED CANONICAL APPLICATION USER ID RESOLVER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_app_user_id UUID;
BEGIN
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- Indexed primary path
    SELECT id INTO v_app_user_id
    FROM public.users
    WHERE auth_user_id = v_auth_uid;

    IF v_app_user_id IS NOT NULL THEN
        RETURN v_app_user_id;
    END IF;

    -- Secondary lookup: if public.users.id matches v_auth_uid directly
    SELECT id INTO v_app_user_id
    FROM public.users
    WHERE id = v_auth_uid;

    IF v_app_user_id IS NOT NULL THEN
        RETURN v_app_user_id;
    END IF;

    -- Auto-reconciliation provisioner fallback
    RETURN public.fn_get_or_create_current_app_user();
EXCEPTION WHEN OTHERS THEN
    RETURN v_auth_uid;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_current_app_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_current_app_user_id() TO anon, authenticated, service_role;


-- ============================================================================
-- 2. HARDENED STORE ACCESS AUTHORIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_can_access_umkm_store(
    p_store_id UUID,
    p_organization_id UUID DEFAULT NULL,
    p_workspace_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_user_id UUID;
    v_store_org_id UUID;
    v_store_workspace_id UUID;
    v_store_user_id UUID;
BEGIN
    IF p_store_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_user_id := public.fn_current_app_user_id();

    IF v_user_id IS NULL AND v_auth_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT
        s.organization_id,
        s.workspace_id,
        s.user_id
    INTO
        v_store_org_id,
        v_store_workspace_id,
        v_store_user_id
    FROM public.umkm_stores AS s
    WHERE s.id = p_store_id;

    -- Actual store MUST exist.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Client cannot claim another organization.
    IF p_organization_id IS NOT NULL
       AND v_store_org_id IS DISTINCT FROM p_organization_id
    THEN
        RETURN FALSE;
    END IF;

    -- Client cannot claim another workspace.
    IF p_workspace_id IS NOT NULL
       AND v_store_workspace_id IS DISTINCT FROM p_workspace_id
    THEN
        RETURN FALSE;
    END IF;

    -- Direct owner path (matching canonical app_user_id OR auth_user_id)
    IF (v_user_id IS NOT NULL AND v_store_user_id = v_user_id)
       OR (v_auth_uid IS NOT NULL AND v_store_user_id = v_auth_uid)
    THEN
        RETURN TRUE;
    END IF;

    -- Organization membership path
    IF NOT public.fn_is_org_member(v_store_org_id) THEN
        RETURN FALSE;
    END IF;

    -- Validate workspace -> organization relationship when present
    IF v_store_workspace_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.workspaces AS w
            WHERE w.id = v_store_workspace_id
              AND w.organization_id = v_store_org_id
        ) THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID) TO authenticated, service_role;


-- ============================================================================
-- 3. HARDEN RLS POLICIES ACROSS ALL CHAT TABLES & MESSAGES
-- ============================================================================

-- A. UMKM AI ASSISTANT CHATS
ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_assistant_chats_tenant_isolation" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "ai_assistant_chats_all" ON public.umkm_ai_assistant_chats;

CREATE POLICY "ai_assistant_chats_tenant_isolation"
ON public.umkm_ai_assistant_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
)
WITH CHECK (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "ai_assistant_messages_tenant_isolation" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "ai_assistant_messages_all" ON public.umkm_ai_assistant_messages;

CREATE POLICY "ai_assistant_messages_tenant_isolation"
ON public.umkm_ai_assistant_messages
FOR ALL
TO authenticated
USING (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);


-- B. ZEGA COPILOT CHATS
ALTER TABLE public.umkm_zega_copilot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_zega_copilot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zega_copilot_chats_tenant_isolation" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "zega_copilot_chats_all" ON public.umkm_zega_copilot_chats;

CREATE POLICY "zega_copilot_chats_tenant_isolation"
ON public.umkm_zega_copilot_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
)
WITH CHECK (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "zega_copilot_messages_tenant_isolation" ON public.umkm_zega_copilot_messages;
DROP POLICY IF EXISTS "zega_copilot_messages_all" ON public.umkm_zega_copilot_messages;

CREATE POLICY "zega_copilot_messages_tenant_isolation"
ON public.umkm_zega_copilot_messages
FOR ALL
TO authenticated
USING (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);


-- C. LIVE HELP CHATS
ALTER TABLE public.umkm_live_help_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_live_help_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_help_chats_tenant_isolation" ON public.umkm_live_help_chats;
DROP POLICY IF EXISTS "live_help_chats_all" ON public.umkm_live_help_chats;

CREATE POLICY "live_help_chats_tenant_isolation"
ON public.umkm_live_help_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
)
WITH CHECK (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "live_help_messages_tenant_isolation" ON public.umkm_live_help_messages;
DROP POLICY IF EXISTS "live_help_messages_all" ON public.umkm_live_help_messages;

CREATE POLICY "live_help_messages_tenant_isolation"
ON public.umkm_live_help_messages
FOR ALL
TO authenticated
USING (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_live_help_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_live_help_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);


-- D. FINANCE AI CHATS
ALTER TABLE public.umkm_finance_ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_finance_ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_ai_chats_tenant_isolation" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_all" ON public.umkm_finance_ai_chats;

CREATE POLICY "finance_ai_chats_tenant_isolation"
ON public.umkm_finance_ai_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
)
WITH CHECK (
    public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
    AND (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
);

DROP POLICY IF EXISTS "finance_ai_messages_tenant_isolation" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_all" ON public.umkm_finance_ai_messages;

CREATE POLICY "finance_ai_messages_tenant_isolation"
ON public.umkm_finance_ai_messages
FOR ALL
TO authenticated
USING (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    (
        user_id = public.fn_current_app_user_id()::text
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    )
    AND EXISTS (
        SELECT 1
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.id = chat_id
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);

COMMIT;
