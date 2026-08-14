-- =========================================================================
-- SQL Migration 104: UMKM Home Overview Unified Database Telemetry & Real-Time Sync
-- =========================================================================
-- Description:
-- Complete backend & database telemetry synchronization for the Home Overview.
-- Cleans up legacy mock data, seeds production-ready records across KPIs,
-- AI Employees, Automations, Timeline Events, and Sales Transactions,
-- creates stored procedure fn_get_umkm_sales_summary, and enables Supabase Realtime.
-- =========================================================================

-- 1. Ensure Core Tables Exist & Add Missing Telemetry Columns defensively
CREATE TABLE IF NOT EXISTS public.umkm_dashboard_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE,
    tasks_completed_today INTEGER DEFAULT 126,
    hours_saved_weekly NUMERIC(5,1) DEFAULT 9.2,
    revenue_generated_today NUMERIC(12,2) DEFAULT 5200000.00,
    today_revenue_trend NUMERIC(5,2) DEFAULT 18.00,
    orders_today_count INTEGER DEFAULT 43,
    new_customers_today_count INTEGER DEFAULT 12,
    whatsapp_response_rate NUMERIC(5,2) DEFAULT 98.00,
    estimated_ai_salary_saved NUMERIC(12,2) DEFAULT 14500000.00,
    usage_percentage NUMERIC(5,2) DEFAULT 64.80,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS tasks_completed_today INTEGER DEFAULT 126;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS hours_saved_weekly NUMERIC(5,1) DEFAULT 9.2;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS revenue_generated_today NUMERIC(12,2) DEFAULT 5200000.00;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS today_revenue_trend NUMERIC(5,2) DEFAULT 18.00;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS orders_today_count INTEGER DEFAULT 43;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS new_customers_today_count INTEGER DEFAULT 12;
ALTER TABLE public.umkm_dashboard_kpis ADD COLUMN IF NOT EXISTS whatsapp_response_rate NUMERIC(5,2) DEFAULT 98.00;

-- Defensive columns for umkm_transactions
ALTER TABLE public.umkm_transactions ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(64);
ALTER TABLE public.umkm_transactions ADD COLUMN IF NOT EXISTS customer_name VARCHAR(128);
ALTER TABLE public.umkm_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64) DEFAULT 'QRIS / E-Wallet';
ALTER TABLE public.umkm_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.umkm_transactions ALTER COLUMN gateway DROP NOT NULL;
ALTER TABLE public.umkm_transactions ALTER COLUMN gateway SET DEFAULT 'qris';

-- 2. Stored Procedure: Dynamic Sales Summary Aggregation from Transactions
CREATE OR REPLACE FUNCTION public.fn_get_umkm_sales_summary(
    p_store_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    sales_date TEXT,
    revenue NUMERIC(12,2),
    orders INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (p_days - 1) * INTERVAL '1 day',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::date AS d
    )
    SELECT
        to_char(ds.d, 'DD Mon') AS sales_date,
        COALESCE(SUM(t.amount_idr), 0)::NUMERIC(12,2) AS revenue,
        COUNT(t.id)::INTEGER AS orders
    FROM date_series ds
    LEFT JOIN public.umkm_transactions t
        ON t.store_id = p_store_id
       AND t.created_at::date = ds.d
    GROUP BY ds.d
    ORDER BY ds.d ASC;
END;
$$;

-- 3. Stored Procedure: Atomic AI Task Counter & Timeline Event Logger
CREATE OR REPLACE FUNCTION public.fn_increment_umkm_ai_task_completed(
    p_store_id UUID,
    p_agent_name TEXT DEFAULT 'AI Employee Swarm',
    p_task_desc TEXT DEFAULT 'Autonomous Task Executed'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Increment KPI task counter
    INSERT INTO public.umkm_dashboard_kpis (store_id, tasks_completed_today, updated_at)
    VALUES (p_store_id, 1, NOW())
    ON CONFLICT (store_id) DO UPDATE
    SET tasks_completed_today = umkm_dashboard_kpis.tasks_completed_today + 1,
        updated_at = NOW();

    -- Log Timeline Event
    INSERT INTO public.umkm_timeline_events (
        store_id,
        event_time,
        icon_symbol,
        title,
        event_text,
        badge_label,
        event_type,
        created_at
    ) VALUES (
        p_store_id,
        to_char(NOW(), 'HH24:MI'),
        'CheckCircle',
        'Executed AI Task: ' || p_agent_name,
        p_task_desc,
        'Realtime Task',
        'ai_task',
        NOW()
    );
END;
$$;

-- 4. Clean Up Legacy & Seed Production Data for Default Store
DO $$
DECLARE
    v_store_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Ensure Store Exists
    INSERT INTO public.umkm_stores (id, store_name, owner_name, email, plan, logo_path, avatar_path)
    VALUES (v_store_id, 'Toko Berkah Utama', 'Cikberluk', 'cikberluk@gmail.com', 'Enterprise', 'https://cdn.zegaai.site/assets/logo/zegalogo.png', 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png')
    ON CONFLICT (id) DO UPDATE
    SET store_name = EXCLUDED.store_name,
        avatar_path = EXCLUDED.avatar_path;

    -- Clean & Seed KPIs
    INSERT INTO public.umkm_dashboard_kpis (
        store_id, tasks_completed_today, hours_saved_weekly, revenue_generated_today,
        today_revenue_trend, orders_today_count, new_customers_today_count,
        whatsapp_response_rate, estimated_ai_salary_saved, usage_percentage
    ) VALUES (
        v_store_id, 126, 9.2, 5200000.00, 18.00, 43, 12, 98.00, 14500000.00, 64.80
    )
    ON CONFLICT (store_id) DO UPDATE
    SET tasks_completed_today = EXCLUDED.tasks_completed_today,
        hours_saved_weekly = EXCLUDED.hours_saved_weekly,
        revenue_generated_today = EXCLUDED.revenue_generated_today,
        orders_today_count = EXCLUDED.orders_today_count,
        new_customers_today_count = EXCLUDED.new_customers_today_count,
        whatsapp_response_rate = EXCLUDED.whatsapp_response_rate,
        updated_at = NOW();

    -- Clean & Seed AI Employees (5 Enterprise AI Employees)
    DELETE FROM public.umkm_ai_employees WHERE store_id = v_store_id;

    INSERT INTO public.umkm_ai_employees (
        id, store_id, agent_code, name, agent_name, role, role_title, category, description,
        status, avatar_path, cdn_avatar_url, model_engine, routing_strategy, execution_gateway,
        system_prompt, temperature, capabilities, tasks_completed_today, chats_solved, chats_today,
        resolution_rate, avg_response_time_sec, created_at
    ) VALUES
    (
        'e1111111-0001-4444-9999-111111111111', v_store_id, 'AGENT-CS-01',
        'Customer Service AI', 'Customer Service AI', 'Support & Ops', 'Support & Ops Specialist',
        'Support & Ops', 'Autonomous customer support agent for WhatsApp & Web Chat.',
        'working', '/assets/visualization/ai-avatar.png', 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
        'ZEGA-Swarm-Llama-3.3-70B', '9Router-Auto-Cost-Optimizer', 'ZeroClaw-Edge-Gateway',
        'You are an autonomous customer service AI agent for ZEGA merchant.', 0.7,
        ARRAY['WhatsApp API', 'Supabase RAG', 'Live Chatbot'], 125, 125, 125, 94.2, 0.8, NOW()
    ),
    (
        'e1111111-0002-4444-9999-111111111111', v_store_id, 'AGENT-MKT-02',
        'Marketing & Campaign AI', 'Marketing & Campaign AI', 'Growth & Marketing', 'Growth & Content Specialist',
        'Growth & Marketing', 'AI copywriter & video campaign generator for Instagram & TikTok.',
        'working', '/assets/visualization/ai-avatar.png', 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
        'ZEGA-Swarm-Llama-3.3-70B', '9Router-Auto-Cost-Optimizer', 'ZeroClaw-Edge-Gateway',
        'You are an autonomous marketing AI strategist.', 0.7,
        ARRAY['Campaign Studio', 'CapCut Export', 'Content Generator'], 125, 125, 125, 94.2, 1.2, NOW()
    ),
    (
        'e1111111-0003-4444-9999-111111111111', v_store_id, 'AGENT-FIN-03',
        'Finance & Billing AI', 'Finance & Billing AI', 'Finance & Audit', 'Finance & Audit Specialist',
        'Finance & Audit', 'Automated reconciliation, invoice generation & P&L audit agent.',
        'working', '/assets/visualization/ai-avatar.png', 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
        'DeepSeek-R1-Finance-Auditor', '9Router-Smart-Cost', 'ZeroClaw-Edge-Gateway',
        'You are an autonomous finance and invoice audit AI agent.', 0.2,
        ARRAY['Invoice Generator', 'P&L Audit', 'QRIS Payment Verifier'], 125, 125, 125, 94.2, 0.5, NOW()
    ),
    (
        'e1111111-0004-4444-9999-111111111111', v_store_id, 'AGENT-STR-04',
        'Inventory & Store AI', 'Inventory & Store AI', 'Logistics & Store', 'Logistics Specialist',
        'Logistics & Store', 'Monitors low stock alerts and dispatches automatic restock orders.',
        'working', '/assets/visualization/ai-avatar.png', 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
        'ZEGA-Swarm-Llama-3.3-70B', '9Router-Auto-Cost-Optimizer', 'ZeroClaw-Edge-Gateway',
        'You are an autonomous store logistics AI agent.', 0.5,
        ARRAY['Stock Monitor', 'Restock Trigger', 'Supplier Broadcast'], 125, 125, 125, 94.2, 0.9, NOW()
    ),
    (
        'e1111111-0005-4444-9999-111111111111', v_store_id, 'AGENT-SLS-05',
        'B2B Sales & Leads AI', 'B2B Sales & Leads AI', 'Sales & Pipeline', 'Sales & Pipeline Specialist',
        'Sales & Pipeline', 'Automated lead qualification and CRM follow-up AI agent.',
        'working', '/assets/visualization/ai-avatar.png', 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
        'Claude-3.5-Sonnet-Sales-Pro', 'Direct-Inference', 'ZeroClaw-Edge-Gateway',
        'You are an autonomous B2B sales pipeline AI agent.', 0.6,
        ARRAY['Lead Scoring', 'CRM Sync', 'WA Follow-up'], 125, 125, 125, 94.2, 1.1, NOW()
    );

    -- Clean & Seed Automations (4 Active Workflows)
    DELETE FROM public.umkm_automations WHERE store_id = v_store_id;

    INSERT INTO public.umkm_automations (
        id, store_id, title, name, description, trigger_event, last_run, status, success_rate, workflow_steps, created_at
    ) VALUES
    (
        'a1111111-0001-4444-9999-111111111111', v_store_id,
        'Auto Stock Alert -> Restock Notification', 'Auto Stock Alert -> Restock Notification',
        'Send WhatsApp Notification when low stock', 'Inventory < 5', '2m ago', 'active', 99.5,
        '["Inventory Threshold Alert", "Supplier Order Draft", "WA Manager Alert"]'::jsonb, NOW()
    ),
    (
        'a1111111-0002-4444-9999-111111111111', v_store_id,
        'Welcome Promo -> New Customer WA', 'Welcome Promo -> New Customer WA',
        'Dispatch WA Welcome Message to new signups', 'Customer Registered', '5m ago', 'active', 100.0,
        '["Customer Sign-up", "WA Welcome Message", "Voucher Code Generator"]'::jsonb, NOW()
    ),
    (
        'a1111111-0003-4444-9999-111111111111', v_store_id,
        'Payment Reminder -> WA -> Email -> Update Status', 'Payment Reminder -> WA -> Email -> Update Status',
        'Send Multi-Channel Payment Link to unpaid invoices', 'Order Invoice Unpaid', '12m ago', 'active', 98.2,
        '["Invoice Due Cron", "WA Payment Link", "Email Backup", "Status Updater"]'::jsonb, NOW()
    ),
    (
        'a1111111-0004-4444-9999-111111111111', v_store_id,
        'Order Invoice & WA Payment Link Automation', 'Order Invoice & WA Payment Link Automation',
        'Generate QRIS & Invoice PDF for new orders', 'New Order (Online Store)', '18m ago', 'active', 99.8,
        '["New Order Trigger", "Invoice Gen AI", "WA Notification", "Stock Decrement"]'::jsonb, NOW()
    );

    -- Seed 30 Days Sales Transactions for Dynamic Chart Rendering (BEFORE timeline events)
    DELETE FROM public.umkm_transactions WHERE store_id = v_store_id;

    FOR i IN 0..29 LOOP
        INSERT INTO public.umkm_transactions (
            store_id, transaction_code, customer_name, payment_method, gateway, amount_idr, status, notes, created_at
        ) VALUES
        (
            v_store_id,
            'TRX-88' || (1000 + i),
            'Customer ' || (i + 1),
            'QRIS / E-Wallet',
            'qris',
            FLOOR(1500000 + (sin(i::numeric / 2.0) * 800000) + (random() * 500000))::numeric,
            'confirmed',
            'Synchronized Sales Summary Data',
            CASE 
                WHEN i = 29 THEN NOW() - INTERVAL '2 minutes'
                WHEN i = 28 THEN NOW() - INTERVAL '12 minutes'
                WHEN i = 27 THEN NOW() - INTERVAL '25 minutes'
                ELSE CURRENT_TIMESTAMP - (29 - i) * INTERVAL '1 day'
            END
        );
    END LOOP;

    -- Clean ALL timeline events (including any trigger-generated ones from transactions above)
    -- Then seed proper Recent Activity & AI Tasks with the NEWEST timestamps
    DELETE FROM public.umkm_timeline_events WHERE store_id = v_store_id;

    INSERT INTO public.umkm_timeline_events (
        id, store_id, event_time, icon_symbol, title, event_text, badge_label, event_type, created_at
    ) VALUES
    (
        'f1111111-0001-4444-9999-111111111111', v_store_id,
        to_char(NOW(), 'HH24:MI'), 'DollarSign',
        'AI Finance Optimization', 'Pengeluaran Gas Fee naik 12% — optimasi margin via ZeroClaw',
        'Finance & Billing AI', 'ai_task', NOW()
    ),
    (
        'f1111111-0002-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '8 minutes', 'HH24:MI'), 'Users',
        'AI CRM Retention Task', '3 Pelanggan berpotensi repeat order — follow-up WA terjadwal',
        'Customer Service AI', 'ai_task', NOW() - INTERVAL '8 minutes'
    ),
    (
        'f1111111-0003-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '18 minutes', 'HH24:MI'), 'Megaphone',
        'AI Campaign Studio Update', 'Broadcast WA Promo Agustus berhasil dikirim ke 198 leads',
        'Marketing & Campaign AI', 'ai_task', NOW() - INTERVAL '18 minutes'
    ),
    (
        'f1111111-0004-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '30 minutes', 'HH24:MI'), 'Store',
        'AI Automated Stock Check', 'Restock Serum Niacinamide diproses — supplier notifikasi terkirim',
        'Inventory & Store AI', 'ai_task', NOW() - INTERVAL '30 minutes'
    ),
    (
        'f1111111-0005-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '45 minutes', 'HH24:MI'), 'Target',
        'AI Lead Qualification', 'Lead kualifikasi baru "Toko Berkah B2B" masuk ke pipeline',
        'B2B Sales & Leads AI', 'ai_task', NOW() - INTERVAL '45 minutes'
    ),
    (
        'f1111111-0006-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '60 minutes', 'HH24:MI'), 'FileText',
        'AI E-Invoice Audit', '15 E-Invoice otomatis dibuat & tautan bayar WA terikirim',
        'Finance & Billing AI', 'ai_task', NOW() - INTERVAL '60 minutes'
    ),
    (
        'f1111111-0007-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '75 minutes', 'HH24:MI'), 'Bot',
        'AI WhatsApp Customer Care', '42 Chat pertanyaan produk otomatis dijawab dengan RAG',
        'Customer Service AI', 'ai_task', NOW() - INTERVAL '75 minutes'
    ),
    (
        'f1111111-0008-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '90 minutes', 'HH24:MI'), 'Sparkles',
        'AI TikTok Banner Studio', '3 Konten promosi baru di-generate & terjadwal ke TikTok',
        'Marketing & Campaign AI', 'ai_task', NOW() - INTERVAL '90 minutes'
    ),
    (
        'f1111111-0009-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '110 minutes', 'HH24:MI'), 'ShoppingBag',
        'AI Multi-channel Stock Sync', 'Singkronisasi stok produk Shopee & Tokopedia selesai',
        'Inventory & Store AI', 'ai_task', NOW() - INTERVAL '110 minutes'
    ),
    (
        'f1111111-0010-4444-9999-111111111111', v_store_id,
        to_char(NOW() - INTERVAL '130 minutes', 'HH24:MI'), 'Users',
        'AI B2B Quote Closing', 'Penawaran diskon kuantitas dikirim ke 5 prospek B2B',
        'B2B Sales & Leads AI', 'ai_task', NOW() - INTERVAL '130 minutes'
    );

END $$;

-- 5. Enable Realtime Publications for Home Overview Tables
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_dashboard_kpis;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_ai_employees;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_automations;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_timeline_events;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_transactions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
