-- ============================================================================
-- SQL MIGRATION 14: UMKM STORE ENTERPRISE SCHEMA & REALTIME INFRASTRUCTURE
-- ============================================================================
-- Purpose: Support enterprise Store management, product catalog, stock alerts,
-- store performance metrics, category breakdowns, and R2 CDN integration.
-- ============================================================================

BEGIN;

-- 1. Create umkm_store_products Table
CREATE TABLE IF NOT EXISTS public.umkm_store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Lainnya',
    stock INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0,
    price_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Nonaktif', 'Draft'
    image_path TEXT,
    r2_cdn_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create umkm_store_categories Table
CREATE TABLE IF NOT EXISTS public.umkm_store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL UNIQUE,
    product_count INTEGER NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#10b981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create umkm_store_performance Table (Chart Data: Orders vs Revenue)
CREATE TABLE IF NOT EXISTS public.umkm_store_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL, -- e.g. '1 Jul', '6 Jul', '11 Jul'
    orders_count INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create umkm_store_metrics Table (Summary Bar Cards)
CREATE TABLE IF NOT EXISTS public.umkm_store_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_products INTEGER NOT NULL DEFAULT 152,
    total_stock INTEGER NOT NULL DEFAULT 1240,
    low_stock_count INTEGER NOT NULL DEFAULT 6,
    today_orders INTEGER NOT NULL DEFAULT 43,
    stock_value_idr NUMERIC(15,2) NOT NULL DEFAULT 24500000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed Enterprise Initial Store Data
INSERT INTO public.umkm_store_products (name, sku, category, stock, sold, price_idr, status, image_path)
VALUES
('Kaos Polos Hitam', 'TSH-BLK-001', 'Apparel', 120, 32, 60000.00, 'Aktif', '/assets/products/kaoshitam.png'),
('Tumbler Premium', 'TMB-PRM-002', 'Drinkware', 80, 28, 100000.00, 'Aktif', '/assets/products/tumbler.png'),
('Botol Minum 500ml', 'BTL-500-003', 'Drinkware', 60, 24, 70000.00, 'Aktif', '/assets/products/botolminum.jpeg'),
('Hoodie Full Zip', 'HDZ-FZ-004', 'Apparel', 45, 18, 200000.00, 'Aktif', '/assets/products/hoodie.webp'),
('Totebag Canvas', 'TTB-CNV-005', 'Accessories', 90, 15, 50000.00, 'Aktif', '/assets/products/tottebag.jpeg'),
('Kaos Oversize Putih', 'TSH-WHT-006', 'Apparel', 2, 45, 75000.00, 'Aktif', '/assets/products/kaoshitam.png'),
('Tumbler Silver', 'TMB-SLV-007', 'Drinkware', 4, 19, 110000.00, 'Aktif', '/assets/products/tumbler.png'),
('Botol Minum 750ml', 'BTL-750-008', 'Drinkware', 3, 22, 85000.00, 'Aktif', '/assets/products/botolminum.jpeg'),
('Hoodie Classic Navy', 'HDZ-NVY-009', 'Apparel', 5, 14, 210000.00, 'Aktif', '/assets/products/hoodie.webp'),
('Totebag Canvas Cream', 'TTB-CRM-010', 'Accessories', 4, 11, 55000.00, 'Aktif', '/assets/products/tottebag.jpeg')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_store_categories (name, product_count, color_hex)
VALUES
('Apparel', 58, '#10b981'),
('Drinkware', 34, '#3b82f6'),
('Accessories', 28, '#f59e0b'),
('Lainnya', 32, '#8b5cf6')
ON CONFLICT (name) DO UPDATE SET product_count = EXCLUDED.product_count;

INSERT INTO public.umkm_store_performance (period_label, orders_count, revenue_idr)
VALUES
('1 Jul', 8, 500000.00),
('6 Jul', 18, 1200000.00),
('11 Jul', 14, 950000.00),
('16 Jul', 28, 2160000.00),
('21 Jul', 20, 1400000.00),
('26 Jul', 35, 2800000.00),
('31 Jul', 30, 2250000.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_store_metrics (store_id, total_products, total_stock, low_stock_count, today_orders, stock_value_idr)
VALUES ('STORE-DEMO-1283', 152, 1240, 6, 43, 24500000.00)
ON CONFLICT DO NOTHING;

-- 6. Enable RLS Security
ALTER TABLE public.umkm_store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read umkm_store_products" ON public.umkm_store_products FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_categories" ON public.umkm_store_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_performance" ON public.umkm_store_performance FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_metrics" ON public.umkm_store_metrics FOR SELECT USING (true);

CREATE POLICY "Allow all write umkm_store_products" ON public.umkm_store_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_store_categories" ON public.umkm_store_categories FOR ALL USING (true) WITH CHECK (true);

-- 7. Add Tables to Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_metrics;

COMMIT;
