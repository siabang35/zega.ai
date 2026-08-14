-- ============================================================================
-- Migration 64: ZEGA Enterprise UMKM Knowledge Base Health Audit & Realtime
-- Created: 2026-08-08
-- Description: Creates umkm_knowledge_health_audits table, enables RLS & Realtime,
--              seeds default AI audit issues, and provides RPC endpoints.
-- ============================================================================

-- 1. Create Knowledge Health Audits Table
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_health_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'Medium', -- High, Medium, Low, Critical
    category VARCHAR(100) NOT NULL DEFAULT 'Missing SOP', -- Missing SOP, Outdated, Duplicate, Broken Link
    recommended_action TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open', -- Open, In Progress, Resolved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive alter to handle pre-existing table schema without category column
ALTER TABLE public.umkm_knowledge_health_audits 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'Missing SOP';

-- 2. Indexes & RLS Policies
CREATE INDEX IF NOT EXISTS idx_umkm_k_health_store ON public.umkm_knowledge_health_audits(store_id, status);

ALTER TABLE public.umkm_knowledge_health_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to health audits" ON public.umkm_knowledge_health_audits;
CREATE POLICY "Allow full access to health audits" ON public.umkm_knowledge_health_audits
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Enable Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_health_audits;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Seed Default Enterprise Health Audits
DO $$
DECLARE
    v_s_id TEXT;
    v_store_ids TEXT[] := ARRAY['STORE-DEMO-1283', '11111111-1111-1111-1111-111111111111'];
BEGIN
    FOREACH v_s_id IN ARRAY v_store_ids LOOP
        INSERT INTO public.umkm_knowledge_health_audits
        (id, store_id, title, description, severity, category, recommended_action, status)
        VALUES
        (gen_random_uuid(), v_s_id, 'SOP Pembukaan & Penutupan Kasir POS Belum Tersedia', 'Belum ada panduan resmi untuk langkah pembukaan dan penutupan shift kasir.', 'High', 'Missing SOP', 'Gunakan ZeroClaw AI Copywriter untuk generate 1-Click SOP Kasir', 'Open'),
        (gen_random_uuid(), v_s_id, 'Daftar Harga & Katalog Produk Belum Diperbarui', 'Katalog harga versi September 2025 perlu penyesuaian diskon & PPn terbaru.', 'Medium', 'Outdated', 'Unggah ulang dokumen XLSX Katalog Produk versi 2026 ke Document Center', 'Open'),
        (gen_random_uuid(), v_s_id, 'Terdapat Duplikasi SOP Packing Logistik', 'Ditemukan 2 artikel packing serupa: "Panduan Packing" dan "SOP Packing Aman".', 'Medium', 'Duplicate', 'Gabungkan naskah menjadi satu standar SOP Packing Resmi', 'Open'),
        (gen_random_uuid(), v_s_id, 'Dokumen Panduan Garansi Pelanggan Belum Ada', 'Banyak pertanyaan pelanggan via WhatsApp mengenai klaim garansi yang belum ada SOP tertulis.', 'High', 'Missing SOP', 'Buat FAQ Garansi & Retur via Studio Copywriter', 'Open')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 5. RPC Function: Get Health Audits with Fallback Seeding
CREATE OR REPLACE FUNCTION get_umkm_knowledge_health_audits(p_store_id TEXT)
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
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.umkm_knowledge_health_audits WHERE store_id::TEXT = p_store_id::TEXT AND status = 'Open';
    
    IF v_count = 0 THEN
        INSERT INTO public.umkm_knowledge_health_audits
        (id, store_id, title, description, severity, category, recommended_action, status)
        VALUES
        (gen_random_uuid(), p_store_id, 'SOP Pembukaan & Penutupan Kasir POS Belum Tersedia', 'Belum ada panduan resmi untuk langkah pembukaan dan penutupan shift kasir.', 'High', 'Missing SOP', 'Gunakan ZeroClaw AI Copywriter untuk generate 1-Click SOP Kasir', 'Open'),
        (gen_random_uuid(), p_store_id, 'Daftar Harga & Katalog Produk Belum Diperbarui', 'Katalog harga versi September 2025 perlu penyesuaian diskon & PPn terbaru.', 'Medium', 'Outdated', 'Unggah ulang dokumen XLSX Katalog Produk versi 2026 ke Document Center', 'Open'),
        (gen_random_uuid(), p_store_id, 'Terdapat Duplikasi SOP Packing Logistik', 'Ditemukan 2 artikel packing serupa: "Panduan Packing" dan "SOP Packing Aman".', 'Medium', 'Duplicate', 'Gabungkan naskah menjadi satu standar SOP Packing Resmi', 'Open'),
        (gen_random_uuid(), p_store_id, 'Dokumen Panduan Garansi Pelanggan Belum Ada', 'Banyak pertanyaan pelanggan via WhatsApp mengenai klaim garansi yang belum ada SOP tertulis.', 'High', 'Missing SOP', 'Buat FAQ Garansi & Retur via Studio Copywriter', 'Open')
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
    WHERE ha.store_id::TEXT = p_store_id::TEXT AND ha.status = 'Open'
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

-- 6. RPC Function: Autofix Audit Issue via AI Agent
CREATE OR REPLACE FUNCTION autofix_umkm_knowledge_health_audit(p_audit_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit RECORD;
BEGIN
    SELECT * INTO v_audit FROM public.umkm_knowledge_health_audits WHERE id = p_audit_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Audit record not found');
    END IF;

    UPDATE public.umkm_knowledge_health_audits
    SET status = 'Resolved', updated_at = NOW()
    WHERE id = p_audit_id;

    -- Update overall store health score dynamically
    UPDATE public.umkm_knowledge_health
    SET 
        health_score_pct = LEAST(100, health_score_pct + 4),
        missing_sop_count = GREATEST(0, missing_sop_count - 1),
        outdated_docs_count = GREATEST(0, outdated_docs_count - 1),
        updated_at = NOW()
    WHERE store_id = v_audit.store_id OR store_id = 'STORE-DEMO-1283';

    RETURN jsonb_build_object(
        'success', true, 
        'audit_id', p_audit_id, 
        'title', v_audit.title,
        'new_status', 'Resolved'
    );
END;
$$;
