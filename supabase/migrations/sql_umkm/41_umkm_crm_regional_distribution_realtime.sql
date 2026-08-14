-- ============================================================================
-- SQL MIGRATION 41: UMKM CRM REGIONAL DISTRIBUTION & GIS TELEMETRY
-- ============================================================================
-- Purpose: Enterprise Customer Geographic Distribution, GIS Map Markers,
--   Regional Revenue Telemetry, Atomic RPC Stored Procedures, and R2 CDN Integration.
-- ============================================================================

BEGIN;

-- 1. Ensure Table public.umkm_customer_regional_distribution Exists
CREATE TABLE IF NOT EXISTS public.umkm_customer_regional_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    region_code TEXT NOT NULL,
    region_name TEXT NOT NULL,
    province TEXT DEFAULT 'DKI Jakarta',
    lat NUMERIC(10,6) NOT NULL,
    lng NUMERIC(10,6) NOT NULL,
    customer_count INTEGER NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    top_category TEXT DEFAULT 'Fashion & Hijab',
    churn_risk_rate TEXT DEFAULT '5%',
    marker_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/map/marker_orange.png',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_regional_store_code_unique UNIQUE (store_id, region_code)
);

-- Defensive Column Additions for Pre-existing Schema Instances
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'DKI Jakarta';
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS customer_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS percentage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS top_category TEXT DEFAULT 'Fashion & Hijab';
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS churn_risk_rate TEXT DEFAULT '5%';
ALTER TABLE public.umkm_customer_regional_distribution ADD COLUMN IF NOT EXISTS marker_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/map/marker_orange.png';

-- 2. GIS Hotspots & Cluster Growth Telemetry Table
CREATE TABLE IF NOT EXISTS public.umkm_regional_gis_hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    cluster_name TEXT NOT NULL,
    region_code TEXT NOT NULL,
    growth_rate_pct NUMERIC(5,2) DEFAULT 18.50,
    ai_swarm_recommendation TEXT DEFAULT 'Luncurkan AI Retention Campaign via WA Agent',
    is_priority_target BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-performance GIS spatial queries
CREATE INDEX IF NOT EXISTS idx_umkm_regional_dist_store 
ON public.umkm_customer_regional_distribution (store_id, customer_count DESC);

-- 3. Seed Enterprise Realtime Regional GIS Data (Indonesia Core Hubs)
INSERT INTO public.umkm_customer_regional_distribution 
(id, store_id, region_code, region_name, province, lat, lng, customer_count, percentage, revenue_idr, top_category, churn_risk_rate, marker_icon_url)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'STORE-DEMO-1283',
    'jkt',
    'DKI Jakarta',
    'DKI Jakarta',
    -6.2088,
    106.8456,
    436,
    35,
    545000000.00,
    'Fashion & Hijab',
    '3%',
    'https://cdn.zegaai.site/assets/map/marker_orange.png'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'STORE-DEMO-1283',
    'jbr',
    'Jawa Barat',
    'Jawa Barat',
    -6.9175,
    107.6191,
    312,
    25,
    390000000.00,
    'Kuliner & Snack',
    '8%',
    'https://cdn.zegaai.site/assets/map/marker_blue.png'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'STORE-DEMO-1283',
    'jtg',
    'Jawa Tengah',
    'Jawa Tengah',
    -6.9667,
    110.4167,
    224,
    18,
    280000000.00,
    'Kecantikan & Skincare',
    '12%',
    'https://cdn.zegaai.site/assets/map/marker_green.png'
),
(
    'b0000000-0000-0000-0000-000000000004',
    'STORE-DEMO-1283',
    'jtm',
    'Jawa Timur',
    'Jawa Timur',
    -7.2575,
    112.7521,
    150,
    12,
    187500000.00,
    'Aksesoris & Gadget',
    '15%',
    'https://cdn.zegaai.site/assets/map/marker_purple.png'
),
(
    'b0000000-0000-0000-0000-000000000005',
    'STORE-DEMO-1283',
    'sumut',
    'Sumatera Utara',
    'Sumatera Utara',
    3.5952,
    98.6722,
    86,
    7,
    107500000.00,
    'Makanan Olahan',
    '18%',
    'https://cdn.zegaai.site/assets/map/marker_cyan.png'
),
(
    'b0000000-0000-0000-0000-000000000006',
    'STORE-DEMO-1283',
    'bali',
    'Bali',
    'Bali',
    -8.6705,
    115.2126,
    64,
    5,
    80000000.00,
    'Handicraft & Souvenir',
    '5%',
    'https://cdn.zegaai.site/assets/map/marker_orange.png'
),
(
    'b0000000-0000-0000-0000-000000000007',
    'STORE-DEMO-1283',
    'sulsel',
    'Sulawesi Selatan',
    'Sulawesi Selatan',
    -5.1477,
    119.4327,
    48,
    4,
    60000000.00,
    'Kopi & Rempah',
    '20%',
    'https://cdn.zegaai.site/assets/map/marker_red.png'
)
ON CONFLICT (store_id, region_code) DO UPDATE SET
    customer_count = EXCLUDED.customer_count,
    revenue_idr = EXCLUDED.revenue_idr,
    top_category = EXCLUDED.top_category,
    marker_icon_url = EXCLUDED.marker_icon_url,
    updated_at = NOW();

-- Seed GIS Hotspots Cluster Data
INSERT INTO public.umkm_regional_gis_hotspots
(store_id, cluster_name, region_code, growth_rate_pct, ai_swarm_recommendation, is_priority_target)
VALUES
('STORE-DEMO-1283', 'Jabodetabek Central Megapolis', 'jkt', 24.50, 'Luncurkan AI Retention Campaign via DeepSeek R1', true),
('STORE-DEMO-1283', 'Bandung Raya Creative Cluster', 'jbr', 19.80, 'Luncurkan AI Promo Flash Early Access via Claude 3.5', true),
('STORE-DEMO-1283', 'Surabaya Industrial Hub', 'jtm', 15.20, 'Luncurkan Retargeting Churn Risk via 9Router', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ATOMIC RPC PROCEDURE: get_umkm_crm_regional_distribution_telemetry
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_umkm_crm_regional_distribution_telemetry(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_search TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_regions JSONB;
    v_hotspots JSONB;
    v_total_customers INTEGER;
    v_total_revenue NUMERIC;
BEGIN
    -- Aggregated Totals
    SELECT COALESCE(SUM(customer_count), 0), COALESCE(SUM(revenue_idr), 0)
    INTO v_total_customers, v_total_revenue
    FROM public.umkm_customer_regional_distribution
    WHERE store_id = p_store_id;

    -- Fetch Filtered Regional GIS Markers List
    SELECT jsonb_agg(r) INTO v_regions
    FROM (
        SELECT 
            id,
            region_code AS id_code,
            region_name AS region,
            province,
            lat,
            lng,
            customer_count AS count,
            percentage AS pct,
            revenue_idr AS revenue,
            top_category AS "topCat",
            churn_risk_rate AS "churnRisk",
            marker_icon_url AS "markerIcon"
        FROM public.umkm_customer_regional_distribution
        WHERE store_id = p_store_id
          AND (p_search = '' OR region_name ILIKE '%' || p_search || '%' OR top_category ILIKE '%' || p_search || '%')
        ORDER BY customer_count DESC
    ) r;

    -- Fetch Hotspots Cluster Data
    SELECT jsonb_agg(h) INTO v_hotspots
    FROM (
        SELECT cluster_name, region_code, growth_rate_pct, ai_swarm_recommendation, is_priority_target
        FROM public.umkm_regional_gis_hotspots
        WHERE store_id = p_store_id
    ) h;

    RETURN jsonb_build_object(
        'success', true,
        'total_customers', COALESCE(v_total_customers, 0),
        'total_revenue_idr', COALESCE(v_total_revenue, 0),
        'total_regions_mapped', COALESCE(jsonb_array_length(v_regions), 0),
        'regions', COALESCE(v_regions, '[]'::jsonb),
        'hotspots', COALESCE(v_hotspots, '[]'::jsonb)
    );
END;
$$;

-- ============================================================================
-- 5. ATOMIC RPC PROCEDURE: upsert_umkm_regional_distribution
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_umkm_regional_distribution(
    p_store_id TEXT,
    p_region_code TEXT,
    p_region_name TEXT,
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_customer_count INTEGER DEFAULT 1,
    p_revenue_idr NUMERIC DEFAULT 0.00,
    p_top_category TEXT DEFAULT 'Umum'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.umkm_customer_regional_distribution (
        store_id, region_code, region_name, lat, lng, customer_count, revenue_idr, top_category, updated_at
    ) VALUES (
        p_store_id, p_region_code, p_region_name, p_lat, p_lng, p_customer_count, p_revenue_idr, p_top_category, NOW()
    )
    ON CONFLICT (store_id, region_code) DO UPDATE SET
        customer_count = public.umkm_customer_regional_distribution.customer_count + EXCLUDED.customer_count,
        revenue_idr = public.umkm_customer_regional_distribution.revenue_idr + EXCLUDED.revenue_idr,
        updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'region_id', v_id,
        'message', 'Lokasi GIS distribusi wilayah sukses diperbarui'
    );
END;
$$;

-- ============================================================================
-- 6. SECURITY RLS POLICIES & REALTIME PUBLICATION SETUP
-- ============================================================================
ALTER TABLE public.umkm_customer_regional_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_regional_gis_hotspots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_regional_distribution" 
    ON public.umkm_customer_regional_distribution FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert umkm_customer_regional_distribution" 
    ON public.umkm_customer_regional_distribution FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_regional_distribution;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
