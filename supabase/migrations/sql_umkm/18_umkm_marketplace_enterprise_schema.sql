-- ============================================================================
-- SQL MIGRATION: 18_umkm_marketplace_enterprise_schema.sql
-- Description: Enterprise AI Marketplace Schema for UMKM Sales Hub
-- Features: AI Employees Repository, Payment Integrations, AI Marketplace Categories,
--           Recent Articles & Guides, Top Installed AI Agents, and Realtime RLS
-- ============================================================================

-- 1. AI Employees Repository
CREATE TABLE IF NOT EXISTS public.umkm_marketplace_ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Sales',
    badge_label TEXT,
    badge_color TEXT,
    icon_key TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'shopee', 'instagram', 'qris', 'restaurant', 'laundry'
    rating_score NUMERIC(3,1) NOT NULL DEFAULT 4.9,
    rating_reviews_count INT NOT NULL DEFAULT 1200,
    installs_count_label TEXT NOT NULL DEFAULT '2.4k+',
    price_idr NUMERIC(12,2) NOT NULL DEFAULT 99000.00,
    billing_unit TEXT NOT NULL DEFAULT '/bln',
    is_installed BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Payment Gateway Integrations
CREATE TABLE IF NOT EXISTS public.umkm_marketplace_payment_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_label TEXT,
    icon_key TEXT NOT NULL DEFAULT 'x402', -- 'x402', 'stripe', 'midtrans', 'qris', 'gopay', 'ovo', 'dana'
    is_connected BOOLEAN NOT NULL DEFAULT false,
    connection_status TEXT NOT NULL DEFAULT 'Terhubung', -- 'Terhubung', 'Disconnect'
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Marketplace Categories
CREATE TABLE IF NOT EXISTS public.umkm_marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Articles & Guides
CREATE TABLE IF NOT EXISTS public.umkm_marketplace_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Sales',
    views_count INT NOT NULL DEFAULT 532,
    time_ago TEXT NOT NULL DEFAULT '2 jam lalu',
    url TEXT NOT NULL DEFAULT '#',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. New & Top AI Agents Summary
CREATE TABLE IF NOT EXISTS public.umkm_marketplace_new_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Finance',
    badge_label TEXT NOT NULL DEFAULT 'Baru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_marketplace_top_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    rank_order INT NOT NULL,
    title TEXT NOT NULL,
    installs_count_label TEXT NOT NULL DEFAULT '2.4k instalasi',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DEMO DATA
-- ============================================================================

DELETE FROM public.umkm_marketplace_ai_agents WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_marketplace_payment_integrations WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_marketplace_categories WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_marketplace_articles WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_marketplace_new_agents WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_marketplace_top_agents WHERE store_id = 'STORE-DEMO-1283';

-- 1. Insert AI Employees
INSERT INTO public.umkm_marketplace_ai_agents (
    store_id, title, description, category_name, badge_label, badge_color, icon_key,
    rating_score, rating_reviews_count, installs_count_label, price_idr, billing_unit, is_installed, sort_order
) VALUES
(
    'STORE-DEMO-1283', 'WhatsApp Sales AI',
    'AI untuk membalas chat, menjawab pertanyaan, dan meningkatkan penjualan WhatsApp.',
    'Sales', 'Populer', 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
    'whatsapp', 4.9, 1200, '2.4k+', 99000.00, '/bln', true, 1
),
(
    'STORE-DEMO-1283', 'Shopee AI Assistant',
    'Kelola toko Shopee otomatis: balas chat, update stok, dan proses pesanan.',
    'Sales', NULL, NULL,
    'shopee', 4.8, 856, '1.8k+', 129000.00, '/bln', false, 2
),
(
    'STORE-DEMO-1283', 'Instagram AI',
    'Buat konten, balas DM, dan kelola komentar Instagram otomatis.',
    'Marketing', NULL, NULL,
    'instagram', 4.8, 742, '1.5k+', 89000.00, '/bln', false, 3
),
(
    'STORE-DEMO-1283', 'QRIS Payment AI',
    'Terima pembayaran QRIS, cek pembayaran, dan kirim struk otomatis.',
    'Finance', NULL, NULL,
    'qris', 4.8, 532, '1.2k+', 79000.00, '/bln', true, 4
),
(
    'STORE-DEMO-1283', 'Restaurant AI',
    'AI untuk restoran, terima pesanan, reservasi, dan promosi otomatis.',
    'Store & Operations', NULL, NULL,
    'restaurant', 4.7, 523, '980+', 149000.00, '/bln', false, 5
),
(
    'STORE-DEMO-1283', 'Laundry AI',
    'Kelola pesanan laundry, notifikasi, dan pemindahan otomatis.',
    'Store & Operations', NULL, NULL,
    'laundry', 4.7, 412, '760+', 99000.00, '/bln', false, 6
);

-- 2. Insert Payment Integrations
INSERT INTO public.umkm_marketplace_payment_integrations (
    store_id, title, description, badge_label, icon_key, is_connected, connection_status, sort_order
) VALUES
('STORE-DEMO-1283', 'x402 Network (M2H)', 'Pembayaran mesin-ke-mesin menggunakan stablecoin via x402 protocol.', 'Baru', 'x402', true, 'Terhubung', 1),
('STORE-DEMO-1283', 'Stripe', 'Terima pembayaran kartu kredit global via Stripe Connect.', NULL, 'stripe', false, 'Hubungkan', 2),
('STORE-DEMO-1283', 'Midtrans', 'Gateway pembayaran lengkap untuk Indonesia.', NULL, 'midtrans', true, 'Terhubung', 3),
('STORE-DEMO-1283', 'QRIS', 'Terima pembayaran QRIS otomatis.', NULL, 'qris', true, 'Terhubung', 4),
('STORE-DEMO-1283', 'GoPay', 'Terima pembayaran GoPay.', NULL, 'gopay', false, 'Hubungkan', 5),
('STORE-DEMO-1283', 'OVO', 'Terima pembayaran OVO.', NULL, 'ovo', false, 'Hubungkan', 6),
('STORE-DEMO-1283', 'DANA', 'Terima pembayaran DANA.', NULL, 'dana', false, 'Hubungkan', 7);

-- 3. Insert Categories
INSERT INTO public.umkm_marketplace_categories (store_id, name, count, sort_order) VALUES
('STORE-DEMO-1283', 'Semua', 24, 1),
('STORE-DEMO-1283', 'Sales', 23, 2),
('STORE-DEMO-1283', 'Marketing', 18, 3),
('STORE-DEMO-1283', 'Customer Service', 14, 4),
('STORE-DEMO-1283', 'Finance', 12, 5),
('STORE-DEMO-1283', 'Store & Operations', 10, 6),
('STORE-DEMO-1283', 'Productivity', 8, 7),
('STORE-DEMO-1283', 'Analytics', 6, 8),
('STORE-DEMO-1283', 'Lainnya', 5, 9);

-- 4. Insert Articles & Guides
INSERT INTO public.umkm_marketplace_articles (store_id, title, category_name, views_count, time_ago) VALUES
('STORE-DEMO-1283', 'Cara Mengoptimalkan WhatsApp Sales AI', 'Sales', 532, '2 jam lalu'),
('STORE-DEMO-1283', 'Panduan Integrasi Pembayaran QRIS', 'Finance', 421, '5 jam lalu'),
('STORE-DEMO-1283', 'Tips Meningkatkan Conversion dengan AI', 'Marketing', 389, '1 hari lalu');

-- 5. Insert New AI Agents
INSERT INTO public.umkm_marketplace_new_agents (store_id, title, category_name, badge_label) VALUES
('STORE-DEMO-1283', 'AI Invoice Processor', 'Finance', 'Baru'),
('STORE-DEMO-1283', 'AI Product Description Generator', 'Marketing', 'Baru'),
('STORE-DEMO-1283', 'AI Customer Segmentation', 'Analytics', 'Baru');

-- 6. Insert Top AI Agents
INSERT INTO public.umkm_marketplace_top_agents (store_id, rank_order, title, installs_count_label) VALUES
('STORE-DEMO-1283', 1, 'WhatsApp Sales AI', '2.4k instalasi'),
('STORE-DEMO-1283', 2, 'Shopee AI Assistant', '1.8k instalasi'),
('STORE-DEMO-1283', 3, 'QRIS Payment AI', '1.2k instalasi');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & REALTIME PUBLICATION
-- ============================================================================

ALTER TABLE public.umkm_marketplace_ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_payment_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_new_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_top_agents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_marketplace_ai_agents') THEN
        CREATE POLICY "Public select access on umkm_marketplace_ai_agents" ON public.umkm_marketplace_ai_agents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_marketplace_payment_integrations') THEN
        CREATE POLICY "Public select access on umkm_marketplace_payment_integrations" ON public.umkm_marketplace_payment_integrations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_marketplace_categories') THEN
        CREATE POLICY "Public select access on umkm_marketplace_categories" ON public.umkm_marketplace_categories FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_ai_agents;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_payment_integrations;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_categories;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
