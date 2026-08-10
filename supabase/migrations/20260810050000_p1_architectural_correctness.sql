-- ═══════════════════════════════════════════════════════════════════════
-- ZEGA AI — P1 Architectural Correctness Fixes Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- Addresses:
--   F-006: OTP store in process memory → persistent DB table
--   F-007: Telegram deduplication state in memory → persistent DB table
--   F-005 & F-010: Refresh token & session tracking enhancements
--
-- All changes are ADDITIVE and IDEMPOTENT.
-- ═══════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════
-- 1. OTPS TABLE (F-006)
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.otps (
  id            UUID        PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  email         TEXT        NOT NULL,
  otp_hash      TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      INT         NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  metadata      JSONB       DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Allow service_role full control, no client direct access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'otps_service_role_only' AND tablename = 'otps'
  ) THEN
    EXECUTE 'CREATE POLICY otps_service_role_only ON public.otps
      FOR ALL USING (false)'; -- Block all anon/authenticated access; only service_role (backend) can manage OTPs
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_otps_email ON public.otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON public.otps(expires_at);


-- ══════════════════════════════════════════════════════
-- 2. TELEGRAM DEDUPLICATION TABLE (F-007)
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.telegram_dedup (
  dispatch_key   TEXT        PRIMARY KEY,
  dispatched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.telegram_dedup ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'telegram_dedup_service_role_only' AND tablename = 'telegram_dedup'
  ) THEN
    EXECUTE 'CREATE POLICY telegram_dedup_service_role_only ON public.telegram_dedup
      FOR ALL USING (false)'; -- Service-role only
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_telegram_dedup_expires ON public.telegram_dedup(expires_at);


-- ══════════════════════════════════════════════════════
-- 3. REFRESH TOKENS FIELD IN SESSIONS TABLE (F-005)
-- ══════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'refresh_token_hash'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN refresh_token_hash TEXT;
    CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON public.sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;
  END IF;
END $$;


-- ══════════════════════════════════════════════════════
-- 4. CLEANUP ROUTINE FOR OTPS AND TELEGRAM DEDUP
-- ══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps_and_dedup()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM public.otps WHERE expires_at < NOW();
  DELETE FROM public.telegram_dedup WHERE expires_at < NOW();
  DELETE FROM public.sessions WHERE expires_at < NOW() AND is_revoked = true;
END;
$$;


-- ══════════════════════════════════════════════════════
-- 5. GRANTS
-- ══════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON public.otps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_dedup TO service_role;
