-- Migration 76: UMKM Billing & Plan Subscriptions Real-Time Infrastructure & RPC Functions
-- Description: Sets up umkm_billing_subscriptions, umkm_billing_payment_methods, umkm_billing_usage_metrics, umkm_billing_invoices, and umkm_billing_transactions tables and RPC functions.

-- 1. Table: Subscriptions
CREATE TABLE IF NOT EXISTS public.umkm_billing_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  plan_name TEXT NOT NULL DEFAULT 'Growth',
  status TEXT NOT NULL DEFAULT 'Aktif',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  monthly_price_idr NUMERIC(12,2) DEFAULT 299000.00,
  tax_pct NUMERIC(5,2) DEFAULT 11.00,
  credits_remaining INTEGER DEFAULT 3240,
  credits_limit INTEGER DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive Columns
ALTER TABLE public.umkm_billing_subscriptions ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.umkm_billing_subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Growth';
ALTER TABLE public.umkm_billing_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif';
ALTER TABLE public.umkm_billing_subscriptions ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 3240;
ALTER TABLE public.umkm_billing_subscriptions ADD COLUMN IF NOT EXISTS credits_limit INTEGER DEFAULT 5000;

-- 2. Table: Payment Methods
CREATE TABLE IF NOT EXISTS public.umkm_billing_payment_methods (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  method_name TEXT NOT NULL,
  method_type TEXT NOT NULL,
  card_last4 TEXT,
  exp_date TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Aktif',
  icon_key TEXT DEFAULT 'stripe',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: Usage Metrics
CREATE TABLE IF NOT EXISTS public.umkm_billing_usage_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  current_value_label TEXT NOT NULL,
  limit_value_label TEXT NOT NULL,
  percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: Invoices
CREATE TABLE IF NOT EXISTS public.umkm_billing_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  invoice_number TEXT NOT NULL UNIQUE,
  period_label TEXT NOT NULL,
  total_amount_idr NUMERIC(12,2) NOT NULL DEFAULT 299000.00,
  status TEXT DEFAULT 'Lunas',
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: Transactions
CREATE TABLE IF NOT EXISTS public.umkm_billing_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  txn_hash TEXT NOT NULL,
  txn_date_label TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount_crypto TEXT NOT NULL,
  status TEXT DEFAULT 'Berhasil',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_transactions ENABLE ROW LEVEL SECURITY;

-- Allow policies
DROP POLICY IF EXISTS "Allow all subscriptions" ON public.umkm_billing_subscriptions;
CREATE POLICY "Allow all subscriptions" ON public.umkm_billing_subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all payment methods" ON public.umkm_billing_payment_methods;
CREATE POLICY "Allow all payment methods" ON public.umkm_billing_payment_methods FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all usage metrics" ON public.umkm_billing_usage_metrics;
CREATE POLICY "Allow all usage metrics" ON public.umkm_billing_usage_metrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all invoices" ON public.umkm_billing_invoices;
CREATE POLICY "Allow all invoices" ON public.umkm_billing_invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all transactions" ON public.umkm_billing_transactions;
CREATE POLICY "Allow all transactions" ON public.umkm_billing_transactions FOR ALL USING (true);

-- Idempotent Realtime publication table additions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_subscriptions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_subscriptions;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_payment_methods') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_payment_methods;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_usage_metrics') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_usage_metrics;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_invoices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_invoices;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_transactions;
  END IF;
END $$;

-- SEED DATA SETUP
INSERT INTO public.umkm_billing_subscriptions (store_id, plan_name, status, monthly_price_idr, tax_pct, credits_remaining, credits_limit)
VALUES ('11111111-1111-1111-1111-111111111111', 'Growth', 'Aktif', 299000.00, 11.00, 3240, 5000)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_billing_payment_methods (store_id, method_name, method_type, card_last4, exp_date, is_primary, status, icon_key)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Stripe •••• 4242', 'Kartu Kredit', '4242', '12/28', TRUE, 'Utama', 'stripe'),
  ('11111111-1111-1111-1111-111111111111', 'QRIS (VA)', 'Virtual Account', NULL, NULL, FALSE, 'Aktif', 'qris'),
  ('11111111-1111-1111-1111-111111111111', 'GoPay', 'E-Wallet', NULL, NULL, FALSE, 'Aktif', 'gopay'),
  ('11111111-1111-1111-1111-111111111111', 'DANA', 'E-Wallet', NULL, NULL, FALSE, 'Aktif', 'dana'),
  ('11111111-1111-1111-1111-111111111111', 'OVO', 'E-Wallet', NULL, NULL, FALSE, 'Aktif', 'ovo')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_billing_usage_metrics (store_id, metric_key, metric_label, current_value_label, limit_value_label, percentage)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'credits', 'AI Credits', '3.240', '5.000', 64),
  ('11111111-1111-1111-1111-111111111111', 'employees', 'AI Employees', '7', '10', 70),
  ('11111111-1111-1111-1111-111111111111', 'automation', 'Automation', '24', '∞', 40),
  ('11111111-1111-1111-1111-111111111111', 'storage', 'Storage', '12.4 GB', '50 GB', 25)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_billing_invoices (store_id, invoice_number, period_label, total_amount_idr, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'INV-2026-0721', 'Growth Plan - Juli 2026', 299000, 'Lunas'),
  ('11111111-1111-1111-1111-111111111111', 'INV-2026-0621', 'Growth Plan - Juni 2026', 299000, 'Lunas'),
  ('11111111-1111-1111-1111-111111111111', 'INV-2026-0521', 'Growth Plan - Mei 2026', 299000, 'Lunas'),
  ('11111111-1111-1111-1111-111111111111', 'INV-2026-0421', 'Growth Plan - April 2026', 299000, 'Lunas'),
  ('11111111-1111-1111-1111-111111111111', 'INV-2026-0321', 'Growth Plan - Maret 2026', 299000, 'Lunas')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_billing_transactions (store_id, txn_hash, txn_date_label, payment_method, amount_crypto, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TXN-7f3...a8b2', '28 Jul 2026, 16:21', 'stripe •••• 4242', 'USDC 2.50', 'Berhasil'),
  ('11111111-1111-1111-1111-111111111111', 'TXN-8a1...c304', '28 Jul 2026, 09:15', 'QRIS (VA)', 'USDC -1.20', 'Berhasil'),
  ('11111111-1111-1111-1111-111111111111', 'TXN-3c2...f6e7', '27 Jul 2026, 14:45', 'GoPay', 'USDC -0.80', 'Berhasil'),
  ('11111111-1111-1111-1111-111111111111', 'TXN-9d4...e8f1', '27 Jul 2026, 11:32', 'DANA', 'USDC -3.00', 'Berhasil'),
  ('11111111-1111-1111-1111-111111111111', 'TXN-1b7...d5c9', '26 Jul 2026, 10:08', 'OVO', 'USDC 1.50', 'Berhasil')
ON CONFLICT DO NOTHING;

-- 1. RPC: Get Billing Overview JSON
CREATE OR REPLACE FUNCTION public.get_umkm_billing_overview(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan JSONB;
  v_payment_methods JSONB;
  v_usage JSONB;
  v_invoices JSONB;
  v_transactions JSONB;
  v_result JSONB;
BEGIN
  -- Plan
  SELECT jsonb_build_object(
    'plan_name', COALESCE(plan_name, 'Growth'),
    'status', COALESCE(status, 'Aktif'),
    'expires_at', COALESCE(expires_at::text, '2026-08-01 00:00:00+00'),
    'monthly_price_idr', COALESCE(monthly_price_idr, 299000),
    'tax_pct', COALESCE(tax_pct, 11),
    'credits_remaining', COALESCE(credits_remaining, 3240),
    'credits_limit', COALESCE(credits_limit, 5000),
    'credits_pct', CASE WHEN credits_limit > 0 THEN ROUND((credits_remaining::numeric / credits_limit::numeric) * 100) ELSE 64 END
  ) INTO v_plan
  FROM public.umkm_billing_subscriptions
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
  LIMIT 1;

  IF v_plan IS NULL THEN
    v_plan := '{"plan_name": "Growth", "status": "Aktif", "expires_at": "2026-08-01 00:00:00+00", "monthly_price_idr": 299000, "tax_pct": 11, "credits_remaining": 3240, "credits_limit": 5000, "credits_pct": 64}'::jsonb;
  END IF;

  -- Payment Methods
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'method_name', method_name,
    'method_type', method_type,
    'card_last4', card_last4,
    'exp_date', exp_date,
    'is_primary', is_primary,
    'status', status,
    'icon_key', icon_key
  )) INTO v_payment_methods
  FROM public.umkm_billing_payment_methods
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  -- Usage
  SELECT jsonb_agg(jsonb_build_object(
    'metric_key', metric_key,
    'metric_label', metric_label,
    'current_value_label', current_value_label,
    'limit_value_label', limit_value_label,
    'percentage', percentage
  )) INTO v_usage
  FROM public.umkm_billing_usage_metrics
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  -- Invoices
  SELECT jsonb_agg(jsonb_build_object(
    'invoice_number', invoice_number,
    'period_label', period_label,
    'total_amount_idr', total_amount_idr,
    'status', status
  )) INTO v_invoices
  FROM public.umkm_billing_invoices
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  -- Transactions
  SELECT jsonb_agg(jsonb_build_object(
    'txn_hash', txn_hash,
    'txn_date_label', txn_date_label,
    'payment_method', payment_method,
    'amount_crypto', amount_crypto,
    'status', status
  )) INTO v_transactions
  FROM public.umkm_billing_transactions
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  v_result := jsonb_build_object(
    'success', true,
    'plan', v_plan,
    'paymentMethods', COALESCE(v_payment_methods, '[]'::jsonb),
    'usage', COALESCE(v_usage, '[]'::jsonb),
    'invoices', COALESCE(v_invoices, '[]'::jsonb),
    'transactions', COALESCE(v_transactions, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- 2. RPC: Change Plan
CREATE OR REPLACE FUNCTION public.change_umkm_billing_plan(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111',
  p_plan_name TEXT DEFAULT 'Growth',
  p_monthly_price_idr NUMERIC DEFAULT 299000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  IF p_plan_name = 'Starter' THEN v_limit := 1000;
  ELSIF p_plan_name = 'Enterprise' THEN v_limit := 50000;
  ELSE v_limit := 5000;
  END IF;

  UPDATE public.umkm_billing_subscriptions
  SET plan_name = p_plan_name,
      monthly_price_idr = p_monthly_price_idr,
      credits_limit = v_limit,
      credits_remaining = v_limit,
      updated_at = NOW()
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Paket berhasil diperbarui ke ' || p_plan_name
  );
END;
$$;

-- 3. RPC: Add Payment Method
CREATE OR REPLACE FUNCTION public.add_umkm_payment_method(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111',
  p_method_name TEXT DEFAULT 'Visa',
  p_method_type TEXT DEFAULT 'Kartu Kredit',
  p_card_last4 TEXT DEFAULT '4242',
  p_icon_key TEXT DEFAULT 'stripe'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.umkm_billing_payment_methods (
    store_id, method_name, method_type, card_last4, exp_date, is_primary, status, icon_key
  )
  VALUES (
    COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111'),
    p_method_name,
    p_method_type,
    p_card_last4,
    '12/28',
    FALSE,
    'Aktif',
    p_icon_key
  );

  RETURN jsonb_build_object('success', true, 'message', 'Metode pembayaran berhasil ditambahkan');
END;
$$;
