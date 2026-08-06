-- ============================================================================
-- ZEGA AI ENTERPRISE ORCHESTRATOR HUB - REAL-TIME LOGS SCHEMAS (ENTERPRISE EDITION)
-- Migration File: 31_enterprise_logs_realtime.sql
-- Sub-pages: API Logs, System Logs, Audit Logs, Error Logs
-- Enterprise Standards: OpenTelemetry Tracing, JSONB Payloads, Realtime Synchronization
-- ============================================================================

-- 1. ENTERPRISE API LOGS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  "time" TIMESTAMPTZ DEFAULT NOW(),
  time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15',
  application VARCHAR(100) DEFAULT 'ZEGA AI Core',
  method VARCHAR(10) DEFAULT 'POST',
  endpoint VARCHAR(255) NOT NULL DEFAULT '/v1/agents/run',
  status INT DEFAULT 200,
  response_time_ms INT DEFAULT 142,
  latency INT DEFAULT 142,
  ip_address VARCHAR(45) DEFAULT '202.12.49.67',
  api_key_masked VARCHAR(50) DEFAULT 'zga_live_••••••••',
  user_agent VARCHAR(255) DEFAULT 'Mozilla/5.0...',
  request_size_bytes INT DEFAULT 1228,
  response_size_bytes INT DEFAULT 2457,
  service VARCHAR(100) DEFAULT 'API Gateway',
  trace_id VARCHAR(100) DEFAULT 'trace_7f8a9b0c1d2e3f4a',
  span_id VARCHAR(100) DEFAULT 'span_1a2b3c4d',
  correlation_id VARCHAR(100) DEFAULT 'corr_8a9b0c1d',
  request_headers JSONB DEFAULT '{"Accept": "application/json", "Content-Type": "application/json"}'::jsonb,
  response_headers JSONB DEFAULT '{"Content-Type": "application/json", "X-Request-Id": "req_123"}'::jsonb,
  request_body JSONB DEFAULT '{"stream": false, "temperature": 0.7}'::jsonb,
  response_body JSONB DEFAULT '{"status": "success", "result": "Model inference complete"}'::jsonb,
  metadata JSONB DEFAULT '{"cluster": "us-east-1", "datacenter": "aws-virginia"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS FOR PRE-EXISTING API LOGS TABLES
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS "time" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS application VARCHAR(100) DEFAULT 'ZEGA AI Core';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS latency INT DEFAULT 142;
ALTER TABLE public.enterprise_api_logs ALTER COLUMN time_label DROP NOT NULL;
ALTER TABLE public.enterprise_api_logs ALTER COLUMN application DROP NOT NULL;
ALTER TABLE public.enterprise_api_logs ALTER COLUMN latency DROP NOT NULL;
DO $$ BEGIN ALTER TABLE public.enterprise_api_logs ALTER COLUMN path DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.enterprise_api_logs ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.enterprise_api_logs ALTER COLUMN category DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.enterprise_api_logs ALTER COLUMN response_time DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS method VARCHAR(10) DEFAULT 'POST';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS endpoint VARCHAR(255) DEFAULT '/v1/agents/run';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS status INT DEFAULT 200;
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS response_time_ms INT DEFAULT 142;
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) DEFAULT '202.12.49.67';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS api_key_masked VARCHAR(50) DEFAULT 'zga_live_••••••••';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255) DEFAULT 'Mozilla/5.0...';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS request_size_bytes INT DEFAULT 1228;
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS response_size_bytes INT DEFAULT 2457;
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS service VARCHAR(100) DEFAULT 'API Gateway';
ALTER TABLE public.enterprise_api_logs ADD COLUMN IF NOT EXISTS trace_id VARCHAR(100) DEFAULT 'trace_7f8a9b0c1d2e3f4a';

-- 2. ENTERPRISE SYSTEM LOGS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  "time" TIMESTAMPTZ DEFAULT NOW(),
  time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15',
  application VARCHAR(100) DEFAULT 'ZEGA AI Core',
  level VARCHAR(20) DEFAULT 'INFO',
  service VARCHAR(100) NOT NULL DEFAULT 'API Gateway',
  component VARCHAR(100) NOT NULL DEFAULT 'Request Router',
  message TEXT NOT NULL DEFAULT 'Service health check OK',
  host VARCHAR(100) DEFAULT 'ip-10-0-2-12',
  environment VARCHAR(50) DEFAULT 'Production',
  trace_id VARCHAR(100) DEFAULT 'trace_7f8a9b0c1d2e3f4a',
  span_id VARCHAR(100) DEFAULT 'span_5e6f7g8h',
  cpu_usage_pct NUMERIC(5,2) DEFAULT 12.45,
  mem_usage_bytes BIGINT DEFAULT 1073741824,
  context_payload JSONB DEFAULT '{"thread_id": 42, "goroutine": 108}'::jsonb,
  metadata JSONB DEFAULT '{"container_id": "docker_4a5b6c"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS FOR PRE-EXISTING SYSTEM LOGS TABLES
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS "time" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15';
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS application VARCHAR(100) DEFAULT 'ZEGA AI Core';
ALTER TABLE public.enterprise_system_logs ALTER COLUMN time_label DROP NOT NULL;
ALTER TABLE public.enterprise_system_logs ALTER COLUMN application DROP NOT NULL;
DO $$ BEGIN ALTER TABLE public.enterprise_system_logs ALTER COLUMN category DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.enterprise_system_logs ALTER COLUMN source DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'INFO';
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS service VARCHAR(100) DEFAULT 'API Gateway';
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS component VARCHAR(100) DEFAULT 'Request Router';
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS message TEXT DEFAULT 'Service health check OK';
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS host VARCHAR(100) DEFAULT 'ip-10-0-2-12';
ALTER TABLE public.enterprise_system_logs ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'Production';

-- 3. ENTERPRISE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  "time" TIMESTAMPTZ DEFAULT NOW(),
  time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15',
  application VARCHAR(100) DEFAULT 'ZEGA AI Core',
  user_email VARCHAR(255) NOT NULL DEFAULT 'admin@zegaai.com',
  action VARCHAR(50) NOT NULL DEFAULT 'Updated',
  resource VARCHAR(255) NOT NULL DEFAULT 'System Config',
  resource_type VARCHAR(100) NOT NULL DEFAULT 'Settings',
  details TEXT DEFAULT '',
  ip_address VARCHAR(45) DEFAULT '103.12.45.67',
  environment VARCHAR(50) DEFAULT 'Production',
  user_agent VARCHAR(255) DEFAULT 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  geo_location VARCHAR(100) DEFAULT 'Jakarta, ID',
  previous_state JSONB DEFAULT '{}'::jsonb,
  new_state JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{"session_id": "sess_998877"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS FOR PRE-EXISTING AUDIT LOGS TABLES
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS "time" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS application VARCHAR(100) DEFAULT 'ZEGA AI Core';
ALTER TABLE public.enterprise_audit_logs ALTER COLUMN time_label DROP NOT NULL;
ALTER TABLE public.enterprise_audit_logs ALTER COLUMN application DROP NOT NULL;
DO $$ BEGIN ALTER TABLE public.enterprise_audit_logs ALTER COLUMN user_id DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255) DEFAULT 'admin@zegaai.com';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50) DEFAULT 'Updated';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS resource VARCHAR(255) DEFAULT 'System Config';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100) DEFAULT 'Settings';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS details TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) DEFAULT '103.12.45.67';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'Production';

-- 4. ENTERPRISE ERROR LOGS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999'::uuid,
  "time" TIMESTAMPTZ DEFAULT NOW(),
  time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15',
  application VARCHAR(100) DEFAULT 'ZEGA AI Core',
  priority VARCHAR(20) DEFAULT 'Medium',
  service VARCHAR(100) NOT NULL DEFAULT 'Workflow Engine',
  error_type VARCHAR(100) NOT NULL DEFAULT 'TimeoutError',
  message TEXT NOT NULL DEFAULT 'Operation timed out',
  occurrences_count INT DEFAULT 1,
  affected_users_count INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'Open',
  stacktrace TEXT DEFAULT '',
  environment VARCHAR(50) DEFAULT 'Production',
  trace_id VARCHAR(100) DEFAULT 'trace_err_9a8b7c6d',
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  metadata JSONB DEFAULT '{"release": "v2.4.1"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS FOR PRE-EXISTING ERROR LOGS TABLES
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS "time" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS time_label VARCHAR(100) DEFAULT 'May 27, 2025 14:32:15';
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS application VARCHAR(100) DEFAULT 'ZEGA AI Core';
ALTER TABLE public.enterprise_error_logs ALTER COLUMN time_label DROP NOT NULL;
ALTER TABLE public.enterprise_error_logs ALTER COLUMN application DROP NOT NULL;

ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Medium';
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS service VARCHAR(100) DEFAULT 'Workflow Engine';
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS error_type VARCHAR(100) DEFAULT 'TimeoutError';
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS message TEXT DEFAULT 'Operation timed out';
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS occurrences_count INT DEFAULT 1;
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS affected_users_count INT DEFAULT 1;
ALTER TABLE public.enterprise_error_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Open';

-- HIGH-PERFORMANCE INDEXING STRATEGY
CREATE INDEX IF NOT EXISTS idx_ent_api_logs_time ON public.enterprise_api_logs("time" DESC);
CREATE INDEX IF NOT EXISTS idx_ent_api_logs_status ON public.enterprise_api_logs(status);
CREATE INDEX IF NOT EXISTS idx_ent_api_logs_service ON public.enterprise_api_logs(service);

CREATE INDEX IF NOT EXISTS idx_ent_sys_logs_time ON public.enterprise_system_logs("time" DESC);
CREATE INDEX IF NOT EXISTS idx_ent_sys_logs_level ON public.enterprise_system_logs(level);
CREATE INDEX IF NOT EXISTS idx_ent_sys_logs_service ON public.enterprise_system_logs(service);

CREATE INDEX IF NOT EXISTS idx_ent_audit_logs_time ON public.enterprise_audit_logs("time" DESC);
CREATE INDEX IF NOT EXISTS idx_ent_audit_logs_user ON public.enterprise_audit_logs(user_email);

CREATE INDEX IF NOT EXISTS idx_ent_err_logs_time ON public.enterprise_error_logs("time" DESC);
CREATE INDEX IF NOT EXISTS idx_ent_err_logs_priority ON public.enterprise_error_logs(priority);
CREATE INDEX IF NOT EXISTS idx_ent_err_logs_status ON public.enterprise_error_logs(status);

-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT PROVISIONS)
ALTER TABLE public.enterprise_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read enterprise_api_logs" ON public.enterprise_api_logs;
DROP POLICY IF EXISTS "Allow public insert enterprise_api_logs" ON public.enterprise_api_logs;
CREATE POLICY "Allow public read enterprise_api_logs" ON public.enterprise_api_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_api_logs" ON public.enterprise_api_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read enterprise_system_logs" ON public.enterprise_system_logs;
DROP POLICY IF EXISTS "Allow public insert enterprise_system_logs" ON public.enterprise_system_logs;
CREATE POLICY "Allow public read enterprise_system_logs" ON public.enterprise_system_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_system_logs" ON public.enterprise_system_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read enterprise_audit_logs" ON public.enterprise_audit_logs;
DROP POLICY IF EXISTS "Allow public insert enterprise_audit_logs" ON public.enterprise_audit_logs;
CREATE POLICY "Allow public read enterprise_audit_logs" ON public.enterprise_audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_audit_logs" ON public.enterprise_audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read enterprise_error_logs" ON public.enterprise_error_logs;
DROP POLICY IF EXISTS "Allow public insert enterprise_error_logs" ON public.enterprise_error_logs;
DROP POLICY IF EXISTS "Allow public update enterprise_error_logs" ON public.enterprise_error_logs;
CREATE POLICY "Allow public read enterprise_error_logs" ON public.enterprise_error_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_error_logs" ON public.enterprise_error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update enterprise_error_logs" ON public.enterprise_error_logs FOR UPDATE USING (true);

-- ANALYTICAL KPI AGGREGATION VIEWS
CREATE OR REPLACE VIEW public.view_enterprise_api_log_stats_24h AS
SELECT
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE status >= 200 AND status < 300) AS success_requests,
  COUNT(*) FILTER (WHERE status >= 400) AS failed_requests,
  ROUND(AVG(response_time_ms), 2) AS avg_response_time_ms
FROM public.enterprise_api_logs
WHERE "time" >= NOW() - INTERVAL '24 hours';

CREATE OR REPLACE VIEW public.view_enterprise_system_log_stats_24h AS
SELECT
  COUNT(*) AS total_logs,
  COUNT(*) FILTER (WHERE level = 'INFO') AS info_count,
  COUNT(*) FILTER (WHERE level = 'WARN') AS warn_count,
  COUNT(*) FILTER (WHERE level = 'ERROR') AS error_count,
  COUNT(*) FILTER (WHERE level = 'CRITICAL') AS critical_count
FROM public.enterprise_system_logs
WHERE "time" >= NOW() - INTERVAL '24 hours';

-- ATOMIC STORED PROCEDURES FOR HIGH-THROUGHPUT INGESTION
CREATE OR REPLACE FUNCTION public.fn_ingest_enterprise_api_log(
  p_endpoint VARCHAR,
  p_method VARCHAR,
  p_status INT,
  p_response_time_ms INT,
  p_service VARCHAR,
  p_ip VARCHAR DEFAULT '127.0.0.1'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.enterprise_api_logs (
    endpoint, method, status, response_time_ms, latency, service, ip_address, time_label, application
  )
  VALUES (
    p_endpoint, p_method, p_status, p_response_time_ms, p_response_time_ms, p_service, p_ip, TO_CHAR(NOW(), 'Mon DD, YYYY HH24:MI:SS'), 'ZEGA AI Core'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_resolve_enterprise_error_log(
  p_error_id UUID,
  p_resolved_by VARCHAR DEFAULT 'system.admin'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.enterprise_error_logs
  SET
    status = 'Resolved',
    resolved_at = NOW(),
    resolved_by = p_resolved_by
  WHERE id = p_error_id;

  RETURN FOUND;
END;
$$;

-- SEED DATA MATCHING DESIGN SCREENSHOT
INSERT INTO public.enterprise_api_logs ("time", time_label, application, latency, method, endpoint, status, response_time_ms, ip_address, api_key_masked, user_agent, request_size_bytes, response_size_bytes, service) VALUES
('2025-05-27 14:32:15', 'May 27, 2025 14:32:15', 'ZEGA AI Core', 142, 'POST', '/v1/agents/run', 200, 142, '202.12.49.67', 'zga_live_••••••••', 'Mozilla/5.0...', 1228, 2457, 'API Gateway'),
('2025-05-27 14:32:14', 'May 27, 2025 14:32:14', 'ZEGA AI Core', 98, 'GET', '/v1/knowledge/search', 200, 98, '181.34.21.123', 'zga_dev_••••••••', 'PostmanRuntime...', 2252, 1126, 'Knowledge Hub'),
('2025-05-27 14:32:13', 'May 27, 2025 14:32:13', 'ZEGA AI Core', 521, 'POST', '/v1/workflows/execute', 429, 521, '203.0.113.45', 'zga_dev_••••••••', 'okhttp/4.12.0', 512, 1228, 'Workflow Engine'),
('2025-05-27 14:32:12', 'May 27, 2025 14:32:12', 'ZEGA AI Core', 231, 'GET', '/v1/analytics/usage', 200, 231, '64.233.16.01', 'zga_live_••••••••', 'Mozilla/5.0...', 3072, 5324, 'Analytics'),
('2025-05-27 14:32:11', 'May 27, 2025 14:32:11', 'ZEGA AI Core', 915, 'POST', '/v1/payments/checkout', 500, 915, '54.239.28.45', 'zga_live_••••••••', 'Mozilla/5.0...', 3584, 5242, 'Payments'),
('2025-05-27 14:32:10', 'May 27, 2025 14:32:10', 'ZEGA AI Core', 76, 'GET', '/v1/agents/list', 200, 76, '20.191.28.82', 'zga_dev_••••••••', 'Mozilla/5.0...', 3072, 1228, 'Agent Runtime')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_system_logs ("time", time_label, application, level, service, component, message, host, environment) VALUES
('2025-05-27 14:32:15', 'May 27, 2025 14:32:15', 'ZEGA AI Core', 'INFO', 'API Gateway', 'Request Router', 'Request processed successfully', 'ip-10-0-2-12', 'Production'),
('2025-05-27 14:32:14', 'May 27, 2025 14:32:14', 'ZEGA AI Core', 'INFO', 'Workflow Engine', 'Worker Pool', 'Workflow execution completed', 'ip-10-0-2-23', 'Production'),
('2025-05-27 14:32:13', 'May 27, 2025 14:32:13', 'ZEGA AI Core', 'WARN', 'Vector Database', 'Index Service', 'Vector index updated', 'ip-10-0-4-15', 'Staging'),
('2025-05-27 14:32:11', 'May 27, 2025 14:32:11', 'ZEGA AI Core', 'INFO', 'Agent Runtime', 'Model Runner', 'Model inference completed', 'ip-10-0-2-12', 'Production'),
('2025-05-27 14:32:10', 'May 27, 2025 14:32:10', 'ZEGA AI Core', 'INFO', 'Payments Service', 'Payment Processor', 'Payment processed', 'ip-10-0-2-12', 'Production'),
('2025-05-27 14:32:08', 'May 27, 2025 14:32:08', 'ZEGA AI Core', 'CRITICAL', 'Auth Service', 'Token Service', 'Token refreshed', 'ip-10-0-3-11', 'Production'),
('2025-05-27 14:15:22', 'May 27, 2025 14:15:22', 'ZEGA AI Core', 'WARN', 'Infrastructure', 'Load Balancer', 'High memory usage detected', 'ip-10-0-4-12', 'Production'),
('2025-05-27 14:10:41', 'May 27, 2025 14:10:41', 'ZEGA AI Core', 'ERROR', 'Infrastructure', 'Load Balancer', 'Service unavailable', 'ip-10-0-4-12', 'Production')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_audit_logs ("time", time_label, application, user_email, action, resource, resource_type, details, ip_address, environment) VALUES
('2025-05-27 14:32:15', 'May 27, 2025 14:32:15', 'ZEGA AI Core', 'cole.cox@zegaai.com', 'Updated', 'API Key (zga_live_••••)', 'API Key', 'Changed permissions', '103.12.45.67', 'Production'),
('2025-05-27 14:28:12', 'May 27, 2025 14:28:12', 'ZEGA AI Core', 'sarah.admin@zegaai.com', 'Created', 'Webhook Endpoint', 'Webhook', 'Added new endpoint', '185.34.21.123', 'Production'),
('2025-05-27 14:15:33', 'May 27, 2025 14:15:33', 'ZEGA AI Core', 'wildan@zegaai.com', 'Deleted', 'Agent ID: ag_315401', 'Agent', 'Removed agent', '103.12.45.67', 'Production'),
('2025-05-27 14:10:11', 'May 27, 2025 14:10:11', 'ZEGA AI Core', 'system', 'Login', 'User Session', 'Auth', 'Successful login', '103.12.45.67', 'Production'),
('2025-05-27 14:14:57', 'May 27, 2025 14:14:57', 'ZEGA AI Core', 'randy.dev@zegaai.com', 'Updated', 'Workflow (wf_578901)', 'Workflow', 'Updated configuration', '203.0.113.45', 'Development'),
('2025-05-27 14:13:22', 'May 27, 2025 14:13:22', 'ZEGA AI Core', 'api-service', 'Password', 'Knowledge Base', 'Data', 'Document search', '54.239.28.45', 'Production'),
('2025-05-27 14:10:41', 'May 27, 2025 14:10:41', 'ZEGA AI Core', 'mfa-system', 'MFA Verified', 'User Session', 'Auth', 'MFA challenge passed', '103.12.45.67', 'Production')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_error_logs ("time", time_label, application, priority, service, error_type, message, occurrences_count, affected_users_count, status, environment) VALUES
('2025-05-27 14:32:15', 'May 27, 2025 14:32:15', 'ZEGA AI Core', 'High', 'Workflow Engine', 'TimeoutError', 'Workflow execution timeout after 30s', 45, 23, 'Open', 'Production'),
('2025-05-27 14:28:12', 'May 27, 2025 14:28:12', 'ZEGA AI Core', 'High', 'API Gateway', 'RateLimitExceeded', 'Rate limit exceeded for API key', 123, 67, 'Open', 'Production'),
('2025-05-27 14:25:33', 'May 27, 2025 14:25:33', 'ZEGA AI Core', 'Medium', 'Vector Database', 'QueryError', 'Vector search query failed', 89, 34, 'Investigating', 'Production'),
('2025-05-27 14:20:11', 'May 27, 2025 14:20:11', 'ZEGA AI Core', 'High', 'Agent Runtime', 'ModelError', 'AI model inference failed', 67, 28, 'Open', 'Production'),
('2025-05-27 14:18:07', 'May 27, 2025 14:18:07', 'ZEGA AI Core', 'Medium', 'Payments Service', 'NetworkError', 'Payment gateway connection timeout', 34, 12, 'Investigating', 'Production'),
('2025-05-27 14:15:30', 'May 27, 2025 14:15:30', 'ZEGA AI Core', 'Low', 'Knowledge Hub', 'NotFoundError', 'Document not found', 28, 8, 'Resolved', 'Production'),
('2025-05-27 14:10:41', 'May 27, 2025 14:10:41', 'ZEGA AI Core', 'High', 'Auth Service', 'TokenError', 'Invalid or expired token', 25, 7, 'Resolved', 'Production')
ON CONFLICT DO NOTHING;

-- SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'publication_enterprise_logs_realtime') THEN
    CREATE PUBLICATION publication_enterprise_logs_realtime FOR TABLE
      public.enterprise_api_logs,
      public.enterprise_system_logs,
      public.enterprise_audit_logs,
      public.enterprise_error_logs;
  END IF;
END $$;
