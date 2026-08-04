-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 05: High-Quality Production Seed Data (R2 CDN Mapped)
-- Path: supabase/migrations/sql_umkm/05_umkm_seed_realtime_demo_data.sql
-- ============================================================================

DO $$
DECLARE
    v_demo_user_id UUID := '00000000-0000-0000-0000-000000000000'::uuid;
    v_store_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
    -- 0. ENSURE GUEST DEMO USER EXISTS IN auth.users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        )
        VALUES (
            v_demo_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'guest@zegaai.site',
            '$2a$10$abcdefghijklmnopqrstuv',
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Guest Explorer"}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 1. SEED DEMO STORE
    INSERT INTO public.umkm_stores (
        id, user_id, store_id_code, store_name, owner_name, email, phone, plan, logo_path, avatar_path
    )
    VALUES (
        v_store_id,
        v_demo_user_id,
        'STORE-DEMO-1283',
        'Guest Store',
        'Guest Explorer',
        'guest@zegaai.site',
        '+6281234567890',
        'Starter',
        'https://cdn.zegaai.site/assets/logo/zegalogo.png',
        'https://cdn.zegaai.site/assets/visualization/ai-avatar.png'
    )
    ON CONFLICT (id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        plan = EXCLUDED.plan,
        updated_at = NOW();

    -- 2. SEED DASHBOARD REALTIME KPIS
    INSERT INTO public.umkm_dashboard_kpis (
        store_id,
        tasks_completed_today,
        hours_saved_weekly,
        revenue_generated_today,
        today_revenue_trend,
        orders_today_count,
        new_customers_today_count,
        whatsapp_response_rate,
        estimated_ai_salary_saved,
        usage_percentage,
        updated_at
    )
    VALUES (
        v_store_id,
        126,
        11.00,
        4850000.00,
        18.00,
        43,
        12,
        98.00,
        2100000.00,
        38.00,
        NOW()
    )
    ON CONFLICT (store_id) DO UPDATE SET
        tasks_completed_today = EXCLUDED.tasks_completed_today,
        revenue_generated_today = EXCLUDED.revenue_generated_today,
        updated_at = NOW();

    -- 3. SEED 7 AI EMPLOYEES
    INSERT INTO public.umkm_ai_employees (store_id, agent_code, agent_name, role_title, status, avatar_path, chats_today, chats_solved, posts_count, leads_count, invoices_generated, invoices_overdue, products_managed, inventory_alerts, deals_closed)
    VALUES
        (v_store_id, 'cs_agent', 'Customer Service AI', 'Customer Service AI', 'working', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 125, 118, 0, 0, 0, 0, 0, 0, 0),
        (v_store_id, 'mkt_agent', 'Marketing AI', 'Marketing AI', 'working', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 0, 0, 12, 18, 0, 0, 0, 0, 0),
        (v_store_id, 'fin_agent', 'Finance AI', 'Finance AI', 'working', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 0, 0, 0, 0, 43, 0, 0, 0, 0),
        (v_store_id, 'store_agent', 'Store AI', 'Store AI', 'working', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 0, 0, 0, 0, 0, 0, 25, 2, 0),
        (v_store_id, 'sales_agent', 'Sales AI', 'Sales AI', 'working', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 0, 0, 0, 0, 0, 0, 0, 0, 7),
        (v_store_id, 'copy_agent', 'Copywriting AI', 'Content Creator', 'idle', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 0, 0, 5, 0, 0, 0, 0, 0, 0),
        (v_store_id, 'data_agent', 'Analytics AI', 'Business Intelligence', 'working', 'https://cdn.zegaai.site/assets/logo/ai-agents.png', 0, 0, 0, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (store_id, agent_code) DO UPDATE SET
        status = EXCLUDED.status,
        chats_today = EXCLUDED.chats_today,
        updated_at = NOW();

    -- 4. SEED AUTOMATIONS
    INSERT INTO public.umkm_automations (store_id, name, trigger_event, action_chain, status, total_runs, last_run_at)
    VALUES
        (v_store_id, 'Payment Reminder -> WA -> Email -> Update Status', 'Order Invoice Unpaid', ARRAY['Send WhatsApp', 'Send Email', 'Update CRM Status'], 'active', 142, NOW() - INTERVAL '15 mins'),
        (v_store_id, 'Auto Stock Alert -> Restock Notification', 'Inventory < 5', ARRAY['Send Push Notification', 'Email Supplier'], 'active', 28, NOW() - INTERVAL '2 hours'),
        (v_store_id, 'Welcome Promo -> New Customer WA', 'Customer Registered', ARRAY['Send WA Discount Coupon'], 'active', 89, NOW() - INTERVAL '10 mins');

    -- 5. SEED TIMELINE EVENTS
    INSERT INTO public.umkm_timeline_events (store_id, event_time, icon_symbol, event_text, created_at)
    VALUES
        (v_store_id, '08.00', 'MessageSquare', 'Customer asked price', NOW() - INTERVAL '35 mins'),
        (v_store_id, '08.01', 'Bot', 'AI replied', NOW() - INTERVAL '34 mins'),
        (v_store_id, '08.02', 'ShoppingBag', 'Customer purchased', NOW() - INTERVAL '33 mins'),
        (v_store_id, '08.03', 'FileText', 'Invoice generated', NOW() - INTERVAL '32 mins'),
        (v_store_id, '08.04', 'CheckCircle', 'Payment confirmed', NOW() - INTERVAL '31 mins'),
        (v_store_id, '08.05', 'Send', 'WhatsApp thank you sent', NOW() - INTERVAL '30 mins');

    -- 6. SEED MARKETPLACE INTEGRATIONS
    INSERT INTO public.umkm_integrations (store_id, integration_code, name, category, is_connected, icon_url, config)
    VALUES
        (v_store_id, 'whatsapp', 'WhatsApp Business API', 'Messaging', TRUE, 'https://cdn.zegaai.site/assets/logo/whatsapp.svg', '{"phone":"+6281234567890"}'::jsonb),
        (v_store_id, 'shopee', 'Shopee Store Sync', 'E-Commerce', TRUE, 'https://cdn.zegaai.site/assets/logo/shopee.svg', '{"store_name":"Toko Official"}'::jsonb),
        (v_store_id, 'instagram', 'Instagram Direct Bot', 'Social Media', TRUE, 'https://cdn.zegaai.site/assets/logo/instagram.svg', '{"handle":"@tokoumkm"}'::jsonb),
        (v_store_id, 'qris', 'QRIS Payment Gateway', 'Payments', TRUE, 'https://cdn.zegaai.site/assets/logo/qris.svg', '{"merchant_id":"QRIS-1283"}'::jsonb)
    ON CONFLICT (store_id, integration_code) DO UPDATE SET
        is_connected = EXCLUDED.is_connected,
        updated_at = NOW();

    -- 7. SEED KNOWLEDGE DOCUMENTS
    INSERT INTO public.umkm_knowledge_docs (store_id, title, category, content, is_trained)
    VALUES
        (v_store_id, 'Daftar Harga & Katalog Produk 2026', 'Katalog', 'Katalog lengkap produk UMKM beserta harga IDR dan diskon grosir.', TRUE),
        (v_store_id, 'Kebijakan Pengiriman & Garansi Retur', 'Kebijakan', 'Garansi retur 7 hari kerja untuk produk cacat manufaktur.', TRUE);

END $$;
