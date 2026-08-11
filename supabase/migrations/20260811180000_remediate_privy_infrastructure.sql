-- ZEGA AI — Privy Payment Infrastructure Remediation Migration
-- Migration ID: 20260811180000_remediate_privy_infrastructure.sql
-- Fixes PRIVY-004 and enforces all financial database invariants.

BEGIN;

-- 1. Ensure `wallets` table exists with canonical schema
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    privy_user_id TEXT,
    privy_wallet_id TEXT,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'solana',
    wallet_type TEXT NOT NULL DEFAULT 'privy_embedded',
    is_primary BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_chain UNIQUE (user_id, chain),
    CONSTRAINT unique_wallet_address UNIQUE (wallet_address)
);

-- 2. Ensure `privy_wallets` table exists and matches canonical constraints
CREATE TABLE IF NOT EXISTS public.privy_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    privy_user_id TEXT,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'solana',
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_privy_user_chain UNIQUE (user_id, chain),
    CONSTRAINT unique_privy_wallet_address UNIQUE (wallet_address)
);

-- 3. Ensure `invoices` table constraints
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    wallet_id TEXT,
    currency TEXT NOT NULL DEFAULT 'SOL',
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    payment_signature TEXT,
    paid_amount NUMERIC DEFAULT 0,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ensure `payments` table has UNIQUE(signature)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    signature TEXT UNIQUE NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    block_slot BIGINT,
    block_time TIMESTAMPTZ,
    confirmation_status TEXT DEFAULT 'finalized',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Ensure `ledger_entries` table exists
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    wallet_id TEXT,
    type TEXT NOT NULL,
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Ensure `withdrawals` table has UNIQUE(idempotency_key)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    wallet_id TEXT,
    privy_user_id TEXT,
    asset TEXT NOT NULL DEFAULT 'SOL',
    token_mint TEXT,
    amount NUMERIC NOT NULL,
    amount_base_units TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    signature TEXT,
    fee NUMERIC,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Ensure `privy_webhook_events` table has UNIQUE(id)
CREATE TABLE IF NOT EXISTS public.privy_webhook_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    privy_user_id TEXT,
    wallet_address TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Ensure `reconciliation_records` table exists
CREATE TABLE IF NOT EXISTS public.reconciliation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature TEXT NOT NULL,
    expected_amount NUMERIC NOT NULL,
    actual_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECONCILED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guarantee all columns exist on pre-existing tables from older migrations
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS privy_user_id TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS privy_wallet_id TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

ALTER TABLE public.privy_wallets ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.privy_wallets ADD COLUMN IF NOT EXISTS privy_user_id TEXT;
ALTER TABLE public.privy_wallets ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.privy_wallets ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';
ALTER TABLE public.privy_wallets ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Normalize user_id types, email backfills, and unique constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'privy_wallets_user_id_fkey' 
        AND table_name = 'privy_wallets'
    ) THEN
        ALTER TABLE public.privy_wallets DROP CONSTRAINT privy_wallets_user_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'privy_wallets' 
        AND column_name = 'user_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.privy_wallets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'wallets' 
        AND column_name = 'user_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.wallets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'privy_wallets' AND column_name = 'email'
    ) THEN
        UPDATE public.privy_wallets SET user_id = email WHERE user_id IS NULL;
    END IF;

    -- Ensure unique constraint on (user_id, chain) for privy_wallets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_privy_user_chain'
    ) THEN
        DELETE FROM public.privy_wallets a USING public.privy_wallets b
        WHERE a.id < b.id AND a.user_id = b.user_id AND a.chain = b.chain;

        ALTER TABLE public.privy_wallets ADD CONSTRAINT unique_privy_user_chain UNIQUE (user_id, chain);
    END IF;

    -- Ensure unique constraint on (user_id, chain) for wallets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_chain'
    ) THEN
        DELETE FROM public.wallets a USING public.wallets b
        WHERE a.id < b.id AND a.user_id = b.user_id AND a.chain = b.chain;

        ALTER TABLE public.wallets ADD CONSTRAINT unique_user_chain UNIQUE (user_id, chain);
    END IF;
END $$;

-- 9. Sync any missing rows from `wallets` to `privy_wallets`
INSERT INTO public.privy_wallets (user_id, privy_user_id, wallet_address, chain, is_primary, created_at, updated_at)
SELECT user_id::text, privy_user_id, wallet_address, chain, is_primary, created_at, updated_at
FROM public.wallets
ON CONFLICT (user_id, chain) DO UPDATE SET
    wallet_address = EXCLUDED.wallet_address,
    updated_at = EXCLUDED.updated_at;

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_signature ON public.payments(signature);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_idempotency ON public.withdrawals(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.ledger_entries(user_id);

COMMIT;
