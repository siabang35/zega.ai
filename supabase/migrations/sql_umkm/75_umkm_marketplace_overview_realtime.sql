-- Migration 75: UMKM Marketplace Overview Real-time Infrastructure & Custom AI Request Engine
-- Description: Sets up umkm_marketplace_custom_requests table, overview telemetry procedures, and RLS policies.

CREATE TABLE IF NOT EXISTS public.umkm_marketplace_custom_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT 'demo-store',
  business_type TEXT NOT NULL,
  ai_name TEXT NOT NULL,
  requirements TEXT NOT NULL,
  target_model TEXT NOT NULL DEFAULT 'DeepSeek-V3',
  contact_whatsapp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_days INTEGER DEFAULT 3,
  config_metadata JSONB DEFAULT '{"priority": "high", "router_gateway": "9Router Mesh Engine"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive Column Check for Pre-existing Tables
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT 'demo-store';
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS ai_name TEXT;
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS target_model TEXT DEFAULT 'DeepSeek-V3';
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;
ALTER TABLE public.umkm_marketplace_custom_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Enable RLS
ALTER TABLE public.umkm_marketplace_custom_requests ENABLE ROW LEVEL SECURITY;

-- Allow Public & Authenticated Access for Demo / Production
DROP POLICY IF EXISTS "Allow all access to custom AI requests" ON public.umkm_marketplace_custom_requests;
CREATE POLICY "Allow all access to custom AI requests" ON public.umkm_marketplace_custom_requests FOR ALL USING (true);

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_marketplace_custom_requests;

-- 1. RPC: Submit Custom AI Request
CREATE OR REPLACE FUNCTION public.submit_umkm_marketplace_custom_ai_request(
  p_store_id TEXT DEFAULT 'demo-store',
  p_business_type TEXT DEFAULT 'General UMKM',
  p_ai_name TEXT DEFAULT 'Custom AI Assistant',
  p_requirements TEXT DEFAULT '',
  p_target_model TEXT DEFAULT 'DeepSeek-V3',
  p_contact_whatsapp TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id TEXT;
  v_result JSONB;
BEGIN
  INSERT INTO public.umkm_marketplace_custom_requests (
    store_id,
    business_type,
    ai_name,
    requirements,
    target_model,
    contact_whatsapp,
    status
  )
  VALUES (
    COALESCE(p_store_id, 'demo-store'),
    COALESCE(p_business_type, 'General UMKM'),
    COALESCE(p_ai_name, 'Custom AI Assistant'),
    COALESCE(p_requirements, 'Sistem AI otomatisasi khusus'),
    COALESCE(p_target_model, 'DeepSeek-V3'),
    COALESCE(p_contact_whatsapp, '081234567890'),
    'pending'
  )
  RETURNING id INTO v_new_id;

  v_result := jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'message', 'Permintaan Custom AI berhasil disimpan di Supabase Database!',
    'estimated_days', 3
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. RPC: Get Marketplace Overview Telemetry
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_overview_telemetry(
  p_store_id TEXT DEFAULT 'demo-store'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installed_count INTEGER;
  v_total_agents INTEGER;
  v_custom_requests_count INTEGER;
  v_result JSONB;
BEGIN
  SELECT COUNT(*) INTO v_installed_count FROM public.umkm_marketplace_agents WHERE is_installed = TRUE;
  SELECT COUNT(*) INTO v_total_agents FROM public.umkm_marketplace_agents;
  SELECT COUNT(*) INTO v_custom_requests_count FROM public.umkm_marketplace_custom_requests;

  v_result := jsonb_build_object(
    'success', true,
    'installed_agents_count', COALESCE(v_installed_count, 3),
    'total_agents_count', COALESCE(v_total_agents, 24),
    'custom_requests_count', COALESCE(v_custom_requests_count, 1),
    'active_mesh_connections', 14,
    'router_gateway', '9Router Multi-Mesh Engine'
  );

  RETURN v_result;
END;
$$;
