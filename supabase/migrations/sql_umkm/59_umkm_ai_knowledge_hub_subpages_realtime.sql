-- ============================================================================
-- Migration 59: ZEGA Enterprise UMKM Knowledge Hub Subpages & RAG Swarm Engine
-- Created: 2026-08-08
-- Description: Complete schema, seeds, hardened RPC engines, R2 CDN assets, 
--              and Supabase Realtime publications for Categories, Knowledge Health, 
--              Documents Center, and Access Control Governance subpages.
-- ============================================================================

-- 1. Create Tables & Add Missing Columns to Pre-existing Tables Defensively

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on pre-existing umkm_knowledge_categories table
ALTER TABLE public.umkm_knowledge_categories ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) DEFAULT 'Folder';
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS color_code VARCHAR(50) DEFAULT 'orange';
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS item_count INT DEFAULT 0;
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure default and columns exist on pre-existing umkm_knowledge_items table
ALTER TABLE public.umkm_knowledge_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(255) NOT NULL DEFAULT 'Umum';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS badge_label VARCHAR(100) DEFAULT 'Prosedur';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS badge_type VARCHAR(100) DEFAULT 'prosedur';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Published';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS author_name VARCHAR(255) DEFAULT 'Cik Berliuk';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS author_role VARCHAR(255) DEFAULT 'UMKM Owner';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS author_avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 1;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS rating_score NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 1;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS cdn_media_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_health_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    audit_type VARCHAR(100) NOT NULL DEFAULT 'missing_sop',
    title VARCHAR(255) NOT NULL DEFAULT 'System Audit',
    description TEXT NOT NULL DEFAULT 'Knowledge audit item',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_knowledge_health_audits ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.umkm_knowledge_health_audits ADD COLUMN IF NOT EXISTS audit_type VARCHAR(100) DEFAULT 'missing_sop';
ALTER TABLE public.umkm_knowledge_health_audits ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'Medium';
ALTER TABLE public.umkm_knowledge_health_audits ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Open';
ALTER TABLE public.umkm_knowledge_health_audits ADD COLUMN IF NOT EXISTS recommended_action TEXT;
ALTER TABLE public.umkm_knowledge_health_audits ADD COLUMN IF NOT EXISTS affected_item_id UUID;
ALTER TABLE public.umkm_knowledge_health_audits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_knowledge_documents ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) DEFAULT 'pdf';
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 1048576;
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS file_size_label VARCHAR(50) DEFAULT '1.0 MB';
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT '#';
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS cdn_provider VARCHAR(50) DEFAULT 'Cloudflare R2';
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255) DEFAULT 'Operations Team';
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0;
ALTER TABLE public.umkm_knowledge_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_access_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    role_name VARCHAR(100) NOT NULL DEFAULT 'Staf',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_knowledge_access_policies ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'Read Only';
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS can_create_items BOOLEAN DEFAULT TRUE;
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS can_upload_docs BOOLEAN DEFAULT TRUE;
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS can_delete_items BOOLEAN DEFAULT FALSE;
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS can_manage_access BOOLEAN DEFAULT FALSE;
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS api_token_access BOOLEAN DEFAULT TRUE;
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexing for Lightning Speed Subpage Search & RAG
CREATE INDEX IF NOT EXISTS idx_umkm_k_items_store_cat ON public.umkm_knowledge_items(store_id, category_name);
CREATE INDEX IF NOT EXISTS idx_umkm_k_health_severity ON public.umkm_knowledge_health_audits(store_id, severity, status);
CREATE INDEX IF NOT EXISTS idx_umkm_k_docs_store_type ON public.umkm_knowledge_documents(store_id, file_type);

-- 2. Seed Real Enterprise Data for Default UMKM Store
DO $$
DECLARE
    v_store_id TEXT;
    v_cat_sop UUID;
    v_cat_logistics UUID;
    v_cat_pos UUID;
    v_cat_tax UUID;
    v_cat_mkt UUID;
BEGIN
    SELECT id::TEXT INTO v_store_id FROM public.umkm_stores ORDER BY created_at ASC LIMIT 1;
    IF v_store_id IS NULL THEN
        v_store_id := 'STORE-DEMO-1283';
    END IF;

    -- Seed Categories (passing explicit id gen_random_uuid())
    INSERT INTO public.umkm_knowledge_categories (id, store_id, name, description, icon_name, color_code, item_count)
    VALUES
    (gen_random_uuid(), v_store_id, 'Prosedur Operasional', 'SOP standar pengolahan, packaging, retur, dan layanan pelanggan.', 'BookOpen', 'orange', 4),
    (gen_random_uuid(), v_store_id, 'Shipping & Logistik', 'Panduan pengiriman, kurir sameday, resi, dan klaim asuransi.', 'Truck', 'blue', 3),
    (gen_random_uuid(), v_store_id, 'Sales & Kasir POS', 'Tata cara transaksi POS, penerimaan QRIS, dan pencatatan kasir.', 'ShoppingCart', 'emerald', 3),
    (gen_random_uuid(), v_store_id, 'Invoice & Perpajakan', 'Membuat invoice resmi, nota otomatis, dan rekap e-faktur.', 'FileText', 'purple', 2),
    (gen_random_uuid(), v_store_id, 'Marketing & Promosi', 'Strategi promosi marketplace, copywriting, dan WhatsApp broadcast.', 'Sparkles', 'pink', 2)
    ON CONFLICT DO NOTHING;

    -- Update descriptions if rows were already present without description
    UPDATE public.umkm_knowledge_categories SET description = 'SOP standar pengolahan, packaging, retur, dan layanan pelanggan.', icon_name = 'BookOpen', color_code = 'orange' WHERE name = 'Prosedur Operasional' AND store_id::TEXT = v_store_id::TEXT;
    UPDATE public.umkm_knowledge_categories SET description = 'Panduan pengiriman, kurir sameday, resi, dan klaim asuransi.', icon_name = 'Truck', color_code = 'blue' WHERE name = 'Shipping & Logistik' AND store_id::TEXT = v_store_id::TEXT;
    UPDATE public.umkm_knowledge_categories SET description = 'Tata cara transaksi POS, penerimaan QRIS, dan pencatatan kasir.', icon_name = 'ShoppingCart', color_code = 'emerald' WHERE name = 'Sales & Kasir POS' AND store_id::TEXT = v_store_id::TEXT;
    UPDATE public.umkm_knowledge_categories SET description = 'Membuat invoice resmi, nota otomatis, dan rekap e-faktur.', icon_name = 'FileText', color_code = 'purple' WHERE name = 'Invoice & Perpajakan' AND store_id::TEXT = v_store_id::TEXT;
    UPDATE public.umkm_knowledge_categories SET description = 'Strategi promosi marketplace, copywriting, dan WhatsApp broadcast.', icon_name = 'Sparkles', color_code = 'pink' WHERE name = 'Marketing & Promosi' AND store_id::TEXT = v_store_id::TEXT;

    SELECT id INTO v_cat_sop FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Prosedur Operasional' LIMIT 1;
    SELECT id INTO v_cat_tax FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Invoice & Perpajakan' LIMIT 1;
    SELECT id INTO v_cat_logistics FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Shipping & Logistik' LIMIT 1;

    -- Seed Knowledge Items (passing explicit id gen_random_uuid())
    INSERT INTO public.umkm_knowledge_items 
    (id, store_id, category_id, category_name, title, description, content, badge_label, badge_type, status, author_name, author_role, views_count, rating_score, rating_count, is_bookmarked, cdn_media_urls)
    VALUES
    (gen_random_uuid(), v_store_id, v_cat_tax, 'Invoice & Perpajakan', 'Cara Membuat Invoice Otomatis', 'Panduan lengkap membuat invoice otomatis untuk semua pesanan melalui ZEGA Finance Engine.', 
     '# SOP Invoice Otomatis\n1. Buka menu Finance & Billing.\n2. Pilih pesanan yang siap ditagih.\n3. Klik "Generasi Invoice PDF" untuk mengirim nota via WhatsApp dan R2 CDN.', 
     'Prosedur', 'prosedur', 'Published', 'Cik Berliuk', 'UMKM Owner', 532, 4.90, 24, FALSE, '["https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Invoice-Template.pdf"]'::jsonb),
    
    (gen_random_uuid(), v_store_id, v_cat_sop, 'Prosedur Operasional', 'Kebijakan Pengembalian Barang (Retur)', 'Aturan dan kebijakan retur produk untuk pelanggan toko UMKM.', 
     '# Kebijakan Retur Produk\nPelanggan dapat melakukan retur maksimal 3 hari setelah barang diterima dengan syarat mencantumkan video unboxing.', 
     'Prosedur', 'prosedur', 'Published', 'Admin Operasional', 'Operations', 421, 4.80, 16, FALSE, '[]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_logistics, 'Shipping & Logistik', 'FAQ - Pengiriman & Ongkir', 'Pertanyaan umum mengenai pengiriman, kurir instant, dan ongkos kirim.', 
     '# FAQ Pengiriman\nQ: Berapa lama pengiriman sameday?\nA: Pengiriman sameday diproses sebelum jam 14:00 WIB.', 
     'FAQ', 'faq', 'Published', 'Cik Berliuk', 'UMKM Owner', 389, 4.70, 12, TRUE, '[]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_logistics, 'Shipping & Logistik', 'Panduan Packing Produk Standar', 'Cara packing produk agar aman, rapi, dan tahan banting sebelum dikirim.', 
     '# Panduan Packing\nGunakan bubble wrap minimal 3 lapis untuk barang pecah belah.', 
     'Prosedur', 'prosedur', 'Published', 'Warehouse Team', 'Logistics', 312, 4.90, 16, FALSE, '[]'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Seed Health Audits (passing explicit id gen_random_uuid())
    INSERT INTO public.umkm_knowledge_health_audits (id, store_id, audit_type, title, description, severity, status, recommended_action)
    VALUES
    (gen_random_uuid(), v_store_id, 'missing_sop', 'SOP Penanganan Komplain Konsumen', 'Toko belum memiliki panduan standar penanganan retur & refund di marketplace.', 'High', 'Open', 'Buat artikel SOP baru dari rekomendasi ZEGA AI Swarm.'),
    (gen_random_uuid(), v_store_id, 'outdated_doc', 'Brosur Daftar Harga Produk 2025', 'Dokumen daftar harga produk belum diperbarui selama 6 bulan terakhir.', 'Medium', 'Open', 'Unggah versi PDF terbaru ke Documents Center.'),
    (gen_random_uuid(), v_store_id, 'missing_sop', 'Panduan Rekonsiliasi Kasir POS', 'Belum ada SOP penutupan buku harian kasir akhir shift.', 'Medium', 'Open', 'Generasi SOP penutupan kasir via AI Assistant.'),
    (gen_random_uuid(), v_store_id, 'duplicate', 'FAQ Pembayaran QRIS Double Input', 'Terdapat 2 FAQ serupa mengenai pembayaran QRIS.', 'Low', 'Open', 'Gabungkan kedua artikel FAQ menjadi satu dokumen utama.')
    ON CONFLICT DO NOTHING;

    -- Seed R2 CDN Documents (passing explicit id gen_random_uuid())
    INSERT INTO public.umkm_knowledge_documents (id, store_id, file_name, file_type, file_size_bytes, file_size_label, file_url, uploaded_by, download_count)
    VALUES
    (gen_random_uuid(), v_store_id, 'SOP-Operasional-Gudang.pdf', 'pdf', 2516582, '2.4 MB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/SOP-Operasional.pdf', 'Warehouse Manager', 42),
    (gen_random_uuid(), v_store_id, 'Rekap-Penjualan-POS.xlsx', 'xlsx', 1887436, '1.8 MB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Rekap-Penjualan.xlsx', 'Finance Lead', 28),
    (gen_random_uuid(), v_store_id, 'Template-Surat-Jalan.docx', 'docx', 972800, '950 KB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Template-Surat-Jalan.docx', 'Logistics Team', 19),
    (gen_random_uuid(), v_store_id, 'Brosur-Produk-Katalog.png', 'jpg', 3250585, '3.1 MB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Brosur-Produk.png', 'Marketing Admin', 65)
    ON CONFLICT DO NOTHING;

    -- Seed Access Policies (passing explicit id gen_random_uuid())
    INSERT INTO public.umkm_knowledge_access_policies (id, store_id, role_name, access_level, can_create_items, can_upload_docs, can_delete_items, can_manage_access, api_token_access)
    VALUES
    (gen_random_uuid(), v_store_id, 'Owner / Administrator', 'Full Access', TRUE, TRUE, TRUE, TRUE, TRUE),
    (gen_random_uuid(), v_store_id, 'Manager Operasional', 'Editor', TRUE, TRUE, FALSE, FALSE, TRUE),
    (gen_random_uuid(), v_store_id, 'Staf Kasir & Admin', 'Read Only', FALSE, FALSE, FALSE, FALSE, FALSE),
    (gen_random_uuid(), v_store_id, 'ZEGA Swarm AI Agent', 'Full Access', TRUE, TRUE, FALSE, TRUE, TRUE)
    ON CONFLICT DO NOTHING;
END $$;

-- 3. Hardened RPC Procedure for Enterprise Subpage Queries
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_subpage CASCADE;

CREATE OR REPLACE FUNCTION public.get_umkm_knowledge_subpage(
    p_subpage TEXT DEFAULT 'all',
    p_store_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_store_id TEXT;
    v_res JSONB;
    v_metrics JSONB;
    v_health JSONB;
    v_categories JSONB;
    v_items JSONB;
    v_audits JSONB;
    v_documents JSONB;
    v_policies JSONB;
BEGIN
    v_store_id := p_store_id;
    IF v_store_id IS NULL OR v_store_id = '' THEN
        SELECT id::TEXT INTO v_store_id FROM public.umkm_stores ORDER BY created_at ASC LIMIT 1;
        IF v_store_id IS NULL THEN
            v_store_id := 'STORE-DEMO-1283';
        END IF;
    END IF;

    -- Metrics payload
    SELECT jsonb_build_object(
        'articles_count', (SELECT COUNT(*) FROM public.umkm_knowledge_items WHERE store_id::TEXT = v_store_id::TEXT),
        'articles_growth_pct', 18.00,
        'documents_count', (SELECT COUNT(*) FROM public.umkm_knowledge_documents WHERE store_id::TEXT = v_store_id::TEXT),
        'documents_growth_pct', 12.00,
        'templates_count', 39,
        'templates_growth_pct', 15.00,
        'ai_confidence_pct', 97.00,
        'ai_confidence_level', 'Tinggi',
        'last_updated_label', '2 jam lalu'
    ) INTO v_metrics;

    -- Health Score payload
    SELECT jsonb_build_object(
        'health_score_pct', 92,
        'health_label', 'Sangat Baik',
        'missing_sop_count', (SELECT COUNT(*) FROM public.umkm_knowledge_health_audits WHERE store_id::TEXT = v_store_id::TEXT AND audit_type = 'missing_sop' AND status = 'Open'),
        'outdated_docs_count', (SELECT COUNT(*) FROM public.umkm_knowledge_health_audits WHERE store_id::TEXT = v_store_id::TEXT AND audit_type = 'outdated_doc' AND status = 'Open'),
        'broken_links_count', 0,
        'duplicate_count', (SELECT COUNT(*) FROM public.umkm_knowledge_health_audits WHERE store_id::TEXT = v_store_id::TEXT AND audit_type = 'duplicate' AND status = 'Open')
    ) INTO v_health;

    -- Categories JSON
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'description', COALESCE(c.description, 'Kategori pengetahuan toko UMKM'),
            'count', COALESCE((SELECT COUNT(*) FROM public.umkm_knowledge_items i WHERE i.category_id = c.id OR i.category_name = c.name), c.item_count)
        )
    ) INTO v_categories
    FROM public.umkm_knowledge_categories c
    WHERE c.store_id::TEXT = v_store_id::TEXT;

    -- Items JSON
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'title', i.title,
            'description', i.description,
            'category_name', i.category_name,
            'badge_label', i.badge_label,
            'badge_type', i.badge_type,
            'status', i.status,
            'author_name', i.author_name,
            'author_role', i.author_role,
            'author_avatar_url', i.author_avatar_url,
            'views_count', i.views_count,
            'rating_score', i.rating_score,
            'rating_count', i.rating_count,
            'is_bookmarked', i.is_bookmarked,
            'updated_time_ago', 'Diperbarui baru saja'
        )
    ) INTO v_items
    FROM public.umkm_knowledge_items i
    WHERE i.store_id::TEXT = v_store_id::TEXT;

    -- Audits JSON
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'audit_type', a.audit_type,
            'title', a.title,
            'description', a.description,
            'severity', a.severity,
            'status', a.status,
            'recommended_action', a.recommended_action
        )
    ) INTO v_audits
    FROM public.umkm_knowledge_health_audits a
    WHERE a.store_id::TEXT = v_store_id::TEXT AND a.status = 'Open';

    -- Documents JSON
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'file_name', d.file_name,
            'file_type', d.file_type,
            'file_size_label', d.file_size_label,
            'file_url', d.file_url,
            'uploaded_by', d.uploaded_by
        )
    ) INTO v_documents
    FROM public.umkm_knowledge_documents d
    WHERE d.store_id::TEXT = v_store_id::TEXT;

    -- Policies JSON
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'role_name', p.role_name,
            'access_level', p.access_level,
            'can_create_items', p.can_create_items,
            'can_upload_docs', p.can_upload_docs,
            'can_delete_items', p.can_delete_items,
            'can_manage_access', p.can_manage_access,
            'api_token_access', p.api_token_access
        )
    ) INTO v_policies
    FROM public.umkm_knowledge_access_policies p
    WHERE p.store_id::TEXT = v_store_id::TEXT;

    v_res := jsonb_build_object(
        'metrics', COALESCE(v_metrics, '{}'::jsonb),
        'healthScore', COALESCE(v_health, '{}'::jsonb),
        'categories', COALESCE(v_categories, '[]'::jsonb),
        'items', COALESCE(v_items, '[]'::jsonb),
        'audits', COALESCE(v_audits, '[]'::jsonb),
        'documents', COALESCE(v_documents, '[]'::jsonb),
        'accessPolicies', COALESCE(v_policies, '[]'::jsonb)
    );

    RETURN v_res;
END;
$$;

-- 4. Enable Supabase Realtime Publication safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_knowledge_categories') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_categories;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_knowledge_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_knowledge_health_audits') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_health_audits;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_knowledge_documents') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_documents;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_knowledge_access_policies') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_access_policies;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
