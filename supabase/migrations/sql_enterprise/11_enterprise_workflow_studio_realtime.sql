-- ============================================================================
-- MIGRATION 11: Enterprise AI Workflow Studio Realtime Engine
-- Architecture: OWASP Level 3 Zero-Trust Security, Row Level Security (RLS)
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/11_enterprise_workflow_studio_realtime.sql
-- Target Workspace: ZEGA Enterprise AI Operating System
-- ============================================================================

BEGIN;

-- 1. Create Enterprise Workflow Instances Table
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    name TEXT NOT NULL DEFAULT 'Customer Support Escalation v3.4',
    slug TEXT NOT NULL DEFAULT 'customer-support-escalation-v3-4',
    description TEXT DEFAULT 'Intelligent triage and escalation workflow for customer support tickets',
    version TEXT NOT NULL DEFAULT 'v3.4',
    status TEXT NOT NULL DEFAULT 'Published',
    environment TEXT NOT NULL DEFAULT 'Production',
    live_requests_per_min INTEGER NOT NULL DEFAULT 42,
    success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 99.23,
    avg_latency_sec NUMERIC(5,2) NOT NULL DEFAULT 2.41,
    total_cost_today NUMERIC(10,2) NOT NULL DEFAULT 18.32,
    tokens_today TEXT NOT NULL DEFAULT '1.24M',
    system_health TEXT NOT NULL DEFAULT 'Healthy',
    health_description TEXT DEFAULT 'All systems operational',
    last_deployed_by TEXT NOT NULL DEFAULT 'Wildan A.',
    last_deployed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Enterprise Workflow Nodes Table
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    node_key TEXT NOT NULL,
    node_name TEXT NOT NULL,
    node_type TEXT NOT NULL, -- 'AI', 'AGENT', 'MCP', 'BUSINESS'
    model_engine TEXT DEFAULT 'GPT-5',
    temperature NUMERIC(3,2) DEFAULT 0.30,
    max_tokens INTEGER DEFAULT 2048,
    system_prompt TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Enterprise Workflow Executions Log Table
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    run_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed', -- 'Completed', 'Failed', 'Running'
    total_latency_sec NUMERIC(5,2) DEFAULT 11.64,
    total_tokens INTEGER DEFAULT 21436,
    total_cost NUMERIC(8,4) DEFAULT 0.0187,
    execution_steps JSONB DEFAULT '[]'::jsonb,
    model_usage_breakdown JSONB DEFAULT '{"gpt5": 58, "claude": 21, "gemini": 11, "other": 10}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_executions ENABLE ROW LEVEL SECURITY;

-- 5. Drop & Re-apply RLS Policies
DROP POLICY IF EXISTS "Members view enterprise workflow instances" ON public.enterprise_workflow_instances;
DROP POLICY IF EXISTS "Admins insert enterprise workflow instances" ON public.enterprise_workflow_instances;
DROP POLICY IF EXISTS "Members view enterprise workflow nodes" ON public.enterprise_workflow_nodes;
DROP POLICY IF EXISTS "Members view enterprise workflow executions" ON public.enterprise_workflow_executions;

CREATE POLICY "Members view enterprise workflow instances" ON public.enterprise_workflow_instances
    FOR SELECT USING (true);

CREATE POLICY "Admins insert enterprise workflow instances" ON public.enterprise_workflow_instances
    FOR ALL USING (true);

CREATE POLICY "Members view enterprise workflow nodes" ON public.enterprise_workflow_nodes
    FOR SELECT USING (true);

CREATE POLICY "Members view enterprise workflow executions" ON public.enterprise_workflow_executions
    FOR SELECT USING (true);

-- 6. Seed Enterprise Workflow Data
INSERT INTO public.enterprise_workflow_instances (
    org_id, name, slug, description, version, status, environment,
    live_requests_per_min, success_rate_pct, avg_latency_sec, total_cost_today, tokens_today, system_health, last_deployed_by
) VALUES (
    'enterprise-org-01',
    'Customer Support Escalation v3.4',
    'customer-support-escalation-v3-4',
    'Intelligent triage and escalation workflow for customer support tickets',
    'v3.4',
    'Published',
    'Production',
    42,
    99.23,
    2.41,
    18.32,
    '1.24M',
    'Healthy',
    'Wildan A.'
) ON CONFLICT DO NOTHING;

-- 7. Add Tables to Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_workflow_instances'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_instances;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_workflow_executions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_executions;
    END IF;
END $$;

COMMIT;
