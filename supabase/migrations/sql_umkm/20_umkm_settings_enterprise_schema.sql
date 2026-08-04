-- Migration: 20_umkm_settings_enterprise_schema.sql
-- Description: Enterprise Settings, Integrations, API Key Security & System Preferences Schema with Realtime and RLS

CREATE TABLE IF NOT EXISTS public.umkm_settings_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  integration_key VARCHAR(50) NOT NULL, -- 'wa', 'ig', 'shopee', 'tiktok', 'stripe', 'midtrans', 'qris', 'x402'
  integration_name VARCHAR(100) NOT NULL,
  account_identifier VARCHAR(150) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Terhubung', -- 'Terhubung', 'Terputus', 'Pending'
  config_json JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_integration UNIQUE (store_id, integration_key)
);

CREATE TABLE IF NOT EXISTS public.umkm_settings_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  public_api_key VARCHAR(100) NOT NULL DEFAULT '',
  secret_api_key VARCHAR(100) NOT NULL DEFAULT '',
  webhook_url TEXT NOT NULL DEFAULT 'https://zegaai.site/api/v1/webhook',
  webhook_secret VARCHAR(100) DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_apikeys UNIQUE (store_id)
);

CREATE TABLE IF NOT EXISTS public.umkm_settings_system_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta (WIB)',
  language VARCHAR(50) NOT NULL DEFAULT 'Bahasa Indonesia',
  currency VARCHAR(30) NOT NULL DEFAULT 'IDR - Rupiah',
  date_format VARCHAR(30) NOT NULL DEFAULT 'DD MMM YYYY',
  number_format VARCHAR(30) NOT NULL DEFAULT '1.234.567,89',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_preferences UNIQUE (store_id)
);

-- Enable RLS
ALTER TABLE public.umkm_settings_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_system_preferences ENABLE ROW LEVEL SECURITY;

-- Allow public & authenticated users full access (idempotent)
DROP POLICY IF EXISTS "Allow full access for umkm_settings_integrations" ON public.umkm_settings_integrations;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_api_keys" ON public.umkm_settings_api_keys;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_system_preferences" ON public.umkm_settings_system_preferences;

CREATE POLICY "Allow full access for umkm_settings_integrations" ON public.umkm_settings_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_api_keys" ON public.umkm_settings_api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_system_preferences" ON public.umkm_settings_system_preferences FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime publication (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_settings_integrations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_integrations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_settings_api_keys') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_api_keys;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_settings_system_preferences') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_system_preferences;
  END IF;
END $$;

-- Seed default integrations
INSERT INTO public.umkm_settings_integrations (store_id, integration_key, integration_name, account_identifier, status)
VALUES
  ('STORE-DEMO-1283', 'wa', 'WhatsApp Business', '+62 812-3456-7890', 'Terhubung'),
  ('STORE-DEMO-1283', 'ig', 'Instagram', '@tokocikcik.berluk', 'Terhubung'),
  ('STORE-DEMO-1283', 'shopee', 'Shopee', 'tokocikcik.berluk', 'Terhubung'),
  ('STORE-DEMO-1283', 'tiktok', 'TikTok', '@tokocikcik.berluk', 'Terhubung'),
  ('STORE-DEMO-1283', 'stripe', 'Stripe Connect', '•••• •••• 4242', 'Terhubung'),
  ('STORE-DEMO-1283', 'midtrans', 'Midtrans', 'Merchant ID: 01234567', 'Terhubung'),
  ('STORE-DEMO-1283', 'qris', 'QRIS (VA)', 'Bank Permata •••• 8888', 'Terhubung'),
  ('STORE-DEMO-1283', 'x402', 'x402 Network', 'Wallet: 0x773...a9b2', 'Terhubung')
ON CONFLICT (store_id, integration_key) DO UPDATE SET updated_at = NOW();

-- Seed default API keys
INSERT INTO public.umkm_settings_api_keys (store_id, public_api_key, secret_api_key, webhook_url)
VALUES ('STORE-DEMO-1283', '', '', 'https://zegaai.site/api/v1/webhook')
ON CONFLICT (store_id) DO UPDATE SET updated_at = NOW();

-- Seed default system preferences
INSERT INTO public.umkm_settings_system_preferences (store_id, timezone, language, currency, date_format, number_format)
VALUES ('STORE-DEMO-1283', 'Asia/Jakarta (WIB)', 'Bahasa Indonesia', 'IDR - Rupiah', 'DD MMM YYYY', '1.234.567,89')
ON CONFLICT (store_id) DO UPDATE SET updated_at = NOW();
