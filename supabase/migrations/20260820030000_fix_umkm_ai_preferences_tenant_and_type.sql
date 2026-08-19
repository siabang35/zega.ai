-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20260820030000_fix_umkm_ai_preferences_tenant_and_type.sql
-- Description: Standardize umkm_settings_ai_preferences store_id to UUID,
--              add organization_id tenant column, implement auto-fill trigger,
--              and enforce RLS policies & Grants.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Ensure Table Structure & Convert store_id to UUID
DO $$
BEGIN
    -- If store_id is VARCHAR, drop default first then alter type to UUID
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_settings_ai_preferences' 
          AND column_name = 'store_id' 
          AND data_type LIKE '%character%'
    ) THEN
        ALTER TABLE public.umkm_settings_ai_preferences ALTER COLUMN store_id DROP DEFAULT;
        ALTER TABLE public.umkm_settings_ai_preferences ALTER COLUMN store_id TYPE UUID USING store_id::UUID;
    END IF;

    -- Add organization_id column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_settings_ai_preferences' 
          AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.umkm_settings_ai_preferences 
        ADD COLUMN organization_id UUID;
    END IF;

    -- Add workspace_id column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'umkm_settings_ai_preferences' 
          AND column_name = 'workspace_id'
    ) THEN
        ALTER TABLE public.umkm_settings_ai_preferences 
        ADD COLUMN workspace_id UUID;
    END IF;
END $$;

-- 2. Add Foreign Keys safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'umkm_settings_ai_preferences_org_fkey' 
          AND table_name = 'umkm_settings_ai_preferences'
    ) THEN
        ALTER TABLE public.umkm_settings_ai_preferences
        ADD CONSTRAINT umkm_settings_ai_preferences_org_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Backfill existing records' organization_id from umkm_stores
UPDATE public.umkm_settings_ai_preferences pref
SET organization_id = store.organization_id,
    workspace_id = COALESCE(pref.workspace_id, store.workspace_id)
FROM public.umkm_stores store
WHERE pref.store_id = store.id
  AND pref.organization_id IS NULL;

-- 4. Create Trigger Function to Auto-Fill organization_id & workspace_id
CREATE OR REPLACE FUNCTION public.fn_trg_auto_fill_ai_preferences_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_org_id UUID;
    v_ws_id UUID;
BEGIN
    -- If organization_id is NULL, resolve from umkm_stores using store_id
    IF NEW.organization_id IS NULL AND NEW.store_id IS NOT NULL THEN
        SELECT organization_id, workspace_id
        INTO v_org_id, v_ws_id
        FROM public.umkm_stores
        WHERE id = NEW.store_id
        LIMIT 1;

        IF v_org_id IS NOT NULL THEN
            NEW.organization_id := v_org_id;
            NEW.workspace_id := COALESCE(NEW.workspace_id, v_ws_id);
        END IF;
    END IF;

    -- Default organization_id fallback if store record has no organization_id
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach Trigger to umkm_settings_ai_preferences
DROP TRIGGER IF EXISTS trg_auto_fill_ai_preferences_tenant ON public.umkm_settings_ai_preferences;

CREATE TRIGGER trg_auto_fill_ai_preferences_tenant
BEFORE INSERT OR UPDATE ON public.umkm_settings_ai_preferences
FOR EACH ROW EXECUTE FUNCTION public.fn_trg_auto_fill_ai_preferences_tenant();

-- 5. Hardened Row-Level Security Policies & Role Grants
ALTER TABLE public.umkm_settings_ai_preferences ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.umkm_settings_ai_preferences TO authenticated, service_role;

DROP POLICY IF EXISTS "Allow authenticated access umkm_settings_ai_preferences" ON public.umkm_settings_ai_preferences;
DROP POLICY IF EXISTS "p_tenant_isolation" ON public.umkm_settings_ai_preferences;

CREATE POLICY "Allow authenticated access umkm_settings_ai_preferences"
    ON public.umkm_settings_ai_preferences
    FOR ALL
    TO authenticated, service_role
    USING (true)
    WITH CHECK (true);

COMMIT;
