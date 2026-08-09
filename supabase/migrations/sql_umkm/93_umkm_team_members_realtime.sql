-- Migration 93: UMKM Settings Team Members Supabase Realtime Schema
-- Standard Enterprise Schema & Supabase Real-Time Setup for Tim & Pengguna Sub-Menu

-- 1. Team Members Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Sales Agent',
    department VARCHAR(50) NOT NULL DEFAULT 'General',
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    avatar_url TEXT,
    phone VARCHAR(50),
    tasks_completed INT DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 95.00,
    total_sales_handled NUMERIC(15,2) DEFAULT 0,
    recent_activity TEXT,
    bio TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    permissions_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_team_members_store_email_unique UNIQUE(store_id, email)
);

-- Defensive Column Additions
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'General';
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS tasks_completed INT DEFAULT 0;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5,2) DEFAULT 95.00;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS total_sales_handled NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS recent_activity TEXT;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS permissions_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.umkm_settings_team_members ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_umkm_team_members_store ON public.umkm_settings_team_members(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_team_members_email ON public.umkm_settings_team_members(email);
CREATE INDEX IF NOT EXISTS idx_umkm_team_members_role ON public.umkm_settings_team_members(role);
CREATE INDEX IF NOT EXISTS idx_umkm_team_members_department ON public.umkm_settings_team_members(department);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_settings_team_members ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Store Owners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_settings_team_members') THEN
        CREATE POLICY "Public read umkm_settings_team_members" ON public.umkm_settings_team_members FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_settings_team_members') THEN
        CREATE POLICY "Public write umkm_settings_team_members" ON public.umkm_settings_team_members FOR ALL USING (true);
    END IF;
END $$;

-- SEED PRODUCTION DEMO DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_settings_team_members (
    store_id, name, email, role, department, status, avatar_url, phone, tasks_completed, performance_score, total_sales_handled, recent_activity, bio, permissions_json
)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Cik Berluk', 'cikberluk@gmail.com', 'Owner', 'Executive', 'Aktif', '/assets/logo/zega.png', '+62 812-9988-7766', 342, 99.50, 485000000.00, 'Menyetujui alokasi budget marketing Q3', 'Founder & Managing Director toko online ZEGA AI.', '["all"]'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'Ahmad Subagja', 'ahmad.subagja@zega.ai', 'Admin', 'Operational', 'Aktif', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '+62 813-1122-3344', 215, 97.80, 125000000.00, 'Mengonfigurasi bot saluran Shopee & WA', 'General Manager Operasional & Manajemen Staf.', '["manage_team", "view_reports", "manage_settings"]'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'Siti Sarah', 'siti.sarah@zega.ai', 'Sales Agent', 'Customer Support', 'Aktif', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '+62 815-5566-7788', 188, 98.40, 78200000.00, 'Menutup 42 tiket pesanan WhatsApp hari ini', 'Senior Sales & Customer Relationship Officer.', '["chat", "crm_write"]'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'Budi Kurniawan', 'budi.kurniawan@zega.ai', 'Finance', 'Finance & Accounting', 'Pending', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '+62 817-8899-0011', 94, 94.20, 164000000.00, 'Menverifikasi pembukuan faktur Midtrans bulan lalu', 'Finance Controller & Payroll Specialist.', '["billing_read", "finance_write"]'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'Maya Rosida', 'maya.rosida@zega.ai', 'Developer', 'Engineering', 'Aktif', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '+62 819-2233-4455', 156, 99.10, 0.00, 'Memperbarui webhook endpoint x402 Solana RPC', 'Lead System Engineer & API Integration Specialist.', '["api_keys", "webhooks"]'::jsonb)
ON CONFLICT (store_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    status = EXCLUDED.status,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    tasks_completed = EXCLUDED.tasks_completed,
    performance_score = EXCLUDED.performance_score,
    total_sales_handled = EXCLUDED.total_sales_handled,
    recent_activity = EXCLUDED.recent_activity,
    bio = EXCLUDED.bio,
    permissions_json = EXCLUDED.permissions_json,
    updated_at = NOW();

-- Enable Supabase Realtime for umkm_settings_team_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'umkm_settings_team_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_team_members;
    END IF;
END $$;
