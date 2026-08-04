-- Migration: 21_umkm_profile_customers_enterprise_schema.sql
-- Description: Enterprise User Profile, Security Settings, Active Devices, Activity Logs & Customers Schema with Realtime and RLS

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.umkm_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  account_id VARCHAR(100) NOT NULL DEFAULT 'acc_8f7a2c9e81234',
  fullname VARCHAR(150) NOT NULL DEFAULT 'Cik Beriuk',
  email VARCHAR(150) NOT NULL DEFAULT 'cikberiuk@gmail.com',
  is_email_verified BOOLEAN NOT NULL DEFAULT true,
  phone VARCHAR(50) NOT NULL DEFAULT '+62 812-3456-7890',
  is_phone_verified BOOLEAN NOT NULL DEFAULT true,
  job_title VARCHAR(100) NOT NULL DEFAULT 'Owner',
  store_name VARCHAR(150) NOT NULL DEFAULT 'Toko CikCik Beriuk',
  description TEXT DEFAULT 'Menjual berbagai kebutuhan harian, perlengkapan rumah tangga, dan produk pilihan berkualitas.',
  avatar_url TEXT DEFAULT '/assets/logo/zega.png',
  account_role VARCHAR(50) NOT NULL DEFAULT 'Owner',
  joined_date VARCHAR(50) NOT NULL DEFAULT '12 Maret 2025',
  last_login_label VARCHAR(100) NOT NULL DEFAULT 'Hari ini, 10:24 WIB',
  account_status VARCHAR(30) NOT NULL DEFAULT 'Aktif',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_profile UNIQUE (store_id)
);

-- 2. Security Settings Table
CREATE TABLE IF NOT EXISTS public.umkm_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  is_2fa_enabled BOOLEAN NOT NULL DEFAULT true,
  recovery_email VARCHAR(150) NOT NULL DEFAULT 'cikberiuk@gmail.com',
  is_recovery_email_verified BOOLEAN NOT NULL DEFAULT true,
  recovery_phone VARCHAR(50) NOT NULL DEFAULT '+62 812-3456-7890',
  is_recovery_phone_verified BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_store_security UNIQUE (store_id)
);

-- 3. Active Devices Table
CREATE TABLE IF NOT EXISTS public.umkm_active_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  device_type VARCHAR(50) NOT NULL, -- 'desktop', 'mobile', 'mac'
  device_name VARCHAR(100) NOT NULL, -- 'Windows • Chrome', 'iPhone 14 • iOS 17', 'MacBook Air • Safari'
  location VARCHAR(100) NOT NULL,
  last_active VARCHAR(100) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Activities Log Table
CREATE TABLE IF NOT EXISTS public.umkm_user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  activity_title VARCHAR(150) NOT NULL,
  activity_detail VARCHAR(255) NOT NULL,
  time_label VARCHAR(50) NOT NULL, -- 'Hari ini', 'Kemarin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Customers Table for Customer Management
CREATE TABLE IF NOT EXISTS public.umkm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id VARCHAR(100) NOT NULL DEFAULT 'STORE-DEMO-1283',
  customer_code VARCHAR(50) NOT NULL DEFAULT 'CUST-000',
  name VARCHAR(150) NOT NULL DEFAULT 'Pelanggan Baru',
  email VARCHAR(150),
  phone VARCHAR(50),
  city VARCHAR(100) DEFAULT 'Jakarta',
  total_orders INT NOT NULL DEFAULT 0,
  total_spent_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'VIP', 'Inaktif'
  avatar_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist if table was created in a previous migration
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50) DEFAULT 'CUST-000';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Jakarta';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS total_spent_idr NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Aktif';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Drop NOT NULL from full_name if present in pre-existing table
ALTER TABLE public.umkm_customers ALTER COLUMN full_name DROP NOT NULL;

-- Fix any duplicate customer_code values from pre-existing table rows before creating index
DELETE FROM public.umkm_customers WHERE customer_code = 'CUST-000' OR customer_code IS NULL;

-- Ensure Unique Indexes for ON CONFLICT resolution
CREATE UNIQUE INDEX IF NOT EXISTS uk_umkm_user_profiles_store ON public.umkm_user_profiles (store_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_umkm_security_settings_store ON public.umkm_security_settings (store_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_umkm_customers_store_code ON public.umkm_customers (store_id, customer_code);

-- Enable RLS
ALTER TABLE public.umkm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_active_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent)
DROP POLICY IF EXISTS "Allow full access for umkm_user_profiles" ON public.umkm_user_profiles;
DROP POLICY IF EXISTS "Allow full access for umkm_security_settings" ON public.umkm_security_settings;
DROP POLICY IF EXISTS "Allow full access for umkm_active_devices" ON public.umkm_active_devices;
DROP POLICY IF EXISTS "Allow full access for umkm_user_activities" ON public.umkm_user_activities;
DROP POLICY IF EXISTS "Allow full access for umkm_customers" ON public.umkm_customers;

CREATE POLICY "Allow full access for umkm_user_profiles" ON public.umkm_user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_security_settings" ON public.umkm_security_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_active_devices" ON public.umkm_active_devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_user_activities" ON public.umkm_user_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access for umkm_customers" ON public.umkm_customers FOR ALL USING (true) WITH CHECK (true);

-- Add to Realtime publication (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_user_profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_security_settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_security_settings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_active_devices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_active_devices;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_user_activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_user_activities;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umkm_customers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customers;
  END IF;
END $$;

-- Seed default user profile
INSERT INTO public.umkm_user_profiles (
  store_id, account_id, fullname, email, phone, job_title, store_name, description, account_role, joined_date, last_login_label, account_status
) VALUES (
  'STORE-DEMO-1283', 'acc_8f7a2c9e81234', 'Cik Beriuk', 'cikberiuk@gmail.com', '+62 812-3456-7890', 'Owner', 'Toko CikCik Beriuk',
  'Menjual berbagai kebutuhan harian, perlengkapan rumah tangga, dan produk pilihan berkualitas.', 'Owner', '12 Maret 2025', 'Hari ini, 10:24 WIB', 'Aktif'
) ON CONFLICT (store_id) DO UPDATE SET updated_at = NOW();

-- Seed default security settings
INSERT INTO public.umkm_security_settings (store_id, is_2fa_enabled, recovery_email, recovery_phone)
VALUES ('STORE-DEMO-1283', true, 'cikberiuk@gmail.com', '+62 812-3456-7890')
ON CONFLICT (store_id) DO UPDATE SET updated_at = NOW();

-- Seed active devices
INSERT INTO public.umkm_active_devices (store_id, device_type, device_name, location, last_active, is_current)
VALUES
  ('STORE-DEMO-1283', 'desktop', 'Windows • Chrome', 'Jakarta, Indonesia', 'Hari ini, 10:24 WIB', true),
  ('STORE-DEMO-1283', 'mobile', 'iPhone 14 • iOS 17', 'Jakarta, Indonesia', 'Kemarin, 19:32 WIB', false),
  ('STORE-DEMO-1283', 'mac', 'MacBook Air • Safari', 'Surabaya, Indonesia', '2 hari lalu, 16:10 WIB', false);

-- Seed recent user activities
INSERT INTO public.umkm_user_activities (store_id, activity_title, activity_detail, time_label)
VALUES
  ('STORE-DEMO-1283', 'Login berhasil', 'Chrome di Windows • 10:24 WIB', 'Hari ini'),
  ('STORE-DEMO-1283', 'Mengubah informasi profil', '10:15 WIB', 'Hari ini'),
  ('STORE-DEMO-1283', 'Mengaktifkan 2FA', '09:40 WIB', 'Hari ini'),
  ('STORE-DEMO-1283', 'Login berhasil', 'iPhone 14 di iOS • 19:32 WIB', 'Kemarin'),
  ('STORE-DEMO-1283', 'Mengekspor laporan penjualan', '18:20 WIB', 'Kemarin');

-- Seed default customers (populating both name and full_name for backwards compatibility)
INSERT INTO public.umkm_customers (store_id, customer_code, name, full_name, email, phone, city, total_orders, total_spent_idr, status)
VALUES
  ('STORE-DEMO-1283', 'CUST-001', 'Budi Santoso', 'Budi Santoso', 'budi.santoso@gmail.com', '+62 811-2233-4455', 'Jakarta', 14, 4250000.00, 'VIP'),
  ('STORE-DEMO-1283', 'CUST-002', 'Siti Rahma', 'Siti Rahma', 'siti.rahma@yahoo.com', '+62 812-3344-5566', 'Bandung', 8, 1850000.00, 'Aktif'),
  ('STORE-DEMO-1283', 'CUST-003', 'Andi Wijaya', 'Andi Wijaya', 'andi.wijaya@outlook.com', '+62 813-4455-6677', 'Surabaya', 22, 9800000.00, 'VIP'),
  ('STORE-DEMO-1283', 'CUST-004', 'Dewi Lestari', 'Dewi Lestari', 'dewi.lestari@gmail.com', '+62 815-5566-7788', 'Medan', 5, 950000.00, 'Aktif'),
  ('STORE-DEMO-1283', 'CUST-005', 'Rudi Pratama', 'Rudi Pratama', 'rudi.pratama@gmail.com', '+62 817-6677-8899', 'Semarang', 2, 350000.00, 'Aktif')
ON CONFLICT (store_id, customer_code) DO UPDATE SET updated_at = NOW();
