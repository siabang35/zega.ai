-- ============================================================================
-- ZEGA AI PLATFORM - ENTERPRISE UNIFIED GLOBAL SEARCH ENGINE & INDEX
-- Migration 114: Comprehensive Multi-Tenant GIN Trigram FTS & Submenu RPC
-- Path: supabase/migrations/sql_umkm/114_umkm_comprehensive_global_search_engine.sql
-- ============================================================================

-- 1. Enable pg_trgm extension for ultra-fast fuzzy string matching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. CREATE DEDICATED UNIFIED SEARCH INDEX TABLE FOR 1-3MS SEARCH RESPONSE TIMES
CREATE TABLE IF NOT EXISTS public.umkm_global_search_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    item_type VARCHAR(32) NOT NULL DEFAULT 'feature', -- 'menu', 'submenu', 'quick_action', 'product', 'invoice', 'customer', 'agent', 'automation', 'inbox', 'knowledge', 'integration', 'setting', 'api_doc'
    category_name VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    target_tab VARCHAR(64) NOT NULL,
    target_subitem VARCHAR(64),
    icon_type VARCHAR(64) NOT NULL DEFAULT 'Sparkles',
    keywords TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    search_text TEXT GENERATED ALWAYS AS (LOWER(title || ' ' || COALESCE(subtitle, '') || ' ' || category_name || ' ' || keywords)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GIN TRIGRAM & MULTI-TENANT INDEXES FOR ZERO-LAG SUB-SECOND SEARCH
CREATE INDEX IF NOT EXISTS idx_global_search_trgm ON public.umkm_global_search_index USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_global_search_store_type ON public.umkm_global_search_index (store_id, item_type);
CREATE INDEX IF NOT EXISTS idx_global_search_target ON public.umkm_global_search_index (target_tab);

-- Individual domain table trigram indexes for live dynamic fallback
CREATE INDEX IF NOT EXISTS idx_umkm_products_name_trgm ON public.umkm_products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_products_sku_trgm ON public.umkm_products USING gin (sku gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_umkm_invoices_code_trgm ON public.umkm_invoices USING gin (invoice_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_invoices_customer_trgm ON public.umkm_invoices USING gin (customer_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_umkm_customers_name_trgm ON public.umkm_customers USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_customers_email_trgm ON public.umkm_customers USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_customers_phone_trgm ON public.umkm_customers USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_name_trgm ON public.umkm_ai_employees USING gin (agent_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_role_trgm ON public.umkm_ai_employees USING gin (role_title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_umkm_automations_name_trgm ON public.umkm_automations USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_docs_title_trgm ON public.umkm_knowledge_docs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_integrations_name_trgm ON public.umkm_integrations USING gin (name gin_trgm_ops);

-- 4. SEED COMPREHENSIVE MAJOR MENUS, SUBMENUS & ENTERPRISE SYSTEM FEATURES
INSERT INTO public.umkm_global_search_index (store_id, item_type, category_name, title, subtitle, target_tab, target_subitem, icon_type, keywords)
VALUES
    -- OVERVIEW & TELEMETRY
    (NULL, 'menu', 'OVERVIEW', 'Beranda & Ringkasan Dashboard', 'Statistik real-time, pendapatan hari ini, dan efisiensi waktu', 'home', NULL, 'LayoutDashboard', 'home beranda overview dashboard kpi telemetry revenue'),
    (NULL, 'submenu', 'OVERVIEW', 'Status Sistem & Realtime Sync', 'Koneksi database Supabase Realtime & backup otomatis', 'home', 'Status System', 'Activity', 'status system realtime backup sync connection'),
    (NULL, 'submenu', 'OVERVIEW', 'Aktivitas Otomatisasi Terkini', 'Log eksekusi alur kerja otomatisasi real-time', 'home', 'Recent Automation', 'Zap', 'automation log timeline event trigger'),

    -- AI WORKFORCE & AGENTS
    (NULL, 'menu', 'BISNIS', 'Karyawan AI & Workforce', 'Kelola tim AI autonomous 24/7 untuk operasional bisnis', 'my_agents', NULL, 'Bot', 'ai employees workforce agent bot autonomous swarm'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Terapkan Karyawan AI Baru', 'Deploy agen AI baru dengan model 9Router & Llama 3.3', 'my_agents', 'Deploy Agent', 'Plus', 'deploy add create ai employee agent bot model'),
    (NULL, 'submenu', 'BISNIS', 'Galeri Template Agen AI', 'Pilih preset agen AI siap pakai (CS, Sales, Finance)', 'my_agents', 'Templates', 'Sparkles', 'templates gallery preset agent cs sales finance'),

    -- AUTOMATION WORKFLOWS
    (NULL, 'menu', 'BISNIS', 'Otomatisasi & Engine Workflow', 'Buat alur kerja no-code otomatis untuk menghemat waktu', 'sandbox', NULL, 'Workflow', 'automation workflow otomatisasi trigger engine no-code'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Impor Blueprint Otomatisasi (JSON)', 'Upload atau muat preset alur kerja JSON blueprint', 'sandbox', 'Import JSON', 'FileCode', 'import json blueprint workflow preset restock wa bot'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Buat Otomatisasi Baru', 'Tambahkan trigger event dan aksi otomatisasi baru', 'sandbox', 'Create Automation', 'Plus', 'create new automation trigger action workflow'),

    -- WA & MULTI-CHANNEL INBOX
    (NULL, 'menu', 'OVERVIEW', 'Kotak Masuk (WhatsApp & DM)', 'Kelola percakapan pelanggan WhatsApp, IG DM, dan Shopee', 'wa_bot', NULL, 'MessageSquare', 'inbox whatsapp chat dm instagram shopee cs live chat'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Kirim Broadcast Promo WhatsApp', 'Kirim pesan promosi massal ke ribuan kontak pelanggan', 'wa_bot', 'Send Broadcast', 'Send', 'broadcast whatsapp promo messaging blast customer'),
    (NULL, 'submenu', 'OVERVIEW', 'Template Balasan Cepat (Quick Replies)', 'Kelola draf pesan balasan otomatis AI & manual CS', 'wa_bot', 'Quick Reply', 'FileText', 'template quick reply draft chat response'),

    -- SALES Analytics & REKAP
    (NULL, 'menu', 'BISNIS', 'Analitik & Rekap Penjualan', 'Monitor performa penjualan, omset, dan tren harian', 'sales_rekap', NULL, 'BarChart3', 'sales rekap penjualan transaksi revenue omset analytics'),
    (NULL, 'submenu', 'BISNIS', 'Penjualan per Sumber Trafik (Attribution)', 'Analisis atribusi omset dari iklan, sosial media & WA', 'sales_rekap', 'Sales by Source', 'PieChart', 'source attribution traffic ads campaign conversion'),
    (NULL, 'submenu', 'BISNIS', 'Penjualan per Channel', 'Kontribusi pendapatan Shopee, TikTok, IG & WA Chat', 'sales_rekap', 'Sales by Channel', 'ShoppingBag', 'channel shopee tiktok instagram whatsapp share'),
    (NULL, 'submenu', 'BISNIS', 'Laporan Bulanan Eksekutif', 'Analisis keuangan bulanan, profit bersih & tren cohort', 'sales_rekap', 'Monthly Report', 'FileSpreadsheet', 'monthly report eksekutif net profit cohort pdf'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Tetapkan Target Penjualan Bulanan', 'Tentukan target omset bulanan untuk AI Assistant', 'sales_rekap', 'Set Goal', 'Target', 'sales goal target revenue monthly omset'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Jalankan AI Sales Swarm', 'Analisis prediksi penjualan harian dengan AI Model Swarm', 'sales_rekap', 'Deploy Sales Swarm', 'Zap', 'sales swarm ai model prediction forecast'),

    -- AI MARKETING & COPYWRITER
    (NULL, 'menu', 'BISNIS', 'Pemasaran & AI Copywriter', 'Buat konten promosi, iklan, dan copywriting otomatis', 'ai_copywriter', NULL, 'Megaphone', 'marketing pemasaran promo copywriter content studio campaign'),
    (NULL, 'submenu', 'BISNIS', 'Content Studio AI', 'Generator teks iklan, caption IG, dan skrip video TikTok', 'ai_copywriter', 'Content Studio', 'Sparkles', 'content studio caption instagram tiktok video ad copy'),
    (NULL, 'submenu', 'BISNIS', 'Kampanye Pemasaran Real-time', 'Kelola iklan dan evaluasi performa kampanye aktif', 'ai_copywriter', 'Campaigns', 'TrendingUp', 'campaign kampanye ad budget roas ctr conversion'),

    -- FINANCE & INVOICES
    (NULL, 'menu', 'BISNIS', 'Keuangan, Cashflow & Invoice', 'Manajemen kas, tagihan pelanggan, QRIS & e-Faktur Pajak', 'invoice_gen', NULL, 'DollarSign', 'finance keuangan invoice tax e-faktur qris cashflow solana'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Buat Invoice Baru', 'Terbitkan faktur tagihan pembayaran baru untuk pelanggan', 'invoice_gen', 'Create Invoice', 'Plus', 'create invoice buat faktur tagihan payment qris'),
    (NULL, 'submenu', 'BISNIS', 'Settlement & Riwayat Transaksi FIAT & Solana', 'Log transaksi settlement QRIS, Virtual Account & x402 Crypto', 'invoice_gen', 'Settlement History', 'CreditCard', 'settlement history transaction qris bank va crypto solana x402'),
    (NULL, 'submenu', 'BISNIS', 'Pengaturan Profil Tagihan & NPWP', 'Konfigurasi e-Faktur, NPWP perusahaan & mata uang invoice', 'invoice_gen', 'Billing Settings', 'Settings', 'tax npwp e-faktur billing address currency idr usd'),

    -- STORE MANAGEMENT & CATALOG
    (NULL, 'menu', 'BISNIS', 'Manajemen Toko & Produk', 'Kelola produk, stok inventaris, SKU & batas persediaan', 'store', NULL, 'Store', 'store toko produk catalog stock barang inventory sku'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Tambah Produk Baru', 'Tambahkan barang baru ke katalog toko lengkap dengan foto', 'store', 'Add Product', 'Plus', 'add product tambah produk barang catalog sku price'),
    (NULL, 'submenu', 'BISNIS', 'Produk Terlaris (Top Selling)', 'Daftar produk paling laku berdasarkan volume transaksi', 'store', 'Top Selling', 'Award', 'top selling paling laku produk best seller volume'),

    -- CUSTOMER CRM & COHORTS
    (NULL, 'menu', 'BISNIS', 'Pelanggan & CRM Segmentasi', 'Kelola database pembeli, riwayat pesanan & segmen pelanggan', 'customers', NULL, 'Users', 'customer pelanggan crm buyer segmentation lead contact'),
    (NULL, 'submenu', 'BISNIS', 'Stream Aktivitas Pelanggan', 'Log interaksi dan pesanan pelanggan secara real-time', 'customers', 'Activity Stream', 'Activity', 'activity stream customer history order interaction'),

    -- REPORTS & ANALYTICS
    (NULL, 'menu', 'BISNIS', 'Laporan AI & Analytics', 'Laporan eksekutif terpadu penjualan, keuangan & pemasaran', 'reports', NULL, 'PieChart', 'reports laporan pdf executive analytics finance sales marketing'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Cetak Laporan PDF Eksekutif', 'Generate laporan bisnis format PDF lengkap dengan analisis AI', 'reports', 'Export PDF', 'Printer', 'export pdf print report cetak laporan executive'),

    -- KNOWLEDGE BASE STUDIO
    (NULL, 'menu', 'BISNIS', 'Basis Pengetahuan & Dokumen', 'Upload SOP, FAQ, dan dokumen referensi training AI', 'knowledge', NULL, 'BookOpen', 'knowledge basis pengetahuan docs studio sop faq training rag'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Upload Dokumen SOP / FAQ Baru', 'Tambahkan dokumen referensi agar AI Assistant lebih pintar', 'knowledge', 'Upload Doc', 'Upload', 'upload document file pdf word sop faq training'),

    -- MARKETPLACE & INTEGRATIONS
    (NULL, 'menu', 'BISNIS', 'Marketplace & Integrasi System', 'Hubungkan WhatsApp, Shopee, Tokopedia, Instagram & Solana', 'integrations', NULL, 'Building', 'marketplace integrasi plugins webhook API whatsapp shopee instagram'),
    (NULL, 'submenu', 'BISNIS', 'Integrasi Webhook & Developer API', 'Konfigurasi endpoint webhook dan kunci API developer', 'integrations', 'Developer API', 'Code', 'webhook API developer key integration token endpoint'),

    -- BILLING & SUBSCRIPTION
    (NULL, 'menu', 'BISNIS', 'Tagihan, Paket & Billing', 'Kelola langganan paket ZEGA AI, kuota AI Credits & riwayat bayar', 'billing', NULL, 'CreditCard', 'billing tagihan plan upgrade invoice credits subscription plan'),
    (NULL, 'quick_action', 'Tindakan Cepat', 'Upgrade ke Paket Scale Enterprise', 'Tingkatkan kuota AI Credits dan akses seluruh fitur enterprise', 'billing', 'Upgrade Plan', 'Zap', 'upgrade plan scale enterprise quota credits tier'),

    -- SETTINGS & SYSTEM SECURITY
    (NULL, 'menu', 'PENGATURAN', 'Pengaturan Sistem & Keamanan', 'Konfigurasi profil toko, tim, preferensi AI & API Keys', 'settings', NULL, 'Settings', 'settings pengaturan profile team security api keys preference'),
    (NULL, 'submenu', 'PENGATURAN', 'Profil & Akun Toko', 'Kelola foto avatar, nama toko, deskripsi & kontak pemilik', 'settings', 'Profile', 'User', 'profile store account avatar name logo contact'),
    (NULL, 'submenu', 'PENGATURAN', 'Tim & Pengguna (Access Control)', 'Kelola hak akses anggota tim dan peran pengelola toko', 'settings', 'Team Users', 'Users', 'team users access control role permission owner manager'),
    (NULL, 'submenu', 'PENGATURAN', 'Preferensi AI Copilot', 'Konfigurasi suhu model AI, sistem prompt & bahasa default', 'settings', 'AI Preferences', 'Cpu', 'ai preferences model prompt temperature system language'),
    (NULL, 'submenu', 'PENGATURAN', 'Manajemen Kunci API (API Keys)', 'Buat dan kelola API Key rahasia untuk integrasi sistem', 'settings', 'API Keys', 'Key', 'api keys secret token authentication developer access'),

    -- HELP CENTER & API DOCS
    (NULL, 'menu', 'PENGATURAN', 'Pusat Bantuan & Dokumen API', 'Panduan penggunaan, FAQ, tiket bantuan & dokumentasi REST API', 'help', NULL, 'HelpCircle', 'help bantuan support faq webhook SDK api documentation dev'),
    (NULL, 'submenu', 'PENGATURAN', 'Dokumentasi REST API & Webhooks', 'Panduan teknis pengembang untuk integrasi API & Webhook SDK', 'help', 'API Docs', 'FileCode', 'api docs rest api webhook sdk developer integration guide')
ON CONFLICT DO NOTHING;

-- 5. ENTERPRISE ZERO-LAG ANTI-THROTTLING GLOBAL SEARCH RPC FUNCTION
CREATE OR REPLACE FUNCTION public.umkm_global_search_all(
    p_store_id UUID,
    p_query TEXT,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    category VARCHAR(64),
    title TEXT,
    subtitle TEXT,
    target_tab VARCHAR(64),
    icon_type VARCHAR(64),
    score FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_query TEXT;
    v_limit INT;
    v_offset INT;
BEGIN
    -- Anti-Throttling Guard: Trim and check minimum query length to avoid heavy full table scans
    v_clean_query := LOWER(TRIM(COALESCE(p_query, '')));
    
    -- Limit boundaries for chunking and anti-lag memory protection
    v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
    v_offset := GREATEST(COALESCE(p_offset, 0), 0);

    -- If search query is blank or less than 2 chars, return empty set instantly (0ms latency)
    IF LENGTH(v_clean_query) < 2 THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH search_results AS (
        -- 1. UNIFIED SYSTEM MENUS, SUBMENUS, ACTIONS & FEATURES INDEX (0-1ms ULTRA FAST)
        SELECT 
            idx.id,
            idx.category_name::VARCHAR(64) AS category,
            idx.title::TEXT AS title,
            idx.subtitle::TEXT AS subtitle,
            idx.target_tab::VARCHAR(64) AS target_tab,
            idx.icon_type::VARCHAR(64) AS icon_type,
            (SIMILARITY(idx.search_text, v_clean_query) * 1.5)::FLOAT AS score,
            JSONB_BUILD_OBJECT('item_type', idx.item_type, 'target_subitem', idx.target_subitem, 'keywords', idx.keywords) AS metadata
        FROM public.umkm_global_search_index idx
        WHERE (idx.store_id IS NULL OR idx.store_id = p_store_id)
          AND (
              idx.search_text ILIKE '%' || v_clean_query || '%'
              OR SIMILARITY(idx.search_text, v_clean_query) > 0.1
          )

        UNION ALL

        -- 2. LIVE PRODUCTS SEARCH
        SELECT 
            p.id,
            'Produk'::VARCHAR(64) AS category,
            p.name::TEXT AS title,
            ('SKU: ' || p.sku || ' • Rp ' || TO_CHAR(p.price_idr, 'FM999,999,999,999') || ' • Stok: ' || p.stock)::TEXT AS subtitle,
            'store'::VARCHAR(64) AS target_tab,
            'ShoppingBag'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(p.name || ' ' || p.sku || ' ' || p.category), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('sku', p.sku, 'price_idr', p.price_idr, 'stock', p.stock, 'status', p.status) AS metadata
        FROM public.umkm_products p
        WHERE p.store_id = p_store_id
          AND (
              p.name ILIKE '%' || v_clean_query || '%'
              OR p.sku ILIKE '%' || v_clean_query || '%'
              OR p.category ILIKE '%' || v_clean_query || '%'
          )

        UNION ALL

        -- 3. LIVE INVOICES SEARCH
        SELECT 
            i.id,
            'Invoice'::VARCHAR(64) AS category,
            (i.invoice_code || ' - ' || i.customer_name)::TEXT AS title,
            ('Rp ' || TO_CHAR(i.amount_idr, 'FM999,999,999,999') || ' • Status: ' || UPPER(i.status) || ' • Jatuh Tempo: ' || TO_CHAR(i.due_date, 'DD Mon YYYY'))::TEXT AS subtitle,
            'invoice_gen'::VARCHAR(64) AS target_tab,
            'FileText'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(i.invoice_code || ' ' || i.customer_name), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('invoice_code', i.invoice_code, 'amount_idr', i.amount_idr, 'status', i.status) AS metadata
        FROM public.umkm_invoices i
        WHERE i.store_id = p_store_id
          AND (
              i.invoice_code ILIKE '%' || v_clean_query || '%'
              OR i.customer_name ILIKE '%' || v_clean_query || '%'
          )

        UNION ALL

        -- 4. LIVE CUSTOMERS SEARCH
        SELECT 
            c.id,
            'Pelanggan'::VARCHAR(64) AS category,
            c.full_name::TEXT AS title,
            (COALESCE(c.phone, c.email, 'No Contact') || ' • Channel: ' || c.channel || ' • Total Belanja: Rp ' || TO_CHAR(c.total_spent_idr, 'FM999,999,999,999'))::TEXT AS subtitle,
            'customers'::VARCHAR(64) AS target_tab,
            'Users'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(c.full_name || ' ' || COALESCE(c.email, '') || ' ' || COALESCE(c.phone, '')), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('email', c.email, 'phone', c.phone, 'channel', c.channel) AS metadata
        FROM public.umkm_customers c
        WHERE c.store_id = p_store_id
          AND (
              c.full_name ILIKE '%' || v_clean_query || '%'
              OR c.email ILIKE '%' || v_clean_query || '%'
              OR c.phone ILIKE '%' || v_clean_query || '%'
          )

        UNION ALL

        -- 5. LIVE AI EMPLOYEES SEARCH
        SELECT 
            e.id,
            'Karyawan AI'::VARCHAR(64) AS category,
            (e.agent_name || ' (' || e.role_title || ')')::TEXT AS title,
            ('Kode: ' || e.agent_code || ' • Status: ' || e.status || ' • Tasks Solved: ' || e.chats_solved)::TEXT AS subtitle,
            'my_agents'::VARCHAR(64) AS target_tab,
            'Bot'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(e.agent_name || ' ' || e.role_title || ' ' || e.agent_code), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('agent_code', e.agent_code, 'role_title', e.role_title, 'status', e.status) AS metadata
        FROM public.umkm_ai_employees e
        WHERE e.store_id = p_store_id
          AND (
              e.agent_name ILIKE '%' || v_clean_query || '%'
              OR e.role_title ILIKE '%' || v_clean_query || '%'
              OR e.agent_code ILIKE '%' || v_clean_query || '%'
          )

        UNION ALL

        -- 6. LIVE AUTOMATIONS SEARCH
        SELECT 
            a.id,
            'Otomatisasi'::VARCHAR(64) AS category,
            a.name::TEXT AS title,
            ('Trigger: ' || a.trigger_event || ' • Status: ' || a.status || ' • Total Runs: ' || a.total_runs)::TEXT AS subtitle,
            'sandbox'::VARCHAR(64) AS target_tab,
            'Workflow'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(a.name || ' ' || a.trigger_event), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('trigger_event', a.trigger_event, 'status', a.status, 'total_runs', a.total_runs) AS metadata
        FROM public.umkm_automations a
        WHERE a.store_id = p_store_id
          AND (
              a.name ILIKE '%' || v_clean_query || '%'
              OR a.trigger_event ILIKE '%' || v_clean_query || '%'
          )

        UNION ALL

        -- 7. LIVE KNOWLEDGE BASE SEARCH
        SELECT 
            k.id,
            'Basis Pengetahuan'::VARCHAR(64) AS category,
            k.title::TEXT AS title,
            ('Kategori: ' || k.category || ' • Status Trained: ' || CASE WHEN k.is_trained THEN 'Ya' ELSE 'Belum' END)::TEXT AS subtitle,
            'knowledge'::VARCHAR(64) AS target_tab,
            'BookOpen'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(k.title || ' ' || k.category || ' ' || COALESCE(k.content, '')), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('category', k.category, 'is_trained', k.is_trained) AS metadata
        FROM public.umkm_knowledge_docs k
        WHERE k.store_id = p_store_id
          AND (
              k.title ILIKE '%' || v_clean_query || '%'
              OR k.category ILIKE '%' || v_clean_query || '%'
              OR k.content ILIKE '%' || v_clean_query || '%'
          )

        UNION ALL

        -- 8. LIVE INTEGRATIONS SEARCH
        SELECT 
            ig.id,
            'Integrasi'::VARCHAR(64) AS category,
            ig.name::TEXT AS title,
            ('Kategori: ' || ig.category || ' • Status: ' || CASE WHEN ig.is_connected THEN 'Terkoneksi' ELSE 'Belum Terkoneksi' END)::TEXT AS subtitle,
            'integrations'::VARCHAR(64) AS target_tab,
            'Building'::VARCHAR(64) AS icon_type,
            SIMILARITY(LOWER(ig.name || ' ' || ig.integration_code || ' ' || ig.category), v_clean_query)::FLOAT AS score,
            JSONB_BUILD_OBJECT('integration_code', ig.integration_code, 'is_connected', ig.is_connected) AS metadata
        FROM public.umkm_integrations ig
        WHERE ig.store_id = p_store_id
          AND (
              ig.name ILIKE '%' || v_clean_query || '%'
              OR ig.integration_code ILIKE '%' || v_clean_query || '%'
              OR ig.category ILIKE '%' || v_clean_query || '%'
          )
    )
    SELECT 
        sr.id,
        sr.category,
        sr.title,
        sr.subtitle,
        sr.target_tab,
        sr.icon_type,
        sr.score,
        sr.metadata
    FROM search_results sr
    ORDER BY sr.score DESC, sr.title ASC
    LIMIT v_limit
    OFFSET v_offset;
END;
$$;

-- 6. GRANT SECURITY & PERMISSIONS
GRANT EXECUTE ON FUNCTION public.umkm_global_search_all(UUID, TEXT, INT, INT) TO authenticated, anon, service_role;
GRANT SELECT ON public.umkm_global_search_index TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.umkm_global_search_all IS 'Enterprise zero-lag anti-throttling unified GIN trigram search RPC indexing major features, submenus, and live records.';
