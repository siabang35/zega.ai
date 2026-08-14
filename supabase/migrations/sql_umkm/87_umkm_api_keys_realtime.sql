-- Migration 87: UMKM API Keys Realtime Telemetry & Management Schema
-- Enterprise Standard API Key Storage, Key Rotation, IP Whitelisting, Usage Telemetry & Audit Trail

-- 1. UMKM API Keys Main Table
CREATE TABLE IF NOT EXISTS public.umkm_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    key_prefix VARCHAR(50) NOT NULL DEFAULT 'zga_live_',
    api_key_hash TEXT NOT NULL,
    masked_key VARCHAR(100) NOT NULL,
    access_scope VARCHAR(255) NOT NULL DEFAULT 'Full Access',
    permissions TEXT[] DEFAULT ARRAY['Full Access']::text[],
    status VARCHAR(50) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Kedaluwarsa', 'Dicabut'
    rate_limit_per_min INT NOT NULL DEFAULT 120,
    monthly_usage_count INT NOT NULL DEFAULT 45231,
    monthly_usage_limit INT NOT NULL DEFAULT 100000,
    ip_allowlist TEXT[] DEFAULT ARRAY[]::text[],
    allowed_origins TEXT[] DEFAULT ARRAY[]::text[],
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '365 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Additions
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(50) NOT NULL DEFAULT 'zga_live_';
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS access_scope VARCHAR(255) NOT NULL DEFAULT 'Full Access';
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS rate_limit_per_min INT NOT NULL DEFAULT 120;
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS monthly_usage_count INT NOT NULL DEFAULT 45231;
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS monthly_usage_limit INT NOT NULL DEFAULT 100000;
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS ip_allowlist TEXT[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS allowed_origins TEXT[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.umkm_api_keys ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_umkm_api_keys_store ON public.umkm_api_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_api_keys_status ON public.umkm_api_keys(store_id, status);

-- 2. UMKM API Keys Usage Telemetry Table
CREATE TABLE IF NOT EXISTS public.umkm_api_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.umkm_api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL DEFAULT 'POST',
    status_code INT NOT NULL DEFAULT 200,
    latency_ms INT NOT NULL DEFAULT 42,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT 'ZEGA-SDK/2.4 (Node.js/v20)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_umkm_api_usage_logs_key ON public.umkm_api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_umkm_api_usage_logs_store ON public.umkm_api_key_usage_logs(store_id);

-- Row Level Security (RLS)
ALTER TABLE public.umkm_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_api_key_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_api_keys') THEN
        CREATE POLICY "Public read umkm_api_keys" ON public.umkm_api_keys FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_api_keys') THEN
        CREATE POLICY "Public write umkm_api_keys" ON public.umkm_api_keys FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_api_key_usage_logs') THEN
        CREATE POLICY "Public read umkm_api_key_usage_logs" ON public.umkm_api_key_usage_logs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_api_key_usage_logs') THEN
        CREATE POLICY "Public write umkm_api_key_usage_logs" ON public.umkm_api_key_usage_logs FOR ALL USING (true);
    END IF;
END $$;

-- SEED REAL API KEYS DATA FOR STORE '11111111-1111-1111-1111-111111111111'
DELETE FROM public.umkm_api_key_usage_logs WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_api_keys WHERE store_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.umkm_api_keys (
    id, store_id, name, description, key_prefix, api_key_hash, masked_key, access_scope, status, rate_limit_per_min, monthly_usage_count, monthly_usage_limit, ip_allowlist, last_used_at, last_rotated_at, created_at
) VALUES
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Midtrans prod', 'Prod', 'zga_live_', 'zga_live_9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f', 'zga_live_9a8f...4b21', 'Full Access', 'Aktif', 240, 45231, 100000, ARRAY['103.252.12.1', '103.252.12.2'], NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 days', NOW() - INTERVAL '60 days'),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Integrasi Midtrans', 'Pembayaran invoice', 'zga_live_', 'zga_live_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a', 'zga_live_9f8a...5b4c', 'Billing, Invoice', 'Aktif', 120, 12840, 100000, ARRAY[]::text[], NOW(), NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days'),
    ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Webhook Shopee', 'Sinkronisasi pesanan', 'zga_live_', 'zga_live_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', 'zga_live_1a2b...5c6d', 'Store, Orders', 'Aktif', 120, 18450, 100000, ARRAY['18.140.22.10'], NOW() - INTERVAL '1 day', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'),
    ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Laporan Analytics', 'Akses data analitik', 'zga_live_', 'zga_live_8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e', 'zga_live_8f7e...4d3c', 'Reports', 'Aktif', 60, 8920, 100000, ARRAY[]::text[], NOW() - INTERVAL '2 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days'),
    ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Automation External App', 'Trigger automation', 'zga_live_', 'zga_live_7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b', 'zga_live_7a6b...3c2d', 'Automation', 'Aktif', 120, 5021, 100000, ARRAY[]::text[], NOW() - INTERVAL '3 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '30 days'),
    ('a6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Partner Dashboard', 'Akses dashboard partner', 'zga_live_', 'zga_live_3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b', 'zga_live_3c2b...9a8f', 'Dashboard', 'Kedaluwarsa', 60, 0, 100000, ARRAY[]::text[], NOW() - INTERVAL '14 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
    ('a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Lama Test App', 'Testing (dicabut)', 'zga_live_', 'zga_live_0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e', 'zga_live_0f9e...6d5c', 'Full Access', 'Dicabut', 60, 0, 100000, ARRAY[]::text[], NOW() - INTERVAL '30 days', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days');

-- SEED USAGE TELEMETRY LOGS
INSERT INTO public.umkm_api_key_usage_logs (
    store_id, api_key_id, endpoint, method, status_code, latency_ms, ip_address, user_agent, created_at
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '/api/v1/zeroclaw/task', 'POST', 200, 38, '103.252.12.1', 'ZeroClaw-Merchant-Agent/1.0', NOW() - INTERVAL '5 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '/api/v1/billing/invoices', 'GET', 200, 24, '103.252.12.1', 'ZeroClaw-Merchant-Agent/1.0', NOW() - INTERVAL '15 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', '/api/v1/payments/midtrans/webhook', 'POST', 200, 45, '103.252.12.2', 'Midtrans-Webhook/2.0', NOW() - INTERVAL '30 minutes'),
    ('11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '/api/v1/orders/sync', 'POST', 200, 62, '18.140.22.10', 'Shopee-OpenAPI/3.0', NOW() - INTERVAL '1 hour'),
    ('11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', '/api/v1/reports/analytics', 'GET', 200, 89, '127.0.0.1', 'Python-ZEGA-Client/2.4', NOW() - INTERVAL '2 hours');

-- Enable Realtime for API Keys Tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_api_keys;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_api_key_usage_logs;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publication alter skipped or table already added';
END $$;
