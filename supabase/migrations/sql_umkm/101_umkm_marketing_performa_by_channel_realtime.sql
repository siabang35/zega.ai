-- ============================================================================
-- ZEGA AI: UMKM Marketing Performa by Channel Real-Time Migration
-- File: 101_umkm_marketing_performa_by_channel_realtime.sql
-- ============================================================================

-- 1. Create Table for Marketing Channel Performance
CREATE TABLE IF NOT EXISTS public.umkm_marketing_channel_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    channel_name VARCHAR(150) NOT NULL,
    channel_code VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    category VARCHAR(100) DEFAULT 'Messaging',
    reach_text VARCHAR(50) DEFAULT '56.2K',
    reach_count INTEGER DEFAULT 56200,
    impressions_count INTEGER DEFAULT 85000,
    clicks_count INTEGER DEFAULT 6200,
    engagement_pct NUMERIC(5, 2) DEFAULT 6.80,
    leads_count INTEGER DEFAULT 198,
    conversion_pct NUMERIC(5, 2) DEFAULT 4.80,
    revenue_num NUMERIC(14, 2) DEFAULT 3250000.00,
    roas_val NUMERIC(5, 2) DEFAULT 4.20,
    trend_pct VARCHAR(20) DEFAULT '+14%',
    color_hex VARCHAR(20) DEFAULT '#10b981',
    cdn_icon_url VARCHAR(500) DEFAULT 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
    status VARCHAR(50) DEFAULT 'TERHUBUNG REALTIME',
    model_engine VARCHAR(100) DEFAULT 'DeepSeek R1 & 9Router Layer 5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_marketing_channel_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_channel_performance" ON public.umkm_marketing_channel_performance;
CREATE POLICY "Allow all for authenticated umkm_marketing_channel_performance" ON public.umkm_marketing_channel_performance FOR ALL USING (true);

-- 2. Register Table in Supabase Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_channel_performance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_channel_performance;
    END IF;
END $$;

-- 3. Purge existing seed records for default store
DELETE FROM public.umkm_marketing_channel_performance WHERE store_id = '11111111-1111-1111-1111-111111111111';

-- 4. Seed Enterprise Marketing Channel Performance Records
INSERT INTO public.umkm_marketing_channel_performance (
    id, store_id, channel_name, channel_code, category, reach_text, reach_count, impressions_count, clicks_count,
    engagement_pct, leads_count, conversion_pct, revenue_num, roas_val, trend_pct, color_hex, cdn_icon_url, status, model_engine
) VALUES 
(
    'c1111111-0001-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'WhatsApp Business',
    'whatsapp',
    'Direct Messaging',
    '56.2K',
    56200,
    85000,
    6200,
    6.80,
    198,
    4.80,
    3250000.00,
    4.20,
    '+14%',
    '#10b981',
    'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
    'TERHUBUNG REALTIME',
    'DeepSeek R1 & 9Router Layer 5'
),
(
    'c1111111-0002-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Instagram Ads',
    'instagram',
    'Social Media Ads',
    '32.8K',
    32800,
    48000,
    3900,
    8.20,
    132,
    4.10,
    2180000.00,
    3.90,
    '+18%',
    '#a855f7',
    'https://cdn.zegaai.site/assets/logo/instagram.png',
    'TERHUBUNG REALTIME',
    'Qwen 2.5 Coder 32B Swarm'
),
(
    'c1111111-0003-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Shopee Official',
    'shopee',
    'Marketplace Commerce',
    '18.6K',
    18600,
    29000,
    2100,
    5.60,
    76,
    3.20,
    1420000.00,
    2.80,
    '+8%',
    '#f97316',
    'https://cdn.zegaai.site/assets/logo/shopee.png',
    'TERHUBUNG REALTIME',
    'Gemini 3.6 Flash Engine'
),
(
    'c1111111-0004-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'TikTok Shop',
    'tiktok',
    'Video Social Commerce',
    '12.4K',
    12400,
    34000,
    3100,
    9.10,
    50,
    4.00,
    980000.00,
    3.50,
    '+22%',
    '#06b6d4',
    'https://cdn.zegaai.site/assets/logo/tiktok.webp',
    'TERHUBUNG REALTIME',
    'ZeroClaw Edge Swarm'
),
(
    'c1111111-0005-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Email Blast',
    'email',
    'Direct Email Marketing',
    '5.4K',
    5400,
    8200,
    620,
    4.20,
    28,
    2.60,
    450000.00,
    2.10,
    '+5%',
    '#6366f1',
    'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/logo/sendgrid.webp',
    'TERHUBUNG REALTIME',
    'Claude 3.5 Sonnet Engine'
);

-- 5. Helper Function to Insert Channel Performance Atomically
CREATE OR REPLACE FUNCTION public.fn_insert_umkm_marketing_channel_performance(
    p_store_id UUID,
    p_channel_name TEXT,
    p_channel_code TEXT,
    p_category TEXT,
    p_reach_text TEXT,
    p_reach_count INTEGER,
    p_impressions_count INTEGER,
    p_clicks_count INTEGER,
    p_engagement_pct NUMERIC,
    p_leads_count INTEGER,
    p_conversion_pct NUMERIC,
    p_revenue_num NUMERIC,
    p_roas_val NUMERIC,
    p_trend_pct TEXT,
    p_color_hex TEXT,
    p_cdn_icon_url TEXT,
    p_status TEXT,
    p_model_engine TEXT
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.umkm_marketing_channel_performance (
        store_id, channel_name, channel_code, category, reach_text, reach_count, impressions_count,
        clicks_count, engagement_pct, leads_count, conversion_pct, revenue_num, roas_val, trend_pct,
        color_hex, cdn_icon_url, status, model_engine, created_at
    ) VALUES (
        p_store_id, p_channel_name, p_channel_code, p_category, p_reach_text, p_reach_count, p_impressions_count,
        p_clicks_count, p_engagement_pct, p_leads_count, p_conversion_pct, p_revenue_num, p_roas_val, p_trend_pct,
        p_color_hex, p_cdn_icon_url, p_status, p_model_engine, NOW()
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
