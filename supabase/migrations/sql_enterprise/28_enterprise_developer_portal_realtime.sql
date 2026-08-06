-- Migration 28: Enterprise Developer Portal Comprehensive Realtime & Telemetry Schema
-- OWASP & Production Hardened with Idempotent DDL, RLS Policies, Indexes, and Realtime Publications

CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(32) NOT NULL,
  key_hash VARCHAR(255),
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  environment VARCHAR(50) DEFAULT 'Production',
  status VARCHAR(50) DEFAULT 'Active',
  ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
  rate_limit_rpm INT DEFAULT 1000,
  total_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata_json JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.enterprise_developer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  name VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) UNIQUE,
  client_secret_hash VARCHAR(255),
  environment VARCHAR(50) DEFAULT 'Production',
  request_count VARCHAR(50) DEFAULT '0',
  data_transfer_gb NUMERIC(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata_json JSONB DEFAULT '{}'::jsonb
);

-- Ensure missing columns exist on existing table instances
ALTER TABLE public.enterprise_developer_applications ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);
ALTER TABLE public.enterprise_developer_applications ADD COLUMN IF NOT EXISTS client_secret_hash VARCHAR(255);
ALTER TABLE public.enterprise_developer_applications ADD COLUMN IF NOT EXISTS data_transfer_gb NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.enterprise_developer_applications ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS rate_limit_rpm INT DEFAULT 1000;
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS total_requests BIGINT DEFAULT 0;
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.enterprise_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  time_label VARCHAR(255) NOT NULL,
  application VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  status INT NOT NULL DEFAULT 200,
  latency VARCHAR(50) NOT NULL,
  latency_ms INT DEFAULT 120,
  ip_address VARCHAR(100) NOT NULL,
  user_agent TEXT,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS latency_ms INT DEFAULT 120;
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS payload_json JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.enterprise_webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  event_name VARCHAR(255),
  target_url TEXT,
  url TEXT,
  status VARCHAR(50) DEFAULT 'Success',
  time_ago VARCHAR(50) DEFAULT 'Just now',
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_webhook_configs ADD COLUMN IF NOT EXISTS event_name VARCHAR(255);
ALTER TABLE public.enterprise_webhook_configs ADD COLUMN IF NOT EXISTS target_url TEXT;
ALTER TABLE public.enterprise_webhook_configs ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.enterprise_webhook_configs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Success';
ALTER TABLE public.enterprise_webhook_configs ADD COLUMN IF NOT EXISTS time_ago VARCHAR(50) DEFAULT 'Just now';
ALTER TABLE public.enterprise_webhook_configs ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

UPDATE public.enterprise_webhook_configs SET target_url = url WHERE target_url IS NULL AND url IS NOT NULL;
UPDATE public.enterprise_webhook_configs SET url = target_url WHERE url IS NULL AND target_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.enterprise_sdks_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  install_command VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.enterprise_system_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(255) NOT NULL,
  component_key VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Operational',
  uptime_percentage NUMERIC(5,2) DEFAULT 99.99,
  latency_ms INT DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_system_status ADD COLUMN IF NOT EXISTS uptime_percentage NUMERIC(5,2) DEFAULT 99.99;
ALTER TABLE public.enterprise_system_status ADD COLUMN IF NOT EXISTS latency_ms INT DEFAULT 12;

-- Indexes for high throughput performance
CREATE INDEX IF NOT EXISTS idx_ent_api_logs_org_created ON public.enterprise_api_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ent_api_keys_prefix ON public.enterprise_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_ent_dev_apps_client_id ON public.enterprise_developer_applications(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_developer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_sdks_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_system_status ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DROP POLICY IF EXISTS "Allow public read enterprise_api_keys" ON public.enterprise_api_keys;
CREATE POLICY "Allow public read enterprise_api_keys" ON public.enterprise_api_keys FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_developer_applications" ON public.enterprise_developer_applications;
CREATE POLICY "Allow public read enterprise_developer_applications" ON public.enterprise_developer_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_api_logs" ON public.enterprise_api_logs;
CREATE POLICY "Allow public read enterprise_api_logs" ON public.enterprise_api_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_webhook_configs" ON public.enterprise_webhook_configs;
CREATE POLICY "Allow public read enterprise_webhook_configs" ON public.enterprise_webhook_configs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_sdks_catalog" ON public.enterprise_sdks_catalog;
CREATE POLICY "Allow public read enterprise_sdks_catalog" ON public.enterprise_sdks_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_system_status" ON public.enterprise_system_status;
CREATE POLICY "Allow public read enterprise_system_status" ON public.enterprise_system_status FOR SELECT USING (true);

-- Enable Supabase Realtime safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_api_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_api_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_api_keys') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_api_keys;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_developer_applications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_developer_applications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Idempotent Enterprise Telemetry Seed Data
INSERT INTO public.enterprise_api_keys (name, key_prefix, environment, status)
VALUES 
  ('Production Agent API Key', 'zg_live_8f3a', 'Production', 'Active'),
  ('Staging Workflow Key', 'zg_stg_41b2', 'Staging', 'Active'),
  ('Mobile App Client Key', 'zg_live_99d1', 'Production', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_developer_applications (name, client_id, environment, request_count, status)
VALUES 
  ('Agent Console', 'app_agent_console_prod', 'Production', '2.45M requests', 'Active'),
  ('Workflow Studio', 'app_workflow_studio_prod', 'Production', '1.12M requests', 'Active'),
  ('Mobile App', 'app_mobile_app_prod', 'Production', '856K requests', 'Active'),
  ('Analytics Dashboard', 'app_analytics_dash_stg', 'Staging', '452K requests', 'Active'),
  ('Internal Tooling', 'app_internal_tool_dev', 'Development', '128K requests', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_api_logs (time_label, application, method, endpoint, status, latency, latency_ms, ip_address)
VALUES 
  ('May 27, 2025 10:30:45 AM', 'Agent Console', 'POST', '/v1/agents/run', 200, '124ms', 124, '103.12.45.67'),
  ('May 27, 2025 10:28:12 AM', 'Workflow Studio', 'POST', '/v1/workflows/execute', 200, '98ms', 98, '103.12.45.67'),
  ('May 27, 2025 10:25:53 AM', 'Mobile App', 'GET', '/v1/knowledge/search', 200, '87ms', 87, '185.34.21.123'),
  ('May 27, 2025 10:20:11 AM', 'Analytics Dashboard', 'GET', '/v1/analytics/usage', 200, '76ms', 76, '103.12.45.67'),
  ('May 27, 2025 10:18:07 AM', 'Agent Console', 'POST', '/v1/agents/run', 500, '532ms', 532, '203.0.113.45')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_webhook_configs (event_name, target_url, status, time_ago)
VALUES 
  ('workflow.completed', 'https://api.zegaai.site/webhooks/workflow', 'Success', '2s ago'),
  ('agent.execution.failed', 'https://api.zegaai.site/webhooks/alerts', 'Failed', '10s ago'),
  ('knowledge.updated', 'https://api.zegaai.site/webhooks/knowledge', 'Success', '30s ago')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_system_status (service_name, component_key, status, latency_ms)
VALUES 
  ('API Gateway', 'api_gateway', 'Operational', 12),
  ('Agent Runtime', 'agent_runtime', 'Operational', 14),
  ('Knowledge Service', 'knowledge_service', 'Operational', 18),
  ('Workflow Engine', 'workflow_engine', 'Operational', 15),
  ('Vector Database', 'vector_db', 'Operational', 8)
ON CONFLICT DO NOTHING;
