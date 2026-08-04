-- Migration: 23_umkm_settings_api_keys_enterprise_schema.sql
-- Description: Database schema for UMKM Settings API Keys management table with Supabase Realtime & RLS

CREATE TABLE IF NOT EXISTS public.umkm_settings_api_keys_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  name VARCHAR(150) NOT NULL,
  description TEXT,
  key_prefix VARCHAR(30) NOT NULL DEFAULT 'zga_live_',
  key_token VARCHAR(255) NOT NULL,
  access_scope VARCHAR(100) NOT NULL DEFAULT 'Full Access',
  status VARCHAR(30) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Kedaluwarsa', 'Dicabut'
  last_used_at VARCHAR(100) DEFAULT 'Belum pernah',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial records matching reference screenshot
INSERT INTO public.umkm_settings_api_keys_list (store_id, name, description, key_prefix, key_token, access_scope, status, last_used_at, created_at)
VALUES
  ('STORE-DEMO-1283', 'Integrasi Midtrans', 'Pembayaran invoice', 'zga_live_', 'zga_live_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c', 'Billing, Invoice', 'Aktif', 'Hari ini, 10:24 WIB', NOW() - INTERVAL '68 days'),
  ('STORE-DEMO-1283', 'Webhook Shopee', 'Sinkronisasi pesanan', 'zga_live_', 'zga_live_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d', 'Store, Orders', 'Aktif', 'Kemarin, 16:15 WIB', NOW() - INTERVAL '76 days'),
  ('STORE-DEMO-1283', 'Laporan Analytics', 'Akses data analitik', 'zga_live_', 'zga_live_8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c', 'Reports', 'Aktif', '2 hari lalu, 11:20 WIB', NOW() - INTERVAL '81 days'),
  ('STORE-DEMO-1283', 'Automation External App', 'Trigger automation', 'zga_live_', 'zga_live_7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d', 'Automation', 'Aktif', '3 hari lalu, 09:02 WIB', NOW() - INTERVAL '86 days'),
  ('STORE-DEMO-1283', 'Partner Dashboard', 'Akses dashboard partner', 'zga_live_', 'zga_live_3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f', 'Dashboard', 'Kedaluwarsa', '14 Mei 2026, 10:11 WIB', NOW() - INTERVAL '94 days'),
  ('STORE-DEMO-1283', 'Lama Test App', 'Testing (dicabut)', 'zga_live_', 'zga_live_0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c', 'Full Access', 'Dicabut', '5 Mei 2026, 12:00 WIB', NOW() - INTERVAL '108 days')
ON CONFLICT DO NOTHING;

-- ENABLE RLS
ALTER TABLE public.umkm_settings_api_keys_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for umkm_settings_api_keys_list" ON public.umkm_settings_api_keys_list;
CREATE POLICY "Allow full access for umkm_settings_api_keys_list" ON public.umkm_settings_api_keys_list FOR ALL USING (true) WITH CHECK (true);

-- REGISTER IN REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_api_keys_list;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
