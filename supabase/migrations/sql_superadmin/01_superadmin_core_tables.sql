-- ============================================================================
-- ZEGA AI PLATFORM - SUPERADMIN REALTIME CONTROL PLANE SCHEMA
-- Module 01: Core SuperAdmin Tables, Platform Metrics & Infrastructure Registry
-- Path: supabase/migrations/sql_superadmin/01_superadmin_core_tables.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GLOBAL PLATFORM KPIS & TELEMETRY
CREATE TABLE IF NOT EXISTS public.superadmin_platform_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_mrr_usd NUMERIC(14,2) NOT NULL DEFAULT 485900.00 CHECK (total_mrr_usd >= 0),
    total_arr_usd NUMERIC(14,2) NOT NULL DEFAULT 5830800.00 CHECK (total_arr_usd >= 0),
    active_tenants_count INT NOT NULL DEFAULT 1428 CHECK (active_tenants_count >= 0),
    enterprise_tenants_count INT NOT NULL DEFAULT 184 CHECK (enterprise_tenants_count >= 0),
    active_ai_agents_count INT NOT NULL DEFAULT 12450 CHECK (active_ai_agents_count >= 0),
    global_requests_per_min INT NOT NULL DEFAULT 142000 CHECK (global_requests_per_min >= 0),
    platform_uptime_pct NUMERIC(5,3) NOT NULL DEFAULT 99.998 CHECK (platform_uptime_pct BETWEEN 0 AND 100),
    global_token_usage_billions NUMERIC(12,3) NOT NULL DEFAULT 18.420 CHECK (global_token_usage_billions >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUPERADMIN ROOT ACCOUNTS & HARDENED PRIVILEGES
CREATE TABLE IF NOT EXISTS public.superadmin_root_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(128) NOT NULL DEFAULT 'SuperAdmin ZEGA Root',
    email VARCHAR(255) UNIQUE NOT NULL,
    security_level VARCHAR(64) NOT NULL DEFAULT 'ROOT_SUPERADMIN' CHECK (security_level IN ('ROOT_SUPERADMIN', 'SECURITY_AUDITOR', 'OPERATIONS_LEAD')),
    hardware_mfa_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    ip_whitelist INET[] NOT NULL DEFAULT ARRAY['127.0.0.1'::inet],
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GLOBAL TENANT REGISTRY & HEALTH
CREATE TABLE IF NOT EXISTS public.superadmin_tenant_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(64) UNIQUE NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'ENTERPRISE' CHECK (category IN ('UMKM', 'ENTERPRISE', 'SUPERADMIN', 'PARTNER')),
    db_pool_status VARCHAR(32) NOT NULL DEFAULT 'healthy' CHECK (db_pool_status IN ('healthy', 'warning', 'degraded', 'offline')),
    dedicated_cluster_url VARCHAR(255),
    storage_usage_gb NUMERIC(10,2) NOT NULL DEFAULT 120.50 CHECK (storage_usage_gb >= 0),
    monthly_revenue_usd NUMERIC(14,2) NOT NULL DEFAULT 12500.00 CHECK (monthly_revenue_usd >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'maintenance')),
    logo_path TEXT DEFAULT '/assets/logo/zegalogo.png',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. OWASP SUPERADMIN MASTER SECURITY THREAT LOGS
CREATE TABLE IF NOT EXISTS public.superadmin_security_threat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_code VARCHAR(64) NOT NULL,
    threat_type VARCHAR(64) NOT NULL CHECK (threat_type IN ('DDOS_ATTEMPT', 'UNAUTHORIZED_ROOT_ACCESS', 'RATE_LIMIT_EXCEEDED', 'SQLI_ATTEMPT', 'PAYLOAD_CHUNK_OVERFLOW', 'SUSPICIOUS_IP_LOGIN')),
    severity VARCHAR(16) NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    source_ip INET NOT NULL DEFAULT '127.0.0.1'::inet,
    geo_country VARCHAR(64) DEFAULT 'Unknown',
    status VARCHAR(32) NOT NULL DEFAULT 'BLOCKED' CHECK (status IN ('BLOCKED', 'INVESTIGATING', 'RESOLVED')),
    action_taken TEXT NOT NULL DEFAULT 'IP automatically rate-limited and flagged by OWASP Sentinel',
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. GLOBAL INFRASTRUCTURE NODES
CREATE TABLE IF NOT EXISTS public.superadmin_infra_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_code VARCHAR(64) UNIQUE NOT NULL,
    node_name VARCHAR(128) NOT NULL,
    node_type VARCHAR(64) NOT NULL CHECK (node_type IN ('SuperAdmin Gateway', 'Cloudflare Edge', 'Snowflake Vault', 'AWS S3 Core', 'ZeroClaw Master', 'Supabase Postgres')),
    status VARCHAR(32) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'maintenance', 'degraded', 'offline')),
    latency_ms INT NOT NULL DEFAULT 12 CHECK (latency_ms >= 0),
    load_pct NUMERIC(5,2) NOT NULL DEFAULT 35.50 CHECK (load_pct BETWEEN 0 AND 100),
    region VARCHAR(64) NOT NULL DEFAULT 'Global Edge',
    icon_path TEXT DEFAULT '/assets/logo/cloudflare.svg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HIGH PERFORMANCE B-TREE INDEXES
CREATE INDEX IF NOT EXISTS idx_superadmin_tenant_category ON public.superadmin_tenant_registry(category, status);
CREATE INDEX IF NOT EXISTS idx_superadmin_threats_created ON public.superadmin_security_threat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_superadmin_threats_severity ON public.superadmin_security_threat_logs(severity);
CREATE INDEX IF NOT EXISTS idx_superadmin_nodes_status ON public.superadmin_infra_nodes(status);
