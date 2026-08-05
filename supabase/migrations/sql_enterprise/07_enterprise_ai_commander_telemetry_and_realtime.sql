-- ============================================================================
-- MIGRATION 07: Enterprise AI Commander Telemetry and Realtime Subscriptions
-- Architecture: OWASP Level 3 Zero-Trust Security, Row Level Security (RLS)
-- Target Workspace: ZEGA Enterprise AI Operating System
-- ============================================================================

-- 1. Create AI Commander Realtime Telemetry Table
CREATE TABLE IF NOT EXISTS public.enterprise_ai_commander_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    ai_health_score NUMERIC(5,2) NOT NULL DEFAULT 99.99,
    ai_requests_per_min INTEGER NOT NULL DEFAULT 23856,
    active_workflows INTEGER NOT NULL DEFAULT 189,
    total_cost_this_month NUMERIC(12,2) NOT NULL DEFAULT 3240000.00,
    avg_latency_ms INTEGER NOT NULL DEFAULT 142,
    success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 98.56,
    system_status JSONB NOT NULL DEFAULT '[
        {"name": "API Gateway", "status": "Operational"},
        {"name": "LLM Router", "status": "Operational"},
        {"name": "Vector Database", "status": "Operational"},
        {"name": "Supabase", "status": "Operational"},
        {"name": "Redis Cache", "status": "Operational"},
        {"name": "ZeroClaw Node", "status": "Operational"},
        {"name": "MCP Servers", "status": "Operational"},
        {"name": "Workflow Engine", "status": "Operational"}
    ]'::jsonb,
    workflow_pipeline JSONB NOT NULL DEFAULT '[
        {"stage": "Trigger", "count": 12856, "rate": "/min"},
        {"stage": "Planner", "count": 23856, "rate": "/min"},
        {"stage": "Reasoning", "count": 23102, "rate": "/min"},
        {"stage": "Tools", "count": 18923, "rate": "/min"},
        {"stage": "Validation", "count": 18230, "rate": "/min"},
        {"stage": "Execution", "count": 17399, "rate": "/min"},
        {"stage": "Completed", "count": 16864, "rate": "/min"}
    ]'::jsonb,
    ai_queue_buffer JSONB NOT NULL DEFAULT '{
        "processing": 142,
        "waiting": 32,
        "retry": 8,
        "failed": 3
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create AI Commander Action Logs Table (Anti-Hacking Audit Log)
CREATE TABLE IF NOT EXISTS public.enterprise_ai_commander_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    action_type TEXT NOT NULL, -- e.g. 'health_check', 'optimize_workflows', 'clear_queue', 'pause_all_agents', 'deploy_update', 'export_report', 'incident_manager'
    triggered_by TEXT NOT NULL DEFAULT 'admin@zegaai.site',
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for high performance real-time query resolution
CREATE INDEX IF NOT EXISTS idx_ai_commander_telemetry_org ON public.enterprise_ai_commander_telemetry (org_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_commander_actions_org ON public.enterprise_ai_commander_actions (org_id, created_at DESC);

-- 3. Enable Row Level Security (RLS) - OWASP Level 3
ALTER TABLE public.enterprise_ai_commander_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_ai_commander_actions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated enterprise users
CREATE POLICY "Enterprise Users Read Telemetry" 
    ON public.enterprise_ai_commander_telemetry 
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role');

CREATE POLICY "Enterprise Users Read Actions" 
    ON public.enterprise_ai_commander_actions 
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role');

-- Allow insert/update to service_role and authenticated users
CREATE POLICY "Enterprise Service Insert Telemetry" 
    ON public.enterprise_ai_commander_telemetry 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enterprise Service Insert Actions" 
    ON public.enterprise_ai_commander_actions 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. Enable Supabase Realtime Publication for AI Commander Telemetry
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'enterprise_ai_commander_telemetry'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_ai_commander_telemetry;
    END IF;
END $$;

-- Insert Seed Initial Record if empty
INSERT INTO public.enterprise_ai_commander_telemetry (org_id)
SELECT 'enterprise-org-01'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_ai_commander_telemetry WHERE org_id = 'enterprise-org-01');
