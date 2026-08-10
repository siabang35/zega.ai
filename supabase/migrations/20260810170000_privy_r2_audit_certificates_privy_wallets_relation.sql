-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20260810170000_privy_r2_audit_certificates_privy_wallets_relation.sql
-- Description: Clean Drop & Fresh Recreation of public.privy_wallets with RLS 
--              and Foreign Key Linkage (No Legacy Backfill).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Clean Drop Table
DROP TABLE IF EXISTS public.privy_wallets CASCADE;

-- 2. Recreate Fresh public.privy_wallets Schema (1 Email = 1 Active Solana Wallet)
CREATE TABLE public.privy_wallets (
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

-- Unique Indexes: Guarantee 1 Primary Wallet per Email + Unique Address
CREATE UNIQUE INDEX idx_privy_wallets_email_chain ON public.privy_wallets(email, chain);
CREATE UNIQUE INDEX idx_privy_wallets_wallet_address ON public.privy_wallets(wallet_address);
CREATE INDEX idx_privy_wallets_user_id ON public.privy_wallets(user_id);

-- Enable RLS & Permissive Policies
ALTER TABLE public.privy_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view privy_wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Public insert privy_wallets" ON public.privy_wallets;
DROP POLICY IF EXISTS "Public update privy_wallets" ON public.privy_wallets;

CREATE POLICY "Public view privy_wallets" ON public.privy_wallets FOR SELECT USING (TRUE);
CREATE POLICY "Public insert privy_wallets" ON public.privy_wallets FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public update privy_wallets" ON public.privy_wallets FOR UPDATE USING (TRUE);

-- 3. Link Foreign Key to privy_r2_audit_certificates
ALTER TABLE public.privy_r2_audit_certificates
ADD COLUMN IF NOT EXISTS privy_wallet_id UUID REFERENCES public.privy_wallets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_privy_r2_audit_certificates_privy_wallet_id
ON public.privy_r2_audit_certificates(privy_wallet_id);

CREATE INDEX IF NOT EXISTS idx_privy_r2_audit_certificates_wallet_address
ON public.privy_r2_audit_certificates(privy_wallet_address);

-- 4. Automatic BEFORE INSERT/UPDATE Trigger to Auto-Populate user_id from auth.users or profiles
CREATE OR REPLACE FUNCTION public.trg_fn_link_privy_wallet_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
        -- 1. Try resolving matching UUID from auth.users
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
        LIMIT 1;

        -- 2. Fallback to public.profiles if auth.users record is not found
        IF v_user_id IS NULL THEN
            SELECT id INTO v_user_id
            FROM public.profiles
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
            LIMIT 1;
        END IF;

        -- 3. Set NEW.user_id (NULL if no auth.users record exists yet, satisfying FK 23503)
        NEW.user_id := v_user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_privy_wallet_user_id ON public.privy_wallets;
CREATE TRIGGER trg_link_privy_wallet_user_id
BEFORE INSERT OR UPDATE ON public.privy_wallets
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_link_privy_wallet_user_id();

-- Backfill existing records where user_id is currently NULL by matching auth.users
UPDATE public.privy_wallets pw
SET user_id = au.id,
    updated_at = NOW()
FROM auth.users au
WHERE pw.user_id IS NULL
  AND LOWER(TRIM(pw.email)) = LOWER(TRIM(au.email));

-- 4. RPC Procedure for atomic insertion & linking upon fresh user login
CREATE OR REPLACE FUNCTION public.record_privy_r2_audit_certificate(
    p_user_id TEXT,
    p_email TEXT,
    p_privy_wallet_address TEXT,
    p_privy_did TEXT DEFAULT NULL,
    p_r2_cdn_url TEXT DEFAULT '',
    p_r2_object_key TEXT DEFAULT '',
    p_sha256_checksum TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_wallet_id UUID;
    v_target_user_id UUID;
    v_result JSONB;
BEGIN
    -- Try resolving real user_id from public.profiles or auth.users by email
    BEGIN
        IF p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_target_user_id := p_user_id::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_target_user_id := NULL;
    END;

    IF v_target_user_id IS NULL THEN
        SELECT id INTO v_target_user_id
        FROM public.profiles
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email))
        LIMIT 1;
    END IF;

    -- Ensure wallet exists in privy_wallets and populate privy_user_id (DID) + user_id
    INSERT INTO public.privy_wallets (
        user_id,
        email,
        privy_user_id,
        wallet_address,
        chain,
        wallet_type,
        status,
        is_primary,
        metadata
    ) VALUES (
        v_target_user_id,
        LOWER(TRIM(p_email)),
        p_privy_did,
        TRIM(p_privy_wallet_address),
        'solana',
        'privy_keyless_embedded',
        'active',
        TRUE,
        jsonb_build_object('source', 'r2_audit_certificate_trigger')
    )
    ON CONFLICT (email, chain) DO UPDATE
    SET wallet_address = EXCLUDED.wallet_address,
        privy_user_id = COALESCE(EXCLUDED.privy_user_id, public.privy_wallets.privy_user_id),
        user_id = COALESCE(EXCLUDED.user_id, public.privy_wallets.user_id),
        updated_at = NOW()
    RETURNING id INTO v_wallet_id;

    IF v_wallet_id IS NULL THEN
        SELECT id INTO v_wallet_id
        FROM public.privy_wallets
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_email)) AND chain = 'solana'
        LIMIT 1;
    END IF;

    INSERT INTO public.privy_r2_audit_certificates (
        user_id,
        email,
        privy_wallet_address,
        privy_wallet_id,
        privy_did,
        r2_cdn_url,
        r2_object_key,
        sha256_checksum,
        metadata
    ) VALUES (
        p_user_id,
        LOWER(TRIM(p_email)),
        TRIM(p_privy_wallet_address),
        v_wallet_id,
        p_privy_did,
        p_r2_cdn_url,
        p_r2_object_key,
        p_sha256_checksum,
        p_metadata
    )
    RETURNING to_jsonb(privy_r2_audit_certificates.*) INTO v_result;

    RETURN v_result;
END;
$$;

-- 5. Immutability Trigger: Prohibit modifying wallet_address once provisioned
CREATE OR REPLACE FUNCTION public.trg_fn_enforce_immutable_privy_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.wallet_address IS NOT NULL AND NEW.wallet_address IS DISTINCT FROM OLD.wallet_address THEN
        RAISE EXCEPTION 'SECURITY INVARIANT ERROR: Privy wallet_address is strictly immutable once set for email % (Attempted % -> %)', OLD.email, OLD.wallet_address, NEW.wallet_address;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_immutable_privy_wallet ON public.privy_wallets;
CREATE TRIGGER trg_enforce_immutable_privy_wallet
BEFORE UPDATE ON public.privy_wallets
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_enforce_immutable_privy_wallet();
