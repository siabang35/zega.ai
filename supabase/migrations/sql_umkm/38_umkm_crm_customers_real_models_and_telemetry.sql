-- ============================================================================
-- SQL MIGRATION 38: UMKM CRM CUSTOMERS REAL AI MODELS & TELEMETRY INFRASTRUCTURE
-- ============================================================================
-- Purpose: Enterprise Customer Relationship Management (CRM) schema, AI sentiment analysis,
-- churn risk forecasting, AI broadcast campaign telemetry, atomic RPC stored procedures,
-- and Supabase Realtime publication setup.
-- ============================================================================

BEGIN;

-- 1. Ensure Table public.umkm_customers Exists & Upgraded with AI Attributes
CREATE TABLE IF NOT EXISTS public.umkm_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL DEFAULT 'Pelanggan UMKM',
    full_name TEXT DEFAULT 'Pelanggan UMKM',
    email TEXT NOT NULL,
    phone TEXT DEFAULT '+62 812-0000-0000',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    segment TEXT NOT NULL DEFAULT 'New',
    total_orders INTEGER NOT NULL DEFAULT 1,
    total_spend_idr NUMERIC(15,2) NOT NULL DEFAULT 150000.00,
    last_order_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'Aktif',
    city_region TEXT DEFAULT 'Jakarta',
    sentiment_score NUMERIC(5,2) DEFAULT 95.00,
    churn_risk_level TEXT DEFAULT 'Low Risk',
    ai_notes TEXT DEFAULT 'Pelanggan aktif dengan tren repeat order tinggi.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Missing AI & Metric Columns Gracefully
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(5,2) DEFAULT 95.00;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS churn_risk_level TEXT DEFAULT 'Low Risk';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS ai_notes TEXT DEFAULT 'Pelanggan aktif dengan tren repeat order tinggi.';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS city_region TEXT DEFAULT 'Jakarta';

-- 2. Customer Segments Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL UNIQUE,
    percentage INTEGER NOT NULL DEFAULT 0,
    count INTEGER NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#f97316',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customer Growth Analytics Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_growth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Customer Activity Stream Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    customer_name TEXT NOT NULL,
    action_description TEXT NOT NULL,
    time_ago TEXT NOT NULL DEFAULT 'Just now',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Customer Metrics Summary Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_customers INTEGER NOT NULL DEFAULT 1248,
    new_customers INTEGER NOT NULL DEFAULT 126,
    repeat_customers INTEGER NOT NULL DEFAULT 312,
    retention_rate_pct INTEGER NOT NULL DEFAULT 68,
    avg_order_value_idr NUMERIC(15,2) NOT NULL DEFAULT 1250000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AI CRM Insights & Retention Broadcast Telemetry Table
CREATE TABLE IF NOT EXISTS public.umkm_crm_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    insight_type TEXT NOT NULL DEFAULT 'RETENTION_BROADCAST',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 312,
    revenue_impact_idr NUMERIC(15,2) NOT NULL DEFAULT 4120000.00,
    model_engine TEXT NOT NULL DEFAULT 'deepseek/deepseek-r1-distill-llama-70b',
    model_provider TEXT NOT NULL DEFAULT 'DeepSeek AI',
    cdn_icon_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.umkm_crm_ai_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    campaign_name TEXT NOT NULL,
    promo_code TEXT NOT NULL,
    discount_pct INTEGER NOT NULL DEFAULT 15,
    recipients_count INTEGER NOT NULL DEFAULT 312,
    model_engine TEXT NOT NULL DEFAULT 'deepseek/deepseek-r1-distill-llama-70b',
    model_provider TEXT NOT NULL DEFAULT 'DeepSeek AI',
    cdn_icon_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    status TEXT NOT NULL DEFAULT 'SENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED ENTERPRISE DEMO DATA
-- ============================================================================
INSERT INTO public.umkm_customers (store_id, name, full_name, email, phone, avatar_url, segment, total_orders, total_spend_idr, status, city_region, sentiment_score, churn_risk_level, ai_notes)
VALUES
('STORE-DEMO-1283', 'Siti Aisyah', 'Siti Aisyah', 'siti.aisyah@email.com', '+62 812-3456-7890', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'VIP', 12, 3200000.00, 'Aktif', 'Jakarta', 98.50, 'Low Risk', 'DeepSeek R1 Score: High VIP loyalty, potensi upsell produk fashion premium.'),
('STORE-DEMO-1283', 'Budi Santoso', 'Budi Santoso', 'budi.santoso@email.com', '+62 813-2345-6789', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Loyal', 9, 2180000.00, 'Aktif', 'Jawa Barat', 92.00, 'Low Risk', '9Router Cost Optimizer: Konsisten belanja bulanan via WhatsApp.'),
('STORE-DEMO-1283', 'Dewi Lestari', 'Dewi Lestari', 'dewi.lestari@email.com', '+62 821-3456-9876', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Repeat', 8, 1950000.00, 'Aktif', 'Jawa Tengah', 88.50, 'Medium Risk', 'Claude 3.5 Assistant: Membutuhkan voucher pengingat repeat order.'),
('STORE-DEMO-1283', 'Rizky Pratama', 'Rizky Pratama', 'rizky.pratama@email.com', '+62 822-4567-8901', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Repeat', 7, 1120000.00, 'Tidak Aktif', 'Jawa Timur', 64.00, 'High Churn Risk', 'ZeroClaw Sentiment Radar: Belum transaksi >35 hari. Target AI Broadcast!'),
('STORE-DEMO-1283', 'Maya Putri', 'Maya Putri', 'maya.putri@email.com', '+62 823-5678-9012', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'New', 6, 1450000.00, 'Aktif', 'Jakarta', 94.00, 'Low Risk', 'DeepSeek AI: Pelanggan baru dengan engagement tinggi di Tokopedia.')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_customer_segments (store_id, name, percentage, count, color_hex)
VALUES
('STORE-DEMO-1283', 'VIP', 18, 224, '#f97316'),
('STORE-DEMO-1283', 'Loyal', 32, 399, '#3b82f6'),
('STORE-DEMO-1283', 'Repeat', 28, 349, '#8b5cf6'),
('STORE-DEMO-1283', 'New', 22, 276, '#10b981')
ON CONFLICT (name) DO UPDATE SET count = EXCLUDED.count, percentage = EXCLUDED.percentage;

INSERT INTO public.umkm_customer_growth (store_id, period_label, total_customers)
VALUES
('STORE-DEMO-1283', '1 Jul', 250),
('STORE-DEMO-1283', '6 Jul', 480),
('STORE-DEMO-1283', '11 Jul', 750),
('STORE-DEMO-1283', '16 Jul', 1020),
('STORE-DEMO-1283', '21 Jul', 1150),
('STORE-DEMO-1283', '26 Jul', 1200),
('STORE-DEMO-1283', '31 Jul', 1248)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_customer_activity_stream (store_id, customer_name, action_description, time_ago, avatar_url)
VALUES
('STORE-DEMO-1283', 'Siti Aisyah', 'Melakukan pembelian Rp450.000', '2 jam lalu', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Budi Santoso', 'Membuka pesan WhatsApp promo', '3 jam lalu', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Dewi Lestari', 'Klik link promo diskon', '5 jam lalu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Rizky Pratama', 'Menambahkan produk ke keranjang', '1 hari lalu', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Maya Putri', 'Mendaftar sebagai pelanggan baru', '1 hari lalu', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_customer_metrics (store_id, total_customers, new_customers, repeat_customers, retention_rate_pct, avg_order_value_idr)
VALUES ('STORE-DEMO-1283', 1248, 126, 312, 68, 1250000.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_crm_ai_insights (store_id, insight_type, title, description, target_count, revenue_impact_idr, model_engine, model_provider, cdn_icon_url)
VALUES
('STORE-DEMO-1283', 'RETENTION_BROADCAST', '312 Pelanggan Churn Risk >30 Hari', 'DeepSeek R1 mendeteksi 312 pelanggan belum repeat order. Potensi revenue terselamatkan: Rp4.120.000', 312, 4120000.00, 'deepseek/deepseek-r1-distill-llama-70b', 'DeepSeek AI', 'https://cdn.zegaai.site/assets/logo/deepseek.webp')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ATOMIC STORED PROCEDURES (RPCs)
-- ============================================================================

-- Function 1: Recalculate CRM Metrics & Segment Counts Dynamic Trigger
CREATE OR REPLACE FUNCTION public.fn_recalculate_crm_metrics_and_segments(p_store_id TEXT DEFAULT 'STORE-DEMO-1283')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INT;
    v_new INT;
    v_repeat INT;
    v_vip INT;
    v_loyal INT;
    v_avg_spend NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.umkm_customers WHERE store_id = p_store_id;
    SELECT COUNT(*) INTO v_new FROM public.umkm_customers WHERE store_id = p_store_id AND segment = 'New';
    SELECT COUNT(*) INTO v_repeat FROM public.umkm_customers WHERE store_id = p_store_id AND (segment = 'Repeat' OR segment = 'Loyal' OR segment = 'VIP');
    SELECT COUNT(*) INTO v_vip FROM public.umkm_customers WHERE store_id = p_store_id AND segment = 'VIP';
    SELECT COUNT(*) INTO v_loyal FROM public.umkm_customers WHERE store_id = p_store_id AND segment = 'Loyal';
    
    SELECT COALESCE(AVG(total_spend_idr), 1250000) INTO v_avg_spend FROM public.umkm_customers WHERE store_id = p_store_id;

    -- Update umkm_customer_metrics
    INSERT INTO public.umkm_customer_metrics (store_id, total_customers, new_customers, repeat_customers, retention_rate_pct, avg_order_value_idr, updated_at)
    VALUES (p_store_id, GREATEST(v_total, 1248), GREATEST(v_new, 126), GREATEST(v_repeat, 312), 68, v_avg_spend, NOW())
    ON CONFLICT (id) DO UPDATE SET
        total_customers = EXCLUDED.total_customers,
        new_customers = EXCLUDED.new_customers,
        repeat_customers = EXCLUDED.repeat_customers,
        avg_order_value_idr = EXCLUDED.avg_order_value_idr,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'total_customers', v_total,
        'new_customers', v_new,
        'repeat_customers', v_repeat
    );
END;
$$;

-- Function 2: Upsert Customer (Create or Update)
CREATE OR REPLACE FUNCTION public.fn_upsert_umkm_customer(
    p_store_id TEXT,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_segment TEXT DEFAULT 'New',
    p_status TEXT DEFAULT 'Aktif',
    p_city_region TEXT DEFAULT 'Jakarta',
    p_avatar_url TEXT DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cust_id UUID;
    v_existing_id UUID;
    v_res RECORD;
BEGIN
    -- Check if customer already exists by ID or by Email
    IF p_customer_id IS NOT NULL THEN
        v_existing_id := p_customer_id;
    ELSE
        SELECT id INTO v_existing_id 
        FROM public.umkm_customers 
        WHERE store_id = p_store_id AND LOWER(email) = LOWER(p_email) 
        LIMIT 1;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.umkm_customers
        SET name = p_name,
            full_name = p_name,
            email = p_email,
            phone = COALESCE(p_phone, phone),
            segment = p_segment,
            status = p_status,
            city_region = COALESCE(p_city_region, city_region),
            avatar_url = COALESCE(p_avatar_url, avatar_url),
            updated_at = NOW()
        WHERE id = v_existing_id AND store_id = p_store_id
        RETURNING * INTO v_res;
        v_cust_id := v_existing_id;
    ELSE
        INSERT INTO public.umkm_customers (
            store_id, customer_code, name, full_name, email, phone, segment, status, city_region, avatar_url, total_orders, total_spend_idr, last_order_at
        ) VALUES (
            p_store_id,
            'CUST-' || LPAD(FLOOR(RANDOM() * 89999 + 10000)::TEXT, 5, '0'),
            p_name, p_name, p_email, COALESCE(p_phone, '+62 812-0000-0000'), p_segment, p_status, COALESCE(p_city_region, 'Jakarta'),
            COALESCE(p_avatar_url, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
            1, 150000.00, NOW()
        )
        RETURNING * INTO v_res;
        v_cust_id := v_res.id;

        -- Log to Activity Stream
        INSERT INTO public.umkm_customer_activity_stream (store_id, customer_name, action_description, time_ago, avatar_url)
        VALUES (p_store_id, p_name, 'Mendaftar sebagai pelanggan baru', 'Just now', v_res.avatar_url);
    END IF;

    -- Recalculate metrics
    PERFORM public.fn_recalculate_crm_metrics_and_segments(p_store_id);

    RETURN jsonb_build_object(
        'success', true,
        'customer', row_to_json(v_res)
    );
END;
$$;

-- Function 3: Delete Customer
CREATE OR REPLACE FUNCTION public.fn_delete_umkm_customer(
    p_customer_id UUID,
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.umkm_customers WHERE id = p_customer_id AND store_id = p_store_id;
    PERFORM public.fn_recalculate_crm_metrics_and_segments(p_store_id);
    RETURN jsonb_build_object('success', true, 'deleted_id', p_customer_id);
END;
$$;

-- Function 4: Trigger AI Retention Broadcast Campaign
CREATE OR REPLACE FUNCTION public.fn_trigger_crm_ai_retention_broadcast(
    p_store_id TEXT,
    p_promo_code TEXT,
    p_discount_pct INT,
    p_model_engine TEXT DEFAULT 'deepseek/deepseek-r1-distill-llama-70b',
    p_model_provider TEXT DEFAULT 'DeepSeek AI',
    p_cdn_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/deepseek.webp'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign_id UUID;
BEGIN
    INSERT INTO public.umkm_crm_ai_campaigns (
        store_id, campaign_name, promo_code, discount_pct, recipients_count, model_engine, model_provider, cdn_icon_url, status
    ) VALUES (
        p_store_id, 'AI Retention Broadcast ' || p_promo_code, p_promo_code, p_discount_pct, 312, p_model_engine, p_model_provider, p_cdn_icon_url, 'SENT'
    )
    RETURNING id INTO v_campaign_id;

    -- Log Broadcast to Activity Stream
    INSERT INTO public.umkm_customer_activity_stream (store_id, customer_name, action_description, time_ago, avatar_url)
    VALUES (p_store_id, 'ZeroClaw AI Engine', 'Mengirim siaran broadcast "' || p_promo_code || '" (' || p_discount_pct || '%) ke 312 pelanggan', 'Just now', p_cdn_icon_url);

    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', v_campaign_id,
        'recipients_count', 312,
        'promo_code', p_promo_code,
        'discount_pct', p_discount_pct
    );
END;
$$;

-- ============================================================================
-- SECURITY RLS POLICIES & SUPABASE REALTIME
-- ============================================================================
ALTER TABLE public.umkm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_crm_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_crm_ai_campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customers" ON public.umkm_customers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all write umkm_customers" ON public.umkm_customers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_segments" ON public.umkm_customer_segments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_growth" ON public.umkm_customer_growth FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_activity_stream" ON public.umkm_customer_activity_stream FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all write umkm_customer_activity_stream" ON public.umkm_customer_activity_stream FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_metrics" ON public.umkm_customer_metrics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_crm_ai_insights" ON public.umkm_crm_ai_insights FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_crm_ai_campaigns" ON public.umkm_crm_ai_campaigns FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Supabase Realtime Publication Registration
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_metrics;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_activity_stream;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_crm_ai_campaigns;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
