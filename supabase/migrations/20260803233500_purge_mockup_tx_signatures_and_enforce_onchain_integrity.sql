-- ============================================================================
-- ZEGA AI ENTERPRISE SOLANA SETTLEMENTS & INVOICES CLEANUP MIGRATION
-- Migration Version: 20260803233500
-- Purpose: Purge legacy mock tx signatures (5vzr*, gen_inv_*, inv_*), update
--          hardcoded legacy addresses to active merchant wallet, reset stale
--          settlements/invoices, and enforce strict Base58 transaction signature constraints.
-- Idempotency: Fully guarded with IF EXISTS statements.
-- ============================================================================

BEGIN;

-- ── 1. PURGE MOCK SETTLEMENT RECORDS FROM `zeroclaw_solana_settlements` ──
DELETE FROM public.zeroclaw_solana_settlements
WHERE tx_signature LIKE '5vzr%'
   OR tx_signature LIKE 'gen_inv_%'
   OR tx_signature LIKE 'inv_%'
   OR tx_signature LIKE 'INV-%'
   OR (tx_signature IS NOT NULL AND (length(tx_signature) < 70 OR length(tx_signature) > 96));

-- ── 2. RESET STALE PENDING/MOCK SETTLEMENTS BACK TO PENDING ──
UPDATE public.zeroclaw_solana_settlements
SET 
  status = 'pending',
  tx_signature = NULL,
  updated_at = NOW()
WHERE status = 'active'
   OR tx_signature LIKE '5vzr%'
   OR tx_signature LIKE 'gen_inv_%'
   OR tx_signature LIKE 'inv_%'
   OR tx_signature LIKE 'INV-%';

-- ── 3. REPLACE LEGACY HARDCODED WALLET ADDRESSES ──
UPDATE public.zeroclaw_solana_settlements
SET merchant_pubkey = 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK'
WHERE merchant_pubkey = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
   OR merchant_pubkey = 'ZeGAMerchantPubkey111111111111111111111';

-- ── 4. IDEMPOTENTLY CLEAN `zeroclaw_invoices` IF TABLE EXISTS ──
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'zeroclaw_invoices') THEN
        DELETE FROM public.zeroclaw_invoices
        WHERE tx_signature LIKE '5vzr%'
           OR tx_signature LIKE 'gen_inv_%'
           OR tx_signature LIKE 'inv_%'
           OR tx_signature LIKE 'INV-%'
           OR (tx_signature IS NOT NULL AND (length(tx_signature) < 70 OR length(tx_signature) > 96));

        UPDATE public.zeroclaw_invoices
        SET 
          status = 'pending',
          settlement_status = 'pending',
          tx_signature = NULL,
          paid_amount_usdc = NULL,
          updated_at = NOW()
        WHERE tx_signature LIKE '5vzr%'
           OR tx_signature LIKE 'gen_inv_%'
           OR tx_signature LIKE 'inv_%'
           OR tx_signature LIKE 'INV-%';

        UPDATE public.zeroclaw_invoices
        SET merchant_pubkey = 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK'
        WHERE merchant_pubkey = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
    END IF;
END $$;

-- ── 5. ENFORCE BASE58 SIGNATURE CHECK CONSTRAINT ON SETTLEMENTS ──
ALTER TABLE public.zeroclaw_solana_settlements
  DROP CONSTRAINT IF EXISTS check_valid_base58_tx_signature;

ALTER TABLE public.zeroclaw_solana_settlements
  ADD CONSTRAINT check_valid_base58_tx_signature
  CHECK (
    tx_signature IS NULL OR tx_signature ~ '^[1-9A-HJ-NP-Za-km-z]{70,96}$'
  );

COMMIT;
