-- ============================================================================
-- SQL MIGRATION 13: UMKM FINANCE LEGACY TRANSACTIONS CLEANUP
-- ============================================================================
-- Purpose: Purge legacy/mock test transactions from umkm_finance_solana_tx 
-- to ensure ZeroClaw Terminal realtime RPC signatures sync cleanly.
-- ============================================================================

BEGIN;

-- 1. Remove legacy / unverified mock transactions from umkm_finance_solana_tx
DELETE FROM public.umkm_finance_solana_tx
WHERE tx_hash LIKE '%mock%'
   OR tx_hash LIKE '%test%'
   OR tx_hash LIKE '%demo%'
   OR LENGTH(tx_hash) < 10;

-- 2. Ensure real-time index is fresh for merchant store_id lookups
CREATE INDEX IF NOT EXISTS idx_umkm_finance_solana_tx_clean 
ON public.umkm_finance_solana_tx (store_id, status, created_at DESC);

COMMIT;
