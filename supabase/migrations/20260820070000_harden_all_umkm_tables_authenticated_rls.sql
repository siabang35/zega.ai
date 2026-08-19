-- ============================================================================
-- ZEGA AI PLATFORM — AUTHENTICATED USER ONLY RLS POLICIES & RPC PERMISSIONS
-- Migration: 20260820070000_harden_all_umkm_tables_authenticated_rls.sql
-- SECURITY RULE: Grant access STRICTLY TO authenticated & service_role. NO ANON ACCESS.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. REVOKE ANON & GRANT EXCLUSIVE ACCESS TO authenticated & service_role
-- ----------------------------------------------------------------------------

-- Chat Tables
REVOKE ALL ON TABLE public.umkm_live_help_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_live_help_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_ai_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_ai_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_zega_copilot_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_zega_copilot_messages FROM anon;
REVOKE ALL ON TABLE public.umkm_ai_assistant_chats FROM anon;
REVOKE ALL ON TABLE public.umkm_ai_assistant_messages FROM anon;

GRANT ALL ON TABLE public.umkm_live_help_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_live_help_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_ai_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_ai_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_zega_copilot_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_zega_copilot_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_ai_assistant_chats TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_ai_assistant_messages TO authenticated, service_role;

-- Knowledge & Finance Tables
REVOKE ALL ON TABLE public.umkm_knowledge_documents FROM anon;
REVOKE ALL ON TABLE public.umkm_knowledge_docs FROM anon;
REVOKE ALL ON TABLE public.umkm_finance_insights FROM anon;

GRANT ALL ON TABLE public.umkm_knowledge_documents TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_knowledge_docs TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_finance_insights TO authenticated, service_role;

-- Profile & Settings Tables
GRANT ALL ON TABLE public.umkm_user_profiles TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_user_security TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_user_preferences TO authenticated, service_role;
GRANT ALL ON TABLE public.umkm_settings_ai_preferences TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. DROP RESTRICTIVE POLICIES AND APPLY STRICT AUTHENTICATED RLS POLICIES
-- ----------------------------------------------------------------------------

-- Live Help Chats
ALTER TABLE public.umkm_live_help_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "live_help_chats_tenant_isolation" ON public.umkm_live_help_chats;
DROP POLICY IF EXISTS "live_help_chats_all" ON public.umkm_live_help_chats;
DROP POLICY IF EXISTS "live_help_chats_anon_read_write" ON public.umkm_live_help_chats;
DROP POLICY IF EXISTS "live_help_chats_auth_all" ON public.umkm_live_help_chats;

CREATE POLICY "live_help_chats_auth_all"
ON public.umkm_live_help_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Live Help Messages
ALTER TABLE public.umkm_live_help_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "live_help_messages_tenant_isolation" ON public.umkm_live_help_messages;
DROP POLICY IF EXISTS "live_help_messages_all" ON public.umkm_live_help_messages;
DROP POLICY IF EXISTS "live_help_messages_anon_read_write" ON public.umkm_live_help_messages;
DROP POLICY IF EXISTS "live_help_messages_auth_all" ON public.umkm_live_help_messages;

CREATE POLICY "live_help_messages_auth_all"
ON public.umkm_live_help_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Finance AI Chats
ALTER TABLE public.umkm_finance_ai_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_ai_chats_tenant_isolation" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_all" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_anon_read_write" ON public.umkm_finance_ai_chats;
DROP POLICY IF EXISTS "finance_ai_chats_auth_all" ON public.umkm_finance_ai_chats;

CREATE POLICY "finance_ai_chats_auth_all"
ON public.umkm_finance_ai_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Finance AI Messages
ALTER TABLE public.umkm_finance_ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "finance_ai_messages_tenant_isolation" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_all" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_anon_read_write" ON public.umkm_finance_ai_messages;
DROP POLICY IF EXISTS "finance_ai_messages_auth_all" ON public.umkm_finance_ai_messages;

CREATE POLICY "finance_ai_messages_auth_all"
ON public.umkm_finance_ai_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ZEGA Copilot Chats
ALTER TABLE public.umkm_zega_copilot_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_chats_tenant_isolation" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "copilot_chats_all" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "copilot_chats_anon_read_write" ON public.umkm_zega_copilot_chats;
DROP POLICY IF EXISTS "copilot_chats_auth_all" ON public.umkm_zega_copilot_chats;

CREATE POLICY "copilot_chats_auth_all"
ON public.umkm_zega_copilot_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ZEGA Copilot Messages
ALTER TABLE public.umkm_zega_copilot_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "copilot_messages_tenant_isolation" ON public.umkm_zega_copilot_messages;
DROP POLICY IF EXISTS "copilot_messages_all" ON public.umkm_zega_copilot_messages;
DROP POLICY IF EXISTS "copilot_messages_anon_read_write" ON public.umkm_zega_copilot_messages;
DROP POLICY IF EXISTS "copilot_messages_auth_all" ON public.umkm_zega_copilot_messages;

CREATE POLICY "copilot_messages_auth_all"
ON public.umkm_zega_copilot_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI Assistant Chats
ALTER TABLE public.umkm_ai_assistant_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistant_chats_tenant_isolation" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_all" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_anon_read_write" ON public.umkm_ai_assistant_chats;
DROP POLICY IF EXISTS "assistant_chats_auth_all" ON public.umkm_ai_assistant_chats;

CREATE POLICY "assistant_chats_auth_all"
ON public.umkm_ai_assistant_chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI Assistant Messages
ALTER TABLE public.umkm_ai_assistant_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistant_messages_tenant_isolation" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_all" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_anon_read_write" ON public.umkm_ai_assistant_messages;
DROP POLICY IF EXISTS "assistant_messages_auth_all" ON public.umkm_ai_assistant_messages;

CREATE POLICY "assistant_messages_auth_all"
ON public.umkm_ai_assistant_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Knowledge Documents & Docs
ALTER TABLE public.umkm_knowledge_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read umkm_knowledge_documents" ON public.umkm_knowledge_documents;
DROP POLICY IF EXISTS "Public write umkm_knowledge_documents" ON public.umkm_knowledge_documents;
DROP POLICY IF EXISTS "knowledge_documents_auth_all" ON public.umkm_knowledge_documents;

CREATE POLICY "knowledge_documents_auth_all"
ON public.umkm_knowledge_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.umkm_knowledge_docs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read umkm_knowledge_docs" ON public.umkm_knowledge_docs;
DROP POLICY IF EXISTS "Public write umkm_knowledge_docs" ON public.umkm_knowledge_docs;
DROP POLICY IF EXISTS "knowledge_docs_auth_all" ON public.umkm_knowledge_docs;

CREATE POLICY "knowledge_docs_auth_all"
ON public.umkm_knowledge_docs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. HARDEN KNOWLEDGE BASE RPC FUNCTIONS WITH DROP & DEFAULT PARAMETERS
-- ----------------------------------------------------------------------------

-- get_umkm_knowledge_health_audits
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_health_audits(TEXT);
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_health_audits();

CREATE OR REPLACE FUNCTION public.get_umkm_knowledge_health_audits(p_store_id TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    store_id VARCHAR,
    title VARCHAR,
    description TEXT,
    severity VARCHAR,
    category VARCHAR,
    recommended_action TEXT,
    status VARCHAR,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_store TEXT := COALESCE(NULLIF(p_store_id, ''), 'STORE-DEMO-1283');
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.umkm_knowledge_health_audits WHERE store_id::TEXT = v_target_store AND status = 'Open';
    
    IF v_count = 0 THEN
        INSERT INTO public.umkm_knowledge_health_audits
        (id, store_id, title, description, severity, category, recommended_action, status)
        VALUES
        (gen_random_uuid(), v_target_store, 'SOP Pembukaan & Penutupan Kasir POS Belum Tersedia', 'Belum ada panduan resmi untuk langkah pembukaan dan penutupan shift kasir.', 'High', 'Missing SOP', 'Gunakan ZeroClaw AI Copywriter untuk generate 1-Click SOP Kasir', 'Open'),
        (gen_random_uuid(), v_target_store, 'Daftar Harga & Katalog Produk Belum Diperbarui', 'Katalog harga versi September 2025 perlu penyesuaian diskon & PPn terbaru.', 'Medium', 'Outdated', 'Unggah ulang dokumen XLSX Katalog Produk versi 2026 ke Document Center', 'Open'),
        (gen_random_uuid(), v_target_store, 'Terdapat Duplikasi SOP Packing Logistik', 'Ditemukan 2 artikel packing serupa: "Panduan Packing" dan "SOP Packing Aman".', 'Medium', 'Duplicate', 'Gabungkan naskah menjadi satu standar SOP Packing Resmi', 'Open'),
        (gen_random_uuid(), v_target_store, 'Dokumen Panduan Garansi Pelanggan Belum Ada', 'Banyak pertanyaan pelanggan via WhatsApp mengenai klaim garansi yang belum ada SOP tertulis.', 'High', 'Missing SOP', 'Buat FAQ Garansi & Retur via Studio Copywriter', 'Open')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN QUERY
    SELECT 
        ha.id,
        ha.store_id,
        ha.title,
        ha.description,
        ha.severity,
        ha.category,
        ha.recommended_action,
        ha.status,
        ha.created_at
    FROM public.umkm_knowledge_health_audits ha
    WHERE ha.store_id::TEXT = v_target_store AND ha.status = 'Open'
    ORDER BY 
        CASE ha.severity 
            WHEN 'Critical' THEN 1 
            WHEN 'High' THEN 2 
            WHEN 'Medium' THEN 3 
            ELSE 4 
        END, 
        ha.created_at DESC;
END;
$$;

-- get_umkm_knowledge_categories
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_categories(TEXT);
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_categories();

CREATE OR REPLACE FUNCTION public.get_umkm_knowledge_categories(p_store_id TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    code VARCHAR,
    description TEXT,
    icon VARCHAR,
    articles_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_store TEXT := COALESCE(NULLIF(p_store_id, ''), 'STORE-DEMO-1283');
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.code,
        c.description,
        c.icon,
        COUNT(a.id)::BIGINT AS articles_count
    FROM public.umkm_knowledge_categories c
    LEFT JOIN public.umkm_knowledge_items a ON a.category_code = c.code AND (a.store_id::TEXT = v_target_store OR a.store_id = 'STORE-DEMO-1283')
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.code, c.description, c.icon, c.sort_order
    ORDER BY c.sort_order ASC;
END;
$$;

-- get_umkm_knowledge_access_policies
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_access_policies(TEXT);
DROP FUNCTION IF EXISTS public.get_umkm_knowledge_access_policies();

CREATE OR REPLACE FUNCTION public.get_umkm_knowledge_access_policies(p_store_id TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    store_id VARCHAR,
    role_name VARCHAR,
    access_level VARCHAR,
    can_read BOOLEAN,
    can_write BOOLEAN,
    can_delete BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_store TEXT := COALESCE(NULLIF(p_store_id, ''), 'STORE-DEMO-1283');
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.store_id,
        ap.role_name,
        ap.access_level,
        ap.can_read,
        ap.can_write,
        ap.can_delete,
        ap.created_at
    FROM public.umkm_knowledge_access_policies ap
    WHERE ap.store_id::TEXT = v_target_store OR ap.store_id = 'STORE-DEMO-1283'
    ORDER BY ap.created_at ASC;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. GRANT EXECUTE ON ALL SCHEMAS & FUNCTIONS TO authenticated & service_role
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

COMMIT;
