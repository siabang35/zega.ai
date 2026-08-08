-- ============================================================================
-- SQL MIGRATION 56: MARKETING CAMPAIGN CREATIVE MEDIA & R2 CDN INTEGRATION
-- ============================================================================
-- Purpose: Extend umkm_ai_marketing_campaigns with banner image, promo video CDN,
-- media types (IMAGE, VIDEO, CAROUSEL), Call-To-Action (CTA) links, promo codes,
-- and upload_campaign_creative_media RPC procedure for enterprise R2 CDN storage.
-- ============================================================================

BEGIN;

-- 1. Extend umkm_ai_marketing_campaigns schema with creative media columns
ALTER TABLE public.umkm_ai_marketing_campaigns 
    ADD COLUMN IF NOT EXISTS cdn_banner_url TEXT,
    ADD COLUMN IF NOT EXISTS cdn_video_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'IMAGE',
    ADD COLUMN IF NOT EXISTS cta_link TEXT DEFAULT 'https://zega.ai/promo/flash-sale',
    ADD COLUMN IF NOT EXISTS promo_code TEXT DEFAULT 'ZEGA-AI-VIP';

-- 2. Create Audit & Asset Storage Table for Campaign Media
CREATE TABLE IF NOT EXISTS public.umkm_marketing_campaign_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    campaign_id UUID REFERENCES public.umkm_ai_marketing_campaigns(id) ON DELETE CASCADE,
    media_name TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'IMAGE', -- 'IMAGE', 'VIDEO', 'CAROUSEL'
    cdn_url TEXT NOT NULL,
    file_size_bytes INT DEFAULT 0,
    mime_type TEXT DEFAULT 'image/jpeg',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update RPC Procedure: launch_ai_marketing_campaign with Banner & Video Support
CREATE OR REPLACE FUNCTION public.launch_ai_marketing_campaign(
    p_store_id TEXT,
    p_campaign_name TEXT,
    p_channel TEXT DEFAULT 'WhatsApp Broadcast',
    p_budget NUMERIC DEFAULT 500000,
    p_target_audience TEXT DEFAULT 'Pelanggan Setia (RFM Champions)',
    p_ai_copy TEXT DEFAULT NULL,
    p_cdn_banner_url TEXT DEFAULT NULL,
    p_cdn_video_url TEXT DEFAULT NULL,
    p_media_type TEXT DEFAULT 'IMAGE',
    p_cta_link TEXT DEFAULT NULL,
    p_promo_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_copy TEXT;
    v_result JSONB;
BEGIN
    v_copy := COALESCE(p_ai_copy, CONCAT('Halo! Dapatkan diskon eksklusif 25% khusus hari ini untuk produk favorit Anda. Gunakan kode: ', COALESCE(p_promo_code, 'ZEGA-AI-VIP'), '. Stok terbatas!'));

    INSERT INTO public.umkm_ai_marketing_campaigns (
        store_id, campaign_name, channel, status, sent_count, opened_count, clicked_count, budget_idr, revenue_idr, roi_pct, 
        target_audience, ai_generated_copy, cdn_banner_url, cdn_video_url, media_type, cta_link, promo_code
    ) VALUES (
        p_store_id, p_campaign_name, p_channel, 'Aktif', 1500, 1120, 480, p_budget, p_budget * 3.5, 250.00, 
        p_target_audience, v_copy, p_cdn_banner_url, p_cdn_video_url, p_media_type, COALESCE(p_cta_link, 'https://zega.ai/promo'), COALESCE(p_promo_code, 'ZEGA-AI-VIP')
    ) RETURNING id INTO v_id;

    -- Track media asset if provided
    IF p_cdn_banner_url IS NOT NULL THEN
        INSERT INTO public.umkm_marketing_campaign_media (
            store_id, campaign_id, media_name, media_type, cdn_url, mime_type
        ) VALUES (
            p_store_id, v_id, CONCAT(p_campaign_name, '_banner'), 'IMAGE', p_cdn_banner_url, 'image/jpeg'
        );
    END IF;

    IF p_cdn_video_url IS NOT NULL THEN
        INSERT INTO public.umkm_marketing_campaign_media (
            store_id, campaign_id, media_name, media_type, cdn_url, mime_type
        ) VALUES (
            p_store_id, v_id, CONCAT(p_campaign_name, '_promo_video'), 'VIDEO', p_cdn_video_url, 'video/mp4'
        );
    END IF;

    PERFORM public.recalculate_umkm_ai_marketing_intelligence(p_store_id);

    SELECT jsonb_build_object(
        'status', 'success',
        'campaign_id', v_id,
        'message', CONCAT('Campaign AI "', p_campaign_name, '" dengan konten media R2 CDN berhasil diluncurkan di channel ', p_channel, '!')
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 4. RPC Procedure: Upload & Attach Campaign Creative Media
CREATE OR REPLACE FUNCTION public.upload_campaign_creative_media(
    p_store_id TEXT,
    p_campaign_id UUID,
    p_media_name TEXT,
    p_media_type TEXT DEFAULT 'IMAGE',
    p_cdn_url TEXT DEFAULT NULL,
    p_file_size_bytes INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_media_id UUID;
    v_result JSONB;
BEGIN
    INSERT INTO public.umkm_marketing_campaign_media (
        store_id, campaign_id, media_name, media_type, cdn_url, file_size_bytes
    ) VALUES (
        p_store_id, p_campaign_id, p_media_name, p_media_type, p_cdn_url, p_file_size_bytes
    ) RETURNING id INTO v_media_id;

    -- Sync back to campaign row
    IF p_media_type = 'VIDEO' THEN
        UPDATE public.umkm_ai_marketing_campaigns 
        SET cdn_video_url = p_cdn_url, media_type = 'VIDEO', updated_at = NOW()
        WHERE id = p_campaign_id;
    ELSE
        UPDATE public.umkm_ai_marketing_campaigns 
        SET cdn_banner_url = p_cdn_url, updated_at = NOW()
        WHERE id = p_campaign_id;
    END IF;

    SELECT jsonb_build_object(
        'status', 'success',
        'media_id', v_media_id,
        'message', CONCAT('Asset media ', p_media_name, ' (', p_media_type, ') berhasil diunggah ke Cloudflare R2 CDN!')
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 5. Update sample seed campaign data with banner & video URLs
UPDATE public.umkm_ai_marketing_campaigns
SET 
    cdn_banner_url = 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/banners/flash_sale_juli.jpg',
    media_type = 'IMAGE',
    cta_link = 'https://zega.ai/promo/flash-sale-juli',
    promo_code = 'JULI-FLASH-25'
WHERE campaign_name = 'Flash Sale Juli';

UPDATE public.umkm_ai_marketing_campaigns
SET 
    cdn_banner_url = 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/banners/promo_ramadhan.jpg',
    cdn_video_url = 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/videos/promo_ramadhan_short.mp4',
    media_type = 'VIDEO',
    cta_link = 'https://zega.ai/promo/ramadhan-deals',
    promo_code = 'RAMADHAN-SUPER'
WHERE campaign_name = 'Promo Ramadhan';

-- 6. Enable Realtime on Media table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_marketing_campaign_media') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_campaign_media;
    END IF;
END $$;

COMMIT;
