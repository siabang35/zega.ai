-- ============================================================================
-- MIGRATION 16: Enterprise Knowledge Hub Datasets, Databases & Websites Tables
-- Target Workspace: ZEGA Enterprise AI Operating System
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/16_enterprise_knowledge_hub_tab_views_realtime.sql
-- ============================================================================

BEGIN;

-- 1. Create enterprise_knowledge_datasets table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'CSV',
    collection_name TEXT NOT NULL DEFAULT 'Market Research',
    rows_count_str TEXT NOT NULL DEFAULT '2.3M',
    size_formatted TEXT NOT NULL DEFAULT '120 MB',
    owner_name TEXT NOT NULL DEFAULT 'Elena R.',
    owner_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces',
    last_updated_str TEXT NOT NULL DEFAULT '18 Apr 2025',
    status TEXT NOT NULL DEFAULT 'Indexed',
    access_level TEXT NOT NULL DEFAULT 'Private',
    cdn_url TEXT DEFAULT 'https://cdn.zegaai.site/datasets/customer-segmentation.csv',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create enterprise_knowledge_databases table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'PostgreSQL',
    host TEXT NOT NULL DEFAULT 'db-prod-01.company.com',
    collection_name TEXT NOT NULL DEFAULT 'Customer Data',
    tables_count INTEGER NOT NULL DEFAULT 245,
    size_formatted TEXT NOT NULL DEFAULT '120 GB',
    owner_name TEXT NOT NULL DEFAULT 'Alex M.',
    owner_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    last_sync_str TEXT NOT NULL DEFAULT 'Today, 09:05',
    status TEXT NOT NULL DEFAULT 'Connected',
    access_level TEXT NOT NULL DEFAULT 'Team',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create enterprise_knowledge_websites table
CREATE TABLE IF NOT EXISTS public.enterprise_knowledge_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    collection_name TEXT NOT NULL DEFAULT 'Company Assets',
    frequency TEXT NOT NULL DEFAULT 'Daily',
    last_crawled_str TEXT NOT NULL DEFAULT 'Today, 08:45',
    status TEXT NOT NULL DEFAULT 'Success',
    pages_count INTEGER NOT NULL DEFAULT 1245,
    access_level TEXT NOT NULL DEFAULT 'Team',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Indexing for High Performance
CREATE INDEX IF NOT EXISTS idx_knowledge_datasets_format ON public.enterprise_knowledge_datasets(format);
CREATE INDEX IF NOT EXISTS idx_knowledge_databases_type ON public.enterprise_knowledge_databases(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_websites_status ON public.enterprise_knowledge_websites(status);

-- 5. Row Level Security (RLS)
ALTER TABLE public.enterprise_knowledge_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_knowledge_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_knowledge_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read enterprise_knowledge_datasets" ON public.enterprise_knowledge_datasets FOR SELECT USING (true);
CREATE POLICY "Public read enterprise_knowledge_databases" ON public.enterprise_knowledge_databases FOR SELECT USING (true);
CREATE POLICY "Public read enterprise_knowledge_websites" ON public.enterprise_knowledge_websites FOR SELECT USING (true);

CREATE POLICY "Service full enterprise_knowledge_datasets" ON public.enterprise_knowledge_datasets FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service full enterprise_knowledge_databases" ON public.enterprise_knowledge_databases FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Service full enterprise_knowledge_websites" ON public.enterprise_knowledge_websites FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 6. Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_datasets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_datasets;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_databases'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_databases;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'enterprise_knowledge_websites'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_knowledge_websites;
    END IF;
END $$;

-- 7. Seed Datasets Data (Matching Reference Design 2)
INSERT INTO public.enterprise_knowledge_datasets (name, description, format, collection_name, rows_count_str, size_formatted, owner_name, owner_avatar, last_updated_str, status, access_level) VALUES
('Customer Segmentation', 'Data pelanggan untuk segmentasi pasar dan personalisasi', 'CSV', 'Market Research', '2.3M', '120 MB', 'Elena R.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', '18 Apr 2025', 'Indexed', 'Private'),
('Sales Transactions 2024', 'Transaksi penjualan tahun 2024 seluruh cabang', 'CSV', 'Financial Data', '8.7M', '320 MB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', '17 Apr 2025', 'Indexed', 'Team'),
('Website Analytics', 'Data trafik website dan perilaku pengguna', 'CSV', 'Analytics', '5.4M', '85 MB', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', '16 Apr 2025', 'Indexed', 'Public'),
('Product Catalog', 'Katalog produk terbaru dan spesifikasi teknis', 'JSON', 'Product Data', '125K', '12 GB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', '15 Apr 2025', 'Indexed', 'Public'),
('HR Employee Data', 'Data karyawan dan struktur organisasi', 'JSON', 'HR Data', '45K', '6.2 GB', 'Elena R.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', '14 Apr 2025', 'Processing', 'Team'),
('Inventory Stock', 'Stok inventori seluruh gudang secara real-time', 'Parquet', 'Operations', '1.2M', '45 GB', 'Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', '13 Apr 2025', 'Indexed', 'Team'),
('Marketing Campaigns', 'Performa kampanye marketing Q1 & Q2', 'CSV', 'Marketing', '900K', '10 GB', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', '12 Apr 2025', 'Indexed', 'Team'),
('Support Tickets', 'Data tiket support customer dan penyelesaian', 'CSV', 'Customer Service', '3.4M', '74 GB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', '11 Apr 2025', 'Indexed', 'Team');

-- 8. Seed Databases Data (Matching Reference Design 3)
INSERT INTO public.enterprise_knowledge_databases (name, type, host, collection_name, tables_count, size_formatted, owner_name, owner_avatar, last_sync_str, status, access_level) VALUES
('Customer DB', 'PostgreSQL', 'db-prod-01.company.com', 'Customer Data', 245, '120 GB', 'Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'Today, 09:05', 'Connected', 'Team'),
('Analytics Warehouse', 'BigQuery', 'bigquery.company.com', 'Analytics', 156, '2.8 TB', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', 'Today, 08:50', 'Connected', 'Team'),
('Sales DB', 'MySQL', 'mysql-prod.company.com', 'Financial Data', 98, '60 GB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'Today, 08:35', 'Connected', 'Team'),
('Product DB', 'PostgreSQL', 'db-prod-02.company.com', 'Product Data', 187, '80 GB', 'Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'Yesterday, 22:40', 'Connected', 'Team'),
('HR Database', 'SQL Server', 'sql-hr.company.com', 'HR Data', 72, '32 GB', 'Elena R.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces', 'Yesterday, 22:15', 'Connected', 'Team'),
('Marketing DB', 'MongoDB', 'mongo.company.com', 'Marketing', 45, '16 GB', 'Sarah K.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', 'Yesterday, 21:05', 'Connected', 'Public'),
('Inventory DB', 'PostgreSQL', 'db-ops.company.com', 'Operations', 166, '64 GB', 'Wildan A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'Yesterday, 20:30', 'Disconnected', 'Private'),
('Backup Archive', 'S3', 's3://company-backup', 'Backup & Archive', 356, '1.2 TB', 'Alex M.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', '2 Days Ago', 'Connected', 'Private');

-- 9. Seed Websites Data (Matching Reference Design 4)
INSERT INTO public.enterprise_knowledge_websites (url, description, collection_name, frequency, last_crawled_str, status, pages_count, access_level) VALUES
('https://www.company.com', 'Website utama perusahaan', 'Company Assets', 'Daily', 'Today, 08:45', 'Success', 1245, 'Team'),
('https://investor.company.com', 'Halaman investor relations', 'Investor Relations', 'Daily', 'Today, 08:30', 'Success', 356, 'Team'),
('https://blog.company.com', 'Blog dan artikel perusahaan', 'Content Marketing', 'Daily', 'Today, 07:50', 'Success', 2187, 'Public'),
('https://docs.company.com', 'Dokumentasi produk', 'Documentation', 'Weekly', 'Yesterday, 23:10', 'Success', 3455, 'Team'),
('https://competitor-a.com', 'Website kompetitor A', 'Competitor Analysis', 'Daily', 'Today, 06:00', 'Success', 987, 'Private'),
('https://news.company.com', 'Newsroom perusahaan', 'Company News', 'Weekly', 'Today, 05:45', 'Warning', 642, 'Public'),
('https://partners.company.com', 'Portal untuk partner', 'Partner Portal', 'Weekly', '2 Days Ago', 'Success', 1023, 'Public'),
('https://careers.company.com', 'Halaman karir', 'HR & Careers', 'Daily', 'Today, 08:10', 'Success', 788, 'Public');

COMMIT;
