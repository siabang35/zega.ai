-- Migration 91: UMKM AI Preferences & AI Memory Supabase Realtime Schema
-- Standard Enterprise Schema & Supabase Real-Time Setup for AI Settings

-- 1. AI Preferences Table
CREATE TABLE IF NOT EXISTS public.umkm_settings_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE UNIQUE,
    default_model VARCHAR(100) NOT NULL DEFAULT 'GPT-4o (Recommended)',
    response_style VARCHAR(100) NOT NULL DEFAULT 'Profesional',
    use_data_for_training BOOLEAN NOT NULL DEFAULT true,
    auto_insights BOOLEAN NOT NULL DEFAULT true,
    web_search_access BOOLEAN NOT NULL DEFAULT true,
    default_language VARCHAR(50) NOT NULL DEFAULT 'Bahasa Indonesia',
    response_length VARCHAR(50) NOT NULL DEFAULT 'Sedang',
    show_sources BOOLEAN NOT NULL DEFAULT true,
    response_format VARCHAR(50) NOT NULL DEFAULT 'Ringkas',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AI Memory Entries Table (For context memory management)
CREATE TABLE IF NOT EXISTS public.umkm_ai_memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    memory_key VARCHAR(150) NOT NULL,
    memory_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Konstruksi Bisnis',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Additions for AI Preferences
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS default_model VARCHAR(100) NOT NULL DEFAULT 'GPT-4o (Recommended)';
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS response_style VARCHAR(100) NOT NULL DEFAULT 'Profesional';
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS use_data_for_training BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS auto_insights BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS web_search_access BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS default_language VARCHAR(50) NOT NULL DEFAULT 'Bahasa Indonesia';
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS response_length VARCHAR(50) NOT NULL DEFAULT 'Sedang';
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS show_sources BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_ai_preferences ADD COLUMN IF NOT EXISTS response_format VARCHAR(50) NOT NULL DEFAULT 'Ringkas';

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_umkm_settings_ai_preferences_store ON public.umkm_settings_ai_preferences(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_memory_entries_store ON public.umkm_ai_memory_entries(store_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_settings_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_ai_memory_entries ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Store Owners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_settings_ai_preferences') THEN
        CREATE POLICY "Public read umkm_settings_ai_preferences" ON public.umkm_settings_ai_preferences FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_settings_ai_preferences') THEN
        CREATE POLICY "Public write umkm_settings_ai_preferences" ON public.umkm_settings_ai_preferences FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_ai_memory_entries') THEN
        CREATE POLICY "Public read umkm_ai_memory_entries" ON public.umkm_ai_memory_entries FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_ai_memory_entries') THEN
        CREATE POLICY "Public write umkm_ai_memory_entries" ON public.umkm_ai_memory_entries FOR ALL USING (true);
    END IF;
END $$;

-- SEED REAL DEMO DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_settings_ai_preferences (
    store_id, default_model, response_style, use_data_for_training, auto_insights, web_search_access,
    default_language, response_length, show_sources, response_format
)
VALUES (
    '11111111-1111-1111-1111-111111111111', 'GPT-4o (Recommended)', 'Profesional', true, true, true,
    'Bahasa Indonesia', 'Sedang', true, 'Ringkas'
)
ON CONFLICT (store_id) DO UPDATE SET
    default_model = EXCLUDED.default_model,
    response_style = EXCLUDED.response_style,
    updated_at = NOW();

-- SEED DEMO AI MEMORY ENTRIES
INSERT INTO public.umkm_ai_memory_entries (store_id, memory_key, memory_value, category)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Jam Operasional Toko', 'Senin - Sabtu (08:00 - 20:00 WIB), Minggu libur.', 'Operasional'),
    ('11111111-1111-1111-1111-111111111111', 'Kebijakan Pengembalian Produk', 'Garansi pengembalian 7 hari kerja jika barang cacat produksi.', 'Layanan Pelanggan'),
    ('11111111-1111-1111-1111-111111111111', 'Metode Pembayaran Utama', 'QRIS, Solana SOL/USDC, Bank Transfer BCA/Mandiri.', 'Keuangan')
ON CONFLICT DO NOTHING;

-- Enable Supabase Realtime Publications for AI tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_ai_preferences;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_memory_entries;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publication alter skipped or table already added';
END $$;
