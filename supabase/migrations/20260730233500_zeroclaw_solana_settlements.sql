-- ============================================================================
-- ZEGA AI x ZeroClaw Solana Pay Settlements & SOP Checkpoints Schema
-- Migration: 20260730233500_zeroclaw_solana_settlements.sql
-- Description: Production schema for ZeroClaw agentic Solana Pay settlements,
--              reference keys, Devnet RPC signatures, and SOP approval checkpoints.
-- Idempotency: Fully guarded with DROP IF EXISTS for repeatable SQL execution.
-- ============================================================================

-- Create zeroclaw_solana_settlements table
CREATE TABLE IF NOT EXISTS public.zeroclaw_solana_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_pubkey TEXT NOT NULL DEFAULT 'ZeGAMerchantPubkey111111111111111111111',
    amount_usdc NUMERIC(14, 4) NOT NULL CHECK (amount_usdc > 0),
    reference_key TEXT UNIQUE NOT NULL,
    tx_signature TEXT UNIQUE,
    network TEXT NOT NULL DEFAULT 'solana-devnet' CHECK (network IN ('solana-devnet', 'solana-mainnet')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'finalized', 'failed')),
    memo TEXT,
    privy_wallet_address TEXT,
    privy_user_id TEXT,
    privy_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create zeroclaw_sop_checkpoints table for prompt injection human-in-the-loop approvals
CREATE TABLE IF NOT EXISTS public.zeroclaw_sop_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkpoint_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_channel TEXT NOT NULL DEFAULT 'WhatsApp (+628198765432)',
    amount_usdc NUMERIC(14, 4) NOT NULL CHECK (amount_usdc >= 0),
    recipient_address TEXT NOT NULL,
    prompt_warning TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    injection_flagged BOOLEAN NOT NULL DEFAULT TRUE,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_user_id ON public.zeroclaw_solana_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_reference ON public.zeroclaw_solana_settlements(reference_key);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_tx_sig ON public.zeroclaw_solana_settlements(tx_signature);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_status ON public.zeroclaw_solana_settlements(status);

CREATE INDEX IF NOT EXISTS idx_zeroclaw_checkpoints_user_id ON public.zeroclaw_sop_checkpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_checkpoints_id ON public.zeroclaw_sop_checkpoints(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_checkpoints_status ON public.zeroclaw_sop_checkpoints(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.zeroclaw_solana_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zeroclaw_sop_checkpoints ENABLE ROW LEVEL SECURITY;

-- ── DROP EXISTING POLICIES FOR IDEMPOTENT EXECUTION ──
DROP POLICY IF EXISTS "Users can view owned or public demo settlements" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Users can insert settlement requests" ON public.zeroclaw_solana_settlements;

DROP POLICY IF EXISTS "Users can view owned or public sop checkpoints" ON public.zeroclaw_sop_checkpoints;
DROP POLICY IF EXISTS "Users can update owned sop checkpoints" ON public.zeroclaw_sop_checkpoints;

-- RLS Policies for Settlements
CREATE POLICY "Users can view owned or public demo settlements"
    ON public.zeroclaw_solana_settlements
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert settlement requests"
    ON public.zeroclaw_solana_settlements
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
    );

-- RLS Policies for SOP Checkpoints
CREATE POLICY "Users can view owned or public sop checkpoints"
    ON public.zeroclaw_sop_checkpoints
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update owned sop checkpoints"
    ON public.zeroclaw_sop_checkpoints
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL 
        OR auth.role() = 'service_role'
    );

-- Automatically update updated_at timestamp triggers
CREATE OR REPLACE FUNCTION public.handle_zeroclaw_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_zeroclaw_settlements_updated_at ON public.zeroclaw_solana_settlements;
CREATE TRIGGER tr_zeroclaw_settlements_updated_at
    BEFORE UPDATE ON public.zeroclaw_solana_settlements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_zeroclaw_updated_at();

DROP TRIGGER IF EXISTS tr_zeroclaw_checkpoints_updated_at ON public.zeroclaw_sop_checkpoints;
CREATE TRIGGER tr_zeroclaw_checkpoints_updated_at
    BEFORE UPDATE ON public.zeroclaw_sop_checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_zeroclaw_updated_at();

-- Safe Realtime Publication handling
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'zeroclaw_solana_settlements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zeroclaw_solana_settlements;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'zeroclaw_sop_checkpoints'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zeroclaw_sop_checkpoints;
    END IF;
END $$;
