-- ═══════════════════════════════════════════════════════════════════════════════
--  ZEGA AI — PRODUCTION SUPABASE ENTERPRISE DATABASE SCHEMA & SECURITY MIGRATION
--  Migration ID: 20260729000000_enterprise_schema_and_security
--  Adheres to OWASP ASVS 4.0 Security, Multi-Tenant RLS, and Anti-Throttling Rules
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. EXTENSIONS & SECURITY SCHEMAS ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ─── 2. ENUM TYPES ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role_type AS ENUM ('individual', 'umkm', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_role_type AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sandbox_status_type AS ENUM ('idle', 'provisioning', 'running', 'paused', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.execution_status_type AS ENUM ('pending', 'running', 'completed', 'failed', 'timeout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 3. CORE TABLES ───────────────────────────────────────────────────────────

-- 3.1 Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role public.user_role_type NOT NULL DEFAULT 'individual',
    company_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Multi-Tenant Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tier public.user_role_type NOT NULL DEFAULT 'enterprise',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.org_role_type NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, user_id)
);

-- 3.4 Autonomous AI Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'zega-agent-v1',
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.70 CHECK (temperature >= 0.0 AND temperature <= 2.0),
    rate_limit_per_min INT NOT NULL DEFAULT 60 CHECK (rate_limit_per_min > 0 AND rate_limit_per_min <= 1000),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 Interactive AI Sandboxes Table
CREATE TABLE IF NOT EXISTS public.sandboxes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    runtime_type TEXT NOT NULL DEFAULT 'webcontainer' CHECK (runtime_type IN ('webcontainer', 'microvm', 'docker')),
    status public.sandbox_status_type NOT NULL DEFAULT 'idle',
    memory_mb INT NOT NULL DEFAULT 512 CHECK (memory_mb >= 128 AND memory_mb <= 8192),
    cpu_cores NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (cpu_cores >= 0.5 AND cpu_cores <= 4.0),
    timeout_seconds INT NOT NULL DEFAULT 60 CHECK (timeout_seconds >= 5 AND timeout_seconds <= 600),
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 Sandbox Executions Table (OWASP Anti-Chunking Payload Check)
CREATE TABLE IF NOT EXISTS public.sandbox_executions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    sandbox_id UUID NOT NULL REFERENCES public.sandboxes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.execution_status_type NOT NULL DEFAULT 'pending',
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    tokens_used INT DEFAULT 0 CHECK (tokens_used >= 0),
    duration_ms INT DEFAULT 0 CHECK (duration_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    -- OWASP Anti-Chunk Bombing: Cap single execution input payload size to 10MB max
    CONSTRAINT chk_input_payload_size CHECK (octet_length(input_payload::text) <= 10485760),
    CONSTRAINT chk_output_payload_size CHECK (octet_length(output_payload::text) <= 10485760)
);

-- 3.7 Security Audit Logs (OWASP Audit Trail)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address INET,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    status_code INT NOT NULL DEFAULT 200,
    payload_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 Anti-Throttling & Rate Limit Tracking Table
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    identifier TEXT NOT NULL, -- User UUID or IP Address
    action TEXT NOT NULL,
    request_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON public.rate_limit_logs(identifier, action, window_start);

-- ─── 4. AUTOMATED PROCEDURES & FUNCTIONS ──────────────────────────────────────

-- 4.1 Anti-Throttling Rate Limiting Stored Procedure
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_requests INT DEFAULT 100,
    p_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_current_count INT;
BEGIN
    v_window_start := timezone('utc'::text, now()) - (p_window_seconds || ' seconds')::INTERVAL;

    -- Count requests in window
    SELECT COALESCE(SUM(request_count), 0)
    INTO v_current_count
    FROM public.rate_limit_logs
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start >= v_window_start;

    IF v_current_count >= p_max_requests THEN
        RETURN FALSE; -- Rate limit exceeded!
    END IF;

    -- Record request
    INSERT INTO public.rate_limit_logs (identifier, action, request_count, window_start)
    VALUES (p_identifier, p_action, 1, timezone('utc'::text, now()));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 Security Event Audit Logger Procedure
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
    VALUES (p_user_id, p_ip_address::INET, p_action, p_resource, p_status_code, substring(p_payload_summary from 1 for 1000));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Trigger Function: Auto Sync auth.users to public.profiles
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ─── 5. ROW-LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles RLS Policies
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5.2 Organizations RLS Policies
CREATE POLICY "Org members can view organization" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update organization" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organizations.id AND om.user_id = auth.uid() AND om.role = 'owner'
        )
    );

-- 5.3 Organization Members RLS Policies
CREATE POLICY "Members can view org roster" ON public.organization_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid()
        )
    );

-- 5.4 Agents RLS Policies
CREATE POLICY "Users can manage own agents" ON public.agents
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Org members can read org agents" ON public.agents
    FOR SELECT USING (
        organization_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = agents.organization_id AND om.user_id = auth.uid()
        )
    );

-- 5.5 Sandboxes RLS Policies
CREATE POLICY "Users can manage own sandboxes" ON public.sandboxes
    FOR ALL USING (user_id = auth.uid());

-- 5.6 Sandbox Executions RLS Policies
CREATE POLICY "Users can view own executions" ON public.sandbox_executions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own executions" ON public.sandbox_executions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5.7 Audit Logs RLS Policies (Restricted to Service Role)
CREATE POLICY "Service Role full access to audit logs" ON public.security_audit_logs
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 5.8 Rate Limit Logs RLS Policies (Restricted to Service Role)
CREATE POLICY "Service Role full access to rate limit logs" ON public.rate_limit_logs
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ─── 6. AUTOMATED UPDATED_AT TRIGGER ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
CREATE TRIGGER set_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
CREATE TRIGGER set_sandboxes_updated_at BEFORE UPDATE ON public.sandboxes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
