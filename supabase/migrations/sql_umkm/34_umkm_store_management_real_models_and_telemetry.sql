-- ============================================================================
-- SQL MIGRATION 34: UMKM STORE & INVENTORY MANAGEMENT REAL MODELS & TELEMETRY
-- ============================================================================
-- Purpose: Production-grade schema for UMKM Store & Inventory Management,
-- real AI Swarm deployment (9Router, ZeroClaw, DeepSeek R1, Claude 3.5 Sonnet),
-- Cloudflare R2 CDN assets, dynamic stock telemetry, and Supabase Realtime.
-- ============================================================================

BEGIN;

-- 1. Create umkm_store_metrics Table (Dashboard Metric Cards)
CREATE TABLE IF NOT EXISTS public.umkm_store_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_products INTEGER NOT NULL DEFAULT 152,
    total_stock INTEGER NOT NULL DEFAULT 1240,
    low_stock_count INTEGER NOT NULL DEFAULT 6,
    today_orders INTEGER NOT NULL DEFAULT 43,
    stock_value_idr NUMERIC(15,2) NOT NULL DEFAULT 24500000.00,
    products_growth INTEGER NOT NULL DEFAULT 8,
    stock_inflow INTEGER NOT NULL DEFAULT 120,
    orders_growth_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all metrics columns exist if table was previously created by migration 14
ALTER TABLE public.umkm_store_metrics ADD COLUMN IF NOT EXISTS products_growth INTEGER NOT NULL DEFAULT 8;
ALTER TABLE public.umkm_store_metrics ADD COLUMN IF NOT EXISTS stock_inflow INTEGER NOT NULL DEFAULT 120;
ALTER TABLE public.umkm_store_metrics ADD COLUMN IF NOT EXISTS orders_growth_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00;

-- 2. Create umkm_store_products Table (Real Catalog Items with CDN Assets)
CREATE TABLE IF NOT EXISTS public.umkm_store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'Lainnya',
    stock INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0,
    price_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Nonaktif', 'Draft'
    image_path TEXT,
    cdn_icon_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure cdn_icon_url exists if table was created in migration 14
ALTER TABLE public.umkm_store_products ADD COLUMN IF NOT EXISTS cdn_icon_url TEXT;

-- Ensure UNIQUE constraint on SKU exists for ON CONFLICT clause
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'umkm_store_products_sku_key'
    ) THEN
        ALTER TABLE public.umkm_store_products ADD CONSTRAINT umkm_store_products_sku_key UNIQUE (sku);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Create umkm_store_performance Table (Chart Data: Daily, Weekly, Monthly)
CREATE TABLE IF NOT EXISTS public.umkm_store_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_type TEXT NOT NULL DEFAULT 'Daily', -- 'Daily', 'Weekly', 'Monthly'
    period_label TEXT NOT NULL,
    orders_count INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create umkm_store_swarms Table (AI Inventory Models Deployment)
CREATE TABLE IF NOT EXISTS public.umkm_store_swarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    swarm_name TEXT NOT NULL,
    model_engine TEXT NOT NULL,
    model_provider TEXT NOT NULL DEFAULT 'ZEGA AI Engine',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'SYNCING'
    latency_ms INTEGER NOT NULL DEFAULT 120,
    success_rate NUMERIC(5,2) NOT NULL DEFAULT 99.80,
    cdn_logo_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create umkm_store_insights Table (AI Inventory Assistant Recommendations)
CREATE TABLE IF NOT EXISTS public.umkm_store_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact_level TEXT NOT NULL DEFAULT 'HIGH IMPACT', -- 'CRITICAL', 'HIGH IMPACT', 'RECOMMENDED'
    model_engine TEXT NOT NULL DEFAULT '9Router-Auto-Stock-Optimizer',
    model_provider TEXT NOT NULL DEFAULT '9Router Engine',
    cdn_icon_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png',
    action_label TEXT NOT NULL DEFAULT 'Restok Otomatis',
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'applied'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create umkm_store_categories Table (Category System)
CREATE TABLE IF NOT EXISTS public.umkm_store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon_name TEXT DEFAULT 'Tag',
    color_class TEXT DEFAULT 'bg-purple-50 text-purple-600 dark:bg-purple-950/50',
    product_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all categories columns exist if table was previously created by older migrations
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'Tag';
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS color_class TEXT DEFAULT 'bg-purple-50 text-purple-600 dark:bg-purple-950/50';
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS product_count INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'umkm_store_categories_name_key'
    ) THEN
        ALTER TABLE public.umkm_store_categories ADD CONSTRAINT umkm_store_categories_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. Create umkm_product_analytics Table (AI Performance Analytics)
CREATE TABLE IF NOT EXISTS public.umkm_product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.umkm_store_products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    estimated_revenue_idr NUMERIC(15,2) DEFAULT 0.00,
    conversion_rate_pct NUMERIC(5,2) DEFAULT 0.00,
    margin_pct NUMERIC(5,2) DEFAULT 40.00,
    ai_recommendation TEXT,
    ai_engine TEXT DEFAULT '9Router Layer 5 Engine',
    cdn_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create umkm_stock_sync_logs Table (Multi-Channel Audit Logs)
CREATE TABLE IF NOT EXISTS public.umkm_stock_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    channel_name TEXT NOT NULL, -- 'Tokopedia', 'Shopee', 'TikTok Shop', 'Solana Pay'
    synced_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'SYNCING', 'FAILED'
    latency_ms INTEGER DEFAULT 85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create umkm_discount_campaigns Table (Bulk Discount Campaigns)
CREATE TABLE IF NOT EXISTS public.umkm_discount_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    category_target TEXT NOT NULL DEFAULT 'Semua Kategori',
    discount_percent NUMERIC(5,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Create umkm_product_barcodes Table (Barcode Print Telemetry)
CREATE TABLE IF NOT EXISTS public.umkm_product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL,
    barcode_format TEXT DEFAULT 'CODE128',
    printed_count INTEGER DEFAULT 1,
    printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Audit Telemetry Event Trigger Function
CREATE OR REPLACE FUNCTION fn_log_umkm_store_insight_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.umkm_timeline_events (
        event_type,
        actor_name,
        description,
        metadata
    ) VALUES (
        'STORE_INSIGHT_' || UPPER(NEW.status),
        'ZeroClaw Store Telemetry Agent',
        'Rekomendasi stok "' || NEW.title || '" diubah ke status ' || NEW.status,
        jsonb_build_object(
            'insight_id', NEW.id,
            'action_label', NEW.action_label,
            'model_engine', NEW.model_engine,
            'store_id', NEW.store_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_umkm_store_insight_audit ON public.umkm_store_insights;
CREATE TRIGGER trg_umkm_store_insight_audit
    AFTER UPDATE ON public.umkm_store_insights
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_log_umkm_store_insight_event();

-- 12. Dynamic Category Product Count Trigger Function
CREATE OR REPLACE FUNCTION fn_sync_umkm_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.umkm_store_categories (name, slug, product_count)
        VALUES (NEW.category, LOWER(REPLACE(NEW.category, ' ', '-')), 1)
        ON CONFLICT (name) DO UPDATE SET 
            product_count = (SELECT COUNT(*) FROM public.umkm_store_products WHERE category = EXCLUDED.name);
    END IF;
    IF TG_OP = 'DELETE' THEN
        UPDATE public.umkm_store_categories 
        SET product_count = (SELECT COUNT(*) FROM public.umkm_store_products WHERE category = OLD.category)
        WHERE name = OLD.category;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_umkm_store_category_count_sync ON public.umkm_store_products;
CREATE TRIGGER trg_umkm_store_category_count_sync
    AFTER INSERT OR UPDATE OR DELETE ON public.umkm_store_products
    FOR EACH ROW EXECUTE FUNCTION fn_sync_umkm_category_product_count();

-- 13. Seed Initial Production Data
INSERT INTO public.umkm_store_metrics (
    store_id, total_products, total_stock, low_stock_count, today_orders, stock_value_idr, products_growth, stock_inflow, orders_growth_percent
) VALUES (
    'STORE-DEMO-1283', 152, 1240, 6, 43, 24500000.00, 8, 120, 18.00
) ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_store_categories (name, slug, icon_name, color_class, product_count) VALUES
('Apparel', 'apparel', 'Package', 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50', 58),
('Drinkware', 'drinkware', 'Tag', 'bg-blue-50 text-blue-600 dark:bg-blue-950/50', 34),
('Accessories', 'accessories', 'Percent', 'bg-amber-50 text-amber-600 dark:bg-amber-950/50', 28),
('Fashion & Pakaian', 'fashion-pakaian', 'Package', 'bg-purple-50 text-purple-600 dark:bg-purple-950/50', 12),
('Makanan & Minuman', 'makanan-minuman', 'Tag', 'bg-red-50 text-red-600 dark:bg-red-950/50', 8),
('Lainnya', 'lainnya', 'Layers', 'bg-purple-50 text-purple-600 dark:bg-purple-950/50', 32)
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, icon_name = EXCLUDED.icon_name, color_class = EXCLUDED.color_class;

INSERT INTO public.umkm_store_products (name, sku, category, stock, sold, price_idr, status, image_path, cdn_icon_url) VALUES
('Kaos Polos Hitam', 'TSH-BLK-001', 'Apparel', 120, 32, 60000.00, 'Aktif', '/assets/products/kaoshitam.png', 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg'),
('Tumbler Premium', 'TMB-PRM-002', 'Drinkware', 80, 28, 100000.00, 'Aktif', '/assets/products/tumblersilver.png', 'https://cdn.zegaai.site/assets/logo/9router.png'),
('Botol Minum 500ml', 'BTL-500-003', 'Drinkware', 60, 24, 70000.00, 'Aktif', '/assets/products/botolminum.png', 'https://cdn.zegaai.site/assets/logo/qwen.png'),
('Hoodie Full Zip', 'HDZ-FZ-004', 'Apparel', 45, 18, 200000.00, 'Aktif', '/assets/products/hoodie.png', 'https://cdn.zegaai.site/assets/logo/llama.png'),
('Totebag Canvas', 'TTB-CNV-005', 'Accessories', 90, 15, 50000.00, 'Aktif', '/assets/products/totebag.png', 'https://cdn.zegaai.site/assets/logo/deepseek.png'),
('Kaos Oversize Putih', 'TSH-WHT-006', 'Apparel', 2, 45, 75000.00, 'Aktif', '/assets/products/kaoshitam.png', 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg'),
('Tumbler Silver', 'TMB-SLV-007', 'Drinkware', 4, 19, 110000.00, 'Aktif', '/assets/products/tumblersilver.png', 'https://cdn.zegaai.site/assets/logo/9router.png'),
('Botol Minum 750ml', 'BTL-750-008', 'Drinkware', 3, 22, 85000.00, 'Aktif', '/assets/products/botolminum.png', 'https://cdn.zegaai.site/assets/logo/qwen.png'),
('Hoodie Classic Navy', 'HDZ-NVY-009', 'Apparel', 5, 14, 210000.00, 'Aktif', '/assets/products/hoodie.png', 'https://cdn.zegaai.site/assets/logo/llama.png'),
('Totebag Canvas Cream', 'TTB-CRM-010', 'Accessories', 4, 11, 55000.00, 'Aktif', '/assets/products/totebag.png', 'https://cdn.zegaai.site/assets/logo/deepseek.png')
ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock, sold = EXCLUDED.sold;

INSERT INTO public.umkm_store_swarms (swarm_name, model_engine, model_provider, status, latency_ms, success_rate, cdn_logo_url) VALUES
('9Router Auto-Stock Optimizer', '9Router-Auto-Stock-Optimizer', '9Router Model Router', 'ACTIVE', 95, 99.90, 'https://cdn.zegaai.site/assets/logo/9router.png'),
('DeepSeek R1 Demand Forecaster', 'deepseek/deepseek-r1-distill-llama-70b', 'DeepSeek AI', 'ACTIVE', 210, 99.70, 'https://cdn.zegaai.site/assets/logo/deepseek.png'),
('ZeroClaw Realtime Inventory Audit', 'ZeroClaw-Edge-Gateway', 'ZeroClaw Edge', 'ACTIVE', 78, 99.95, 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg'),
('Claude 3.5 Sonnet Stock Assistant', 'anthropic/claude-3.5-sonnet', 'Anthropic Claude', 'ACTIVE', 150, 99.85, 'https://cdn.zegaai.site/assets/logo/llama.png')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_store_insights (title, description, impact_level, model_engine, model_provider, cdn_icon_url, action_label, status) VALUES
('Restok 6 Produk Kritis (Stok < 5 Unit)', 'ZeroClaw AI mendeteksi 6 produk (Kaos Oversize, Tumbler Silver, Botol 750ml) terancam out-of-stock dalam 48 jam.', 'CRITICAL', 'ZeroClaw-Edge-Gateway', 'ZeroClaw Edge', 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg', 'Restok Otomatis', 'active'),
('Optimasi Harga Hoodie Full Zip (+12% Revenue)', 'DeepSeek R1 menganalisis peningkatan permintaan akhir pekan dan merekomendasikan penyesuaian harga dinamis.', 'HIGH IMPACT', 'deepseek/deepseek-r1-distill-llama-70b', 'DeepSeek AI', 'https://cdn.zegaai.site/assets/logo/deepseek.png', 'Terapkan Penyesuaian', 'active'),
('Pembersihan Stok Totebag Cream (Slow Moving)', '9Router mengidentifikasi stok bundel promosi untuk mempercepat turn-over inventaris toko.', 'RECOMMENDED', '9Router-Auto-Stock-Optimizer', '9Router Engine', 'https://cdn.zegaai.site/assets/logo/9router.png', 'Buat Bundel Promo', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_stock_sync_logs (channel_name, synced_count, status, latency_ms) VALUES
('Tokopedia Official Store', 152, 'SUCCESS', 84),
('Shopee Mall', 148, 'SUCCESS', 92),
('TikTok Shop Indonesia', 152, 'SUCCESS', 68),
('Solana Pay Decentralized POS', 152, 'SUCCESS', 45)
ON CONFLICT DO NOTHING;

-- 14. RLS Security Policies
ALTER TABLE public.umkm_store_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_stock_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_discount_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_product_barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read umkm_store_metrics" ON public.umkm_store_metrics;
DROP POLICY IF EXISTS "Allow public read umkm_store_products" ON public.umkm_store_products;
DROP POLICY IF EXISTS "Allow public read umkm_store_performance" ON public.umkm_store_performance;
DROP POLICY IF EXISTS "Allow public read umkm_store_swarms" ON public.umkm_store_swarms;
DROP POLICY IF EXISTS "Allow public read umkm_store_insights" ON public.umkm_store_insights;
DROP POLICY IF EXISTS "Allow public read umkm_store_categories" ON public.umkm_store_categories;
DROP POLICY IF EXISTS "Allow public read umkm_product_analytics" ON public.umkm_product_analytics;
DROP POLICY IF EXISTS "Allow public read umkm_stock_sync_logs" ON public.umkm_stock_sync_logs;
DROP POLICY IF EXISTS "Allow public read umkm_discount_campaigns" ON public.umkm_discount_campaigns;
DROP POLICY IF EXISTS "Allow public read umkm_product_barcodes" ON public.umkm_product_barcodes;

DROP POLICY IF EXISTS "Allow all write umkm_store_products" ON public.umkm_store_products;
DROP POLICY IF EXISTS "Allow all write umkm_store_swarms" ON public.umkm_store_swarms;
DROP POLICY IF EXISTS "Allow all write umkm_store_insights" ON public.umkm_store_insights;
DROP POLICY IF EXISTS "Allow all write umkm_store_categories" ON public.umkm_store_categories;
DROP POLICY IF EXISTS "Allow all write umkm_product_analytics" ON public.umkm_product_analytics;
DROP POLICY IF EXISTS "Allow all write umkm_stock_sync_logs" ON public.umkm_stock_sync_logs;
DROP POLICY IF EXISTS "Allow all write umkm_discount_campaigns" ON public.umkm_discount_campaigns;
DROP POLICY IF EXISTS "Allow all write umkm_product_barcodes" ON public.umkm_product_barcodes;

CREATE POLICY "Allow public read umkm_store_metrics" ON public.umkm_store_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_products" ON public.umkm_store_products FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_performance" ON public.umkm_store_performance FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_swarms" ON public.umkm_store_swarms FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_insights" ON public.umkm_store_insights FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_store_categories" ON public.umkm_store_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_product_analytics" ON public.umkm_product_analytics FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_stock_sync_logs" ON public.umkm_stock_sync_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_discount_campaigns" ON public.umkm_discount_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public read umkm_product_barcodes" ON public.umkm_product_barcodes FOR SELECT USING (true);

CREATE POLICY "Allow all write umkm_store_products" ON public.umkm_store_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_store_swarms" ON public.umkm_store_swarms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_store_insights" ON public.umkm_store_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_store_categories" ON public.umkm_store_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_product_analytics" ON public.umkm_product_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_stock_sync_logs" ON public.umkm_stock_sync_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_discount_campaigns" ON public.umkm_discount_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all write umkm_product_barcodes" ON public.umkm_product_barcodes FOR ALL USING (true) WITH CHECK (true);

-- 15. Add Tables to Supabase Realtime Publication (Idempotent EXCEPTION Handling)
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_products; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_metrics; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_swarms; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_insights; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_categories; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_product_analytics; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_stock_sync_logs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_discount_campaigns; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_product_barcodes; EXCEPTION WHEN OTHERS THEN NULL; END $$;

COMMIT;
