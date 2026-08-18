-- ============================================================================
-- ZEGA AI
-- Migration: 20260818190000_harden_auth_user_bootstrap_and_fk_guard.sql
--
-- PURPOSE
--   Harden fn_ensure_individual_umkm_tenant against foreign key 23503 violations
--   when auth.users principal is missing or mismatched.
--
-- GUARANTEES
--   - Validates auth.users presence before attempting public.users INSERT
--   - Auto-recovers existing public.users rows by email if auth_user_id is unlinked
--   - Raises clean, structured AUTH_PRINCIPAL_MISSING error instead of unhandled 23503 FK crash
--   - Idempotent and backward-compatible with existing schema
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
    v_auth_user_exists BOOLEAN := FALSE;

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
    -- 4. RESOLVE CANONICAL public.users BY auth_user_id
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
    -- 5. CREATE OR RECOVER public.users IF MISSING
    -- ========================================================================

    IF v_canonical_user_id IS NULL THEN

        -- Read user email & metadata from auth.users
        SELECT
            TRUE,
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
            v_auth_user_exists,
            v_user_email,
            v_owner_name
        FROM auth.users AS au
        WHERE au.id = v_auth_user_id;

        -- If not found in auth.users by id, check by email if present
        IF NOT COALESCE(v_auth_user_exists, FALSE) THEN
            SELECT
                TRUE,
                au.id,
                au.email,
                COALESCE(
                    NULLIF(BTRIM(au.raw_user_meta_data ->> 'full_name'), ''),
                    'UMKM Owner'
                )
            INTO
                v_auth_user_exists,
                v_auth_user_id,
                v_user_email,
                v_owner_name
            FROM auth.users AS au
            WHERE LOWER(au.email) = LOWER(v_user_email)
            LIMIT 1;
        END IF;

        -- Check if public.users already has a matching row by email
        IF v_user_email IS NOT NULL THEN
            SELECT
                u.id
            INTO
                v_canonical_user_id
            FROM public.users AS u
            WHERE LOWER(BTRIM(u.email)) = LOWER(BTRIM(v_user_email))
            LIMIT 1;

            IF v_canonical_user_id IS NOT NULL AND COALESCE(v_auth_user_exists, FALSE) THEN
                UPDATE public.users
                SET auth_user_id = v_auth_user_id
                WHERE id = v_canonical_user_id
                  AND (auth_user_id IS NULL OR auth_user_id = v_auth_user_id);
            END IF;
        END IF;

        -- If still missing, insert new public.users row ONLY IF auth.users row exists!
        IF v_canonical_user_id IS NULL THEN
            IF NOT COALESCE(v_auth_user_exists, FALSE) THEN
                RAISE EXCEPTION
                USING
                    ERRCODE = '23503',
                    MESSAGE = 'AUTH_PRINCIPAL_MISSING: auth.users record missing for auth.uid()';
            END IF;

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

            -- Re-read canonical user
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
    END IF;

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'CANONICAL_USER_PROVISIONING_FAILED';
    END IF;

    -- ========================================================================
    -- 6. FIND EXISTING STORE FOR THIS USER + REQUESTED STORE NAME
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
    -- ========================================================================

    IF v_store_exists THEN

        v_org_id := v_existing_store_org_id;
        v_workspace_id := v_existing_store_workspace_id;

        IF v_org_id IS NULL THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'EXISTING_STORE_ORGANIZATION_CONTEXT_MISSING';
        END IF;

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

        IF NOT EXISTS (
            SELECT 1
            FROM public.organization_members AS om
            WHERE om.organization_id = v_org_id
              AND om.user_id = v_canonical_user_id
              AND COALESCE(om.status, 'active') = 'active'
        ) THEN
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

        IF v_workspace_id IS NULL THEN
            RAISE EXCEPTION
            USING
                ERRCODE = 'P0001',
                MESSAGE = 'EXISTING_STORE_WORKSPACE_CONTEXT_MISSING';
        END IF;

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

        UPDATE public.umkm_stores
        SET
            is_active = TRUE
        WHERE id = v_store_id
          AND user_id = v_canonical_user_id;

    ELSE

        -- ====================================================================
        -- 8. NEW TENANT PATH
        -- ====================================================================

        v_org_name := v_store_name || ' Org';

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
    -- ========================================================================

    IF v_org_id IS NULL
       OR v_workspace_id IS NULL
       OR v_store_id IS NULL THEN

        RAISE EXCEPTION
        USING
            ERRCODE = 'P0001',
            MESSAGE = 'TENANT_CONTEXT_INCOMPLETE';
    END IF;

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
'Idempotently resolves or provisions an authenticated user tenant with auth.users principal validation to prevent FK 23503 errors.';
