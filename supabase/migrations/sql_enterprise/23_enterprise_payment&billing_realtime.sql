-- ============================================================================
-- ZEGA ENTERPRISE PAYMENTS & BILLING REALTIME DATABASE & CDN TELEMETRY SCHEMA
-- Migration: 23_enterprise_payment&billing_realtime.sql
-- Description: Real-time schema for Enterprise Cost Intelligence, Plan Limits, Invoices, CDN Bandwidth & Payment Methods
-- ============================================================================

-- 1. Create enterprise_cost_overview_kpis table
CREATE TABLE IF NOT EXISTS public.enterprise_cost_overview_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    current_balance_status TEXT DEFAULT 'No outstanding balance',
    monthly_spend NUMERIC(12, 2) DEFAULT 28430.50,
    monthly_spend_trend TEXT DEFAULT '+14.3%',
    monthly_spend_compare_label TEXT DEFAULT 'vs Apr',
    yearly_spend NUMERIC(12, 2) DEFAULT 246742.20,
    yearly_spend_trend TEXT DEFAULT '+18.7%',
    yearly_spend_compare_label TEXT DEFAULT 'vs 2024',
    next_invoice_date DATE DEFAULT '2025-05-28',
    next_invoice_status TEXT DEFAULT 'Due in 5 days',
    primary_payment_method TEXT DEFAULT 'Visa **** 4242',
    primary_payment_expiry TEXT DEFAULT '03/28',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create enterprise_plan_usage_limits table
CREATE TABLE IF NOT EXISTS public.enterprise_plan_usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    metric_name TEXT NOT NULL,
    current_val TEXT NOT NULL,
    limit_val TEXT NOT NULL,
    percentage_used NUMERIC(5, 2) NOT NULL,
    bar_color_hex TEXT NOT NULL DEFAULT '#6366F1',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create enterprise_spending_breakdown table
CREATE TABLE IF NOT EXISTS public.enterprise_spending_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    category_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#6366F1',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create enterprise_top_cost_drivers table
CREATE TABLE IF NOT EXISTS public.enterprise_top_cost_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    driver_name TEXT NOT NULL,
    volume_str TEXT NOT NULL,
    cost_amount NUMERIC(12, 2) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create enterprise_invoices table
CREATE TABLE IF NOT EXISTS public.enterprise_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    invoice_id TEXT UNIQUE NOT NULL,
    period TEXT NOT NULL,
    status TEXT CHECK (status IN ('Unpaid', 'Paid', 'Pending', 'Overdue')) DEFAULT 'Paid',
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create enterprise_payment_methods table
CREATE TABLE IF NOT EXISTS public.enterprise_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    brand TEXT NOT NULL, -- Visa, Mastercard, AMEX
    last4 TEXT NOT NULL,
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create enterprise_cdn_billing_telemetry table
CREATE TABLE IF NOT EXISTS public.enterprise_cdn_billing_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT '99999999-9999-9999-9999-999999999999',
    cdn_provider TEXT NOT NULL DEFAULT 'Cloudflare Edge CDN',
    bandwidth_gb NUMERIC(12, 2) NOT NULL DEFAULT 3450.00,
    edge_requests_million NUMERIC(8, 2) NOT NULL DEFAULT 12.70,
    cache_hit_ratio NUMERIC(5, 2) NOT NULL DEFAULT 98.40,
    monthly_cdn_cost NUMERIC(12, 2) NOT NULL DEFAULT 2110.30,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Seed Initial Data
INSERT INTO public.enterprise_cost_overview_kpis (org_id, current_balance, monthly_spend, yearly_spend, next_invoice_date)
VALUES ('99999999-9999-9999-9999-999999999999', 0.00, 28430.50, 246742.20, '2025-05-28')
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_plan_usage_limits (org_id, metric_name, current_val, limit_val, percentage_used, bar_color_hex, display_order)
VALUES
('99999999-9999-9999-9999-999999999999', 'AI Requests', '12.7M', '50M', 25.40, '#6366F1', 1),
('99999999-9999-9999-9999-999999999999', 'Workflow Executions', '634K', '2M', 31.70, '#3B82F6', 2),
('99999999-9999-9999-9999-999999999999', 'Active AI Agents', '128', '250', 51.20, '#8B5CF6', 3),
('99999999-9999-9999-9999-999999999999', 'Storage', '2.34 TB', '5 TB', 46.80, '#10B981', 4),
('99999999-9999-9999-9999-999999999999', 'Vector Storage', '1.52 TB', '3 TB', 50.60, '#F59E0B', 5),
('99999999-9999-9999-9999-999999999999', 'Data Transfer & CDN', '3.45 TB', '10 TB', 34.50, '#06B6D4', 6)
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_spending_breakdown (org_id, category_name, amount, percentage, color_hex, display_order)
VALUES
('99999999-9999-9999-9999-999999999999', 'LLM & Inference', 12430.20, 43.70, '#8B5CF6', 1),
('99999999-9999-9999-9999-999999999999', 'MCP Calls', 6210.10, 21.80, '#3B82F6', 2),
('99999999-9999-9999-9999-999999999999', 'Storage', 4320.60, 15.20, '#06B6D4', 3),
('99999999-9999-9999-9999-999999999999', 'Data Transfer & CDN', 2110.30, 7.40, '#10B981', 4),
('99999999-9999-9999-9999-999999999999', 'Other Services', 3359.30, 11.80, '#F59E0B', 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_top_cost_drivers (org_id, driver_name, volume_str, cost_amount, display_order)
VALUES
('99999999-9999-9999-9999-999999999999', 'GPT-4o (OpenAI)', '5.2M requests', 9432.10, 1),
('99999999-9999-9999-9999-999999999999', 'Claude 3.5', '4.2M requests', 3210.80, 2),
('99999999-9999-9999-9999-999999999999', 'Vector Search', '15.2M queries', 4120.50, 3),
('99999999-9999-9999-9999-999999999999', 'Supabase DB', '2.24 TB storage', 3230.90, 4),
('99999999-9999-9999-9999-999999999999', 'Stripe MCP', '1.0M calls', 2110.30, 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_invoices (org_id, invoice_id, period, status, amount, due_date, paid_date)
VALUES
('99999999-9999-9999-9999-999999999999', 'INV-2025-00056', 'May 1 – May 31, 2025', 'Unpaid', 28430.50, '2025-05-28', NULL),
('99999999-9999-9999-9999-999999999999', 'INV-2025-00055', 'Apr 1 – Apr 30, 2025', 'Paid', 24892.10, '2025-04-28', '2025-04-25'),
('99999999-9999-9999-9999-999999999999', 'INV-2025-00054', 'Mar 1 – Mar 31, 2025', 'Paid', 21345.80, '2025-03-28', '2025-03-25'),
('99999999-9999-9999-9999-999999999999', 'INV-2025-00053', 'Feb 1 – Feb 28, 2025', 'Paid', 18892.30, '2025-02-28', '2025-02-25')
ON CONFLICT (invoice_id) DO NOTHING;

INSERT INTO public.enterprise_payment_methods (org_id, brand, last4, expiry_month, expiry_year, is_primary)
VALUES
('99999999-9999-9999-9999-999999999999', 'Visa', '4242', 3, 2028, TRUE),
('99999999-9999-9999-9999-999999999999', 'Mastercard', '8888', 11, 2027, FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO public.enterprise_cdn_billing_telemetry (org_id, cdn_provider, bandwidth_gb, edge_requests_million, cache_hit_ratio, monthly_cdn_cost)
VALUES
('99999999-9999-9999-9999-999999999999', 'Cloudflare Edge CDN', 3450.00, 12.70, 98.40, 2110.30)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.enterprise_cost_overview_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_plan_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_spending_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_top_cost_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_cdn_billing_telemetry ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation (Drop first if exists)
DROP POLICY IF EXISTS "Allow public read access to enterprise_cost_overview_kpis" ON public.enterprise_cost_overview_kpis;
CREATE POLICY "Allow public read access to enterprise_cost_overview_kpis" ON public.enterprise_cost_overview_kpis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to enterprise_plan_usage_limits" ON public.enterprise_plan_usage_limits;
CREATE POLICY "Allow public read access to enterprise_plan_usage_limits" ON public.enterprise_plan_usage_limits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to enterprise_spending_breakdown" ON public.enterprise_spending_breakdown;
CREATE POLICY "Allow public read access to enterprise_spending_breakdown" ON public.enterprise_spending_breakdown FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to enterprise_top_cost_drivers" ON public.enterprise_top_cost_drivers;
CREATE POLICY "Allow public read access to enterprise_top_cost_drivers" ON public.enterprise_top_cost_drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to enterprise_invoices" ON public.enterprise_invoices;
CREATE POLICY "Allow public read access to enterprise_invoices" ON public.enterprise_invoices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to enterprise_payment_methods" ON public.enterprise_payment_methods;
CREATE POLICY "Allow public read access to enterprise_payment_methods" ON public.enterprise_payment_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to enterprise_cdn_billing_telemetry" ON public.enterprise_cdn_billing_telemetry;
CREATE POLICY "Allow public read access to enterprise_cdn_billing_telemetry" ON public.enterprise_cdn_billing_telemetry FOR SELECT USING (true);

-- Enable Realtime Idempotently
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_cost_overview_kpis;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_plan_usage_limits;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_spending_breakdown;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_top_cost_drivers;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_invoices;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_payment_methods;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_cdn_billing_telemetry;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;
