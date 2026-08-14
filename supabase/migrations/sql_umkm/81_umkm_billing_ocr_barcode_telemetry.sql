-- ============================================================================
-- ZEGA AI — UMKM BILLING MIGRATION 81
-- Module: Physical Card OCR & Barcode Scanning Telemetry Integration
-- Path: /supabase/migrations/sql_umkm/81_umkm_billing_ocr_barcode_telemetry.sql
-- Description: Adds qr_barcode_url, ocr_scanned_data (JSONB), and verification_type
--              columns and updates add_umkm_payment_method RPC procedure.
-- ============================================================================

-- 1. Alter Table to add OCR & Barcode Scanning Telemetry Columns
ALTER TABLE public.umkm_billing_payment_methods 
ADD COLUMN IF NOT EXISTS qr_barcode_url TEXT,
ADD COLUMN IF NOT EXISTS ocr_scanned_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'manual_upload';

-- 2. Update RPC: Add New UMKM Payment Method with OCR & Barcode Scan Support
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
  p_qr_barcode_url TEXT DEFAULT NULL,
  p_ocr_scanned_data JSONB DEFAULT '{}'::jsonb,
  p_verification_type TEXT DEFAULT 'manual_upload',
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
  -- If make_primary is true, unset previous primary methods for store
  IF p_make_primary THEN
    UPDATE public.umkm_billing_payment_methods
    SET is_primary = false, updated_at = NOW()
    WHERE store_id = p_store_id;
  END IF;

  -- Insert new payment method with OCR and Barcode scan metadata
  INSERT INTO public.umkm_billing_payment_methods (
    store_id, method_name, method_type, card_last4, exp_date, 
    icon_key, card_photo_url, card_holder_name, account_number, bank_name,
    qr_barcode_url, ocr_scanned_data, verification_type, 
    is_primary, status
  ) VALUES (
    p_store_id, p_method_name, p_method_type, p_card_last4, p_exp_date, 
    p_icon_key, p_card_photo_url, p_card_holder_name, p_account_number, p_bank_name,
    p_qr_barcode_url, COALESCE(p_ocr_scanned_data, '{}'::jsonb), p_verification_type,
    p_make_primary, 'Aktif'
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Metode pembayaran dengan telemetri OCR / Barcode berhasil disimpan',
    'payment_method_id', v_new_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;
