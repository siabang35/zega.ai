-- ============================================================================
-- Migration 57: UMKM AI Sales Intelligence, Pipeline, Daily Trend, & Realtime
-- Target Database: Supabase PostgreSQL (AEOP / ZEGA Engine)
-- ============================================================================

BEGIN;

-- 1. UMKM AI Sales KPI Table
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_kpi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_sales_idr NUMERIC(15,2) DEFAULT 18450000.00,
    total_orders INT DEFAULT 142,
    avg_deal_size_idr NUMERIC(15,2) DEFAULT 129929.00,
    win_rate_pct NUMERIC(5,2) DEFAULT 21.10,
    revenue_growth_pct NUMERIC(5,2) DEFAULT 22.50,
    orders_growth_pct NUMERIC(5,2) DEFAULT 24.10,
    aov_growth_pct NUMERIC(5,2) DEFAULT 6.40,
    win_rate_growth_pct NUMERIC(5,2) DEFAULT 3.20,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT umkm_ai_sales_kpi_store_unique UNIQUE(store_id)
);

-- 2. UMKM AI Sales Pipeline Funnel Table
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    stage VARCHAR(100) NOT NULL,
    deal_count INT DEFAULT 0,
    deal_value_idr NUMERIC(15,2) DEFAULT 0.00,
    conversion_pct NUMERIC(5,2) DEFAULT 0.00,
    color_hex VARCHAR(20) DEFAULT '#3b82f6',
    sort_order INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.umkm_ai_sales_pipeline ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 1;
ALTER TABLE public.umkm_ai_sales_pipeline ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1;

-- 3. UMKM AI Sales Order Status Distribution Table
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_order_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    status VARCHAR(50) NOT NULL,
    order_count INT DEFAULT 0,
    percentage NUMERIC(5,2) DEFAULT 0.00,
    color_hex VARCHAR(20) DEFAULT '#10b981',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UMKM AI Sales Daily Trend Table
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_daily_trend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    day_label VARCHAR(10) NOT NULL,
    revenue_idr NUMERIC(15,2) DEFAULT 0.00,
    sort_order INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.umkm_ai_sales_daily_trend ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 1;
ALTER TABLE public.umkm_ai_sales_daily_trend ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1;

-- 5. UMKM AI Sales Top Performers Table
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_performers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    performer_name VARCHAR(100) NOT NULL,
    performer_type VARCHAR(50) DEFAULT 'ai_agent', -- 'ai_agent' | 'channel'
    icon_name VARCHAR(50) DEFAULT 'Bot',
    deals_closed INT DEFAULT 0,
    revenue_idr NUMERIC(15,2) DEFAULT 0.00,
    contribution_pct NUMERIC(5,2) DEFAULT 0.00,
    sort_order INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.umkm_ai_sales_performers ADD COLUMN IF NOT EXISTS performer_type VARCHAR(50) DEFAULT 'ai_agent';
ALTER TABLE public.umkm_ai_sales_performers ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50) DEFAULT 'Bot';
ALTER TABLE public.umkm_ai_sales_performers ADD COLUMN IF NOT EXISTS contribution_pct NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.umkm_ai_sales_performers ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 1;

-- 6. UMKM Sales Reports Automation Audit Log
CREATE TABLE IF NOT EXISTS public.umkm_sales_reports_automation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    report_type VARCHAR(100) NOT NULL,
    format VARCHAR(20) DEFAULT 'pdf',
    date_range VARCHAR(100) DEFAULT 'Current Month',
    cdn_report_url TEXT,
    generated_by VARCHAR(100) DEFAULT 'ZeroClaw Swarm AI Engine',
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEED DEMO DATA FOR DEMO STORE
-- ============================================================================
DO $$
DECLARE
    v_store_id TEXT := 'STORE-DEMO-1283';
BEGIN
    -- KPI Seed
    INSERT INTO public.umkm_ai_sales_kpi (
        store_id, total_sales_idr, total_orders, avg_deal_size_idr, win_rate_pct,
        revenue_growth_pct, orders_growth_pct, aov_growth_pct, win_rate_growth_pct
    ) VALUES (
        v_store_id, 18450000.00, 142, 129929.00, 21.10, 22.50, 24.10, 6.40, 3.20
    ) ON CONFLICT (store_id) DO UPDATE SET
        total_sales_idr = EXCLUDED.total_sales_idr,
        total_orders = EXCLUDED.total_orders,
        avg_deal_size_idr = EXCLUDED.avg_deal_size_idr,
        win_rate_pct = EXCLUDED.win_rate_pct,
        updated_at = NOW();

    -- Pipeline Seed
    DELETE FROM public.umkm_ai_sales_pipeline WHERE store_id = v_store_id;
    INSERT INTO public.umkm_ai_sales_pipeline (store_id, stage, deal_count, deal_value_idr, conversion_pct, color_hex, sort_order) VALUES
    (v_store_id, 'Leads Masuk', 342, 85000000.00, 100.00, '#3b82f6', 1),
    (v_store_id, 'Qualified', 218, 54500000.00, 63.70, '#8b5cf6', 2),
    (v_store_id, 'Proposal Sent', 156, 39000000.00, 45.60, '#f59e0b', 3),
    (v_store_id, 'Negosiasi', 98, 24500000.00, 28.60, '#f97316', 4),
    (v_store_id, 'Closed Won', 72, 18000000.00, 21.10, '#10b981', 5);

    -- Order Status Seed
    DELETE FROM public.umkm_ai_sales_order_status WHERE store_id = v_store_id;
    INSERT INTO public.umkm_ai_sales_order_status (store_id, status, order_count, percentage, color_hex) VALUES
    (v_store_id, 'Selesai', 89, 76.70, '#10b981'),
    (v_store_id, 'Diproses', 18, 15.50, '#3b82f6'),
    (v_store_id, 'Pending', 6, 5.20, '#f59e0b'),
    (v_store_id, 'Dibatalkan', 3, 2.60, '#ef4444');

    -- Daily Trend Seed
    DELETE FROM public.umkm_ai_sales_daily_trend WHERE store_id = v_store_id;
    INSERT INTO public.umkm_ai_sales_daily_trend (store_id, day_label, revenue_idr, sort_order) VALUES
    (v_store_id, 'Sen', 1800000.00, 1),
    (v_store_id, 'Sel', 2200000.00, 2),
    (v_store_id, 'Rab', 1950000.00, 3),
    (v_store_id, 'Kam', 2400000.00, 4),
    (v_store_id, 'Jum', 2800000.00, 5),
    (v_store_id, 'Sab', 3100000.00, 6),
    (v_store_id, 'Min', 1200000.00, 7);

    -- Performers Seed
    DELETE FROM public.umkm_ai_sales_performers WHERE store_id = v_store_id;
    INSERT INTO public.umkm_ai_sales_performers (store_id, performer_name, performer_type, icon_name, deals_closed, revenue_idr, contribution_pct, sort_order) VALUES
    (v_store_id, 'AI Sales Bot – WhatsApp', 'ai_agent', 'Bot', 34, 8500000.00, 32.10, 1),
    (v_store_id, 'Closi – Sales Agent', 'ai_agent', 'Briefcase', 28, 7200000.00, 27.20, 2),
    (v_store_id, 'Shopee Auto-Sync', 'channel', 'ShoppingCart', 22, 5800000.00, 21.90, 3),
    (v_store_id, 'Instagram DM Bot', 'ai_agent', 'Camera', 14, 3200000.00, 12.10, 4),
    (v_store_id, 'TikTok Shop Agent', 'ai_agent', 'Music', 10, 1800000.00, 6.70, 5);
END $$;

-- ============================================================================
-- STORED PROCEDURES (RPC)
-- ============================================================================

-- Recalculate Sales Intelligence RPC
CREATE OR REPLACE FUNCTION public.recalculate_umkm_ai_sales_intelligence(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sales NUMERIC(15,2);
    v_total_orders INT;
    v_avg_deal NUMERIC(15,2);
    v_win_rate NUMERIC(5,2);
    v_result JSONB;
BEGIN
    SELECT COALESCE(SUM(revenue_idr), 18450000.00) INTO v_total_sales FROM public.umkm_ai_sales_daily_trend WHERE store_id = p_store_id;
    SELECT COALESCE(SUM(order_count), 142) INTO v_total_orders FROM public.umkm_ai_sales_order_status WHERE store_id = p_store_id;
    
    IF v_total_orders > 0 THEN
        v_avg_deal := v_total_sales / v_total_orders;
    ELSE
        v_avg_deal := 129929.00;
    END IF;

    SELECT COALESCE(conversion_pct, 21.10) INTO v_win_rate 
    FROM public.umkm_ai_sales_pipeline 
    WHERE store_id = p_store_id AND stage = 'Closed Won';

    UPDATE public.umkm_ai_sales_kpi
    SET total_sales_idr = v_total_sales,
        total_orders = v_total_orders,
        avg_deal_size_idr = v_avg_deal,
        win_rate_pct = COALESCE(v_win_rate, 21.10),
        updated_at = NOW()
    WHERE store_id = p_store_id;

    v_result := jsonb_build_object(
        'success', true,
        'store_id', p_store_id,
        'total_sales_idr', v_total_sales,
        'total_orders', v_total_orders,
        'avg_deal_size_idr', v_avg_deal,
        'win_rate_pct', COALESCE(v_win_rate, 21.10)
    );

    RETURN v_result;
END;
$$;

-- Generate Automated Sales Report RPC
CREATE OR REPLACE FUNCTION public.generate_automated_sales_report(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_report_type VARCHAR(100) DEFAULT 'Sales Funnel Summary',
    p_format VARCHAR(20) DEFAULT 'pdf',
    p_date_range VARCHAR(100) DEFAULT 'Current Month'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_report_id UUID;
    v_cdn_url TEXT;
    v_kpi RECORD;
    v_result JSONB;
BEGIN
    v_cdn_url := 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/reports/sales/' 
                 || LOWER(REPLACE(p_report_type, ' ', '_')) 
                 || '_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') 
                 || '.' || LOWER(p_format);

    INSERT INTO public.umkm_sales_reports_automation (
        store_id, report_type, format, date_range, cdn_report_url, generated_by, status
    ) VALUES (
        p_store_id, p_report_type, LOWER(p_format), p_date_range, v_cdn_url, 'ZeroClaw Swarm AI Engine', 'Completed'
    )
    RETURNING id INTO v_report_id;

    SELECT * INTO v_kpi FROM public.umkm_ai_sales_kpi WHERE store_id = p_store_id;

    v_result := jsonb_build_object(
        'success', true,
        'report_id', v_report_id,
        'report_type', p_report_type,
        'format', p_format,
        'date_range', p_date_range,
        'cdn_report_url', v_cdn_url,
        'generated_at', NOW(),
        'generated_by', 'ZeroClaw Swarm AI Engine',
        'kpi_summary', jsonb_build_object(
            'total_sales_idr', COALESCE(v_kpi.total_sales_idr, 18450000.00),
            'total_orders', COALESCE(v_kpi.total_orders, 142),
            'avg_deal_size_idr', COALESCE(v_kpi.avg_deal_size_idr, 129929.00),
            'win_rate_pct', COALESCE(v_kpi.win_rate_pct, 21.10)
        )
    );

    RETURN v_result;
END;
$$;

-- RLS & Realtime Enablement
ALTER TABLE public.umkm_ai_sales_kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_sales_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_sales_order_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_sales_daily_trend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_sales_performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_reports_automation ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public Read Sales KPI" ON public.umkm_ai_sales_kpi FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Read Sales Pipeline" ON public.umkm_ai_sales_pipeline FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Read Sales Order Status" ON public.umkm_ai_sales_order_status FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Read Sales Daily Trend" ON public.umkm_ai_sales_daily_trend FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Read Sales Performers" ON public.umkm_ai_sales_performers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public Read Sales Reports Automation" ON public.umkm_sales_reports_automation FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_sales_kpi;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_sales_pipeline;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_sales_order_status;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_sales_daily_trend;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_sales_performers;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_reports_automation;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMIT;
