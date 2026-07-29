-- ═══════════════════════════════════════════════════════════════════════════════
--  ZEGA AI — MASTER ENTERPRISE SUPABASE DATABASE MIGRATION
--  Migration File: /supabase/migrations/20260729000001_comprehensive_enterprise_schema.sql
--  Adheres to OWASP ASVS 4.0 Security Standards, Anti-Throttling, Payload Validation & Multi-Tenant RLS
--  100% IDEMPOTENT (Safe for repeated execution in Supabase SQL Editor / CLI)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. EXTENSIONS & SCHEMAS ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ─── 2. ENUM TYPES ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role_type AS ENUM ('individual', 'umkm', 'enterprise', 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_role_type AS ENUM ('owner', 'admin', 'member', 'billing_contact');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sandbox_status_type AS ENUM ('idle', 'provisioning', 'running', 'paused', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.execution_status_type AS ENUM ('pending', 'running', 'completed', 'failed', 'timeout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.workflow_status_type AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 3. CORE IDENTITY & WORKSPACE TABLES ──────────────────────────────────────

-- 3.1 User Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role public.user_role_type NOT NULL DEFAULT 'individual',
    company_name TEXT,
    job_title TEXT,
    phone_number TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Organizations (Multi-Tenant Workspace)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tier public.user_role_type NOT NULL DEFAULT 'enterprise',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{"max_agents": 50, "max_sandboxes": 10}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Organization Roster & RBAC Membership
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.org_role_type NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, user_id)
);

-- 3.4 User & Enterprise API Keys (Hashed Storage for M2M Developer Access)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- e.g., zg_live_
    key_hash TEXT NOT NULL,   -- SHA-256 HASH OF API KEY
    scopes TEXT[] DEFAULT ARRAY['agent:read', 'agent:execute'],
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─── 4. AUTONOMOUS AI AGENTS & WORKFLOW ORCHESTRATION ─────────────────────────

-- 4.1 Autonomous AI Agents
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

-- 4.2 Agent Workflows (DAG Nodes & Steps)
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status public.workflow_status_type NOT NULL DEFAULT 'active',
    nodes_graph JSONB DEFAULT '[]'::jsonb,
    edges_graph JSONB DEFAULT '[]'::jsonb,
    trigger_config JSONB DEFAULT '{"type": "manual"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4.3 AI Code Sandboxes
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

-- 4.4 Sandbox & Agent Executions Log (OWASP Anti-Chunking Check)
CREATE TABLE IF NOT EXISTS public.sandbox_executions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    sandbox_id UUID REFERENCES public.sandboxes(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.execution_status_type NOT NULL DEFAULT 'pending',
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    tokens_used INT DEFAULT 0 CHECK (tokens_used >= 0),
    duration_ms INT DEFAULT 0 CHECK (duration_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    -- OWASP Anti-Chunk Bombing Payload Guard: 10MB payload size ceiling
    CONSTRAINT chk_input_payload_size CHECK (octet_length(input_payload::text) <= 10485760),
    CONSTRAINT chk_output_payload_size CHECK (octet_length(output_payload::text) <= 10485760)
);

-- ─── 5. INTEGRATIONS & MEMORY VECTOR STORE ────────────────────────────────────

-- 5.1 Connected Enterprise Integrations
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL, -- e.g., 'slack', 'stripe', 'whatsapp', 'notion', 'gdrive'
    provider_name TEXT NOT NULL,
    is_connected BOOLEAN NOT NULL DEFAULT true,
    auth_data JSONB DEFAULT '{}'::jsonb, -- encrypted metadata & tokens
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, provider_id)
);

-- 5.2 Agent Memory Store (Vector Context Store)
CREATE TABLE IF NOT EXISTS public.agent_memory_store (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─── 6. SECURITY, AUDIT & OWASP ANTI-THROTTLING ──────────────────────────────

-- 6.1 OWASP Audit Logs
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

-- 6.2 OWASP Anti-Throttling & Rate Limit Log
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    identifier TEXT NOT NULL, -- User UUID or IP address
    action TEXT NOT NULL,
    request_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_lookup ON public.rate_limit_logs(identifier, action, window_start);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.security_audit_logs(user_id, action, created_at);

-- ─── 7. PROCEDURES & TRIGGER FUNCTIONS ────────────────────────────────────────

-- 7.1 Anti-Throttling Rate Limiting Stored Procedure
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

    SELECT COALESCE(SUM(request_count), 0)
    INTO v_current_count
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 Security Event Logger Stored Procedure
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 Auto Signup Sync Trigger (auth.users -> public.profiles)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 7.4 Auto Timestamp Modifier Function
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_agents_updated_at ON public.agents;
CREATE TRIGGER set_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_workflows_updated_at ON public.workflows;
CREATE TRIGGER set_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_sandboxes_updated_at ON public.sandboxes;
CREATE TRIGGER set_sandboxes_updated_at BEFORE UPDATE ON public.sandboxes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_integrations_updated_at ON public.integrations;
CREATE TRIGGER set_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ─── 8. ROW-LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- 8.1 Profiles RLS Policies
DROP POLICY IF EXISTS "Profiles self select" ON public.profiles;
CREATE POLICY "Profiles self select" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 8.2 Organizations RLS Policies
DROP POLICY IF EXISTS "Org members select" ON public.organizations;
CREATE POLICY "Org members select" ON public.organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = id AND om.user_id = auth.uid())
);

-- 8.3 User API Keys RLS Policies
DROP POLICY IF EXISTS "API Keys self manage" ON public.user_api_keys;
CREATE POLICY "API Keys self manage" ON public.user_api_keys FOR ALL USING (user_id = auth.uid());

-- 8.4 Agents & Workflows RLS Policies
DROP POLICY IF EXISTS "Agents self manage" ON public.agents;
CREATE POLICY "Agents self manage" ON public.agents FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Workflows self manage" ON public.workflows;
CREATE POLICY "Workflows self manage" ON public.workflows FOR ALL USING (user_id = auth.uid());

-- 8.5 Sandboxes & Executions RLS Policies
DROP POLICY IF EXISTS "Sandboxes self manage" ON public.sandboxes;
CREATE POLICY "Sandboxes self manage" ON public.sandboxes FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Executions self view" ON public.sandbox_executions;
CREATE POLICY "Executions self view" ON public.sandbox_executions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Executions self insert" ON public.sandbox_executions;
CREATE POLICY "Executions self insert" ON public.sandbox_executions FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8.6 Integrations RLS Policies
DROP POLICY IF EXISTS "Integrations self manage" ON public.integrations;
CREATE POLICY "Integrations self manage" ON public.integrations FOR ALL USING (user_id = auth.uid());

-- 8.7 Agent Memory Store RLS Policies
DROP POLICY IF EXISTS "Memory self manage" ON public.agent_memory_store;
CREATE POLICY "Memory self manage" ON public.agent_memory_store FOR ALL USING (user_id = auth.uid());

-- 8.8 Security Audit & Rate Limit Logs RLS Policies (Service Role Access Only)
DROP POLICY IF EXISTS "Audit logs service role only" ON public.security_audit_logs;
CREATE POLICY "Audit logs service role only" ON public.security_audit_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Rate limit logs service role only" ON public.rate_limit_logs;
CREATE POLICY "Rate limit logs service role only" ON public.rate_limit_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
