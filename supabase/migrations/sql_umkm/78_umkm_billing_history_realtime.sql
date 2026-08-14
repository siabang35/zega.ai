-- Migration 78: Enterprise UMKM Billing Transaction History & Realtime Telemetry
-- Description: Adds enhanced transaction fields, seed data for settlement logs (x402 Solana & FIAT), RPC function get_umkm_billing_history, and Realtime publication.

-- 1. Create/Ensure umkm_billing_transactions table with full enterprise columns
CREATE TABLE IF NOT EXISTS public.umkm_billing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
    txn_hash TEXT NOT NULL,
    txn_type TEXT NOT NULL DEFAULT 'Subscription Payment',
    txn_date_label TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount_fiat NUMERIC(15, 2) DEFAULT 0,
    amount_crypto TEXT NOT NULL,
    currency TEXT DEFAULT 'USDC',
    solana_signature TEXT,
    explorer_url TEXT,
    status TEXT NOT NULL DEFAULT 'Berhasil',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns are added if table was instantiated by earlier migration
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS txn_type TEXT NOT NULL DEFAULT 'Subscription Payment';
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS amount_fiat NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC';
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS solana_signature TEXT;
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS explorer_url TEXT;
ALTER TABLE public.umkm_billing_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for high performance query by store & timestamp
CREATE INDEX IF NOT EXISTS idx_umkm_billing_txns_store ON public.umkm_billing_transactions (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_billing_txns_status ON public.umkm_billing_transactions (status);

-- Enable RLS
ALTER TABLE public.umkm_billing_transactions ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_billing_transactions' 
        AND policyname = 'Allow authenticated read for umkm_billing_transactions'
    ) THEN
        CREATE POLICY "Allow authenticated read for umkm_billing_transactions"
        ON public.umkm_billing_transactions
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'umkm_billing_transactions' 
        AND policyname = 'Allow authenticated write for umkm_billing_transactions'
    ) THEN
        CREATE POLICY "Allow authenticated write for umkm_billing_transactions"
        ON public.umkm_billing_transactions
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;
END $$;

-- 2. Seed Rich Transaction History Data
INSERT INTO public.umkm_billing_transactions (
  store_id, txn_hash, txn_type, txn_date_label, payment_method, amount_fiat, amount_crypto, currency, solana_signature, explorer_url, status, notes
)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-7f39a8b2c41e', 
    'Perpanjangan Growth Plan', 
    '28 Jul 2026, 16:21', 
    'Stripe (•••• 4242)', 
    299000, 
    'USDC 2.50', 
    'USDC', 
    '5Kj3...x9A2', 
    'https://explorer.solana.com/tx/5Kj3x9A2', 
    'Berhasil', 
    'Settlement sukses via Stripe Credit Card API v3'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-8a10c304d92f', 
    'Pembelian Topup 1.000 AI Credits', 
    '28 Jul 2026, 09:15', 
    'QRIS (BCA Virtual Account)', 
    150000, 
    'USDC 1.20', 
    'USDC', 
    '4Mp2...y8B1', 
    'https://explorer.solana.com/tx/4Mp2y8B1', 
    'Berhasil', 
    'Settlement Instant QRIS Midtrans API'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-3c24f6e7a10b', 
    'Langganan Addon AI Employees', 
    '27 Jul 2026, 14:45', 
    'GoPay (E-Wallet)', 
    99000, 
    'USDC 0.80', 
    'USDC', 
    '2Nx9...w3C4', 
    'https://explorer.solana.com/tx/2Nx9w3C4', 
    'Berhasil', 
    'Auto-debit GoPay Wallet integration'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-9d41e8f1b6a3', 
    'Topup 2.500 AI Credits', 
    '27 Jul 2026, 11:32', 
    'DANA (E-Wallet)', 
    350000, 
    'USDC 3.00', 
    'USDC', 
    '7Lq4...z1D5', 
    'https://explorer.solana.com/tx/7Lq4z1D5', 
    'Berhasil', 
    'Payment settlement via DANA merchant'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-1b70d5c9e24f', 
    'Cashback Quota Bonus', 
    '26 Jul 2026, 10:08', 
    'OVO (E-Wallet)', 
    0, 
    'USDC 1.50', 
    'USDC', 
    '8Pz1...v6E2', 
    'https://explorer.solana.com/tx/8Pz1v6E2', 
    'Berhasil', 
    'Promotional cash bonus credited to wallet'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-4e89f2a1c03b', 
    'x402 Micro-settlement Agent ZeroClaw', 
    '25 Jul 2026, 18:04', 
    'Solana USDC (x402 Protocol)', 
    45000, 
    'USDC 0.35', 
    'USDC', 
    '9Rk7...m4F9', 
    'https://explorer.solana.com/tx/9Rk7m4F9', 
    'Berhasil', 
    'Direct machine-to-machine x402 payment execution'
  ),
  (
    '11111111-1111-1111-1111-111111111111', 
    'TXN-6a31b4c8d90e', 
    'Percobaan Topup Gagal (Insufficient Balance)', 
    '24 Jul 2026, 15:30', 
    'Stripe (•••• 1111)', 
    500000, 
    'USDC 4.00', 
    'USDC', 
    NULL, 
    NULL, 
    'Gagal', 
    'Ditolak oleh bank penerbit (Saldo Tidak Cukup)'
  )
ON CONFLICT DO NOTHING;

-- 3. RPC: Get UMKM Billing History with Filtering & Metrics
CREATE OR REPLACE FUNCTION public.get_umkm_billing_history(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111',
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_txns JSONB;
  v_total_count INT;
  v_success_count INT;
  v_result JSONB;
BEGIN
  -- Build aggregated transactions
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'txn_hash', txn_hash,
    'txn_type', COALESCE(txn_type, 'Subscription Payment'),
    'txn_date_label', txn_date_label,
    'payment_method', payment_method,
    'amount_fiat', COALESCE(amount_fiat, 0),
    'amount_crypto', amount_crypto,
    'currency', COALESCE(currency, 'USDC'),
    'solana_signature', solana_signature,
    'explorer_url', explorer_url,
    'status', status,
    'notes', notes,
    'created_at', created_at
  )) INTO v_txns
  FROM public.umkm_billing_transactions
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
    AND (p_search IS NULL OR p_search = '' OR txn_hash ILIKE '%' || p_search || '%' OR payment_method ILIKE '%' || p_search || '%' OR txn_type ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR p_status = '' OR p_status = 'Semua' OR status ILIKE p_status);

  -- Summary Metrics
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Berhasil')
  INTO v_total_count, v_success_count
  FROM public.umkm_billing_transactions
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  v_result := jsonb_build_object(
    'success', true,
    'transactions', COALESCE(v_txns, '[]'::jsonb),
    'metrics', jsonb_build_object(
      'total_transactions', COALESCE(v_total_count, 0),
      'success_count', COALESCE(v_success_count, 0),
      'success_rate_pct', CASE WHEN v_total_count > 0 THEN ROUND((v_success_count::numeric / v_total_count::numeric) * 100, 1) ELSE 100 END
    )
  );

  RETURN v_result;
END;
$$;

-- 4. Idempotent Realtime Publication Setup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'umkm_billing_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_transactions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Publication addition skipped or handled: %', SQLERRM;
END $$;
