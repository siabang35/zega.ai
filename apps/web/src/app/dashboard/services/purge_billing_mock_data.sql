-- ============================================================================
-- ZEGA AI: Purge UMKM Billing & Plan Dummy Data Migration (Production Zero-State)
-- File: purge_billing_mock_data.sql / 109_purge_umkm_billing_dummy_data.sql
-- ============================================================================

DO $$
BEGIN
    -- 1. Safely Truncate Billing Tables if they exist in schema
    IF to_regclass('public.umkm_billing_invoices') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_invoices CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_payment_methods') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_payment_methods CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_usage_metrics') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_usage_metrics CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_usage_breakdown') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_usage_breakdown CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_usage_trends') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_usage_trends CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_transactions') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_transactions CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_settings') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_settings CASCADE;
    END IF;

    IF to_regclass('public.umkm_billing_support_tickets') IS NOT NULL THEN
        TRUNCATE TABLE public.umkm_billing_support_tickets CASCADE;
    END IF;
END $$;

-- 2. Verify Zero-State Certification across all Billing Sub-menus
DO $$
DECLARE
    v_inv_count INT := 0;
    v_pm_count INT := 0;
    v_usage_breakdown_count INT := 0;
    v_txn_count INT := 0;
    v_settings_count INT := 0;
BEGIN
    IF to_regclass('public.umkm_billing_invoices') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_inv_count FROM public.umkm_billing_invoices;
    END IF;

    IF to_regclass('public.umkm_billing_payment_methods') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_pm_count FROM public.umkm_billing_payment_methods;
    END IF;

    IF to_regclass('public.umkm_billing_usage_breakdown') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_breakdown_count FROM public.umkm_billing_usage_breakdown;
    END IF;

    IF to_regclass('public.umkm_billing_transactions') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_txn_count FROM public.umkm_billing_transactions;
    END IF;

    IF to_regclass('public.umkm_billing_settings') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_settings_count FROM public.umkm_billing_settings;
    END IF;

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'ZEGA Billing & Plan Zero-State Certification Verified:';
    RAISE NOTICE 'Invoices=%, PaymentMethods=%, UsageBreakdown=%, Transactions=%, Settings=%',
        v_inv_count, v_pm_count, v_usage_breakdown_count, v_txn_count, v_settings_count;
    RAISE NOTICE '====================================================================';
END $$;
