-- Migration: 20260801000300_zeroclaw_privy_enterprise_r2_sync.sql
-- Description: Master Enterprise Privy R2 CDN Audit Certificates Table & Supabase Realtime Publication

CREATE TABLE IF NOT EXISTS public.privy_r2_audit_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    privy_wallet_address TEXT NOT NULL,
    privy_did TEXT,
    r2_cdn_url TEXT NOT NULL,
    r2_object_key TEXT NOT NULL,
    sha256_checksum TEXT NOT NULL,
    owasp_security_level TEXT NOT NULL DEFAULT 'ENTERPRISE_OWASP_V3_AES256',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_privy_r2_email ON public.privy_r2_audit_certificates(email);
CREATE INDEX IF NOT EXISTS idx_privy_r2_wallet ON public.privy_r2_audit_certificates(privy_wallet_address);
CREATE INDEX IF NOT EXISTS idx_privy_r2_checksum ON public.privy_r2_audit_certificates(sha256_checksum);

-- Enable Row Level Security (RLS)
ALTER TABLE public.privy_r2_audit_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users & service role can view audit certificates
CREATE POLICY "Users and service can select privy r2 audit certificates"
    ON public.privy_r2_audit_certificates
    FOR SELECT
    USING (true);

-- RLS Policy: Service role can insert audit certificates
CREATE POLICY "Service role can insert privy r2 audit certificates"
    ON public.privy_r2_audit_certificates
    FOR INSERT
    WITH CHECK (true);

-- Enable Supabase Realtime WebSocket Publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'privy_r2_audit_certificates'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.privy_r2_audit_certificates;
    END IF;
END $$;

-- Atomic RPC Function to Record Privy R2 Audit Certificate
CREATE OR REPLACE FUNCTION public.record_privy_r2_audit_certificate(
    p_user_id TEXT,
    p_email TEXT,
    p_privy_wallet_address TEXT,
    p_privy_did TEXT,
    p_r2_cdn_url TEXT,
    p_r2_object_key TEXT,
    p_sha256_checksum TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cert_id UUID;
    v_result JSONB;
BEGIN
    INSERT INTO public.privy_r2_audit_certificates (
        user_id,
        email,
        privy_wallet_address,
        privy_did,
        r2_cdn_url,
        r2_object_key,
        sha256_checksum,
        metadata,
        created_at
    )
    VALUES (
        p_user_id,
        p_email,
        p_privy_wallet_address,
        p_privy_did,
        p_r2_cdn_url,
        p_r2_object_key,
        p_sha256_checksum,
        p_metadata,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_cert_id;

    SELECT jsonb_build_object(
        'success', true,
        'certificate_id', v_cert_id,
        'r2_cdn_url', p_r2_cdn_url,
        'sha256_checksum', p_sha256_checksum
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.record_privy_r2_audit_certificate TO anon, authenticated, service_role;
