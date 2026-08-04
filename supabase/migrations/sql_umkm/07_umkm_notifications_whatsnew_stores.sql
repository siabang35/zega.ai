-- ============================================================================
-- MIGRATION 07: ENTERPRISE NOTIFICATIONS, WHAT'S NEW, & STORES SCHEMA
-- Database: Supabase PostgreSQL
-- Description: Adds tables for TopNavbar notifications, changelog feeds, and store switcher.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: umkm_stores (Ensure table exists & drop NOT NULL on user_id for flexibility)
CREATE TABLE IF NOT EXISTS public.umkm_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    store_id_code VARCHAR(64) UNIQUE NOT NULL DEFAULT ('STORE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    store_name VARCHAR(128) NOT NULL,
    owner_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    plan VARCHAR(32) NOT NULL DEFAULT 'Starter',
    logo_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    avatar_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop NOT NULL on user_id if present to allow demo stores
ALTER TABLE public.umkm_stores ALTER COLUMN user_id DROP NOT NULL;

-- 2. TABLE: umkm_notifications (Realtime Notifications Feed)
CREATE TABLE IF NOT EXISTS public.umkm_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE: umkm_whats_new (Changelog & Product Announcements)
CREATE TABLE IF NOT EXISTS public.umkm_whats_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_label TEXT DEFAULT 'NEW',
    badge_color TEXT DEFAULT 'orange',
    feature_items JSONB DEFAULT '[]'::jsonb,
    release_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.umkm_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_whats_new ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Allow all for umkm_stores" ON public.umkm_stores;
CREATE POLICY "Allow all for umkm_stores" ON public.umkm_stores FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for umkm_notifications" ON public.umkm_notifications;
CREATE POLICY "Allow all for umkm_notifications" ON public.umkm_notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for umkm_whats_new" ON public.umkm_whats_new;
CREATE POLICY "Allow all for umkm_whats_new" ON public.umkm_whats_new FOR ALL USING (true);

-- ENABLE SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_stores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_stores;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_whats_new') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_whats_new;
  END IF;
END $$;

-- SEED DEMO STORES USING DEMO USER UUID '00000000-0000-0000-0000-000000000000'
INSERT INTO public.umkm_stores (id, user_id, store_id_code, store_name, owner_name, email, plan, is_active)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'CIKCIKBERLUK',
    'Toko Cikcik berluk',
    'Cikcik berluk',
    'cikcikberluk@gmail.com',
    'Starter',
    true
),
(
    '88888888-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'ZEGA-FASHION',
    'ZEGA Fashion Boutique',
    'Cikcik berluk',
    'cikcikberluk@gmail.com',
    'PRO',
    true
),
(
    '77777777-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'KOPI-EXPRESS',
    'Kopi Nusantara Express',
    'Cikcik berluk',
    'cikcikberluk@gmail.com',
    'Enterprise',
    true
)
ON CONFLICT (id) DO UPDATE SET
store_name = EXCLUDED.store_name,
owner_name = EXCLUDED.owner_name,
user_id = EXCLUDED.user_id,
plan = EXCLUDED.plan;

-- SEED DEMO NOTIFICATIONS
INSERT INTO public.umkm_notifications (id, store_id, title, message, category, is_read, action_url)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'New Order #INV-2026-088 Received',
    'Customer Andi Saputra purchased 2x Kopi Arabika Premium (Rp170.000 via QRIS).',
    'order',
    false,
    'sales'
),
(
    'a2222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'AI Customer Support Alert',
    'Customer Service AI handled 125 chats today with a 94.2% resolution score.',
    'ai_alert',
    false,
    'my_agents'
),
(
    'a3333333-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Instagram DM Bot Sync Completed',
    'Connected to @cikcikberluk_store. 45 DM auto-responses dispatched.',
    'system',
    true,
    'marketplace'
)
ON CONFLICT (id) DO NOTHING;

-- SEED DEMO WHAT'S NEW CHANGELOG
INSERT INTO public.umkm_whats_new (id, version_tag, title, description, badge_label, badge_color, feature_items)
VALUES
(
    'b1111111-1111-1111-1111-111111111111',
    'v2.4.0',
    'Multi-Agent Swarm Realtime Sync',
    'AI Employees now feature instant Supabase WebSocket state sync and Cloudflare R2 avatar delivery.',
    'PRO FEATURE',
    'orange',
    '["Live WebSocket status toggles", "Dynamic JSONB KPI metrics", "Cloudflare R2 CDN resolution"]'::jsonb
),
(
    'b2222222-1111-1111-1111-111111111111',
    'v2.3.5',
    'Instagram DM & Comment Auto-Bot',
    'Automatically respond to Instagram product inquiries using database RAG context.',
    'NEW',
    'emerald',
    '["Direct Message auto-reply", "Comment to DM workflow", "Product catalog lookup"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
