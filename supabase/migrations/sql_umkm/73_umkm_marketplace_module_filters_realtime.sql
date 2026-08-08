-- Migration 73: UMKM Marketplace Realtime AI Modules & Filter Engine
-- Production Schema for ZEGA Enterprise AI Category & Module Filter Directory

CREATE TABLE IF NOT EXISTS public.umkm_marketplace_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key VARCHAR(50),
    title VARCHAR(100),
    description TEXT,
    category_key VARCHAR(50),
    category_name VARCHAR(100),
    icon_key VARCHAR(50) DEFAULT 'cpu',
    badge_tag VARCHAR(50) DEFAULT 'POPULER',
    price_monthly NUMERIC(12,2) DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 4.9,
    user_count INT DEFAULT 1250,
    primary_model VARCHAR(50) DEFAULT 'DeepSeek-V3',
    fallback_model VARCHAR(50) DEFAULT 'Claude 3.5 Sonnet',
    temperature NUMERIC(3,2) DEFAULT 0.70,
    max_context_tokens INT DEFAULT 128000,
    routing_provider VARCHAR(50) DEFAULT '9Router High Speed Engine',
    zeroclaw_agent_id VARCHAR(50) DEFAULT 'zc_agent_default',
    cdn_logo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    target_industry VARCHAR(100) DEFAULT 'UMKM Multi-Industry',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fail-safe column additions for pre-existing tables across all previous migration versions
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS module_key VARCHAR(50);
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS category_key VARCHAR(50);
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS category_name VARCHAR(100);
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS icon_key VARCHAR(50) DEFAULT 'cpu';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS badge_tag VARCHAR(50) DEFAULT 'POPULER';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 4.9;
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS user_count INT DEFAULT 1250;
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS primary_model VARCHAR(50) DEFAULT 'DeepSeek-V3';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS fallback_model VARCHAR(50) DEFAULT 'Claude 3.5 Sonnet';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS temperature NUMERIC(3,2) DEFAULT 0.70;
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS max_context_tokens INT DEFAULT 128000;
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS routing_provider VARCHAR(50) DEFAULT '9Router High Speed Engine';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS zeroclaw_agent_id VARCHAR(50) DEFAULT 'zc_agent_default';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS cdn_logo_url TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS target_industry VARCHAR(100) DEFAULT 'UMKM Multi-Industry';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.umkm_marketplace_modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create unique constraint on module_key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'umkm_marketplace_modules_module_key_key'
    ) THEN
        ALTER TABLE public.umkm_marketplace_modules ADD CONSTRAINT umkm_marketplace_modules_module_key_key UNIQUE (module_key);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- RLS Policies
ALTER TABLE public.umkm_marketplace_modules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'umkm_marketplace_modules' AND policyname = 'Allow public read on umkm_marketplace_modules'
    ) THEN
        CREATE POLICY "Allow public read on umkm_marketplace_modules" ON public.umkm_marketplace_modules FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'umkm_marketplace_modules' AND policyname = 'Allow public insert on umkm_marketplace_modules'
    ) THEN
        CREATE POLICY "Allow public insert on umkm_marketplace_modules" ON public.umkm_marketplace_modules FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'umkm_marketplace_modules' AND policyname = 'Allow public update on umkm_marketplace_modules'
    ) THEN
        CREATE POLICY "Allow public update on umkm_marketplace_modules" ON public.umkm_marketplace_modules FOR UPDATE USING (true);
    END IF;
END $$;

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'umkm_marketplace_modules'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_modules;
  END IF;
END $$;

-- Stored Procedure: Fetch Marketplace AI Modules with Multi-Filter
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_modules(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_modules();

CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_modules(
    p_category TEXT DEFAULT 'ALL',
    p_model TEXT DEFAULT 'ALL',
    p_industry TEXT DEFAULT 'ALL',
    p_search TEXT DEFAULT '',
    p_status TEXT DEFAULT 'active'
)
RETURNS TABLE (
    id UUID,
    module_key VARCHAR(50),
    title VARCHAR(100),
    description TEXT,
    category_key VARCHAR(50),
    category_name VARCHAR(100),
    icon_key VARCHAR(50),
    badge_tag VARCHAR(50),
    price_monthly NUMERIC(12,2),
    rating NUMERIC(3,2),
    user_count INT,
    primary_model VARCHAR(50),
    fallback_model VARCHAR(50),
    temperature NUMERIC(3,2),
    max_context_tokens INT,
    routing_provider VARCHAR(50),
    zeroclaw_agent_id VARCHAR(50),
    cdn_logo_url TEXT,
    target_industry VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id, m.module_key, m.title, m.description, m.category_key, m.category_name,
        m.icon_key, m.badge_tag, m.price_monthly, m.rating, m.user_count,
        m.primary_model, m.fallback_model, m.temperature, m.max_context_tokens,
        m.routing_provider, m.zeroclaw_agent_id, m.cdn_logo_url, m.target_industry,
        m.status, m.created_at
    FROM public.umkm_marketplace_modules m
    WHERE (p_status IS NULL OR p_status = 'ALL' OR m.status = p_status)
      AND (p_category IS NULL OR p_category = 'ALL' OR m.category_key ILIKE '%' || p_category || '%' OR m.category_name ILIKE '%' || p_category || '%')
      AND (p_model IS NULL OR p_model = 'ALL' OR m.primary_model ILIKE '%' || p_model || '%' OR m.fallback_model ILIKE '%' || p_model || '%')
      AND (p_industry IS NULL OR p_industry = 'ALL' OR m.target_industry ILIKE '%' || p_industry || '%')
      AND (p_search IS NULL OR p_search = '' OR m.title ILIKE '%' || p_search || '%' OR m.description ILIKE '%' || p_search || '%')
    ORDER BY m.user_count DESC, m.rating DESC;
END;
$$;

-- Atomic RPC: Update Module Configuration
DROP FUNCTION IF EXISTS public.update_umkm_marketplace_module_config(uuid, varchar, varchar, numeric, int, varchar, varchar);

CREATE OR REPLACE FUNCTION public.update_umkm_marketplace_module_config(
    p_module_id UUID,
    p_primary_model VARCHAR(50),
    p_fallback_model VARCHAR(50) DEFAULT 'Claude 3.5 Sonnet',
    p_temperature NUMERIC(3,2) DEFAULT 0.70,
    p_max_context_tokens INT DEFAULT 128000,
    p_routing_provider VARCHAR(50) DEFAULT '9Router High Speed Engine',
    p_status VARCHAR(20) DEFAULT 'active'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_marketplace_modules
    SET primary_model = p_primary_model,
        fallback_model = COALESCE(p_fallback_model, fallback_model),
        temperature = COALESCE(p_temperature, temperature),
        max_context_tokens = COALESCE(p_max_context_tokens, max_context_tokens),
        routing_provider = COALESCE(p_routing_provider, routing_provider),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_module_id;

    RETURN jsonb_build_object(
        'success', true,
        'module_id', p_module_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Seed Real Enterprise AI Modules Mapped to AI Categories with 9Router Telemetry
INSERT INTO public.umkm_marketplace_modules (
    module_key, title, description, category_key, category_name, icon_key, badge_tag,
    price_monthly, rating, user_count, primary_model, fallback_model, temperature,
    max_context_tokens, routing_provider, zeroclaw_agent_id, cdn_logo_url, target_industry, status
)
VALUES
(
    'mod_sales_wa_closer',
    'WhatsApp AI Closing Bot 24/7',
    'Agen AI Sales yang otomatis menyapa calon pembeli, memberikan katalog harga, dan melakukan transaksi closing di WhatsApp.',
    'cat_sales', 'Sales & Lead Automation', 'whatsapp', 'TERLARIS',
    0, 4.95, 3420, 'DeepSeek-V3', 'Claude 3.5 Sonnet', 0.65, 128000,
    '9Router High Speed Engine', 'zc_agent_sales_01', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80', 'Ritel, Sales & E-Commerce', 'active'
),
(
    'mod_marketing_copywriter',
    'AI Social Media & TikTok Copywriter',
    'Generator caption viral, script video Reels/TikTok, dan copywriting promosi berbasis psikologi penjualan.',
    'cat_marketing', 'Marketing & Social Campaign', 'copywriting', 'POPULER',
    0, 4.88, 2890, 'Claude 3.5 Sonnet', 'Llama 3.3 70B', 0.80, 128000,
    '9Router Multi-Engine Gateway', 'zc_agent_mktg_02', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80', 'F&B, Fashion, & Digital Product', 'active'
),
(
    'mod_cs_complaint_handler',
    'Smart CS & Complaint Resolver',
    'Modul CS pintar penangan komplain pesanan, pelacakan nomor resi, dan penanganan pertanyaan pelanggan 24 jam.',
    'cat_customer_service', 'Customer Support & Live Chat', 'users', 'REKOMENDASI',
    0, 4.92, 2150, 'DeepSeek-V3', 'GPT-4o Mini', 0.50, 128000,
    '9Router Fast-Path Engine', 'zc_agent_cs_03', 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=400&q=80', 'Service, Clinic & Online Shop', 'active'
),
(
    'mod_finance_ocr_scanner',
    '9Router Receipt OCR & Bookkeeper',
    'Otomatisasi pemindaian struk belanja/nota dengan 9Router OCR Vision Engine dan pencatatan kas harian.',
    'cat_finance', 'Finance & Automatic Invoicing', 'receipt', 'FITUR BARU',
    0, 4.97, 1940, '9Router Vision OCR', 'DeepSeek-V3', 0.20, 64000,
    '9Router OCR Vision Engine', 'zc_agent_fin_04', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80', 'Toko Grosir & Manufaktur UMKM', 'active'
),
(
    'mod_ops_inventory_auditor',
    'Stock Alert & Inventory Auditor',
    'Prediksi ketersediaan bahan baku, re-order alert otomatis, dan pemantauan stok keluar masuk gudang.',
    'cat_operations', 'Store & Inventory Operations', 'boxes', 'OTOMATIS',
    0, 4.85, 1420, 'DeepSeek-V3', 'PostgreSQL Vector', 0.30, 128000,
    '9Router High Speed Engine', 'zc_agent_ops_05', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80', 'Gudang & Minimarket', 'active'
),
(
    'mod_prod_sop_generator',
    'SOP & Task Automation Builder',
    'Penataan standar operasional prosedur (SOP) karyawan toko, perangkuman rapat, dan penugasan tim otomatis.',
    'cat_productivity', 'Productivity & Task Automation', 'copywriting', 'PRODUSEN',
    0, 4.90, 1180, 'ZeroClaw Autonomous Engine', 'Claude 3.5 Sonnet', 0.70, 200000,
    '9Router Multi-Engine Gateway', 'zc_agent_prod_06', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80', 'Konsultan & Jasa Profesional', 'active'
),
(
    'mod_analytics_rfm_predictor',
    'RFM Customer Segmentation & Analytics',
    'Dashboard analitik tingkat lanjut memprediksi potensi omzet bulan depan dan membagi segmen pelanggan VIP vs pasif.',
    'cat_analytics', 'Analytics & Business Intelligence', 'piechart', 'ENTERPRISE',
    0, 4.96, 950, 'DeepSeek-V3', 'Python AI Engine', 0.40, 128000,
    '9Router Fast-Path Engine', 'zc_agent_analytics_07', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', 'Eksekutif & Pemilik Usaha', 'active'
),
(
    'mod_logistics_shipping_courier',
    'Multi-Courier Expedited Booking',
    'Integrasi ekspedisi otomatis (J&T, JNE, SiCepat) dengan auto-print label pengiriman & pembatalan cepat.',
    'cat_logistics', 'Logistics & Shipping Fulfillment', 'logistics', 'INSTAN',
    0, 4.89, 1680, 'Logistics Hub API', 'Courier Mesh', 0.30, 64000,
    '9Router Multi-Engine Gateway', 'zc_agent_logistics_08', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=400&q=80', 'Pengiriman & Marketplace', 'active'
)
ON CONFLICT (module_key) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category_key = EXCLUDED.category_key,
    category_name = EXCLUDED.category_name,
    icon_key = EXCLUDED.icon_key,
    badge_tag = EXCLUDED.badge_tag,
    rating = EXCLUDED.rating,
    user_count = EXCLUDED.user_count,
    primary_model = EXCLUDED.primary_model,
    fallback_model = EXCLUDED.fallback_model,
    temperature = EXCLUDED.temperature,
    max_context_tokens = EXCLUDED.max_context_tokens,
    routing_provider = EXCLUDED.routing_provider,
    zeroclaw_agent_id = EXCLUDED.zeroclaw_agent_id,
    target_industry = EXCLUDED.target_industry,
    status = EXCLUDED.status;
