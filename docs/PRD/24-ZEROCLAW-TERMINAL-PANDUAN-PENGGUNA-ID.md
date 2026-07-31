# PRD 24 — Panduan Pengguna & Operasional ZeroClaw Terminal (Spesifikasi Bahasa Indonesia)

## 1. Ringkasan Eksekutif & Misi Utama
**ZeroClaw Terminal** adalah konsol utama orkestrasi agent AI dan manajemen pembayaran Solana Pay POS yang dibangun di dalam **ZEGA AI Platform** ([zegaai.site](https://zegaai.site)). Dirancang dengan prinsip *zero-trust blockchain execution*, ZeroClaw memungkinkan usaha mikro, kecil, dan menengah (UMKM) serta perusahaan skala besar (Enterprise) untuk mengeksekusi pembayaran berbasis AI, mengelola escrow otomatis antar agent, memantau feed live Solana Devnet RPC, serta menerapkan kontrol keamanan standar OWASP.

---

## 2. Penggunaan ZeroClaw Terminal pada Mode UMKM (Merchant / Kasir Toko)

### Target Pengguna
Kasir toko, warung, kafe, merchant retail, dan penjual e-commerce yang membutuhkan pembuatan invoice Solana Pay secara instan tanpa perlu mengelola private key di sisi server.

### Fitur Utama & Standar Protokol Terbaru
- **Tier 1 Keyless Custody**: Pembayaran diterima langsung ke alamat publik merchant (`7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`). Tidak ada private key yang disimpan di memori server.
- **Universal Scannable QR Code & URI Solana Pay**: Menggunakan format URI Solana Pay standar murni yang 100% kompatibel dengan pemindai HP (Phantom, Solflare, Backpack):
  ```text
  solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?amount=15.00
  ```
  *Bebas dari double-encoding URL dan masalah token lookup saat wallet dalam mode Mainnet.*
- **Ekstraksi Nominal Cerdas & Dokumen Lokal Indonesia**:
  - Otomatis mengubah koma desimal Indonesia menjadi titik (`1,7` -> `1.7`).
  - Regex Ekstraksi Pintar: Mengutamakan nominal ber-tag mata uang atau kurung (misal: `"Order 2 Kopi Espresso (15 USDC)"` -> diekstrak **15.00 USDC**, bukan angka kuantitas `2`).
- **Pemisahan Aksi Tombol Manual & Link URI**:
  - **`Copy Wallet`**: Menyalin alamat publik murni Base58 (`7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`) untuk pelanggan yang ingin transfer manual.
  - **`Copy Link`**: Menyalin skema URI `solana:...` untuk deep-link wallet.
  - *Tersedia di Invoice Generator dan Hasil Prompt AI Multi-LLM Terminal.*
- **Rekonsiliasi Otomatis & Validasi Tiga Kondisi Pembayaran**:
  1. **🟢 Bayar Pas (100% Settled)**: Transaksi lunas otomatis terverifikasi secara *on-chain* di Devnet.
  2. **🟡 Kurang Bayar (Partial Payment)**: Menampilkan sisa kekurangan dan menyediakan tombol 1-Klik `Buat QR Pelunasan Kekurangan`.
  3. **🔵 Lebih Bayar (Overpayment & Auto-Refund)**: Menampilkan selisih kelebihan, melakukan verifikasi OWASP Anti-Fraud pada signature & wallet pengirim, dan menyediakan tombol 1-Klik `Proses Auto-Refund Safe`.

### Panduan Langkah demi Langkah UMKM
1. **Mengakses Terminal**:
   - Masuk ke Workspace UMKM → Klik menu **Finance** di sebelah kiri, atau tekan tombol hijau **ZeroClaw Solana Pay Terminal** pada header atas.
2. **Membuat Invoice Solana Pay**:
   - **Metode A (Preset Cepat)**: Klik tombol item yang telah dikonfigurasi, seperti `☕ Order 2 Espresso (15 USDC)`.
   - **Metode B (Custom Builder)**: Masukkan nominal USDC, tampilan mata uang (USDC/IDR/SOL), dan catatan pelanggan (misal: *Invoice #9012 - Cafe Latte x2*), lalu klik **Generate Solana Pay URL & Reference Key**.
3. **Menampilkan Permintaan Pembayaran ke Pembeli**:
   - Tunjukkan QR Code yang dihasilkan atau klik **Copy Wallet** (jika pembeli transfer manual) atau **Copy Link** (jika menggunakan deep-link).
   - Pembeli memindai (scan) QR Code langsung menggunakan kamera HP dari Phantom/Solflare/Backpack.
4. **Verifikasi Instan & Penanganan Kasir**:
   - Sistem kasir otomatis menampilkan modal status rekonsiliasi.
   - Jika pembayaran pas -> Tekan **Selesai (Kasir Ready)**.
   - Jika kurang bayar -> Tekan **Buat QR Pelunasan Kekurangan** untuk meminta sisa bayar.
   - Jika lebih bayar -> Tekan **Proses Auto-Refund Safe** untuk mengembalikan selisih secara aman.
5. **Mengeksekusi Perintah AI**:
   - Ketik prompt: `"Order 2 Kopi Espresso (15 USDC)"`.
   - AI Agent menghasilkan link dan QR Code Solana Pay untuk **15.00 USDC** beserta tombol **Copy Wallet** dan **Copy Link**.

---

## 3. Penggunaan ZeroClaw Terminal pada Mode Enterprise (B2B / Governance / SecOps)

### Target Pengguna
Perusahaan enterprise, manajer keuangan/treasury, pengembang multi-agent swarm, dan tim operasi keamanan (SecOps) yang mengelola penyelesaian pembayaran B2B volume tinggi dan escrow agent otomatis.

### Fitur Utama
- **Engine Multi-LLM Failover**: Peralihan otomatis antar model **Groq (`llama-3.3-70b-versatile`)**, **Google Gemini (`gemini-1.5-flash`)**, **OpenRouter**, **HuggingFace**, **Jatevo AI**, dan **9Router Swarm**.
- **Machine Commerce & Escrow Agent**: Orkestrasi pekerjaan transaksi antar agent AI dengan verifikasi referensi *zero-trust*.
- **OWASP Prompt Injection Guard & Overpayment Refund Security**: Deteksi dan pembekuan otomatis terhadap pesan prompt berbahaya (`injectionDetected = true`) serta pencegahan fraud pada klaim refund.
- **Tier 2 SOP Human Approval Checkpoints**: Persetujuan manual admin multi-signature untuk penarikan/pengembalian dana yang ditandai (`chk_auto_*`).
- **Telemetri Real-Time & Resolusi CDN**: Antarmuka high-contrast yang aman untuk mode terang/gelap dengan pengiriman aset Cloudflare R2 CDN (`https://cdn.zegaai.site`).

---

## 4. Keamanan & Pembatasan Akses (Rate Limiting)
- **Anti-Throttling**: Batas 30 request/menit per IP address pada endpoint eksekusi.
- **Anti-Chunking**: Batas ukuran payload maksimum 1MB.
- **Resolusi CDN**: `getR2CdnUrl(...)` memastikan pengiriman aset dari `https://cdn.zegaai.site/assets/logo/`.
- **Zero Secrets Exposure**: Tidak ada secret API Key yang disimpan hardcoded dalam repositori atau dokumentasi publik.

