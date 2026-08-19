-- ============================================================================
-- ZEGA AI PLATFORM — HARDEN CHAT TENANT BOUNDARY STORE FALLBACK REPAIR
-- Migration: 20260819190000_fix_store_not_exist_tenant_boundary_trigger_fallback.sql
--
-- PURPOSE:
--   Fix TENANT_BOUNDARY_VIOLATION ("store <id> does not exist") when client sends
--   a stale or unverified store_id during chat session creation.
--   Enables auto-fallback to user's canonical store in public.umkm_stores or auto-provisioning
--   if the provided store_id is invalid/missing in the database graph.
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

    v_found_store_id UUID := NULL;
    v_store_org_id UUID := NULL;
    v_store_workspace_id UUID := NULL;
    v_store_user_id UUID := NULL;

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
    -- C. RESOLVE EXACT STORE & TENANT GRAPH (WITH STALE STORE FALLBACK)
    -- ========================================================================
    -- Step C1: Check if NEW.store_id exists in umkm_stores
    IF NEW.store_id IS NOT NULL THEN
        SELECT
            s.id,
            s.organization_id,
            s.workspace_id,
            s.user_id
        INTO
            v_found_store_id,
            v_store_org_id,
            v_store_workspace_id,
            v_store_user_id
        FROM public.umkm_stores AS s
        WHERE s.id = NEW.store_id
        LIMIT 1;
    END IF;

    -- Step C2: Fallback — if NEW.store_id was invalid/missing, resolve user's store in umkm_stores
    IF v_found_store_id IS NULL THEN
        SELECT
            s.id,
            s.organization_id,
            s.workspace_id,
            s.user_id
        INTO
            v_found_store_id,
            v_store_org_id,
            v_store_workspace_id,
            v_store_user_id
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_app_user_id
           OR (v_auth_uid IS NOT NULL AND s.user_id = v_auth_uid)
        ORDER BY s.created_at DESC
        LIMIT 1;

        IF v_found_store_id IS NOT NULL THEN
            NEW.store_id := v_found_store_id;
        END IF;
    END IF;

    -- Step C3: Fallback — if user has no store in umkm_stores, attempt auto-provisioning store
    IF v_found_store_id IS NULL THEN
        BEGIN
            PERFORM public.fn_ensure_individual_umkm_tenant(v_app_user_id);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore provisioning RPC exception and fallback to direct lookup
            NULL;
        END;

        SELECT
            s.id,
            s.organization_id,
            s.workspace_id,
            s.user_id
        INTO
            v_found_store_id,
            v_store_org_id,
            v_store_workspace_id,
            v_store_user_id
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_app_user_id
           OR (v_auth_uid IS NOT NULL AND s.user_id = v_auth_uid)
        ORDER BY s.created_at DESC
        LIMIT 1;

        IF v_found_store_id IS NOT NULL THEN
            NEW.store_id := v_found_store_id;
        END IF;
    END IF;

    -- Final Assertion: Check that store exists and store_id is valid
    IF NEW.store_id IS NULL OR v_found_store_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_BOUNDARY_VIOLATION: store_id is required and store record does not exist in database';
    END IF;

    IF v_store_org_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: store %s has no organization', NEW.store_id);
    END IF;

    -- ========================================================================
    -- D. AUTHORIZATION CHECK (Direct Ownership or Org Membership)
    -- ========================================================================
    v_has_store_access :=
        (v_store_user_id = v_app_user_id)
        OR
        (v_auth_uid IS NOT NULL AND v_store_user_id = v_auth_uid)
        OR
        public.fn_is_org_member(v_store_org_id);

    IF NOT v_has_store_access THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = format('TENANT_BOUNDARY_VIOLATION: user %s is not authorized for store %s', v_app_user_id, NEW.store_id);
    END IF;

    -- ========================================================================
    -- E. CANONICAL ORGANIZATION ASSIGNMENT
    -- ========================================================================
    IF NEW.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM v_store_org_id THEN
        -- Override mismatched organization with canonical store organization
        NEW.organization_id := v_store_org_id;
    ELSE
        NEW.organization_id := v_store_org_id;
    END IF;

    -- ========================================================================
    -- F. CANONICAL WORKSPACE ASSIGNMENT
    -- ========================================================================
    IF v_store_workspace_id IS NOT NULL THEN
        NEW.workspace_id := v_store_workspace_id;
    ELSE
        IF NEW.workspace_id IS NOT NULL THEN
            SELECT w.organization_id INTO v_workspace_org_id
            FROM public.workspaces AS w
            WHERE w.id = NEW.workspace_id
            LIMIT 1;

            IF NOT FOUND THEN
                -- If provided workspace does not exist, resolve first workspace for store org
                SELECT w.id INTO v_store_workspace_id
                FROM public.workspaces AS w
                WHERE w.organization_id = v_store_org_id
                ORDER BY w.created_at ASC
                LIMIT 1;

                NEW.workspace_id := v_store_workspace_id;
            ELSIF v_workspace_org_id IS DISTINCT FROM v_store_org_id THEN
                -- Workspace belongs to different org, pick workspace for store org
                SELECT w.id INTO v_store_workspace_id
                FROM public.workspaces AS w
                WHERE w.organization_id = v_store_org_id
                ORDER BY w.created_at ASC
                LIMIT 1;

                NEW.workspace_id := v_store_workspace_id;
            END IF;
        ELSE
            SELECT w.id INTO v_store_workspace_id
            FROM public.workspaces AS w
            WHERE w.organization_id = v_store_org_id
            ORDER BY w.created_at ASC
            LIMIT 1;

            NEW.workspace_id := v_store_workspace_id;
        END IF;
    END IF;

    -- ========================================================================
    -- G. FINAL NON-NULL ASSERTIONS
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
