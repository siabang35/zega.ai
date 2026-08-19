-- ============================================================================
-- ZEGA AI PLATFORM — CHAT TENANT BOUNDARY TRIGGER IDENTITY FALLBACK REPAIR
-- Migration: 20260819180000_harden_chat_tenant_boundary_trigger_fallback.sql
--
-- PURPOSE:
--   Fix 42501 TENANT_BOUNDARY_VIOLATION ("authentication context unavailable") errors
--   when client inserts into isolated chat tables during initial bootstrap or external auth sessions.
--   Enables resolving canonical application user identity from NEW.user_id when auth.uid() is NULL.
-- ============================================================================

BEGIN;

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
    -- A. AUTHENTICATION & USER IDENTITY RESOLUTION
    -- ========================================================================
    v_auth_uid := auth.uid();
    v_app_user_id := public.fn_current_app_user_id();

    -- Fallback 1: Resolve from NEW.user_id if auth.uid() is NULL (e.g. Privy / External Auth / REST bootstrap)
    IF v_app_user_id IS NULL AND NEW.user_id IS NOT NULL AND NEW.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT id INTO v_app_user_id
        FROM public.users
        WHERE id = NEW.user_id::UUID OR auth_user_id = NEW.user_id::UUID
        LIMIT 1;
    END IF;

    -- Fallback 2: Try creating/getting current user from app identity state
    IF v_app_user_id IS NULL THEN
        v_app_user_id := public.fn_get_or_create_current_app_user();
    END IF;

    -- If user identity still cannot be resolved, reject insertion (Fail-Closed)
    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: authentication context and canonical user identity unavailable';
    END IF;

    -- ========================================================================
    -- B. CANONICAL USER ID ASSIGNMENT
    -- ========================================================================
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
    -- D. RESOLVE EXACT STORE & TENANT GRAPH
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

    -- ========================================================================
    -- E. AUTHORIZATION CHECK (Direct Ownership or Org Membership)
    -- ========================================================================
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

    -- ========================================================================
    -- F. CANONICAL ORGANIZATION ASSIGNMENT
    -- ========================================================================
    IF NEW.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM v_store_org_id THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: organization mismatch for store %s', NEW.store_id);
    END IF;

    NEW.organization_id := v_store_org_id;

    -- ========================================================================
    -- G. CANONICAL WORKSPACE ASSIGNMENT
    -- ========================================================================
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

    -- ========================================================================
    -- H. FINAL NON-NULL ASSERTIONS
    -- ========================================================================
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

COMMIT;
