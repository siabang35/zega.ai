-- ============================================================================
-- ZEGA AI — Security Hardening Migration
-- Migration: 20260822100000_security_hardening.sql
-- ============================================================================
-- Addresses findings from the full-repository security audit:
--   S-06:  Add organization_id to ledger_entries
--   S-07:  Add organization_id to withdrawals
--   S-23a: Harden schema.sql SECURITY DEFINER functions with SET search_path
--   S-25:  Revoke anon EXECUTE on sensitive RPC functions
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- S-06: Add organization_id to ledger_entries table
-- Required for tenant-scoped financial audit
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ledger_entries'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.ledger_entries
      ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

    CREATE INDEX IF NOT EXISTS idx_ledger_entries_org_id
      ON public.ledger_entries(organization_id);

    COMMENT ON COLUMN public.ledger_entries.organization_id IS
      'Tenant scoping: organization that owns this ledger entry (S-06 security fix)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- S-07: Add organization_id to withdrawals table
-- Required for tenant-scoped withdrawal audit
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'withdrawals'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.withdrawals
      ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

    CREATE INDEX IF NOT EXISTS idx_withdrawals_org_id
      ON public.withdrawals(organization_id);

    COMMENT ON COLUMN public.withdrawals.organization_id IS
      'Tenant scoping: organization that owns this withdrawal (S-07 security fix)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- S-23a: Harden base schema SECURITY DEFINER functions
-- These functions in schema.sql lacked SET search_path, allowing
-- search_path injection attacks when called via PostgREST.
-- ═══════════════════════════════════════════════════════════════════════════

-- Rate limiter function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_requests INT DEFAULT 60,
    p_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_window_start TIMESTAMP;
    v_current_count INT;
BEGIN
    v_window_start := timezone('utc'::text, now()) - (p_window_seconds || ' seconds')::interval;

    SELECT COUNT(*) INTO v_current_count
    FROM public.rate_limit_logs
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start >= v_window_start;

    IF v_current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.rate_limit_logs (identifier, action, request_count, window_start)
    VALUES (p_identifier, p_action, 1, timezone('utc'::text, now()));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Security event logger
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_ip_address TEXT,
    p_action TEXT,
    p_resource TEXT,
    p_status_code INT,
    p_payload_summary TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_audit_logs (user_id, ip_address, action, resource, status_code, payload_summary)
    VALUES (
        p_user_id,
        CASE WHEN p_ip_address IS NULL OR p_ip_address = '' THEN NULL ELSE p_ip_address::INET END,
        p_action,
        p_resource,
        p_status_code,
        substring(p_payload_summary from 1 for 1000)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auth signup trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_type, 'individual')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ═══════════════════════════════════════════════════════════════════════════
-- S-25: Revoke anon EXECUTE on sensitive financial RPC functions
-- PostgREST exposes all granted functions to the anon role by default.
-- Financial operations must ONLY be callable by authenticated users.
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  fn_name TEXT;
BEGIN
  FOR fn_name IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'reserve_withdrawal_atomic',
        'finalize_withdrawal_atomic',
        'release_withdrawal_reservation_atomic',
        'settle_payment_atomic',
        'check_rate_limit',
        'log_security_event'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM anon', fn_name);
    RAISE NOTICE 'Revoked anon EXECUTE on public.%', fn_name;
  END LOOP;
END $$;

COMMIT;
