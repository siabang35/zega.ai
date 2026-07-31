-- ============================================================================
-- ZEGA AI PLATFORM - SUPERADMIN REALTIME CONTROL PLANE SCHEMA
-- Module 04: SuperAdmin Cloudflare R2 CDN Helper & Realtime Publications
-- Path: supabase/migrations/sql_superadmin/04_superadmin_realtime_and_cdn_helpers.sql
-- ============================================================================

-- 1. CLOUDFLARE R2 CDN RESOLVER FUNCTION FOR SUPERADMIN ASSETS
CREATE OR REPLACE FUNCTION public.fn_get_superadmin_r2_cdn_url(p_asset_path TEXT)
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
CREATE OR REPLACE FUNCTION public.fn_update_superadmin_timestamp()
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

-- ATTACH TIMESTAMP TRIGGER TO SUPERADMIN TABLES
DROP TRIGGER IF EXISTS trg_superadmin_kpis_updated ON public.superadmin_platform_kpis;
CREATE TRIGGER trg_superadmin_kpis_updated BEFORE UPDATE ON public.superadmin_platform_kpis FOR EACH ROW EXECUTE FUNCTION public.fn_update_superadmin_timestamp();

DROP TRIGGER IF EXISTS trg_superadmin_roots_updated ON public.superadmin_root_accounts;
CREATE TRIGGER trg_superadmin_roots_updated BEFORE UPDATE ON public.superadmin_root_accounts FOR EACH ROW EXECUTE FUNCTION public.fn_update_superadmin_timestamp();

DROP TRIGGER IF EXISTS trg_superadmin_tenants_updated ON public.superadmin_tenant_registry;
CREATE TRIGGER trg_superadmin_tenants_updated BEFORE UPDATE ON public.superadmin_tenant_registry FOR EACH ROW EXECUTE FUNCTION public.fn_update_superadmin_timestamp();

DROP TRIGGER IF EXISTS trg_superadmin_nodes_updated ON public.superadmin_infra_nodes;
CREATE TRIGGER trg_superadmin_nodes_updated BEFORE UPDATE ON public.superadmin_infra_nodes FOR EACH ROW EXECUTE FUNCTION public.fn_update_superadmin_timestamp();

-- 3. REGISTER SUPERADMIN TABLES IN SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.superadmin_platform_kpis,
            public.superadmin_root_accounts,
            public.superadmin_tenant_registry,
            public.superadmin_security_threat_logs,
            public.superadmin_infra_nodes;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication setup skipped or tables already added.';
END $$;
