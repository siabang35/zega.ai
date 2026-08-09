-- Migration 90: UMKM Notification Settings & Supabase Realtime Schema
-- Standard Enterprise Schema & Supabase Real-Time Setup for Notification Settings

-- 1. Notification Settings Table (Defensively Ensure Schema Integrity)
CREATE TABLE IF NOT EXISTS public.umkm_settings_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE UNIQUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    email_target VARCHAR(255) NOT NULL DEFAULT 'cikberiuk@gmail.com',
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
    whatsapp_target VARCHAR(100) NOT NULL DEFAULT '+62 812-3456-7890',
    browser_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    sms_target VARCHAR(100) NOT NULL DEFAULT '+62 812-3456-7890',
    
    -- Category Preferences: AI & Automation
    ai_task_done BOOLEAN NOT NULL DEFAULT true,
    ai_insights BOOLEAN NOT NULL DEFAULT true,
    automation_status BOOLEAN NOT NULL DEFAULT true,
    
    -- Category Preferences: Business & Operations
    new_order BOOLEAN NOT NULL DEFAULT true,
    invoice_paid BOOLEAN NOT NULL DEFAULT true,
    stock_warning BOOLEAN NOT NULL DEFAULT true,
    customer_followup BOOLEAN NOT NULL DEFAULT false,
    
    -- Category Preferences: System
    product_updates BOOLEAN NOT NULL DEFAULT true,
    system_maintenance BOOLEAN NOT NULL DEFAULT true,
    security_login BOOLEAN NOT NULL DEFAULT true,
    
    -- Schedules & Quiet Hours
    daily_summary_enabled BOOLEAN NOT NULL DEFAULT true,
    daily_summary_time VARCHAR(50) NOT NULL DEFAULT '08:00 WIB',
    weekly_summary_enabled BOOLEAN NOT NULL DEFAULT true,
    weekly_summary_day VARCHAR(50) NOT NULL DEFAULT 'Senin',
    weekly_summary_time VARCHAR(50) NOT NULL DEFAULT '09:00 WIB',
    
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start VARCHAR(20) NOT NULL DEFAULT '22:00',
    quiet_hours_end VARCHAR(20) NOT NULL DEFAULT '07:00',
    quiet_hours_freq VARCHAR(100) NOT NULL DEFAULT 'Setiap hari',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive Column Additions for Notification Settings
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS in_app_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS email_target VARCHAR(255) NOT NULL DEFAULT 'cikberiuk@gmail.com';
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS whatsapp_target VARCHAR(100) NOT NULL DEFAULT '+62 812-3456-7890';
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS browser_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS sms_target VARCHAR(100) NOT NULL DEFAULT '+62 812-3456-7890';

ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS ai_task_done BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS ai_insights BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS automation_status BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS new_order BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS invoice_paid BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS stock_warning BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS customer_followup BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS product_updates BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS system_maintenance BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS security_login BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS daily_summary_time VARCHAR(50) NOT NULL DEFAULT '08:00 WIB';
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS weekly_summary_day VARCHAR(50) NOT NULL DEFAULT 'Senin';
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS weekly_summary_time VARCHAR(50) NOT NULL DEFAULT '09:00 WIB';

ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS quiet_hours_start VARCHAR(20) NOT NULL DEFAULT '22:00';
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS quiet_hours_end VARCHAR(20) NOT NULL DEFAULT '07:00';
ALTER TABLE public.umkm_settings_notifications ADD COLUMN IF NOT EXISTS quiet_hours_freq VARCHAR(100) NOT NULL DEFAULT 'Setiap hari';

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_umkm_settings_notifications_store ON public.umkm_settings_notifications(store_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.umkm_settings_notifications ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Store Owners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read umkm_settings_notifications') THEN
        CREATE POLICY "Public read umkm_settings_notifications" ON public.umkm_settings_notifications FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write umkm_settings_notifications') THEN
        CREATE POLICY "Public write umkm_settings_notifications" ON public.umkm_settings_notifications FOR ALL USING (true);
    END IF;
END $$;

-- SEED REAL DEMO DATA FOR DEMO STORE '11111111-1111-1111-1111-111111111111'
INSERT INTO public.umkm_settings_notifications (
    store_id, in_app_enabled, email_enabled, email_target, whatsapp_enabled, whatsapp_target, browser_enabled, sms_enabled, sms_target,
    ai_task_done, ai_insights, automation_status,
    new_order, invoice_paid, stock_warning, customer_followup,
    product_updates, system_maintenance, security_login,
    daily_summary_enabled, daily_summary_time, weekly_summary_enabled, weekly_summary_day, weekly_summary_time,
    quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_freq
)
VALUES (
    '11111111-1111-1111-1111-111111111111', true, true, 'cikberiuk@gmail.com', true, '+62 812-3456-7890', true, false, '+62 812-3456-7890',
    true, true, true,
    true, true, true, false,
    true, true, true,
    true, '08:00 WIB', true, 'Senin', '09:00 WIB',
    true, '22:00', '07:00', 'Setiap hari'
)
ON CONFLICT (store_id) DO UPDATE SET
    email_target = EXCLUDED.email_target,
    whatsapp_target = EXCLUDED.whatsapp_target,
    updated_at = NOW();

-- Enable Supabase Realtime Publications for Notification table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_settings_notifications;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Publication alter skipped or table already added';
END $$;
