-- ============================================================================
-- SQL MIGRATION 36: UMKM STORE ACTIONS RPCs & LOW STOCK MANAGEMENT SUB-PAGE
-- ============================================================================
-- Purpose: Backend stored procedures for all Quick Actions (Tambah Produk, Bulk Upload,
-- Atur Diskon, Kelola Kategori, Cetak Barcode, Sinkron Stok, Quick Restock)
-- ============================================================================

BEGIN;

-- 1. Function: Bulk Apply Discount to Store Products
CREATE OR REPLACE FUNCTION public.fn_apply_umkm_bulk_discount(
    p_category TEXT,
    p_discount_percent NUMERIC,
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283'
)
RETURNS TABLE(updated_count INT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    IF p_category = 'Semua Kategori' OR p_category IS NULL OR p_category = '' THEN
        UPDATE public.umkm_store_products
        SET discount_price_idr = ROUND(price_idr * (1 - (p_discount_percent / 100.0)), 2),
            updated_at = NOW()
        WHERE store_id = p_store_id;
    ELSE
        UPDATE public.umkm_store_products
        SET discount_price_idr = ROUND(price_idr * (1 - (p_discount_percent / 100.0)), 2),
            updated_at = NOW()
        WHERE store_id = p_store_id AND category = p_category;
    END IF;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log to Discount Campaigns table
    INSERT INTO public.umkm_discount_campaigns (
        campaign_name, target_category, discount_percent, status
    ) VALUES (
        'Diskon Bulk ' || p_discount_percent || '% (' || p_category || ')',
        p_category,
        p_discount_percent,
        'ACTIVE'
    );

    RETURN QUERY SELECT v_count;
END;
$$;

-- 2. Function: Bulk Import Products from JSON Payload
CREATE OR REPLACE FUNCTION public.fn_bulk_import_umkm_products(
    p_products JSONB,
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283'
)
RETURNS TABLE(imported_count INT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    elem JSONB;
    v_imported INT := 0;
BEGIN
    FOR elem IN SELECT * FROM jsonb_array_elements(p_products) LOOP
        INSERT INTO public.umkm_store_products (
            store_id,
            name,
            sku,
            category,
            stock,
            sold,
            price_idr,
            discount_price_idr,
            weight_gram,
            status,
            description,
            image_path,
            cdn_icon_url
        ) VALUES (
            p_store_id,
            COALESCE(elem->>'name', 'Produk Baru'),
            COALESCE(elem->>'sku', 'SKU-' || gen_random_uuid()),
            COALESCE(elem->>'category', 'Lainnya'),
            COALESCE((elem->>'stock')::INT, 10),
            COALESCE((elem->>'sold')::INT, 0),
            COALESCE((elem->>'price_idr')::NUMERIC, 50000.00),
            (elem->>'discount_price_idr')::NUMERIC,
            COALESCE((elem->>'weight_gram')::INT, 250),
            COALESCE(elem->>'status', 'Aktif'),
            COALESCE(elem->>'description', 'Produk hasil impor massal katalog UMKM.'),
            COALESCE(elem->>'image_path', '/assets/products/kaoshitam.png'),
            COALESCE(elem->>'cdn_icon_url', 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg')
        )
        ON CONFLICT (sku) DO UPDATE SET
            stock = public.umkm_store_products.stock + EXCLUDED.stock,
            price_idr = EXCLUDED.price_idr,
            updated_at = NOW();

        v_imported := v_imported + 1;
    END LOOP;

    -- Recalculate Metrics Telemetry
    PERFORM public.fn_recalculate_umkm_store_metrics(p_store_id);

    RETURN QUERY SELECT v_imported;
END;
$$;

-- 3. Function: Quick Restock Single Product
CREATE OR REPLACE FUNCTION public.fn_quick_restock_umkm_product(
    p_product_id UUID,
    p_add_stock INT
)
RETURNS TABLE(new_stock INT, product_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_stock INT;
    v_name TEXT;
    v_store_id TEXT;
BEGIN
    UPDATE public.umkm_store_products
    SET stock = stock + p_add_stock,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING stock, name, store_id INTO v_new_stock, v_name, v_store_id;

    -- Update Metrics Telemetry
    IF v_store_id IS NOT NULL THEN
        PERFORM public.fn_recalculate_umkm_store_metrics(v_store_id);
    END IF;

    RETURN QUERY SELECT v_new_stock, v_name;
END;
$$;

-- 4. Helper Function: Recalculate Store Metrics
CREATE OR REPLACE FUNCTION public.fn_recalculate_umkm_store_metrics(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_products INT;
    v_total_stock INT;
    v_low_stock_count INT;
    v_stock_value NUMERIC(15,2);
BEGIN
    SELECT COUNT(*), COALESCE(SUM(stock), 0), COUNT(*) FILTER (WHERE stock <= 10), COALESCE(SUM(price_idr * stock), 0)
    INTO v_total_products, v_total_stock, v_low_stock_count, v_stock_value
    FROM public.umkm_store_products
    WHERE store_id = p_store_id;

    INSERT INTO public.umkm_store_metrics (
        store_id, total_products, total_stock, low_stock_count, stock_value_idr, updated_at
    ) VALUES (
        p_store_id, v_total_products, v_total_stock, v_low_stock_count, v_stock_value, NOW()
    )
    ON CONFLICT (store_id) DO UPDATE SET
        total_products = v_total_products,
        total_stock = v_total_stock,
        low_stock_count = v_low_stock_count,
        stock_value_idr = v_stock_value,
        updated_at = NOW();
END;
$$;

-- 5. Function: Duplicate Single Product
CREATE OR REPLACE FUNCTION public.fn_duplicate_umkm_product(
    p_product_id UUID
)
RETURNS TABLE(new_product_id UUID, new_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
    v_new_name TEXT;
    v_store_id TEXT;
BEGIN
    INSERT INTO public.umkm_store_products (
        store_id, name, sku, category, stock, sold, price_idr, discount_price_idr,
        weight_gram, status, description, image_path, cdn_icon_url
    )
    SELECT 
        store_id, 
        name || ' (Salinan)', 
        'SKU-COPY-' || SUBSTRING(gen_random_uuid()::text, 1, 8), 
        category, 
        stock, 
        0, 
        price_idr, 
        discount_price_idr,
        weight_gram, 
        'Draft', 
        description, 
        image_path, 
        cdn_icon_url
    FROM public.umkm_store_products
    WHERE id = p_product_id
    RETURNING id, name, store_id INTO v_new_id, v_new_name, v_store_id;

    IF v_store_id IS NOT NULL THEN
        PERFORM public.fn_recalculate_umkm_store_metrics(v_store_id);
    END IF;

    RETURN QUERY SELECT v_new_id, v_new_name;
END;
$$;

-- 6. Function: Toggle Product Status (Aktif <-> Nonaktif)
CREATE OR REPLACE FUNCTION public.fn_toggle_umkm_product_status(
    p_product_id UUID
)
RETURNS TABLE(new_status TEXT, product_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status TEXT;
    v_name TEXT;
    v_store_id TEXT;
BEGIN
    UPDATE public.umkm_store_products
    SET status = CASE WHEN status = 'Aktif' THEN 'Nonaktif' ELSE 'Aktif' END,
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING status, name, store_id INTO v_new_status, v_name, v_store_id;

    IF v_store_id IS NOT NULL THEN
        PERFORM public.fn_recalculate_umkm_store_metrics(v_store_id);
    END IF;

    RETURN QUERY SELECT v_new_status, v_name;
END;
$$;

-- 7. Function: Delete Single Product
CREATE OR REPLACE FUNCTION public.fn_delete_umkm_product(
    p_product_id UUID
)
RETURNS TABLE(deleted_id UUID, deleted_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_name TEXT;
    v_store_id TEXT;
BEGIN
    DELETE FROM public.umkm_store_products
    WHERE id = p_product_id
    RETURNING name, store_id INTO v_name, v_store_id;

    IF v_store_id IS NOT NULL THEN
        PERFORM public.fn_recalculate_umkm_store_metrics(v_store_id);
    END IF;

    RETURN QUERY SELECT p_product_id, v_name;
END;
$$;

-- 8. Function: Update Product Full (Details, Price, Discount, Image, Stock, Status)
CREATE OR REPLACE FUNCTION public.fn_update_umkm_product_full(
    p_product_id UUID,
    p_name TEXT,
    p_category TEXT,
    p_price_idr NUMERIC,
    p_discount_price_idr NUMERIC,
    p_stock INT,
    p_status TEXT,
    p_image_path TEXT,
    p_description TEXT
)
RETURNS TABLE(updated_id UUID, updated_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_store_id TEXT;
BEGIN
    UPDATE public.umkm_store_products
    SET name = COALESCE(p_name, name),
        category = COALESCE(p_category, category),
        price_idr = COALESCE(p_price_idr, price_idr),
        discount_price_idr = p_discount_price_idr,
        stock = COALESCE(p_stock, stock),
        status = COALESCE(p_status, status),
        image_path = COALESCE(p_image_path, image_path),
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING store_id INTO v_store_id;

    IF v_store_id IS NOT NULL THEN
        PERFORM public.fn_recalculate_umkm_store_metrics(v_store_id);
    END IF;

    RETURN QUERY SELECT p_product_id, p_name;
END;
$$;

COMMIT;
