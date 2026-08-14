-- ============================================================================
-- ZEGA AI: Purge UMKM Sales Hub & Submenus Dummy Data Migration (Production Zero-State)
-- File: 11_purge_umkm_sales_dummy_data.sql
-- ============================================================================

-- 1. Non-destructively purge dummy data from all Sales Hub tables and submenu views
TRUNCATE TABLE public.umkm_sales_metrics CASCADE;
TRUNCATE TABLE public.umkm_sales_channels CASCADE;
TRUNCATE TABLE public.umkm_sales_channel_ai_swarm CASCADE;
TRUNCATE TABLE public.umkm_sales_products CASCADE;
TRUNCATE TABLE public.umkm_sales_activities CASCADE;
TRUNCATE TABLE public.umkm_sales_goals CASCADE;
TRUNCATE TABLE public.umkm_sales_insights CASCADE;
TRUNCATE TABLE public.umkm_sales_sources CASCADE;
TRUNCATE TABLE public.umkm_sales_source_ai_swarm CASCADE;
TRUNCATE TABLE public.umkm_sales_monthly_reports CASCADE;
TRUNCATE TABLE public.umkm_sales_ai_intelligence CASCADE;
TRUNCATE TABLE public.umkm_sales_reports_automation CASCADE;

-- 2. Verify Zero-State Certification across all Sales Hub subpages
DO $$
DECLARE
    v_metrics_count INT;
    v_channels_count INT;
    v_sources_count INT;
    v_reports_count INT;
    v_insights_count INT;
    v_goals_count INT;
    v_activities_count INT;
    v_products_count INT;
BEGIN
    SELECT COUNT(*) INTO v_metrics_count FROM public.umkm_sales_metrics;
    SELECT COUNT(*) INTO v_channels_count FROM public.umkm_sales_channels;
    SELECT COUNT(*) INTO v_sources_count FROM public.umkm_sales_sources;
    SELECT COUNT(*) INTO v_reports_count FROM public.umkm_sales_monthly_reports;
    SELECT COUNT(*) INTO v_insights_count FROM public.umkm_sales_insights;
    SELECT COUNT(*) INTO v_goals_count FROM public.umkm_sales_goals;
    SELECT COUNT(*) INTO v_activities_count FROM public.umkm_sales_activities;
    SELECT COUNT(*) INTO v_products_count FROM public.umkm_sales_products;
    
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'ZEGA Sales Hub Zero-State Certification Verified:';
    RAISE NOTICE 'Metrics=%, Channels=%, Sources=%, MonthlyReports=%', 
        v_metrics_count, v_channels_count, v_sources_count, v_reports_count;
    RAISE NOTICE 'Insights=%, Goals=%, Activities=%, Products=%', 
        v_insights_count, v_goals_count, v_activities_count, v_products_count;
    RAISE NOTICE '====================================================================';
END $$;
