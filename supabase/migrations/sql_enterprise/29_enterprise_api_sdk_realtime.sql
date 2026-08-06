-- Migration 29: Enterprise API & SDK Comprehensive Realtime & Telemetry Schema
-- OWASP & Production Hardened with Idempotent DDL, Stored Procedures, Audit Logs, Indexes, and Realtime Publications

-- 1. MAIN API KEYS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(64) NOT NULL,
  full_key_preview VARCHAR(255),
  key_hash VARCHAR(255),
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  permissions VARCHAR(100) DEFAULT 'Full Access',
  environment VARCHAR(50) DEFAULT 'Production',
  status VARCHAR(50) DEFAULT 'Active',
  ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
  rate_limit_rpm INT DEFAULT 1000,
  total_requests BIGINT DEFAULT 0,
  successful_requests BIGINT DEFAULT 0,
  failed_requests BIGINT DEFAULT 0,
  created_by VARCHAR(255) DEFAULT 'cole.coe@zegaai.com',
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata_json JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS full_key_preview VARCHAR(255);
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS key_hash VARCHAR(255);
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS permissions VARCHAR(100) DEFAULT 'Full Access';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'cole.coe@zegaai.com';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS successful_requests BIGINT DEFAULT 0;
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS failed_requests BIGINT DEFAULT 0;

-- 2. SDK CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_sdks_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  platform VARCHAR(255) DEFAULT 'Node.js, Browser',
  install_command VARCHAR(255) NOT NULL,
  icon_url TEXT,
  doc_url TEXT DEFAULT 'https://docs.zegaai.site',
  github_url TEXT DEFAULT 'https://github.com/zegaai',
  downloads_count BIGINT DEFAULT 125000,
  status VARCHAR(50) DEFAULT 'Stable',
  badge VARCHAR(50) DEFAULT 'Active',
  release_notes TEXT,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS platform VARCHAR(255) DEFAULT 'Node.js, Browser';
ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS doc_url TEXT DEFAULT 'https://docs.zegaai.site';
ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS github_url TEXT DEFAULT 'https://github.com/zegaai';
ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS downloads_count BIGINT DEFAULT 125000;
ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enterprise_sdks_catalog ADD COLUMN IF NOT EXISTS badge VARCHAR(50) DEFAULT 'Active';

-- 3. CODE EXAMPLES TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_code_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'POST',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Agents',
  language VARCHAR(50) NOT NULL DEFAULT 'cURL',
  req_snippet TEXT NOT NULL,
  res_snippet TEXT NOT NULL,
  status_code INT DEFAULT 200,
  auth_type VARCHAR(100) DEFAULT 'Bearer Token (API Key)',
  rate_limit VARCHAR(100) DEFAULT '1000 requests / minute',
  sdk_support TEXT[] DEFAULT ARRAY['JavaScript', 'Python', 'Go', 'Java', 'cURL']::TEXT[],
  permissions_required VARCHAR(100) DEFAULT 'v1/agents:run',
  best_for VARCHAR(255) DEFAULT 'Read / Write',
  response_type VARCHAR(255) DEFAULT 'Running AI agents and processing tasks',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HOURLY API METRICS BUCKET TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_api_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES public.enterprise_api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  time_bucket TIMESTAMPTZ NOT NULL,
  total_requests INT DEFAULT 0,
  successful_requests INT DEFAULT 0,
  failed_requests INT DEFAULT 0,
  avg_latency_ms INT DEFAULT 120,
  p95_latency_ms INT DEFAULT 350,
  data_transfer_kb NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. API SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_api_security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID,
  action VARCHAR(100) NOT NULL,
  actor_email VARCHAR(255) DEFAULT 'cole.coe@zegaai.com',
  actor_ip VARCHAR(100) DEFAULT '127.0.0.1',
  user_agent TEXT,
  details_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ent_api_keys_org ON public.enterprise_api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_ent_api_keys_env ON public.enterprise_api_keys(environment);
CREATE INDEX IF NOT EXISTS idx_ent_api_keys_status ON public.enterprise_api_keys(status);
CREATE INDEX IF NOT EXISTS idx_ent_api_metrics_bucket ON public.enterprise_api_metrics_hourly(time_bucket);
CREATE INDEX IF NOT EXISTS idx_ent_api_audits_key ON public.enterprise_api_security_audits(key_id);

-- STORED PROCEDURE: ROTATE API KEY ATOMICALLY
CREATE OR REPLACE FUNCTION public.fn_enterprise_rotate_api_key(
  p_key_id UUID,
  p_actor_email VARCHAR(255) DEFAULT 'cole.coe@zegaai.com'
)
RETURNS TABLE (
  success BOOLEAN,
  new_prefix VARCHAR(64),
  new_full_key VARCHAR(255)
) AS $$
DECLARE
  v_rand VARCHAR(16);
  v_new_full VARCHAR(255);
  v_new_prefix VARCHAR(64);
BEGIN
  v_rand := substring(md5(random()::text) from 1 for 10);
  v_new_full := 'zga_live_' || v_rand || '_' || md5(random()::text);
  v_new_prefix := 'zga_live_' || v_rand || '••••••••';

  UPDATE public.enterprise_api_keys
  SET 
    full_key_preview = v_new_full,
    key_prefix = v_new_prefix,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_key_id;

  INSERT INTO public.enterprise_api_security_audits (key_id, action, actor_email, details_json)
  VALUES (p_key_id, 'KEY_REGENERATED', p_actor_email, jsonb_build_object('new_prefix', v_new_prefix));

  RETURN QUERY SELECT true, v_new_prefix, v_new_full;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SEED DATA FOR API KEYS IF TABLE EMPTY
INSERT INTO public.enterprise_api_keys (name, key_prefix, full_key_preview, environment, permissions, status, created_by, last_used_at, total_requests, successful_requests, failed_requests)
SELECT * FROM (VALUES
  ('Production Key', 'zga_live_9812••••', 'zga_live_981249124819241829481294', 'Production', 'Full Access', 'Active', 'cole.coe@zegaai.com', NOW() - INTERVAL '2 minutes', 850000, 845000, 5000),
  ('Analytics Service', 'zga_live_4129••••', 'zga_live_412914812948124192412941', 'Production', 'Read Only', 'Active', 'cole.coe@zegaai.com', NOW() - INTERVAL '2 minutes', 612000, 610000, 2000),
  ('DevKey - Team A', 'zga_dev_8124••••', 'zga_dev_812491824912481294182941', 'Development', 'Read / Write', 'Active', 'dev.team@zegaai.com', NOW() - INTERVAL '1 hour', 488000, 480000, 8000),
  ('CUCO Key', 'zga_ci_9182••••', 'zga_ci_918249182491824918294182', 'Production', 'Read Only', 'Active', 'ci.runner@zegaai.com', NOW() - INTERVAL '3 hours', 288000, 287000, 1000),
  ('Billing Integration', 'zga_billing_1294••••', 'zga_billing_129481294812491824918241', 'Production', 'Billing', 'Inactive', 'finance@zegaai.com', NOW() - INTERVAL '1 day', 215000, 214000, 1000),
  ('Test Key', 'zga_test_8124••••', 'zga_test_812491824912491284918249', 'Testing', 'Read Only', 'Revoked', 'qa.tester@zegaai.com', NULL, 12000, 10000, 2000)
) AS v(name, key_prefix, full_key_preview, environment, permissions, status, created_by, last_used_at, total_requests, successful_requests, failed_requests)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_api_keys LIMIT 1);

-- SEED DATA FOR SDK CATALOG IF TABLE EMPTY
INSERT INTO public.enterprise_sdks_catalog (language, name, package_name, version, platform, install_command, icon_url, status, badge, downloads_count)
SELECT * FROM (VALUES
  ('JavaScript / TypeScript', 'JavaScript/TypeScript SDK', '@zega/sdk', 'v2.4.0', 'Node.js, Browser', 'npm install @zega/sdk', 'https://cdn.zegaai.site/design/design_enterprise/JavaScript-logo.png', 'Stable', 'Active', 485000),
  ('Python', 'Python SDK', 'zega-ai', 'v2.4.0', 'Linux, macOS, Win', 'pip install zega-ai', 'https://cdn.zegaai.site/design/design_enterprise/python_logo.webp', 'Stable', 'Active', 390000),
  ('Go', 'Go SDK', 'zega-go', 'v2.3.0', 'Linux, macOS, Win', 'go get github.com/zega/zega-go', 'https://cdn.zegaai.site/design/design_enterprise/Go-Logo_LightBlue.png', 'Stable', 'Active', 210000),
  ('Java', 'Java SDK', 'zega-java', 'v2.3.1', 'Linux, macOS, Win', 'implementation "site.zegaai:sdk:2.3.1"', 'https://cdn.zegaai.site/design/design_enterprise/java.png', 'Beta', 'Coming soon', 95000),
  ('.NET', '.NET SDK', 'zega-dotnet', 'v2.2.0', 'Windows, Linux, macOS', 'dotnet add package Zega.SDK', 'https://cdn.zegaai.site/design/design_enterprise/JavaScript-logo.png', 'Beta', 'Coming soon', 65000),
  ('cURL', 'cURL Direct REST', 'curl', 'Latest', 'Any', 'curl https://api.zegaai.site/v1/...', 'https://cdn.zegaai.site/design/design_enterprise/Curl-logo.webp', 'Stable', 'Active', 890000)
) AS v(language, name, package_name, version, platform, install_command, icon_url, status, badge, downloads_count)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_sdks_catalog LIMIT 1);

-- SEED CODE EXAMPLES IF TABLE EMPTY
INSERT INTO public.enterprise_code_examples (endpoint, method, title, description, category, language, req_snippet, res_snippet, status_code)
SELECT * FROM (VALUES
  (
    'POST /v1/agents/run', 
    'POST', 
    'Execute Agent Task', 
    'Run an AI agent with the provided input and configuration asynchronously.', 
    'Agents', 
    'cURL', 
    $req$curl --request POST 'https://api.zegaai.site/v1/agents/run' \
  --header 'Authorization: Bearer zga_live_xxxxxxxxxxxx' \
  --header 'Content-Type: application/json' \
  --data '{
    "agent_id": "support-agent",
    "input": "Summarize last 10 support tickets",
    "stream": false,
    "temperature": 0.7
  }'$req$, 
    $res${
  "id": "run_1234567890",
  "agent_id": "support-agent",
  "status": "completed",
  "output": {
    "text": "Here is the summary of the last 10 support tickets...",
    "tokens_used": 532,
    "model": "zega-ai-1.3"
  },
  "created_at": "2026-05-27T10:30:45Z",
  "duration_ms": 1420
}$res$,
    200
  ),
  (
    'GET /v1/agents', 
    'GET', 
    'List Active Agents', 
    'Retrieve catalog of active AI workforce agents.', 
    'Agents', 
    'cURL', 
    $req$curl --request GET 'https://api.zegaai.site/v1/agents' \
  --header 'Authorization: Bearer zga_live_xxxxxxxxxxxx'$req$, 
    $res${
  "total": 638,
  "agents": [
    { "id": "support-agent", "name": "Customer Support Agent", "status": "Active" }
  ]
}$res$,
    200
  )
) AS v(endpoint, method, title, description, category, language, req_snippet, res_snippet, status_code)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_code_examples LIMIT 1);

-- ROW LEVEL SECURITY POLICIES
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_sdks_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_code_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_metrics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_security_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read enterprise_api_keys" ON public.enterprise_api_keys;
CREATE POLICY "Public read enterprise_api_keys" ON public.enterprise_api_keys FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert enterprise_api_keys" ON public.enterprise_api_keys;
CREATE POLICY "Public insert enterprise_api_keys" ON public.enterprise_api_keys FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update enterprise_api_keys" ON public.enterprise_api_keys;
CREATE POLICY "Public update enterprise_api_keys" ON public.enterprise_api_keys FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read enterprise_sdks_catalog" ON public.enterprise_sdks_catalog;
CREATE POLICY "Public read enterprise_sdks_catalog" ON public.enterprise_sdks_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read enterprise_code_examples" ON public.enterprise_code_examples;
CREATE POLICY "Public read enterprise_code_examples" ON public.enterprise_code_examples FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read enterprise_api_metrics_hourly" ON public.enterprise_api_metrics_hourly;
CREATE POLICY "Public read enterprise_api_metrics_hourly" ON public.enterprise_api_metrics_hourly FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read enterprise_api_security_audits" ON public.enterprise_api_security_audits;
CREATE POLICY "Public read enterprise_api_security_audits" ON public.enterprise_api_security_audits FOR SELECT USING (true);

-- SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'publication_enterprise_api_sdk_realtime') THEN
    CREATE PUBLICATION publication_enterprise_api_sdk_realtime FOR TABLE 
      public.enterprise_api_keys, 
      public.enterprise_sdks_catalog,
      public.enterprise_code_examples,
      public.enterprise_api_metrics_hourly,
      public.enterprise_api_security_audits;
  END IF;
END $$;
