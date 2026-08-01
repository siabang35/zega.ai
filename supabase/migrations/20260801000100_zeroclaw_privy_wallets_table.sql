-- ============================================================================
-- ZEGA AI x Privy Keyless Embedded Wallets Master Schema
-- Migration: 20260801000100_zeroclaw_privy_wallets_table.sql
-- Description: Creates dedicated public.privy_wallets table for 1-to-1 email-based
--              non-custodial Solana wallet binding across UMKM, Enterprise, and SuperAdmin.
-- Idempotency: Fully guarded with IF NOT EXISTS, DROP POLICY IF EXISTS, and safe triggers.
-- ============================================================================

-- Create public.privy_wallets table
CREATE TABLE IF NOT EXISTS public.privy_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    privy_user_id TEXT UNIQUE,
    wallet_address TEXT UNIQUE NOT NULL,
    chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain IN ('solana', 'ethereum', 'polygon', 'arbitrum')),
    wallet_type TEXT NOT NULL DEFAULT 'privy_keyless_embedded' CHECK (wallet_type IN ('privy_keyless_embedded', 'external_phantom', 'external_solflare')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_privy_wallets_user_id ON public.privy_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_privy_wallets_email ON public.privy_wallets(email);
CREATE INDEX IF NOT EXISTS idx_privy_wallets_address ON public.privy_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_privy_wallets_privy_user ON public.privy_wallets(privy_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.privy_wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotent execution
DROP POLICY IF EXISTS "Users can view owned or public demo wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can insert wallet records" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can update owned wallet records" ON public.privy_wallets;

-- RLS Policies
CREATE POLICY "Users can view owned or public demo wallets"
    ON public.privy_wallets
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users or service role can insert wallet records"
    ON public.privy_wallets
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users or service role can update owned wallet records"
    ON public.privy_wallets
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
    );

-- Automatically update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_privy_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_privy_wallets_updated_at ON public.privy_wallets;
CREATE TRIGGER tr_privy_wallets_updated_at
    BEFORE UPDATE ON public.privy_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_privy_wallets_updated_at();

-- RPC Helper Function: Upsert Privy Wallet Record
CREATE OR REPLACE FUNCTION public.upsert_privy_wallet(
    p_user_id UUID,
    p_email TEXT,
    p_privy_user_id TEXT,
    p_wallet_address TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.privy_wallets AS $$
DECLARE
    v_record public.privy_wallets;
BEGIN
    INSERT INTO public.privy_wallets (
        user_id,
        email,
        privy_user_id,
        wallet_address,
        metadata,
        updated_at
    ) VALUES (
        p_user_id,
        LOWER(TRIM(p_email)),
        p_privy_user_id,
        p_wallet_address,
        p_metadata,
        NOW()
    )
    ON CONFLICT (wallet_address) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        email = EXCLUDED.email,
        privy_user_id = COALESCE(EXCLUDED.privy_user_id, public.privy_wallets.privy_user_id),
        metadata = public.privy_wallets.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated & service_role
GRANT SELECT, INSERT, UPDATE ON public.privy_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.privy_wallets TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_privy_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_privy_wallet TO service_role;

-- Safe Supabase Realtime Publication handling
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'privy_wallets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.privy_wallets;
    END IF;
END $$;
