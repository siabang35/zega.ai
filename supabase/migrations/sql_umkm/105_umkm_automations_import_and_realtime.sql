-- ============================================================================
-- SQL MIGRATION 105: UMKM AUTOMATIONS WORKFLOW IMPORT & REALTIME TELEMETRY
-- Target: Supabase Production Engine (ZeroClaw & 9Router Layer 5 Integration)
-- ============================================================================

-- 1. Ensure Table Structure for umkm_automations
CREATE TABLE IF NOT EXISTS public.umkm_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(255) DEFAULT 'New Order (Online Store)',
    action_type VARCHAR(255) DEFAULT 'Auto Reply & Stock Sync',
    model_engine VARCHAR(255) DEFAULT '9Router-Auto-Cost-Optimizer',
    model_provider VARCHAR(255) DEFAULT '9router/auto',
    execution_gateway VARCHAR(255) DEFAULT 'ZeroClaw-Edge-Gateway',
    cdn_icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/9router.png',
    workflow_steps JSONB DEFAULT '["Trigger Event", "AI Processing", "Action Dispatch"]'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'running', 'paused', 'failed', 'completed')),
    success_rate INTEGER DEFAULT 100 CHECK (success_rate BETWEEN 0 AND 100),
    last_run VARCHAR(100) DEFAULT 'Just now',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-performance store queries
CREATE INDEX IF NOT EXISTS idx_umkm_automations_store ON public.umkm_automations(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_automations_status ON public.umkm_automations(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_automations ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Dashboard Operations
DROP POLICY IF EXISTS "Permissive select for umkm_automations" ON public.umkm_automations;
CREATE POLICY "Permissive select for umkm_automations" ON public.umkm_automations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permissive insert for umkm_automations" ON public.umkm_automations;
CREATE POLICY "Permissive insert for umkm_automations" ON public.umkm_automations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permissive update for umkm_automations" ON public.umkm_automations;
CREATE POLICY "Permissive update for umkm_automations" ON public.umkm_automations
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permissive delete for umkm_automations" ON public.umkm_automations;
CREATE POLICY "Permissive delete for umkm_automations" ON public.umkm_automations
    FOR DELETE USING (true);

-- Enable Supabase Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'umkm_automations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_automations;
    END IF;
END $$;

-- 2. Function to Import Automation Blueprint Atomically
CREATE OR REPLACE FUNCTION public.import_umkm_automation_blueprint(
    p_store_id UUID,
    p_title VARCHAR(255),
    p_description TEXT,
    p_trigger_event VARCHAR(255),
    p_workflow_steps JSONB DEFAULT '[]'::jsonb,
    p_model_engine VARCHAR(255) DEFAULT '9Router-Auto-Cost-Optimizer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_automation_id UUID;
    v_result JSONB;
BEGIN
    INSERT INTO public.umkm_automations (
        store_id, title, description, trigger_event, workflow_steps, model_engine, status, success_rate, last_run
    ) VALUES (
        p_store_id,
        p_title,
        COALESCE(p_description, 'Imported workflow blueprint'),
        COALESCE(p_trigger_event, 'New Event Trigger'),
        COALESCE(p_workflow_steps, '["Order Received", "AI Processing", "Action Executed"]'::jsonb),
        COALESCE(p_model_engine, '9Router-Auto-Cost-Optimizer'),
        'active',
        100,
        'Just imported'
    )
    RETURNING id INTO v_automation_id;

    -- Also record timeline event
    INSERT INTO public.umkm_timeline_events (
        store_id, event_time, icon_symbol, title, event_text, badge_label, event_type, created_at
    ) VALUES (
        p_store_id,
        to_char(NOW(), 'HH24:MI'),
        'Workflow',
        'Automation Blueprint Imported',
        'Workflow "' || p_title || '" berhasil diimpor & diaktifkan',
        'System Automation',
        'system',
        NOW()
    );

    SELECT to_jsonb(a.*) INTO v_result FROM public.umkm_automations a WHERE a.id = v_automation_id;
    RETURN v_result;
END;
$$;

-- 3. Seed Default Enterprise Automations
DO $$
DECLARE
    v_store_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.umkm_automations WHERE store_id = v_store_id) THEN
        INSERT INTO public.umkm_automations (
            id, store_id, title, description, trigger_event, action_type, model_engine, status, success_rate, last_run
        ) VALUES
        (
            'a1111111-0001-4444-9999-111111111111', v_store_id,
            'WA Auto-Invoice & Stock Sync', 'Otomatis buat invoice & kurangi stok saat order online baru masuk',
            'New Order (Online Store)', 'Auto Reply & Stock Sync', '9Router-Auto-Cost-Optimizer', 'active', 99, '2m ago'
        ),
        (
            'a1111111-0002-4444-9999-111111111111', v_store_id,
            'WhatsApp Lead Qualifier RAG', 'Klasifikasi prospek masuk via WA & tag CRM otomatis',
            'New Message (WhatsApp)', 'AI Intent Classification', 'ZeroClaw-Edge-Gateway-Llama3', 'active', 98, '8m ago'
        ),
        (
            'a1111111-0003-4444-9999-111111111111', v_store_id,
            'Multi-channel Restock Alert', 'Kirim notifikasi supplier & e-mail restock saat unit < 5',
            'Low Stock Alert (< 5 units)', 'Supplier Reorder Dispatch', 'ZEGA-Swarm-Llama-3.3-70B', 'active', 100, '15m ago'
        );
    END IF;
END $$;
