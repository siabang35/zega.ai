-- =========================================================================
-- MIGRATION: 97_umkm_sales_monthly_report_enterprise_realtime.sql
-- DESCRIPTION: Real-time Sales Hub Monthly Reports Telemetry & AI Swarm Intelligence
-- AUTHOR: ZEGA Enterprise Architecture Team
-- DATE: 2026-08-09
-- =========================================================================

-- 1. Create Table for Monthly Reports Telemetry if not exists
CREATE TABLE IF NOT EXISTS public.umkm_sales_monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
    period_month VARCHAR(50) NOT NULL,
    total_revenue_idr NUMERIC(15,2) DEFAULT 13500000.00,
    total_orders INT DEFAULT 116,
    avg_order_value_idr NUMERIC(15,2) DEFAULT 116379.00,
    total_refund_idr NUMERIC(15,2) DEFAULT 250000.00,
    repeat_customer_pct NUMERIC(5,2) DEFAULT 42.00,
    returning_customer_val_idr NUMERIC(15,2) DEFAULT 5670000.00,
    best_day_date VARCHAR(50) DEFAULT '22 Juli 2026',
    best_day_revenue_idr NUMERIC(15,2) DEFAULT 920000.00,
    ai_executive_summary TEXT DEFAULT 'Puncak omset Juli dicapai pada 22 Juli (Rp920k). Pertumbuhan repeat order mencapai 42% berkat pesan follow-up otomatis WhatsApp AI Co-Pilot.',
    weekly_breakdown_json JSONB DEFAULT '[{"week":"Mgg 1","revenue":2800000,"orders":24,"growth":"+12%"},{"week":"Mgg 2","revenue":3200000,"orders":28,"growth":"+14%"},{"week":"Mgg 3","revenue":4500000,"orders":38,"growth":"+40%"},{"week":"Mgg 4","revenue":3000000,"orders":26,"growth":"+8%"}]'::jsonb,
    channel_breakdown_json JSONB DEFAULT '[{"channel":"WhatsApp","percentage":45,"revenue":6075000,"color":"#10b981","cdn_icon":"https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp"},{"channel":"Shopee","percentage":30,"revenue":4050000,"color":"#f97316","cdn_icon":"https://cdn.zegaai.site/assets/logo/shopee.png"},{"channel":"Instagram","percentage":15,"revenue":2025000,"color":"#a855f7","cdn_icon":"https://cdn.zegaai.site/assets/logo/instagram.png"},{"channel":"TikTok","percentage":10,"revenue":1350000,"color":"#06b6d4","cdn_icon":"https://cdn.zegaai.site/assets/logo/tiktok.webp"}]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely ALTER TABLE to add columns if table existed prior to this migration
ALTER TABLE public.umkm_sales_monthly_reports 
ADD COLUMN IF NOT EXISTS period_month VARCHAR(50) DEFAULT 'Juli 2026',
ADD COLUMN IF NOT EXISTS total_revenue_idr NUMERIC(15,2) DEFAULT 13500000.00,
ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 116,
ADD COLUMN IF NOT EXISTS avg_order_value_idr NUMERIC(15,2) DEFAULT 116379.00,
ADD COLUMN IF NOT EXISTS total_refund_idr NUMERIC(15,2) DEFAULT 250000.00,
ADD COLUMN IF NOT EXISTS repeat_customer_pct NUMERIC(5,2) DEFAULT 42.00,
ADD COLUMN IF NOT EXISTS returning_customer_val_idr NUMERIC(15,2) DEFAULT 5670000.00,
ADD COLUMN IF NOT EXISTS best_day_date VARCHAR(50) DEFAULT '22 Juli 2026',
ADD COLUMN IF NOT EXISTS best_day_revenue_idr NUMERIC(15,2) DEFAULT 920000.00,
ADD COLUMN IF NOT EXISTS ai_executive_summary TEXT DEFAULT 'Puncak omset Juli dicapai pada 22 Juli (Rp920k).',
ADD COLUMN IF NOT EXISTS weekly_breakdown_json JSONB DEFAULT '[{"week":"Mgg 1","revenue":2800000,"orders":24,"growth":"+12%"},{"week":"Mgg 2","revenue":3200000,"orders":28,"growth":"+14%"},{"week":"Mgg 3","revenue":4500000,"orders":38,"growth":"+40%"},{"week":"Mgg 4","revenue":3000000,"orders":26,"growth":"+8%"}]'::jsonb,
ADD COLUMN IF NOT EXISTS channel_breakdown_json JSONB DEFAULT '[{"channel":"WhatsApp","percentage":45,"revenue":6075000,"color":"#10b981","cdn_icon":"https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp"},{"channel":"Shopee","percentage":30,"revenue":4050000,"color":"#f97316","cdn_icon":"https://cdn.zegaai.site/assets/logo/shopee.png"},{"channel":"Instagram","percentage":15,"revenue":2025000,"color":"#a855f7","cdn_icon":"https://cdn.zegaai.site/assets/logo/instagram.png"},{"channel":"TikTok","percentage":10,"revenue":1350000,"color":"#06b6d4","cdn_icon":"https://cdn.zegaai.site/assets/logo/tiktok.webp"}]'::jsonb;

-- 2. Create Table for Monthly AI Intelligence Swarm Recommendations if not exists
CREATE TABLE IF NOT EXISTS public.umkm_sales_ai_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
    period_month VARCHAR(50) DEFAULT 'Juli 2026',
    headline VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    action_suggestion VARCHAR(255),
    model_engine VARCHAR(100) DEFAULT 'DeepSeek-R1-Reasoning',
    confidence_pct NUMERIC(5,2) DEFAULT 98.70,
    cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    category VARCHAR(100) DEFAULT 'Retensi Pelanggan',
    estimated_impact VARCHAR(100) DEFAULT '+Rp 2.100.000 / bln',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely ALTER TABLE to add missing columns to umkm_sales_ai_intelligence
ALTER TABLE public.umkm_sales_ai_intelligence 
ADD COLUMN IF NOT EXISTS period_month VARCHAR(50) DEFAULT 'Juli 2026',
ADD COLUMN IF NOT EXISTS headline VARCHAR(255) DEFAULT 'Rekomendasi AI Swarm',
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT 'Rekomendasi optimasi penjualan.',
ADD COLUMN IF NOT EXISTS action_suggestion VARCHAR(255) DEFAULT 'Eksekusi Rekomendasi',
ADD COLUMN IF NOT EXISTS model_engine VARCHAR(100) DEFAULT 'DeepSeek-R1-Reasoning',
ADD COLUMN IF NOT EXISTS confidence_pct NUMERIC(5,2) DEFAULT 98.70,
ADD COLUMN IF NOT EXISTS cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Retensi Pelanggan',
ADD COLUMN IF NOT EXISTS estimated_impact VARCHAR(100) DEFAULT '+Rp 2.100.000 / bln';

-- 3. Clean Seed Records to avoid duplicates (DELETE-then-INSERT pattern)
DELETE FROM public.umkm_sales_monthly_reports 
WHERE store_id = '11111111-1111-1111-1111-111111111111'::uuid;

INSERT INTO public.umkm_sales_monthly_reports (
    store_id, period_month, total_revenue_idr, total_orders, avg_order_value_idr,
    total_refund_idr, repeat_customer_pct, returning_customer_val_idr, best_day_date,
    best_day_revenue_idr, ai_executive_summary, weekly_breakdown_json, channel_breakdown_json
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juli 2026',
    13500000.00,
    116,
    116379.00,
    250000.00,
    42.00,
    5670000.00,
    '22 Juli 2026',
    920000.00,
    'Puncak omset Juli dicapai pada 22 Juli (Rp920k). Pertumbuhan repeat order mencapai 42% berkat pesan follow-up otomatis WhatsApp AI Co-Pilot.',
    '[{"week":"Mgg 1","revenue":2800000,"orders":24,"growth":"+12%"},{"week":"Mgg 2","revenue":3200000,"orders":28,"growth":"+14%"},{"week":"Mgg 3","revenue":4500000,"orders":38,"growth":"+40%"},{"week":"Mgg 4","revenue":3000000,"orders":26,"growth":"+8%"}]'::jsonb,
    '[{"channel":"WhatsApp","percentage":45,"revenue":6075000,"color":"#10b981","cdn_icon":"https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp"},{"channel":"Shopee","percentage":30,"revenue":4050000,"color":"#f97316","cdn_icon":"https://cdn.zegaai.site/assets/logo/shopee.png"},{"channel":"Instagram","percentage":15,"revenue":2025000,"color":"#a855f7","cdn_icon":"https://cdn.zegaai.site/assets/logo/instagram.png"},{"channel":"TikTok","percentage":10,"revenue":1350000,"color":"#06b6d4","cdn_icon":"https://cdn.zegaai.site/assets/logo/tiktok.webp"}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juni 2026',
    11400000.00,
    98,
    116326.00,
    180000.00,
    38.50,
    4389000.00,
    '15 Juni 2026',
    810000.00,
    'Performa penjualan Juni didorong oleh Shopee Flash Sale pertengahan bulan dengan total 98 transaksi berhasil.',
    '[{"week":"Mgg 1","revenue":2400000,"orders":20,"growth":"+5%"},{"week":"Mgg 2","revenue":4100000,"orders":35,"growth":"+70%"},{"week":"Mgg 3","revenue":2800000,"orders":24,"growth":"-31%"},{"week":"Mgg 4","revenue":2100000,"orders":19,"growth":"-25%"}]'::jsonb,
    '[{"channel":"Shopee","percentage":42,"revenue":4788000,"color":"#f97316","cdn_icon":"https://cdn.zegaai.site/assets/logo/shopee.png"},{"channel":"WhatsApp","percentage":35,"revenue":3990000,"color":"#10b981","cdn_icon":"https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp"},{"channel":"Instagram","percentage":13,"revenue":1482000,"color":"#a855f7","cdn_icon":"https://cdn.zegaai.site/assets/logo/instagram.png"},{"channel":"TikTok","percentage":10,"revenue":1140000,"color":"#06b6d4","cdn_icon":"https://cdn.zegaai.site/assets/logo/tiktok.webp"}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Mei 2026',
    9800000.00,
    85,
    115294.00,
    120000.00,
    35.00,
    3430000.00,
    '28 Mei 2026',
    740000.00,
    'Puncak transaksi Mei didorong promo Gajian Diskon Bundling Skincare Basic.',
    '[{"week":"Mgg 1","revenue":1900000,"orders":16,"growth":"+2%"},{"week":"Mgg 2","revenue":2200000,"orders":19,"growth":"+15%"},{"week":"Mgg 3","revenue":2400000,"orders":21,"growth":"+9%"},{"week":"Mgg 4","revenue":3300000,"orders":29,"growth":"+37%"}]'::jsonb,
    '[{"channel":"WhatsApp","percentage":40,"revenue":3920000,"color":"#10b981","cdn_icon":"https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp"},{"channel":"Shopee","percentage":32,"revenue":3136000,"color":"#f97316","cdn_icon":"https://cdn.zegaai.site/assets/logo/shopee.png"},{"channel":"Instagram","percentage":18,"revenue":1764000,"color":"#a855f7","cdn_icon":"https://cdn.zegaai.site/assets/logo/instagram.png"},{"channel":"TikTok","percentage":10,"revenue":980000,"color":"#06b6d4","cdn_icon":"https://cdn.zegaai.site/assets/logo/tiktok.webp"}]'::jsonb
);

-- 4. Seed Monthly AI Intelligence Swarm Recommendations (Exact CDN URLs)
DELETE FROM public.umkm_sales_ai_intelligence 
WHERE store_id = '11111111-1111-1111-1111-111111111111'::uuid;

INSERT INTO public.umkm_sales_ai_intelligence (
    store_id, period_month, headline, content, action_suggestion, model_engine, confidence_pct, cdn_icon_url, category, estimated_impact
) VALUES
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juli 2026',
    'Analisis DeepSeek R1: Retensi Repeat Order 42%',
    'Model DeepSeek-R1 mendeteksi 42% pembeli melakukan order ulang dalam 30 hari. Eksekusi campaign retensi berbasis voucher 10% diproyeksikan menambah omset Rp2.100.000.',
    'Luncurkan Campaign Retensi Massal',
    'DeepSeek-R1-Reasoning',
    98.70,
    'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    'Retensi Pelanggan',
    '+Rp 2.100.000 / bln'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juli 2026',
    'Optimasi Channel WA Business (Conversion 5.8%)',
    'Claude-3.5-Sonnet merekomendasikan reallocasi 15% budget iklan dari Shopee ke WA Broadcast karena conversion rate WA mencapai 5.8% (vs Shopee 4.2%).',
    'Aktifkan Auto WA Broadcast Swarm',
    'Claude-3.5-Sonnet-Swarm',
    97.40,
    'https://cdn.zegaai.site/assets/logo/claude.webp',
    'Optimasi Channel',
    '+18% Conversion Rate'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juli 2026',
    'ZeroClaw Solana Telemetry: Penjualan Paket Skincare',
    'ZeroClaw Daemon memantau lonjakan +24% pemesanan Paket Skincare Basic pada hari Jumat. Disarankan mengunci batas persediaan minimal 50 unit.',
    'Kunci Stok Persediaan Paket',
    'ZeroClaw-Solana-Daemon',
    99.20,
    'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    'Prediksi Stok Persediaan',
    'Mencegah Out of Stock'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juli 2026',
    '9Router Multi-LLM Cost & Latency Optimizer',
    '9Router mengoptimalkan alokasi token LLM untuk AI Co-Pilot dengan efisiensi biaya 40% lebih hemat tanpa menurunkan akurasi rekomendasi.',
    'Terapkan Auto-Cost Optimization',
    '9Router-Auto-Cost-Optimizer',
    98.90,
    'https://cdn.zegaai.site/assets/logo/9router.png',
    'Efisiensi Token AI',
    'Hemat 40% API Cost'
),
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Juli 2026',
    'Qwen Coder 32B: Otomasi Workflow Checkout Abandoned',
    'Qwen-2.5-Coder mengidentifikasi 14 keranjang terbengkalai. Script follow-up otomatis siap dikirim ke calon pembeli.',
    'Jalankan Script Auto Follow-Up',
    'Qwen-2.5-Coder-32B',
    96.50,
    'https://cdn.zegaai.site/assets/logo/Qwen.png',
    'Otomasi Checkout',
    '+14 Potential Orders'
);

-- 5. Security Policies & Realtime Grants
ALTER TABLE public.umkm_sales_monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_ai_intelligence ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_sales_monthly_reports' 
        AND policyname = 'Allow all access to umkm_sales_monthly_reports'
    ) THEN
        CREATE POLICY "Allow all access to umkm_sales_monthly_reports" 
        ON public.umkm_sales_monthly_reports FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_sales_ai_intelligence' 
        AND policyname = 'Allow all access to umkm_sales_ai_intelligence'
    ) THEN
        CREATE POLICY "Allow all access to umkm_sales_ai_intelligence" 
        ON public.umkm_sales_ai_intelligence FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT ALL ON public.umkm_sales_monthly_reports TO anon, authenticated, service_role;
GRANT ALL ON public.umkm_sales_ai_intelligence TO anon, authenticated, service_role;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_monthly_reports;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_ai_intelligence;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
