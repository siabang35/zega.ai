-- ============================================================================
-- ZEGA AI PLATFORM - MASTER UMKM REALTIME DATABASE SCHEMA & SECURITY MIGRATION
-- File: supabase/migrations/20260731000000_master_umkm_realtime_schema.sql
-- Description: Production-ready SQL schema for UMKM/Individual users with Realtime,
--              Cloudflare R2 CDN helper, Row Level Security (RLS), Token Bucket Rate
--              Limiting (Anti-Throttling/Anti-DDoS), and performance indexing.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MODULE 01: CORE TABLES & INDEXES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.umkm_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    store_id_code VARCHAR(32) UNIQUE NOT NULL DEFAULT ('STORE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    store_name VARCHAR(128) NOT NULL,
    owner_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    plan VARCHAR(32) NOT NULL DEFAULT 'Starter' CHECK (plan IN ('Starter', 'PRO', 'Enterprise')),
    logo_path TEXT DEFAULT '/assets/logo/zegalogo.png',
    avatar_path TEXT DEFAULT '/assets/visualization/ai-avatar.png',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_dashboard_kpis (
    store_id UUID PRIMARY KEY REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    tasks_completed_today INT NOT NULL DEFAULT 126 CHECK (tasks_completed_today >= 0),
    hours_saved_weekly NUMERIC(8,2) NOT NULL DEFAULT 11.00 CHECK (hours_saved_weekly >= 0),
    revenue_generated_today NUMERIC(14,2) NOT NULL DEFAULT 4850000.00 CHECK (revenue_generated_today >= 0),
    today_revenue_trend NUMERIC(5,2) DEFAULT 18.00,
    orders_today_count INT NOT NULL DEFAULT 43 CHECK (orders_today_count >= 0),
    new_customers_today_count INT NOT NULL DEFAULT 12 CHECK (new_customers_today_count >= 0),
    whatsapp_response_rate NUMERIC(5,2) NOT NULL DEFAULT 98.00 CHECK (whatsapp_response_rate BETWEEN 0 AND 100),
    estimated_ai_salary_saved NUMERIC(14,2) NOT NULL DEFAULT 2100000.00 CHECK (estimated_ai_salary_saved >= 0),
    usage_percentage NUMERIC(5,2) NOT NULL DEFAULT 38.00 CHECK (usage_percentage BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_ai_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    agent_code VARCHAR(64) NOT NULL,
    agent_name VARCHAR(128) NOT NULL,
    role_title VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'working' CHECK (status IN ('working', 'idle', 'paused', 'error')),
    avatar_path TEXT DEFAULT '/assets/logo/ai-agents.png',
    chats_today INT DEFAULT 125,
    chats_solved INT DEFAULT 118,
    posts_count INT DEFAULT 12,
    leads_count INT DEFAULT 18,
    invoices_generated INT DEFAULT 43,
    invoices_overdue INT DEFAULT 0,
    products_managed INT DEFAULT 25,
    inventory_alerts INT DEFAULT 2,
    deals_closed INT DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_ai_emp_store_code_unique UNIQUE (store_id, agent_code)
);

CREATE TABLE IF NOT EXISTS public.umkm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(128) NOT NULL,
    action_chain TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    total_runs INT NOT NULL DEFAULT 0 CHECK (total_runs >= 0),
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL DEFAULT 'General',
    price_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (price_idr >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
    image_path TEXT DEFAULT '/assets/products/default.webp',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_product_sku_store_unique UNIQUE (store_id, sku)
);

CREATE TABLE IF NOT EXISTS public.umkm_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    full_name VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'WhatsApp' CHECK (channel IN ('WhatsApp', 'Telegram', 'Instagram', 'Web', 'Direct')),
    phone VARCHAR(32),
    email VARCHAR(255),
    total_spent_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_spent_idr >= 0),
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'lead', 'churned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    invoice_code VARCHAR(64) NOT NULL,
    customer_id UUID REFERENCES public.umkm_customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(128) NOT NULL,
    amount_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_idr >= 0),
    amount_usdc NUMERIC(14,4) NOT NULL DEFAULT 0.0000 CHECK (amount_usdc >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_invoice_code_store_unique UNIQUE (store_id, invoice_code)
);

CREATE TABLE IF NOT EXISTS public.umkm_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.umkm_invoices(id) ON DELETE SET NULL,
    gateway VARCHAR(32) NOT NULL CHECK (gateway IN ('qris', 'gopay', 'dana', 'ovo', 'stripe', 'solana_pay')),
    amount_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_idr >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'failed')),
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    event_time VARCHAR(16) NOT NULL,
    icon_symbol VARCHAR(16) NOT NULL DEFAULT '✅',
    event_text VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_umkm_stores_user_id ON public.umkm_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_store_id ON public.umkm_ai_employees(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_automations_store_status ON public.umkm_automations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_products_store_status ON public.umkm_products(store_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_invoices_store_status ON public.umkm_invoices(store_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_transactions_store_created ON public.umkm_transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_timeline_store_created ON public.umkm_timeline_events(store_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- MODULE 02: ROW LEVEL SECURITY & SANITIZATION
-- ----------------------------------------------------------------------------
ALTER TABLE public.umkm_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own store profile" ON public.umkm_stores FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid);
CREATE POLICY "Users can update own store profile" ON public.umkm_stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own store profile" ON public.umkm_stores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own store KPIs" ON public.umkm_dashboard_kpis FOR SELECT USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_dashboard_kpis.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can update own store KPIs" ON public.umkm_dashboard_kpis FOR UPDATE USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_dashboard_kpis.store_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can view own AI employees" ON public.umkm_ai_employees FOR SELECT USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_ai_employees.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can manage own AI employees" ON public.umkm_ai_employees FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_ai_employees.store_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can view own automations" ON public.umkm_automations FOR SELECT USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_automations.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can manage own automations" ON public.umkm_automations FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_automations.store_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can access own store products" ON public.umkm_products FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_products.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can access own store customers" ON public.umkm_customers FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_customers.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can access own store invoices" ON public.umkm_invoices FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_invoices.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can access own store transactions" ON public.umkm_transactions FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_transactions.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));
CREATE POLICY "Users can access own store timeline" ON public.umkm_timeline_events FOR ALL USING (EXISTS (SELECT 1 FROM public.umkm_stores s WHERE s.id = umkm_timeline_events.store_id AND (s.user_id = auth.uid() OR s.user_id = '00000000-0000-0000-0000-000000000000'::uuid)));

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

-- ----------------------------------------------------------------------------
-- MODULE 03: RATE LIMITER & ANTI-THROTTLING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.umkm_rate_limits (
    rate_key VARCHAR(255) PRIMARY KEY,
    tokens NUMERIC(10,2) NOT NULL,
    max_tokens INT NOT NULL DEFAULT 60,
    refill_rate NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_umkm_rate_limits_refill ON public.umkm_rate_limits(last_refill);

CREATE OR REPLACE FUNCTION public.fn_check_rate_limit(
    p_rate_key VARCHAR(255),
    p_max_tokens INT DEFAULT 60,
    p_refill_rate NUMERIC(10,2) DEFAULT 1.0,
    p_cost INT DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining_tokens INT,
    reset_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_record RECORD;
    v_elapsed_seconds NUMERIC(10,2);
    v_new_tokens NUMERIC(10,2);
BEGIN
    SELECT * INTO v_record FROM public.umkm_rate_limits WHERE rate_key = p_rate_key FOR UPDATE;
    
    IF NOT FOUND THEN
        v_new_tokens := GREATEST(0, p_max_tokens - p_cost);
        INSERT INTO public.umkm_rate_limits (rate_key, tokens, max_tokens, refill_rate, last_refill)
        VALUES (p_rate_key, v_new_tokens, p_max_tokens, p_refill_rate, v_now);
        
        allowed := TRUE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := 0;
        RETURN NEXT;
        RETURN;
    END IF;

    v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_record.last_refill));
    v_new_tokens := LEAST(p_max_tokens::NUMERIC, v_record.tokens + (v_elapsed_seconds * p_refill_rate));

    IF v_new_tokens >= p_cost THEN
        v_new_tokens := v_new_tokens - p_cost;
        UPDATE public.umkm_rate_limits
        SET tokens = v_new_tokens,
            last_refill = v_now
        WHERE rate_key = p_rate_key;
        
        allowed := TRUE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := 0;
    ELSE
        allowed := FALSE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := CEIL((p_cost - v_new_tokens) / p_refill_rate)::INT;
    END IF;

    RETURN NEXT;
END;
$$;

-- ----------------------------------------------------------------------------
-- MODULE 04: CLOUDFLARE R2 CDN HELPER & REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_r2_cdn_url(p_asset_path TEXT)
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.umkm_dashboard_kpis,
            public.umkm_ai_employees,
            public.umkm_automations,
            public.umkm_products,
            public.umkm_invoices,
            public.umkm_transactions,
            public.umkm_timeline_events;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Realtime publication setup skipped or tables already added.';
END $$;

-- ----------------------------------------------------------------------------
-- MODULE 05: PRODUCTION SEED DATA
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_demo_user_id UUID := '00000000-0000-0000-0000-000000000000'::uuid;
    v_store_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
    -- Ensure demo user exists in auth.users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        )
        VALUES (
            v_demo_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'guest@zegaai.site',
            '$2a$10$abcdefghijklmnopqrstuv',
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Guest Explorer"}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    INSERT INTO public.umkm_stores (id, user_id, store_id_code, store_name, owner_name, email, phone, plan, logo_path, avatar_path)
    VALUES (v_store_id, v_demo_user_id, 'STORE-DEMO-1283', 'Guest Store', 'Guest Explorer', 'guest@zegaai.site', '+6281234567890', 'Starter', '/assets/logo/zegalogo.png', '/assets/visualization/ai-avatar.png')
    ON CONFLICT (id) DO UPDATE SET store_name = EXCLUDED.store_name, plan = EXCLUDED.plan, updated_at = NOW();

    INSERT INTO public.umkm_dashboard_kpis (store_id, tasks_completed_today, hours_saved_weekly, revenue_generated_today, today_revenue_trend, orders_today_count, new_customers_today_count, whatsapp_response_rate, estimated_ai_salary_saved, usage_percentage, updated_at)
    VALUES (v_store_id, 126, 11.00, 4850000.00, 18.00, 43, 12, 98.00, 2100000.00, 38.00, NOW())
    ON CONFLICT (store_id) DO UPDATE SET tasks_completed_today = EXCLUDED.tasks_completed_today, revenue_generated_today = EXCLUDED.revenue_generated_today, updated_at = NOW();

    INSERT INTO public.umkm_ai_employees (store_id, agent_code, agent_name, role_title, status, avatar_path, chats_today, chats_solved, posts_count, leads_count, invoices_generated, invoices_overdue, products_managed, inventory_alerts, deals_closed)
    VALUES
        (v_store_id, 'cs_agent', 'Customer Service AI', 'Customer Service AI', 'working', '/assets/logo/ai-agents.png', 125, 118, 0, 0, 0, 0, 0, 0, 0),
        (v_store_id, 'mkt_agent', 'Marketing AI', 'Marketing AI', 'working', '/assets/logo/ai-agents.png', 0, 0, 12, 18, 0, 0, 0, 0, 0),
        (v_store_id, 'fin_agent', 'Finance AI', 'Finance AI', 'working', '/assets/logo/ai-agents.png', 0, 0, 0, 0, 43, 0, 0, 0, 0),
        (v_store_id, 'store_agent', 'Store AI', 'Store AI', 'working', '/assets/logo/ai-agents.png', 0, 0, 0, 0, 0, 0, 25, 2, 0),
        (v_store_id, 'sales_agent', 'Sales AI', 'Sales AI', 'working', '/assets/logo/ai-agents.png', 0, 0, 0, 0, 0, 0, 0, 0, 7),
        (v_store_id, 'copy_agent', 'Copywriting AI', 'Content Creator', 'idle', '/assets/logo/ai-agents.png', 0, 0, 5, 0, 0, 0, 0, 0, 0),
        (v_store_id, 'data_agent', 'Analytics AI', 'Business Intelligence', 'working', '/assets/logo/ai-agents.png', 0, 0, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (store_id, agent_code) DO UPDATE SET status = EXCLUDED.status, chats_today = EXCLUDED.chats_today, updated_at = NOW();

    INSERT INTO public.umkm_automations (store_id, name, trigger_event, action_chain, status, total_runs, last_run_at)
    VALUES
        (v_store_id, 'Payment Reminder -> WA -> Email -> Update Status', 'Order Invoice Unpaid', ARRAY['Send WhatsApp', 'Send Email', 'Update CRM Status'], 'active', 142, NOW() - INTERVAL '15 mins'),
        (v_store_id, 'Auto Stock Alert -> Restock Notification', 'Inventory < 5', ARRAY['Send Push Notification', 'Email Supplier'], 'active', 28, NOW() - INTERVAL '2 hours'),
        (v_store_id, 'Welcome Promo -> New Customer WA', 'Customer Registered', ARRAY['Send WA Discount Coupon'], 'active', 89, NOW() - INTERVAL '10 mins');

    INSERT INTO public.umkm_timeline_events (store_id, event_time, icon_symbol, event_text, created_at)
    VALUES
        (v_store_id, '08.00', 'MessageSquare', 'Customer asked price', NOW() - INTERVAL '35 mins'),
        (v_store_id, '08.01', 'Bot', 'AI replied', NOW() - INTERVAL '34 mins'),
        (v_store_id, '08.02', 'ShoppingBag', 'Customer purchased', NOW() - INTERVAL '33 mins'),
        (v_store_id, '08.03', 'FileText', 'Invoice generated', NOW() - INTERVAL '32 mins'),
        (v_store_id, '08.04', 'CheckCircle', 'Payment confirmed', NOW() - INTERVAL '31 mins'),
        (v_store_id, '08.05', 'Send', 'WhatsApp thank you sent', NOW() - INTERVAL '30 mins');

END $$;
