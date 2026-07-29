-- ═══════════════════════════════════════════════════════════════════════════════
--  ZEGA AI — ENTERPRISE USER AUTHENTICATION, SESSIONS, CACHING & COOKIE SCHEMA
--  Migration File: /supabase/migrations/20260729000002_users_auth_sessions_cache_and_cookies.sql
--  OWASP ASVS 4.0 Compliant Session Security, Token Revocation & Performance Caching
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. EXTENSIONS & ENUMS ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

DO $$ BEGIN
  CREATE TYPE public.session_status_type AS ENUM ('active', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. USER AUTHENTICATION & SESSIONS TABLE ──────────────────────────────────

-- 2.1 User Sessions & Cookie Tracker Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    cookie_hash TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT,
    device_type TEXT DEFAULT 'desktop',
    status public.session_status_type NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    revoked_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast session lookup & token revocation validation
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_status ON public.user_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- ─── 3. HIGH-PERFORMANCE CACHING TABLE ───────────────────────────────────────

-- 3.1 Auth & Telemetry Key-Value JSON Cache Table
CREATE TABLE IF NOT EXISTS public.auth_cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    ttl_seconds INT NOT NULL DEFAULT 3600,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_auth_cache_expires ON public.auth_cache(expires_at);

-- ─── 4. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_cache ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS for user_sessions
DROP POLICY IF EXISTS "Users can view their active sessions" ON public.user_sessions;
CREATE POLICY "Users can view their active sessions"
    ON public.user_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role has full access to user_sessions" ON public.user_sessions;
CREATE POLICY "Service role has full access to user_sessions"
    ON public.user_sessions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 4.2 RLS for auth_cache
DROP POLICY IF EXISTS "Service role has full access to auth_cache" ON public.auth_cache;
CREATE POLICY "Service role has full access to auth_cache"
    ON public.auth_cache FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── 5. STORED PROCEDURES FOR SESSION MANAGEMENT & CACHING ───────────────────

-- 5.1 Create Session Procedure
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_user_id UUID,
    p_session_token TEXT,
    p_ip_address TEXT DEFAULT '127.0.0.1',
    p_user_agent TEXT DEFAULT 'Unknown Browser',
    p_cookie_hash TEXT DEFAULT NULL,
    p_expires_in_seconds INT DEFAULT 604800
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_expires_at := now() + (p_expires_in_seconds || ' seconds')::INTERVAL;

    -- Deactivate old sessions if needed
    UPDATE public.user_sessions
    SET status = 'expired', revoked_at = now()
    WHERE user_id = p_user_id AND status = 'active' AND expires_at < now();

    INSERT INTO public.user_sessions (
        user_id,
        session_token,
        cookie_hash,
        ip_address,
        user_agent,
        status,
        expires_at
    )
    VALUES (
        p_user_id,
        p_session_token,
        p_cookie_hash,
        p_ip_address,
        p_user_agent,
        'active',
        v_expires_at
    )
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$;

-- 5.2 Invalidate Session (Sign Out) Procedure
CREATE OR REPLACE FUNCTION public.invalidate_user_session(
    p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_sessions
    SET status = 'revoked',
        revoked_at = timezone('utc'::text, now())
    WHERE session_token = p_session_token AND status = 'active';

    RETURN FOUND;
END;
$$;

-- 5.3 Cache Set Procedure
CREATE OR REPLACE FUNCTION public.cache_set(
    p_key TEXT,
    p_value JSONB,
    p_ttl_seconds INT DEFAULT 3600
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_expires_at := now() + (p_ttl_seconds || ' seconds')::INTERVAL;

    INSERT INTO public.auth_cache (key, value, ttl_seconds, expires_at, updated_at)
    VALUES (p_key, p_value, p_ttl_seconds, v_expires_at, now())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        ttl_seconds = EXCLUDED.ttl_seconds,
        expires_at = EXCLUDED.expires_at,
        updated_at = now();
END;
$$;

-- 5.4 Cache Get Procedure
CREATE OR REPLACE FUNCTION public.cache_get(
    p_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_val JSONB;
BEGIN
    SELECT value INTO v_val
    FROM public.auth_cache
    WHERE key = p_key AND expires_at > now();

    RETURN v_val;
END;
$$;

-- 5.5 Auto-clean expired sessions & cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.auth_cache WHERE expires_at < now();
    UPDATE public.user_sessions SET status = 'expired' WHERE expires_at < now() AND status = 'active';
END;
$$;

-- Grant EXECUTE permissions
GRANT EXECUTE ON FUNCTION public.create_user_session TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.invalidate_user_session TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.cache_set TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.cache_get TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.clean_expired_data TO authenticated, service_role, anon;
