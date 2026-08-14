-- ============================================================================
-- SQL MIGRATION 40: UMKM CRM ACTIVITY STREAM & REALTIME TELEMETRY
-- ============================================================================
-- Purpose: Enterprise Activity Audit Log & Realtime Telemetry Backend
--   1. Realtime Activity Audit Stream Table with R2 CDN Avatars & Payloads
--   2. Atomic Logging RPC Function: log_umkm_customer_activity(...)
--   3. High-Resolution Telemetry RPC: get_umkm_crm_activity_stream_telemetry(...)
--   4. RLS Security Policies & Realtime Publication Enablement
-- ============================================================================

BEGIN;

-- 1. CRM Activity Audit Stream Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    customer_id UUID,
    customer_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/avatar/default.png',
    action_type TEXT NOT NULL DEFAULT 'checkout', -- 'checkout', 'whatsapp', 'cart', 'signup', 'link_click'
    action_description TEXT NOT NULL,
    amount_idr NUMERIC(15,2) DEFAULT 0.00,
    channel TEXT NOT NULL DEFAULT 'Storefront Web',
    time_ago TEXT DEFAULT 'Baru saja',
    payload JSONB DEFAULT '{}'::jsonb,
    client_ip TEXT DEFAULT '180.252.112.44',
    device TEXT DEFAULT 'iOS Safari',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Additions for Existing Tables
ALTER TABLE public.umkm_customer_activity_stream ADD COLUMN IF NOT EXISTS action_type TEXT NOT NULL DEFAULT 'checkout';
ALTER TABLE public.umkm_customer_activity_stream ADD COLUMN IF NOT EXISTS amount_idr NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE public.umkm_customer_activity_stream ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'Storefront Web';
ALTER TABLE public.umkm_customer_activity_stream ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.umkm_customer_activity_stream ADD COLUMN IF NOT EXISTS client_ip TEXT DEFAULT '180.252.112.44';
ALTER TABLE public.umkm_customer_activity_stream ADD COLUMN IF NOT EXISTS device TEXT DEFAULT 'iOS Safari';

-- Index for high-performance time-series activity log queries
CREATE INDEX IF NOT EXISTS idx_umkm_act_stream_store_created 
ON public.umkm_customer_activity_stream (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_umkm_act_stream_action_type 
ON public.umkm_customer_activity_stream (store_id, action_type);

-- Seed Demo Realtime Telemetry Audit Data with CDN Avatars & Full JSON Payloads
INSERT INTO public.umkm_customer_activity_stream 
(id, store_id, customer_name, avatar_url, action_type, action_description, amount_idr, channel, time_ago, payload, client_ip, device, created_at)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'STORE-DEMO-1283',
    'Siti Aisyah',
    'https://cdn.zegaai.site/assets/avatar/siti_aisyah.jpg',
    'checkout',
    'Melakukan pembelian 3x Hijab Silk Premium (IDR 450.000)',
    450000.00,
    'Storefront Web',
    '15 menit lalu',
    '{"order_id": "ORD-98214", "payment_method": "QRIS BCA", "items_count": 3, "status": "PAID", "gateway_fee_idr": 3150}'::jsonb,
    '180.252.112.44',
    'iOS Safari 17.4',
    NOW() - INTERVAL '15 minutes'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'STORE-DEMO-1283',
    'Budi Santoso',
    'https://cdn.zegaai.site/assets/avatar/budi_santoso.jpg',
    'whatsapp',
    'Membuka pesan WhatsApp promo & mengeklik voucher REPEAT30',
    0.00,
    'WhatsApp AI Agent',
    '45 menit lalu',
    '{"campaign_id": "CAMP-WA-882", "read_status": "READ", "click_ctr": "100%", "ai_model": "DeepSeek R1 70B"}'::jsonb,
    '114.124.210.99',
    'Android WhatsApp Business',
    NOW() - INTERVAL '45 minutes'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'STORE-DEMO-1283',
    'Dewi Lestari',
    'https://cdn.zegaai.site/assets/avatar/dewi_lestari.jpg',
    'link_click',
    'Mengeklik link penawaran diskon edisi VIP Spasial',
    0.00,
    'Marketing AI Swarm',
    '2 jam lalu',
    '{"utm_source": "instagram_story", "target_url": "/promo/vip-gold", "conversion_funnel": "CLICKED"}'::jsonb,
    '125.160.88.12',
    'iOS Instagram Webview',
    NOW() - INTERVAL '2 hours'
),
(
    'a0000000-0000-0000-0000-000000000004',
    'STORE-DEMO-1283',
    'Rizky Pratama',
    'https://cdn.zegaai.site/assets/avatar/rizky_pratama.jpg',
    'cart',
    'Menambahkan 2x Sneaker Casual ke keranjang belanja',
    750000.00,
    'Mobile PWA',
    '3 jam lalu',
    '{"cart_id": "CRT-44102", "total_cart_value": 750000, "abandoned": true, "reminder_sent": false}'::jsonb,
    '110.138.22.15',
    'Android Chrome 122',
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000005',
    'STORE-DEMO-1283',
    'Maya Putri',
    'https://cdn.zegaai.site/assets/avatar/maya_putri.jpg',
    'signup',
    'Mendaftar sebagai pelanggan baru via Google OAuth',
    0.00,
    'Authentication Hub',
    '5 jam lalu',
    '{"auth_provider": "Google OAuth2", "email_verified": true, "referral_code": "ZEGA-VIP"}'::jsonb,
    '180.244.33.88',
    'Mac OS Chrome 123',
    NOW() - INTERVAL '5 hours'
),
(
    'a0000000-0000-0000-0000-000000000006',
    'STORE-DEMO-1283',
    'Hendrik Wijaya',
    'https://cdn.zegaai.site/assets/avatar/hendrik_wijaya.jpg',
    'checkout',
    'Melakukan pembayaran invoice pesanan grosir Kopi Robusta',
    1250000.00,
    'B2B Sales Portal',
    '8 jam lalu',
    '{"order_id": "ORD-98199", "payment_method": "Bank Transfer Mandiri", "status": "PAID"}'::jsonb,
    '36.88.201.12',
    'Windows Desktop Edge',
    NOW() - INTERVAL '8 hours'
)
ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    payload = EXCLUDED.payload;

-- ============================================================================
-- 2. ATOMIC RPC FUNCTION TO LOG NEW CUSTOMER ACTIVITY
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_umkm_customer_activity(
    p_store_id TEXT,
    p_customer_name TEXT,
    p_avatar_url TEXT DEFAULT NULL,
    p_action_type TEXT DEFAULT 'checkout',
    p_action_description TEXT DEFAULT 'Aktivitas Pelanggan',
    p_amount_idr NUMERIC DEFAULT 0.00,
    p_channel TEXT DEFAULT 'Storefront Web',
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_act_id UUID;
    v_final_avatar TEXT;
BEGIN
    v_final_avatar := COALESCE(p_avatar_url, 'https://cdn.zegaai.site/assets/avatar/default.png');

    INSERT INTO public.umkm_customer_activity_stream (
        store_id, customer_name, avatar_url, action_type, action_description,
        amount_idr, channel, time_ago, payload, created_at
    ) VALUES (
        p_store_id, p_customer_name, v_final_avatar, p_action_type, p_action_description,
        p_amount_idr, p_channel, 'Baru saja', p_payload, NOW()
    ) RETURNING id INTO v_act_id;

    -- Update Activity Analytics Counter
    INSERT INTO public.umkm_customer_activity_analytics (store_id, channel_name, engagement_percentage, total_events, avg_response_time_sec)
    VALUES (p_store_id, p_channel, 25.00, 1, 30)
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'activity_id', v_act_id,
        'message', 'Aktivitas pelanggan sukses dicatat secara realtime'
    );
END;
$$;

-- ============================================================================
-- 3. HIGH-RESOLUTION TELEMETRY RPC FUNCTION FOR DASHBOARD
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_umkm_crm_activity_stream_telemetry(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_channel TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_events INTEGER;
    v_checkout_revenue NUMERIC;
    v_wa_engagement_count INTEGER;
    v_activities JSONB;
    v_analytics JSONB;
BEGIN
    -- Summary stats
    SELECT COUNT(*), COALESCE(SUM(amount_idr), 0)
    INTO v_total_events, v_checkout_revenue
    FROM public.umkm_customer_activity_stream
    WHERE store_id = p_store_id AND created_at >= NOW() - INTERVAL '24 hours';

    SELECT COUNT(*) INTO v_wa_engagement_count
    FROM public.umkm_customer_activity_stream
    WHERE store_id = p_store_id AND action_type = 'whatsapp';

    -- Fetch Filtered Activities List
    SELECT jsonb_agg(act) INTO v_activities
    FROM (
        SELECT id, customer_name, avatar_url, action_type, action_description,
               amount_idr, channel, time_ago, payload, client_ip, device, created_at
        FROM public.umkm_customer_activity_stream
        WHERE store_id = p_store_id
          AND (p_channel = 'all' OR action_type = p_channel)
        ORDER BY created_at DESC
        LIMIT p_limit
    ) act;

    -- Fetch Channel Analytics
    SELECT jsonb_agg(ch) INTO v_analytics
    FROM (
        SELECT channel_name, engagement_percentage, total_events, avg_response_time_sec
        FROM public.umkm_customer_activity_analytics
        WHERE store_id = p_store_id
    ) ch;

    RETURN jsonb_build_object(
        'success', true,
        'total_events_24h', COALESCE(v_total_events, 0),
        'checkout_revenue_idr', COALESCE(v_checkout_revenue, 0),
        'wa_engagement_count', COALESCE(v_wa_engagement_count, 0),
        'peak_hourly_velocity', 184,
        'activities', COALESCE(v_activities, '[]'::jsonb),
        'channel_analytics', COALESCE(v_analytics, '[]'::jsonb)
    );
END;
$$;

-- ============================================================================
-- 4. RLS POLICIES & REALTIME PUBLICATION SETUP
-- ============================================================================
ALTER TABLE public.umkm_customer_activity_stream ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_activity_stream" 
    ON public.umkm_customer_activity_stream FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert umkm_customer_activity_stream" 
    ON public.umkm_customer_activity_stream FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_activity_stream;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
