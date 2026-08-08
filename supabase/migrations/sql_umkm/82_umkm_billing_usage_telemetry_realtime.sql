-- Migration 82: UMKM Billing Usage Telemetry & Interactive BarChart RPC Functions
-- Description: Sets up umkm_billing_usage_breakdown and umkm_billing_usage_trends tables and RPC functions.

-- 1. Table: Feature Usage Breakdown
CREATE TABLE IF NOT EXISTS public.umkm_billing_usage_breakdown (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'AI Agent',
  usage_value INTEGER NOT NULL DEFAULT 0,
  unit_label TEXT NOT NULL DEFAULT 'Credits',
  cost_credits INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive columns
ALTER TABLE public.umkm_billing_usage_breakdown ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.umkm_billing_usage_breakdown ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'AI Agent';
ALTER TABLE public.umkm_billing_usage_breakdown ADD COLUMN IF NOT EXISTS cost_credits INTEGER DEFAULT 1;

-- 2. Table: Usage Trends (Daily / Weekly Chart Points)
CREATE TABLE IF NOT EXISTS public.umkm_billing_usage_trends (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  date_label TEXT NOT NULL,
  ai_credits_used INTEGER DEFAULT 0,
  automations_run INTEGER DEFAULT 0,
  storage_used_gb NUMERIC(6,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.umkm_billing_usage_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_billing_usage_trends ENABLE ROW LEVEL SECURITY;

-- Allow policies
DROP POLICY IF EXISTS "Allow all usage breakdown" ON public.umkm_billing_usage_breakdown;
CREATE POLICY "Allow all usage breakdown" ON public.umkm_billing_usage_breakdown FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all usage trends" ON public.umkm_billing_usage_trends;
CREATE POLICY "Allow all usage trends" ON public.umkm_billing_usage_trends FOR ALL USING (true);

-- Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_usage_breakdown') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_usage_breakdown;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_usage_trends') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_usage_trends;
  END IF;
END $$;

-- SEED SELECTION FOR USAGE BREAKDOWN
INSERT INTO public.umkm_billing_usage_breakdown (store_id, feature_name, category, usage_value, unit_label, cost_credits, last_used_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ZEGA Copilot AI Assistant', 'AI Workforce', 1420, 'Prompts', 1420, NOW() - INTERVAL '15 minutes'),
  ('11111111-1111-1111-1111-111111111111', 'Automated Customer Follow-up', 'Automations', 850, 'Executions', 850, NOW() - INTERVAL '1 hour'),
  ('11111111-1111-1111-1111-111111111111', 'AI Sales Lead Scoring Engine', 'Sales Hub', 520, 'Evaluations', 520, NOW() - INTERVAL '3 hours'),
  ('11111111-1111-1111-1111-111111111111', 'OCR & Document Scanner Engine', 'Vision AI', 280, 'Scans', 280, NOW() - INTERVAL '5 hours'),
  ('11111111-1111-1111-1111-111111111111', 'Cloud Storage & CDN Asset Sync', 'Storage', 170, 'Uploads', 170, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- SEED SELECTION FOR USAGE TRENDS
INSERT INTO public.umkm_billing_usage_trends (store_id, date_label, ai_credits_used, automations_run, storage_used_gb)
VALUES
  ('11111111-1111-1111-1111-111111111111', '01 Aug', 210, 14, 8.2),
  ('11111111-1111-1111-1111-111111111111', '02 Aug', 340, 22, 9.1),
  ('11111111-1111-1111-1111-111111111111', '03 Aug', 480, 31, 9.8),
  ('11111111-1111-1111-1111-111111111111', '04 Aug', 290, 18, 10.4),
  ('11111111-1111-1111-1111-111111111111', '05 Aug', 610, 45, 11.2),
  ('11111111-1111-1111-1111-111111111111', '06 Aug', 750, 52, 11.9),
  ('11111111-1111-1111-1111-111111111111', '07 Aug', 560, 38, 12.4)
ON CONFLICT DO NOTHING;

-- RPC 1: Get Comprehensive Usage Telemetry & Chart Data
CREATE OR REPLACE FUNCTION public.get_umkm_billing_usage_telemetry(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metrics JSONB;
  v_breakdown JSONB;
  v_trends JSONB;
  v_result JSONB;
BEGIN
  -- 1. Metrics from umkm_billing_usage_metrics
  SELECT jsonb_agg(jsonb_build_object(
    'metric_key', metric_key,
    'metric_label', metric_label,
    'current_value_label', current_value_label,
    'limit_value_label', limit_value_label,
    'percentage', percentage
  )) INTO v_metrics
  FROM public.umkm_billing_usage_metrics
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  -- 2. Breakdown from umkm_billing_usage_breakdown
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'feature_name', feature_name,
    'category', category,
    'usage_value', usage_value,
    'unit_label', unit_label,
    'cost_credits', cost_credits,
    'last_used_at', last_used_at
  )) INTO v_breakdown
  FROM public.umkm_billing_usage_breakdown
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
  ORDER BY last_used_at DESC;

  -- 3. Trends from umkm_billing_usage_trends
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'date_label', date_label,
    'ai_credits_used', ai_credits_used,
    'automations_run', automations_run,
    'storage_used_gb', storage_used_gb
  )) INTO v_trends
  FROM public.umkm_billing_usage_trends
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
  ORDER BY created_at ASC;

  v_result := jsonb_build_object(
    'success', true,
    'metrics', COALESCE(v_metrics, '[]'::jsonb),
    'breakdown', COALESCE(v_breakdown, '[]'::jsonb),
    'trends', COALESCE(v_trends, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- RPC 2: Top-Up / Add Quota
CREATE OR REPLACE FUNCTION public.topup_umkm_usage_quota(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111',
  p_quota_type TEXT DEFAULT 'credits',
  p_add_amount INTEGER DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_quota_type = 'credits' THEN
    UPDATE public.umkm_billing_subscriptions
    SET credits_limit = credits_limit + p_add_amount,
        credits_remaining = credits_remaining + p_add_amount,
        updated_at = NOW()
    WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

    UPDATE public.umkm_billing_usage_metrics
    SET limit_value_label = (CAST(REPLACE(limit_value_label, '.', '') AS INTEGER) + p_add_amount)::text,
        updated_at = NOW()
    WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111') AND metric_key = 'credits';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Kuota berhasil ditambahkan sejumlah ' || p_add_amount);
END;
$$;
