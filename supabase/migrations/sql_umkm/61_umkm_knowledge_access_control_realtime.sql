-- ============================================================================
-- Migration 61: ZEGA Enterprise UMKM Knowledge Hub Access Control & Realtime
-- Created: 2026-08-08
-- Description: Creates umkm_knowledge_access_policies table, enables RLS & Realtime,
--              seeds enterprise roles, and provides RPC endpoints.
-- ============================================================================

-- 1. Create Access Policies Table Defensively
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_access_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR(255) NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    access_level VARCHAR(100) NOT NULL DEFAULT 'Full Access',
    can_create_items BOOLEAN DEFAULT TRUE,
    can_upload_docs BOOLEAN DEFAULT TRUE,
    can_delete_items BOOLEAN DEFAULT FALSE,
    can_manage_access BOOLEAN DEFAULT FALSE,
    is_ai_agent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Columns Defensively if table already exists
ALTER TABLE public.umkm_knowledge_access_policies ADD COLUMN IF NOT EXISTS is_ai_agent BOOLEAN DEFAULT FALSE;

-- 3. Indexes & Unique Constraints
CREATE INDEX IF NOT EXISTS idx_umkm_k_acc_store ON public.umkm_knowledge_access_policies(store_id);
ALTER TABLE public.umkm_knowledge_access_policies DROP CONSTRAINT IF EXISTS uq_umkm_k_acc_store_role;
ALTER TABLE public.umkm_knowledge_access_policies ADD CONSTRAINT uq_umkm_k_acc_store_role UNIQUE (store_id, role_name);

-- 3. Enable RLS
ALTER TABLE public.umkm_knowledge_access_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to access policies" ON public.umkm_knowledge_access_policies;
CREATE POLICY "Allow full access to access policies" ON public.umkm_knowledge_access_policies
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_knowledge_access_policies;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 5. Seed Enterprise Roles for Default Stores (Including STORE-DEMO-1283 and 11111111-1111-1111-1111-111111111111)
DO $$
DECLARE
    v_s_id TEXT;
    v_store_ids TEXT[] := ARRAY['STORE-DEMO-1283', '11111111-1111-1111-1111-111111111111'];
BEGIN
    FOREACH v_s_id IN ARRAY v_store_ids LOOP
        INSERT INTO public.umkm_knowledge_access_policies 
        (id, store_id, role_name, access_level, can_create_items, can_upload_docs, can_delete_items, can_manage_access, is_ai_agent)
        VALUES
        (gen_random_uuid(), v_s_id, 'Owner / General Manager', 'Full Access (Admin)', TRUE, TRUE, TRUE, TRUE, FALSE),
        (gen_random_uuid(), v_s_id, 'Store Supervisor / Manager', 'Operasional Toko', TRUE, TRUE, FALSE, FALSE, FALSE),
        (gen_random_uuid(), v_s_id, 'Logistics & Warehouse Lead', 'Gudang & Pengiriman', TRUE, TRUE, FALSE, FALSE, FALSE),
        (gen_random_uuid(), v_s_id, 'Kasir & Front Staff', 'Read Only POS', FALSE, FALSE, FALSE, FALSE, FALSE),
        (gen_random_uuid(), v_s_id, 'ZeroClaw AI Employee Swarm', 'Autonomous RAG Agent', TRUE, TRUE, FALSE, FALSE, TRUE)
        ON CONFLICT (store_id, role_name) DO UPDATE SET
            access_level = EXCLUDED.access_level,
            can_create_items = EXCLUDED.can_create_items,
            can_upload_docs = EXCLUDED.can_upload_docs,
            can_delete_items = EXCLUDED.can_delete_items,
            can_manage_access = EXCLUDED.can_manage_access,
            is_ai_agent = EXCLUDED.is_ai_agent,
            updated_at = NOW();
    END LOOP;
END $$;

-- 6. RPC Function to fetch access policies (With Fallback Seeding)
CREATE OR REPLACE FUNCTION get_umkm_knowledge_access_policies(p_store_id TEXT)
RETURNS TABLE (
    id UUID,
    store_id VARCHAR,
    role_name VARCHAR,
    access_level VARCHAR,
    can_create_items BOOLEAN,
    can_upload_docs BOOLEAN,
    can_delete_items BOOLEAN,
    can_manage_access BOOLEAN,
    is_ai_agent BOOLEAN,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.umkm_knowledge_access_policies WHERE store_id::TEXT = p_store_id::TEXT;
    
    IF v_count = 0 THEN
        INSERT INTO public.umkm_knowledge_access_policies 
        (id, store_id, role_name, access_level, can_create_items, can_upload_docs, can_delete_items, can_manage_access, is_ai_agent)
        VALUES
        (gen_random_uuid(), p_store_id, 'Owner / General Manager', 'Full Access (Admin)', TRUE, TRUE, TRUE, TRUE, FALSE),
        (gen_random_uuid(), p_store_id, 'Store Supervisor / Manager', 'Operasional Toko', TRUE, TRUE, FALSE, FALSE, FALSE),
        (gen_random_uuid(), p_store_id, 'Logistics & Warehouse Lead', 'Gudang & Pengiriman', TRUE, TRUE, FALSE, FALSE, FALSE),
        (gen_random_uuid(), p_store_id, 'Kasir & Front Staff', 'Read Only POS', FALSE, FALSE, FALSE, FALSE, FALSE),
        (gen_random_uuid(), p_store_id, 'ZeroClaw AI Employee Swarm', 'Autonomous RAG Agent', TRUE, TRUE, FALSE, FALSE, TRUE)
        ON CONFLICT (store_id, role_name) DO NOTHING;
    END IF;

    RETURN QUERY
    SELECT 
        ap.id,
        ap.store_id,
        ap.role_name,
        ap.access_level,
        ap.can_create_items,
        ap.can_upload_docs,
        ap.can_delete_items,
        ap.can_manage_access,
        ap.is_ai_agent,
        ap.updated_at
    FROM public.umkm_knowledge_access_policies ap
    WHERE ap.store_id::TEXT = p_store_id::TEXT
    ORDER BY ap.is_ai_agent ASC, ap.role_name ASC;
END;
$$;

-- 7. Security Audit Log Table
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    actor_role VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_umkm_k_audit_store ON public.umkm_knowledge_security_audit_logs(store_id, created_at DESC);
