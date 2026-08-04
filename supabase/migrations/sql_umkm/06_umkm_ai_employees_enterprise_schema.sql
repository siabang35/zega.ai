-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME SCHEMA
-- Module 06: Enterprise AI Workforce (umkm_ai_employees) Schema & Realtime Support
-- Path: supabase/migrations/sql_umkm/06_umkm_ai_employees_enterprise_schema.sql
-- ============================================================================

-- 1. CREATE TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.umkm_ai_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.umkm_stores(id) ON DELETE CASCADE,
    agent_code VARCHAR(64) NOT NULL,
    agent_name VARCHAR(128),
    role_title VARCHAR(128),
    name VARCHAR(128) DEFAULT 'AI Employee',
    role VARCHAR(128) DEFAULT 'Specialist',
    category VARCHAR(64) DEFAULT 'Support & Ops',
    description TEXT,
    status VARCHAR(32) DEFAULT 'active',
    avatar_path TEXT DEFAULT 'https://cdn.zegaai.site/assets/logo/ai-agents.png',
    capabilities TEXT[] DEFAULT ARRAY['WhatsApp API', 'Supabase RAG']::TEXT[],
    tasks_completed_today INT DEFAULT 125,
    resolution_rate NUMERIC(5,2) DEFAULT 94.20,
    avg_response_time_sec NUMERIC(5,2) DEFAULT 1.20,
    metrics JSONB DEFAULT '{}'::jsonb,
    sparkline_data JSONB DEFAULT '[{"v":20},{"v":45},{"v":78},{"v":95},{"v":125}]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT umkm_ai_emp_code_store_unique UNIQUE (store_id, agent_code)
);

-- 2. DROP LEGACY CHECK CONSTRAINT AND RE-APPLY COMPREHENSIVE STATUS CHECK
ALTER TABLE public.umkm_ai_employees DROP CONSTRAINT IF EXISTS umkm_ai_employees_status_check;
ALTER TABLE public.umkm_ai_employees ADD CONSTRAINT umkm_ai_employees_status_check 
    CHECK (status IN ('active', 'working', 'idle', 'paused', 'warning', 'inactive', 'error'));

-- 3. ALTER TABLE SAFE MIGRATIONS (ENSURE BACKWARD COMPATIBILITY)
ALTER TABLE public.umkm_ai_employees ALTER COLUMN agent_name DROP NOT NULL;
ALTER TABLE public.umkm_ai_employees ALTER COLUMN role_title DROP NOT NULL;
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS name VARCHAR(128) DEFAULT 'AI Employee';
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS role VARCHAR(128) DEFAULT 'Specialist';
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'Support & Ops';
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT ARRAY['WhatsApp API', 'Supabase RAG']::TEXT[];
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS tasks_completed_today INT DEFAULT 125;
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS resolution_rate NUMERIC(5,2) DEFAULT 94.20;
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS avg_response_time_sec NUMERIC(5,2) DEFAULT 1.20;
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.umkm_ai_employees ADD COLUMN IF NOT EXISTS sparkline_data JSONB DEFAULT '[{"v":20},{"v":45},{"v":78},{"v":95},{"v":125}]'::jsonb;

-- 4. HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_store_id ON public.umkm_ai_employees(store_id);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_status ON public.umkm_ai_employees(status);
CREATE INDEX IF NOT EXISTS idx_umkm_ai_employees_category ON public.umkm_ai_employees(category);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.umkm_ai_employees ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR SECURE ACCESS
DROP POLICY IF EXISTS "Public read umkm_ai_employees" ON public.umkm_ai_employees;
CREATE POLICY "Public read umkm_ai_employees" 
    ON public.umkm_ai_employees 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Authenticated users write umkm_ai_employees" ON public.umkm_ai_employees;
CREATE POLICY "Authenticated users write umkm_ai_employees" 
    ON public.umkm_ai_employees 
    FOR ALL 
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 7. REALTIME WEBSOCKET PUBLICATION ENABLEMENT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'umkm_ai_employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_employees;
  END IF;
END $$;

-- 8. DEMO SEED DATA WITH BOTH LEGACY & ENTERPRISE COLUMNS
INSERT INTO public.umkm_ai_employees (
    id, store_id, agent_code, agent_name, role_title, name, role, category, description, status, avatar_path, capabilities, tasks_completed_today, resolution_rate, avg_response_time_sec, metrics, sparkline_data
) VALUES
(
    '22222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'CS_AI_AGENT',
    'Customer Service AI',
    'Support & Ops Specialist',
    'Customer Service AI',
    'Support & Ops Specialist',
    'Support & Ops',
    'Auto-responds customer inquiries across WhatsApp, Instagram DM, and Shopee 24/7.',
    'active',
    'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
    ARRAY['WhatsApp API', 'Supabase RAG', 'IG DM Bot'],
    125,
    94.20,
    1.20,
    '{"m1Label": "Chats Today", "m1Val": "125 chats", "m2Label": "Resolution Rate", "m2Val": "94.2%", "m3Label": "Avg Response", "m3Val": "1.2s"}'::jsonb,
    '[{"v":20},{"v":45},{"v":78},{"v":95},{"v":125}]'::jsonb
),
(
    '33333333-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'MKT_AI_AGENT',
    'Marketing Content AI',
    'Social Media Manager',
    'Marketing Content AI',
    'Social Media Manager',
    'Marketing',
    'Generates viral social posts, schedules IG/TikTok feeds, and monitors engagement.',
    'active',
    'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    ARRAY['AI Image Gen', 'TikTok API', 'Auto Schedule'],
    42,
    88.50,
    2.10,
    '{"m1Label": "Posts Gen", "m1Val": "12 posts", "m2Label": "Active Campaign", "m2Val": "3 live", "m3Label": "Engagement Rate", "m3Val": "7.8%"}'::jsonb,
    '[{"v":4},{"v":6},{"v":8},{"v":10},{"v":12}]'::jsonb
),
(
    '44444444-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'FIN_AI_AGENT',
    'Finance & Billing AI',
    'Financial Analyst & Invoicing',
    'Finance & Billing AI',
    'Financial Analyst & Invoicing',
    'Finance',
    'Creates invoices, sends payment reminders, and auto-reconciles bank transactions.',
    'active',
    'https://cdn.zegaai.site/assets/logo/ai-agents.png',
    ARRAY['Invoice Engine', 'Bank Sync', 'Payment Gateway'],
    65,
    99.10,
    0.80,
    '{"m1Label": "Invoices Sent", "m1Val": "43 sent", "m2Label": "Reminders Sent", "m2Val": "15 sent", "m3Label": "Outstanding", "m3Val": "8 pending"}'::jsonb,
    '[{"v":10},{"v":22},{"v":31},{"v":38},{"v":43}]'::jsonb
),
(
    '55555555-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'STR_AI_AGENT',
    'Store Inventory AI',
    'E-Commerce Operations',
    'Store Inventory AI',
    'E-Commerce Operations',
    'E-Commerce',
    'Syncs product stock across channels, flags low inventory, and processes orders.',
    'active',
    'https://cdn.zegaai.site/assets/products/default.webp',
    ARRAY['Stock Sync', 'Order Pipeline', 'Low Stock Alert'],
    89,
    96.40,
    1.50,
    '{"m1Label": "Products Sync", "m1Val": "25 today", "m2Label": "Low Stock Alert", "m2Val": "2 items", "m3Label": "Orders Processed", "m3Val": "17 today"}'::jsonb,
    '[{"v":5},{"v":12},{"v":18},{"v":22},{"v":25}]'::jsonb
),
(
    '66666666-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'SLS_AI_AGENT',
    'Sales & Closing AI',
    'Sales Strategist',
    'Sales & Closing AI',
    'Sales Strategist',
    'Sales',
    'Follows up leads, converts inquiries to paid sales, and executes cross-sell offers.',
    'active',
    'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    ARRAY['Lead Scoring', 'CRM Pipeline', 'Upsell Trigger'],
    34,
    91.00,
    1.80,
    '{"m1Label": "Leads Followed", "m1Val": "18 leads", "m2Label": "Deals Closed", "m2Val": "7 deals", "m3Label": "Revenue Added", "m3Val": "Rp2.100.000"}'::jsonb,
    '[{"v":2},{"v":5},{"v":10},{"v":14},{"v":18}]'::jsonb
),
(
    '77777777-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'WA_AI_AGENT',
    'WhatsApp Commerce AI',
    'WhatsApp Business Agent',
    'WhatsApp Commerce AI',
    'WhatsApp Business Agent',
    'Sales & WA',
    'Drives high-converting automated product catalog sales via official WA Business API.',
    'active',
    'https://cdn.zegaai.site/assets/logo/ai-agents.png',
    ARRAY['WA Catalog API', 'Auto Checkout', 'Multi-agent Router'],
    98,
    95.80,
    0.90,
    '{"m1Label": "Messages Handled", "m1Val": "98 chats", "m2Label": "Orders Received", "m2Val": "23 orders", "m3Label": "Conversion Rate", "m3Val": "23.5%"}'::jsonb,
    '[{"v":20},{"v":45},{"v":78},{"v":95},{"v":125}]'::jsonb
),
(
    '88888888-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'RES_AI_AGENT',
    'Product Research AI',
    'Market Intelligence Agent',
    'Product Research AI',
    'Market Intelligence Agent',
    'Intelligence',
    'Analyzes market trends, competitor pricing, and buyer sentiment automatically.',
    'warning',
    'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
    ARRAY['Web Scraping', 'Trend Model', 'Competitor Tracker'],
    15,
    82.00,
    3.50,
    '{"m1Label": "Research Done", "m1Val": "3 reports", "m2Label": "New Insights", "m2Val": "7 items", "m3Label": "Model Accuracy", "m3Val": "82%"}'::jsonb,
    '[{"v":4},{"v":6},{"v":8},{"v":10},{"v":12}]'::jsonb
)
ON CONFLICT (store_id, agent_code) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    role_title = EXCLUDED.role_title,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    avatar_path = EXCLUDED.avatar_path,
    capabilities = EXCLUDED.capabilities,
    tasks_completed_today = EXCLUDED.tasks_completed_today,
    resolution_rate = EXCLUDED.resolution_rate,
    avg_response_time_sec = EXCLUDED.avg_response_time_sec,
    metrics = EXCLUDED.metrics,
    sparkline_data = EXCLUDED.sparkline_data,
    updated_at = NOW();
