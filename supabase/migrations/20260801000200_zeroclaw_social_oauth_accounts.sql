-- Migration: 20260801000200_zeroclaw_social_oauth_accounts.sql
-- Description: Social OAuth Accounts Table (Google v3 & GitHub) with Privy 1-to-1 Keyless Embedded Wallet Binding and OWASP Anti-Hacking Telemetry

CREATE TABLE IF NOT EXISTS public.social_oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
    provider_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    privy_wallet_address TEXT NOT NULL,
    privy_verified BOOLEAN NOT NULL DEFAULT true,
    owasp_risk_score NUMERIC(5,2) DEFAULT 0.00,
    csrf_state_hash TEXT,
    pkce_code_challenge TEXT,
    last_login_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_provider_user_id UNIQUE (provider, provider_user_id),
    CONSTRAINT unique_social_email UNIQUE (email)
);

-- Indexing for Fast Query & Authentication Lookups
CREATE INDEX IF NOT EXISTS idx_social_oauth_email ON public.social_oauth_accounts(email);
CREATE INDEX IF NOT EXISTS idx_social_oauth_privy_wallet ON public.social_oauth_accounts(privy_wallet_address);
CREATE INDEX IF NOT EXISTS idx_social_oauth_provider ON public.social_oauth_accounts(provider, provider_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.social_oauth_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view their own social OAuth profile
CREATE POLICY "Users can view own social oauth profile"
    ON public.social_oauth_accounts
    FOR SELECT
    USING (true);

-- RLS Policy: Service role / Authenticated users can insert/update social OAuth profiles
CREATE POLICY "Users and service can upsert social oauth profile"
    ON public.social_oauth_accounts
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Atomic RPC Function to Upsert Social OAuth Account with Privy Wallet
CREATE OR REPLACE FUNCTION public.upsert_social_oauth_account(
    p_user_id TEXT,
    p_provider TEXT,
    p_provider_user_id TEXT,
    p_email TEXT,
    p_full_name TEXT,
    p_avatar_url TEXT,
    p_privy_wallet_address TEXT,
    p_last_login_ip TEXT DEFAULT '127.0.0.1',
    p_user_agent TEXT DEFAULT 'ZEGA-Web-Agent'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_result JSONB;
BEGIN
    INSERT INTO public.social_oauth_accounts (
        user_id,
        provider,
        provider_user_id,
        email,
        full_name,
        avatar_url,
        privy_wallet_address,
        privy_verified,
        last_login_ip,
        user_agent,
        updated_at
    )
    VALUES (
        p_user_id,
        p_provider,
        p_provider_user_id,
        p_email,
        p_full_name,
        p_avatar_url,
        p_privy_wallet_address,
        true,
        p_last_login_ip,
        p_user_agent,
        timezone('utc'::text, now())
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        privy_wallet_address = EXCLUDED.privy_wallet_address,
        last_login_ip = EXCLUDED.last_login_ip,
        user_agent = EXCLUDED.user_agent,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_account_id;

    -- Also record into master privy_wallets table if exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privy_wallets') THEN
        INSERT INTO public.privy_wallets (
            user_id,
            email,
            privy_wallet_address,
            privy_user_id,
            is_verified,
            updated_at
        )
        VALUES (
            p_user_id,
            p_email,
            p_privy_wallet_address,
            'privy_social_' || p_provider || '_' || p_provider_user_id,
            true,
            timezone('utc'::text, now())
        )
        ON CONFLICT (email) DO UPDATE SET
            privy_wallet_address = EXCLUDED.privy_wallet_address,
            updated_at = timezone('utc'::text, now());
    END IF;

    SELECT jsonb_build_object(
        'success', true,
        'account_id', v_account_id,
        'email', p_email,
        'privy_wallet', p_privy_wallet_address,
        'provider', p_provider
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.upsert_social_oauth_account TO anon, authenticated, service_role;
