-- ═══════════════════════════════════════════════════════════════════════
-- ZEGA AI — P2 Reliability & Scalability Hardening Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- Addresses:
--   F-013: Distributed DB-backed sliding window rate limiter
--   F-016: Financial operation idempotency persistence
--
-- All operations are IDEMPOTENT and SAFE for zero-downtime deployment.
-- ═══════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════
-- 1. RATE LIMITS TABLE (F-013)
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key           TEXT        PRIMARY KEY,
  points        INT         NOT NULL DEFAULT 1 CHECK (points >= 0),
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'rate_limits_service_role_only' AND tablename = 'rate_limits'
  ) THEN
    EXECUTE 'CREATE POLICY rate_limits_service_role_only ON public.rate_limits
      FOR ALL USING (false)'; -- Service-role access only
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits(expires_at);


-- ══════════════════════════════════════════════════════
-- 2. IDEMPOTENCY KEYS TABLE (F-016)
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key            TEXT        PRIMARY KEY,
  user_id        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_hash   TEXT        NOT NULL,
  response_body  JSONB       NOT NULL DEFAULT '{}'::jsonb,
  status_code    INT         NOT NULL DEFAULT 200,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'idempotency_service_role_only' AND tablename = 'idempotency_keys'
  ) THEN
    EXECUTE 'CREATE POLICY idempotency_service_role_only ON public.idempotency_keys
      FOR ALL USING (false)'; -- Service-role access only
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);


-- ══════════════════════════════════════════════════════
-- 3. CLEANUP ROUTINE
-- ══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits_and_idempotency()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE expires_at < NOW();
  DELETE FROM public.idempotency_keys WHERE expires_at < NOW();
END;
$$;


-- ══════════════════════════════════════════════════════
-- 4. GRANTS
-- ══════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idempotency_keys TO service_role;
