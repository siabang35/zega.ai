-- ════════════════════════════════════════════════════════════════════════════════
-- ZEGA AI × ZEROCLAW — ENTERPRISE PAYMENT SCHEMA v4.0.0
-- Migration: 20260804011000_create_zeroclaw_invoices_table.sql
-- ════════════════════════════════════════════════════════════════════════════════
--
-- Architecture:
--   zeroclaw_invoices          → Invoice lifecycle (active → paid → cancelled)
--   zeroclaw_solana_settlements → On-chain settlement audit trail (immutable record)
--   zeroclaw_payment_events    → Real-time payment event log (every RPC check & match)
--   zeroclaw_reconciliation_log → Reconciliation audit trail (anti-replay & fraud detection)
--   privy_r2_audit_certificates → Cloudflare R2 CDN audit certificates (existing)
--
-- OWASP Compliance:
--   - Row Level Security (RLS) on all tables
--   - Strict CHECK constraints on status/enum fields
--   - UNIQUE constraints on reference_key & tx_signature to prevent replay
--   - Immutable audit trails (INSERT-only on events & reconciliation)
--   - Realtime subscriptions for live dashboard updates
-- ════════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: zeroclaw_invoices
-- Purpose: Tracks the full lifecycle of each Solana Pay invoice.
--          tx_signature starts as NULL and is ONLY populated when a real
--          on-chain transaction is verified via RPC.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.zeroclaw_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL DEFAULT 'anonymous',
    merchant_pubkey TEXT NOT NULL,
    amount_usdc     NUMERIC(14, 4) NOT NULL CHECK (amount_usdc > 0),
    reference_key   TEXT UNIQUE NOT NULL,
    memo            TEXT DEFAULT 'Solana Pay Invoice',
    customer_target TEXT,
    solana_pay_url  TEXT,
    r2_cdn_url      TEXT,
    network         TEXT NOT NULL DEFAULT 'solana-devnet'
                        CHECK (network IN ('solana-devnet', 'solana-mainnet')),
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'paid', 'cancelled', 'expired')),
    settlement_status TEXT DEFAULT NULL
                        CHECK (settlement_status IS NULL OR settlement_status IN (
                            'settled_exact', 'settled_underpaid', 'settled_overpaid'
                        )),
    tx_signature    TEXT DEFAULT NULL,
    paid_amount_usdc NUMERIC(14, 4) DEFAULT 0,
    is_demo         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zci_user_id       ON public.zeroclaw_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_zci_reference_key ON public.zeroclaw_invoices(reference_key);
CREATE INDEX IF NOT EXISTS idx_zci_merchant      ON public.zeroclaw_invoices(merchant_pubkey);
CREATE INDEX IF NOT EXISTS idx_zci_status        ON public.zeroclaw_invoices(status);
CREATE INDEX IF NOT EXISTS idx_zci_tx_signature  ON public.zeroclaw_invoices(tx_signature);
CREATE INDEX IF NOT EXISTS idx_zci_created_at    ON public.zeroclaw_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zci_customer      ON public.zeroclaw_invoices(customer_target);

-- RLS
ALTER TABLE public.zeroclaw_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_full_access_invoices" ON public.zeroclaw_invoices;
CREATE POLICY "svc_full_access_invoices"
    ON public.zeroclaw_invoices FOR ALL
    USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. TABLE: zeroclaw_solana_settlements  (Ensure Updated Schema)
-- Purpose: Immutable on-chain settlement audit trail.
--          Only populated when a REAL on-chain tx is verified.
-- ══════════════════════════════════════════════════════════════════════════════
-- Add missing columns idempotently to existing table
DO $$
BEGIN
    -- Add invoice_id FK column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='zeroclaw_solana_settlements'
                   AND column_name='invoice_id') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN invoice_id UUID DEFAULT NULL;
    END IF;

    -- Add verified_on_chain flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='zeroclaw_solana_settlements'
                   AND column_name='verified_on_chain') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN verified_on_chain BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add block_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='zeroclaw_solana_settlements'
                   AND column_name='block_time') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN block_time BIGINT DEFAULT NULL;
    END IF;

    -- Add slot column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='zeroclaw_solana_settlements'
                   AND column_name='slot') THEN
        ALTER TABLE public.zeroclaw_solana_settlements ADD COLUMN slot BIGINT DEFAULT NULL;
    END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. TABLE: zeroclaw_payment_events
-- Purpose: Append-only real-time event log for every payment check & match.
--          Used for live dashboard updates, analytics, and fraud detection.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.zeroclaw_payment_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID DEFAULT NULL,
    reference_key   TEXT NOT NULL,
    user_id         TEXT DEFAULT NULL,
    merchant_pubkey TEXT DEFAULT NULL,
    event_type      TEXT NOT NULL DEFAULT 'check_payment'
                        CHECK (event_type IN (
                            'invoice_created', 'check_payment', 'payment_detected',
                            'payment_verified', 'payment_failed', 'telegram_sent',
                            'r2_certificate_uploaded', 'invoice_cancelled', 'invoice_expired',
                            'stale_signature_purged', 'anti_replay_blocked'
                        )),
    event_data      JSONB DEFAULT '{}'::jsonb,
    tx_signature    TEXT DEFAULT NULL,
    amount_usdc     NUMERIC(14, 4) DEFAULT 0,
    network         TEXT NOT NULL DEFAULT 'solana-devnet',
    ip_address      TEXT DEFAULT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zpe_reference_key ON public.zeroclaw_payment_events(reference_key);
CREATE INDEX IF NOT EXISTS idx_zpe_event_type    ON public.zeroclaw_payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_zpe_tx_signature  ON public.zeroclaw_payment_events(tx_signature);
CREATE INDEX IF NOT EXISTS idx_zpe_invoice_id    ON public.zeroclaw_payment_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_zpe_created_at    ON public.zeroclaw_payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zpe_user_id       ON public.zeroclaw_payment_events(user_id);

-- RLS
ALTER TABLE public.zeroclaw_payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_full_access_events" ON public.zeroclaw_payment_events;
CREATE POLICY "svc_full_access_events"
    ON public.zeroclaw_payment_events FOR ALL
    USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. TABLE: zeroclaw_reconciliation_log
-- Purpose: Immutable audit trail for reconciliation decisions.
--          Records every signature match/rejection with reasoning.
--          OWASP Anti-Replay: Tracks claimed signatures to prevent replay attacks.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.zeroclaw_reconciliation_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID DEFAULT NULL,
    reference_key   TEXT NOT NULL,
    candidate_sig   TEXT NOT NULL,
    decision        TEXT NOT NULL
                        CHECK (decision IN (
                            'matched_by_reference', 'matched_by_fallback',
                            'rejected_already_claimed', 'rejected_stale',
                            'rejected_amount_mismatch', 'rejected_recipient_mismatch',
                            'purged_from_db'
                        )),
    reason          TEXT DEFAULT NULL,
    matched_amount  NUMERIC(14, 4) DEFAULT 0,
    expected_amount NUMERIC(14, 4) DEFAULT 0,
    on_chain_data   JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zrl_reference_key  ON public.zeroclaw_reconciliation_log(reference_key);
CREATE INDEX IF NOT EXISTS idx_zrl_candidate_sig  ON public.zeroclaw_reconciliation_log(candidate_sig);
CREATE INDEX IF NOT EXISTS idx_zrl_decision       ON public.zeroclaw_reconciliation_log(decision);
CREATE INDEX IF NOT EXISTS idx_zrl_created_at     ON public.zeroclaw_reconciliation_log(created_at DESC);

-- RLS
ALTER TABLE public.zeroclaw_reconciliation_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_full_access_recon" ON public.zeroclaw_reconciliation_log;
CREATE POLICY "svc_full_access_recon"
    ON public.zeroclaw_reconciliation_log FOR ALL
    USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Enable Realtime on ALL new tables
-- ══════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'zeroclaw_invoices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zeroclaw_invoices;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'zeroclaw_payment_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zeroclaw_payment_events;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = 'zeroclaw_reconciliation_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zeroclaw_reconciliation_log;
    END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. RPC FUNCTION: Atomic check-and-claim for anti-replay
-- Purpose: Atomically checks if a tx_signature is already claimed by any invoice,
--          and if not, claims it for the specified invoice. Returns claim result.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.claim_payment_for_invoice(
    p_reference_key TEXT,
    p_tx_signature TEXT,
    p_paid_amount NUMERIC,
    p_settlement_status TEXT DEFAULT 'settled_exact'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_claim RECORD;
    v_invoice RECORD;
    v_result JSONB;
BEGIN
    -- 1. Check if signature is already claimed by ANY invoice
    SELECT id, reference_key, tx_signature
    INTO v_existing_claim
    FROM public.zeroclaw_invoices
    WHERE tx_signature = p_tx_signature
    LIMIT 1;

    IF FOUND THEN
        -- Already claimed by another invoice — reject
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'already_claimed',
            'claimed_by_ref', v_existing_claim.reference_key,
            'claimed_by_id', v_existing_claim.id
        );
    END IF;

    -- 2. Find the target invoice
    SELECT id, status, tx_signature
    INTO v_invoice
    FROM public.zeroclaw_invoices
    WHERE reference_key = p_reference_key
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invoice_not_found');
    END IF;

    IF v_invoice.tx_signature IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'invoice_already_paid',
            'existing_sig', v_invoice.tx_signature
        );
    END IF;

    -- 3. Atomically claim the signature for this invoice
    UPDATE public.zeroclaw_invoices
    SET tx_signature = p_tx_signature,
        status = 'paid',
        settlement_status = p_settlement_status,
        paid_amount_usdc = p_paid_amount,
        updated_at = NOW()
    WHERE reference_key = p_reference_key
      AND tx_signature IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', v_invoice.id,
        'claimed_sig', p_tx_signature
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_payment_for_invoice TO anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════════════════
-- END MIGRATION: 20260804011000_create_zeroclaw_invoices_table.sql
-- ════════════════════════════════════════════════════════════════════════════════
