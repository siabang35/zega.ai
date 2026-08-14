-- ============================================================================
-- SQL MIGRATION 39: UMKM CRM CUSTOMERS SUB-PAGES & ENTERPRISE ACTIONS
-- ============================================================================
-- Purpose: Enterprise Sub-Page Data Support & Visualization Analytics:
--   1. /dashboard/customers/list_customers
--   2. /dashboard/customers/customer_segment
--   3. /dashboard/customers/customer_distributions
--   4. /dashboard/customers/customer_activity_stream
-- Provides atomic RPC payload handlers, RFM cohort matrix, regional analytics,
-- AI Swarm campaign insights, and real-time triggers for all CRM views.
-- ============================================================================

BEGIN;

-- 1. Regional Customer Distribution Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_regional_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    region_name TEXT NOT NULL,
    province TEXT NOT NULL DEFAULT 'DKI Jakarta',
    customer_count INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    total_revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    top_selling_category TEXT DEFAULT 'Fashion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customer RFM & Cohort Segmentation Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_rfm_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    segment_name TEXT NOT NULL,
    rfm_score TEXT NOT NULL DEFAULT '555',
    customer_count INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    avg_recency_days INTEGER NOT NULL DEFAULT 7,
    avg_frequency_orders INTEGER NOT NULL DEFAULT 10,
    avg_monetary_idr NUMERIC(15,2) NOT NULL DEFAULT 2500000.00,
    recommended_action TEXT DEFAULT 'Berikan akses early-bird ke koleksi terbaru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CRM Activity & Telemetry Analytics Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_activity_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    channel_name TEXT NOT NULL, -- WhatsApp, Web Store, POS, Email
    engagement_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    total_events INTEGER NOT NULL DEFAULT 0,
    avg_response_time_sec INTEGER NOT NULL DEFAULT 120,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AI Swarm Retention Campaign Insights Table
CREATE TABLE IF NOT EXISTS public.umkm_crm_ai_campaign_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    campaign_name TEXT NOT NULL,
    model_engine TEXT NOT NULL DEFAULT 'DeepSeek R1 Distill 70B',
    model_provider TEXT NOT NULL DEFAULT 'DeepSeek AI',
    cdn_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    recipients_count INTEGER NOT NULL DEFAULT 312,
    converted_count INTEGER NOT NULL DEFAULT 148,
    conversion_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 47.44,
    revenue_generated_idr NUMERIC(15,2) NOT NULL DEFAULT 18500000.00,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Demo Regional Data
INSERT INTO public.umkm_customer_regional_distributions (store_id, region_name, province, customer_count, percentage, total_revenue_idr, top_selling_category)
VALUES
('STORE-DEMO-1283', 'Jakarta', 'DKI Jakarta', 436, 35.00, 545000000.00, 'Fashion & Hijab'),
('STORE-DEMO-1283', 'Jawa Barat', 'Jawa Barat', 312, 25.00, 390000000.00, 'Kuliner & Snack'),
('STORE-DEMO-1283', 'Jawa Tengah', 'Jawa Tengah', 224, 18.00, 280000000.00, 'Kecantikan & Skincare'),
('STORE-DEMO-1283', 'Jawa Timur', 'Jawa Timur', 150, 12.00, 187500000.00, 'Aksesoris'),
('STORE-DEMO-1283', 'Lainnya', 'Luar Jawa', 126, 10.00, 157500000.00, 'Perlengkapan Rumah')
ON CONFLICT DO NOTHING;

-- Seed Demo RFM Data
INSERT INTO public.umkm_customer_rfm_cohorts (store_id, segment_name, rfm_score, customer_count, percentage, avg_recency_days, avg_frequency_orders, avg_monetary_idr, recommended_action)
VALUES
('STORE-DEMO-1283', 'VIP', '555', 224, 18.00, 3, 14, 3200000.00, 'Berikan diskon eksklusif VIP & kirim sampel gratis via WA'),
('STORE-DEMO-1283', 'Loyal', '444', 399, 32.00, 8, 9, 2180000.00, 'Tawarkan program poin loyalitas & bundle hemat'),
('STORE-DEMO-1283', 'Repeat', '333', 349, 28.00, 18, 5, 1450000.00, 'Kirim pengingat repeat order via AI Retention Swarm'),
('STORE-DEMO-1283', 'New', '511', 276, 22.00, 2, 1, 350000.00, 'Berikan ucapan selamat datang & voucher pembelian kedua 15%')
ON CONFLICT DO NOTHING;

-- Seed Demo Activity Analytics Data
INSERT INTO public.umkm_customer_activity_analytics (store_id, channel_name, engagement_percentage, total_events, avg_response_time_sec)
VALUES
('STORE-DEMO-1283', 'WhatsApp Bot', 45.00, 1840, 45),
('STORE-DEMO-1283', 'Web Store', 28.00, 1145, 12),
('STORE-DEMO-1283', 'Point of Sale (POS)', 17.00, 695, 5),
('STORE-DEMO-1283', 'Email Campaign', 10.00, 410, 1800)
ON CONFLICT DO NOTHING;

-- Seed Demo AI Campaign Insights
INSERT INTO public.umkm_crm_ai_campaign_insights (store_id, campaign_name, model_engine, model_provider, cdn_icon_url, recipients_count, converted_count, conversion_rate_pct, revenue_generated_idr, status)
VALUES
('STORE-DEMO-1283', 'Gajian Sale Retention Broadcast', 'DeepSeek R1 Distill 70B', 'DeepSeek AI', 'https://cdn.zegaai.site/assets/logo/deepseek.webp', 312, 148, 47.44, 18500000.00, 'COMPLETED'),
('STORE-DEMO-1283', 'VIP Flash Early Access', 'Claude 3.5 Sonnet', 'Anthropic', 'https://cdn.zegaai.site/assets/logo/claude.webp', 224, 118, 52.68, 24600000.00, 'COMPLETED'),
('STORE-DEMO-1283', 'Winback Churn Risk Cohort', '9Router L5 Swarm Engine', 'ZEGA AI', 'https://cdn.zegaai.site/assets/logo/9router.webp', 180, 64, 35.56, 8900000.00, 'COMPLETED')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUBPAGE RPC DATA PAYLOAD HANDLER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_umkm_crm_subpage_payload(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_subpage TEXT DEFAULT 'overview'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customers JSONB;
    v_segments JSONB;
    v_rfm JSONB;
    v_regional JSONB;
    v_activity JSONB;
    v_metrics JSONB;
    v_channels JSONB;
    v_campaign_insights JSONB;
BEGIN
    -- Fetch Metrics
    SELECT row_to_json(m)::jsonb INTO v_metrics 
    FROM public.umkm_customer_metrics m 
    WHERE m.store_id = p_store_id 
    LIMIT 1;

    IF v_metrics IS NULL THEN
        v_metrics := jsonb_build_object(
            'total_customers', 1248,
            'new_customers', 126,
            'repeat_customers', 312,
            'retention_rate_pct', 68,
            'avg_order_value_idr', 1250000
        );
    END IF;

    -- Fetch Customers List
    SELECT jsonb_agg(c) INTO v_customers 
    FROM (
        SELECT id, name, full_name, email, phone, avatar_url, segment, total_orders, total_spend_idr, last_order_at, status, city_region, sentiment_score, churn_risk_level, ai_notes
        FROM public.umkm_customers 
        WHERE store_id = p_store_id 
        ORDER BY created_at DESC 
        LIMIT 50
    ) c;

    -- Fetch Segments
    SELECT jsonb_agg(s) INTO v_segments 
    FROM (
        SELECT name, percentage, count, color_hex FROM public.umkm_customer_segments WHERE store_id = p_store_id
    ) s;

    -- Fetch RFM Cohorts
    SELECT jsonb_agg(r) INTO v_rfm 
    FROM (
        SELECT segment_name, rfm_score, customer_count, percentage, avg_recency_days, avg_frequency_orders, avg_monetary_idr, recommended_action FROM public.umkm_customer_rfm_cohorts WHERE store_id = p_store_id
    ) r;

    -- Fetch Regional Distributions
    SELECT jsonb_agg(d) INTO v_regional 
    FROM (
        SELECT region_name, province, customer_count, percentage, total_revenue_idr, top_selling_category FROM public.umkm_customer_regional_distributions WHERE store_id = p_store_id ORDER BY percentage DESC
    ) d;

    -- Fetch Activity Stream
    SELECT jsonb_agg(a) INTO v_activity 
    FROM (
        SELECT id, customer_name, COALESCE(action_type, 'checkout') AS action_type, action_description, COALESCE(amount_idr, 0) AS amount_idr, COALESCE(channel, 'CRM Telemetry') AS channel, time_ago, avatar_url, payload, created_at FROM public.umkm_customer_activity_stream WHERE store_id = p_store_id ORDER BY created_at DESC LIMIT 30
    ) a;

    -- Fetch Channel Engagement Analytics
    SELECT jsonb_agg(ch) INTO v_channels
    FROM (
        SELECT channel_name, engagement_percentage, total_events, avg_response_time_sec FROM public.umkm_customer_activity_analytics WHERE store_id = p_store_id
    ) ch;

    -- Fetch AI Campaign Insights
    SELECT jsonb_agg(ci) INTO v_campaign_insights
    FROM (
        SELECT campaign_name, model_engine, model_provider, cdn_icon_url, recipients_count, converted_count, conversion_rate_pct, revenue_generated_idr, status, executed_at FROM public.umkm_crm_ai_campaign_insights WHERE store_id = p_store_id ORDER BY executed_at DESC
    ) ci;

    RETURN jsonb_build_object(
        'success', true,
        'subpage', p_subpage,
        'metrics', v_metrics,
        'customers', COALESCE(v_customers, '[]'::jsonb),
        'segments', COALESCE(v_segments, '[]'::jsonb),
        'rfm_cohorts', COALESCE(v_rfm, '[]'::jsonb),
        'regional_distributions', COALESCE(v_regional, '[]'::jsonb),
        'activity_stream', COALESCE(v_activity, '[]'::jsonb),
        'channel_analytics', COALESCE(v_channels, '[]'::jsonb),
        'campaign_insights', COALESCE(v_campaign_insights, '[]'::jsonb)
    );
END;
$$;

-- RLS & Realtime Setup
ALTER TABLE public.umkm_customer_regional_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_rfm_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_activity_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_crm_ai_campaign_insights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_regional_distributions" ON public.umkm_customer_regional_distributions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_rfm_cohorts" ON public.umkm_customer_rfm_cohorts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_activity_analytics" ON public.umkm_customer_activity_analytics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_crm_ai_campaign_insights" ON public.umkm_crm_ai_campaign_insights FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_regional_distributions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_rfm_cohorts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_activity_analytics;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_crm_ai_campaign_insights;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
