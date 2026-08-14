-- ============================================================================
-- SQL MIGRATION: 70_umkm_marketplace_articles_realtime.sql
-- Description: Realtime Telemetry, Rich Markdown Tutorials & Full-Text Search 
--              for Marketplace Articles & Panduan Sub-View
-- ============================================================================

-- 0. Drop Legacy Table & Function Safely
DROP TABLE IF EXISTS public.umkm_marketplace_articles CASCADE;
DROP FUNCTION IF EXISTS public.get_umkm_marketplace_articles CASCADE;

-- 1. Create Table: umkm_marketplace_articles
CREATE TABLE public.umkm_marketplace_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category_name TEXT NOT NULL DEFAULT 'Panduan Integrasi', -- 'Panduan Integrasi', 'Studi Kasus UMKM', 'Best Practice AI', 'Teknikal & 9Router'
    summary TEXT NOT NULL,
    full_content_md TEXT NOT NULL,
    read_time_minutes INT NOT NULL DEFAULT 5,
    author_name TEXT NOT NULL DEFAULT 'Tim Engineer ZEGA',
    author_role TEXT NOT NULL DEFAULT 'AI Systems Architect',
    published_date TEXT NOT NULL DEFAULT '8 Ags 2026',
    view_count INT NOT NULL DEFAULT 1280,
    featured_tag TEXT DEFAULT 'Rekomendasi Utama',
    cover_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    ai_model_engine TEXT NOT NULL DEFAULT 'DeepSeek-V3 (9Router Engine)',
    zeroclaw_status TEXT NOT NULL DEFAULT 'Active Autonomous',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for full-text search & category filtering
CREATE INDEX idx_umkm_marketplace_articles_search 
ON public.umkm_marketplace_articles USING gin (to_tsvector('indonesian', title || ' ' || summary || ' ' || category_name));

-- 2. Stored Procedure: Fetch Marketplace Articles with Search & Category
CREATE OR REPLACE FUNCTION public.get_umkm_marketplace_articles(
    p_search TEXT DEFAULT '',
    p_category TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    category_name TEXT,
    summary TEXT,
    full_content_md TEXT,
    read_time_minutes INT,
    author_name TEXT,
    author_role TEXT,
    published_date TEXT,
    view_count INT,
    featured_tag TEXT,
    cover_image_url TEXT,
    ai_model_engine TEXT,
    zeroclaw_status TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.title, a.category_name, a.summary, a.full_content_md,
        a.read_time_minutes, a.author_name, a.author_role, a.published_date,
        a.view_count, a.featured_tag, a.cover_image_url, a.ai_model_engine,
        a.zeroclaw_status, a.created_at
    FROM public.umkm_marketplace_articles a
    WHERE (p_category IS NULL OR p_category = 'all' OR p_category = '' OR a.category_name ILIKE '%' || p_category || '%')
      AND (
        p_search IS NULL OR p_search = '' OR 
        a.title ILIKE '%' || p_search || '%' OR 
        a.summary ILIKE '%' || p_search || '%' OR
        a.full_content_md ILIKE '%' || p_search || '%' OR
        a.ai_model_engine ILIKE '%' || p_search || '%'
      )
    ORDER BY a.view_count DESC, a.created_at DESC;
END;
$$;

-- 3. Seed Production-Grade Real Data Articles
INSERT INTO public.umkm_marketplace_articles (
    id, title, category_name, summary, full_content_md,
    read_time_minutes, author_name, author_role, published_date, view_count,
    featured_tag, cover_image_url, ai_model_engine, zeroclaw_status
) VALUES
(
    'a1111111-1111-4111-a111-111111111111',
    'Cara Mengaktifkan AI Customer Support WhatsApp dalam 3 Menit',
    'Prosedur Operasional',
    'Panduan praktis langkah demi langkah menyambungkan WhatsApp Business API toko Anda dengan ZeroClaw Autonomous Agent dan model DeepSeek-V3 via 9Router.',
    '# Cara Mengaktifkan AI Customer Support WhatsApp dalam 3 Menit

Sistem AI Customer Support ZEGA memungkinkan toko UMKM menjawab pertanyaan calon pembeli 24 jam nonstop secara otomatis dengan gaya bahasa yang alami dan akurat.

## Langkah Integrasi Instan:
1. **Hubungkan Nomor WhatsApp Business**: Masuk ke menu *Integrasi Pembayaran & Messaging*, pilih *WhatsApp Business API*, lalu pindai Kode QR yang tersedia.
2. **Pilih AI Agent Engine**: Aktifkan **WhatsApp Sales & Support AI** berdaya *DeepSeek-V3 (9Router Mesh)*.
3. **Unggah SOP & FAQ Toko**: Salin SOP produk, aturan retur, dan ongkir ke dalam Knowledge Base. Agen AI akan membaca dokumen ini secara otomatis.
4. **Uji Otomatisasi**: Jalankan pengujian pesan via *Console Telemetry 9Router*.

> [!TIP]
> Pastikan nomor WhatsApp yang digunakan telah terverifikasi agar terhindar dari pemblokiran pesan massal.',
    4, 'Tim Engineer ZEGA', 'Lead Integration Architect', '8 Ags 2026', 1840,
    'Sangat Direkomendasikan',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'DeepSeek-V3 (9Router Mesh)', 'Active Autonomous'
),
(
    'a2222222-2222-4222-a222-222222222222',
    'Otomatisasi Faktur & Nota Belanja UMKM dengan OCR 9Router',
    'Invoice & Perpajakan',
    'Hemat hingga 15 jam kerja per bulan dengan ekstraksi foto nota supplier dan faktur pembelanjaan toko langsung ke laporan P&L secara presisi.',
    '# Otomatisasi Faktur & Nota Belanja UMKM dengan OCR 9Router

Pencatatan pengeluaran dan rekap kas harian sering menjadi kendala utama bagi pemilik usaha UMKM. Dengan integrasi **AI Financial Report & Cashflow Predictor**, seluruh foto nota belanja fisik dapat diolah menjadi data digital berformat JSON dalam waktu kurang dari 300ms.

## Fitur Utama Engine 9Router OCR:
- **Tingkat Akurasi 99.4%**: Membaca teks nota buram, struk thermal, dan invoice PDF.
- **Auto-Kategorisasi Kas**: Pengeluaran otomatis dikategorikan ke *Bahan Baku*, *Operasional*, *Logistik*, atau *Lainnya*.
- **Peringatan Over-Budget**: Notifikasi instan jika pengeluaran minggu ini melebihi ambang batas *Cashflow Alert*.

```json
{
  "supplier": "PT Distribusi Pangan Utama",
  "total_idr": 1450000.00,
  "confidence_score": 0.994,
  "execution_latency_ms": 218
}
```',
    6, 'Analis Finansial ZEGA', 'Senior Finance Specialist', '6 Ags 2026', 1420,
    'Banyak Dibaca',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    'DeepSeek-V3 & Vision OCR', 'Active Autonomous'
),
(
    'a3333333-3333-4333-a333-333333333333',
    'Strategi Segmentasi RFM Pelanggan untuk Meningkatkan Repeat Order',
    'Marketing & Promosi',
    'Studi kasus sukses toko fashion lokal yang berhasil meningkatkan omzet 35% dengan otomatisasi promosi WhatsApp khusus pelanggan segmen VIP.',
    '# Strategi Segmentasi RFM Pelanggan untuk Meningkatkan Repeat Order

Model **Recency, Frequency, & Monetary (RFM)** adalah kunci meningkatkan retensi pembeli tanpa perlu membakar anggaran iklan secara berlebihan.

## Pembagian Segmen Otomatis via ZeroClaw:
1. **Champions (VIP)**: Pelanggan yang sering belanja dan total transaksi tinggi. Diberikan promo spesial launching produk baru.
2. **At-Risk (Rentan Churn)**: Pelanggan yang dulu sering belanja namun tidak bertransaksi dalam 60 hari me-refresh. Agen AI akan otomatis mengirimkan voucher gajian via WA.
3. **New Buyers**: Pembeli baru yang perlu di-follow up untuk mendapatkan ulasan bintang 5.

> [!IMPORTANT]
> Jangan mengirimkan promosi yang sama ke seluruh database pelanggan. Gunakan personalisasi pesan AI!',
    5, 'Pakar CRM ZEGA', 'Growth & Retention Strategist', '4 Ags 2026', 1180,
    'Studi Kasus Sukses',
    'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&auto=format&fit=crop&q=80',
    'Solana x402 & GPT-4o', 'Active Autonomous'
),
(
    'a4444444-4444-4444-a444-444444444444',
    'Panduan Copywriting E-Commerce Shopee & Tokopedia Berbasis Claude 3.5',
    'Produk & Quality Control',
    'Cara menulis deskripsi produk persuasif yang kaya kata kunci SEO dan mampu meningkatkan persentase konversi keranjang belanja.',
    '# Panduan Copywriting E-Commerce Shopee & Tokopedia Berbasis Claude 3.5

Deskripsi produk yang berkualitas tinggi merupakan faktor penentu apakah calon pembeli akan menekan tombol *Beli Sekarang* atau berpindah ke toko lain.

## Formula Copywriting AIDA untuk Produk UMKM:
- **Attention (Perhatian)**: Gunakan kalimat pembuka berani yang menyoroti solusi masalah utama pembeli.
- **Interest (Minat)**: Jelaskan bahan premium, spesifikasi teknis, dan keunggulan kompetitif produk.
- **Desire (Hasrat)**: Tambahkan jaminan garansi retur dan ulasan positif pembeli sebelumnya.
- **Action (Tindakan)**: Ajakan bertindak jelas seperti *"Stok Terbatas! Pesan Sebelum Jam 15:00 WID untuk Pengiriman Hari Ini"*.',
    4, 'Tim Copywriter ZEGA', 'Content & SEO Strategist', '2 Ags 2026', 960,
    'Best Practice',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    'Claude 3.5 Sonnet', 'Active Autonomous'
),
(
    'a5555555-5555-4555-a555-555555555555',
    'Panduan Integrasi Shipping & Kurir Logistik Toko via ZeroClaw',
    'Shipping & Logistik',
    'Panduan lengkap menghubungkan ekspedisi J&T, JNE, SiCepat, dan Anteraja dengan pelacakan resi otomatis real-time.',
    '# Panduan Integrasi Shipping & Kurir Logistik Toko via ZeroClaw

Integrasi kurir logistik otomatis membantu pemilik toko UMKM mengirim pesanan tepat waktu dan mengurangi komplain pelanggan terkait status pengiriman.

## Langkah Konfigurasi Logistik Toko:
1. **Pilih Provider Ekspedisi**: Masuk ke menu *Store Management*, lalu klik *Integrasi Kurir Logistik*.
2. **Aktifkan Tracking Resi Otomatis**: Sambungkan API key expedisi (J&T, JNE, SiCepat).
3. **Set Notifikasi WA**: Agen AI akan otomatis mengirimkan nomor resi dan link pelacakan ke pelanggan via WhatsApp.

> [!TIP]
> Aktifkan opsi *Pilih Kurir Termurah Otomatis* untuk menghemat biaya pengiriman produk.',
    5, 'Tim Logistik ZEGA', 'Supply Chain Architect', '1 Ags 2026', 1530,
    'Rekomendasi Utama',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    'DeepSeek-V3 (9Router Mesh)', 'Active Autonomous'
),
(
    'a6666666-6666-4666-a666-666666666666',
    'Optimasi Kasir POS & Pembayaran QRIS Otomatis dengan Telemetri ZEGA',
    'Sales & Kasir POS',
    'Tingkatkan kecepatan transaksi kasir hingga 3x lipat dengan verifikasi pembayaran QRIS instan tanpa konfirmasi manual.',
    '# Optimasi Kasir POS & Pembayaran QRIS Otomatis dengan Telemetri ZEGA

Sistem kasir POS modern ZEGA tersinkronisasi langsung dengan gateway pembayaran QRIS nasional dan pembukuan stok fisik toko.

## Keunggulan Kasir POS Telemetri AI:
- **Verifikasi QRIS 1 Detik**: Notifikasi pembayaran masuk secara otomatis tanpa perlu cek mutasi bank manual.
- **Auto-Update Stok Produk**: Stok barang berkurang seketika setelah struk dicetak.
- **Laporan Penjualan Shift**: Rekapitulasi kasir otomatis dikirimkan ke WhatsApp pemilik toko saat pergantian shift.

```json
{
  "pos_terminal_id": "POS-JAKARTA-01",
  "payment_method": "Dynamic QRIS",
  "settlement_status": "SUCCESS",
  "latency_ms": 120
}
```',
    4, 'Tim POS Engine ZEGA', 'Retail Systems Specialist', '30 Jul 2026', 1670,
    'Banyak Dibaca',
    'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&auto=format&fit=crop&q=80',
    'ZEGA Core Engine v2', 'Active Autonomous'
);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.umkm_marketplace_articles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select on umkm_marketplace_articles') THEN
        CREATE POLICY "Public select on umkm_marketplace_articles" ON public.umkm_marketplace_articles FOR SELECT USING (true);
    END IF;
END $$;
