-- ============================================================================
-- ZEGA AI ENTERPRISE ORCHESTRATOR HUB - REAL-TIME ORGANIZATIONS SCHEMAS (ENTERPRISE EDITION)
-- Migration File: 32_enterprise_organizations_realtime.sql
-- Modules: Organizations Directory, Usage Overview, System Health, Activities, Governance
-- Enterprise Standards: RLS Policies, Defensive Schema Evolution, Realtime Synchronization
-- ============================================================================

-- 1. ENTERPRISE ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR(100) DEFAULT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ',
  name VARCHAR(255) DEFAULT 'Acme Enterprise',
  domain VARCHAR(255) DEFAULT 'acme.com',
  plan VARCHAR(50) DEFAULT 'Enterprise Plan',
  status VARCHAR(20) DEFAULT 'Active', -- Active, Pending, Inactive
  members_count INT DEFAULT 15,
  projects_count INT DEFAULT 8,
  api_calls_count BIGINT DEFAULT 1240000,
  storage_used_bytes BIGINT DEFAULT 88473600000, -- ~82.4 GB
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_date_label VARCHAR(50) DEFAULT 'Jan 10, 2025',
  description TEXT DEFAULT 'Leading enterprise in AI-powered solutions',
  owner_name VARCHAR(255) DEFAULT 'Danz Assydiq',
  owner_email VARCHAR(255) DEFAULT 'danz@acme.com',
  owner_avatar VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  environment VARCHAR(50) DEFAULT 'Production',
  api_call_limit BIGINT DEFAULT 2000000,
  storage_limit_bytes BIGINT DEFAULT 1099511627776, -- 1 TB
  member_limit INT DEFAULT 100,
  project_limit INT DEFAULT 20,
  metadata JSONB DEFAULT '{"region": "us-east-1", "sso_enabled": true, "scim_enabled": true}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE COLUMN PROVISIONS & CONSTRAINT RELAXATION FOR PRE-EXISTING TABLES
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS org_id VARCHAR(100) DEFAULT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Acme Enterprise';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS domain VARCHAR(255) DEFAULT 'acme.com';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'Enterprise Plan';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 15;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS projects_count INT DEFAULT 8;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS api_calls_count BIGINT DEFAULT 1240000;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 88473600000;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS created_date_label VARCHAR(50) DEFAULT 'Jan 10, 2025';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Leading enterprise in AI-powered solutions';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255) DEFAULT 'Danz Assydiq';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255) DEFAULT 'danz@acme.com';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS owner_avatar VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'Production';
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS api_call_limit BIGINT DEFAULT 2000000;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 1099511627776;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS member_limit INT DEFAULT 100;
ALTER TABLE public.enterprise_organizations ADD COLUMN IF NOT EXISTS project_limit INT DEFAULT 20;

-- RELAX ALL LEGACY NOT-NULL CONSTRAINTS FOR COMPATIBILITY
ALTER TABLE public.enterprise_organizations ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.enterprise_organizations ALTER COLUMN domain DROP NOT NULL;
ALTER TABLE public.enterprise_organizations ALTER COLUMN org_id DROP NOT NULL;

-- SAFELY DROP LEGACY NOT-NULL CONSTRAINTS FROM 01_enterprise_core_tables.sql
DO $$
BEGIN
  ALTER TABLE public.enterprise_organizations ALTER COLUMN plan_tier DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.enterprise_organizations ALTER COLUMN sso_enabled DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.enterprise_organizations ALTER COLUMN max_seats DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.enterprise_organizations ALTER COLUMN allocated_gpu_units DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.enterprise_organizations ALTER COLUMN region DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- SAFELY ENSURE UNIQUE CONSTRAINTS (PREVENTS 42P10 CONFLICT ERRORS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enterprise_organizations_org_id_key'
  ) THEN
    ALTER TABLE public.enterprise_organizations ADD CONSTRAINT enterprise_organizations_org_id_key UNIQUE (org_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. ENTERPRISE ORGANIZATION ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_organization_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR(100) DEFAULT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ',
  activity_text TEXT DEFAULT 'Organization settings updated',
  actor_name VARCHAR(255) DEFAULT 'System Administrator',
  actor_email VARCHAR(255) DEFAULT 'system',
  time_label VARCHAR(100) DEFAULT 'May 27, 2025 09:15 AM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEFENSIVE PROVISIONS FOR ACTIVITIES TABLE
ALTER TABLE public.enterprise_organization_activities ADD COLUMN IF NOT EXISTS org_id VARCHAR(100) DEFAULT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ';
ALTER TABLE public.enterprise_organization_activities ADD COLUMN IF NOT EXISTS activity_text TEXT DEFAULT 'Organization settings updated';
ALTER TABLE public.enterprise_organization_activities ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255) DEFAULT 'System Administrator';
ALTER TABLE public.enterprise_organization_activities ADD COLUMN IF NOT EXISTS actor_email VARCHAR(255) DEFAULT 'system';
ALTER TABLE public.enterprise_organization_activities ADD COLUMN IF NOT EXISTS time_label VARCHAR(100) DEFAULT 'May 27, 2025 09:15 AM';
ALTER TABLE public.enterprise_organization_activities ALTER COLUMN activity_text DROP NOT NULL;

-- 3. ENTERPRISE SYSTEM HEALTH TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_organization_system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) DEFAULT 'Organization Service',
  status VARCHAR(20) DEFAULT 'Operational', -- Operational, Degraded, Outage
  response_time_ms INT DEFAULT 24,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enterprise_organization_system_health_service_name_key'
  ) THEN
    ALTER TABLE public.enterprise_organization_system_health ADD CONSTRAINT enterprise_organization_system_health_service_name_key UNIQUE (service_name);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- HIGH-PERFORMANCE INDEXING
CREATE INDEX IF NOT EXISTS idx_ent_orgs_status ON public.enterprise_organizations(status);
CREATE INDEX IF NOT EXISTS idx_ent_orgs_plan ON public.enterprise_organizations(plan);
CREATE INDEX IF NOT EXISTS idx_ent_org_act_time ON public.enterprise_organization_activities(created_at DESC);

-- RLS POLICIES (IDEMPOTENT PROVISIONS)
ALTER TABLE public.enterprise_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_organization_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_organization_system_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read enterprise_organizations" ON public.enterprise_organizations;
DROP POLICY IF EXISTS "Allow public insert enterprise_organizations" ON public.enterprise_organizations;
DROP POLICY IF EXISTS "Allow public update enterprise_organizations" ON public.enterprise_organizations;
CREATE POLICY "Allow public read enterprise_organizations" ON public.enterprise_organizations FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_organizations" ON public.enterprise_organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update enterprise_organizations" ON public.enterprise_organizations FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_organization_activities" ON public.enterprise_organization_activities;
DROP POLICY IF EXISTS "Allow public insert enterprise_organization_activities" ON public.enterprise_organization_activities;
CREATE POLICY "Allow public read enterprise_organization_activities" ON public.enterprise_organization_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert enterprise_organization_activities" ON public.enterprise_organization_activities FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read enterprise_organization_system_health" ON public.enterprise_organization_system_health;
CREATE POLICY "Allow public read enterprise_organization_system_health" ON public.enterprise_organization_system_health FOR SELECT USING (true);

-- STORED PROCEDURE TO CREATE NEW ORGANIZATION
CREATE OR REPLACE FUNCTION public.fn_create_enterprise_organization(
  p_name VARCHAR,
  p_plan VARCHAR DEFAULT 'Enterprise Plan',
  p_owner_name VARCHAR DEFAULT 'Danz Assydiq',
  p_owner_email VARCHAR DEFAULT 'danz@acme.com',
  p_description TEXT DEFAULT 'Enterprise AI organization'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_org_code VARCHAR(100);
  v_domain VARCHAR(255);
BEGIN
  v_org_code := 'org_' || substr(md5(random()::text), 1, 16);
  v_domain := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g')) || '.com';

  INSERT INTO public.enterprise_organizations (
    org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes,
    created_date_label, description, owner_name, owner_email
  )
  VALUES (
    v_org_code, p_name, v_domain, p_plan, 'Active', 1, 1, 0, 1073741824,
    TO_CHAR(NOW(), 'Mon DD, YYYY'), p_description, p_owner_name, p_owner_email
  )
  RETURNING id INTO v_id;

  INSERT INTO public.enterprise_organization_activities (
    org_id, activity_text, actor_name, actor_email, time_label
  )
  VALUES (
    v_org_code, 'New organization "' || p_name || '" created', p_owner_name, p_owner_email, TO_CHAR(NOW(), 'Mon DD, YYYY HH12:MI AM')
  );

  RETURN v_id;
END;
$$;

-- SAFE SEED INSERTS (WITH DOMAIN COLUMN INCLUDED FOR LEGACY COMPATIBILITY)
INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ', 'Acme Enterprise', 'acme.com', 'Enterprise Plan', 'Active', 15, 8, 1240000, 88473600000, 'Jan 10, 2025', 'Leading enterprise in AI-powered solutions', 'Danz Assydiq', 'danz@acme.com'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ');

INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_02B9PZ8VJ6FK5KYUXA5J2L3M9VY', 'Zega AI Labs', 'zegaai.com', 'Team Plan', 'Active', 12, 3, 542000, 58092765184, 'Feb 18, 2025', 'Core R&D laboratory for generative agent swarms', 'Sarah Connor', 'sarah.admin@zegaai.com'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_02B9PZ8VJ6FK5KYUXA5J2L3M9VY');

INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_03C7QY7UI5EJ4JXTWZ4I1K2L8UX', 'InnovateX Corp', 'innovatex.io', 'Enterprise Plan', 'Active', 28, 7, 864000, 69472649216, 'Mar 03, 2025', 'Global Fintech & Autonomous Workflows', 'Randy Dev', 'randy.dev@innovatex.io'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_03C7QY7UI5EJ4JXTWZ4I1K2L8UX');

INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_04D6RX6TH4DI3IWSVY3H0J1K7TW', 'NextGen Solutions', 'nextgensolutions.com', 'Team Plan', 'Pending', 9, 2, 231000, 13207024435, 'Mar 15, 2025', 'Next-generation cloud AI integration platform', 'Alex Vance', 'alex@nextgensolutions.com'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_04D6RX6TH4DI3IWSVY3H0J1K7TW');

INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_05E5SW5SG3CH2HVRUX2G9I0J6SV', 'DataPilot Analytics', 'datapilot.ai', 'Team Plan', 'Active', 6, 1, 128000, 9341648076, 'Apr 01, 2025', 'Real-time telemetry and vector analytics engine', 'Cole Cox', 'cole.cox@datapilot.ai'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_05E5SW5SG3CH2HVRUX2G9I0J6SV');

INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_06F4TV4RF2BG1GUQTW1F8H9I5RU', 'BuildWithAI Inc', 'buildwithai.com', 'Enterprise Plan', 'Inactive', 16, 4, 421000, 40372692582, 'Apr 12, 2025', 'Autonomous coding and LLM multi-modal solutions', 'Elena Rostova', 'elena@buildwithai.com'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_06F4TV4RF2BG1GUQTW1F8H9I5RU');

INSERT INTO public.enterprise_organizations (org_id, name, domain, plan, status, members_count, projects_count, api_calls_count, storage_used_bytes, created_date_label, description, owner_name, owner_email)
SELECT 'org_07G3UU3QE1AF0FTPSV0E7G8H4QT', 'Stark Industries', 'starkindustries.com', 'Team Plan', 'Inactive', 10, 2, 84000, 6550000000, 'Apr 20, 2025', 'Advanced robotics and cybernetic agent management', 'Tony Stark', 'tony@starkindustries.com'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organizations WHERE org_id = 'org_07G3UU3QE1AF0FTPSV0E7G8H4QT');

INSERT INTO public.enterprise_organization_activities (org_id, activity_text, time_label, actor_email, actor_name)
SELECT 'org_03C7QY7UI5EJ4JXTWZ4I1K2L8UX', 'New organization "InnovateX Corp" created', 'Mar 03, 2025 10:30 AM', 'danz@acme.com', 'Danz Assydiq'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_activities WHERE activity_text = 'New organization "InnovateX Corp" created');

INSERT INTO public.enterprise_organization_activities (org_id, activity_text, time_label, actor_email, actor_name)
SELECT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ', 'Member added to "Acme Enterprise"', 'May 27, 2025 09:15 AM', 'sarah.admin@acme.com', 'Sarah Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_activities WHERE activity_text = 'Member added to "Acme Enterprise"');

INSERT INTO public.enterprise_organization_activities (org_id, activity_text, time_label, actor_email, actor_name)
SELECT 'org_02B9PZ8VJ6FK5KYUXA5J2L3M9VY', 'Plan upgraded for "Zega AI Labs"', 'May 26, 2025 04:45 PM', 'system', 'System Automator'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_activities WHERE activity_text = 'Plan upgraded for "Zega AI Labs"');

INSERT INTO public.enterprise_organization_activities (org_id, activity_text, time_label, actor_email, actor_name)
SELECT 'org_01H8QZ9WJ7GJ6JZVYB6K3M4N0WZ', 'Project "AI Dashboard" created in "Acme Enterprise"', 'May 26, 2025 02:20 PM', 'randy.dev@acme.com', 'Randy Dev'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_activities WHERE activity_text = 'Project "AI Dashboard" created in "Acme Enterprise"');

INSERT INTO public.enterprise_organization_activities (org_id, activity_text, time_label, actor_email, actor_name)
SELECT 'org_04D6RX6TH4DI3IWSVY3H0J1K7TW', 'Member removed from "NextGen Solutions"', 'May 25, 2025 11:10 AM', 'system', 'System Automator'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_activities WHERE activity_text = 'Member removed from "NextGen Solutions"');

INSERT INTO public.enterprise_organization_system_health (service_name, status, response_time_ms)
SELECT 'Organization Service', 'Operational', 18 WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_system_health WHERE service_name = 'Organization Service');

INSERT INTO public.enterprise_organization_system_health (service_name, status, response_time_ms)
SELECT 'Member Service', 'Operational', 22 WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_system_health WHERE service_name = 'Member Service');

INSERT INTO public.enterprise_organization_system_health (service_name, status, response_time_ms)
SELECT 'Project Service', 'Operational', 15 WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_system_health WHERE service_name = 'Project Service');

INSERT INTO public.enterprise_organization_system_health (service_name, status, response_time_ms)
SELECT 'Billing Service', 'Operational', 31 WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_system_health WHERE service_name = 'Billing Service');

INSERT INTO public.enterprise_organization_system_health (service_name, status, response_time_ms)
SELECT 'Usage Service', 'Operational', 19 WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_organization_system_health WHERE service_name = 'Usage Service');

-- SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'publication_enterprise_organizations_realtime') THEN
    CREATE PUBLICATION publication_enterprise_organizations_realtime FOR TABLE
      public.enterprise_organizations,
      public.enterprise_organization_activities,
      public.enterprise_organization_system_health;
  END IF;
END $$;
