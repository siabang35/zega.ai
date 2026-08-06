-- ============================================================================
-- MIGRATION 12: Enterprise Workflow Studio - Global Internet Integrations Engine
-- Architecture: LangGraph / n8n / AutoGen / OpenAI Swarm & 25+ Global Connectors
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/12_enterprise_workflow_studio_global_integrations.sql
-- Target Workspace: ZEGA Enterprise AI Operating System
-- ============================================================================

BEGIN;

-- 1. Global Tool Connectors Registry Table (Ecosystem of 25+ Internet Tools)
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_tool_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connector_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'AI_LLM', 'Vector_DB', 'DevOps', 'CRM', 'Communication', 'Payments', 'Search_Web', 'Cloud'
    provider TEXT NOT NULL, -- 'OpenAI', 'Anthropic', 'Google', 'Meta', 'GitHub', 'Atlassian', 'Salesforce', 'Stripe'
    auth_mechanism TEXT NOT NULL DEFAULT 'OAuth2', -- 'OAuth2', 'API_Key', 'Bearer_Token', 'Webhook_Secret'
    cdn_icon_url TEXT NOT NULL,
    api_schema JSONB DEFAULT '{"spec_version": "2.0", "endpoints": []}'::jsonb,
    webhook_supported BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_min INTEGER NOT NULL DEFAULT 600,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enterprise Integrations Vault (Authenticated Credentials Store)
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_integrations_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    connector_key TEXT REFERENCES public.enterprise_workflow_tool_connectors(connector_key) ON DELETE CASCADE,
    integration_name TEXT NOT NULL,
    auth_payload_encrypted TEXT NOT NULL, -- OWASP Encrypted JSON payload
    scopes JSONB DEFAULT '[]'::jsonb,
    health_status TEXT NOT NULL DEFAULT 'Healthy',
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_org_connector UNIQUE (org_id, connector_key, integration_name)
);

-- 3. Enterprise Workflow Triggers Listener Table (Webhook & Event Streams)
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    trigger_key TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'Webhook', 'Cron_Schedule', 'Kafka_Stream', 'Event_Bridge', 'Polling'
    endpoint_url TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Active',
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_workflow_trigger UNIQUE (workflow_id, trigger_key)
);

-- 4. Enterprise Webhook Ingress Audit Logs Table
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_webhooks_ingress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES public.enterprise_workflow_triggers(id) ON DELETE SET NULL,
    headers JSONB DEFAULT '{}'::jsonb,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'Processed', -- 'Processed', 'Queued', 'Rejected'
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. LangGraph Persistent Checkpoints Table (State Graph Memory)
CREATE TABLE IF NOT EXISTS public.enterprise_workflow_langgraph_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.enterprise_workflow_instances(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT 'default',
    checkpoint_id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    channel_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_thread_checkpoint UNIQUE (workflow_id, thread_id, checkpoint_id)
);

-- 6. Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_vault_org ON public.enterprise_workflow_integrations_vault(org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_wf ON public.enterprise_workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_ingress_wf ON public.enterprise_workflow_webhooks_ingress(workflow_id);
CREATE INDEX IF NOT EXISTS idx_langgraph_checkpoints_thread ON public.enterprise_workflow_langgraph_checkpoints(workflow_id, thread_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_workflow_tool_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_integrations_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_webhooks_ingress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_workflow_langgraph_checkpoints ENABLE ROW LEVEL SECURITY;

-- 8. Create Permissive Security Policies
DROP POLICY IF EXISTS "Public view tool connectors" ON public.enterprise_workflow_tool_connectors;
DROP POLICY IF EXISTS "Members view integrations vault" ON public.enterprise_workflow_integrations_vault;
DROP POLICY IF EXISTS "Members view triggers" ON public.enterprise_workflow_triggers;
DROP POLICY IF EXISTS "Members view webhooks ingress" ON public.enterprise_workflow_webhooks_ingress;
DROP POLICY IF EXISTS "Members view langgraph checkpoints" ON public.enterprise_workflow_langgraph_checkpoints;

CREATE POLICY "Public view tool connectors" ON public.enterprise_workflow_tool_connectors FOR SELECT USING (true);
CREATE POLICY "Members view integrations vault" ON public.enterprise_workflow_integrations_vault FOR ALL USING (true);
CREATE POLICY "Members view triggers" ON public.enterprise_workflow_triggers FOR ALL USING (true);
CREATE POLICY "Members view webhooks ingress" ON public.enterprise_workflow_webhooks_ingress FOR ALL USING (true);
CREATE POLICY "Members view langgraph checkpoints" ON public.enterprise_workflow_langgraph_checkpoints FOR ALL USING (true);

-- 9. Seed 25+ Global Internet Tools into Connectors Registry
INSERT INTO public.enterprise_workflow_tool_connectors (connector_key, name, category, provider, auth_mechanism, cdn_icon_url) VALUES
('openai_gpt5', 'OpenAI GPT-5 / O3 API', 'AI_LLM', 'OpenAI', 'API_Key', '/assets/visualization/gpt.webp'),
('anthropic_claude', 'Anthropic Claude 3.5 Sonnet', 'AI_LLM', 'Anthropic', 'API_Key', '/assets/visualization/claude.webp'),
('google_gemini', 'Google Gemini 1.5 Pro API', 'AI_LLM', 'Google', 'API_Key', '/assets/logo/gemini.webp'),
('perplexity_search', 'Perplexity Online AI Search', 'Search_Web', 'Perplexity', 'API_Key', '/assets/logo/perplexity.png'),
('tavily_web_rag', 'Tavily Web RAG Connector', 'Search_Web', 'Tavily', 'API_Key', '/assets/logo/tavily.png'),
('qdrant_vector_db', 'Qdrant Vector DB Engine', 'Vector_DB', 'Qdrant', 'API_Key', '/assets/logo/qdrant.png'),
('pinecone_vector_db', 'Pinecone Vector Index', 'Vector_DB', 'Pinecone', 'API_Key', '/assets/logo/pinecone.png'),
('supabase_realtime_db', 'Supabase PostgreSQL Realtime', 'Vector_DB', 'Supabase', 'API_Key', '/assets/logo/supabase.png'),
('github_actions', 'GitHub API & Actions Webhook', 'DevOps', 'GitHub', 'OAuth2', '/assets/logo/github.png'),
('gitlab_ci', 'GitLab Webhooks & Pipelines', 'DevOps', 'GitLab', 'OAuth2', '/assets/logo/gitlab.png'),
('jira_cloud', 'Jira Service Management API', 'DevOps', 'Atlassian', 'OAuth2', '/assets/logo/jira.png'),
('aws_lambda_bedrock', 'AWS Lambda & Bedrock SDK', 'Cloud', 'Amazon Web Services', 'OAuth2', '/assets/logo/aws.png'),
('gcp_vertex_ai', 'GCP Vertex AI & Cloud Run', 'Cloud', 'Google Cloud', 'OAuth2', '/assets/logo/gcp.png'),
('slack_web_mcp', 'Slack Webhook & Realtime API', 'Communication', 'Slack', 'OAuth2', '/assets/visualization/slack.webp'),
('discord_bot_mcp', 'Discord Webhook & Bot Gateway', 'Communication', 'Discord', 'OAuth2', '/assets/logo/discord.png'),
('telegram_bot_mcp', 'Telegram Bot API Messenger', 'Communication', 'Telegram', 'API_Key', '/assets/logo/telegram.png'),
('whatsapp_business_mcp', 'WhatsApp Business Cloud API', 'Communication', 'Meta', 'Bearer_Token', '/assets/logo/whatsapp.png'),
('stripe_billing_mcp', 'Stripe Payments & Refunds API', 'Payments', 'Stripe', 'API_Key', '/assets/visualization/stripe.webp'),
('shopify_ecommerce_mcp', 'Shopify Admin API Connector', 'Payments', 'Shopify', 'OAuth2', '/assets/logo/shopify.png'),
('hubspot_crm_mcp', 'HubSpot CRM Lead Engine', 'CRM', 'HubSpot', 'OAuth2', '/assets/logo/hubspot.png'),
('salesforce_crm_mcp', 'Salesforce Enterprise REST API', 'CRM', 'Salesforce', 'OAuth2', '/assets/logo/salesforce.png'),
('zendesk_support_mcp', 'Zendesk Support Ticketing API', 'ITSM', 'Zendesk', 'OAuth2', '/assets/logo/zendesk.webp'),
('pagerduty_incident_mcp', 'PagerDuty Incident Escalation', 'ITSM', 'PagerDuty', 'OAuth2', '/assets/logo/pagerduty.webp'),
('notion_workspace_mcp', 'Notion Workspace API Sync', 'CRM', 'Notion', 'OAuth2', '/assets/logo/notion.png'),
('datadog_observability', 'Datadog Metrics & Telemetry', 'DevOps', 'Datadog', 'API_Key', '/assets/logo/datadog.png')
ON CONFLICT (connector_key) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    provider = EXCLUDED.provider,
    cdn_icon_url = EXCLUDED.cdn_icon_url;

-- 10. Enable Supabase Realtime Publication for Webhook & Triggers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_workflow_webhooks_ingress'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_webhooks_ingress;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_workflow_triggers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_triggers;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_workflow_langgraph_checkpoints'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_workflow_langgraph_checkpoints;
    END IF;
END $$;

COMMIT;
