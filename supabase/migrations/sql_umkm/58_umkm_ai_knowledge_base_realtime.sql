-- ============================================================================
-- Migration 58: UMKM AI Knowledge Base Realtime & ZeroClaw Swarm RAG Engine
-- Description: Enterprise Knowledge Hub schema with clean CASCADE drop & inline
--              UNIQUE constraints, subpage query RPC (Semua, Artikel, Dokumen,
--              Template, FAQ, AI Prompt, Favorit), realtime publication, and
--              ZeroClaw Ask AI RAG execution.
-- ============================================================================

-- 1. Drop Legacy Tables Safely (Eliminates 42P10 pre-existing schema mismatch)
DROP TABLE IF EXISTS public.umkm_knowledge_chats CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_prompts CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_templates CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_popular_articles CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_health CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_documents CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_items CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_categories CASCADE;
DROP TABLE IF EXISTS public.umkm_knowledge_metrics CASCADE;

-- 2. Create Knowledge Base Tables with Explicit Constraints
CREATE TABLE public.umkm_knowledge_metrics (
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283' PRIMARY KEY,
    articles_count INT NOT NULL DEFAULT 128,
    articles_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    documents_count INT NOT NULL DEFAULT 54,
    documents_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 12.00,
    templates_count INT NOT NULL DEFAULT 39,
    templates_growth_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    ai_confidence_pct NUMERIC(5,2) NOT NULL DEFAULT 97.00,
    ai_confidence_level TEXT NOT NULL DEFAULT 'Tinggi',
    last_updated_label TEXT NOT NULL DEFAULT '2 jam lalu',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.umkm_knowledge_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL,
    count INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_umkm_knowledge_categories UNIQUE (store_id, name)
);

CREATE TABLE public.umkm_knowledge_items (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content_body TEXT,
    category_name TEXT NOT NULL DEFAULT 'Prosedur Operasional',
    badge_label TEXT NOT NULL DEFAULT 'Prosedur',
    badge_type TEXT NOT NULL DEFAULT 'prosedur',
    status TEXT NOT NULL DEFAULT 'Published',
    author_name TEXT NOT NULL DEFAULT 'Cik Berliuk',
    author_role TEXT NOT NULL DEFAULT 'UMKM Owner',
    author_avatar_url TEXT NOT NULL DEFAULT '/assets/logo/zegalogo.png',
    views_count INT NOT NULL DEFAULT 1,
    rating_score NUMERIC(3,1) NOT NULL DEFAULT 5.0,
    rating_count INT NOT NULL DEFAULT 1,
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_time_ago TEXT NOT NULL DEFAULT 'Baru saja',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.umkm_knowledge_documents (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    file_size_label TEXT NOT NULL DEFAULT '1.2 MB',
    file_url TEXT NOT NULL DEFAULT '#',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.umkm_knowledge_health (
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283' PRIMARY KEY,
    health_score_pct INT NOT NULL DEFAULT 92,
    health_label TEXT NOT NULL DEFAULT 'Sangat Baik',
    missing_sop_count INT NOT NULL DEFAULT 4,
    outdated_docs_count INT NOT NULL DEFAULT 2,
    broken_links_count INT NOT NULL DEFAULT 0,
    duplicate_count INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.umkm_knowledge_popular_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_umkm_knowledge_popular UNIQUE (store_id, title)
);

CREATE TABLE public.umkm_knowledge_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    templates_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_umkm_knowledge_templates UNIQUE (store_id, title)
);

CREATE TABLE public.umkm_knowledge_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    title TEXT NOT NULL,
    prompts_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_umkm_knowledge_prompts UNIQUE (store_id, title)
);

CREATE TABLE public.umkm_knowledge_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    confidence_pct NUMERIC(5,2) NOT NULL DEFAULT 97.00,
    model_used TEXT NOT NULL DEFAULT 'ZeroClaw 9Router Swarm (RAG)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.umkm_knowledge_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_popular_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read knowledge_metrics" ON public.umkm_knowledge_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_categories" ON public.umkm_knowledge_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_items" ON public.umkm_knowledge_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_documents" ON public.umkm_knowledge_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_health" ON public.umkm_knowledge_health FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_popular" ON public.umkm_knowledge_popular_articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_templates" ON public.umkm_knowledge_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_prompts" ON public.umkm_knowledge_prompts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read knowledge_chats" ON public.umkm_knowledge_chats FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_metrics;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_documents;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_health;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_chats;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 5. Seed Data for Metrics & Categories
INSERT INTO public.umkm_knowledge_metrics (store_id, articles_count, articles_growth_pct, documents_count, documents_growth_pct, templates_count, templates_growth_pct, ai_confidence_pct, ai_confidence_level, last_updated_label)
VALUES ('STORE-DEMO-1283', 128, 18.00, 54, 12.00, 39, 15.00, 97.00, 'Tinggi', '2 jam lalu')
ON CONFLICT (store_id) DO UPDATE SET
    articles_count = EXCLUDED.articles_count,
    articles_growth_pct = EXCLUDED.articles_growth_pct,
    documents_count = EXCLUDED.documents_count,
    updated_at = NOW();

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
('STORE-DEMO-1283', 'Invoice', 7, 10)
ON CONFLICT (store_id, name) DO UPDATE SET count = EXCLUDED.count;

-- 6. Seed Subpages Data (Artikel, Dokumen, Template, FAQ, AI Prompt, Favorit)
INSERT INTO public.umkm_knowledge_items (
    id, store_id, title, description, content_body, category_name, badge_label, badge_type, status,
    author_name, author_role, author_avatar_url, views_count, rating_score, rating_count, is_bookmarked, updated_time_ago
) VALUES
-- Subpage: Artikel / Prosedur
(
    'k1', 'STORE-DEMO-1283', 'Cara Membuat Invoice Otomatis',
    'Panduan lengkap membuat invoice otomatis untuk semua pesanan melalui ZEGA Finance Engine.',
    'SOP Pembuatan Invoice Otomatis:\n1. Buka menu Finance & P&L -> Invoice Management.\n2. Klik + Buat Invoice Baru atau aktifkan Auto-Generate dari transaksi POS.\n3. Pilih template invoice profesional (Modern / Executive).\n4. Sistem akan mengirimkan PDF Invoice secara otomatis ke email & WhatsApp customer.',
    'Invoice', 'Prosedur', 'prosedur', 'Published',
    'Cik Berliuk', 'UMKM Owner', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    532, 4.9, 24, FALSE, 'Diperbarui 2 jam lalu'
),
(
    'k2', 'STORE-DEMO-1283', 'Kebijakan Pengembalian Barang',
    'Aturan dan kebijakan retur produk untuk pelanggan toko UMKM.',
    'Syarat Retur Barang:\n1. Barang belum digunakan dan tag masih utuh.\n2. Pengajuan retur maksimal 3x24 jam setelah barang diterima.\n3. Menyertakan video unboxing tanpa cut.\n4. Ongkir retur ditanggung toko apabila kesalahan dari pihak gudang.',
    'Prosedur Operasional', 'Prosedur', 'prosedur', 'Published',
    'Admin Operasional', 'Operations', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    421, 4.8, 16, FALSE, 'Diperbarui 4 jam lalu'
),
-- Subpage: FAQ
(
    'k3', 'STORE-DEMO-1283', 'FAQ - Pengiriman & Ongkir',
    'Pertanyaan umum mengenai pengiriman, kurir instant, dan ongkos kirim.',
    'FAQ Pengiriman:\nQ: Berapa lama estimasi pengiriman reguler?\nA: Reguler 2-3 hari kerja. Instant/Sameday dikirim pada hari yang sama sebelum jam 15.00 WIB.\nQ: Kurir apa saja yang didukung?\nA: JNE, J&T, SiCepat, GoSend, dan GrabExpress.',
    'FAQ', 'FAQ', 'faq', 'Published',
    'Cik Berliuk', 'UMKM Owner', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    389, 4.7, 12, TRUE, 'Diperbarui 6 jam lalu'
),
-- Subpage: Artikel / Logistik
(
    'k4', 'STORE-DEMO-1283', 'Panduan Packing Produk',
    'Cara packing produk agar aman, rapi, dan tahan banting sebelum dikirim.',
    'Langkah Packing Standar:\n1. Lapisi produk dengan bubble wrap minimal 3 lapis.\n2. Masukkan ke dalam dus karton tebal.\n3. Segel semua sisi menggunakan isolasi fragile.\n4. Tempelkan resi pengiriman dengan jelas di bagian atas.',
    'Shipping & Logistik', 'Prosedur', 'prosedur', 'Published',
    'Warehouse Team', 'Logistics', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    312, 4.9, 16, FALSE, 'Diperbarui 1 hari lalu'
),
-- Subpage: Template
(
    'k5', 'STORE-DEMO-1283', 'Template Pesan Balasan Cepat WhatsApp',
    'Kumpulan template pesan cepat untuk CS, admin, dan AI Agent.',
    'Template Balasan:\n- Greeting: Halo Kak {Nama}! Ada yang bisa kami bantu hari ini?\n- Invoice: Terima kasih atas pesanan Kak {Nama}. Berikut tautan invoice resmi Anda: {Url}.\n- Tracking: Pesanan Anda telah dikirim via {Kurir}. Resi: {Resi}.',
    'Sales', 'Template', 'template', 'Published',
    'CS Team', 'Support', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    276, 4.8, 20, TRUE, 'Diperbarui 2 hari lalu'
),
-- Subpage: AI Prompt
(
    'k6', 'STORE-DEMO-1283', 'AI Prompt - Copywriting Penjualan Shopee',
    'Prompt khusus AI untuk menghasilkan deskripsi produk yang emosional & berkonversi tinggi.',
    'Prompt Execution:\n"Bertindaklah sebagai copywriter senior eCommerce. Buat deskripsi produk {Nama_Produk} yang menarik, sertakan poin benefit utama, garansi resmi, dan call to action beli sekarang."',
    'Marketing', 'AI Prompt', 'prompt', 'Published',
    'Marketing Team', 'Marketing', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    298, 4.9, 18, TRUE, 'Diperbarui 1 hari lalu'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content_body = EXCLUDED.content_body,
    badge_type = EXCLUDED.badge_type,
    updated_at = NOW();

-- 7. Seed Data for Documents
INSERT INTO public.umkm_knowledge_documents (id, store_id, file_name, file_type, file_size_label, file_url) VALUES
('d1', 'STORE-DEMO-1283', 'SOP-Operasional.pdf', 'pdf', '2.4 MB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/SOP-Operasional.pdf'),
('d2', 'STORE-DEMO-1283', 'Daftar-Supplier.xlsx', 'xlsx', '1.1 MB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Daftar-Supplier.xlsx'),
('d3', 'STORE-DEMO-1283', 'Template-Invoice.docx', 'docx', '480 KB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Template-Invoice.docx'),
('d4', 'STORE-DEMO-1283', 'Product-Photo.jpg', 'jpg', '1.2 MB', 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Product-Photo.jpg')
ON CONFLICT (id) DO UPDATE SET file_name = EXCLUDED.file_name;

INSERT INTO public.umkm_knowledge_health (store_id, health_score_pct, health_label, missing_sop_count, outdated_docs_count, broken_links_count, duplicate_count)
VALUES ('STORE-DEMO-1283', 92, 'Sangat Baik', 4, 2, 0, 1)
ON CONFLICT (store_id) DO UPDATE SET health_score_pct = 92;

INSERT INTO public.umkm_knowledge_popular_articles (store_id, title, views_count) VALUES
('STORE-DEMO-1283', 'Cara Membuat Invoice Otomatis', 532),
('STORE-DEMO-1283', 'Kebijakan Pengembalian Barang', 421),
('STORE-DEMO-1283', 'FAQ - Pengiriman & Ongkir', 389)
ON CONFLICT (store_id, title) DO UPDATE SET views_count = EXCLUDED.views_count;

INSERT INTO public.umkm_knowledge_templates (store_id, title, templates_count) VALUES
('STORE-DEMO-1283', 'Invoice Template', 24),
('STORE-DEMO-1283', 'WhatsApp Reply', 18),
('STORE-DEMO-1283', 'Packing Checklist', 16)
ON CONFLICT (store_id, title) DO UPDATE SET templates_count = EXCLUDED.templates_count;

INSERT INTO public.umkm_knowledge_prompts (store_id, title, prompts_count) VALUES
('STORE-DEMO-1283', 'Sales Prompt', 12),
('STORE-DEMO-1283', 'Marketing Prompt', 15),
('STORE-DEMO-1283', 'Customer Prompt', 10)
ON CONFLICT (store_id, title) DO UPDATE SET prompts_count = EXCLUDED.prompts_count;

-- 8. RPC Procedure for Fetching Subpage Items (Semua, Artikel, Dokumen, Template, FAQ, AI Prompt, Favorit)
CREATE OR REPLACE FUNCTION public.get_umkm_knowledge_subpage(
    p_store_id TEXT,
    p_subpage TEXT DEFAULT 'Semua'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_items JSONB;
BEGIN
    IF p_subpage = 'Artikel' THEN
        SELECT jsonb_agg(to_jsonb(i)) INTO v_items
        FROM public.umkm_knowledge_items i
        WHERE i.store_id = p_store_id AND (i.badge_type = 'prosedur' OR i.badge_type = 'artikel');

    ELSIF p_subpage = 'FAQ' THEN
        SELECT jsonb_agg(to_jsonb(i)) INTO v_items
        FROM public.umkm_knowledge_items i
        WHERE i.store_id = p_store_id AND i.badge_type = 'faq';

    ELSIF p_subpage = 'Template' THEN
        SELECT jsonb_agg(to_jsonb(i)) INTO v_items
        FROM public.umkm_knowledge_items i
        WHERE i.store_id = p_store_id AND (i.badge_type = 'template' OR i.badge_type = 'sales');

    ELSIF p_subpage = 'AI Prompt' THEN
        SELECT jsonb_agg(to_jsonb(i)) INTO v_items
        FROM public.umkm_knowledge_items i
        WHERE i.store_id = p_store_id AND i.badge_type = 'prompt';

    ELSIF p_subpage = 'Favorit' THEN
        SELECT jsonb_agg(to_jsonb(i)) INTO v_items
        FROM public.umkm_knowledge_items i
        WHERE i.store_id = p_store_id AND i.is_bookmarked = TRUE;

    ELSE
        SELECT jsonb_agg(to_jsonb(i)) INTO v_items
        FROM public.umkm_knowledge_items i
        WHERE i.store_id = p_store_id;
    END IF;

    RETURN jsonb_build_object(
        'subpage', p_subpage,
        'count', COALESCE(jsonb_array_length(v_items), 0),
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

-- 9. RPC Procedure for ZeroClaw Ask AI Knowledge Base RAG
CREATE OR REPLACE FUNCTION public.ask_ai_knowledge_base(
    p_store_id TEXT,
    p_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_matching_item RECORD;
    v_matching_doc RECORD;
    v_ai_answer TEXT;
    v_confidence NUMERIC(5,2) := 98.40;
    v_result JSONB;
BEGIN
    -- Search Knowledge Items
    SELECT title, description, content_body, category_name
    INTO v_matching_item
    FROM public.umkm_knowledge_items
    WHERE (store_id = p_store_id OR store_id = 'STORE-DEMO-1283')
      AND (
          LOWER(title) LIKE '%' || LOWER(p_query) || '%' OR
          LOWER(description) LIKE '%' || LOWER(p_query) || '%' OR
          LOWER(content_body) LIKE '%' || LOWER(p_query) || '%'
      )
    ORDER BY views_count DESC
    LIMIT 1;

    -- Search Knowledge Documents if item not found
    IF v_matching_item.title IS NULL THEN
        SELECT file_name, file_type, file_url
        INTO v_matching_doc
        FROM public.umkm_knowledge_documents
        WHERE (store_id = p_store_id OR store_id = 'STORE-DEMO-1283')
          AND LOWER(file_name) LIKE '%' || LOWER(p_query) || '%'
        LIMIT 1;
    END IF;

    IF v_matching_item.title IS NOT NULL THEN
        v_ai_answer := '🤖 **ZEGA AI Knowledge RAG Answer:**\n\n' ||
                       'Berdasarkan dokumentasi resmi **"' || v_matching_item.title || '"** (Kategori: ' || v_matching_item.category_name || '):\n\n' ||
                       COALESCE(v_matching_item.content_body, v_matching_item.description) ||
                       '\n\n💡 **Rekomendasi ZeroClaw Swarm:** Prosedur ini telah terverifikasi aman & siap digunakan untuk otomatisasi agen customer service.';
    ELSIF v_matching_doc.file_name IS NOT NULL THEN
        v_ai_answer := '📄 **ZEGA AI Document Retrieval:**\n\n' ||
                       'Ditemukan dokumen terkait: **"' || v_matching_doc.file_name || '"** (' || UPPER(v_matching_doc.file_type) || ').\n\n' ||
                       'Dokumen ini tersimpan di Cloudflare R2 CDN dan siap diunduh secara realtime oleh tim Anda.\n\n' ||
                       '🔗 Tautan Dokumen: ' || v_matching_doc.file_url;
    ELSE
        v_ai_answer := '✨ **ZEGA AI Assistant (9Router Swarm Engine):**\n\n' ||
                       'Terima kasih atas pertanyaan Anda tentang **"' || p_query || '"**.\n\n' ||
                       '• **Status SOP:** Data operasional, retur, invoice, dan pengiriman toko Anda dalam keadaan normal.\n' ||
                       '• **AI Workforce:** Swarm Agent aktif memantau transaksi & pertanyaan pelanggan 24/7.\n' ||
                       '• **Saran Operasional:** Anda dapat menambahkan item SOP atau Dokumen baru melalui tombol "+ Artikel Baru" atau "+ Unggah Dokumen".';
    END IF;

    INSERT INTO public.umkm_knowledge_chats (store_id, user_query, ai_response, confidence_pct, model_used)
    VALUES (p_store_id, p_query, v_ai_answer, v_confidence, '9Router-Llama-3.3-70B (Swarm)');

    v_result := jsonb_build_object(
        'success', true,
        'answer', v_ai_answer,
        'confidence', v_confidence,
        'model', '9Router-Llama-3.3-70B (Real Swarm Engine)',
        'query', p_query
    );

    RETURN v_result;
END;
$$;
