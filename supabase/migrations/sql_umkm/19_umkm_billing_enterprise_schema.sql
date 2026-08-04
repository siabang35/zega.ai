-- ============================================================================
-- SQL MIGRATION: 19_umkm_billing_enterprise_schema.sql
-- Description: Enterprise Billing & Subscriptions Schema for UMKM Sales Hub
-- Features: Active Subscription Plan, Payment Methods, Usage Metrics, Invoices,
--           On-chain Crypto & FIAT Transactions, and Realtime RLS
-- ============================================================================

-- 1. Active Subscription Plan
CREATE TABLE IF NOT EXISTS public.umkm_billing_active_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    plan_name TEXT NOT NULL DEFAULT 'Growth',
    status TEXT NOT NULL DEFAULT 'Aktif',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT '2026-08-01 00:00:00+00',
    monthly_price_idr NUMERIC(12,2) NOT NULL DEFAULT 299000.00,
    tax_pct NUMERIC(4,2) NOT NULL DEFAULT 11.00,
    credits_remaining INT NOT NULL DEFAULT 3240,
    credits_limit INT NOT NULL DEFAULT 5000,
    credits_pct NUMERIC(5,2) NOT NULL DEFAULT 64.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Saved Payment Methods
CREATE TABLE IF NOT EXISTS public.umkm_billing_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    method_name TEXT NOT NULL,
    method_type TEXT NOT NULL DEFAULT 'Kartu Kredit',
    card_last4 TEXT,
    exp_date TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'Utama', -- 'Utama', 'Aktif'
    icon_key TEXT NOT NULL DEFAULT 'stripe', -- 'stripe', 'qris', 'gopay', 'dana', 'ovo'
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Usage Metrics
CREATE TABLE IF NOT EXISTS public.umkm_billing_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    metric_key TEXT NOT NULL, -- 'credits', 'employees', 'automation', 'storage'
    metric_label TEXT NOT NULL,
    current_value_label TEXT NOT NULL,
    limit_value_label TEXT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Billing Invoices History
CREATE TABLE IF NOT EXISTS public.umkm_billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    invoice_number TEXT NOT NULL,
    period_label TEXT NOT NULL,
    total_amount_idr NUMERIC(12,2) NOT NULL DEFAULT 299000.00,
    status TEXT NOT NULL DEFAULT 'Lunas',
    download_url TEXT NOT NULL DEFAULT '#',
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Crypto & Settlement Transactions History
CREATE TABLE IF NOT EXISTS public.umkm_billing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    txn_hash TEXT NOT NULL,
    txn_date_label TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount_crypto TEXT NOT NULL,
    crypto_symbol TEXT NOT NULL DEFAULT 'USDC',
    status TEXT NOT NULL DEFAULT 'Berhasil',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DEMO DATA
-- ============================================================================

DELETE FROM public.umkm_billing_active_plan WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_billing_payment_methods WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_billing_usage_metrics WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_billing_invoices WHERE store_id = 'STORE-DEMO-1283';
DELETE FROM public.umkm_billing_transactions WHERE store_id = 'STORE-DEMO-1283';

-- 1. Insert Active Subscription Plan
INSERT INTO public.umkm_billing_active_plan (
    store_id, plan_name, status, expires_at, monthly_price_idr, tax_pct,
    credits_remaining, credits_limit, credits_pct
) VALUES (
    'STORE-DEMO-1283', 'Growth', 'Aktif', '2026-08-01 00:00:00+00', 299000.00, 11.00,
    3240, 5000, 64.00
);

-- 2. Insert Payment Methods
INSERT INTO public.umkm_billing_payment_methods (
    store_id, method_name, method_type, card_last4, exp_date, is_primary, status, icon_key, sort_order
) VALUES
('STORE-DEMO-1283', 'Stripe •••• 4242', 'Kartu Kredit', '4242', '12/28', true, 'Utama', 'stripe', 1),
('STORE-DEMO-1283', 'QRIS (VA)', 'Virtual Account', NULL, NULL, false, 'Aktif', 'qris', 2),
('STORE-DEMO-1283', 'GoPay', 'E-Wallet', NULL, NULL, false, 'Aktif', 'gopay', 3),
('STORE-DEMO-1283', 'DANA', 'E-Wallet', NULL, NULL, false, 'Aktif', 'dana', 4),
('STORE-DEMO-1283', 'OVO', 'E-Wallet', NULL, NULL, false, 'Aktif', 'ovo', 5);

-- 3. Insert Usage Metrics
INSERT INTO public.umkm_billing_usage_metrics (
    store_id, metric_key, metric_label, current_value_label, limit_value_label, percentage, sort_order
) VALUES
('STORE-DEMO-1283', 'credits', 'AI Credits', '3.240', '5.000', 64.00, 1),
('STORE-DEMO-1283', 'employees', 'AI Employees', '7', '10', 70.00, 2),
('STORE-DEMO-1283', 'automation', 'Automation', '24', '∞', 40.00, 3),
('STORE-DEMO-1283', 'storage', 'Storage', '12.4 GB', '50 GB', 25.00, 4);

-- 4. Insert Invoices History
INSERT INTO public.umkm_billing_invoices (
    store_id, invoice_number, period_label, total_amount_idr, status, invoice_date
) VALUES
('STORE-DEMO-1283', 'INV-2026-0721', 'Growth Plan - Juli 2026', 299000.00, 'Lunas', '2026-07-21 10:00:00+00'),
('STORE-DEMO-1283', 'INV-2026-0621', 'Growth Plan - Juni 2026', 299000.00, 'Lunas', '2026-06-21 10:00:00+00'),
('STORE-DEMO-1283', 'INV-2026-0521', 'Growth Plan - Mei 2026', 299000.00, 'Lunas', '2026-05-21 10:00:00+00'),
('STORE-DEMO-1283', 'INV-2026-0421', 'Growth Plan - April 2026', 299000.00, 'Lunas', '2026-04-21 10:00:00+00'),
('STORE-DEMO-1283', 'INV-2026-0321', 'Growth Plan - Maret 2026', 299000.00, 'Lunas', '2026-03-21 10:00:00+00');

-- 5. Insert Settlement Transactions
INSERT INTO public.umkm_billing_transactions (
    store_id, txn_hash, txn_date_label, payment_method, amount_crypto, crypto_symbol, status
) VALUES
('STORE-DEMO-1283', 'TXN-7f3...a8b2', '28 Jul 2026, 16:21', 'stripe •••• 4242', 'USDC 2.50', 'USDC', 'Berhasil'),
('STORE-DEMO-1283', 'TXN-8a1...c304', '28 Jul 2026, 09:15', 'QRIS (VA)', 'USDC -1.20', 'USDC', 'Berhasil'),
('STORE-DEMO-1283', 'TXN-3c2...f6e7', '27 Jul 2026, 14:45', 'GoPay', 'USDC -0.80', 'USDC', 'Berhasil'),
('STORE-DEMO-1283', 'TXN-9d4...e8f1', '27 Jul 2026, 11:32', 'DANA', 'USDC -3.00', 'USDC', 'Berhasil'),
('STORE-DEMO-1283', 'TXN-1b7...d5c9', '26 Jul 2026, 10:08', 'OVO', 'USDC 1.50', 'USDC', 'Berhasil');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & REALTIME PUBLICATION
-- ============================================================================

ALTER TABLE public.umkm_billing_active_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select access on umkm_billing_active_plan" ON public.umkm_billing_active_plan;
DROP POLICY IF EXISTS "Public select access on umkm_billing_payment_methods" ON public.umkm_billing_payment_methods;
DROP POLICY IF EXISTS "Public select access on umkm_billing_usage_metrics" ON public.umkm_billing_usage_metrics;

CREATE POLICY "Public select access on umkm_billing_active_plan" ON public.umkm_billing_active_plan FOR SELECT USING (true);
CREATE POLICY "Public select access on umkm_billing_payment_methods" ON public.umkm_billing_payment_methods FOR SELECT USING (true);
CREATE POLICY "Public select access on umkm_billing_usage_metrics" ON public.umkm_billing_usage_metrics FOR SELECT USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_active_plan') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_active_plan;
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
