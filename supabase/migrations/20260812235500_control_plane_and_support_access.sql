-- ============================================================================
-- ZEGA AI PLATFORM — CONTROL PLANE & PRIVILEGED SUPPORT ACCESS MIGRATION
-- File: supabase/migrations/20260812235500_control_plane_and_support_access.sql
-- Description: Isolates Superadmin Control Plane metadata from tenant Data Plane
-- and implements time-limited, audited privileged support access tickets.
-- ============================================================================

-- ─── 1. CONTROL PLANE ISOLATION & RLS POLICIES ────────────────────────────────

-- Control plane tables must not be accessible to standard tenant users or anon callers
DO $$
DECLARE
    t TEXT;
    control_tables TEXT[] := ARRAY[
        'superadmin_tenant_registry',
        'superadmin_platform_kpis',
        'superadmin_infra_nodes',
        'superadmin_security_threat_logs',
        'superadmin_rate_limits',
        'superadmin_root_accounts'
    ];
BEGIN
    FOREACH t IN ARRAY control_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

            -- Revoke anon access
            EXECUTE format('DROP POLICY IF EXISTS "control_plane_anon_deny" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "control_plane_superadmin_policy" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "tenant_select_policy" ON public.%I', t);

            -- Policy: Only superadmin service roles or root superadmins can access control plane
            EXECUTE format('CREATE POLICY "control_plane_superadmin_policy" ON public.%I FOR ALL USING (
                (auth.jwt() ->> ''role'' = ''superadmin'') OR 
                EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text = ''superadmin'')
            )', t);
        END IF;
    END LOOP;
END;
$$;

-- Global catalogs (read-only for authenticated tenant users, deny anon write)
DO $$
DECLARE
    t TEXT;
    global_tables TEXT[] := ARRAY[
        'umkm_billing_plans',
        'enterprise_help_faqs',
        'enterprise_system_status'
    ];
BEGIN
    FOREACH t IN ARRAY global_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

            EXECUTE format('DROP POLICY IF EXISTS "global_read_authenticated" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "tenant_select_policy" ON public.%I', t);

            EXECUTE format('CREATE POLICY "global_read_authenticated" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'' OR auth.role() = ''service_role'')', t);
        END IF;
    END LOOP;
END;
$$;

-- ─── 2. PRIVILEGED SUPPORT ACCESS GOVERNANCE SYSTEM ─────────────────────────

CREATE TABLE IF NOT EXISTS public.support_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    superadmin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_reference VARCHAR(64) NOT NULL,
    justification TEXT NOT NULL,
    scope VARCHAR(64) NOT NULL DEFAULT 'read_only' CHECK (scope IN ('read_only', 'read_write', 'emergency_break_glass')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
    approved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_access_request_org_policy" ON public.support_access_requests
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
        OR superadmin_id = auth.uid()
        OR (auth.jwt() ->> 'role' = 'superadmin')
    );

-- Helper function to check if active break-glass support access exists for superadmin
CREATE OR REPLACE FUNCTION public.fn_has_active_support_access(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.support_access_requests
        WHERE organization_id = p_org_id
          AND superadmin_id = auth.uid()
          AND status = 'approved'
          AND NOW() BETWEEN granted_at AND expires_at
    );
END;
$$;
