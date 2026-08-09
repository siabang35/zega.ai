-- =========================================================================
-- MIGRATION: 98_umkm_sales_by_channel_enterprise_realtime.sql
-- DESCRIPTION: Real-time Sales Hub Channel Telemetry & AI Swarm Intelligence
-- AUTHOR: ZEGA Enterprise Architecture Team
-- DATE: 2026-08-09
-- =========================================================================

-- 1. Create Table for Sales Channel Telemetry if not exists
CREATE TABLE IF NOT EXISTS public.umkm_sales_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
    channel_name VARCHAR(150) NOT NULL,
    channel_code VARCHAR(50) DEFAULT 'whatsapp',
    total_revenue_idr NUMERIC(15,2) DEFAULT 6100000.00,
    orders_count INT DEFAULT 52,
    percentage NUMERIC(5,2) DEFAULT 45.00,
    conversion_rate NUMERIC(5,2) DEFAULT 5.80,
    color_hex VARCHAR(20) DEFAULT '#10b981',
    cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
    status VARCHAR(50) DEFAULT 'TERHUBUNG REALTIME',
    weekly_trend_json JSONB DEFAULT '[{"week":"Mgg 1","revenue":1400000},{"week":"Mgg 2","revenue":1600000},{"week":"Mgg 3","revenue":1900000},{"week":"Mgg 4","revenue":1200000}]'::jsonb,
    top_products_json JSONB DEFAULT '[{"product_name":"Paket Skincare Basic","qty":24,"revenue":2880000}]'::jsonb,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely ALTER TABLE to add missing columns if the table already existed from an older migration
ALTER TABLE public.umkm_sales_channels 
ADD COLUMN IF NOT EXISTS channel_code VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS total_revenue_idr NUMERIC(15,2) DEFAULT 6100000.00,
ADD COLUMN IF NOT EXISTS orders_count INT DEFAULT 52,
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2) DEFAULT 45.00,
ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(5,2) DEFAULT 5.80,
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(20) DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'TERHUBUNG REALTIME',
ADD COLUMN IF NOT EXISTS weekly_trend_json JSONB DEFAULT '[{"week":"Mgg 1","revenue":1400000},{"week":"Mgg 2","revenue":1600000},{"week":"Mgg 3","revenue":1900000},{"week":"Mgg 4","revenue":1200000}]'::jsonb,
ADD COLUMN IF NOT EXISTS top_products_json JSONB DEFAULT '[{"product_name":"Paket Skincare Basic","qty":24,"revenue":2880000}]'::jsonb;

-- 2. Create Table for Sales Channel AI Swarm Recommendations
CREATE TABLE IF NOT EXISTS public.umkm_sales_channel_ai_swarm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
    channel_code VARCHAR(50) DEFAULT 'ALL',
    headline VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    action_suggestion VARCHAR(255),
    model_engine VARCHAR(100) DEFAULT 'DeepSeek-R1-Reasoning',
    confidence_pct NUMERIC(5,2) DEFAULT 98.50,
    cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    category VARCHAR(100) DEFAULT 'Optimasi Channel',
    estimated_impact VARCHAR(100) DEFAULT '+18% Conversion Rate',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clean existing seed records to avoid duplicates (DELETE-then-INSERT pattern)
DELETE FROM public.umkm_sales_channels 
WHERE store_id = '11111111-1111-1111-1111-111111111111'::uuid 
   OR channel_name ILIKE ANY(ARRAY['%WhatsApp%', '%Shopee%', '%Instagram%', '%TikTok%']);

INSERT INTO public.umkm_sales_channels (
    store_id, channel_name, channel_code, total_revenue_idr, orders_count,
    percentage, conversion_rate, color_hex, cdn_icon_url, status,
    weekly_trend_json, top_products_json
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'WhatsApp Business API',
    'whatsapp',
    6100000.00,
    52,
    45.00,
    5.80,
    '#10b981',
    'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
    'TERHUBUNG REALTIME',
    '[{"week":"Mgg 1","revenue":1400000},{"week":"Mgg 2","revenue":1600000},{"week":"Mgg 3","revenue":1900000},{"week":"Mgg 4","revenue":1200000}]'::jsonb,
    '[{"product_name":"Paket Skincare Basic","qty":24,"revenue":2880000},{"product_name":"Serum Brightening","qty":18,"revenue":2160000}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Shopee Seller Store',
    'shopee',
    4100000.00,
    35,
    30.00,
    4.20,
    '#f97316',
    'https://cdn.zegaai.site/assets/logo/shopee.png',
    'TERHUBUNG REALTIME',
    '[{"week":"Mgg 1","revenue":900000},{"week":"Mgg 2","revenue":1800000},{"week":"Mgg 3","revenue":800000},{"week":"Mgg 4","revenue":600000}]'::jsonb,
    '[{"product_name":"Paket Skincare Premium","qty":15,"revenue":2250000},{"product_name":"Face Wash","qty":12,"revenue":960000}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Instagram Direct',
    'instagram',
    2000000.00,
    18,
    15.00,
    3.40,
    '#a855f7',
    'https://cdn.zegaai.site/assets/logo/instagram.png',
    'TERHUBUNG REALTIME',
    '[{"week":"Mgg 1","revenue":350000},{"week":"Mgg 2","revenue":450000},{"week":"Mgg 3","revenue":700000},{"week":"Mgg 4","revenue":500000}]'::jsonb,
    '[{"product_name":"Moisturizer Gel","qty":10,"revenue":850000},{"product_name":"Sunscreen SPF50","qty":8,"revenue":680000}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'TikTok Shop Messaging',
    'tiktok',
    1300000.00,
    11,
    10.00,
    2.90,
    '#06b6d4',
    'https://cdn.zegaai.site/assets/logo/tiktok.webp',
    'TERHUBUNG REALTIME',
    '[{"week":"Mgg 1","revenue":150000},{"week":"Mgg 2","revenue":350000},{"week":"Mgg 3","revenue":500000},{"week":"Mgg 4","revenue":300000}]'::jsonb,
    '[{"product_name":"Lip Matte Velvet","qty":8,"revenue":640000},{"product_name":"Toner Booster","qty":3,"revenue":390000}]'::jsonb
);

-- 4. Seed Channel AI Swarm Recommendations (5 Real AI Swarm Engines with Exact CDN URLs)
DELETE FROM public.umkm_sales_channel_ai_swarm 
WHERE store_id = '11111111-1111-1111-1111-111111111111'::uuid;

INSERT INTO public.umkm_sales_channel_ai_swarm (
    store_id, channel_code, headline, content, action_suggestion, model_engine, confidence_pct, cdn_icon_url, category, estimated_impact
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'whatsapp',
    'DeepSeek R1: Dominasi WhatsApp Business (Konversi 5.8%)',
    'WhatsApp menyumbangkan 45% omset (Rp6.100.000) dengan konversi tertinggi (5.8%). Disarankan mengaktifkan auto-broadcast catalog untuk kontak aktif.',
    'Aktifkan WhatsApp Auto-Catalog Broadcast',
    'DeepSeek-R1-Reasoning',
    98.90,
    'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    'Dominasi Channel WA',
    '+Rp 1.800.000 / bln'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'shopee',
    'Claude-3.5-Sonnet: Reallocasi Budget Shopee Flash Sale',
    'Claude 3.5 Sonnet mendeteksi penurunan konversi Shopee di minggu ke-4 (2.9%). Disarankan memindahkan voucher diskon ke paket bundling skincare.',
    'Optimalkan Bundling Voucher Shopee',
    'Claude-3.5-Sonnet-Swarm',
    97.60,
    'https://cdn.zegaai.site/assets/logo/claude.webp',
    'Optimasi Promo Shopee',
    '+12% Profit Margin'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'tiktok',
    'ZeroClaw Solana Daemon: Telemetri TikTok Live Checkout',
    'ZeroClaw memantau aktivitas TikTok Live jam 19.00 - 21.00 menghasilkan konversi 3x lebih cepat. Rekomendasi auto-reply via AI Assistant.',
    'Aktifkan TikTok Live Auto-Reply Swarm',
    'ZeroClaw-Solana-Daemon',
    99.40,
    'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    'Live Commerce Telemetry',
    'Respon Chat < 3 Detik'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ALL',
    '9Router Multi-LLM Cost Routing Strategy',
    '9Router mengarahkan prompt transaksi ringan ke model hemat energi, menghemat 40% biaya API tanpa mengurangi responsivitas balasan pelanggan.',
    'Terapkan Dynamic Token Routing',
    '9Router-Auto-Cost-Optimizer',
    98.70,
    'https://cdn.zegaai.site/assets/logo/9router.png',
    'Multi-LLM Cost Guard',
    'Hemat 40% Token Cost'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'instagram',
    'Qwen Coder 32B: Direct Message Abandoned Cart Automation',
    'Qwen Coder mengidentifikasi 18 prospek Instagram DM yang berhenti di negosiasi harga. Script promo otomatis siap dikirimkan.',
    'Kirim Script Follow-Up IG Direct',
    'Qwen-2.5-Coder-32B',
    96.80,
    'https://cdn.zegaai.site/assets/logo/Qwen.png',
    'Otomasi Instagram DM',
    '+8 Orders Restored'
);

-- 5. Security & Realtime Grants
ALTER TABLE public.umkm_sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_channel_ai_swarm ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_sales_channels' 
        AND policyname = 'Allow all access to umkm_sales_channels'
    ) THEN
        CREATE POLICY "Allow all access to umkm_sales_channels" 
        ON public.umkm_sales_channels FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_sales_channel_ai_swarm' 
        AND policyname = 'Allow all access to umkm_sales_channel_ai_swarm'
    ) THEN
        CREATE POLICY "Allow all access to umkm_sales_channel_ai_swarm" 
        ON public.umkm_sales_channel_ai_swarm FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT ALL ON public.umkm_sales_channels TO anon, authenticated, service_role;
GRANT ALL ON public.umkm_sales_channel_ai_swarm TO anon, authenticated, service_role;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_channels;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_channel_ai_swarm;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
