BEGIN;

-- ============================================================
-- ZEGA AI
-- FINAL PRODUCT UUID + STRICT MULTI-TENANT RPC FIX
-- ============================================================

-- ============================================================
-- 1. REMOVE LEGACY TEXT RPC SIGNATURES
-- ============================================================

DROP FUNCTION IF EXISTS public.fn_bulk_import_umkm_products(
    text,
    jsonb
);

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


-- ============================================================
-- 2. CREATE CANONICAL UUID PRODUCT CREATE RPC
-- ============================================================

CREATE FUNCTION public.fn_create_umkm_store_product(
    p_store_id UUID,
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

    v_store_org_id UUID;
    v_store_workspace_id UUID;

    v_new_id UUID;
    v_result JSONB;

BEGIN

    -- ========================================================
    -- AUTHENTICATION
    -- ========================================================

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
            USING ERRCODE = '42501';
    END IF;


    -- ========================================================
    -- CANONICAL APPLICATION USER
    -- ========================================================

    v_app_user_id :=
        public.fn_current_app_user_id();


    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION 'APPLICATION_USER_NOT_FOUND'
            USING ERRCODE = '42501';
    END IF;


    -- ========================================================
    -- STORE ID
    -- ========================================================

    IF p_store_id IS NULL THEN
        RAISE EXCEPTION 'STORE_ID_REQUIRED'
            USING ERRCODE = '22023';
    END IF;


    -- ========================================================
    -- SERVER-SIDE STORE RESOLUTION
    --
    -- IMPORTANT:
    -- organization_id and workspace_id are NEVER trusted
    -- from the client as authorization authority.
    -- They are derived from the canonical store.
    -- ========================================================

    SELECT
        s.organization_id,
        s.workspace_id
    INTO
        v_store_org_id,
        v_store_workspace_id
    FROM public.umkm_stores AS s
    WHERE s.id = p_store_id
    LIMIT 1;


    IF v_store_org_id IS NULL THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND'
            USING ERRCODE = '42501';
    END IF;


    -- ========================================================
    -- ORGANIZATION MEMBERSHIP
    -- ========================================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.organization_members AS om
        WHERE om.organization_id = v_store_org_id
          AND om.user_id = v_app_user_id
          AND COALESCE(om.status, 'active') = 'active'
    ) THEN

        RAISE EXCEPTION 'ORGANIZATION_ACCESS_DENIED'
            USING ERRCODE = '42501';

    END IF;


    -- ========================================================
    -- CLIENT TENANT CONTEXT IS ASSERTION ONLY
    -- ========================================================

    IF p_organization_id IS NOT NULL
       AND p_organization_id IS DISTINCT FROM v_store_org_id
    THEN

        RAISE EXCEPTION 'ORGANIZATION_CONTEXT_MISMATCH'
            USING ERRCODE = '42501';

    END IF;


    IF p_workspace_id IS NOT NULL
       AND p_workspace_id IS DISTINCT FROM v_store_workspace_id
    THEN

        RAISE EXCEPTION 'WORKSPACE_CONTEXT_MISMATCH'
            USING ERRCODE = '42501';

    END IF;


    -- ========================================================
    -- CREATE PRODUCT
    -- ========================================================

    v_new_id :=
        gen_random_uuid();


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

        -- canonical store UUID
        p_store_id,

        -- server-derived tenant IDs
        v_store_org_id,
        v_store_workspace_id,

        BTRIM(
            COALESCE(
                NULLIF(p_name, ''),
                'Produk Baru'
            )
        ),

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

        GREATEST(
            COALESCE(p_stock, 0),
            0
        ),

        GREATEST(
            COALESCE(p_sold, 0),
            0
        ),

        GREATEST(
            COALESCE(p_price_idr, 0),
            0
        ),

        CASE
            WHEN p_discount_price_idr IS NULL
                THEN NULL
            ELSE GREATEST(
                p_discount_price_idr,
                0
            )
        END,

        GREATEST(
            COALESCE(p_weight_gram, 250),
            0
        ),

        COALESCE(
            NULLIF(BTRIM(p_status), ''),
            'Aktif'
        ),

        COALESCE(
            p_description,
            ''
        ),

        COALESCE(
            p_image_path,
            ''
        ),

        COALESCE(
            p_cdn_icon_url,
            ''
        ),

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
-- 3. LOCK DOWN RPC EXECUTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.fn_create_umkm_store_product(
    UUID,
    TEXT,
    TEXT,
    TEXT,
    INTEGER,
    INTEGER,
    NUMERIC,
    NUMERIC,
    INTEGER,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    UUID,
    UUID
)
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.fn_create_umkm_store_product(
    UUID,
    TEXT,
    TEXT,
    TEXT,
    INTEGER,
    INTEGER,
    NUMERIC,
    NUMERIC,
    INTEGER,
    TEXT,
    TEXT,
    TEXT,
    TEXT,
    UUID,
    UUID
)
TO authenticated;


-- ============================================================
-- 4. BULK IMPORT
-- ============================================================

CREATE FUNCTION public.fn_bulk_import_umkm_products(
    p_store_id UUID,
    p_products JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$

DECLARE
    v_elem JSONB;
    v_count INTEGER := 0;
    v_created_ids UUID[] := ARRAY[]::UUID[];
    v_result JSONB;
    v_product_id UUID;

BEGIN

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
            USING ERRCODE = '42501';
    END IF;


    IF p_store_id IS NULL THEN
        RAISE EXCEPTION 'STORE_ID_REQUIRED'
            USING ERRCODE = '22023';
    END IF;


    IF p_products IS NULL
       OR jsonb_typeof(p_products) <> 'array'
       OR jsonb_array_length(p_products) = 0
    THEN

        RETURN jsonb_build_object(
            'success', false,
            'count', 0,
            'created_ids', '[]'::JSONB,
            'message', 'Empty products payload'
        );

    END IF;


    -- ========================================================
    -- EVERY PRODUCT GOES THROUGH CANONICAL CREATE RPC
    -- ========================================================

    FOR v_elem IN
        SELECT value
        FROM jsonb_array_elements(p_products)
    LOOP

        v_result :=
            public.fn_create_umkm_store_product(
                p_store_id := p_store_id,

                p_name :=
                    COALESCE(
                        NULLIF(
                            BTRIM(v_elem->>'name'),
                            ''
                        ),
                        'Produk Baru'
                    ),

                p_sku :=
                    NULLIF(
                        BTRIM(v_elem->>'sku'),
                        ''
                    ),

                p_category :=
                    COALESCE(
                        NULLIF(
                            BTRIM(v_elem->>'category'),
                            ''
                        ),
                        'Lainnya'
                    ),

                p_stock :=
                    COALESCE(
                        (v_elem->>'stock')::INTEGER,
                        0
                    ),

                p_sold :=
                    COALESCE(
                        (v_elem->>'sold')::INTEGER,
                        0
                    ),

                p_price_idr :=
                    COALESCE(
                        (v_elem->>'price_idr')::NUMERIC,
                        0
                    ),

                p_discount_price_idr :=
                    NULLIF(
                        BTRIM(
                            v_elem->>'discount_price_idr'
                        ),
                        ''
                    )::NUMERIC,

                p_weight_gram :=
                    COALESCE(
                        (v_elem->>'weight_gram')::INTEGER,
                        250
                    ),

                p_status :=
                    COALESCE(
                        NULLIF(
                            BTRIM(v_elem->>'status'),
                            ''
                        ),
                        'Aktif'
                    ),

                p_description :=
                    COALESCE(
                        v_elem->>'description',
                        ''
                    ),

                p_image_path :=
                    COALESCE(
                        v_elem->>'image_path',
                        ''
                    ),

                p_cdn_icon_url :=
                    COALESCE(
                        v_elem->>'cdn_icon_url',
                        ''
                    )
            );


        v_product_id :=
            NULLIF(
                v_result->>'id',
                ''
            )::UUID;


        IF v_product_id IS NOT NULL THEN

            v_created_ids :=
                array_append(
                    v_created_ids,
                    v_product_id
                );

        END IF;


        v_count :=
            v_count + 1;

    END LOOP;


    RETURN jsonb_build_object(
        'success', true,
        'count', v_count,
        'created_ids',
        to_jsonb(v_created_ids)
    );

END;

$function$;


-- ============================================================
-- 5. LOCK DOWN BULK RPC
-- ============================================================

REVOKE ALL
ON FUNCTION public.fn_bulk_import_umkm_products(
    UUID,
    JSONB
)
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.fn_bulk_import_umkm_products(
    UUID,
    JSONB
)
TO authenticated;


-- ============================================================
-- 6. STORE -> PRODUCT FOREIGN KEY
-- ============================================================

ALTER TABLE public.umkm_store_products
DROP CONSTRAINT IF EXISTS
    umkm_store_products_store_id_fkey;


ALTER TABLE public.umkm_store_products
ADD CONSTRAINT
    umkm_store_products_store_id_fkey
FOREIGN KEY (store_id)
REFERENCES public.umkm_stores(id)
ON DELETE CASCADE;


-- ============================================================
-- 7. UNIQUE STORE TENANT IDENTITY
-- ============================================================

ALTER TABLE public.umkm_stores
DROP CONSTRAINT IF EXISTS
    umkm_stores_id_org_workspace_key;


ALTER TABLE public.umkm_stores
ADD CONSTRAINT
    umkm_stores_id_org_workspace_key
UNIQUE (
    id,
    organization_id,
    workspace_id
);


-- ============================================================
-- 8. COMPOSITE TENANT FK
--
-- Guarantees:
--
-- product.store_id
-- product.organization_id
-- product.workspace_id
--
-- must correspond to the SAME store tenant context.
-- ============================================================

ALTER TABLE public.umkm_store_products
DROP CONSTRAINT IF EXISTS
    umkm_store_products_store_org_workspace_fkey;


ALTER TABLE public.umkm_store_products
ADD CONSTRAINT
    umkm_store_products_store_org_workspace_fkey
FOREIGN KEY (
    store_id,
    organization_id,
    workspace_id
)
REFERENCES public.umkm_stores (
    id,
    organization_id,
    workspace_id
);


-- ============================================================
-- 9. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS
    idx_umkm_store_products_store_tenant
ON public.umkm_store_products (
    store_id,
    organization_id,
    workspace_id
);


-- ============================================================
-- 10. FINAL FUNCTION SIGNATURE VALIDATION
-- ============================================================

DO $$
DECLARE
    v_create_count INTEGER;
    v_bulk_count INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO v_create_count
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_create_umkm_store_product'
      AND pg_get_function_identity_arguments(p.oid)
          =
          'p_store_id uuid, p_name text, p_sku text, p_category text, p_stock integer, p_sold integer, p_price_idr numeric, p_discount_price_idr numeric, p_weight_gram integer, p_status text, p_description text, p_image_path text, p_cdn_icon_url text, p_organization_id uuid, p_workspace_id uuid';


    SELECT COUNT(*)
    INTO v_bulk_count
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_bulk_import_umkm_products'
      AND pg_get_function_identity_arguments(p.oid)
          =
          'p_store_id uuid, p_products jsonb';


    IF v_create_count <> 1 THEN
        RAISE EXCEPTION
            'FINAL CHECK FAILED: canonical CREATE RPC missing';
    END IF;


    IF v_bulk_count <> 1 THEN
        RAISE EXCEPTION
            'FINAL CHECK FAILED: canonical BULK RPC missing';
    END IF;

END
$$;


COMMIT;