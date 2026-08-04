-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 04: Cloudflare R2 CDN Helper Functions & Supabase Realtime Publications
-- Path: supabase/migrations/sql_umkm/04_umkm_realtime_and_cdn_helpers.sql
-- ============================================================================

-- 1. CLOUDFLARE R2 CDN RESOLVER FUNCTION
CREATE OR REPLACE FUNCTION public.fn_get_r2_cdn_url(p_asset_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base_cdn TEXT := 'https://cdn.zegaai.site';
    v_clean_path TEXT;
BEGIN
    IF p_asset_path IS NULL OR TRIM(p_asset_path) = '' THEN
        RETURN v_base_cdn || '/assets/logo/zegalogo.png';
    END IF;

    -- Return as-is if already full URL
    IF p_asset_path LIKE 'http://%' OR p_asset_path LIKE 'https://%' THEN
        RETURN p_asset_path;
    END IF;

    v_clean_path := p_asset_path;
    IF NOT v_clean_path LIKE '/%' THEN
        v_clean_path := '/' || v_clean_path;
    END IF;

    RETURN v_base_cdn || v_clean_path;
END;
$$;

-- 2. AUTOMATIC KPI AGGREGATOR TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.fn_auto_recalculate_umkm_kpis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
    v_new_today_rev NUMERIC(14,2);
    v_new_orders INT;
BEGIN
    v_store_id := NEW.store_id;

    -- Calculate today's confirmed revenue & orders count
    SELECT 
        COALESCE(SUM(amount_idr), 0),
        COUNT(*)
    INTO v_new_today_rev, v_new_orders
    FROM public.umkm_transactions
    WHERE store_id = v_store_id
      AND status = 'confirmed'
      AND created_at >= DATE_TRUNC('day', NOW());

    -- Update or Insert KPI Cache row
    INSERT INTO public.umkm_dashboard_kpis (
        store_id, 
        revenue_generated_today, 
        orders_today_count, 
        updated_at
    )
    VALUES (
        v_store_id, 
        v_new_today_rev, 
        v_new_orders, 
        NOW()
    )
    ON CONFLICT (store_id) DO UPDATE SET
        revenue_generated_today = EXCLUDED.revenue_generated_today,
        orders_today_count = EXCLUDED.orders_today_count,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- ATTACH AUTO KPI RECALCULATION TRIGGER TO TRANSACTIONS
DROP TRIGGER IF EXISTS trg_recalc_kpi_on_tx ON public.umkm_transactions;
CREATE TRIGGER trg_recalc_kpi_on_tx
    AFTER INSERT OR UPDATE ON public.umkm_transactions
    FOR EACH ROW EXECUTE FUNCTION public.fn_auto_recalculate_umkm_kpis();

-- 3. REGISTER ALL UMKM TABLES IN SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.umkm_dashboard_kpis,
            public.umkm_ai_employees,
            public.umkm_automations,
            public.umkm_products,
            public.umkm_customers,
            public.umkm_invoices,
            public.umkm_transactions,
            public.umkm_timeline_events,
            public.umkm_integrations,
            public.umkm_knowledge_docs;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication setup skipped or tables already added.';
END $$;
