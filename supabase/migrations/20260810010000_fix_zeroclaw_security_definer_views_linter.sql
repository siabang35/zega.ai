-- ============================================================================
-- ZEGA AI & ZeroClaw — Supabase Linter Fix (LINT 0010 SECURITY DEFINER VIEW)
-- MIGRATION: 20260810010000_fix_zeroclaw_security_definer_views_linter.sql
-- DESCRIPTION: Remediates Supabase Database Linter security errors by
--              recreating v_zeroclaw_withdrawal_audit_summary and
--              v_zeroclaw_merchant_withdrawal_stats WITH (security_invoker = true).
-- REFERENCE: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
-- ============================================================================

-- 1. RECREATE v_zeroclaw_withdrawal_audit_summary WITH (security_invoker = true)
DROP VIEW IF EXISTS public.v_zeroclaw_withdrawal_audit_summary;

CREATE VIEW public.v_zeroclaw_withdrawal_audit_summary
WITH (security_invoker = true)
AS
SELECT
    COUNT(*) AS total_withdrawals,
    COALESCE(SUM(amount_sol), 0) AS total_sol_withdrawn,
    COALESCE(SUM(amount_usdc), 0) AS total_usdc_withdrawn,
    COUNT(CASE WHEN otp_verified = true THEN 1 END) AS otp_verified_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN r2_cdn_proof_url IS NOT NULL THEN 1 END) AS r2_proof_count,
    MAX(created_at) AS last_withdrawal_at
FROM public.zeroclaw_withdrawals;

GRANT SELECT ON public.v_zeroclaw_withdrawal_audit_summary TO authenticated, service_role, anon;

-- 2. RECREATE v_zeroclaw_merchant_withdrawal_stats WITH (security_invoker = true)
DROP VIEW IF EXISTS public.v_zeroclaw_merchant_withdrawal_stats;

CREATE VIEW public.v_zeroclaw_merchant_withdrawal_stats
WITH (security_invoker = true)
AS
SELECT
    merchant_pubkey,
    COUNT(*) AS total_withdrawals,
    COALESCE(SUM(amount_sol), 0) AS total_sol_withdrawn,
    COALESCE(SUM(amount_usdc), 0) AS total_usdc_withdrawn,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS successful_withdrawals,
    COUNT(CASE WHEN otp_verified = true THEN 1 END) AS otp_verified_count,
    COUNT(CASE WHEN qr_scanned = true THEN 1 END) AS qr_scanned_count,
    COUNT(CASE WHEN r2_cdn_proof_url IS NOT NULL THEN 1 END) AS cdn_proof_count,
    MAX(created_at) AS last_withdrawal_at
FROM public.zeroclaw_withdrawals
GROUP BY merchant_pubkey;

GRANT SELECT ON public.v_zeroclaw_merchant_withdrawal_stats TO authenticated, service_role, anon;

-- 3. ENSURE IDEMPOTENT ALTER STATEMENTS IF VIEWS PRE-EXIST WITHOUT RECREATION
ALTER VIEW IF EXISTS public.v_zeroclaw_withdrawal_audit_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_zeroclaw_merchant_withdrawal_stats SET (security_invoker = true);
