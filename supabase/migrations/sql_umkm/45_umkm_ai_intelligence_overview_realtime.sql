-- ============================================================================
-- SQL MIGRATION 45: UMKM AI INTELLIGENCE & REPORTS REALTIME & ENTERPRISE INFRASTRUCTURE
-- ============================================================================
-- Purpose: Complete backend, database, and CDN integration for the AI Intelligence
-- & Reports Overview view. Provides multi-subtab telemetry ('Overview', 'Sales',
-- 'Marketing', 'Store', 'Finance', 'Customers'), dynamic time-horizon support
-- ('Daily', 'Weekly', 'Monthly'), business health scoring, report export logs, and
-- automated cron report schedule management with Supabase Realtime & RLS.
-- ============================================================================

BEGIN;

-- 1. Create umkm_ai_intelligence_metrics (Sub-tab & Time Horizon Aware Metrics)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sub_tab TEXT NOT NULL DEFAULT 'Overview', -- 'Overview', 'Sales', 'Marketing', 'Store', 'Finance', 'Customers'
    time_horizon TEXT NOT NULL DEFAULT 'Daily', -- 'Daily', 'Weekly', 'Monthly'
    total_revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 13500000.00,
    total_orders INTEGER NOT NULL DEFAULT 116,
    new_customers INTEGER NOT NULL DEFAULT 126,
    avg_order_value_idr NUMERIC(15,2) NOT NULL DEFAULT 116379.00,
    conversion_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 4.20,
    revenue_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    orders_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 21.00,
    customers_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    aov_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    conversion_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 1.30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create umkm_ai_intelligence_revenue_time (Time-series chart data per horizon & tab)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_revenue_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sub_tab TEXT NOT NULL DEFAULT 'Overview',
    time_horizon TEXT NOT NULL DEFAULT 'Daily',
    sort_order INTEGER NOT NULL DEFAULT 1,
    period_label TEXT NOT NULL, -- e.g. '1 Jul', '6 Jul' or 'Minggu 1', 'Minggu 2' or 'Mei', 'Jun', 'Jul'
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    orders_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create umkm_ai_intelligence_channels (Sales Channels breakdown)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sub_tab TEXT NOT NULL DEFAULT 'Overview',
    channel_name TEXT NOT NULL, -- 'WhatsApp', 'Shopee', 'Instagram', 'TikTok', etc.
    percentage INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    color_hex TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_ai_channels_unique UNIQUE (store_id, sub_tab, channel_name)
);

-- 4. Create umkm_ai_intelligence_health_scores (Business Health & Recommendations)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    score INTEGER NOT NULL DEFAULT 78,
    category_label TEXT NOT NULL DEFAULT 'Baik',
    points_change INTEGER NOT NULL DEFAULT 12,
    percentile_comparison_pct INTEGER NOT NULL DEFAULT 76,
    ai_recommendation TEXT NOT NULL DEFAULT 'Performa bisnis Anda lebih baik dari 76% UMKM sejenis di industri Anda. Fokus pada konversi WhatsApp untuk maksimalkan revenue.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create umkm_ai_intelligence_top_products (Top Product Rankings)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_top_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sub_tab TEXT NOT NULL DEFAULT 'Overview',
    rank INTEGER NOT NULL DEFAULT 1,
    product_name TEXT NOT NULL,
    units_sold INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    trend_pct INTEGER NOT NULL DEFAULT 0,
    trend_direction TEXT NOT NULL DEFAULT 'up', -- 'up' or 'down'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create umkm_ai_intelligence_top_customers (Top Customer Profiles & Avatars)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_top_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sub_tab TEXT NOT NULL DEFAULT 'Overview',
    customer_name TEXT NOT NULL,
    orders_count INTEGER NOT NULL DEFAULT 0,
    total_spend_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    last_order_at TEXT NOT NULL DEFAULT '28 Jul 2026',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create umkm_ai_intelligence_monthly_summary (Monthly Executive Insights)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    best_performing_day TEXT NOT NULL DEFAULT '22 Jul 2026',
    total_transactions INTEGER NOT NULL DEFAULT 128,
    total_customers INTEGER NOT NULL DEFAULT 86,
    repeat_customer_rate_pct INTEGER NOT NULL DEFAULT 42,
    returning_customer_value_idr NUMERIC(15,2) NOT NULL DEFAULT 5670000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create umkm_ai_intelligence_report_schedules (Automated Schedule Management)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    schedule_type TEXT NOT NULL, -- 'Weekly' or 'Monthly'
    title TEXT NOT NULL,
    cron_description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create umkm_ai_intelligence_export_logs (Report Exports Audit Log)
CREATE TABLE IF NOT EXISTS public.umkm_ai_intelligence_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    report_type TEXT NOT NULL DEFAULT 'Overview',
    file_format TEXT NOT NULL DEFAULT 'PDF', -- 'PDF', 'CSV', 'EXCEL'
    date_range TEXT NOT NULL DEFAULT '1 Jul – 31 Jul 2026',
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    download_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED ENTERPRISE DEMO TELEMETRY DATA
-- ============================================================================

-- Overview Metrics (Daily)
INSERT INTO public.umkm_ai_intelligence_metrics 
(store_id, sub_tab, time_horizon, total_revenue_idr, total_orders, new_customers, avg_order_value_idr, conversion_rate_pct, revenue_growth_pct, orders_growth_pct, customers_growth_pct, aov_growth_pct, conversion_growth_pct)
VALUES 
('STORE-DEMO-1283', 'Overview', 'Daily', 13500000.00, 116, 126, 116379.00, 4.20, 18.00, 21.00, 15.00, 5.00, 1.30),
('STORE-DEMO-1283', 'Sales', 'Daily', 18450000.00, 142, 138, 129929.00, 4.80, 22.50, 24.10, 18.20, 6.40, 1.80),
('STORE-DEMO-1283', 'Marketing', 'Daily', 11200000.00, 98, 110, 114285.00, 3.90, 14.20, 17.50, 12.10, 3.80, 0.90),
('STORE-DEMO-1283', 'Store', 'Daily', 15800000.00, 134, 145, 117910.00, 4.50, 19.80, 23.00, 16.50, 5.50, 1.50),
('STORE-DEMO-1283', 'Finance', 'Daily', 13500000.00, 116, 126, 116379.00, 4.20, 18.00, 21.00, 15.00, 5.00, 1.30),
('STORE-DEMO-1283', 'Customers', 'Daily', 14200000.00, 120, 150, 118333.00, 4.40, 20.10, 22.00, 19.50, 5.20, 1.40)
ON CONFLICT DO NOTHING;

-- Time Series Data (Daily, Weekly, Monthly for Overview)
INSERT INTO public.umkm_ai_intelligence_revenue_time (store_id, sub_tab, time_horizon, sort_order, period_label, revenue_idr, orders_count)
VALUES
('STORE-DEMO-1283', 'Overview', 'Daily', 1, '1 Jul', 600000.00, 5),
('STORE-DEMO-1283', 'Overview', 'Daily', 2, '6 Jul', 1400000.00, 12),
('STORE-DEMO-1283', 'Overview', 'Daily', 3, '11 Jul', 1800000.00, 15),
('STORE-DEMO-1283', 'Overview', 'Daily', 4, '16 Jul', 2160000.00, 18),
('STORE-DEMO-1283', 'Overview', 'Daily', 5, '21 Jul', 2900000.00, 24),
('STORE-DEMO-1283', 'Overview', 'Daily', 6, '26 Jul', 2100000.00, 19),
('STORE-DEMO-1283', 'Overview', 'Daily', 7, '31 Jul', 2540000.00, 23),

('STORE-DEMO-1283', 'Overview', 'Weekly', 1, 'Minggu 1', 3200000.00, 28),
('STORE-DEMO-1283', 'Overview', 'Weekly', 2, 'Minggu 2', 4100000.00, 35),
('STORE-DEMO-1283', 'Overview', 'Weekly', 3, 'Minggu 3', 4800000.00, 41),
('STORE-DEMO-1283', 'Overview', 'Weekly', 4, 'Minggu 4', 5200000.00, 46),

('STORE-DEMO-1283', 'Overview', 'Monthly', 1, 'Mei', 10800000.00, 92),
('STORE-DEMO-1283', 'Overview', 'Monthly', 2, 'Jun', 12100000.00, 104),
('STORE-DEMO-1283', 'Overview', 'Monthly', 3, 'Jul', 13500000.00, 116)
ON CONFLICT DO NOTHING;

-- Sales Channels
INSERT INTO public.umkm_ai_intelligence_channels (store_id, sub_tab, channel_name, percentage, revenue_idr, color_hex)
VALUES
('STORE-DEMO-1283', 'Overview', 'WhatsApp', 45, 6100000.00, '#3b82f6'),
('STORE-DEMO-1283', 'Overview', 'Shopee', 30, 4100000.00, '#10b981'),
('STORE-DEMO-1283', 'Overview', 'Instagram', 15, 2000000.00, '#a855f7'),
('STORE-DEMO-1283', 'Overview', 'TikTok', 10, 1300000.00, '#f97316')
ON CONFLICT (store_id, sub_tab, channel_name) DO UPDATE 
SET percentage = EXCLUDED.percentage, revenue_idr = EXCLUDED.revenue_idr, color_hex = EXCLUDED.color_hex;

-- Business Health Score
INSERT INTO public.umkm_ai_intelligence_health_scores (store_id, score, category_label, points_change, percentile_comparison_pct, ai_recommendation)
VALUES ('STORE-DEMO-1283', 78, 'Baik', 12, 76, 'Performa bisnis Anda lebih baik dari 76% UMKM sejenis di industri Anda. Fokus pada konversi WhatsApp untuk maksimalkan revenue.')
ON CONFLICT DO NOTHING;

-- Top Products
INSERT INTO public.umkm_ai_intelligence_top_products (store_id, sub_tab, rank, product_name, units_sold, revenue_idr, trend_pct, trend_direction)
VALUES
('STORE-DEMO-1283', 'Overview', 1, 'Kaos Polos Hitam', 32, 1920000.00, 18, 'up'),
('STORE-DEMO-1283', 'Overview', 2, 'Tumbler Premium', 28, 2800000.00, 12, 'up'),
('STORE-DEMO-1283', 'Overview', 3, 'Botol Minum 500ml', 24, 1680000.00, 8, 'up'),
('STORE-DEMO-1283', 'Overview', 4, 'Hoodie Full Zip', 18, 3600000.00, 4, 'down'),
('STORE-DEMO-1283', 'Overview', 5, 'Totebag Canvas', 15, 750000.00, 6, 'up')
ON CONFLICT DO NOTHING;

-- Top Customers
INSERT INTO public.umkm_ai_intelligence_top_customers (store_id, sub_tab, customer_name, orders_count, total_spend_idr, last_order_at, avatar_url)
VALUES
('STORE-DEMO-1283', 'Overview', 'Siti Aisyah', 12, 3200000.00, '28 Jul 2026', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Overview', 'Budi Santoso', 9, 2180000.00, '27 Jul 2026', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Overview', 'Dewi Lestari', 8, 1950000.00, '26 Jul 2026', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Overview', 'Rizky Pratama', 7, 1120000.00, '26 Jul 2026', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Overview', 'Maya Putri', 6, 1450000.00, '25 Jul 2026', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT DO NOTHING;

-- Monthly Summary
INSERT INTO public.umkm_ai_intelligence_monthly_summary (store_id, best_performing_day, total_transactions, total_customers, repeat_customer_rate_pct, returning_customer_value_idr)
VALUES ('STORE-DEMO-1283', '22 Jul 2026', 128, 86, 42, 5670000.00)
ON CONFLICT DO NOTHING;

-- Report Schedules
INSERT INTO public.umkm_ai_intelligence_report_schedules (store_id, schedule_type, title, cron_description, is_active)
VALUES
('STORE-DEMO-1283', 'Weekly', 'Laporan Mingguan', 'Setiap Senin, 08:00', true),
('STORE-DEMO-1283', 'Monthly', 'Laporan Bulanan', 'Setiap 1 Bulan, 08:00', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENTERPRISE RPC STORED PROCEDURES
-- ============================================================================

-- Function 1: get_umkm_ai_intelligence_overview
CREATE OR REPLACE FUNCTION public.get_umkm_ai_intelligence_overview(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_sub_tab TEXT DEFAULT 'Overview',
    p_time_horizon TEXT DEFAULT 'Daily',
    p_date_range TEXT DEFAULT '1 Jul – 31 Jul 2026'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metrics JSONB;
    v_revenue_time JSONB;
    v_sales_channels JSONB;
    v_health_score JSONB;
    v_top_products JSONB;
    v_top_customers JSONB;
    v_monthly_summary JSONB;
    v_schedules JSONB;
    v_result JSONB;
BEGIN
    -- Fetch Metrics
    SELECT row_to_json(m)::jsonb INTO v_metrics
    FROM (
        SELECT 
            total_revenue_idr,
            total_orders,
            new_customers,
            avg_order_value_idr,
            conversion_rate_pct,
            revenue_growth_pct,
            orders_growth_pct,
            customers_growth_pct,
            aov_growth_pct,
            conversion_growth_pct
        FROM public.umkm_ai_intelligence_metrics
        WHERE store_id = p_store_id
          AND (sub_tab = p_sub_tab OR sub_tab = 'Overview')
        ORDER BY (sub_tab = p_sub_tab) DESC
        LIMIT 1
    ) m;

    -- Fetch Time Series Revenue Data
    SELECT coalesce(jsonb_agg(row_to_json(rt)), '[]'::jsonb) INTO v_revenue_time
    FROM (
        SELECT period_label, revenue_idr, orders_count
        FROM public.umkm_ai_intelligence_revenue_time
        WHERE store_id = p_store_id
          AND (sub_tab = p_sub_tab OR sub_tab = 'Overview')
          AND time_horizon = p_time_horizon
        ORDER BY sort_order ASC
    ) rt;

    -- If no specific time horizon data found, fallback to Daily Overview time series
    IF jsonb_array_length(v_revenue_time) = 0 THEN
        SELECT coalesce(jsonb_agg(row_to_json(rt)), '[]'::jsonb) INTO v_revenue_time
        FROM (
            SELECT period_label, revenue_idr, orders_count
            FROM public.umkm_ai_intelligence_revenue_time
            WHERE store_id = p_store_id
              AND sub_tab = 'Overview'
              AND time_horizon = 'Daily'
            ORDER BY sort_order ASC
        ) rt;
    END IF;

    -- Fetch Sales Channels Breakdown
    SELECT coalesce(jsonb_agg(row_to_json(sc)), '[]'::jsonb) INTO v_sales_channels
    FROM (
        SELECT channel_name, percentage, revenue_idr, color_hex
        FROM public.umkm_ai_intelligence_channels
        WHERE store_id = p_store_id
          AND (sub_tab = p_sub_tab OR sub_tab = 'Overview')
        ORDER BY percentage DESC
    ) sc;

    -- Fetch Health Score
    SELECT row_to_json(hs)::jsonb INTO v_health_score
    FROM (
        SELECT score, category_label, points_change, percentile_comparison_pct, ai_recommendation
        FROM public.umkm_ai_intelligence_health_scores
        WHERE store_id = p_store_id
        ORDER BY updated_at DESC
        LIMIT 1
    ) hs;

    -- Fetch Top Products
    SELECT coalesce(jsonb_agg(row_to_json(tp)), '[]'::jsonb) INTO v_top_products
    FROM (
        SELECT rank, product_name, units_sold, revenue_idr, trend_pct, trend_direction
        FROM public.umkm_ai_intelligence_top_products
        WHERE store_id = p_store_id
          AND (sub_tab = p_sub_tab OR sub_tab = 'Overview')
        ORDER BY rank ASC
        LIMIT 5
    ) tp;

    -- Fetch Top Customers
    SELECT coalesce(jsonb_agg(row_to_json(tc)), '[]'::jsonb) INTO v_top_customers
    FROM (
        SELECT customer_name, orders_count, total_spend_idr, last_order_at, avatar_url
        FROM public.umkm_ai_intelligence_top_customers
        WHERE store_id = p_store_id
          AND (sub_tab = p_sub_tab OR sub_tab = 'Overview')
        ORDER BY total_spend_idr DESC
        LIMIT 5
    ) tc;

    -- Fetch Monthly Summary Insights
    SELECT row_to_json(ms)::jsonb INTO v_monthly_summary
    FROM (
        SELECT best_performing_day, total_transactions, total_customers, repeat_customer_rate_pct, returning_customer_value_idr
        FROM public.umkm_ai_intelligence_monthly_summary
        WHERE store_id = p_store_id
        ORDER BY updated_at DESC
        LIMIT 1
    ) ms;

    -- Fetch Report Schedules
    SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_schedules
    FROM (
        SELECT id, schedule_type, title, cron_description, is_active
        FROM public.umkm_ai_intelligence_report_schedules
        WHERE store_id = p_store_id
        ORDER BY created_at ASC
    ) s;

    -- Construct consolidated JSON response
    v_result := jsonb_build_object(
        'metrics', coalesce(v_metrics, '{}'::jsonb),
        'revenueTime', v_revenue_time,
        'salesChannels', v_sales_channels,
        'healthScore', coalesce(v_health_score, '{}'::jsonb),
        'topProducts', v_top_products,
        'topCustomers', v_top_customers,
        'monthlySummary', coalesce(v_monthly_summary, '{}'::jsonb),
        'schedules', v_schedules
    );

    RETURN v_result;
END;
$$;

-- Function 2: export_umkm_ai_report
CREATE OR REPLACE FUNCTION public.export_umkm_ai_report(
    p_store_id TEXT,
    p_report_type TEXT,
    p_file_format TEXT DEFAULT 'PDF',
    p_date_range TEXT DEFAULT '1 Jul – 31 Jul 2026'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
    v_download_url TEXT;
BEGIN
    v_download_url := 'https://cdn.zega.ai/exports/' || p_store_id || '/report_' || lower(p_report_type) || '_' || lower(p_file_format) || '.pdf';

    INSERT INTO public.umkm_ai_intelligence_export_logs (store_id, report_type, file_format, date_range, status, download_url)
    VALUES (p_store_id, p_report_type, p_file_format, p_date_range, 'COMPLETED', v_download_url)
    RETURNING id INTO v_log_id;

    RETURN jsonb_build_object(
        'success', true,
        'export_id', v_log_id,
        'download_url', v_download_url,
        'message', 'Laporan berhasil diekspor'
    );
END;
$$;

-- Function 3: toggle_umkm_report_schedule
CREATE OR REPLACE FUNCTION public.toggle_umkm_report_schedule(
    p_schedule_id UUID,
    p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_ai_intelligence_report_schedules
    SET is_active = p_is_active
    WHERE id = p_schedule_id;

    RETURN jsonb_build_object('success', true, 'schedule_id', p_schedule_id, 'is_active', p_is_active);
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.umkm_ai_intelligence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_revenue_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_top_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_top_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_intelligence_export_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_metrics" ON public.umkm_ai_intelligence_metrics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_revenue_time" ON public.umkm_ai_intelligence_revenue_time FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_channels" ON public.umkm_ai_intelligence_channels FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_health_scores" ON public.umkm_ai_intelligence_health_scores FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_top_products" ON public.umkm_ai_intelligence_top_products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_top_customers" ON public.umkm_ai_intelligence_top_customers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_monthly_summary" ON public.umkm_ai_intelligence_monthly_summary FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_ai_intelligence_report_schedules" ON public.umkm_ai_intelligence_report_schedules FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public write umkm_ai_intelligence_report_schedules" ON public.umkm_ai_intelligence_report_schedules FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- SUPABASE REALTIME PUBLICATION
-- ============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_intelligence_metrics;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_intelligence_revenue_time;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_intelligence_channels;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_intelligence_health_scores;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_intelligence_report_schedules;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
