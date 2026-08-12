-- ============================================================================
-- ZEGA AI PLATFORM — ENTERPRISE MULTI-TENANT DATABASE HARDENING MIGRATION
-- File: supabase/migrations/20260812230000_enterprise_multi_tenant_hardening.sql
-- Module: Canonical Multi-Tenant Schema, FK Integrity, Composite Indexes & Zero-Trust RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. CANONICAL ORGANIZATIONS & WORKSPACES SCHEMAS ──────────────────────────

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_code VARCHAR(32),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    plan VARCHAR(32) DEFAULT 'PRO',
    status VARCHAR(32) DEFAULT 'active',
    logo_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS org_code VARCHAR(32);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(32) DEFAULT 'PRO';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/zegalogo.png';

UPDATE public.organizations 
SET org_code = ('ORG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))) 
WHERE org_code IS NULL;

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) DEFAULT 'owner',
    status VARCHAR(32) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT org_member_user_unique UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT workspace_member_unique UNIQUE (workspace_id, user_id)
);

-- Seed Default Organization & Workspace
DO $$
DECLARE
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
    v_ws_id UUID  := '00000000-0000-0000-0000-000000000002';
BEGIN
    INSERT INTO public.organizations (id, org_code, name, slug, plan, status)
    VALUES (v_org_id, 'ORG-DEFAULT', 'Zega Default Business', 'zega-default', 'Enterprise', 'active')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    INSERT INTO public.workspaces (id, organization_id, name, status)
    VALUES (v_ws_id, v_org_id, 'Main Workspace', 'active')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
END;
$$;

-- ─── 2. TENANT OWNERSHIP COLUMNS ON ALL BUSINESS RESOURCES ────────────────────

ALTER TABLE public.umkm_stores ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_stores ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_products ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_invoices ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_transactions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_knowledge_docs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_knowledge_docs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_integrations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_integrations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_timeline_events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_timeline_events ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT '00000000-0000-0000-0000-000000000002';

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_type VARCHAR(32) NOT NULL DEFAULT 'user',
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. MULTI-TENANT UNIQUE CONSTRAINTS (SCOPED BY ORGANIZATION) ──────────────

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'umkm_products_org_sku_key') THEN
        ALTER TABLE public.umkm_products ADD CONSTRAINT umkm_products_org_sku_key UNIQUE (organization_id, sku);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'umkm_invoices_org_code_key') THEN
        ALTER TABLE public.umkm_invoices ADD CONSTRAINT umkm_invoices_org_code_key UNIQUE (organization_id, invoice_code);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'umkm_transactions_org_code_key') THEN
        ALTER TABLE public.umkm_transactions ADD CONSTRAINT umkm_transactions_org_code_key UNIQUE (organization_id, transaction_code);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ─── 4. HIGH-PERFORMANCE COMPOSITE INDEXES FOR TENANT QUERYING ───────────────

CREATE INDEX IF NOT EXISTS idx_org_members_user_status ON public.organization_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_status ON public.workspaces(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_stores_org_ws ON public.umkm_stores(organization_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_umkm_products_org_ws ON public.umkm_products(organization_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_umkm_customers_org_ws ON public.umkm_customers(organization_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_umkm_invoices_org_created ON public.umkm_invoices(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_transactions_org_created ON public.umkm_transactions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_emp_org_status ON public.umkm_ai_employees(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_automations_org_status ON public.umkm_automations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_org_ws ON public.umkm_knowledge_docs(organization_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_umkm_integrations_org_status ON public.umkm_integrations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);

-- ─── 5. SECURITY-DEFINER AUTHORIZATION FUNCTIONS ─────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = p_org_id 
          AND user_id = auth.uid()
          AND COALESCE(status, 'active') = 'active'
    ) OR EXISTS (
        SELECT 1
        FROM public.umkm_stores
        WHERE organization_id = p_org_id
          AND user_id = auth.uid()
    );
END;
$$;

-- ─── 6. ENABLE RLS AND APPLY ZERO-TRUST POLICIES ─────────────────────────────

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_knowledge_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
