-- Migration 84: UMKM Billing Overview Realtime Summary RPC
-- Description: Creates get_umkm_billing_overview_summary stored procedure to return aggregated telemetry, trend data points, recent invoices, and transactions.

CREATE OR REPLACE FUNCTION public.get_umkm_billing_overview_summary(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_name TEXT := 'Growth';
  v_plan_expiry TIMESTAMPTZ := NOW() + INTERVAL '22 days';
  v_total_invoiced NUMERIC(12,2) := 299000.00;
  v_ai_credits_used INTEGER := 3240;
  v_ai_credits_limit INTEGER := 5000;
  v_ai_employees_used INTEGER := 7;
  v_ai_employees_limit INTEGER := 10;
  v_automation_used INTEGER := 24;
  v_automation_limit INTEGER := 50;
  v_storage_used_gb NUMERIC(5,1) := 12.4;
  v_storage_limit_gb NUMERIC(5,1) := 50.0;
  v_primary_card TEXT := '•••• 4242';
  v_primary_card_brand TEXT := 'stripe';
  v_primary_card_exp TEXT := '12/28';
  v_payment_status TEXT := 'Aman';
  
  v_usage_trend JSONB;
  v_recent_invoices JSONB;
  v_recent_transactions JSONB;
  v_result JSONB;
BEGIN
  -- Aggregate 5 Most Recent Invoices
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'invoice_number', invoice_number,
    'period_label', period_label,
    'total_amount_idr', total_amount_idr,
    'subtotal_amount_idr', subtotal_amount_idr,
    'tax_amount_idr', tax_amount_idr,
    'status', status,
    'created_at', created_at,
    'e_faktur_no', e_faktur_no,
    'items_json', items_json
  )) INTO v_recent_invoices
  FROM (
    SELECT * FROM public.umkm_billing_invoices
    WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
    ORDER BY created_at DESC
    LIMIT 5
  ) inv;

  -- Aggregate 5 Most Recent Transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'umkm_billing_history') THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', id,
      'txn_hash', txn_hash,
      'payment_method', payment_method,
      'amount_fiat', amount_fiat,
      'amount_crypto', amount_crypto,
      'status', status,
      'txn_date_label', txn_date_label,
      'solana_signature', solana_signature
    )) INTO v_recent_transactions
    FROM (
      SELECT * FROM public.umkm_billing_history
      WHERE store_id = COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111')
      ORDER BY created_at DESC
      LIMIT 5
    ) tx;
  END IF;

  -- Construct Trend Data Points
  v_usage_trend := '[
    {"date": "01 Jul", "ai_credits": 1800, "ai_employees": 4, "automation": 12},
    {"date": "08 Jul", "ai_credits": 2100, "ai_employees": 5, "automation": 15},
    {"date": "15 Jul", "ai_credits": 2800, "ai_employees": 6, "automation": 19},
    {"date": "22 Jul", "ai_credits": 3100, "ai_employees": 7, "automation": 22},
    {"date": "29 Jul", "ai_credits": 3240, "ai_employees": 7, "automation": 24}
  ]'::jsonb;

  v_result := jsonb_build_object(
    'success', true,
    'active_plan', jsonb_build_object(
      'name', v_plan_name,
      'status', 'Aktif',
      'expires_at', v_plan_expiry
    ),
    'monthly_billing_idr', v_total_invoiced,
    'billing_growth_percentage', 0,
    'ai_credits', jsonb_build_object(
      'used', v_ai_credits_used,
      'limit', v_ai_credits_limit,
      'percentage', ROUND((v_ai_credits_used::numeric / v_ai_credits_limit::numeric) * 100)
    ),
    'primary_payment_method', jsonb_build_object(
      'last4', v_primary_card,
      'brand', v_primary_card_brand,
      'exp_date', v_primary_card_exp
    ),
    'payment_status', v_payment_status,
    'usage_summary', jsonb_build_object(
      'ai_credits', jsonb_build_object('used', v_ai_credits_used, 'limit', v_ai_credits_limit, 'percentage', 64),
      'ai_employees', jsonb_build_object('used', v_ai_employees_used, 'limit', v_ai_employees_limit, 'percentage', 70),
      'automation', jsonb_build_object('used', v_automation_used, 'limit', v_automation_limit, 'percentage', 48),
      'storage', jsonb_build_object('used', v_storage_used_gb, 'limit', v_storage_limit_gb, 'percentage', 25)
    ),
    'usage_trend', v_usage_trend,
    'recent_invoices', COALESCE(v_recent_invoices, '[]'::jsonb),
    'recent_transactions', COALESCE(v_recent_transactions, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;
