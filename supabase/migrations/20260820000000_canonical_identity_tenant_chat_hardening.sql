-- ============================================================================
-- ZEGA AI PLATFORM — CANONICAL IDENTITY & TENANT CHAT PIPELINE HARDENING
-- Migration: 20260820000000_canonical_identity_tenant_chat_hardening.sql
--
-- PURPOSE:
--   1. Enforce UNIQUE index on umkm_stores(user_id) for INDIVIDUAL_UMKM mode.
--   2. Redefine fn_ensure_individual_umkm_tenant with advisory locks, explicit user mapping, and anon EXECUTE permissions.
--   3. Redefine fn_resolve_or_create_ai_chat supporting all assistant types, atomic advisory locking, and anon EXECUTE permissions.
--   4. Ensure fn_get_or_create_current_app_user has anon EXECUTE permissions for PostgREST external auth compatibility.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. DATABASE-LEVEL TENANT INVARIANT: UNIQUE STORE PER USER
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_umkm_stores_unique_user_id
    ON public.umkm_stores(user_id)
    WHERE user_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. HARDENED TENANT PROVISIONING RPC: fn_ensure_individual_umkm_tenant
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_ensure_individual_umkm_tenant(UUID, TEXT);
DROP FUNCTION IF EXISTS public.fn_ensure_individual_umkm_tenant(TEXT);

CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_user_id UUID DEFAULT NULL,
    p_store_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_user_id UUID := auth.uid();
    v_target_user_id UUID := p_user_id;
    v_canonical_user_id UUID;
    v_user_email TEXT;
    v_owner_name TEXT;
    v_org_id UUID;
    v_workspace_id UUID;
    v_store_id UUID;
    v_store_record RECORD;
    v_clean_store_name TEXT;
BEGIN
    -- Resolve canonical application user ID
    IF v_target_user_id IS NOT NULL THEN
        SELECT id INTO v_canonical_user_id
        FROM public.users
        WHERE id = v_target_user_id OR auth_user_id = v_target_user_id
        LIMIT 1;

        IF v_canonical_user_id IS NULL THEN
            v_canonical_user_id := v_target_user_id;
        END IF;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        v_canonical_user_id := public.fn_current_app_user_id();
    END IF;

    IF v_canonical_user_id IS NULL AND v_auth_user_id IS NOT NULL THEN
        v_canonical_user_id := public.fn_get_or_create_current_app_user();
        IF v_canonical_user_id IS NULL THEN
            SELECT id INTO v_canonical_user_id
            FROM public.users
            WHERE auth_user_id = v_auth_user_id
            LIMIT 1;
        END IF;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        RAISE EXCEPTION 'IDENTITY_MAPPING_ERROR: Could not resolve canonical application user'
            USING ERRCODE = '23503';
    END IF;

    -- Retrieve user details for default store naming
    SELECT email, full_name INTO v_user_email, v_owner_name
    FROM public.users WHERE id = v_canonical_user_id;

    IF p_store_name IS NULL OR TRIM(p_store_name) = '' OR TRIM(p_store_name) = 'Toko UMKM ZEGA' THEN
        IF v_owner_name IS NOT NULL AND TRIM(v_owner_name) <> '' THEN
            v_clean_store_name := 'Toko ' || TRIM(v_owner_name);
        ELSIF v_user_email IS NOT NULL AND TRIM(v_user_email) <> '' THEN
            v_clean_store_name := 'Toko ' || SPLIT_PART(TRIM(v_user_email), '@', 1);
        ELSE
            v_clean_store_name := 'Toko UMKM ZEGA';
        END IF;
    ELSE
        v_clean_store_name := TRIM(p_store_name);
    END IF;

    -- Advisory lock to prevent race conditions during concurrent provisioning
    PERFORM pg_advisory_xact_lock(
        hashtextextended(v_canonical_user_id::text, 421283)
    );

    -- Check for existing store belonging to canonical user ID or auth user ID
    SELECT s.id, s.organization_id, s.workspace_id, s.store_name
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND s.user_id = v_auth_user_id)
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_store_record.id IS NOT NULL THEN
        v_store_id := v_store_record.id;
        v_org_id := v_store_record.organization_id;
        v_workspace_id := v_store_record.workspace_id;

        -- Organization check & repair
        IF v_org_id IS NULL OR v_org_id = v_store_id THEN
            SELECT organization_id INTO v_org_id
            FROM public.organization_members
            WHERE user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND user_id = v_auth_user_id)
            LIMIT 1;

            IF v_org_id IS NULL OR v_org_id = v_store_id THEN
                v_org_id := gen_random_uuid();
                INSERT INTO public.organizations (id, name, slug, created_at, updated_at)
                VALUES (v_org_id, v_clean_store_name || ' Organization', 'org-' || substring(v_canonical_user_id::text from 1 for 8), NOW(), NOW());
            END IF;

            UPDATE public.umkm_stores SET organization_id = v_org_id WHERE id = v_store_id;
        END IF;

        -- Member check
        IF NOT EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = v_org_id AND (user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND user_id = v_auth_user_id))
        ) THEN
            INSERT INTO public.organization_members (
                id, organization_id, user_id, role, status, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
            ) ON CONFLICT DO NOTHING;
        END IF;

        -- Workspace check & repair
        IF v_workspace_id IS NULL OR v_workspace_id = v_store_id OR v_workspace_id = v_org_id OR NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = v_workspace_id) THEN
            SELECT id INTO v_workspace_id
            FROM public.workspaces
            WHERE organization_id = v_org_id
            ORDER BY created_at ASC
            LIMIT 1;

            IF v_workspace_id IS NULL THEN
                INSERT INTO public.workspaces (
                    id, organization_id, name, slug, status, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW()
                ) RETURNING id INTO v_workspace_id;
            END IF;

            UPDATE public.umkm_stores
            SET workspace_id = v_workspace_id
            WHERE id = v_store_id;
        END IF;

        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'storeId', v_store_id,
            'organizationId', v_org_id,
            'workspaceId', v_workspace_id,
            'userId', v_canonical_user_id,
            'authUserId', v_auth_user_id,
            'storeName', COALESCE(v_store_record.store_name, v_clean_store_name)
        );
    END IF;

    -- Provision New Tenant Graph atomically
    v_org_id := gen_random_uuid();
    v_workspace_id := gen_random_uuid();
    v_store_id := gen_random_uuid();

    INSERT INTO public.organizations (
        id, name, slug, created_at, updated_at
    ) VALUES (
        v_org_id,
        v_clean_store_name || ' Organization',
        'org-' || substring(v_canonical_user_id::text from 1 for 8),
        NOW(), NOW()
    );

    INSERT INTO public.organization_members (
        id, organization_id, user_id, role, status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_org_id, v_canonical_user_id, 'owner', 'active', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.workspaces (
        id, organization_id, name, slug, status, created_at, updated_at
    ) VALUES (
        v_workspace_id, v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW()
    );

    INSERT INTO public.umkm_stores (
        id, organization_id, workspace_id, user_id, store_name, owner_name, email, plan, is_active, created_at, updated_at
    ) VALUES (
        v_store_id,
        v_org_id,
        v_workspace_id,
        v_canonical_user_id,
        v_clean_store_name,
        COALESCE(v_owner_name, 'UMKM Owner'),
        COALESCE(v_user_email, 'user@zegaai.site'),
        'Starter',
        TRUE,
        NOW(), NOW()
    )
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO NOTHING;

    SELECT s.id, s.organization_id, s.workspace_id, s.store_name
    INTO v_store_record
    FROM public.umkm_stores AS s
    WHERE s.user_id = v_canonical_user_id OR (v_auth_user_id IS NOT NULL AND s.user_id = v_auth_user_id)
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_store_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'PROVISIONED',
            'storeId', v_store_record.id,
            'organizationId', v_store_record.organization_id,
            'workspaceId', v_store_record.workspace_id,
            'userId', v_canonical_user_id,
            'authUserId', v_auth_user_id,
            'storeName', COALESCE(v_store_record.store_name, v_clean_store_name)
        );
    END IF;

    RAISE EXCEPTION 'PROVISIONING_FAILED: Store creation failed' USING ERRCODE = 'P0001';
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_ensure_individual_umkm_tenant(
    p_store_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
    RETURN public.fn_ensure_individual_umkm_tenant(NULL::UUID, p_store_name);
END;
$function$;

-- GRANT EXECUTE TO ALL VALID ROLES INCLUDING anon FOR PostgREST EXTERNAL AUTH COMPATIBILITY
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(UUID, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_ensure_individual_umkm_tenant(TEXT) TO authenticated, anon, service_role;


-- ----------------------------------------------------------------------------
-- 3. HARDENED CANONICAL CHAT RPC: fn_resolve_or_create_ai_chat
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.fn_resolve_or_create_ai_chat(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.fn_resolve_or_create_ai_chat(UUID, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.fn_resolve_or_create_ai_chat(
    p_store_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_assistant_type TEXT DEFAULT 'home_assistant',
    p_title TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_canonical_user_id UUID;
    v_store_id UUID := p_store_id;
    v_org_id UUID;
    v_workspace_id UUID;
    v_store_user_id UUID;
    v_normalized_assistant TEXT;
    v_title TEXT := p_title;
    v_chat_id UUID;
    v_existing_chat RECORD;
    v_prov_res JSONB;
BEGIN
    -- 1. Identity Resolution
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO v_canonical_user_id
        FROM public.users
        WHERE id = p_user_id OR auth_user_id = p_user_id
        LIMIT 1;

        IF v_canonical_user_id IS NULL THEN
            v_canonical_user_id := p_user_id;
        END IF;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        v_canonical_user_id := public.fn_current_app_user_id();
    END IF;

    IF v_canonical_user_id IS NULL AND v_auth_uid IS NOT NULL THEN
        v_canonical_user_id := public.fn_get_or_create_current_app_user();
    END IF;

    IF v_canonical_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '42501',
            'error', 'CHAT_AUTH_REQUIRED: Could not resolve canonical application user identity'
        );
    END IF;

    -- 2. Assistant Type Normalization
    v_normalized_assistant := LOWER(TRIM(COALESCE(p_assistant_type, 'home_assistant')));
    IF v_normalized_assistant IN ('zega_copilot', 'zega copilot', 'copilot', 'enterprise_copilot') THEN
        v_normalized_assistant := 'zega_copilot';
    ELSIF v_normalized_assistant IN ('help_assistant', 'help', 'help assistant', 'zega help assistant') THEN
        v_normalized_assistant := 'help_assistant';
    ELSIF v_normalized_assistant IN ('finance_assistant', 'finance', 'finance assistant', 'zega finance assistant') THEN
        v_normalized_assistant := 'finance_assistant';
    ELSIF v_normalized_assistant IN ('knowledge_assistant', 'knowledge', 'knowledge assistant', 'zega knowledge assistant', 'kb') THEN
        v_normalized_assistant := 'knowledge_assistant';
    ELSE
        v_normalized_assistant := 'home_assistant';
    END IF;

    IF v_title IS NULL OR TRIM(v_title) = '' THEN
        IF v_normalized_assistant = 'zega_copilot' THEN
            v_title := 'Sesi Enterprise Copilot Baru';
        ELSIF v_normalized_assistant = 'help_assistant' THEN
            v_title := 'Sesi Help Assistant Baru';
        ELSIF v_normalized_assistant = 'finance_assistant' THEN
            v_title := 'Sesi Finance Assistant Baru';
        ELSIF v_normalized_assistant = 'knowledge_assistant' THEN
            v_title := 'Sesi Knowledge Assistant Baru';
        ELSE
            v_title := 'Sesi Home Assistant Baru';
        END IF;
    END IF;

    -- 3. Advisory Lock per User + Assistant Type
    PERFORM pg_advisory_xact_lock(
        hashtextextended(v_canonical_user_id::text || '_' || v_normalized_assistant, 992831)
    );

    -- 4. Tenant Graph Resolution & Verification
    IF v_store_id IS NOT NULL THEN
        SELECT id, organization_id, workspace_id, user_id
        INTO v_store_id, v_org_id, v_workspace_id, v_store_user_id
        FROM public.umkm_stores
        WHERE id = p_store_id
        LIMIT 1;
    END IF;

    IF v_store_id IS NULL THEN
        SELECT id, organization_id, workspace_id, user_id
        INTO v_store_id, v_org_id, v_workspace_id, v_store_user_id
        FROM public.umkm_stores
        WHERE user_id = v_canonical_user_id OR (v_auth_uid IS NOT NULL AND user_id = v_auth_uid)
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- Auto-provision store if absent
    IF v_store_id IS NULL THEN
        BEGIN
            v_prov_res := public.fn_ensure_individual_umkm_tenant(v_canonical_user_id, NULL);
            IF (v_prov_res->>'ok')::BOOLEAN = TRUE THEN
                v_store_id := (v_prov_res->>'storeId')::UUID;
                v_org_id := (v_prov_res->>'organizationId')::UUID;
                v_workspace_id := (v_prov_res->>'workspaceId')::UUID;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        IF v_store_id IS NULL THEN
            SELECT id, organization_id, workspace_id, user_id
            INTO v_store_id, v_org_id, v_workspace_id, v_store_user_id
            FROM public.umkm_stores
            WHERE user_id = v_canonical_user_id OR (v_auth_uid IS NOT NULL AND user_id = v_auth_uid)
            ORDER BY created_at ASC
            LIMIT 1;
        END IF;
    END IF;

    -- Fail-Closed Tenant Context Validation
    IF v_store_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', 'P0001',
            'error', 'TENANT_BOUNDARY_VIOLATION: Valid store record does not exist for current user'
        );
    END IF;

    IF v_org_id IS NULL OR v_org_id = v_store_id THEN
        SELECT organization_id INTO v_org_id
        FROM public.organization_members
        WHERE user_id = v_canonical_user_id OR (v_auth_uid IS NOT NULL AND user_id = v_auth_uid)
        LIMIT 1;

        IF v_org_id IS NULL THEN
            v_org_id := gen_random_uuid();
            INSERT INTO public.organizations (id, name, slug, created_at, updated_at)
            VALUES (v_org_id, 'Organization', 'org-' || substring(v_canonical_user_id::text from 1 for 8), NOW(), NOW());
        END IF;

        UPDATE public.umkm_stores SET organization_id = v_org_id WHERE id = v_store_id;
    END IF;

    IF v_workspace_id IS NULL OR v_workspace_id = v_store_id OR v_workspace_id = v_org_id THEN
        SELECT id INTO v_workspace_id
        FROM public.workspaces
        WHERE organization_id = v_org_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_workspace_id IS NULL THEN
            v_workspace_id := gen_random_uuid();
            INSERT INTO public.workspaces (id, organization_id, name, slug, status, created_at, updated_at)
            VALUES (v_workspace_id, v_org_id, 'Main Workspace', 'workspace-' || substring(v_canonical_user_id::text from 1 for 8), 'active', NOW(), NOW());
        END IF;

        UPDATE public.umkm_stores SET workspace_id = v_workspace_id WHERE id = v_store_id;
    END IF;

    -- Strict Invariant Assertion: FAIL CLOSED if organization or workspace equals store_id
    IF v_org_id = v_store_id OR v_workspace_id = v_store_id OR v_workspace_id = v_org_id THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', 'P0001',
            'error', 'TENANT_BOUNDARY_VIOLATION: Corrupted tenant boundary (organization or workspace equal to store)'
        );
    END IF;

    -- 5. Existing Active Session Lookup (Idempotency)
    SELECT id, title INTO v_existing_chat
    FROM public.umkm_ai_assistant_chats
    WHERE store_id = v_store_id
      AND user_id = v_canonical_user_id::TEXT
      AND status = 'active'
      AND (
          (v_normalized_assistant = 'zega_copilot' AND agent_role ILIKE '%Copilot%') OR
          (v_normalized_assistant <> 'zega_copilot' AND agent_role NOT ILIKE '%Copilot%')
      )
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_existing_chat.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'ok', TRUE,
            'status', 'EXISTING',
            'chatId', v_existing_chat.id,
            'storeId', v_store_id,
            'organizationId', v_org_id,
            'workspaceId', v_workspace_id,
            'userId', v_canonical_user_id,
            'assistantType', v_normalized_assistant,
            'title', v_existing_chat.title
        );
    END IF;

    -- 6. Insert New Chat Session Atomically
    v_chat_id := gen_random_uuid();

    INSERT INTO public.umkm_ai_assistant_chats (
        id,
        store_id,
        organization_id,
        workspace_id,
        user_id,
        title,
        agent_role,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_chat_id,
        v_store_id,
        v_org_id,
        v_workspace_id,
        v_canonical_user_id::TEXT,
        v_title,
        CASE
            WHEN v_normalized_assistant = 'zega_copilot' THEN 'ZEGA Copilot'
            WHEN v_normalized_assistant = 'help_assistant' THEN 'ZEGA Help Assistant'
            WHEN v_normalized_assistant = 'finance_assistant' THEN 'ZEGA Finance Assistant'
            WHEN v_normalized_assistant = 'knowledge_assistant' THEN 'ZEGA Knowledge Assistant'
            ELSE 'ZEGA Home Assistant'
        END,
        'active',
        NOW(),
        NOW()
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', 'CREATED',
        'chatId', v_chat_id,
        'storeId', v_store_id,
        'organizationId', v_org_id,
        'workspaceId', v_workspace_id,
        'userId', v_canonical_user_id,
        'assistantType', v_normalized_assistant,
        'title', v_title
    );
END;
$function$;

-- GRANT EXECUTE TO ALL VALID ROLES INCLUDING anon FOR PostgREST EXTERNAL AUTH COMPATIBILITY
GRANT EXECUTE ON FUNCTION public.fn_resolve_or_create_ai_chat(UUID, UUID, TEXT, TEXT) TO authenticated, anon, service_role;

-- ALSO GRANT EXECUTE ON HELPER IDENTITY RPC TO anon ROLE
GRANT EXECUTE ON FUNCTION public.fn_get_or_create_current_app_user() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_current_app_user_id() TO authenticated, anon, service_role;

COMMIT;
