-- ============================================================================
-- Migration 60: ZEGA Enterprise UMKM Knowledge Hub Articles & Slug Support
-- Created: 2026-08-08
-- Description: Adds slug support to Categories and Articles tables, seeds complete 
--              rich articles for every category, and updates category stats.
-- ============================================================================

-- 1. Add Slug Columns Defensively
ALTER TABLE public.umkm_knowledge_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.umkm_knowledge_items ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_umkm_k_cat_slug ON public.umkm_knowledge_categories(store_id, slug);
CREATE INDEX IF NOT EXISTS idx_umkm_k_items_slug ON public.umkm_knowledge_items(store_id, slug);

-- 2. Seed Real Enterprise Categories & Articles for Default UMKM Store
DO $$
DECLARE
    v_store_id TEXT;
    v_cat_sop UUID;
    v_cat_logistics UUID;
    v_cat_pos UUID;
    v_cat_tax UUID;
    v_cat_mkt UUID;
    v_cat_produk UUID;
BEGIN
    SELECT id::TEXT INTO v_store_id FROM public.umkm_stores ORDER BY created_at ASC LIMIT 1;
    IF v_store_id IS NULL THEN
        v_store_id := 'STORE-DEMO-1283';
    END IF;

    -- Upsert Categories with Slugs
    INSERT INTO public.umkm_knowledge_categories (id, store_id, name, slug, description, icon_name, color_code, item_count)
    VALUES
    (gen_random_uuid(), v_store_id, 'Prosedur Operasional', 'prosedur-operasional', 'SOP standar pengolahan, packaging, retur, dan layanan pelanggan.', 'BookOpen', 'orange', 5),
    (gen_random_uuid(), v_store_id, 'Shipping & Logistik', 'shipping-logistik', 'Panduan pengiriman, kurir sameday, resi, dan klaim asuransi.', 'Truck', 'blue', 4),
    (gen_random_uuid(), v_store_id, 'Sales & Kasir POS', 'sales-kasir-pos', 'Tata cara transaksi POS, penerimaan QRIS, dan pencatatan kasir.', 'ShoppingCart', 'emerald', 4),
    (gen_random_uuid(), v_store_id, 'Invoice & Perpajakan', 'invoice-perpajakan', 'Membuat invoice resmi, nota otomatis, dan rekap e-faktur.', 'FileText', 'purple', 3),
    (gen_random_uuid(), v_store_id, 'Marketing & Promosi', 'marketing-promosi', 'Strategi promosi marketplace, copywriting, dan WhatsApp broadcast.', 'Sparkles', 'pink', 4),
    (gen_random_uuid(), v_store_id, 'Produk', 'produk', 'Katalog standar mutu, spesifikasi produk, dan kontrol kualitas.', 'Folder', 'indigo', 3)
    ON CONFLICT DO NOTHING;

    -- Update category slugs for existing categories
    UPDATE public.umkm_knowledge_categories SET slug = 'prosedur-operasional' WHERE name = 'Prosedur Operasional';
    UPDATE public.umkm_knowledge_categories SET slug = 'shipping-logistik' WHERE name = 'Shipping & Logistik';
    UPDATE public.umkm_knowledge_categories SET slug = 'sales-kasir-pos' WHERE name = 'Sales & Kasir POS';
    UPDATE public.umkm_knowledge_categories SET slug = 'invoice-perpajakan' WHERE name = 'Invoice & Perpajakan';
    UPDATE public.umkm_knowledge_categories SET slug = 'marketing-promosi' WHERE name = 'Marketing & Promosi';
    UPDATE public.umkm_knowledge_categories SET slug = 'produk' WHERE name = 'Produk';

    -- Fetch Category UUIDs
    SELECT id INTO v_cat_sop FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Prosedur Operasional' LIMIT 1;
    SELECT id INTO v_cat_logistics FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Shipping & Logistik' LIMIT 1;
    SELECT id INTO v_cat_pos FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Sales & Kasir POS' LIMIT 1;
    SELECT id INTO v_cat_tax FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Invoice & Perpajakan' LIMIT 1;
    SELECT id INTO v_cat_mkt FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Marketing & Promosi' LIMIT 1;
    SELECT id INTO v_cat_produk FROM public.umkm_knowledge_categories WHERE store_id::TEXT = v_store_id::TEXT AND name = 'Produk' LIMIT 1;

    -- Seed Comprehensive Knowledge Articles with Full Contents and Slugs
    INSERT INTO public.umkm_knowledge_items 
    (id, store_id, category_id, category_name, title, slug, description, content, badge_label, badge_type, status, author_name, author_role, views_count, rating_score, rating_count, is_bookmarked, cdn_media_urls)
    VALUES
    -- Prosedur Operasional
    (gen_random_uuid(), v_store_id, v_cat_sop, 'Prosedur Operasional', 'SOP Pembukaan & Penutupan Toko Harian', 'sop-pembukaan-penutupan-toko-harian',
     'Panduan standar alur operasional pembukaan toko dan pengecekan inventaris pagi/malam.',
     '# SOP Pembukaan & Penutupan Toko Harian

## 1. Prosedur Pembukaan Toko (Shift Pagi - 08:00 WIB)
1. **Pemeriksaan Fisik Area**: Pastikan pintu utama, alarm keamanan, dan pencahayaan etalase toko menyala dengan sempurna.
2. **Audit Kasir Awal**: Buka drawer kasir, verifikasi uang modal kasir sebesar **Rp 500.000** (pecahan Rp 5.000, 10.000, 20.000).
3. **Penyalaan Sistem POS**: Login ke sistem **ZEGA POS Engine**, pastikan printer thermal struk terhubung dan kertas kasir mencukupi.
4. **Pemeriksaan Stok Display**: Lakukan pemindaian barang etalase harian dan catat barang yang hampir habis di papan *Restock Notice*.

## 2. Prosedur Operasional Berjalan (Shift Siang)
- Selalu memberikan salam standar perusahaan ke pelanggan: *"Selamat datang di ZEGA Store, ada yang bisa kami bantu?"*
- Untuk pesanan online (Tokopedia, Shopee, TikTok Shop), cetak label resi otomatis dari menu **Unified Shipping**.

## 3. Prosedur Penutupan Toko (Shift Malam - 21:00 WIB)
1. Hitung total pencatatan kasir tunai vs transaksi QRIS di aplikasi **ZEGA POS**.
2. Lakukan *Shift Closing Report* dan kirim rekapitulasi harian via WhatsApp Group Manajemen.
3. Kunci seluruh etalase, matikan pendingin ruangan (AC), dan aktifkan kamera CCTV & alarm toko.',
     'Prosedur', 'prosedur', 'Published', 'Cik Berliuk', 'UMKM Owner', 620, 5.00, 32, TRUE, '["https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/SOP-Operasional.pdf"]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_sop, 'Prosedur Operasional', 'Kebijakan Pengembalian Barang & Retur (V2)', 'kebijakan-pengembalian-barang-retur-v2',
     'Panduan komprehensif retur produk cacat dari pelanggan toko online dan offline.',
     '# Kebijakan Retur & Pengembalian Barang V2

## Syarat & Ketentuan Retur
1. **Video Unboxing**: Pelanggan wajib melampirkan video unboxing tanpa jeda saat membuka paket dari kurir.
2. **Batas Waktu Klaim**: Maksimal **3x24 jam** sejak status kurir dinyatakan *Delivered*.
3. **Kondisi Produk**: Tag produk belum terlepas, kemasan fisik utuh, dan tidak ada bekas pemakaian.

## Alur Penanganan Komplain Pelanggan
- Staf Customer Service memeriksa kecocokan nomor resi dengan database transaksi ZEGA CRM.
- Jika disetujui, buatkan **Voucher Replacement** atau **Form Refund Dana Realtime**.',
     'Prosedur', 'prosedur', 'Published', 'Admin Operasional', 'Operations', 480, 4.85, 20, FALSE, '[]'::jsonb),

    -- Shipping & Logistik
    (gen_random_uuid(), v_store_id, v_cat_logistics, 'Shipping & Logistik', 'Panduan Pengiriman Kurir Instant & Sameday', 'panduan-pengiriman-kurir-instant-sameday',
     'Aturan batas waktu request pick up kurir GoSend, GrabExpress, dan Shopee Express.',
     '# Panduan Pengiriman Kurir Instant & Sameday

## Cut-Off Time Request Pick-Up
- **Kurir Sameday**: Request driver maksimal pukul **14:30 WIB** setiap hari kerja.
- **Kurir Instant (1 Jam)**: Request driver maksimal pukul **17:00 WIB**.

## Prosedur Serah Terima Paket ke Driver
1. Pastikan nomor *Order ID* pada label resi cetak sesuai dengan aplikasi driver.
2. Minta driver memperlihatkan aplikasi dan melakukan foto verifikasi penyerahan paket.
3. Update status pesanan di dashboard ZEGA menjadi *"Dipickup Kurir"*.',
     'Logistik', 'prosedur', 'Published', 'Tim Gudang', 'Logistics Lead', 510, 4.90, 28, FALSE, '[]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_logistics, 'Shipping & Logistik', 'SOP Klaim Asuransi Kerusakan Pengiriman Express', 'sop-klaim-asuransi-kerusakan-pengiriman-express',
     'Prosedur klaim ganti rugi ke ekspedisi jika paket rusak atau hilang di jalan.',
     '# SOP Klaim Asuransi Kerusakan Pengiriman

## Berkas Persyaratan Klaim Asuransi
- Foto resi pengiriman asli yang tertempel di paket.
- Foto 5 sisi fisik kemasan outer box yang rusak saat diterima konsumen.
- Invoice pembelian asli dari sistem ZEGA Sales Hub.

## Langkah Pengajuan
1. Buka menu **Shipping Center** -> Klik tombol **"Klaim Asuransi Kurir"**.
2. Lampirkan foto bukti dan deskripsi kronologi kerusakan.
3. Tim ZEGA Logistics Engine akan memproses penggantian dana dalam **2x24 jam** kerja.',
     'Prosedur', 'prosedur', 'Published', 'Logistics Lead', 'Logistics', 390, 4.75, 14, TRUE, '["https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Template-Surat-Jalan.docx"]'::jsonb),

    -- Sales & Kasir POS
    (gen_random_uuid(), v_store_id, v_cat_pos, 'Sales & Kasir POS', 'Tata Cara Transaksi Pembayaran QRIS & E-Wallet', 'tata-cara-transaksi-pembayaran-qris-ewallet',
     'Petunjuk kasir dalam memproses pembayaran QRIS Statis dan Dinamis.',
     '# Tata Cara Transaksi Pembayaran QRIS & E-Wallet

## 1. Metode QRIS Dinamis (Layar POS)
1. Pilih item belanjaan pelanggan di layar **ZEGA POS**.
2. Klik metode pembayaran **"QRIS Dinamis"**.
3. Sistem akan memunculkan Kode QR dengan nominal presisi di monitor kasir.
4. Setelah pelanggan memindai, tunggu lampu hijau **"Payment Success"** di layar kasir sebelum menyerahkan struk.

## 2. Penanganan Transaksi QRIS Pending
- Jika pembayaran di aplikasi pelanggan terpotong tetapi layar kasir masih *Pending*, lakukan verifikasi via **Mutasi Realtime ZEGA Bank Engine** tanpa meminta pembayaran ulang.',
     'Sales POS', 'sales', 'Published', 'Kasir Utama', 'Store Front', 740, 4.95, 45, TRUE, '["https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Rekap-Penjualan.xlsx"]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_pos, 'Sales & Kasir POS', 'Panduan Rekonsiliasi Kasir & Setoran Harian', 'panduan-rekonsiliasi-kasir-setoran-harian',
     'Prosedur penutupan shift kasir dan pencocokan total penjualan tunai dengan modal kasir.',
     '# Panduan Rekonsiliasi Kasir & Setoran Harian

## Langkah-Langkah Penutupan Shift Kasir
1. Hitung total uang tunai yang terkumpul di dalam laci kasir (Cash Drawer).
2. Bandingkan dengan ringkasan laporan penjualan tunai otomatis di aplikasi **ZEGA POS**.
3. Jika terdapat selisih uang, wajib dicatat pada lembar **Audit Selisih Kasir**.
4. Setorkan uang tunai penjualan harian ke brankas utama toko dengan pengawalan Supervisor.',
     'Prosedur', 'prosedur', 'Published', 'Finance Lead', 'Finance', 410, 4.80, 18, FALSE, '[]'::jsonb),

    -- Invoice & Perpajakan
    (gen_random_uuid(), v_store_id, v_cat_tax, 'Invoice & Perpajakan', 'Cara Membuat Invoice Otomatis Pelanggan', 'cara-membuat-invoice-otomatis-pelanggan',
     'Panduan lengkap membuat invoice otomatis untuk semua pesanan melalui ZEGA Finance Engine.',
     '# SOP Pembuatan Invoice Otomatis

## Keunggulan Invoice Otomatis ZEGA
Setiap pesanan yang diselesaikan di toko otomatis tergenerasi menjadi berkas **PDF resmi ber-Enkripsi SSL** yang tersimpan di Cloudflare R2 CDN.

## Cara Mengirimkan Invoice ke WhatsApp Pelanggan
1. Masuk ke modul **Finance & Billing** -> Pilih daftar transaksi.
2. Klik tombol **"Generasi Invoice PDF"**.
3. Pilih opsi **"Kirim via WhatsApp Bot"** untuk mengirimkan tautan nota aman ke nomor pelanggan.',
     'Invoice', 'prosedur', 'Published', 'Cik Berliuk', 'UMKM Owner', 532, 4.90, 24, FALSE, '["https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Invoice-Template.pdf"]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_tax, 'Invoice & Perpajakan', 'Panduan Rekap e-Faktur Pajak UMKM 0.5%', 'panduan-rekap-efaktur-pajak-umkm-05',
     'Tata cara rekapitulasi PPh Final UMKM 0.5% secara otomatis bulanan.',
     '# Panduan Rekap e-Faktur Pajak UMKM 0.5%

## Tarif PPh Final UMKM
Berdasarkan PP 55 Tahun 2022, UMKM bertarif **0.5%** dari omzet kotor per bulan.

## Cara Mengunduh Rekap Pajak Bulanan
1. Akses menu **Tax & Accounting** -> Laporan Bulanan.
2. Klik **"Ekspor Format e-Faktur DJP"** untuk mengunduh berkas CSV rekap omzet kotor yang siap diimpor ke sistem pajak DJP Online.',
     'Perpajakan', 'prosedur', 'Published', 'Konsultan Pajak', 'Finance Advisor', 360, 4.70, 15, FALSE, '[]'::jsonb),

    -- Marketing & Promosi
    (gen_random_uuid(), v_store_id, v_cat_mkt, 'Marketing & Promosi', 'Panduan Broadcast WhatsApp Promosi Pelanggan Baru', 'panduan-broadcast-whatsapp-promosi-pelanggan-baru',
     'Template pesan dan strategi broadcast WhatsApp ke pelanggan loyal.',
     '# Panduan Broadcast WhatsApp Promosi

## Formula Copywriting Konversi Tinggi
*"Halo Kak {nama}, terima kasih telah berbelanja di ZEGA Store! Dapatkan voucher diskon 20% khusus pesanan kedua Kakak hari ini dengan menyertakan kode promo: ZEGAHERO20."*

## Etika Broadcast WA Business
- Kirim pesan broadcast maksimal 1x seminggu pada jam istirahat (12:00 - 13:00 WIB atau 19:00 WIB).
- Pastikan mencantumkan opsi pembatalan berlangganan (*Opt-Out*).',
     'Marketing', 'template', 'Published', 'Marketing Lead', 'Marketing', 820, 4.98, 56, TRUE, '[]'::jsonb),

    (gen_random_uuid(), v_store_id, v_cat_mkt, 'Marketing & Promosi', 'Strategi Promo Flash Sale Marketplace', 'strategi-promo-flash-sale-marketplace',
     'SOP persiapan stok dan harga diskon untuk event tanggal kembar (11.11 / 12.12).',
     '# Strategi Promo Flash Sale Marketplace

## Persiapan Pra-Flash Sale (H-3)
1. Tentukan produk *Hero Product* dengan margin sehat min. 35%.
2. Alokasikan stok khusus Flash Sale agar tidak mengganggu persediaan toko fisik.
3. Uji coba respon sistem pencatatan otomatis di dashboard **ZEGA Store Engine**.',
     'Marketing', 'prosedur', 'Published', 'Store Manager', 'Management', 490, 4.88, 22, FALSE, '[]'::jsonb),

    -- Produk
    (gen_random_uuid(), v_store_id, v_cat_produk, 'Produk', 'Spesifikasi & Standard Kualitas Produk UMKM', 'spesifikasi-standard-kualitas-produk-umkm',
     'Dokumen kontrol mutu barang sebelum masuk ke etalase toko.',
     '# Spesifikasi & Standard Kualitas Produk UMKM

## Kriteria Penilaian Quality Control (QC)
1. **Kemasan Outer & Inner**: Bebas penyok, tanggal kedaluwarsa terlihat jelas (minimal > 12 bulan).
2. **Kesesuaian Barcode**: Barcode SKU barang dapat terbaca dengan lancar oleh *Barcode Scanner POS*.
3. **Sertifikasi Halal & BPOM**: Memiliki lisensi resmi terdaftar pada database sistem.',
     'Produk', 'prosedur', 'Published', 'QC Specialist', 'Quality Control', 350, 4.80, 19, FALSE, '["https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/docs/Brosur-Produk.png"]'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Generate slugs for any item missing slug
    UPDATE public.umkm_knowledge_items 
    SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
    WHERE slug IS NULL OR slug = '';

    -- Update category item_count stats dynamically
    UPDATE public.umkm_knowledge_categories c
    SET item_count = (SELECT COUNT(*) FROM public.umkm_knowledge_items i WHERE i.category_name = c.name AND i.store_id::TEXT = c.store_id::TEXT);

END $$;
