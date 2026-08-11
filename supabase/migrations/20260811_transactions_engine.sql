-- ═══════════════════════════════════════════════════════════════════════════════
--  ZEGA AI — Full End-to-End Privy Transaction Infrastructure Schema
--  Tables: `transactions`, `privy_wallets`, `privy_webhook_events`
--  100% IDEMPOTENT — Safe for repeated execution.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── TRANSACTION STATUS ENUM ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.transaction_status_enum AS ENUM (
    'CREATED', 'VALIDATING', 'BUILDING', 'AWAITING_SIGNATURE', 'SIGNED',
    'SUBMITTED', 'CONFIRMING', 'CONFIRMED', 'FAILED', 'REJECTED', 'EXPIRED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TRANSACTION TYPE ENUM ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.transaction_type_enum AS ENUM (
    'SOL_TRANSFER', 'SPL_TRANSFER', 'ATA_CREATION', 'WITHDRAWAL', 'DEPOSIT', 'CUSTOM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TRANSACTIONS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL,
  privy_user_id             TEXT,
  wallet_id                 TEXT,
  wallet_address            TEXT NOT NULL,

  type                      TEXT NOT NULL DEFAULT 'SOL_TRANSFER',
  chain                     TEXT NOT NULL DEFAULT 'solana',
  network                   TEXT NOT NULL DEFAULT 'devnet',

  asset                     TEXT NOT NULL DEFAULT 'SOL',
  token_mint                TEXT,

  amount                    TEXT NOT NULL DEFAULT '0',
  amount_base_units         TEXT NOT NULL DEFAULT '0',

  sender                    TEXT NOT NULL,
  recipient                 TEXT NOT NULL,

  status                    TEXT NOT NULL DEFAULT 'CREATED',

  blockhash                 TEXT,
  last_valid_block_height   BIGINT,

  signature                 TEXT,
  fee                       TEXT,

  error_code                TEXT,
  error_message             TEXT,

  idempotency_key           TEXT UNIQUE,
  metadata                  JSONB DEFAULT '{}'::jsonb,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at              TIMESTAMPTZ,
  confirmed_at              TIMESTAMPTZ,
  failed_at                 TIMESTAMPTZ
);

-- Indexes for performant filtering & history pagination
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address
  ON public.transactions(wallet_address);

CREATE INDEX IF NOT EXISTS idx_transactions_signature
  ON public.transactions(signature)
  WHERE signature IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON public.transactions(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_key
  ON public.transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_status
  ON public.transactions(user_id, status);

-- Trigger for auto-updated_at
DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_service_role_all" ON public.transactions;
CREATE POLICY "transactions_service_role_all"
  ON public.transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "transactions_user_select" ON public.transactions;
CREATE POLICY "transactions_user_select"
  ON public.transactions FOR SELECT
  USING (user_id = (auth.jwt()->>'email'));

-- ─── PRIVY WALLETS TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.privy_wallets (
  id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         TEXT NOT NULL,
  privy_user_id   TEXT NOT NULL,
  email           TEXT,
  wallet_id       TEXT,
  wallet_address  TEXT NOT NULL,
  chain           TEXT NOT NULL DEFAULT 'solana',
  wallet_type     TEXT NOT NULL DEFAULT 'privy_keyless_embedded',
  status          TEXT DEFAULT 'active',
  is_primary      BOOLEAN DEFAULT true,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, chain),
  UNIQUE(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_privy_wallets_user_id
  ON public.privy_wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_privy_wallets_privy_user_id
  ON public.privy_wallets(privy_user_id);

CREATE INDEX IF NOT EXISTS idx_privy_wallets_address
  ON public.privy_wallets(wallet_address);

ALTER TABLE public.privy_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privy_wallets_service_role_all" ON public.privy_wallets;
CREATE POLICY "privy_wallets_service_role_all"
  ON public.privy_wallets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ─── PRIVY WEBHOOK EVENTS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.privy_webhook_events (
  id              TEXT PRIMARY KEY, -- Privy event ID
  event_type      TEXT NOT NULL,
  privy_user_id   TEXT,
  wallet_address  TEXT,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_privy_webhooks_event_type
  ON public.privy_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_privy_webhooks_user_id
  ON public.privy_webhook_events(privy_user_id);

ALTER TABLE public.privy_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privy_webhooks_service_role_all" ON public.privy_webhook_events;
CREATE POLICY "privy_webhooks_service_role_all"
  ON public.privy_webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
