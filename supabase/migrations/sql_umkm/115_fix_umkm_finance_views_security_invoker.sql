-- ============================================================================
-- ZEGA AI PLATFORM - SUPABASE DATABASE LINTER FIX (LINT 0010)
-- Migration 115: Fix Security Definer Views for umkm_finance_chats & umkm_finance_messages
-- Path: supabase/migrations/sql_umkm/115_fix_umkm_finance_views_security_invoker.sql
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
-- ============================================================================

-- 1. RECREATE public.umkm_finance_chats VIEW WITH (security_invoker = true)
DROP VIEW IF EXISTS public.umkm_finance_chats CASCADE;

CREATE VIEW public.umkm_finance_chats
WITH (security_invoker = true)
AS
SELECT * FROM public.umkm_finance_ai_chats;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_finance_chats TO authenticated, anon, service_role;

-- 2. RECREATE public.umkm_finance_messages VIEW WITH (security_invoker = true)
DROP VIEW IF EXISTS public.umkm_finance_messages CASCADE;

CREATE VIEW public.umkm_finance_messages
WITH (security_invoker = true)
AS
SELECT * FROM public.umkm_finance_ai_messages;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm_finance_messages TO authenticated, anon, service_role;

-- 3. ENFORCE SECURITY_INVOKER PROPERTY ON EXISTING VIEWS IF NOT RECREATED
ALTER VIEW IF EXISTS public.umkm_finance_chats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.umkm_finance_messages SET (security_invoker = true);
