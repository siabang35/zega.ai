-- ============================================================================
-- ZEGA AI: UMKM Marketing Reports by Source & Real-Time Migration
-- File: 100_umkm_marketing_reports_by_source_realtime.sql
-- ============================================================================

-- 1. Create umkm_marketing_reports table
CREATE TABLE IF NOT EXISTS public.umkm_marketing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    report_title TEXT NOT NULL,
    period_range TEXT NOT NULL,
    revenue_num NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    leads_count INTEGER NOT NULL DEFAULT 0,
    roas_val NUMERIC(5, 2) NOT NULL DEFAULT 4.20,
    cpl_idr NUMERIC(12, 2) NOT NULL DEFAULT 11403.00,
    status TEXT NOT NULL DEFAULT 'Final', -- Final, Draft, Archived
    model_attribution TEXT NOT NULL DEFAULT 'DeepSeek R1 via 9Router',
    source_breakdown_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_marketing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_reports" ON public.umkm_marketing_reports;
CREATE POLICY "Allow all for authenticated umkm_marketing_reports" ON public.umkm_marketing_reports FOR ALL USING (true);

-- 2. Ensure Supabase Realtime publication includes umkm_marketing_reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_reports;
    END IF;
END $$;

-- 3. Purge existing seed records for default store
DELETE FROM public.umkm_marketing_reports WHERE store_id = '11111111-1111-1111-1111-111111111111';

-- 4. Seed Enterprise Executive Marketing Reports
INSERT INTO public.umkm_marketing_reports (
    id, store_id, report_title, period_range, revenue_num, leads_count, roas_val, cpl_idr, status, model_attribution, source_breakdown_json
) VALUES 
(
    'e1111111-0001-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Laporan Performa Campaign Juli 2026',
    '1 Jul - 31 Jul 2026',
    5200000.00,
    456,
    4.20,
    11403.00,
    'Final',
    'DeepSeek R1 & 9Router Layer 5 Engine',
    '[
        {"source": "WhatsApp Direct", "revenue": 2184000, "percentage": 42.0, "leads": 198, "conversion": "3.5%", "color": "#10b981", "icon": "https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp"},
        {"source": "Instagram Ads", "revenue": 1456000, "percentage": 28.0, "leads": 132, "conversion": "4.1%", "color": "#a855f7", "icon": "https://cdn.zegaai.site/assets/logo/instagram.png"},
        {"source": "Shopee Official", "revenue": 936000, "percentage": 18.0, "leads": 76, "conversion": "3.2%", "color": "#f97316", "icon": "https://cdn.zegaai.site/assets/logo/shopee.png"},
        {"source": "TikTok Shop", "revenue": 624000, "percentage": 12.0, "leads": 50, "conversion": "4.0%", "color": "#06b6d4", "icon": "https://cdn.zegaai.site/assets/logo/tiktok.webp"}
    ]'::jsonb
),
(
    'e1111111-0002-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Laporan Atribusi Model AI Marketing Swarm',
    '15 Jul - 31 Jul 2026',
    3850000.00,
    310,
    3.80,
    12419.00,
    'Final',
    'Qwen 2.5 Coder 32B & ZeroClaw Edge Swarm',
    '[
        {"source": "WhatsApp Direct", "revenue": 1617000, "percentage": 42.0, "leads": 140, "conversion": "3.8%", "color": "#10b981", "icon": "https://cdn.zegaai.site/assets/logo/whatsapp.png"},
        {"source": "Instagram Ads", "revenue": 1155000, "percentage": 30.0, "leads": 98, "conversion": "4.3%", "color": "#a855f7", "icon": "https://cdn.zegaai.site/assets/logo/instagram.png"},
        {"source": "TikTok Shop", "revenue": 693000, "percentage": 18.0, "leads": 45, "conversion": "4.5%", "color": "#06b6d4", "icon": "https://cdn.zegaai.site/assets/logo/tiktok.png"},
        {"source": "Shopee Official", "revenue": 385000, "percentage": 10.0, "leads": 27, "conversion": "2.9%", "color": "#f97316", "icon": "https://cdn.zegaai.site/assets/logo/shopee.png"}
    ]'::jsonb
),
(
    'e1111111-0003-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Analisis Biaya Iklan (CPL) per Saluran',
    '1 Jul - 20 Jul 2026',
    2450000.00,
    182,
    3.50,
    13461.00,
    'Archived',
    'Gemini 3.6 Flash & Groq LPU Engine',
    '[
        {"source": "WhatsApp Direct", "revenue": 1102500, "percentage": 45.0, "leads": 85, "conversion": "3.6%", "color": "#10b981", "icon": "https://cdn.zegaai.site/assets/logo/whatsapp.png"},
        {"source": "Instagram Ads", "revenue": 735000, "percentage": 30.0, "leads": 52, "conversion": "3.9%", "color": "#a855f7", "icon": "https://cdn.zegaai.site/assets/logo/instagram.png"},
        {"source": "Shopee Official", "revenue": 367500, "percentage": 15.0, "leads": 28, "conversion": "3.0%", "color": "#f97316", "icon": "https://cdn.zegaai.site/assets/logo/shopee.png"},
        {"source": "TikTok Shop", "revenue": 245000, "percentage": 10.0, "leads": 17, "conversion": "3.8%", "color": "#06b6d4", "icon": "https://cdn.zegaai.site/assets/logo/tiktok.png"}
    ]'::jsonb
),
(
    'e1111111-0004-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Ringkasan Konversi WhatsApp & TikTok',
    '1 Jul - 15 Jul 2026',
    1950000.00,
    148,
    3.20,
    13175.00,
    'Archived',
    'ZeroClaw Edge Daemon & Claude 3.5 Sonnet',
    '[
        {"source": "WhatsApp Direct", "revenue": 1170000, "percentage": 60.0, "leads": 92, "conversion": "3.4%", "color": "#10b981", "icon": "https://cdn.zegaai.site/assets/logo/whatsapp.png"},
        {"source": "TikTok Shop", "revenue": 780000, "percentage": 40.0, "leads": 56, "conversion": "4.2%", "color": "#06b6d4", "icon": "https://cdn.zegaai.site/assets/logo/tiktok.png"}
    ]'::jsonb
);

-- 5. Helper Function to Insert Executive Report Atomically
CREATE OR REPLACE FUNCTION public.fn_insert_umkm_marketing_report(
    p_store_id UUID,
    p_report_title TEXT,
    p_period_range TEXT,
    p_revenue_num NUMERIC,
    p_leads_count INTEGER,
    p_roas_val NUMERIC,
    p_cpl_idr NUMERIC,
    p_status TEXT,
    p_model_attribution TEXT,
    p_source_breakdown_json JSONB
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.umkm_marketing_reports (
        store_id, report_title, period_range, revenue_num, leads_count,
        roas_val, cpl_idr, status, model_attribution, source_breakdown_json, created_at
    ) VALUES (
        p_store_id, p_report_title, p_period_range, p_revenue_num, p_leads_count,
        p_roas_val, p_cpl_idr, p_status, p_model_attribution, p_source_breakdown_json, NOW()
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
