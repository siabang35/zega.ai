-- ============================================================================
-- MIGRATION 18: Enterprise Integrations Hub Real-time, CDN & Sub-page Configuration
-- Complete schema for Enterprise Integrations, Categories, Activities, Configs, Metrics, and RLS
-- ============================================================================

-- 1. Table for Enterprise Integrations
CREATE TABLE IF NOT EXISTS public.enterprise_integrations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'connected',
  environment VARCHAR(32) NOT NULL DEFAULT 'Production',
  uptime_str VARCHAR(32) NOT NULL DEFAULT '99.98% uptime',
  latency_ms INT NOT NULL DEFAULT 120,
  latency_str VARCHAR(32) NOT NULL DEFAULT '120ms',
  logo_url VARCHAR(256) NOT NULL,
  description TEXT,
  api_endpoint VARCHAR(256),
  health_status VARCHAR(32) NOT NULL DEFAULT 'healthy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for Enterprise Integration Categories Breakdown
CREATE TABLE IF NOT EXISTS public.enterprise_integration_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  count INT NOT NULL DEFAULT 0,
  growth_str VARCHAR(32) DEFAULT '+0',
  color_hex VARCHAR(16) NOT NULL DEFAULT '#6366F1'
);

-- 3. Table for Enterprise Integration Activity Stream
CREATE TABLE IF NOT EXISTS public.enterprise_integration_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(64) REFERENCES public.enterprise_integrations(id) ON DELETE CASCADE,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table for Enterprise Integration Configurations & Webhooks
CREATE TABLE IF NOT EXISTS public.enterprise_integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(64) REFERENCES public.enterprise_integrations(id) ON DELETE CASCADE,
  environment VARCHAR(32) NOT NULL DEFAULT 'Production',
  api_key_masked VARCHAR(64),
  webhook_url VARCHAR(256),
  timeout_ms INT NOT NULL DEFAULT 5000,
  retry_count INT NOT NULL DEFAULT 3,
  rate_limit_per_min INT NOT NULL DEFAULT 1000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table for Enterprise Integration High-level Telemetry Metrics
CREATE TABLE IF NOT EXISTS public.enterprise_integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_integrations INT NOT NULL DEFAULT 58,
  connected_count INT NOT NULL DEFAULT 48,
  healthy_count INT NOT NULL DEFAULT 46,
  warning_count INT NOT NULL DEFAULT 2,
  error_count INT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (OWASP Level 3)
ALTER TABLE public.enterprise_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_integration_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_integration_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_integration_metrics ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policy Guards
DROP POLICY IF EXISTS "Public Read Enterprise Integrations" ON public.enterprise_integrations;
CREATE POLICY "Public Read Enterprise Integrations" ON public.enterprise_integrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Integration Categories" ON public.enterprise_integration_categories;
CREATE POLICY "Public Read Integration Categories" ON public.enterprise_integration_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Integration Activities" ON public.enterprise_integration_activities;
CREATE POLICY "Public Read Integration Activities" ON public.enterprise_integration_activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Integration Configs" ON public.enterprise_integration_configs;
CREATE POLICY "Public Read Integration Configs" ON public.enterprise_integration_configs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Integration Metrics" ON public.enterprise_integration_metrics;
CREATE POLICY "Public Read Integration Metrics" ON public.enterprise_integration_metrics FOR SELECT USING (true);

-- Enable Supabase Realtime Publication for Integrations & Telemetry (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_integrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_integrations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_integration_activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_integration_activities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_integration_configs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_integration_configs;
  END IF;
END $$;

-- Seed Data: Initial 15 Enterprise Integrations
INSERT INTO public.enterprise_integrations 
  (id, name, category, status, environment, uptime_str, latency_ms, latency_str, logo_url, description, api_endpoint, health_status)
VALUES
  ('supabase', 'Supabase', 'Databases', 'connected', 'Production', '99.99% uptime', 120, '120ms', 'https://cdn.zegaai.site/assets/logo/supabase.png', 'Postgres Database & Vector Store', 'https://db.zega.supabase.co', 'healthy'),
  ('stripe', 'Stripe', 'Payments', 'connected', 'Production', '99.98% uptime', 132, '132ms', 'https://cdn.zegaai.site/assets/visualization/stripe.webp', 'Payment Gateway & Metered Billing', 'https://api.stripe.com/v1', 'healthy'),
  ('slack', 'Slack', 'Communication', 'connected', 'Production', '99.95% uptime', 95, '95ms', 'https://cdn.zegaai.site/assets/visualization/slack.webp', 'Enterprise Workspace Notifications', 'https://slack.com/api', 'healthy'),
  ('whatsapp', 'WhatsApp Business', 'Communication', 'connected', 'Production', '99.90% uptime', 105, '105ms', 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp', 'WhatsApp Cloud API Messenger', 'https://graph.facebook.com/v18.0', 'healthy'),
  ('telegram', 'Telegram Bot', 'Communication', 'connected', 'Production', '99.98% uptime', 65, '65ms', 'https://cdn.zegaai.site/assets/logo/telegram.webp', 'Telegram Agent Notification Bot', 'https://api.telegram.org/bot', 'healthy'),
  ('google_workspace', 'Google Workspace', 'Productivity', 'connected', 'Production', '99.99% uptime', 80, '80ms', 'https://cdn.zegaai.site/assets/logo/google_drive.png', 'Google Drive, Gmail & Calendar API', 'https://www.googleapis.com', 'healthy'),
  ('hubspot', 'HubSpot', 'CRM', 'connected', 'Production', '99.92% uptime', 140, '140ms', 'https://cdn.zegaai.site/assets/logo/hubspot.png', 'HubSpot Enterprise CRM & Deals', 'https://api.hubapi.com', 'healthy'),
  ('salesforce', 'Salesforce', 'CRM', 'connected', 'Production', '99.92% uptime', 155, '155ms', 'https://cdn.zegaai.site/assets/logo/salesforce.jpeg', 'Salesforce Enterprise Cloud', 'https://yourinstance.salesforce.com', 'healthy'),
  ('github', 'GitHub', 'DevOps', 'connected', 'Production', '99.94% uptime', 90, '90ms', 'https://cdn.zegaai.site/assets/logo/github.svg', 'GitHub CI/CD & Repository Webhooks', 'https://api.github.com', 'healthy'),
  ('cloudflare', 'Cloudflare', 'DevOps', 'connected', 'Production', '100% uptime', 36, '36ms', 'https://cdn.zegaai.site/assets/logo/Cloudflare_Logo.png', 'Cloudflare Edge CDN & DNS', 'https://api.cloudflare.com/client/v4', 'healthy'),
  ('aws_s3', 'AWS S3', 'Storage', 'connected', 'Production', '99.99% uptime', 78, '78ms', 'https://cdn.zegaai.site/assets/logo/aws_s3.webp', 'Amazon S3 Object Storage', 'https://s3.amazonaws.com', 'healthy'),
  ('sendgrid', 'SendGrid', 'Communication', 'connected', 'Production', '99.90% uptime', 110, '110ms', 'https://cdn.zegaai.site/assets/logo/sendgrid.webp', 'SendGrid Transactional Mail API', 'https://api.sendgrid.com/v3', 'healthy'),
  ('notion', 'Notion', 'Productivity', 'connected', 'Production', '99.90% uptime', 95, '95ms', 'https://cdn.zegaai.site/assets/logo/notion.png', 'Notion Knowledge Base Integration', 'https://api.notion.com/v1', 'healthy'),
  ('mongodb', 'MongoDB', 'Databases', 'connected', 'Production', '99.97% uptime', 123, '123ms', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', 'MongoDB Atlas Document Store', 'https://data.mongodb-api.com', 'healthy'),
  ('redis_cloud', 'Redis Cloud', 'Databases', 'connected', 'Production', '99.96% uptime', 81, '81ms', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg', 'Redis Enterprise In-Memory Cache', 'https://redis-cloud.zega.ai', 'healthy')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- Seed Data: Initial Categories Breakdown
INSERT INTO public.enterprise_integration_categories (id, name, count, growth_str, color_hex) VALUES
  ('databases', 'Databases', 12, '+2', '#6366F1'),
  ('communication', 'Communication', 10, '+1', '#10B981'),
  ('storage', 'Storage', 8, '+3', '#F59E0B'),
  ('crm', 'CRM', 8, '+1', '#A855F7'),
  ('devops', 'DevOps', 7, '+0', '#06B6D4'),
  ('aiml', 'AI/ML', 6, '+2', '#EC4899')
ON CONFLICT (id) DO NOTHING;

-- Seed Data: High-level Metrics Summary
INSERT INTO public.enterprise_integration_metrics (total_integrations, connected_count, healthy_count, warning_count, error_count)
VALUES (58, 48, 46, 2, 0);

-- Seed Data: Initial Activities Log
INSERT INTO public.enterprise_integration_activities (integration_id, title, description, status) VALUES
  ('stripe', 'Stripe Integration updated', 'Credentials refreshed successfully', 'success'),
  ('hubspot', 'HubSpot Webhook enabled', 'New deal webhook connected', 'success'),
  ('slack', 'Slack connection reauthorized', 'OAuth Token refreshed', 'warning'),
  ('google_workspace', 'Google Drive connected', 'Drive sync enabled for AI workforce', 'success');
