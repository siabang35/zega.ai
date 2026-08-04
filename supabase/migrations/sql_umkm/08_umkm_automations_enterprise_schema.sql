-- ============================================================================
-- MIGRATION 08: ENTERPRISE AUTOMATION WORKFLOW SCHEMA & REALTIME SUPPORT
-- Database: Supabase PostgreSQL
-- Description: Safe idempotent migration adding umkm_automations table & columns.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: umkm_automations (CREATE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.umkm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title VARCHAR(255),
    name VARCHAR(255),
    description TEXT,
    trigger_event VARCHAR(128),
    last_run VARCHAR(64) DEFAULT '2 menit yang lalu',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    success_rate NUMERIC(5,2) DEFAULT 100.00,
    workflow_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ALTER TABLE SAFE COLUMN MIGRATIONS (IF TABLE ALREADY EXISTED)
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS trigger_event VARCHAR(128);
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS last_run VARCHAR(64) DEFAULT '2 menit yang lalu';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5,2) DEFAULT 100.00;
ALTER TABLE public.umkm_automations ADD COLUMN IF NOT EXISTS workflow_steps JSONB DEFAULT '[]'::jsonb;

-- 3. STATUS CHECK CONSTRAINT
ALTER TABLE public.umkm_automations DROP CONSTRAINT IF EXISTS umkm_automations_status_check;
ALTER TABLE public.umkm_automations ADD CONSTRAINT umkm_automations_status_check 
    CHECK (status IN ('active', 'running', 'paused', 'failed', 'completed'));

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_umkm_automations_store_id ON public.umkm_automations(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_automations_status ON public.umkm_automations(status);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.umkm_automations ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
DROP POLICY IF EXISTS "Allow all for umkm_automations" ON public.umkm_automations;
CREATE POLICY "Allow all for umkm_automations" ON public.umkm_automations FOR ALL USING (true);

-- 7. REALTIME PUBLICATION ENABLEMENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'umkm_automations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_automations;
  END IF;
END $$;

-- 8. SEED DEMO AUTOMATIONS (Matching Screenshot Reference)
INSERT INTO public.umkm_automations (
    id, store_id, title, name, description, trigger_event, last_run, status, success_rate, workflow_steps, created_at
) VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'New Order -> Invoice -> WA -> Save -> Update Stock',
    'New Order -> Invoice -> WA -> Save -> Update Stock',
    'Buat invoice otomatis saat ada pesanan baru',
    'New Order (Online Store)',
    '2 menit yang lalu',
    'active',
    100.00,
    '["New Order Trigger", "Invoice Gen AI", "WA Notification", "Database Log", "Stock Decrement"]'::jsonb,
    '2026-05-12 10:00:00+00'
),
(
    'c2222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Customer Chat -> AI Reply -> Tag -> Follow Up',
    'Customer Chat -> AI Reply -> Tag -> Follow Up',
    'Balas chat pelanggan otomatis & follow up',
    'New Message (WhatsApp)',
    '1 menit yang lalu',
    'active',
    98.00,
    '["WhatsApp Webhook", "RAG Knowledge Base", "AI Auto-Reply", "Customer Tagging"]'::jsonb,
    '2026-05-10 14:30:00+00'
),
(
    'c3333333-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Payment Reminder -> WA -> Email -> Update Status',
    'Payment Reminder -> WA -> Email -> Update Status',
    'Kirim pengingat pembayaran otomatis',
    'Invoice Due (Finance AI)',
    '5 menit yang lalu',
    'active',
    100.00,
    '["Invoice Due Cron", "WA Payment Link", "Email Backup", "Status Updater"]'::jsonb,
    '2026-05-08 09:15:00+00'
),
(
    'c4444444-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'New Lead -> CRM -> Email -> Add to List',
    'New Lead -> CRM -> Email -> Add to List',
    'Lead baru masuk ke CRM dan email list',
    'New Lead (Form/Website)',
    '10 menit yang lalu',
    'active',
    94.00,
    '["Webform Submission", "Supabase CRM Insert", "Welcome Email", "List Tagging"]'::jsonb,
    '2026-05-07 11:20:00+00'
),
(
    'c5555555-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Abandoned Cart -> WA -> Discount -> Recover',
    'Abandoned Cart -> WA -> Discount -> Recover',
    'Pulihkan keranjang yang ditinggalkan',
    'Abandoned Cart (Store)',
    '15 menit yang lalu',
    'paused',
    86.00,
    '["Cart Inactivity", "WA Promo Voucher", "Discount Code Gen", "Checkout Track"]'::jsonb,
    '2026-05-05 16:45:00+00'
),
(
    'c6666666-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Stock Alert -> WA -> Order Suggestion',
    'Stock Alert -> WA -> Order Suggestion',
    'Notifikasi stok menipis & rekomendasi pembelian',
    'Low Stock (Store AI)',
    '30 menit yang lalu',
    'active',
    97.00,
    '["Inventory Threshold Alert", "Supplier Order Draft", "WA Manager Alert"]'::jsonb,
    '2026-05-02 08:10:00+00'
),
(
    'c7777777-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Review Request -> WA -> Incentive -> Tag',
    'Review Request -> WA -> Incentive -> Tag',
    'Minta review pelanggan & beri insentif',
    'Order Completed (Store)',
    '1 jam yang lalu',
    'failed',
    72.00,
    '["Order Delivered Event", "WA Survey Request", "Reward Coupon Gen"]'::jsonb,
    '2026-05-01 13:00:00+00'
)
ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
name = EXCLUDED.name,
description = EXCLUDED.description,
trigger_event = EXCLUDED.trigger_event,
status = EXCLUDED.status,
success_rate = EXCLUDED.success_rate,
workflow_steps = EXCLUDED.workflow_steps;
