BEGIN;

-- ============================================================
-- ZEGA AI PLATFORM
-- AUTHENTICATED REAL USER PRODUCT CREATION & TENANT RESOLUTION
-- Migration: 20260822000000_fix_dynamic_user_product_creation_permissions.sql
-- ============================================================

-- 1. HARDENED STORE PRODUCT CREATION RPC (AUTHENTICATED REAL USERS ONLY)

CREATE OR REPLACE FUNCTION public.fn_create_umkm_store_product(
    p_store_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Produk Baru',
    p_sku TEXT DEFAULT NULL,
    p_category TEXT DEFAULT 'Lainnya',
    p_stock INTEGER DEFAULT 0,
    p_sold INTEGER DEFAULT 0,
    p_price_idr NUMERIC DEFAULT 0.00,
    p_discount_price_idr NUMERIC DEFAULT NULL,
    p_weight_gram INTEGER DEFAULT 250,
    p_status TEXT DEFAULT 'Aktif',
    p_description TEXT DEFAULT '',
    p_image_path TEXT DEFAULT '',
    p_cdn_icon_url TEXT DEFAULT '',
    p_organization_id UUID DEFAULT NULL,
    p_workspace_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$

DECLARE
    v_app_user_id UUID;
    v_store_id UUID;
    v_store_org_id UUID;
    v_store_workspace_id UUID;
    v_new_id UUID;
    v_result JSONB;

BEGIN

    -- ========================================================
    -- 1. AUTHENTICATION & REAL USER IDENTITY RESOLUTION
    -- ========================================================

    v_app_user_id := public.fn_current_app_user_id();

    IF v_app_user_id IS NULL THEN
        -- Reconcile / lookup current authenticated app user profile
        v_app_user_id := public.fn_get_or_create_current_app_user();
    END IF;

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION 'APPLICATION_USER_NOT_FOUND: Valid user profile or session required for product creation'
            USING ERRCODE = '42501';
    END IF;

    -- ========================================================
    -- 2. DYNAMIC REAL USER TENANT & STORE RESOLUTION
    -- ========================================================

    v_store_id := p_store_id;

    -- If p_store_id is provided, verify it exists and caller is an active member of its organization
    IF v_store_id IS NOT NULL THEN
        SELECT s.organization_id, s.workspace_id
        INTO v_store_org_id, v_store_workspace_id
        FROM public.umkm_stores AS s
        WHERE s.id = v_store_id
          AND EXISTS (
              SELECT 1 FROM public.organization_members AS om
              WHERE om.organization_id = s.organization_id
                AND om.user_id = v_app_user_id
                AND COALESCE(om.status, 'active') = 'active'
          )
        LIMIT 1;
    END IF;

    -- If p_store_id was invalid or caller does not belong to that store's org,
    -- look up caller's real store from public.umkm_stores
    IF v_store_org_id IS NULL THEN
        SELECT s.id, s.organization_id, s.workspace_id
        INTO v_store_id, v_store_org_id, v_store_workspace_id
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_app_user_id
           OR s.organization_id IN (
               SELECT om.organization_id
               FROM public.organization_members AS om
               WHERE om.user_id = v_app_user_id
                 AND COALESCE(om.status, 'active') = 'active'
           )
        ORDER BY s.created_at DESC
        LIMIT 1;
    END IF;

    -- If caller STILL has no store, auto-provision real store for caller
    IF v_store_id IS NULL OR v_store_org_id IS NULL THEN
        PERFORM public.fn_ensure_individual_umkm_tenant(v_app_user_id, 'Toko UMKM ZEGA');

        SELECT s.id, s.organization_id, s.workspace_id
        INTO v_store_id, v_store_org_id, v_store_workspace_id
        FROM public.umkm_stores AS s
        WHERE s.user_id = v_app_user_id
           OR s.organization_id IN (
               SELECT om.organization_id
               FROM public.organization_members AS om
               WHERE om.user_id = v_app_user_id
                 AND COALESCE(om.status, 'active') = 'active'
           )
        ORDER BY s.created_at DESC
        LIMIT 1;
    END IF;

    IF v_store_id IS NULL OR v_store_org_id IS NULL THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND: Failed to resolve store for real user %', v_app_user_id
            USING ERRCODE = '42501';
    END IF;

    -- Resolve workspace if not set
    IF v_store_workspace_id IS NULL THEN
        SELECT w.id INTO v_store_workspace_id
        FROM public.workspaces AS w
        WHERE w.organization_id = v_store_org_id
        ORDER BY w.created_at ASC
        LIMIT 1;
    END IF;

    -- ========================================================
    -- 3. INSERT REAL PRODUCT ROW
    -- ========================================================

    v_new_id := gen_random_uuid();

    INSERT INTO public.umkm_store_products (
        id,
        store_id,
        organization_id,
        workspace_id,
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
        cdn_icon_url,
        created_at,
        updated_at
    )
    VALUES (
        v_new_id,
        v_store_id,
        v_store_org_id,
        v_store_workspace_id,
        BTRIM(COALESCE(NULLIF(p_name, ''), 'Produk Baru')),
        COALESCE(
            NULLIF(BTRIM(p_sku), ''),
            'SKU-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))
        ),
        COALESCE(NULLIF(BTRIM(p_category), ''), 'Lainnya'),
        GREATEST(COALESCE(p_stock, 0), 0),
        GREATEST(COALESCE(p_sold, 0), 0),
        GREATEST(COALESCE(p_price_idr, 0), 0),
        CASE
            WHEN p_discount_price_idr IS NULL THEN NULL
            ELSE GREATEST(p_discount_price_idr, 0)
        END,
        GREATEST(COALESCE(p_weight_gram, 250), 0),
        COALESCE(NULLIF(BTRIM(p_status), ''), 'Aktif'),
        COALESCE(p_description, ''),
        COALESCE(p_image_path, ''),
        COALESCE(p_cdn_icon_url, ''),
        NOW(),
        NOW()
    )
    RETURNING
        jsonb_build_object(
            'id', id,
            'store_id', store_id,
            'organization_id', organization_id,
            'workspace_id', workspace_id,
            'name', name,
            'sku', sku,
            'category', category,
            'stock', stock,
            'sold', sold,
            'price_idr', price_idr,
            'discount_price_idr', discount_price_idr,
            'weight_gram', weight_gram,
            'status', status,
            'description', description,
            'image_path', image_path,
            'cdn_icon_url', cdn_icon_url,
            'created_at', created_at,
            'updated_at', updated_at
        )
    INTO v_result;

    RETURN v_result;

END;
$function$;

-- ============================================================
-- 2. STRICT PERMISSION MANAGEMENT (AUTHENTICATED ONLY, NO ANON)
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS fn_signature, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'fn_create_umkm_store_product',
              'fn_bulk_import_umkm_products',
              'fn_duplicate_umkm_product',
              'fn_toggle_umkm_product_status',
              'fn_quick_restock_umkm_product'
          )
    LOOP
        -- Revoke from anon & PUBLIC strictly
        EXECUTE format(
            'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, PUBLIC',
            r.proname,
            r.fn_signature
        );

        -- Grant ONLY to authenticated roles & service_role
        EXECUTE format(
            'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role',
            r.proname,
            r.fn_signature
        );
    END LOOP;
END
$$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

COMMIT;
