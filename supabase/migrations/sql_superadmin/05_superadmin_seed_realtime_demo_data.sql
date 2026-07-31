-- ============================================================================
-- ZEGA AI PLATFORM - SUPERADMIN REALTIME CONTROL PLANE SCHEMA
-- Module 05: High-Quality Production Seed Data (R2 CDN Mapped)
-- Path: supabase/migrations/sql_superadmin/05_superadmin_seed_realtime_demo_data.sql
-- ============================================================================

DO $$
DECLARE
    v_superadmin_user_id UUID := '33333333-3333-3333-3333-333333333333'::uuid;
BEGIN
    -- 0. ENSURE ROOT SUPERADMIN USER EXISTS IN auth.users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        )
        VALUES (
            v_superadmin_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'admin@zegaai.site',
            '$2a$10$abcdefghijklmnopqrstuv',
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"SuperAdmin ZEGA Root"}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 1. SEED GLOBAL PLATFORM TELEMETRY KPIS
    DELETE FROM public.superadmin_platform_kpis;
    INSERT INTO public.superadmin_platform_kpis (
        total_mrr_usd, total_arr_usd, active_tenants_count, enterprise_tenants_count,
        active_ai_agents_count, global_requests_per_min, platform_uptime_pct, global_token_usage_billions, updated_at
    )
    VALUES (
        485900.00,
        5830800.00,
        1428,
        184,
        12450,
        142000,
        99.998,
        18.420,
        NOW()
    );

    -- 2. SEED ROOT SUPERADMIN ACCOUNTS
    INSERT INTO public.superadmin_root_accounts (user_id, full_name, email, security_level, hardware_mfa_enforced, ip_whitelist)
    VALUES (
        v_superadmin_user_id,
        'SuperAdmin ZEGA Root',
        'admin@zegaai.site',
        'ROOT_SUPERADMIN',
        TRUE,
        ARRAY['127.0.0.1'::inet, '10.0.0.1'::inet]
    )
    ON CONFLICT (email) DO UPDATE SET
        security_level = EXCLUDED.security_level,
        updated_at = NOW();

    -- 3. SEED TENANT REGISTRY
    INSERT INTO public.superadmin_tenant_registry (tenant_code, tenant_name, category, db_pool_status, dedicated_cluster_url, storage_usage_gb, monthly_revenue_usd, status, logo_path)
    VALUES
        ('TENANT-ACME-01', 'Acme Corporation', 'ENTERPRISE', 'healthy', 'https://acme.zegaai.site', 450.20, 25000.00, 'active', '/assets/logo/zegalogo.png'),
        ('TENANT-JATEVO-02', 'Jatevo Store UMKM', 'UMKM', 'healthy', 'https://jatevo.zegaai.site', 18.50, 450.00, 'active', '/assets/logo/zegalogo.png'),
        ('TENANT-ZEROCLAW-03', 'ZeroClaw Core Cluster', 'ENTERPRISE', 'healthy', 'https://zeroclaw.zegaai.site', 890.00, 48000.00, 'active', '/assets/logo/zeroclaw-logo.png'),
        ('TENANT-FINTECH-04', 'FinTech Global Enterprise', 'ENTERPRISE', 'healthy', 'https://fintech.zegaai.site', 620.40, 35000.00, 'active', '/assets/logo/visa.svg'),
        ('TENANT-RETAIL-05', 'IndoRetail Group', 'UMKM', 'healthy', 'https://indoretail.zegaai.site', 42.10, 1200.00, 'active', '/assets/logo/qris.svg')
    ON CONFLICT (tenant_code) DO UPDATE SET
        db_pool_status = EXCLUDED.db_pool_status,
        monthly_revenue_usd = EXCLUDED.monthly_revenue_usd,
        updated_at = NOW();

    -- 4. SEED SECURITY THREAT LOGS (OWASP SENTINEL)
    INSERT INTO public.superadmin_security_threat_logs (threat_code, threat_type, severity, source_ip, geo_country, status, action_taken, payload)
    VALUES
        ('THREAT-DDOS-901', 'DDOS_ATTEMPT', 'CRITICAL', '185.220.101.5'::inet, 'Germany', 'BLOCKED', 'IP blocked at Cloudflare WAF edge; Token Bucket rate-limiter engaged', '{"pps": 450000}'::jsonb),
        ('THREAT-RATE-902', 'RATE_LIMIT_EXCEEDED', 'MEDIUM', '198.51.100.42'::inet, 'United States', 'BLOCKED', 'API endpoint rate-limited for 300 seconds via fn_check_superadmin_rate_limit', '{"endpoint": "/v1/auth/request-otp"}'::jsonb),
        ('THREAT-CHUNK-903', 'PAYLOAD_CHUNK_OVERFLOW', 'HIGH', '203.0.113.19'::inet, 'Singapore', 'BLOCKED', 'Payload size > 2MB rejected by fn_validate_superadmin_payload_chunk_size', '{"bytes": 4194304}'::jsonb);

    -- 5. SEED INFRASTRUCTURE NODES
    INSERT INTO public.superadmin_infra_nodes (node_code, node_name, node_type, status, latency_ms, load_pct, region, icon_path)
    VALUES
        ('node_cf_edge', 'Cloudflare Global Edge Proxy', 'Cloudflare Edge', 'online', 8, 28.40, 'Global Anycast', '/assets/logo/cloudflare.svg'),
        ('node_snowflake_dw', 'Snowflake Vector Warehouse', 'Snowflake Vault', 'online', 18, 42.10, 'us-east-1', '/assets/logo/snowflake.svg'),
        ('node_aws_s3', 'AWS S3 Object Storage Core', 'AWS S3 Core', 'online', 14, 31.00, 'us-east-1', '/assets/logo/aws-s3.svg'),
        ('node_zeroclaw_master', 'ZeroClaw Autonomous Engine', 'ZeroClaw Master', 'online', 6, 52.80, 'eu-central-1', '/assets/logo/zeroclaw-logo.png'),
        ('node_supabase_db', 'Supabase Postgres Cluster Primary', 'Supabase Postgres', 'online', 10, 39.50, 'ap-southeast-1', '/assets/logo/supabase.png')
    ON CONFLICT (node_code) DO UPDATE SET
        status = EXCLUDED.status,
        load_pct = EXCLUDED.load_pct,
        updated_at = NOW();

END $$;
