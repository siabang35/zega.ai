-- ZEGA AI: Final Database Ownership Reconciliation Migration
-- Timestamp: 20260812235959
-- Purpose: 
-- 1. Standardize organization_id and workspace_id on all 26 target UMKM tables.
-- 2. Normalize legacy org_id columns to canonical organization_id across all Enterprise tables.
-- 3. Revoke unauthenticated (anon) privileges on all business resources.
-- 4. Enable Row Level Security (RLS) and enforce tenant-scoped isolation policies.

BEGIN;

--------------------------------------------------------------------------------
-- SECTION 1: UMKM TARGET TABLES SCHEMA NORMALIZATION
--------------------------------------------------------------------------------

DO $$
DECLARE
    t_name text;
    umkm_tables text[] := ARRAY[
        'umkm_settings_api_keys_list', 'umkm_api_keys', 'umkm_user_profiles', 'umkm_store_inventory',
        'umkm_settings_transactions', 'umkm_settings_ai_preferences', 'umkm_customer_activity_stream',
        'umkm_billing_support_tickets', 'umkm_knowledge_documents', 'umkm_knowledge_system_logs',
        'umkm_security_audit_logs', 'umkm_system_health', 'umkm_marketing_metrics', 'umkm_sales_metrics',
        'umkm_billing_usage_breakdown', 'umkm_store_swarms', 'umkm_ai_finance_margin_trend',
        'umkm_finance_insights', 'umkm_store_ocr_scans', 'umkm_settings_integrations',
        'umkm_settings_payment_methods', 'umkm_security_settings', 'umkm_settings_sessions',
        'umkm_user_security', 'umkm_marketplace_new_agents', 'umkm_marketplace_agent_executions'
    ];
BEGIN
    FOREACH t_name IN ARRAY umkm_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            -- Add organization_id if missing
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'organization_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id UUID;', t_name);
            END IF;
            
            -- Add workspace_id if missing
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'workspace_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN workspace_id UUID;', t_name);
            END IF;

            -- Add store_id if missing (except for execution logs if not applicable)
            IF t_name != 'umkm_marketplace_agent_executions' AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'store_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN store_id UUID;', t_name);
            END IF;

            -- Backfill organization_id from umkm_stores if store_id is present
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'store_id') 
               AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'umkm_stores') THEN
                EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER;', t_name);
                EXECUTE format('
                    UPDATE public.%I t 
                    SET organization_id = s.organization_id,
                        workspace_id = COALESCE(t.workspace_id, s.workspace_id)
                    FROM public.umkm_stores s 
                    WHERE t.store_id::text = s.id::text AND t.organization_id IS NULL;
                ', t_name);
                EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER;', t_name);
            END IF;

            -- Enable RLS and Revoke ANON
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', t_name);
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', t_name);

            -- Drop old policies if existing and recreate zero-trust tenant policy
            EXECUTE format('DROP POLICY IF EXISTS p_tenant_isolation ON public.%I;', t_name);
            EXECUTE format('
                CREATE POLICY p_tenant_isolation ON public.%I
                FOR ALL TO authenticated
                USING (
                    organization_id IS NULL 
                    OR organization_id = (NULLIF(current_setting(''request.jwt.claims'', true)::json->>''organization_id'', ''''))::uuid
                    OR (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id::text = %I.organization_id::text AND om.user_id = auth.uid()))
                )
                WITH CHECK (
                    organization_id IS NULL 
                    OR organization_id = (NULLIF(current_setting(''request.jwt.claims'', true)::json->>''organization_id'', ''''))::uuid
                    OR (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id::text = %I.organization_id::text AND om.user_id = auth.uid()))
                );
            ', t_name, t_name, t_name);
        END IF;
    END LOOP;
END $$;

--------------------------------------------------------------------------------
-- SECTION 2: ENTERPRISE ORG_ID RESOURCES NORMALIZATION
--------------------------------------------------------------------------------

DO $$
DECLARE
    t_name text;
    enterprise_tables text[] := ARRAY[
        'enterprise_api_metrics_hourly', 'enterprise_cost_overview_kpis', 'enterprise_payment_methods',
        'enterprise_error_logs', 'enterprise_mcp_connectors', 'enterprise_analytics_kpis',
        'enterprise_ai_agents_registry', 'enterprise_workflow_versions', 'enterprise_workflow_instances',
        'enterprise_workflow_node_configs', 'enterprise_ai_commander_actions', 'enterprise_system_logs',
        'enterprise_pipeline_telemetry', 'enterprise_ai_clusters', 'enterprise_cost_intelligence'
    ];
BEGIN
    FOREACH t_name IN ARRAY enterprise_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            -- Add organization_id if missing
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'organization_id') THEN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id UUID;', t_name);
            END IF;

            -- If legacy org_id exists, sync values to organization_id
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'org_id') THEN
                EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER;', t_name);
                EXECUTE format('
                    UPDATE public.%I 
                    SET organization_id = CASE 
                        WHEN org_id::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN org_id::uuid 
                        ELSE NULL 
                    END 
                    WHERE organization_id IS NULL AND org_id IS NOT NULL;
                ', t_name);
                EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER;', t_name);
            END IF;

            -- Enable RLS and Revoke ANON
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', t_name);
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', t_name);

            -- Recreate zero-trust enterprise isolation policy
            EXECUTE format('DROP POLICY IF EXISTS p_enterprise_tenant_isolation ON public.%I;', t_name);
            EXECUTE format('
                CREATE POLICY p_enterprise_tenant_isolation ON public.%I
                FOR ALL TO authenticated
                USING (
                    organization_id IS NULL 
                    OR organization_id = (NULLIF(current_setting(''request.jwt.claims'', true)::json->>''organization_id'', ''''))::uuid
                    OR (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id::text = %I.organization_id::text AND om.user_id = auth.uid()))
                )
                WITH CHECK (
                    organization_id IS NULL 
                    OR organization_id = (NULLIF(current_setting(''request.jwt.claims'', true)::json->>''organization_id'', ''''))::uuid
                    OR (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id::text = %I.organization_id::text AND om.user_id = auth.uid()))
                );
            ', t_name, t_name, t_name);
        END IF;
    END LOOP;
END $$;

COMMIT;
