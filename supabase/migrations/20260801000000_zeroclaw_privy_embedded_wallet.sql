-- ============================================================================
-- ZEGA AI x Privy Keyless Embedded Wallet Metadata Migration
-- Migration: 20260801000000_zeroclaw_privy_embedded_wallet.sql
-- Description: Adds Privy non-custodial wallet metadata columns, indexes, and RLS policies
--              to zeroclaw_solana_settlements table.
-- ============================================================================

-- Ensure Privy metadata columns exist on zeroclaw_solana_settlements
ALTER TABLE public.zeroclaw_solana_settlements
    ADD COLUMN IF NOT EXISTS privy_wallet_address TEXT,
    ADD COLUMN IF NOT EXISTS privy_user_id TEXT,
    ADD COLUMN IF NOT EXISTS privy_verified BOOLEAN DEFAULT FALSE;

-- High-performance indexes for Privy wallet querying
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_privy_wallet ON public.zeroclaw_solana_settlements(privy_wallet_address);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_privy_user ON public.zeroclaw_solana_settlements(privy_user_id);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_privy_verified ON public.zeroclaw_solana_settlements(privy_verified);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.zeroclaw_solana_settlements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.zeroclaw_solana_settlements TO service_role;
