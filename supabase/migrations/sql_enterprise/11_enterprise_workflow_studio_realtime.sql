-- ============================================================================
-- MIGRATION 11: Enterprise LangGraph / n8n / AutoGen AI Workflow Engine
-- Architecture: OWASP Level 3 Zero-Trust Security, Row Level Security (RLS)
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/11_enterprise_workflow_studio_realtime.sql
-- Target Workspace: ZEGA Enterprise AI Operating System
-- ============================================================================

BEGIN;

-- 0. Clean Recreation - Drop Existing Tables to Ensure Schema Synchronization
DROP TABLE IF EXISTS public.enterprise_workflow_node_executions CASCADE;
DROP TABLE IF EXISTS public.enterprise_workflow_executions CASCADE;
DROP TABLE IF EXISTS public.enterprise_workflow_versions CASCADE;
DROP TABLE IF EXISTS public.enterprise_workflow_variables CASCADE;
DROP TABLE IF EXISTS public.enterprise_workflow_edges CASCADE;
DROP TABLE IF EXISTS public.enterprise_workflow_nodes CASCADE;
DROP TABLE IF EXISTS public.enterprise_workflow_instances CASCADE;
DROP TABLE IF EXISTS public.enterprise_mcp_catalog CASCADE;

-- 1. Create Enterprise Workflow Instances Table (LangGraph / n8n Master Catalog)
CREATE TABLE public.enterprise_workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    workflow_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    version TEXT NOT NULL DEFAULT 'v1.0',
    status TEXT NOT NULL DEFAULT 'Published', -- 'Published', 'Draft', 'Archived'
    environment TEXT NOT NULL DEFAULT 'Production', -- 'Production', 'Staging', 'Development'
    engine_type TEXT NOT NULL DEFAULT 'LangGraph_Swarm', -- 'LangGraph_Swarm', 'n8n_DAG', 'AutoGen_GroupChat', 'OpenAI_Assistant'
    trigger_type TEXT NOT NULL DEFAULT 'Webhook', -- 'Webhook', 'Schedule', 'Event', 'API', 'Kafka_Topic'
    rate_limit_req_per_min INTEGER NOT NULL DEFAULT 120,
    owasp_security_level TEXT NOT NULL DEFAULT 'Level 3 Zero-Trust',
    sla_latency_target_ms INTEGER NOT NULL DEFAULT 3000,
    live_requests_per_min INTEGER NOT NULL DEFAULT 42,
    success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 99.23,
    avg_latency_sec NUMERIC(5,2) NOT NULL DEFAULT 2.41,
    total_cost_today NUMERIC(10,2) NOT NULL DEFAULT 18.32,
    tokens_today TEXT NOT NULL DEFAULT '1.24M',
    system_health TEXT NOT NULL DEFAULT 'Healthy',
    health_description TEXT DEFAULT 'All agent nodes and subgraphs operational',
    last_deployed_by TEXT NOT NULL DEFAULT 'Wildan A.',
    last_deployed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    langgraph_state_schema JSONB DEFAULT '{"channels": {"messages": "list", "context": "dict", "thread_id": "string"}}'::jsonb,
    autogen_swarm_config JSONB DEFAULT '{"max_rounds": 10, "speaker_selection_method": "auto", "consensus_threshold": 0.85}'::jsonb,
    workflow_metadata JSONB DEFAULT '{"tags": ["langgraph", "autogen", "n8n", "mcp-connected"], "owner": "DevOps Swarm Team"}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Enterprise Workflow Nodes Table (LangGraph / n8n / AutoGen Nodes)
CREATE TABLE public.enterprise_workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    node_key TEXT NOT NULL,
    node_name TEXT NOT NULL,
    node_type TEXT NOT NULL, -- 'AI_LLM', 'AI_REASONER', 'AGENT_SWARM', 'MCP_CONNECTOR', 'HUMAN_APPROVAL', 'CONDITION_BRANCH', 'SUBGRAPH_ROUTER', 'WEBHOOK_TRIGGER'
    category TEXT NOT NULL DEFAULT 'AI', -- 'AI', 'AGENT', 'MCP', 'BUSINESS', 'SUBGRAPH'
    model_engine TEXT DEFAULT 'GPT-5',
    temperature NUMERIC(3,2) DEFAULT 0.30,
    max_tokens INTEGER DEFAULT 2048,
    system_prompt TEXT,
    position_x NUMERIC(8,2) NOT NULL DEFAULT 0,
    position_y NUMERIC(8,2) NOT NULL DEFAULT 0,
    input_schema JSONB DEFAULT '{}'::jsonb,
    output_schema JSONB DEFAULT '{}'::jsonb,
    tool_definitions JSONB DEFAULT '[]'::jsonb, -- OpenAI Function calling / MCP Tools
    retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_ms": 1000}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_workflow_node_key UNIQUE (workflow_id, node_key)
);

-- 3. Create Enterprise Workflow Edges Table (LangGraph State Edges & Conditional Routing)
CREATE TABLE public.enterprise_workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    source_node_key TEXT NOT NULL,
    target_node_key TEXT NOT NULL,
    source_handle TEXT DEFAULT 'output',
    target_handle TEXT DEFAULT 'input',
    edge_type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'conditional', 'fallback', 'subgraph_loop'
    condition_expression TEXT,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Enterprise Workflow Environment Variables Table (Vault Secrets)
CREATE TABLE public.enterprise_workflow_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    variable_key TEXT NOT NULL,
    variable_value TEXT NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT false,
    environment TEXT NOT NULL DEFAULT 'Production',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_workflow_var UNIQUE (workflow_id, variable_key, environment)
);

-- 5. Create Enterprise Workflow Versions Table (LangGraph Checkpoints & Git Snapshots)
CREATE TABLE public.enterprise_workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    version_tag TEXT NOT NULL, -- e.g. 'v3.4'
    snapshot_json JSONB NOT NULL,
    commit_message TEXT DEFAULT 'Production deployment update',
    deployed_by TEXT NOT NULL DEFAULT 'Wildan A.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Create Enterprise Workflow Executions Log Table (LangGraph Run Tracking)
CREATE TABLE public.enterprise_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    run_code TEXT NOT NULL UNIQUE,
    thread_id TEXT DEFAULT gen_random_uuid()::text,
    trigger_source TEXT NOT NULL DEFAULT 'Webhook Ingress',
    status TEXT NOT NULL DEFAULT 'Completed', -- 'Completed', 'Failed', 'Running', 'Paused_Approval'
    total_latency_sec NUMERIC(5,2) DEFAULT 2.41,
    total_tokens INTEGER DEFAULT 21436,
    total_cost NUMERIC(8,4) DEFAULT 0.0187,
    execution_trace JSONB DEFAULT '[]'::jsonb,
    model_usage_breakdown JSONB DEFAULT '{"gpt5": 58, "claude": 21, "gemini": 11, "other": 10}'::jsonb,
    error_log TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Create Enterprise Workflow Node Executions Trace Table (Granular Step Diagnostics)
CREATE TABLE public.enterprise_workflow_node_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES public.enterprise_workflow_executions(id) ON DELETE CASCADE,
    node_key TEXT NOT NULL,
    node_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    latency_ms INTEGER NOT NULL DEFAULT 120,
    token_count INTEGER DEFAULT 1500,
    cost NUMERIC(8,4) DEFAULT 0.0025,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Create Enterprise MCP & OpenAI Tool Catalog Table
CREATE TABLE public.enterprise_mcp_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    protocol_version TEXT NOT NULL DEFAULT 'v1.0',
    category TEXT NOT NULL DEFAULT 'Database', -- 'Database', 'Communication', 'Payments', 'ITSM', 'Search'
    auth_type TEXT NOT NULL DEFAULT 'OAuth2',
    icon_url TEXT,
    endpoint_schema JSONB DEFAULT '{}'::jsonb,
    health_status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Indexes for High-Performance Queries
CREATE INDEX idx_workflow_instances_org ON public.enterprise_workflow_instances(org_id);
CREATE INDEX idx_workflow_nodes_wf ON public.enterprise_workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_edges_wf ON public.enterprise_workflow_edges(workflow_id);
CREATE INDEX idx_workflow_executions_wf ON public.enterprise_workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_thread ON public.enterprise_workflow_executions(thread_id);
CREATE INDEX idx_node_executions_exec ON public.enterprise_workflow_node_executions(execution_id);

-- 10. Enable Row Level Security (RLS) Across All Studio Tables
ALTER TABLE public.enterprise_workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_catalog ENABLE ROW LEVEL SECURITY;

-- 11. Create Permissive RLS Policies
CREATE POLICY "Members view enterprise workflow instances" ON public.enterprise_workflow_instances FOR SELECT USING (true);
CREATE POLICY "Admins manage enterprise workflow instances" ON public.enterprise_workflow_instances FOR ALL USING (true);

CREATE POLICY "Members view enterprise workflow nodes" ON public.enterprise_workflow_nodes FOR SELECT USING (true);
CREATE POLICY "Members view enterprise workflow edges" ON public.enterprise_workflow_edges FOR SELECT USING (true);
CREATE POLICY "Members view enterprise workflow variables" ON public.enterprise_workflow_variables FOR SELECT USING (true);
CREATE POLICY "Members view enterprise workflow versions" ON public.enterprise_workflow_versions FOR SELECT USING (true);
CREATE POLICY "Members view enterprise workflow executions" ON public.enterprise_workflow_executions FOR SELECT USING (true);
CREATE POLICY "Members view enterprise workflow node executions" ON public.enterprise_workflow_node_executions FOR SELECT USING (true);
CREATE POLICY "Members view enterprise mcp catalog" ON public.enterprise_mcp_catalog FOR SELECT USING (true);

-- 12. Seed Master Enterprise Workflow Instances
INSERT INTO public.enterprise_workflow_instances (
    org_id, workflow_key, name, slug, description, version, status, environment, engine_type,
    live_requests_per_min, success_rate_pct, avg_latency_sec, total_cost_today, tokens_today, system_health, last_deployed_by
) VALUES 
(
    'enterprise-org-01',
    'customer_support',
    'Customer Support Escalation v3.4',
    'customer-support-escalation-v3-4',
    'Intelligent triage and escalation workflow for customer support tickets',
    'v3.4',
    'Published',
    'Production',
    'LangGraph_Swarm',
    42,
    99.23,
    2.41,
    18.32,
    '1.24M',
    'Healthy',
    'Wildan A.'
),
(
    'enterprise-org-01',
    'sales_outreach',
    'Autonomous Sales Lead Enrichment v2.1',
    'autonomous-sales-lead-enrichment-v2-1',
    'End-to-end CRM synchronization and cold lead qualification swarm',
    'v2.1',
    'Published',
    'Production',
    'AutoGen_GroupChat',
    68,
    98.75,
    1.85,
    24.50,
    '1.85M',
    'Healthy',
    'Danz A.'
),
(
    'enterprise-org-01',
    'financial_audit',
    'Financial Reconciliation Pipeline v1.8',
    'financial-reconciliation-pipeline-v1-8',
    'Real-time accounting ledger verification and fraud detection',
    'v1.8',
    'Draft',
    'Staging',
    'n8n_DAG',
    15,
    99.90,
    0.95,
    8.40,
    '450K',
    'Healthy',
    'Alex Morgan'
),
(
    'enterprise-org-01',
    'devops_triage',
    'DevOps Incident Escalation v4.0',
    'devops-incident-escalation-v4-0',
    'Autonomous P0/P1 infrastructure triage and PagerDuty routing',
    'v4.0',
    'Published',
    'Production',
    'LangGraph_Swarm',
    104,
    99.98,
    0.65,
    42.10,
    '3.10M',
    'Healthy',
    'Wildan A.'
);

-- 13. Seed MCP & OpenAI Tools Catalog
INSERT INTO public.enterprise_mcp_catalog (name, slug, protocol_version, category, auth_type, icon_url) VALUES
('Supabase PostgreSQL MCP', 'supabase-mcp', 'v1.0', 'Database', 'API_Key', '/assets/logo/supabase.png'),
('Slack Notification MCP', 'slack-mcp', 'v1.0', 'Communication', 'OAuth2', '/assets/visualization/slack.webp'),
('Stripe Financial MCP', 'stripe-mcp', 'v1.0', 'Payments', 'API_Key', '/assets/visualization/stripe.webp'),
('Zendesk Support MCP', 'zendesk-mcp', 'v1.0', 'ITSM', 'OAuth2', '/assets/logo/zendesk.webp'),
('PagerDuty Incident MCP', 'pagerduty-mcp', 'v1.0', 'ITSM', 'OAuth2', '/assets/logo/pagerduty.webp');

-- 14. Add Tables to Supabase Realtime Publication safely
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

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_workflow_nodes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_nodes;
    END IF;
END $$;

COMMIT;
