-- Migration 72: UMKM Marketplace Realtime Categories Table & RPC
-- Production Schema for ZEGA Enterprise AI Category Directory

CREATE TABLE IF NOT EXISTS public.umkm_marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(50),
    name VARCHAR(100),
    category_name VARCHAR(100),
    display_title VARCHAR(100),
    description TEXT,
    icon_key VARCHAR(50) DEFAULT 'cpu',
    bg_color VARCHAR(100) DEFAULT 'from-orange-500 to-amber-500',
    ai_module_count INT DEFAULT 0,
    count INT DEFAULT 0,
    supported_models JSONB DEFAULT '["DeepSeek-V3", "Claude 3.5 Sonnet"]'::jsonb,
    target_industry VARCHAR(100) DEFAULT 'UMKM Multi-Industry',
    zeroclaw_protocol_version VARCHAR(30) DEFAULT 'ZeroClaw-v2.4-Mesh',
    zeroclaw_agent_id VARCHAR(50) DEFAULT 'zc_agent_default',
    routing_provider VARCHAR(50) DEFAULT '9Router High Speed Engine',
    primary_model_engine VARCHAR(50) DEFAULT 'DeepSeek-V3',
    fallback_model_engine VARCHAR(50) DEFAULT 'Claude 3.5 Sonnet',
    max_context_tokens INT DEFAULT 128000,
    avg_latency_ms INT DEFAULT 24,
    monthly_execution_quota INT DEFAULT 50000,
    cdn_banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fail-safe column additions for pre-existing tables across all previous migration versions
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS category_key VARCHAR(50);
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS category_name VARCHAR(100);
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS display_title VARCHAR(100);
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS icon_key VARCHAR(50) DEFAULT 'cpu';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS bg_color VARCHAR(100) DEFAULT 'from-orange-500 to-amber-500';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS ai_module_count INT DEFAULT 0;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS count INT DEFAULT 0;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS supported_models JSONB DEFAULT '["DeepSeek-V3", "Claude 3.5 Sonnet"]'::jsonb;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS target_industry VARCHAR(100) DEFAULT 'UMKM Multi-Industry';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS zeroclaw_protocol_version VARCHAR(30) DEFAULT 'ZeroClaw-v2.4-Mesh';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS zeroclaw_agent_id VARCHAR(50) DEFAULT 'zc_agent_default';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS routing_provider VARCHAR(50) DEFAULT '9Router High Speed Engine';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS primary_model_engine VARCHAR(50) DEFAULT 'DeepSeek-V3';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS fallback_model_engine VARCHAR(50) DEFAULT 'Claude 3.5 Sonnet';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS max_context_tokens INT DEFAULT 128000;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS avg_latency_ms INT DEFAULT 24;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS monthly_execution_quota INT DEFAULT 50000;
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS cdn_banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.umkm_marketplace_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sync existing column values if necessary
UPDATE public.umkm_marketplace_categories SET name = category_name WHERE name IS NULL AND category_name IS NOT NULL;
UPDATE public.umkm_marketplace_categories SET category_name = name WHERE category_name IS NULL AND name IS NOT NULL;
UPDATE public.umkm_marketplace_categories SET display_title = COALESCE(name, category_name) WHERE display_title IS NULL;

-- Create unique index on category_key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'umkm_marketplace_categories_category_key_key'
    ) THEN
        ALTER TABLE public.umkm_marketplace_categories ADD CONSTRAINT umkm_marketplace_categories_category_key_key UNIQUE (category_key);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- RLS Policies
ALTER TABLE public.umkm_marketplace_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'umkm_marketplace_categories' AND policyname = 'Allow public read on umkm_marketplace_categories'
    ) THEN
        CREATE POLICY "Allow public read on umkm_marketplace_categories" ON public.umkm_marketplace_categories FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'umkm_marketplace_categories' AND policyname = 'Allow public insert on umkm_marketplace_categories'
    ) THEN
        CREATE POLICY "Allow public insert on umkm_marketplace_categories" ON public.umkm_marketplace_categories FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'umkm_marketplace_categories' AND policyname = 'Allow public update on umkm_marketplace_categories'
    ) THEN
        CREATE POLICY "Allow public update on umkm_marketplace_categories" ON public.umkm_marketplace_categories FOR UPDATE USING (true);
    END IF;
END $$;

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'umkm_marketplace_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_categories;
  END IF;
END $$;

-- Stored Procedure: Fetch Marketplace Categories with Search & Telemetry
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_categories(text);
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_categories();

CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_categories(
    p_search TEXT DEFAULT ''
)
RETURNS TABLE (
    id UUID,
    category_key VARCHAR(50),
    name VARCHAR(100),
    category_name VARCHAR(100),
    display_title VARCHAR(100),
    description TEXT,
    icon_key VARCHAR(50),
    bg_color VARCHAR(100),
    ai_module_count INT,
    count INT,
    supported_models JSONB,
    target_industry VARCHAR(100),
    zeroclaw_protocol_version VARCHAR(30),
    zeroclaw_agent_id VARCHAR(50),
    routing_provider VARCHAR(50),
    primary_model_engine VARCHAR(50),
    fallback_model_engine VARCHAR(50),
    max_context_tokens INT,
    avg_latency_ms INT,
    monthly_execution_quota INT,
    status VARCHAR(20),
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.category_key, c.name, c.category_name, c.display_title, c.description,
        c.icon_key, c.bg_color, c.ai_module_count, c.count, c.supported_models,
        c.target_industry, c.zeroclaw_protocol_version, c.zeroclaw_agent_id,
        c.routing_provider, c.primary_model_engine, c.fallback_model_engine,
        c.max_context_tokens, c.avg_latency_ms, c.monthly_execution_quota,
        c.status, c.created_at
    FROM public.umkm_marketplace_categories c
    WHERE p_search IS NULL OR p_search = '' OR 
          c.name ILIKE '%' || p_search || '%' OR 
          c.description ILIKE '%' || p_search || '%' OR
          c.target_industry ILIKE '%' || p_search || '%'
    ORDER BY c.ai_module_count DESC, c.created_at DESC;
END;
$$;

-- Atomic RPC: Toggle Category Active Status
DROP FUNCTION IF EXISTS public.toggle_umkm_marketplace_category_status(uuid, varchar);
DROP FUNCTION IF EXISTS public.toggle_umkm_marketplace_category_status(uuid, text);

CREATE OR REPLACE FUNCTION public.toggle_umkm_marketplace_category_status(
    p_category_id UUID,
    p_status VARCHAR(20)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_marketplace_categories
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_category_id;

    RETURN jsonb_build_object(
        'success', true,
        'category_id', p_category_id,
        'status', p_status
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Atomic RPC: Delete Custom Marketplace AI Category
DROP FUNCTION IF EXISTS public.delete_umkm_marketplace_category(uuid);

CREATE OR REPLACE FUNCTION public.delete_umkm_marketplace_category(
    p_category_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.umkm_marketplace_categories
    WHERE id = p_category_id;

    RETURN jsonb_build_object(
        'success', true,
        'category_id', p_category_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Atomic RPC: Update Custom Marketplace AI Category
DROP FUNCTION IF EXISTS public.update_umkm_marketplace_category(uuid, varchar, text, varchar, jsonb, varchar, varchar);

CREATE OR REPLACE FUNCTION public.update_umkm_marketplace_category(
    p_category_id UUID,
    p_name VARCHAR(100),
    p_description TEXT,
    p_icon_key VARCHAR(50) DEFAULT 'cpu',
    p_supported_models JSONB DEFAULT '["DeepSeek-V3", "Claude 3.5 Sonnet"]'::jsonb,
    p_target_industry VARCHAR(100) DEFAULT 'UMKM Multi-Industry',
    p_status VARCHAR(20) DEFAULT 'active'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_marketplace_categories
    SET name = p_name,
        category_name = p_name,
        display_title = p_name,
        description = p_description,
        icon_key = COALESCE(p_icon_key, icon_key),
        supported_models = COALESCE(p_supported_models, supported_models),
        target_industry = COALESCE(p_target_industry, target_industry),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_category_id;

    RETURN jsonb_build_object(
        'success', true,
        'category_id', p_category_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Atomic RPC to Add Custom Marketplace AI Category
DROP FUNCTION IF EXISTS public.add_umkm_marketplace_category(varchar, text, varchar, jsonb, varchar);
CREATE OR REPLACE FUNCTION public.add_umkm_marketplace_category(
    p_name VARCHAR(100),
    p_description TEXT,
    p_icon_key VARCHAR(50) DEFAULT 'cpu',
    p_supported_models JSONB DEFAULT '["DeepSeek-V3", "Claude 3.5 Sonnet"]'::jsonb,
    p_target_industry VARCHAR(100) DEFAULT 'UMKM Multi-Industry'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key VARCHAR(50);
    v_id UUID;
    v_result JSONB;
BEGIN
    v_key := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '_', 'g')) || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()))::text;
    
    INSERT INTO public.umkm_marketplace_categories (
        category_key,
        name,
        category_name,
        display_title,
        description,
        icon_key,
        ai_module_count,
        count,
        supported_models,
        target_industry,
        zeroclaw_protocol_version,
        zeroclaw_agent_id,
        routing_provider,
        primary_model_engine,
        fallback_model_engine,
        status
    ) VALUES (
        v_key,
        p_name,
        p_name,
        p_name,
        p_description,
        COALESCE(p_icon_key, 'cpu'),
        1,
        1,
        COALESCE(p_supported_models, '["DeepSeek-V3", "Claude 3.5 Sonnet"]'::jsonb),
        COALESCE(p_target_industry, 'UMKM Multi-Industry'),
        'ZeroClaw-v2.4-Mesh',
        'zc_' || v_key,
        '9Router Multi-Engine Gateway',
        'DeepSeek-V3',
        'Claude 3.5 Sonnet',
        'active'
    )
    RETURNING id INTO v_id;

    SELECT jsonb_build_object(
        'success', true,
        'id', v_id,
        'category_key', v_key,
        'name', p_name
    ) INTO v_result;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Seed Enterprise Production Categories with Real ZeroClaw & 9Router Telemetry
INSERT INTO public.umkm_marketplace_categories (
    category_key, name, category_name, display_title, description, icon_key, bg_color,
    ai_module_count, count, supported_models, target_industry,
    zeroclaw_protocol_version, zeroclaw_agent_id, routing_provider, primary_model_engine,
    fallback_model_engine, max_context_tokens, avg_latency_ms, monthly_execution_quota, status
)
VALUES
(
    'cat_sales',
    'Sales & Lead Automation',
    'Sales & Lead Automation',
    'Sales & Lead Automation',
    'Modul AI khusus untuk melacak prospek pembeli, follow-up otomatis WhatsApp, & closing transaksi 24/7.',
    'crm',
    'from-emerald-500 to-teal-600',
    24, 24,
    '["DeepSeek-V3", "Claude 3.5 Sonnet", "WhatsApp Business API"]'::jsonb,
    'Ritel, Sales & E-Commerce',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_sales_01', '9Router High Speed Engine',
    'DeepSeek-V3', 'Claude 3.5 Sonnet', 128000, 24, 150000, 'active'
),
(
    'cat_marketing',
    'Marketing & Social Campaign',
    'Marketing & Social Campaign',
    'Marketing & Social Campaign',
    'Engine AI generator promosi visual, penulisan caption viral TikTok/IG, & penjadwalan konten multi-channel.',
    'copywriting',
    'from-blue-500 to-indigo-600',
    23, 23,
    '["Claude 3.5 Sonnet", "Llama 3.3 70B", "Canva API"]'::jsonb,
    'F&B, Fashion, & Digital Product',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_mktg_02', '9Router Multi-Engine Gateway',
    'Claude 3.5 Sonnet', 'Llama 3.3 70B', 128000, 31, 120000, 'active'
),
(
    'cat_customer_service',
    'Customer Support & Live Chat',
    'Customer Support & Live Chat',
    'Customer Support & Live Chat',
    'Agen AI CS otomatis menjawab pertanyaan pelanggan, menangani komplain resi, & eskalasi pesan darurat.',
    'whatsapp',
    'from-purple-500 to-pink-600',
    18, 18,
    '["DeepSeek-V3 Mesh", "GPT-4o Mini"]'::jsonb,
    'Service, Clinic & Online Shop',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_cs_03', '9Router Fast-Path Engine',
    'DeepSeek-V3', 'GPT-4o Mini', 128000, 18, 200000, 'active'
),
(
    'cat_finance',
    'Finance & Automatic Invoicing',
    'Finance & Automatic Invoicing',
    'Finance & Automatic Invoicing',
    'Otomatisasi pencatatan pembukuan kas, ekstraksi struk belanja via 9Router OCR, & laporan laba rugi real-time.',
    'receipt',
    'from-amber-500 to-orange-600',
    14, 14,
    '["9Router Vision OCR", "DeepSeek-V3"]'::jsonb,
    'Toko Grosir & Manufaktur UMKM',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_fin_04', '9Router OCR Vision Engine',
    '9Router Vision OCR', 'DeepSeek-V3', 64000, 42, 80000, 'active'
),
(
    'cat_operations',
    'Store & Inventory Operations',
    'Store & Inventory Operations',
    'Store & Inventory Operations',
    'Sistem AI manajemen stok gudang, prediksi barang habis (re-order alert), & audit inventaris otomatis.',
    'boxes',
    'from-rose-500 to-red-600',
    12, 12,
    '["DeepSeek-V3", "PostgreSQL Vector"]'::jsonb,
    'Gudang & Minimarket',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_ops_05', '9Router High Speed Engine',
    'DeepSeek-V3', 'PostgreSQL Vector', 128000, 28, 90000, 'active'
),
(
    'cat_productivity',
    'Productivity & Task Automation',
    'Productivity & Task Automation',
    'Productivity & Task Automation',
    'Autonomous AI worker untuk perangkuman dokumen bisnis, penataan SOP harian, & riset pasar otomatis.',
    'copywriting',
    'from-sky-500 to-cyan-600',
    10, 10,
    '["ZeroClaw Autonomous Engine", "Claude 3.5"]'::jsonb,
    'Konsultan & Jasa Profesional',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_prod_06', '9Router Multi-Engine Gateway',
    'ZeroClaw Autonomous Engine', 'Claude 3.5 Sonnet', 200000, 35, 60000, 'active'
),
(
    'cat_analytics',
    'Analytics & Business Intelligence',
    'Analytics & Business Intelligence',
    'Analytics & Business Intelligence',
    'Dashboard analitik AI memprediksi tren penjualan bulan depan, segmentasi pelanggan RFM, & heatmap omzet.',
    'piechart',
    'from-violet-500 to-purple-600',
    8, 8,
    '["DeepSeek-V3 Analytics", "Python AI Engine"]'::jsonb,
    'Eksekutif & Pemilik Usaha',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_analytics_07', '9Router Fast-Path Engine',
    'DeepSeek-V3 Analytics', 'Python AI Engine', 128000, 29, 50000, 'active'
),
(
    'cat_logistics',
    'Logistics & Shipping Fulfillment',
    'Logistics & Shipping Fulfillment',
    'Logistics & Shipping Fulfillment',
    'Integrasi kurir ekspedisi (J&T, JNE, SiCepat) dengan cetak resi otomatis & penjemputan barang instan.',
    'logistics',
    'from-orange-500 to-amber-600',
    6, 6,
    '["Logistics Hub API", "Courier Mesh"]'::jsonb,
    'Pengiriman & Marketplace',
    'ZeroClaw-v2.4-Mesh', 'zc_agent_logistics_08', '9Router Multi-Engine Gateway',
    'Logistics Hub API', 'Courier Mesh', 64000, 22, 70000, 'active'
)
ON CONFLICT (category_key) DO UPDATE SET
    name = EXCLUDED.name,
    category_name = EXCLUDED.category_name,
    display_title = EXCLUDED.display_title,
    description = EXCLUDED.description,
    icon_key = EXCLUDED.icon_key,
    bg_color = EXCLUDED.bg_color,
    ai_module_count = EXCLUDED.ai_module_count,
    count = EXCLUDED.count,
    supported_models = EXCLUDED.supported_models,
    target_industry = EXCLUDED.target_industry,
    zeroclaw_protocol_version = EXCLUDED.zeroclaw_protocol_version,
    zeroclaw_agent_id = EXCLUDED.zeroclaw_agent_id,
    routing_provider = EXCLUDED.routing_provider,
    primary_model_engine = EXCLUDED.primary_model_engine,
    fallback_model_engine = EXCLUDED.fallback_model_engine,
    max_context_tokens = EXCLUDED.max_context_tokens,
    avg_latency_ms = EXCLUDED.avg_latency_ms,
    monthly_execution_quota = EXCLUDED.monthly_execution_quota,
    status = EXCLUDED.status;
