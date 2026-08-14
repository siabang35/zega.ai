-- ═══════════════════════════════════════════════════════════════════════════════
-- ZEGA AI — EA-06 FIX: SECURITY DEFINER search_path Hardening
-- Migration: 20260810020000_fix_security_definer_search_path.sql
--
-- Problem: SECURITY DEFINER functions without explicit search_path allow
--          schema shadowing attacks where a malicious schema could override
--          the target table references.
--
-- Fix: Add SET search_path = public, extensions to all SECURITY DEFINER
--      functions to ensure they always resolve tables in the correct schema.
--
-- Affected functions:
--   1. public.check_rate_limit()
--   2. public.log_security_event()
--   3. public.handle_new_user_signup()
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Fix check_rate_limit() — Add search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_max_requests INT DEFAULT 100,
    p_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_current_count INT;
BEGIN
    v_window_start := timezone('utc'::text, now()) - (p_window_seconds || ' seconds')::INTERVAL;

    SELECT COALESCE(SUM(request_count), 0)
    INTO v_current_count
    FROM public.rate_limit_logs
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start >= v_window_start;

    IF v_current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.rate_limit_logs (identifier, action, request_count, window_start)
    VALUES (p_identifier, p_action, 1, timezone('utc'::text, now()));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 2. Fix log_security_event() — Add search_path
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_ip_address TEXT,
    p_action TEXT,
    p_resource TEXT,
    p_status_code INT,
    p_payload_summary TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_audit_logs (user_id, ip_address, action, resource, status_code, payload_summary)
    VALUES (
        p_user_id,
        CASE WHEN p_ip_address IS NULL OR p_ip_address = '' THEN NULL ELSE p_ip_address::INET END,
        p_action,
        p_resource,
        p_status_code,
        substring(p_payload_summary from 1 for 1000)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. Fix handle_new_user_signup() — Add search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_type, 'individual')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
