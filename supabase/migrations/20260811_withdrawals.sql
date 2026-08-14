-- ═══════════════════════════════════════════════════════════════════════════════
--  ZEGA AI — Withdrawal System Database Migration
--  Creates the `withdrawals` table with proper indexes and RLS policies.
--  100% IDEMPOTENT — Safe for repeated execution.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── WITHDRAWAL STATUS ENUM ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.withdrawal_status_type AS ENUM (
    'pending', 'building', 'signing', 'submitted', 'confirmed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── WITHDRAWALS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL,
  privy_user_id         TEXT,
  wallet_address        TEXT,
  asset                 TEXT NOT NULL DEFAULT 'SOL',
  token_mint            TEXT,
  amount                TEXT NOT NULL DEFAULT '0',
  recipient             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending',
  transaction_signature TEXT,
  idempotency_key       TEXT UNIQUE,
  failure_reason        TEXT,
  ip_address            TEXT,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  confirmed_at          TIMESTAMPTZ
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id
  ON public.withdrawals(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status
  ON public.withdrawals(status);

CREATE INDEX IF NOT EXISTS idx_withdrawals_tx_sig
  ON public.withdrawals(transaction_signature)
  WHERE transaction_signature IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_idempotency_key
  ON public.withdrawals(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at
  ON public.withdrawals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status
  ON public.withdrawals(user_id, status);

-- ─── AUTO-UPDATE TIMESTAMP TRIGGER ────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_withdrawals_updated_at ON public.withdrawals;
CREATE TRIGGER set_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for backend API operations)
DROP POLICY IF EXISTS "withdrawals_service_role_all" ON public.withdrawals;
CREATE POLICY "withdrawals_service_role_all"
  ON public.withdrawals FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Users can view their own withdrawals
DROP POLICY IF EXISTS "withdrawals_user_select" ON public.withdrawals;
CREATE POLICY "withdrawals_user_select"
  ON public.withdrawals FOR SELECT
  USING (user_id = (auth.jwt()->>'email'));

-- ─── WITHDRAWAL AUDIT LOG TABLE (Separate from security_audit_logs) ──────────
CREATE TABLE IF NOT EXISTS public.withdrawal_audit_logs (
  id                  UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  withdrawal_id       TEXT NOT NULL,
  user_id             TEXT NOT NULL,
  action              TEXT NOT NULL,
  status_from         TEXT,
  status_to           TEXT,
  details             JSONB DEFAULT '{}'::jsonb,
  ip_address          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_user
  ON public.withdrawal_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_withdrawal
  ON public.withdrawal_audit_logs(withdrawal_id);

ALTER TABLE public.withdrawal_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawal_audit_service_role" ON public.withdrawal_audit_logs;
CREATE POLICY "withdrawal_audit_service_role"
  ON public.withdrawal_audit_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ─── PRIVY WALLETS TABLE (ensure it exists) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.privy_wallets (
  id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         TEXT NOT NULL,
  email           TEXT,
  wallet_address  TEXT NOT NULL,
  chain           TEXT NOT NULL DEFAULT 'solana',
  wallet_type     TEXT NOT NULL DEFAULT 'privy_keyless_embedded',
  status          TEXT DEFAULT 'active',
  is_primary      BOOLEAN DEFAULT true,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(email, chain)
);

CREATE INDEX IF NOT EXISTS idx_privy_wallets_email
  ON public.privy_wallets(email);

CREATE INDEX IF NOT EXISTS idx_privy_wallets_address
  ON public.privy_wallets(wallet_address);

ALTER TABLE public.privy_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privy_wallets_service_role" ON public.privy_wallets;
CREATE POLICY "privy_wallets_service_role"
  ON public.privy_wallets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ─── RATE LIMITS TABLE (ensure exists for idempotency) ────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key           TEXT PRIMARY KEY,
  points        INTEGER NOT NULL DEFAULT 1,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at    TIMESTAMPTZ NOT NULL
);

-- ─── IDEMPOTENCY KEYS TABLE (ensure exists) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key             TEXT PRIMARY KEY,
  user_id         TEXT,
  request_hash    TEXT NOT NULL,
  response_body   JSONB,
  status_code     INTEGER DEFAULT 200,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON public.idempotency_keys(expires_at);
