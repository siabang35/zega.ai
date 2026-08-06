-- Migration 19: Enterprise Help & Support Hub Realtime Schema
-- Created for ZEGA Enterprise AI Platform

-- 1. Create FAQs Table
CREATE TABLE IF NOT EXISTS public.enterprise_help_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pengenalan',
    helpful_count INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Support Categories Table
CREATE TABLE IF NOT EXISTS public.enterprise_help_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    count_badge INT NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.enterprise_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code TEXT NOT NULL UNIQUE DEFAULT ('TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    user_email TEXT NOT NULL DEFAULT 'admin@zegaai.site',
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Otomatisasi',
    priority TEXT NOT NULL DEFAULT 'Sedang', -- 'Rendah', 'Sedang', 'Tinggi'
    status TEXT NOT NULL DEFAULT 'Diproses', -- 'Diterima', 'Diproses', 'Selesai', 'Butuh Respon'
    message TEXT NOT NULL,
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Live Chat Messages Table
CREATE TABLE IF NOT EXISTS public.enterprise_help_live_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.enterprise_support_tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'ai_specialist', 'engineer'
    sender_name TEXT NOT NULL DEFAULT 'Enterprise Admin',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enterprise_help_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_help_live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies (Allow All for Enterprise Authenticated & Anon Users)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_help_faqs') THEN
        CREATE POLICY "Allow select for all enterprise_help_faqs" ON public.enterprise_help_faqs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow write for all enterprise_help_faqs') THEN
        CREATE POLICY "Allow write for all enterprise_help_faqs" ON public.enterprise_help_faqs FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_help_categories') THEN
        CREATE POLICY "Allow select for all enterprise_help_categories" ON public.enterprise_help_categories FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_support_tickets') THEN
        CREATE POLICY "Allow select for all enterprise_support_tickets" ON public.enterprise_support_tickets FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow write for all enterprise_support_tickets') THEN
        CREATE POLICY "Allow write for all enterprise_support_tickets" ON public.enterprise_support_tickets FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_help_live_chat_messages') THEN
        CREATE POLICY "Allow select for all enterprise_help_live_chat_messages" ON public.enterprise_help_live_chat_messages FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow write for all enterprise_help_live_chat_messages') THEN
        CREATE POLICY "Allow write for all enterprise_help_live_chat_messages" ON public.enterprise_help_live_chat_messages FOR ALL USING (true);
    END IF;
END $$;

-- Safe Realtime Publication Registration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_help_faqs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_help_faqs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_support_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_support_tickets;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_help_live_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_help_live_chat_messages;
    END IF;
END $$;

-- Seed Initial FAQs matching screenshot design
INSERT INTO public.enterprise_help_faqs (question, answer, category, helpful_count, is_featured) VALUES
('Bagaimana cara memulai dengan ZEGA AI Platform?', 'Untuk memulai, jelajahi AI Command Center untuk memantau agen aktif Anda, atau buat otomatisasi workflow pertama Anda di Workflow Studio. Anda juga dapat menghubungkan basis pengetahuan di Knowledge Hub.', 'Pengenalan', 42, true),
('Bagaimana cara membuat workflow otomatisasi baru?', 'Buka menu Workflow Studio dari navigasi kiri, lalu pilih "Buat Canvas Baru" atau gunakan katalog template siap pakai seperti Customer Support Automation dan E-Commerce Lead Processing.', 'Otomatisasi', 38, true),
('Apa bedanya Customer Support Agent dengan Sales Specialist Agent?', 'Customer Support Agent difokuskan pada penanganan keluhan teknis, FAQ, dan resolusi tiket 24/7. Sedangkan Sales Specialist Agent dilengkapi dengan kemampuan rekomendasi produk, negosiasi harga, dan integrasi payment gateway.', 'AI Employees', 56, true),
('Bagaimana cara mengupgrade paket langganan ke Scale/Enterprise?', 'Navigasikan ke menu Payments & Billing, lalu klik tombol "Upgrade Scale" di bagian header atas atau pilih paket Enterprise untuk mendapatkan kuota GPU tak terbatas dan SLA dukungan 99.99%.', 'Billing & Paket', 29, true),
('Bagaimana cara melakukan integrasi Webhook dan REST API?', 'Akses menu API & SDK Vault di bawah grup platform untuk mengambil Secret API Key dan Webhook Endpoint URL. Dokumentasi lengkap SDK Node.js & Python tersedia di Developer Portal.', 'API & Integrasi', 61, true)
ON CONFLICT DO NOTHING;

-- Seed Initial Categories
INSERT INTO public.enterprise_help_categories (name, slug, icon, count_badge, display_order) VALUES
('Semua', 'semua', 'BookOpen', 5, 1),
('Pengenalan', 'pengenalan', 'Sparkles', 1, 2),
('Otomatisasi', 'otomatisasi', 'Zap', 1, 3),
('AI Employees', 'ai-employees', 'Headphones', 1, 4),
('Billing & Paket', 'billing-paket', 'Shield', 1, 5),
('API & Integrasi', 'api-integrasi', 'Code', 1, 6)
ON CONFLICT (name) DO NOTHING;

-- Seed Sample Support Ticket
INSERT INTO public.enterprise_support_tickets (ticket_code, user_email, subject, category, priority, status, message, response) VALUES
('TKT-ZEGA88', 'admin@zegaai.site', 'Kendala pada Sync WhatsApp API & Webhook Dispatch', 'API & Integrasi', 'Tinggi', 'Diproses', 'Mohon bantuan untuk verifikasi webhook endpoint WhatsApp API yang terkadang mengalami delay lebih dari 500ms.', 'Tim engineer ZEGA sedang melakukan optimasi edge router gRPC untuk mengurangi latency webhook.')
ON CONFLICT (ticket_code) DO NOTHING;
