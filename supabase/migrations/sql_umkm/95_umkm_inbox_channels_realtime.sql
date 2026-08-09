-- Migration 95: UMKM Inbox Channels, Messages & Internal Notes Realtime Schema
-- Enterprise Multi-Channel Inbox Schema (WhatsApp, Instagram, Shopee, TikTok, Email, Messenger)

-- 1. Inbox Conversations Table
CREATE TABLE IF NOT EXISTS public.umkm_inbox_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(100),
    customer_email VARCHAR(150),
    customer_avatar TEXT,
    customer_address TEXT,
    customer_notes TEXT,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'instagram', 'shopee', 'tiktok', 'email', 'messenger'
    status VARCHAR(50) NOT NULL DEFAULT 'unread', -- 'unread', 'waiting', 'completed'
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
    intent VARCHAR(100) DEFAULT 'General Inquiry',
    sentiment VARCHAR(50) DEFAULT 'Positif',
    ai_confidence INT DEFAULT 95,
    tags JSONB DEFAULT '[]'::jsonb,
    is_starred BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    assigned_agent VARCHAR(150) DEFAULT 'Cicik Berluk',
    last_message TEXT,
    last_message_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unread_count INT DEFAULT 1,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(15,2) DEFAULT 0.00,
    customer_since VARCHAR(50) DEFAULT '2026',
    ai_auto_respond BOOLEAN DEFAULT true,
    ai_summary TEXT,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Migration for existing table columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_conversations' 
          AND column_name = 'last_message_time' 
          AND data_type = 'character varying'
    ) THEN
        ALTER TABLE public.umkm_inbox_conversations 
        ALTER COLUMN last_message_time TYPE TIMESTAMPTZ USING NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_conversations' 
          AND column_name = 'is_starred'
    ) THEN
        ALTER TABLE public.umkm_inbox_conversations ADD COLUMN is_starred BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_conversations' 
          AND column_name = 'is_archived'
    ) THEN
        ALTER TABLE public.umkm_inbox_conversations ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_conversations' 
          AND column_name = 'assigned_agent'
    ) THEN
        ALTER TABLE public.umkm_inbox_conversations ADD COLUMN assigned_agent VARCHAR(150) DEFAULT 'Cicik Berluk';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_conversations' 
          AND column_name = 'customer_address'
    ) THEN
        ALTER TABLE public.umkm_inbox_conversations ADD COLUMN customer_address TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_conversations' 
          AND column_name = 'customer_notes'
    ) THEN
        ALTER TABLE public.umkm_inbox_conversations ADD COLUMN customer_notes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_messages' 
          AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.umkm_inbox_messages 
        ADD COLUMN store_id UUID REFERENCES public.umkm_stores(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_inbox_notes' 
          AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.umkm_inbox_notes 
        ADD COLUMN store_id UUID REFERENCES public.umkm_stores(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Inbox Messages Stream Table
CREATE TABLE IF NOT EXISTS public.umkm_inbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.umkm_inbox_conversations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL DEFAULT 'customer', -- 'customer', 'ai_assistant', 'agent'
    sender_name VARCHAR(150) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Inbox Internal Notes Table
CREATE TABLE IF NOT EXISTS public.umkm_inbox_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.umkm_inbox_conversations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by VARCHAR(150) DEFAULT 'Anda',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing & Unique Indexes for ON CONFLICT resolution
CREATE UNIQUE INDEX IF NOT EXISTS umkm_inbox_conversations_id_idx ON public.umkm_inbox_conversations(id);
CREATE INDEX IF NOT EXISTS idx_umkm_inbox_conversations_store_channel ON public.umkm_inbox_conversations(store_id, channel);
CREATE INDEX IF NOT EXISTS idx_umkm_inbox_messages_conv ON public.umkm_inbox_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_umkm_inbox_notes_conv ON public.umkm_inbox_notes(conversation_id);

-- Enable RLS Policies
ALTER TABLE public.umkm_inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_inbox_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_inbox_conversations') THEN
        CREATE POLICY "Public read umkm_inbox_conversations" ON public.umkm_inbox_conversations FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_inbox_conversations" ON public.umkm_inbox_conversations FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_inbox_messages') THEN
        CREATE POLICY "Public read umkm_inbox_messages" ON public.umkm_inbox_messages FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_inbox_messages" ON public.umkm_inbox_messages FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_inbox_notes') THEN
        CREATE POLICY "Public read umkm_inbox_notes" ON public.umkm_inbox_notes FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_inbox_notes" ON public.umkm_inbox_notes FOR ALL USING (true);
    END IF;
END $$;

-- SEED DEMO MULTI-CHANNEL DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_inbox_conversations (
    id, store_id, customer_name, customer_phone, customer_email, customer_avatar, channel, status, priority, intent, sentiment, ai_confidence, tags, last_message, last_message_time, unread_count, total_orders, total_spent, customer_since, ai_auto_respond, ai_summary, suggested_actions
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
        'Halo, saya mau tanya harga paket skincare basic untuk remaja ya kak',
        NOW() - INTERVAL '15 minutes',
        2,
        3,
        650000,
        '2026-05-12',
        true,
        'Pelanggan menanyakan harga paket skincare basic untuk remaja dan berminat membeli paket basic untuk kulit berminyak.',
        '["Buat order paket basic", "Kirim detail produk", "Minta alamat pengiriman"]'::jsonb
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
        NOW() - INTERVAL '30 minutes',
        1,
        1,
        250000,
        '2026-04-10',
        true,
        'Pelanggan menanyakan ketersediaan stok warna hitam.',
        '["Cek stok gudang", "Konfirmasi ketersediaan"]'::jsonb
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
        NOW() - INTERVAL '45 minutes',
        0,
        2,
        490000,
        '2026-03-15',
        true,
        'Pelanggan menanyakan jadwal restock produk tas.',
        '["Beri tahu estimasi restock", "Tawarkan preorder"]'::jsonb
    ),
    (
        'd4444444-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'Rizky Pratama',
        'user_shopee_rizky',
        'rizky@shopee.co.id',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        'shopee',
        'unread',
        'medium',
        'Sizing',
        'Netral',
        94,
        '["Sizing"]'::jsonb,
        'Bisa minta ukuran detailnya?',
        NOW() - INTERVAL '1 hour',
        3,
        0,
        0,
        '2026-06-01',
        true,
        'Pelanggan meminta ukuran detail baju.',
        '["Kirim chart size"]'::jsonb
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
        NOW() - INTERVAL '2 hours',
        0,
        1,
        150000,
        '2026-05-20',
        true,
        'Pelanggan menanyakan tata cara pemesanan.',
        '["Kirim link checkout"]'::jsonb
    ),
    (
        'd6666666-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'Andi Wijaya',
        '+62 878-4455-6677',
        'andi.wijaya@gmail.com',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        'messenger',
        'completed',
        'low',
        'Shipping',
        'Positif',
        99,
        '["Shipping"]'::jsonb,
        'Ongkir ke Bali berapa?',
        NOW() - INTERVAL '3 hours',
        0,
        5,
        1200000,
        '2026-01-05',
        true,
        'Pelanggan menanyakan ongkos kirim ke Bali.',
        '["Beri info ekspedisi"]'::jsonb
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
        NOW() - INTERVAL '4 hours',
        0,
        4,
        3500000,
        '2025-11-12',
        true,
        'Request invoice PO #1234.',
        '["Kirim PDF invoice"]'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    channel = EXCLUDED.channel,
    last_message = EXCLUDED.last_message,
    last_message_time = EXCLUDED.last_message_time,
    updated_at = NOW();

-- Seed Messages
INSERT INTO public.umkm_inbox_messages (
    id, conversation_id, store_id, sender_type, sender_name, message_text, created_at
) VALUES 
    ('11111111-2222-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'customer', 'Siti Aisyah', 'Halo, saya mau tanya harga paket skincare basic untuk remaja ya kak', NOW() - INTERVAL '10 minutes'),
    ('11111111-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ai_assistant', 'AI Assistant', 'Halo Kak Siti! 👋\nBerikut harga paket skincare basic untuk remaja:\n\n• Paket Basic: Rp199.000\n• Paket Premium: Rp499.000\n• Paket Ultimate: Rp899.000\n\nMau saya bantu buatkan order sekarang?', NOW() - INTERVAL '9 minutes'),
    ('11111111-2222-3333-3333-333333333333', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'customer', 'Siti Aisyah', 'Paket basic aja kak, untuk kulit berminyak', NOW() - INTERVAL '8 minutes'),
    ('11111111-2222-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ai_assistant', 'AI Assistant', 'Baik Kak! Paket Basic untuk kulit berminyak sudah kami catat. Apakah sudah ada alamat pengiriman? 😊', NOW() - INTERVAL '7 minutes')
ON CONFLICT (id) DO NOTHING;

-- Seed Internal Notes
INSERT INTO public.umkm_inbox_notes (
    id, conversation_id, store_id, note_text, created_by, created_at
) VALUES 
    ('11111111-3333-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pelanggan ramah, respon cepat. Sering beli produk skincare.', 'Anda', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Enable Supabase Realtime for Inbox Tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_inbox_conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_inbox_conversations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_inbox_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_inbox_messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_inbox_notes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_inbox_notes;
    END IF;
END $$;
