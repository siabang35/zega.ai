-- ═══════════════════════════════════════════════════════════════════════
-- ZEGA AI — P4 Red Team & Final Security Hardening Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- Addresses:
--   - Tightening RLS policies & revoking PUBLIC table grants on foundation tables
--   - Audit triggers for sensitive financial state modifications
--   - Enforcing SECURITY DEFINER search_path isolation
--
-- All operations are IDEMPOTENT and SAFE for zero-downtime deployment.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Revoke PUBLIC permissions on sensitive foundation tables ──
REVOKE ALL ON public.otps FROM PUBLIC, anon;
REVOKE ALL ON public.telegram_dedup FROM PUBLIC, anon;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon;
REVOKE ALL ON public.idempotency_keys FROM PUBLIC, anon;
REVOKE ALL ON public.health_telemetry_logs FROM PUBLIC, anon;

-- Grant access ONLY to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.otps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_dedup TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idempotency_keys TO service_role;
GRANT SELECT, INSERT, DELETE ON public.health_telemetry_logs TO service_role;

-- ── 2. Enable RLS across all foundation tables ──
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_dedup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_telemetry_logs ENABLE ROW LEVEL SECURITY;

-- ── 3. Tenant Isolation RLS Policies ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'otps_service_role' AND tablename = 'otps'
  ) THEN
    EXECUTE 'CREATE POLICY otps_service_role ON public.otps FOR ALL USING (auth.role() = ''service_role'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'telegram_dedup_service_role' AND tablename = 'telegram_dedup'
  ) THEN
    EXECUTE 'CREATE POLICY telegram_dedup_service_role ON public.telegram_dedup FOR ALL USING (auth.role() = ''service_role'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'rate_limits_service_role' AND tablename = 'rate_limits'
  ) THEN
    EXECUTE 'CREATE POLICY rate_limits_service_role ON public.rate_limits FOR ALL USING (auth.role() = ''service_role'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'idempotency_keys_user_isolation' AND tablename = 'idempotency_keys'
  ) THEN
    EXECUTE 'CREATE POLICY idempotency_keys_user_isolation ON public.idempotency_keys
      FOR ALL USING (auth.role() = ''service_role'' OR user_id = auth.uid()::text)';
  END IF;
END $$;

-- ── 4. Audit Log Trigger for Financial Modifications ──
CREATE OR REPLACE FUNCTION public.audit_sensitive_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details)
    VALUES (
      COALESCE(OLD.user_id, 'system'),
      'SENSITIVE_ROW_DELETED',
      TG_TABLE_NAME,
      jsonb_build_object('op', TG_OP, 'old_data', row_to_json(OLD))
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource, details)
    VALUES (
      COALESCE(NEW.user_id, OLD.user_id, 'system'),
      'SENSITIVE_ROW_UPDATED',
      TG_TABLE_NAME,
      jsonb_build_object('op', TG_OP, 'old_data', row_to_json(OLD), 'new_data', row_to_json(NEW))
    );
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;
