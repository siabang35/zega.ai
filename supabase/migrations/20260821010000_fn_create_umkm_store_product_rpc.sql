
-- ============================================================================
-- ZEGA AI
-- FIX: fn_create_umkm_store_product
--
-- Identity model:
--
-- auth.uid()
--     ↓ users.auth_user_id
-- users.id
--     ↓ organization_members.user_id
--
-- Strict tenant flow:
--
-- authenticated user
--      ↓
-- application user
--      ↓
-- organization membership
--      ↓
-- store
--      ↓
-- organization + workspace
--      ↓
-- product
-- ============================================================================

BEGIN;


-- ============================================================================
-- 1. REMOVE OLD FUNCTION SIGNATURE
-- ============================================================================

DROP FUNCTION IF EXISTS public.fn_create_umkm_store_product(
    text,
    text,
    text,
    text,
    integer,
    integer,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text,
    uuid,
    uuid
);


-- ============================================================================
-- 2. CREATE CORRECT RPC
--
-- IMPORTANT:
-- p_store_id remains TEXT here because the existing ZEGA product/store
-- schema must be respected.
--
-- The function safely resolves UUID store IDs when applicable.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_create_umkm_store_product(
    p_store_id TEXT,
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
AS $$
DECLARE

    -- Canonical ZEGA application user ID.
    v_user_id UUID;

    -- Authoritative tenant IDs.
    v_org_id UUID;
    v_workspace_id UUID;

    -- Store identity.
    v_store_id TEXT;

    -- New product.
    v_new_id UUID;

    -- Result.
    v_result JSONB;

BEGIN

    -- ========================================================================
    -- 1. AUTHENTICATION
    -- ========================================================================

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
            USING ERRCODE = '42501';
    END IF;


    -- ========================================================================
    -- 2. RESOLVE ZEGA APPLICATION USER
    --
    -- auth.uid() != users.id
    --
    -- auth.uid() = users.auth_user_id
    -- users.id    = organization_members.user_id
    -- ========================================================================

    SELECT u.id
    INTO v_user_id
    FROM public.users AS u
    WHERE u.auth_user_id = auth.uid()
      AND u.status = 'active'
    LIMIT 1;


    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'APPLICATION_USER_NOT_FOUND'
            USING ERRCODE = '42501';
    END IF;


    -- ========================================================================
    -- 3. VALIDATE STORE INPUT
    -- ========================================================================

    v_store_id := NULLIF(BTRIM(p_store_id), '');

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'STORE_ID_REQUIRED'
            USING ERRCODE = '22023';
    END IF;


    -- ========================================================================
    -- 4. RESOLVE STORE TENANT CONTEXT
    --
    -- Store is authoritative.
    --
    -- We do NOT trust organization/workspace supplied by frontend.
    -- ========================================================================

    IF v_store_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN

        SELECT
            s.organization_id,
            s.workspace_id
        INTO
            v_org_id,
            v_workspace_id
        FROM public.umkm_stores AS s
        WHERE s.id = v_store_id::UUID
        LIMIT 1;

    ELSE

        SELECT
            s.organization_id,
            s.workspace_id
        INTO
            v_org_id,
            v_workspace_id
        FROM public.umkm_stores AS s
        WHERE s.store_id_code = v_store_id
        LIMIT 1;

    END IF;


    -- ========================================================================
    -- 5. STORE MUST EXIST
    -- ========================================================================

    IF v_org_id IS NULL OR v_workspace_id IS NULL THEN

        RAISE EXCEPTION 'STORE_NOT_FOUND_OR_INVALID_TENANT'
            USING ERRCODE = '42501';

    END IF;


    -- ========================================================================
    -- 6. VERIFY ORGANIZATION MEMBERSHIP
    --
    -- IMPORTANT:
    -- organization_members.user_id uses public.users.id,
    -- NOT auth.uid().
    -- ========================================================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.organization_members AS om
        WHERE om.organization_id = v_org_id
          AND om.user_id = v_user_id
          AND om.status = 'active'
    ) THEN

        RAISE EXCEPTION 'ORGANIZATION_ACCESS_DENIED'
            USING ERRCODE = '42501';

    END IF;


    -- ========================================================================
    -- 7. VERIFY OPTIONAL CLIENT TENANT VALUES
    --
    -- They are NOT trusted.
    --
    -- If supplied, they must match the authoritative store hierarchy.
    -- ========================================================================

    IF p_organization_id IS NOT NULL
       AND p_organization_id <> v_org_id
    THEN

        RAISE EXCEPTION 'ORGANIZATION_TENANT_MISMATCH'
            USING ERRCODE = '42501';

    END IF;


    IF p_workspace_id IS NOT NULL
       AND p_workspace_id <> v_workspace_id
    THEN

        RAISE EXCEPTION 'WORKSPACE_TENANT_MISMATCH'
            USING ERRCODE = '42501';

    END IF;


    -- ========================================================================
    -- 8. PRODUCT VALIDATION
    -- ========================================================================

    IF NULLIF(BTRIM(p_name), '') IS NULL THEN
        RAISE EXCEPTION 'PRODUCT_NAME_REQUIRED'
            USING ERRCODE = '22023';
    END IF;


    IF COALESCE(p_stock, 0) < 0 THEN
        RAISE EXCEPTION 'INVALID_STOCK'
            USING ERRCODE = '22023';
    END IF;


    IF COALESCE(p_sold, 0) < 0 THEN
        RAISE EXCEPTION 'INVALID_SOLD'
            USING ERRCODE = '22023';
    END IF;


    IF COALESCE(p_price_idr, 0) < 0 THEN
        RAISE EXCEPTION 'INVALID_PRICE'
            USING ERRCODE = '22023';
    END IF;


    IF p_discount_price_idr IS NOT NULL
       AND p_discount_price_idr < 0
    THEN

        RAISE EXCEPTION 'INVALID_DISCOUNT_PRICE'
            USING ERRCODE = '22023';

    END IF;


    IF COALESCE(p_weight_gram, 0) < 0 THEN
        RAISE EXCEPTION 'INVALID_WEIGHT'
            USING ERRCODE = '22023';
    END IF;


    -- ========================================================================
    -- 9. INSERT PRODUCT
    --
    -- Tenant values come from the authoritative store.
    -- ========================================================================

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
        v_org_id,
        v_workspace_id,
        BTRIM(p_name),

        COALESCE(
            NULLIF(BTRIM(p_sku), ''),
            'SKU-' ||
            UPPER(
                SUBSTRING(
                    gen_random_uuid()::TEXT,
                    1,
                    8
                )
            )
        ),

        COALESCE(
            NULLIF(BTRIM(p_category), ''),
            'Lainnya'
        ),

        COALESCE(p_stock, 0),
        COALESCE(p_sold, 0),
        COALESCE(p_price_idr, 0.00),
        p_discount_price_idr,
        COALESCE(p_weight_gram, 250),

        COALESCE(
            NULLIF(BTRIM(p_status), ''),
            'Aktif'
        ),

        COALESCE(p_description, ''),
        COALESCE(p_image_path, ''),
        COALESCE(p_cdn_icon_url, ''),

        NOW(),
        NOW()
    );


    -- ========================================================================
    -- 10. RETURN CREATED PRODUCT
    -- ========================================================================

    SELECT TO_JSONB(p)
    INTO v_result
    FROM public.umkm_store_products AS p
    WHERE p.id = v_new_id;


    RETURN v_result;

END;
$$;


-- ============================================================================
-- 11. LOCK DOWN EXECUTION
-- ============================================================================

REVOKE ALL
ON FUNCTION public.fn_create_umkm_store_product(
    text,
    text,
    text,
    text,
    integer,
    integer,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text,
    uuid,
    uuid
)
FROM PUBLIC;


REVOKE EXECUTE
ON FUNCTION public.fn_create_umkm_store_product(
    text,
    text,
    text,
    text,
    integer,
    integer,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text,
    uuid,
    uuid
)
FROM anon;


GRANT EXECUTE
ON FUNCTION public.fn_create_umkm_store_product(
    text,
    text,
    text,
    text,
    integer,
    integer,
    numeric,
    numeric,
    integer,
    text,
    text,
    text,
    text,
    uuid,
    uuid
)
TO authenticated;


COMMIT;