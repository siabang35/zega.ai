-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 01: Core Database Tables & High-Performance Indexes
-- Path: supabase/migrations/sql_umkm/01_umkm_core_tables.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UMKM STORES / BUSINESS PROFILES
CREATE TABLE IF NOT EXISTS public.umkm_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    store_id_code VARCHAR(32) UNIQUE NOT NULL DEFAULT ('STORE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    store_name VARCHAR(128) NOT NULL,
    owner_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    plan VARCHAR(32) NOT NULL DEFAULT 'Starter' CHECK (plan IN ('Starter', 'PRO', 'Enterprise')),
    logo_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    avatar_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. UMKM DASHBOARD REALTIME KPI CACHE
CREATE TABLE IF NOT EXISTS public.umkm_dashboard_kpis (
    store_id UUID PRIMARY KEY REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    tasks_completed_today INT NOT NULL DEFAULT 126 CHECK (tasks_completed_today >= 0),
    hours_saved_weekly NUMERIC(8,2) NOT NULL DEFAULT 11.00 CHECK (hours_saved_weekly >= 0),
    revenue_generated_today NUMERIC(14,2) NOT NULL DEFAULT 4850000.00 CHECK (revenue_generated_today >= 0),
    today_revenue_trend NUMERIC(5,2) DEFAULT 18.00,
    orders_today_count INT NOT NULL DEFAULT 43 CHECK (orders_today_count >= 0),
    new_customers_today_count INT NOT NULL DEFAULT 12 CHECK (new_customers_today_count >= 0),
    whatsapp_response_rate NUMERIC(5,2) NOT NULL DEFAULT 98.00 CHECK (whatsapp_response_rate BETWEEN 0 AND 100),
    estimated_ai_salary_saved NUMERIC(14,2) NOT NULL DEFAULT 2100000.00 CHECK (estimated_ai_salary_saved >= 0),
    usage_percentage NUMERIC(5,2) NOT NULL DEFAULT 38.00 CHECK (usage_percentage BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. UMKM AI EMPLOYEES
CREATE TABLE IF NOT EXISTS public.umkm_ai_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    agent_code VARCHAR(64) NOT NULL,
    agent_name VARCHAR(128) NOT NULL,
    role_title VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'working' CHECK (status IN ('working', 'idle', 'paused', 'error')),
    avatar_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/ai-agents.png',
    chats_today INT DEFAULT 125,
    chats_solved INT DEFAULT 118,
    posts_count INT DEFAULT 12,
    leads_count INT DEFAULT 18,
    invoices_generated INT DEFAULT 43,
    invoices_overdue INT DEFAULT 0,
    products_managed INT DEFAULT 25,
    inventory_alerts INT DEFAULT 2,
    deals_closed INT DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_ai_emp_store_code_unique UNIQUE (store_id, agent_code)
);

-- 4. UMKM AUTOMATIONS & WORKFLOWS
CREATE TABLE IF NOT EXISTS public.umkm_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(128) NOT NULL,
    action_chain TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    total_runs INT NOT NULL DEFAULT 0 CHECK (total_runs >= 0),
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. UMKM PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS public.umkm_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL DEFAULT 'General',
    price_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (price_idr >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
    image_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/products/default.webp',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_product_sku_store_unique UNIQUE (store_id, sku)
);

-- 6. UMKM CUSTOMERS & LEADS
CREATE TABLE IF NOT EXISTS public.umkm_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    full_name VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'WhatsApp' CHECK (channel IN ('WhatsApp', 'Telegram', 'Instagram', 'Web', 'Direct')),
    phone VARCHAR(32),
    email VARCHAR(255),
    total_spent_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_spent_idr >= 0),
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'lead', 'churned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. UMKM INVOICES & BILLING
CREATE TABLE IF NOT EXISTS public.umkm_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    invoice_code VARCHAR(64) NOT NULL,
    customer_id UUID REFERENCES public.umkm_customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(128) NOT NULL,
    amount_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_idr >= 0),
    amount_usdc NUMERIC(14,4) NOT NULL DEFAULT 0.0000 CHECK (amount_usdc >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_invoice_code_store_unique UNIQUE (store_id, invoice_code)
);

-- 8. UMKM TRANSACTIONS & MULTI-GATEWAY PAYMENTS
CREATE TABLE IF NOT EXISTS public.umkm_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.umkm_invoices(id) ON DELETE SET NULL,
    gateway VARCHAR(32) NOT NULL CHECK (gateway IN ('qris', 'gopay', 'dana', 'ovo', 'stripe', 'solana_pay')),
    amount_idr NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_idr >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'failed')),
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. UMKM REALTIME TIMELINE FEED
CREATE TABLE IF NOT EXISTS public.umkm_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    event_time VARCHAR(16) NOT NULL,
    icon_symbol VARCHAR(32) NOT NULL DEFAULT 'CheckCircle',
    event_text VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. UMKM MARKETPLACE / INTEGRATIONS
CREATE TABLE IF NOT EXISTS public.umkm_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    integration_code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'Messaging',
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    icon_url TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_integration_store_code_unique UNIQUE (store_id, integration_code)
);

-- 11. UMKM KNOWLEDGE BASE DOCUMENTS
CREATE TABLE IF NOT EXISTS public.umkm_knowledge_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'FAQ',
    content TEXT NOT NULL,
    file_path TEXT,
    file_cdn_url TEXT,
    is_trained BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HIGH PERFORMANCE INDEXES FOR REALTIME SCALABILITY
CREATE INDEX IF NOT EXISTS idx_umkm_stores_user_id ON public.umkm_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_store_id ON public.umkm_ai_employees(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_automations_store_status ON public.umkm_automations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_products_store_status ON public.umkm_products(store_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_invoices_store_status ON public.umkm_invoices(store_id, status);
CREATE INDEX IF NOT EXISTS idx_umkm_transactions_store_created ON public.umkm_transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_timeline_store_created ON public.umkm_timeline_events(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_integrations_store_connected ON public.umkm_integrations(store_id, is_connected);
CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_store_created ON public.umkm_knowledge_docs(store_id, created_at DESC);
