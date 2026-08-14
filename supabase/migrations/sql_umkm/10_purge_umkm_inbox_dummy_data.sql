-- ============================================================================
-- ZEGA AI: Purge UMKM Inbox Dummy Data Migration (Production Zero-State)
-- File: 10_purge_umkm_inbox_dummy_data.sql
-- ============================================================================

-- 1. Purge all inbox notes, messages, and conversations (non-destructive to schema)
TRUNCATE TABLE public.umkm_inbox_notes CASCADE;
TRUNCATE TABLE public.umkm_inbox_messages CASCADE;
TRUNCATE TABLE public.umkm_inbox_conversations CASCADE;

-- 2. Verify zero-state counts
DO $$
DECLARE
    v_conv_count INT;
    v_msg_count INT;
    v_note_count INT;
BEGIN
    SELECT COUNT(*) INTO v_conv_count FROM public.umkm_inbox_conversations;
    SELECT COUNT(*) INTO v_msg_count FROM public.umkm_inbox_messages;
    SELECT COUNT(*) INTO v_note_count FROM public.umkm_inbox_notes;
    
    RAISE NOTICE 'ZEGA Inbox Zero-State Verified: Conversations=%, Messages=%, Notes=%', v_conv_count, v_msg_count, v_note_count;
END $$;
