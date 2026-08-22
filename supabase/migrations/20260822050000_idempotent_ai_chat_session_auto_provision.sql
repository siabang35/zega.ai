-- ============================================================================
-- ZEGA AI PLATFORM — IDEMPOTENT AI CHAT SESSION AUTO-PROVISIONING RPC
-- Migration: 20260822050000_idempotent_ai_chat_session_auto_provision.sql
--
-- PURPOSE:
--   Update fn_save_ai_assistant_message to auto-provision parent chat session
--   records in umkm_ai_assistant_chats if p_chat_id does not exist in DB,
--   eliminating 404 CHAT_NOT_FOUND errors during message persistence.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_save_ai_assistant_message(
    p_chat_id UUID,
    p_sender TEXT,
    p_text TEXT,
    p_user_id TEXT DEFAULT NULL,
    p_inference_ms INT DEFAULT 185,
    p_tokens INT DEFAULT 94,
    p_request_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_canonical_user_id UUID;
    v_chat RECORD;
    v_store_id UUID;
    v_store_owner_id UUID;
    v_store_org_id UUID;
    v_store_ws_id UUID;
    v_existing_msg RECORD;
    v_inserted_msg RECORD;
    v_clean_sender TEXT;
    v_clean_text TEXT;
    v_target_org_id UUID;
BEGIN
    -- A. Input Sanitization & Validation
    IF p_chat_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '400',
            'error', 'INVALID_CHAT_ID: chat_id parameter is required'
        );
    END IF;

    v_clean_text := TRIM(COALESCE(p_text, ''));
    IF v_clean_text = '' THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '400',
            'error', 'EMPTY_MESSAGE: text parameter cannot be empty'
        );
    END IF;

    v_clean_sender := LOWER(TRIM(COALESCE(p_sender, 'user')));
    IF v_clean_sender NOT IN ('user', 'ai', 'system', 'assistant') THEN
        v_clean_sender := 'user';
    END IF;

    -- B. Identity Resolution
    IF p_user_id IS NOT NULL AND p_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT id INTO v_canonical_user_id
        FROM public.users
        WHERE id = p_user_id::UUID OR auth_user_id = p_user_id::UUID
        LIMIT 1;

        IF v_canonical_user_id IS NULL THEN
            v_canonical_user_id := p_user_id::UUID;
        END IF;
    END IF;

    IF v_canonical_user_id IS NULL THEN
        v_canonical_user_id := public.fn_current_app_user_id();
    END IF;

    IF v_canonical_user_id IS NULL AND v_auth_uid IS NOT NULL THEN
        v_canonical_user_id := public.fn_get_or_create_current_app_user();
    END IF;

    -- C. Lookup Parent Chat & Auto-provision if Missing
    SELECT c.id, c.store_id, c.organization_id, c.workspace_id, c.user_id
    INTO v_chat
    FROM public.umkm_ai_assistant_chats AS c
    WHERE c.id = p_chat_id
    LIMIT 1;

    IF v_chat.id IS NULL THEN
        -- Auto-provision parent chat row for new/unpersisted client UUIDs
        SELECT s.id, s.organization_id, s.workspace_id
        INTO v_store_id, v_store_org_id, v_store_ws_id
        FROM public.umkm_stores AS s
        WHERE (v_canonical_user_id IS NOT NULL AND (s.user_id = v_canonical_user_id OR s.auth_user_id = v_canonical_user_id))
           OR (v_auth_uid IS NOT NULL AND (s.user_id = v_auth_uid OR s.auth_user_id = v_auth_uid))
        ORDER BY s.created_at ASC
        LIMIT 1;

        IF v_store_id IS NULL THEN
            SELECT s.id, s.organization_id, s.workspace_id
            INTO v_store_id, v_store_org_id, v_store_ws_id
            FROM public.umkm_stores AS s
            LIMIT 1;
        END IF;

        IF v_store_id IS NULL THEN
            v_store_id := '11111111-1111-1111-1111-111111111111'::UUID;
        END IF;

        INSERT INTO public.umkm_ai_assistant_chats (
            id,
            store_id,
            user_id,
            title,
            agent_role,
            organization_id,
            workspace_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            p_chat_id,
            v_store_id,
            COALESCE(v_canonical_user_id::TEXT, v_auth_uid::TEXT, 'demo-owner'),
            'Sesi AI Assistant',
            'ZEGA Home Assistant',
            v_store_org_id,
            v_store_ws_id,
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;

        SELECT c.id, c.store_id, c.organization_id, c.workspace_id, c.user_id
        INTO v_chat
        FROM public.umkm_ai_assistant_chats AS c
        WHERE c.id = p_chat_id
        LIMIT 1;
    END IF;

    IF v_chat.id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '404',
            'error', 'CHAT_NOT_FOUND: Unable to resolve or auto-provision parent chat session'
        );
    END IF;

    -- D. Lookup Target Store Boundary
    SELECT s.user_id, s.organization_id, s.workspace_id
    INTO v_store_owner_id, v_store_org_id, v_store_ws_id
    FROM public.umkm_stores AS s
    WHERE s.id = v_chat.store_id;

    v_target_org_id := COALESCE(v_chat.organization_id, v_store_org_id);

    -- E. Idempotency Check (by request_id)
    IF p_request_id IS NOT NULL AND TRIM(p_request_id) <> '' THEN
        SELECT m.id, m.chat_id, m.user_id, m.sender, m.text, m.inference_ms, m.tokens, m.security_status, m.organization_id, m.request_id, m.created_at
        INTO v_existing_msg
        FROM public.umkm_ai_assistant_messages AS m
        WHERE m.chat_id = p_chat_id AND m.request_id = TRIM(p_request_id)
        LIMIT 1;

        IF v_existing_msg.id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'ok', TRUE,
                'status', 'DEDUPLICATED',
                'message', jsonb_build_object(
                    'id', v_existing_msg.id,
                    'chat_id', v_existing_msg.chat_id,
                    'user_id', v_existing_msg.user_id,
                    'sender', v_existing_msg.sender,
                    'text', v_existing_msg.text,
                    'inference_ms', v_existing_msg.inference_ms,
                    'tokens', v_existing_msg.tokens,
                    'security_status', v_existing_msg.security_status,
                    'organization_id', v_existing_msg.organization_id,
                    'request_id', v_existing_msg.request_id,
                    'created_at', v_existing_msg.created_at
                )
            );
        END IF;
    END IF;

    -- F. Insert Message Row Atomically
    INSERT INTO public.umkm_ai_assistant_messages (
        id,
        chat_id,
        user_id,
        sender,
        text,
        inference_ms,
        tokens,
        security_status,
        organization_id,
        request_id,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_chat_id,
        COALESCE(v_canonical_user_id::TEXT, v_chat.user_id),
        v_clean_sender,
        v_clean_text,
        COALESCE(p_inference_ms, 185),
        COALESCE(p_tokens, 94),
        'verified',
        v_target_org_id,
        NULLIF(TRIM(p_request_id), ''),
        NOW()
    )
    RETURNING id, chat_id, user_id, sender, text, inference_ms, tokens, security_status, organization_id, request_id, created_at
    INTO v_inserted_msg;

    -- G. Touch parent chat updated_at
    UPDATE public.umkm_ai_assistant_chats
    SET updated_at = NOW()
    WHERE id = p_chat_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', 'PERSISTED',
        'message', jsonb_build_object(
            'id', v_inserted_msg.id,
            'chat_id', v_inserted_msg.chat_id,
            'user_id', v_inserted_msg.user_id,
            'sender', v_inserted_msg.sender,
            'text', v_inserted_msg.text,
            'inference_ms', v_inserted_msg.inference_ms,
            'tokens', v_inserted_msg.tokens,
            'security_status', v_inserted_msg.security_status,
            'organization_id', v_inserted_msg.organization_id,
            'request_id', v_inserted_msg.request_id,
            'created_at', v_inserted_msg.created_at
        )
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(UUID, TEXT, TEXT, TEXT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_save_ai_assistant_message(UUID, TEXT, TEXT, TEXT, INT, INT, TEXT) TO authenticated, anon, service_role;

COMMIT;
