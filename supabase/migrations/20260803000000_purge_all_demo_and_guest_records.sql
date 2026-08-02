-- Migration: 20260803000000_purge_all_demo_and_guest_records.sql
-- Description: Idempotent Total Purge of Demo Mode, Guest Accounts, and Fake Presets from ZEGA Supabase Database

BEGIN;

-- 1. Delete all settlement & invoice records marked as demo or associated with guest accounts in zeroclaw_solana_settlements
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'zeroclaw_solana_settlements') THEN
        DELETE FROM public.zeroclaw_solana_settlements
        WHERE is_demo = true 
           OR user_id::text LIKE '%guest%' 
           OR buyer_email LIKE '%guest%'
           OR memo LIKE '%Demo%'
           OR memo LIKE '%Guest%';
    END IF;
END $$;

-- 2. Delete from zeroclaw_invoices if table exists in custom environments
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'zeroclaw_invoices') THEN
        DELETE FROM public.zeroclaw_invoices
        WHERE is_demo = true 
           OR user_id::text LIKE '%guest%' 
           OR buyer_email LIKE '%guest%'
           OR memo LIKE '%Demo%'
           OR memo LIKE '%Guest%';
    END IF;
END $$;

-- 3. Delete Privy Embedded Wallet records associated with guest emails if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'privy_wallets') THEN
        DELETE FROM public.privy_wallets
        WHERE email LIKE '%guest%'
           OR email LIKE '%demo%';
    END IF;
END $$;

-- 4. Delete Social OAuth accounts associated with guest emails if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_oauth_accounts') THEN
        DELETE FROM public.social_oauth_accounts
        WHERE email LIKE '%guest%'
           OR email LIKE '%demo%';
    END IF;
END $$;

-- 5. Delete user sessions or mock user records in public.users if present
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        DELETE FROM public.users
        WHERE email LIKE '%guest%' OR email LIKE '%demo%';
    END IF;
END $$;

-- 6. SQL Guard Function & Trigger: Auto-reject future demo / guest database insertions
CREATE OR REPLACE FUNCTION public.fn_reject_guest_demo_inserts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_demo = true THEN
        RAISE EXCEPTION 'INSERT REJECTED: Demo Mode has been permanently deprecated on ZEGA AI Platform.';
    END IF;

    IF (NEW.user_id::text LIKE '%guest%' OR (NEW.buyer_email IS NOT NULL AND NEW.buyer_email LIKE '%guest%')) THEN
        RAISE EXCEPTION 'INSERT REJECTED: Guest sessions are deprecated. All records must belong to an authenticated Privy user.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Guard Trigger to zeroclaw_solana_settlements if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'zeroclaw_solana_settlements') THEN
        DROP TRIGGER IF EXISTS trg_reject_guest_demo_settlements ON public.zeroclaw_solana_settlements;
        CREATE TRIGGER trg_reject_guest_demo_settlements
        BEFORE INSERT OR UPDATE ON public.zeroclaw_solana_settlements
        FOR EACH ROW
        EXECUTE FUNCTION public.fn_reject_guest_demo_inserts();
    END IF;
END $$;

COMMIT;
