-- ============================================================================
-- ZEGA AI
-- Migration: 20260819000000_fix_zega_copilot_chat_tenant_boundary.sql
--
-- PURPOSE
--   Strict zero-trust tenant boundary enforcement for isolated chat tables.
--
-- SECURITY MODEL
--   1. Canonical authenticated application user is resolved server-side.
--   2. Client-provided tenant identifiers are UNTRUSTED.
--   3. store_id MUST identify an existing authorized store.
--   4. NEVER auto-repair an invalid/stale store_id to another store.
--   5. organization_id MUST exactly match store.organization_id.
--   6. workspace_id MUST exactly match store.workspace_id.
--   7. NULL store_id is rejected for tenant-scoped chats.
--   8. User must own the store OR be an active member of its organization.
--   9. Any mismatch fails closed.
--  10. RLS remains the final defense-in-depth layer.
--
-- IMPORTANT:
--   This migration does NOT create a fallback tenant.
--   This migration does NOT silently change tenant context.
--   This migration does NOT repair stale client state.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. STRICT CHAT TENANT BOUNDARY TRIGGER
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
    -- ========================================================================
    -- A. AUTHENTICATION
    -- ========================================================================

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

    -- ========================================================================
    -- B. CANONICAL USER ID
    -- ========================================================================

    -- The database owns user identity.
    -- Never trust a client-provided user_id.

    NEW.user_id := v_app_user_id::TEXT;

    -- ========================================================================
    -- C. STORE IS MANDATORY
    -- ========================================================================

    IF NEW.store_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: store_id is required';
    END IF;

    -- ========================================================================
    -- D. RESOLVE EXACT STORE
    -- ========================================================================

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

    -- NEVER replace an invalid store with another store.
    IF NOT FOUND THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format(
                'TENANT_BOUNDARY_VIOLATION: store %s does not exist',
                NEW.store_id
            );
    END IF;

    -- ========================================================================
    -- E. STORE MUST BELONG TO A VALID TENANT
    -- ========================================================================

    IF v_store_org_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format(
                'TENANT_BOUNDARY_VIOLATION: store %s has no organization',
                NEW.store_id
            );
    END IF;

    -- ========================================================================
    -- F. AUTHORIZATION
    -- ========================================================================

    /*
     * Authorized paths:
     *
     * 1. Direct store ownership
     * 2. Active organization membership
     *
     * No other path is accepted.
     */

    v_has_store_access :=
        v_store_user_id = v_app_user_id
        OR
        public.fn_is_org_member(v_store_org_id);

    IF NOT v_has_store_access THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format(
                'TENANT_BOUNDARY_VIOLATION: user %s is not authorized for store %s',
                v_app_user_id,
                NEW.store_id
            );
    END IF;

    -- ========================================================================
    -- G. CANONICAL ORGANIZATION
    -- ========================================================================

    /*
     * organization_id is derived from the authoritative store.
     *
     * Client may provide organization_id as a consistency assertion,
     * but it cannot override the store's organization.
     */

    IF NEW.organization_id IS NOT NULL
       AND NEW.organization_id IS DISTINCT FROM v_store_org_id
    THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format(
                'TENANT_BOUNDARY_VIOLATION: organization mismatch for store %s',
                NEW.store_id
            );
    END IF;

    NEW.organization_id := v_store_org_id;

    -- ========================================================================
    -- H. CANONICAL WORKSPACE
    -- ========================================================================

    /*
     * workspace_id is part of the tenant boundary.
     *
     * If the store has a workspace:
     *     NEW.workspace_id MUST equal store.workspace_id.
     *
     * We intentionally DO NOT accept another workspace from the same
     * organization.
     */

    IF v_store_workspace_id IS NOT NULL THEN

        IF NEW.workspace_id IS NOT NULL
           AND NEW.workspace_id IS DISTINCT FROM v_store_workspace_id
        THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = format(
                    'TENANT_BOUNDARY_VIOLATION: workspace mismatch for store %s',
                    NEW.store_id
                );
        END IF;

        NEW.workspace_id := v_store_workspace_id;

    ELSE

        /*
         * A store without a workspace is not automatically assigned to an
         * arbitrary workspace here.
         *
         * This prevents silently moving chat data into another workspace.
         *
         * If workspace_id is required by the application's tenant model,
         * provisioning must establish it before chat creation.
         */

        IF NEW.workspace_id IS NOT NULL THEN

            SELECT w.organization_id
            INTO v_workspace_org_id
            FROM public.workspaces AS w
            WHERE w.id = NEW.workspace_id
            LIMIT 1;

            IF NOT FOUND THEN
                RAISE EXCEPTION
                USING
                    ERRCODE = 'P0001',
                    MESSAGE = format(
                        'TENANT_BOUNDARY_VIOLATION: workspace %s does not exist',
                        NEW.workspace_id
                    );
            END IF;

            IF v_workspace_org_id IS DISTINCT FROM v_store_org_id THEN
                RAISE EXCEPTION
                USING
                    ERRCODE = 'P0001',
                    MESSAGE = format(
                        'TENANT_BOUNDARY_VIOLATION: workspace %s does not belong to store organization %s',
                        NEW.workspace_id,
                        v_store_org_id
                    );
            END IF;

        ELSE

            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = format(
                    'TENANT_BOUNDARY_VIOLATION: store %s has no canonical workspace',
                    NEW.store_id
                );

        END IF;

    END IF;

    -- ========================================================================
    -- I. FINAL INVARIANT CHECK
    -- ========================================================================

    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: user_id cannot be NULL';
    END IF;

    IF NEW.store_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: store_id cannot be NULL';
    END IF;

    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: organization_id cannot be NULL';
    END IF;

    IF NEW.workspace_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: workspace_id cannot be NULL';
    END IF;

    RETURN NEW;
END;
$function$;


-- ============================================================================
-- 2. FUNCTION PRIVILEGES
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary()
TO authenticated, service_role;


-- ============================================================================
-- 3. COPILOT CHAT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS
    trg_auto_fill_zega_copilot_chat_tenant
ON public.umkm_zega_copilot_chats;

CREATE TRIGGER
    trg_auto_fill_zega_copilot_chat_tenant
BEFORE INSERT OR UPDATE
ON public.umkm_zega_copilot_chats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary();


-- ============================================================================
-- 4. AI ASSISTANT CHAT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS
    trg_auto_fill_ai_assistant_chat_tenant
ON public.umkm_ai_assistant_chats;

CREATE TRIGGER
    trg_auto_fill_ai_assistant_chat_tenant
BEFORE INSERT OR UPDATE
ON public.umkm_ai_assistant_chats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary();


-- ============================================================================
-- 5. LIVE HELP CHAT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS
    trg_auto_fill_live_help_chat_tenant
ON public.umkm_live_help_chats;

CREATE TRIGGER
    trg_auto_fill_live_help_chat_tenant
BEFORE INSERT OR UPDATE
ON public.umkm_live_help_chats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary();


-- ============================================================================
-- 6. FINANCE AI CHAT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS
    trg_auto_fill_finance_ai_chat_tenant
ON public.umkm_finance_ai_chats;

CREATE TRIGGER
    trg_auto_fill_finance_ai_chat_tenant
BEFORE INSERT OR UPDATE
ON public.umkm_finance_ai_chats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary();


-- ============================================================================
-- 7. DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.fn_trg_auto_fill_chat_tenant_boundary()
IS
'Strict zero-trust tenant boundary enforcement for ZEGA tenant-scoped chat tables. Canonical user identity is server-derived. store_id must exist and be authorized. organization_id and workspace_id are derived/validated against the exact store. Invalid or stale tenant identifiers fail closed and are never automatically repaired to another store.';


COMMIT;