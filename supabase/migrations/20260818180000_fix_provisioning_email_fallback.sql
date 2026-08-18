-- ============================================================================
-- ZEGA AI
-- Migration: 20260818180000_fix_provisioning_email_fallback.sql
--
-- PURPOSE
--   Harden individual UMKM tenant provisioning without changing DB schema.
--
-- GUARANTEES
--   - authenticated user required
--   - canonical public.users identity
--   - supports multiple tenants/stores per user
--   - does NOT arbitrarily select the user's first organization/store
--   - organization/workspace/store remain internally consistent
--   - idempotent for the same store name
--   - fail-closed on broken existing tenant relationships
--   - no store_id -> workspace_id fallback
--   - no empty UUID values
--   - preserves existing function signature
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
    -- ------------------------------------------------------------------------
    -- AUTH / USER
    -- ------------------------------------------------------------------------
    v_auth_user_id UUID;
    v_canonical_user_id UUID;

    v_user_email TEXT;
    v_owner_name TEXT;

    -- ------------------------------------------------------------------------
    -- TENANT
    -- ------------------------------------------------------------------------
    v_org_id UUID;
    v_workspace_id UUID;
    v_store_id UUID;

    v_store_name TEXT;
    v_org_name TEXT;

    -- ------------------------------------------------------------------------
    -- EXISTING RELATION VALIDATION
    -- ------------------------------------------------------------------------
    v_existing_store_org_id UUID;
    v_existing_store_workspace_id UUID;

    v_workspace_org_id UUID;
    v_workspace_owner_id UUID;

    v_org_owner_id UUID;

    -- ------------------------------------------------------------------------
    -- STATE
    -- ------------------------------------------------------------------------
    v_store_exists BOOLEAN := FALSE;
    v_workspace_exists BOOLEAN := FALSE;
    v_org_exists BOOLEAN := FALSE;

BEGIN
    -- ========================================================================
    -- 1. AUTHENTICATION
    -- ========================================================================

    v_auth_user_id := auth.uid();

    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'AUTH_CONTEXT_UNAVAILABLE';
    END IF;

    -- ========================================================================
    -- 2. SERIALIZE PROVISIONING PER AUTH USER
    --
    -- Prevent concurrent React effects / multiple components from creating
    -- duplicate organizations, workspaces, or stores.
    -- ========================================================================

    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            v_auth_user_id::TEXT,
            421283
        )
    );

    -- ========================================================================
    -- 3. NORMALIZE STORE NAME
    -- ========================================================================

    v_store_name :=
        COALESCE(
            NULLIF(BTRIM(p_store_name), ''),
            'Toko UMKM ZEGA'
        );

    -- ========================================================================
    -- 4. RESOLVE CANONICAL public.users
    -- ========================================================================

    SELECT
        u.id,
        NULLIF(BTRIM(u.email), '')
    INTO
        v_canonical_user_id,
        v_user_email
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_user_id
    LIMIT 1;

    -- ========================================================================
    -- 5. CREATE public.users IF MISSING
    -- ========================================================================

    IF v_canonical_user_id IS NULL THEN

        SELECT
            COALESCE(
                NULLIF(BTRIM(au.email), ''),
                NULLIF(BTRIM(au.raw_user_meta_data ->> 'email'), '')
            ),
            COALESCE(
                NULLIF(BTRIM(au.raw_user_meta_data ->> 'full_name'), ''),
                NULLIF(BTRIM(au.raw_user_meta_data ->> 'name'), ''),
                'UMKM Owner'
            )
        INTO
            v_user_email,
            v_owner_name
        FROM auth.users AS au
        WHERE au.id = v_auth_user_id;

        -- --------------------------------------------------------------------
        -- Email is required by public.users.
        --
        -- Prefer the real authenticated email.
        -- If the provider does not expose one, use a deterministic internal
        -- placeholder tied to auth.uid().
        -- --------------------------------------------------------------------

        IF v_user_email IS NULL OR v_user_email = '' THEN
            v_user_email :=
                'user_' ||
                REPLACE(v_auth_user_id::TEXT, '-', '') ||
                '@zegaai.site';
        END IF;

        v_owner_name :=
            COALESCE(
                NULLIF(BTRIM(v_owner_name), ''),
                'UMKM Owner'
            );

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
            v_owner_name,
            'umkm'
        )
        ON CONFLICT (auth_user_id)
        DO NOTHING;

        -- --------------------------------------------------------------------
        -- Re-read canonical user after concurrent-safe insert.
        -- --------------------------------------------------------------------

        SELECT
            u.id,
            NULLIF(BTRIM(u.email), '')
        INTO
            v_canonical_user_id,
            v_user_email
        FROM public.users AS u
        WHERE u.auth_user_id = v_auth_user_id
        LIMIT 1;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'CANONICAL_USER_PROVISIONING_FAILED';
    END IF;

    -- ========================================================================
    -- 6. FIND EXISTING STORE FOR THIS USER + REQUESTED STORE NAME
    --
    -- IMPORTANT:
    -- DO NOT:
    --   ORDER BY created_at LIMIT 1
    --
    -- because one user may own multiple tenants/stores.
    --
    -- The requested store name identifies the tenant to ensure.
    -- ========================================================================

    SELECT
        s.id,
        s.organization_id,
        s.workspace_id
    INTO
        v_store_id,
        v_existing_store_org_id,
        v_existing_store_workspace_id
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id
      AND LOWER(BTRIM(s.store_name)) = LOWER(v_store_name)
    ORDER BY s.created_at ASC
    LIMIT 1;

    v_store_exists := v_store_id IS NOT NULL;

    -- ========================================================================
    -- 7. EXISTING STORE PATH
    --
    -- If this tenant already exists, preserve its organization/workspace.
    -- NEVER silently attach it to another organization/workspace.
    -- ========================================================================

    IF v_store_exists THEN

        v_org_id := v_existing_store_org_id;
        v_workspace_id := v_existing_store_workspace_id;

        -- --------------------------------------------------------------------
        -- Existing store must have organization.
        -- --------------------------------------------------------------------

        IF v_org_id IS NULL THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'EXISTING_STORE_ORGANIZATION_CONTEXT_MISSING';
        END IF;

        -- --------------------------------------------------------------------
        -- Verify organization exists.
        -- --------------------------------------------------------------------

        SELECT
            TRUE,
            o.owner_id
        INTO
            v_org_exists,
            v_org_owner_id
        FROM public.organizations AS o
        WHERE o.id = v_org_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'EXISTING_STORE_ORGANIZATION_NOT_FOUND';
        END IF;

        -- --------------------------------------------------------------------
        -- Verify current user is a member of the organization.
        -- --------------------------------------------------------------------

        IF NOT EXISTS (
            SELECT 1
            FROM public.organization_members AS om
            WHERE om.organization_id = v_org_id
              AND om.user_id = v_canonical_user_id
              AND COALESCE(om.status, 'active') = 'active'
        ) THEN

            -- If this is genuinely the user's owned store but membership is
            -- missing, repair membership only.
            INSERT INTO public.organization_members (
                organization_id,
                user_id,
                role
            )
            VALUES (
                v_org_id,
                v_canonical_user_id,
                CASE
                    WHEN v_org_owner_id = v_canonical_user_id
                        THEN 'owner'
                    ELSE 'member'
                END
            )
            ON CONFLICT (organization_id, user_id)
            DO NOTHING;
        END IF;

        -- --------------------------------------------------------------------
        -- Existing store MUST have workspace.
        -- Do not substitute store_id.
        -- --------------------------------------------------------------------

        IF v_workspace_id IS NULL THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'EXISTING_STORE_WORKSPACE_CONTEXT_MISSING';
        END IF;

        -- --------------------------------------------------------------------
        -- Verify workspace exists and belongs to SAME organization.
        -- --------------------------------------------------------------------

        SELECT
            TRUE,
            w.organization_id,
            w.owner_id
        INTO
            v_workspace_exists,
            v_workspace_org_id,
            v_workspace_owner_id
        FROM public.workspaces AS w
        WHERE w.id = v_workspace_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'EXISTING_STORE_WORKSPACE_NOT_FOUND';
        END IF;

        IF v_workspace_org_id IS DISTINCT FROM v_org_id THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'TENANT_CONTEXT_RELATIONSHIP_INVALID',
                DETAIL =
                    'Store, organization, and workspace do not belong to the same tenant.';
        END IF;

        -- --------------------------------------------------------------------
        -- Existing store is valid.
        -- Activate it without changing its tenant relationship.
        -- --------------------------------------------------------------------

        UPDATE public.umkm_stores
        SET
            is_active = TRUE
        WHERE id = v_store_id
          AND user_id = v_canonical_user_id;

    ELSE

        -- ====================================================================
        -- 8. NEW TENANT PATH
        --
        -- No matching store exists for this user + requested name.
        --
        -- Create a NEW organization/workspace/store.
        --
        -- This allows:
        --
        -- User
        --   ├── Tenant A
        --   ├── Tenant B
        --   └── Tenant C
        --
        -- without stealing/reusing another tenant.
        -- ====================================================================

        v_org_name := v_store_name || ' Org';

        -- --------------------------------------------------------------------
        -- Create organization.
        -- --------------------------------------------------------------------

        INSERT INTO public.organizations (
            id,
            name,
            slug,
            owner_id
        )
        VALUES (
            gen_random_uuid(),
            v_org_name,
            'org-' ||
                SUBSTRING(
                    REPLACE(v_canonical_user_id::TEXT, '-', '')
                    FROM 1 FOR 8
                ) ||
                '-' ||
                SUBSTRING(
                    REPLACE(gen_random_uuid()::TEXT, '-', '')
                    FROM 1 FOR 8
                ),
            v_canonical_user_id
        )
        RETURNING id INTO v_org_id;

        -- --------------------------------------------------------------------
        -- Create owner membership.
        -- --------------------------------------------------------------------

        INSERT INTO public.organization_members (
            organization_id,
            user_id,
            role
        )
        VALUES (
            v_org_id,
            v_canonical_user_id,
            'owner'
        )
        ON CONFLICT (organization_id, user_id)
        DO UPDATE
        SET role = 'owner';

        -- --------------------------------------------------------------------
        -- Create workspace belonging to EXACT organization.
        -- --------------------------------------------------------------------

        INSERT INTO public.workspaces (
            id,
            organization_id,
            name,
            slug,
            owner_id
        )
        VALUES (
            gen_random_uuid(),
            v_org_id,
            'Main Workspace',
            'ws-' ||
                SUBSTRING(
                    REPLACE(v_org_id::TEXT, '-', '')
                    FROM 1 FOR 8
                ),
            v_canonical_user_id
        )
        RETURNING id INTO v_workspace_id;

        -- --------------------------------------------------------------------
        -- Create store belonging to EXACT organization + workspace.
        -- --------------------------------------------------------------------

        INSERT INTO public.umkm_stores (
            id,
            user_id,
            organization_id,
            workspace_id,
            store_name,
            is_active
        )
        VALUES (
            gen_random_uuid(),
            v_canonical_user_id,
            v_org_id,
            v_workspace_id,
            v_store_name,
            TRUE
        )
        RETURNING id INTO v_store_id;

    END IF;

    -- ========================================================================
    -- 9. FINAL TENANT INTEGRITY VALIDATION
    --
    -- NEVER return "ok": true unless all relationships are valid.
    -- ========================================================================

    IF v_org_id IS NULL
       OR v_workspace_id IS NULL
       OR v_store_id IS NULL THEN

        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_CONTEXT_INCOMPLETE';
    END IF;

    -- Organization must exist.
    IF NOT EXISTS (
        SELECT 1
        FROM public.organizations AS o
        WHERE o.id = v_org_id
    ) THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_ORGANIZATION_NOT_FOUND';
    END IF;

    -- Workspace must exist and belong to organization.
    IF NOT EXISTS (
        SELECT 1
        FROM public.workspaces AS w
        WHERE w.id = v_workspace_id
          AND w.organization_id = v_org_id
    ) THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_WORKSPACE_RELATION_INVALID';
    END IF;

    -- Store must exist and belong to EXACT same organization/workspace/user.
    IF NOT EXISTS (
        SELECT 1
        FROM public.umkm_stores AS s
        WHERE s.id = v_store_id
          AND s.user_id = v_canonical_user_id
          AND s.organization_id = v_org_id
          AND s.workspace_id = v_workspace_id
    ) THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_STORE_RELATION_INVALID';
    END IF;

    -- Organization membership must exist.
    IF NOT EXISTS (
        SELECT 1
        FROM public.organization_members AS om
        WHERE om.organization_id = v_org_id
          AND om.user_id = v_canonical_user_id
          AND COALESCE(om.status, 'active') = 'active'
    ) THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_MEMBERSHIP_INVALID';
    END IF;

    -- ========================================================================
    -- 10. RETURN CANONICAL TENANT CONTEXT
    --
    -- This exact object must be consumed by ChatSessionManager.
    -- Do NOT reconstruct these IDs on the frontend.
    -- ========================================================================

    RETURN jsonb_build_object(
        'ok', TRUE,
        'storeId', v_store_id,
        'organizationId', v_org_id,
        'workspaceId', v_workspace_id,
        'userId', v_canonical_user_id,
        'authUserId', v_auth_user_id,
        'email', v_user_email,
        'storeName', v_store_name
    );

END;
$function$;


-- ============================================================================
-- PRIVILEGE HARDENING
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
TO service_role;


COMMENT ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
IS
'Idempotently resolves or provisions an authenticated user tenant without changing schema. Supports multiple user-owned tenants by resolving the requested store name, preserves existing organization/workspace relationships, validates tenant integrity before returning, and fails closed on inconsistent tenant state.';