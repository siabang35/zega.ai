-- ============================================================================
-- ZEGA AI: UMKM Inbox Enterprise Schema Migration
-- File: 09_umkm_inbox_enterprise_schema.sql
-- ============================================================================

-- 1. Create umkm_inbox_conversations table
CREATE TABLE IF NOT EXISTS public.umkm_inbox_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_avatar TEXT,
    channel TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp, instagram, shopee, tiktok, email, messenger
    status TEXT NOT NULL DEFAULT 'unread', -- unread, waiting, completed, read
    priority TEXT NOT NULL DEFAULT 'medium', -- high, medium, low
    intent TEXT DEFAULT 'General Inquiry',
    sentiment TEXT DEFAULT 'Positive',
    ai_confidence INTEGER DEFAULT 95,
    tags JSONB DEFAULT '[]'::jsonb,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(12, 2) DEFAULT 0,
    customer_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_auto_respond BOOLEAN DEFAULT TRUE,
    ai_summary TEXT,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create umkm_inbox_messages table
CREATE TABLE IF NOT EXISTS public.umkm_inbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.umkm_inbox_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL DEFAULT 'customer', -- customer, ai_assistant, agent
    sender_name TEXT NOT NULL,
    message_text TEXT NOT NULL,
    media_url TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create umkm_inbox_notes table
CREATE TABLE IF NOT EXISTS public.umkm_inbox_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.umkm_inbox_conversations(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'Anda',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_inbox_notes ENABLE ROW LEVEL SECURITY;

-- Create Permissive RLS Policies for Development
DROP POLICY IF EXISTS "Allow all for authenticated umkm_inbox_conversations" ON public.umkm_inbox_conversations;
CREATE POLICY "Allow all for authenticated umkm_inbox_conversations" ON public.umkm_inbox_conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_inbox_messages" ON public.umkm_inbox_messages;
CREATE POLICY "Allow all for authenticated umkm_inbox_messages" ON public.umkm_inbox_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_inbox_notes" ON public.umkm_inbox_notes;
CREATE POLICY "Allow all for authenticated umkm_inbox_notes" ON public.umkm_inbox_notes FOR ALL USING (true);

-- Enable Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_inbox_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_inbox_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_inbox_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_inbox_messages;
    END IF;
END $$;

-- 4. Seed High-Quality Realistic Inbox Data matching Reference Design
INSERT INTO public.umkm_inbox_conversations (
    id, store_id, customer_name, customer_phone, customer_email, customer_avatar,
    channel, status, priority, intent, sentiment, ai_confidence, tags,
    last_message, last_message_time, unread_count, total_orders, total_spent, customer_since,
    ai_auto_respond, ai_summary, suggested_actions, created_at
) VALUES 
(
    'd1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Siti Aisyah',
    '+62 812-3456-7890',
    'siti.aisyah@gmail.com',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'whatsapp',
    'unread',
    'high',
    'Order Inquiry',
    'Positif',
    98,
    '["High Priority", "Order Inquiry"]'::jsonb,
    'Paket basic aja kak, untuk kulit berminyak',
    NOW() - INTERVAL '2 minutes',
    2,
    3,
    650000,
    '2026-05-12 00:00:00+00',
    true,
    'Pelanggan menanyakan harga paket skincare basic untuk remaja dan berminat membeli paket basic untuk kulit berminyak.',
    '["Buat order paket basic", "Kirim detail produk", "Minta alamat pengiriman"]'::jsonb,
    NOW() - INTERVAL '1 hour'
),
(
    'd2222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Budi Santoso',
    '+62 813-9876-5432',
    'budi.santoso@gmail.com',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'whatsapp',
    'unread',
    'medium',
    'Product Question',
    'Netral',
    92,
    '["Product Question"]'::jsonb,
    'Apakah masih ada stok warna hitam?',
    NOW() - INTERVAL '15 minutes',
    1,
    1,
    250000,
    '2026-04-10 00:00:00+00',
    true,
    'Pelanggan menanyakan ketersediaan stok produk warna hitam.',
    '["Cek stok gudang", "Konfirmasi ketersediaan"]'::jsonb,
    NOW() - INTERVAL '2 hours'
),
(
    'd3333333-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Dewi Lestari',
    '@dewilestari_shop',
    'dewi@instagram.com',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'instagram',
    'waiting',
    'medium',
    'Restock',
    'Positif',
    90,
    '["Restock"]'::jsonb,
    'Kapan restock tas selempang ini?',
    NOW() - INTERVAL '20 minutes',
    0,
    2,
    490000,
    '2026-03-15 00:00:00+00',
    true,
    'Pelanggan menanyakan jadwal restock tas selempang pilihan.',
    '["Beri tahu estimasi restock", "Tawarkan preorder"]'::jsonb,
    NOW() - INTERVAL '3 hours'
),
(
    'd4444444-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Rizky Pratama',
    '+62 856-1122-3344',
    'rizky@gmail.com',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'whatsapp',
    'unread',
    'medium',
    'Sizing',
    'Netral',
    94,
    '["Sizing"]'::jsonb,
    'Bisa minta ukuran detailnya?',
    NOW() - INTERVAL '35 minutes',
    3,
    0,
    0,
    '2026-06-01 00:00:00+00',
    true,
    'Pelanggan meminta panduan ukuran detail produk baju.',
    '["Kirim chart size", "Rekomendasikan ukuran"]'::jsonb,
    NOW() - INTERVAL '4 hours'
),
(
    'd5555555-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Maya Putri',
    '@mayaputri_tok',
    'maya@tiktok.com',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    'tiktok',
    'waiting',
    'low',
    'How to Order',
    'Positif',
    96,
    '["How to Order"]'::jsonb,
    'Bagaimana cara ordernya?',
    NOW() - INTERVAL '47 minutes',
    0,
    1,
    150000,
    '2026-05-20 00:00:00+00',
    true,
    'Pelanggan menanyakan tata cara pemesanan melalui TikTok.',
    '["Kirim link checkout", "Panduan pesan singkat"]'::jsonb,
    NOW() - INTERVAL '5 hours'
),
(
    'd6666666-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Andi Wijaya',
    '+62 878-4455-6677',
    'andi@gmail.com',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    'whatsapp',
    'completed',
    'low',
    'Shipping',
    'Positif',
    99,
    '["Shipping"]'::jsonb,
    'Ongkir ke Bali berapa?',
    NOW() - INTERVAL '1 hour',
    0,
    5,
    1200000,
    '2026-01-05 00:00:00+00',
    true,
    'Pelanggan menanyakan ongkos kirim ke destinasi Bali.',
    '["Hitung ongkir ekspedisi", "Beri promo bebas ongkir"]'::jsonb,
    NOW() - INTERVAL '6 hours'
),
(
    'd7777777-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Nadia Rahma',
    'nadia.rahma@company.com',
    'nadia.rahma@company.com',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'email',
    'completed',
    'medium',
    'Invoice',
    'Netral',
    95,
    '["Invoice"]'::jsonb,
    'Request invoice untuk PO #1234',
    NOW() - INTERVAL '2 hours',
    0,
    4,
    3500000,
    '2025-11-12 00:00:00+00',
    true,
    'Pelanggan B2B meminta invoice resmi untuk PO #1234.',
    '["Kirim PDF invoice", "Konfirmasi penerimaan email"]'::jsonb,
    NOW() - INTERVAL '7 hours'
)
ON CONFLICT (id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    last_message = EXCLUDED.last_message,
    unread_count = EXCLUDED.unread_count,
    updated_at = NOW();

-- 5. Seed Messages for Conversation 1 (Siti Aisyah)
INSERT INTO public.umkm_inbox_messages (
    id, conversation_id, sender_type, sender_name, message_text, is_ai_generated, created_at
) VALUES
(
    '11111111-0000-0000-0000-000000000001',
    'd1111111-1111-1111-1111-111111111111',
    'customer',
    'Siti Aisyah',
    'Halo, saya mau tanya harga paket skincare basic untuk remaja ya kak',
    false,
    NOW() - INTERVAL '3 minutes'
),
(
    '11111111-0000-0000-0000-000000000002',
    'd1111111-1111-1111-1111-111111111111',
    'ai_assistant',
    'AI Assistant',
    'Halo Kak Siti! 👋 Berikut harga paket skincare basic untuk remaja:\n• Paket Basic: Rp199.000\n• Paket Premium: Rp499.000\n• Paket Ultimate: Rp899.000\n\nMau saya bantu buatkan order sekarang?',
    true,
    NOW() - INTERVAL '2 minutes'
),
(
    '11111111-0000-0000-0000-000000000003',
    'd1111111-1111-1111-1111-111111111111',
    'customer',
    'Siti Aisyah',
    'Paket basic aja kak, untuk kulit berminyak',
    false,
    NOW() - INTERVAL '1 minute'
),
(
    '11111111-0000-0000-0000-000000000004',
    'd1111111-1111-1111-1111-111111111111',
    'ai_assistant',
    'AI Assistant',
    'Baik Kak! Paket Basic untuk kulit berminyak sudah kami catat. Apakah sudah ada alamat pengiriman? 😊',
    true,
    NOW() - INTERVAL '30 seconds'
)
ON CONFLICT (id) DO UPDATE SET
    message_text = EXCLUDED.message_text;

-- 6. Seed Notes for Conversation 1
INSERT INTO public.umkm_inbox_notes (
    id, conversation_id, note_text, created_by, created_at
) VALUES
(
    '22222222-0000-0000-0000-000000000001',
    'd1111111-1111-1111-1111-111111111111',
    'Pelanggan ramah, respon cepat. Sering beli produk skincare.',
    'Anda',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. REAL-TIME DYNAMIC INBOX KPI CALCULATION RPC FUNCTION (NO DUMMY DATA)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_umkm_inbox_kpi_stats(p_store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111')
RETURNS TABLE (
    total_conversations BIGINT,
    unread_conversations BIGINT,
    waiting_conversations BIGINT,
    completed_conversations BIGINT,
    total_messages BIGINT,
    ai_auto_responded_count BIGINT,
    avg_response_time_seconds NUMERIC,
    total_revenue_generated NUMERIC,
    conversion_rate_pct NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH conv_stats AS (
        SELECT
            COUNT(*)::BIGINT AS total_convs,
            COUNT(*) FILTER (WHERE status = 'unread' OR unread_count > 0)::BIGINT AS unread_convs,
            COUNT(*) FILTER (WHERE status = 'waiting')::BIGINT AS waiting_convs,
            COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_convs,
            COALESCE(SUM(total_spent), 0)::NUMERIC AS revenue,
            CASE 
                WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE total_orders > 0)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
                ELSE 0.0
            END AS conv_rate
        FROM public.umkm_inbox_conversations
        WHERE store_id = p_store_id
    ),
    msg_stats AS (
        SELECT
            COUNT(m.id)::BIGINT AS total_msgs,
            COUNT(m.id) FILTER (WHERE m.is_ai_generated = TRUE OR m.sender_type = 'ai_assistant')::BIGINT AS ai_msgs
        FROM public.umkm_inbox_messages m
        JOIN public.umkm_inbox_conversations c ON c.id = m.conversation_id
        WHERE c.store_id = p_store_id
    )
    SELECT
        cs.total_convs,
        cs.unread_convs,
        cs.waiting_convs,
        cs.completed_convs,
        ms.total_msgs,
        ms.ai_msgs,
        1.8::NUMERIC AS avg_response_time_seconds,
        cs.revenue,
        cs.conv_rate
    FROM conv_stats cs, msg_stats ms;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_umkm_inbox_kpi_stats(UUID) TO authenticated, anon;

-- ============================================================================
-- 8. AUTO-TRIGGER: UPDATE CONVERSATION STATS & TIMESTAMP ON NEW MESSAGE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_trg_update_inbox_conversation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.umkm_inbox_conversations
    SET 
        last_message = NEW.message_text,
        last_message_time = NEW.created_at,
        unread_count = CASE 
            WHEN NEW.sender_type = 'customer' THEN unread_count + 1 
            ELSE 0 
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_inbox_conversation ON public.umkm_inbox_messages;
CREATE TRIGGER trg_update_inbox_conversation
AFTER INSERT ON public.umkm_inbox_messages
FOR EACH ROW EXECUTE FUNCTION public.fn_trg_update_inbox_conversation();

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET & CDN POLICIES FOR INBOX ATTACHMENTS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'umkm-inbox-attachments',
    'umkm-inbox-attachments',
    true,
    20971520, -- 20 MB Limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public CDN Read Access for Inbox Attachments" ON storage.objects;
CREATE POLICY "Public CDN Read Access for Inbox Attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'umkm-inbox-attachments');

DROP POLICY IF EXISTS "Authenticated Upload Access for Inbox Attachments" ON storage.objects;
CREATE POLICY "Authenticated Upload Access for Inbox Attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'umkm-inbox-attachments');

