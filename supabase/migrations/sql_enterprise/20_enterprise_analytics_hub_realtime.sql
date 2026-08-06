-- Migration 20: Enterprise Analytics & Telemetry Hub Realtime Schema
-- Created for ZEGA Enterprise AI Platform

-- 1. Create KPIs Table
CREATE TABLE IF NOT EXISTS public.enterprise_analytics_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    total_ai_requests TEXT NOT NULL DEFAULT '1.24M',
    total_ai_requests_trend TEXT NOT NULL DEFAULT '+26.4%',
    successful_requests TEXT NOT NULL DEFAULT '1.18M',
    successful_requests_rate TEXT NOT NULL DEFAULT '95.2%',
    successful_requests_trend TEXT NOT NULL DEFAULT '+26.1%',
    total_workflows INT NOT NULL DEFAULT 634,
    total_workflows_trend TEXT NOT NULL DEFAULT '+14.2%',
    active_agents INT NOT NULL DEFAULT 128,
    active_agents_trend TEXT NOT NULL DEFAULT '+18.7%',
    avg_response_time TEXT NOT NULL DEFAULT '2.43s',
    avg_response_time_trend TEXT NOT NULL DEFAULT '-9.1%',
    tokens_processed TEXT NOT NULL DEFAULT '21.6B',
    tokens_processed_trend TEXT NOT NULL DEFAULT '+32.5%',
    time_range TEXT NOT NULL DEFAULT 'Last 7 days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Requests Over Time Table
CREATE TABLE IF NOT EXISTS public.enterprise_analytics_time_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    date_label TEXT NOT NULL,
    total_requests INT NOT NULL DEFAULT 150000,
    successful_requests INT NOT NULL DEFAULT 142000,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Top Agents Ranking Table
CREATE TABLE IF NOT EXISTS public.enterprise_analytics_agent_ranking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    agent_name TEXT NOT NULL UNIQUE,
    requests_str TEXT NOT NULL DEFAULT '245K',
    percentage_str TEXT NOT NULL DEFAULT '19.8%',
    bar_percentage INT NOT NULL DEFAULT 80,
    bar_color TEXT NOT NULL DEFAULT 'indigo',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Channel Distribution Table
CREATE TABLE IF NOT EXISTS public.enterprise_analytics_channel_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    channel_name TEXT NOT NULL UNIQUE,
    percentage_str TEXT NOT NULL DEFAULT '42.4%',
    count_str TEXT NOT NULL DEFAULT '525.7K',
    dot_color TEXT NOT NULL DEFAULT 'indigo',
    stroke_dasharray TEXT NOT NULL DEFAULT '42.4, 100',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Workflow Executions Stacked Table
CREATE TABLE IF NOT EXISTS public.enterprise_analytics_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    day_label TEXT NOT NULL,
    completed_count INT NOT NULL DEFAULT 90,
    failed_count INT NOT NULL DEFAULT 5,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create System Health Table
CREATE TABLE IF NOT EXISTS public.enterprise_analytics_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    component_name TEXT NOT NULL UNIQUE,
    uptime_str TEXT NOT NULL DEFAULT '99.99%',
    status TEXT NOT NULL DEFAULT 'Healthy',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enterprise_analytics_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_analytics_time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_analytics_agent_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_analytics_channel_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_analytics_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_analytics_system_health ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_analytics_kpis') THEN
        CREATE POLICY "Allow select for all enterprise_analytics_kpis" ON public.enterprise_analytics_kpis FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow write for all enterprise_analytics_kpis') THEN
        CREATE POLICY "Allow write for all enterprise_analytics_kpis" ON public.enterprise_analytics_kpis FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_analytics_time_series') THEN
        CREATE POLICY "Allow select for all enterprise_analytics_time_series" ON public.enterprise_analytics_time_series FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_analytics_agent_ranking') THEN
        CREATE POLICY "Allow select for all enterprise_analytics_agent_ranking" ON public.enterprise_analytics_agent_ranking FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_analytics_channel_distribution') THEN
        CREATE POLICY "Allow select for all enterprise_analytics_channel_distribution" ON public.enterprise_analytics_channel_distribution FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_analytics_workflow_executions') THEN
        CREATE POLICY "Allow select for all enterprise_analytics_workflow_executions" ON public.enterprise_analytics_workflow_executions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow select for all enterprise_analytics_system_health') THEN
        CREATE POLICY "Allow select for all enterprise_analytics_system_health" ON public.enterprise_analytics_system_health FOR SELECT USING (true);
    END IF;
END $$;

-- Safe Realtime Publication Registration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_analytics_kpis'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_analytics_kpis;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_analytics_time_series'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_analytics_time_series;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_analytics_system_health'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_analytics_system_health;
    END IF;
END $$;

-- Seed Initial KPIs matching screenshot
INSERT INTO public.enterprise_analytics_kpis (
    org_id, total_ai_requests, total_ai_requests_trend, successful_requests, 
    successful_requests_rate, successful_requests_trend, total_workflows, 
    total_workflows_trend, active_agents, active_agents_trend, avg_response_time, 
    avg_response_time_trend, tokens_processed, tokens_processed_trend
) VALUES (
    '99999999-9999-9999-9999-999999999999', '1.24M', '+26.4%', '1.18M', 
    '95.2%', '+26.1%', 634, 
    '+14.2%', 128, '+18.7%', '2.43s', 
    '-9.1%', '21.6B', '+32.5%'
) ON CONFLICT DO NOTHING;

-- Seed Time Series
INSERT INTO public.enterprise_analytics_time_series (date_label, total_requests, successful_requests, display_order) VALUES
('May 20', 125000, 118000, 1),
('May 21', 135000, 129000, 2),
('May 22', 130000, 122000, 3),
('May 23', 165000, 158000, 4),
('May 24', 150000, 142000, 5),
('May 25', 160000, 153000, 6),
('May 26', 170000, 162000, 7),
('May 27', 185000, 178000, 8)
ON CONFLICT DO NOTHING;

-- Seed Agent Ranking
INSERT INTO public.enterprise_analytics_agent_ranking (agent_name, requests_str, percentage_str, bar_percentage, bar_color, display_order) VALUES
('Sales Agent', '245K', '19.8%', 80, 'indigo', 1),
('Support Agent', '198K', '16.0%', 65, 'indigo-light', 2),
('Finance Agent', '176K', '14.2%', 55, 'purple', 3),
('Research Agent', '153K', '12.3%', 45, 'emerald', 4),
('Marketing Agent', '120K', '10.3%', 38, 'pink', 5)
ON CONFLICT (agent_name) DO NOTHING;

-- Seed Channel Distribution
INSERT INTO public.enterprise_analytics_channel_distribution (channel_name, percentage_str, count_str, dot_color, stroke_dasharray, display_order) VALUES
('Web App', '42.4%', '525.7K', 'indigo', '42.4, 100', 1),
('API', '28.7%', '355.8K', 'blue', '28.7, 100', 2),
('Mobile App', '15.3%', '189.7K', 'purple', '15.3, 100', 3),
('WhatsApp', '7.8%', '96.7K', 'emerald', '7.8, 100', 4),
('Other', '5.8%', '71.9K', 'amber', '5.8, 100', 5)
ON CONFLICT (channel_name) DO NOTHING;

-- Seed System Health
INSERT INTO public.enterprise_analytics_system_health (component_name, uptime_str, status, display_order) VALUES
('API Gateway', '99.99%', 'Healthy', 1),
('Vector Database', '99.98%', 'Healthy', 2),
('Redis Cache', '99.96%', 'Healthy', 3),
('MCP Servers', '99.94%', 'Healthy', 4),
('LLM Providers', '99.90%', 'Healthy', 5)
ON CONFLICT (component_name) DO NOTHING;
