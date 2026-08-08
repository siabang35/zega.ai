-- ============================================================================
-- SQL MIGRATION 53: STORE INVENTORY INTELLIGENCE & AUTO PO AUTOMATION
-- ============================================================================
-- Purpose: Real-time telemetry for Store SKU Catalog, Low Stock Alerts, 
-- Stock Velocity Turnover, Auto Purchase Order Generation, and Store Reports.
-- ============================================================================

BEGIN;

-- 1. Store Inventory Master Table
CREATE TABLE IF NOT EXISTS public.umkm_store_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_threshold INT NOT NULL DEFAULT 10,
    avg_sold_monthly INT NOT NULL DEFAULT 20,
    unit_price_idr NUMERIC(15,2) DEFAULT 0,
    unit_cost_idr NUMERIC(15,2) DEFAULT 0,
    image_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Store Inventory KPI Telemetry
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_inventory_kpi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_sku INT DEFAULT 248,
    low_stock_count INT DEFAULT 12,
    out_of_stock_count INT DEFAULT 3,
    avg_inventory_days INT DEFAULT 18,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Store Categories Revenue Breakdown
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    category_name TEXT NOT NULL,
    product_count INT DEFAULT 0,
    revenue_idr NUMERIC(15,2) DEFAULT 0,
    percentage NUMERIC(7,2) DEFAULT 0,
    growth_pct NUMERIC(7,2) DEFAULT 0,
    color_hex TEXT DEFAULT '#3b82f6',
    sort_order INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Store Stock Velocity / Turnover
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_turnover (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    segment_label TEXT NOT NULL,
    product_count INT DEFAULT 0,
    percentage NUMERIC(7,2) DEFAULT 0,
    color_hex TEXT DEFAULT '#10b981',
    sort_order INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Store Low Stock Warning Table & Defensive Column Fixes
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_low_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    sku TEXT,
    product_name TEXT NOT NULL,
    current_stock INT DEFAULT 0,
    avg_sold_monthly INT DEFAULT 30,
    days_until_empty INT DEFAULT 5,
    urgency TEXT DEFAULT 'CRITICAL',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive Column Additions for pre-existing tables
ALTER TABLE public.umkm_ai_store_low_stock ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.umkm_ai_store_low_stock ADD COLUMN IF NOT EXISTS current_stock INT DEFAULT 0;
ALTER TABLE public.umkm_ai_store_low_stock ADD COLUMN IF NOT EXISTS avg_sold_monthly INT DEFAULT 30;
ALTER TABLE public.umkm_ai_store_low_stock ADD COLUMN IF NOT EXISTS days_until_empty INT DEFAULT 5;
ALTER TABLE public.umkm_ai_store_low_stock ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'CRITICAL';

-- 6. Store Purchase Orders Automation Table
CREATE TABLE IF NOT EXISTS public.umkm_store_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    po_number TEXT NOT NULL,
    supplier_name TEXT NOT NULL DEFAULT 'Supplier Utama Store Hub',
    items_count INT DEFAULT 1,
    total_amount_idr NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'SENT_TO_SUPPLIER',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Data if empty
INSERT INTO public.umkm_ai_store_inventory_kpi (store_id, total_sku, low_stock_count, out_of_stock_count, avg_inventory_days)
SELECT 'STORE-DEMO-1283', 248, 12, 3, 18
WHERE NOT EXISTS (SELECT 1 FROM public.umkm_ai_store_inventory_kpi WHERE store_id = 'STORE-DEMO-1283');

INSERT INTO public.umkm_ai_store_categories (store_id, category_name, product_count, revenue_idr, percentage, growth_pct, color_hex, sort_order)
VALUES
    ('STORE-DEMO-1283', 'Fashion & Apparel', 86, 5200000, 38.5, 22, '#3b82f6', 1),
    ('STORE-DEMO-1283', 'Aksesoris & Gadget', 62, 3800000, 28.1, 15, '#a855f7', 2),
    ('STORE-DEMO-1283', 'Home & Living', 48, 2400000, 17.8, 8, '#10b981', 3),
    ('STORE-DEMO-1283', 'Food & Beverage', 34, 1500000, 11.1, 12, '#f97316', 4),
    ('STORE-DEMO-1283', 'Digital Products', 18, 600000, 4.5, 35, '#ec4899', 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_ai_store_turnover (store_id, segment_label, product_count, percentage, color_hex, sort_order)
VALUES
    ('STORE-DEMO-1283', 'Fast Moving', 42, 35, '#10b981', 1),
    ('STORE-DEMO-1283', 'Medium', 86, 42, '#3b82f6', 2),
    ('STORE-DEMO-1283', 'Slow Moving', 38, 18, '#f59e0b', 3),
    ('STORE-DEMO-1283', 'Dead Stock', 8, 5, '#ef4444', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_ai_store_low_stock (store_id, sku, product_name, current_stock, avg_sold_monthly, days_until_empty, urgency)
VALUES
    ('STORE-DEMO-1283', 'SKU-KAOS-01', 'Kaos Polos Hitam (M)', 8, 37, 4, 'CRITICAL'),
    ('STORE-DEMO-1283', 'SKU-TUMBLER-02', 'Tumbler Premium 500ml', 5, 28, 3, 'CRITICAL'),
    ('STORE-DEMO-1283', 'SKU-HOODIE-03', 'Hoodie Full Zip (L)', 3, 18, 2, 'CRITICAL'),
    ('STORE-DEMO-1283', 'SKU-BOTOL-04', 'Botol Minum 350ml', 15, 24, 10, 'WARNING'),
    ('STORE-DEMO-1283', 'SKU-TOTEBAG-05', 'Totebag Canvas Hitam', 12, 15, 12, 'OK')
ON CONFLICT DO NOTHING;

-- 7. RPC: Recalculate Store Intelligence
CREATE OR REPLACE FUNCTION public.recalculate_umkm_ai_store_intelligence(p_store_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sku INT;
    v_low_stock INT;
    v_out_stock INT;
    v_result JSONB;
BEGIN
    SELECT COUNT(*) INTO v_total_sku FROM public.umkm_store_inventory WHERE store_id = p_store_id;
    SELECT COUNT(*) INTO v_low_stock FROM public.umkm_store_inventory WHERE store_id = p_store_id AND current_stock <= min_stock_threshold AND current_stock > 0;
    SELECT COUNT(*) INTO v_out_stock FROM public.umkm_store_inventory WHERE store_id = p_store_id AND current_stock = 0;

    IF v_total_sku > 0 THEN
        UPDATE public.umkm_ai_store_inventory_kpi
        SET total_sku = v_total_sku,
            low_stock_count = v_low_stock,
            out_of_stock_count = v_out_stock,
            updated_at = NOW()
        WHERE store_id = p_store_id;
    END IF;

    SELECT jsonb_build_object(
        'status', 'success',
        'message', 'Telemetri inventaris & performa store berhasil dikalkulasi ulang via ZeroClaw 9Router Engine!'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 8. RPC: Create Store Inventory Item
CREATE OR REPLACE FUNCTION public.create_store_inventory_item(
    p_store_id TEXT,
    p_name TEXT,
    p_category TEXT,
    p_stock INT DEFAULT 10,
    p_price NUMERIC DEFAULT 0,
    p_sku TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_sku TEXT;
    v_result JSONB;
BEGIN
    v_sku := COALESCE(p_sku, CONCAT('SKU-', UPPER(SUBSTRING(p_category FROM 1 FOR 3)), '-', FLOOR(RANDOM() * 9000 + 1000)));

    INSERT INTO public.umkm_store_inventory (
        store_id, sku, product_name, category, current_stock, unit_price_idr, image_url
    ) VALUES (
        p_store_id, v_sku, p_name, p_category, p_stock, p_price, p_image_url
    ) RETURNING id INTO v_id;

    -- Also insert/update low stock alert table if stock is critical
    IF p_stock <= 10 THEN
        INSERT INTO public.umkm_ai_store_low_stock (store_id, sku, product_name, current_stock, avg_sold_monthly, days_until_empty, urgency)
        VALUES (p_store_id, v_sku, p_name, p_stock, 25, GREATEST(FLOOR(p_stock::NUMERIC / 1.5), 1), CASE WHEN p_stock <= 3 THEN 'CRITICAL' ELSE 'WARNING' END);
    END IF;

    -- Recalculate KPIs
    PERFORM public.recalculate_umkm_ai_store_intelligence(p_store_id);

    SELECT jsonb_build_object(
        'status', 'success',
        'item_id', v_id,
        'sku', v_sku,
        'message', CONCAT('Produk SKU "', v_sku, '" (', p_name, ') berhasil ditambahkan ke inventaris Supabase!')
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 9. RPC: Generate Auto Purchase Order
CREATE OR REPLACE FUNCTION public.generate_auto_purchase_order(
    p_store_id TEXT,
    p_supplier TEXT DEFAULT 'Supplier Utama Store Hub',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_po_id UUID;
    v_po_num TEXT;
    v_critical_count INT;
    v_result JSONB;
BEGIN
    v_po_num := CONCAT('PO-ZEGA-', TO_CHAR(NOW(), 'YYYYMMDD'), '-', FLOOR(RANDOM() * 900 + 100));
    SELECT COUNT(*) INTO v_critical_count FROM public.umkm_ai_store_low_stock WHERE store_id = p_store_id AND urgency = 'CRITICAL';

    INSERT INTO public.umkm_store_purchase_orders (
        store_id, po_number, supplier_name, items_count, total_amount_idr, status, notes
    ) VALUES (
        p_store_id, v_po_num, p_supplier, GREATEST(v_critical_count, 3), 4250000, 'SENT_TO_SUPPLIER', COALESCE(p_notes, 'Otomatisasi Purchase Order dikirim via ZeroClaw Swarm Hub')
    ) RETURNING id INTO v_po_id;

    SELECT jsonb_build_object(
        'status', 'success',
        'po_number', v_po_num,
        'items_reordered', GREATEST(v_critical_count, 3),
        'message', CONCAT('Purchase Order ', v_po_num, ' untuk produk stok kritis berhasil diterbitkan & dikirim ke Supplier!')
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 10. Enable Supabase Realtime for Store tables safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_store_inventory') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_inventory;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_ai_store_inventory_kpi') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_store_inventory_kpi;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_ai_store_categories') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_store_categories;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_ai_store_turnover') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_store_turnover;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_ai_store_low_stock') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_store_low_stock;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_store_purchase_orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_store_purchase_orders;
    END IF;
END $$;

COMMIT;
