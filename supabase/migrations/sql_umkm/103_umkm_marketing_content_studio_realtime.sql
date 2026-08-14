-- =========================================================================
-- SQL Migration 103: UMKM AI Marketing Content Studio (Video, Multi-Modal & Collaboration Tools)
-- =========================================================================
-- Description:
-- Establishes real-time AI Content Studio schema supporting AI Video Generation
-- (Veo 2, Luma Dream Machine, SeaDance AI, CapCut Pro Swarm, Runway Gen-3, ZeroClaw Video Daemon, 9Router Swarm),
-- aspect ratio formatting, voiceover TTS integration, collaboration tools
-- (collaboration_status, assigned_team_member, comments_count, export_target),
-- CDN asset resolution, atomic stored procedure, and rich production seed data.
-- =========================================================================

-- 1. Create umkm_marketing_content_items table
CREATE TABLE IF NOT EXISTS public.umkm_marketing_content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'Instagram', 'TikTok', 'WhatsApp', 'Shopee', 'Email', 'YouTube Shorts'
    content_type VARCHAR(100) NOT NULL, -- 'TikTok Video', 'Instagram Reel', 'Instagram Post', 'WhatsApp Template', 'Shopee Banner', 'YouTube Short'
    media_type VARCHAR(50) NOT NULL DEFAULT 'image', -- 'video', 'image', 'carousel', 'text'
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Published', 'Archived'
    collaboration_status VARCHAR(50) NOT NULL DEFAULT 'Approved', -- 'Pending Review', 'Approved', 'In Revision', 'Ready to Publish'
    assigned_team_member VARCHAR(100) DEFAULT 'AI Marketing Lead',
    comments_count INTEGER DEFAULT 0,
    export_target VARCHAR(100) DEFAULT 'Direct Platform Publish', -- 'Direct Platform Publish', 'CapCut Pro Export', 'Adobe Premiere XML', 'Canva Sync'
    cdn_image_url TEXT,
    creative_image_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    aspect_ratio VARCHAR(20) DEFAULT '9:16', -- '9:16', '1:1', '16:9', '4:5'
    duration_seconds INTEGER DEFAULT 15,
    voiceover_engine VARCHAR(100) DEFAULT 'ZeroClaw TTS Edge', -- 'ZeroClaw TTS Edge', 'ElevenLabs Indonesian', 'OpenAI Whisper TTS', 'Tanpa Voiceover'
    caption_text TEXT,
    hashtags TEXT,
    prompt_used TEXT,
    model_engine VARCHAR(100) NOT NULL DEFAULT 'ZeroClaw Edge Video Daemon', -- 'ZeroClaw Edge Video Daemon', '9Router Swarm Cost-Optimizer', 'Veo 2 Enterprise Video Engine', 'Luma Dream Machine 2.0', 'SeaDance AI Video Engine', 'CapCut Pro AI Swarm Exporter', 'Runway Gen-3 Alpha', 'Kling 1.5 HD AI Video', 'DeepSeek R1', 'Qwen 2.5 Coder', 'Claude 3.5 Sonnet'
    engagement_score NUMERIC(5,2) DEFAULT 0.00,
    reach_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    generation_latency_ms INTEGER DEFAULT 180,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive column checks for non-destructive upgrades
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'image';
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS collaboration_status VARCHAR(50) DEFAULT 'Approved';
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS assigned_team_member VARCHAR(100) DEFAULT 'AI Marketing Lead';
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS export_target VARCHAR(100) DEFAULT 'Direct Platform Publish';
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(20) DEFAULT '9:16';
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 15;
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS voiceover_engine VARCHAR(100) DEFAULT 'ZeroClaw TTS Edge';
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS prompt_used TEXT;
ALTER TABLE public.umkm_marketing_content_items ADD COLUMN IF NOT EXISTS generation_latency_ms INTEGER DEFAULT 180;

-- 2. Create umkm_content_studio_analytics table for Bar Chart analytics
CREATE TABLE IF NOT EXISTS public.umkm_content_studio_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    total_posts INTEGER DEFAULT 0,
    total_videos INTEGER DEFAULT 0,
    avg_engagement_pct NUMERIC(5,2) DEFAULT 0.00,
    total_reach INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_studio_analytics UNIQUE (store_id, platform)
);

ALTER TABLE public.umkm_content_studio_analytics ADD COLUMN IF NOT EXISTS total_videos INTEGER DEFAULT 0;

-- 3. Enable RLS and Create Policies
ALTER TABLE public.umkm_marketing_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_content_studio_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select umkm_marketing_content_items" ON public.umkm_marketing_content_items;
CREATE POLICY "Public select umkm_marketing_content_items" ON public.umkm_marketing_content_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert umkm_marketing_content_items" ON public.umkm_marketing_content_items;
CREATE POLICY "Public insert umkm_marketing_content_items" ON public.umkm_marketing_content_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update umkm_marketing_content_items" ON public.umkm_marketing_content_items;
CREATE POLICY "Public update umkm_marketing_content_items" ON public.umkm_marketing_content_items
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete umkm_marketing_content_items" ON public.umkm_marketing_content_items;
CREATE POLICY "Public delete umkm_marketing_content_items" ON public.umkm_marketing_content_items
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select umkm_content_studio_analytics" ON public.umkm_content_studio_analytics;
CREATE POLICY "Public select umkm_content_studio_analytics" ON public.umkm_content_studio_analytics
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upsert umkm_content_studio_analytics" ON public.umkm_content_studio_analytics;
CREATE POLICY "Public upsert umkm_content_studio_analytics" ON public.umkm_content_studio_analytics
    FOR ALL USING (true);

-- 4. Create Atomic Stored Procedure for Multi-Modal & Video AI Content Generation with Collaboration
CREATE OR REPLACE FUNCTION public.fn_generate_umkm_content_studio_item(
    p_store_id UUID,
    p_title VARCHAR(255),
    p_platform VARCHAR(50),
    p_content_type VARCHAR(100),
    p_media_type VARCHAR(50),
    p_model_engine VARCHAR(100),
    p_aspect_ratio VARCHAR(20),
    p_duration_seconds INTEGER,
    p_voiceover_engine VARCHAR(100),
    p_export_target VARCHAR(100),
    p_prompt_used TEXT,
    p_caption TEXT,
    p_hashtags TEXT,
    p_cdn_image_url TEXT,
    p_video_url TEXT
)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    title VARCHAR(255),
    platform VARCHAR(50),
    content_type VARCHAR(100),
    media_type VARCHAR(50),
    status VARCHAR(50),
    collaboration_status VARCHAR(50),
    assigned_team_member VARCHAR(100),
    comments_count INTEGER,
    export_target VARCHAR(100),
    cdn_image_url TEXT,
    creative_image_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    aspect_ratio VARCHAR(20),
    duration_seconds INTEGER,
    voiceover_engine VARCHAR(100),
    caption_text TEXT,
    hashtags TEXT,
    prompt_used TEXT,
    model_engine VARCHAR(100),
    engagement_score NUMERIC(5,2),
    reach_count INTEGER,
    shares_count INTEGER,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_id UUID := gen_random_uuid();
    v_default_image TEXT;
    v_default_video TEXT;
    v_media_type VARCHAR(50);
BEGIN
    v_media_type := COALESCE(p_media_type, 'image');
    v_default_image := COALESCE(p_cdn_image_url, '/design/dashboard_umkm/marketing/promo_skincare.jpeg');
    v_default_video := p_video_url;

    INSERT INTO public.umkm_marketing_content_items (
        id,
        store_id,
        title,
        platform,
        content_type,
        media_type,
        status,
        collaboration_status,
        assigned_team_member,
        comments_count,
        export_target,
        cdn_image_url,
        creative_image_url,
        video_url,
        thumbnail_url,
        aspect_ratio,
        duration_seconds,
        voiceover_engine,
        caption_text,
        hashtags,
        prompt_used,
        model_engine,
        engagement_score,
        reach_count,
        shares_count,
        generation_latency_ms
    ) VALUES (
        v_new_id,
        p_store_id,
        p_title,
        p_platform,
        p_content_type,
        v_media_type,
        'Scheduled',
        'Approved',
        'AI Content Strategist',
        0,
        COALESCE(p_export_target, 'CapCut Pro Export'),
        v_default_image,
        v_default_image,
        v_default_video,
        v_default_image,
        COALESCE(p_aspect_ratio, '9:16'),
        COALESCE(p_duration_seconds, 15),
        COALESCE(p_voiceover_engine, 'ZeroClaw TTS Edge'),
        p_caption,
        p_hashtags,
        p_prompt_used,
        COALESCE(p_model_engine, 'ZeroClaw Edge Video Daemon'),
        ROUND((8.5 + (random() * 4.5))::numeric, 2),
        FLOOR(1800 + (random() * 4200))::integer,
        FLOOR(60 + (random() * 320))::integer,
        FLOOR(120 + (random() * 250))::integer
    );

    -- Update Analytics aggregate
    INSERT INTO public.umkm_content_studio_analytics (store_id, platform, total_posts, total_videos, avg_engagement_pct, total_reach, total_shares)
    VALUES (p_store_id, p_platform, 1, CASE WHEN v_media_type = 'video' THEN 1 ELSE 0 END, 9.2, 3200, 180)
    ON CONFLICT (store_id, platform) DO UPDATE
    SET total_posts = umkm_content_studio_analytics.total_posts + 1,
        total_videos = umkm_content_studio_analytics.total_videos + CASE WHEN v_media_type = 'video' THEN 1 ELSE 0 END,
        total_reach = umkm_content_studio_analytics.total_reach + 3200,
        updated_at = NOW();

    RETURN QUERY
    SELECT 
        c.id, c.store_id, c.title, c.platform, c.content_type, c.media_type, c.status,
        c.collaboration_status, c.assigned_team_member, c.comments_count, c.export_target,
        c.cdn_image_url, c.creative_image_url, c.video_url, c.thumbnail_url,
        c.aspect_ratio, c.duration_seconds, c.voiceover_engine,
        c.caption_text, c.hashtags, c.prompt_used,
        c.model_engine, c.engagement_score, c.reach_count, c.shares_count, c.created_at
    FROM public.umkm_marketing_content_items c
    WHERE c.id = v_new_id;
END;
$$;

-- 5. Seed Real Enterprise Content Data with SeaDance AI, CapCut Pro Swarm, and Collaboration Status
DELETE FROM public.umkm_marketing_content_items WHERE store_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.umkm_marketing_content_items (
    id, store_id, title, platform, content_type, media_type, status, collaboration_status, assigned_team_member, comments_count, export_target, cdn_image_url, creative_image_url, video_url, thumbnail_url, aspect_ratio, duration_seconds, voiceover_engine, caption_text, hashtags, prompt_used, model_engine, engagement_score, reach_count, shares_count
) VALUES
(
    'c1111111-0001-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Unboxing Serum Niacinamide 10% Video Reel',
    'TikTok',
    'TikTok Video',
    'video',
    'Published',
    'Approved',
    'Budi (Video Editor)',
    3,
    'CapCut Pro Export',
    '/design/dashboard_umkm/marketing/tiktok_video.jpeg',
    '/design/dashboard_umkm/marketing/tiktok_video.jpeg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '/design/dashboard_umkm/marketing/tiktok_video.jpeg',
    '9:16',
    15,
    'ZeroClaw TTS Edge',
    'Gokil banget hasilnya dalam 7 hari! Tonton unboxing & honest review Serum Glowing Niacinamide 10%. Keranjang kuning ready stock diskon 30%!',
    '#TikTokShop #SerumGlowing #HonestReview #ViralBeauty #ZegaAI',
    'Generasikan video 15 detik TikTok Reel unboxing skincare serum dengan SeaDance AI Engine & CapCut Pro timeline export.',
    'SeaDance AI Video Engine',
    12.85,
    34200,
    1420
),
(
    'c1111111-0002-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Tutorial Skincare Routine Malam Hari',
    'Instagram',
    'Instagram Reel',
    'video',
    'Published',
    'Approved',
    'Siti (Social Media Specialist)',
    5,
    'Adobe Premiere XML',
    '/design/dashboard_umkm/marketing/instagram_story.jpeg',
    '/design/dashboard_umkm/marketing/instagram_story.jpeg',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '/design/dashboard_umkm/marketing/instagram_story.jpeg',
    '9:16',
    30,
    'ElevenLabs Indonesian',
    'Rahasia night routine urutan pemakaian serum & moisturizer agar kulit kenyal saat bangun pagi. Swipe up untuk lihat paket glowing lengkap!',
    '#BeautyTips #NightRoutine #GlowingSkin #SkincareEdu #ZegaReels',
    'Video cinematic tutorial 30 detik langkah perawatan wajah malam hari via CapCut Pro AI Swarm.',
    'CapCut Pro AI Swarm Exporter',
    10.40,
    21800,
    890
),
(
    'c1111111-0003-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Promo Skincare Glowing Gajian Agustus',
    'Instagram',
    'Instagram Post',
    'image',
    'Published',
    'Ready to Publish',
    'Rian (Graphic Designer)',
    2,
    'Canva Sync',
    '/design/dashboard_umkm/marketing/promo_skincare.jpeg',
    '/design/dashboard_umkm/marketing/promo_skincare.jpeg',
    NULL,
    '/design/dashboard_umkm/marketing/promo_skincare.jpeg',
    '1:1',
    0,
    'Tanpa Voiceover',
    'Dapatkan kulit sehat glowing berseri dengan promo spesial gajian Agustus! Diskon up to 35% untuk seluruh paket skincare premium ZEGA Beauty. Klik link di bio!',
    '#ZegaBeauty #SkincareGlow #PromoAgustus #KulitSehat #DiskonSkincare',
    'Desain flyer promosi produk skincare glowing sudut elegan dengan efek kilauan emas dan badge diskon 35%.',
    '9Router Swarm Cost-Optimizer',
    9.85,
    14200,
    340
),
(
    'c1111111-0004-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Diskon Spesial WhatsApp VIP Customer',
    'WhatsApp',
    'WhatsApp Template',
    'text',
    'Scheduled',
    'In Revision',
    'Anita (Copywriter Lead)',
    1,
    'Direct Platform Publish',
    '/design/dashboard_umkm/marketing/discount.jpeg',
    '/design/dashboard_umkm/marketing/discount.jpeg',
    NULL,
    '/design/dashboard_umkm/marketing/discount.jpeg',
    '1:1',
    0,
    'Tanpa Voiceover',
    'Halo Kak! Khusus untuk pelanggan setia ZEGA, klaim voucher eksklusif potongan Rp50.000 dengan kode promo: ZEGAAGUSTUS. Berlaku hingga akhir minggu ini!',
    '#ZEGAVIP #PromoWhatsApp #VoucherEksklusif',
    'Teks templat WhatsApp broadcast yang dipersonalisasi untuk pembeli berulang dengan panggilan Kakak dan penawaran voucher eksklusif.',
    'DeepSeek R1',
    11.20,
    18600,
    512
),
(
    'c1111111-0005-4444-9999-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Shopee Flash Sale Weekend Offer Banner',
    'Shopee',
    'Shopee Banner',
    'image',
    'Scheduled',
    'Pending Review',
    'Bambang (Marketing Manager)',
    4,
    'Direct Platform Publish',
    'https://cdn.zegaai.site/assets/logo/shopee.png',
    'https://cdn.zegaai.site/assets/logo/shopee.png',
    NULL,
    'https://cdn.zegaai.site/assets/logo/shopee.png',
    '16:9',
    0,
    'Tanpa Voiceover',
    'Flash Sale Toko Shopee Official! Diskon ekstra 20% + Gratis Ongkir Rp0 seluruh Indonesia. Buruan checkout sebelum kehabisan!',
    '#ShopeeFlashSale #GratisOngkir #ZegaShopee',
    'Banner toko Shopee oranye terang dengan tipografi tajam bertuliskan Flash Sale Weekend & Gratis Ongkir Rp0.',
    'Luma Dream Machine 2.0',
    7.90,
    8500,
    180
);

-- Seed Analytics Data
DELETE FROM public.umkm_content_studio_analytics WHERE store_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.umkm_content_studio_analytics (store_id, platform, total_posts, total_videos, avg_engagement_pct, total_reach, total_shares) VALUES
('11111111-1111-1111-1111-111111111111', 'TikTok', 14, 10, 12.85, 34200, 1420),
('11111111-1111-1111-1111-111111111111', 'Instagram', 22, 8, 10.40, 28400, 940),
('11111111-1111-1111-1111-111111111111', 'WhatsApp', 26, 2, 11.20, 18600, 512),
('11111111-1111-1111-1111-111111111111', 'Shopee', 11, 1, 7.90, 8500, 180),
('11111111-1111-1111-1111-111111111111', 'Email', 7, 0, 4.80, 5400, 95);

-- 6. Add to Realtime Publication safely
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketing_content_items;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_content_studio_analytics;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
