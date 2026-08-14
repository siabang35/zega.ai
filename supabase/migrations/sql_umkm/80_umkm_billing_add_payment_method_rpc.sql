-- ============================================================================
-- ZEGA AI — UMKM BILLING MIGRATION 80
-- Module: Add Payment Method RPC with Card Photo, Defensive Schema & Extended Telemetry
-- Path: /supabase/migrations/sql_umkm/80_umkm_billing_add_payment_method_rpc.sql
-- ============================================================================

-- 1. Ensure Table Exists and Defensively Add Missing Columns (Prevents "column updated_at does not exist" errors)
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

-- Defensively alter existing table if columns are missing
ALTER TABLE public.umkm_billing_payment_methods 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS card_photo_url TEXT,
ADD COLUMN IF NOT EXISTS card_holder_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- 2. RPC: Set Primary Payment Method (Defensive Update)
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
  -- Fallback if updated_at update fails due to schema lock
  BEGIN
    UPDATE public.umkm_billing_payment_methods SET is_primary = false WHERE store_id = p_store_id;
    UPDATE public.umkm_billing_payment_methods SET is_primary = true WHERE id = p_payment_method_id AND store_id = p_store_id;
    RETURN jsonb_build_object('success', true, 'message', 'Metode utama berhasil diperbarui (fallback)');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
  END;
END;
$$;

-- 3. RPC: Add New UMKM Payment Method with Physical Card Photo
CREATE OR REPLACE FUNCTION public.add_umkm_payment_method(
  p_method_name TEXT,
  p_method_type TEXT,
  p_card_last4 TEXT DEFAULT NULL,
  p_exp_date TEXT DEFAULT NULL,
  p_icon_key TEXT DEFAULT 'card',
  p_card_photo_url TEXT DEFAULT NULL,
  p_card_holder_name TEXT DEFAULT NULL,
  p_account_number TEXT DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL,
  p_make_primary BOOLEAN DEFAULT false,
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  -- If make_primary is true, unset previous primary methods
  IF p_make_primary THEN
    UPDATE public.umkm_billing_payment_methods
    SET is_primary = false, updated_at = NOW()
    WHERE store_id = p_store_id;
  END IF;

  -- Insert new payment method
  INSERT INTO public.umkm_billing_payment_methods (
    store_id, method_name, method_type, card_last4, exp_date, 
    icon_key, card_photo_url, card_holder_name, account_number, bank_name, 
    is_primary, status
  ) VALUES (
    p_store_id, p_method_name, p_method_type, p_card_last4, p_exp_date, 
    p_icon_key, p_card_photo_url, p_card_holder_name, p_account_number, p_bank_name, 
    p_make_primary, 'Aktif'
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Metode pembayaran baru berhasil ditambahkan ke database',
    'payment_method_id', v_new_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;
