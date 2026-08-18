-- ============================================================================
-- ZEGA AI
-- Migration:
-- 20260818170000_production_chat_persistence_final_repair.sql
--
-- SECURITY MODEL
--
-- auth.uid()
--     ↓
-- public.users.auth_user_id
--     ↓
-- public.users.id
--     ↓
-- organization_members.user_id
--     ↓
-- umkm_stores.user_id
--     ↓
-- chat.user_id
--
-- RULES
--
-- 1. auth.uid() is authentication identity.
-- 2. public.users.id is canonical application identity.
-- 3. organization_members.user_id MUST use public.users.id.
-- 4. umkm_stores.user_id MUST use public.users.id.
-- 5. Chat user_id MUST use public.users.id.
-- 6. Client supplied p_user_id is NEVER trusted for authorization.
-- 7. anon MUST NOT execute tenant/chat RPCs.
-- 8. Never fall back from canonical identity to auth.uid().
-- ============================================================================

BEGIN;


-- ============================================================================
-- 1. CANONICAL APPLICATION USER RESOLVER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID;
    v_app_user_id UUID;
    v_match_count INTEGER;
BEGIN

    v_auth_uid := auth.uid();

    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    /*
     * Canonical mapping:
     *
     * auth.users.id
     *      =
     * auth_user_id
     *
     * public.users.id
     *      =
     * application identity
     */

    SELECT
        COUNT(*)::INTEGER,
        MIN(u.id)
    INTO
        v_match_count,
        v_app_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_uid;

    /*
     * Exactly one mapping is required.
     *
     * 0  -> unresolved
     * >1 -> ambiguous / corrupted
     * 1  -> valid
     */

    IF v_match_count = 1 THEN
        RETURN v_app_user_id;
    END IF;

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
-- 2. STRICT ORGANIZATION MEMBERSHIP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_is_org_member(
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_app_user_id UUID;
BEGIN

    IF p_org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_app_user_id :=
        public.fn_current_app_user_id();

    IF v_app_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members AS om
        WHERE om.organization_id = p_org_id
          AND om.user_id = v_app_user_id
          AND COALESCE(om.status, 'active') = 'active'
    );

END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_is_org_member(UUID)
TO authenticated, service_role;


-- ============================================================================
-- 3. STRICT STORE ACCESS
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
    v_app_user_id UUID;

    v_store_org_id UUID;
    v_store_workspace_id UUID;
    v_store_user_id TEXT;

BEGIN

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF p_store_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_app_user_id :=
        public.fn_current_app_user_id();

    IF v_app_user_id IS NULL THEN
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
    WHERE s.id = p_store_id
    LIMIT 1;


    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;


    /*
     * Client supplied tenant identifiers are only consistency checks.
     * They NEVER grant access.
     */

    IF p_organization_id IS NOT NULL
       AND p_organization_id IS DISTINCT FROM v_store_org_id
    THEN
        RETURN FALSE;
    END IF;


    IF p_workspace_id IS NOT NULL
       AND p_workspace_id IS DISTINCT FROM v_store_workspace_id
    THEN
        RETURN FALSE;
    END IF;


    /*
     * Direct ownership.
     */

    IF v_store_user_id = v_app_user_id::TEXT THEN
        RETURN TRUE;
    END IF;


    /*
     * Organization membership.
     */

    RETURN public.fn_is_org_member(v_store_org_id);

END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID)
TO authenticated, service_role;


-- ============================================================================
-- 4. IDEMPOTENT INDIVIDUAL TENANT PROVISIONING
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

    v_auth_user_id UUID;
    v_canonical_user_id UUID;

    v_user_email TEXT;
    v_owner_name TEXT;

    v_org_id UUID;
    v_workspace_id UUID;
    v_store_id UUID;

    v_store_name TEXT;

BEGIN

    -- ========================================================================
    -- AUTH
    -- ========================================================================

    v_auth_user_id := auth.uid();

    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'AUTH_CONTEXT_UNAVAILABLE';
    END IF;


    -- ========================================================================
    -- SERIALIZE SAME-USER PROVISIONING
    -- ========================================================================

    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            v_auth_user_id::TEXT,
            421283
        )
    );


    -- ========================================================================
    -- RESOLVE CANONICAL USER
    -- ========================================================================

    SELECT
        u.id,
        u.email
    INTO
        v_canonical_user_id,
        v_user_email
    FROM public.users AS u
    WHERE u.auth_user_id = v_auth_user_id
    LIMIT 1;


    -- ========================================================================
    -- CREATE public.users RECORD IF MISSING
    -- ========================================================================

    IF v_canonical_user_id IS NULL THEN

        SELECT
            au.email,
            COALESCE(
                au.raw_user_meta_data ->> 'full_name',
                'UMKM Owner'
            )
        INTO
            v_user_email,
            v_owner_name
        FROM auth.users AS au
        WHERE au.id = v_auth_user_id;


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
        DO NOTHING;


        SELECT
            u.id,
            u.email
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
            ERRCODE = '23503',
            MESSAGE = 'CANONICAL_APP_USER_NOT_FOUND';
    END IF;


    v_owner_name :=
        COALESCE(
            NULLIF(
                BTRIM(
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


    v_store_name :=
        COALESCE(
            NULLIF(BTRIM(p_store_name), ''),
            'Toko UMKM ZEGA'
        );


    -- ========================================================================
    -- FIND CANONICAL STORE
    -- ========================================================================
    --
    -- IMPORTANT:
    -- NEVER use auth.uid() as store.user_id.
    --
    -- Existing legacy rows using auth.uid() are data-migration candidates,
    -- not authorization fallbacks.
    -- ========================================================================

    SELECT
        s.id,
        s.organization_id,
        s.workspace_id,
        s.store_name
    INTO
        v_store_id,
        v_org_id,
        v_workspace_id,
        v_store_name
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id::TEXT
    ORDER BY s.created_at ASC
    LIMIT 1;


    -- ========================================================================
    -- EXISTING STORE
    -- ========================================================================

    IF v_store_id IS NOT NULL THEN

        -- --------------------------------------------------------------------
        -- Organization
        -- --------------------------------------------------------------------

        IF v_org_id IS NULL THEN

            INSERT INTO public.organizations (
                name,
                slug,
                tenant_type,
                plan,
                status
            )
            VALUES (
                v_store_name || ' Business',
                'umkm-org-' ||
                    lower(
                        substr(
                            md5(v_canonical_user_id::TEXT),
                            1,
                            16
                        )
                    ),
                'umkm',
                'Starter',
                'active'
            )
            RETURNING id INTO v_org_id;


            UPDATE public.umkm_stores
            SET organization_id = v_org_id
            WHERE id = v_store_id;

        ELSE

            IF NOT EXISTS (
                SELECT 1
                FROM public.organizations
                WHERE id = v_org_id
            ) THEN

                INSERT INTO public.organizations (
                    id,
                    name,
                    slug,
                    tenant_type,
                    plan,
                    status
                )
                VALUES (
                    v_org_id,
                    v_store_name || ' Business',
                    'umkm-org-' ||
                        lower(
                            substr(
                                md5(v_canonical_user_id::TEXT),
                                1,
                                16
                            )
                        ),
                    'umkm',
                    'Starter',
                    'active'
                )
                ON CONFLICT (id) DO NOTHING;

            END IF;

        END IF;


        -- --------------------------------------------------------------------
        -- Canonical membership
        -- --------------------------------------------------------------------

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
        SET
            role = 'owner',
            status = 'active';


        -- --------------------------------------------------------------------
        -- Validate workspace
        -- --------------------------------------------------------------------

        IF v_workspace_id IS NOT NULL THEN

            IF NOT EXISTS (
                SELECT 1
                FROM public.workspaces AS w
                WHERE w.id = v_workspace_id
                  AND w.organization_id = v_org_id
            ) THEN

                v_workspace_id := NULL;

            END IF;

        END IF;


        -- --------------------------------------------------------------------
        -- Existing organization workspace
        -- --------------------------------------------------------------------

        IF v_workspace_id IS NULL THEN

            SELECT
                w.id
            INTO
                v_workspace_id
            FROM public.workspaces AS w
            WHERE w.organization_id = v_org_id
              AND COALESCE(w.status, 'active') = 'active'
            ORDER BY w.created_at ASC
            LIMIT 1;

        END IF;


        -- --------------------------------------------------------------------
        -- Create workspace
        -- --------------------------------------------------------------------

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
                'main-ws-' ||
                    lower(
                        substr(
                            md5(v_org_id::TEXT),
                            1,
                            16
                        )
                    ),
                'active'
            )
            RETURNING id INTO v_workspace_id;

        END IF;


        -- --------------------------------------------------------------------
        -- Repair store
        -- --------------------------------------------------------------------

        UPDATE public.umkm_stores
        SET
            organization_id = v_org_id,
            workspace_id = v_workspace_id
        WHERE id = v_store_id;


        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'storeId', v_store_id,
            'store_id', v_store_id,
            'organizationId', v_org_id,
            'organization_id', v_org_id,
            'workspaceId', v_workspace_id,
            'workspace_id', v_workspace_id,
            'storeName', v_store_name
        );

    END IF;


    -- ========================================================================
    -- FIND EXISTING ORGANIZATION
    -- ========================================================================

    SELECT
        om.organization_id
    INTO
        v_org_id
    FROM public.organization_members AS om
    WHERE om.user_id = v_canonical_user_id
      AND COALESCE(om.status, 'active') = 'active'
    ORDER BY om.organization_id
    LIMIT 1;


    -- ========================================================================
    -- CREATE ORGANIZATION
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
            v_store_name || ' Business',
            'umkm-org-' ||
                lower(
                    substr(
                        md5(v_canonical_user_id::TEXT),
                        1,
                        16
                    )
                ),
            'umkm',
            'Starter',
            'active'
        )
        RETURNING id INTO v_org_id;

    END IF;


    -- ========================================================================
    -- CANONICAL MEMBERSHIP
    -- ========================================================================

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
    SET
        role = 'owner',
        status = 'active';


    -- ========================================================================
    -- WORKSPACE
    -- ========================================================================

    SELECT
        w.id
    INTO
        v_workspace_id
    FROM public.workspaces AS w
    WHERE w.organization_id = v_org_id
      AND COALESCE(w.status, 'active') = 'active'
    ORDER BY w.created_at ASC
    LIMIT 1;


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
            'main-ws-' ||
                lower(
                    substr(
                        md5(v_org_id::TEXT),
                        1,
                        16
                    )
                ),
            'active'
        )
        RETURNING id INTO v_workspace_id;

    END IF;


    -- ========================================================================
    -- STORE
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
        v_canonical_user_id::TEXT,
        v_org_id,
        v_workspace_id,
        v_store_name,
        v_owner_name,
        v_user_email,
        'free',
        TRUE
    )
    RETURNING id INTO v_store_id;


    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', 'CREATED',
        'storeId', v_store_id,
        'store_id', v_store_id,
        'organizationId', v_org_id,
        'organization_id', v_org_id,
        'workspaceId', v_workspace_id,
        'workspace_id', v_workspace_id,
        'storeName', v_store_name
    );

END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
TO authenticated, service_role;


-- ============================================================================
-- 5. CHAT HISTORY
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_umkm_recent_chat_history(TEXT, TEXT);


CREATE FUNCTION public.get_umkm_recent_chat_history(
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

    v_app_user_id UUID;
    v_requested_user_id UUID;
    v_chat_type TEXT;

BEGIN

    -- ========================================================================
    -- AUTHENTICATION
    -- ========================================================================

    IF auth.uid() IS NULL THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'CHAT_HISTORY_AUTH_REQUIRED';

    END IF;


    -- ========================================================================
    -- CANONICAL USER
    -- ========================================================================

    v_app_user_id :=
        public.fn_current_app_user_id();


    IF v_app_user_id IS NULL THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '42501',
            MESSAGE = 'CHAT_HISTORY_APP_USER_NOT_RESOLVED';

    END IF;


    -- ========================================================================
    -- USER PARAMETER
    -- ========================================================================
    --
    -- p_user_id is compatibility-only.
    --
    -- It may refer ONLY to the current canonical user.
    -- ========================================================================

    IF NULLIF(BTRIM(p_user_id), '') IS NULL THEN

        v_requested_user_id := v_app_user_id;

    ELSE

        BEGIN

            v_requested_user_id :=
                p_user_id::UUID;

        EXCEPTION
            WHEN invalid_text_representation THEN

                RAISE EXCEPTION
                USING
                    ERRCODE = '22P02',
                    MESSAGE = 'CHAT_HISTORY_INVALID_USER_ID';

        END;


        IF v_requested_user_id <> v_app_user_id THEN

            RAISE EXCEPTION
            USING
                ERRCODE = '42501',
                MESSAGE = 'CHAT_HISTORY_USER_SCOPE_VIOLATION';

        END IF;


        v_requested_user_id := v_app_user_id;

    END IF;


    -- ========================================================================
    -- CHAT TYPE
    -- ========================================================================

    v_chat_type :=
        LOWER(
            COALESCE(
                NULLIF(BTRIM(p_chat_type), ''),
                'all'
            )
        );


    IF v_chat_type NOT IN (
        'all',
        'ai_assistant',
        'ops_specialist',
        'zega_copilot',
        'copilot',
        'live_help',
        'help',
        'finance_ai',
        'finance'
    ) THEN

        RAISE EXCEPTION
        USING
            ERRCODE = '22023',
            MESSAGE = 'CHAT_HISTORY_INVALID_CHAT_TYPE';

    END IF;


    -- ========================================================================
    -- AI ASSISTANT
    -- ========================================================================

    IF v_chat_type IN (
        'all',
        'ai_assistant',
        'ops_specialist'
    ) THEN

        RETURN QUERY

        SELECT
            c.id,
            'ai_assistant'::TEXT,
            c.title,

            COALESCE(
                (
                    SELECT m.text::TEXT
                    FROM public.umkm_ai_assistant_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'Pesan kosong'
            ),

            COALESCE(
                (
                    SELECT m.sender::TEXT
                    FROM public.umkm_ai_assistant_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'system'
            ),

            (
                SELECT COUNT(*)::BIGINT
                FROM public.umkm_ai_assistant_messages AS m
                WHERE m.chat_id = c.id
            ),

            c.created_at,
            c.updated_at

        FROM public.umkm_ai_assistant_chats AS c

        WHERE c.user_id = v_requested_user_id::TEXT

          AND public.fn_can_access_umkm_store(
                c.store_id,
                c.organization_id,
                c.workspace_id
              )

        ORDER BY c.updated_at DESC

        LIMIT 100;

    END IF;


    -- ========================================================================
    -- ZEGA COPILOT
    -- ========================================================================

    IF v_chat_type IN (
        'all',
        'zega_copilot',
        'copilot'
    ) THEN

        RETURN QUERY

        SELECT
            c.id,
            'zega_copilot'::TEXT,
            c.title,

            COALESCE(
                (
                    SELECT m.message::TEXT
                    FROM public.umkm_zega_copilot_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'Pesan kosong'
            ),

            COALESCE(
                (
                    SELECT m.sender::TEXT
                    FROM public.umkm_zega_copilot_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'system'
            ),

            (
                SELECT COUNT(*)::BIGINT
                FROM public.umkm_zega_copilot_messages AS m
                WHERE m.chat_id = c.id
            ),

            c.created_at,
            c.updated_at

        FROM public.umkm_zega_copilot_chats AS c

        WHERE c.user_id = v_requested_user_id::TEXT

          AND public.fn_can_access_umkm_store(
                c.store_id,
                c.organization_id,
                c.workspace_id
              )

        ORDER BY c.updated_at DESC

        LIMIT 100;

    END IF;


    -- ========================================================================
    -- LIVE HELP
    -- ========================================================================

    IF v_chat_type IN (
        'all',
        'live_help',
        'help'
    ) THEN

        RETURN QUERY

        SELECT
            c.id,
            'live_help'::TEXT,
            c.title,

            COALESCE(
                (
                    SELECT m.text::TEXT
                    FROM public.umkm_live_help_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'Pesan kosong'
            ),

            COALESCE(
                (
                    SELECT m.sender::TEXT
                    FROM public.umkm_live_help_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'system'
            ),

            (
                SELECT COUNT(*)::BIGINT
                FROM public.umkm_live_help_messages AS m
                WHERE m.chat_id = c.id
            ),

            c.created_at,
            c.updated_at

        FROM public.umkm_live_help_chats AS c

        WHERE c.user_id = v_requested_user_id::TEXT

          AND public.fn_can_access_umkm_store(
                c.store_id,
                c.organization_id,
                c.workspace_id
              )

        ORDER BY c.updated_at DESC

        LIMIT 100;

    END IF;


    -- ========================================================================
    -- FINANCE AI
    -- ========================================================================

    IF v_chat_type IN (
        'all',
        'finance_ai',
        'finance'
    ) THEN

        RETURN QUERY

        SELECT
            c.id,
            'finance_ai'::TEXT,
            c.title,

            COALESCE(
                (
                    SELECT m.text::TEXT
                    FROM public.umkm_finance_ai_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'Pesan kosong'
            ),

            COALESCE(
                (
                    SELECT m.sender::TEXT
                    FROM public.umkm_finance_ai_messages AS m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ),
                'system'
            ),

            (
                SELECT COUNT(*)::BIGINT
                FROM public.umkm_finance_ai_messages AS m
                WHERE m.chat_id = c.id
            ),

            c.created_at,
            c.updated_at

        FROM public.umkm_finance_ai_chats AS c

        WHERE c.user_id = v_requested_user_id::TEXT

          AND public.fn_can_access_umkm_store(
                c.store_id,
                c.organization_id,
                c.workspace_id
              )

        ORDER BY c.updated_at DESC

        LIMIT 100;

    END IF;

END;
$function$;


-- ============================================================================
-- 6. CHAT HISTORY PRIVILEGES
-- ============================================================================

REVOKE EXECUTE
ON FUNCTION public.get_umkm_recent_chat_history(TEXT, TEXT)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_umkm_recent_chat_history(TEXT, TEXT)
TO authenticated, service_role;


-- ============================================================================
-- 7. DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.fn_current_app_user_id()
IS
'Canonical ZEGA application identity resolver. auth.uid() is mapped exclusively through public.users.auth_user_id to public.users.id. No identity fallback is permitted.';


COMMENT ON FUNCTION public.fn_is_org_member(UUID)
IS
'Strict organization membership check using canonical public.users.id only.';


COMMENT ON FUNCTION public.fn_can_access_umkm_store(UUID, UUID, UUID)
IS
'Strict ZEGA store authorization using canonical application identity and validated organization/workspace relationships.';


COMMENT ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT)
IS
'Idempotently provisions the canonical individual UMKM organization, workspace and store for the authenticated application user.';


COMMENT ON FUNCTION public.get_umkm_recent_chat_history(TEXT, TEXT)
IS
'Returns chat history for the authenticated canonical application user, independently scoped by AI assistant type and tenant authorization.';


COMMIT;