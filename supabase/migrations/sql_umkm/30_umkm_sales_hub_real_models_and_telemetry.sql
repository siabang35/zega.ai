-- ============================================================================
-- ZEGA AI: UMKM Sales Hub Real Models & Telemetry Migration
-- File: 30_umkm_sales_hub_real_models_and_telemetry.sql
-- ============================================================================

-- 1. Create umkm_sales_insights table for Real AI Model Swarm Predictions
CREATE TABLE IF NOT EXISTS public.umkm_sales_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    model_engine TEXT NOT NULL DEFAULT '9Router-Auto-Cost-Optimizer',
    model_provider TEXT NOT NULL DEFAULT '9router/gpt-4o-mini',
    execution_gateway TEXT NOT NULL DEFAULT 'ZeroClaw-Edge-Gateway',
    cdn_icon_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png',
    insight_type TEXT NOT NULL, -- growth, product, channel, forecast
    headline TEXT NOT NULL,
    content TEXT NOT NULL,
    action_suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add defensive columns to umkm_sales_metrics
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='umkm_sales_metrics' AND column_name='model_engine') THEN
        ALTER TABLE public.umkm_sales_metrics ADD COLUMN model_engine TEXT DEFAULT '9Router-Auto-Cost-Optimizer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='umkm_sales_metrics' AND column_name='model_provider') THEN
        ALTER TABLE public.umkm_sales_metrics ADD COLUMN model_provider TEXT DEFAULT '9router/gpt-4o-mini';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='umkm_sales_metrics' AND column_name='execution_gateway') THEN
        ALTER TABLE public.umkm_sales_metrics ADD COLUMN execution_gateway TEXT DEFAULT 'ZeroClaw-Edge-Gateway';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='umkm_sales_metrics' AND column_name='cdn_icon_url') THEN
        ALTER TABLE public.umkm_sales_metrics ADD COLUMN cdn_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png';
    END IF;
END $$;

-- 3. Enable RLS and Permissive Policies
ALTER TABLE public.umkm_sales_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated umkm_sales_insights" ON public.umkm_sales_insights;
CREATE POLICY "Allow all for authenticated umkm_sales_insights" ON public.umkm_sales_insights FOR ALL USING (true);

-- 4. Enable Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_sales_insights'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_insights;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_sales_channels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_channels;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_sales_products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_products;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_sales_activities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_sales_activities;
    END IF;
END $$;

-- 5. Safe Event Trigger for Timeline Integration
CREATE OR REPLACE FUNCTION fn_log_umkm_sales_event()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'umkm_timeline_events' 
        AND column_name = 'title'
    ) THEN
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
            'TrendingUp',
            'AI Sales Swarm Generated Strategy: "' || COALESCE(NEW.headline, 'New Sales Strategy') || '"',
            'Sales Strategy Updated',
            'Active',
            'sales',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_umkm_sales_insight ON public.umkm_sales_insights;
CREATE TRIGGER trg_log_umkm_sales_insight
    AFTER INSERT ON public.umkm_sales_insights
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_umkm_sales_event();

-- 6. Seed Initial Real AI Model Sales Insights with Cloudflare R2 CDN Logos
INSERT INTO public.umkm_sales_insights (
    id, store_id, model_engine, model_provider, execution_gateway, cdn_icon_url,
    insight_type, headline, content, action_suggestion
) VALUES 
(
    '77777777-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '9Router-Auto-Cost-Optimizer',
    '9router/gpt-4o-mini',
    'ZeroClaw-Edge-Gateway',
    'https://cdn.zegaai.site/assets/logo/9router.png',
    'growth',
    'Penjualan Meningkat +18% Dibanding Bulan Lalu',
    'Konversi channel WhatsApp naik signifikan mencapai 45% dari total omset Rp13.5M.',
    'Pertahankan momentum promosi WhatsApp & pertimbangkan ikuti campaign tanggal kembar.'
),
(
    '77777777-2222-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'ZEGA-Swarm-Llama-3.3-70B',
    '9router/llama-3.3-70b',
    'ZeroClaw-Edge-Gateway',
    'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    'product',
    'Paket Skincare Basic Terjual 32 Unit (Top Product)',
    'Paket Skincare Basic menyumbang Rp3.84M dengan tren pertumbuhan 16%.',
    'Tambah stok persediaan minimal 50 unit dan bundling dengan Toner Booster.'
),
(
    '77777777-3333-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'ZeroClaw-Edge-Daemon',
    'zeroclaw/daemon-v0.5.3',
    'ZeroClaw-Edge-Gateway',
    'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    'channel',
    'WhatsApp Memberikan Kontribusi Omset Terbesar (45%)',
    'Channel WhatsApp membukukan omset Rp6.1M dengan tingkat retensi pelanggan 42%.',
    'Aktifkan AI Auto-Followup untuk pesanan pending checkout via WhatsApp.'
)
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();
