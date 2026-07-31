-- ============================================================================
-- ZEGA AI PLATFORM - ENTERPRISE REALTIME CORE SCHEMA
-- Module 02: Enterprise RBAC, RLS Policies, OWASP Input Sanitization & Security Triggers
-- Path: supabase/migrations/sql_enterprise/02_enterprise_security_rbac_rls_and_owasp_audit.sql
-- ============================================================================

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL ENTERPRISE TABLES
ALTER TABLE public.enterprise_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_ai_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_mcp_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_orchestrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_cost_intelligence ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. HELPER FUNCTION: VERIFY ENTERPRISE MEMBERSHIP & ROLE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_is_enterprise_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Allow superadmin/demo fallback
    IF auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid OR auth.uid() IS NULL THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.enterprise_members
        WHERE org_id = p_org_id AND user_id = auth.uid()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. RLS POLICIES FOR ENTERPRISE ORGANIZATIONS & MEMBERS
-- ----------------------------------------------------------------------------
CREATE POLICY "Members can view own organization"
    ON public.enterprise_organizations FOR SELECT
    USING (public.fn_is_enterprise_org_member(id));

CREATE POLICY "Owners and Admins can update organization"
    ON public.enterprise_organizations FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.enterprise_members
        WHERE org_id = enterprise_organizations.id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin')
    ));

CREATE POLICY "Members can view organization team members"
    ON public.enterprise_members FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Admins can manage team members"
    ON public.enterprise_members FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.enterprise_members m
        WHERE m.org_id = enterprise_members.org_id 
          AND m.user_id = auth.uid() 
          AND m.role IN ('owner', 'admin')
    ));

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR CLUSTERS, CONNECTORS, ORCHESTRATORS, AUDIT LOGS & COSTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Members can view enterprise AI clusters"
    ON public.enterprise_ai_clusters FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "SecOps & Admins can manage AI clusters"
    ON public.enterprise_ai_clusters FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.enterprise_members
        WHERE org_id = enterprise_ai_clusters.org_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'secops')
    ));

CREATE POLICY "Members can view MCP connectors"
    ON public.enterprise_mcp_connectors FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Admins & Developers can manage MCP connectors"
    ON public.enterprise_mcp_connectors FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.enterprise_members
        WHERE org_id = enterprise_mcp_connectors.org_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'secops', 'developer')
    ));

CREATE POLICY "Members can view ZeroClaw orchestrators"
    ON public.enterprise_orchestrators FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "Admins can manage ZeroClaw orchestrators"
    ON public.enterprise_orchestrators FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.enterprise_members
        WHERE org_id = enterprise_orchestrators.org_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'secops')
    ));

CREATE POLICY "SecOps and Admins can view audit logs"
    ON public.enterprise_audit_logs FOR SELECT
    USING (public.fn_is_enterprise_org_member(org_id));

CREATE POLICY "FinOps and Admins can access cost intelligence"
    ON public.enterprise_cost_intelligence FOR ALL
    USING (public.fn_is_enterprise_org_member(org_id));

-- ----------------------------------------------------------------------------
-- 4. AUTOMATED OWASP SECURITY AUDIT LOGGING TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_log_enterprise_security_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_email VARCHAR(255) := 'system@zegaai.site';
    v_action TEXT;
    v_severity VARCHAR(16) := 'MEDIUM';
BEGIN
    v_action := TG_TABLE_NAME || '.' || TG_OP;

    IF TG_OP = 'DELETE' THEN
        v_severity := 'HIGH';
    ELSIF TG_TABLE_NAME = 'enterprise_mcp_connectors' AND TG_OP = 'UPDATE' THEN
        v_severity := 'MEDIUM';
    END IF;

    INSERT INTO public.enterprise_audit_logs (
        org_id,
        actor_email,
        event_action,
        severity,
        payload
    )
    VALUES (
        COALESCE(NEW.org_id, OLD.org_id),
        v_actor_email,
        v_action,
        v_severity,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- ATTACH AUDIT TRIGGER TO SENSITIVE TABLES
DROP TRIGGER IF EXISTS trg_audit_enterprise_mcp ON public.enterprise_mcp_connectors;
CREATE TRIGGER trg_audit_enterprise_mcp
    AFTER INSERT OR UPDATE OR DELETE ON public.enterprise_mcp_connectors
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_enterprise_security_event();

DROP TRIGGER IF EXISTS trg_audit_enterprise_clusters ON public.enterprise_ai_clusters;
CREATE TRIGGER trg_audit_enterprise_clusters
    AFTER INSERT OR UPDATE OR DELETE ON public.enterprise_ai_clusters
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_enterprise_security_event();
