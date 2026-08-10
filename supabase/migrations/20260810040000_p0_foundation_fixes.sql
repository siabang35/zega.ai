-- ═══════════════════════════════════════════════════════════════════════
-- ZEGA AI — P0 Foundation Security Fixes Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- Addresses:
--   F-001: Payment state stored in volatile memory → persistent DB table
--   F-010: No token revocation → sessions table for revocation tracking
--   F-022: handle_new_user_signup trusts role from raw_user_meta_data
--
-- All changes are ADDITIVE and IDEMPOTENT.
-- ═══════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════
-- 1. PAYMENTS TABLE (F-001)
-- ══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payments (
  id            TEXT        PRIMARY KEY,
  type          TEXT        NOT NULL CHECK (type IN ('stripe', 'x402', 'bank')),
  amount        NUMERIC(18,6) NOT NULL CHECK (amount > 0),
  currency      TEXT        NOT NULL DEFAULT 'USD',
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  routed_via    TEXT        NOT NULL DEFAULT '9router',
  from_agent    TEXT,
  to_service    TEXT,
  stripe_payment_intent_id TEXT,
  x402_tx_hash  TEXT,
  owner_id      UUID        NOT NULL,
  organization_id UUID,
  metadata      JSONB       DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only see their own payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'payments_user_isolation' AND tablename = 'payments'
  ) THEN
    EXECUTE 'CREATE POLICY payments_user_isolation ON public.payments
      FOR ALL USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid())';
  END IF;
END $$;

-- Org members can view payments within their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'payments_org_read' AND tablename = 'payments'
  ) THEN
    EXECUTE 'CREATE POLICY payments_org_read ON public.payments FOR SELECT USING (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid()
      )
    )';
  END IF;
END $$;

-- Indexes for tenant-scoped lookups
CREATE INDEX IF NOT EXISTS idx_payments_owner_id ON public.payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON public.payments(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


-- ══════════════════════════════════════════════════════
-- 2. SESSIONS TABLE (F-010)
-- ══════════════════════════════════════════════════════
-- Tracks active JWT sessions for revocation support.
-- When a user logs out or an admin revokes access,
-- the session is marked as revoked and the token hash
-- can be checked on subsequent requests.

CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID        PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id       UUID        NOT NULL,
  token_hash    TEXT        NOT NULL,  -- SHA-256 of the JWT for revocation lookup
  ip_address    INET,
  user_agent    TEXT,
  is_revoked    BOOLEAN     NOT NULL DEFAULT false,
  revoked_at    TIMESTAMPTZ,
  revoke_reason TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'sessions_user_isolation' AND tablename = 'sessions'
  ) THEN
    EXECUTE 'CREATE POLICY sessions_user_isolation ON public.sessions
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);


-- ══════════════════════════════════════════════════════
-- 3. FIX handle_new_user_signup (F-022)
-- ══════════════════════════════════════════════════════
-- Previously trusted role from raw_user_meta_data, allowing
-- privilege escalation at signup. Now hardcoded to 'individual'.

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        -- SECURITY (F-022 FIX): NEVER trust role from client metadata.
        -- All new users start as 'individual'. Role escalation must go
        -- through explicit admin assignment or env-configured superadmin list.
        'individual'::public.user_role_type
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


-- ══════════════════════════════════════════════════════
-- 4. GRANTS
-- ══════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO service_role;
