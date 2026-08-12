-- ============================================================================
-- ZEGA AI PLATFORM - PRODUCTION UMKM OVERVIEW KPI AGGREGATIONS & MULTI-TENANCY
-- File: supabase/migrations/20260812210000_productionize_umkm_overview_kpis.sql
-- ============================================================================

-- 1. Server-Side Stored Procedure: Calculate Authoritative Overview KPIs
CREATE OR REPLACE FUNCTION public.fn_get_umkm_overview_kpis(
    p_store_id UUID
)
RETURNS TABLE (
    revenue_generated_today NUMERIC(14,2),
    today_revenue_trend NUMERIC(5,2),
    orders_today_count INT,
    new_customers_today_count INT,
    conversion_rate NUMERIC(5,2),
    average_order_value NUMERIC(14,2),
    tasks_completed_today INT,
    hours_saved_weekly NUMERIC(8,2),
    whatsapp_response_rate NUMERIC(5,2),
    estimated_ai_salary_saved NUMERIC(14,2),
    usage_percentage NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_start TIMESTAMPTZ := DATE_TRUNC('day', NOW());
    v_yesterday_start TIMESTAMPTZ := DATE_TRUNC('day', NOW() - INTERVAL '1 day');
    v_today_rev NUMERIC(14,2) := 0;
    v_yesterday_rev NUMERIC(14,2) := 0;
    v_trend NUMERIC(5,2) := 0;
    v_orders INT := 0;
    v_new_cust INT := 0;
    v_conv_rate NUMERIC(5,2) := 0;
    v_aov NUMERIC(14,2) := 0;
    v_existing_kpis RECORD;
BEGIN
    -- Query today's confirmed transactions
    SELECT COALESCE(SUM(amount_idr), 0), COUNT(*)
    INTO v_today_rev, v_orders
    FROM public.umkm_transactions
    WHERE store_id = p_store_id
      AND (status IN ('confirmed', 'success', 'completed') OR status IS NULL)
      AND created_at >= v_today_start;

    -- Query yesterday's revenue for trend calculation
    SELECT COALESCE(SUM(amount_idr), 0)
    INTO v_yesterday_rev
    FROM public.umkm_transactions
    WHERE store_id = p_store_id
      AND (status IN ('confirmed', 'success', 'completed') OR status IS NULL)
      AND created_at >= v_yesterday_start
      AND created_at < v_today_start;

    -- Calculate Revenue Trend Percentage
    IF v_yesterday_rev > 0 THEN
        v_trend := ROUND(((v_today_rev - v_yesterday_rev) / v_yesterday_rev * 100.0), 2);
    ELSE
        IF v_today_rev > 0 THEN
            v_trend := 100.0;
        ELSE
            v_trend := 0.0;
        END IF;
    END IF;

    -- Query New Customers Created Today
    SELECT COUNT(*)
    INTO v_new_cust
    FROM public.umkm_customers
    WHERE store_id = p_store_id
      AND created_at >= v_today_start;

    -- Calculate Conversion Rate (orders vs new customers or default ratio)
    IF v_new_cust > 0 THEN
        v_conv_rate := LEAST(100.0, ROUND((v_orders::NUMERIC / v_new_cust::NUMERIC * 100.0), 2));
    ELSIF v_orders > 0 THEN
        v_conv_rate := 100.0;
    ELSE
        v_conv_rate := 0.0;
    END IF;

    -- Calculate Average Order Value
    IF v_orders > 0 THEN
        v_aov := ROUND((v_today_rev / v_orders::NUMERIC), 2);
    ELSE
        v_aov := 0.0;
    END IF;

    -- Fetch recorded KPIs row if exists
    SELECT * INTO v_existing_kpis
    FROM public.umkm_dashboard_kpis
    WHERE store_id = p_store_id;

    -- Upsert authoritative values into umkm_dashboard_kpis
    INSERT INTO public.umkm_dashboard_kpis (
        store_id,
        revenue_generated_today,
        today_revenue_trend,
        orders_today_count,
        new_customers_today_count,
        tasks_completed_today,
        hours_saved_weekly,
        whatsapp_response_rate,
        estimated_ai_salary_saved,
        usage_percentage,
        updated_at
    ) VALUES (
        p_store_id,
        v_today_rev,
        v_trend,
        v_orders,
        v_new_cust,
        COALESCE(v_existing_kpis.tasks_completed_today, 0),
        COALESCE(v_existing_kpis.hours_saved_weekly, 0.0),
        COALESCE(v_existing_kpis.whatsapp_response_rate, 0.0),
        COALESCE(v_existing_kpis.estimated_ai_salary_saved, 0.0),
        COALESCE(v_existing_kpis.usage_percentage, 0.0),
        NOW()
    )
    ON CONFLICT (store_id) DO UPDATE SET
        revenue_generated_today = EXCLUDED.revenue_generated_today,
        today_revenue_trend = EXCLUDED.today_revenue_trend,
        orders_today_count = EXCLUDED.orders_today_count,
        new_customers_today_count = EXCLUDED.new_customers_today_count,
        updated_at = NOW();

    -- Return the synthesized KPI row
    RETURN QUERY
    SELECT 
        v_today_rev AS revenue_generated_today,
        v_trend AS today_revenue_trend,
        v_orders AS orders_today_count,
        v_new_cust AS new_customers_today_count,
        v_conv_rate AS conversion_rate,
        v_aov AS average_order_value,
        COALESCE(v_existing_kpis.tasks_completed_today, 0) AS tasks_completed_today,
        COALESCE(v_existing_kpis.hours_saved_weekly, 0.0) AS hours_saved_weekly,
        COALESCE(v_existing_kpis.whatsapp_response_rate, 0.0) AS whatsapp_response_rate,
        COALESCE(v_existing_kpis.estimated_ai_salary_saved, 0.0) AS estimated_ai_salary_saved,
        COALESCE(v_existing_kpis.usage_percentage, 0.0) AS usage_percentage;
END;
$$;

-- Grant EXECUTE permission to authenticated and anon users for fallback compatibility
GRANT EXECUTE ON FUNCTION public.fn_get_umkm_overview_kpis(UUID) TO authenticated, anon, service_role;
