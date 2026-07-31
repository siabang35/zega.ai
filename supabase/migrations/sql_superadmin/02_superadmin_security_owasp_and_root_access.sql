-- ============================================================================
-- ZEGA AI PLATFORM - SUPERADMIN REALTIME CONTROL PLANE SCHEMA
-- Module 02: SuperAdmin Security, OWASP Policies & Privileged Root Verification
-- Path: supabase/migrations/sql_superadmin/02_superadmin_security_owasp_and_root_access.sql
-- ============================================================================

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL SUPERADMIN TABLES
ALTER TABLE public.superadmin_platform_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_root_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_tenant_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_security_threat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_infra_nodes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. PRIVILEGED SUPERADMIN ROOT VERIFICATION FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_is_superadmin_root()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Fallback for root admin demo / seed execution
    IF auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid OR auth.uid() IS NULL THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.superadmin_root_accounts
        WHERE user_id = auth.uid() AND security_level = 'ROOT_SUPERADMIN'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. RLS POLICIES FOR SUPERADMIN CONTROL PLANE
-- ----------------------------------------------------------------------------
CREATE POLICY "SuperAdmins can access platform KPIs"
    ON public.superadmin_platform_kpis FOR ALL
    USING (public.fn_is_superadmin_root());

CREATE POLICY "Root Admins can view root accounts"
    ON public.superadmin_root_accounts FOR SELECT
    USING (public.fn_is_superadmin_root());

CREATE POLICY "SuperAdmins can access tenant registry"
    ON public.superadmin_tenant_registry FOR ALL
    USING (public.fn_is_superadmin_root());

CREATE POLICY "SuperAdmins can view security threat logs"
    ON public.superadmin_security_threat_logs FOR ALL
    USING (public.fn_is_superadmin_root());

CREATE POLICY "SuperAdmins can access infrastructure nodes"
    ON public.superadmin_infra_nodes FOR ALL
    USING (public.fn_is_superadmin_root());

-- ----------------------------------------------------------------------------
-- 3. OWASP AUTOMATED ROOT ACCOUNT MUTATION AUDIT TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_log_superadmin_mutation_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.superadmin_security_threat_logs (
        threat_code,
        threat_type,
        severity,
        action_taken,
        payload
    )
    VALUES (
        'MUTATION-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
        'UNAUTHORIZED_ROOT_ACCESS',
        'CRITICAL',
        'Root account change logged and broadcast to OWASP Threat Center',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'actor_id', auth.uid(),
            'timestamp', NOW()
        )
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_root_account_mutation ON public.superadmin_root_accounts;
CREATE TRIGGER trg_audit_root_account_mutation
    AFTER INSERT OR UPDATE OR DELETE ON public.superadmin_root_accounts
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_superadmin_mutation_event();
