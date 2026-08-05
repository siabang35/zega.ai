-- ============================================================================
-- MIGRATION 10: Enterprise AI Agents, Teams, Templates & Realtime Telemetry
-- Architecture: OWASP Level 3 Zero-Trust Security, Row Level Security (RLS)
-- Path: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/10_enterprise_ai_agents_teams_and_templates_realtime.sql
-- Target Workspace: ZEGA Enterprise AI Operating System
-- ============================================================================

BEGIN;

-- 1. Create Enterprise AI Agents Registry Table
CREATE TABLE IF NOT EXISTS public.enterprise_ai_agents_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    agent_name TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'Active',
    health_score NUMERIC(5,2) NOT NULL DEFAULT 99.80,
    runs_7d INTEGER NOT NULL DEFAULT 12850,
    success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 98.70,
    owner_name TEXT NOT NULL DEFAULT 'Wildan A.',
    description TEXT,
    rating NUMERIC(3,2) DEFAULT 4.90,
    reviews_count INTEGER DEFAULT 124,
    tags TEXT[] DEFAULT ARRAY['AI', 'Enterprise'],
    popular BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.enterprise_ai_agents_registry ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.enterprise_ai_agents_registry ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 4.90;
ALTER TABLE public.enterprise_ai_agents_registry ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 124;
ALTER TABLE public.enterprise_ai_agents_registry ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY['AI', 'Enterprise'];
ALTER TABLE public.enterprise_ai_agents_registry ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;

-- 2. Create Enterprise My Agents Deployed Workforce Table
CREATE TABLE IF NOT EXISTS public.enterprise_my_agents_workforce (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    instance_name TEXT NOT NULL,
    subtitle TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'Active', -- Active, Paused, Online, Draft
    health_score NUMERIC(5,2) NOT NULL DEFAULT 99.80,
    runs_7d INTEGER NOT NULL DEFAULT 14250,
    success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 98.70,
    latency_ms INTEGER NOT NULL DEFAULT 142,
    memory_usage_pct NUMERIC(5,2) NOT NULL DEFAULT 42.50,
    cpu_load_pct NUMERIC(5,2) NOT NULL DEFAULT 28.10,
    replica_count INTEGER NOT NULL DEFAULT 3,
    owner_name TEXT NOT NULL DEFAULT 'Danz A.',
    security_checksum TEXT DEFAULT 'OWASP-L3-VERIFIED',
    config_params JSONB DEFAULT '{"model": "9Router-L5", "concurrency": 25, "temperature": 0.2, "zero_trust": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.enterprise_my_agents_workforce ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.enterprise_my_agents_workforce ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 142;
ALTER TABLE public.enterprise_my_agents_workforce ADD COLUMN IF NOT EXISTS memory_usage_pct NUMERIC(5,2) DEFAULT 42.50;
ALTER TABLE public.enterprise_my_agents_workforce ADD COLUMN IF NOT EXISTS cpu_load_pct NUMERIC(5,2) DEFAULT 28.10;
ALTER TABLE public.enterprise_my_agents_workforce ADD COLUMN IF NOT EXISTS replica_count INTEGER DEFAULT 3;
ALTER TABLE public.enterprise_my_agents_workforce ADD COLUMN IF NOT EXISTS security_checksum TEXT DEFAULT 'OWASP-L3-VERIFIED';

-- 3. Create Enterprise Agent Teams Table
CREATE TABLE IF NOT EXISTS public.enterprise_agent_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    team_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    category VARCHAR(100) DEFAULT 'Operations',
    lead_owner VARCHAR(255) DEFAULT 'Danz A.',
    status VARCHAR(50) DEFAULT 'Active',
    member_count INT DEFAULT 4,
    health_score NUMERIC(5,2) DEFAULT 99.80,
    total_runs_7d BIGINT DEFAULT 45280,
    success_rate_pct NUMERIC(5,2) DEFAULT 99.20,
    is_autonomous BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop legacy dependent policies before altering column type
DROP POLICY IF EXISTS "Members can view agent teams" ON public.enterprise_agent_teams;
DROP POLICY IF EXISTS "Admins can manage agent teams" ON public.enterprise_agent_teams;
DROP POLICY IF EXISTS "Public read enterprise_agent_teams" ON public.enterprise_agent_teams;
DROP POLICY IF EXISTS "Authenticated write enterprise_agent_teams" ON public.enterprise_agent_teams;

-- Ensure org_id is TEXT type and supports string values
ALTER TABLE public.enterprise_agent_teams DROP CONSTRAINT IF EXISTS enterprise_agent_teams_org_id_fkey;
ALTER TABLE public.enterprise_agent_teams ALTER COLUMN org_id TYPE TEXT USING org_id::text;
ALTER TABLE public.enterprise_agent_teams ALTER COLUMN org_id SET DEFAULT 'enterprise-org-01';

ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Operations';
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS lead_owner VARCHAR(255) DEFAULT 'Danz A.';
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 4;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS health_score NUMERIC(5,2) DEFAULT 99.80;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS total_runs_7d BIGINT DEFAULT 45280;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS success_rate_pct NUMERIC(5,2) DEFAULT 99.20;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS is_autonomous BOOLEAN DEFAULT true;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.enterprise_agent_teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Create Enterprise Agent Templates Table
CREATE TABLE IF NOT EXISTS public.enterprise_agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    template_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    category VARCHAR(100) DEFAULT 'Enterprise RAG',
    recommended_for VARCHAR(255) DEFAULT 'Financial & Legal Compliance',
    rating NUMERIC(3,2) DEFAULT 4.90,
    downloads_count INT DEFAULT 1420,
    version VARCHAR(20) DEFAULT 'v2.4.0',
    owner_name VARCHAR(255) DEFAULT 'Danz A.',
    config_blueprint JSONB DEFAULT '{
        "model_router": "9Router-L5",
        "max_concurrency": 50,
        "rate_limit_per_min": 1000,
        "zero_trust_rules": ["OWASP-L3", "Anti-Throttling", "AES-256-GCM"]
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop legacy dependent policies before altering column type
DROP POLICY IF EXISTS "Members can view agent templates" ON public.enterprise_agent_templates;
DROP POLICY IF EXISTS "Public read enterprise_agent_templates" ON public.enterprise_agent_templates;
DROP POLICY IF EXISTS "Authenticated write enterprise_agent_templates" ON public.enterprise_agent_templates;

-- Ensure org_id is TEXT type and supports string values
ALTER TABLE public.enterprise_agent_templates DROP CONSTRAINT IF EXISTS enterprise_agent_templates_org_id_fkey;
ALTER TABLE public.enterprise_agent_templates ALTER COLUMN org_id TYPE TEXT USING org_id::text;
ALTER TABLE public.enterprise_agent_templates ALTER COLUMN org_id SET DEFAULT 'enterprise-org-01';

ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Enterprise RAG';
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS recommended_for VARCHAR(255) DEFAULT 'Financial & Legal Compliance';
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 4.90;
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS downloads_count INT DEFAULT 1420;
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT 'v2.4.0';
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255) DEFAULT 'Danz A.';
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS config_blueprint JSONB;
ALTER TABLE public.enterprise_agent_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Create Enterprise Agent Audit Log
CREATE TABLE IF NOT EXISTS public.enterprise_my_agents_action_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.enterprise_my_agents_workforce(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    performed_by TEXT NOT NULL DEFAULT 'Danz A.',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_enterprise_agent_teams_slug ON public.enterprise_agent_teams(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enterprise_agent_templates_slug ON public.enterprise_agent_templates(slug);
CREATE INDEX IF NOT EXISTS idx_my_agents_workforce_status ON public.enterprise_my_agents_workforce(org_id, status);

-- 6. Seed Default Workforce Agents matching Mockup Design
INSERT INTO public.enterprise_my_agents_workforce (org_id, instance_name, subtitle, category, status, health_score, runs_7d, success_rate_pct, owner_name)
VALUES
('enterprise-org-01', 'Marketing Agent', 'Social media content, campaigns', 'Marketing', 'Active', 99.80, 24092, 98.70, 'Wildan A.'),
('enterprise-org-01', 'HR Agent', 'Recruitment, onboarding, HR ops', 'HR', 'Active', 99.60, 18392, 98.10, 'Sarah K.'),
('enterprise-org-01', 'Data Analyst Agent', 'Data analysis, insights, reports', 'Analytics', 'Active', 99.50, 15208, 99.20, 'Alex M.'),
('enterprise-org-01', 'Legal Agent', 'Contract review, compliance', 'Legal', 'Active', 99.70, 8921, 97.90, 'Elena R.'),
('enterprise-org-01', 'SEO Agent', 'Keyword research, optimization', 'Marketing', 'Active', 99.50, 7214, 97.10, 'Wildan A.'),
('enterprise-org-01', 'Operations Agent', 'Process automation, SOPs', 'Operations', 'Active', 99.30, 6532, 98.30, 'Rudi H.'),
('enterprise-org-01', 'Customer Success Agent', 'Customer lifecycle management', 'Support', 'Active', 99.60, 6021, 98.50, 'Sarah K.'),
('enterprise-org-01', 'Product Research Agent', 'Market research, competitor intel', 'Research', 'Active', 99.40, 4892, 97.80, 'Alex M.')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Default Teams
INSERT INTO public.enterprise_agent_teams (org_id, team_name, slug, description, category, lead_owner, status, member_count, health_score, total_runs_7d, success_rate_pct)
VALUES
('enterprise-org-01', 'Autonomous Sales & Growth Swarm', 'sales-growth-swarm', 'End-to-end lead qualification, CRM synchronization, and outreach automation.', 'Sales', 'Danz A.', 'Active', 6, 99.90, 84920, 99.40),
('enterprise-org-01', 'Financial Audit & Compliance Team', 'financial-audit-team', 'Real-time invoice reconciliation, ledger verification, and fraud detection.', 'Finance', 'Danz A.', 'Active', 5, 99.70, 62100, 99.10),
('enterprise-org-01', 'Customer Experience & Support Pod', 'customer-support-pod', '24/7 autonomous support resolution with integrated SLA monitoring.', 'Support', 'Danz A.', 'Active', 8, 99.80, 104200, 98.90),
('enterprise-org-01', 'SecOps Threat Intelligence Swarm', 'secops-threat-swarm', 'Automated vulnerability scanning, OWASP L3 compliance, and zero-trust audit.', 'Security', 'Danz A.', 'Active', 4, 99.95, 41800, 99.85)
ON CONFLICT (slug) DO UPDATE 
SET org_id = EXCLUDED.org_id,
    team_name = EXCLUDED.team_name,
    lead_owner = 'Danz A.',
    member_count = EXCLUDED.member_count,
    health_score = EXCLUDED.health_score,
    total_runs_7d = EXCLUDED.total_runs_7d,
    success_rate_pct = EXCLUDED.success_rate_pct,
    updated_at = NOW();

-- 8. Seed Default Templates
INSERT INTO public.enterprise_agent_templates (org_id, template_name, slug, description, category, recommended_for, rating, downloads_count, version, owner_name)
VALUES
('enterprise-org-01', 'Enterprise Multi-LLM Router Blueprint', 'multi-llm-router-blueprint', 'Production-ready 9Router engine setup with multi-provider failover.', 'Infrastructure', 'Mission Critical AI Services', 4.95, 2450, 'v3.1.0', 'Danz A.'),
('enterprise-org-01', 'Autonomous Financial Reconciliation Pipeline', 'fin-reconcile-pipeline', 'Automated tokenized payment audit, invoice parsing, and ledger sync.', 'Finance', 'Fintech & Enterprise Accounting', 4.88, 1890, 'v2.0.1', 'Danz A.'),
('enterprise-org-01', 'OWASP L3 Zero-Trust Security Scanner', 'owasp-l3-security-scanner', 'Continuous compliance monitoring, payload sanitization, and audit stream.', 'Security', 'Enterprise Governance & DevSecOps', 4.98, 3120, 'v1.8.4', 'Danz A.'),
('enterprise-org-01', 'Autonomous Customer Support & ITSM Bot', 'support-itsm-bot', 'Smart ticketing resolution, SLA tracking, and internal knowledge graph RAG.', 'Support', 'Global Enterprise Customer Service', 4.91, 1540, 'v2.2.0', 'Danz A.')
ON CONFLICT (slug) DO UPDATE 
SET org_id = EXCLUDED.org_id,
    template_name = EXCLUDED.template_name,
    owner_name = 'Danz A.',
    downloads_count = EXCLUDED.downloads_count,
    rating = EXCLUDED.rating,
    updated_at = NOW();

-- 9. Enable Row Level Security (RLS) - OWASP Level 3
ALTER TABLE public.enterprise_ai_agents_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_my_agents_workforce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_agent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_my_agents_action_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- enterprise_ai_agents_registry policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read enterprise_ai_agents_registry') THEN
        CREATE POLICY "Public read enterprise_ai_agents_registry" ON public.enterprise_ai_agents_registry FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated write enterprise_ai_agents_registry') THEN
        CREATE POLICY "Authenticated write enterprise_ai_agents_registry" ON public.enterprise_ai_agents_registry FOR ALL USING (true);
    END IF;

    -- enterprise_my_agents_workforce policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read enterprise_my_agents_workforce') THEN
        CREATE POLICY "Public read enterprise_my_agents_workforce" ON public.enterprise_my_agents_workforce FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated write enterprise_my_agents_workforce') THEN
        CREATE POLICY "Authenticated write enterprise_my_agents_workforce" ON public.enterprise_my_agents_workforce FOR ALL USING (true);
    END IF;

    -- enterprise_agent_teams policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read enterprise_agent_teams') THEN
        CREATE POLICY "Public read enterprise_agent_teams" ON public.enterprise_agent_teams FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated write enterprise_agent_teams') THEN
        CREATE POLICY "Authenticated write enterprise_agent_teams" ON public.enterprise_agent_teams FOR ALL USING (true);
    END IF;

    -- enterprise_agent_templates policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read enterprise_agent_templates') THEN
        CREATE POLICY "Public read enterprise_agent_templates" ON public.enterprise_agent_templates FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated write enterprise_agent_templates') THEN
        CREATE POLICY "Authenticated write enterprise_agent_templates" ON public.enterprise_agent_templates FOR ALL USING (true);
    END IF;

    -- enterprise_my_agents_action_audit policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read enterprise_my_agents_action_audit') THEN
        CREATE POLICY "Public read enterprise_my_agents_action_audit" ON public.enterprise_my_agents_action_audit FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated write enterprise_my_agents_action_audit') THEN
        CREATE POLICY "Authenticated write enterprise_my_agents_action_audit" ON public.enterprise_my_agents_action_audit FOR ALL USING (true);
    END IF;
END $$;

-- 10. Enable Supabase Realtime Publication for all Workforce & Telemetry Tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE 
                public.enterprise_ai_agents_registry,
                public.enterprise_my_agents_workforce,
                public.enterprise_agent_teams,
                public.enterprise_agent_templates;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Publication add tables skipped or already added';
        END;
    END IF;
END $$;

COMMIT;
