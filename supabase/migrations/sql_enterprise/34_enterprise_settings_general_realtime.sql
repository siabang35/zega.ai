-- ============================================================================
-- SQL Migration 34: Enterprise Settings & General Module Realtime & CDN Integration
-- Description: Comprehensive database schema, RLS policies, atomic stored
--              procedures, audit logging, and Supabase Realtime publication
--              for Enterprise Settings (General, Security, API, Billing, Notifications,
--              Privacy, Integrations, and Advanced settings).
-- ============================================================================

-- 1. Create Core General Settings Table
CREATE TABLE IF NOT EXISTS public.enterprise_general_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id_code TEXT NOT NULL UNIQUE DEFAULT 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ',
    organization_name TEXT NOT NULL DEFAULT 'Acme Enterprise',
    website TEXT DEFAULT 'https://acme.com',
    description TEXT DEFAULT 'Acme Enterprise is building the future with AI-powered automation.',
    logo_cdn_url TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    primary_contact_email TEXT DEFAULT 'admin@acme.com',
    industry TEXT DEFAULT 'Technology',
    organization_size TEXT DEFAULT '1001+ employees',
    allow_member_invite BOOLEAN DEFAULT TRUE,
    require_2fa_all BOOLEAN DEFAULT FALSE,
    default_project_visibility TEXT DEFAULT 'Private',
    default_dashboard TEXT DEFAULT 'Overview',
    date_format TEXT DEFAULT 'May 27, 2025 (MMM DD, YYYY)',
    time_format TEXT DEFAULT '24-hour (14:30)',
    language TEXT DEFAULT 'English (US)',
    currency TEXT DEFAULT 'USD - US Dollar ($)',
    timezone TEXT DEFAULT '(GMT+7) Asia/Jakarta',
    data_residency TEXT DEFAULT 'Asia Pacific (Singapore)',
    storage_region TEXT DEFAULT 'ap-southeast-1 (AWS Singapore)',
    backup_region TEXT DEFAULT 'ap-southeast-3 (AWS Jakarta)',
    session_timeout_minutes INTEGER DEFAULT 30,
    idle_warning_minutes INTEGER DEFAULT 5,
    allowed_ip_allowlist TEXT[] DEFAULT ARRAY['103.12.45.67', '203.0.113.0/24'],
    active_sessions_count INTEGER DEFAULT 24,
    plan_tier TEXT DEFAULT 'Enterprise Plan',
    status TEXT DEFAULT 'Active',
    environment TEXT DEFAULT 'Production',
    member_since_days INTEGER DEFAULT 142,
    created_at TIMESTAMPTZ DEFAULT NOW() - INTERVAL '142 days',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Settings Audit Logs & Compliance Telemetry Table
CREATE TABLE IF NOT EXISTS public.enterprise_settings_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    actor_avatar_url TEXT,
    severity TEXT DEFAULT 'info',
    category TEXT DEFAULT 'general',
    compliance_status TEXT DEFAULT 'COMPLIANT', -- 'COMPLIANT', 'RECOMMENDED', 'ACTION_REQUIRED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed Initial Demo Data (if empty)
INSERT INTO public.enterprise_general_settings (
    organization_id_code,
    organization_name,
    website,
    description,
    logo_cdn_url,
    primary_contact_email,
    industry,
    organization_size,
    allow_member_invite,
    require_2fa_all,
    default_project_visibility,
    default_dashboard,
    date_format,
    time_format,
    language,
    currency,
    timezone,
    data_residency,
    storage_region,
    backup_region,
    session_timeout_minutes,
    idle_warning_minutes,
    allowed_ip_allowlist,
    active_sessions_count,
    plan_tier,
    status,
    environment
)
SELECT
    'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ',
    'Acme Enterprise',
    'https://acme.com',
    'Acme Enterprise is building the future with AI-powered automation.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    'admin@acme.com',
    'Technology',
    '1001+ employees',
    TRUE,
    FALSE,
    'Private',
    'Overview',
    'May 27, 2025 (MMM DD, YYYY)',
    '24-hour (14:30)',
    'English (US)',
    'USD - US Dollar ($)',
    '(GMT+7) Asia/Jakarta',
    'Asia Pacific (Singapore)',
    'ap-southeast-1 (AWS Singapore)',
    'ap-southeast-3 (AWS Jakarta)',
    30,
    5,
    ARRAY['103.12.45.67', '203.0.113.0/24'],
    24,
    'Enterprise Plan',
    'Active',
    'Production'
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_general_settings);

-- Seed Initial Audit Logs
INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, actor_avatar_url, severity, category, compliance_status, created_at)
SELECT * FROM (VALUES
    ('Organization profile updated', 'Danz Assyidq', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'info', 'general', 'COMPLIANT', NOW() - INTERVAL '2 minutes'),
    ('New member invitation policy enforced', 'Alsa Dwi Nur H.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces', 'info', 'security', 'RECOMMENDED', NOW() - INTERVAL '15 minutes'),
    ('API key generated for production gateway', 'Faris Ramadhan', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', 'warning', 'api', 'COMPLIANT', NOW() - INTERVAL '1 hour'),
    ('Billing payment method updated to Enterprise Invoicing', 'Danz Assyidq', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'info', 'billing', 'COMPLIANT', NOW() - INTERVAL '3 hours'),
    ('Google Workspace SSO policy verified', 'Danz Assyidq', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', 'info', 'security', 'COMPLIANT', NOW() - INTERVAL '5 hours'),
    ('IP Allowlist configuration warning check', 'System Security Bot', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces', 'warning', 'security', 'ACTION_REQUIRED', NOW() - INTERVAL '8 hours'),
    ('Data residency compliance audit verified (AWS Singapore)', 'Compliance Manager', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces', 'info', 'privacy', 'COMPLIANT', NOW() - INTERVAL '12 hours')
) AS t(action, performed_by, actor_avatar_url, severity, category, compliance_status, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_settings_audit_logs);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.enterprise_general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_settings_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Defensive SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS p_enterprise_general_settings_select ON public.enterprise_general_settings;
CREATE POLICY p_enterprise_general_settings_select ON public.enterprise_general_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS p_enterprise_general_settings_update ON public.enterprise_general_settings;
CREATE POLICY p_enterprise_general_settings_update ON public.enterprise_general_settings
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS p_enterprise_settings_audit_logs_select ON public.enterprise_settings_audit_logs;
CREATE POLICY p_enterprise_settings_audit_logs_select ON public.enterprise_settings_audit_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS p_enterprise_settings_audit_logs_insert ON public.enterprise_settings_audit_logs;
CREATE POLICY p_enterprise_settings_audit_logs_insert ON public.enterprise_settings_audit_logs
    FOR INSERT WITH CHECK (true);

-- 6. Atomic Stored Procedures (RPC Functions)

-- RPC 1: Update Organization Profile
CREATE OR REPLACE FUNCTION public.fn_update_organization_profile(
    p_org_name TEXT,
    p_website TEXT,
    p_description TEXT,
    p_primary_contact TEXT,
    p_industry TEXT,
    p_org_size TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        organization_name = COALESCE(NULLIF(p_org_name, ''), organization_name),
        website = COALESCE(p_website, website),
        description = COALESCE(p_description, description),
        primary_contact_email = COALESCE(p_primary_contact, primary_contact_email),
        industry = COALESCE(p_industry, industry),
        organization_size = COALESCE(p_org_size, organization_size),
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Organization profile updated', 'Enterprise Admin', 'general', 'COMPLIANT');

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 2: Update Preferences
CREATE OR REPLACE FUNCTION public.fn_update_organization_preferences(
    p_allow_invite BOOLEAN,
    p_require_2fa BOOLEAN,
    p_visibility TEXT,
    p_default_dashboard TEXT,
    p_date_format TEXT,
    p_time_format TEXT,
    p_language TEXT,
    p_currency TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        allow_member_invite = COALESCE(p_allow_invite, allow_member_invite),
        require_2fa_all = COALESCE(p_require_2fa, require_2fa_all),
        default_project_visibility = COALESCE(p_visibility, default_project_visibility),
        default_dashboard = COALESCE(p_default_dashboard, default_dashboard),
        date_format = COALESCE(p_date_format, date_format),
        time_format = COALESCE(p_time_format, time_format),
        language = COALESCE(p_language, language),
        currency = COALESCE(p_currency, currency),
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Organization preferences & security policy updated', 'Enterprise Admin', 'security', CASE WHEN p_require_2fa THEN 'COMPLIANT' ELSE 'RECOMMENDED' END);

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 3: Update Regional & Data Settings
CREATE OR REPLACE FUNCTION public.fn_update_regional_and_data_settings(
    p_timezone TEXT,
    p_data_residency TEXT,
    p_storage_region TEXT,
    p_backup_region TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        timezone = COALESCE(p_timezone, timezone),
        data_residency = COALESCE(p_data_residency, data_residency),
        storage_region = COALESCE(p_storage_region, storage_region),
        backup_region = COALESCE(p_backup_region, backup_region),
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Regional and Data Residency settings updated', 'Enterprise Admin', 'privacy', 'COMPLIANT');

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 4: Update Session & Security Settings
CREATE OR REPLACE FUNCTION public.fn_update_session_security_settings(
    p_timeout_minutes INTEGER,
    p_idle_warning_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        session_timeout_minutes = COALESCE(p_timeout_minutes, session_timeout_minutes),
        idle_warning_minutes = COALESCE(p_idle_warning_minutes, idle_warning_minutes),
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Session timeout and idle security parameters updated', 'Enterprise Admin', 'security', 'COMPLIANT');

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 5: Upload Logo CDN URL
CREATE OR REPLACE FUNCTION public.fn_upload_organization_logo_cdn(
    p_logo_cdn_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        logo_cdn_url = p_logo_cdn_url,
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Organization logo updated via CDN storage', 'Enterprise Admin', 'general', 'COMPLIANT');

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 6: Add IP Allowlist Rule
CREATE OR REPLACE FUNCTION public.fn_add_ip_allowlist_rule(
    p_ip_rule TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        allowed_ip_allowlist = array_append(allowed_ip_allowlist, p_ip_rule),
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Added IP Allowlist rule: ' || p_ip_rule, 'Enterprise Admin', 'security', 'COMPLIANT');

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 7: Delete IP Allowlist Rule
CREATE OR REPLACE FUNCTION public.fn_delete_ip_allowlist_rule(
    p_ip_rule TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_row public.enterprise_general_settings%ROWTYPE;
BEGIN
    UPDATE public.enterprise_general_settings
    SET
        allowed_ip_allowlist = array_remove(allowed_ip_allowlist, p_ip_rule),
        updated_at = NOW()
    WHERE organization_id_code = 'org_01H8GZ6W7GJ6JZVV8BK3M4VQWZ'
    RETURNING * INTO v_updated_row;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, category, compliance_status)
    VALUES ('Removed IP Allowlist rule: ' || p_ip_rule, 'Enterprise Admin', 'security', 'COMPLIANT');

    RETURN to_jsonb(v_updated_row);
END;
$$;

-- RPC 8: Delete Organization
CREATE OR REPLACE FUNCTION public.fn_delete_organization(
    p_confirm_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_confirm_name != 'Acme Enterprise' THEN
        RAISE EXCEPTION 'Nama konfirmasi organisasi tidak cocok.';
    END IF;

    INSERT INTO public.enterprise_settings_audit_logs (action, performed_by, severity, category, compliance_status)
    VALUES ('CRITICAL: Organization deletion requested', 'Enterprise Admin', 'critical', 'general', 'ACTION_REQUIRED');

    RETURN jsonb_build_object('success', true, 'message', 'Permintaan penghapusan organisasi diterima.');
END;
$$;

-- 8. Create API Keys Table
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL DEFAULT 'zega_live_',
    key_masked TEXT NOT NULL DEFAULT 'zega_live_••••',
    environment TEXT NOT NULL DEFAULT 'Production',
    permissions TEXT NOT NULL DEFAULT 'Full Access',
    last_used TEXT DEFAULT 'Just now',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure missing columns are added if table existed prior
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS key_prefix TEXT DEFAULT 'zega_live_';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS key_masked TEXT DEFAULT 'zega_live_••••';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'Production';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT 'Full Access';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS last_used TEXT DEFAULT 'Just now';
ALTER TABLE public.enterprise_api_keys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';


-- 9. Create Billing Invoices Table
CREATE TABLE IF NOT EXISTS public.enterprise_billing_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    status TEXT DEFAULT 'Paid',
    download_url TEXT DEFAULT '#'
);

-- 10. Create Security Events Table
CREATE TABLE IF NOT EXISTS public.enterprise_security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TEXT NOT NULL,
    event TEXT NOT NULL,
    user_email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    status TEXT DEFAULT 'Success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create Notifications Config Table
CREATE TABLE IF NOT EXISTS public.enterprise_notifications_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    slack_notifications BOOLEAN DEFAULT TRUE,
    webhook_notifications BOOLEAN DEFAULT TRUE,
    security_alerts BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    billing_alerts BOOLEAN DEFAULT TRUE,
    usage_alerts BOOLEAN DEFAULT TRUE,
    product_updates BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed API Keys (matching screenshot)
INSERT INTO public.enterprise_api_keys (name, key_prefix, key_masked, environment, permissions, last_used, status)
SELECT * FROM (VALUES
    ('Production Key', 'zega_live_', 'zega_live_••••••••••••3a9b', 'Production', 'Full Access', '2 mins ago', 'Active'),
    ('Development Key', 'zega_dev_', 'zega_dev_••••••••••••f9c2', 'Development', 'Read / Write', '1 hour ago', 'Active'),
    ('CI/CD Key', 'zega_cicd_', 'zega_cicd_••••••••••••e18d', 'Production', 'Read Only', '3 hours ago', 'Active'),
    ('Billing Key', 'zega_billing_', 'zega_billing_••••••••••••8b2f', 'Production', 'Billing', '1 day ago', 'Inactive'),
    ('Analytics Key', 'zega_analytics_', 'zega_analytics_••••••••••••5c4a', 'Development', 'Analytics', '2 days ago', 'Active')
) AS t(name, key_prefix, key_masked, environment, permissions, last_used, status)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_api_keys);

-- Seed Billing Invoices (matching screenshot)
INSERT INTO public.enterprise_billing_invoices (invoice_number, date, amount, status)
SELECT * FROM (VALUES
    ('INV-2025-05-001', 'May 10, 2025', '$1,250.00', 'Paid'),
    ('INV-2025-04-001', 'Apr 10, 2025', '$1,250.00', 'Paid'),
    ('INV-2025-03-001', 'Mar 10, 2025', '$1,250.00', 'Paid'),
    ('INV-2025-02-001', 'Feb 10, 2025', '$1,250.00', 'Paid'),
    ('INV-2025-01-001', 'Jan 10, 2025', '$1,250.00', 'Paid')
) AS t(invoice_number, date, amount, status)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_billing_invoices);

-- Seed Security Events (matching screenshot)
INSERT INTO public.enterprise_security_events (timestamp, event, user_email, ip_address, status)
SELECT * FROM (VALUES
    ('May 27, 2025 10:30:45 AM', 'User login successful', 'cole.coa@zegaai.com', '103.12.45.67', 'Success'),
    ('May 27, 2025 10:18:12 AM', 'MFA verification', 'sarah.admin@zegaai.com', '185.54.21.123', 'Success'),
    ('May 27, 2025 09:25:30 AM', 'Password changed', 'danz.admin@zegaai.com', '54.220.39.95', 'Success'),
    ('May 27, 2025 08:35:11 AM', 'Failed login attempt', 'api-service', '203.0.113.45', 'Failed')
) AS t(timestamp, event, user_email, ip_address, status)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_security_events);

-- Seed Notifications Config
INSERT INTO public.enterprise_notifications_config (email_notifications, in_app_notifications, slack_notifications, webhook_notifications, security_alerts, system_alerts, billing_alerts, usage_alerts, product_updates)
SELECT TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_notifications_config);

-- RLS & Policies
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_notifications_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_enterprise_api_keys_select ON public.enterprise_api_keys FOR SELECT USING (true);
CREATE POLICY p_enterprise_api_keys_all ON public.enterprise_api_keys FOR ALL USING (true);
CREATE POLICY p_enterprise_billing_invoices_select ON public.enterprise_billing_invoices FOR SELECT USING (true);
CREATE POLICY p_enterprise_security_events_select ON public.enterprise_security_events FOR SELECT USING (true);
CREATE POLICY p_enterprise_notifications_config_all ON public.enterprise_notifications_config FOR ALL USING (true);

-- RPC for API Keys creation
CREATE OR REPLACE FUNCTION public.fn_create_api_key(
    p_name TEXT,
    p_environment TEXT,
    p_permissions TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_key public.enterprise_api_keys%ROWTYPE;
BEGIN
    INSERT INTO public.enterprise_api_keys (name, key_prefix, key_masked, environment, permissions, last_used, status)
    VALUES (
        p_name,
        'zega_' || lower(p_environment) || '_',
        'zega_' || lower(p_environment) || '_••••••••••••' || substring(md5(random()::text) from 1 for 4),
        p_environment,
        p_permissions,
        'Just now',
        'Active'
    )
    RETURNING * INTO v_new_key;

    RETURN to_jsonb(v_new_key);
END;
$$;

-- ============================================================================
-- 5. TABLES FOR DATA & PRIVACY, INTEGRATIONS, AND ADVANCED SUB-MENUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enterprise_data_privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_region TEXT NOT NULL DEFAULT 'Asia Pacific (Singapore)',
    backup_region TEXT NOT NULL DEFAULT 'ap-southeast-3 (AWS Jakarta)',
    telemetry_retention TEXT NOT NULL DEFAULT '12 Months',
    audit_logs_retention TEXT NOT NULL DEFAULT '24 Months',
    user_activity_retention TEXT NOT NULL DEFAULT '12 Months',
    api_logs_retention TEXT NOT NULL DEFAULT '6 Months',
    chat_retention TEXT NOT NULL DEFAULT '18 Months',
    anonymize_telemetry BOOLEAN NOT NULL DEFAULT TRUE,
    allow_product_improvement BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS primary_region TEXT DEFAULT 'Asia Pacific (Singapore)';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS backup_region TEXT DEFAULT 'ap-southeast-3 (AWS Jakarta)';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS telemetry_retention TEXT DEFAULT '12 Months';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS audit_logs_retention TEXT DEFAULT '24 Months';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS user_activity_retention TEXT DEFAULT '12 Months';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS api_logs_retention TEXT DEFAULT '6 Months';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS chat_retention TEXT DEFAULT '18 Months';
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS anonymize_telemetry BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_data_privacy_settings ADD COLUMN IF NOT EXISTS allow_product_improvement BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.enterprise_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'example.com',
    category TEXT NOT NULL DEFAULT 'Enterprise',
    status TEXT NOT NULL DEFAULT 'Connected',
    last_sync TEXT NOT NULL DEFAULT 'Just now',
    permissions TEXT NOT NULL DEFAULT 'Read, Write',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_integrations ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'example.com';
ALTER TABLE public.enterprise_integrations ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Enterprise';
ALTER TABLE public.enterprise_integrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Connected';
ALTER TABLE public.enterprise_integrations ADD COLUMN IF NOT EXISTS last_sync TEXT DEFAULT 'Just now';
ALTER TABLE public.enterprise_integrations ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT 'Read, Write';

CREATE TABLE IF NOT EXISTS public.enterprise_advanced_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment TEXT NOT NULL DEFAULT 'Production',
    log_level TEXT NOT NULL DEFAULT 'Info',
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    rate_limiting_mode TEXT NOT NULL DEFAULT 'Standard',
    concurrency INTEGER NOT NULL DEFAULT 10,
    allow_legacy_api BOOLEAN NOT NULL DEFAULT FALSE,
    api_response_caching BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_retries INTEGER NOT NULL DEFAULT 5,
    webhook_timeout INTEGER NOT NULL DEFAULT 30,
    enable_graphql BOOLEAN NOT NULL DEFAULT TRUE,
    beta_features BOOLEAN NOT NULL DEFAULT TRUE,
    ai_model_preview BOOLEAN NOT NULL DEFAULT TRUE,
    vector_compression BOOLEAN NOT NULL DEFAULT FALSE,
    custom_domains BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'Production';
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS log_level TEXT DEFAULT 'Info';
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS rate_limiting_mode TEXT DEFAULT 'Standard';
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS concurrency INTEGER DEFAULT 10;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS allow_legacy_api BOOLEAN DEFAULT FALSE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS api_response_caching BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS webhook_retries INTEGER DEFAULT 5;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS webhook_timeout INTEGER DEFAULT 30;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS enable_graphql BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS beta_features BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS ai_model_preview BOOLEAN DEFAULT TRUE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS vector_compression BOOLEAN DEFAULT FALSE;
ALTER TABLE public.enterprise_advanced_config ADD COLUMN IF NOT EXISTS custom_domains BOOLEAN DEFAULT TRUE;


-- Seed Data Privacy Settings (matching screenshot)
INSERT INTO public.enterprise_data_privacy_settings (primary_region, backup_region, telemetry_retention, audit_logs_retention, user_activity_retention, api_logs_retention, chat_retention, anonymize_telemetry, allow_product_improvement)
SELECT 'Asia Pacific (Singapore)', 'ap-southeast-3 (AWS Jakarta)', '12 Months', '24 Months', '12 Months', '6 Months', '18 Months', TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_data_privacy_settings);

-- Seed Integrations (matching screenshot)
INSERT INTO public.enterprise_integrations (name, domain, category, status, last_sync, permissions)
SELECT * FROM (VALUES
    ('Google Workspace', 'google.com', 'Enterprise', 'Connected', '2 minutes ago', 'Read, Write'),
    ('Microsoft Entra ID', 'microsoft.com', 'Security', 'Connected', '5 minutes ago', 'Read, Write'),
    ('AWS S3', 'aws.amazon.com', 'Data & Storage', 'Connected', '10 minutes ago', 'Read, Write'),
    ('Datadog', 'datadoghq.com', 'Analytics', 'Connected', '15 minutes ago', 'Read Only'),
    ('Slack', 'slack.com', 'Communication', 'Connected', '20 minutes ago', 'Read, Write'),
    ('PagerDuty', 'pagerduty.com', 'Operations', 'Error', '2 hours ago', 'Read, Write'),
    ('GitHub', 'github.com', 'Development', 'Connected', '1 day ago', 'Read, Write'),
    ('Snowflake', 'snowflake.com', 'Data & Storage', 'Connected', '1 day ago', 'Read, Write')
) AS t(name, domain, category, status, last_sync, permissions)
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_integrations);

-- Seed Advanced Config (matching screenshot)
INSERT INTO public.enterprise_advanced_config (environment, log_level, maintenance_mode, rate_limiting_mode, concurrency, allow_legacy_api, api_response_caching, webhook_retries, webhook_timeout, enable_graphql, beta_features, ai_model_preview, vector_compression, custom_domains)
SELECT 'Production', 'Info', FALSE, 'Standard', 10, FALSE, TRUE, 5, 30, TRUE, TRUE, TRUE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.enterprise_advanced_config);

-- RLS & Policies
ALTER TABLE public.enterprise_data_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_advanced_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_enterprise_data_privacy_settings_all ON public.enterprise_data_privacy_settings FOR ALL USING (true);
CREATE POLICY p_enterprise_integrations_all ON public.enterprise_integrations FOR ALL USING (true);
CREATE POLICY p_enterprise_advanced_config_all ON public.enterprise_advanced_config FOR ALL USING (true);

-- Update Publication
ALTER PUBLICATION publication_enterprise_settings_general_realtime ADD TABLE
    public.enterprise_api_keys,
    public.enterprise_billing_invoices,
    public.enterprise_security_events,
    public.enterprise_notifications_config,
    public.enterprise_data_privacy_settings,
    public.enterprise_integrations,
    public.enterprise_advanced_config;


