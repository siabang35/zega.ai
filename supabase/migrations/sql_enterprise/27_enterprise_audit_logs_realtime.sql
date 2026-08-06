-- ====================================================================
-- ZEGA ENTERPRISE - SQL MIGRATION 27: AUDIT LOGS REALTIME & TELEMETRY
-- Target Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/27_enterprise_audit_logs_realtime.sql
-- Description: Establishes real-time audit logging schema, KPI aggregation views,
--              compliance tracking, and security event replication tables.
-- ====================================================================

-- 1. Create Main Audit Logs Table if not exists
CREATE TABLE IF NOT EXISTS public.enterprise_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999',
    event_id TEXT,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    formatted_time TEXT,
    user_email TEXT,
    actor_email TEXT,
    action TEXT,
    event_action TEXT,
    category TEXT DEFAULT 'Authentication',
    event_type TEXT DEFAULT 'Authentication',
    resource TEXT,
    target_resource TEXT,
    application TEXT DEFAULT 'Console',
    ip_address TEXT DEFAULT '103.12.45.67',
    status TEXT DEFAULT 'Success',
    user_agent TEXT DEFAULT 'Chrome 125.0.0.0 / macOS',
    payload_json JSONB DEFAULT '{}'::jsonb,
    severity TEXT DEFAULT 'Informational',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely drop ANY legacy CHECK constraints that might restrict severity/status/category formats
ALTER TABLE public.enterprise_audit_logs DROP CONSTRAINT IF EXISTS enterprise_audit_logs_severity_check;
ALTER TABLE public.enterprise_audit_logs DROP CONSTRAINT IF EXISTS enterprise_audit_logs_status_check;
ALTER TABLE public.enterprise_audit_logs DROP CONSTRAINT IF EXISTS enterprise_audit_logs_category_check;
ALTER TABLE public.enterprise_audit_logs DROP CONSTRAINT IF EXISTS audit_logs_severity_check;
ALTER TABLE public.enterprise_audit_logs DROP CONSTRAINT IF EXISTS audit_logs_status_check;

-- Safely drop ANY legacy NOT NULL constraints
DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN org_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN event_action DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN event_type DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN target_resource DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN actor_email DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN user_email DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN action DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN resource DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.enterprise_audit_logs ALTER COLUMN severity DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Ensure ALL legacy and new column names exist idempotently
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS event_timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS formatted_time TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS action TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS event_action TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Authentication';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Authentication';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS resource TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS target_resource TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS application TEXT DEFAULT 'Console';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT '103.12.45.67';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Success';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT 'Chrome 125.0.0.0 / macOS';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS payload_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'Informational';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS user_avatar TEXT DEFAULT '';
ALTER TABLE public.enterprise_audit_logs ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Jakarta, ID';

-- 2. Create Audit Log Configs Table
CREATE TABLE IF NOT EXISTS public.enterprise_audit_log_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID DEFAULT '99999999-9999-9999-9999-999999999999',
    retention_days INT NOT NULL DEFAULT 365,
    storage_used_tb NUMERIC(5,2) NOT NULL DEFAULT 3.46,
    storage_limit_tb NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    siem_integration_active BOOLEAN NOT NULL DEFAULT TRUE,
    log_forwarding_active BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_alerts_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for High-Performance Audit Log Searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.enterprise_audit_logs (event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.enterprise_audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.enterprise_audit_logs (severity);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_log_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to audit logs" ON public.enterprise_audit_logs;
CREATE POLICY "Allow public read access to audit logs" ON public.enterprise_audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to audit logs" ON public.enterprise_audit_logs;
CREATE POLICY "Allow public insert access to audit logs" ON public.enterprise_audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to audit configs" ON public.enterprise_audit_log_configs;
CREATE POLICY "Allow public read access to audit configs" ON public.enterprise_audit_log_configs FOR SELECT USING (true);

-- 5. Enable Supabase Realtime Replication safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_logs;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_log_configs;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- 6. Insert Initial Realistic Enterprise Audit Seed Data
INSERT INTO public.enterprise_audit_log_configs (org_id, retention_days, storage_used_tb, storage_limit_tb, siem_integration_active, log_forwarding_active, webhook_alerts_active)
VALUES ('99999999-9999-9999-9999-999999999999', 365, 3.46, 10.00, TRUE, TRUE, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_audit_logs (
    org_id, event_id, formatted_time, user_email, actor_email, user_name, user_avatar, 
    action, event_action, category, event_type, resource, target_resource, application, 
    ip_address, severity, status, user_agent, payload_json
)
VALUES 
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_103045', 'May 27, 2025 10:30:45 AM', 'cole.coa@zegaai.com', 'cole.coa@zegaai.com', 'Cole Coa', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'User login successful', 'User login successful', 'Authentication', 'Authentication', 'Console', 'Console', 'Console', '103.12.45.67', 'Informational', 'Success', 'Chrome 125.0.0.0 / macOS', '{"auth_type": "OAuth 2.0 / SAML SSO", "provider": "Okta Enterprise", "session_id": "sess_9901823"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_102812', 'May 27, 2025 10:28:12 AM', 'wildan@zegaai.com', 'wildan@zegaai.com', 'Wildan A.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'Created API key', 'Created API key', 'Configuration', 'Configuration', 'API Keys', 'API Keys', 'API Keys', '103.12.45.67', 'Medium', 'Success', 'ZEGA CLI v2.4', '{"key_name": "ZK42-PROD-RECON", "scopes": ["read", "write", "telemetry"], "created_by": "wildan@zegaai.com"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_102533', 'May 27, 2025 10:25:33 AM', 'sarah.admin@zegaai.com', 'sarah.admin@zegaai.com', 'Sarah Jenkins', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', 'Accessed sensitive data', 'Accessed sensitive data', 'Data Access', 'Data Access', 'Customer Database', 'Customer Database', 'Customer Database', '185.34.21.123', 'High', 'Success', 'PostgreSQL Client 16.2', '{"table": "enterprise_customers", "records_accessed": 1420, "query_type": "SELECT"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_102011', 'May 27, 2025 10:20:11 AM', 'system', 'system', 'System Orchestrator', null, 'Firewall rule updated', 'Firewall rule updated', 'Configuration', 'Configuration', 'Security Center', 'Security Center', 'Security Center', '10.0.0.1', 'Medium', 'Success', 'Automated Security Worker v2.4', '{"rule_id": "fw_9921", "action": "BLOCK_IP", "target_ip": "198.51.100.23", "reason": "DDoS Threat Pattern"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_101807', 'May 27, 2025 10:18:07 AM', 'rendy.dev@zegaai.com', 'rendy.dev@zegaai.com', 'Rendy Dev', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces', 'Failed login attempt', 'Failed login attempt', 'Authentication', 'Authentication', 'Console', 'Console', 'Console', '203.0.113.45', 'High', 'Failed', 'Firefox 126.0 / Linux', '{"failure_reason": "Invalid MFA Token", "attempt_count": 3, "ip": "203.0.113.45"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_101522', 'May 27, 2025 10:15:22 AM', 'api-service', 'api-service', 'API Integration Engine', null, 'Data export completed', 'Data export completed', 'Data Access', 'Data Access', 'Reports Export', 'Reports Export', 'Reports Export', '54.239.28.85', 'Informational', 'Success', 'ZEGA SDK Python v2.4', '{"export_type": "PDF Audit Report", "size_bytes": 14859020, "destination": "S3 Bucket zega-data"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_100541', 'May 27, 2025 10:05:41 AM', 'mfa.system', 'mfa.system', 'MFA Security Engine', null, 'MFA enabled for user', 'MFA enabled for user', 'Security', 'Security', 'User Security', 'User Security', 'User Security', '10.0.0.2', 'Low', 'Success', 'Security Service Worker', '{"user": "cole.coa@zegaai.com", "mfa_method": "TOTP Authenticator App"}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'evt_20250527_100114', 'May 27, 2025 10:01:14 AM', 'security.bot', 'security.bot', 'AI Threat Detector', null, 'Suspicious activity detected', 'Suspicious activity detected', 'Security', 'Security', 'Threat Detection', 'Threat Detection', 'Threat Detection', '198.51.100.23', 'Critical', 'Success', 'ZEGA AI Safety Sentinel v2.4', '{"threat_type": "SQL Injection Attempt", "endpoint": "/api/v1/query", "mitigation": "Automated Geo-Fence Block"}'::jsonb)
ON CONFLICT DO NOTHING;
