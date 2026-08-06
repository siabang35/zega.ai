-- Enterprise Reports & Audit Logs Telemetry Engine (Realtime Schema)
-- Migration: 22_enterprise_reports_audit_logs_realtime.sql

-- 1. Create KPI Summary Table
CREATE TABLE IF NOT EXISTS public.enterprise_audit_log_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_events INT NOT NULL DEFAULT 24831,
    total_events_trend TEXT NOT NULL DEFAULT '+10.3%',
    critical_events INT NOT NULL DEFAULT 142,
    critical_events_trend TEXT NOT NULL DEFAULT '-6',
    active_users INT NOT NULL DEFAULT 318,
    active_users_trend TEXT NOT NULL DEFAULT '+8.1%',
    integrated_apps INT NOT NULL DEFAULT 24,
    integrated_apps_trend TEXT NOT NULL DEFAULT '+4.3%',
    data_changes INT NOT NULL DEFAULT 1247,
    data_changes_trend TEXT NOT NULL DEFAULT '+12.1%',
    api_calls INT NOT NULL DEFAULT 18734,
    api_calls_trend TEXT NOT NULL DEFAULT '+23.4%',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Audit Logs Main Table
CREATE TABLE IF NOT EXISTS public.enterprise_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    formatted_time TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    application TEXT NOT NULL,
    ip_address TEXT NOT NULL DEFAULT '103.12.45.67',
    status TEXT NOT NULL DEFAULT 'Success',
    user_agent TEXT NOT NULL DEFAULT 'Chrome 125.0.0.0 / macOS',
    payload_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Events Over Time Chart Data Table
CREATE TABLE IF NOT EXISTS public.enterprise_audit_events_over_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_label TEXT NOT NULL,
    all_events INT NOT NULL,
    critical_events INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Events by Action Breakdown Table
CREATE TABLE IF NOT EXISTS public.enterprise_audit_events_by_action (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_name TEXT NOT NULL UNIQUE,
    count INT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Events by Resource Breakdown Table
CREATE TABLE IF NOT EXISTS public.enterprise_audit_events_by_resource (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_name TEXT NOT NULL UNIQUE,
    count INT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Scheduled Reports KPI Summary Table
CREATE TABLE IF NOT EXISTS public.enterprise_scheduled_report_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_scheduled INT NOT NULL DEFAULT 24,
    total_scheduled_trend TEXT NOT NULL DEFAULT '+14.3%',
    active_count INT NOT NULL DEFAULT 18,
    active_percentage TEXT NOT NULL DEFAULT '75% of total',
    paused_count INT NOT NULL DEFAULT 4,
    paused_percentage TEXT NOT NULL DEFAULT '16.7% of total',
    failed_count INT NOT NULL DEFAULT 2,
    failed_trend TEXT NOT NULL DEFAULT '-33.3%',
    delivered_count INT NOT NULL DEFAULT 126,
    delivered_trend TEXT NOT NULL DEFAULT '+22.1%',
    recipients_count INT NOT NULL DEFAULT 89,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create Report Schedules Table
CREATE TABLE IF NOT EXISTS public.enterprise_report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    report_type TEXT NOT NULL,
    schedule_frequency TEXT NOT NULL DEFAULT 'Daily',
    recipients_count INT NOT NULL DEFAULT 1,
    next_run TEXT NOT NULL,
    last_run TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    owner_name TEXT NOT NULL DEFAULT 'Wildan A.',
    format TEXT NOT NULL DEFAULT 'PDF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_audit_log_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_events_over_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_events_by_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_events_by_resource ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_scheduled_report_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_report_schedules ENABLE ROW LEVEL SECURITY;

-- 9. Idempotent RLS Policies
DROP POLICY IF EXISTS "Allow public read enterprise_audit_log_kpis" ON public.enterprise_audit_log_kpis;
CREATE POLICY "Allow public read enterprise_audit_log_kpis" ON public.enterprise_audit_log_kpis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_audit_logs" ON public.enterprise_audit_logs;
CREATE POLICY "Allow public read enterprise_audit_logs" ON public.enterprise_audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_audit_events_over_time" ON public.enterprise_audit_events_over_time;
CREATE POLICY "Allow public read enterprise_audit_events_over_time" ON public.enterprise_audit_events_over_time FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_audit_events_by_action" ON public.enterprise_audit_events_by_action;
CREATE POLICY "Allow public read enterprise_audit_events_by_action" ON public.enterprise_audit_events_by_action FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_audit_events_by_resource" ON public.enterprise_audit_events_by_resource;
CREATE POLICY "Allow public read enterprise_audit_events_by_resource" ON public.enterprise_audit_events_by_resource FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_scheduled_report_kpis" ON public.enterprise_scheduled_report_kpis;
CREATE POLICY "Allow public read enterprise_scheduled_report_kpis" ON public.enterprise_scheduled_report_kpis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read enterprise_report_schedules" ON public.enterprise_report_schedules;
CREATE POLICY "Allow public read enterprise_report_schedules" ON public.enterprise_report_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert enterprise_report_schedules" ON public.enterprise_report_schedules;
CREATE POLICY "Allow public insert enterprise_report_schedules" ON public.enterprise_report_schedules FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update enterprise_report_schedules" ON public.enterprise_report_schedules;
CREATE POLICY "Allow public update enterprise_report_schedules" ON public.enterprise_report_schedules FOR UPDATE USING (true);

-- 10. Insert Seed Telemetry Data
INSERT INTO public.enterprise_audit_log_kpis (
    total_events, total_events_trend, critical_events, critical_events_trend,
    active_users, active_users_trend, integrated_apps, integrated_apps_trend,
    data_changes, data_changes_trend, api_calls, api_calls_trend
) VALUES (
    24831, '+10.3%', 142, '-6', 318, '+8.1%', 24, '+4.3%', 1247, '+12.1%', 18734, '+23.4%'
) ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_scheduled_report_kpis (
    total_scheduled, total_scheduled_trend, active_count, active_percentage,
    paused_count, paused_percentage, failed_count, failed_trend, delivered_count, delivered_trend, recipients_count
) VALUES (
    24, '+14.3%', 18, '75% of total', 4, '16.7% of total', 2, '-33.3%', 126, '+22.1%', 89
) ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_audit_events_over_time (date_label, all_events, critical_events) VALUES
('May 20', 1680, 18), ('May 21', 1210, 12), ('May 22', 1740, 24), ('May 23', 2050, 32),
('May 24', 1380, 16), ('May 25', 1920, 22), ('May 26', 1050, 11), ('May 27', 2140, 19)
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_audit_events_by_action (action_name, count, percentage, color) VALUES
('Create', 6523, 26.3, '#4F46E5'), ('Update', 5892, 23.7, '#6366F1'), ('Delete', 3451, 13.9, '#818CF8'),
('Login', 2987, 12.0, '#3B82F6'), ('Access', 2416, 9.7, '#60A5FA'), ('Export', 1342, 5.4, '#93C5FD'), ('Other', 2218, 8.9, '#CBD5E1')
ON CONFLICT (action_name) DO NOTHING;

INSERT INTO public.enterprise_audit_events_by_resource (resource_name, count, percentage, color) VALUES
('Workflow Studio', 6021, 24.2, '#6366F1'), ('Knowledge Hub', 4892, 19.7, '#8B5CF6'), ('MCP Hub', 3784, 15.2, '#A855F7'),
('AI Agents', 3109, 12.5, '#EC4899'), ('Security Center', 2443, 9.8, '#F43F5E'), ('Payments & Billing', 1784, 7.2, '#10B981'), ('Other', 2798, 11.4, '#94A3B8')
ON CONFLICT (resource_name) DO NOTHING;

INSERT INTO public.enterprise_report_schedules (
    report_name, subtitle, report_type, schedule_frequency, recipients_count, next_run, last_run, status, owner_name, format
) VALUES
('Daily System Audit Summary', 'System audit logs and security events', 'Audit Logs', 'Daily 09:00 AM WIB', 9, 'May 28, 2025 09:00 AM WIB', 'May 27, 2025 09:00 AM WIB', 'Success', 'Wildan A.', 'PDF'),
('Weekly Security Report', 'Security incidents and compliance overview', 'Security', 'Weekly Monday, 08:00', 6, 'Jun 2, 2025 08:00 AM WIB', 'May 26, 2025 08:00 AM WIB', 'Success', 'Sarah K.', 'Encrypted PDF'),
('Monthly Cost Intelligence Report', 'AI FinOps and cost optimization insights', 'Cost Intelligence', 'Monthly Day 1, 10:00 AM', 8, 'Jun 1, 2025 10:00 AM WIB', 'May 1, 2025 10:00 AM WIB', 'Success', 'Alex M.', 'PDF'),
('AI Agents Performance Report', 'Performance metrics of all AI agents', 'AI Agents', 'Weekly Friday, 10:30', 5, 'May 30, 2025 10:30 AM WIB', 'May 23, 2025 10:30 AM WIB', 'Success', 'Elen R.', 'PDF'),
('Workflow Execution Report', 'Workflow runs and execution status', 'Workflow Studio', 'Daily 07:30 AM WIB', 3, 'May 28, 2025 07:30 AM WIB', 'May 27, 2025 07:30 AM WIB', 'Success', 'Wildan A.', 'CSV / Excel'),
('MCP Hub Usage Report', 'MCP tools usage and statistics', 'MCP Hub', 'Weekly Sunday, 09:00', 2, 'Jun 1, 2025 09:00 AM WIB', 'May 25, 2025 09:00 AM WIB', 'Success', 'Sarah K.', 'PDF'),
('Integration Health Report', 'Integration status and error overview', 'Integrations', 'Daily 06:00 AM WIB', 7, 'May 28, 2025 06:00 AM WIB', 'May 27, 2025 06:00 AM WIB', 'Failed', 'Alex M.', 'PDF'),
('Custom Compliance Report', 'Custom compliance and audit report', 'Custom', 'Monthly Day 15, 11:00 AM', 10, 'Jun 15, 2025 11:00 AM WIB', 'May 15, 2025 11:00 AM WIB', 'Success', 'Elen R.', 'Encrypted PDF')
ON CONFLICT DO NOTHING;

-- 11. Enable Supabase Realtime Publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_log_kpis;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_logs;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_events_over_time;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_events_by_action;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_audit_events_by_resource;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_scheduled_report_kpis;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_report_schedules;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication update skipped: %', SQLERRM;
END $$;
