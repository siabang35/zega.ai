-- Migration 92: UMKM Settings Integrations Supabase Realtime Schema
-- Standard Enterprise Schema & Supabase Real-Time Setup for Integrations Sub-Menu

-- 1. Integrations Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    integration_key VARCHAR(50) NOT NULL,
    integration_name VARCHAR(100),
    name VARCHAR(100),
    category VARCHAR(50) NOT NULL DEFAULT 'Channel Penjualan',
    status VARCHAR(50) NOT NULL DEFAULT 'Terhubung',
    account_identifier VARCHAR(255) NOT NULL,
    api_endpoint TEXT,
    api_key_masked VARCHAR(255),
    webhook_secret_masked VARCHAR(255),
    config_json JSONB DEFAULT '{}'::jsonb,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_settings_integrations_store_key_unique UNIQUE(store_id, integration_key)
);

-- Defensive Column Additions & Constraint Fixes
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS integration_name VARCHAR(100);
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.umkm_settings_integrations ALTER COLUMN integration_name DROP NOT NULL;
ALTER TABLE public.umkm_settings_integrations ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'Channel Penjualan';
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Terhubung';
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS account_identifier VARCHAR(255) NOT NULL DEFAULT '-';
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS api_endpoint TEXT;
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS api_key_masked VARCHAR(255);
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS webhook_secret_masked VARCHAR(255);
ALTER TABLE public.umkm_settings_integrations ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}'::jsonb;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_umkm_settings_integrations_store ON public.umkm_settings_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_settings_integrations_key ON public.umkm_settings_integrations(integration_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_settings_integrations ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Store Owners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_settings_integrations') THEN
        CREATE POLICY "Public read umkm_settings_integrations" ON public.umkm_settings_integrations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_settings_integrations') THEN
        CREATE POLICY "Public write umkm_settings_integrations" ON public.umkm_settings_integrations FOR ALL USING (true);
    END IF;
END $$;

-- SEED PRODUCTION DEMO DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_settings_integrations (
    store_id, integration_key, integration_name, name, category, status, account_identifier, api_endpoint, api_key_masked, webhook_secret_masked
)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'wa', 'WhatsApp Business', 'WhatsApp Business', 'Channel Penjualan', 'Terhubung', '+62 812-3456-7890', 'https://zega-ai.onrender.com/api/v1/whatsapp/webhook', 'wa_live_••••••••••••34a1', 'whsec_••••••••••••881a'),
    ('11111111-1111-1111-1111-111111111111', 'ig', 'Instagram', 'Instagram', 'Social Commerce', 'Terhubung', '@tokocikcik.berluk', 'https://zega-ai.onrender.com/api/v1/meta/webhook', 'meta_live_••••••••••••721b', 'whsec_••••••••••••992c'),
    ('11111111-1111-1111-1111-111111111111', 'shopee', 'Shopee', 'Shopee', 'Channel Penjualan', 'Terhubung', 'tokocikcik.berluk', 'https://zega-ai.onrender.com/api/v1/shopee/webhook', 'shp_live_••••••••••••102c', 'whsec_••••••••••••331d'),
    ('11111111-1111-1111-1111-111111111111', 'tiktok', 'TikTok Shop', 'TikTok Shop', 'Social Commerce', 'Terhubung', '@tokocikcik.berluk', 'https://zega-ai.onrender.com/api/v1/tiktok/webhook', 'ttk_live_••••••••••••551e', 'whsec_••••••••••••442f'),
    ('11111111-1111-1111-1111-111111111111', 'stripe', 'Stripe Connect', 'Stripe Connect', 'Payment Gateway', 'Terhubung', '•••• •••• 4242', 'https://zega-ai.onrender.com/api/v1/stripe/webhook', 'sk_live_••••••••••••9900', 'whsec_••••••••••••1122'),
    ('11111111-1111-1111-1111-111111111111', 'midtrans', 'Midtrans', 'Midtrans', 'Payment Gateway', 'Terhubung', 'Merchant ID: 01234567', 'https://zega-ai.onrender.com/api/v1/midtrans/notification', 'Mid-server-••••••••••••5511', 'whsec_••••••••••••6633'),
    ('11111111-1111-1111-1111-111111111111', 'qris', 'QRIS (VA)', 'QRIS (VA)', 'Payment Gateway', 'Terhubung', 'Bank Permata •••• 8888', 'https://zega-ai.onrender.com/api/v1/qris/callback', 'qris_live_••••••••••••4422', 'whsec_••••••••••••7744'),
    ('11111111-1111-1111-1111-111111111111', 'x402', 'x402 Network', 'x402 Network', 'Web3 Crypto', 'Terhubung', 'Wallet: 0x773...a9b2', 'https://zega-ai.onrender.com/api/v1/solana/rpc', 'x402_sol_••••••••••••8833', 'whsec_••••••••••••9955')
ON CONFLICT (store_id, integration_key) DO UPDATE SET
    integration_name = EXCLUDED.integration_name,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    account_identifier = EXCLUDED.account_identifier,
    api_endpoint = EXCLUDED.api_endpoint,
    updated_at = NOW();

-- Explicit Category Updates for Any Existing Database Rows
UPDATE public.umkm_settings_integrations SET category = 'Social Commerce' WHERE integration_key IN ('ig', 'tiktok');
UPDATE public.umkm_settings_integrations SET category = 'Payment Gateway' WHERE integration_key IN ('stripe', 'midtrans', 'qris');
UPDATE public.umkm_settings_integrations SET category = 'Web3 Crypto' WHERE integration_key IN ('x402');
UPDATE public.umkm_settings_integrations SET category = 'Channel Penjualan' WHERE integration_key IN ('wa', 'shopee');

-- Enable Supabase Realtime Publications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_integrations;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publication alter skipped or table already added';
END $$;
