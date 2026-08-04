-- Migration: 22_umkm_settings_redesign_enterprise_schema.sql
-- Description: Comprehensive database schema for AI Preferences, Notifications, Security, and Billing settings with Supabase Realtime and RLS

-- 1. AI PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.umkm_settings_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  default_model VARCHAR(50) NOT NULL DEFAULT 'GPT-4o (Recommended)',
  response_style VARCHAR(50) NOT NULL DEFAULT 'Profesional',
  use_data_for_training BOOLEAN NOT NULL DEFAULT true,
  auto_insights BOOLEAN NOT NULL DEFAULT true,
  web_search_access BOOLEAN NOT NULL DEFAULT true,
  default_language VARCHAR(50) NOT NULL DEFAULT 'Bahasa Indonesia',
  response_length VARCHAR(30) NOT NULL DEFAULT 'Sedang',
  show_sources BOOLEAN NOT NULL DEFAULT true,
  response_format VARCHAR(30) NOT NULL DEFAULT 'Ringkas',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_ai_pref_store UNIQUE (store_id)
);

-- 2. NOTIFICATIONS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.umkm_settings_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  -- Channels
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_target VARCHAR(150) NOT NULL DEFAULT 'cikberluk@gmail.com',
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_target VARCHAR(50) NOT NULL DEFAULT '+62 812-3456-7890',
  browser_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_target VARCHAR(50) NOT NULL DEFAULT '+62 812-3456-7890',
  -- Category: AI & Automation
  ai_task_done BOOLEAN NOT NULL DEFAULT true,
  ai_insights BOOLEAN NOT NULL DEFAULT true,
  automation_status BOOLEAN NOT NULL DEFAULT true,
  -- Category: Business & Operations
  new_order BOOLEAN NOT NULL DEFAULT true,
  invoice_paid BOOLEAN NOT NULL DEFAULT true,
  stock_warning BOOLEAN NOT NULL DEFAULT true,
  customer_followup BOOLEAN NOT NULL DEFAULT false,
  -- Category: System
  product_updates BOOLEAN NOT NULL DEFAULT true,
  system_maintenance BOOLEAN NOT NULL DEFAULT true,
  security_login BOOLEAN NOT NULL DEFAULT true,
  -- Summary Schedules
  daily_summary_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_summary_time VARCHAR(20) NOT NULL DEFAULT '08:00 WIB',
  weekly_summary_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_summary_day_time VARCHAR(50) NOT NULL DEFAULT 'Senin • 09:00 WIB',
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start VARCHAR(10) NOT NULL DEFAULT '22:00',
  quiet_hours_end VARCHAR(10) NOT NULL DEFAULT '07:00',
  quiet_hours_freq VARCHAR(30) NOT NULL DEFAULT 'Setiap hari',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_notif_store UNIQUE (store_id)
);

-- 3. SECURITY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.umkm_settings_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  password_last_changed TIMESTAMPTZ NOT NULL DEFAULT NOW() - INTERVAL '60 days',
  two_factor_enabled BOOLEAN NOT NULL DEFAULT true,
  two_factor_method VARCHAR(50) NOT NULL DEFAULT 'Authenticator App',
  magic_link_login BOOLEAN NOT NULL DEFAULT false,
  new_device_verify BOOLEAN NOT NULL DEFAULT true,
  ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT false,
  allowed_ips TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_security_store UNIQUE (store_id)
);

-- 4. ACTIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.umkm_settings_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  device_name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50) NOT NULL,
  last_active VARCHAR(50) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BILLING & INVOICE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.umkm_settings_billing_overview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  plan_name VARCHAR(50) NOT NULL DEFAULT 'Growth',
  plan_status VARCHAR(30) NOT NULL DEFAULT 'Aktif',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT '2026-08-01 00:00:00+00',
  ai_credits_used INT NOT NULL DEFAULT 3340,
  ai_credits_total INT NOT NULL DEFAULT 5000,
  ai_employees_used INT NOT NULL DEFAULT 10,
  ai_employees_total INT NOT NULL DEFAULT 20,
  automation_used INT NOT NULL DEFAULT 24,
  automation_total INT NOT NULL DEFAULT -1, -- -1 represents Unlimited
  storage_used_gb NUMERIC(5,2) NOT NULL DEFAULT 12.40,
  storage_total_gb NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  primary_payment_brand VARCHAR(50) NOT NULL DEFAULT 'Stripe',
  primary_payment_card VARCHAR(50) NOT NULL DEFAULT 'Visa •••• 4242',
  primary_payment_expiry VARCHAR(20) NOT NULL DEFAULT 'Kedaluwarsa 12/28',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_billing_store UNIQUE (store_id)
);

-- 6. BILLING INVOICES & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.umkm_settings_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  invoice_number VARCHAR(50) NOT NULL,
  period VARCHAR(50) NOT NULL,
  total_amount_idr NUMERIC(15,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Lunas',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_settings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description VARCHAR(150) NOT NULL DEFAULT 'Pembayaran Invoice',
  method VARCHAR(50) NOT NULL DEFAULT 'Stripe',
  amount_usd NUMERIC(10,2) NOT NULL DEFAULT 12.90,
  status VARCHAR(30) NOT NULL DEFAULT 'Berhasil',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEED INITIAL MOCK DATA IDEMPOTENTLY
INSERT INTO public.umkm_settings_ai_preferences (store_id, default_model, response_style, use_data_for_training, auto_insights, web_search_access, default_language, response_length, show_sources, response_format)
VALUES ('STORE-DEMO-1283', 'GPT-4o (Recommended)', 'Profesional', true, true, true, 'Bahasa Indonesia', 'Sedang', true, 'Ringkas')
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.umkm_settings_notifications (store_id)
VALUES ('STORE-DEMO-1283')
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.umkm_settings_security (store_id)
VALUES ('STORE-DEMO-1283')
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO public.umkm_settings_billing_overview (store_id)
VALUES ('STORE-DEMO-1283')
ON CONFLICT (store_id) DO NOTHING;

-- Seed Invoices
INSERT INTO public.umkm_settings_invoices (store_id, invoice_number, period, total_amount_idr, status)
VALUES 
  ('STORE-DEMO-1283', 'INV-2026-0721', '1 - 31 Jul 2026', 299000.00, 'Lunas'),
  ('STORE-DEMO-1283', 'INV-2026-0621', '1 - 30 Jun 2026', 299000.00, 'Lunas'),
  ('STORE-DEMO-1283', 'INV-2026-0521', '1 - 31 Mei 2026', 299000.00, 'Lunas'),
  ('STORE-DEMO-1283', 'INV-2026-0421', '1 - 30 Apr 2026', 299000.00, 'Lunas'),
  ('STORE-DEMO-1283', 'INV-2026-0321', '1 - 31 Mar 2026', 299000.00, 'Lunas')
ON CONFLICT DO NOTHING;

-- Seed Transactions
INSERT INTO public.umkm_settings_transactions (store_id, transaction_date, description, method, amount_usd, status)
VALUES
  ('STORE-DEMO-1283', '2026-07-28 16:21:00+00', 'Pembayaran Invoice', 'Stripe', 12.90, 'Berhasil'),
  ('STORE-DEMO-1283', '2026-06-28 09:15:00+00', 'Pembayaran Invoice', 'Stripe', 12.90, 'Berhasil'),
  ('STORE-DEMO-1283', '2026-05-28 14:40:00+00', 'Pembayaran Invoice', 'Stripe', 12.90, 'Berhasil'),
  ('STORE-DEMO-1283', '2026-04-27 11:32:00+00', 'Pembayaran Invoice', 'Stripe', 12.90, 'Berhasil'),
  ('STORE-DEMO-1283', '2026-03-28 10:08:00+00', 'Pembayaran Invoice', 'Stripe', 12.90, 'Berhasil')
ON CONFLICT DO NOTHING;

-- ENABLE RLS
ALTER TABLE public.umkm_settings_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_billing_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_transactions ENABLE ROW LEVEL SECURITY;

-- POLICIES (Idempotent)
DROP POLICY IF EXISTS "Allow full access for umkm_settings_ai_preferences" ON public.umkm_settings_ai_preferences;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_notifications" ON public.umkm_settings_notifications;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_security" ON public.umkm_settings_security;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_sessions" ON public.umkm_settings_sessions;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_billing_overview" ON public.umkm_settings_billing_overview;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_invoices" ON public.umkm_settings_invoices;
DROP POLICY IF EXISTS "Allow full access for umkm_settings_transactions" ON public.umkm_settings_transactions;

CREATE POLICY "Allow full access for umkm_settings_ai_preferences" ON public.umkm_settings_ai_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_notifications" ON public.umkm_settings_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_security" ON public.umkm_settings_security FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_sessions" ON public.umkm_settings_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_billing_overview" ON public.umkm_settings_billing_overview FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_invoices" ON public.umkm_settings_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_settings_transactions" ON public.umkm_settings_transactions FOR ALL USING (true) WITH CHECK (true);

-- REALTIME PUBLICATION REGISTRATION (Idempotent Guard)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_ai_preferences;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_notifications;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_security;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_billing_overview;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_invoices;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_transactions;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
