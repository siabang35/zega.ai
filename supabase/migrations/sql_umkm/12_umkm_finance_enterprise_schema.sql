-- ============================================================================
-- ZEGA AI: UMKM Finance & Solana Pay Terminal Enterprise Schema Migration
-- File: 12_umkm_finance_enterprise_schema.sql
-- ============================================================================

-- 1. Create umkm_finance_metrics table
CREATE TABLE IF NOT EXISTS public.umkm_finance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 2450.00,
    total_expense NUMERIC(14, 2) NOT NULL DEFAULT 680.00,
    net_profit NUMERIC(14, 2) NOT NULL DEFAULT 1770.00,
    profit_margin NUMERIC(5, 2) NOT NULL DEFAULT 72.20,
    cash_balance_usdc NUMERIC(14, 2) NOT NULL DEFAULT 1950.00,
    cash_balance_idr NUMERIC(16, 2) NOT NULL DEFAULT 31512000.00,
    revenue_growth NUMERIC(5, 2) DEFAULT 18.00,
    expense_growth NUMERIC(5, 2) DEFAULT -8.00,
    profit_growth NUMERIC(5, 2) DEFAULT 32.00,
    margin_growth NUMERIC(5, 2) DEFAULT 6.50,
    period_label TEXT DEFAULT '1 Jul - 31 Jul 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create umkm_finance_cashflow table
CREATE TABLE IF NOT EXISTS public.umkm_finance_cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    date_label TEXT NOT NULL,
    income NUMERIC(14, 2) NOT NULL,
    expense NUMERIC(14, 2) NOT NULL,
    balance NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create umkm_finance_expenses table
CREATE TABLE IF NOT EXISTS public.umkm_finance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    amount_usdc NUMERIC(14, 2) NOT NULL,
    color_hex TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create umkm_finance_solana_tx table
CREATE TABLE IF NOT EXISTS public.umkm_finance_solana_tx (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    amount_usdc NUMERIC(14, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sukses', -- Sukses, Pending, Gagal
    time_ago TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create umkm_finance_invoices table
CREATE TABLE IF NOT EXISTS public.umkm_finance_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    invoice_code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    due_status TEXT NOT NULL, -- Jatuh tempo hari ini, 2 hari lagi, 4 hari lagi
    amount_usdc NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_finance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_finance_cashflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_finance_solana_tx ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_finance_invoices ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies
DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_metrics" ON public.umkm_finance_metrics;
CREATE POLICY "Allow all for authenticated umkm_finance_metrics" ON public.umkm_finance_metrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_cashflow" ON public.umkm_finance_cashflow;
CREATE POLICY "Allow all for authenticated umkm_finance_cashflow" ON public.umkm_finance_cashflow FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_expenses" ON public.umkm_finance_expenses;
CREATE POLICY "Allow all for authenticated umkm_finance_expenses" ON public.umkm_finance_expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_solana_tx" ON public.umkm_finance_solana_tx;
CREATE POLICY "Allow all for authenticated umkm_finance_solana_tx" ON public.umkm_finance_solana_tx FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_invoices" ON public.umkm_finance_invoices;
CREATE POLICY "Allow all for authenticated umkm_finance_invoices" ON public.umkm_finance_invoices FOR ALL USING (true);

-- Enable Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_finance_metrics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_finance_metrics;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_finance_solana_tx'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_finance_solana_tx;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_finance_invoices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_finance_invoices;
    END IF;
END $$;

-- Purge existing demo records if present
DELETE FROM public.umkm_finance_solana_tx WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_finance_expenses WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_finance_cashflow WHERE store_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_finance_invoices WHERE store_id = '11111111-1111-1111-1111-111111111111';

-- Seed Metrics Data (Matching Reference Screenshot image_1689)
INSERT INTO public.umkm_finance_metrics (
    id, store_id, total_revenue, total_expense, net_profit, profit_margin, cash_balance_usdc, cash_balance_idr,
    revenue_growth, expense_growth, profit_growth, margin_growth, period_label
) VALUES (
    '44444444-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    2450.00,
    680.00,
    1770.00,
    72.20,
    1950.00,
    31512000.00,
    18.00,
    -8.00,
    32.00,
    6.50,
    '1 Jul - 31 Jul 2026'
) ON CONFLICT (id) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    updated_at = NOW();

-- Seed Cash Flow Data
INSERT INTO public.umkm_finance_cashflow (store_id, date_label, income, expense, balance) VALUES
('11111111-1111-1111-1111-111111111111', '1 Jul', 350.00, 120.00, 230.00),
('11111111-1111-1111-1111-111111111111', '6 Jul', 620.00, 180.00, 440.00),
('11111111-1111-1111-1111-111111111111', '11 Jul', 500.00, 150.00, 350.00),
('11111111-1111-1111-1111-111111111111', '16 Jul', 1020.00, 420.00, 600.00),
('11111111-1111-1111-1111-111111111111', '21 Jul', 780.00, 210.00, 570.00),
('11111111-1111-1111-1111-111111111111', '26 Jul', 910.00, 310.00, 600.00),
('11111111-1111-1111-1111-111111111111', '31 Jul', 820.00, 250.00, 570.00);

-- Seed Expense Breakdown Data
INSERT INTO public.umkm_finance_expenses (store_id, category_name, percentage, amount_usdc, color_hex) VALUES
('11111111-1111-1111-1111-111111111111', 'Kasir Operasional', 45.00, 306.00, '#3b82f6'),
('11111111-1111-1111-1111-111111111111', 'Gas & RPC Fee', 25.00, 170.00, '#f97316'),
('11111111-1111-1111-1111-111111111111', 'SOP Audit Reserve', 15.00, 102.00, '#a855f7'),
('11111111-1111-1111-1111-111111111111', 'Pengiriman', 10.00, 68.00, '#06b6d4'),
('11111111-1111-1111-1111-111111111111', 'Lainnya', 5.00, 34.00, '#64748b');

-- Seed Solana Recent Transactions (Matching image_1689)
INSERT INTO public.umkm_finance_solana_tx (store_id, tx_hash, customer_name, amount_usdc, status, time_ago) VALUES
('11111111-1111-1111-1111-111111111111', 'TX#7Gf8...n3dA', 'Siti Aisyah', 25.00, 'Sukses', '2 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'TX#3Hd9...m7kB', 'Budi Santoso', 18.50, 'Sukses', '15 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'TX#5Jk2...p9xC', 'Dewi Lestari', 42.00, 'Sukses', '28 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'TX#9Lm1...q4wO', 'Rizky Pratama', 12.75, 'Pending', '35 menit lalu'),
('11111111-1111-1111-1111-111111111111', 'TX#1Xc3...v8zE', 'Maya Putri', 35.00, 'Sukses', '1 jam lalu');

-- Seed Invoices Due Data
INSERT INTO public.umkm_finance_invoices (store_id, invoice_code, customer_name, due_status, amount_usdc) VALUES
('11111111-1111-1111-1111-111111111111', 'INV-2026-0722', 'Siti Aisyah', 'Jatuh tempo hari ini', 25.00),
('11111111-1111-1111-1111-111111111111', 'INV-2026-0720', 'Budi Santoso', '2 hari lagi', 18.50),
('11111111-1111-1111-1111-111111111111', 'INV-2026-0718', 'Dewi Lestari', '4 hari lagi', 42.00);
