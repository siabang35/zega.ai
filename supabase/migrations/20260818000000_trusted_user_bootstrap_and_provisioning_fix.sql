-- ============================================================================
-- ZEGA AI PLATFORM
-- CANONICAL IDENTITY + STRICT INDIVIDUAL UMKM TENANT PROVISIONING
--
-- CANONICAL IDENTITY:
--
-- auth.users.id
--      |
--      | public.users.auth_user_id
--      v
-- public.users.id
--      |
--      +--> organization_members.user_id
--      |
--      +--> umkm_stores.user_id
--
-- SECURITY CONTRACT:
--   1. auth.users.id is NOT assumed equal to public.users.id
--   2. public.users.id is NEVER mutated
--   3. identity is NEVER rebound by email
--   4. auth.uid() is NEVER used as application user ID fallback
--   5. store.id is NEVER derived from auth.uid()
--   6. no swallowed exceptions
--   7. provisioning is serialized and idempotent
--   8. tenant is READY only after full graph validation
-- ============================================================================


-- ============================================================================
-- 0. REQUIRED EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- 1. REQUIRED SCHEMA PRECHECK
-- ============================================================================

DO $$
BEGIN

    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42P01',
            MESSAGE = 'REQUIRED_TABLE_MISSING: public.users';
    END IF;

    IF to_regclass('public.organization_members') IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42P01',
            MESSAGE = 'REQUIRED_TABLE_MISSING: public.organization_members';
    END IF;

    IF to_regclass('public.umkm_stores') IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42P01',
            MESSAGE = 'REQUIRED_TABLE_MISSING: public.umkm_stores';
    END IF;

    IF to_regclass('public.organizations') IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42P01',
            MESSAGE = 'REQUIRED_TABLE_MISSING: public.organizations';
    END IF;

    IF to_regclass('public.workspaces') IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42P01',
            MESSAGE = 'REQUIRED_TABLE_MISSING: public.workspaces';
    END IF;

END;
$$;


-- ============================================================================
-- 2. VERIFY auth_user_id IS NOT AMBIGUOUS
-- ============================================================================

DO $$
DECLARE
    v_duplicate_count INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO v_duplicate_count
    FROM (
        SELECT auth_user_id
        FROM public.users
        WHERE auth_user_id IS NOT NULL
        GROUP BY auth_user_id
        HAVING COUNT(*) > 1
    ) duplicates;

    IF v_duplicate_count > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23505',
            MESSAGE =
                'IDENTITY_AMBIGUOUS: duplicate public.users.auth_user_id mappings exist';
    END IF;

END;
$$;


-- ============================================================================
-- 3. ENFORCE UNIQUE CANONICAL AUTH MAPPING
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_uidx
ON public.users (auth_user_id)
WHERE auth_user_id IS NOT NULL;


-- ============================================================================
-- 4. REMOVE INVALID ZERO-UUID MEMBERSHIP SENTINELS
--
-- Zero UUID is NEVER a valid application identity.
--
-- Do NOT convert it to auth.uid().
-- Do NOT create a public.users row for it.
-- ============================================================================

DELETE FROM public.organization_members
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;


-- ============================================================================
-- 5. REMEDIATE LEGACY organization_members IDENTITIES
--
-- Historical bad state may contain:
--
-- organization_members.user_id = auth.users.id
--
-- Correct state:
--
-- organization_members.user_id = public.users.id
--
-- Conversion is performed only where:
--
-- public.users.auth_user_id = organization_members.user_id
--
-- and auth_user_id is unique (validated above).
-- ============================================================================

UPDATE public.organization_members AS om
SET user_id = u.id
FROM public.users AS u
WHERE om.user_id = u.auth_user_id
  AND om.user_id IS DISTINCT FROM u.id
  AND u.auth_user_id IS NOT NULL;


-- ============================================================================
-- 6. REMEDIATE LEGACY umkm_stores IDENTITIES
-- ============================================================================

UPDATE public.umkm_stores AS s
SET user_id = u.id
FROM public.users AS u
WHERE s.user_id = u.auth_user_id
  AND s.user_id IS DISTINCT FROM u.id
  AND u.auth_user_id IS NOT NULL;


-- ============================================================================
-- 7. FINAL ORPHAN CHECK BEFORE FK
-- ============================================================================

DO $$
DECLARE
    v_membership_orphans INTEGER;
    v_store_orphans INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO v_membership_orphans
    FROM public.organization_members AS om
    LEFT JOIN public.users AS u
        ON u.id = om.user_id
    WHERE om.user_id IS NOT NULL
      AND u.id IS NULL;


    IF v_membership_orphans > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE =
                'FK_PRECHECK_FAILED: organization_members contains unresolved user_id rows: '
                || v_membership_orphans;
    END IF;


    SELECT COUNT(*)
    INTO v_store_orphans
    FROM public.umkm_stores AS s
    LEFT JOIN public.users AS u
        ON u.id = s.user_id
    WHERE s.user_id IS NOT NULL
      AND u.id IS NULL;


    IF v_store_orphans > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE =
                'FK_PRECHECK_FAILED: umkm_stores contains unresolved user_id rows: '
                || v_store_orphans;
    END IF;

END;
$$;


-- ============================================================================
-- 8. ALIGN organization_members FK
--
-- At this point all existing data has already passed the orphan check.
-- ============================================================================

ALTER TABLE public.organization_members
    DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

ALTER TABLE public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;


-- ============================================================================
-- 9. ALIGN umkm_stores FK
-- ============================================================================

ALTER TABLE public.umkm_stores
    DROP CONSTRAINT IF EXISTS umkm_stores_user_id_fkey;

ALTER TABLE public.umkm_stores
    ADD CONSTRAINT umkm_stores_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;


-- ============================================================================
-- 10. ORGANIZATION MEMBERS RLS
-- ============================================================================

ALTER TABLE public.organization_members
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.organization_members
    FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "tenant_select_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "tenant_insert_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "tenant_update_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "tenant_delete_policy"
    ON public.organization_members;

DROP POLICY IF EXISTS "Members can view org roster"
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


CREATE POLICY "org_members_select_own"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
    user_id = public.fn_current_app_user_id()
);


-- ============================================================================
-- 11. CANONICAL APPLICATION USER RESOLVER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();

    v_app_user_id UUID;

    v_count INTEGER := 0;
BEGIN

    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;


    SELECT
        COUNT(*),
        MAX(u.id)
    INTO
        v_count,
        v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid;


    IF v_count = 1 THEN
        RETURN v_app_user_id;
    END IF;


    -- Zero or multiple mappings = fail closed.
    RETURN NULL;

END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.fn_current_app_user_id()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_current_app_user_id()
TO authenticated, service_role;


-- ============================================================================
-- 12. STRICT ORGANIZATION MEMBERSHIP HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_is_org_member(
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
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
-- 13. CANONICAL UMKM TENANT PROVISIONING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_store_name TEXT DEFAULT 'Toko UMKM ZEGA'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$

DECLARE

    -- ============================================================
    -- AUTH IDENTITY
    -- ============================================================

    v_auth_user_id UUID := auth.uid();


    -- ============================================================
    -- APPLICATION IDENTITY
    -- ============================================================

    v_canonical_user_id UUID;

    v_canonical_user_count INTEGER := 0;


    -- ============================================================
    -- AUTH PROFILE
    -- ============================================================

    v_user_email TEXT;

    v_owner_name TEXT;


    -- ============================================================
    -- TENANT IDs
    -- ============================================================

    v_org_id UUID;

    v_workspace_id UUID;

    v_store_id UUID;


    -- ============================================================
    -- COUNTS
    -- ============================================================

    v_store_count INTEGER := 0;

    v_membership_count INTEGER := 0;

    v_workspace_count INTEGER := 0;


    -- ============================================================
    -- EXISTING RECORDS
    -- ============================================================

    v_store_record RECORD;

BEGIN

    -- ============================================================
    -- A. AUTH CONTEXT
    -- ============================================================

    IF v_auth_user_id IS NULL THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'AUTH_CONTEXT_UNAVAILABLE';

    END IF;


    -- ============================================================
    -- B. SERIALIZE PROVISIONING FOR THIS AUTH USER
    -- ============================================================

    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            v_auth_user_id::text,
            421283
        )
    );


    -- ============================================================
    -- C. LOOKUP CANONICAL public.users MAPPING
    -- ============================================================

    SELECT COUNT(*)
    INTO v_canonical_user_count
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_user_id;


    IF v_canonical_user_count > 1 THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23505',
            MESSAGE = 'IDENTITY_AMBIGUOUS';

    END IF;


    -- ============================================================
    -- D. RESOLVE EXISTING APPLICATION USER
    -- ============================================================

    IF v_canonical_user_count = 1 THEN

        SELECT
            u.id,
            u.email
        INTO
            v_canonical_user_id,
            v_user_email
        FROM public.users AS u
        WHERE u.auth_user_id = v_auth_user_id
        FOR UPDATE;


    ELSE

        -- ========================================================
        -- E. VERIFY AUTH PRINCIPAL
        --
        -- IMPORTANT:
        -- Use FOUND, not email IS NULL.
        --
        -- An auth.users row may theoretically have NULL email.
        -- Existence is determined by the row itself.
        -- ========================================================

        SELECT
            au.email,
            COALESCE(
                au.raw_user_meta_data->>'full_name',
                NULLIF(SPLIT_PART(COALESCE(au.email, ''), '@', 1), ''),
                'UMKM Owner'
            )
        INTO
            v_user_email,
            v_owner_name
        FROM auth.users AS au
        WHERE au.id = v_auth_user_id;


        IF NOT FOUND THEN

            RAISE EXCEPTION
            USING
                ERRCODE = '23503',
                MESSAGE =
                    'AUTH_IDENTITY_NOT_FOUND: auth.users principal missing for auth.uid()';

        END IF;


        -- ========================================================
        -- F. BOOTSTRAP public.users
        --
        -- NEVER:
        --   public.users.id = auth.uid()
        --
        -- NEVER:
        --   bind existing row by email
        -- ========================================================

        INSERT INTO public.users (
            id,
            auth_user_id,
            email,
            full_name,
            role
        )
        VALUES (
            gen_random_uuid(),
            v_auth_user_id,
            v_user_email,
            COALESCE(v_owner_name, 'UMKM Owner'),
            'umkm'
        )
        ON CONFLICT (auth_user_id)
        DO NOTHING
        RETURNING
            id,
            email
        INTO
            v_canonical_user_id,
            v_user_email;


        -- ========================================================
        -- G. RACE-SAFE RE-READ
        -- ========================================================

        IF v_canonical_user_id IS NULL THEN

            SELECT
                u.id,
                u.email
            INTO
                v_canonical_user_id,
                v_user_email
            FROM public.users AS u
            WHERE u.auth_user_id = v_auth_user_id
            FOR UPDATE;

        END IF;

    END IF;


    -- ============================================================
    -- H. FINAL APPLICATION IDENTITY VALIDATION
    -- ============================================================

    IF v_canonical_user_id IS NULL THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE = 'IDENTITY_MAPPING_ERROR';

    END IF;


    -- Explicitly prohibit accidental identity substitution.
    --
    -- They may be equal in some installations, but equality is NOT
    -- used as an identity contract.
    --
    -- canonical user ID comes ONLY from public.users.id.


    v_owner_name :=
        COALESCE(
            NULLIF(
                btrim(
                    split_part(
                        COALESCE(v_user_email, 'Owner'),
                        '@',
                        1
                    )
                ),
                ''
            ),
            'Owner'
        );


    -- ============================================================
    -- I. EXISTING STORE
    -- ============================================================

    SELECT COUNT(*)
    INTO v_store_count
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id;


    IF v_store_count > 1 THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23505',
            MESSAGE = 'TENANT_AMBIGUOUS: MULTIPLE_STORES';

    END IF;


    IF v_store_count = 1 THEN

        SELECT
            s.id,
            s.organization_id,
            s.workspace_id
        INTO
            v_store_record
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_canonical_user_id
        FOR UPDATE;


        -- --------------------------------------------------------
        -- Organization validation
        -- --------------------------------------------------------

        IF NOT EXISTS (
            SELECT 1
            FROM public.organizations AS o
            WHERE o.id = v_store_record.organization_id
        ) THEN

            RAISE EXCEPTION
            USING
                ERRCODE = '23514',
                MESSAGE =
                    'TENANT_CONVERGENCE_FAILED: ORGANIZATION_MISSING';

        END IF;


        -- --------------------------------------------------------
        -- Membership validation
        -- --------------------------------------------------------

        IF NOT EXISTS (
            SELECT 1
            FROM public.organization_members AS om
            WHERE om.organization_id = v_store_record.organization_id
              AND om.user_id = v_canonical_user_id
              AND COALESCE(om.status, 'active') = 'active'
        ) THEN

            RAISE EXCEPTION
            USING
                ERRCODE = '23514',
                MESSAGE =
                    'TENANT_CONVERGENCE_FAILED: MEMBERSHIP_MISSING';

        END IF;


        -- --------------------------------------------------------
        -- Workspace validation
        -- --------------------------------------------------------

        IF NOT EXISTS (
            SELECT 1
            FROM public.workspaces AS w
            WHERE w.id = v_store_record.workspace_id
              AND w.organization_id = v_store_record.organization_id
              AND COALESCE(w.status, 'active') = 'active'
        ) THEN

            RAISE EXCEPTION
            USING
                ERRCODE = '23514',
                MESSAGE =
                    'TENANT_CONVERGENCE_FAILED: WORKSPACE_MISMATCH';

        END IF;


        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'store_id', v_store_record.id,
            'organization_id', v_store_record.organization_id,
            'workspace_id', v_store_record.workspace_id
        );

    END IF;


    -- ============================================================
    -- J. FIND EXISTING ACTIVE MEMBERSHIP
    -- ============================================================

    SELECT COUNT(*)
    INTO v_membership_count
    FROM public.organization_members AS om
    WHERE om.user_id = v_canonical_user_id
      AND COALESCE(om.status, 'active') = 'active';


    IF v_membership_count > 1 THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23505',
            MESSAGE =
                'TENANT_AMBIGUOUS: MULTIPLE_ACTIVE_ORGANIZATIONS';

    END IF;


    IF v_membership_count = 1 THEN

        SELECT
            om.organization_id
        INTO
            v_org_id
        FROM public.organization_members AS om
        WHERE om.user_id = v_canonical_user_id
          AND COALESCE(om.status, 'active') = 'active';

    ELSE

        -- ========================================================
        -- K. CREATE ORGANIZATION
        -- ========================================================

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
                        v_auth_user_id::text
                        || clock_timestamp()::text
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


        -- ========================================================
        -- L. CREATE OWNER MEMBERSHIP
        -- ========================================================

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
        );

    END IF;


    -- ============================================================
    -- M. RESOLVE / CREATE WORKSPACE
    -- ============================================================

    SELECT COUNT(*)
    INTO v_workspace_count
    FROM public.workspaces AS w
    WHERE w.organization_id = v_org_id
      AND COALESCE(w.status, 'active') = 'active';


    IF v_workspace_count > 1 THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23505',
            MESSAGE =
                'TENANT_AMBIGUOUS: MULTIPLE_ACTIVE_WORKSPACES';

    ELSIF v_workspace_count = 1 THEN

        SELECT
            w.id
        INTO
            v_workspace_id
        FROM public.workspaces AS w
        WHERE w.organization_id = v_org_id
          AND COALESCE(w.status, 'active') = 'active';

    ELSE

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
                        v_org_id::text
                        || clock_timestamp()::text
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


    -- ============================================================
    -- N. WORKSPACE MEMBERSHIP
    -- ============================================================

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
        ON CONFLICT (workspace_id, user_id)
        DO NOTHING;

    END IF;


    -- ============================================================
    -- O. CREATE STORE
    -- ============================================================

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


    -- ============================================================
    -- P. OPTIONAL KPI INITIALIZATION
    -- ============================================================

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


    -- ============================================================
    -- Q. FINAL TENANT GRAPH VALIDATION
    -- ============================================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.umkm_stores AS s

        JOIN public.organizations AS o
            ON o.id = s.organization_id

        JOIN public.workspaces AS w
            ON w.id = s.workspace_id
           AND w.organization_id = o.id

        JOIN public.organization_members AS om
            ON om.organization_id = o.id
           AND om.user_id = s.user_id

        WHERE s.id = v_store_id

          AND s.user_id = v_canonical_user_id

          AND s.organization_id = v_org_id

          AND s.workspace_id = v_workspace_id

          AND COALESCE(om.status, 'active') = 'active'
    ) THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '23514',
            MESSAGE = 'PROVISIONING_CONVERGENCE_FAILED';

    END IF;


    -- ============================================================
    -- R. VERIFIED SUCCESS
    -- ============================================================

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
-- 14. EXECUTION PRIVILEGES
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
TO authenticated, service_role;


-- ============================================================================
-- 15. FINAL INTEGRITY CHECK
-- ============================================================================

DO $$
DECLARE
    v_membership_orphans INTEGER;
    v_store_orphans INTEGER;
    v_zero_uuid_memberships INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO v_zero_uuid_memberships
    FROM public.organization_members
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

    IF v_zero_uuid_memberships > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23514',
            MESSAGE =
                'FINAL_INTEGRITY_CHECK_FAILED: zero UUID organization membership remains';
    END IF;


    SELECT COUNT(*)
    INTO v_membership_orphans
    FROM public.organization_members AS om
    LEFT JOIN public.users AS u
        ON u.id = om.user_id
    WHERE om.user_id IS NOT NULL
      AND u.id IS NULL;


    IF v_membership_orphans > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE =
                'FINAL_INTEGRITY_CHECK_FAILED: organization_members orphan count = '
                || v_membership_orphans;
    END IF;


    SELECT COUNT(*)
    INTO v_store_orphans
    FROM public.umkm_stores AS s
    LEFT JOIN public.users AS u
        ON u.id = s.user_id
    WHERE s.user_id IS NOT NULL
      AND u.id IS NULL;


    IF v_store_orphans > 0 THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '23503',
            MESSAGE =
                'FINAL_INTEGRITY_CHECK_FAILED: umkm_stores orphan count = '
                || v_store_orphans;
    END IF;

END;
$$;