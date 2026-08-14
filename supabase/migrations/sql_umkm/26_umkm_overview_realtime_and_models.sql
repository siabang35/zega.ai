-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 26: UMKM Overview Real Models Deployment & Realtime CDN Integration
-- Path: supabase/migrations/sql_umkm/26_umkm_overview_realtime_and_models.sql
-- ============================================================================

-- 1. EXTEND UMKM AI EMPLOYEES TABLE FOR REAL MODEL DEPLOYMENTS & COST ROUTING
ALTER TABLE public.umkm_ai_employees 
ADD COLUMN IF NOT EXISTS model_engine VARCHAR(120) DEFAULT 'ZEGA-Swarm-Llama-3.3-70B',
ADD COLUMN IF NOT EXISTS routing_strategy VARCHAR(80) DEFAULT '9Router-Auto-Cost-Optimizer',
ADD COLUMN IF NOT EXISTS execution_gateway VARCHAR(80) DEFAULT 'ZeroClaw-Edge-Gateway',
ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT 'You are an autonomous AI employee assisting UMKM operations.',
ADD COLUMN IF NOT EXISTS temperature NUMERIC(3,2) DEFAULT 0.70,
ADD COLUMN IF NOT EXISTS max_tokens INT DEFAULT 4096,
ADD COLUMN IF NOT EXISTS model_type VARCHAR(60) DEFAULT 'llm_swarm',
ADD COLUMN IF NOT EXISTS est_cost_per_1k_tokens NUMERIC(6,4) DEFAULT 0.0005,
ADD COLUMN IF NOT EXISTS cdn_avatar_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png';

-- 2. CREATE FUNCTION TO LOG TIMELINE EVENT ON QUICK ACTIONS & MODEL DEPLOYMENT
CREATE OR REPLACE FUNCTION public.fn_log_umkm_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_TABLE_NAME = 'umkm_ai_employees' THEN
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
            'Bot', 
            'Deployed AI Model: ' || COALESCE(NEW.agent_name, NEW.name, 'AI Employee') || ' (' || COALESCE(NEW.model_engine, 'Swarm-v1') || ')', 
            'AI Model Deployed', 
            'Active Model', 
            'system', 
            NOW()
        );
    ELSIF TG_TABLE_NAME = 'umkm_transactions' THEN
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
            'ShoppingBag', 
            'New Transaction Recorded: Rp' || TRIM(TO_CHAR(NEW.amount_idr, '999,999,999,999')), 
            'Sales Recorded', 
            'Confirmed', 
            'transaction', 
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

-- ATTACH TIMELINE EVENT TRIGGERS
DROP TRIGGER IF EXISTS trg_log_timeline_ai_employee ON public.umkm_ai_employees;
CREATE TRIGGER trg_log_timeline_ai_employee
    AFTER INSERT ON public.umkm_ai_employees
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_umkm_timeline_event();

DROP TRIGGER IF EXISTS trg_log_timeline_transactions ON public.umkm_transactions;
CREATE TRIGGER trg_log_timeline_transactions
    AFTER INSERT ON public.umkm_transactions
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_umkm_timeline_event();

-- 3. ENSURE ALL UMKM REALTIME TABLES ARE IN PUBLIC PUBLICATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE 
                public.umkm_ai_employees,
                public.umkm_dashboard_kpis,
                public.umkm_timeline_events,
                public.umkm_transactions,
                public.umkm_automations,
                public.umkm_products,
                public.umkm_stores;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Tables already added to publication.';
        END;
    END IF;
END $$;
