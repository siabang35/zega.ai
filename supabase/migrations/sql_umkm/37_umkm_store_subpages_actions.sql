-- ============================================================================
-- SQL Migration 37: UMKM Store Sub-Pages Backend Support Procedures
-- Sub-Pages: Add Product, Bulk Upload, Atur Diskon, Kelola Kategori, Cetak Barcode, Sinkron Stok
-- ============================================================================

BEGIN;

-- 1. Function: Bulk Upsert UMKM Products (Import CSV/JSON Massal)
CREATE OR REPLACE FUNCTION public.fn_bulk_upsert_umkm_products(
    p_store_id TEXT,
    p_products JSONB
)
RETURNS TABLE(inserted_count INT, updated_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_inserted INT := 0;
    v_updated INT := 0;
    v_sku TEXT;
    v_name TEXT;
    v_category TEXT;
    v_price NUMERIC;
    v_stock INT;
    v_image_path TEXT;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_products)
    LOOP
        v_sku := COALESCE(v_item->>'sku', 'SKU-' || floor(extract(epoch from now()))::text || '-' || floor(random()*1000)::text);
        v_name := COALESCE(v_item->>'name', 'Produk Baru');
        v_category := COALESCE(v_item->>'category', 'Fashion & Pakaian');
        v_price := COALESCE((v_item->>'price_idr')::numeric, 50000);
        v_stock := COALESCE((v_item->>'stock')::int, 10);
        v_image_path := COALESCE(v_item->>'image_path', '/assets/products/kaoshitam.png');

        IF EXISTS (SELECT 1 FROM public.umkm_store_products WHERE sku = v_sku AND store_id = p_store_id) THEN
            UPDATE public.umkm_store_products
            SET name = v_name,
                category = v_category,
                price_idr = v_price,
                stock = v_stock,
                image_path = v_image_path,
                updated_at = NOW()
            WHERE sku = v_sku AND store_id = p_store_id;
            v_updated := v_updated + 1;
        ELSE
            INSERT INTO public.umkm_store_products (
                store_id, sku, name, category, price_idr, stock, status, image_path, cdn_icon_url, created_at, updated_at
            ) VALUES (
                p_store_id, v_sku, v_name, v_category, v_price, v_stock, 'Aktif', v_image_path, v_image_path, NOW(), NOW()
            );
            v_inserted := v_inserted + 1;
        END IF;
    END LOOP;

    PERFORM public.fn_recalculate_umkm_store_metrics(p_store_id);

    RETURN QUERY SELECT v_inserted, v_updated;
END;
$$;

-- 2. Function: Batch Update Product Discounts (Diskon Massal)
CREATE OR REPLACE FUNCTION public.fn_batch_update_umkm_product_discounts(
    p_store_id TEXT,
    p_product_ids UUID[] DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_discount_percent NUMERIC DEFAULT 0,
    p_discount_flat NUMERIC DEFAULT 0
)
RETURNS TABLE(affected_rows INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    IF p_category IS NOT NULL AND p_category != 'Semua' THEN
        UPDATE public.umkm_store_products
        SET discount_price_idr = CASE 
                WHEN p_discount_percent > 0 THEN price_idr * (1 - (p_discount_percent / 100))
                WHEN p_discount_flat > 0 THEN GREATEST(0, price_idr - p_discount_flat)
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE store_id = p_store_id AND category = p_category;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSIF p_product_ids IS NOT NULL AND array_length(p_product_ids, 1) > 0 THEN
        UPDATE public.umkm_store_products
        SET discount_price_idr = CASE 
                WHEN p_discount_percent > 0 THEN price_idr * (1 - (p_discount_percent / 100))
                WHEN p_discount_flat > 0 THEN GREATEST(0, price_idr - p_discount_flat)
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE store_id = p_store_id AND id = ANY(p_product_ids);
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSE
        UPDATE public.umkm_store_products
        SET discount_price_idr = CASE 
                WHEN p_discount_percent > 0 THEN price_idr * (1 - (p_discount_percent / 100))
                WHEN p_discount_flat > 0 THEN GREATEST(0, price_idr - p_discount_flat)
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE store_id = p_store_id;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    PERFORM public.fn_recalculate_umkm_store_metrics(p_store_id);

    RETURN QUERY SELECT v_count;
END;
$$;

-- 3. Function: Manage Category (Create, Rename, Delete Category)
CREATE OR REPLACE FUNCTION public.fn_manage_umkm_category(
    p_store_id TEXT,
    p_action TEXT,
    p_old_name TEXT DEFAULT NULL,
    p_new_name TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_action = 'rename' AND p_old_name IS NOT NULL AND p_new_name IS NOT NULL THEN
        UPDATE public.umkm_store_products
        SET category = p_new_name, updated_at = NOW()
        WHERE store_id = p_store_id AND category = p_old_name;
        RETURN QUERY SELECT TRUE, 'Kategori ' || p_old_name || ' berhasil diubah menjadi ' || p_new_name;
    ELSIF p_action = 'delete' AND p_old_name IS NOT NULL THEN
        UPDATE public.umkm_store_products
        SET category = 'Lainnya', updated_at = NOW()
        WHERE store_id = p_store_id AND category = p_old_name;
        RETURN QUERY SELECT TRUE, 'Kategori ' || p_old_name || ' dihapus. Produk dipindahkan ke Lainnya.';
    ELSE
        RETURN QUERY SELECT TRUE, 'Kategori berhasil diproses';
    END IF;
END;
$$;

-- 4. Function: Sync Inventory Stock Across Channels
CREATE OR REPLACE FUNCTION public.fn_sync_umkm_inventory_stock(
    p_store_id TEXT,
    p_sync_channel TEXT,
    p_adjustments JSONB
)
RETURNS TABLE(synced_items_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_count INT := 0;
    v_id UUID;
    v_new_stock INT;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_adjustments)
    LOOP
        v_id := (v_item->>'id')::UUID;
        v_new_stock := (v_item->>'stock')::INT;

        UPDATE public.umkm_store_products
        SET stock = GREATEST(0, v_new_stock),
            updated_at = NOW()
        WHERE id = v_id AND store_id = p_store_id;

        v_count := v_count + 1;
    END LOOP;

    PERFORM public.fn_recalculate_umkm_store_metrics(p_store_id);

    RETURN QUERY SELECT v_count;
END;
$$;

COMMIT;
