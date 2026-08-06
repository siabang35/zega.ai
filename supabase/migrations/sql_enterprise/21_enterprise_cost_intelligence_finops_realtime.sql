-- ============================================================================
-- ZEGA ENTERPRISE COST INTELLIGENCE & AI FINOPS REALTIME TELEMETRY SCHEMA
-- Migration: 23_enterprise_cost_intelligence_finops_realtime.sql
-- Description: Idempotent schema supporting Cost Intelligence & AI FinOps with seed data for all 11 sub-pages
-- ============================================================================

-- 1. KPI Telemetry Summary Table
CREATE TABLE IF NOT EXISTS public.enterprise_finops_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_spend_may TEXT NOT NULL DEFAULT '$28,430.50',
    total_spend_may_trend TEXT NOT NULL DEFAULT '+14.3%',
    total_spend_may_prev TEXT NOT NULL DEFAULT '$24,835.10',
    ai_model_spend TEXT NOT NULL DEFAULT '$12,430.20',
    ai_model_spend_pct TEXT NOT NULL DEFAULT '43.7%',
    tokens_consumed TEXT NOT NULL DEFAULT '1.82B',
    tokens_consumed_trend TEXT NOT NULL DEFAULT '+18.6%',
    tokens_consumed_prev TEXT NOT NULL DEFAULT '1.53B',
    request_volume TEXT NOT NULL DEFAULT '3.24M',
    request_volume_trend TEXT NOT NULL DEFAULT '+22.1%',
    request_volume_prev TEXT NOT NULL DEFAULT '2.65M',
    avg_cost_per_1k_tokens TEXT NOT NULL DEFAULT '$0.068',
    avg_cost_per_1k_tokens_trend TEXT NOT NULL DEFAULT '-3.7%',
    avg_cost_per_1k_tokens_prev TEXT NOT NULL DEFAULT '$0.071',
    projected_spend_jun TEXT NOT NULL DEFAULT '$29,980',
    projected_spend_jun_trend TEXT NOT NULL DEFAULT '+5.4%',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Spend Trends (May vs Apr)
CREATE TABLE IF NOT EXISTS public.enterprise_finops_spend_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_label TEXT NOT NULL,
    may_spend NUMERIC(10,2) NOT NULL,
    apr_spend NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Category Cost Breakdown
CREATE TABLE IF NOT EXISTS public.enterprise_finops_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL,
    spend NUMERIC(10,2) NOT NULL,
    pct_share TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Top Cost Drivers
CREATE TABLE IF NOT EXISTS public.enterprise_finops_top_cost_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_name TEXT NOT NULL,
    volume_metric TEXT NOT NULL,
    cost TEXT NOT NULL,
    pct_share TEXT NOT NULL,
    bar_color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Top AI Models by Spend
CREATE TABLE IF NOT EXISTS public.enterprise_finops_top_ai_models_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens TEXT NOT NULL,
    requests TEXT NOT NULL,
    spend TEXT NOT NULL,
    pct_share TEXT NOT NULL,
    prompt_price TEXT DEFAULT '$2.50 / 1M',
    completion_price TEXT DEFAULT '$10.00 / 1M',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Budget Overview & Threshold Alerts
CREATE TABLE IF NOT EXISTS public.enterprise_finops_budget_overview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_budget NUMERIC(10,2) NOT NULL DEFAULT 50000.00,
    used_amount NUMERIC(10,2) NOT NULL DEFAULT 28430.50,
    remaining_amount NUMERIC(10,2) NOT NULL DEFAULT 21569.50,
    model_spend_alert_pct INT NOT NULL DEFAULT 83,
    storage_spend_alert_pct INT NOT NULL DEFAULT 65,
    hard_cap_enabled BOOLEAN DEFAULT true,
    email_alerts_enabled BOOLEAN DEFAULT true,
    slack_alerts_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Recent FinOps Cost Alerts
CREATE TABLE IF NOT EXISTS public.enterprise_finops_cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning',
    time_ago TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI FinOps Optimization Recommendations
CREATE TABLE IF NOT EXISTS public.enterprise_finops_cost_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    estimated_savings TEXT NOT NULL,
    impact_level TEXT NOT NULL DEFAULT 'High Impact',
    action_label TEXT NOT NULL DEFAULT 'Apply Rule',
    is_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Usage Analytics Detailed Breakdown
CREATE TABLE IF NOT EXISTS public.enterprise_finops_usage_analytics_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL,
    volume TEXT NOT NULL,
    cost NUMERIC(10,2) NOT NULL,
    growth_rate TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Agent Costs Breakdown
CREATE TABLE IF NOT EXISTS public.enterprise_finops_agent_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    department TEXT NOT NULL,
    invocations INT NOT NULL,
    avg_latency_ms INT NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Workflow Execution Costs
CREATE TABLE IF NOT EXISTS public.enterprise_finops_workflow_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    execution_count INT NOT NULL,
    step_count INT NOT NULL,
    cost_per_exec NUMERIC(10,4) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MCP Tools Cost Breakdown
CREATE TABLE IF NOT EXISTS public.enterprise_finops_mcp_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_tool_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_calls INT NOT NULL,
    latency_p99_ms INT NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Storage Infrastructure Costs
CREATE TABLE IF NOT EXISTS public.enterprise_finops_storage_cost_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_type TEXT NOT NULL,
    allocated_tb NUMERIC(10,2) NOT NULL,
    used_tb NUMERIC(10,2) NOT NULL,
    cost_per_tb NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Forecast Projections
CREATE TABLE IF NOT EXISTS public.enterprise_finops_forecast_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_month TEXT NOT NULL,
    projected_spend NUMERIC(10,2) NOT NULL,
    confidence_interval_low NUMERIC(10,2) NOT NULL,
    confidence_interval_high NUMERIC(10,2) NOT NULL,
    growth_scenario TEXT NOT NULL DEFAULT 'Baseline Enterprise Scale',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEED INITIAL DATA FOR ALL TABLES
-- ============================================================================

-- 1. Seed KPI Summary
INSERT INTO public.enterprise_finops_kpis (
    total_spend_may, total_spend_may_trend, ai_model_spend, ai_model_spend_pct,
    tokens_consumed, tokens_consumed_trend, request_volume, request_volume_trend,
    avg_cost_per_1k_tokens, avg_cost_per_1k_tokens_trend, projected_spend_jun, projected_spend_jun_trend
) VALUES (
    '$28,430.50', '+14.3%', '$12,430.20', '43.7%',
    '1.82B', '+18.6%', '3.24M', '+22.1%',
    '$0.068', '-3.7%', '$29,980', '+5.4%'
) ON CONFLICT DO NOTHING;

-- 2. Seed Daily Trends (May vs Apr)
INSERT INTO public.enterprise_finops_spend_trends (day_label, may_spend, apr_spend) VALUES
('May 1', 720.00, 650.00),
('May 6', 1450.00, 1120.00),
('May 11', 890.00, 1650.00),
('May 16', 1520.00, 1180.00),
('May 21', 1100.00, 1320.00),
('May 26', 1480.00, 1250.00),
('May 31', 1680.00, 1490.00)
ON CONFLICT DO NOTHING;

-- 3. Seed Categories
INSERT INTO public.enterprise_finops_categories (category_name, spend, pct_share, color_hex) VALUES
('LLM & Inference', 12430.20, '43.7%', '#8B5CF6'),
('MCP Calls', 6210.10, '21.8%', '#3B82F6'),
('Storage', 4320.60, '15.2%', '#06B6D4'),
('Data Transfer', 2110.30, '7.4%', '#10B981'),
('Vector Database', 1520.80, '5.4%', '#EAB308'),
('Other Services', 1838.50, '6.5%', '#64748B')
ON CONFLICT DO NOTHING;

-- 4. Seed Top Cost Drivers
INSERT INTO public.enterprise_finops_top_cost_drivers (driver_name, volume_metric, cost, pct_share, bar_color) VALUES
('GPT-4o (OpenAI)', '5.2M tokens', '$9,432.10', '33.2%', 'bg-indigo-600'),
('Claude 3.5', '4.2M tokens', '$3,210.80', '11.3%', 'bg-blue-600'),
('Vector Search (Pinecone)', '15.2M queries', '$4,120.50', '14.5%', 'bg-amber-500'),
('Supabase Database', '2.24 TB storage', '$3,230.90', '11.4%', 'bg-emerald-500'),
('Stripe MCP', '1.0M calls', '$2,110.30', '7.4%', 'bg-purple-600')
ON CONFLICT DO NOTHING;

-- 5. Seed Top AI Models by Spend
INSERT INTO public.enterprise_finops_top_ai_models_spend (model_name, provider, tokens, requests, spend, pct_share, prompt_price, completion_price) VALUES
('GPT-4o', 'OpenAI', '812.4M', '1.42M', '$9,432.10', '33.2%', '$2.50 / 1M', '$10.00 / 1M'),
('Claude 3.5 Sonnet', 'Anthropic', '456.8M', '652K', '$3,210.80', '11.3%', '$3.00 / 1M', '$15.00 / 1M'),
('Gemini 1.5 Pro', 'Google', '312.6M', '482K', '$2,430.60', '8.6%', '$1.25 / 1M', '$5.00 / 1M'),
('Llama 3.1 70B', 'Meta', '198.3M', '356K', '$1,620.50', '5.7%', '$0.50 / 1M', '$0.80 / 1M'),
('Mistral Large 2', 'Mistral AI', '86.5M', '142K', '$832.10', '2.9%', '$2.00 / 1M', '$6.00 / 1M')
ON CONFLICT DO NOTHING;

-- 6. Seed Budget Overview
INSERT INTO public.enterprise_finops_budget_overview (total_budget, used_amount, remaining_amount, model_spend_alert_pct, storage_spend_alert_pct, hard_cap_enabled) VALUES
(50000.00, 28430.50, 21569.50, 83, 65, true)
ON CONFLICT DO NOTHING;

-- 7. Seed Cost Alerts
INSERT INTO public.enterprise_finops_cost_alerts (message, severity, time_ago, is_active) VALUES
('AI Model Spend is above 80% of monthly budget', 'critical', '2m ago', true),
('Spike detected in Vector Search costs (+32%)', 'warning', '15m ago', true),
('Storage cost increased by 18% vs yesterday', 'warning', '1h ago', true),
('MCP call volume exceeded usual range', 'warning', '2h ago', true),
('Projected June spend will exceed budget', 'critical', '3h ago', true)
ON CONFLICT DO NOTHING;

-- 8. Seed Cost Optimizations
INSERT INTO public.enterprise_finops_cost_optimizations (title, estimated_savings, impact_level, action_label, is_applied) VALUES
('Switch Low-Complexity Prompt Invocations to Llama 3.1 8B', '$1,840.00/mo', 'High Impact', 'Apply Rule', false),
('Enable Semantic Prompt Response Caching (Redis/CDN)', '$1,420.50/mo', 'Medium Impact', 'Enable Caching', false),
('Auto-compress Vector Embeddings to float8 Quantization', '$1,060.10/mo', 'High Impact', 'Enable Quantization', false)
ON CONFLICT DO NOTHING;

-- 9. Seed Usage Analytics Breakdown
INSERT INTO public.enterprise_finops_usage_analytics_breakdown (resource_type, volume, cost, growth_rate) VALUES
('LLM Tokens', '1.82B Tokens', 12430.20, '+18.6%'),
('MCP Invokes', '1.04M Calls', 6210.10, '+24.2%'),
('Vector Search Queries', '15.2M Queries', 1520.80, '+32.1%'),
('Supabase Relational DB Storage', '2.34 TB', 3230.90, '+8.4%'),
('CDN Bandwidth & Data Egress', '3.45 TB', 2110.30, '+12.1%')
ON CONFLICT DO NOTHING;

-- 10. Seed Agent Cost Breakdown
INSERT INTO public.enterprise_finops_agent_cost_breakdown (agent_name, department, invocations, avg_latency_ms, total_cost) VALUES
('Customer Support Agent Alpha', 'Customer Service', 420000, 480, 4210.50),
('Finance Audit Reconciliation Bot', 'Finance & Accounting', 185000, 850, 3120.80),
('DevOps Infrastructure Monitor Agent', 'Engineering', 620000, 210, 2430.20),
('Sales Lead Generation Copilot', 'Sales & Growth', 120000, 620, 1840.10)
ON CONFLICT DO NOTHING;

-- 11. Seed Workflow Execution Costs
INSERT INTO public.enterprise_finops_workflow_cost_breakdown (workflow_name, execution_count, step_count, cost_per_exec, total_cost) VALUES
('Automated Customer Refund Workflow', 142000, 8, 0.0245, 3479.00),
('Daily Financial Settlement Pipeline', 45000, 14, 0.0520, 2340.00),
('Lead Enrichment & CRM Sync', 98000, 5, 0.0180, 1764.00),
('Security Compliance Audit Log Pipeline', 210000, 3, 0.0065, 1365.00)
ON CONFLICT DO NOTHING;

-- 12. Seed MCP Tools Costs
INSERT INTO public.enterprise_finops_mcp_cost_breakdown (mcp_tool_name, provider, api_calls, latency_p99_ms, total_cost) VALUES
('Stripe Payment Gateway MCP', 'Stripe', 520000, 180, 2110.30),
('Pinecone Vector Index MCP', 'Pinecone', 15200000, 45, 1520.80),
('Supabase Realtime Sync MCP', 'Supabase', 4200000, 65, 1240.50),
('GitHub CI/CD Automation MCP', 'GitHub', 85000, 310, 850.20)
ON CONFLICT DO NOTHING;

-- 13. Seed Storage Infrastructure Costs
INSERT INTO public.enterprise_finops_storage_cost_breakdown (storage_type, allocated_tb, used_tb, cost_per_tb, total_cost) VALUES
('Vector Storage (Pinecone)', 3.00, 1.52, 500.00, 760.00),
('Relational DB (Supabase Postgres)', 5.00, 2.34, 450.00, 1053.00),
('Object Storage & CDN (S3)', 10.00, 3.45, 120.00, 414.00)
ON CONFLICT DO NOTHING;

-- 14. Seed Forecast Projections
INSERT INTO public.enterprise_finops_forecast_projections (forecast_month, projected_spend, confidence_interval_low, confidence_interval_high, growth_scenario) VALUES
('June 2025', 29980.00, 28500.00, 31450.00, 'Baseline Enterprise Scale'),
('July 2025', 32400.00, 30200.00, 34800.00, 'Moderate Agent Swarm Expansion'),
('August 2025', 35800.00, 33100.00, 38500.00, 'High Token Growth Scenario')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RLS POLICIES & SECURITY (READ & WRITE)
-- ============================================================================

-- Enable RLS for all 14 tables
ALTER TABLE public.enterprise_finops_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_spend_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_top_cost_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_top_ai_models_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_budget_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_cost_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_usage_analytics_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_agent_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_workflow_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_mcp_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_storage_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_finops_forecast_projections ENABLE ROW LEVEL SECURITY;

-- Idempotent Read & Write Policies
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'enterprise_finops_kpis', 'enterprise_finops_spend_trends', 'enterprise_finops_categories',
        'enterprise_finops_top_cost_drivers', 'enterprise_finops_top_ai_models_spend',
        'enterprise_finops_budget_overview', 'enterprise_finops_cost_alerts', 'enterprise_finops_cost_optimizations',
        'enterprise_finops_usage_analytics_breakdown', 'enterprise_finops_agent_cost_breakdown',
        'enterprise_finops_workflow_cost_breakdown', 'enterprise_finops_mcp_cost_breakdown',
        'enterprise_finops_storage_cost_breakdown', 'enterprise_finops_forecast_projections'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public read %I" ON public.%I FOR SELECT USING (true)', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public write %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public write %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- SAFE REALTIME PUBLICATION SETUP
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_kpis;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_cost_alerts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_budget_overview;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_cost_optimizations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_top_ai_models_spend;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_agent_cost_breakdown;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_workflow_cost_breakdown;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_mcp_cost_breakdown;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_storage_cost_breakdown;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_finops_forecast_projections;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
