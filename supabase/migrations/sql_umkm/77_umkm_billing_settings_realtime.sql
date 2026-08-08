-- Migration 77: UMKM Billing Settings Real-Time Infrastructure & RPC Functions
-- Description: Sets up umkm_billing_settings table, RLS policies, realtime publication, and RPC procedures.

CREATE TABLE IF NOT EXISTS public.umkm_billing_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT UNIQUE NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  business_name TEXT NOT NULL DEFAULT 'Toko CikCik Berluk',
  tax_id TEXT DEFAULT '09.384.920.4-012.000',
  billing_email TEXT NOT NULL DEFAULT 'cikberluk@gmail.com',
  billing_phone TEXT DEFAULT '+62 812-3456-7890',
  billing_address TEXT DEFAULT 'Jl. Raya Sudirman No. 128, Jakarta Selatan, DKI Jakarta 12190',
  auto_renew BOOLEAN DEFAULT TRUE,
  preferred_currency TEXT DEFAULT 'IDR',
  notify_email BOOLEAN DEFAULT TRUE,
  notify_whatsapp BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Defensive Columns
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'Toko CikCik Berluk';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS tax_id TEXT DEFAULT '09.384.920.4-012.000';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS billing_email TEXT DEFAULT 'cikberluk@gmail.com';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS billing_phone TEXT DEFAULT '+62 812-3456-7890';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS billing_address TEXT DEFAULT 'Jl. Raya Sudirman No. 128, Jakarta Selatan, DKI Jakarta 12190';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'IDR';
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT TRUE;
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN DEFAULT TRUE;
ALTER TABLE public.umkm_billing_settings ADD COLUMN IF NOT EXISTS notify_push BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE public.umkm_billing_settings ENABLE ROW LEVEL SECURITY;

-- Allow policies
DROP POLICY IF EXISTS "Allow all billing settings" ON public.umkm_billing_settings;
CREATE POLICY "Allow all billing settings" ON public.umkm_billing_settings FOR ALL USING (true);

-- Idempotent Realtime publication table additions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_billing_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_settings;
  END IF;
END $$;

-- SEED DATA SETUP
INSERT INTO public.umkm_billing_settings (
  store_id, business_name, tax_id, billing_email, billing_phone, billing_address, auto_renew, preferred_currency, notify_email, notify_whatsapp, notify_push
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Toko CikCik Berluk',
  '09.384.920.4-012.000',
  'cikberluk@gmail.com',
  '+62 812-3456-7890',
  'Jl. Raya Sudirman No. 128, Jakarta Selatan, DKI Jakarta 12190',
  TRUE,
  'IDR',
  TRUE,
  TRUE,
  FALSE
)
ON CONFLICT (store_id) DO NOTHING;

-- 1. RPC: Get Billing Settings
CREATE OR REPLACE FUNCTION public.get_umkm_billing_settings(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings JSONB;
BEGIN
  SELECT jsonb_build_object(
    'store_id', store_id,
    'business_name', business_name,
    'tax_id', tax_id,
    'billing_email', billing_email,
    'billing_phone', billing_phone,
    'billing_address', billing_address,
    'auto_renew', auto_renew,
    'preferred_currency', preferred_currency,
    'notify_email', notify_email,
    'notify_whatsapp', notify_whatsapp,
    'notify_push', notify_push
  ) INTO v_settings
  FROM public.umkm_billing_settings
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
  LIMIT 1;

  IF v_settings IS NULL THEN
    v_settings := jsonb_build_object(
      'store_id', COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111'),
      'business_name', 'Toko CikCik Berluk',
      'tax_id', '09.384.920.4-012.000',
      'billing_email', 'cikberluk@gmail.com',
      'billing_phone', '+62 812-3456-7890',
      'billing_address', 'Jl. Raya Sudirman No. 128, Jakarta Selatan, DKI Jakarta 12190',
      'auto_renew', true,
      'preferred_currency', 'IDR',
      'notify_email', true,
      'notify_whatsapp', true,
      'notify_push', false
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'data', v_settings);
END;
$$;

-- 2. RPC: Update Billing Settings
CREATE OR REPLACE FUNCTION public.update_umkm_billing_settings(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111',
  p_business_name TEXT DEFAULT 'Toko CikCik Berluk',
  p_tax_id TEXT DEFAULT '09.384.920.4-012.000',
  p_billing_email TEXT DEFAULT 'cikberluk@gmail.com',
  p_billing_phone TEXT DEFAULT '+62 812-3456-7890',
  p_billing_address TEXT DEFAULT 'Jl. Raya Sudirman No. 128, Jakarta Selatan, DKI Jakarta 12190',
  p_auto_renew BOOLEAN DEFAULT TRUE,
  p_preferred_currency TEXT DEFAULT 'IDR',
  p_notify_email BOOLEAN DEFAULT TRUE,
  p_notify_whatsapp BOOLEAN DEFAULT TRUE,
  p_notify_push BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.umkm_billing_settings (
    store_id, business_name, tax_id, billing_email, billing_phone, billing_address,
    auto_renew, preferred_currency, notify_email, notify_whatsapp, notify_push, updated_at
  )
  VALUES (
    COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111'),
    p_business_name, p_tax_id, p_billing_email, p_billing_phone, p_billing_address,
    p_auto_renew, p_preferred_currency, p_notify_email, p_notify_whatsapp, p_notify_push, NOW()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    tax_id = EXCLUDED.tax_id,
    billing_email = EXCLUDED.billing_email,
    billing_phone = EXCLUDED.billing_phone,
    billing_address = EXCLUDED.billing_address,
    auto_renew = EXCLUDED.auto_renew,
    preferred_currency = EXCLUDED.preferred_currency,
    notify_email = EXCLUDED.notify_email,
    notify_whatsapp = EXCLUDED.notify_whatsapp,
    notify_push = EXCLUDED.notify_push,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'message', 'Pengaturan tagihan & faktur berhasil diperbarui');
END;
$$;
