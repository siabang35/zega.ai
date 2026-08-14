-- Migration: 20260811_full_privy_payment_infrastructure.sql
-- Description: Comprehensive database schema for ZEGA Privy Wallets, Invoices, Blockchain Payments, Ledger, and Withdrawals.

CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    privy_user_id VARCHAR(255) NOT NULL,
    privy_wallet_id VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL DEFAULT 'solana',
    wallet_type VARCHAR(50) NOT NULL DEFAULT 'privy_embedded',
    is_primary BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_chain UNIQUE (user_id, chain),
    CONSTRAINT unique_wallet_address UNIQUE (wallet_address),
    CONSTRAINT unique_privy_wallet_id UNIQUE (privy_wallet_id)
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    currency VARCHAR(20) NOT NULL DEFAULT 'SOL',
    asset VARCHAR(20) NOT NULL DEFAULT 'SOL',
    token_mint VARCHAR(255),
    amount NUMERIC(36, 18) NOT NULL,
    amount_base_units VARCHAR(78) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- DRAFT, PENDING, PARTIALLY_PAID, PAID, EXPIRED, CANCELLED, REFUNDED
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    payment_signature VARCHAR(255),
    paid_amount NUMERIC(36, 18) DEFAULT 0,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    user_id VARCHAR(255) NOT NULL,
    signature VARCHAR(255) UNIQUE NOT NULL,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    asset VARCHAR(20) NOT NULL DEFAULT 'SOL',
    token_mint VARCHAR(255),
    amount NUMERIC(36, 18) NOT NULL,
    amount_base_units VARCHAR(78) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    block_slot BIGINT,
    block_time TIMESTAMPTZ,
    confirmation_status VARCHAR(50) DEFAULT 'finalized',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- PAYMENT, WITHDRAWAL, REFUND, ADJUSTMENT, FEE
    asset VARCHAR(20) NOT NULL DEFAULT 'SOL',
    token_mint VARCHAR(255),
    amount NUMERIC(36, 18) NOT NULL,
    amount_base_units VARCHAR(78) NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(255),
    direction VARCHAR(20) NOT NULL, -- CREDIT, DEBIT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    privy_user_id VARCHAR(255) NOT NULL,
    asset VARCHAR(20) NOT NULL DEFAULT 'SOL',
    token_mint VARCHAR(255),
    amount NUMERIC(36, 18) NOT NULL,
    amount_base_units VARCHAR(78) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, VALIDATING, BUILDING, AWAITING_SIGNATURE, SIGNED, SUBMITTED, CONFIRMING, CONFIRMED, FAILED, REJECTED, EXPIRED, CANCELLED
    signature VARCHAR(255),
    fee NUMERIC(36, 18),
    error_code VARCHAR(100),
    error_message TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    privy_user_id VARCHAR(255),
    wallet_address VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reconciliation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature VARCHAR(255) NOT NULL,
    expected_amount NUMERIC(36, 18) NOT NULL,
    actual_amount NUMERIC(36, 18) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECONCILED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist even if tables were created by earlier migrations
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS signature VARCHAR(255);
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS privy_user_id VARCHAR(255);
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS wallet_id UUID;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS amount_base_units VARCHAR(78);
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS sender VARCHAR(255);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS signature VARCHAR(255);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount_base_units VARCHAR(78);

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_signature VARCHAR(255);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(36, 18) DEFAULT 0;

ALTER TABLE public.reconciliation_records ADD COLUMN IF NOT EXISTS signature VARCHAR(255);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_privy_user_id ON public.wallets(privy_user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recipient ON public.invoices(recipient_address);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_signature ON public.payments(signature);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_idemp ON public.withdrawals(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_withdrawals_sig ON public.withdrawals(signature);

