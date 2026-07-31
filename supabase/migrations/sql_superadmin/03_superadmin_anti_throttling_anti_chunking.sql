-- ============================================================================
-- ZEGA AI PLATFORM - SUPERADMIN REALTIME CONTROL PLANE SCHEMA
-- Module 03: SuperAdmin Anti-Throttling Rate Limiter & OWASP Anti-Chunking Validator
-- Path: supabase/migrations/sql_superadmin/03_superadmin_anti_throttling_anti_chunking.sql
-- ============================================================================

-- 1. SUPERADMIN TOKEN BUCKET RATE LIMITER TABLE
CREATE TABLE IF NOT EXISTS public.superadmin_rate_limits (
    rate_key VARCHAR(255) PRIMARY KEY,
    tokens NUMERIC(10,2) NOT NULL,
    max_tokens INT NOT NULL DEFAULT 500,
    refill_rate NUMERIC(10,2) NOT NULL DEFAULT 10.0, -- 10 tokens/sec capacity for privileged superadmin control plane
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_superadmin_rate_limits_refill ON public.superadmin_rate_limits(last_refill);

-- 2. SUPERADMIN TOKEN BUCKET RATE LIMIT CHECKER (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fn_check_superadmin_rate_limit(
    p_rate_key VARCHAR(255),
    p_max_tokens INT DEFAULT 500,
    p_refill_rate NUMERIC(10,2) DEFAULT 10.0,
    p_cost INT DEFAULT 1
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining_tokens INT,
    reset_seconds INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_record RECORD;
    v_elapsed_seconds NUMERIC(10,2);
    v_new_tokens NUMERIC(10,2);
BEGIN
    SELECT * INTO v_record FROM public.superadmin_rate_limits WHERE rate_key = p_rate_key FOR UPDATE;
    
    IF NOT FOUND THEN
        v_new_tokens := GREATEST(0, p_max_tokens - p_cost);
        INSERT INTO public.superadmin_rate_limits (rate_key, tokens, max_tokens, refill_rate, last_refill)
        VALUES (p_rate_key, v_new_tokens, p_max_tokens, p_refill_rate, v_now);
        
        allowed := TRUE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := 0;
        RETURN NEXT;
        RETURN;
    END IF;

    v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_record.last_refill));
    v_new_tokens := LEAST(p_max_tokens::NUMERIC, v_record.tokens + (v_elapsed_seconds * p_refill_rate));

    IF v_new_tokens >= p_cost THEN
        v_new_tokens := v_new_tokens - p_cost;
        UPDATE public.superadmin_rate_limits
        SET tokens = v_new_tokens,
            last_refill = v_now
        WHERE rate_key = p_rate_key;
        
        allowed := TRUE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := 0;
    ELSE
        allowed := FALSE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := CEIL((p_cost - v_new_tokens) / p_refill_rate)::INT;
    END IF;

    RETURN NEXT;
END;
$$;

-- 3. OWASP ANTI-CHUNKING & PAYLOAD EXHAUSTION VALIDATOR TRIGGER
CREATE OR REPLACE FUNCTION public.fn_validate_superadmin_payload_chunk_size()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payload_length INT;
    v_max_allowed_bytes INT := 2097152; -- Max 2MB per SuperAdmin security threat payload
BEGIN
    IF NEW.payload IS NOT NULL THEN
        v_payload_length := OCTET_LENGTH(NEW.payload::TEXT);
        IF v_payload_length > v_max_allowed_bytes THEN
            RAISE EXCEPTION 'OWASP Security Violation: SuperAdmin payload size (%) exceeds ceiling of 2MB', v_payload_length
                USING ERRCODE = '22001';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_superadmin_payload_chunking ON public.superadmin_security_threat_logs;
CREATE TRIGGER trg_prevent_superadmin_payload_chunking
    BEFORE INSERT OR UPDATE ON public.superadmin_security_threat_logs
    FOR EACH ROW EXECUTE FUNCTION public.fn_validate_superadmin_payload_chunk_size();
