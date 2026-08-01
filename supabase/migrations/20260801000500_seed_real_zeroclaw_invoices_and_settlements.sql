-- ============================================================================
-- ZEGA AI x ZeroClaw Clean Production Migration (No Mock / Seed Data)
-- Migration: 20260801000500_seed_real_zeroclaw_invoices_and_settlements.sql
-- Description: Ensures zero mock/dummy seed records exist. Vault and settlements
--              are populated exclusively via user actions (AI Agent or Manual Cashier).
-- ============================================================================

-- Clean up any residual demo seed entries if present
DELETE FROM public.zeroclaw_solana_settlements WHERE reference_key IN ('RefKeyRealCafeLatte01', 'RefKeySwarmEscrow02', 'RefKeyAgentMicroPay03');
DELETE FROM public.privy_r2_audit_certificates WHERE r2_object_key LIKE '%RefKeyRealCafeLatte01%' OR r2_object_key LIKE '%RefKeySwarmEscrow02%';

-- ============================================================================
-- END MIGRATION: 20260801000500_seed_real_zeroclaw_invoices_and_settlements.sql
-- ============================================================================
