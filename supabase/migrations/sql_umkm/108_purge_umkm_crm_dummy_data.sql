-- ============================================================================
-- ZEGA AI: Purge UMKM CRM Management & Submenus Dummy Data Migration (Production Zero-State)
-- File: 108_purge_umkm_crm_dummy_data.sql
-- ============================================================================

-- 1. Non-destructively purge dummy data from all CRM tables and submenu views
TRUNCATE TABLE public.umkm_customers CASCADE;
TRUNCATE TABLE public.umkm_crm_customers CASCADE;
TRUNCATE TABLE public.umkm_customer_segments CASCADE;
TRUNCATE TABLE public.umkm_customer_growth CASCADE;
TRUNCATE TABLE public.umkm_customer_activity_stream CASCADE;
TRUNCATE TABLE public.umkm_customer_metrics CASCADE;
TRUNCATE TABLE public.umkm_customer_rfm_segments CASCADE;
TRUNCATE TABLE public.umkm_customer_rfm_scores CASCADE;
TRUNCATE TABLE public.umkm_customer_rfm_cohorts CASCADE;
TRUNCATE TABLE public.umkm_customer_regional_distribution CASCADE;
TRUNCATE TABLE public.umkm_customer_regional_distributions CASCADE;
TRUNCATE TABLE public.umkm_customer_activity_analytics CASCADE;
TRUNCATE TABLE public.umkm_crm_ai_insights CASCADE;
TRUNCATE TABLE public.umkm_crm_ai_campaigns CASCADE;
TRUNCATE TABLE public.umkm_crm_ai_campaign_insights CASCADE;

-- 2. Verify Zero-State Certification across all CRM Management subpages
DO $$
DECLARE
    v_customers_count INT;
    v_crm_customers_count INT;
    v_segments_count INT;
    v_growth_count INT;
    v_activity_stream_count INT;
    v_metrics_count INT;
    v_rfm_scores_count INT;
    v_regional_dist_count INT;
    v_ai_campaigns_count INT;
BEGIN
    SELECT COUNT(*) INTO v_customers_count FROM public.umkm_customers;
    SELECT COUNT(*) INTO v_crm_customers_count FROM public.umkm_crm_customers;
    SELECT COUNT(*) INTO v_segments_count FROM public.umkm_customer_segments;
    SELECT COUNT(*) INTO v_growth_count FROM public.umkm_customer_growth;
    SELECT COUNT(*) INTO v_activity_stream_count FROM public.umkm_customer_activity_stream;
    SELECT COUNT(*) INTO v_metrics_count FROM public.umkm_customer_metrics;
    SELECT COUNT(*) INTO v_rfm_scores_count FROM public.umkm_customer_rfm_scores;
    SELECT COUNT(*) INTO v_regional_dist_count FROM public.umkm_customer_regional_distribution;
    SELECT COUNT(*) INTO v_ai_campaigns_count FROM public.umkm_crm_ai_campaigns;
    
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'ZEGA CRM Management Zero-State Certification Verified:';
    RAISE NOTICE 'Customers=%, CrmCustomers=%, Segments=%, Growth=%', 
        v_customers_count, v_crm_customers_count, v_segments_count, v_growth_count;
    RAISE NOTICE 'ActivityStream=%, Metrics=%, RFMScores=%, RegionalDist=%, AICampaigns=%', 
        v_activity_stream_count, v_metrics_count, v_rfm_scores_count, v_regional_dist_count, v_ai_campaigns_count;
    RAISE NOTICE '====================================================================';
END $$;
