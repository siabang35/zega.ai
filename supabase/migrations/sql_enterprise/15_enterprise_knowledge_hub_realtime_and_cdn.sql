-- ============================================================================
-- MIGRATION 15: Enterprise Knowledge Hub Realtime Schema, CDN & Vector Sync
-- Target Workspace: ZEGA Enterprise AI Operating System
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/15_enterprise_knowledge_hub_realtime_and_cdn.sql
-- ============================================================================

BEGIN;

-- 1. Create enterprise_knowledge_collections table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    doc_count INTEGER NOT NULL DEFAULT 0,
    doc_count_str TEXT NOT NULL DEFAULT '0 docs',
    icon_name TEXT DEFAULT 'Folder',
    color_theme TEXT DEFAULT 'purple',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create enterprise_knowledge_documents table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name TEXT NOT NULL DEFAULT 'Legal Documents',
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Document',
    size_bytes BIGINT NOT NULL DEFAULT 262144,
    size_formatted TEXT NOT NULL DEFAULT '256 KB',
    owner_name TEXT NOT NULL DEFAULT 'Wildan A.',
    owner_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    last_updated_str TEXT NOT NULL DEFAULT '24 Apr 2025',
    status TEXT NOT NULL DEFAULT 'Indexed',
    access_level TEXT NOT NULL DEFAULT 'Team',
    cdn_url TEXT DEFAULT 'https://cdn.zegaai.site/knowledge/legal/document.pdf',
    qdrant_vector_id TEXT DEFAULT gen_random_uuid()::text,
    chunk_count INTEGER NOT NULL DEFAULT 64,
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-large',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create enterprise_knowledge_activities table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    user_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    action_text TEXT NOT NULL,
    time_ago TEXT NOT NULL DEFAULT 'just now',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create enterprise_knowledge_metrics table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    value_str TEXT NOT NULL,
    change_pct_str TEXT NOT NULL,
    is_increase_positive BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Indexing for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_collection ON public.enterprise_knowledge_documents(collection_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_type ON public.enterprise_knowledge_documents(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_status ON public.enterprise_knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_access ON public.enterprise_knowledge_documents(access_level);

-- 6. Row Level Security (RLS)
ALTER TABLE public.enterprise_knowledge_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_knowledge_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_knowledge_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read enterprise_knowledge_collections" ON public.enterprise_knowledge_collections FOR SELECT USING (true);
CREATE POLICY "Public read enterprise_knowledge_documents" ON public.enterprise_knowledge_documents FOR SELECT USING (true);
CREATE POLICY "Public read enterprise_knowledge_activities" ON public.enterprise_knowledge_activities FOR SELECT USING (true);
CREATE POLICY "Public read enterprise_knowledge_metrics" ON public.enterprise_knowledge_metrics FOR SELECT USING (true);

CREATE POLICY "Service full enterprise_knowledge_collections" ON public.enterprise_knowledge_collections FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service full enterprise_knowledge_documents" ON public.enterprise_knowledge_documents FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service full enterprise_knowledge_activities" ON public.enterprise_knowledge_activities FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service full enterprise_knowledge_metrics" ON public.enterprise_knowledge_metrics FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 7. Enable Supabase Realtime Publications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_collections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_collections;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_documents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_documents;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_activities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_activities;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_metrics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_metrics;
    END IF;
END $$;

-- 8. Seed Collections Data (Matching Image)
INSERT INTO public.enterprise_knowledge_collections (collection_key, name, doc_count, doc_count_str, color_theme, is_active) VALUES
('company_policy', 'Company Policy', 268, '268 docs', 'indigo', false),
('hr_knowledge', 'HR Knowledge', 142, '142 docs', 'emerald', false),
('financial_reports', 'Financial Reports', 98, '98 docs', 'blue', false),
('product_documentation', 'Product Documentation', 312, '312 docs', 'amber', false),
('market_research', 'Market Research', 178, '178 docs', 'rose', false),
('legal_documents', 'Legal Documents', 74, '74 docs', 'purple', true),
('customer_insights', 'Customer Insights', 128, '128 docs', 'teal', false),
('database', 'Database', 156, '156 docs', 'sky', false)
ON CONFLICT (collection_key) DO UPDATE SET
    name = EXCLUDED.name,
    doc_count = EXCLUDED.doc_count,
    doc_count_str = EXCLUDED.doc_count_str,
    is_active = EXCLUDED.is_active;

-- 9. Seed Documents Data (Matching Image)
INSERT INTO public.enterprise_knowledge_documents (collection_name, name, type, size_formatted, owner_name, owner_avatar, last_updated_str, status, access_level, cdn_url) VALUES
('Legal Documents', 'Data Privacy Policy 2024', 'Document', '256 KB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', '24 Apr 2025', 'Indexed', 'Team', 'https://cdn.zegaai.site/knowledge/legal/data-privacy-policy-2024.pdf'),
('Legal Documents', 'SLA Master Agreement', 'Document', '142 KB', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', '21 Apr 2025', 'Indexed', 'Team', 'https://cdn.zegaai.site/knowledge/legal/sla-master-agreement.pdf'),
('Legal Documents', 'Terms of Service', 'Document', '96 KB', 'Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', '19 Apr 2025', 'Indexed', 'Public', 'https://cdn.zegaai.site/knowledge/legal/terms-of-service.pdf'),
('Legal Documents', 'Contract Template.docx', 'Document', '512 KB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', '18 Apr 2025', 'Indexed', 'Team', 'https://cdn.zegaai.site/knowledge/legal/contract-template.docx'),
('Legal Documents', 'Compliance Guidelines', 'Website', '178 KB', 'Elen R.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', '17 Apr 2025', 'Indexed', 'Team', 'https://cdn.zegaai.site/knowledge/legal/compliance-guidelines.html'),
('Legal Documents', 'Legal Case Studies', 'Document', '74 KB', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', '16 Apr 2025', 'Indexed', 'Private', 'https://cdn.zegaai.site/knowledge/legal/case-studies.pdf'),
('Legal Documents', 'Regulatory Updates Q1', 'Database', '156 KB', 'Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', '15 Apr 2025', 'Indexed', 'Team', 'https://cdn.zegaai.site/knowledge/legal/regulatory-q1.db');

-- 10. Seed Recent Activity Data (Matching Image)
INSERT INTO public.enterprise_knowledge_activities (user_name, user_avatar, action_text, time_ago) VALUES
('Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'uploaded 12 documents', '2m ago'),
('Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', 'updated HR Policy', '15m ago'),
('Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'added 8 documents', '1h ago');

-- 11. Seed KPI Metrics Data (Matching Image)
INSERT INTO public.enterprise_knowledge_metrics (metric_key, label, value_str, change_pct_str, is_increase_positive) VALUES
('total_collections', 'TOTAL COLLECTIONS', '42', '↑ 12% vs last month', true),
('total_documents', 'TOTAL DOCUMENTS', '1,216', '↑ 18% vs last month', true),
('total_storage', 'TOTAL STORAGE', '2.34 TB', '↑ 8% vs last month', true),
('embeddings', 'EMBEDDINGS', '142.6M', '↑ 21% vs last month', true),
('avg_response_time', 'AVG. RESPONSE TIME', '45ms', '↓ 9% vs last month', true),
('users_active', 'USERS ACTIVE', '128', '↑ 15% vs last month', true)
ON CONFLICT (metric_key) DO UPDATE SET
    value_str = EXCLUDED.value_str,
    change_pct_str = EXCLUDED.change_pct_str,
    updated_at = timezone('utc'::text, now());

COMMIT;
