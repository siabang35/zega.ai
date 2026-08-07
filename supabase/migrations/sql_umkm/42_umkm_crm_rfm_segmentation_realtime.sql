-- ============================================================================
-- SQL MIGRATION 42: UMKM CRM RFM SEGMENTATION & AI COHORT TELEMETRY
-- ============================================================================
-- Purpose: Enterprise Recency, Frequency, Monetary (RFM) Customer Segmentation,
--   Composite RFM Scoring (111 - 555), AI Swarm Retention Campaign Cohorts,
--   Atomic Stored Procedures, RLS Security, and Supabase Realtime Enablement.
-- ============================================================================

BEGIN;

-- 1. Ensure Table public.umkm_customer_rfm_segments Exists
CREATE TABLE IF NOT EXISTS public.umkm_customer_rfm_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    segment_code TEXT NOT NULL,
    segment_name TEXT NOT NULL,
    description TEXT DEFAULT 'Pelanggan dengan tingkat keaktifan & transaksi tinggi.',
    customer_count INTEGER NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0,
    total_spend_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    color_hex TEXT NOT NULL DEFAULT '#f97316',
    recommended_strategy TEXT DEFAULT 'Berikan penawaran khusus VIP & produk eksklusif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_rfm_store_segment_unique UNIQUE (store_id, segment_code)
);

-- Defensive Column Additions for Pre-existing Schema Instances
ALTER TABLE public.umkm_customer_rfm_segments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Pelanggan dengan keaktifan tinggi.';
ALTER TABLE public.umkm_customer_rfm_segments ADD COLUMN IF NOT EXISTS customer_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.umkm_customer_rfm_segments ADD COLUMN IF NOT EXISTS percentage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.umkm_customer_rfm_segments ADD COLUMN IF NOT EXISTS total_spend_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.umkm_customer_rfm_segments ADD COLUMN IF NOT EXISTS color_hex TEXT NOT NULL DEFAULT '#f97316';
ALTER TABLE public.umkm_customer_rfm_segments ADD COLUMN IF NOT EXISTS recommended_strategy TEXT DEFAULT 'Prioritas AI Campaign';

-- 2. Customer Detailed RFM Score Matrix Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_rfm_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    customer_name TEXT NOT NULL,
    recency_score INTEGER NOT NULL DEFAULT 5, -- 1 (Lama) s/d 5 (Sangat Baru)
    frequency_score INTEGER NOT NULL DEFAULT 5, -- 1 (Sangat Jarang) s/d 5 (Sangat Sering)
    monetary_score INTEGER NOT NULL DEFAULT 5, -- 1 (Kecil) s/d 5 (Besar)
    composite_rfm_code TEXT NOT NULL DEFAULT '555',
    assigned_segment TEXT NOT NULL DEFAULT 'Champions (VIP)',
    last_order_days_ago INTEGER DEFAULT 2,
    total_orders INTEGER DEFAULT 12,
    total_spend_idr NUMERIC(15,2) DEFAULT 4500000.00,
    ai_notes TEXT DEFAULT 'Tingkat retensi sangat tinggi, rekomendasikan program referral VIP.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-performance RFM queries
CREATE INDEX IF NOT EXISTS idx_umkm_rfm_segments_store 
ON public.umkm_customer_rfm_segments (store_id, customer_count DESC);

CREATE INDEX IF NOT EXISTS idx_umkm_rfm_scores_store_code 
ON public.umkm_customer_rfm_scores (store_id, composite_rfm_code);

-- 3. Seed Seed Realtime RFM Segments Data
INSERT INTO public.umkm_customer_rfm_segments 
(id, store_id, segment_code, segment_name, description, customer_count, percentage, total_spend_idr, color_hex, recommended_strategy)
VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'STORE-DEMO-1283',
    'vip',
    'Champions (VIP)',
    'Pelanggan dengan recency baru, frekuensi tinggi, dan omset belanja terbesar.',
    436,
    35,
    654000000.00,
    '#f97316',
    'Beri akses produk edisi terbatas, reward VIP eksklusif, & prioritas layanan CS.'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'STORE-DEMO-1283',
    'loyal',
    'Loyal Customers',
    'Belanja secara berkala dengan nilai transaksi stabil dan respon tinggi.',
    312,
    25,
    468000000.00,
    '#3b82f6',
    'Kirimkan voucher undian belanja berkala & campaign cross-selling.'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'STORE-DEMO-1283',
    'potential',
    'Potential Loyalists',
    'Pelanggan baru yang menunjukkan tren pembeli berulang dalam 30 hari terakhir.',
    224,
    18,
    336000000.00,
    '#8b5cf6',
    'Tawarkan keanggotaan loyalty program & diskon pembelian kedua.'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'STORE-DEMO-1283',
    'at_risk',
    'At-Risk / Warning',
    'Dahulu sering belanja namun tidak ada transaksi dalam 60-90 hari terakhir.',
    150,
    12,
    225000000.00,
    '#ef4444',
    'Kirimkan AI Winback campaign otomatis via WhatsApp Agent dengan voucher khusus.'
),
(
    'c0000000-0000-0000-0000-000000000005',
    'STORE-DEMO-1283',
    'new',
    'New Customers',
    'Baru melakukan transaksi pertama dalam 14 hari terakhir.',
    126,
    10,
    189000000.00,
    '#10b981',
    'Kirimkan panduan onboarding produk & penawaran selamat datang.'
)
ON CONFLICT (store_id, segment_code) DO UPDATE SET
    customer_count = EXCLUDED.customer_count,
    percentage = EXCLUDED.percentage,
    total_spend_idr = EXCLUDED.total_spend_idr,
    recommended_strategy = EXCLUDED.recommended_strategy,
    updated_at = NOW();

-- Seed Demo Individual RFM Score Matrix Data
INSERT INTO public.umkm_customer_rfm_scores
(store_id, customer_name, recency_score, frequency_score, monetary_score, composite_rfm_code, assigned_segment, last_order_days_ago, total_orders, total_spend_idr, ai_notes)
VALUES
('STORE-DEMO-1283', 'Siti Aisyah', 5, 5, 5, '555', 'Champions (VIP)', 1, 18, 4500000.00, 'Kandidat ambassador brand UMKM'),
('STORE-DEMO-1283', 'Budi Santoso', 5, 4, 4, '544', 'Loyal Customers', 3, 12, 3200000.00, 'Sangat responsif pada pesan WA promo'),
('STORE-DEMO-1283', 'Dewi Lestari', 4, 4, 3, '443', 'Potential Loyalists', 5, 8, 1850000.00, 'Berpotensi naik ke VIP dengan voucher khusus'),
('STORE-DEMO-1283', 'Rizky Pratama', 2, 2, 4, '224', 'At-Risk / Warning', 75, 6, 2100000.00, 'Perlu intervensi AI Winback otomatis via WA'),
('STORE-DEMO-1283', 'Maya Putri', 5, 1, 2, '512', 'New Customers', 2, 1, 350000.00, 'Pelanggan baru, kirimkan panduan penggunaan')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. ATOMIC RPC PROCEDURE: get_umkm_crm_rfm_segmentation_telemetry
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_umkm_crm_rfm_segmentation_telemetry(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_segment_filter TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_segments JSONB;
    v_scores JSONB;
    v_total_customers INTEGER;
    v_total_revenue NUMERIC;
BEGIN
    -- Aggregated Totals
    SELECT COALESCE(SUM(customer_count), 0), COALESCE(SUM(total_spend_idr), 0)
    INTO v_total_customers, v_total_revenue
    FROM public.umkm_customer_rfm_segments
    WHERE store_id = p_store_id;

    -- Fetch Filtered Segments List
    SELECT jsonb_agg(s) INTO v_segments
    FROM (
        SELECT 
            id,
            segment_code AS id_code,
            segment_name AS name,
            description,
            customer_count AS count,
            percentage,
            total_spend_idr AS revenue,
            color_hex AS color,
            recommended_strategy AS strategy
        FROM public.umkm_customer_rfm_segments
        WHERE store_id = p_store_id
          AND (p_segment_filter = 'all' OR segment_code = p_segment_filter)
        ORDER BY percentage DESC
    ) s;

    -- Fetch RFM Customer Scores Matrix
    SELECT jsonb_agg(sc) INTO v_scores
    FROM (
        SELECT customer_name, recency_score, frequency_score, monetary_score, composite_rfm_code, assigned_segment, last_order_days_ago, total_orders, total_spend_idr, ai_notes
        FROM public.umkm_customer_rfm_scores
        WHERE store_id = p_store_id
        ORDER BY monetary_score DESC, recency_score DESC
        LIMIT 30
    ) sc;

    RETURN jsonb_build_object(
        'success', true,
        'total_customers', COALESCE(v_total_customers, 0),
        'total_revenue_idr', COALESCE(v_total_revenue, 0),
        'segments', COALESCE(v_segments, '[]'::jsonb),
        'scores_matrix', COALESCE(v_scores, '[]'::jsonb)
    );
END;
$$;

-- ============================================================================
-- 5. ATOMIC RPC PROCEDURE: recalculate_umkm_crm_rfm_scores
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_umkm_crm_rfm_scores(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Recalculate segment counts based on umkm_customers table
    UPDATE public.umkm_customer_rfm_segments s
    SET customer_count = (
        SELECT COUNT(*) FROM public.umkm_customers c 
        WHERE c.store_id = p_store_id 
          AND (
              (s.segment_code = 'vip' AND c.segment = 'VIP') OR
              (s.segment_code = 'loyal' AND c.segment = 'Loyal') OR
              (s.segment_code = 'potential' AND c.segment = 'Repeat') OR
              (s.segment_code = 'new' AND c.segment = 'New') OR
              (s.segment_code = 'at_risk' AND c.segment = 'Churn Risk')
          )
    ),
    updated_at = NOW()
    WHERE store_id = p_store_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Skor & segmen RFM pelanggan berhasil dikalkulasi ulang'
    );
END;
$$;

-- ============================================================================
-- 6. SECURITY RLS POLICIES & REALTIME PUBLICATION SETUP
-- ============================================================================
ALTER TABLE public.umkm_customer_rfm_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_rfm_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_rfm_segments" 
    ON public.umkm_customer_rfm_segments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert umkm_customer_rfm_segments" 
    ON public.umkm_customer_rfm_segments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_rfm_segments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
