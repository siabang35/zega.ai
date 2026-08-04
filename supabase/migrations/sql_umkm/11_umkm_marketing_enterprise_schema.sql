-- ============================================================================
-- ZEGA AI: UMKM Marketing Enterprise Schema Migration
-- File: 11_umkm_marketing_enterprise_schema.sql
-- ============================================================================

-- 1. Create umkm_marketing_metrics table
CREATE TABLE IF NOT EXISTS public.umkm_marketing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    total_reach TEXT NOT NULL DEFAULT '125.4K',
    engagement_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.80,
    leads_generated INTEGER NOT NULL DEFAULT 456,
    revenue_campaign NUMERIC(14, 2) NOT NULL DEFAULT 5200000.00,
    cost_per_lead NUMERIC(12, 2) NOT NULL DEFAULT 11403.00,
    roas NUMERIC(5, 2) NOT NULL DEFAULT 4.20,
    reach_growth NUMERIC(5, 2) DEFAULT 12.00,
    engagement_growth NUMERIC(5, 2) DEFAULT -1.20,
    leads_growth NUMERIC(5, 2) DEFAULT 23.00,
    revenue_growth NUMERIC(5, 2) DEFAULT 18.00,
    cpl_growth NUMERIC(5, 2) DEFAULT -8.00,
    roas_growth NUMERIC(5, 2) DEFAULT 15.00,
    period_label TEXT DEFAULT '1 Jul - 31 Jul 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create umkm_marketing_channels table
CREATE TABLE IF NOT EXISTS public.umkm_marketing_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL, -- WhatsApp, Instagram, Shopee, TikTok, Email
    reach_text TEXT NOT NULL,
    engagement_pct NUMERIC(5, 2) NOT NULL,
    leads_count INTEGER NOT NULL,
    conversion_pct NUMERIC(5, 2) NOT NULL,
    trend_color TEXT DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create umkm_marketing_campaigns table
CREATE TABLE IF NOT EXISTS public.umkm_marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    date_range TEXT NOT NULL,
    reach_text TEXT NOT NULL,
    leads_count INTEGER NOT NULL,
    revenue NUMERIC(14, 2) NOT NULL,
    roas_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif', -- Aktif, Selesai, Dijeda
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create umkm_marketing_content table (AI Content Studio)
CREATE TABLE IF NOT EXISTS public.umkm_marketing_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    platform TEXT NOT NULL, -- Instagram, TikTok, WhatsApp, Shopee
    content_type TEXT NOT NULL, -- Instagram Post, Instagram Story, WhatsApp Template, TikTok Video
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create umkm_marketing_activities table
CREATE TABLE IF NOT EXISTS public.umkm_marketing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- campaign, content, leads, report
    title TEXT NOT NULL,
    time_ago TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_activities ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies
DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_metrics" ON public.umkm_marketing_metrics;
CREATE POLICY "Allow all for authenticated umkm_marketing_metrics" ON public.umkm_marketing_metrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_channels" ON public.umkm_marketing_channels;
CREATE POLICY "Allow all for authenticated umkm_marketing_channels" ON public.umkm_marketing_channels FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_campaigns" ON public.umkm_marketing_campaigns;
CREATE POLICY "Allow all for authenticated umkm_marketing_campaigns" ON public.umkm_marketing_campaigns FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_content" ON public.umkm_marketing_content;
CREATE POLICY "Allow all for authenticated umkm_marketing_content" ON public.umkm_marketing_content FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_activities" ON public.umkm_marketing_activities;
CREATE POLICY "Allow all for authenticated umkm_marketing_activities" ON public.umkm_marketing_activities FOR ALL USING (true);

-- Enable Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_metrics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_metrics;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_campaigns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_campaigns;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_content'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_content;
    END IF;
END $$;

-- 6. Seed Data Matching Reference Screenshot
INSERT INTO public.umkm_marketing_metrics (
    id, store_id, total_reach, engagement_rate, leads_generated, revenue_campaign, cost_per_lead, roas,
    reach_growth, engagement_growth, leads_growth, revenue_growth, cpl_growth, roas_growth, period_label
) VALUES (
    '33333333-9999-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '125.4K',
    7.80,
    456,
    5200000.00,
    11403.00,
    4.20,
    12.00,
    -1.20,
    23.00,
    18.00,
    -8.00,
    15.00,
    '1 Jul - 31 Jul 2026'
) ON CONFLICT (id) DO UPDATE SET
    total_reach = EXCLUDED.total_reach,
    updated_at = NOW();

-- Purge existing demo records to ensure clean CDN paths
DELETE FROM public.umkm_marketing_campaigns WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_content WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_channels WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_activities WHERE store_id = '11111111-1111-1111-1111-111111111111';

-- Seed Marketing Channels
INSERT INTO public.umkm_marketing_channels (store_id, channel_name, reach_text, engagement_pct, leads_count, conversion_pct, trend_color) VALUES
('11111111-1111-1111-1111-111111111111', 'WhatsApp', '56.2K', 6.80, 198, 3.50, '#10b981'),
('11111111-1111-1111-1111-111111111111', 'Instagram', '32.8K', 8.20, 132, 4.10, '#a855f7'),
('11111111-1111-1111-1111-111111111111', 'Shopee', '18.6K', 5.60, 76, 3.20, '#f97316'),
('11111111-1111-1111-1111-111111111111', 'TikTok', '12.4K', 9.10, 50, 4.00, '#06b6d4'),
('11111111-1111-1111-1111-111111111111', 'Email', '5.4K', 4.20, 28, 2.60, '#3b82f6');

-- Seed Top Campaigns (Using Local CDN Paths)
INSERT INTO public.umkm_marketing_campaigns (store_id, campaign_name, date_range, reach_text, leads_count, revenue, roas_text, status, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Promo Agustus', '22 Jun - 22 Jul', '45.2K', 182, 2450000.00, '3.8x', 'Aktif', '/design/dashboard_umkm/marketing/promo_skincare.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Diskon Spesial Minggu Ini', '15 Jul - 31 Jul', '32.1K', 128, 1620000.00, '2.9x', 'Aktif', '/design/dashboard_umkm/marketing/discount.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Bundle Hemat', '10 Jul - 24 Jul', '23.6K', 84, 780000.00, '2.1x', 'Aktif', '/design/dashboard_umkm/marketing/promo_skincare.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Launching Produk Baru', '1 Jul - 20 Jul', '18.9K', 46, 350000.00, '1.6x', 'Selesai', '/design/dashboard_umkm/marketing/tiktok_video.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Remarketing Customer', '1 Jul - 31 Jul', '7.6K', 16, 0.00, '-', 'Aktif', '/design/dashboard_umkm/marketing/instagram_story.jpeg');

-- Seed AI Content Studio Items (Using Local CDN Paths)
INSERT INTO public.umkm_marketing_content (store_id, title, platform, content_type, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Promo Skincare', 'Instagram', 'Instagram Post', '/design/dashboard_umkm/marketing/promo_skincare.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Tips Perawatan Kulit', 'Instagram', 'Instagram Story', '/design/dashboard_umkm/marketing/instagram_story.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Diskon Spesial!', 'WhatsApp', 'WhatsApp Template', '/design/dashboard_umkm/marketing/discount.jpeg'),
('11111111-1111-1111-1111-111111111111', 'Produk Baru', 'TikTok', 'TikTok Video', '/design/dashboard_umkm/marketing/tiktok_video.jpeg');

-- Seed Marketing Recent Activities
INSERT INTO public.umkm_marketing_activities (store_id, activity_type, title, time_ago) VALUES
('11111111-1111-1111-1111-111111111111', 'campaign', 'Campaign Promo Agustus diperbarui', '2 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'content', 'Konten Instagram baru dipublish', '15 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'leads', 'Leads dari WhatsApp bertambah 12', '30 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'report', 'Laporan performa mingguan tersedia', '1 jam lalu');
