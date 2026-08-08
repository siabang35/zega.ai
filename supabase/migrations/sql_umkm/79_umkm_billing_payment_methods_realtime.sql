-- ============================================================================
-- ZEGA AI — UMKM BILLING MIGRATION 79
-- Module: Payment Methods Realtime Management Procedures
-- Path: /supabase/migrations/sql_umkm/79_umkm_billing_payment_methods_realtime.sql
-- Description: RPC procedures for setting primary payment method, deleting methods,
--              adding new payment channels, and idempotent Realtime publications.
-- ============================================================================

-- 1. Ensure Table Structure
CREATE TABLE IF NOT EXISTS public.umkm_billing_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  method_name TEXT NOT NULL,
  method_type TEXT NOT NULL,
  card_last4 TEXT,
  exp_date TEXT,
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Aktif',
  icon_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS Enabled
ALTER TABLE public.umkm_billing_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read payment_methods" ON public.umkm_billing_payment_methods;
CREATE POLICY "Allow authenticated read payment_methods" 
ON public.umkm_billing_payment_methods 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated write payment_methods" ON public.umkm_billing_payment_methods;
CREATE POLICY "Allow authenticated write payment_methods" 
ON public.umkm_billing_payment_methods 
FOR ALL 
USING (true);

-- 2. RPC: Set Primary Payment Method
CREATE OR REPLACE FUNCTION public.set_primary_umkm_payment_method(
  p_payment_method_id UUID,
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Unset existing primary methods for store
  UPDATE public.umkm_billing_payment_methods
  SET is_primary = false, updated_at = NOW()
  WHERE store_id = p_store_id;

  -- Set target payment method as primary
  UPDATE public.umkm_billing_payment_methods
  SET is_primary = true, updated_at = NOW()
  WHERE id = p_payment_method_id AND store_id = p_store_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Metode pembayaran utama berhasil diperbarui',
    'primary_id', p_payment_method_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- 3. RPC: Delete / Deactivate Payment Method
CREATE OR REPLACE FUNCTION public.delete_umkm_payment_method(
  p_payment_method_id UUID,
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_primary BOOLEAN;
BEGIN
  SELECT is_primary INTO v_is_primary
  FROM public.umkm_billing_payment_methods
  WHERE id = p_payment_method_id AND store_id = p_store_id;

  IF v_is_primary THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Metode utama tidak dapat dihapus. Harap atur metode lain sebagai utama terlebih dahulu.'
    );
  END IF;

  DELETE FROM public.umkm_billing_payment_methods
  WHERE id = p_payment_method_id AND store_id = p_store_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Metode pembayaran berhasil dihapus'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- 4. Idempotent Supabase Realtime Publication Management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'umkm_billing_payment_methods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_payment_methods;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
