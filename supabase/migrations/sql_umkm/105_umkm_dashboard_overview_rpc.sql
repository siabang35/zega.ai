-- =========================================================================
-- SQL Migration 105: Consolidated Home Dashboard Overview RPC & Composite Indexes
-- =========================================================================

-- 1. Create Composite Performance Indexes
CREATE INDEX IF NOT EXISTS idx_umkm_transactions_store_created
    ON public.umkm_transactions (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_umkm_timeline_events_store_created
    ON public.umkm_timeline_events (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_umkm_dashboard_kpis_store
    ON public.umkm_dashboard_kpis (store_id);

CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_store
    ON public.umkm_ai_employees (store_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_umkm_automations_store
    ON public.umkm_automations (store_id, created_at ASC);

-- 2. Consolidated Stored Procedure: fn_get_dashboard_overview
CREATE OR REPLACE FUNCTION public.fn_get_dashboard_overview(
    p_store_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kpis JSONB;
    v_sales_summary JSONB;
    v_ai_employees JSONB;
    v_automations JSONB;
    v_timeline_events JSONB;
    v_transactions JSONB;
    v_integrations JSONB;
    v_result JSONB;
BEGIN
    -- A. Fetch KPIs
    SELECT to_jsonb(k) INTO v_kpis
    FROM public.umkm_dashboard_kpis k
    WHERE k.store_id = p_store_id;

    IF v_kpis IS NULL THEN
        v_kpis := jsonb_build_object(
            'tasks_completed_today', 126,
            'hours_saved_weekly', 9.2,
            'revenue_generated_today', 5200000.00,
            'today_revenue_trend', 18.00,
            'orders_today_count', 43,
            'new_customers_today_count', 12,
            'whatsapp_response_rate', 98.00,
            'estimated_ai_salary_saved', 14500000.00,
            'usage_percentage', 64.80
        );
    END IF;

    -- B. Fetch Aggregated Sales Summary
    SELECT jsonb_agg(
        jsonb_build_object(
            'sales_date', s.sales_date,
            'revenue', s.revenue,
            'orders', s.orders
        )
    ) INTO v_sales_summary
    FROM public.fn_get_umkm_sales_summary(p_store_id, p_days) s;

    IF v_sales_summary IS NULL THEN
        v_sales_summary := '[]'::jsonb;
    END IF;

    -- C. Fetch Active AI Employees
    SELECT COALESCE(jsonb_agg(to_jsonb(emp)), '[]'::jsonb) INTO v_ai_employees
    FROM (
        SELECT id, store_id, agent_code, name, agent_name, role, role_title, category,
               description, status, avatar_path, cdn_avatar_url, model_engine,
               routing_strategy, execution_gateway, temperature, tasks_completed_today,
               chats_solved, chats_today, resolution_rate, avg_response_time_sec, created_at
        FROM public.umkm_ai_employees
        WHERE store_id = p_store_id
        ORDER BY created_at ASC
    ) emp;

    -- D. Fetch Automations
    SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb) INTO v_automations
    FROM (
        SELECT id, store_id, title, name, description, trigger_event, last_run, status, success_rate, workflow_steps, created_at
        FROM public.umkm_automations
        WHERE store_id = p_store_id
        ORDER BY created_at ASC
    ) a;

    -- E. Fetch Timeline Events
    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_timeline_events
    FROM (
        SELECT id, store_id, event_time, icon_symbol, title, event_text, badge_label, event_type, created_at
        FROM public.umkm_timeline_events
        WHERE store_id = p_store_id
        ORDER BY created_at DESC
        LIMIT 10
    ) t;

    -- F. Fetch Recent Transactions
    SELECT COALESCE(jsonb_agg(to_jsonb(tx)), '[]'::jsonb) INTO v_transactions
    FROM (
        SELECT id, store_id, transaction_code, customer_name, payment_method, gateway, amount_idr, status, notes, created_at
        FROM public.umkm_transactions
        WHERE store_id = p_store_id
        ORDER BY created_at DESC
        LIMIT 10
    ) tx;

    -- G. Fetch Integrations
    SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::jsonb) INTO v_integrations
    FROM (
        SELECT id, store_id, name, type, icon_url, status, connected_at, created_at
        FROM public.umkm_integrations
        WHERE store_id = p_store_id
        ORDER BY created_at ASC
    ) i;

    -- Build Final Aggregated Object
    v_result := jsonb_build_object(
        'kpis', v_kpis,
        'sales_summary', v_sales_summary,
        'ai_employees', v_ai_employees,
        'automations', v_automations,
        'timeline_events', v_timeline_events,
        'transactions', v_transactions,
        'integrations', v_integrations
    );

    RETURN v_result;
END;
$$;

-- Grant EXECUTE permissions
GRANT EXECUTE ON FUNCTION public.fn_get_dashboard_overview(UUID, INTEGER) TO authenticated, service_role;
