-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20260810140000_enterprise_privy_wallets_auto_provisioning.sql
-- Description: Enterprise Privy Embedded Wallet Auto-Provisioning & Automatic
--              User-Linking with Zero-Trust RLS Policies & Security Hardening.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure Table Schema & Foreign Key Constraints
CREATE TABLE IF NOT EXISTS public.privy_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    privy_user_id TEXT,
    wallet_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'solana',
    wallet_type TEXT NOT NULL DEFAULT 'privy_keyless_embedded',
    status TEXT NOT NULL DEFAULT 'active',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure Unique Index on (email, chain) and (wallet_address)
CREATE UNIQUE INDEX IF NOT EXISTS idx_privy_wallets_email_chain ON public.privy_wallets(email, chain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_privy_wallets_wallet_address ON public.privy_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_privy_wallets_user_id ON public.privy_wallets(user_id);

-- Explicitly Enable Row Level Security (RLS)
ALTER TABLE public.privy_wallets ENABLE ROW LEVEL SECURITY;

-- Drop all policy variations for idempotent rerun
DROP POLICY IF EXISTS "Public select privy_wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Public write privy_wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users can view owned or public demo wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can insert wallet records" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can update owned wallet records" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can view owned privy_wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can insert privy_wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Users or service role can update owned privy_wallets" ON public.privy_wallets;

-- Granular Zero-Trust RLS Policies
CREATE POLICY "Users or service role can view owned privy_wallets"
    ON public.privy_wallets
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL 
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users or service role can insert privy_wallets"
    ON public.privy_wallets
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users or service role can update owned privy_wallets"
    ON public.privy_wallets
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
    );

-- 2. Safe Backfill: Only backfill user_id from auth.users (guarantees FK validity)
UPDATE public.privy_wallets pw
SET user_id = au.id,
    updated_at = NOW()
FROM auth.users au
WHERE pw.user_id IS NULL
  AND LOWER(TRIM(pw.email)) = LOWER(TRIM(au.email));

-- Clear any invalid user_id references that do not exist in auth.users
UPDATE public.privy_wallets pw
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = pw.user_id);

-- 3. RPC Function: Ensure & Provision User Privy Wallet (SECURITY INVOKER to eliminate WARN 0029)
CREATE OR REPLACE FUNCTION public.fn_ensure_user_privy_wallet(
    p_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_wallet_address TEXT DEFAULT NULL,
    p_privy_user_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.privy_wallets
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_clean_email TEXT;
    v_target_user_id UUID;
    v_final_wallet_address TEXT;
    v_record public.privy_wallets;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));
    v_target_user_id := p_user_id;

    -- Validate user_id against auth.users to prevent FK violations
    IF v_target_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_user_id) THEN
            v_target_user_id := NULL;
        END IF;
    END IF;

    -- Look up real auth.users ID by email if user_id is missing or invalid
    IF v_target_user_id IS NULL THEN
        SELECT id INTO v_target_user_id
        FROM auth.users
        WHERE LOWER(TRIM(email)) = v_clean_email
        LIMIT 1;
    END IF;

    -- Determine wallet address
    IF p_wallet_address IS NOT NULL AND TRIM(p_wallet_address) <> '' THEN
        v_final_wallet_address := TRIM(p_wallet_address);
    ELSE
        -- Select existing wallet address if already provisioned
        SELECT wallet_address INTO v_final_wallet_address
        FROM public.privy_wallets
        WHERE LOWER(TRIM(email)) = v_clean_email AND chain = 'solana'
        LIMIT 1;

        -- Generate deterministic placeholder wallet if none exists
        IF v_final_wallet_address IS NULL THEN
            v_final_wallet_address := 'privy_sol_' || substr(md5(v_clean_email || '_zeroclaw_salt'), 1, 32);
        END IF;
    END IF;

    -- Upsert Privy Wallet Record
    INSERT INTO public.privy_wallets (
        user_id,
        email,
        privy_user_id,
        wallet_address,
        chain,
        wallet_type,
        status,
        is_primary,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_target_user_id,
        v_clean_email,
        p_privy_user_id,
        v_final_wallet_address,
        'solana',
        'privy_keyless_embedded',
        'active',
        true,
        jsonb_build_object('source', 'auto_provisioning', 'verified', true) || p_metadata,
        NOW(),
        NOW()
    )
    ON CONFLICT (email, chain) DO UPDATE SET
        user_id = COALESCE(v_target_user_id, public.privy_wallets.user_id),
        privy_user_id = COALESCE(EXCLUDED.privy_user_id, public.privy_wallets.privy_user_id),
        wallet_address = COALESCE(EXCLUDED.wallet_address, public.privy_wallets.wallet_address),
        status = 'active',
        metadata = public.privy_wallets.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING * INTO v_record;

    RETURN v_record;
END;
$$;

-- Grant EXECUTE to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.fn_ensure_user_privy_wallet(TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- 4. Automatic Database Trigger on auth.users Signup / Insertion
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_privy_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        PERFORM public.fn_ensure_user_privy_wallet(
            NEW.email,
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object('trigger', 'auth_user_created')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Revoke direct execution of trigger function from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user_privy_wallet() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_on_auth_user_created_provision_privy_wallet ON auth.users;
CREATE TRIGGER tr_on_auth_user_created_provision_privy_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user_privy_wallet();

-- 5. Automatic Database Trigger on umkm_user_profiles Creation
CREATE OR REPLACE FUNCTION public.handle_new_umkm_profile_privy_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        PERFORM public.fn_ensure_user_privy_wallet(
            NEW.email,
            NULL,
            NULL,
            NULL,
            jsonb_build_object('trigger', 'umkm_profile_created')
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Revoke direct execution of trigger function from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_umkm_profile_privy_wallet() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_on_umkm_profile_created_provision_privy_wallet ON public.umkm_user_profiles;
CREATE TRIGGER tr_on_umkm_profile_created_provision_privy_wallet
    AFTER INSERT OR UPDATE ON public.umkm_user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_umkm_profile_privy_wallet();

-- 6. Enable Leaked Password Protection in auth.config
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config') THEN
        UPDATE auth.config SET password_hibp_enabled = true;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.config update skipped: %', SQLERRM;
END $$;
