-- ============================================================================
-- ZEGA AI x ZeroClaw Vault Payment Settlements & Realtime Timestamp Migration
-- Migration: 20260809140000_fix_vault_settlements_persistence_and_sorting.sql
-- Description: Production fix for Vault Payment Lunas persistence on refresh,
--              explicit creation timestamp descending ordering (newest first),
--              realtime publication, R2 CDN audit linkage, open RLS access,
--              and automatic trigger/backfill from finished zeroclaw_invoices.
-- ============================================================================

-- ── 1. Ensure Table `zeroclaw_solana_settlements` Has Complete Column Support ──
CREATE TABLE IF NOT EXISTS public.zeroclaw_solana_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_pubkey TEXT NOT NULL DEFAULT 'ZeGAMerchantPubkey111111111111111111111',
    amount_usdc NUMERIC(14, 4) NOT NULL CHECK (amount_usdc > 0),
    reference_key TEXT UNIQUE NOT NULL,
    tx_signature TEXT UNIQUE,
    network TEXT NOT NULL DEFAULT 'solana-devnet',
    status TEXT NOT NULL DEFAULT 'confirmed',
    memo TEXT,
    buyer_email TEXT,
    solana_pay_url TEXT,
    r2_cdn_url TEXT,
    privy_wallet_address TEXT,
    privy_user_id TEXT,
    privy_verified BOOLEAN DEFAULT FALSE,
    is_demo BOOLEAN DEFAULT FALSE,
    channel TEXT DEFAULT 'SOLANA-PAY-SETTLED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column checks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zeroclaw_solana_settlements' AND column_name='channel') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN channel TEXT DEFAULT 'SOLANA-PAY-SETTLED';
    END IF;
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

-- ── 2. High Performance Indexes for Realtime Sorting & Lookups ──
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_created_desc ON public.zeroclaw_solana_settlements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_ref_key ON public.zeroclaw_solana_settlements(reference_key);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_tx_sig ON public.zeroclaw_solana_settlements(tx_signature);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_is_demo ON public.zeroclaw_solana_settlements(is_demo);
CREATE INDEX IF NOT EXISTS idx_zeroclaw_settlements_merchant ON public.zeroclaw_solana_settlements(merchant_pubkey);

-- ── 3. Enable RLS and Provide Permissive Read/Write Access to Prevent Disappearing Records ──
ALTER TABLE public.zeroclaw_solana_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select zeroclaw settlements" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Public insert zeroclaw settlements" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Public update zeroclaw settlements" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Users can view owned or public demo settlements" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Users can insert settlement requests" ON public.zeroclaw_solana_settlements;
DROP POLICY IF EXISTS "Service role full access settlements" ON public.zeroclaw_solana_settlements;

CREATE POLICY "Public select zeroclaw settlements"
    ON public.zeroclaw_solana_settlements
    FOR SELECT
    USING (true);

CREATE POLICY "Public insert zeroclaw settlements"
    ON public.zeroclaw_solana_settlements
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public update zeroclaw settlements"
    ON public.zeroclaw_solana_settlements
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ── 4. Automatic Trigger to Sync Finished/Paid Invoices directly to Vault Settlements ──
CREATE OR REPLACE FUNCTION public.sync_finished_invoice_to_vault_settlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW.status ILIKE '%finished%' OR NEW.status ILIKE '%paid%' OR NEW.status ILIKE '%lunas%' OR NEW.settlement_status ILIKE '%confirmed%') THEN
        INSERT INTO public.zeroclaw_solana_settlements (
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
            channel,
            created_at
        ) VALUES (
            COALESCE(NEW.merchant_pubkey, 'ZeGAMerchantPubkey111111111111111111111'),
            COALESCE(NEW.amount_usdc, 1.0000),
            COALESCE(NEW.reference_key, 'ref_' || NEW.id::text),
            NEW.tx_signature,
            'solana-devnet',
            'confirmed',
            'LUNAS: ' || COALESCE(NEW.customer_target, NEW.memo, 'Kasir Solana Pay'),
            NEW.customer_target,
            NEW.solana_pay_url,
            'https://cdn.zegaai.site/privy-audits/demo/audit_' || COALESCE(NEW.reference_key, NEW.id::text) || '.json',
            COALESCE(NEW.is_demo, FALSE),
            'SOLANA-PAY-SETTLED',
            COALESCE(NEW.created_at, NOW())
        )
        ON CONFLICT (reference_key) DO UPDATE SET
            status = 'confirmed',
            tx_signature = EXCLUDED.tx_signature,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zeroclaw_invoices') THEN
        DROP TRIGGER IF EXISTS trg_sync_invoice_to_settlement ON public.zeroclaw_invoices;
        CREATE TRIGGER trg_sync_invoice_to_settlement
            AFTER INSERT OR UPDATE ON public.zeroclaw_invoices
            FOR EACH ROW
            EXECUTE FUNCTION public.sync_finished_invoice_to_vault_settlement();
            
        -- Backfill existing paid/finished invoices into settlements
        INSERT INTO public.zeroclaw_solana_settlements (
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
            channel,
            created_at
        )
        SELECT
            COALESCE(inv.merchant_pubkey, 'ZeGAMerchantPubkey111111111111111111111'),
            COALESCE(inv.amount_usdc, 1.0000),
            COALESCE(inv.reference_key, 'ref_' || inv.id::text),
            inv.tx_signature,
            'solana-devnet',
            'confirmed',
            'LUNAS: ' || COALESCE(inv.customer_target, inv.memo, 'Kasir Solana Pay'),
            inv.customer_target,
            inv.solana_pay_url,
            'https://cdn.zegaai.site/privy-audits/demo/audit_' || COALESCE(inv.reference_key, inv.id::text) || '.json',
            COALESCE(inv.is_demo, FALSE),
            'SOLANA-PAY-SETTLED',
            COALESCE(inv.created_at, NOW())
        FROM public.zeroclaw_invoices inv
        WHERE (inv.status ILIKE '%finished%' OR inv.status ILIKE '%paid%' OR inv.status ILIKE '%lunas%' OR inv.settlement_status ILIKE '%confirmed%')
        ON CONFLICT (reference_key) DO NOTHING;
    END IF;
END $$;

-- ── 5. Atomic RPC Function to Fetch Vault Settlements Ordered Newest First ──
CREATE OR REPLACE FUNCTION public.get_zeroclaw_vault_settlements(
    p_is_demo BOOLEAN DEFAULT NULL,
    p_user_id TEXT DEFAULT NULL,
    p_merchant_pubkey TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_data JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'signature', COALESCE(s.tx_signature, s.reference_key),
            'referenceKey', s.reference_key,
            'amount', s.amount_usdc,
            'amountUsdc', s.amount_usdc,
            'currency', 'USDC',
            'timestamp', to_char(s.created_at, 'YYYY-MM-DD HH24:MI:SS'),
            'rawCreatedAt', to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'createdAtISO', to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'channel', COALESCE(s.channel, CASE WHEN s.is_demo THEN 'SOLANA-PAY-DEMO' ELSE 'SOLANA-PAY-PRIVATE' END),
            'network', s.network,
            'memo', COALESCE(s.memo, 'Solana Pay Settlement'),
            'status', s.status,
            'merchantWallet', s.merchant_pubkey,
            'r2CdnUrl', COALESCE(s.r2_cdn_url, 'https://cdn.zegaai.site/privy-audits/demo/audit_' || s.reference_key || '.json'),
            'is_demo', s.is_demo
        )
        ORDER BY s.created_at DESC
    ), '[]'::jsonb) INTO v_data
    FROM public.zeroclaw_solana_settlements s
    WHERE (p_is_demo IS NULL OR s.is_demo = p_is_demo)
      AND (p_merchant_pubkey IS NULL OR s.merchant_pubkey = p_merchant_pubkey OR s.merchant_pubkey = 'ZeGAMerchantPubkey111111111111111111111');

    RETURN jsonb_build_object(
        'success', true,
        'count', jsonb_array_length(v_data),
        'data', v_data
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_zeroclaw_vault_settlements TO anon, authenticated, service_role;

-- ── 6. Ensure Realtime Publication ──
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
END $$;
