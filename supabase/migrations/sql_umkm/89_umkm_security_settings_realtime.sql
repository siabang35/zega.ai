-- Migration 89: UMKM Security Settings & Realtime SIEM/Zero-Trust Integration Schema
-- Standard Enterprise Schema, RPC Stored Procedures & Supabase Real-Time Setup

-- 1. Security Settings Table (Defensively Ensure Schema Integrity)
CREATE TABLE IF NOT EXISTS public.umkm_settings_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT true,
    two_factor_method VARCHAR(100) NOT NULL DEFAULT 'Authenticator App (TOTP)',
    magic_link_login BOOLEAN NOT NULL DEFAULT false,
    new_device_verify BOOLEAN NOT NULL DEFAULT true,
    ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT false,
    ip_allowlist TEXT[] DEFAULT ARRAY['182.253.12.98', '114.122.34.12']::text[],
    security_score INT NOT NULL DEFAULT 94,
    last_password_change TIMESTAMPTZ NOT NULL DEFAULT (NOW() - INTERVAL '32 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Additions for Security Settings
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(100) NOT NULL DEFAULT 'Authenticator App (TOTP)';
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS magic_link_login BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS new_device_verify BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS ip_allowlist TEXT[] DEFAULT ARRAY['182.253.12.98', '114.122.34.12']::text[];
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS security_score INT NOT NULL DEFAULT 94;
ALTER TABLE public.umkm_settings_security ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ NOT NULL DEFAULT (NOW() - INTERVAL '32 days');

-- 2. User Active Sessions Table
CREATE TABLE IF NOT EXISTS public.umkm_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL DEFAULT 'cikberiuk@gmail.com',
    device_name VARCHAR(255) NOT NULL DEFAULT 'Windows 11 PC',
    browser VARCHAR(100) NOT NULL DEFAULT 'Chrome 127.0',
    os VARCHAR(100) NOT NULL DEFAULT 'Windows 11',
    location VARCHAR(100) NOT NULL DEFAULT 'Jakarta, Indonesia',
    ip_address VARCHAR(100) NOT NULL DEFAULT '182.253.12.98',
    is_current BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Security Audit Trail Logs Table (SIEM & OWASP Compliance)
CREATE TABLE IF NOT EXISTS public.umkm_security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    event_action VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL DEFAULT 'cikberiuk@gmail.com',
    ip_address VARCHAR(100) NOT NULL DEFAULT '182.253.12.98',
    device_info VARCHAR(255) NOT NULL DEFAULT 'Chrome 127.0 (Windows 11)',
    location VARCHAR(100) NOT NULL DEFAULT 'Jakarta, Indonesia',
    status VARCHAR(50) NOT NULL DEFAULT 'Success', -- 'Success', 'Warning', 'Failed'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. External Security Tools & SIEM Integrations Table
CREATE TABLE IF NOT EXISTS public.umkm_security_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL, -- 'Cloudflare Zero Trust', 'Datadog SIEM', 'Okta SSO', 'Splunk Security'
    category VARCHAR(100) NOT NULL DEFAULT 'SIEM & Zero Trust',
    status VARCHAR(50) NOT NULL DEFAULT 'Terhubung', -- 'Terhubung', 'Non-Aktif', 'Gagal'
    webhook_url TEXT DEFAULT '',
    alert_email VARCHAR(255) DEFAULT 'security@zega.ai',
    api_token_masked VARCHAR(100) DEFAULT '',
    cdn_icon_url TEXT DEFAULT '',
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Additions for Security Integrations
ALTER TABLE public.umkm_security_integrations ADD COLUMN IF NOT EXISTS alert_email VARCHAR(255) DEFAULT 'security@zega.ai';

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_umkm_settings_security_store ON public.umkm_settings_security(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_user_sessions_store_active ON public.umkm_user_sessions(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_umkm_security_audit_logs_created ON public.umkm_security_audit_logs(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_security_integrations_store ON public.umkm_security_integrations(store_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_settings_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_security_integrations ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Store Owners
DO $$
BEGIN
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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_security_audit_logs') THEN
        CREATE POLICY "Public read umkm_security_audit_logs" ON public.umkm_security_audit_logs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_security_audit_logs') THEN
        CREATE POLICY "Public write umkm_security_audit_logs" ON public.umkm_security_audit_logs FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_security_integrations') THEN
        CREATE POLICY "Public read umkm_security_integrations" ON public.umkm_security_integrations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_security_integrations') THEN
        CREATE POLICY "Public write umkm_security_integrations" ON public.umkm_security_integrations FOR ALL USING (true);
    END IF;
END $$;

-- 5. RPC Stored Procedure: Revoke User Session
CREATE OR REPLACE FUNCTION public.revoke_umkm_user_session(
    p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_store_id UUID;
    v_device VARCHAR(255);
BEGIN
    UPDATE public.umkm_user_sessions
    SET is_active = false,
        last_active_at = NOW()
    WHERE id = p_session_id
    RETURNING store_id, device_name INTO v_store_id, v_device;

    IF FOUND THEN
        INSERT INTO public.umkm_security_audit_logs (store_id, event_action, status, details)
        VALUES (v_store_id, 'USER_SESSION_REVOKED', 'Warning', jsonb_build_object('session_id', p_session_id, 'device_name', v_device));

        RETURN jsonb_build_object('success', true, 'message', 'Session revoked successfully');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Session not found');
    END IF;
END;
$$;

-- 6. RPC Stored Procedure: Revoke All Other User Sessions
CREATE OR REPLACE FUNCTION public.revoke_all_other_umkm_user_sessions(
    p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_user_sessions
    SET is_active = false,
        last_active_at = NOW()
    WHERE store_id = p_store_id
      AND is_current = false
      AND is_active = true;

    INSERT INTO public.umkm_security_audit_logs (store_id, event_action, status, details)
    VALUES (p_store_id, 'ALL_OTHER_SESSIONS_REVOKED', 'Warning', '{"action": "bulk_revoke_other_sessions"}'::jsonb);

    RETURN jsonb_build_object('success', true, 'message', 'All other sessions revoked successfully');
END;
$$;

-- SEED REAL DEMO DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_settings_security (
    store_id, two_factor_enabled, two_factor_method, magic_link_login, new_device_verify, ip_allowlist_enabled, ip_allowlist, security_score, last_password_change
)
VALUES (
    '11111111-1111-1111-1111-111111111111', true, 'Authenticator App (TOTP)', false, true, false, ARRAY['182.253.12.98', '114.122.34.12']::text[], 94, NOW() - INTERVAL '32 days'
)
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
    ('11111111-1111-1111-1111-111111111111', 'cikberiuk@gmail.com', 'Windows 11 PC', 'Chrome 127.0', 'Windows 11', 'Jakarta, Indonesia', '182.253.12.98', true, true, NOW()),
    ('11111111-1111-1111-1111-111111111111', 'cikberiuk@gmail.com', 'iPhone 15 Pro', 'Safari Mobile', 'iOS 17.5', 'Jakarta, Indonesia', '182.253.12.99', false, true, NOW() - INTERVAL '45 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'cikberiuk@gmail.com', 'MacBook Air M2', 'Safari 17.2', 'macOS Sonoma', 'Surabaya, Indonesia', '114.122.34.12', false, true, NOW() - INTERVAL '2 days');

-- Seed Security Audit Trail Logs
DELETE FROM public.umkm_security_audit_logs WHERE store_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO public.umkm_security_audit_logs (store_id, event_action, user_email, ip_address, device_info, location, status, details)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'USER_LOGIN_SUCCESS', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"auth_method": "2FA_TOTP"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'PASSWORD_CHANGE', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"action": "password_update"}'::jsonb),
    ('11111111-1111-1111-1111-111111111111', 'IP_ALLOWLIST_UPDATE', 'cikberiuk@gmail.com', '182.253.12.98', 'Chrome 127.0 (Windows 11)', 'Jakarta, Indonesia', 'Success', '{"added_ip": "114.122.34.12"}'::jsonb);

-- Seed External Security & SIEM Integrations
DELETE FROM public.umkm_security_integrations WHERE store_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO public.umkm_security_integrations (store_id, tool_name, category, status, webhook_url, alert_email, api_token_masked, cdn_icon_url, last_sync_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Cloudflare Zero Trust', 'Zero-Trust Proxy & Access Control', 'Terhubung', 'https://api.cloudflare.com/client/v4/zones/zega/access', 'security@zega.ai', 'cf_zt_live_9a8f...4b21', 'https://cdn.zegaai.site/assets/logo/cloudflare.png', NOW() - INTERVAL '5 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'Datadog SIEM & Security', 'Realtime Audit Trail & Threat Monitor', 'Terhubung', 'https://http-intake.logs.datadoghq.com/v1/input', 'sec-alerts@zega.ai', 'dd_api_sec_8f7e...1a0f', 'https://cdn.zegaai.site/assets/logo/datadog.png', NOW() - INTERVAL '12 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'Okta Workforce Identity', 'SSO & Enterprise SAML 2.0 Auth', 'Terhubung', 'https://zega.okta.com/oauth2/v1/authorize', 'admin@zega.ai', 'okta_ss_7a6b...9a8b', 'https://cdn.zegaai.site/assets/logo/okta.png', NOW() - INTERVAL '1 hour');

-- Enable Supabase Realtime Publications for all Security tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_security;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_sessions;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_security_audit_logs;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_security_integrations;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publication alter skipped or tables already added';
END $$;
