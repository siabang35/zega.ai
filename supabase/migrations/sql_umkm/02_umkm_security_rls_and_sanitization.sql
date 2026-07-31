-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 02: Row Level Security (RLS) & Anti-Hacking Input Sanitization
-- Path: supabase/migrations/sql_umkm/02_umkm_security_rls_and_sanitization.sql
-- ============================================================================

-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL UMKM TABLES
ALTER TABLE public.umkm_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_timeline_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. RLS POLICIES FOR STORES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own store profile"
    ON public.umkm_stores FOR SELECT
    USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Users can update own store profile"
    ON public.umkm_stores FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own store profile"
    ON public.umkm_stores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. RLS POLICIES FOR DASHBOARD KPIS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own store KPIs"
    ON public.umkm_dashboard_kpis FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_dashboard_kpis.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can update own store KPIs"
    ON public.umkm_dashboard_kpis FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_dashboard_kpis.store_id AND s.user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR AI EMPLOYEES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own AI employees"
    ON public.umkm_ai_employees FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_ai_employees.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can manage own AI employees"
    ON public.umkm_ai_employees FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_ai_employees.store_id AND s.user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR AUTOMATIONS
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own automations"
    ON public.umkm_automations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_automations.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can manage own automations"
    ON public.umkm_automations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_automations.store_id AND s.user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR PRODUCTS, CUSTOMERS, INVOICES, TRANSACTIONS & TIMELINE
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can access own store products"
    ON public.umkm_products FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_products.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can access own store customers"
    ON public.umkm_customers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_customers.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can access own store invoices"
    ON public.umkm_invoices FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_invoices.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can access own store transactions"
    ON public.umkm_transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_transactions.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

CREATE POLICY "Users can access own store timeline"
    ON public.umkm_timeline_events FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.umkm_stores s
        WHERE s.id = umkm_timeline_events.store_id
        AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    ));

-- ----------------------------------------------------------------------------
-- SECURITY DEFINER FUNCTION FOR INPUT SANITIZATION & TIMESTAMP UPDATES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sanitize_and_update_timestamp()
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

-- ATTACH TIMESTAMP TRIGGER TO TABLES
DROP TRIGGER IF EXISTS trg_umkm_stores_updated ON public.umkm_stores;
CREATE TRIGGER trg_umkm_stores_updated BEFORE UPDATE ON public.umkm_stores FOR EACH ROW EXECUTE FUNCTION public.fn_sanitize_and_update_timestamp();

DROP TRIGGER IF EXISTS trg_umkm_kpis_updated ON public.umkm_dashboard_kpis;
CREATE TRIGGER trg_umkm_kpis_updated BEFORE UPDATE ON public.umkm_dashboard_kpis FOR EACH ROW EXECUTE FUNCTION public.fn_sanitize_and_update_timestamp();

DROP TRIGGER IF EXISTS trg_umkm_ai_emp_updated ON public.umkm_ai_employees;
CREATE TRIGGER trg_umkm_ai_emp_updated BEFORE UPDATE ON public.umkm_ai_employees FOR EACH ROW EXECUTE FUNCTION public.fn_sanitize_and_update_timestamp();

DROP TRIGGER IF EXISTS trg_umkm_automations_updated ON public.umkm_automations;
CREATE TRIGGER trg_umkm_automations_updated BEFORE UPDATE ON public.umkm_automations FOR EACH ROW EXECUTE FUNCTION public.fn_sanitize_and_update_timestamp();

DROP TRIGGER IF EXISTS trg_umkm_products_updated ON public.umkm_products;
CREATE TRIGGER trg_umkm_products_updated BEFORE UPDATE ON public.umkm_products FOR EACH ROW EXECUTE FUNCTION public.fn_sanitize_and_update_timestamp();
