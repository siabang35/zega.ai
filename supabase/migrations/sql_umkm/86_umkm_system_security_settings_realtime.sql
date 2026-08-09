-- Migration 86: UMKM System & Security Settings Realtime Telemetry & Session Management
-- Standard Enterprise Schema & Real-Time Setup

-- 1. System Health Telemetry Table
CREATE TABLE IF NOT EXISTS public.umkm_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    service_key VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Terhubung', -- 'Terhubung', '100% Operational', 'Aktif & Mendengarkan', 'Online (Port 3001)', 'Degraded', 'Offline'
    ping_ms INT NOT NULL DEFAULT 15,
    uptime_percent NUMERIC(5,2) NOT NULL DEFAULT 99.99,
    details TEXT DEFAULT 'Konektivitas normal',
    last_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_umkm_system_health_store_service UNIQUE (store_id, service_key)
);

-- 2. System Audit Trail Logs Table
CREATE TABLE IF NOT EXISTS public.umkm_system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    event_action VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL DEFAULT 'owner@toko.com',
    ip_address VARCHAR(100) NOT NULL DEFAULT '182.253.12.98',
    device_info VARCHAR(255) NOT NULL DEFAULT 'Chrome 127.0 (Windows 11)',
    location VARCHAR(100) NOT NULL DEFAULT 'Jakarta, Indonesia',
    status VARCHAR(50) NOT NULL DEFAULT 'Success', -- 'Success', 'Warning', 'Failed'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Security Settings Table (Defensively Add Columns if table already exists)
CREATE TABLE IF NOT EXISTS public.umkm_settings_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT true,
    two_factor_method VARCHAR(100) NOT NULL DEFAULT 'Authenticator App',
    magic_link_login BOOLEAN NOT NULL DEFAULT false,
    new_device_verify BOOLEAN NOT NULL DEFAULT true,
    ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT false,
    ip_allowlist TEXT[] DEFAULT ARRAY['182.253.12.98', '114.122.34.12']::text[],
    security_score INT NOT NULL DEFAULT 94,
    last_password_change TIMESTAMPTZ NOT NULL DEFAULT (NOW() - INTERVAL '45 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist even if umkm_settings_security was created previously
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(100) NOT NULL DEFAULT 'Authenticator App';
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS magic_link_login BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS new_device_verify BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS ip_allowlist TEXT[] DEFAULT ARRAY['182.253.12.98', '114.122.34.12']::text[];
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS security_score INT NOT NULL DEFAULT 94;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ NOT NULL DEFAULT (NOW() - INTERVAL '45 days');

-- 4. User Active Sessions Table
CREATE TABLE IF NOT EXISTS public.umkm_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL DEFAULT 'cikberiuk@gmail.com',
    device_name VARCHAR(255) NOT NULL DEFAULT 'Windows 11 PC',
    browser VARCHAR(100) NOT NULL DEFAULT 'Chrome 127.0',
    os VARCHAR(100) NOT NULL DEFAULT 'Windows',
    location VARCHAR(100) NOT NULL DEFAULT 'Jakarta, Indonesia',
    ip_address VARCHAR(100) NOT NULL DEFAULT '182.253.12.98',
    is_current BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast real-time queries
CREATE INDEX IF NOT EXISTS idx_umkm_system_health_store ON public.umkm_system_health(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_system_audit_logs_store_created ON public.umkm_system_audit_logs(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_user_sessions_store_active ON public.umkm_user_sessions(store_id, is_active);

-- Enable RLS
ALTER TABLE public.umkm_system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_sessions ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Store Owners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_system_health') THEN
        CREATE POLICY "Public read umkm_system_health" ON public.umkm_system_health FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_system_health') THEN
        CREATE POLICY "Public write umkm_system_health" ON public.umkm_system_health FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_system_audit_logs') THEN
        CREATE POLICY "Public read umkm_system_audit_logs" ON public.umkm_system_audit_logs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_system_audit_logs') THEN
        CREATE POLICY "Public write umkm_system_audit_logs" ON public.umkm_system_audit_logs FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_settings_security') THEN
        CREATE POLICY "Public read umkm_settings_security" ON public.umkm_settings_security FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_settings_security') THEN
        CREATE POLICY "Public write umkm_settings_security" ON public.umkm_settings_security FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_user_sessions') THEN
        CREATE POLICY "Public read umkm_user_sessions" ON public.umkm_user_sessions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_user_sessions') THEN
        CREATE POLICY "Public write umkm_user_sessions" ON public.umkm_user_sessions FOR ALL USING (true);
    END IF;
END $$;

-- SEED REAL DATA FOR DEMO STORE
INSERT INTO public.umkm_system_health (store_id, service_name, service_key, status, ping_ms, uptime_percent, details, last_check_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Supabase PostgreSQL DB', 'supabase_db', 'Terhubung', 18, 99.99, 'Koneksi database PostgreSQL utama aktif & sehat', NOW()),
    ('11111111-1111-1111-1111-111111111111', 'Cloudflare R2 CDN', 'cloudflare_r2', '100% Operational', 14, 100.00, 'Bucket cdn.zegaai.site merespons cepat (<20ms)', NOW()),
    ('11111111-1111-1111-1111-111111111111', 'Supabase Realtime Channel', 'supabase_realtime', 'Aktif & Mendengarkan', 22, 99.98, 'WebSocket channel terhubung secara live', NOW()),
    ('11111111-1111-1111-1111-111111111111', 'ZEGA AI Runtime Gateway', 'zega_ai_gateway', 'Online (Port 3001)', 11, 99.95, 'Gateway AI Node.js / Rust ZeroClaw aktif', NOW())
ON CONFLICT (store_id, service_key) DO UPDATE SET
    status = EXCLUDED.status,
    ping_ms = EXCLUDED.ping_ms,
    uptime_percent = EXCLUDED.uptime_percent,
    details = EXCLUDED.details,
    last_check_at = NOW();

INSERT INTO public.umkm_settings_security (store_id, two_factor_enabled, two_factor_method, magic_link_login, new_device_verify, ip_allowlist_enabled, ip_allowlist, security_score, last_password_change)
VALUES
    ('11111111-1111-1111-1111-111111111111', true, 'Authenticator App (TOTP)', false, true, false, ARRAY['182.253.12.98', '114.122.34.12']::text[], 94, NOW() - INTERVAL '32 days')
ON CONFLICT (store_id) DO UPDATE SET
    two_factor_enabled = EXCLUDED.two_factor_enabled,
    two_factor_method = EXCLUDED.two_factor_method,
    magic_link_login = EXCLUDED.magic_link_login,
    new_device_verify = EXCLUDED.new_device_verify,
    ip_allowlist_enabled = EXCLUDED.ip_allowlist_enabled,
    ip_allowlist = EXCLUDED.ip_allowlist,
    security_score = EXCLUDED.security_score,
    updated_at = NOW();

-- Seed Active User Sessions
DELETE FROM public.umkm_user_sessions WHERE store_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO public.umkm_user_sessions (store_id, user_email, device_name, browser, os, location, ip_address, is_current, is_active, last_active_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'cikberiuk@gmail.com', 'Windows PC', 'Chrome 127.0', 'Windows 11', 'Jakarta, Indonesia', '182.253.12.98', true, true, NOW()),
    ('11111111-1111-1111-1111-111111111111', 'cikberiuk@gmail.com', 'iPhone 15 Pro', 'Safari Mobile', 'iOS 17.5', 'Jakarta, Indonesia', '182.253.12.99', false, true, NOW() - INTERVAL '45 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'cikberiuk@gmail.com', 'MacBook Air M2', 'Safari 17.2', 'macOS Sonoma', 'Surabaya, Indonesia', '114.122.34.12', false, true, NOW() - INTERVAL '2 days');

-- Seed System Audit Trail Logs
INSERT INTO public.umkm_system_audit_logs (store_id, event_action, user_email, ip_address, device_info, location, status, details)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'USER_LOGIN_SUCCESS', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"auth_method": "2FA TOTP"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'DATABASE_CACHE_SYNC', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"action": "manual_sync", "latency_ms": 18}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'SECURITY_2FA_ENABLED', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"method": "Google Authenticator"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'API_KEY_ROTATED', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"key_name": "Production Store Webhook"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'SESSION_REVOKED_REMOTE', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Warning', '{"revoked_device": "Android Chrome"}'::jsonb);

-- Enable Realtime for System & Security tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_system_health;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_system_audit_logs;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_security;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_sessions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publication alter skipped or already added';
END $$;
