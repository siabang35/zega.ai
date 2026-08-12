-- Migration: 20260813000000_purge_ai_marketing_mock_data.sql
-- Description: Zero-Trust Database Purge & Hardening for ZEGA AI Marketing Hub
-- Author: ZEGA Core Engineering & Security Team

BEGIN;

-- 1. PURGE MOCK/SYNTHETIC DEMO DATA FROM ALL MARKETING TABLES WITH EXPLICIT TYPE CASTING
DELETE FROM public.umkm_marketing_metrics WHERE store_id::text = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_channels WHERE store_id::text = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_campaigns WHERE store_id::text = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_content WHERE store_id::text = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_content_items WHERE store_id::text = '11111111-1111-1111-1111-111111111111' OR id::text LIKE 'item-%' OR title LIKE '%[MOCK]%' OR title LIKE '%Contoh%';
DELETE FROM public.umkm_marketing_activities WHERE store_id::text = '11111111-1111-1111-1111-111111111111' OR id::text LIKE 'a1111111-%' OR title LIKE '%[MOCK]%' OR title LIKE '%Contoh%';
DELETE FROM public.umkm_marketing_swarms WHERE store_id::text = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.umkm_marketing_insights WHERE store_id::text = '11111111-1111-1111-1111-111111111111' OR id::text LIKE 'ins-%';
DELETE FROM public.umkm_marketing_reports WHERE store_id::text = '11111111-1111-1111-1111-111111111111' OR id::text LIKE 'rep-%';
DELETE FROM public.umkm_marketing_channel_performance WHERE store_id::text = '11111111-1111-1111-1111-111111111111';

-- 2. CREATE STORED PROCEDURE TO PURGE AND RESET MARKETING DATA
CREATE OR REPLACE FUNCTION public.fn_purge_and_reset_umkm_marketing_mock_data(
    p_store_id UUID DEFAULT '11111111-1111-1111-1111-111111111111'::UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rows_deleted INTEGER := 0;
BEGIN
    DELETE FROM public.umkm_marketing_metrics WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_channels WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_campaigns WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_content WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_content_items WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_activities WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_swarms WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_insights WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_reports WHERE store_id = p_store_id;
    DELETE FROM public.umkm_marketing_channel_performance WHERE store_id = p_store_id;

    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

    -- Log system audit trail
    INSERT INTO public.umkm_system_audit_logs (
        store_id, event_action, status, details, created_at
    ) VALUES (
        p_store_id,
        'PURGE_AI_MARKETING_MOCK_DATA',
        'Success',
        jsonb_build_object('purged_rows', v_rows_deleted, 'timestamp', NOW()),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Purged all mock/synthetic data from AI Marketing Hub tables.',
        'store_id', p_store_id,
        'timestamp', NOW()
    );
END;
$$;

-- 3. ENSURE RLS SECURITY POLICIES ON ALL MARKETING TABLES
ALTER TABLE public.umkm_marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_marketing_channel_performance ENABLE ROW LEVEL SECURITY;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.fn_purge_and_reset_umkm_marketing_mock_data(UUID) TO authenticated, service_role;

COMMIT;
