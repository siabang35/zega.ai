-- ============================================================================
-- ZEGA AI PLATFORM - ENTERPRISE REALTIME CORE SCHEMA
-- Module 04: Enterprise Cloudflare R2 CDN Helper & Realtime Publications
-- Path: supabase/migrations/sql_enterprise/04_enterprise_realtime_and_cdn_helpers.sql
-- ============================================================================

-- 1. CLOUDFLARE R2 CDN RESOLVER FUNCTION FOR ENTERPRISE ASSETS
CREATE OR REPLACE FUNCTION public.fn_get_enterprise_r2_cdn_url(p_asset_path TEXT)
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

-- 2. AUTOMATED TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.fn_update_enterprise_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ATTACH TIMESTAMP TRIGGER TO ENTERPRISE TABLES
DROP TRIGGER IF EXISTS trg_enterprise_orgs_updated ON public.enterprise_organizations;
CREATE TRIGGER trg_enterprise_orgs_updated BEFORE UPDATE ON public.enterprise_organizations FOR EACH ROW EXECUTE FUNCTION public.fn_update_enterprise_timestamp();

DROP TRIGGER IF EXISTS trg_enterprise_members_updated ON public.enterprise_members;
CREATE TRIGGER trg_enterprise_members_updated BEFORE UPDATE ON public.enterprise_members FOR EACH ROW EXECUTE FUNCTION public.fn_update_enterprise_timestamp();

DROP TRIGGER IF EXISTS trg_enterprise_clusters_updated ON public.enterprise_ai_clusters;
CREATE TRIGGER trg_enterprise_clusters_updated BEFORE UPDATE ON public.enterprise_ai_clusters FOR EACH ROW EXECUTE FUNCTION public.fn_update_enterprise_timestamp();

DROP TRIGGER IF EXISTS trg_enterprise_connectors_updated ON public.enterprise_mcp_connectors;
CREATE TRIGGER trg_enterprise_connectors_updated BEFORE UPDATE ON public.enterprise_mcp_connectors FOR EACH ROW EXECUTE FUNCTION public.fn_update_enterprise_timestamp();

DROP TRIGGER IF EXISTS trg_enterprise_orchestrators_updated ON public.enterprise_orchestrators;
CREATE TRIGGER trg_enterprise_orchestrators_updated BEFORE UPDATE ON public.enterprise_orchestrators FOR EACH ROW EXECUTE FUNCTION public.fn_update_enterprise_timestamp();

DROP TRIGGER IF EXISTS trg_enterprise_cost_updated ON public.enterprise_cost_intelligence;
CREATE TRIGGER trg_enterprise_cost_updated BEFORE UPDATE ON public.enterprise_cost_intelligence FOR EACH ROW EXECUTE FUNCTION public.fn_update_enterprise_timestamp();

-- 3. REGISTER ENTERPRISE TABLES IN SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.enterprise_organizations,
            public.enterprise_members,
            public.enterprise_ai_clusters,
            public.enterprise_mcp_connectors,
            public.enterprise_orchestrators,
            public.enterprise_audit_logs,
            public.enterprise_cost_intelligence;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication setup skipped or tables already added.';
END $$;
