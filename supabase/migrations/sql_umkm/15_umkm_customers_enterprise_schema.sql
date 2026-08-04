-- ============================================================================
-- SQL MIGRATION 15: UMKM CUSTOMERS ENTERPRISE SCHEMA & REALTIME INFRASTRUCTURE
-- ============================================================================
-- Purpose: Support enterprise Customers management, CRM segments, growth analytics,
-- activity stream, regional distribution, and R2 CDN avatar resolution.
-- Handles backward compatibility with legacy umkm_customers table, FKs, constraints, and RLS policies.
-- ============================================================================

BEGIN;

-- 1. Drop existing RLS policies on umkm_customers before schema alterations
DROP POLICY IF EXISTS "Users can access own store customers" ON public.umkm_customers;
DROP POLICY IF EXISTS "Allow public read umkm_customers" ON public.umkm_customers;
DROP POLICY IF EXISTS "Allow all write umkm_customers" ON public.umkm_customers;

-- 2. Drop foreign key constraint on store_id and legacy status check constraint if present
ALTER TABLE public.umkm_customers DROP CONSTRAINT IF EXISTS umkm_customers_store_id_fkey;
ALTER TABLE public.umkm_customers DROP CONSTRAINT IF EXISTS umkm_customers_status_check;

-- 3. Ensure public.umkm_customers table exists
CREATE TABLE IF NOT EXISTS public.umkm_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    full_name TEXT NOT NULL DEFAULT 'Pelanggan UMKM',
    name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    segment TEXT NOT NULL DEFAULT 'New',
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spend_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    last_order_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'Aktif',
    city_region TEXT DEFAULT 'Jakarta',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gracefully add missing columns & alter column types if umkm_customers already existed from legacy schema
ALTER TABLE public.umkm_customers ALTER COLUMN store_id TYPE TEXT USING store_id::text;
ALTER TABLE public.umkm_customers ALTER COLUMN store_id SET DEFAULT 'STORE-DEMO-1283';
UPDATE public.umkm_customers SET store_id = 'STORE-DEMO-1283' WHERE store_id IS NULL;

ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'New';
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS total_spend_idr NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.umkm_customers ADD COLUMN IF NOT EXISTS city_region TEXT DEFAULT 'Jakarta';

-- Backfill 'name' column from legacy 'full_name' if needed
UPDATE public.umkm_customers SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
UPDATE public.umkm_customers SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- 4. Create umkm_customer_segments Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    name TEXT NOT NULL UNIQUE, -- 'VIP', 'Loyal', 'Repeat', 'New'
    percentage INTEGER NOT NULL DEFAULT 0,
    count INTEGER NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#f97316',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create umkm_customer_growth Table (Chart Data)
CREATE TABLE IF NOT EXISTS public.umkm_customer_growth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create umkm_customer_activity_stream Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    customer_name TEXT NOT NULL,
    action_description TEXT NOT NULL,
    time_ago TEXT NOT NULL DEFAULT 'Just now',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create umkm_customer_metrics Table
CREATE TABLE IF NOT EXISTS public.umkm_customer_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_customers INTEGER NOT NULL DEFAULT 1248,
    new_customers INTEGER NOT NULL DEFAULT 126,
    repeat_customers INTEGER NOT NULL DEFAULT 312,
    retention_rate_pct INTEGER NOT NULL DEFAULT 68,
    avg_order_value_idr NUMERIC(15,2) NOT NULL DEFAULT 1250000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Seed Enterprise Demo Customer Data with High-Quality Unsplash Profile Avatars
INSERT INTO public.umkm_customers (store_id, name, full_name, email, phone, avatar_url, segment, total_orders, total_spend_idr, status, city_region)
VALUES
('STORE-DEMO-1283', 'Siti Aisyah', 'Siti Aisyah', 'siti.aisyah@email.com', '+62 812-3456-7890', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'VIP', 12, 3200000.00, 'Aktif', 'Jakarta'),
('STORE-DEMO-1283', 'Budi Santoso', 'Budi Santoso', 'budi.santoso@email.com', '+62 813-2345-6789', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Loyal', 9, 2180000.00, 'Aktif', 'Jawa Barat'),
('STORE-DEMO-1283', 'Dewi Lestari', 'Dewi Lestari', 'dewi.lestari@email.com', '+62 821-3456-9876', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Repeat', 8, 1950000.00, 'Aktif', 'Jawa Tengah'),
('STORE-DEMO-1283', 'Rizky Pratama', 'Rizky Pratama', 'rizky.pratama@email.com', '+62 822-4567-8901', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Repeat', 7, 1120000.00, 'Tidak Aktif', 'Jawa Timur'),
('STORE-DEMO-1283', 'Maya Putri', 'Maya Putri', 'maya.putri@email.com', '+62 823-5678-9012', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 'New', 6, 1450000.00, 'Aktif', 'Jakarta')
ON CONFLICT DO NOTHING;

-- Update existing customer rows to use the high quality avatars
UPDATE public.umkm_customers SET avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' WHERE name = 'Siti Aisyah';
UPDATE public.umkm_customers SET avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' WHERE name = 'Budi Santoso';
UPDATE public.umkm_customers SET avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' WHERE name = 'Dewi Lestari';
UPDATE public.umkm_customers SET avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' WHERE name = 'Rizky Pratama';
UPDATE public.umkm_customers SET avatar_url = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' WHERE name = 'Maya Putri';

INSERT INTO public.umkm_customer_segments (store_id, name, percentage, count, color_hex)
VALUES
('STORE-DEMO-1283', 'VIP', 18, 224, '#f97316'),
('STORE-DEMO-1283', 'Loyal', 32, 399, '#3b82f6'),
('STORE-DEMO-1283', 'Repeat', 28, 349, '#8b5cf6'),
('STORE-DEMO-1283', 'New', 22, 276, '#10b981')
ON CONFLICT (name) DO UPDATE SET count = EXCLUDED.count;

INSERT INTO public.umkm_customer_growth (store_id, period_label, total_customers)
VALUES
('STORE-DEMO-1283', '1 Jul', 250),
('STORE-DEMO-1283', '6 Jul', 480),
('STORE-DEMO-1283', '11 Jul', 750),
('STORE-DEMO-1283', '16 Jul', 1020),
('STORE-DEMO-1283', '21 Jul', 1150),
('STORE-DEMO-1283', '26 Jul', 1200),
('STORE-DEMO-1283', '31 Jul', 1248)
ON CONFLICT DO NOTHING;

INSERT INTO public.umkm_customer_activity_stream (store_id, customer_name, action_description, time_ago, avatar_url)
VALUES
('STORE-DEMO-1283', 'Siti Aisyah', 'Melakukan pembelian Rp450.000', '2 jam lalu', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Budi Santoso', 'Membuka pesan WhatsApp promo', '3 jam lalu', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Dewi Lestari', 'Klik link promo diskon', '5 jam lalu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Rizky Pratama', 'Menambahkan produk ke keranjang', '1 hari lalu', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('STORE-DEMO-1283', 'Maya Putri', 'Mendaftar sebagai pelanggan baru', '1 hari lalu', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT DO NOTHING;

UPDATE public.umkm_customer_activity_stream SET avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' WHERE customer_name = 'Siti Aisyah';
UPDATE public.umkm_customer_activity_stream SET avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' WHERE customer_name = 'Budi Santoso';
UPDATE public.umkm_customer_activity_stream SET avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' WHERE customer_name = 'Dewi Lestari';
UPDATE public.umkm_customer_activity_stream SET avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' WHERE customer_name = 'Rizky Pratama';
UPDATE public.umkm_customer_activity_stream SET avatar_url = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' WHERE customer_name = 'Maya Putri';

INSERT INTO public.umkm_customer_metrics (store_id, total_customers, new_customers, repeat_customers, retention_rate_pct, avg_order_value_idr)
VALUES ('STORE-DEMO-1283', 1248, 126, 312, 68, 1250000.00)
ON CONFLICT DO NOTHING;

-- 9. Re-enable RLS Security & Create Policies
ALTER TABLE public.umkm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.umkm_customer_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customers" ON public.umkm_customers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_segments" ON public.umkm_customer_segments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_growth" ON public.umkm_customer_growth FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_activity_stream" ON public.umkm_customer_activity_stream FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read umkm_customer_metrics" ON public.umkm_customer_metrics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all write umkm_customers" ON public.umkm_customers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. Add Tables to Supabase Realtime Publication
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_metrics;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_customer_activity_stream;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
