-- ============================================================================
-- ZEGA AI PLATFORM — STRICT FIX FOR AI ASSISTANT CHAT INSERT 401 & RLS HARDENING
-- Migration: 20260819140000_strict_fix_ai_assistant_chat_insert_401.sql
--
-- SECURITY ARCHITECTURE:
--   1. auth.uid() -> public.users.auth_user_id -> public.users.id
--   2. Public user ID is canonical application user ID.
--   3. Client-provided user_id, organization_id, workspace_id are UNTRUSTED.
--   4. Trigger validates tenant context server-side.
--   5. RLS policies enforce zero-trust boundary on all operations.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DATABASE AUTH FORENSIC DIAGNOSTIC RPC
-- Safe diagnostic helper to verify PostgreSQL auth state without exposing raw JWTs.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_debug_auth_context()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
    RETURN jsonb_build_object(
        'authenticated', auth.uid() IS NOT NULL,
        'auth_uid', auth.uid(),
        'role', current_setting('request.jwt.claim.role', true),
        'sub', current_setting('request.jwt.claim.sub', true),
        'claims_present', current_setting('request.jwt.claims', true) IS NOT NULL
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_debug_auth_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_debug_auth_context() TO authenticated, service_role;


-- ============================================================================
-- 2. CANONICAL APPLICATION USER ID RESOLVER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_app_user_id UUID;
    v_match_count INTEGER;
BEGIN
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT
        COUNT(*)::INTEGER,
        MIN(u.id::text)::uuid
    INTO
        v_match_count,
        v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid;

    IF v_match_count = 1 THEN
        RETURN v_app_user_id;
    END IF;

    RETURN NULL;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_current_app_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_current_app_user_id() TO authenticated, service_role;


-- ============================================================================
-- 3. STRICT CHAT TENANT BOUNDARY TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID;
    v_app_user_id UUID;

    v_store_org_id UUID;
    v_store_workspace_id UUID;
    v_store_user_id UUID;

    v_workspace_org_id UUID;
    v_has_store_access BOOLEAN := FALSE;
BEGIN
    -- A. Authentication context check
    v_auth_uid := auth.uid();
    v_app_user_id := public.fn_current_app_user_id();

    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: authentication context unavailable';
    END IF;

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: canonical application identity unavailable';
    END IF;

    -- B. Standardize user_id to canonical application user ID
    NEW.user_id := v_app_user_id::TEXT;

    -- C. store_id is mandatory
    IF NEW.store_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: store_id is required';
    END IF;

    -- D. Resolve exact store
    SELECT
        s.organization_id,
        s.workspace_id,
        s.user_id
    INTO
        v_store_org_id,
        v_store_workspace_id,
        v_store_user_id
    FROM public.umkm_stores AS s
    WHERE s.id = NEW.store_id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: store %s does not exist', NEW.store_id);
    END IF;

    IF v_store_org_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: store %s has no organization', NEW.store_id);
    END IF;

    -- E. Authorization check
    v_has_store_access :=
        (v_store_user_id = v_app_user_id)
        OR
        public.fn_is_org_member(v_store_org_id);

    IF NOT v_has_store_access THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: user %s is not authorized for store %s', v_app_user_id, NEW.store_id);
    END IF;

    -- F. Organization consistency
    IF NEW.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM v_store_org_id THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: organization mismatch for store %s', NEW.store_id);
    END IF;
    NEW.organization_id := v_store_org_id;

    -- G. Workspace consistency
    IF v_store_workspace_id IS NOT NULL THEN
        IF NEW.workspace_id IS NOT NULL AND NEW.workspace_id IS DISTINCT FROM v_store_workspace_id THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = format('TENANT_BOUNDARY_VIOLATION: workspace mismatch for store %s', NEW.store_id);
        END IF;
        NEW.workspace_id := v_store_workspace_id;
    ELSE
        IF NEW.workspace_id IS NOT NULL THEN
            SELECT w.organization_id INTO v_workspace_org_id
            FROM public.workspaces AS w
            WHERE w.id = NEW.workspace_id
            LIMIT 1;

            IF NOT FOUND THEN
                RAISE EXCEPTION
                USING
                    ERRCODE = 'P0001',
                    MESSAGE = format('TENANT_BOUNDARY_VIOLATION: workspace %s does not exist', NEW.workspace_id);
            END IF;

            IF v_workspace_org_id IS DISTINCT FROM v_store_org_id THEN
                RAISE EXCEPTION
                USING
                    ERRCODE = 'P0001',
                    MESSAGE = format('TENANT_BOUNDARY_VIOLATION: workspace %s does not belong to store organization %s', NEW.workspace_id, v_store_org_id);
            END IF;
        ELSE
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = format('TENANT_BOUNDARY_VIOLATION: store %s has no canonical workspace', NEW.store_id);
        END IF;
    END IF;

    -- H. Final non-null assertions
    IF NEW.user_id IS NULL OR NEW.store_id IS NULL OR NEW.organization_id IS NULL OR NEW.workspace_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: chat tenant identifiers cannot be NULL';
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary() TO authenticated, service_role;


-- ============================================================================
-- 4. RE-ATTACH TRIGGERS ON ALL CHAT TABLES
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_fill_ai_assistant_chat_tenant ON public.umkm_ai_assistant_chats;
CREATE TRIGGER trg_auto_fill_ai_assistant_chat_tenant
BEFORE INSERT OR UPDATE
ON public.umkm_ai_assistant_chats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary();

DROP TRIGGER IF EXISTS trg_auto_fill_zega_copilot_chat_tenant ON public.umkm_zega_copilot_chats;
CREATE TRIGGER trg_auto_fill_zega_copilot_chat_tenant
BEFORE INSERT OR UPDATE
ON public.umkm_zega_copilot_chats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary();


-- ============================================================================
-- 5. STRICT RLS POLICIES FOR AI ASSISTANT CHATS & MESSAGES
-- ============================================================================

ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_assistant_chats_tenant_isolation" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "Authenticated users can access copilot chats" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "ai_assistant_chats_all" ON public.umkm_ai_assistant_chats;

CREATE POLICY "ai_assistant_chats_tenant_isolation"
ON public.umkm_ai_assistant_chats
FOR ALL
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()::text
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
)
WITH CHECK (
    user_id = public.fn_current_app_user_id()::text
    AND public.fn_can_access_umkm_store(store_id, organization_id, workspace_id)
);

DROP POLICY IF EXISTS "ai_assistant_messages_tenant_isolation" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "ai_assistant_messages_all" ON public.umkm_ai_assistant_messages;

CREATE POLICY "ai_assistant_messages_tenant_isolation"
ON public.umkm_ai_assistant_messages
FOR ALL
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
)
WITH CHECK (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
    )
);

COMMIT;
