-- ============================================================================
-- ZEGA AI PLATFORM - PRODUCTION MULTI-TENANT DATA ISOLATION & RLS POLICIES
-- File: supabase/migrations/20260812220000_multi_tenant_organization_isolation.sql
-- Description:
-- Establishes canonical tenant hierarchy: User -> Organization -> Workspace -> Business Resources.
-- Adds organization_id, workspace_id, security definer functions, foreign keys,
-- unique multi-tenant constraints, indexes, and zero-trust RLS policies across all business tables.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Canonical Organizations Table (Tenant Isolation Boundary)
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

-- Ensure missing columns exist if public.organizations was created by earlier migrations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS org_code VARCHAR(32);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(32) DEFAULT 'PRO';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/zegalogo.png';

-- Backfill org_code for existing records if null
UPDATE public.organizations 
SET org_code = ('ORG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))) 
WHERE org_code IS NULL;

-- 2. Organization Memberships (User-to-Tenant RBAC Mapping)
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

-- 3. Workspaces (Sub-Tenant Scoping Boundary)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Seed Default Organization & Workspace for System / Legacy Stores
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

-- 5. Add organization_id & workspace_id to umkm_stores & Business Tables
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

-- Audit Logs Table
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

-- 6. Indexes for High-Performance Multi-Tenant Filtering
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_stores_org ON public.umkm_stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_products_org ON public.umkm_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_customers_org ON public.umkm_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_invoices_org ON public.umkm_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_transactions_org ON public.umkm_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_emp_org ON public.umkm_ai_employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_automations_org ON public.umkm_automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_org ON public.umkm_knowledge_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_umkm_integrations_org ON public.umkm_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);

-- 7. Helper Security-Definer Function: Check Organization Membership for Current User
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

-- 8. Enable RLS on Core Tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
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

-- 9. RLS Policies (Zero-Trust Tenant Isolation)
-- Drop legacy policies defensively
DROP POLICY IF EXISTS "Users can read own stores" ON public.umkm_stores;
DROP POLICY IF EXISTS "Users can update own stores" ON public.umkm_stores;
DROP POLICY IF EXISTS "Public stores access" ON public.umkm_stores;
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view stores" ON public.umkm_stores;
DROP POLICY IF EXISTS "Members can update stores" ON public.umkm_stores;
DROP POLICY IF EXISTS "Org members can select products" ON public.umkm_products;
DROP POLICY IF EXISTS "Org members can insert products" ON public.umkm_products;
DROP POLICY IF EXISTS "Org members can update products" ON public.umkm_products;
DROP POLICY IF EXISTS "Org members can delete products" ON public.umkm_products;
DROP POLICY IF EXISTS "Org members can select customers" ON public.umkm_customers;
DROP POLICY IF EXISTS "Org members can insert customers" ON public.umkm_customers;
DROP POLICY IF EXISTS "Org members can select invoices" ON public.umkm_invoices;
DROP POLICY IF EXISTS "Org members can insert invoices" ON public.umkm_invoices;
DROP POLICY IF EXISTS "Org members can select transactions" ON public.umkm_transactions;
DROP POLICY IF EXISTS "Org members can select ai_employees" ON public.umkm_ai_employees;
DROP POLICY IF EXISTS "Org members can select automations" ON public.umkm_automations;
DROP POLICY IF EXISTS "Org members can select knowledge_docs" ON public.umkm_knowledge_docs;
DROP POLICY IF EXISTS "Org members can select integrations" ON public.umkm_integrations;
DROP POLICY IF EXISTS "Org members can select timeline_events" ON public.umkm_timeline_events;
DROP POLICY IF EXISTS "Org members can select dashboard_kpis" ON public.umkm_dashboard_kpis;
DROP POLICY IF EXISTS "Org members can select audit_logs" ON public.audit_logs;

-- Organizations Policy
CREATE POLICY "Members can view their organization" ON public.organizations
    FOR SELECT USING (public.fn_is_org_member(id));

-- Organization Members Policy
CREATE POLICY "Members can view org members" ON public.organization_members
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Workspaces Policy
CREATE POLICY "Members can view workspaces" ON public.workspaces
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Stores Policy
CREATE POLICY "Members can view stores" ON public.umkm_stores
    FOR SELECT USING (public.fn_is_org_member(organization_id));
CREATE POLICY "Members can update stores" ON public.umkm_stores
    FOR UPDATE USING (public.fn_is_org_member(organization_id));

-- Products Policy
CREATE POLICY "Org members can select products" ON public.umkm_products
    FOR SELECT USING (public.fn_is_org_member(organization_id));
CREATE POLICY "Org members can insert products" ON public.umkm_products
    FOR INSERT WITH CHECK (public.fn_is_org_member(organization_id));
CREATE POLICY "Org members can update products" ON public.umkm_products
    FOR UPDATE USING (public.fn_is_org_member(organization_id));
CREATE POLICY "Org members can delete products" ON public.umkm_products
    FOR DELETE USING (public.fn_is_org_member(organization_id));

-- Customers Policy
CREATE POLICY "Org members can select customers" ON public.umkm_customers
    FOR SELECT USING (public.fn_is_org_member(organization_id));
CREATE POLICY "Org members can insert customers" ON public.umkm_customers
    FOR INSERT WITH CHECK (public.fn_is_org_member(organization_id));

-- Invoices Policy
CREATE POLICY "Org members can select invoices" ON public.umkm_invoices
    FOR SELECT USING (public.fn_is_org_member(organization_id));
CREATE POLICY "Org members can insert invoices" ON public.umkm_invoices
    FOR INSERT WITH CHECK (public.fn_is_org_member(organization_id));

-- Transactions Policy
CREATE POLICY "Org members can select transactions" ON public.umkm_transactions
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- AI Employees Policy
CREATE POLICY "Org members can select ai_employees" ON public.umkm_ai_employees
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Automations Policy
CREATE POLICY "Org members can select automations" ON public.umkm_automations
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Knowledge Base Docs Policy
CREATE POLICY "Org members can select knowledge_docs" ON public.umkm_knowledge_docs
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Integrations Policy
CREATE POLICY "Org members can select integrations" ON public.umkm_integrations
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Timeline Events Policy
CREATE POLICY "Org members can select timeline_events" ON public.umkm_timeline_events
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- KPI Dashboard Policy
CREATE POLICY "Org members can select dashboard_kpis" ON public.umkm_dashboard_kpis
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Audit Logs Policy
CREATE POLICY "Org members can select audit_logs" ON public.audit_logs
    FOR SELECT USING (public.fn_is_org_member(organization_id));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
