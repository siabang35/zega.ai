-- ============================================================================
-- ZEGA AI PLATFORM — TARGETED PRODUCTION FIX
-- File: 20260821020000_fix_product_creation_rpc_and_type_safety.sql
--
-- FIXES:
-- 1. SQLSTATE 42883 (operator does not exist: uuid = text).
-- 2. PostgREST RPC 404 on fn_create_umkm_store_product.
-- 3. Stale PostgreSQL function overloads in pg_proc.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. ENSURE REQUIRED COLUMNS EXIST ON umkm_store_products
--    (organization_id, workspace_id may not exist if only migration 34 ran)
-- ============================================================================

ALTER TABLE public.umkm_store_products ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.umkm_store_products ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE public.umkm_store_products ADD COLUMN IF NOT EXISTS discount_price_idr NUMERIC(15,2);
ALTER TABLE public.umkm_store_products ADD COLUMN IF NOT EXISTS weight_gram INTEGER DEFAULT 250;
ALTER TABLE public.umkm_store_products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Also ensure umkm_store_categories has required tenant columns
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS store_id TEXT;
ALTER TABLE public.umkm_store_categories ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#10b981';


-- ============================================================================
-- 1. PURGE ALL OLD TRIGGERS ON public.umkm_store_products
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_fill_store_product_tenant_boundary ON public.umkm_store_products;
DROP TRIGGER IF EXISTS trg_umkm_store_category_count_sync ON public.umkm_store_products;
DROP TRIGGER IF EXISTS trg_umkm_store_products_tenant_boundary ON public.umkm_store_products;
DROP TRIGGER IF EXISTS trg_auto_fill_tenant_boundary ON public.umkm_store_products;


-- ============================================================================
-- 2. PURGE ALL STALE FUNCTION OVERLOADS FROM pg_proc VIA DYNAMIC CASCADE
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Purge all overloads of fn_is_org_member
    FOR r IN (
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'fn_is_org_member'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;

    -- Purge all overloads of fn_create_umkm_store_product
    FOR r IN (
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'fn_create_umkm_store_product'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;

    -- Purge all overloads of fn_trg_auto_fill_store_product_tenant_boundary
    FOR r IN (
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'fn_trg_auto_fill_store_product_tenant_boundary'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;

    -- Purge all overloads of fn_sync_umkm_category_product_count
    FOR r IN (
        SELECT p.oid::regprocedure AS sig
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'fn_sync_umkm_category_product_count'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;
END;
$$;


-- ============================================================================
-- 3. RECREATE CANONICAL fn_is_org_member USING EXACT UUID TYPES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_app_user_id UUID;
BEGIN
    IF auth.uid() IS NULL OR p_org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    BEGIN
        v_app_user_id := public.fn_current_app_user_id();
    EXCEPTION WHEN OTHERS THEN
        v_app_user_id := NULL;
    END;

    IF v_app_user_id IS NULL THEN
        SELECT id INTO v_app_user_id
        FROM public.users
        WHERE auth_user_id = auth.uid() AND status = 'active'
        LIMIT 1;
    END IF;

    IF v_app_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = p_org_id
          AND user_id = v_app_user_id
          AND COALESCE(status, 'active') = 'active'
    ) OR EXISTS (
        SELECT 1
        FROM public.umkm_stores
        WHERE organization_id = p_org_id
          AND user_id = v_app_user_id
    );
END;
$$;


-- ============================================================================
-- 4. RECREATE BEFORE INSERT/UPDATE TRIGGER ON public.umkm_store_products
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_trg_auto_fill_store_product_tenant_boundary()
RETURNS TRIGGER AS $$
DECLARE
    v_store_org_id UUID;
    v_store_ws_id UUID;
    v_header_text TEXT;
    v_header_org_id UUID;
    v_user_org_id UUID;
    v_app_user_id UUID;
    v_store_str TEXT;
    v_store_uuid UUID;
BEGIN
    -- Cast store_id to text explicitly (column is TEXT, but be safe)
    v_store_str := NULLIF(BTRIM(NEW.store_id::TEXT), '');

    -- A. Resolve organization_id and workspace_id from umkm_stores using exact schema types
    IF v_store_str IS NOT NULL THEN
        -- First try: treat as UUID if it matches UUID pattern
        IF v_store_str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            BEGIN
                v_store_uuid := v_store_str::UUID;
                SELECT s.organization_id, s.workspace_id
                INTO v_store_org_id, v_store_ws_id
                FROM public.umkm_stores AS s
                WHERE s.id = v_store_uuid
                LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
                v_store_uuid := NULL;
            END;
        END IF;

        -- Second try: match by store_id_code (TEXT = TEXT, no cast needed)
        IF v_store_org_id IS NULL THEN
            SELECT s.organization_id, s.workspace_id
            INTO v_store_org_id, v_store_ws_id
            FROM public.umkm_stores AS s
            WHERE s.store_id_code = v_store_str
            LIMIT 1;
        END IF;

        IF v_store_org_id IS NOT NULL THEN
            NEW.organization_id := v_store_org_id;
            IF v_store_ws_id IS NOT NULL THEN
                NEW.workspace_id := v_store_ws_id;
            END IF;
        END IF;
    END IF;

    -- B. If organization_id is missing, check PostgREST header x-organization-id
    IF NEW.organization_id IS NULL THEN
        BEGIN
            v_header_text := NULLIF(current_setting('request.headers', true)::json->>'x-organization-id', '');
            IF v_header_text IS NOT NULL AND v_header_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_header_org_id := v_header_text::UUID;
                IF EXISTS (SELECT 1 FROM public.organizations WHERE id = v_header_org_id) THEN
                    NEW.organization_id := v_header_org_id;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- C. If organization_id is still missing, resolve from canonical user membership
    IF NEW.organization_id IS NULL THEN
        BEGIN
            v_app_user_id := public.fn_current_app_user_id();
            IF v_app_user_id IS NOT NULL THEN
                SELECT om.organization_id INTO v_user_org_id
                FROM public.organization_members AS om
                WHERE om.user_id = v_app_user_id
                  AND COALESCE(om.status, 'active') = 'active'
                ORDER BY om.created_at DESC
                LIMIT 1;

                IF v_user_org_id IS NOT NULL THEN
                    NEW.organization_id := v_user_org_id;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- D. Zero-Trust Boundary Guard: Fail-Closed if organization_id is missing
    IF NEW.organization_id IS NULL THEN
        RAISE EXCEPTION 'TENANT_BOUNDARY_VIOLATION: Cannot process store product without a valid verified organization ID.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

CREATE TRIGGER trg_auto_fill_store_product_tenant_boundary
    BEFORE INSERT OR UPDATE ON public.umkm_store_products
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_auto_fill_store_product_tenant_boundary();


-- ============================================================================
-- 5. RECREATE AFTER INSERT/UPDATE TRIGGER ON public.umkm_store_products
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_sync_umkm_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.category IS NOT NULL AND BTRIM(NEW.category) <> '' THEN
            INSERT INTO public.umkm_store_categories (
                name, slug, product_count, organization_id, workspace_id, store_id
            )
            VALUES (
                BTRIM(NEW.category),
                LOWER(REPLACE(BTRIM(NEW.category), ' ', '-')),
                1,
                NEW.organization_id,
                NEW.workspace_id,
                NEW.store_id
            )
            ON CONFLICT (name) DO UPDATE SET 
                product_count = (
                    SELECT COUNT(*)
                    FROM public.umkm_store_products
                    WHERE category = EXCLUDED.name
                );
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.category IS NOT NULL THEN
            UPDATE public.umkm_store_categories 
            SET product_count = (
                SELECT COUNT(*)
                FROM public.umkm_store_products
                WHERE category = OLD.category
            )
            WHERE name = OLD.category;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

CREATE TRIGGER trg_umkm_store_category_count_sync
    AFTER INSERT OR UPDATE OR DELETE ON public.umkm_store_products
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_umkm_category_product_count();


-- ============================================================================
-- 6. CREATE CANONICAL HARDENED fn_create_umkm_store_product RPC
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
    v_app_user_id UUID;
    v_org_id UUID;
    v_workspace_id UUID;
    v_store_uuid UUID;
    v_clean_store_id TEXT;
    v_new_id UUID;
    v_result JSONB;
BEGIN
    -- A. REQUIRE AUTHENTICATED PRINCIPAL
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'
            USING ERRCODE = '42501';
    END IF;

    -- B. RESOLVE CANONICAL APPLICATION USER ID
    -- auth.uid() (auth.users.id) -> users.auth_user_id -> users.id (UUID)
    BEGIN
        v_app_user_id := public.fn_current_app_user_id();
    EXCEPTION WHEN OTHERS THEN
        v_app_user_id := NULL;
    END;

    IF v_app_user_id IS NULL THEN
        SELECT id INTO v_app_user_id
        FROM public.users
        WHERE auth_user_id = auth.uid() AND status = 'active'
        LIMIT 1;
    END IF;

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION 'APPLICATION_USER_NOT_FOUND'
            USING ERRCODE = '42501';
    END IF;

    -- C. VALIDATE STORE INPUT
    v_clean_store_id := NULLIF(BTRIM(p_store_id), '');

    IF v_clean_store_id IS NULL THEN
        RAISE EXCEPTION 'STORE_ID_REQUIRED'
            USING ERRCODE = '22023';
    END IF;

    -- D. RESOLVE AUTHORITATIVE STORE TENANT CONTEXT
    -- Store record in public.umkm_stores is authoritative.
    IF v_clean_store_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_store_uuid := v_clean_store_id::UUID;
        SELECT organization_id, workspace_id
        INTO v_org_id, v_workspace_id
        FROM public.umkm_stores
        WHERE id = v_store_uuid
        LIMIT 1;
    END IF;

    IF v_org_id IS NULL THEN
        SELECT organization_id, workspace_id
        INTO v_org_id, v_workspace_id
        FROM public.umkm_stores
        WHERE store_id_code = v_clean_store_id
        LIMIT 1;
    END IF;

    -- Fallback: Check if store belongs directly to the user
    IF v_org_id IS NULL THEN
        SELECT organization_id, workspace_id
        INTO v_org_id, v_workspace_id
        FROM public.umkm_stores
        WHERE user_id = v_app_user_id
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND_OR_INVALID_TENANT'
            USING ERRCODE = '42501';
    END IF;

    -- E. VERIFY AUTHORITATIVE ORGANIZATION MEMBERSHIP
    -- organization_members.user_id (UUID) = v_app_user_id (UUID)
    IF NOT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = v_org_id
          AND user_id = v_app_user_id
          AND COALESCE(status, 'active') = 'active'
    ) AND NOT EXISTS (
        SELECT 1
        FROM public.umkm_stores
        WHERE organization_id = v_org_id
          AND user_id = v_app_user_id
    ) THEN
        RAISE EXCEPTION 'ORGANIZATION_ACCESS_DENIED'
            USING ERRCODE = '42501';
    END IF;

    -- F. VALIDATE CLIENT-PROVIDED TENANT HINTS (IF SUPPLIED)
    IF p_organization_id IS NOT NULL AND p_organization_id <> v_org_id THEN
        RAISE EXCEPTION 'ORGANIZATION_TENANT_MISMATCH'
            USING ERRCODE = '42501';
    END IF;

    IF p_workspace_id IS NOT NULL AND v_workspace_id IS NOT NULL AND p_workspace_id <> v_workspace_id THEN
        RAISE EXCEPTION 'WORKSPACE_TENANT_MISMATCH'
            USING ERRCODE = '42501';
    END IF;

    -- G. PRODUCT PAYLOAD VALIDATION
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

    IF p_discount_price_idr IS NOT NULL AND p_discount_price_idr < 0 THEN
        RAISE EXCEPTION 'INVALID_DISCOUNT_PRICE'
            USING ERRCODE = '22023';
    END IF;

    IF COALESCE(p_weight_gram, 0) < 0 THEN
        RAISE EXCEPTION 'INVALID_WEIGHT'
            USING ERRCODE = '22023';
    END IF;

    -- H. ATOMIC INSERT WITH EXACT DB COLUMN TYPES
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
    ) VALUES (
        v_new_id,
        v_clean_store_id,
        v_org_id,
        v_workspace_id,
        BTRIM(p_name),
        COALESCE(NULLIF(BTRIM(p_sku), ''), 'SKU-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))),
        COALESCE(NULLIF(BTRIM(p_category), ''), 'Lainnya'),
        COALESCE(p_stock, 0),
        COALESCE(p_sold, 0),
        COALESCE(p_price_idr, 0.00),
        p_discount_price_idr,
        COALESCE(p_weight_gram, 250),
        COALESCE(NULLIF(BTRIM(p_status), ''), 'Aktif'),
        COALESCE(p_description, ''),
        COALESCE(p_image_path, ''),
        COALESCE(p_cdn_icon_url, ''),
        NOW(),
        NOW()
    );

    -- I. RETURN CREATED PRODUCT RECORD AS JSONB
    SELECT TO_JSONB(p)
    INTO v_result
    FROM public.umkm_store_products AS p
    WHERE p.id = v_new_id;

    RETURN v_result;
END;
$$;


-- ============================================================================
-- 7. REPAIR RLS POLICY ON public.umkm_store_products
-- ============================================================================

ALTER TABLE public.umkm_store_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "umkm_store_products_authenticated_all" ON public.umkm_store_products;

CREATE POLICY "umkm_store_products_authenticated_all"
ON public.umkm_store_products
FOR ALL
TO authenticated, service_role
USING (
    organization_id IS NULL OR
    public.fn_is_org_member(organization_id)
)
WITH CHECK (
    organization_id IS NULL OR
    public.fn_is_org_member(organization_id)
);


-- ============================================================================
-- 8. HARDEN EXECUTION PRIVILEGES — ZERO ANON PERMISSION
-- ============================================================================

REVOKE ALL
ON FUNCTION public.fn_create_umkm_store_product(
    TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID, UUID
)
FROM PUBLIC;

REVOKE EXECUTE
ON FUNCTION public.fn_create_umkm_store_product(
    TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID, UUID
)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.fn_create_umkm_store_product(
    TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID, UUID
)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.fn_create_umkm_store_product(
    TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID, UUID
)
TO service_role;


-- ============================================================================
-- 9. RELOAD POSTGREST SCHEMA CACHE
-- ============================================================================

NOTIFY pgrst, 'reload schema';

COMMIT;
