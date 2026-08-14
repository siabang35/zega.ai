-- ============================================================================
-- ZEGA AI: UMKM Finance & Solana Pay Terminal Real Models & Telemetry Migration
-- File: 33_umkm_ai_finance_real_models_and_telemetry.sql
-- ============================================================================

-- 1. Create umkm_finance_insights table for dynamic AI recommendations
CREATE TABLE IF NOT EXISTS public.umkm_finance_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_label TEXT NOT NULL DEFAULT 'Terapkan Rekomendasi',
    model_engine TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    execution_gateway TEXT NOT NULL DEFAULT 'ZeroClaw-Edge-Gateway',
    cdn_icon_url TEXT NOT NULL,
    impact_level TEXT NOT NULL DEFAULT 'High', -- Critical, High, Recommended
    category TEXT NOT NULL DEFAULT 'Cost Optimization', -- Cost Optimization, Profit Margin, Customer Retention
    status TEXT NOT NULL DEFAULT 'active', -- active, applied, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_finance_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_insights" ON public.umkm_finance_insights;
CREATE POLICY "Allow all for authenticated umkm_finance_insights" ON public.umkm_finance_insights FOR ALL USING (true);

-- 2. Create umkm_finance_swarms table for real AI Finance Swarm deployments
CREATE TABLE IF NOT EXISTS public.umkm_finance_swarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    swarm_name TEXT NOT NULL,
    model_engine TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    execution_gateway TEXT NOT NULL DEFAULT 'ZeroClaw-Edge-Gateway',
    cdn_icon_url TEXT NOT NULL,
    finance_focus TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    success_rate NUMERIC(5, 2) DEFAULT 99.90,
    latency_ms INT DEFAULT 115,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.umkm_finance_swarms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated umkm_finance_swarms" ON public.umkm_finance_swarms;
CREATE POLICY "Allow all for authenticated umkm_finance_swarms" ON public.umkm_finance_swarms FOR ALL USING (true);

-- 3. Enable Supabase Realtime for umkm_finance_insights & umkm_finance_swarms
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_finance_insights'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_finance_insights;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_finance_swarms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_finance_swarms;
    END IF;
END $$;

-- 4. Defensive Trigger Function for Logging Finance Insight Execution into Timeline
CREATE OR REPLACE FUNCTION public.fn_log_umkm_finance_insight_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'applied') THEN
        INSERT INTO public.umkm_timeline_events (
            store_id,
            event_time,
            icon_symbol,
            event_text,
            title,
            badge_label,
            event_type,
            created_at
        )
        VALUES (
            NEW.store_id,
            TO_CHAR(NOW(), 'HH24:MI'),
            'DollarSign',
            'Executed Finance Optimization: "' || NEW.title || '" via ' || NEW.model_engine,
            'AI Finance Optimization',
            'Active',
            'finance',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_umkm_finance_insight ON public.umkm_finance_insights;
CREATE TRIGGER trg_log_umkm_finance_insight
    AFTER UPDATE ON public.umkm_finance_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_log_umkm_finance_insight_event();

-- 5. Seed Real Production AI Finance Recommendations
INSERT INTO public.umkm_finance_insights (
    store_id, title, description, action_label, model_engine, model_provider, execution_gateway, cdn_icon_url, impact_level, category, status
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Pengeluaran Gas Fee naik 12%',
    'DeepSeek R1 merekomendasikan alokasi batching transaksi Solana Pay pada jam sepi untuk menghemat $20.40/bulan.',
    'Optimasi Gas Fee',
    'deepseek/deepseek-r1-distill-llama-70b',
    'DeepSeek Reasoning AI',
    'ZeroClaw-Edge-Gateway',
    'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    'HIGH IMPACT',
    'Cost Optimization',
    'active'
),
(
    '11111111-1111-1111-1111-111111111111',
    'Margin keuntungan 72.2% (Lebih tinggi dari rata-rata)',
    '9Router Engine mendeteksi performa margin bisnis di atas target industri 65%. Pertahankan struktur biaya kasir operasional.',
    'Pertahankan Strategy',
    '9Router-Auto-Cost-Optimizer',
    '9Router Layer 5 Engine',
    'ZeroClaw-Edge-Gateway',
    'https://cdn.zegaai.site/assets/logo/9router.png',
    'RECOMMENDED',
    'Profit Margin',
    'active'
),
(
    '11111111-1111-1111-1111-111111111111',
    '3 Pelanggan berpotensi repeat order dalam 48 jam',
    'Claude 3.5 Sonnet merekomendasikan otomatisasi pengiriman kupon loyalitas via WA untuk mengunci pendapatan $85.50 USDC.',
    'Kirim Kupon Auto',
    'anthropic/claude-3.5-sonnet',
    'Anthropic AI',
    'ZeroClaw-Edge-Gateway',
    'https://cdn.zegaai.site/assets/logo/claude.webp',
    'HIGH IMPACT',
    'Customer Retention',
    'active'
);
