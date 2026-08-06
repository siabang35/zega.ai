-- ============================================================================
-- MIGRATION 17: Enterprise MCP Hub Real-time, CDN & Sub-page Configuration
-- Complete schema for MCP servers, tools, activities, metrics, permissions, audit logs, and configs
-- ============================================================================

-- 1. Table for MCP Servers
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_servers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Connected',
  latency_ms INT NOT NULL DEFAULT 120,
  tools_count INT NOT NULL DEFAULT 50,
  tools_str VARCHAR(64) NOT NULL DEFAULT '50 Tools',
  version VARCHAR(32) NOT NULL DEFAULT 'v2.1.0',
  last_synced_str VARCHAR(64) NOT NULL DEFAULT 'Just now',
  server_url VARCHAR(256) NOT NULL,
  protocol VARCHAR(32) NOT NULL DEFAULT 'SSE',
  auth_type VARCHAR(64) NOT NULL DEFAULT 'OAuth 2.0',
  api_version VARCHAR(32) NOT NULL DEFAULT '2024-04-10',
  rate_limit_str VARCHAR(64) NOT NULL DEFAULT '1,000 req/min',
  owner_name VARCHAR(128) NOT NULL DEFAULT 'DevOps Team',
  logo_url TEXT,
  description TEXT,
  health_pct NUMERIC(5,2) DEFAULT 99.98,
  uptime_pct NUMERIC(5,2) DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for MCP Server Tools Matrix
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(64) NOT NULL REFERENCES public.enterprise_mcp_servers(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  tag VARCHAR(64) NOT NULL DEFAULT 'General',
  schema_endpoint VARCHAR(256),
  calls_count INT DEFAULT 0,
  status VARCHAR(32) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure column exists if table pre-existed
ALTER TABLE public.enterprise_mcp_tools ADD COLUMN IF NOT EXISTS schema_endpoint VARCHAR(256);

-- 3. Table for MCP Activity Audit Stream
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_name VARCHAR(128) NOT NULL,
  logo_url TEXT,
  action_text TEXT NOT NULL,
  time_ago VARCHAR(64) NOT NULL DEFAULT 'Just now',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table for MCP Telemetry & KPI Metrics
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_servers INT NOT NULL DEFAULT 24,
  available_tools INT NOT NULL DEFAULT 312,
  total_calls_7d VARCHAR(32) NOT NULL DEFAULT '1.24M',
  avg_latency_ms INT NOT NULL DEFAULT 132,
  success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 99.74,
  active_connections INT NOT NULL DEFAULT 98,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table for MCP Server Role Access Control (Permissions Sub-page)
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(64) NOT NULL REFERENCES public.enterprise_mcp_servers(id) ON DELETE CASCADE,
  role_name VARCHAR(128) NOT NULL,
  access_level VARCHAR(64) NOT NULL DEFAULT 'Execute Only',
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table for MCP Server Execution Logs (Logs Sub-page)
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(64) NOT NULL REFERENCES public.enterprise_mcp_servers(id) ON DELETE CASCADE,
  tool_name VARCHAR(128) NOT NULL,
  status_code INT NOT NULL DEFAULT 200,
  response_time_ms INT NOT NULL DEFAULT 120,
  payload_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table for MCP Server Environment Configurations (Settings Sub-page)
CREATE TABLE IF NOT EXISTS public.enterprise_mcp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(64) NOT NULL REFERENCES public.enterprise_mcp_servers(id) ON DELETE CASCADE,
  config_key VARCHAR(128) NOT NULL,
  config_value TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time Publication Registration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_servers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_tools;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_activities;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_metrics;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_permissions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_mcp_configs;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_configs ENABLE ROW LEVEL SECURITY;

-- Security RLS Policies (Idempotent with DROP POLICY IF EXISTS)
DROP POLICY IF EXISTS "Public Read MCP Servers" ON public.enterprise_mcp_servers;
DROP POLICY IF EXISTS "Service Role Full MCP Servers" ON public.enterprise_mcp_servers;
CREATE POLICY "Public Read MCP Servers" ON public.enterprise_mcp_servers FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Servers" ON public.enterprise_mcp_servers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read MCP Tools" ON public.enterprise_mcp_tools;
DROP POLICY IF EXISTS "Service Role Full MCP Tools" ON public.enterprise_mcp_tools;
CREATE POLICY "Public Read MCP Tools" ON public.enterprise_mcp_tools FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Tools" ON public.enterprise_mcp_tools FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read MCP Activities" ON public.enterprise_mcp_activities;
DROP POLICY IF EXISTS "Service Role Full MCP Activities" ON public.enterprise_mcp_activities;
CREATE POLICY "Public Read MCP Activities" ON public.enterprise_mcp_activities FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Activities" ON public.enterprise_mcp_activities FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read MCP Metrics" ON public.enterprise_mcp_metrics;
DROP POLICY IF EXISTS "Service Role Full MCP Metrics" ON public.enterprise_mcp_metrics;
CREATE POLICY "Public Read MCP Metrics" ON public.enterprise_mcp_metrics FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Metrics" ON public.enterprise_mcp_metrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read MCP Permissions" ON public.enterprise_mcp_permissions;
DROP POLICY IF EXISTS "Service Role Full MCP Permissions" ON public.enterprise_mcp_permissions;
CREATE POLICY "Public Read MCP Permissions" ON public.enterprise_mcp_permissions FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Permissions" ON public.enterprise_mcp_permissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read MCP Logs" ON public.enterprise_mcp_logs;
DROP POLICY IF EXISTS "Service Role Full MCP Logs" ON public.enterprise_mcp_logs;
CREATE POLICY "Public Read MCP Logs" ON public.enterprise_mcp_logs FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Logs" ON public.enterprise_mcp_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public Read MCP Configs" ON public.enterprise_mcp_configs;
DROP POLICY IF EXISTS "Service Role Full MCP Configs" ON public.enterprise_mcp_configs;
CREATE POLICY "Public Read MCP Configs" ON public.enterprise_mcp_configs FOR SELECT USING (true);
CREATE POLICY "Service Role Full MCP Configs" ON public.enterprise_mcp_configs FOR ALL USING (true);

-- Seed Data: MCP Servers
INSERT INTO public.enterprise_mcp_servers (id, name, category, status, latency_ms, tools_count, tools_str, version, last_synced_str, server_url, protocol, auth_type, api_version, rate_limit_str, owner_name, logo_url, description)
VALUES
  ('stripe', 'Stripe MCP', 'Payments', 'Connected', 132, 183, '183 Tools', 'v2.1.0', '2m ago', 'https://mcp.stripe.com', 'SSE', 'OAuth 2.0', '2024-04-10', '1,000 req/min', 'Finance Team', '/assets/visualization/stripe.webp', 'Connect to Stripe for payments, subscriptions, customers, invoices, refunds and more.'),
  ('supabase', 'Supabase MCP', 'Database', 'Connected', 96, 98, '98 Tools', 'v1.4.2', '5m ago', 'https://mcp.supabase.com', 'SSE', 'API Key', 'v1', '2,500 req/min', 'Backend Team', '/assets/logo/supabase.png', 'Interact directly with PostgreSQL tables, SQL queries, vector embeddings, and storage buckets.'),
  ('slack', 'Slack MCP', 'Communication', 'Connected', 121, 92, '92 Tools', 'v3.0.1', '8m ago', 'https://mcp.slack.com', 'WebSocket', 'OAuth 2.0', 'v2', '500 req/min', 'Operations Team', '/assets/visualization/slack.webp', 'Post messages, trigger channel alerts, manage user permissions, and listen to events in real time.'),
  ('github', 'GitHub MCP', 'DevOps', 'Connected', 110, 132, '132 Tools', 'v2.8.0', '15m ago', 'https://mcp.github.com', 'SSE', 'Personal Token', '2022-11-28', '5,000 req/min', 'DevOps Team', '/assets/logo/github.svg', 'Automate PR code reviews, issue tracking, GitHub Actions triggers, and repository management.'),
  ('gdrive', 'Google Drive MCP', 'Storage', 'Connected', 145, 63, '63 Tools', 'v1.2.0', '22m ago', 'https://mcp.google.com/drive', 'REST', 'OAuth 2.0', 'v3', '1,200 req/min', 'IT Administration', '/assets/logo/google_drive.png', 'Access cloud files, search documents, sync folders, and manage team permissions.'),
  ('notion', 'Notion MCP', 'Productivity', 'Connected', 128, 78, '78 Tools', 'v2.0.4', '18m ago', 'https://mcp.notion.so', 'REST', 'Integration Token', '2022-06-08', '800 req/min', 'Product Team', '/assets/logo/notion.png', 'Read and update workspace docs, databases, tasks, and company wiki pages.'),
  ('jira', 'Jira MCP', 'Project Mgmt', 'Connected', 156, 59, '59 Tools', 'v4.1.0', '12m ago', 'https://mcp.atlassian.com/jira', 'REST', 'OAuth 2.0', 'v3', '1,500 req/min', 'Agile PM Team', '/assets/logo/Jira.webp', 'Manage sprint backlogs, track software bugs, generate Jira tickets, and update issue statuses.'),
  ('hubspot', 'HubSpot MCP', 'CRM', 'Connected', 140, 70, '70 Tools', 'v1.9.0', '30m ago', 'https://mcp.hubspot.com', 'REST', 'Private App Token', 'v3', '1,000 req/min', 'Sales & Marketing', '/assets/logo/hubspot.png', 'Sync CRM deals, manage customer leads, automate email campaigns, and track contact pipelines.')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  latency_ms = EXCLUDED.latency_ms,
  tools_count = EXCLUDED.tools_count,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- Seed Tools for Stripe
INSERT INTO public.enterprise_mcp_tools (server_id, name, description, tag, schema_endpoint, calls_count)
VALUES
  ('stripe', 'Create Payment Intent', 'Create a new payment intent for processing customer checkout', 'Payments', 'POST /v1/payment_intents', 14250),
  ('stripe', 'Retrieve Customer', 'Retrieve customer profile details and payment methods', 'Customers', 'GET /v1/customers/:id', 9840),
  ('stripe', 'Create Invoice', 'Create and send automated invoice to client email', 'Invoices', 'POST /v1/invoices', 7120),
  ('stripe', 'Process Refund', 'Process full or partial refund to customer card', 'Refunds', 'POST /v1/refunds', 3450),
  ('stripe', 'List Subscriptions', 'List all recurring customer subscriptions and renewal status', 'Subscriptions', 'GET /v1/subscriptions', 11200)
ON CONFLICT DO NOTHING;

-- Seed Activity Feed
INSERT INTO public.enterprise_mcp_activities (server_name, logo_url, action_text, time_ago)
VALUES
  ('Stripe MCP', '/assets/visualization/stripe.webp', 'Payment intent created ($1,450.00 USD)', '2m ago'),
  ('Supabase MCP', '/assets/logo/supabase.png', 'Vector search query executed (12ms)', '5m ago'),
  ('Slack MCP', '/assets/visualization/slack.webp', 'Incident notification posted to #dev-alerts', '8m ago'),
  ('Jira MCP', '/assets/logo/Jira.webp', 'Sprint ticket ZEGA-492 status updated to Done', '12m ago'),
  ('GitHub MCP', '/assets/logo/github.svg', 'Pull Request #9618 merged to main', '15m ago')
ON CONFLICT DO NOTHING;

-- Seed Permissions for Stripe
INSERT INTO public.enterprise_mcp_permissions (server_id, role_name, access_level)
VALUES
  ('stripe', 'Enterprise Admins', 'Full Admin (Read/Write/Execute)'),
  ('stripe', 'DevOps Team', 'Write & Execute'),
  ('stripe', 'Sales Copilots', 'Execute Only')
ON CONFLICT DO NOTHING;

-- Seed Logs for Stripe
INSERT INTO public.enterprise_mcp_logs (server_id, tool_name, status_code, response_time_ms, payload_snippet)
VALUES
  ('stripe', 'Create Payment Intent', 200, 112, '{"id": "pi_3MtwB2LkdIwHu7ix0rX7M1gZ", "amount": 145000}'),
  ('stripe', 'Retrieve Customer', 200, 95, '{"id": "cus_N9xW8qLsZ2", "email": "client@enterprise.com"}')
ON CONFLICT DO NOTHING;

-- Seed Configs for Stripe
INSERT INTO public.enterprise_mcp_configs (server_id, config_key, config_value, is_secret)
VALUES
  ('stripe', 'SERVER_URL', 'https://mcp.stripe.com', false),
  ('stripe', 'RATE_LIMIT_PER_MIN', '1000', false),
  ('stripe', 'WEBHOOK_SECRET', 'whsec_enterprise_zega_live_key', true)
ON CONFLICT DO NOTHING;
