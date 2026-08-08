-- ============================================================================
-- Migration 62: ZEGA Enterprise UMKM Knowledge Hub Filtering, Sorting & Realtime
-- Created: 2026-08-08
-- Description: Creates get_filtered_umkm_knowledge_items RPC function supporting
--              real-time fulltext search, multi-category filter, and sorting.
-- ============================================================================

-- 1. Create Index for Fast Full-Text & Multi-Column Search
CREATE INDEX IF NOT EXISTS idx_umkm_k_items_search ON public.umkm_knowledge_items(store_id, category_name, badge_label, status);
CREATE INDEX IF NOT EXISTS idx_umkm_k_items_views ON public.umkm_knowledge_items(store_id, views_count DESC);
CREATE INDEX IF NOT EXISTS idx_umkm_k_items_rating ON public.umkm_knowledge_items(store_id, rating_score DESC);

-- 2. Create RPC Function for Advanced Dynamic Filtering & Sorting
CREATE OR REPLACE FUNCTION get_filtered_umkm_knowledge_items(
    p_store_id TEXT,
    p_category TEXT DEFAULT 'Semua Kategori',
    p_search TEXT DEFAULT '',
    p_badge_type TEXT DEFAULT 'Semua',
    p_sort_by TEXT DEFAULT 'terbaru',
    p_only_bookmarked BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    store_id VARCHAR,
    category_id UUID,
    category_name VARCHAR,
    title VARCHAR,
    slug VARCHAR,
    description TEXT,
    content TEXT,
    badge_label VARCHAR,
    badge_type VARCHAR,
    status VARCHAR,
    author_name VARCHAR,
    author_role VARCHAR,
    author_avatar_url TEXT,
    views_count INT,
    rating_score NUMERIC,
    rating_count INT,
    is_bookmarked BOOLEAN,
    cdn_media_urls JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.store_id,
        i.category_id,
        i.category_name,
        i.title,
        i.slug,
        i.description,
        i.content,
        i.badge_label,
        i.badge_type,
        i.status,
        i.author_name,
        i.author_role,
        i.author_avatar_url,
        i.views_count,
        i.rating_score,
        i.rating_count,
        i.is_bookmarked,
        i.cdn_media_urls,
        i.created_at,
        i.updated_at
    FROM public.umkm_knowledge_items i
    WHERE i.store_id::TEXT = p_store_id::TEXT
      AND (p_category = 'Semua Kategori' OR p_category = '' OR i.category_name = p_category)
      AND (p_only_bookmarked = FALSE OR i.is_bookmarked = TRUE)
      AND (p_badge_type = 'Semua' OR p_badge_type = '' OR i.badge_label ILIKE '%' || p_badge_type || '%' OR i.badge_type ILIKE '%' || p_badge_type || '%')
      AND (
          p_search = '' OR
          i.title ILIKE '%' || p_search || '%' OR
          i.description ILIKE '%' || p_search || '%' OR
          i.category_name ILIKE '%' || p_search || '%' OR
          i.content ILIKE '%' || p_search || '%'
      )
    ORDER BY 
        CASE WHEN p_sort_by = 'populer' THEN i.views_count END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'rating' THEN i.rating_score END DESC NULLS LAST,
        i.created_at DESC;
END;
$$;
