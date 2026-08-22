BEGIN;

-- ============================================================
-- ZEGA AI PLATFORM
-- BACKEND CANONICAL & AUTHENTICATED PRODUCT DELETION RPC
-- Migration: 20260822020000_fn_delete_umkm_store_product_rpc.sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_delete_umkm_store_product(
    p_product_ids UUID[] DEFAULT NULL,
    p_store_id UUID DEFAULT NULL,
    p_app_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$

DECLARE
    v_app_user_id UUID;
    v_store_id UUID;
    v_deleted_count INTEGER := 0;
    v_deleted_ids UUID[] := ARRAY[]::UUID[];
    v_total_stock_delta INTEGER := 0;
    v_stock_value_delta NUMERIC := 0;
    v_result JSONB;
    r RECORD;

BEGIN

    -- ========================================================
    -- 1. AUTHENTICATION & CANONICAL USER RESOLUTION
    -- ========================================================

    v_app_user_id := p_app_user_id;

    IF v_app_user_id IS NULL THEN
        v_app_user_id := public.fn_current_app_user_id();
    END IF;

    IF v_app_user_id IS NULL THEN
        v_app_user_id := public.fn_get_or_create_current_app_user();
    END IF;

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION 'APPLICATION_USER_NOT_FOUND: Valid user profile required for product deletion'
            USING ERRCODE = '42501';
    END IF;

    -- ========================================================
    -- 2. DYNAMIC REAL USER TENANT & STORE RESOLUTION
    -- ========================================================

    v_store_id := p_store_id;

    -- Verify store ownership / organization membership if store_id provided
    IF v_store_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.umkm_stores AS s
            WHERE s.id::TEXT = v_store_id::TEXT
              AND (
                  s.user_id::TEXT = v_app_user_id::TEXT
                  OR EXISTS (
                      SELECT 1 FROM public.organization_members AS om
                      WHERE om.organization_id::TEXT = s.organization_id::TEXT
                        AND om.user_id::TEXT = v_app_user_id::TEXT
                        AND COALESCE(om.status, 'active') = 'active'
                  )
              )
        ) THEN
            RAISE EXCEPTION 'STORE_NOT_AUTHORIZED: Caller does not have authorization for target store %', v_store_id
                USING ERRCODE = '42501';
        END IF;
    END IF;

    -- If no store_id provided, resolve store from user
    IF v_store_id IS NULL THEN
        SELECT s.id INTO v_store_id
        FROM public.umkm_stores AS s
        WHERE s.user_id::TEXT = v_app_user_id::TEXT
           OR s.organization_id IN (
               SELECT om.organization_id
               FROM public.organization_members AS om
               WHERE om.user_id::TEXT = v_app_user_id::TEXT
                 AND COALESCE(om.status, 'active') = 'active'
           )
        ORDER BY s.created_at DESC
        LIMIT 1;
    END IF;

    -- Validation: array of product IDs must not be empty
    IF p_product_ids IS NULL OR array_length(p_product_ids, 1) IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'deleted_count', 0,
            'deleted_ids', ARRAY[]::UUID[]
        );
    END IF;

    -- ========================================================
    -- 3. PERFORM ATOMIC DELETION & CALCULATE METRIC DELTAS
    -- ========================================================

    -- Calculate stock & value deltas before deletion
    FOR r IN
        SELECT id, COALESCE(stock, 0) AS stock, COALESCE(price_idr, 0) AS price_idr
        FROM public.umkm_store_products
        WHERE id = ANY(p_product_ids)
          AND (v_store_id IS NULL OR store_id::TEXT = v_store_id::TEXT)
    LOOP
        v_total_stock_delta := v_total_stock_delta + r.stock;
        v_stock_value_delta := v_stock_value_delta + (r.price_idr * r.stock);
    END LOOP;

    -- Delete matching product rows
    WITH deleted_rows AS (
        DELETE FROM public.umkm_store_products
        WHERE id = ANY(p_product_ids)
          AND (v_store_id IS NULL OR store_id::TEXT = v_store_id::TEXT)
        RETURNING id
    )
    SELECT COUNT(*)::INTEGER, ARRAY_AGG(id)
    INTO v_deleted_count, v_deleted_ids
    FROM deleted_rows;

    -- ========================================================
    -- 4. UPDATE / RECALCULATE STORE METRICS
    -- ========================================================

    IF v_store_id IS NOT NULL AND v_deleted_count > 0 THEN
        UPDATE public.umkm_store_metrics
        SET
            total_products = GREATEST(0, (
                SELECT COUNT(*) FROM public.umkm_store_products WHERE store_id::TEXT = v_store_id::TEXT
            )),
            total_stock = GREATEST(0, (
                SELECT COALESCE(SUM(stock), 0) FROM public.umkm_store_products WHERE store_id::TEXT = v_store_id::TEXT
            )),
            stock_value_idr = GREATEST(0, (
                SELECT COALESCE(SUM(price_idr * stock), 0) FROM public.umkm_store_products WHERE store_id::TEXT = v_store_id::TEXT
            )),
            updated_at = NOW()
        WHERE store_id::TEXT = v_store_id::TEXT;
    END IF;

    v_result := jsonb_build_object(
        'success', true,
        'deleted_count', COALESCE(v_deleted_count, 0),
        'deleted_ids', COALESCE(v_deleted_ids, ARRAY[]::UUID[])
    );

    RETURN v_result;

END;
$function$;

-- STRICT PERMISSION MANAGEMENT (AUTHENTICATED ONLY, NO ANON)
REVOKE EXECUTE ON FUNCTION public.fn_delete_umkm_store_product(UUID[], UUID, UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_delete_umkm_store_product(UUID[], UUID, UUID) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
