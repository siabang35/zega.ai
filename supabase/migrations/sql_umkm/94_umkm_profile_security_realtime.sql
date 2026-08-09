-- Migration 94: UMKM User Profile, Security & Account Preferences Realtime Schema
-- Enterprise Schema & Supabase Real-Time Setup for Overview & Profile Sub-Menu

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.umkm_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    fullname VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(100) DEFAULT 'Owner',
    store_name VARCHAR(150) DEFAULT 'Toko UMKM ZEGA',
    description TEXT,
    avatar_url TEXT,
    account_id VARCHAR(50) DEFAULT 'acc_8f7a2c9e81234',
    account_role VARCHAR(50) DEFAULT 'Owner',
    joined_date VARCHAR(50) DEFAULT '12 Maret 2025',
    account_status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_user_profiles_store_email_unique UNIQUE(store_id, email)
);

-- 2. Security Table (2FA, Recovery Contact, Password Audit)
CREATE TABLE IF NOT EXISTS public.umkm_user_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    is_2fa_enabled BOOLEAN DEFAULT true,
    recovery_email VARCHAR(150),
    recovery_phone VARCHAR(50),
    last_password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_user_security_store_email_unique UNIQUE(store_id, email)
);

-- 3. Account Preferences Table
CREATE TABLE IF NOT EXISTS public.umkm_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    language VARCHAR(50) DEFAULT 'Bahasa Indonesia',
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta (WIB)',
    date_format VARCHAR(50) DEFAULT 'DD MMM YYYY',
    number_format VARCHAR(50) DEFAULT '1.234.567,89',
    currency VARCHAR(50) DEFAULT 'IDR - Rupiah',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_user_preferences_store_unique UNIQUE(store_id)
);

-- 4. Active Sessions Table
CREATE TABLE IF NOT EXISTS public.umkm_active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    device_name VARCHAR(150) NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
    location VARCHAR(150) DEFAULT 'Jakarta, Indonesia',
    ip_address VARCHAR(50) DEFAULT '182.253.14.92',
    is_current BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing & Unique Constraints for high-performance querying and ON CONFLICT resolution
CREATE UNIQUE INDEX IF NOT EXISTS umkm_user_profiles_store_email_idx ON public.umkm_user_profiles(store_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS umkm_user_security_store_email_idx ON public.umkm_user_security(store_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS umkm_user_preferences_store_idx ON public.umkm_user_preferences(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_active_sessions_store ON public.umkm_active_sessions(store_id);

-- Enable RLS Policies
ALTER TABLE public.umkm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_active_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_user_profiles') THEN
        CREATE POLICY "Public read umkm_user_profiles" ON public.umkm_user_profiles FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_user_profiles" ON public.umkm_user_profiles FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_user_security') THEN
        CREATE POLICY "Public read umkm_user_security" ON public.umkm_user_security FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_user_security" ON public.umkm_user_security FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_user_preferences') THEN
        CREATE POLICY "Public read umkm_user_preferences" ON public.umkm_user_preferences FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_user_preferences" ON public.umkm_user_preferences FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_active_sessions') THEN
        CREATE POLICY "Public read umkm_active_sessions" ON public.umkm_active_sessions FOR SELECT USING (true);
        CREATE POLICY "Public write umkm_active_sessions" ON public.umkm_active_sessions FOR ALL USING (true);
    END IF;
END $$;

-- SEED DEMO PRODUCTION DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_user_profiles (
    store_id, fullname, email, phone, job_title, store_name, description, avatar_url, account_id, account_role, joined_date, account_status
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Cik Beriuk',
    'cikberiuk@gmail.com',
    '+62 812-3456-7890',
    'Owner',
    'Toko CikCik Beriuk',
    'Menjual berbagai kebutuhan harian, perlengkapan rumah tangga, dan produk pilihan berkualitas.',
    '/assets/avatars/user-avatar.jpg',
    'acc_8f7a2c9e81234',
    'Owner',
    '12 Maret 2025',
    'Aktif'
) ON CONFLICT (store_id, email) DO UPDATE SET
    fullname = EXCLUDED.fullname,
    phone = EXCLUDED.phone,
    job_title = EXCLUDED.job_title,
    store_name = EXCLUDED.store_name,
    description = EXCLUDED.description,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

INSERT INTO public.umkm_user_security (
    store_id, email, is_2fa_enabled, recovery_email, recovery_phone
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'cikberiuk@gmail.com',
    true,
    'cikberiuk@gmail.com',
    '+62 812-3456-7890'
) ON CONFLICT (store_id, email) DO UPDATE SET
    is_2fa_enabled = EXCLUDED.is_2fa_enabled,
    recovery_email = EXCLUDED.recovery_email,
    recovery_phone = EXCLUDED.recovery_phone,
    updated_at = NOW();

INSERT INTO public.umkm_user_preferences (
    store_id, language, timezone, date_format, number_format, currency
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Bahasa Indonesia',
    'Asia/Jakarta (WIB)',
    'DD MMM YYYY',
    '1.234.567,89',
    'IDR - Rupiah'
) ON CONFLICT (store_id) DO UPDATE SET
    language = EXCLUDED.language,
    timezone = EXCLUDED.timezone,
    date_format = EXCLUDED.date_format,
    number_format = EXCLUDED.number_format,
    currency = EXCLUDED.currency,
    updated_at = NOW();

-- Active Sessions Seed Data
INSERT INTO public.umkm_active_sessions (
    id, store_id, device_name, device_type, location, ip_address, is_current, last_active_at
) VALUES 
    ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Windows • Chrome', 'desktop', 'Jakarta, Indonesia', '182.253.14.92', true, NOW()),
    ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'iPhone 14 • iOS 17', 'mobile', 'Jakarta, Indonesia', '182.253.14.95', false, NOW() - INTERVAL '1 day'),
    ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'MacBook Air • Safari', 'laptop', 'Surabaya, Indonesia', '180.252.18.10', false, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
    last_active_at = NOW();

-- Enable Supabase Realtime for Profile Tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_user_profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_profiles;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_user_security') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_security;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_user_preferences') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_preferences;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_active_sessions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_active_sessions;
    END IF;
END $$;
