-- ============================================================================
-- ZEGA AI PLATFORM - UMKM / INDIVIDUAL REALTIME CORE SCHEMA
-- Module 03: Anti-Throttling, Anti-Chunking & Rate Limiter Stored Procedure
-- Path: supabase/migrations/sql_umkm/03_umkm_anti_throttling_and_rate_limiter.sql
-- ============================================================================

-- TOKEN BUCKET RATE LIMITER TABLE
CREATE TABLE IF NOT EXISTS public.umkm_rate_limits (
    rate_key VARCHAR(255) PRIMARY KEY,
    tokens NUMERIC(10,2) NOT NULL,
    max_tokens INT NOT NULL DEFAULT 60,
    refill_rate NUMERIC(10,2) NOT NULL DEFAULT 1.0, -- tokens per second
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEX FOR FAST EXPIRATION & CLEANUP
CREATE INDEX IF NOT EXISTS idx_umkm_rate_limits_refill ON public.umkm_rate_limits(last_refill);

-- TOKEN BUCKET RATE LIMIT CHECKER FUNCTION (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.fn_check_rate_limit(
    p_rate_key VARCHAR(255),
    p_max_tokens INT DEFAULT 60,
    p_refill_rate NUMERIC(10,2) DEFAULT 1.0,
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
    SELECT * INTO v_record FROM public.umkm_rate_limits WHERE rate_key = p_rate_key FOR UPDATE;
    
    IF NOT FOUND THEN
        v_new_tokens := GREATEST(0, p_max_tokens - p_cost);
        INSERT INTO public.umkm_rate_limits (rate_key, tokens, max_tokens, refill_rate, last_refill)
        VALUES (p_rate_key, v_new_tokens, p_max_tokens, p_refill_rate, v_now);
        
        allowed := TRUE;
        remaining_tokens := FLOOR(v_new_tokens)::INT;
        reset_seconds := 0;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Calculate token refill based on elapsed time
    v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_record.last_refill));
    v_new_tokens := LEAST(p_max_tokens::NUMERIC, v_record.tokens + (v_elapsed_seconds * p_refill_rate));

    IF v_new_tokens >= p_cost THEN
        v_new_tokens := v_new_tokens - p_cost;
        UPDATE public.umkm_rate_limits
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

-- AUTOMATED CLEANUP PROCEDURE FOR EXPIRED RATE LIMIT LOGS
CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_rate_limits()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.umkm_rate_limits
    WHERE last_refill < (NOW() - INTERVAL '1 hour');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;
