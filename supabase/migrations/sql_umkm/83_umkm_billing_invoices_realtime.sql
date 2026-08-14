-- Migration 83: UMKM Billing Invoices Realtime Telemetry & Bulk Export RPCs
-- Description: Sets up umkm_billing_invoices table, RLS security policies, realtime publication, and RPC functions.

-- 1. Table Structure: umkm_billing_invoices
CREATE TABLE IF NOT EXISTS public.umkm_billing_invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  invoice_number TEXT NOT NULL UNIQUE,
  period_label TEXT NOT NULL,
  total_amount_idr NUMERIC(12,2) NOT NULL DEFAULT 299000.00,
  tax_amount_idr NUMERIC(12,2) NOT NULL DEFAULT 32890.00,
  subtotal_amount_idr NUMERIC(12,2) NOT NULL DEFAULT 266110.00,
  status TEXT NOT NULL DEFAULT 'Lunas',
  due_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  e_faktur_no TEXT,
  items_json JSONB DEFAULT '[{"name": "Growth Plan Subscription", "qty": 1, "price": 299000}]'::jsonb
);

-- Defensive Columns & Constraints Check
ALTER TABLE public.umkm_billing_invoices ADD COLUMN IF NOT EXISTS store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.umkm_billing_invoices ADD COLUMN IF NOT EXISTS tax_amount_idr NUMERIC(12,2) DEFAULT 32890.00;
ALTER TABLE public.umkm_billing_invoices ADD COLUMN IF NOT EXISTS subtotal_amount_idr NUMERIC(12,2) DEFAULT 266110.00;
ALTER TABLE public.umkm_billing_invoices ADD COLUMN IF NOT EXISTS e_faktur_no TEXT;
ALTER TABLE public.umkm_billing_invoices ADD COLUMN IF NOT EXISTS items_json JSONB DEFAULT '[{"name": "Growth Plan Subscription", "qty": 1, "price": 299000}]'::jsonb;

-- Deduplicate existing rows by invoice_number using PostgreSQL ctid before index creation
DELETE FROM public.umkm_billing_invoices a
USING public.umkm_billing_invoices b
WHERE a.ctid < b.ctid AND a.invoice_number = b.invoice_number;

-- Ensure UNIQUE INDEX exists safely
CREATE UNIQUE INDEX IF NOT EXISTS idx_umkm_billing_invoices_num ON public.umkm_billing_invoices (invoice_number);

-- 2. Row Level Security (RLS)
ALTER TABLE public.umkm_billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all umkm_billing_invoices" ON public.umkm_billing_invoices;
CREATE POLICY "Allow all umkm_billing_invoices" ON public.umkm_billing_invoices FOR ALL USING (true);

-- 3. Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'umkm_billing_invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_invoices;
  END IF;
END $$;

-- 4. Seed Rich Invoice Dataset (Defensive WHERE NOT EXISTS prevents 42P10)
INSERT INTO public.umkm_billing_invoices (store_id, invoice_number, period_label, total_amount_idr, subtotal_amount_idr, tax_amount_idr, status, e_faktur_no, created_at)
SELECT '11111111-1111-1111-1111-111111111111', 'INV-2026-0721', 'Growth Plan - Juli 2026', 299000.00, 269369.00, 29631.00, 'Lunas', '010.000-26.00000721', NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM public.umkm_billing_invoices WHERE invoice_number = 'INV-2026-0721');

INSERT INTO public.umkm_billing_invoices (store_id, invoice_number, period_label, total_amount_idr, subtotal_amount_idr, tax_amount_idr, status, e_faktur_no, created_at)
SELECT '11111111-1111-1111-1111-111111111111', 'INV-2026-0621', 'Growth Plan - Juni 2026', 299000.00, 269369.00, 29631.00, 'Lunas', '010.000-26.00000621', NOW() - INTERVAL '45 days'
WHERE NOT EXISTS (SELECT 1 FROM public.umkm_billing_invoices WHERE invoice_number = 'INV-2026-0621');

INSERT INTO public.umkm_billing_invoices (store_id, invoice_number, period_label, total_amount_idr, subtotal_amount_idr, tax_amount_idr, status, e_faktur_no, created_at)
SELECT '11111111-1111-1111-1111-111111111111', 'INV-2026-0521', 'Growth Plan - Mei 2026', 299000.00, 269369.00, 29631.00, 'Lunas', '010.000-26.00000521', NOW() - INTERVAL '75 days'
WHERE NOT EXISTS (SELECT 1 FROM public.umkm_billing_invoices WHERE invoice_number = 'INV-2026-0521');

INSERT INTO public.umkm_billing_invoices (store_id, invoice_number, period_label, total_amount_idr, subtotal_amount_idr, tax_amount_idr, status, e_faktur_no, created_at)
SELECT '11111111-1111-1111-1111-111111111111', 'INV-2026-0421', 'Growth Plan - April 2026', 299000.00, 269369.00, 29631.00, 'Lunas', '010.000-26.00000421', NOW() - INTERVAL '105 days'
WHERE NOT EXISTS (SELECT 1 FROM public.umkm_billing_invoices WHERE invoice_number = 'INV-2026-0421');

INSERT INTO public.umkm_billing_invoices (store_id, invoice_number, period_label, total_amount_idr, subtotal_amount_idr, tax_amount_idr, status, e_faktur_no, created_at)
SELECT '11111111-1111-1111-1111-111111111111', 'INV-2026-0321', 'Growth Plan - Maret 2026', 299000.00, 269369.00, 29631.00, 'Lunas', '010.000-26.00000321', NOW() - INTERVAL '135 days'
WHERE NOT EXISTS (SELECT 1 FROM public.umkm_billing_invoices WHERE invoice_number = 'INV-2026-0321');

-- 5. RPC Function: get_umkm_billing_invoices_overview
CREATE OR REPLACE FUNCTION public.get_umkm_billing_invoices_overview(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111',
  p_search TEXT DEFAULT '',
  p_status TEXT DEFAULT 'Semua'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoices JSONB;
  v_total_amount NUMERIC(12,2) := 0.00;
  v_paid_count INTEGER := 0;
  v_pending_count INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Compute KPI Telemetry Summary
  SELECT 
    COALESCE(SUM(total_amount_idr), 0.00),
    COALESCE(COUNT(*) FILTER (WHERE status = 'Lunas'), 0),
    COALESCE(COUNT(*) FILTER (WHERE status != 'Lunas'), 0)
  INTO v_total_amount, v_paid_count, v_pending_count
  FROM public.umkm_billing_invoices
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111');

  -- Aggregate Invoices List
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'invoice_number', invoice_number,
    'period_label', period_label,
    'total_amount_idr', total_amount_idr,
    'subtotal_amount_idr', subtotal_amount_idr,
    'tax_amount_idr', tax_amount_idr,
    'status', status,
    'created_at', created_at,
    'due_date', due_date,
    'pdf_url', pdf_url,
    'e_faktur_no', e_faktur_no,
    'items_json', items_json
  )) INTO v_invoices
  FROM public.umkm_billing_invoices
  WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
    AND (
      p_search IS NULL OR p_search = '' OR
      invoice_number ILIKE '%' || p_search || '%' OR
      period_label ILIKE '%' || p_search || '%'
    )
    AND (
      p_status IS NULL OR p_status = 'Semua' OR
      status = p_status
    )
  ORDER BY created_at DESC;

  v_result := jsonb_build_object(
    'success', true,
    'total_invoiced_idr', v_total_amount,
    'paid_count', v_paid_count,
    'pending_count', v_pending_count,
    'invoices', COALESCE(v_invoices, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;
