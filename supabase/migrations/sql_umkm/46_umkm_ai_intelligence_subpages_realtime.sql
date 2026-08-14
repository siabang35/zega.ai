-- ============================================================================
-- SQL MIGRATION 46: UMKM AI INTELLIGENCE SUB-PAGES REALTIME & ENTERPRISE DATA
-- ============================================================================
-- Purpose: Complete backend data layer for AI Intelligence sub-pages:
-- Sales, Marketing, Store, Finance, Customers — with RPC functions,
-- demo telemetry seed data, RLS policies, and Supabase Realtime publication.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SALES SUB-PAGE TABLES
-- ============================================================================

-- Sales Pipeline Funnel Stages
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    stage TEXT NOT NULL,
    deal_count INTEGER NOT NULL DEFAULT 0,
    deal_value_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    conversion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#3b82f6',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales Order Status Breakdown
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_order_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    status TEXT NOT NULL,
    order_count INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#10b981',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Sales Trend (Bar Chart)
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_daily_trend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    day_label TEXT NOT NULL,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Top Sales Performers (AI Agents & Channels)
CREATE TABLE IF NOT EXISTS public.umkm_ai_sales_performers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    performer_name TEXT NOT NULL,
    avatar_emoji TEXT NOT NULL DEFAULT '🤖',
    deals_closed INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. MARKETING SUB-PAGE TABLES
-- ============================================================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS public.umkm_ai_marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    campaign_name TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif',
    sent_count INTEGER NOT NULL DEFAULT 0,
    opened_count INTEGER NOT NULL DEFAULT 0,
    clicked_count INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    roi_pct NUMERIC(7,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing Channel ROI
CREATE TABLE IF NOT EXISTS public.umkm_ai_marketing_channel_roi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    channel TEXT NOT NULL,
    spend_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    roi_pct NUMERIC(7,2) NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#3b82f6',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing Engagement Time Series
CREATE TABLE IF NOT EXISTS public.umkm_ai_marketing_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Top Content Performance
CREATE TABLE IF NOT EXISTS public.umkm_ai_marketing_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    engagement_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    leads_generated INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. STORE SUB-PAGE TABLES
-- ============================================================================

-- Store Inventory KPIs
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_inventory_kpi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    total_sku INTEGER NOT NULL DEFAULT 248,
    low_stock_count INTEGER NOT NULL DEFAULT 12,
    out_of_stock_count INTEGER NOT NULL DEFAULT 3,
    avg_inventory_days INTEGER NOT NULL DEFAULT 18,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Category Performance
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    category_name TEXT NOT NULL,
    product_count INTEGER NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    growth_pct INTEGER NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#3b82f6',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock Turnover Segments
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_turnover (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    segment_label TEXT NOT NULL,
    product_count INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#10b981',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Low Stock Alerts
CREATE TABLE IF NOT EXISTS public.umkm_ai_store_low_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    product_name TEXT NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    avg_sold_monthly INTEGER NOT NULL DEFAULT 0,
    days_until_empty INTEGER NOT NULL DEFAULT 0,
    urgency TEXT NOT NULL DEFAULT 'OK',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. FINANCE SUB-PAGE TABLES
-- ============================================================================

-- P&L Summary
CREATE TABLE IF NOT EXISTS public.umkm_ai_finance_pnl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    gross_revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 13500000,
    cogs_idr NUMERIC(15,2) NOT NULL DEFAULT 5400000,
    gross_profit_idr NUMERIC(15,2) NOT NULL DEFAULT 8100000,
    opex_idr NUMERIC(15,2) NOT NULL DEFAULT 3200000,
    net_profit_idr NUMERIC(15,2) NOT NULL DEFAULT 4900000,
    profit_margin_pct NUMERIC(5,2) NOT NULL DEFAULT 36.30,
    gross_margin_pct NUMERIC(5,2) NOT NULL DEFAULT 60.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cash Flow Time Series
CREATE TABLE IF NOT EXISTS public.umkm_ai_finance_cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL,
    income_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    expense_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profit Margin Trend
CREATE TABLE IF NOT EXISTS public.umkm_ai_finance_margin_trend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL,
    margin_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expense Breakdown
CREATE TABLE IF NOT EXISTS public.umkm_ai_finance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    category TEXT NOT NULL,
    amount_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    color_hex TEXT NOT NULL DEFAULT '#ef4444',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recent Transactions
CREATE TABLE IF NOT EXISTS public.umkm_ai_finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    description TEXT NOT NULL,
    tx_type TEXT NOT NULL DEFAULT 'income',
    amount_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    tx_date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Transfer Bank',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. CUSTOMERS SUB-PAGE TABLES
-- ============================================================================

-- Customer Growth Trend
CREATE TABLE IF NOT EXISTS public.umkm_ai_customers_growth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    period_label TEXT NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    new_customers INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RFM Segmentation
CREATE TABLE IF NOT EXISTS public.umkm_ai_customers_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    segment_name TEXT NOT NULL,
    customer_count INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    spend_range TEXT NOT NULL DEFAULT '',
    color_hex TEXT NOT NULL DEFAULT '#10b981',
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regional Distribution
CREATE TABLE IF NOT EXISTS public.umkm_ai_customers_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id TEXT NOT NULL DEFAULT 'STORE-DEMO-1283',
    region_name TEXT NOT NULL,
    customer_count INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    revenue_idr NUMERIC(15,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED ENTERPRISE DEMO DATA
-- ============================================================================

-- Sales Pipeline
INSERT INTO public.umkm_ai_sales_pipeline (store_id, stage, deal_count, deal_value_idr, conversion_pct, color_hex, sort_order) VALUES
('STORE-DEMO-1283', 'Leads Masuk', 342, 85000000, 100, '#3b82f6', 1),
('STORE-DEMO-1283', 'Qualified', 218, 54500000, 64, '#8b5cf6', 2),
('STORE-DEMO-1283', 'Proposal Sent', 156, 39000000, 46, '#f59e0b', 3),
('STORE-DEMO-1283', 'Negosiasi', 98, 24500000, 29, '#f97316', 4),
('STORE-DEMO-1283', 'Closed Won', 72, 18000000, 21, '#10b981', 5)
ON CONFLICT DO NOTHING;

-- Sales Order Status
INSERT INTO public.umkm_ai_sales_order_status (store_id, status, order_count, percentage, color_hex) VALUES
('STORE-DEMO-1283', 'Selesai', 89, 76.7, '#10b981'),
('STORE-DEMO-1283', 'Diproses', 18, 15.5, '#3b82f6'),
('STORE-DEMO-1283', 'Pending', 6, 5.2, '#f59e0b'),
('STORE-DEMO-1283', 'Dibatalkan', 3, 2.6, '#ef4444')
ON CONFLICT DO NOTHING;

-- Daily Sales Trend
INSERT INTO public.umkm_ai_sales_daily_trend (store_id, day_label, revenue_idr, sort_order) VALUES
('STORE-DEMO-1283', 'Sen', 1800000, 1),
('STORE-DEMO-1283', 'Sel', 2200000, 2),
('STORE-DEMO-1283', 'Rab', 1950000, 3),
('STORE-DEMO-1283', 'Kam', 2400000, 4),
('STORE-DEMO-1283', 'Jum', 2800000, 5),
('STORE-DEMO-1283', 'Sab', 3100000, 6),
('STORE-DEMO-1283', 'Min', 1200000, 7)
ON CONFLICT DO NOTHING;

-- Sales Performers
INSERT INTO public.umkm_ai_sales_performers (store_id, performer_name, avatar_emoji, deals_closed, revenue_idr, sort_order) VALUES
('STORE-DEMO-1283', 'AI Sales Bot – WhatsApp', '🤖', 34, 8500000, 1),
('STORE-DEMO-1283', 'Closi – Sales Agent', '💼', 28, 7200000, 2),
('STORE-DEMO-1283', 'Shopee Auto-Sync', '🛒', 22, 5800000, 3),
('STORE-DEMO-1283', 'Instagram DM Bot', '📸', 14, 3200000, 4),
('STORE-DEMO-1283', 'TikTok Shop Agent', '🎵', 10, 1800000, 5)
ON CONFLICT DO NOTHING;

-- Marketing Campaigns
INSERT INTO public.umkm_ai_marketing_campaigns (store_id, campaign_name, channel, status, sent_count, opened_count, clicked_count, revenue_idr, roi_pct) VALUES
('STORE-DEMO-1283', 'Flash Sale Juli', 'WhatsApp Broadcast', 'Aktif', 1240, 892, 312, 4200000, 320),
('STORE-DEMO-1283', 'Promo Ramadhan', 'Instagram Ads', 'Selesai', 8500, 3400, 890, 6800000, 245),
('STORE-DEMO-1283', 'Re-engagement Q3', 'Email Blast', 'Aktif', 620, 384, 142, 1900000, 180),
('STORE-DEMO-1283', 'TikTok Viral Push', 'TikTok Ads', 'Scheduled', 0, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Marketing Channel ROI
INSERT INTO public.umkm_ai_marketing_channel_roi (store_id, channel, spend_idr, revenue_idr, roi_pct, color_hex, sort_order) VALUES
('STORE-DEMO-1283', 'WhatsApp', 1200000, 6100000, 408, '#3b82f6', 1),
('STORE-DEMO-1283', 'Shopee Ads', 800000, 4100000, 413, '#10b981', 2),
('STORE-DEMO-1283', 'Instagram', 950000, 2000000, 111, '#a855f7', 3),
('STORE-DEMO-1283', 'TikTok', 600000, 1300000, 117, '#f97316', 4)
ON CONFLICT DO NOTHING;

-- Marketing Engagement
INSERT INTO public.umkm_ai_marketing_engagement (store_id, period_label, impressions, clicks, conversions, sort_order) VALUES
('STORE-DEMO-1283', 'Minggu 1', 12000, 890, 120, 1),
('STORE-DEMO-1283', 'Minggu 2', 18500, 1420, 210, 2),
('STORE-DEMO-1283', 'Minggu 3', 22000, 1780, 340, 3),
('STORE-DEMO-1283', 'Minggu 4', 28000, 2100, 450, 4)
ON CONFLICT DO NOTHING;

-- Marketing Content
INSERT INTO public.umkm_ai_marketing_content (store_id, content_type, title, views, engagement_pct, leads_generated, sort_order) VALUES
('STORE-DEMO-1283', 'IG Reel', 'Unboxing Tumbler Premium', 12400, 8.2, 34, 1),
('STORE-DEMO-1283', 'WA Story', 'Flash Sale Countdown', 4200, 14.5, 28, 2),
('STORE-DEMO-1283', 'TikTok', '#KaosBerkualitas Challenge', 34000, 6.1, 18, 3),
('STORE-DEMO-1283', 'Blog', 'Tips Memilih Botol Minum', 1800, 3.4, 12, 4)
ON CONFLICT DO NOTHING;

-- Store Inventory KPI
INSERT INTO public.umkm_ai_store_inventory_kpi (store_id, total_sku, low_stock_count, out_of_stock_count, avg_inventory_days) VALUES
('STORE-DEMO-1283', 248, 12, 3, 18)
ON CONFLICT DO NOTHING;

-- Store Categories
INSERT INTO public.umkm_ai_store_categories (store_id, category_name, product_count, revenue_idr, percentage, growth_pct, color_hex, sort_order) VALUES
('STORE-DEMO-1283', 'Fashion & Apparel', 86, 5200000, 38.5, 22, '#3b82f6', 1),
('STORE-DEMO-1283', 'Aksesoris & Gadget', 62, 3800000, 28.1, 15, '#a855f7', 2),
('STORE-DEMO-1283', 'Home & Living', 48, 2400000, 17.8, 8, '#10b981', 3),
('STORE-DEMO-1283', 'Food & Beverage', 34, 1500000, 11.1, 12, '#f97316', 4),
('STORE-DEMO-1283', 'Digital Products', 18, 600000, 4.5, 35, '#ec4899', 5)
ON CONFLICT DO NOTHING;

-- Stock Turnover
INSERT INTO public.umkm_ai_store_turnover (store_id, segment_label, product_count, percentage, color_hex, sort_order) VALUES
('STORE-DEMO-1283', 'Fast Moving', 42, 35, '#10b981', 1),
('STORE-DEMO-1283', 'Medium', 86, 42, '#3b82f6', 2),
('STORE-DEMO-1283', 'Slow Moving', 38, 18, '#f59e0b', 3),
('STORE-DEMO-1283', 'Dead Stock', 8, 5, '#ef4444', 4)
ON CONFLICT DO NOTHING;

-- Low Stock Alerts
INSERT INTO public.umkm_ai_store_low_stock (store_id, product_name, current_stock, avg_sold_monthly, days_until_empty, urgency, sort_order) VALUES
('STORE-DEMO-1283', 'Kaos Polos Hitam (M)', 8, 32, 4, 'CRITICAL', 1),
('STORE-DEMO-1283', 'Tumbler Premium 500ml', 5, 28, 3, 'CRITICAL', 2),
('STORE-DEMO-1283', 'Hoodie Full Zip (L)', 3, 18, 2, 'CRITICAL', 3),
('STORE-DEMO-1283', 'Botol Minum 350ml', 15, 24, 10, 'WARNING', 4),
('STORE-DEMO-1283', 'Totebag Canvas Hitam', 12, 15, 12, 'OK', 5)
ON CONFLICT DO NOTHING;

-- Finance P&L
INSERT INTO public.umkm_ai_finance_pnl (store_id, gross_revenue_idr, cogs_idr, gross_profit_idr, opex_idr, net_profit_idr, profit_margin_pct, gross_margin_pct) VALUES
('STORE-DEMO-1283', 13500000, 5400000, 8100000, 3200000, 4900000, 36.30, 60.00)
ON CONFLICT DO NOTHING;

-- Finance Cash Flow
INSERT INTO public.umkm_ai_finance_cashflow (store_id, period_label, income_idr, expense_idr, sort_order) VALUES
('STORE-DEMO-1283', 'Minggu 1', 3200000, 1800000, 1),
('STORE-DEMO-1283', 'Minggu 2', 4100000, 2200000, 2),
('STORE-DEMO-1283', 'Minggu 3', 2800000, 1500000, 3),
('STORE-DEMO-1283', 'Minggu 4', 3400000, 2100000, 4)
ON CONFLICT DO NOTHING;

-- Finance Margin Trend
INSERT INTO public.umkm_ai_finance_margin_trend (store_id, period_label, margin_pct, sort_order) VALUES
('STORE-DEMO-1283', 'Apr', 28.50, 1),
('STORE-DEMO-1283', 'Mei', 31.20, 2),
('STORE-DEMO-1283', 'Jun', 34.10, 3),
('STORE-DEMO-1283', 'Jul', 36.30, 4)
ON CONFLICT DO NOTHING;

-- Finance Expenses
INSERT INTO public.umkm_ai_finance_expenses (store_id, category, amount_idr, percentage, color_hex, sort_order) VALUES
('STORE-DEMO-1283', 'Cost of Goods Sold', 5400000, 62.8, '#ef4444', 1),
('STORE-DEMO-1283', 'Marketing & Ads', 1200000, 14.0, '#a855f7', 2),
('STORE-DEMO-1283', 'Platform Fees (Shopee/Tokped)', 850000, 9.9, '#f97316', 3),
('STORE-DEMO-1283', 'Packaging & Shipping', 620000, 7.2, '#3b82f6', 4),
('STORE-DEMO-1283', 'AI Tools & Subscription', 350000, 4.1, '#10b981', 5),
('STORE-DEMO-1283', 'Lain-lain', 180000, 2.0, '#94a3b8', 6)
ON CONFLICT DO NOTHING;

-- Finance Transactions
INSERT INTO public.umkm_ai_finance_transactions (store_id, description, tx_type, amount_idr, tx_date, payment_method) VALUES
('STORE-DEMO-1283', 'Pembayaran Order #1847', 'income', 450000, '31 Jul', 'Transfer Bank'),
('STORE-DEMO-1283', 'Pembelian Stok Kaos', 'expense', -1200000, '30 Jul', 'Transfer'),
('STORE-DEMO-1283', 'Komisi Shopee Fee', 'expense', -85000, '30 Jul', 'Auto-deduct'),
('STORE-DEMO-1283', 'Pembayaran Order #1846', 'income', 680000, '29 Jul', 'QRIS'),
('STORE-DEMO-1283', 'Subscription ZEGA AI Growth', 'expense', -349000, '28 Jul', 'Kartu Kredit')
ON CONFLICT DO NOTHING;

-- Customer Growth Trend
INSERT INTO public.umkm_ai_customers_growth (store_id, period_label, total_customers, new_customers, sort_order) VALUES
('STORE-DEMO-1283', 'Jan', 180, 28, 1),
('STORE-DEMO-1283', 'Feb', 210, 32, 2),
('STORE-DEMO-1283', 'Mar', 256, 46, 3),
('STORE-DEMO-1283', 'Apr', 298, 42, 4),
('STORE-DEMO-1283', 'Mei', 352, 54, 5),
('STORE-DEMO-1283', 'Jun', 408, 56, 6),
('STORE-DEMO-1283', 'Jul', 486, 78, 7)
ON CONFLICT DO NOTHING;

-- Customer Segments
INSERT INTO public.umkm_ai_customers_segments (store_id, segment_name, customer_count, percentage, spend_range, color_hex, sort_order) VALUES
('STORE-DEMO-1283', 'Champions', 48, 10, 'Rp2.1M+', '#10b981', 1),
('STORE-DEMO-1283', 'Loyal Customers', 86, 18, 'Rp1.2M–2M', '#3b82f6', 2),
('STORE-DEMO-1283', 'Potential Loyalist', 112, 23, 'Rp600K–1.2M', '#8b5cf6', 3),
('STORE-DEMO-1283', 'New Customers', 150, 31, '< Rp300K', '#f59e0b', 4),
('STORE-DEMO-1283', 'At Risk', 58, 12, 'Inactive 30d+', '#f97316', 5),
('STORE-DEMO-1283', 'Hibernating', 32, 6, 'Inactive 90d+', '#ef4444', 6)
ON CONFLICT DO NOTHING;

-- Customer Regions
INSERT INTO public.umkm_ai_customers_regions (store_id, region_name, customer_count, percentage, revenue_idr, sort_order) VALUES
('STORE-DEMO-1283', 'DKI Jakarta', 128, 26.3, 4200000, 1),
('STORE-DEMO-1283', 'Jawa Barat', 92, 18.9, 2800000, 2),
('STORE-DEMO-1283', 'Jawa Timur', 68, 14.0, 2100000, 3),
('STORE-DEMO-1283', 'Banten', 54, 11.1, 1600000, 4),
('STORE-DEMO-1283', 'Jawa Tengah', 42, 8.6, 1200000, 5),
('STORE-DEMO-1283', 'Sumatera Utara', 28, 5.8, 800000, 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENTERPRISE RPC STORED PROCEDURES
-- ============================================================================

-- Consolidated RPC: get_umkm_ai_intelligence_subpage
CREATE OR REPLACE FUNCTION public.get_umkm_ai_intelligence_subpage(
    p_store_id TEXT DEFAULT 'STORE-DEMO-1283',
    p_subpage TEXT DEFAULT 'sales'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF p_subpage = 'sales' THEN
        SELECT jsonb_build_object(
            'pipeline', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT stage, deal_count, deal_value_idr, conversion_pct, color_hex FROM public.umkm_ai_sales_pipeline WHERE store_id = p_store_id ORDER BY sort_order) r),
            'orderStatus', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT status, order_count, percentage, color_hex FROM public.umkm_ai_sales_order_status WHERE store_id = p_store_id) r),
            'dailyTrend', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT day_label, revenue_idr FROM public.umkm_ai_sales_daily_trend WHERE store_id = p_store_id ORDER BY sort_order) r),
            'performers', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT performer_name, avatar_emoji, deals_closed, revenue_idr FROM public.umkm_ai_sales_performers WHERE store_id = p_store_id ORDER BY sort_order) r)
        ) INTO v_result;

    ELSIF p_subpage = 'marketing' THEN
        SELECT jsonb_build_object(
            'campaigns', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT campaign_name, channel, status, sent_count, opened_count, clicked_count, revenue_idr, roi_pct FROM public.umkm_ai_marketing_campaigns WHERE store_id = p_store_id) r),
            'channelROI', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT channel, spend_idr, revenue_idr, roi_pct, color_hex FROM public.umkm_ai_marketing_channel_roi WHERE store_id = p_store_id ORDER BY sort_order) r),
            'engagement', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT period_label, impressions, clicks, conversions FROM public.umkm_ai_marketing_engagement WHERE store_id = p_store_id ORDER BY sort_order) r),
            'topContent', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT content_type, title, views, engagement_pct, leads_generated FROM public.umkm_ai_marketing_content WHERE store_id = p_store_id ORDER BY sort_order) r)
        ) INTO v_result;

    ELSIF p_subpage = 'store' THEN
        SELECT jsonb_build_object(
            'inventoryKpi', (SELECT row_to_json(r)::jsonb FROM (SELECT total_sku, low_stock_count, out_of_stock_count, avg_inventory_days FROM public.umkm_ai_store_inventory_kpi WHERE store_id = p_store_id LIMIT 1) r),
            'categories', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT category_name, product_count, revenue_idr, percentage, growth_pct, color_hex FROM public.umkm_ai_store_categories WHERE store_id = p_store_id ORDER BY sort_order) r),
            'turnover', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT segment_label, product_count, percentage, color_hex FROM public.umkm_ai_store_turnover WHERE store_id = p_store_id ORDER BY sort_order) r),
            'lowStock', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT product_name, current_stock, avg_sold_monthly, days_until_empty, urgency FROM public.umkm_ai_store_low_stock WHERE store_id = p_store_id ORDER BY sort_order) r)
        ) INTO v_result;

    ELSIF p_subpage = 'finance' THEN
        SELECT jsonb_build_object(
            'pnl', (SELECT row_to_json(r)::jsonb FROM (SELECT gross_revenue_idr, cogs_idr, gross_profit_idr, opex_idr, net_profit_idr, profit_margin_pct, gross_margin_pct FROM public.umkm_ai_finance_pnl WHERE store_id = p_store_id LIMIT 1) r),
            'cashflow', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT period_label, income_idr, expense_idr FROM public.umkm_ai_finance_cashflow WHERE store_id = p_store_id ORDER BY sort_order) r),
            'marginTrend', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT period_label, margin_pct FROM public.umkm_ai_finance_margin_trend WHERE store_id = p_store_id ORDER BY sort_order) r),
            'expenses', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT category, amount_idr, percentage, color_hex FROM public.umkm_ai_finance_expenses WHERE store_id = p_store_id ORDER BY sort_order) r),
            'transactions', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT description, tx_type, amount_idr, tx_date, payment_method FROM public.umkm_ai_finance_transactions WHERE store_id = p_store_id ORDER BY created_at DESC LIMIT 10) r)
        ) INTO v_result;

    ELSIF p_subpage = 'customers' THEN
        SELECT jsonb_build_object(
            'growth', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT period_label, total_customers, new_customers FROM public.umkm_ai_customers_growth WHERE store_id = p_store_id ORDER BY sort_order) r),
            'segments', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT segment_name, customer_count, percentage, spend_range, color_hex FROM public.umkm_ai_customers_segments WHERE store_id = p_store_id ORDER BY sort_order) r),
            'regions', (SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (SELECT region_name, customer_count, percentage, revenue_idr FROM public.umkm_ai_customers_regions WHERE store_id = p_store_id ORDER BY sort_order) r)
        ) INTO v_result;

    ELSE
        v_result := '{}'::jsonb;
    END IF;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'umkm_ai_sales_pipeline','umkm_ai_sales_order_status','umkm_ai_sales_daily_trend','umkm_ai_sales_performers',
    'umkm_ai_marketing_campaigns','umkm_ai_marketing_channel_roi','umkm_ai_marketing_engagement','umkm_ai_marketing_content',
    'umkm_ai_store_inventory_kpi','umkm_ai_store_categories','umkm_ai_store_turnover','umkm_ai_store_low_stock',
    'umkm_ai_finance_pnl','umkm_ai_finance_cashflow','umkm_ai_finance_margin_trend','umkm_ai_finance_expenses','umkm_ai_finance_transactions',
    'umkm_ai_customers_growth','umkm_ai_customers_segments','umkm_ai_customers_regions'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    BEGIN
      EXECUTE format('CREATE POLICY "Allow public read %s" ON public.%I FOR SELECT USING (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- SUPABASE REALTIME PUBLICATION
-- ============================================================================
DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'umkm_ai_sales_pipeline','umkm_ai_sales_order_status','umkm_ai_sales_daily_trend',
    'umkm_ai_marketing_campaigns','umkm_ai_marketing_channel_roi',
    'umkm_ai_store_inventory_kpi','umkm_ai_store_categories','umkm_ai_store_low_stock',
    'umkm_ai_finance_pnl','umkm_ai_finance_cashflow','umkm_ai_finance_transactions',
    'umkm_ai_customers_growth','umkm_ai_customers_segments','umkm_ai_customers_regions'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

COMMIT;
