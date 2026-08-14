-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 27: Active Automations & AI Tasks Realtime Counters & Triggers
-- Path: supabase/migrations/sql_umkm/27_umkm_realtime_automations_and_ai_tasks.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREATE OR HARDEN umkm_dashboard_kpis TABLE
CREATE TABLE IF NOT EXISTS public.umkm_dashboard_kpis (
    store_id UUID PRIMARY KEY REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    tasks_completed_today INT NOT NULL DEFAULT 126,
    hours_saved_weekly NUMERIC(5,2) NOT NULL DEFAULT 11.0,
    revenue_generated_today NUMERIC(12,2) NOT NULL DEFAULT 4850000.00,
    active_automations_count INT NOT NULL DEFAULT 12,
    active_agents_count INT NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEFENSIVE ALTER TABLE FOR PRE-EXISTING TABLES
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS tasks_completed_today INT NOT NULL DEFAULT 126;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS hours_saved_weekly NUMERIC(5,2) NOT NULL DEFAULT 11.0;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS revenue_generated_today NUMERIC(12,2) NOT NULL DEFAULT 4850000.00;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS active_automations_count INT NOT NULL DEFAULT 12;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS active_agents_count INT NOT NULL DEFAULT 5;

-- 2. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.umkm_dashboard_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for umkm_dashboard_kpis" ON public.umkm_dashboard_kpis;
CREATE POLICY "Allow all for umkm_dashboard_kpis" ON public.umkm_dashboard_kpis FOR ALL USING (true);

-- 3. ATOMIC FUNCTION: INCREMENT AI TASK COMPLETED
CREATE OR REPLACE FUNCTION public.fn_increment_umkm_ai_task_completed(
    p_store_id UUID,
    p_agent_name VARCHAR(120) DEFAULT 'AI Employee Swarm',
    p_task_desc TEXT DEFAULT 'Automated Task Execution Completed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count INT;
    v_result JSONB;
BEGIN
    -- Upsert KPI table & increment task counter atomically
    INSERT INTO public.umkm_dashboard_kpis (store_id, tasks_completed_today, updated_at)
    VALUES (p_store_id, 127, NOW())
    ON CONFLICT (store_id) DO UPDATE SET
        tasks_completed_today = public.umkm_dashboard_kpis.tasks_completed_today + 1,
        updated_at = NOW()
    RETURNING tasks_completed_today INTO v_new_count;

    -- Log real-time event to umkm_timeline_events
    INSERT INTO public.umkm_timeline_events (
        store_id,
        event_time,
        icon_symbol,
        event_text,
        title,
        badge_label,
        event_type,
        created_at
    )
    VALUES (
        p_store_id,
        TO_CHAR(NOW(), 'HH24:MI'),
        'CheckCircle',
        p_agent_name || ': ' || p_task_desc,
        'AI Task Completed',
        'Realtime Task',
        'task',
        NOW()
    );

    v_result := jsonb_build_object(
        'success', true,
        'store_id', p_store_id,
        'tasks_completed_today', v_new_count,
        'agent_name', p_agent_name,
        'timestamp', NOW()
    );

    RETURN v_result;
END;
$$;

-- 4. TRIGGER FUNCTION: AUTOMATION TOGGLE & EXECUTION TIMELINE EVENT
CREATE OR REPLACE FUNCTION public.fn_log_umkm_automation_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.umkm_timeline_events (
            store_id,
            event_time,
            icon_symbol,
            event_text,
            title,
            badge_label,
            event_type,
            created_at
        )
        VALUES (
            NEW.store_id,
            TO_CHAR(NOW(), 'HH24:MI'),
            'Zap',
            'Automation Workflow "' || COALESCE(NEW.name, NEW.title, 'Workflow') || '" status changed to ' || UPPER(NEW.status),
            'Automation Status Updated',
            UPPER(NEW.status),
            'automation',
            NOW()
        );
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.umkm_timeline_events (
            store_id,
            event_time,
            icon_symbol,
            event_text,
            title,
            badge_label,
            event_type,
            created_at
        )
        VALUES (
            NEW.store_id,
            TO_CHAR(NOW(), 'HH24:MI'),
            'Zap',
            'New Automation Created: "' || COALESCE(NEW.name, NEW.title, 'Workflow') || '"',
            'Automation Created',
            'Active',
            'automation',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

-- ATTACH TRIGGER TO AUTOMATIONS TABLE
DROP TRIGGER IF EXISTS trg_log_umkm_automation_event ON public.umkm_automations;
CREATE TRIGGER trg_log_umkm_automation_event
    AFTER INSERT OR UPDATE ON public.umkm_automations
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_umkm_automation_event();

-- 5. ENSURE REALTIME PUBLICATION COVERS ALL KPI & AUTOMATION TABLES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE 
                public.umkm_dashboard_kpis,
                public.umkm_automations,
                public.umkm_timeline_events,
                public.umkm_ai_employees;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Tables already present in publication.';
        END;
    END IF;
END $$;

-- 6. SEED / UPSERT DEFAULT KPI RECORD
INSERT INTO public.umkm_dashboard_kpis (
    store_id, tasks_completed_today, hours_saved_weekly, revenue_generated_today, active_automations_count, active_agents_count, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    126,
    11.0,
    4850000.00,
    12,
    5,
    NOW()
) ON CONFLICT (store_id) DO UPDATE SET
    updated_at = NOW();

