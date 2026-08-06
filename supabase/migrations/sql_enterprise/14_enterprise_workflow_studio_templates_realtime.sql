-- ============================================================================
-- MIGRATION 14: Enterprise Workflow Studio Realtime Templates & Catalog Persistence
-- Target Workspace: ZEGA Enterprise AI Operating System
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/14_enterprise_workflow_studio_templates_realtime.sql
-- ============================================================================

BEGIN;

-- 1. Create enterprise_workflow_templates table
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Customer Support',
    description TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT 'v1.0',
    engine_type TEXT NOT NULL DEFAULT 'LangGraph_Swarm',
    difficulty TEXT NOT NULL DEFAULT 'Enterprise',
    est_execution_sec NUMERIC(5,2) NOT NULL DEFAULT 2.40,
    icon_url TEXT DEFAULT '/assets/logo/zegalogo.png',
    tags JSONB DEFAULT '["langgraph", "swarm", "owasp-level3"]'::jsonb,
    mcp_tools JSONB DEFAULT '["Slack MCP", "Zendesk MCP", "Supabase DB"]'::jsonb,
    nodes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_featured BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexing for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.enterprise_workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_engine ON public.enterprise_workflow_templates(engine_type);

-- 3. Row Level Security (RLS)
ALTER TABLE public.enterprise_workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to enterprise_workflow_templates"
    ON public.enterprise_workflow_templates FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated service access to enterprise_workflow_templates"
    ON public.enterprise_workflow_templates FOR ALL
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Enable Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'enterprise_workflow_templates'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_templates;
    END IF;
END $$;

-- 5. Seed Realtime Enterprise Templates
INSERT INTO public.enterprise_workflow_templates (
    template_key, name, category, description, version, engine_type, difficulty, est_execution_sec, icon_url, tags, mcp_tools, is_featured, nodes_json, edges_json
) VALUES 
(
    'tpl_customer_support_v3_4',
    'Customer Support Escalation v3.4',
    'Customer Support',
    'Intelligent triage and escalation workflow for customer support tickets using LangGraph state graph memory',
    'v3.4',
    'LangGraph_Swarm',
    'Enterprise',
    2.41,
    'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    '["langgraph", "support", "slack-mcp", "zendesk"]'::jsonb,
    '["Slack MCP", "Zendesk MCP", "Supabase Realtime"]'::jsonb,
    true,
    '[
        {"id": "node_webhook", "name": "New Ticket Webhook", "type": "Webhook Trigger", "category": "Trigger", "position_x": 50, "position_y": 180},
        {"id": "node_planner", "name": "AI Planner (GPT-5)", "type": "AI Planner", "category": "AI", "position_x": 220, "position_y": 180, "model": "GPT-5", "temperature": 0.3},
        {"id": "node_intent", "name": "Classify Intent", "type": "Decision Router", "category": "AI", "position_x": 420, "position_y": 180},
        {"id": "node_agent_support", "name": "Support Agent", "type": "Agent Swarm", "category": "Agent", "position_x": 620, "position_y": 80},
        {"id": "node_agent_escalation", "name": "Escalation Agent", "type": "Agent Swarm", "category": "Agent", "position_x": 620, "position_y": 200},
        {"id": "node_agent_refund", "name": "Refund Agent", "type": "Agent Swarm", "category": "Agent", "position_x": 620, "position_y": 320},
        {"id": "node_slack_mcp", "name": "Slack MCP Connector", "type": "MCP Tool", "category": "MCP", "position_x": 820, "position_y": 80},
        {"id": "node_approval", "name": "Human Approval Gate", "type": "Human Approval", "category": "Human", "position_x": 820, "position_y": 200},
        {"id": "node_stripe_mcp", "name": "Stripe MCP Refund", "type": "MCP Tool", "category": "MCP", "position_x": 980, "position_y": 200}
    ]'::jsonb,
    '[
        {"source": "node_webhook", "target": "node_planner"},
        {"source": "node_planner", "target": "node_intent"},
        {"source": "node_intent", "target": "node_agent_support", "label": "Standard Ticket"},
        {"source": "node_intent", "target": "node_agent_escalation", "label": "Complex Case"},
        {"source": "node_intent", "target": "node_agent_refund", "label": "Payment Dispute"},
        {"source": "node_agent_support", "target": "node_slack_mcp"},
        {"source": "node_agent_escalation", "target": "node_approval"},
        {"source": "node_approval", "target": "node_stripe_mcp"}
    ]'::jsonb
),
(
    'tpl_sales_lead_v2_1',
    'Autonomous Sales Lead Enrichment v2.1',
    'Sales & CRM',
    'End-to-end CRM synchronization and cold lead qualification swarm powered by AutoGen GroupChat consensus',
    'v2.1',
    'AutoGen_GroupChat',
    'Advanced',
    1.85,
    'https://cdn.zegaai.site/assets/visualization/slack.webp',
    '["autogen", "crm", "hubspot", "perplexity-rag"]'::jsonb,
    '["HubSpot CRM", "Stripe Payments", "Perplexity RAG"]'::jsonb,
    true,
    '[
        {"id": "node_lead_inbound", "name": "Inbound Lead Webhook", "type": "Webhook Trigger", "category": "Trigger", "position_x": 50, "position_y": 180},
        {"id": "node_rag_enrich", "name": "Perplexity RAG Search", "type": "Vector Search", "category": "AI", "position_x": 240, "position_y": 180},
        {"id": "node_autogen_group", "name": "AutoGen Lead Consensus", "type": "GroupChat Swarm", "category": "Agent", "position_x": 460, "position_y": 180},
        {"id": "node_hubspot_mcp", "name": "HubSpot CRM Sync", "type": "MCP Tool", "category": "MCP", "position_x": 680, "position_y": 180}
    ]'::jsonb,
    '[
        {"source": "node_lead_inbound", "target": "node_rag_enrich"},
        {"source": "node_rag_enrich", "target": "node_autogen_group"},
        {"source": "node_autogen_group", "target": "node_hubspot_mcp"}
    ]'::jsonb
),
(
    'tpl_financial_reconciliation_v1_8',
    'Financial Reconciliation Pipeline v1.8',
    'Financial Audit',
    'Real-time accounting ledger verification, anomaly detection, and automated fraud prevention DAG',
    'v1.8',
    'n8n_DAG',
    'Enterprise',
    0.95,
    'https://cdn.zegaai.site/assets/visualization/stripe.webp',
    '["n8n", "fraud-guard", "stripe", "supabase"]'::jsonb,
    '["Stripe Billing", "Supabase DB", "Qdrant Vector"]'::jsonb,
    true,
    '[
        {"id": "node_cron_trigger", "name": "Midnight Ledger Cron", "type": "Schedule Trigger", "category": "Trigger", "position_x": 50, "position_y": 180},
        {"id": "node_stripe_fetch", "name": "Fetch Stripe Invoices", "type": "MCP Connector", "category": "MCP", "position_x": 240, "position_y": 180},
        {"id": "node_fraud_eval", "name": "Zero-Trust Fraud Evaluator", "type": "AI Reasoner", "category": "AI", "position_x": 460, "position_y": 180},
        {"id": "node_db_commit", "name": "Commit Ledger to Supabase", "type": "Database Sink", "category": "Database", "position_x": 680, "position_y": 180}
    ]'::jsonb,
    '[
        {"source": "node_cron_trigger", "target": "node_stripe_fetch"},
        {"source": "node_stripe_fetch", "target": "node_fraud_eval"},
        {"source": "node_fraud_eval", "target": "node_db_commit"}
    ]'::jsonb
),
(
    'tpl_devops_incident_v4_0',
    'DevOps Incident Escalation v4.0',
    'DevOps & Infra',
    'Autonomous P0/P1 infrastructure triage, log analysis, and PagerDuty routing swarm with zero latency SLA',
    'v4.0',
    'LangGraph_Swarm',
    'Enterprise',
    0.65,
    'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    '["pagerduty", "github-actions", "datadog", "zeroclaw"]'::jsonb,
    '["PagerDuty MCP", "GitHub Actions", "Datadog Telemetry"]'::jsonb,
    true,
    '[
        {"id": "node_datadog_alert", "name": "Datadog Telemetry Alert", "type": "Webhook Trigger", "category": "Trigger", "position_x": 50, "position_y": 180},
        {"id": "node_log_parser", "name": "Log Parser Agent", "type": "AI LLM", "category": "AI", "position_x": 240, "position_y": 180},
        {"id": "node_pagerduty_mcp", "name": "PagerDuty P0 Dispatch", "type": "MCP Tool", "category": "MCP", "position_x": 460, "position_y": 180},
        {"id": "node_github_action", "name": "Auto-Rollback Release", "type": "CI/CD Action", "category": "DevOps", "position_x": 680, "position_y": 180}
    ]'::jsonb,
    '[
        {"source": "node_datadog_alert", "target": "node_log_parser"},
        {"source": "node_log_parser", "target": "node_pagerduty_mcp"},
        {"source": "node_pagerduty_mcp", "target": "node_github_action"}
    ]'::jsonb
)
ON CONFLICT (template_key) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    engine_type = EXCLUDED.engine_type,
    difficulty = EXCLUDED.difficulty,
    est_execution_sec = EXCLUDED.est_execution_sec,
    icon_url = EXCLUDED.icon_url,
    tags = EXCLUDED.tags,
    mcp_tools = EXCLUDED.mcp_tools,
    nodes_json = EXCLUDED.nodes_json,
    edges_json = EXCLUDED.edges_json;

COMMIT;
