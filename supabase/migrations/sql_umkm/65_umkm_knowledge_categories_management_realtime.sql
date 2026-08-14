-- ============================================================================
-- Migration 65: ZEGA Enterprise UMKM Knowledge Base Categories Management
-- Created: 2026-08-08
-- Description: Creates umkm_knowledge_categories table, defensive column additions,
--              seeds enterprise category catalog, and creates RPC endpoints.
-- ============================================================================

-- 1. Create Knowledge Categories Table
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR(255) NOT NULL DEFAULT 'STORE-DEMO-1283',
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    icon_name VARCHAR(100) DEFAULT 'Folder',
    badge_color VARCHAR(50) DEFAULT 'orange',
    sort_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive Column Additions for pre-existing table schemas
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS store_id VARCHAR(255) NOT NULL DEFAULT 'STORE-DEMO-1283';
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) DEFAULT 'Folder';
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS badge_color VARCHAR(50) DEFAULT 'orange';
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 1;
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Indexes & RLS Policies
CREATE INDEX IF NOT EXISTS idx_umkm_k_categories_store ON public.umkm_knowledge_categories(store_id, sort_order);

ALTER TABLE public.umkm_knowledge_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to knowledge categories" ON public.umkm_knowledge_categories;
CREATE POLICY "Allow full access to knowledge categories" ON public.umkm_knowledge_categories
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Enable Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_categories;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Seed Enterprise Knowledge Categories Catalog
DO $$
DECLARE
    v_s_id TEXT;
    v_store_ids TEXT[] := ARRAY['STORE-DEMO-1283', '11111111-1111-1111-1111-111111111111'];
BEGIN
    FOREACH v_s_id IN ARRAY v_store_ids LOOP
        INSERT INTO public.umkm_knowledge_categories
        (id, store_id, name, slug, description, icon_name, badge_color, sort_order)
        VALUES
        (gen_random_uuid(), v_s_id, 'Prosedur Operasional', 'prosedur-operasional', 'SOP standar pengolahan, packaging, retur, dan layanan pelanggan toko.', 'BookOpen', 'orange', 1),
        (gen_random_uuid(), v_s_id, 'Sales & Kasir POS', 'sales-kasir-pos', 'Tata cara transaksi POS, penerimaan QRIS, dan pencatatan kasir harian.', 'ShoppingBag', 'emerald', 2),
        (gen_random_uuid(), v_s_id, 'Shipping & Logistik', 'shipping-logistik', 'Panduan pengiriman, kurir sameday, resi, dan klaim asuransi gudang.', 'Truck', 'blue', 3),
        (gen_random_uuid(), v_s_id, 'Invoice & Perpajakan', 'invoice-perpajakan', 'Membuat invoice resmi, nota otomatis, dan rekap e-faktur toko.', 'Receipt', 'purple', 4),
        (gen_random_uuid(), v_s_id, 'Marketing & Promosi', 'marketing-promosi', 'Strategi promosi marketplace, copywriting, dan WhatsApp broadcast.', 'Sparkles', 'rose', 5),
        (gen_random_uuid(), v_s_id, 'Produk & Quality Control', 'produk-quality-control', 'Katalog standar mutu, spesifikasi produk, dan kontrol kualitas.', 'ShieldCheck', 'amber', 6)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 5. RPC Function: Create Rich Knowledge Category
CREATE OR REPLACE FUNCTION create_umkm_knowledge_category(
    p_name VARCHAR,
    p_description TEXT DEFAULT '',
    p_icon_name VARCHAR DEFAULT 'Folder',
    p_badge_color VARCHAR DEFAULT 'orange',
    p_sort_order INT DEFAULT 1,
    p_store_id VARCHAR DEFAULT 'STORE-DEMO-1283'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
    v_slug VARCHAR;
BEGIN
    v_slug := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    
    INSERT INTO public.umkm_knowledge_categories
    (id, store_id, name, slug, description, icon_name, badge_color, sort_order, is_active)
    VALUES
    (gen_random_uuid(), p_store_id, p_name, v_slug, p_description, p_icon_name, p_badge_color, p_sort_order, true)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'category_id', v_new_id,
        'name', p_name,
        'slug', v_slug
    );
END;
$$;

-- 6. RPC Function: Get All Knowledge Categories with Live Article Counts
CREATE OR REPLACE FUNCTION get_umkm_knowledge_categories(p_store_id TEXT DEFAULT 'STORE-DEMO-1283')
RETURNS TABLE (
    id UUID,
    store_id VARCHAR,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    icon_name VARCHAR,
    badge_color VARCHAR,
    sort_order INT,
    is_active BOOLEAN,
    count BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.store_id,
        c.name,
        c.slug,
        c.description,
        c.icon_name,
        c.badge_color,
        c.sort_order,
        c.is_active,
        COALESCE((SELECT COUNT(*) FROM public.umkm_knowledge_items i WHERE i.category_name = c.name), 0) AS count,
        c.created_at,
        c.updated_at
    FROM public.umkm_knowledge_categories c
    WHERE (c.store_id::TEXT = p_store_id::TEXT OR c.store_id = 'STORE-DEMO-1283')
      AND c.is_active = true
    ORDER BY c.sort_order ASC, c.name ASC;
END;
$$;

-- 7. RPC Function: Update Knowledge Category
CREATE OR REPLACE FUNCTION update_umkm_knowledge_category(
    p_category_id UUID,
    p_name VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_icon_name VARCHAR DEFAULT NULL,
    p_badge_color VARCHAR DEFAULT NULL,
    p_sort_order INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_knowledge_categories
    SET
        name = COALESCE(p_name, name),
        slug = COALESCE(LOWER(REGEXP_REPLACE(COALESCE(p_name, name), '[^a-zA-Z0-9]+', '-', 'g')), slug),
        description = COALESCE(p_description, description),
        icon_name = COALESCE(p_icon_name, icon_name),
        badge_color = COALESCE(p_badge_color, badge_color),
        sort_order = COALESCE(p_sort_order, sort_order),
        updated_at = NOW()
    WHERE id = p_category_id;

    RETURN jsonb_build_object('success', true, 'category_id', p_category_id);
END;
$$;

-- 8. RPC Function: Delete (Soft Deactivate) Knowledge Category
CREATE OR REPLACE FUNCTION delete_umkm_knowledge_category(p_category_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_knowledge_categories
    SET is_active = false, updated_at = NOW()
    WHERE id = p_category_id;

    RETURN jsonb_build_object('success', true, 'category_id', p_category_id, 'action', 'deactivated');
END;
$$;
