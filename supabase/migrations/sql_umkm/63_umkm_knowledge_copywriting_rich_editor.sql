-- Migration 63: Rich Copywriting Editor, Media Attachments & Executive Studio Support
-- Full database schema hardening for MS Word / Medium / LinkedIn Copywriter Studio

-- 1. Enable pg_trgm extension for trigram matching & full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add rich copywriting & studio columns defensively to umkm_knowledge_items
ALTER TABLE public.umkm_knowledge_items 
    ADD COLUMN IF NOT EXISTS content_markdown TEXT,
    ADD COLUMN IF NOT EXISTS media_attachments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_meta_description TEXT,
    ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_model_used TEXT DEFAULT 'ZeroClaw 9Router Swarm (DeepSeek-R1 / Llama-3.3)',
    ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'Operasional & Staff',
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY['SOP', 'UMKM', 'Panduan']::TEXT[],
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

-- 3. Column Documentation
COMMENT ON COLUMN public.umkm_knowledge_items.content_markdown IS 'Full body markdown content with MS Word / Medium formatting, tables, callouts, and media links';
COMMENT ON COLUMN public.umkm_knowledge_items.media_attachments IS 'JSONB array of uploaded images, videos, and document attachments hosted on Cloudflare R2 CDN';
COMMENT ON COLUMN public.umkm_knowledge_items.seo_title IS 'SEO optimized headline title for search engine indexing';
COMMENT ON COLUMN public.umkm_knowledge_items.seo_meta_description IS 'Meta description summary for search engine snippet';
COMMENT ON COLUMN public.umkm_knowledge_items.reading_time_minutes IS 'Estimated reading time in minutes based on word count';
COMMENT ON COLUMN public.umkm_knowledge_items.version_history IS 'JSONB snapshot history of previous revisions created by copywriters';

-- 4. Defensive GIN / Full-Text Search Indexing
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_opclass WHERE opcname = 'gin_trgm_ops'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_items_content_trgm ON public.umkm_knowledge_items USING gin (content_markdown gin_trgm_ops)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_items_title_trgm ON public.umkm_knowledge_items USING gin (title gin_trgm_ops)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_items_content_fts ON public.umkm_knowledge_items USING gin (to_tsvector(''indonesian'', COALESCE(content_markdown, '''')))';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipped GIN index creation: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_items_tags ON public.umkm_knowledge_items USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_umkm_knowledge_items_store_badge ON public.umkm_knowledge_items (store_id, badge_type, status);

-- 5. RPC Function: Create Rich Knowledge Article / SOP / Thread
DROP FUNCTION IF EXISTS public.create_umkm_rich_knowledge_article;
CREATE OR REPLACE FUNCTION public.create_umkm_rich_knowledge_article(
    p_store_id TEXT,
    p_title TEXT,
    p_description TEXT,
    p_content_markdown TEXT,
    p_category_name TEXT,
    p_badge_label TEXT,
    p_badge_type TEXT,
    p_status TEXT DEFAULT 'Published',
    p_author_name TEXT DEFAULT 'Admin',
    p_author_role TEXT DEFAULT 'UMKM Owner',
    p_author_avatar_url TEXT DEFAULT NULL,
    p_media_attachments JSONB DEFAULT '[]'::jsonb,
    p_seo_title TEXT DEFAULT NULL,
    p_seo_meta_description TEXT DEFAULT NULL,
    p_ai_generated BOOLEAN DEFAULT FALSE,
    p_ai_model_used TEXT DEFAULT 'ZeroClaw Swarm AI',
    p_target_audience TEXT DEFAULT 'Operasional & Staff',
    p_tags TEXT[] DEFAULT ARRAY['SOP', 'Panduan']::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id TEXT;
    v_slug TEXT;
    v_category_id UUID;
    v_reading_time INT;
    v_word_count INT;
    v_result JSONB;
BEGIN
    -- 1. Calculate reading time (approx. 200 words per minute)
    v_word_count := array_length(regexp_split_to_array(COALESCE(p_content_markdown, ''), '\s+'), 1);
    v_reading_time := GREATEST(1, CEIL(COALESCE(v_word_count, 0) / 200.0));

    -- 2. Generate unique ID & URL slug
    v_id := 'k-rich-' || floor(extract(epoch from now()) * 1000)::text;
    v_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');
    
    IF v_slug IS NULL OR length(v_slug) = 0 THEN
        v_slug := 'article-' || floor(extract(epoch from now()))::text;
    END IF;

    -- Append unique timestamp suffix if slug exists
    IF EXISTS (SELECT 1 FROM public.umkm_knowledge_items WHERE store_id = p_store_id AND slug = v_slug) THEN
        v_slug := v_slug || '-' || floor(extract(epoch from now()) % 10000)::text;
    END IF;

    -- 3. Find category ID if exists
    SELECT id INTO v_category_id 
    FROM public.umkm_knowledge_categories 
    WHERE store_id = p_store_id AND lower(name) = lower(p_category_name) 
    LIMIT 1;

    -- 4. Insert Article / Thread
    INSERT INTO public.umkm_knowledge_items (
        id,
        store_id,
        category_id,
        category_name,
        title,
        slug,
        description,
        content_markdown,
        badge_label,
        badge_type,
        status,
        author_name,
        author_role,
        author_avatar_url,
        media_attachments,
        seo_title,
        seo_meta_description,
        ai_generated,
        ai_model_used,
        reading_time_minutes,
        target_audience,
        tags,
        views_count,
        rating_score,
        rating_count,
        created_at,
        updated_at
    ) VALUES (
        v_id,
        p_store_id,
        v_category_id,
        p_category_name,
        p_title,
        v_slug,
        p_description,
        p_content_markdown,
        p_badge_label,
        p_badge_type,
        p_status,
        p_author_name,
        p_author_role,
        COALESCE(p_author_avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        COALESCE(p_media_attachments, '[]'::jsonb),
        COALESCE(p_seo_title, p_title),
        COALESCE(p_seo_meta_description, p_description),
        p_ai_generated,
        p_ai_model_used,
        v_reading_time,
        p_target_audience,
        COALESCE(p_tags, ARRAY['SOP', 'Panduan']::TEXT[]),
        1,
        5.0,
        1,
        NOW(),
        NOW()
    )
    RETURNING to_jsonb(public.umkm_knowledge_items.*) INTO v_result;

    -- 5. Increment category item count
    IF v_category_id IS NOT NULL THEN
        UPDATE public.umkm_knowledge_categories 
        SET count = count + 1, updated_at = NOW()
        WHERE id = v_category_id;
    END IF;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', TRUE,
        'message', SQLERRM
    );
END;
$$;

-- 6. RPC Function: Update Rich Knowledge Article & Snapshot Revision
DROP FUNCTION IF EXISTS public.update_umkm_rich_knowledge_article;
CREATE OR REPLACE FUNCTION public.update_umkm_rich_knowledge_article(
    p_article_id TEXT,
    p_store_id TEXT,
    p_title TEXT,
    p_description TEXT,
    p_content_markdown TEXT,
    p_category_name TEXT,
    p_badge_label TEXT,
    p_badge_type TEXT,
    p_media_attachments JSONB DEFAULT NULL,
    p_seo_title TEXT DEFAULT NULL,
    p_seo_meta_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_content TEXT;
    v_old_title TEXT;
    v_revision_snapshot JSONB;
    v_result JSONB;
BEGIN
    -- Fetch old item for version snapshot
    SELECT content_markdown, title INTO v_old_content, v_old_title
    FROM public.umkm_knowledge_items
    WHERE id = p_article_id AND store_id = p_store_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', TRUE, 'message', 'Article not found');
    END IF;

    -- Build revision snapshot object
    v_revision_snapshot := jsonb_build_object(
        'timestamp', NOW(),
        'title', v_old_title,
        'content_snippet', substring(v_old_content from 1 for 200)
    );

    UPDATE public.umkm_knowledge_items
    SET title = p_title,
        description = p_description,
        content_markdown = p_content_markdown,
        category_name = p_category_name,
        badge_label = p_badge_label,
        badge_type = p_badge_type,
        media_attachments = COALESCE(p_media_attachments, media_attachments),
        seo_title = COALESCE(p_seo_title, p_title),
        seo_meta_description = COALESCE(p_seo_meta_description, p_description),
        version_history = version_history || v_revision_snapshot,
        updated_at = NOW()
    WHERE id = p_article_id AND store_id = p_store_id
    RETURNING to_jsonb(public.umkm_knowledge_items.*) INTO v_result;

    RETURN v_result;
END;
$$;

-- 7. Grant execution permission
GRANT EXECUTE ON FUNCTION public.create_umkm_rich_knowledge_article TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_umkm_rich_knowledge_article TO authenticated, anon, service_role;
