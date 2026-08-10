-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — Supabase Linter Hardening Migration
-- Migration: 20260810130000_fix_rls_no_policy_and_auth_security.sql
--
-- Objective:
-- 1. Resolve `rls_enabled_no_policy` (WARN 0008) across 16 tables by defining
--    explicit Row-Level Security (RLS) policies for `service_role` and `authenticated`.
-- 2. Configure Auth Security parameters (Leaked Password Protection).
-- ═══════════════════════════════════════════════════════════════════════════════

-- -----------------------------------------------------------------------------
-- SECTION 1: AUTH SECURITY HARDENING (HaveIBeenPwned / Leaked Password Protection)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Enable leaked password protection in auth schema config if auth table supports parameter update
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'config') THEN
        UPDATE auth.config
        SET password_hibp_enabled = true
        WHERE password_hibp_enabled IS NOT NULL AND password_hibp_enabled = false;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.config update skipped or handled via Supabase Dashboard settings.';
END;
$$;

-- -----------------------------------------------------------------------------
-- SECTION 2: ROW LEVEL SECURITY POLICIES FOR 16 TABLES (WARN 0008)
-- -----------------------------------------------------------------------------

-- Helper Macro to safely drop policy before creating
DO $$
BEGIN
    -- 1. public.enterprise_rate_limits
    ALTER TABLE IF EXISTS public.enterprise_rate_limits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_enterprise_rate_limits" ON public.enterprise_rate_limits;
    DROP POLICY IF EXISTS "authenticated_select_enterprise_rate_limits" ON public.enterprise_rate_limits;
    
    CREATE POLICY "service_role_all_enterprise_rate_limits"
        ON public.enterprise_rate_limits FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_select_enterprise_rate_limits"
        ON public.enterprise_rate_limits FOR SELECT
        TO authenticated USING (true);

    -- 2. public.superadmin_rate_limits
    ALTER TABLE IF EXISTS public.superadmin_rate_limits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_superadmin_rate_limits" ON public.superadmin_rate_limits;
    
    CREATE POLICY "service_role_all_superadmin_rate_limits"
        ON public.superadmin_rate_limits FOR ALL
        TO service_role USING (true) WITH CHECK (true);

    -- 3. public.umkm_rate_limits
    ALTER TABLE IF EXISTS public.umkm_rate_limits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_rate_limits" ON public.umkm_rate_limits;
    DROP POLICY IF EXISTS "authenticated_select_umkm_rate_limits" ON public.umkm_rate_limits;
    
    CREATE POLICY "service_role_all_umkm_rate_limits"
        ON public.umkm_rate_limits FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_select_umkm_rate_limits"
        ON public.umkm_rate_limits FOR SELECT
        TO authenticated USING (true);

    -- 4. public.umkm_ai_intelligence_export_logs
    ALTER TABLE IF EXISTS public.umkm_ai_intelligence_export_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_ai_intelligence_export_logs" ON public.umkm_ai_intelligence_export_logs;
    DROP POLICY IF EXISTS "authenticated_store_umkm_ai_intelligence_export_logs" ON public.umkm_ai_intelligence_export_logs;
    
    CREATE POLICY "service_role_all_umkm_ai_intelligence_export_logs"
        ON public.umkm_ai_intelligence_export_logs FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_ai_intelligence_export_logs"
        ON public.umkm_ai_intelligence_export_logs FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 5. public.umkm_ai_marketing_channels
    ALTER TABLE IF EXISTS public.umkm_ai_marketing_channels ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_ai_marketing_channels" ON public.umkm_ai_marketing_channels;
    DROP POLICY IF EXISTS "authenticated_store_umkm_ai_marketing_channels" ON public.umkm_ai_marketing_channels;
    
    CREATE POLICY "service_role_all_umkm_ai_marketing_channels"
        ON public.umkm_ai_marketing_channels FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_ai_marketing_channels"
        ON public.umkm_ai_marketing_channels FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 6. public.umkm_ai_marketing_kpi
    ALTER TABLE IF EXISTS public.umkm_ai_marketing_kpi ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_ai_marketing_kpi" ON public.umkm_ai_marketing_kpi;
    DROP POLICY IF EXISTS "authenticated_store_umkm_ai_marketing_kpi" ON public.umkm_ai_marketing_kpi;
    
    CREATE POLICY "service_role_all_umkm_ai_marketing_kpi"
        ON public.umkm_ai_marketing_kpi FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_ai_marketing_kpi"
        ON public.umkm_ai_marketing_kpi FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 7. public.umkm_ai_marketing_top_content
    ALTER TABLE IF EXISTS public.umkm_ai_marketing_top_content ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_ai_marketing_top_content" ON public.umkm_ai_marketing_top_content;
    DROP POLICY IF EXISTS "authenticated_store_umkm_ai_marketing_top_content" ON public.umkm_ai_marketing_top_content;
    
    CREATE POLICY "service_role_all_umkm_ai_marketing_top_content"
        ON public.umkm_ai_marketing_top_content FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_ai_marketing_top_content"
        ON public.umkm_ai_marketing_top_content FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 8. public.umkm_customer_rfm_scores
    ALTER TABLE IF EXISTS public.umkm_customer_rfm_scores ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_customer_rfm_scores" ON public.umkm_customer_rfm_scores;
    DROP POLICY IF EXISTS "authenticated_store_umkm_customer_rfm_scores" ON public.umkm_customer_rfm_scores;
    
    CREATE POLICY "service_role_all_umkm_customer_rfm_scores"
        ON public.umkm_customer_rfm_scores FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_customer_rfm_scores"
        ON public.umkm_customer_rfm_scores FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 9. public.umkm_knowledge_security_audit_logs
    ALTER TABLE IF EXISTS public.umkm_knowledge_security_audit_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_knowledge_security_audit_logs" ON public.umkm_knowledge_security_audit_logs;
    DROP POLICY IF EXISTS "authenticated_store_umkm_knowledge_security_audit_logs" ON public.umkm_knowledge_security_audit_logs;
    
    CREATE POLICY "service_role_all_umkm_knowledge_security_audit_logs"
        ON public.umkm_knowledge_security_audit_logs FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_knowledge_security_audit_logs"
        ON public.umkm_knowledge_security_audit_logs FOR SELECT
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 10. public.umkm_marketing_campaign_media
    ALTER TABLE IF EXISTS public.umkm_marketing_campaign_media ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_marketing_campaign_media" ON public.umkm_marketing_campaign_media;
    DROP POLICY IF EXISTS "authenticated_store_umkm_marketing_campaign_media" ON public.umkm_marketing_campaign_media;
    
    CREATE POLICY "service_role_all_umkm_marketing_campaign_media"
        ON public.umkm_marketing_campaign_media FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_marketing_campaign_media"
        ON public.umkm_marketing_campaign_media FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 11. public.umkm_marketing_reports_automation
    ALTER TABLE IF EXISTS public.umkm_marketing_reports_automation ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_marketing_reports_automation" ON public.umkm_marketing_reports_automation;
    DROP POLICY IF EXISTS "authenticated_store_umkm_marketing_reports_automation" ON public.umkm_marketing_reports_automation;
    
    CREATE POLICY "service_role_all_umkm_marketing_reports_automation"
        ON public.umkm_marketing_reports_automation FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_marketing_reports_automation"
        ON public.umkm_marketing_reports_automation FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 12. public.umkm_marketplace_top_agents
    ALTER TABLE IF EXISTS public.umkm_marketplace_top_agents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_marketplace_top_agents" ON public.umkm_marketplace_top_agents;
    DROP POLICY IF EXISTS "authenticated_select_umkm_marketplace_top_agents" ON public.umkm_marketplace_top_agents;
    
    CREATE POLICY "service_role_all_umkm_marketplace_top_agents"
        ON public.umkm_marketplace_top_agents FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_select_umkm_marketplace_top_agents"
        ON public.umkm_marketplace_top_agents FOR SELECT
        TO authenticated USING (true);

    -- 13. public.umkm_regional_gis_hotspots
    ALTER TABLE IF EXISTS public.umkm_regional_gis_hotspots ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_regional_gis_hotspots" ON public.umkm_regional_gis_hotspots;
    DROP POLICY IF EXISTS "authenticated_select_umkm_regional_gis_hotspots" ON public.umkm_regional_gis_hotspots;
    
    CREATE POLICY "service_role_all_umkm_regional_gis_hotspots"
        ON public.umkm_regional_gis_hotspots FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_select_umkm_regional_gis_hotspots"
        ON public.umkm_regional_gis_hotspots FOR SELECT
        TO authenticated USING (true);

    -- 14. public.umkm_store_inventory
    ALTER TABLE IF EXISTS public.umkm_store_inventory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_store_inventory" ON public.umkm_store_inventory;
    DROP POLICY IF EXISTS "authenticated_store_umkm_store_inventory" ON public.umkm_store_inventory;
    
    CREATE POLICY "service_role_all_umkm_store_inventory"
        ON public.umkm_store_inventory FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_store_inventory"
        ON public.umkm_store_inventory FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 15. public.umkm_store_ocr_scans
    ALTER TABLE IF EXISTS public.umkm_store_ocr_scans ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_store_ocr_scans" ON public.umkm_store_ocr_scans;
    DROP POLICY IF EXISTS "authenticated_store_umkm_store_ocr_scans" ON public.umkm_store_ocr_scans;
    
    CREATE POLICY "service_role_all_umkm_store_ocr_scans"
        ON public.umkm_store_ocr_scans FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_store_ocr_scans"
        ON public.umkm_store_ocr_scans FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

    -- 16. public.umkm_store_purchase_orders
    ALTER TABLE IF EXISTS public.umkm_store_purchase_orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_role_all_umkm_store_purchase_orders" ON public.umkm_store_purchase_orders;
    DROP POLICY IF EXISTS "authenticated_store_umkm_store_purchase_orders" ON public.umkm_store_purchase_orders;
    
    CREATE POLICY "service_role_all_umkm_store_purchase_orders"
        ON public.umkm_store_purchase_orders FOR ALL
        TO service_role USING (true) WITH CHECK (true);
        
    CREATE POLICY "authenticated_store_umkm_store_purchase_orders"
        ON public.umkm_store_purchase_orders FOR ALL
        TO authenticated
        USING (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id')
        WITH CHECK (store_id IS NULL OR store_id = auth.jwt() ->> 'store_id');

END;
$$;
