-- ============================================================================
-- ZEGA AI PLATFORM - ENTERPRISE REALTIME CORE SCHEMA
-- Module 01: Core Enterprise Tables, Multi-Tenant Hierarchy & Performance Indexes
-- Path: supabase/migrations/sql_enterprise/01_enterprise_core_tables.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENTERPRISE ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.enterprise_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_code VARCHAR(32) UNIQUE NOT NULL DEFAULT ('ORG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(64) NOT NULL DEFAULT 'Enterprise Custom' CHECK (plan_tier IN ('Scale', 'Enterprise Custom', 'Dedicated Cluster')),
    sso_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_seats INT NOT NULL DEFAULT 500 CHECK (max_seats > 0),
    allocated_gpu_units INT NOT NULL DEFAULT 64 CHECK (allocated_gpu_units >= 0),
    region VARCHAR(64) NOT NULL DEFAULT 'us-east-1 (N. Virginia)',
    logo_path TEXT DEFAULT '/assets/logo/zegalogo.png',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ENTERPRISE RBAC MEMBERS & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.enterprise_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'secops', 'finops', 'developer', 'viewer')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    permissions JSONB NOT NULL DEFAULT '["read:*", "write:agents", "execute:mcp", "manage:billing"]'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_org_member_email_unique UNIQUE (org_id, email)
);

-- 3. ENTERPRISE AI CLUSTERS & COMPUTE NODES
CREATE TABLE IF NOT EXISTS public.enterprise_ai_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    cluster_code VARCHAR(64) NOT NULL,
    cluster_name VARCHAR(128) NOT NULL,
    provider VARCHAR(64) NOT NULL CHECK (provider IN ('Cloudflare Workers', 'Snowflake', 'AWS S3', 'Salesforce', 'Azure AI', 'ZeroClaw Node')),
    status VARCHAR(32) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'scaling', 'offline')),
    cpu_usage_pct NUMERIC(5,2) NOT NULL DEFAULT 42.50 CHECK (cpu_usage_pct BETWEEN 0 AND 100),
    memory_usage_pct NUMERIC(5,2) NOT NULL DEFAULT 58.00 CHECK (memory_usage_pct BETWEEN 0 AND 100),
    tpu_gpu_nodes INT NOT NULL DEFAULT 8 CHECK (tpu_gpu_nodes >= 0),
    active_instances INT NOT NULL DEFAULT 24 CHECK (active_instances >= 0),
    region VARCHAR(64) NOT NULL DEFAULT 'us-east-1',
    icon_path TEXT DEFAULT '/assets/logo/cloudflare.svg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_cluster_code_unique UNIQUE (org_id, cluster_code)
);

-- 4. ENTERPRISE MODEL CONTEXT PROTOCOL (MCP) CONNECTORS
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    connector_code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'Integration',
    status VARCHAR(32) NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'syncing', 'error', 'disconnected')),
    latency_ms INT NOT NULL DEFAULT 24 CHECK (latency_ms >= 0),
    icon_path TEXT NOT NULL,
    config_vault_ref VARCHAR(255),
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_mcp_connector_unique UNIQUE (org_id, connector_code)
);

-- 5. ENTERPRISE ZEROCLAW PIPELINES & ORCHESTRATORS
CREATE TABLE IF NOT EXISTS public.enterprise_orchestrators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    pipeline_code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    driver VARCHAR(64) NOT NULL DEFAULT 'ZeroClaw-v2',
    concurrent_workers INT NOT NULL DEFAULT 16 CHECK (concurrent_workers > 0),
    throughput_rps INT NOT NULL DEFAULT 1200 CHECK (throughput_rps >= 0),
    uptime_pct NUMERIC(5,2) NOT NULL DEFAULT 99.99 CHECK (uptime_pct BETWEEN 0 AND 100),
    status VARCHAR(32) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_pipeline_code_unique UNIQUE (org_id, pipeline_code)
);

-- 6. OWASP ENTERPRISE AUDIT LOGS & THREAT INTEL
CREATE TABLE IF NOT EXISTS public.enterprise_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL DEFAULT '127.0.0.1'::inet,
    user_agent TEXT,
    event_action VARCHAR(128) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENTERPRISE COST INTELLIGENCE & BILLING CACHE
CREATE TABLE IF NOT EXISTS public.enterprise_cost_intelligence (
    org_id UUID PRIMARY KEY REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    monthly_spend_usd NUMERIC(14,2) NOT NULL DEFAULT 14250.00 CHECK (monthly_spend_usd >= 0),
    monthly_budget_usd NUMERIC(14,2) NOT NULL DEFAULT 25000.00 CHECK (monthly_budget_usd >= 0),
    tokens_processed_millions NUMERIC(12,2) NOT NULL DEFAULT 850.50 CHECK (tokens_processed_millions >= 0),
    cost_savings_usd NUMERIC(14,2) NOT NULL DEFAULT 32400.00 CHECK (cost_savings_usd >= 0),
    payment_method VARCHAR(64) NOT NULL DEFAULT 'Visa Enterprise' CHECK (payment_method IN ('Visa Enterprise', 'Mastercard Enterprise', 'Wire Transfer', 'USDC Direct')),
    payment_logo_path TEXT DEFAULT '/assets/logo/visa.svg',
    card_last_four VARCHAR(4) DEFAULT '4242',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HIGH PERFORMANCE B-TREE INDEXES FOR MULTI-TENANT QUERY OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_enterprise_members_org_role ON public.enterprise_members(org_id, role);
CREATE INDEX IF NOT EXISTS idx_enterprise_clusters_org_status ON public.enterprise_ai_clusters(org_id, status);
CREATE INDEX IF NOT EXISTS idx_enterprise_mcp_org_status ON public.enterprise_mcp_connectors(org_id, status);
CREATE INDEX IF NOT EXISTS idx_enterprise_orchestrators_org_status ON public.enterprise_orchestrators(org_id, status);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_org_created ON public.enterprise_audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_audit_logs_severity ON public.enterprise_audit_logs(severity);
