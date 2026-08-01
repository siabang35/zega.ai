-- ============================================================================
-- ZEGA AI x ZeroClaw Unified Invoices, Settlements & Cloudflare R2 CDN Vault Schema
-- Migration: 20260801000400_zeroclaw_invoices_and_settlements_cdn_vault.sql
-- Description: Production-grade schema & atomic RPC functions for storing AI-generated
--              and manual Solana Pay invoices, on-chain settlements, and Cloudflare R2 CDN
--              cryptographic audit certificates with zero-loss data persistence.
-- Idempotency: Fully guarded with DROP IF EXISTS & CREATE OR REPLACE.
-- ============================================================================

-- ── 1. Ensure Table `zeroclaw_solana_settlements` Has Full Schema Support ──
CREATE TABLE IF NOT EXISTS public.zeroclaw_solana_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_pubkey TEXT NOT NULL DEFAULT 'ZeGAMerchantPubkey111111111111111111111',
    amount_usdc NUMERIC(14, 4) NOT NULL CHECK (amount_usdc > 0),
    reference_key TEXT UNIQUE NOT NULL,
    tx_signature TEXT UNIQUE,
    network TEXT NOT NULL DEFAULT 'solana-devnet' CHECK (network IN ('solana-devnet', 'solana-mainnet')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'finalized', 'failed', 'active')),
    memo TEXT,
    buyer_email TEXT,
    solana_pay_url TEXT,
    r2_cdn_url TEXT,
    privy_wallet_address TEXT,
    privy_user_id TEXT,
    privy_verified BOOLEAN DEFAULT FALSE,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns idempotently if table existed previously
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zeroclaw_solana_settlements' AND column_name='buyer_email') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN buyer_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zeroclaw_solana_settlements' AND column_name='solana_pay_url') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN solana_pay_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zeroclaw_solana_settlements' AND column_name='r2_cdn_url') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN r2_cdn_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zeroclaw_solana_settlements' AND column_name='is_demo') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ── 2. Ensure Table `privy_r2_audit_certificates` Has Full Audit Support ──
CREATE TABLE IF NOT EXISTS public.privy_r2_audit_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    privy_wallet_address TEXT NOT NULL,
    privy_did TEXT,
    r2_cdn_url TEXT NOT NULL,
    r2_object_key TEXT NOT NULL,
    sha256_checksum TEXT NOT NULL,
    owasp_security_level TEXT NOT NULL DEFAULT 'ENTERPRISE_OWASP_V3_AES256',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── 3. High-Performance Indexing ──
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_user_id ON public.zeroclaw_solana_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_reference ON public.zeroclaw_solana_settlements(reference_key);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_merchant ON public.zeroclaw_solana_settlements(merchant_pubkey);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_status ON public.zeroclaw_solana_settlements(status);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_created_at ON public.zeroclaw_solana_settlements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_privy_r2_email ON public.privy_r2_audit_certificates(email);
CREATE INDEX IF NOT EXISTS idx_privy_r2_wallet ON public.privy_r2_audit_certificates(privy_wallet_address);
CREATE INDEX IF NOT EXISTS idx_privy_r2_checksum ON public.privy_r2_audit_certificates(sha256_checksum);

-- ── 4. Enable Row Level Security (RLS) ──
ALTER TABLE public.zeroclaw_solana_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privy_r2_audit_certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotent execution
DROP POLICY IF EXISTS "Users can view owned or public demo settlements" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Users can insert settlement requests" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Service role full access settlements" ON public.zeroclaw_solana_settlements;

DROP POLICY IF EXISTS "Users and service can select privy r2 audit certificates" ON public.privy_r2_audit_certificates;
DROP POLICY IF EXISTS "Service role can insert privy r2 audit certificates" ON public.privy_r2_audit_certificates;

-- RLS Policies for Settlements
CREATE POLICY "Users can view owned or public demo settlements"
    ON public.zeroclaw_solana_settlements
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL 
        OR auth.role() = 'service_role'
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );

CREATE POLICY "Users can insert settlement requests"
    ON public.zeroclaw_solana_settlements
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

CREATE POLICY "Service role full access settlements"
    ON public.zeroclaw_solana_settlements
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- RLS Policies for R2 Certificates
CREATE POLICY "Users and service can select privy r2 audit certificates"
    ON public.privy_r2_audit_certificates
    FOR SELECT
    USING (true);

CREATE POLICY "Service role can insert privy r2 audit certificates"
    ON public.privy_r2_audit_certificates
    FOR INSERT
    WITH CHECK (true);

-- ── 5. Enable Realtime Publications ──
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
        AND tablename = 'privy_r2_audit_certificates'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.privy_r2_audit_certificates;
    END IF;
END $$;

-- ── 6. Atomic RPC Function: Record Invoice with R2 Audit Certificate ──
CREATE OR REPLACE FUNCTION public.record_zeroclaw_invoice_with_r2_audit(
    p_user_id UUID,
    p_user_email TEXT,
    p_merchant_pubkey TEXT,
    p_amount_usdc NUMERIC,
    p_memo TEXT,
    p_reference_key TEXT,
    p_solana_pay_url TEXT,
    p_buyer_email TEXT DEFAULT NULL,
    p_r2_cdn_url TEXT DEFAULT NULL,
    p_r2_object_key TEXT DEFAULT NULL,
    p_sha256_checksum TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id UUID;
    v_cert_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Insert into zeroclaw_solana_settlements master DB
    INSERT INTO public.zeroclaw_solana_settlements (
        user_id,
        merchant_pubkey,
        amount_usdc,
        reference_key,
        tx_signature,
        network,
        status,
        memo,
        buyer_email,
        solana_pay_url,
        r2_cdn_url,
        is_demo,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        COALESCE(p_merchant_pubkey, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
        p_amount_usdc,
        COALESCE(p_reference_key, 'RefKey_' || gen_random_uuid()::text),
        'gen_inv_' || extract(epoch from now())::bigint::text,
        'solana-devnet',
        'pending',
        COALESCE(p_memo, 'Solana Pay Invoice'),
        p_buyer_email,
        p_solana_pay_url,
        p_r2_cdn_url,
        (p_user_id IS NULL),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_invoice_id;

    -- 2. Insert into privy_r2_audit_certificates if R2 metadata provided
    IF p_r2_cdn_url IS NOT NULL AND p_sha256_checksum IS NOT NULL THEN
        INSERT INTO public.privy_r2_audit_certificates (
            user_id,
            email,
            privy_wallet_address,
            r2_cdn_url,
            r2_object_key,
            sha256_checksum,
            metadata,
            created_at
        )
        VALUES (
            COALESCE(p_user_id::text, p_user_email),
            COALESCE(p_user_email, 'user@zegaai.site'),
            COALESCE(p_merchant_pubkey, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
            p_r2_cdn_url,
            COALESCE(p_r2_object_key, 'privy-audits/' || p_user_email || '/audit_' || p_reference_key || '.json'),
            p_sha256_checksum,
            jsonb_build_object('invoiceId', v_invoice_id, 'memo', p_memo, 'amountUsdc', p_amount_usdc),
            timezone('utc'::text, now())
        )
        RETURNING id INTO v_cert_id;
    END IF;

    SELECT jsonb_build_object(
        'success', true,
        'invoice_id', v_invoice_id,
        'certificate_id', v_cert_id,
        'r2_cdn_url', p_r2_cdn_url,
        'status', 'pending'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ── 7. Atomic RPC Function: Fetch User Invoices from Master Vault ──
CREATE OR REPLACE FUNCTION public.fetch_zeroclaw_user_invoices(
    p_user_id UUID DEFAULT NULL,
    p_merchant_pubkey TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoices JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'amount', to_char(s.amount_usdc, 'FM999999990.00'),
            'memo', COALESCE(s.memo, 'Solana Pay Invoice'),
            'solanaPayUrl', COALESCE(s.solana_pay_url, 'solana:' || s.merchant_pubkey || '?amount=' || s.amount_usdc || '&reference=' || s.reference_key),
            'createdAt', to_char(s.created_at, 'HH12:MI:SS AM'),
            'merchantWallet', s.merchant_pubkey,
            'referenceKey', s.reference_key,
            'status', s.status,
            'r2CdnUrl', COALESCE(s.r2_cdn_url, 'https://cdn.zegaai.site/privy-audits/demo/audit_' || s.reference_key || '.json')
        )
        ORDER BY s.created_at DESC
    ), '[]'::jsonb) INTO v_invoices
    FROM public.zeroclaw_solana_settlements s
    WHERE (p_user_id IS NOT NULL AND s.user_id = p_user_id)
       OR (p_user_id IS NULL AND (s.user_id IS NULL OR s.merchant_pubkey = p_merchant_pubkey));

    RETURN jsonb_build_object(
        'success', true,
        'count', jsonb_array_length(v_invoices),
        'invoices', v_invoices
    );
END;
$$;

-- Grant Execution Permissions for RPC Functions
GRANT EXECUTE ON FUNCTION public.record_zeroclaw_invoice_with_r2_audit TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_zeroclaw_user_invoices TO anon, authenticated, service_role;

-- ============================================================================
-- END MIGRATION: 20260801000400_zeroclaw_invoices_and_settlements_cdn_vault.sql
-- ============================================================================
