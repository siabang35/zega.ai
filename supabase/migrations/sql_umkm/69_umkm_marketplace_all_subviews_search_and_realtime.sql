-- ============================================================================
-- SQL MIGRATION: 69_umkm_marketplace_all_subviews_search_and_realtime.sql
-- Description: Realtime Telemetry, Full-Text Search & Category Filtering 
--              across ALL 7 Marketplace Sub-Views (Popular, Categories, Integrations, 
--              Articles, New Agents, Top Used Leaderboard)
-- ============================================================================

-- 0. Drop Legacy Tables & Functions if Exists
DROP TABLE IF EXISTS public.umkm_marketplace_articles CASCADE;
DROP TABLE IF EXISTS public.umkm_marketplace_integrations CASCADE;
DROP TABLE IF EXISTS public.umkm_marketplace_categories CASCADE;
DROP TABLE IF EXISTS public.umkm_marketplace_popular_agents CASCADE;

DROP FUNCTION IF EXISTS public.get_umkm_marketplace_popular_agents CASCADE;
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_categories CASCADE;
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_integrations CASCADE;
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_articles CASCADE;

-- 1. Table: Popular AI Agents
CREATE TABLE public.umkm_marketplace_popular_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Sales & Marketing',
    icon_key TEXT NOT NULL DEFAULT 'whatsapp',
    ai_model_engine TEXT NOT NULL DEFAULT 'DeepSeek-V3 (9Router Engine)',
    rating_score NUMERIC(3,1) NOT NULL DEFAULT 4.9,
    rating_reviews_count INT NOT NULL DEFAULT 320,
    installs_count_label TEXT NOT NULL DEFAULT '850+ toko',
    price_idr NUMERIC(12,2) NOT NULL DEFAULT 99000.00,
    billing_unit TEXT NOT NULL DEFAULT '/bln',
    badge_label TEXT DEFAULT 'Terpopuler',
    is_installed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for search & store scoping
CREATE INDEX idx_umkm_popular_agents_search 
ON public.umkm_marketplace_popular_agents USING gin (to_tsvector('indonesian', title || ' ' || description || ' ' || category_name));

-- Stored Procedure: Fetch Popular Agents with Search & Category
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_popular_agents(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_search TEXT DEFAULT '',
    p_category TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id UUID,
    store_id TEXT,
    title TEXT,
    description TEXT,
    category_name TEXT,
    icon_key TEXT,
    ai_model_engine TEXT,
    rating_score NUMERIC,
    rating_reviews_count INT,
    installs_count_label TEXT,
    price_idr NUMERIC,
    billing_unit TEXT,
    badge_label TEXT,
    is_installed BOOLEAN,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.store_id, p.title, p.description, p.category_name, p.icon_key,
        p.ai_model_engine, p.rating_score, p.rating_reviews_count, p.installs_count_label,
        p.price_idr, p.billing_unit, p.badge_label, p.is_installed, p.created_at
    FROM public.umkm_marketplace_popular_agents p
    WHERE p.store_id = p_store_id
      AND (p_category IS NULL OR p_category = 'all' OR p_category = '' OR p.category_name ILIKE '%' || p_category || '%')
      AND (
        p_search IS NULL OR p_search = '' OR 
        p.title ILIKE '%' || p_search || '%' OR 
        p.description ILIKE '%' || p_search || '%' OR
        p.ai_model_engine ILIKE '%' || p_search || '%'
      )
    ORDER BY p.rating_reviews_count DESC;
END;
$$;

-- 2. Table: Marketplace Categories
CREATE TABLE public.umkm_marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL UNIQUE,
    display_title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_key TEXT NOT NULL DEFAULT 'layers',
    agent_count INT NOT NULL DEFAULT 12,
    popular_agent_title TEXT,
    bg_gradient TEXT NOT NULL DEFAULT 'from-blue-500/10 to-indigo-500/10'
);

-- Stored Procedure: Fetch Categories with Search
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_categories(
    p_search TEXT DEFAULT ''
)
RETURNS TABLE (
    id UUID,
    category_name TEXT,
    display_title TEXT,
    description TEXT,
    icon_key TEXT,
    agent_count INT,
    popular_agent_title TEXT,
    bg_gradient TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.category_name, c.display_title, c.description, c.icon_key, c.agent_count, c.popular_agent_title, c.bg_gradient
    FROM public.umkm_marketplace_categories c
    WHERE p_search IS NULL OR p_search = '' OR 
          c.display_title ILIKE '%' || p_search || '%' OR 
          c.description ILIKE '%' || p_search || '%';
END;
$$;

-- 3. Table: Integrations (Payment Gateway, POS, E-Commerce, Logistics)
CREATE TABLE public.umkm_marketplace_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'E-Commerce', -- 'E-Commerce', 'Payment Gateway', 'Messaging', 'POS System'
    description TEXT NOT NULL,
    icon_key TEXT NOT NULL DEFAULT 'shopee',
    status TEXT NOT NULL DEFAULT 'Tersedia', -- 'Tersedia', 'Segera Hadir', 'Terhubung'
    connected_stores_count INT NOT NULL DEFAULT 450,
    integration_type TEXT NOT NULL DEFAULT 'API Webhook & OAuth2'
);

-- Stored Procedure: Fetch Integrations with Search
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_integrations(
    p_search TEXT DEFAULT '',
    p_category TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    category_name TEXT,
    description TEXT,
    icon_key TEXT,
    status TEXT,
    connected_stores_count INT,
    integration_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.title, i.category_name, i.description, i.icon_key, i.status, i.connected_stores_count, i.integration_type
    FROM public.umkm_marketplace_integrations i
    WHERE (p_category IS NULL OR p_category = 'all' OR p_category = '' OR i.category_name ILIKE '%' || p_category || '%')
      AND (p_search IS NULL OR p_search = '' OR i.title ILIKE '%' || p_search || '%' OR i.description ILIKE '%' || p_search || '%');
END;
$$;

-- 4. Table: Marketplace Articles & Panduan
CREATE TABLE public.umkm_marketplace_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Panduan Integrasi',
    summary TEXT NOT NULL,
    read_time_minutes INT NOT NULL DEFAULT 5,
    author_name TEXT NOT NULL DEFAULT 'Tim ZEGA AI',
    published_date TEXT NOT NULL DEFAULT '8 Ags 2026',
    view_count INT NOT NULL DEFAULT 1280
);

-- Stored Procedure: Fetch Articles with Search
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_articles(
    p_search TEXT DEFAULT '',
    p_category TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    category_name TEXT,
    summary TEXT,
    read_time_minutes INT,
    author_name TEXT,
    published_date TEXT,
    view_count INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.title, a.category_name, a.summary, a.read_time_minutes, a.author_name, a.published_date, a.view_count
    FROM public.umkm_marketplace_articles a
    WHERE (p_category IS NULL OR p_category = 'all' OR p_category = '' OR a.category_name ILIKE '%' || p_category || '%')
      AND (p_search IS NULL OR p_search = '' OR a.title ILIKE '%' || p_search || '%' OR a.summary ILIKE '%' || p_search || '%');
END;
$$;

-- 5. Seed Production Data for Popular Agents
INSERT INTO public.umkm_marketplace_popular_agents (
    id, store_id, title, description, category_name, icon_key, ai_model_engine,
    rating_score, rating_reviews_count, installs_count_label, price_idr, billing_unit, badge_label, is_installed
) VALUES
(
    'f1111111-1111-4111-a111-111111111111', 'STORE-DEMO-1283',
    'WhatsApp Auto-Customer Support AI',
    'Asisten pelanggan 24/7 untuk menjawab pertanyaan FAQ toko, rekomendasi produk, dan cek status pesanan pelanggan.',
    'Sales & Marketing', 'whatsapp', 'DeepSeek-V3 (9Router High Speed)',
    4.9, 540, '1.200+ toko', 99000.00, '/bln', 'Top 1 Terpopuler', true
),
(
    'f2222222-2222-4222-a222-222222222222', 'STORE-DEMO-1283',
    'Shopee & Tokopedia Product Sync Copywriter',
    'Otomatisasi deskripsi produk SEO persuasif & rekomendasi kata kunci e-commerce untuk mendongkrak penjualan toko.',
    'Sales & Marketing', 'shopee', 'Claude 3.5 Sonnet (ZeroClaw Agent)',
    4.8, 380, '850+ toko', 119000.00, '/bln', 'Paling Dicari', false
),
(
    'f3333333-3333-4333-a333-333333333333', 'STORE-DEMO-1283',
    'AI Financial Report & Cashflow Predictor',
    'Ekstraksi faktur nota belanja, laporan laba rugi otomatis, dan peringatan dini pengeluaran kas toko secara presisi.',
    'Finance & Accounting', 'receipt', 'DeepSeek-V3 (9Router Engine)',
    4.9, 410, '940+ toko', 129000.00, '/bln', 'Favorit Finance', true
),
(
    'f4444444-4444-4444-a444-444444444444', 'STORE-DEMO-1283',
    'Smart Customer Loyalty & Churn Prevention AI',
    'Segmentasi RFM otomatis dan trigger penawaran promo diskon khusus via WhatsApp untuk mencegah pelanggan churn.',
    'CRM & Intelligence', 'piechart', 'Solana x402 Protocol & GPT-4o',
    4.8, 290, '620+ toko', 149000.00, '/bln', 'Enterprise Pick', false
);

-- Seed Production Data for Categories
INSERT INTO public.umkm_marketplace_categories (
    category_name, display_title, description, icon_key, agent_count, popular_agent_title, bg_gradient
) VALUES
('Sales & Marketing', 'Sales & Marketing AI', 'Agen AI untuk kampanye promosi, copywriting e-commerce, dan auto-reply WhatsApp.', 'marketing', 18, 'WhatsApp Auto-Customer Support AI', 'from-blue-500/10 to-cyan-500/10'),
('Finance & Accounting', 'Finance & Accounting AI', 'Otomatisasi faktur nota, rekap kas harian, dan analisis laporan keuangan P&L toko.', 'receipt', 12, 'AI Financial Report & Cashflow Predictor', 'from-emerald-500/10 to-teal-500/10'),
('Store & Operations', 'Store & Operations AI', 'Manajemen inventaris, prediksi stok habis, dan otomatisasi Purchase Order supplier.', 'boxes', 15, 'Smart Inventory Reorder Predictor', 'from-amber-500/10 to-orange-500/10'),
('CRM & Intelligence', 'CRM & Customer Intelligence AI', 'Analisis segmentasi RFM pelanggan, skor kepuasan, dan program loyalitas otomatis.', 'crm', 10, 'Smart Customer Loyalty AI', 'from-purple-500/10 to-indigo-500/10');

-- Seed Production Data for Integrations
INSERT INTO public.umkm_marketplace_integrations (
    title, category_name, description, icon_key, status, connected_stores_count, integration_type
) VALUES
('WhatsApp Business API', 'Messaging', 'Koneksi langsung pesan WhatsApp 24/7 tanpa perantara.', 'whatsapp', 'Terhubung', 1420, 'Official Cloud API'),
('Shopee Seller Center', 'E-Commerce', 'Sinkronisasi produk, pesanan, dan pesanan batal secara realtime.', 'shopee', 'Terhubung', 980, 'Shopee Open Platform OAuth'),
('Tokopedia Partner API', 'E-Commerce', 'Integrasi otomatis katalog dan inventaris Tokopedia.', 'shopee', 'Tersedia', 810, 'Tokopedia Developer API'),
('QRIS & Bank Transfer Payment', 'Payment Gateway', 'Terima pembayaran digital instan dengan validasi otomatis.', 'qris', 'Terhubung', 1150, 'Bank Settlement Gateway'),
('Solana Pay x402 Protocol', 'Payment Gateway', 'Pembayaran micropayment terdesentralisasi kecepatan tinggi.', 'x402', 'Tersedia', 340, 'Solana Web3 Smart Contract');

-- Seed Production Data for Articles & Panduan
INSERT INTO public.umkm_marketplace_articles (
    title, category_name, summary, read_time_minutes, author_name, published_date, view_count
) VALUES
('Cara Mengaktifkan AI Customer Support WhatsApp dalam 3 Menit', 'Panduan Integrasi', 'Panduan langkah demi langkah menyambungkan WhatsApp Business dengan ZeroClaw AI Agent.', 4, 'Tim Engineer ZEGA', '8 Ags 2026', 1540),
('Otomatisasi Faktur & Nota Belanja UMKM dengan OCR 9Router', 'Teknikal & Optimasi', 'Tips menghemat 15 jam kerja per bulan dengan ekstraksi nota otomatis ke laporan kas.', 6, 'Analis Finansial ZEGA', '6 Ags 2026', 1120),
('Strategi Segmentasi RFM Pelanggan untuk Meningkatkan Repeat Order', 'Strategi Bisnis', 'Memaksimalkan penjualan toko dengan mengirimkan penawaran diskon khusus ke segmen pelanggan VIP.', 5, 'Pakar CRM ZEGA', '4 Ags 2026', 980);

-- Enable RLS & Realtime
ALTER TABLE public.umkm_marketplace_popular_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketplace_articles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select on umkm_marketplace_popular_agents') THEN
        CREATE POLICY "Public select on umkm_marketplace_popular_agents" ON public.umkm_marketplace_popular_agents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select on umkm_marketplace_categories') THEN
        CREATE POLICY "Public select on umkm_marketplace_categories" ON public.umkm_marketplace_categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select on umkm_marketplace_integrations') THEN
        CREATE POLICY "Public select on umkm_marketplace_integrations" ON public.umkm_marketplace_integrations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select on umkm_marketplace_articles') THEN
        CREATE POLICY "Public select on umkm_marketplace_articles" ON public.umkm_marketplace_articles FOR SELECT USING (true);
    END IF;
END $$;
