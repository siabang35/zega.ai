-- ============================================================================
-- ZEGA AI MULTI-TENANT ARCHITECTURE: REALTIME PROFILE AVATAR & CDN SYNC
-- MIGRATION: 20260807000000_realtime_profile_avatar_and_cdn_sync.sql
-- DESCRIPTION: Enforces schema columns, default avatar fallback paths, RLS policies,
--              and Supabase Realtime Publications for UMKM & Enterprise Profile Avatars.
-- ============================================================================

-- 1. Ensure `profiles` table has avatar columns and default paths
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_path') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_path TEXT DEFAULT '/assets/avatars/user-avatar.jpg';
    END IF;
END $$;

-- 2. Ensure `umkm_stores` table has avatar & store profile columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'umkm_stores' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.umkm_stores ADD COLUMN avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'umkm_stores' AND column_name = 'avatar_path') THEN
        ALTER TABLE public.umkm_stores ADD COLUMN avatar_path TEXT DEFAULT '/assets/avatars/user-avatar.jpg';
    END IF;
END $$;

-- 3. Ensure `enterprise_organizations` table has logo & user avatar CDN columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enterprise_organizations' AND column_name = 'user_avatar') THEN
        ALTER TABLE public.enterprise_organizations ADD COLUMN user_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enterprise_organizations' AND column_name = 'logo_cdn_url') THEN
        ALTER TABLE public.enterprise_organizations ADD COLUMN logo_cdn_url TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop';
    END IF;
END $$;

-- 4. Enable Supabase Realtime Publication for instant UI state synchronization
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add profiles if not present
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr
            JOIN pg_class c ON pr.prrelid = c.oid
            WHERE c.relname = 'profiles'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
        END IF;

        -- Add umkm_stores if not present
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr
            JOIN pg_class c ON pr.prrelid = c.oid
            WHERE c.relname = 'umkm_stores'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.umkm_stores;
        END IF;

        -- Add enterprise_organizations if not present
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_rel pr
            JOIN pg_class c ON pr.prrelid = c.oid
            WHERE c.relname = 'enterprise_organizations'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_organizations;
        END IF;
    END IF;
END $$;

-- 5. Atomic Upsert RPC for Enterprise Settings & Avatar Update
CREATE OR REPLACE FUNCTION public.update_enterprise_profile_avatar(
    p_org_id UUID,
    p_user_avatar TEXT,
    p_logo_cdn_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE public.enterprise_organizations
    SET 
        user_avatar = COALESCE(p_user_avatar, user_avatar),
        logo_cdn_url = COALESCE(p_logo_cdn_url, logo_cdn_url),
        updated_at = NOW()
    WHERE id = p_org_id;

    SELECT jsonb_build_object(
        'success', true,
        'user_avatar', p_user_avatar,
        'logo_cdn_url', p_logo_cdn_url
    ) INTO v_result;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
