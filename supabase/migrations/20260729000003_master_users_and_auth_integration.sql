-- ═══════════════════════════════════════════════════════════════════════════════
--  ZEGA AI — MASTER USERS DATABASE SCHEMA & AUTHENTICATION INTEGRATION
--  Migration File: /supabase/migrations/20260729000003_master_users_and_auth_integration.sql
--  Creates & Syncs public.users table with auth.users, RLS Policies & Stored Procedures
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. EXTENSIONS & TYPES ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

DO $$ BEGIN
  CREATE TYPE public.user_role_type AS ENUM ('individual', 'umkm', 'enterprise', 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. MASTER USERS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT,
    role public.user_role_type NOT NULL DEFAULT 'individual',
    audience_segment TEXT DEFAULT 'individual',
    company_name TEXT,
    job_title TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    billing_plan TEXT DEFAULT 'starter',
    credits_balance NUMERIC(12,2) DEFAULT 1000.00,
    is_verified BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for high-performance lookup & auth queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ─── 3. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id OR email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can update their own details" ON public.users;
CREATE POLICY "Users can update their own details"
    ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id OR email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
CREATE POLICY "Service role has full access to users"
    ON public.users FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── 4. AUTOMATIC SYNCHRONIZATION TRIGGERS ────────────────────────────────────

-- 4.1 Sync trigger function between auth.users / public.profiles and public.users
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        email,
        full_name,
        role,
        avatar_url,
        last_login_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_type, 'individual'),
        NEW.raw_user_meta_data->>'avatar_url',
        now(),
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        last_login_at = now(),
        updated_at = now();

    -- Also keep public.profiles synchronized
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_type, 'individual'),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();

    RETURN NEW;
END;
$$;

-- Drop existing trigger if present and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();

-- ─── 5. STORED PROCEDURES FOR USER INTEGRATION ───────────────────────────────

-- 5.1 Upsert User Function for Backend API & Client
CREATE OR REPLACE FUNCTION public.upsert_zega_user(
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_role public.user_role_type DEFAULT 'individual',
    p_company_name TEXT DEFAULT NULL,
    p_audience_segment TEXT DEFAULT 'individual'
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user public.users;
BEGIN
    INSERT INTO public.users (
        email,
        full_name,
        role,
        company_name,
        audience_segment,
        last_login_at,
        created_at,
        updated_at
    )
    VALUES (
        LOWER(p_email),
        COALESCE(p_full_name, SPLIT_PART(p_email, '@', 1)),
        p_role,
        p_company_name,
        p_audience_segment,
        now(),
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        role = EXCLUDED.role,
        company_name = COALESCE(EXCLUDED.company_name, public.users.company_name),
        audience_segment = COALESCE(EXCLUDED.audience_segment, public.users.audience_segment),
        last_login_at = now(),
        updated_at = now()
    RETURNING * INTO v_user;

    RETURN v_user;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.upsert_zega_user TO authenticated, service_role, anon;
