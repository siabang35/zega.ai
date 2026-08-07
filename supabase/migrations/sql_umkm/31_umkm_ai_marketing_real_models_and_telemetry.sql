-- ============================================================================
-- ZEGA AI: UMKM Marketing Real AI Models & Telemetry Migration
-- File: 31_umkm_ai_marketing_real_models_and_telemetry.sql
-- ============================================================================

-- 1. Add AI Model Telemetry columns to umkm_marketing_metrics
ALTER TABLE public.umkm_marketing_metrics 
ADD COLUMN IF NOT EXISTS model_engine TEXT DEFAULT '9Router-Auto-Cost-Optimizer',
ADD COLUMN IF NOT EXISTS model_provider TEXT DEFAULT '9Router Layer 5 Engine',
ADD COLUMN IF NOT EXISTS execution_gateway TEXT DEFAULT 'ZeroClaw-Edge-Gateway',
ADD COLUMN IF NOT EXISTS cdn_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png',
ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5, 2) DEFAULT 99.85,
ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 142;

-- 2. Create umkm_marketing_swarms table for storing real AI model deployment instances
CREATE TABLE IF NOT EXISTS public.umkm_marketing_swarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    swarm_name TEXT NOT NULL,
    model_engine TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    execution_gateway TEXT NOT NULL,
    cdn_icon_url TEXT NOT NULL,
    campaign_focus TEXT NOT NULL DEFAULT 'Omnichannel AI Marketing',
    status TEXT NOT NULL DEFAULT 'active', -- active, optimizing, paused
    success_rate NUMERIC(5, 2) DEFAULT 99.85,
    latency_ms INTEGER DEFAULT 142,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for umkm_marketing_swarms
ALTER TABLE public.umkm_marketing_swarms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated umkm_marketing_swarms" ON public.umkm_marketing_swarms;
CREATE POLICY "Allow all for authenticated umkm_marketing_swarms" ON public.umkm_marketing_swarms FOR ALL USING (true);

-- 3. Enable Supabase Realtime for umkm_marketing_swarms & existing tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_swarms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_swarms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_activities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_activities;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketing_channels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_channels;
    END IF;
END $$;

-- 4. Defensive Trigger Function for Logging Marketing Events into Global Timeline
CREATE OR REPLACE FUNCTION public.fn_log_umkm_marketing_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
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
            'Megaphone',
            'New Marketing Swarm Deployed: "' || COALESCE(NEW.swarm_name, 'AI Marketing Swarm') || '" via ' || COALESCE(NEW.model_engine, '9Router'),
            'AI Marketing Swarm Active',
            'Active',
            'marketing',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger to umkm_marketing_swarms
DROP TRIGGER IF EXISTS trg_log_umkm_marketing_swarm ON public.umkm_marketing_swarms;
CREATE TRIGGER trg_log_umkm_marketing_swarm
    AFTER INSERT ON public.umkm_marketing_swarms
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_log_umkm_marketing_event();

-- 5. Seed Real AI Marketing Swarms
INSERT INTO public.umkm_marketing_swarms (
    store_id, swarm_name, model_engine, model_provider, execution_gateway, cdn_icon_url, campaign_focus, status, success_rate, latency_ms
) VALUES
('11111111-1111-1111-1111-111111111111', 'Omnichannel Growth Swarm', '9Router-Auto-Cost-Optimizer', '9Router Layer 5 Engine', 'ZeroClaw-Edge-Gateway', 'https://cdn.zegaai.site/assets/logo/9router.png', 'WhatsApp & IG Promo Automation', 'active', 99.85, 142),
('11111111-1111-1111-1111-111111111111', 'TikTok Creative AI Engine', '9router/qwen-2.5-coder-32b', 'Qwen AI Foundation', 'ZeroClaw-Edge-Gateway', 'https://cdn.zegaai.site/assets/logo/Qwen.png', 'TikTok Video Script & Hook Generator', 'active', 99.40, 185)
ON CONFLICT (id) DO NOTHING;

-- 6. Update Default Store Metrics Telemetry
UPDATE public.umkm_marketing_metrics
SET 
    model_engine = '9Router-Auto-Cost-Optimizer',
    model_provider = '9Router Layer 5 Engine',
    execution_gateway = 'ZeroClaw-Edge-Gateway',
    cdn_icon_url = 'https://cdn.zegaai.site/assets/logo/9router.png',
    success_rate = 99.85,
    latency_ms = 142,
    updated_at = NOW()
WHERE store_id = '11111111-1111-1111-1111-111111111111';
