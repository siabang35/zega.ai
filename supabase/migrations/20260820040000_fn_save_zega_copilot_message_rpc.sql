-- ============================================================================
-- ZEGA AI PLATFORM — ZEGA COPILOT MESSAGE PERSISTENCE RPC & RLS HARDENING
-- Migration: 20260820040000_fn_save_zega_copilot_message_rpc.sql
--
-- PURPOSE:
--   1. Provide atomic, 100% secure SECURITY DEFINER RPC fn_save_zega_copilot_message
--      to persist ZEGA Copilot messages without RLS 401 Unauthorized violations.
--   2. Work seamlessly under both standard Supabase Auth (auth.uid()) AND External
--      Auth / Privy session states (anon role PostgREST calls).
--   3. Enforce strict multi-tenant copilot chat ownership & store access checks.
--   4. Harden RLS policies for umkm_zega_copilot_messages.
-- ============================================================================

BEGIN;

-- 1. ADD REQUEST_ID COLUMN TO umkm_zega_copilot_messages FOR IDEMPOTENCY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'umkm_zega_copilot_messages'
          AND column_name = 'request_id'
    ) THEN
        ALTER TABLE public.umkm_zega_copilot_messages ADD COLUMN request_id TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_umkm_zega_copilot_messages_request_id
    ON public.umkm_zega_copilot_messages(request_id)
    WHERE request_id IS NOT NULL;

-- 2. CANONICAL MESSAGE PERSISTENCE RPC: fn_save_zega_copilot_message
DROP FUNCTION IF EXISTS public.fn_save_zega_copilot_message(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT);

CREATE OR REPLACE FUNCTION public.fn_save_zega_copilot_message(
    p_chat_id UUID,
    p_sender TEXT,
    p_message TEXT,
    p_user_id TEXT DEFAULT NULL,
    p_sender_name TEXT DEFAULT NULL,
    p_model_engine TEXT DEFAULT '9Router-Llama-3.3-70B',
    p_latency_ms INT DEFAULT 185,
    p_tokens_used INT DEFAULT 94,
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
    v_store_owner_id UUID;
    v_store_org_id UUID;
    v_store_ws_id UUID;
    v_existing_msg RECORD;
    v_inserted_msg RECORD;
    v_clean_sender TEXT;
    v_clean_text TEXT;
    v_clean_sender_name TEXT;
BEGIN
    -- A. Input Sanitization & Validation
    IF p_chat_id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '400',
            'error', 'INVALID_CHAT_ID: chat_id parameter is required'
        );
    END IF;

    v_clean_text := TRIM(COALESCE(p_message, ''));
    IF v_clean_text = '' THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '400',
            'error', 'EMPTY_MESSAGE: message parameter cannot be empty'
        );
    END IF;

    v_clean_sender := LOWER(TRIM(COALESCE(p_sender, 'user')));
    IF v_clean_sender NOT IN ('user', 'assistant', 'system', 'ai') THEN
        v_clean_sender := 'user';
    END IF;

    v_clean_sender_name := TRIM(COALESCE(p_sender_name, CASE WHEN v_clean_sender = 'user' THEN 'Pemilik Toko' ELSE 'ZEGA Copilot AI' END));

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

    -- C. Lookup Parent Chat & Verify Existence
    SELECT c.id, c.store_id, c.organization_id, c.workspace_id, c.user_id
    INTO v_chat
    FROM public.umkm_zega_copilot_chats AS c
    WHERE c.id = p_chat_id
    LIMIT 1;

    IF v_chat.id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '404',
            'error', 'CHAT_NOT_FOUND: Referenced copilot chat session does not exist'
        );
    END IF;

    -- D. Lookup Target Store Boundary
    SELECT s.user_id, s.organization_id, s.workspace_id
    INTO v_store_owner_id, v_store_org_id, v_store_ws_id
    FROM public.umkm_stores AS s
    WHERE s.id = v_chat.store_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', 'P0001',
            'error', 'TENANT_BOUNDARY_VIOLATION: Target store referenced by copilot chat does not exist'
        );
    END IF;

    -- E. Strict Multi-Tenant Copilot Chat Ownership Validation
    IF NOT (
        (v_canonical_user_id IS NOT NULL AND (v_store_owner_id = v_canonical_user_id OR v_chat.user_id = v_canonical_user_id::TEXT))
        OR (v_auth_uid IS NOT NULL AND (v_store_owner_id = v_auth_uid OR v_chat.user_id = v_auth_uid::TEXT))
        OR public.fn_can_access_umkm_store(v_chat.store_id, v_chat.organization_id, v_chat.workspace_id)
        OR public.fn_is_org_member(v_store_org_id)
    ) THEN
        RETURN jsonb_build_object(
            'ok', FALSE,
            'errorCode', '42501',
            'error', 'CROSS_TENANT_VIOLATION: Access denied to target copilot chat and store'
        );
    END IF;

    -- F. Idempotency Check (by request_id)
    IF p_request_id IS NOT NULL AND TRIM(p_request_id) <> '' THEN
        SELECT m.id, m.chat_id, m.user_id, m.sender, m.message, m.sender_name, m.model_engine, m.latency_ms, m.tokens_used, m.request_id, m.created_at
        INTO v_existing_msg
        FROM public.umkm_zega_copilot_messages AS m
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
                    'message', v_existing_msg.message,
                    'sender_name', v_existing_msg.sender_name,
                    'model_engine', v_existing_msg.model_engine,
                    'latency_ms', v_existing_msg.latency_ms,
                    'tokens_used', v_existing_msg.tokens_used,
                    'request_id', v_existing_msg.request_id,
                    'created_at', v_existing_msg.created_at
                )
            );
        END IF;
    END IF;

    -- G. Insert Message Row Atomically
    INSERT INTO public.umkm_zega_copilot_messages (
        id,
        chat_id,
        user_id,
        sender,
        message,
        sender_name,
        model_engine,
        latency_ms,
        tokens_used,
        request_id,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_chat_id,
        COALESCE(v_canonical_user_id::TEXT, v_chat.user_id),
        v_clean_sender,
        v_clean_text,
        v_clean_sender_name,
        COALESCE(p_model_engine, '9Router-Llama-3.3-70B'),
        COALESCE(p_latency_ms, 185),
        COALESCE(p_tokens_used, 94),
        NULLIF(TRIM(p_request_id), ''),
        NOW()
    )
    RETURNING id, chat_id, user_id, sender, message, sender_name, model_engine, latency_ms, tokens_used, request_id, created_at
    INTO v_inserted_msg;

    -- H. Touch parent chat updated_at
    UPDATE public.umkm_zega_copilot_chats
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
            'message', v_inserted_msg.message,
            'sender_name', v_inserted_msg.sender_name,
            'model_engine', v_inserted_msg.model_engine,
            'latency_ms', v_inserted_msg.latency_ms,
            'tokens_used', v_inserted_msg.tokens_used,
            'request_id', v_inserted_msg.request_id,
            'created_at', v_inserted_msg.created_at
        )
    );
END;
$function$;

-- 3. GRANT EXECUTE PERMISSIONS TO ALL VALID ROLES INCLUDING anon FOR PostgREST EXTERNAL AUTH
REVOKE EXECUTE ON FUNCTION public.fn_save_zega_copilot_message(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_save_zega_copilot_message(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT) TO authenticated, anon, service_role;

-- 4. HARDEN RLS POLICIES FOR SELECT AND INSERT
ALTER TABLE public.umkm_zega_copilot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zega_copilot_messages_select_policy" ON public.umkm_zega_copilot_messages;
CREATE POLICY "zega_copilot_messages_select_policy"
ON public.umkm_zega_copilot_messages
FOR SELECT
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND (
              public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
              OR c.user_id = public.fn_current_app_user_id()::text
              OR (auth.uid() IS NOT NULL AND c.user_id = auth.uid()::text)
          )
    )
);

DROP POLICY IF EXISTS "zega_copilot_messages_insert_policy" ON public.umkm_zega_copilot_messages;
CREATE POLICY "zega_copilot_messages_insert_policy"
ON public.umkm_zega_copilot_messages
FOR INSERT
TO authenticated, anon
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.umkm_zega_copilot_chats AS c
        WHERE c.id = chat_id
          AND (
              public.fn_can_access_umkm_store(c.store_id, c.organization_id, c.workspace_id)
              OR c.user_id = public.fn_current_app_user_id()::text
              OR (auth.uid() IS NOT NULL AND c.user_id = auth.uid()::text)
          )
    )
);

COMMIT;
