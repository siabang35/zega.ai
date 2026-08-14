-- ============================================================================
-- ZEGA AI PLATFORM - UMKM REALTIME WORKFORCE & ZEROCLAW / 9ROUTER MODELS
-- Path: supabase/migrations/sql_umkm/28_umkm_ai_workforce_real_logos_and_telemetry.sql
-- Description: Fully hardened migration fixing trigger column mismatch (fn_log_umkm_timeline_event),
--              updating umkm_ai_employees table with real ZeroClaw Gateway and 9Router model routing
--              specifications, local/CDN logo URLs (/assets/logo/...), and ON CONFLICT (id) DO UPDATE safety.
-- ============================================================================

-- 1. FIX TRIGGER FUNCTION TO USE REAL COLUMNS ON umkm_timeline_events (FIXES ERROR 42703)
CREATE OR REPLACE FUNCTION public.fn_log_umkm_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_TABLE_NAME = 'umkm_ai_employees' THEN
        INSERT INTO public.umkm_timeline_events (
            store_id, 
            event_time, 
            icon_symbol, 
            event_text, 
            created_at
        )
        VALUES (
            NEW.store_id, 
            TO_CHAR(NOW(), 'HH24:MI'), 
            'Bot', 
            'Deployed AI Swarm Agent: ' || COALESCE(NEW.agent_name, NEW.name, 'AI Employee') || ' (' || COALESCE(NEW.role, 'Specialist') || ')', 
            NOW()
        );
    ELSIF TG_TABLE_NAME = 'umkm_transactions' THEN
        INSERT INTO public.umkm_timeline_events (
            store_id, 
            event_time, 
            icon_symbol, 
            event_text, 
            created_at
        )
        VALUES (
            NEW.store_id, 
            TO_CHAR(NOW(), 'HH24:MI'), 
            'CheckCircle', 
            'New Transaction Recorded: Rp' || TRIM(TO_CHAR(NEW.amount_idr, '999,999,999,999')), 
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 2. UPDATE DEFAULT AVATAR COLUMN TO LOCAL HIGH-RES LOGO
ALTER TABLE public.umkm_ai_employees 
    ALTER COLUMN avatar_path SET DEFAULT '/assets/logo/ai-agents.png';

-- 3. UPDATE EXISTING AGENTS WITH HIGH-RESOLUTION LOCAL LOGOS
UPDATE public.umkm_ai_employees 
SET avatar_path = '/assets/logo/ai-agents.png'
WHERE avatar_path LIKE '%ai-avatar.png%' OR avatar_path LIKE '%default.webp%' OR avatar_path IS NULL OR avatar_path = '';

-- 4. UPSERT REAL PRODUCTION ZEROCLAW & 9ROUTER AI WORKFORCE SWARM NODES
INSERT INTO public.umkm_ai_employees (
    id, store_id, agent_code, agent_name, role_title, name, role, category, description, status, avatar_path, capabilities, tasks_completed_today, resolution_rate, avg_response_time_sec, metrics, sparkline_data
) VALUES
(
    '22222222-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'CS_AI_AGENT',
    'Omnichannel Customer Service AI',
    'ZeroClaw Swarm Node (9router/gpt-4o-mini)',
    'Omnichannel Customer Service AI',
    'ZeroClaw Swarm Node (9router/gpt-4o-mini)',
    'Support & Ops',
    'ZeroClaw autonomous agent auto-responding customer inquiries across WhatsApp, IG DM, and Shopee using Supabase RAG knowledge base via 9Router gateway.',
    'active',
    '/assets/logo/ai-agents.png',
    ARRAY['WhatsApp API', '9Router / GPT-4o-mini', 'Supabase RAG', 'IG DM Bot'],
    125,
    94.20,
    1.20,
    '{"m1Label": "Chats Today", "m1Val": "125 chats", "m2Label": "Model Provider", "m2Val": "9router/gpt-4o-mini", "m3Label": "Avg Response", "m3Val": "1.2s"}'::jsonb,
    '[{"v":20},{"v":45},{"v":78},{"v":95},{"v":125}]'::jsonb
),
(
    '33333333-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'MKT_AI_AGENT',
    'Viral TikTok & IG Campaign AI',
    'ZeroClaw Swarm Node (9router/claude-3.5-sonnet)',
    'Viral TikTok & IG Campaign AI',
    'ZeroClaw Swarm Node (9router/claude-3.5-sonnet)',
    'Marketing',
    'Generates viral short video scripts, creates promo banners, and auto-posts across TikTok & IG using Anthropic Claude 3.5 Sonnet on 9Router.',
    'active',
    '/assets/logo/claude.webp',
    ARRAY['Claude 3.5 Sonnet', 'TikTok API', 'Banner Studio', 'Auto Schedule'],
    42,
    88.50,
    2.10,
    '{"m1Label": "Posts Gen", "m1Val": "12 posts", "m2Label": "Model Provider", "m2Val": "9router/claude-3.5-sonnet", "m3Label": "Engagement Rate", "m3Val": "7.8%"}'::jsonb,
    '[{"v":4},{"v":6},{"v":8},{"v":10},{"v":12}]'::jsonb
),
(
    '44444444-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'FIN_AI_AGENT',
    'Automated Invoice & Reconciliation AI',
    'ZeroClaw Swarm Node (9router/qwen-2.5-coder)',
    'Automated Invoice & Reconciliation AI',
    'ZeroClaw Swarm Node (9router/qwen-2.5-coder)',
    'Finance',
    'Creates electronic invoices, sends WA payment links, and reconciles incoming bank transfers via Qwen 2.5 Coder code synthesis.',
    'active',
    '/assets/logo/stripe.webp',
    ARRAY['Qwen 2.5 Coder', 'Payment Gateway', 'Bank Reconciliation', 'Solana Pay'],
    65,
    99.10,
    0.80,
    '{"m1Label": "Invoices Sent", "m1Val": "43 sent", "m2Label": "Model Provider", "m2Val": "9router/qwen-2.5-coder", "m3Label": "Outstanding", "m3Val": "8 pending"}'::jsonb,
    '[{"v":10},{"v":22},{"v":31},{"v":38},{"v":43}]'::jsonb
),
(
    '55555555-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'STR_AI_AGENT',
    'Shopee & Tokopedia Stock Router AI',
    'ZeroClaw Swarm Node (9router/llama-3.3-70b)',
    'Shopee & Tokopedia Stock Router AI',
    'ZeroClaw Swarm Node (9router/llama-3.3-70b)',
    'E-Commerce',
    'Synchronizes product inventory in real-time across Shopee, Tokopedia, and offline POS using Meta Llama 3.3 70B Instruct.',
    'active',
    '/assets/logo/shopee.png',
    ARRAY['Llama 3.3 70B', 'Multi-channel Sync', 'Stock Alert', 'Order Dispatch'],
    89,
    96.40,
    1.50,
    '{"m1Label": "Products Sync", "m1Val": "25 today", "m2Label": "Model Provider", "m2Val": "9router/llama-3.3-70b", "m3Label": "Orders Processed", "m3Val": "17 today"}'::jsonb,
    '[{"v":5},{"v":12},{"v":18},{"v":22},{"v":25}]'::jsonb
),
(
    '66666666-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'SLS_AI_AGENT',
    'B2B Sales Closing & Upsell AI',
    'ZeroClaw Swarm Node (9router/mistral-large)',
    'B2B Sales Closing & Upsell AI',
    'ZeroClaw Swarm Node (9router/mistral-large)',
    'Sales',
    'Follows up pending buyer quotes, executes personalized discount triggers, and closes deals via Mistral Large 2411 on 9Router.',
    'active',
    '/assets/logo/gpt.webp',
    ARRAY['Mistral Large', 'CRM Pipeline', 'Lead Scoring', 'Auto Upsell'],
    34,
    91.00,
    1.80,
    '{"m1Label": "Leads Followed", "m1Val": "18 leads", "m2Label": "Model Provider", "m2Val": "9router/mistral-large", "m3Label": "Revenue Added", "m3Val": "Rp2.100.000"}'::jsonb,
    '[{"v":2},{"v":5},{"v":10},{"v":14},{"v":18}]'::jsonb
),
(
    '77777777-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'WA_AI_AGENT',
    'WhatsApp Broadcast Bot AI',
    'ZeroClaw Swarm Node (zeroclaw/deepseek-r1)',
    'WhatsApp Broadcast Bot AI',
    'ZeroClaw Swarm Node (zeroclaw/deepseek-r1)',
    'Marketing',
    'Executes targeted WhatsApp broadcast campaigns and analyzes response metrics via ZeroClaw DeepSeek R1 reasoning swarm.',
    'active',
    '/assets/logo/deepseek.webp',
    ARRAY['DeepSeek R1', 'WhatsApp API', 'Broadcast Engine', 'Audience Tagging'],
    98,
    95.80,
    0.90,
    '{"m1Label": "Chats Today", "m1Val": "125 chats", "m2Label": "Model Provider", "m2Val": "zeroclaw/deepseek-r1", "m3Label": "Avg Response", "m3Val": "0.9s"}'::jsonb,
    '[{"v":20},{"v":45},{"v":78},{"v":95},{"v":125}]'::jsonb
),
(
    '88888888-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'RES_AI_AGENT',
    'Product Research AI',
    'ZeroClaw Swarm Node (9router/gemini-1.5-pro)',
    'Product Research AI',
    'ZeroClaw Swarm Node (9router/gemini-1.5-pro)',
    'Intelligence',
    'Analyzes market trends, competitor pricing, and buyer sentiment automatically via Google Gemini 1.5 Pro multimodal engine.',
    'active',
    '/assets/logo/gemini.png',
    ARRAY['Gemini 1.5 Pro', 'Web Scraping', 'Trend Model', 'Competitor Tracker'],
    15,
    82.00,
    3.50,
    '{"m1Label": "Research Done", "m1Val": "3 reports", "m2Label": "Model Provider", "m2Val": "9router/gemini-1.5-pro", "m3Label": "Model Accuracy", "m3Val": "82%"}'::jsonb,
    '[{"v":4},{"v":6},{"v":8},{"v":10},{"v":12}]'::jsonb
),
(
    '99999999-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'ESCAL_AI_AGENT',
    'Support Swarm Escalation AI',
    'ZeroClaw Swarm Node (zeroclaw/human-handoff)',
    'Support Swarm Escalation AI',
    'ZeroClaw Swarm Node (zeroclaw/human-handoff)',
    'Support & Ops',
    'Handles complex customer complaints, escalates to human agents, and logs ticket status via ZeroClaw daemon SLA engine.',
    'active',
    '/assets/logo/9router.png',
    ARRAY['ZeroClaw Daemon', 'Ticket Escalation', 'Human Handoff', 'SLA Manager'],
    15,
    92.00,
    1.10,
    '{"m1Label": "Tasks Executed", "m1Val": "125 tasks", "m2Label": "Model Provider", "m2Val": "zeroclaw/daemon-v0.8.3", "m3Label": "SLA Compliance", "m3Val": "99.4%"}'::jsonb,
    '[{"v":4},{"v":6},{"v":8},{"v":10},{"v":12}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    store_id = EXCLUDED.store_id,
    agent_code = EXCLUDED.agent_code,
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

-- 5. ENSURE REALTIME PUBLICATION INCLUDES TABLE
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
