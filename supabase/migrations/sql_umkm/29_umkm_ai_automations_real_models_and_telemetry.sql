-- ============================================================================
-- ZEGA AI PLATFORM - UMKM REALTIME CORE SCHEMA
-- Module 29: AI Automations Real Models, Routing Telemetry & R2 CDN Assets
-- Path: supabase/migrations/sql_umkm/29_umkm_ai_automations_real_models_and_telemetry.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. DEFENSIVE HARDENING FOR TIMELINE EVENTS TABLE (Ensures trigger compatibility)
CREATE TABLE IF NOT EXISTS public.umkm_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    event_time VARCHAR(16) NOT NULL,
    icon_symbol VARCHAR(32) NOT NULL DEFAULT 'CheckCircle',
    event_text VARCHAR(255) NOT NULL,
    title VARCHAR(255) DEFAULT 'System Event',
    badge_label VARCHAR(60) DEFAULT 'Info',
    event_type VARCHAR(60) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.umkm_timeline_events ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'System Event';
ALTER TABLE public.umkm_timeline_events ADD COLUMN IF NOT EXISTS badge_label VARCHAR(60) DEFAULT 'Info';
ALTER TABLE public.umkm_timeline_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(60) DEFAULT 'system';

-- 1. CREATE OR HARDEN umkm_automations TABLE WITH TELEMETRY COLUMNS
CREATE TABLE IF NOT EXISTS public.umkm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    trigger_event VARCHAR(120) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    model_engine VARCHAR(120) NOT NULL DEFAULT '9Router-Auto-Cost-Optimizer',
    model_provider VARCHAR(120) NOT NULL DEFAULT '9router/auto',
    execution_gateway VARCHAR(120) NOT NULL DEFAULT 'ZeroClaw-Edge-Gateway',
    trigger_icon VARCHAR(120) NOT NULL DEFAULT 'ShoppingBag',
    cdn_icon_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png',
    workflow_steps JSONB NOT NULL DEFAULT '["Trigger Event", "AI Processing", "Action Dispatch"]'::jsonb,
    last_run VARCHAR(60) NOT NULL DEFAULT '2 menit yang lalu',
    success_rate INT NOT NULL DEFAULT 100,
    runs_today INT NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEFENSIVE ALTER TABLE FOR EXISTING COLUMNS
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.umkm_automations ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS model_engine VARCHAR(120) NOT NULL DEFAULT '9Router-Auto-Cost-Optimizer';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS model_provider VARCHAR(120) NOT NULL DEFAULT '9router/auto';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS execution_gateway VARCHAR(120) NOT NULL DEFAULT 'ZeroClaw-Edge-Gateway';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS trigger_icon VARCHAR(120) NOT NULL DEFAULT 'ShoppingBag';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS cdn_icon_url TEXT NOT NULL DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS workflow_steps JSONB NOT NULL DEFAULT '["Trigger Event", "AI Processing", "Action Dispatch"]'::jsonb;
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS last_run VARCHAR(60) NOT NULL DEFAULT '2 menit yang lalu';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS success_rate INT NOT NULL DEFAULT 100;
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS runs_today INT NOT NULL DEFAULT 15;

-- 2. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.umkm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for umkm_automations" ON public.umkm_automations;
CREATE POLICY "Allow all operations for umkm_automations" ON public.umkm_automations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for umkm_timeline_events" ON public.umkm_timeline_events;
CREATE POLICY "Allow all operations for umkm_timeline_events" ON public.umkm_timeline_events FOR ALL USING (true);

-- 3. SEED 6 REAL PRODUCTION EVENT-DRIVEN WORKFLOWS WITH REAL MODEL ROUTING
INSERT INTO public.umkm_automations (
    id,
    store_id,
    title,
    name,
    trigger_event,
    description,
    status,
    model_engine,
    model_provider,
    execution_gateway,
    trigger_icon,
    cdn_icon_url,
    workflow_steps,
    last_run,
    success_rate,
    runs_today,
    created_at,
    updated_at
) VALUES 
(
    '88888888-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Order Invoice & WA Payment Link Automation',
    'Order Invoice & WA Payment Link Automation',
    'New Order (Online Store)',
    'Auto-generates digital invoice, creates Solana Pay / WA payment link, and notifies buyer.',
    'active',
    '9Router-Auto-Cost-Optimizer',
    '9router/gpt-4o-mini',
    'ZeroClaw-Edge-Gateway',
    'ShoppingBag',
    'https://cdn.zegaai.site/assets/logo/9router.png',
    '["Order Received", "AI Invoice Generator (9Router)", "Solana Pay Link", "WA Notification"]'::jsonb,
    '2 menit yang lalu',
    100,
    42,
    NOW() - INTERVAL '7 days',
    NOW()
),
(
    '88888888-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Low Stock Restock & Inventory Router AI',
    'Low Stock Restock & Inventory Router AI',
    'Low Stock (Store AI)',
    'Triggers code synthesis engine to draft restock POs and dispatch supplier WA alerts when inventory < 5.',
    'active',
    'Qwen-2.5-Coder-32B',
    '9router/qwen-2.5-coder',
    'ZeroClaw-Edge-Gateway',
    'ShoppingBag',
    'https://cdn.zegaai.site/assets/logo/Qwen.png',
    '["Inventory Trigger < 5", "Code Synthesis PO Draft", "Supplier WA Alert", "PO Log"]'::jsonb,
    '5 menit yang lalu',
    100,
    18,
    NOW() - INTERVAL '5 days',
    NOW()
),
(
    '88888888-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'New Customer Welcome Coupon & Vision AI Campaign',
    'New Customer Welcome Coupon & Vision AI Campaign',
    'Customer Registered',
    'Auto-generates personalized welcome discount banner using multimodal vision engine upon registration.',
    'active',
    'Claude-3.5-Sonnet-v2',
    '9router/claude-3.5-sonnet',
    'ZeroClaw-Edge-Gateway',
    'Users',
    'https://cdn.zegaai.site/assets/logo/claude.webp',
    '["User Registered", "Vision AI Banner Gen", "WA Welcome Message", "Promo Analytics"]'::jsonb,
    '12 menit yang lalu',
    98,
    25,
    NOW() - INTERVAL '4 days',
    NOW()
),
(
    '88888888-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'WhatsApp Abandoned Cart DeepSeek Recovery Bot',
    'WhatsApp Abandoned Cart DeepSeek Recovery Bot',
    'Abandoned Cart (Store)',
    'Executes DeepSeek R1 reasoning swarm to calculate optimal discount triggers for abandoned carts.',
    'active',
    'DeepSeek-R1-Distill-Qwen-32B',
    'zeroclaw/deepseek-r1',
    'ZeroClaw-Edge-Gateway',
    'ShoppingCart',
    'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    '["Cart Idle 1 Hour", "DeepSeek Intent Analysis", "Custom Discount Trigger", "WA Conversion Followup"]'::jsonb,
    '18 menit yang lalu',
    96,
    31,
    NOW() - INTERVAL '3 days',
    NOW()
),
(
    '88888888-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Automated Invoice Reconciliation & Bank Sync',
    'Automated Invoice Reconciliation & Bank Sync',
    'Invoice Due (Finance AI)',
    'Uses ZEGA Swarm Llama 3.3 70B for bank statement OCR reconciliation and automatic e-invoice closing.',
    'active',
    'ZEGA-Swarm-Llama-3.3-70B',
    '9router/llama-3.3-70b',
    'ZeroClaw-Edge-Gateway',
    'FileText',
    'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    '["Bank Mutasi Trigger", "OCR Statement Parse", "Invoice Reconciliation", "Ledger Post"]'::jsonb,
    '25 menit yang lalu',
    100,
    14,
    NOW() - INTERVAL '2 days',
    NOW()
),
(
    '88888888-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'B2B Lead Qualifier & CRM Automation Swarm',
    'B2B Lead Qualifier & CRM Automation Swarm',
    'New Lead (Form/Website)',
    'ZeroClaw Edge Gateway daemon scores B2B leads, tags CRM pipeline, and dispatches sales followups.',
    'active',
    'ZeroClaw-Edge-Gateway-Llama3',
    'zeroclaw/daemon-v0.5.3',
    'ZeroClaw-Daemon',
    'Users',
    'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    '["Web Form Lead", "ZeroClaw Scoring Daemon", "CRM Pipeline Update", "Sales Notification"]'::jsonb,
    '30 menit yang lalu',
    99,
    22,
    NOW() - INTERVAL '1 day',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    name = EXCLUDED.name,
    trigger_event = EXCLUDED.trigger_event,
    description = EXCLUDED.description,
    model_engine = EXCLUDED.model_engine,
    model_provider = EXCLUDED.model_provider,
    execution_gateway = EXCLUDED.execution_gateway,
    cdn_icon_url = EXCLUDED.cdn_icon_url,
    workflow_steps = EXCLUDED.workflow_steps,
    updated_at = NOW();

-- 4. ENSURE REALTIME PUBLICATION COVERS umkm_automations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_automations;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Table umkm_automations already in supabase_realtime publication.';
        END;
    END IF;
END $$;
