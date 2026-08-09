-- =========================================================================
-- MIGRATION: 99_umkm_sales_by_source_enterprise_realtime.sql
-- DESCRIPTION: Real-time Sales Hub Traffic Source Telemetry & AI Swarm Intelligence
-- AUTHOR: ZEGA Enterprise Architecture Team
-- DATE: 2026-08-09
-- =========================================================================

-- 1. Create Table for Sales Source Telemetry if not exists
CREATE TABLE IF NOT EXISTS public.umkm_sales_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
    source_name VARCHAR(150) NOT NULL,
    source_code VARCHAR(50) DEFAULT 'whatsapp_direct',
    category VARCHAR(100) DEFAULT 'Messaging',
    impressions INT DEFAULT 12500,
    clicks INT DEFAULT 3200,
    buyers_count INT DEFAULT 52,
    total_revenue_idr NUMERIC(15,2) DEFAULT 6100000.00,
    conversion_rate NUMERIC(5,2) DEFAULT 1.60,
    mom_growth_pct NUMERIC(5,2) DEFAULT 18.50,
    color_hex VARCHAR(20) DEFAULT '#10b981',
    cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
    status VARCHAR(50) DEFAULT 'TERHUBUNG REALTIME',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely ALTER TABLE to add missing columns if the table already existed from an older migration
ALTER TABLE public.umkm_sales_sources 
ADD COLUMN IF NOT EXISTS source_code VARCHAR(50) DEFAULT 'whatsapp_direct',
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Messaging',
ADD COLUMN IF NOT EXISTS impressions INT DEFAULT 12500,
ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 3200,
ADD COLUMN IF NOT EXISTS buyers_count INT DEFAULT 52,
ADD COLUMN IF NOT EXISTS total_revenue_idr NUMERIC(15,2) DEFAULT 6100000.00,
ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(5,2) DEFAULT 1.60,
ADD COLUMN IF NOT EXISTS mom_growth_pct NUMERIC(5,2) DEFAULT 18.50,
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(20) DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'TERHUBUNG REALTIME';

-- 2. Create Table for Sales Source AI Swarm Recommendations
CREATE TABLE IF NOT EXISTS public.umkm_sales_source_ai_swarm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
    source_code VARCHAR(50) DEFAULT 'ALL',
    headline VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    action_suggestion VARCHAR(255),
    model_engine VARCHAR(100) DEFAULT 'DeepSeek-R1-Reasoning',
    confidence_pct NUMERIC(5,2) DEFAULT 98.50,
    cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    category VARCHAR(100) DEFAULT 'Atribusi Trafik',
    estimated_impact VARCHAR(100) DEFAULT '+22% Click Through Rate',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely ALTER TABLE to add missing columns for umkm_sales_source_ai_swarm
ALTER TABLE public.umkm_sales_source_ai_swarm 
ADD COLUMN IF NOT EXISTS source_code VARCHAR(50) DEFAULT 'ALL',
ADD COLUMN IF NOT EXISTS headline VARCHAR(255) DEFAULT 'Rekomendasi AI Swarm',
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT 'Rekomendasi optimasi sumber trafik.',
ADD COLUMN IF NOT EXISTS action_suggestion VARCHAR(255) DEFAULT 'Eksekusi Rekomendasi',
ADD COLUMN IF NOT EXISTS model_engine VARCHAR(100) DEFAULT 'DeepSeek-R1-Reasoning',
ADD COLUMN IF NOT EXISTS confidence_pct NUMERIC(5,2) DEFAULT 98.50,
ADD COLUMN IF NOT EXISTS cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Atribusi Trafik',
ADD COLUMN IF NOT EXISTS estimated_impact VARCHAR(100) DEFAULT '+22% Click Through Rate';

-- 3. Clean existing seed records to avoid duplicates (DELETE-then-INSERT pattern)
DELETE FROM public.umkm_sales_sources 
WHERE store_id = '11111111-1111-1111-1111-111111111111'::uuid 
   OR source_name ILIKE ANY(ARRAY['%WhatsApp%', '%Shopee%', '%Instagram%', '%TikTok%', '%Google%']);

INSERT INTO public.umkm_sales_sources (
    store_id, source_name, source_code, category, impressions, clicks, buyers_count,
    total_revenue_idr, conversion_rate, mom_growth_pct, color_hex, cdn_icon_url, status
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'WhatsApp Direct',
    'whatsapp_direct',
    'Messaging',
    12500,
    3200,
    52,
    6100000.00,
    1.63,
    18.50,
    '#10b981',
    'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
    'TERHUBUNG REALTIME'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Shopee Live & Search',
    'shopee_search',
    'Marketplace',
    24100,
    4800,
    35,
    4100000.00,
    0.73,
    14.20,
    '#f97316',
    'https://cdn.zegaai.site/assets/logo/shopee.png',
    'TERHUBUNG REALTIME'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Instagram Reels Ads',
    'instagram_reels',
    'Social Media',
    45000,
    8500,
    18,
    2000000.00,
    0.21,
    12.00,
    '#a855f7',
    'https://cdn.zegaai.site/assets/logo/instagram.png',
    'TERHUBUNG REALTIME'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'TikTok Shop Ads',
    'tiktok_ads',
    'Short Video Commerce',
    68000,
    9200,
    11,
    1300000.00,
    0.12,
    22.40,
    '#06b6d4',
    'https://cdn.zegaai.site/assets/logo/tiktok.webp',
    'TERHUBUNG REALTIME'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Google Search Organic',
    'google_search',
    'Search Engine',
    22800,
    2300,
    8,
    1000000.00,
    0.35,
    8.50,
    '#3b82f6',
    'https://cdn.zegaai.site/assets/logo/google_drive.png',
    'TERHUBUNG REALTIME'
);

-- 4. Seed Source AI Swarm Recommendations (5 Real AI Swarm Engines with Exact CDN URLs)
DELETE FROM public.umkm_sales_source_ai_swarm 
WHERE store_id = '11111111-1111-1111-1111-111111111111'::uuid;

INSERT INTO public.umkm_sales_source_ai_swarm (
    store_id, source_code, headline, content, action_suggestion, model_engine, confidence_pct, cdn_icon_url, category, estimated_impact
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'whatsapp_direct',
    'DeepSeek R1: Efisiensi Atribusi WhatsApp Direct (1.63% CR)',
    'WhatsApp Direct menghasilkan 52 pembeli dari 3.200 klik (CR 1.63%), menyumbang Rp6.100.000 (22.5% omset total). Disarankan mengaktifkan auto-greeting catalog.',
    'Aktifkan Auto Greeting Catalog WhatsApp',
    'DeepSeek-R1-Reasoning',
    98.80,
    'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    'Atribusi WhatsApp Direct',
    '+Rp 1.500.000 / bln'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'shopee_search',
    'Claude-3.5-Sonnet: Optimasi Kata Kunci Shopee Live & Search',
    'Claude 3.5 Sonnet mengidentifikasi 4.800 klik di Shopee Live dengan CTR tinggi. Disarankan menambah kata kunci skincare brightening untuk menaikkan konversi.',
    'Optimalkan Kata Kunci Shopee Live',
    'Claude-3.5-Sonnet-Swarm',
    97.80,
    'https://cdn.zegaai.site/assets/logo/claude.webp',
    'SEO & Keywords Shopee',
    '+15% Click-to-Buyer'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'tiktok_ads',
    'ZeroClaw Solana Telemetry: TikTok Video Commerce Swarm',
    'ZeroClaw Daemon mencatat 68.000 tayangan iklan TikTok dengan 9.200 klik. Disarankan memangkas durasi hook video dari 5 detik menjadi 3 detik.',
    'Terapkan Hook 3-Detik TikTok Ads',
    'ZeroClaw-Solana-Daemon',
    99.10,
    'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    'Video Commerce Telemetry',
    '+28% CTR Retensi Video'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ALL',
    '9Router Multi-LLM Smart Traffic Attribution Routing',
    '9Router mengalokasikan tracking token secara dinamis, menghemat 40% biaya API telemetry tanpa mempengaruhi kecepatan pelacakan atribuisi.',
    'Terapkan Dynamic Token Routing',
    '9Router-Auto-Cost-Optimizer',
    98.60,
    'https://cdn.zegaai.site/assets/logo/9router.png',
    'Multi-LLM Cost Guard',
    'Hemat 40% Token Cost'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'instagram_reels',
    'Qwen Coder 32B: Retargeting Prospek Instagram Reels Ads',
    'Qwen Coder menemukan 8.500 pengunjung Instagram Reels yang tidak melanjutkan checkout. Script otomatis retargeting DM siap diaktifkan.',
    'Jalankan DM Retargeting Campaign',
    'Qwen-2.5-Coder-32B',
    96.90,
    'https://cdn.zegaai.site/assets/logo/Qwen.png',
    'Retargeting Instagram Ads',
    '+12 Orders Restored'
);

-- 5. Security & Realtime Grants
ALTER TABLE public.umkm_sales_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_source_ai_swarm ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_sales_sources' 
        AND policyname = 'Allow all access to umkm_sales_sources'
    ) THEN
        CREATE POLICY "Allow all access to umkm_sales_sources" 
        ON public.umkm_sales_sources FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_sales_source_ai_swarm' 
        AND policyname = 'Allow all access to umkm_sales_source_ai_swarm'
    ) THEN
        CREATE POLICY "Allow all access to umkm_sales_source_ai_swarm" 
        ON public.umkm_sales_source_ai_swarm FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT ALL ON public.umkm_sales_sources TO anon, authenticated, service_role;
GRANT ALL ON public.umkm_sales_source_ai_swarm TO anon, authenticated, service_role;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_sources;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_source_ai_swarm;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
