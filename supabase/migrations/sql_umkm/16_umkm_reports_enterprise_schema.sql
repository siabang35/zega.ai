-- ============================================================================
-- SQL MIGRATION 16: UMKM REPORTS ENTERPRISE SCHEMA & REALTIME INFRASTRUCTURE
-- ============================================================================
-- Purpose: Support enterprise Reports & Analytics management, revenue time series,
-- sales by channel, business health scoring, top products/customers rankings,
-- monthly summary insights, and automated report scheduling with Realtime RLS.
-- ============================================================================

BEGIN;

-- 1. Create umkm_reports_metrics Table (5 Top KPI Cards)
CREATE TABLE IF NOT EXISTS public.umkm_reports_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
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

-- 2. Create umkm_reports_revenue_time Table (Line Chart)
CREATE TABLE IF NOT EXISTS public.umkm_reports_revenue_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL, -- e.g. '1 Jul', '6 Jul', '11 Jul', '16 Jul', '21 Jul', '26 Jul', '31 Jul'
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    orders_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create umkm_reports_sales_channel Table (Donut Chart)
CREATE TABLE IF NOT EXISTS public.umkm_reports_sales_channel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    channel_name TEXT NOT NULL UNIQUE, -- 'WhatsApp', 'Shopee', 'Instagram', 'TikTok'
    percentage INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    color_hex TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create umkm_reports_business_health Table (Gauge Chart & AI Recommendations)
CREATE TABLE IF NOT EXISTS public.umkm_reports_business_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    score INTEGER NOT NULL DEFAULT 78,
    category_label TEXT NOT NULL DEFAULT 'Baik',
    points_change INTEGER NOT NULL DEFAULT 12,
    percentile_comparison_pct INTEGER NOT NULL DEFAULT 76,
    ai_recommendation TEXT NOT NULL DEFAULT 'Tingkatkan retensi pelanggan dengan campaign otomatis via WhatsApp.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create umkm_reports_top_products Table
CREATE TABLE IF NOT EXISTS public.umkm_reports_top_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    rank INTEGER NOT NULL DEFAULT 1,
    product_name TEXT NOT NULL,
    units_sold INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    trend_pct INTEGER NOT NULL DEFAULT 0,
    trend_direction TEXT NOT NULL DEFAULT 'up', -- 'up' or 'down'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create umkm_reports_top_customers Table
CREATE TABLE IF NOT EXISTS public.umkm_reports_top_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    customer_name TEXT NOT NULL,
    orders_count INTEGER NOT NULL DEFAULT 0,
    total_spend_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    last_order_at TEXT NOT NULL DEFAULT '28 Jul 2026',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create umkm_reports_monthly_summary Table
CREATE TABLE IF NOT EXISTS public.umkm_reports_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    best_performing_day TEXT NOT NULL DEFAULT '22 Jul 2026',
    total_transactions INTEGER NOT NULL DEFAULT 128,
    total_customers INTEGER NOT NULL DEFAULT 86,
    repeat_customer_rate_pct INTEGER NOT NULL DEFAULT 42,
    returning_customer_value_idr NUMERIC(15,2) NOT NULL DEFAULT 5670000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create umkm_reports_schedules Table
CREATE TABLE IF NOT EXISTS public.umkm_reports_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    schedule_type TEXT NOT NULL, -- 'Weekly' or 'Monthly'
    title TEXT NOT NULL, -- e.g. 'Laporan Mingguan' or 'Laporan Bulanan'
    cron_description TEXT NOT NULL, -- e.g. 'Setiap Senin, 08:00' or 'Setiap 1 Bulan, 08:00'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Seed Demo Reports Data
INSERT INTO public.umkm_reports_metrics (store_id, total_revenue_idr, total_orders, new_customers, avg_order_value_idr, conversion_rate_pct)
VALUES ('STORE-DEMO-1283', 13500000.00, 116, 126, 116379.00, 4.20)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_reports_revenue_time (store_id, period_label, revenue_idr, orders_count)
VALUES
('STORE-DEMO-1283', '1 Jul', 600000.00, 5),
('STORE-DEMO-1283', '6 Jul', 1400000.00, 12),
('STORE-DEMO-1283', '11 Jul', 1800000.00, 15),
('STORE-DEMO-1283', '16 Jul', 2160000.00, 18),
('STORE-DEMO-1283', '21 Jul', 2900000.00, 24),
('STORE-DEMO-1283', '26 Jul', 2100000.00, 19),
('STORE-DEMO-1283', '31 Jul', 2540000.00, 23)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_reports_sales_channel (store_id, channel_name, percentage, revenue_idr, color_hex)
VALUES
('STORE-DEMO-1283', 'WhatsApp', 45, 6100000.00, '#3b82f6'),
('STORE-DEMO-1283', 'Shopee', 30, 4100000.00, '#10b981'),
('STORE-DEMO-1283', 'Instagram', 15, 2000000.00, '#a855f7'),
('STORE-DEMO-1283', 'TikTok', 10, 1300000.00, '#f97316')
ON CONFLICT (channel_name) DO UPDATE SET percentage = EXCLUDED.percentage, revenue_idr = EXCLUDED.revenue_idr;

INSERT INTO public.umkm_reports_business_health (store_id, score, category_label, points_change, percentile_comparison_pct, ai_recommendation)
VALUES ('STORE-DEMO-1283', 78, 'Baik', 12, 76, 'Performa bisnis Anda lebih baik dari 76% UMKM sejenis di industri Anda. Fokus pada konversi WhatsApp untuk maksimalkan revenue.')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_reports_top_products (store_id, rank, product_name, units_sold, revenue_idr, trend_pct, trend_direction)
VALUES
('STORE-DEMO-1283', 1, 'Kaos Polos Hitam', 32, 1920000.00, 18, 'up'),
('STORE-DEMO-1283', 2, 'Tumbler Premium', 28, 2800000.00, 12, 'up'),
('STORE-DEMO-1283', 3, 'Botol Minum 500ml', 24, 1680000.00, 8, 'up'),
('STORE-DEMO-1283', 4, 'Hoodie Full Zip', 18, 3600000.00, 4, 'down'),
('STORE-DEMO-1283', 5, 'Totebag Canvas', 15, 750000.00, 6, 'up')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_reports_top_customers (store_id, customer_name, orders_count, total_spend_idr, last_order_at, avatar_url)
VALUES
('STORE-DEMO-1283', 'Siti Aisyah', 12, 3200000.00, '28 Jul 2026', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Budi Santoso', 9, 2180000.00, '27 Jul 2026', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Dewi Lestari', 8, 1950000.00, '26 Jul 2026', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Rizky Pratama', 7, 1120000.00, '26 Jul 2026', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Maya Putri', 6, 1450000.00, '25 Jul 2026', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_reports_monthly_summary (store_id, best_performing_day, total_transactions, total_customers, repeat_customer_rate_pct, returning_customer_value_idr)
VALUES ('STORE-DEMO-1283', '22 Jul 2026', 128, 86, 42, 5670000.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_reports_schedules (store_id, schedule_type, title, cron_description, is_active)
VALUES
('STORE-DEMO-1283', 'Weekly', 'Laporan Mingguan', 'Setiap Senin, 08:00', true),
('STORE-DEMO-1283', 'Monthly', 'Laporan Bulanan', 'Setiap 1 Bulan, 08:00', true)
ON CONFLICT DO NOTHING;

-- 10. Enable Row Level Security (RLS) & Create Policies
ALTER TABLE public.umkm_reports_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_revenue_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_sales_channel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_business_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_top_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_top_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_reports_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_metrics" ON public.umkm_reports_metrics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_revenue_time" ON public.umkm_reports_revenue_time FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_sales_channel" ON public.umkm_reports_sales_channel FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_business_health" ON public.umkm_reports_business_health FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_top_products" ON public.umkm_reports_top_products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_top_customers" ON public.umkm_reports_top_customers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_monthly_summary" ON public.umkm_reports_monthly_summary FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_reports_schedules" ON public.umkm_reports_schedules FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 11. Add Tables to Supabase Realtime Publication
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_reports_metrics;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_reports_revenue_time;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_reports_sales_channel;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_reports_business_health;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
