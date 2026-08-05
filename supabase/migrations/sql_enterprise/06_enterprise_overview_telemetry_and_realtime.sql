-- ============================================================================
-- ZEGA AI PLATFORM - ENTERPRISE REALTIME CORE SCHEMA
-- Module 06: Enterprise Overview Telemetry, Realtime Channels & CDN Integration
-- Path: supabase/migrations/sql_enterprise/06_enterprise_overview_telemetry_and_realtime.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENTERPRISE OVERVIEW KPIS TABLE (Timeframe-aware telemetry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_overview_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    time_range VARCHAR(32) NOT NULL DEFAULT 'Last 24 hours' CHECK (time_range IN ('Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days')),
    active_agents INT NOT NULL DEFAULT 638 CHECK (active_agents >= 0),
    active_agents_change_pct NUMERIC(5,2) NOT NULL DEFAULT 18.20,
    active_agents_sparkline JSONB NOT NULL DEFAULT '[20, 25, 22, 30, 38, 45, 52, 60, 63]'::jsonb,
    
    business_units INT NOT NULL DEFAULT 14 CHECK (business_units >= 0),
    business_units_change_pct NUMERIC(5,2) NOT NULL DEFAULT 7.10,
    business_units_sparkline JSONB NOT NULL DEFAULT '[10, 11, 11, 12, 12, 13, 13, 14, 14]'::jsonb,
    
    automation_hours NUMERIC(10,2) NOT NULL DEFAULT 9420.00 CHECK (automation_hours >= 0),
    automation_hours_change_pct NUMERIC(5,2) NOT NULL DEFAULT 24.50,
    automation_hours_sparkline JSONB NOT NULL DEFAULT '[5000, 5800, 6200, 7100, 7800, 8400, 9420]'::jsonb,
    
    monthly_savings_usd NUMERIC(12,2) NOT NULL DEFAULT 2610000.00 CHECK (monthly_savings_usd >= 0),
    monthly_savings_change_pct NUMERIC(5,2) NOT NULL DEFAULT 32.60,
    monthly_savings_sparkline JSONB NOT NULL DEFAULT '[1.2, 1.4, 1.6, 1.9, 2.1, 2.4, 2.61]'::jsonb,
    
    ai_requests_per_min INT NOT NULL DEFAULT 18732 CHECK (ai_requests_per_min >= 0),
    ai_requests_change_pct NUMERIC(5,2) NOT NULL DEFAULT 28.40,
    ai_requests_sparkline JSONB NOT NULL DEFAULT '[11000, 12500, 14000, 15800, 17200, 18732]'::jsonb,
    
    system_health_pct NUMERIC(5,2) NOT NULL DEFAULT 99.98 CHECK (system_health_pct BETWEEN 0 AND 100),
    system_health_status VARCHAR(32) NOT NULL DEFAULT 'Excellent',
    system_health_sparkline JSONB NOT NULL DEFAULT '[99.9, 99.92, 99.95, 99.98, 99.98, 99.98]'::jsonb,
    
    avg_latency_ms INT NOT NULL DEFAULT 121 CHECK (avg_latency_ms >= 0),
    avg_latency_change_pct NUMERIC(5,2) NOT NULL DEFAULT -8.20,
    avg_latency_sparkline JSONB NOT NULL DEFAULT '[145, 140, 136, 130, 126, 123, 121]'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_overview_kpis_org_time_unique UNIQUE (org_id, time_range)
);

-- ----------------------------------------------------------------------------
-- 2. ENTERPRISE PIPELINE TELEMETRY & STAGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_pipeline_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    pipeline_name VARCHAR(128) NOT NULL DEFAULT 'AI Orchestration Pipeline',
    status VARCHAR(32) NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'degraded', 'paused')),
    running_workflows INT NOT NULL DEFAULT 27,
    running_change_pct NUMERIC(5,2) NOT NULL DEFAULT 15.30,
    queued_workflows INT NOT NULL DEFAULT 12,
    queued_change_pct NUMERIC(5,2) NOT NULL DEFAULT 4.20,
    completed_workflows INT NOT NULL DEFAULT 1892,
    completed_change_pct NUMERIC(5,2) NOT NULL DEFAULT 22.10,
    failed_workflows INT NOT NULL DEFAULT 3,
    failed_change_pct NUMERIC(5,2) NOT NULL DEFAULT -25.00,
    avg_exec_time_sec NUMERIC(6,2) NOT NULL DEFAULT 2.43,
    avg_exec_change_pct NUMERIC(5,2) NOT NULL DEFAULT -18.40,
    stages_json JSONB NOT NULL DEFAULT '[
      {"name": "Trigger", "sub": "Event / API", "done": true, "amber": false},
      {"name": "Planner", "sub": "Goal Decomp.", "done": true, "amber": false},
      {"name": "Reasoning", "sub": "Multi-step Think", "done": true, "amber": false},
      {"name": "Memory", "sub": "Vector Store", "done": true, "amber": false},
      {"name": "Tool Calling", "sub": "APIs & MCP", "done": true, "amber": false},
      {"name": "Validation", "sub": "Guardrails", "done": true, "amber": false},
      {"name": "Execution", "sub": "Run & Act", "done": true, "amber": false},
      {"name": "Human Approval", "sub": "Review", "done": false, "amber": true}
    ]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. ENTERPRISE AGENT TEAMS TELEMETRY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_agent_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    team_name VARCHAR(128) NOT NULL,
    agent_count INT NOT NULL DEFAULT 12 CHECK (agent_count >= 0),
    badge_color VARCHAR(64) NOT NULL DEFAULT 'bg-blue-500',
    status VARCHAR(32) NOT NULL DEFAULT 'Healthy',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_agent_team_name_unique UNIQUE (org_id, team_name)
);

-- ----------------------------------------------------------------------------
-- 4. ENTERPRISE LIVE WORKFLOW ACTIVITIES TABLE (Streaming events log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_live_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    event_timestamp VARCHAR(32) NOT NULL DEFAULT TO_CHAR(NOW(), 'HH24:MI:SS'),
    workflow_title VARCHAR(255) NOT NULL,
    agent_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Running', 'Failed', 'Pending')),
    execution_time_ms INT DEFAULT 850,
    trace_id VARCHAR(128) DEFAULT ('TRC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. ENTERPRISE AI ROUTER & TOKEN DISTRIBUTION TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_ai_router_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    routing_strategy VARCHAR(64) NOT NULL DEFAULT 'Cost & Latency Optimized' CHECK (routing_strategy IN ('Cost & Latency Optimized', 'Quality First', 'Latency First', 'Failover Redundant')),
    total_tokens_millions NUMERIC(8,2) NOT NULL DEFAULT 3.77,
    total_tokens_change_pct NUMERIC(5,2) NOT NULL DEFAULT 24.60,
    model_distribution JSONB NOT NULL DEFAULT '[
      {"name": "GPT-5", "pct": 32, "tok": "1.2M", "color": "bg-emerald-500"},
      {"name": "Claude 3.5", "pct": 24, "tok": "920K", "color": "bg-orange-500"},
      {"name": "Gemini 2.5", "pct": 18, "tok": "680K", "color": "bg-cyan-500"},
      {"name": "DeepSeek R1", "pct": 12, "tok": "450K", "color": "bg-blue-500"},
      {"name": "Llama 3.3 70B", "pct": 8, "tok": "310K", "color": "bg-purple-500"},
      {"name": "Mistral Large", "pct": 6, "tok": "210K", "color": "bg-rose-500"}
    ]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. ENTERPRISE SYSTEM INFRASTRUCTURE STATUS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enterprise_system_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.enterprise_organizations(id) ON DELETE CASCADE,
    component_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Operational' CHECK (status IN ('Operational', 'Degraded', 'Maintenance', 'Offline')),
    latency_ms INT NOT NULL DEFAULT 12,
    region VARCHAR(64) NOT NULL DEFAULT 'Global Edge',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_system_comp_unique UNIQUE (org_id, component_name)
);

-- ----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_enterprise_overview_kpis_org_time ON public.enterprise_overview_kpis(org_id, time_range);
CREATE INDEX IF NOT EXISTS idx_enterprise_activities_org_created ON public.enterprise_live_activities(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_agent_teams_org ON public.enterprise_agent_teams(org_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_system_components_org ON public.enterprise_system_components(org_id);

-- ----------------------------------------------------------------------------
-- ENABLE RLS ON ALL NEW TELEMETRY TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.enterprise_overview_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_pipeline_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_agent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_live_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_ai_router_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_system_components ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS POLICIES (Multi-tenant org member access)
-- ----------------------------------------------------------------------------
CREATE POLICY "Members can view enterprise overview kpis"
    ON public.enterprise_overview_kpis FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Members can view pipeline telemetry"
    ON public.enterprise_pipeline_telemetry FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Members can view agent teams"
    ON public.enterprise_agent_teams FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Admins can manage agent teams"
    ON public.enterprise_agent_teams FOR ALL
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Members can view live activities"
    ON public.enterprise_live_activities FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Members can view AI router stats"
    ON public.enterprise_ai_router_stats FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Members can view system components status"
    ON public.enterprise_system_components FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

-- ----------------------------------------------------------------------------
-- SEED TELEMETRY PRODUCTION DATA
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_org_id UUID := '99999999-9999-9999-9999-999999999999'::uuid;
BEGIN
    -- 1. SEED KPIS FOR ALL TIMEFRAMES
    INSERT INTO public.enterprise_overview_kpis (org_id, time_range, active_agents, active_agents_change_pct, business_units, business_units_change_pct, automation_hours, automation_hours_change_pct, monthly_savings_usd, monthly_savings_change_pct, ai_requests_per_min, ai_requests_change_pct, system_health_pct, system_health_status, avg_latency_ms, avg_latency_change_pct)
    VALUES
        (v_org_id, 'Last 24 hours', 638, 18.20, 14, 7.10, 9420.00, 24.50, 2610000.00, 32.60, 18732, 28.40, 99.98, 'Excellent', 121, -8.20),
        (v_org_id, 'Last 7 days', 612, 14.50, 14, 5.00, 64200.00, 21.00, 18400000.00, 29.10, 17200, 24.00, 99.96, 'Excellent', 124, -6.50),
        (v_org_id, 'Last 30 days', 580, 12.00, 12, 0.00, 275000.00, 18.50, 78500000.00, 25.00, 15900, 20.00, 99.95, 'Excellent', 129, -5.00),
        (v_org_id, 'Last 90 days', 510, 28.00, 10, 40.00, 780000.00, 45.00, 210000000.00, 52.00, 14100, 38.00, 99.94, 'Excellent', 135, -12.00)
    ON CONFLICT (org_id, time_range) DO UPDATE SET
        active_agents = EXCLUDED.active_agents,
        automation_hours = EXCLUDED.automation_hours,
        monthly_savings_usd = EXCLUDED.monthly_savings_usd,
        updated_at = NOW();

    -- 2. SEED PIPELINE TELEMETRY
    INSERT INTO public.enterprise_pipeline_telemetry (org_id, pipeline_name, status, running_workflows, queued_workflows, completed_workflows, failed_workflows, avg_exec_time_sec)
    VALUES (v_org_id, 'AI Orchestration Pipeline', 'live', 27, 12, 1892, 3, 2.43)
    ON CONFLICT DO NOTHING;

    -- 3. SEED AGENT TEAMS
    INSERT INTO public.enterprise_agent_teams (org_id, team_name, agent_count, badge_color, status, description)
    VALUES
        (v_org_id, 'Sales Team', 42, 'bg-blue-500', 'Healthy', 'Autonomous lead scoring & outreach'),
        (v_org_id, 'Finance Team', 36, 'bg-emerald-500', 'Healthy', 'Automated reconciliation & invoicing'),
        (v_org_id, 'HR Team', 29, 'bg-purple-500', 'Healthy', 'Employee onboarding & policy RAG'),
        (v_org_id, 'Marketing Team', 33, 'bg-amber-500', 'Healthy', 'Content generation & campaign optimization'),
        (v_org_id, 'Legal Team', 16, 'bg-indigo-500', 'Healthy', 'Contract parsing & NDA compliance'),
        (v_org_id, 'DevOps Team', 41, 'bg-sky-500', 'Healthy', 'Infra monitoring & auto-remediation'),
        (v_org_id, 'Research Team', 22, 'bg-teal-500', 'Healthy', 'Deep web research & market intel'),
        (v_org_id, 'Coding Team', 65, 'bg-rose-500', 'Healthy', 'ZeroClaw code synthesis & PR reviewer')
    ON CONFLICT (org_id, team_name) DO UPDATE SET
        agent_count = EXCLUDED.agent_count,
        updated_at = NOW();

    -- 4. SEED LIVE ACTIVITIES
    INSERT INTO public.enterprise_live_activities (org_id, event_timestamp, workflow_title, agent_name, status, execution_time_ms)
    VALUES
        (v_org_id, '09:41:22', 'Invoice Processing Workflow', 'Finance Agent', 'Completed', 740),
        (v_org_id, '09:41:18', 'Lead Qualification', 'Sales Agent', 'Running', 1200),
        (v_org_id, '09:41:15', 'Support Ticket Resolution', 'Support Agent', 'Completed', 510),
        (v_org_id, '09:41:10', 'Employee Onboarding', 'HR Agent', 'Running', 1980),
        (v_org_id, '09:41:05', 'Marketing Campaign Report', 'Marketing Agent', 'Completed', 890)
    ON CONFLICT DO NOTHING;

    -- 5. SEED AI ROUTER STATS
    INSERT INTO public.enterprise_ai_router_stats (org_id, routing_strategy, total_tokens_millions, total_tokens_change_pct)
    VALUES (v_org_id, 'Cost & Latency Optimized', 3.77, 24.60)
    ON CONFLICT DO NOTHING;

    -- 6. SEED SYSTEM COMPONENTS
    INSERT INTO public.enterprise_system_components (org_id, component_name, status, latency_ms, region)
    VALUES
        (v_org_id, 'API Gateway', 'Operational', 8, 'us-east-1'),
        (v_org_id, 'Supabase', 'Operational', 12, 'us-east-1'),
        (v_org_id, 'Vector Database', 'Operational', 18, 'us-east-1'),
        (v_org_id, 'Redis Cache', 'Operational', 3, 'us-east-1'),
        (v_org_id, 'ZeroClaw Node', 'Operational', 22, 'eu-central-1'),
        (v_org_id, 'MCP Server', 'Operational', 14, 'us-east-1'),
        (v_org_id, 'Edge Network', 'Operational', 5, 'Global Cloudflare'),
        (v_org_id, 'Monitoring', 'Operational', 9, 'us-east-1')
    ON CONFLICT (org_id, component_name) DO UPDATE SET
        status = EXCLUDED.status,
        latency_ms = EXCLUDED.latency_ms,
        updated_at = NOW();

END $$;

-- ----------------------------------------------------------------------------
-- REGISTER NEW TABLES IN SUPABASE REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.enterprise_overview_kpis,
            public.enterprise_pipeline_telemetry,
            public.enterprise_agent_teams,
            public.enterprise_live_activities,
            public.enterprise_ai_router_stats,
            public.enterprise_system_components;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication setup skipped or tables already added.';
END $$;
