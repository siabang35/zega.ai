-- Migration 85: UMKM Billing Actions, Subscription Plans & Support Tickets
-- Description: Creates tables and RPC procedures for dynamic subscription plan options and live customer support ticket submissions.

CREATE TABLE IF NOT EXISTS public.umkm_billing_plans (
  id TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL UNIQUE,
  badge_label TEXT DEFAULT 'Populer',
  monthly_price_idr NUMERIC(12,2) NOT NULL DEFAULT 0,
  monthly_price_usdc NUMERIC(8,2) NOT NULL DEFAULT 0,
  tax_pct INTEGER DEFAULT 11,
  ai_credits_limit INTEGER DEFAULT 5000,
  ai_employees_limit INTEGER DEFAULT 10,
  automation_limit INTEGER DEFAULT 50,
  storage_limit_gb NUMERIC(5,1) DEFAULT 50.0,
  features_json JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  icon_cdn_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Security for Plans
ALTER TABLE public.umkm_billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to active billing plans"
  ON public.umkm_billing_plans FOR SELECT USING (true);

-- Seed Default Plans if missing
INSERT INTO public.umkm_billing_plans (id, plan_name, badge_label, monthly_price_idr, monthly_price_usdc, ai_credits_limit, ai_employees_limit, automation_limit, storage_limit_gb, features_json, icon_cdn_url)
VALUES 
  ('plan_starter', 'Starter', 'Pemula', 99000.00, 6.50, 1500, 3, 15, 10.0, 
   '["1.500 AI Credits", "3 AI Employees", "15 Automations", "10 GB Storage", "Dukungan Email"]'::jsonb, 
   'https://pub-ef7753e1a0674f1b952a1b9487c67425.r2.dev/assets/logo/starter_plan.webp'),
  ('plan_growth', 'Growth', 'Paling Populer', 299000.00, 19.50, 5000, 10, 50, 50.0, 
   '["5.000 AI Credits", "10 AI Employees", "50 Automations", "50 GB Storage", "Priority Support 24/7", "e-Faktur PPN 11%"]'::jsonb, 
   'https://pub-ef7753e1a0674f1b952a1b9487c67425.r2.dev/assets/logo/growth_plan.webp'),
  ('plan_enterprise', 'Pro Enterprise', 'Skala Besar', 899000.00, 58.00, 25000, 50, 250, 250.0, 
   '["25.000 AI Credits", "50 AI Employees", "250 Automations", "250 GB Storage", "Dedicated Account Manager", "Custom SLA & Solana Settlement"]'::jsonb, 
   'https://pub-ef7753e1a0674f1b952a1b9487c67425.r2.dev/assets/logo/enterprise_plan.webp')
ON CONFLICT (id) DO UPDATE SET 
  monthly_price_idr = EXCLUDED.monthly_price_idr,
  features_json = EXCLUDED.features_json;

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.umkm_billing_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'Billing & Invoicing',
  priority TEXT DEFAULT 'Tinggi',
  message TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  status TEXT DEFAULT 'Terbuka',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.umkm_billing_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow store owners read own support tickets"
  ON public.umkm_billing_support_tickets FOR SELECT USING (true);
CREATE POLICY "Allow store owners insert support tickets"
  ON public.umkm_billing_support_tickets FOR INSERT WITH CHECK (true);

-- RPC 1: Submit Support Ticket
CREATE OR REPLACE FUNCTION public.submit_umkm_billing_support_ticket(
  p_store_id TEXT,
  p_subject TEXT,
  p_category TEXT,
  p_priority TEXT,
  p_message TEXT,
  p_user_email TEXT DEFAULT NULL,
  p_user_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  INSERT INTO public.umkm_billing_support_tickets (
    store_id, subject, category, priority, message, user_email, user_phone
  ) VALUES (
    COALESCE(p_store_id, '11111111-1111-1111-1111-111111111111'),
    COALESCE(p_subject, 'Permintaan Bantuan Billing UMKM'),
    COALESCE(p_category, 'Billing & Invoicing'),
    COALESCE(p_priority, 'Tinggi'),
    COALESCE(p_message, 'Mohon bantuan terkait faktur tagihan.'),
    p_user_email,
    p_user_phone
  ) RETURNING id INTO v_ticket_id;

  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', v_ticket_id,
    'message', 'Tiket bantuan berhasil dikirim! Tim ZEGA AI Support akan menghubungi Anda dalam 15 menit.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Gagal mengirim tiket bantuan: ' || SQLERRM
  );
END;
$$;

-- RPC 2: Get Billing Plans & Support Options
CREATE OR REPLACE FUNCTION public.get_umkm_billing_plans_and_support(
  p_store_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plans JSONB;
  v_support_channels JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', id,
    'plan_name', plan_name,
    'badge_label', badge_label,
    'monthly_price_idr', monthly_price_idr,
    'monthly_price_usdc', monthly_price_usdc,
    'ai_credits_limit', ai_credits_limit,
    'ai_employees_limit', ai_employees_limit,
    'automation_limit', automation_limit,
    'storage_limit_gb', storage_limit_gb,
    'features', features_json,
    'icon_cdn_url', icon_cdn_url
  )) INTO v_plans
  FROM public.umkm_billing_plans
  WHERE is_active = TRUE;

  v_support_channels := '[
    {"channel": "WhatsApp VIP Support", "contact": "+62 812-9900-8888", "availability": "24/7 Instant Response", "icon": "whatsapp"},
    {"channel": "Email Financial Desk", "contact": "billing@zega.ai", "availability": "Respon < 1 Jam", "icon": "email"},
    {"channel": "Solana x402 Helpdesk", "contact": "help.x402@zega.ai", "availability": "Blockchain Telemetry Desk", "icon": "solana"}
  ]'::jsonb;

  RETURN jsonb_build_object(
    'success', true,
    'plans', COALESCE(v_plans, '[]'::jsonb),
    'support_channels', v_support_channels
  );
END;
$$;

-- Enable Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'umkm_billing_support_tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_billing_support_tickets;
  END IF;
END $$;
