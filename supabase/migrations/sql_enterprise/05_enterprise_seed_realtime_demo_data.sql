-- ============================================================================
-- ZEGA AI PLATFORM - ENTERPRISE REALTIME CORE SCHEMA
-- Module 05: High-Quality Production Seed Data (R2 CDN Mapped)
-- Path: supabase/migrations/sql_enterprise/05_enterprise_seed_realtime_demo_data.sql
-- ============================================================================

DO $$
DECLARE
    v_demo_user_id UUID := '22222222-2222-2222-2222-222222222222'::uuid;
    v_org_id UUID := '99999999-9999-9999-9999-999999999999'::uuid;
BEGIN
    -- 0. ENSURE GUEST ENTERPRISE DEMO USER EXISTS IN auth.users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        )
        VALUES (
            v_demo_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'enterprise.guest@zegaai.site',
            '$2a$10$abcdefghijklmnopqrstuv',
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Acme Enterprise Admin"}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 1. SEED DEMO ENTERPRISE ORGANIZATION
    INSERT INTO public.enterprise_organizations (
        id, org_code, name, domain, plan_tier, sso_enabled, max_seats, allocated_gpu_units, region, logo_path
    )
    VALUES (
        v_org_id,
        'ORG-ACME-8842',
        'Acme Corporation',
        'acme.com',
        'Enterprise Custom',
        TRUE,
        500,
        64,
        'us-east-1 (N. Virginia)',
        '/assets/logo/zegalogo.png'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        plan_tier = EXCLUDED.plan_tier,
        updated_at = NOW();

    -- 2. SEED ENTERPRISE MEMBERS & RBAC
    INSERT INTO public.enterprise_members (org_id, user_id, full_name, email, role, mfa_enabled, permissions)
    VALUES
        (v_org_id, v_demo_user_id, 'Danz Assyidq', 'danz@zegaai.site', 'owner', TRUE, '["*"]'::jsonb),
        (v_org_id, NULL, 'Alex Morgan', 'enterprise.guest@zegaai.site', 'admin', TRUE, '["read:*", "write:agents", "execute:mcp", "manage:billing"]'::jsonb),
        (v_org_id, NULL, 'Sarah Chen', 'sarah.secops@acme.com', 'secops', TRUE, '["read:*", "manage:security", "view:audit_logs"]'::jsonb),
        (v_org_id, NULL, 'Michael Scott', 'michael.finops@acme.com', 'finops', TRUE, '["read:*", "view:billing", "manage:budgets"]'::jsonb)
    ON CONFLICT (org_id, email) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();

    -- 3. SEED AI CLUSTERS & COMPUTE WORKERS
    INSERT INTO public.enterprise_ai_clusters (org_id, cluster_code, cluster_name, provider, status, cpu_usage_pct, memory_usage_pct, tpu_gpu_nodes, active_instances, region, icon_path)
    VALUES
        (v_org_id, 'cf_workers', 'Cloudflare Edge Workers', 'Cloudflare Workers', 'healthy', 38.20, 52.10, 16, 64, 'Global CDN', '/assets/logo/cloudflare.svg'),
        (v_org_id, 'snowflake_dw', 'Snowflake AI Data Vault', 'Snowflake', 'healthy', 45.00, 61.40, 8, 16, 'us-east-1', '/assets/logo/snowflake.svg'),
        (v_org_id, 'aws_s3_storage', 'AWS S3 Vector Lake', 'AWS S3', 'healthy', 29.50, 41.00, 12, 32, 'us-east-1', '/assets/logo/aws-s3.svg'),
        (v_org_id, 'salesforce_crm', 'Salesforce AI Pipeline', 'Salesforce', 'healthy', 51.30, 67.80, 4, 8, 'us-west-2', '/assets/logo/salesforce.svg'),
        (v_org_id, 'zeroclaw_node', 'ZeroClaw Autonomous Cluster', 'ZeroClaw Node', 'healthy', 68.40, 74.20, 24, 96, 'eu-central-1', '/assets/logo/zeroclaw-logo.png')
    ON CONFLICT (org_id, cluster_code) DO UPDATE SET
        status = EXCLUDED.status,
        cpu_usage_pct = EXCLUDED.cpu_usage_pct,
        updated_at = NOW();

    -- 4. SEED MCP CONNECTORS
    INSERT INTO public.enterprise_mcp_connectors (org_id, connector_code, name, category, status, latency_ms, icon_path)
    VALUES
        (v_org_id, 'stripe', 'Stripe Billing Vault', 'Financial', 'connected', 18, '/assets/logo/stripe.webp'),
        (v_org_id, 'supabase', 'Supabase Realtime Postgres', 'Database', 'connected', 12, '/assets/logo/supabase.png'),
        (v_org_id, 'slack', 'Slack Operations Bot', 'Messaging', 'connected', 24, '/assets/logo/slack.png'),
        (v_org_id, 'github', 'GitHub CI/CD Runner', 'DevOps', 'connected', 15, '/assets/logo/github.svg'),
        (v_org_id, 'jira', 'Jira Issue Automator', 'Project Mgmt', 'connected', 22, '/assets/logo/Jira.webp'),
        (v_org_id, 'hubspot', 'HubSpot Enterprise CRM', 'Marketing', 'connected', 28, '/assets/logo/hubspot.png')
    ON CONFLICT (org_id, connector_code) DO UPDATE SET
        status = EXCLUDED.status,
        latency_ms = EXCLUDED.latency_ms,
        updated_at = NOW();

    -- 5. SEED ZEROCLAW PIPELINES
    INSERT INTO public.enterprise_orchestrators (org_id, pipeline_code, name, driver, concurrent_workers, throughput_rps, uptime_pct, status)
    VALUES
        (v_org_id, 'zc_pipeline_main', 'ZeroClaw Main Orchestrator', 'ZeroClaw-v2', 32, 2400, 99.99, 'running'),
        (v_org_id, 'realtime_billing_stream', 'Realtime Usage Billing Stream', 'Temporal', 16, 1200, 99.95, 'running'),
        (v_org_id, 'ai_memory_indexer', 'Vector Memory RAG Indexer', 'Airflow', 24, 1800, 99.98, 'running')
    ON CONFLICT (org_id, pipeline_code) DO UPDATE SET
        status = EXCLUDED.status,
        throughput_rps = EXCLUDED.throughput_rps,
        updated_at = NOW();

    -- 6. SEED OWASP AUDIT LOGS
    INSERT INTO public.enterprise_audit_logs (org_id, actor_email, ip_address, event_action, severity, payload)
    VALUES
        (v_org_id, 'danz@zegaai.site', '192.168.1.100'::inet, 'ENTERPRISE_SSO_KEY_ROTATED', 'MEDIUM', '{"key_type": "SAML 2.0"}'::jsonb),
        (v_org_id, 'sarah.secops@acme.com', '10.0.4.12'::inet, 'MCP_SECURITY_AUDIT_PASS', 'LOW', '{"connectors": 6, "status": "all_secure"}'::jsonb),
        (v_org_id, 'system@zegaai.site', '127.0.0.1'::inet, 'ZEROCLAW_CLUSTER_AUTO_SCALED', 'LOW', '{"nodes_added": 4}'::jsonb);

    -- 7. SEED COST INTELLIGENCE
    INSERT INTO public.enterprise_cost_intelligence (org_id, monthly_spend_usd, monthly_budget_usd, tokens_processed_millions, cost_savings_usd, payment_method, payment_logo_path, card_last_four, updated_at)
    VALUES (
        v_org_id,
        14250.00,
        25000.00,
        850.50,
        32400.00,
        'Visa Enterprise',
        '/assets/logo/visa.svg',
        '4242',
        NOW()
    )
    ON CONFLICT (org_id) DO UPDATE SET
        monthly_spend_usd = EXCLUDED.monthly_spend_usd,
        updated_at = NOW();

END $$;
