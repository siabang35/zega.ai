-- ============================================================================
-- SQL MIGRATION: 17_umkm_knowledge_enterprise_schema.sql
-- Description: Enterprise Knowledge Hub Schema for UMKM Sales Hub
-- Features: Knowledge Metrics, Categories, Articles & SOPs, Knowledge Health Gauge, 
--           Documents Center, AI Prompt Library, Template Library, and Realtime RLS
-- ============================================================================

-- 1. Knowledge Summary Metrics
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    articles_count INT NOT NULL DEFAULT 128,
    articles_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    documents_count INT NOT NULL DEFAULT 54,
    documents_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 12.00,
    templates_count INT NOT NULL DEFAULT 39,
    templates_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    ai_confidence_pct NUMERIC(5,2) NOT NULL DEFAULT 97.00,
    ai_confidence_level TEXT NOT NULL DEFAULT 'Tinggi',
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_label TEXT NOT NULL DEFAULT '2 jam lalu',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Knowledge Categories
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Knowledge Items (Articles, SOPs, FAQs, Prompts, Templates)
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    description TEXT,
    category_name TEXT NOT NULL DEFAULT 'Prosedur Operasional',
    badge_label TEXT NOT NULL DEFAULT 'Prosedur',
    badge_type TEXT NOT NULL DEFAULT 'prosedur', -- 'prosedur', 'faq', 'marketing', 'sales', 'sop'
    status TEXT NOT NULL DEFAULT 'Published', -- 'Published', 'Draft', 'Archived'
    author_name TEXT NOT NULL DEFAULT 'Cik Berliuk',
    author_role TEXT NOT NULL DEFAULT 'Admin',
    author_avatar_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    views_count INT NOT NULL DEFAULT 0,
    rating_score NUMERIC(3,1) NOT NULL DEFAULT 4.8,
    rating_count INT NOT NULL DEFAULT 16,
    is_bookmarked BOOLEAN NOT NULL DEFAULT false,
    updated_time_ago TEXT NOT NULL DEFAULT '2 jam lalu',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Knowledge Health Gauge
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    health_score_pct INT NOT NULL DEFAULT 92,
    health_label TEXT NOT NULL DEFAULT 'Sangat Baik',
    missing_sop_count INT NOT NULL DEFAULT 4,
    outdated_docs_count INT NOT NULL DEFAULT 2,
    broken_links_count INT NOT NULL DEFAULT 0,
    duplicate_count INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Documents Center
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'xlsx', 'docx', 'jpg', 'png'
    file_size_label TEXT NOT NULL DEFAULT '2.4 MB',
    file_url TEXT NOT NULL DEFAULT '#',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Popular Articles, Recently Updated, Templates Library, AI Prompt Library
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_popular_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    templates_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_knowledge_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    prompts_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DEMO DATA
-- ============================================================================

-- Clean old demo seed records
DELETE FROM public.umkm_knowledge_metrics WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_categories WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_items WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_health WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_documents WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_popular_articles WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_templates WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_knowledge_prompts WHERE store_id = 'STORE-DEMO-1283';

-- 1. Insert Summary Metrics
INSERT INTO public.umkm_knowledge_metrics (
    store_id, articles_count, articles_growth_pct, documents_count, documents_growth_pct,
    templates_count, templates_growth_pct, ai_confidence_pct, ai_confidence_level, last_updated_label
) VALUES (
    'STORE-DEMO-1283', 128, 18.00, 54, 12.00, 39, 15.00, 97.00, 'Tinggi', '2 jam lalu'
);

-- 2. Insert Categories
INSERT INTO public.umkm_knowledge_categories (store_id, name, count, sort_order) VALUES
('STORE-DEMO-1283', 'Semua Kategori', 128, 1),
('STORE-DEMO-1283', 'Produk', 18, 2),
('STORE-DEMO-1283', 'Prosedur Operasional', 22, 3),
('STORE-DEMO-1283', 'Sales', 14, 4),
('STORE-DEMO-1283', 'Marketing', 12, 5),
('STORE-DEMO-1283', 'Finance', 9, 6),
('STORE-DEMO-1283', 'Customer Service', 10, 7),
('STORE-DEMO-1283', 'Shipping & Logistik', 8, 8),
('STORE-DEMO-1283', 'FAQ', 15, 9),
('STORE-DEMO-1283', 'Invoice', 7, 10);

-- 3. Insert Knowledge Items
INSERT INTO public.umkm_knowledge_items (
    store_id, title, description, category_name, badge_label, badge_type, status,
    author_name, author_role, author_avatar_url, views_count, rating_score, rating_count, updated_time_ago
) VALUES 
(
    'STORE-DEMO-1283', 'Cara Membuat Invoice Otomatis',
    'Panduan lengkap membuat invoice otomatis untuk semua pesanan.',
    'Invoice', 'Prosedur', 'prosedur', 'Published',
    'Cik Berliuk', 'UMKM Owner',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    532, 4.9, 24, 'Diperbarui 2 jam lalu'
),
(
    'STORE-DEMO-1283', 'Kebijakan Pengembalian Barang',
    'Aturan dan kebijakan retur produk untuk pelanggan.',
    'Prosedur Operasional', 'Prosedur', 'prosedur', 'Published',
    'Admin', 'Operations',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    421, 4.8, 16, 'Diperbarui 4 jam lalu'
),
(
    'STORE-DEMO-1283', 'FAQ - Pengiriman & Ongkir',
    'Pertanyaan umum mengenai pengiriman dan ongkos kirim.',
    'FAQ', 'FAQ', 'faq', 'Published',
    'Cik Berliuk', 'UMKM Owner',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    389, 4.7, 12, 'Diperbarui 6 jam lalu'
),
(
    'STORE-DEMO-1283', 'Panduan Packing Produk',
    'Cara packing produk agar aman dan rapi sebelum dikirim.',
    'Shipping & Logistik', 'Prosedur', 'prosedur', 'Published',
    'Warehouse Team', 'Logistics',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    312, 4.9, 16, 'Diperbarui 1 hari lalu'
),
(
    'STORE-DEMO-1283', 'Strategi Promosi di WhatsApp',
    'Tips & strategi promosi efektif melalui WhatsApp Business.',
    'Marketing', 'Marketing', 'marketing', 'Draft',
    'Marketing Team', 'Marketing',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    298, 4.6, 10, 'Diperbarui 1 hari lalu'
),
(
    'STORE-DEMO-1283', 'Template Pesan Balasan Cepat',
    'Kumpulan template pesan cepat untuk CS & admin.',
    'Sales', 'Sales', 'sales', 'Published',
    'CS Team', 'Support',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    276, 4.8, 20, 'Diperbarui 2 hari lalu'
);

-- 4. Insert Knowledge Health
INSERT INTO public.umkm_knowledge_health (
    store_id, health_score_pct, health_label, missing_sop_count, outdated_docs_count, broken_links_count, duplicate_count
) VALUES (
    'STORE-DEMO-1283', 92, 'Sangat Baik', 4, 2, 0, 1
);

-- 5. Insert Documents Center
INSERT INTO public.umkm_knowledge_documents (store_id, file_name, file_type, file_size_label, file_url) VALUES
('STORE-DEMO-1283', 'SOP-Operasional.pdf', 'pdf', '2.4 MB', '#'),
('STORE-DEMO-1283', 'Daftar-Supplier.xlsx', 'xlsx', '1.1 MB', '#'),
('STORE-DEMO-1283', 'Template-Invoice.docx', 'docx', '480 KB', '#'),
('STORE-DEMO-1283', 'Product-Photo.jpg', 'jpg', '1.2 MB', '#');

-- 6. Insert Popular Articles
INSERT INTO public.umkm_knowledge_popular_articles (store_id, title, views_count) VALUES
('STORE-DEMO-1283', 'Cara Membuat Invoice Otomatis', 532),
('STORE-DEMO-1283', 'Kebijakan Pengembalian Barang', 421),
('STORE-DEMO-1283', 'FAQ - Pengiriman & Ongkir', 389);

-- 7. Insert Templates Library
INSERT INTO public.umkm_knowledge_templates (store_id, title, templates_count) VALUES
('STORE-DEMO-1283', 'Invoice Template', 24),
('STORE-DEMO-1283', 'WhatsApp Reply', 18),
('STORE-DEMO-1283', 'Packing Checklist', 16);

-- 8. Insert AI Prompts Library
INSERT INTO public.umkm_knowledge_prompts (store_id, title, prompts_count) VALUES
('STORE-DEMO-1283', 'Sales Prompt', 12),
('STORE-DEMO-1283', 'Marketing Prompt', 15),
('STORE-DEMO-1283', 'Customer Prompt', 10);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & REALTIME PUBLICATION
-- ============================================================================

ALTER TABLE public.umkm_knowledge_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_popular_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_prompts ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_knowledge_metrics') THEN
        CREATE POLICY "Public select access on umkm_knowledge_metrics" ON public.umkm_knowledge_metrics FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_knowledge_categories') THEN
        CREATE POLICY "Public select access on umkm_knowledge_categories" ON public.umkm_knowledge_categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_knowledge_items') THEN
        CREATE POLICY "Public select access on umkm_knowledge_items" ON public.umkm_knowledge_items FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_knowledge_health') THEN
        CREATE POLICY "Public select access on umkm_knowledge_health" ON public.umkm_knowledge_health FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select access on umkm_knowledge_documents') THEN
        CREATE POLICY "Public select access on umkm_knowledge_documents" ON public.umkm_knowledge_documents FOR SELECT USING (true);
    END IF;
END $$;

-- Register for Supabase Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_metrics;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_categories;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_items;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_health;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_documents;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
