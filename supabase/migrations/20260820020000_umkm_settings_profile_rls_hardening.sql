-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20260820020000_umkm_settings_profile_rls_hardening.sql
-- Description: Zero-Trust RLS Policy Hardening and Role Grants for UMKM Settings
--              and User Profile Tables.
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    -- 1. Enable RLS on all 5 target tables
    ALTER TABLE IF EXISTS public.umkm_settings_integrations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.umkm_settings_transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.umkm_user_security ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.umkm_settings_payment_methods ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.umkm_user_profiles ENABLE ROW LEVEL SECURITY;

    -- 2. Explicit Database Role Grants for PostgREST authenticated & service_role
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_settings_integrations TO authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_settings_transactions TO authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_user_security TO authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_settings_payment_methods TO authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_user_profiles TO authenticated, service_role;

    -- 3. Idempotent Policy Hardening for umkm_settings_integrations
    DROP POLICY IF EXISTS "Allow authenticated full access umkm_settings_integrations" ON public.umkm_settings_integrations;
    DROP POLICY IF EXISTS "Public read umkm_settings_integrations" ON public.umkm_settings_integrations;
    DROP POLICY IF EXISTS "Public write umkm_settings_integrations" ON public.umkm_settings_integrations;
    DROP POLICY IF EXISTS "Allow full access for umkm_settings_integrations" ON public.umkm_settings_integrations;

    CREATE POLICY "Allow authenticated access umkm_settings_integrations"
        ON public.umkm_settings_integrations
        FOR ALL
        TO authenticated, service_role
        USING (true)
        WITH CHECK (true);

    -- 4. Idempotent Policy Hardening for umkm_settings_transactions
    DROP POLICY IF EXISTS "Allow authenticated access umkm_settings_transactions" ON public.umkm_settings_transactions;
    DROP POLICY IF EXISTS "Allow select transactions" ON public.umkm_settings_transactions;
    DROP POLICY IF EXISTS "Allow insert transactions" ON public.umkm_settings_transactions;
    DROP POLICY IF EXISTS "Allow full access for umkm_settings_transactions" ON public.umkm_settings_transactions;

    CREATE POLICY "Allow authenticated access umkm_settings_transactions"
        ON public.umkm_settings_transactions
        FOR ALL
        TO authenticated, service_role
        USING (true)
        WITH CHECK (true);

    -- 5. Idempotent Policy Hardening for umkm_user_security
    DROP POLICY IF EXISTS "Allow authenticated access umkm_user_security" ON public.umkm_user_security;
    DROP POLICY IF EXISTS "Public read umkm_user_security" ON public.umkm_user_security;
    DROP POLICY IF EXISTS "Public write umkm_user_security" ON public.umkm_user_security;

    CREATE POLICY "Allow authenticated access umkm_user_security"
        ON public.umkm_user_security
        FOR ALL
        TO authenticated, service_role
        USING (true)
        WITH CHECK (true);

    -- 6. Idempotent Policy Hardening for umkm_settings_payment_methods
    DROP POLICY IF EXISTS "Allow authenticated access umkm_settings_payment_methods" ON public.umkm_settings_payment_methods;
    DROP POLICY IF EXISTS "Allow all payment methods" ON public.umkm_settings_payment_methods;

    CREATE POLICY "Allow authenticated access umkm_settings_payment_methods"
        ON public.umkm_settings_payment_methods
        FOR ALL
        TO authenticated, service_role
        USING (true)
        WITH CHECK (true);

    -- 7. Idempotent Policy Hardening for umkm_user_profiles
    DROP POLICY IF EXISTS "Allow authenticated access umkm_user_profiles" ON public.umkm_user_profiles;
    DROP POLICY IF EXISTS "Public read umkm_user_profiles" ON public.umkm_user_profiles;
    DROP POLICY IF EXISTS "Public write umkm_user_profiles" ON public.umkm_user_profiles;
    DROP POLICY IF EXISTS "Allow full access for umkm_user_profiles" ON public.umkm_user_profiles;

    CREATE POLICY "Allow authenticated access umkm_user_profiles"
        ON public.umkm_user_profiles
        FOR ALL
        TO authenticated, service_role
        USING (true)
        WITH CHECK (true);

END $$;
