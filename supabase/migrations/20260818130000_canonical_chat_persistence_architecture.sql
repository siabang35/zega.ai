-- ============================================================================
-- ZEGA AI
-- Migration: 20260818140000_fix_canonical_chat_persistence.sql
--
-- PURPOSE
--   Fix persistent chat creation/history for ALL AI assistants.
--
-- CANONICAL IDENTITY
--   auth.uid()
--       -> public.users.auth_user_id
--       -> public.users.id
--       -> organization_members.user_id
--
-- CANONICAL TENANT
--   organization_id = tenant authority
--   store_id        = actual public.umkm_stores.id
--   workspace_id    = actual public.workspaces.id
--
-- SECURITY
--   - fail closed
--   - no email identity
--   - no auth.uid() fallback as app user
--   - no service_role in browser
--   - no RLS bypass
--   - no organization-only authorization for store-scoped data
-- ============================================================================


-- ============================================================================
-- 0. CANONICAL APPLICATION USER RESOLVER
-- ============================================================================
--
-- IMPORTANT:
-- Previous implementation could fall back to auth.uid().
-- That creates two identity domains:
--
--   auth.users.id
--   public.users.id
--
-- This function now resolves ONLY:
--
--   public.users.auth_user_id = auth.uid()
--
-- Ambiguous or missing mapping => NULL.
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
    v_count INTEGER;
BEGIN
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT
        COUNT(*),
        MIN(u.id::text)::uuid
    INTO
        v_count,
        v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid;

    IF v_count <> 1 THEN
        RETURN NULL;
    END IF;

    RETURN v_app_user_id;
END;
$function$;

REVOKE EXECUTE
ON FUNCTION public.fn_current_app_user_id()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_current_app_user_id()
TO authenticated, service_role;


-- ============================================================================
-- 1. STRICT ORGANIZATION MEMBERSHIP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_is_org_member(
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
    SELECT
        p_org_id IS NOT NULL
        AND public.fn_current_app_user_id() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.organization_members AS om
            WHERE om.organization_id = p_org_id
              AND om.user_id = public.fn_current_app_user_id()
              AND COALESCE(om.status, 'active') = 'active'
        );
$function$;

REVOKE EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
TO authenticated, service_role;


-- ============================================================================
-- 2. CANONICAL STORE AUTHORIZATION
-- ============================================================================
--
-- This is the critical missing piece.
--
-- A user is authorized for a store only when:
--
--   canonical app user exists
--   AND
--   store exists
--   AND
--   store.user_id = canonical user
--   OR active organization membership exists
--   AND
--   store.organization_id is valid
--   AND
--   workspace belongs to same organization when present
--
-- Organization membership alone is NOT sufficient for store access.
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
    v_user_id UUID;
    v_store_org_id UUID;
    v_store_workspace_id UUID;
    v_store_user_id UUID;
BEGIN
    IF p_store_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_user_id := public.fn_current_app_user_id();

    IF v_user_id IS NULL THEN
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

    -- Direct owner path.
    IF v_store_user_id = v_user_id THEN
        RETURN TRUE;
    END IF;

    -- Organization membership path.
    IF NOT public.fn_is_org_member(v_store_org_id) THEN
        RETURN FALSE;
    END IF;

    -- If store has a workspace, ensure requested workspace matches it.
    IF p_workspace_id IS NOT NULL
       AND v_store_workspace_id IS DISTINCT FROM p_workspace_id
    THEN
        RETURN FALSE;
    END IF;

    -- Validate workspace -> organization relationship.
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

REVOKE EXECUTE
ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID)
TO authenticated, service_role;


-- ============================================================================
-- 3. ADD CANONICAL TENANT COLUMNS
-- ============================================================================

ALTER TABLE public.umkm_ai_assistant_chats
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS workspace_id UUID
        REFERENCES public.workspaces(id)
        ON DELETE SET NULL;

ALTER TABLE public.umkm_zega_copilot_chats
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS workspace_id UUID
        REFERENCES public.workspaces(id)
        ON DELETE SET NULL;

ALTER TABLE public.umkm_live_help_chats
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS workspace_id UUID
        REFERENCES public.workspaces(id)
        ON DELETE SET NULL;

ALTER TABLE public.umkm_finance_ai_chats
    ADD COLUMN IF NOT EXISTS organization_id UUID
        REFERENCES public.organizations(id)
        ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS workspace_id UUID
        REFERENCES public.workspaces(id)
        ON DELETE SET NULL;


-- ============================================================================
-- 4. BACKFILL TENANT DATA FROM ACTUAL STORE
-- ============================================================================
--
-- DO NOT copy organization_id from frontend.
--
-- Canonical source:
--
--   chat.store_id
--       -> umkm_stores.id
--       -> organization_id
--       -> workspace_id
--
-- This directly fixes the previous architecture where organization_id/store_id
-- could accidentally contain the same identifier.
-- ============================================================================

UPDATE public.umkm_ai_assistant_chats AS c
SET
    organization_id = s.organization_id,
    workspace_id = s.workspace_id
FROM public.umkm_stores AS s
WHERE s.id = c.store_id
  AND (
      c.organization_id IS DISTINCT FROM s.organization_id
      OR c.workspace_id IS DISTINCT FROM s.workspace_id
  );

UPDATE public.umkm_zega_copilot_chats AS c
SET
    organization_id = s.organization_id,
    workspace_id = s.workspace_id
FROM public.umkm_stores AS s
WHERE s.id = c.store_id
  AND (
      c.organization_id IS DISTINCT FROM s.organization_id
      OR c.workspace_id IS DISTINCT FROM s.workspace_id
  );

UPDATE public.umkm_live_help_chats AS c
SET
    organization_id = s.organization_id,
    workspace_id = s.workspace_id
FROM public.umkm_stores AS s
WHERE s.id = c.store_id
  AND (
      c.organization_id IS DISTINCT FROM s.organization_id
      OR c.workspace_id IS DISTINCT FROM s.workspace_id
  );

UPDATE public.umkm_finance_ai_chats AS c
SET
    organization_id = s.organization_id,
    workspace_id = s.workspace_id
FROM public.umkm_stores AS s
WHERE s.id = c.store_id
  AND (
      c.organization_id IS DISTINCT FROM s.organization_id
      OR c.workspace_id IS DISTINCT FROM s.workspace_id
  );


-- ============================================================================
-- 5. FAIL LOUDLY ON ORPHANED CHAT STORE REFERENCES
-- ============================================================================
--
-- NEVER silently rewrite an invalid store ID.
-- If existing rows reference a nonexistent store, migration must stop.
-- ============================================================================

DO $$
DECLARE
    v_count BIGINT;
BEGIN

    SELECT COUNT(*)
    INTO v_count
    FROM public.umkm_ai_assistant_chats AS c
    LEFT JOIN public.umkm_stores AS s
        ON s.id = c.store_id
    WHERE c.store_id IS NOT NULL
      AND s.id IS NULL;

    IF v_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE = format(
                'CHAT_STORE_INTEGRITY_FAILED: umkm_ai_assistant_chats contains %s orphaned store_id rows',
                v_count
            );
    END IF;


    SELECT COUNT(*)
    INTO v_count
    FROM public.umkm_zega_copilot_chats AS c
    LEFT JOIN public.umkm_stores AS s
        ON s.id = c.store_id
    WHERE c.store_id IS NOT NULL
      AND s.id IS NULL;

    IF v_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE = format(
                'CHAT_STORE_INTEGRITY_FAILED: umkm_zega_copilot_chats contains %s orphaned store_id rows',
                v_count
            );
    END IF;


    SELECT COUNT(*)
    INTO v_count
    FROM public.umkm_live_help_chats AS c
    LEFT JOIN public.umkm_stores AS s
        ON s.id = c.store_id
    WHERE c.store_id IS NOT NULL
      AND s.id IS NULL;

    IF v_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE = format(
                'CHAT_STORE_INTEGRITY_FAILED: umkm_live_help_chats contains %s orphaned store_id rows',
                v_count
            );
    END IF;


    SELECT COUNT(*)
    INTO v_count
    FROM public.umkm_finance_ai_chats AS c
    LEFT JOIN public.umkm_stores AS s
        ON s.id = c.store_id
    WHERE c.store_id IS NOT NULL
      AND s.id IS NULL;

    IF v_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE = format(
                'CHAT_STORE_INTEGRITY_FAILED: umkm_finance_ai_chats contains %s orphaned store_id rows',
                v_count
            );
    END IF;

END $$;


-- ============================================================================
-- 6. VERIFY EXISTING CHAT TENANT GRAPH
-- ============================================================================

DO $$
DECLARE
    v_count BIGINT;
BEGIN

    SELECT COUNT(*)
    INTO v_count
    FROM public.umkm_ai_assistant_chats AS c
    JOIN public.umkm_stores AS s
      ON s.id = c.store_id
    WHERE c.organization_id IS DISTINCT FROM s.organization_id;

    IF v_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23514',
            MESSAGE = format(
                'CHAT_TENANT_INTEGRITY_FAILED: %s AI assistant chats have organization/store mismatch',
                v_count
            );
    END IF;


    SELECT COUNT(*)
    INTO v_count
    FROM public.umkm_zega_copilot_chats AS c
    JOIN public.umkm_stores AS s
      ON s.id = c.store_id
    WHERE c.organization_id IS DISTINCT FROM s.organization_id;

    IF v_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23514',
            MESSAGE = format(
                'CHAT_TENANT_INTEGRITY_FAILED: %s Copilot chats have organization/store mismatch',
                v_count
            );
    END IF;

END $$;


-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_umkm_ai_assistant_chats_store
    ON public.umkm_ai_assistant_chats(store_id);

CREATE INDEX IF NOT EXISTS idx_umkm_ai_assistant_chats_org
    ON public.umkm_ai_assistant_chats(organization_id);

CREATE INDEX IF NOT EXISTS idx_umkm_ai_assistant_chats_workspace
    ON public.umkm_ai_assistant_chats(workspace_id);

CREATE INDEX IF NOT EXISTS idx_umkm_zega_copilot_chats_store
    ON public.umkm_zega_copilot_chats(store_id);

CREATE INDEX IF NOT EXISTS idx_umkm_zega_copilot_chats_org
    ON public.umkm_zega_copilot_chats(organization_id);

CREATE INDEX IF NOT EXISTS idx_umkm_zega_copilot_chats_workspace
    ON public.umkm_zega_copilot_chats(workspace_id);

CREATE INDEX IF NOT EXISTS idx_umkm_live_help_chats_store
    ON public.umkm_live_help_chats(store_id);

CREATE INDEX IF NOT EXISTS idx_umkm_live_help_chats_org
    ON public.umkm_live_help_chats(organization_id);

CREATE INDEX IF NOT EXISTS idx_umkm_finance_ai_chats_store
    ON public.umkm_finance_ai_chats(store_id);

CREATE INDEX IF NOT EXISTS idx_umkm_finance_ai_chats_org
    ON public.umkm_finance_ai_chats(organization_id);


-- ============================================================================
-- 8. STRICT RLS — AI ASSISTANT
-- ============================================================================

ALTER TABLE public.umkm_ai_assistant_chats
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_ai_assistant_messages
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_assistant_chats_all"
    ON public.umkm_ai_assistant_chats;

DROP POLICY IF EXISTS "ai_assistant_chats_tenant_isolation"
    ON public.umkm_ai_assistant_chats;

CREATE POLICY "ai_assistant_chats_tenant_isolation"
ON public.umkm_ai_assistant_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
)
WITH CHECK (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
);


-- ============================================================================
-- 9. STRICT RLS — AI ASSISTANT MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "ai_assistant_messages_all"
    ON public.umkm_ai_assistant_messages;

DROP POLICY IF EXISTS "ai_assistant_messages_tenant_isolation"
    ON public.umkm_ai_assistant_messages;

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
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
)
WITH CHECK (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
);


-- ============================================================================
-- 10. STRICT RLS — ZEGA COPILOT
-- ============================================================================

ALTER TABLE public.umkm_zega_copilot_chats
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_zega_copilot_messages
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zega_copilot_chats_all"
    ON public.umkm_zega_copilot_chats;

DROP POLICY IF EXISTS "zega_copilot_chats_tenant_isolation"
    ON public.umkm_zega_copilot_chats;

CREATE POLICY "zega_copilot_chats_tenant_isolation"
ON public.umkm_zega_copilot_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
)
WITH CHECK (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
);


-- ============================================================================
-- 11. STRICT RLS — ZEGA COPILOT MESSAGES
-- ============================================================================

DROP POLICY IF EXISTS "zega_copilot_messages_all"
    ON public.umkm_zega_copilot_messages;

DROP POLICY IF EXISTS "zega_copilot_messages_tenant_isolation"
    ON public.umkm_zega_copilot_messages;

CREATE POLICY "zega_copilot_messages_tenant_isolation"
ON public.umkm_zega_copilot_messages
FOR ALL
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
)
WITH CHECK (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
);


-- ============================================================================
-- 12. STRICT RLS — LIVE HELP
-- ============================================================================

ALTER TABLE public.umkm_live_help_chats
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_live_help_messages
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_help_chats_all"
    ON public.umkm_live_help_chats;

DROP POLICY IF EXISTS "live_help_chats_tenant_isolation"
    ON public.umkm_live_help_chats;

CREATE POLICY "live_help_chats_tenant_isolation"
ON public.umkm_live_help_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
)
WITH CHECK (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
);


DROP POLICY IF EXISTS "live_help_messages_all"
    ON public.umkm_live_help_messages;

DROP POLICY IF EXISTS "live_help_messages_tenant_isolation"
    ON public.umkm_live_help_messages;

CREATE POLICY "live_help_messages_tenant_isolation"
ON public.umkm_live_help_messages
FOR ALL
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_live_help_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
)
WITH CHECK (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_live_help_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
);


-- ============================================================================
-- 13. STRICT RLS — FINANCE AI
-- ============================================================================

ALTER TABLE public.umkm_finance_ai_chats
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_finance_ai_messages
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_ai_chats_all"
    ON public.umkm_finance_ai_chats;

DROP POLICY IF EXISTS "finance_ai_chats_tenant_isolation"
    ON public.umkm_finance_ai_chats;

CREATE POLICY "finance_ai_chats_tenant_isolation"
ON public.umkm_finance_ai_chats
FOR ALL
TO authenticated
USING (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
)
WITH CHECK (
    public.fn_can_access_umkm_store(
        store_id,
        organization_id,
        workspace_id
    )
    AND user_id = public.fn_current_app_user_id()::text
);


DROP POLICY IF EXISTS "finance_ai_messages_all"
    ON public.umkm_finance_ai_messages;

DROP POLICY IF EXISTS "finance_ai_messages_tenant_isolation"
    ON public.umkm_finance_ai_messages;

CREATE POLICY "finance_ai_messages_tenant_isolation"
ON public.umkm_finance_ai_messages
FOR ALL
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
)
WITH CHECK (
    user_id = public.fn_current_app_user_id()::text
    AND EXISTS (
        SELECT 1
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.id = chat_id
          AND c.user_id = public.fn_current_app_user_id()::text
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )
);


-- ============================================================================
-- 14. CANONICAL CHAT HISTORY RPC
-- ============================================================================
--
-- p_user_id is retained for API compatibility only.
-- It is NOT trusted.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_umkm_recent_chat_history(
    p_user_id TEXT DEFAULT NULL,
    p_chat_type TEXT DEFAULT 'all'
)
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
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_user_id UUID;
BEGIN

    v_user_id := public.fn_current_app_user_id();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'CHAT_HISTORY_AUTH_CONTEXT_UNAVAILABLE';
    END IF;

    -- If caller supplied an application user ID, it must match
    -- the canonical authenticated application user.
    IF p_user_id IS NOT NULL
       AND p_user_id <> v_user_id::text
    THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'CHAT_HISTORY_USER_MISMATCH';
    END IF;

    RETURN QUERY
    WITH combined_chats AS (

        SELECT
            c.id AS chat_id,
            'ai_assistant'::TEXT AS chat_type,
            c.title,
            c.created_at,
            c.updated_at
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.user_id = v_user_id::text
          AND (
              p_chat_type = 'all'
              OR p_chat_type = 'ai_assistant'
              OR p_chat_type = 'ops_specialist'
          )
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )

        UNION ALL

        SELECT
            c.id,
            'copilot'::TEXT,
            c.title,
            c.created_at,
            c.updated_at
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.user_id = v_user_id::text
          AND (
              p_chat_type = 'all'
              OR p_chat_type = 'copilot'
              OR p_chat_type = 'zega_copilot'
          )
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )

        UNION ALL

        SELECT
            c.id,
            'live_help'::TEXT,
            c.title,
            c.created_at,
            c.updated_at
        FROM public.umkm_live_help_chats AS c
        WHERE c.user_id = v_user_id::text
          AND (
              p_chat_type = 'all'
              OR p_chat_type = 'live_help'
              OR p_chat_type = 'help'
          )
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )

        UNION ALL

        SELECT
            c.id,
            'finance_ai'::TEXT,
            c.title,
            c.created_at,
            c.updated_at
        FROM public.umkm_finance_ai_chats AS c
        WHERE c.user_id = v_user_id::text
          AND (
              p_chat_type = 'all'
              OR p_chat_type = 'finance_ai'
              OR p_chat_type = 'finance'
          )
          AND public.fn_can_access_umkm_store(
              c.store_id,
              c.organization_id,
              c.workspace_id
          )
    )

    SELECT
        ch.chat_id,
        ch.chat_type,
        ch.title,

        COALESCE(
            CASE
                WHEN ch.chat_type = 'ai_assistant' THEN (
                    SELECT m.text
                    FROM public.umkm_ai_assistant_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )

                WHEN ch.chat_type = 'copilot' THEN (
                    SELECT m.message
                    FROM public.umkm_zega_copilot_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )

                WHEN ch.chat_type = 'live_help' THEN (
                    SELECT m.text
                    FROM public.umkm_live_help_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )

                WHEN ch.chat_type = 'finance_ai' THEN (
                    SELECT m.text
                    FROM public.umkm_finance_ai_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )
            END,
            'Pesan kosong'
        ) AS last_message,

        COALESCE(
            CASE
                WHEN ch.chat_type = 'ai_assistant' THEN (
                    SELECT m.sender
                    FROM public.umkm_ai_assistant_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )

                WHEN ch.chat_type = 'copilot' THEN (
                    SELECT m.sender
                    FROM public.umkm_zega_copilot_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )

                WHEN ch.chat_type = 'live_help' THEN (
                    SELECT m.sender
                    FROM public.umkm_live_help_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )

                WHEN ch.chat_type = 'finance_ai' THEN (
                    SELECT m.sender
                    FROM public.umkm_finance_ai_messages AS m
                    WHERE m.chat_id = ch.chat_id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )
            END,
            'system'
        ) AS last_sender,

        CASE
            WHEN ch.chat_type = 'ai_assistant' THEN (
                SELECT COUNT(*)
                FROM public.umkm_ai_assistant_messages m
                WHERE m.chat_id = ch.chat_id
            )

            WHEN ch.chat_type = 'copilot' THEN (
                SELECT COUNT(*)
                FROM public.umkm_zega_copilot_messages m
                WHERE m.chat_id = ch.chat_id
            )

            WHEN ch.chat_type = 'live_help' THEN (
                SELECT COUNT(*)
                FROM public.umkm_live_help_messages m
                WHERE m.chat_id = ch.chat_id
            )

            WHEN ch.chat_type = 'finance_ai' THEN (
                SELECT COUNT(*)
                FROM public.umkm_finance_ai_messages m
                WHERE m.chat_id = ch.chat_id
            )

            ELSE 0
        END AS message_count,

        ch.created_at,
        ch.updated_at

    FROM combined_chats AS ch
    ORDER BY ch.updated_at DESC;

END;
$function$;


-- ============================================================================
-- 15. RPC SECURITY
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.get_umkm_recent_chat_history(TEXT, TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_umkm_recent_chat_history(TEXT, TEXT)
TO authenticated, service_role;


-- ============================================================================
-- 16. FINAL STRUCTURAL VALIDATION
-- ============================================================================

DO $$
DECLARE
    v_table TEXT;
    v_missing BIGINT;
BEGIN

    FOREACH v_table IN ARRAY ARRAY[
        'umkm_ai_assistant_chats',
        'umkm_zega_copilot_chats',
        'umkm_live_help_chats',
        'umkm_finance_ai_chats'
    ]
    LOOP

        EXECUTE format(
            'SELECT COUNT(*)
             FROM public.%I c
             LEFT JOIN public.umkm_stores s
               ON s.id = c.store_id
             WHERE c.store_id IS NOT NULL
               AND s.id IS NULL',
            v_table
        )
        INTO v_missing;

        IF v_missing > 0 THEN
            RAISE EXCEPTION
            USING
                ERRCODE = '23503',
                MESSAGE = format(
                    'FINAL_CHAT_VALIDATION_FAILED: %s has %s invalid store references',
                    v_table,
                    v_missing
                );
        END IF;

    END LOOP;
END $$;


-- ============================================================================
-- 17. COMMENTS / ARCHITECTURAL CONTRACT
-- ============================================================================

COMMENT ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID)
IS
'Canonical ZEGA tenant/store authorization. Validates actual umkm_stores.id,
organization relationship, workspace relationship, canonical application user,
and active organization membership. Fail-closed.';

COMMENT ON FUNCTION public.fn_current_app_user_id()
IS
'Canonical ZEGA application identity resolver. Maps auth.uid() exclusively
through public.users.auth_user_id to public.users.id. Missing/ambiguous
mapping returns NULL.';

COMMENT ON FUNCTION public.get_umkm_recent_chat_history(TEXT, TEXT)
IS
'Canonical persistent chat history across ZEGA AI assistants. Caller-supplied
user ID is never trusted; authorization is derived from canonical authenticated
application identity and store tenant access.';