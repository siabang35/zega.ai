-- Migration 88: UMKM Billing & Invoice Realtime Infrastructure
-- Location: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_umkm/88_umkm_billing_invoice_realtime.sql
-- Description: Creates full real-time database schema for UMKM Billing Overview, Invoices, Payment Methods, and Transactions with real-time publication.

-- 1. Billing Overview Summary Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_billing_overview (
  store_id TEXT PRIMARY KEY DEFAULT '11111111-1111-1111-1111-111111111111',
  plan_name TEXT NOT NULL DEFAULT 'Growth',
  plan_status TEXT NOT NULL DEFAULT 'Aktif',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '22 days'),
  ai_credits_used INTEGER DEFAULT 3340,
  ai_credits_total INTEGER DEFAULT 5000,
  ai_employees_used INTEGER DEFAULT 10,
  ai_employees_total INTEGER DEFAULT 20,
  automation_used INTEGER DEFAULT 24,
  automation_total INTEGER DEFAULT -1, -- -1 represents unlimited
  storage_used_gb NUMERIC(5,1) DEFAULT 12.4,
  storage_total_gb NUMERIC(5,1) DEFAULT 50.0,
  primary_payment_brand TEXT DEFAULT 'Stripe',
  primary_payment_card TEXT DEFAULT 'Visa •••• 4242',
  primary_payment_expiry TEXT DEFAULT 'Kedaluwarsa 12/28',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Growth';
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'Aktif';
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '22 days');
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 3340;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS ai_credits_total INTEGER DEFAULT 5000;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS ai_employees_used INTEGER DEFAULT 10;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS ai_employees_total INTEGER DEFAULT 20;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS automation_used INTEGER DEFAULT 24;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS automation_total INTEGER DEFAULT -1;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS storage_used_gb NUMERIC(5,1) DEFAULT 12.4;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS storage_total_gb NUMERIC(5,1) DEFAULT 50.0;
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS primary_payment_brand TEXT DEFAULT 'Stripe';
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS primary_payment_card TEXT DEFAULT 'Visa •••• 4242';
ALTER TABLE public.umkm_settings_billing_overview ADD COLUMN IF NOT EXISTS primary_payment_expiry TEXT DEFAULT 'Kedaluwarsa 12/28';

-- 2. Invoices History Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  invoice_number TEXT NOT NULL UNIQUE,
  period TEXT NOT NULL,
  total_amount_idr NUMERIC(12,2) NOT NULL DEFAULT 299000.00,
  status TEXT NOT NULL DEFAULT 'Lunas',
  pdf_url TEXT,
  e_faktur_no TEXT,
  items_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive Column Additions for Invoices
ALTER TABLE public.umkm_settings_invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.umkm_settings_invoices ADD COLUMN IF NOT EXISTS e_faktur_no TEXT;
ALTER TABLE public.umkm_settings_invoices ADD COLUMN IF NOT EXISTS items_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.umkm_settings_invoices ADD COLUMN IF NOT EXISTS total_amount_idr NUMERIC(12,2) DEFAULT 299000.00;
ALTER TABLE public.umkm_settings_invoices ADD COLUMN IF NOT EXISTS period TEXT DEFAULT '1 - 31 Jul 2026';

-- 3. Transactions History Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT NOT NULL DEFAULT 'Pembayaran Invoice Subskripsi',
  method TEXT NOT NULL DEFAULT 'Stripe',
  amount_usd NUMERIC(8,2) NOT NULL DEFAULT 12.90,
  amount_idr NUMERIC(12,2) NOT NULL DEFAULT 299000.00,
  status TEXT NOT NULL DEFAULT 'Berhasil',
  txn_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_settings_transactions ADD COLUMN IF NOT EXISTS amount_usd NUMERIC(8,2) DEFAULT 12.90;
ALTER TABLE public.umkm_settings_transactions ADD COLUMN IF NOT EXISTS amount_idr NUMERIC(12,2) DEFAULT 299000.00;
ALTER TABLE public.umkm_settings_transactions ADD COLUMN IF NOT EXISTS txn_hash TEXT;

-- 4. Payment Methods Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  brand TEXT NOT NULL DEFAULT 'Stripe',
  card_last4 TEXT NOT NULL DEFAULT '4242',
  card_type TEXT DEFAULT 'Visa',
  exp_month INTEGER DEFAULT 12,
  exp_year INTEGER DEFAULT 2028,
  is_default BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_settings_payment_methods ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'Visa';
ALTER TABLE public.umkm_settings_payment_methods ADD COLUMN IF NOT EXISTS exp_month INTEGER DEFAULT 12;
ALTER TABLE public.umkm_settings_payment_methods ADD COLUMN IF NOT EXISTS exp_year INTEGER DEFAULT 2028;

-- Ensure Primary Key and Unique Constraints defensively
DO $$
BEGIN
  -- 1. Ensure PRIMARY KEY on store_id for umkm_settings_billing_overview
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'umkm_settings_billing_overview_pkey'
  ) THEN
    BEGIN
      ALTER TABLE public.umkm_settings_billing_overview ADD PRIMARY KEY (store_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- 2. Ensure UNIQUE constraint on invoice_number for umkm_settings_invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'umkm_settings_invoices_invoice_number_key'
  ) THEN
    BEGIN
      ALTER TABLE public.umkm_settings_invoices ADD CONSTRAINT umkm_settings_invoices_invoice_number_key UNIQUE (invoice_number);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Enable RLS for all 4 tables
ALTER TABLE public.umkm_settings_billing_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_settings_payment_methods ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies
DROP POLICY IF EXISTS "Allow select billing overview" ON public.umkm_settings_billing_overview;
CREATE POLICY "Allow select billing overview" ON public.umkm_settings_billing_overview FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update billing overview" ON public.umkm_settings_billing_overview;
CREATE POLICY "Allow update billing overview" ON public.umkm_settings_billing_overview FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow select invoices" ON public.umkm_settings_invoices;
CREATE POLICY "Allow select invoices" ON public.umkm_settings_invoices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert invoices" ON public.umkm_settings_invoices;
CREATE POLICY "Allow insert invoices" ON public.umkm_settings_invoices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select transactions" ON public.umkm_settings_transactions;
CREATE POLICY "Allow select transactions" ON public.umkm_settings_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert transactions" ON public.umkm_settings_transactions;
CREATE POLICY "Allow insert transactions" ON public.umkm_settings_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all payment methods" ON public.umkm_settings_payment_methods;
CREATE POLICY "Allow all payment methods" ON public.umkm_settings_payment_methods FOR ALL USING (true);

-- Seed Authentic Datasets for Default Store IDs (using PL/pgSQL block to bypass ON CONFLICT requirements)
DO $$
BEGIN
  -- Insert/Update Overview
  INSERT INTO public.umkm_settings_billing_overview (
    store_id, plan_name, plan_status, expires_at, ai_credits_used, ai_credits_total, 
    ai_employees_used, ai_employees_total, automation_used, automation_total, storage_used_gb, storage_total_gb, 
    primary_payment_brand, primary_payment_card, primary_payment_expiry
  ) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Growth', 'Aktif', NOW() + INTERVAL '22 days', 3340, 5000, 10, 20, 24, -1, 12.4, 50.0, 'Stripe', 'Visa •••• 4242', 'Kedaluwarsa 12/28'),
    ('STORE-DEMO-1283', 'Growth', 'Aktif', NOW() + INTERVAL '22 days', 3340, 5000, 10, 20, 24, -1, 12.4, 50.0, 'Stripe', 'Visa •••• 4242', 'Kedaluwarsa 12/28')
  ON CONFLICT DO NOTHING;

  -- Insert Invoices
  INSERT INTO public.umkm_settings_invoices (store_id, invoice_number, period, total_amount_idr, status, e_faktur_no) VALUES
    ('11111111-1111-1111-1111-111111111111', 'INV-2026-0721', '1 - 31 Jul 2026', 299000.00, 'Lunas', '010.000-26.0000721'),
    ('11111111-1111-1111-1111-111111111111', 'INV-2026-0621', '1 - 30 Jun 2026', 299000.00, 'Lunas', '010.000-26.0000621'),
    ('11111111-1111-1111-1111-111111111111', 'INV-2026-0521', '1 - 31 Mei 2026', 299000.00, 'Lunas', '010.000-26.0000521'),
    ('11111111-1111-1111-1111-111111111111', 'INV-2026-0421', '1 - 30 Apr 2026', 299000.00, 'Lunas', '010.000-26.0000421'),
    ('11111111-1111-1111-1111-111111111111', 'INV-2026-0321', '1 - 31 Mar 2026', 299000.00, 'Lunas', '010.000-26.0000321'),
    ('STORE-DEMO-1283', 'INV-2026-0721', '1 - 31 Jul 2026', 299000.00, 'Lunas', '010.000-26.0000721'),
    ('STORE-DEMO-1283', 'INV-2026-0621', '1 - 30 Jun 2026', 299000.00, 'Lunas', '010.000-26.0000621'),
    ('STORE-DEMO-1283', 'INV-2026-0521', '1 - 31 Mei 2026', 299000.00, 'Lunas', '010.000-26.0000521')
  ON CONFLICT DO NOTHING;

  -- Insert Transactions
  INSERT INTO public.umkm_settings_transactions (store_id, transaction_date, description, method, amount_usd, amount_idr, status) VALUES
    ('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '12 days', 'Pembayaran Invoice', 'Stripe', 12.90, 299000.00, 'Berhasil'),
    ('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '42 days', 'Pembayaran Invoice', 'Stripe', 12.90, 299000.00, 'Berhasil'),
    ('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '72 days', 'Pembayaran Invoice', 'Stripe', 12.90, 299000.00, 'Berhasil'),
    ('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '102 days', 'Pembayaran Invoice', 'Stripe', 12.90, 299000.00, 'Berhasil'),
    ('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '132 days', 'Pembayaran Invoice', 'Stripe', 12.90, 299000.00, 'Berhasil');

  -- Insert Payment Methods
  INSERT INTO public.umkm_settings_payment_methods (store_id, brand, card_last4, card_type, exp_month, exp_year, is_default) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Stripe', '4242', 'Visa', 12, 2028, true),
    ('11111111-1111-1111-1111-111111111111', 'Mastercard', '8812', 'Mastercard', 10, 2027, false);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Enable Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_settings_billing_overview'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_billing_overview;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_settings_invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_invoices;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_settings_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_settings_payment_methods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_payment_methods;
  END IF;
END $$;

-- 5. Support Tickets Table for Billing & Invoicing
CREATE TABLE IF NOT EXISTS public.umkm_billing_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'Billing & Invoicing',
  priority TEXT DEFAULT 'Tinggi',
  message TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'Terbuka',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_billing_support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all billing support tickets" ON public.umkm_billing_support_tickets;
CREATE POLICY "Allow all billing support tickets" ON public.umkm_billing_support_tickets FOR ALL USING (true);

-- RPC Stored Procedure: submit_umkm_billing_support_ticket
CREATE OR REPLACE FUNCTION public.submit_umkm_billing_support_ticket(
  p_store_id TEXT,
  p_subject TEXT,
  p_category TEXT DEFAULT 'Billing & Invoicing',
  p_priority TEXT DEFAULT 'Tinggi',
  p_message TEXT DEFAULT '',
  p_user_email TEXT DEFAULT NULL,
  p_user_phone TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  INSERT INTO public.umkm_billing_support_tickets (
    store_id, subject, category, priority, message, user_email, user_phone, status
  ) VALUES (
    COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111'),
    p_subject,
    p_category,
    p_priority,
    p_message,
    p_user_email,
    p_user_phone,
    'Terbuka'
  ) RETURNING id INTO v_ticket_id;

  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', v_ticket_id,
    'message', 'Tiket bantuan berhasil dikirim'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
