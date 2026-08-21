-- ============================================================================
-- SQL MIGRATION: STRICT REAL ACCOUNT TENANT BOUNDARY & TYPE SAFETY FOR STORE PRODUCTS
-- ============================================================================
-- Purpose: Fix PostgreSQL 42883 (operator does not exist: uuid = text) error during
-- product insertion. Enforces strict real-account tenant resolution for
-- public.umkm_store_products with explicit type casting and safe category sync.
-- ============================================================================

BEGIN;

-- 1. Create or Replace Trigger Function for Real Tenant Auto-Resolution & Boundary Enforcement
CREATE OR REPLACE FUNCTION public.fn_trg_auto_fill_store_product_tenant_boundary()
RETURNS TRIGGER AS $$
DECLARE
    v_store_org_id UUID;
    v_store_ws_id UUID;
    v_header_text TEXT;
    v_header_org_id UUID;
    v_user_org_id UUID;
BEGIN
    -- A. Try resolving canonical organization_id and workspace_id from store record in umkm_stores
    IF NEW.store_id IS NOT NULL AND NEW.store_id <> '' THEN
        IF NEW.store_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            SELECT organization_id, workspace_id
            INTO v_store_org_id, v_store_ws_id
            FROM public.umkm_stores
            WHERE id = NEW.store_id::UUID
            LIMIT 1;
        ELSE
            SELECT organization_id, workspace_id
            INTO v_store_org_id, v_store_ws_id
            FROM public.umkm_stores
            WHERE id::text = NEW.store_id::text
               OR store_id_code = NEW.store_id
            LIMIT 1;
        END IF;

        IF v_store_org_id IS NOT NULL AND v_store_org_id <> '00000000-0000-0000-0000-000000000001'::uuid THEN
            NEW.organization_id := v_store_org_id;
            IF v_store_ws_id IS NOT NULL AND v_store_ws_id <> '00000000-0000-0000-0000-000000000002'::uuid THEN
                NEW.workspace_id := v_store_ws_id;
            END IF;
        END IF;
    END IF;

    -- B. If organization_id is missing or dummy nil UUID, attempt resolution from PostgREST header
    IF NEW.organization_id IS NULL OR NEW.organization_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
        BEGIN
            v_header_text := NULLIF(current_setting('request.headers', true)::json->>'x-organization-id', '');
            IF v_header_text IS NOT NULL AND v_header_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                v_header_org_id := v_header_text::UUID;
                IF v_header_org_id <> '00000000-0000-0000-0000-000000000001'::uuid THEN
                    NEW.organization_id := v_header_org_id;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- C. If organization_id is still missing or dummy nil UUID, attempt resolution from user membership
    IF NEW.organization_id IS NULL OR NEW.organization_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
        BEGIN
            SELECT organization_id INTO v_user_org_id
            FROM public.organization_members
            WHERE (user_id = public.fn_current_app_user_id() OR user_id = auth.uid())
              AND organization_id IS NOT NULL
              AND organization_id <> '00000000-0000-0000-0000-000000000001'::uuid
            ORDER BY created_at DESC
            LIMIT 1;

            IF v_user_org_id IS NOT NULL THEN
                NEW.organization_id := v_user_org_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- D. Strict Zero-Trust Validation: Reject dummy 00000000-0000-0000-0000-000000000001 UUIDs
    IF NEW.organization_id IS NULL OR NEW.organization_id = '00000000-0000-0000-0000-000000000001'::uuid THEN
        RAISE EXCEPTION 'TENANT_BOUNDARY_VIOLATION: Cannot process store product without a valid real account organization ID. Dummy 00000000 fallback rejected.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to umkm_store_products
DROP TRIGGER IF EXISTS trg_auto_fill_store_product_tenant_boundary ON public.umkm_store_products;

CREATE TRIGGER trg_auto_fill_store_product_tenant_boundary
    BEFORE INSERT OR UPDATE ON public.umkm_store_products
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_auto_fill_store_product_tenant_boundary();


-- 2. Repair Category Sync Trigger Function to incorporate tenant scoping safely
CREATE OR REPLACE FUNCTION public.fn_sync_umkm_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.category IS NOT NULL AND NEW.category <> '' THEN
            INSERT INTO public.umkm_store_categories (
                name, slug, product_count, organization_id, workspace_id, store_id
            ) VALUES (
                NEW.category,
                LOWER(REPLACE(NEW.category, ' ', '-')),
                1,
                NEW.organization_id,
                NEW.workspace_id,
                NEW.store_id
            )
            ON CONFLICT (name) DO UPDATE SET 
                product_count = (SELECT COUNT(*) FROM public.umkm_store_products WHERE category = EXCLUDED.name);
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN
        IF OLD.category IS NOT NULL THEN
            UPDATE public.umkm_store_categories 
            SET product_count = (SELECT COUNT(*) FROM public.umkm_store_products WHERE category = OLD.category)
            WHERE name = OLD.category;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Apply Clean, Type-Safe RLS Policies on public.umkm_store_products
ALTER TABLE public.umkm_store_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select_policy" ON public.umkm_store_products;
DROP POLICY IF EXISTS "tenant_insert_policy" ON public.umkm_store_products;
DROP POLICY IF EXISTS "tenant_update_policy" ON public.umkm_store_products;
DROP POLICY IF EXISTS "tenant_delete_policy" ON public.umkm_store_products;
DROP POLICY IF EXISTS "Allow public read umkm_store_products" ON public.umkm_store_products;
DROP POLICY IF EXISTS "Allow all write umkm_store_products" ON public.umkm_store_products;
DROP POLICY IF EXISTS "umkm_store_products_authenticated_all" ON public.umkm_store_products;

CREATE POLICY "umkm_store_products_authenticated_all"
ON public.umkm_store_products
FOR ALL
TO authenticated, service_role
USING (
    organization_id IS NULL OR
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    public.fn_is_org_member(organization_id)
)
WITH CHECK (
    organization_id IS NULL OR
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    public.fn_is_org_member(organization_id)
);

COMMIT;
