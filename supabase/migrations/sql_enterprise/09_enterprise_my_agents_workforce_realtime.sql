-- ZEGA Enterprise AI Operating System
-- Migration 09: Enterprise My Agents Workforce & Realtime Telemetry
-- Location: /home/wii-ros/Documents/Project/AEOP/ZEGA/supabase/migrations/sql_enterprise/09_enterprise_my_agents_workforce_realtime.sql

CREATE TABLE IF NOT EXISTS public.enterprise_my_agents_workforce (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL DEFAULT 'enterprise-org-01',
    instance_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'Online', -- Online, Paused, Maintenance, Error
    health_score NUMERIC(5,2) NOT NULL DEFAULT 99.90,
    runs_7d INTEGER NOT NULL DEFAULT 14250,
    success_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 99.10,
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

-- Index for instant org and status lookup
CREATE INDEX IF NOT EXISTS idx_my_agents_org_status ON public.enterprise_my_agents_workforce(org_id, status);

-- Audit Table for Action Traces
CREATE TABLE IF NOT EXISTS public.enterprise_my_agents_action_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.enterprise_my_agents_workforce(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- PAUSE, RESUME, CONFIGURE, SCALE, TERMINATE
    performed_by TEXT NOT NULL DEFAULT 'Danz A.',
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_my_agents_workforce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_my_agents_action_audit ENABLE ROW LEVEL SECURITY;

-- Allow authenticated enterprise service role full access
DROP POLICY IF EXISTS "Enterprise My Agents Service Policy" ON public.enterprise_my_agents_workforce;
CREATE POLICY "Enterprise My Agents Service Policy" ON public.enterprise_my_agents_workforce FOR ALL USING (true);

DROP POLICY IF EXISTS "Enterprise My Agents Audit Policy" ON public.enterprise_my_agents_action_audit;
CREATE POLICY "Enterprise My Agents Audit Policy" ON public.enterprise_my_agents_action_audit FOR ALL USING (true);

-- Enable Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'enterprise_my_agents_workforce'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_my_agents_workforce;
    END IF;
END $$;

-- Insert Seed Active Workforce Data for Danz A.
INSERT INTO public.enterprise_my_agents_workforce (org_id, instance_name, category, status, health_score, runs_7d, success_rate_pct, latency_ms, memory_usage_pct, cpu_load_pct, replica_count, owner_name)
SELECT 'enterprise-org-01', 'Autonomous Lead Qualifier Swarm', 'Sales', 'Online', 99.90, 42890, 99.40, 118, 38.20, 22.50, 5, 'Danz A.'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_my_agents_workforce WHERE instance_name = 'Autonomous Lead Qualifier Swarm');

INSERT INTO public.enterprise_my_agents_workforce (org_id, instance_name, category, status, health_score, runs_7d, success_rate_pct, latency_ms, memory_usage_pct, cpu_load_pct, replica_count, owner_name)
SELECT 'enterprise-org-01', 'Financial Ledger Auditor', 'Finance', 'Online', 99.80, 28190, 99.10, 145, 45.10, 31.00, 3, 'Danz A.'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_my_agents_workforce WHERE instance_name = 'Financial Ledger Auditor');

INSERT INTO public.enterprise_my_agents_workforce (org_id, instance_name, category, status, health_score, runs_7d, success_rate_pct, latency_ms, memory_usage_pct, cpu_load_pct, replica_count, owner_name)
SELECT 'enterprise-org-01', 'Zero-Trust Code Inspector', 'Security', 'Online', 99.95, 38920, 99.80, 95, 29.80, 18.20, 8, 'Danz A.'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_my_agents_workforce WHERE instance_name = 'Zero-Trust Code Inspector');

INSERT INTO public.enterprise_my_agents_workforce (org_id, instance_name, category, status, health_score, runs_7d, success_rate_pct, latency_ms, memory_usage_pct, cpu_load_pct, replica_count, owner_name)
SELECT 'enterprise-org-01', 'Omnichannel Customer Support Bot', 'Support', 'Paused', 98.90, 18200, 98.20, 210, 52.40, 41.00, 2, 'Danz A.'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_my_agents_workforce WHERE instance_name = 'Omnichannel Customer Support Bot');
