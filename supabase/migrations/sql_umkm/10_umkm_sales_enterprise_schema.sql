-- ============================================================================
-- ZEGA AI: UMKM Sales Enterprise Schema Migration
-- File: 10_umkm_sales_enterprise_schema.sql
-- ============================================================================

-- 1. Create umkm_sales_metrics table
CREATE TABLE IF NOT EXISTS public.umkm_sales_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 13500000.00,
    total_orders INTEGER NOT NULL DEFAULT 116,
    avg_order_value NUMERIC(12, 2) NOT NULL DEFAULT 116379.00,
    conversion_rate NUMERIC(5, 2) NOT NULL DEFAULT 4.20,
    new_customers INTEGER NOT NULL DEFAULT 32,
    revenue_growth NUMERIC(5, 2) DEFAULT 18.00,
    orders_growth NUMERIC(5, 2) DEFAULT 21.00,
    aov_growth NUMERIC(5, 2) DEFAULT 5.00,
    conversion_growth NUMERIC(5, 2) DEFAULT 1.30,
    customers_growth NUMERIC(5, 2) DEFAULT 14.00,
    period_label TEXT DEFAULT '1 Jul - 31 Jul 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create umkm_sales_channels table
CREATE TABLE IF NOT EXISTS public.umkm_sales_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL, -- whatsapp, shopee, instagram, tiktok
    percentage NUMERIC(5, 2) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    color_hex TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create umkm_sales_products table
CREATE TABLE IF NOT EXISTS public.umkm_sales_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    units_sold INTEGER NOT NULL,
    revenue NUMERIC(14, 2) NOT NULL,
    trend_growth NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create umkm_sales_activities table
CREATE TABLE IF NOT EXISTS public.umkm_sales_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- order, payment, refund, customer
    title TEXT NOT NULL,
    subtitle TEXT,
    time_ago TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create umkm_sales_goals table
CREATE TABLE IF NOT EXISTS public.umkm_sales_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    current_revenue NUMERIC(14, 2) NOT NULL DEFAULT 13500000.00,
    target_revenue NUMERIC(14, 2) NOT NULL DEFAULT 20000000.00,
    days_left INTEGER NOT NULL DEFAULT 3,
    period_month TEXT DEFAULT 'Juli 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_sales_goals ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Development
DROP POLICY IF EXISTS "Allow all for authenticated umkm_sales_metrics" ON public.umkm_sales_metrics;
CREATE POLICY "Allow all for authenticated umkm_sales_metrics" ON public.umkm_sales_metrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_sales_channels" ON public.umkm_sales_channels;
CREATE POLICY "Allow all for authenticated umkm_sales_channels" ON public.umkm_sales_channels FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_sales_products" ON public.umkm_sales_products;
CREATE POLICY "Allow all for authenticated umkm_sales_products" ON public.umkm_sales_products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_sales_activities" ON public.umkm_sales_activities;
CREATE POLICY "Allow all for authenticated umkm_sales_activities" ON public.umkm_sales_activities FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_sales_goals" ON public.umkm_sales_goals;
CREATE POLICY "Allow all for authenticated umkm_sales_goals" ON public.umkm_sales_goals FOR ALL USING (true);

-- Enable Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_sales_metrics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_metrics;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_sales_goals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_goals;
    END IF;
END $$;

-- 6. Seed Data Matching Reference Design
INSERT INTO public.umkm_sales_metrics (
    id, store_id, total_revenue, total_orders, avg_order_value, conversion_rate, new_customers,
    revenue_growth, orders_growth, aov_growth, conversion_growth, customers_growth, period_label
) VALUES (
    '11111111-9999-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    13500000.00,
    116,
    116379.00,
    4.20,
    32,
    18.00,
    21.00,
    5.00,
    1.30,
    14.00,
    '1 Jul - 31 Jul 2026'
) ON CONFLICT (id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    updated_at = NOW();

-- Seed Channels
INSERT INTO public.umkm_sales_channels (store_id, channel_name, percentage, amount, color_hex) VALUES
('11111111-1111-1111-1111-111111111111', 'WhatsApp', 45.00, 6100000.00, '#10b981'),
('11111111-1111-1111-1111-111111111111', 'Shopee', 30.00, 4100000.00, '#f97316'),
('11111111-1111-1111-1111-111111111111', 'Instagram', 15.00, 2000000.00, '#a855f7'),
('11111111-1111-1111-1111-111111111111', 'TikTok', 10.00, 1300000.00, '#06b6d4');

-- Seed Top Products
INSERT INTO public.umkm_sales_products (store_id, rank, product_name, units_sold, revenue, trend_growth) VALUES
('11111111-1111-1111-1111-111111111111', 1, 'Paket Skincare Basic', 32, 3840000.00, 16.00),
('11111111-1111-1111-1111-111111111111', 2, 'Paket Skincare Premium', 24, 3576000.00, 12.00),
('11111111-1111-1111-1111-111111111111', 3, 'Serum Brightening', 18, 2160000.00, 8.00),
('11111111-1111-1111-1111-111111111111', 4, 'Face Wash', 16, 1276000.00, 4.00),
('11111111-1111-1111-1111-111111111111', 5, 'Moisturizer', 12, 1020000.00, 6.00);

-- Seed Recent Activities
INSERT INTO public.umkm_sales_activities (store_id, activity_type, title, subtitle, time_ago) VALUES
('11111111-1111-1111-1111-111111111111', 'order', 'Order baru dari Siti Aisyah', 'Rp199.000', '2 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'payment', 'Pembayaran berhasil diterima', 'Order #INV-2026-0729', '10 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'refund', 'Refund untuk Order #INV-2026-0721', 'Rp99.000', '1 jam lalu'),
('11111111-1111-1111-1111-111111111111', 'customer', 'Customer baru Andi Saputra', 'Channel: WhatsApp', '2 jam lalu');

-- Seed Sales Goals
INSERT INTO public.umkm_sales_goals (
    id, store_id, current_revenue, target_revenue, days_left, period_month
) VALUES (
    '22222222-9999-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    13500000.00,
    20000000.00,
    3,
    'Juli 2026'
) ON CONFLICT (id) DO UPDATE SET
    current_revenue = EXCLUDED.current_revenue,
    target_revenue = EXCLUDED.target_revenue,
    updated_at = NOW();
