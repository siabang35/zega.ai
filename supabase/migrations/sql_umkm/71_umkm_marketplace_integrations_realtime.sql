-- ============================================================================
-- SQL MIGRATION: 71_umkm_marketplace_integrations_realtime.sql
-- Description: Realtime Telemetry, API Credential Vault & Integration Hub 
--              for Marketplace Integrasi Sub-View
-- ============================================================================

-- 0. Drop Legacy Objects Safely
DROP TABLE IF EXISTS public.umkm_marketplace_integrations CASCADE;
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_integrations CASCADE;
DROP FUNCTION IF EXISTS public.update_umkm_marketplace_integration_status CASCADE;

-- 1. Create Table: umkm_marketplace_integrations
CREATE TABLE public.umkm_marketplace_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Payment Gateway & Web3', -- 'Payment Gateway & Web3', 'AI Models & LLM Mesh', 'E-Commerce & Logistik'
    provider_type TEXT NOT NULL DEFAULT 'payment', -- 'payment', 'ai_model', 'logistics', 'messaging'
    connection_status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'pending'
    badge_label TEXT,
    icon_key TEXT NOT NULL,
    api_endpoint TEXT,
    webhook_url TEXT,
    config_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by key & category
CREATE INDEX idx_umkm_marketplace_integrations_key ON public.umkm_marketplace_integrations(integration_key);
CREATE INDEX idx_umkm_marketplace_integrations_cat ON public.umkm_marketplace_integrations(category_name);

-- 2. Stored Procedure: Fetch Integrations
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_integrations()
RETURNS TABLE (
    id UUID,
    integration_key TEXT,
    title TEXT,
    description TEXT,
    category_name TEXT,
    provider_type TEXT,
    connection_status TEXT,
    badge_label TEXT,
    icon_key TEXT,
    api_endpoint TEXT,
    webhook_url TEXT,
    config_metadata JSONB,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.integration_key,
        i.title,
        i.description,
        i.category_name,
        i.provider_type,
        i.connection_status,
        i.badge_label,
        i.icon_key,
        i.api_endpoint,
        i.webhook_url,
        i.config_metadata,
        i.last_synced_at,
        i.created_at,
        i.updated_at
    FROM public.umkm_marketplace_integrations i
    ORDER BY i.created_at ASC;
END;
$$;

-- 3. Stored Procedure: Update Integration Status & Config Credentials
CREATE OR REPLACE FUNCTION public.update_umkm_marketplace_integration_status(
    p_integration_key TEXT,
    p_status TEXT,
    p_config_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.umkm_marketplace_integrations
    SET 
        connection_status = p_status,
        config_metadata = COALESCE(p_config_metadata, config_metadata),
        last_synced_at = NOW(),
        updated_at = NOW()
    WHERE integration_key = p_integration_key;

    RETURN FOUND;
END;
$$;

-- 3b. Stored Procedure: Add Custom Integration / API Tool
CREATE OR REPLACE FUNCTION public.add_umkm_marketplace_integration(
    p_integration_key TEXT,
    p_title TEXT,
    p_description TEXT,
    p_category_name TEXT DEFAULT 'Payment Gateway & Web3',
    p_provider_type TEXT DEFAULT 'custom',
    p_icon_key TEXT DEFAULT 'receipt',
    p_api_endpoint TEXT DEFAULT NULL,
    p_webhook_url TEXT DEFAULT NULL,
    p_config_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    INSERT INTO public.umkm_marketplace_integrations (
        integration_key,
        title,
        description,
        category_name,
        provider_type,
        connection_status,
        badge_label,
        icon_key,
        api_endpoint,
        webhook_url,
        config_metadata
    ) VALUES (
        p_integration_key,
        p_title,
        p_description,
        p_category_name,
        p_provider_type,
        'connected',
        'Custom Tool',
        p_icon_key,
        p_api_endpoint,
        p_webhook_url,
        p_config_metadata
    )
    ON CONFLICT (integration_key) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category_name = EXCLUDED.category_name,
        connection_status = 'connected',
        api_endpoint = EXCLUDED.api_endpoint,
        webhook_url = EXCLUDED.webhook_url,
        config_metadata = EXCLUDED.config_metadata,
        updated_at = NOW()
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- 4. Enable Row Level Security (RLS) & Grant Access
ALTER TABLE public.umkm_marketplace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for marketplace integrations"
    ON public.umkm_marketplace_integrations FOR SELECT
    USING (true);

CREATE POLICY "Allow public update access for marketplace integrations"
    ON public.umkm_marketplace_integrations FOR UPDATE
    USING (true);

CREATE POLICY "Allow public insert access for marketplace integrations"
    ON public.umkm_marketplace_integrations FOR INSERT
    WITH CHECK (true);

GRANT ALL ON public.umkm_marketplace_integrations TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_umkm_marketplace_integrations() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_umkm_marketplace_integration_status(TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_umkm_marketplace_integration(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;

-- 5. Add to Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_marketplace_integrations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_integrations;
    END IF;
END $$;

-- 6. Seed Production Data for Integrations Sub-View
INSERT INTO public.umkm_marketplace_integrations 
(integration_key, title, description, category_name, provider_type, connection_status, badge_label, icon_key, api_endpoint, webhook_url, config_metadata)
VALUES
(
    'x402_network',
    'x402 Network (M2H)',
    'Pembayaran mesin-ke-mesin menggunakan stablecoin via x402 protocol & Solana high-frequency micro-settlement.',
    'Payment Gateway & Web3',
    'payment',
    'connected',
    'Baru • M2H Protocol',
    'x402',
    'https://api.x402.zega.ai/v1/settle',
    'https://zega-ai.onrender.com/webhooks/x402',
    '{"network": "solana-mainnet", "settlement_currency": "USDC", "auto_withdraw": true}'::jsonb
),
(
    'qris_dynamic',
    'QRIS Dynamic Gateway',
    'Terima pembayaran QRIS otomatis dari seluruh e-wallet & m-banking Indonesia dengan konfirmasi instan 1 detik.',
    'Payment Gateway & Web3',
    'payment',
    'connected',
    'Instant Settlement',
    'qris',
    'https://api.qris.zega.ai/v2/generate',
    'https://zega-ai.onrender.com/webhooks/qris',
    '{"merchant_id": "MDR-889410", "fee_covered_by": "merchant", "auto_verify": true}'::jsonb
),
(
    'stripe_connect',
    'Stripe Connect',
    'Terima pembayaran kartu kredit & kartu debit internasional dengan enkripsi PCI-DSS Level 1 via Stripe.',
    'Payment Gateway & Web3',
    'payment',
    'disconnected',
    'Global Credit Card',
    'stripe',
    'https://api.stripe.com/v1/charges',
    'https://zega-ai.onrender.com/webhooks/stripe',
    '{"live_mode": false}'::jsonb
),
(
    'midtrans_snap',
    'Midtrans Payments',
    'Gateway pembayaran e-commerce terkapabel di Indonesia mencakup Transfer Bank, Virtual Account, & Retail Outlet.',
    'Payment Gateway & Web3',
    'payment',
    'connected',
    'Indonesia Standard',
    'midtrans',
    'https://app.midtrans.com/snap/v1/transactions',
    'https://zega-ai.onrender.com/webhooks/midtrans',
    '{"merchant_id": "G8401928", "environment": "production"}'::jsonb
),
(
    'gopay_wallet',
    'GoPay e-Wallet',
    'Integrasi pembayaran GoPay Snap API langsung tanpa perantara dengan notifikasi real-time.',
    'Payment Gateway & Web3',
    'payment',
    'disconnected',
    'Snap API Ready',
    'gopay',
    'https://api.gopay.co.id/v1/pay',
    'https://zega-ai.onrender.com/webhooks/gopay',
    '{}'::jsonb
),
(
    'ovo_wallet',
    'OVO Payment',
    'Terima pembayaran saldo OVO dengan notifikasi push notification instan ke aplikasi pelanggan.',
    'Payment Gateway & Web3',
    'payment',
    'disconnected',
    'Push Pay',
    'ovo',
    'https://api.ovo.id/v1/charge',
    'https://zega-ai.onrender.com/webhooks/ovo',
    '{}'::jsonb
),
(
    'dana_wallet',
    'DANA Wallet',
    'Terima pembayaran saldo DANA Indonesia dengan settlement kas harian otomatis.',
    'Payment Gateway & Web3',
    'payment',
    'disconnected',
    'Auto Direct Debit',
    'dana',
    'https://api.dana.id/v1/charge',
    'https://zega-ai.onrender.com/webhooks/dana',
    '{}'::jsonb
),
(
    'deepseek_v3_mesh',
    'DeepSeek-V3 LLM Mesh',
    'Model AI Bahasa DeepSeek-V3 tercepat berbiaya rendah dihubungkan via 9Router High-Availability Mesh.',
    'AI Models & LLM Mesh',
    'ai_model',
    'connected',
    'Active Primary AI',
    'deepseek',
    'https://api.9router.zega.ai/v1/chat/completions',
    'https://zega-ai.onrender.com/webhooks/9router',
    '{"model": "deepseek-chat-v3", "context_window": 64000, "temperature": 0.3}'::jsonb
),
(
    'claude_35_sonnet',
    'Claude 3.5 Sonnet',
    'Engine AI Copywriting & Analisis Dokumen Finansial tingkat lanjut dari Anthropic.',
    'AI Models & LLM Mesh',
    'ai_model',
    'connected',
    'High Precision Copywriter',
    'claude',
    'https://api.anthropic.com/v1/messages',
    'https://zega-ai.onrender.com/webhooks/anthropic',
    '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 4096}'::jsonb
),
(
    'logistics_expedition_hub',
    'J&T / JNE / SiCepat Logistics Hub',
    'Integrasi ekspedisi kurir terpadu untuk cetak resi otomatis, pickup barang, & tracking lokasi real-time.',
    'E-Commerce & Logistik',
    'logistics',
    'connected',
    'Auto Waybill & Pickup',
    'logistics',
    'https://api.logistics.zega.ai/v1/waybill',
    'https://zega-ai.onrender.com/webhooks/logistics',
    '{"couriers": ["jnt", "jne", "sicepat", "anteraja"], "auto_pickup": true}'::jsonb
);
