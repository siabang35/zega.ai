-- ============================================================================
-- ZEGA AI PLATFORM
-- SURGICAL RLS RECURSION REPAIR + STRICT TENANT PROVISIONING
--
-- Purpose:
--   1. Eliminate known 42P17 recursion on organization_members.
--   2. Close direct membership writes for normal authenticated users.
--   3. Establish one FK-aware canonical application-user resolver.
--   4. Use the same identity in RLS/helper/provisioning.
--   5. Fix current provisioning AUTH_IDENTITY_NOT_FOUND failure.
--   6. Keep provisioning atomic, advisory-locked, and idempotent.
--   7. Preserve strict multi-tenant boundaries.
--
-- Security invariants:
--   - No schema changes.
--   - No FK changes.
--   - No tenant ownership data mutation outside legitimate provisioning.
--   - No synthetic user IDs.
--   - No email-based identity rebinding.
--   - No authenticated membership INSERT/UPDATE/DELETE policy.
--   - No broad GRANT ALL to authenticated.
--   - No service_role in browser.
-- ============================================================================


-- ============================================================================
-- 0. KEEP RLS HARDENED
-- ============================================================================

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces FORCE ROW LEVEL SECURITY;

ALTER TABLE public.umkm_stores ENABLE ROW LEVEL SECURITY;

-- Only preserve FORCE RLS if it already exists/has been intentionally enabled.
-- Do not introduce weaker semantics.
ALTER TABLE public.umkm_stores FORCE ROW LEVEL SECURITY;


-- ============================================================================
-- 1. REMOVE KNOWN LEGACY / RECURSIVE organization_members POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "tenant_select_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "tenant_insert_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "tenant_update_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "tenant_delete_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "Members can view org members"
    ON public.organization_members;

DROP POLICY IF EXISTS "org_members_select_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "org_members_direct_select_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "org_members_direct_insert_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "org_members_direct_update_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "org_members_direct_delete_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "org_members_select_own"
    ON public.organization_members;


-- ============================================================================
-- 2. CANONICAL APPLICATION USER IDENTITY
--
-- One resolver for the identity expected by organization_members.user_id.
--
-- IMPORTANT:
--   Do NOT use:
--       u.auth_user_id = auth.uid() OR u.id = auth.uid()
--
-- That would treat two different identity domains as interchangeable.
--
-- The resolver first inspects the LIVE FK target:
--
--   organization_members.user_id -> public.users.id
--       => resolve public.users.id via auth_user_id
--
--   organization_members.user_id -> auth.users.id
--       => use auth.uid()
--
-- Unknown contract => NULL / fail closed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();

    v_target_schema TEXT;
    v_target_table TEXT;
    v_target_column TEXT;

    v_app_user_id UUID;
BEGIN
    -- ------------------------------------------------------------------------
    -- No authenticated principal = no canonical identity.
    -- ------------------------------------------------------------------------
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;


    -- ------------------------------------------------------------------------
    -- Inspect the real FK target from pg_catalog.
    -- ------------------------------------------------------------------------
    SELECT
        ns.nspname,
        cls.relname,
        att.attname
    INTO
        v_target_schema,
        v_target_table,
        v_target_column
    FROM pg_constraint con
    JOIN pg_class cls
        ON cls.oid = con.confrelid
    JOIN pg_namespace ns
        ON ns.oid = cls.relnamespace
    JOIN LATERAL unnest(con.confkey) WITH ORDINALITY fk(attnum, ord)
        ON TRUE
    JOIN pg_attribute att
        ON att.attrelid = cls.oid
       AND att.attnum = fk.attnum
    WHERE con.conname = 'organization_members_user_id_fkey'
      AND con.contype = 'f'
    ORDER BY fk.ord
    LIMIT 1;


    -- ------------------------------------------------------------------------
    -- Application-user identity model:
    --
    -- auth.users.id
    --       |
    --       v
    -- public.users.auth_user_id
    --       |
    --       v
    -- public.users.id
    -- ------------------------------------------------------------------------
    IF v_target_schema = 'public'
       AND v_target_table = 'users'
       AND v_target_column = 'id'
    THEN

        SELECT u.id
        INTO v_app_user_id
        FROM public.users AS u
        WHERE u.auth_user_id = v_auth_uid
        LIMIT 1;

        RETURN v_app_user_id;
    END IF;


    -- ------------------------------------------------------------------------
    -- Direct Supabase Auth identity model:
    --
    -- organization_members.user_id -> auth.users.id
    -- ------------------------------------------------------------------------
    IF v_target_schema = 'auth'
       AND v_target_table = 'users'
       AND v_target_column = 'id'
    THEN
        RETURN v_auth_uid;
    END IF;


    -- ------------------------------------------------------------------------
    -- Unknown FK contract => fail closed.
    -- ------------------------------------------------------------------------
    RETURN NULL;
END;
$function$;


-- Public RPC invocation requires EXECUTE permission, including if the helper
-- is referenced inside an RLS policy.
REVOKE EXECUTE
ON FUNCTION public.fn_current_app_user_id()
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.fn_current_app_user_id()
FROM anon;

GRANT EXECUTE
ON FUNCTION public.fn_current_app_user_id()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.fn_current_app_user_id()
TO service_role;


-- ============================================================================
-- 3. ONE STRICT organization_members SELECT POLICY
--
-- Normal authenticated users can see only their own membership rows.
--
-- NO INSERT / UPDATE / DELETE policy is created for authenticated users.
-- This prevents self-enrollment into arbitrary tenants.
-- ============================================================================

CREATE POLICY "org_members_select_own"
ON public.organization_members
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()
);


-- ============================================================================
-- 4. HARDEN fn_is_org_member
--
-- Single responsibility:
--   determine active membership of current principal in organization.
--
-- It MUST NOT query:
--   umkm_stores
--   organizations
--   workspaces
--
-- This prevents recursive authorization graphs.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_is_org_member(
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
    SELECT
        public.fn_current_app_user_id() IS NOT NULL
        AND p_org_id IS NOT NULL
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
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
TO service_role;


-- ============================================================================
-- 5. AUTH CONTEXT DIAGNOSTIC
--
-- This is diagnostic only. It does not mutate any data.
-- It never exposes the raw JWT/token.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_debug_current_auth_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
    v_uid UUID := auth.uid();
    v_role TEXT := auth.role();

    v_jwt_sub TEXT := auth.jwt() ->> 'sub';
    v_jwt_email TEXT := auth.jwt() ->> 'email';

    v_has_auth_user BOOLEAN := FALSE;
    v_canonical_user_id UUID;
BEGIN

    IF v_uid IS NOT NULL THEN

        SELECT EXISTS (
            SELECT 1
            FROM auth.users AS au
            WHERE au.id = v_uid
        )
        INTO v_has_auth_user;

        v_canonical_user_id :=
            public.fn_current_app_user_id();

    END IF;


    RETURN jsonb_build_object(
        'auth_uid', v_uid,
        'auth_role', v_role,
        'jwt_sub', v_jwt_sub,
        'jwt_email', v_jwt_email,
        'has_auth_user', v_has_auth_user,
        'canonical_app_user_id', v_canonical_user_id
    );
END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.fn_debug_current_auth_context()
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.fn_debug_current_auth_context()
FROM anon;

GRANT EXECUTE
ON FUNCTION public.fn_debug_current_auth_context()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.fn_debug_current_auth_context()
TO service_role;


-- ============================================================================
-- 6. CANONICAL UMKM TENANT PROVISIONING RPC
--
-- IMPORTANT:
--   auth.uid() is the authenticated principal.
--   canonical_user_id is resolved according to the live FK contract.
--
-- Client is allowed to provide only:
--   p_store_name
--
-- Client MUST NOT provide:
--   user_id
--   organization_id
--   workspace_id
--   store_id
--
-- The function is:
--   SECURITY DEFINER
--   atomic
--   idempotent
--   advisory-locked
--   fail-closed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_store_name TEXT DEFAULT 'Toko UMKM ZEGA'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
    v_auth_user_id UUID := auth.uid();
    v_canonical_user_id UUID;

    v_user_email TEXT;
    v_owner_name TEXT;

    v_org_id UUID;
    v_workspace_id UUID;
    v_store_id UUID;

    v_existing_store RECORD;
    v_existing_membership RECORD;

    v_store_target_schema TEXT;
    v_store_target_table TEXT;
    v_store_target_column TEXT;
BEGIN

    -- ========================================================================
    -- A. AUTH CONTEXT
    -- ========================================================================

    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'AUTH_CONTEXT_UNAVAILABLE: authenticated session required';
    END IF;


    -- ========================================================================
    -- B. CANONICAL APPLICATION IDENTITY
    --
    -- IMPORTANT:
    -- Do NOT require a direct SELECT against auth.users here as the auth gate.
    -- auth.uid() is the authenticated request principal.
    --
    -- The actual application identity requirement is resolved by:
    -- fn_current_app_user_id()
    -- ========================================================================

    v_canonical_user_id :=
        public.fn_current_app_user_id();

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '22023',
            MESSAGE =
                'IDENTITY_MAPPING_ERROR: canonical application user mapping not found';
    END IF;


    -- ========================================================================
    -- C. RESOLVE EMAIL AS METADATA, NOT IDENTITY
    --
    -- Prefer JWT claim. If missing, try application-user metadata when
    -- available. Do not create or rebind identities.
    -- ========================================================================

    v_user_email :=
        NULLIF(
            btrim(auth.jwt() ->> 'email'),
            ''
        );


    IF v_user_email IS NULL THEN

        SELECT u.email
        INTO v_user_email
        FROM public.users AS u
        WHERE u.id = v_canonical_user_id
        LIMIT 1;

    END IF;


    IF v_user_email IS NULL THEN

        SELECT au.email
        INTO v_user_email
        FROM auth.users AS au
        WHERE au.id = v_auth_user_id
        LIMIT 1;

    END IF;


    IF v_user_email IS NULL OR btrim(v_user_email) = '' THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '22023',
            MESSAGE =
                'IDENTITY_EMAIL_UNAVAILABLE: authenticated identity has no email metadata';
    END IF;


    v_owner_name :=
        NULLIF(
            btrim(split_part(v_user_email, '@', 1)),
            ''
        );


    IF v_owner_name IS NULL THEN
        v_owner_name := 'Owner';
    END IF;


    -- ========================================================================
    -- D. PER-USER ADVISORY LOCK
    -- ========================================================================

    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            v_auth_user_id::text,
            421283
        )
    );


    -- ========================================================================
    -- E. EXISTING STORE = RETURN EXISTING CONTEXT
    -- ========================================================================

    SELECT
        s.id,
        s.organization_id,
        s.workspace_id
    INTO
        v_existing_store
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id
    ORDER BY s.created_at ASC
    LIMIT 1;


    IF v_existing_store.id IS NOT NULL THEN

        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'store_id', v_existing_store.id,
            'organization_id', v_existing_store.organization_id,
            'workspace_id', v_existing_store.workspace_id
        );

    END IF;


    -- ========================================================================
    -- F. EXISTING ACTIVE MEMBERSHIP
    --
    -- Store absence does NOT mean tenant absence.
    -- Reuse an existing valid organization first.
    -- ========================================================================

    SELECT
        om.organization_id
    INTO
        v_existing_membership
    FROM public.organization_members AS om
    WHERE om.user_id = v_canonical_user_id
      AND COALESCE(om.status, 'active') = 'active'
    ORDER BY om.created_at ASC
    LIMIT 1;


    IF v_existing_membership.organization_id IS NOT NULL THEN
        v_org_id := v_existing_membership.organization_id;
    END IF;


    -- ========================================================================
    -- G. EXISTING ACTIVE WORKSPACE
    -- ========================================================================

    IF v_org_id IS NOT NULL THEN

        SELECT w.id
        INTO v_workspace_id
        FROM public.workspaces AS w
        WHERE w.organization_id = v_org_id
          AND COALESCE(w.status, 'active') = 'active'
        ORDER BY w.created_at ASC
        LIMIT 1;

    END IF;


    -- ========================================================================
    -- H. CREATE ORGANIZATION ONLY IF NEEDED
    -- ========================================================================

    IF v_org_id IS NULL THEN

        INSERT INTO public.organizations (
            name,
            slug,
            tenant_type,
            plan,
            status
        )
        VALUES (
            COALESCE(
                NULLIF(btrim(p_store_name), ''),
                'Toko UMKM ZEGA'
            ) || ' Business',

            'umkm-org-' ||
            lower(
                substr(
                    md5(
                        v_auth_user_id::text ||
                        clock_timestamp()::text
                    ),
                    1,
                    16
                )
            ),

            'umkm',
            'Starter',
            'active'
        )
        RETURNING id
        INTO v_org_id;


        -- Trusted membership mutation.
        INSERT INTO public.organization_members (
            organization_id,
            user_id,
            role,
            status
        )
        VALUES (
            v_org_id,
            v_canonical_user_id,
            'owner',
            'active'
        )
        ON CONFLICT (
            organization_id,
            user_id
        )
        DO UPDATE
        SET status = 'active';

    END IF;


    -- ========================================================================
    -- I. CREATE WORKSPACE ONLY IF NEEDED
    -- ========================================================================

    IF v_workspace_id IS NULL THEN

        INSERT INTO public.workspaces (
            organization_id,
            name,
            slug,
            status
        )
        VALUES (
            v_org_id,
            'Main Workspace',

            'main-workspace-' ||
            lower(
                substr(
                    md5(
                        v_org_id::text ||
                        clock_timestamp()::text
                    ),
                    1,
                    16
                )
            ),

            'active'
        )
        RETURNING id
        INTO v_workspace_id;

    END IF;


    -- ========================================================================
    -- J. WORKSPACE MEMBERSHIP
    -- ========================================================================

    IF to_regclass('public.workspace_members') IS NOT NULL THEN

        INSERT INTO public.workspace_members (
            workspace_id,
            user_id,
            role
        )
        VALUES (
            v_workspace_id,
            v_canonical_user_id,
            'admin'
        )
        ON CONFLICT (
            workspace_id,
            user_id
        )
        DO NOTHING;

    END IF;


    -- ========================================================================
    -- K. CREATE UMKM STORE
    --
    -- Existing live schema fields only.
    -- ========================================================================

    INSERT INTO public.umkm_stores (
        user_id,
        organization_id,
        workspace_id,
        store_name,
        owner_name,
        email,
        plan,
        is_active
    )
    VALUES (
        v_canonical_user_id,
        v_org_id,
        v_workspace_id,
        COALESCE(
            NULLIF(btrim(p_store_name), ''),
            'Toko UMKM ZEGA'
        ),
        v_owner_name,
        v_user_email,
        'Starter',
        TRUE
    )
    RETURNING id
    INTO v_store_id;


    -- ========================================================================
    -- L. OPTIONAL KPI INITIALIZATION
    -- ========================================================================

    IF to_regclass('public.umkm_dashboard_kpis') IS NOT NULL THEN

        INSERT INTO public.umkm_dashboard_kpis (
            store_id,
            organization_id,
            workspace_id,
            tasks_completed_today,
            hours_saved_weekly,
            revenue_generated_today
        )
        VALUES (
            v_store_id,
            v_org_id,
            v_workspace_id,
            0,
            0,
            0
        )
        ON CONFLICT (store_id)
        DO NOTHING;

    END IF;


    -- ========================================================================
    -- M. FINAL TENANT CONVERGENCE / BOUNDARY CHECK
    --
    -- Store and workspace must resolve to the SAME organization.
    -- ========================================================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.umkm_stores AS s
        JOIN public.workspaces AS w
          ON w.id = s.workspace_id
        WHERE s.id = v_store_id
          AND s.user_id = v_canonical_user_id
          AND s.organization_id = v_org_id
          AND s.workspace_id = v_workspace_id
          AND w.organization_id = v_org_id
    ) THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23514',
            MESSAGE =
                'PROVISIONING_ERROR: tenant convergence validation failed';

    END IF;


    -- ========================================================================
    -- N. RETURN VERIFIED CANONICAL TENANT CONTEXT
    -- ========================================================================

    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', 'CREATED',
        'store_id', v_store_id,
        'organization_id', v_org_id,
        'workspace_id', v_workspace_id
    );

END;
$function$;


-- ============================================================================
-- 7. RPC EXECUTION PRIVILEGES
--
-- This fixes the earlier:
--
--   401 / 42501 permission denied for function
--
-- while keeping the RPC itself narrowly scoped.
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
TO service_role;


-- ============================================================================
-- 8. IMPORTANT: NO DIRECT MEMBERSHIP WRITE POLICIES
--
-- Do not recreate:
--
--   authenticated INSERT organization_members
--   authenticated UPDATE organization_members
--   authenticated DELETE organization_members
--
-- The trusted provisioning RPC above is the mutation authority.
-- ============================================================================