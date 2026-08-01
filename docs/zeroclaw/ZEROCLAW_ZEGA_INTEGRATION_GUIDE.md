# Panduan Integrasi Lengkap: ZeroClaw AI v0.8.3 Real Gateway x ZEGA AI Engine

Document Version: 2.0.0 (Production & Real Gateway Release)  
Target Audience: User Individu, Pengusaha UMKM, Enterprise Engineers, & Auditor Keamanan Solana.

---

## 🚀 1. Pengenalan ZeroClaw AI Agent Runtime v0.8.3

**ZeroClaw** adalah runtime agen AI mandiri (*self-hosted, ultra-lightweight Rust agent node*) yang dirancang khusus untuk mengorkestrasi pembayaran on-chain Solana Pay, pembuatan invoice QR otomatis, verifikasi tanda tangan RPC Solana Devnet/Mainnet, dan guardrail keamanan berbasis **Standard Operating Procedure (SOP) Approval Checkpoints**.

Pada ekosistem **ZEGA AI**, ZeroClaw bertindak sebagai **Tier 1 (Keyless) Financial Custody Layer** dan terhubung langsung ke daemon **ZeroClaw Gateway v0.8.3** yang mendengarkan di `http://127.0.0.1:4242`.

---

## 🔑 2. Protokol Jembatan Runtime Gateway ZeroClaw v0.8.3 Real

Integrasi antara ZEGA Fastify API (`apps/api/src/routes/v1/zeroclaw.routes.ts`) dan daemon ZeroClaw v0.8.3 lokal menggunakan 3 kontrak API resmi:

### A. Health Ping (`GET http://127.0.0.1:4242/health`)
- Backend ZEGA secara rutin melakukan pengujian *health check* ke daemon ZeroClaw lokal.
- Ketika daemon menyala, backend ZEGA memperbarui status ke `bridgeConnected: true` dan menampilkan lencana status `Connected to ZeroClaw Gateway v0.8.3`.

### B. Otentikasi & Flow Pairing (`POST http://127.0.0.1:4242/pair`)
- Pada UI ZeroClaw Terminal (`ZeroClawTerminalView.tsx`), pengguna dapat menekan tombol **Pair Gateway** dan memasukkan kode sekali pakai (*one-time pairing code*) yang dihasilkan daemon (contoh: **`137170`**).
- Request dikirim dengan header `X-Pairing-Code: 137170` dan menerima token sesi aktif (contoh: `zc_a6f6a44c0fea09d21dee9cc4b7008fd3d68571aed3fd88cf31b7d4ed898b645e`).
- Token ini secara otomatis disimpan di `localStorage` peramban untuk persistensi koneksi.

### C. Webhook Message Forwarding (`POST http://127.0.0.1:4242/webhook`)
- Setiap prompt atau transaksi yang dikirimkan melalui terminal diteruskan ke endpoint `/webhook` milik ZeroClaw (`{"message": prompt}`).

---

## 📊 3. Hasil Pengujian Verifikasi Terbuka (Live Test Proof)

Pengujian langsung telah dijalankan pada daemon aktif (PID 12768, Uptime 706s):

```bash
# 1. Health Check Daemon ZeroClaw v0.8.3
$ curl -s http://127.0.0.1:4242/health
{"status":"ok","require_pairing":true,"runtime":{"components":{"daemon":{"status":"ok"},"gateway":{"status":"ok"}}}}

# 2. Test Bridge Status ZEGA Fastify API
$ curl -s http://localhost:3001/v1/zeroclaw/status
{"success":true,"data":{"state":{"gatewayUrl":"http://127.0.0.1:4242","bridgeConnected":true,"bridgeStatus":"Connected to ZeroClaw Gateway v0.8.3 (http://127.0.0.1:4242)","daemonVersion":"v0.8.3"}}}

# 3. Test Pairing Kode 137170
$ curl -s -X POST http://localhost:3001/v1/zeroclaw/pair -H "Content-Type: application/json" -d '{"pairingCode": "137170"}'
{"success":true,"message":"ZeroClaw v0.8.3 Gateway Paired Successfully!","token":"zc_a6f6a44c0fea09d21dee9cc4b7008fd3d68571aed3fd88cf31b7d4ed898b645e"}
```

---

## 💡 4. Fitur UMKM, Enterprise, & OWASP Guardrails

### A. Fitur UMKM & Individu:
1. **Solana Pay QR Settlement:** URL pembayaran Base58 dan QR code scannable otomatis (`solana:<merchantWallet>?amount=15.00`).
2. **Pilihan Preset Transaksi:** *Pay for Product (15 USDC)*, *Kasir QR Settlement*, *Agent Micro-Pay (0.05 USDC)*, dan *Swarm Escrow (250 USDC)*.
3. **Global Currency Switcher (USDC & IDR):** Kurs dinamis **1 USD = Rp 18.000**.

### B. Fitur Enterprise & SOP Checkpoints:
1. **Human-in-the-Loop SOP Checkpoints:** Mencegah eksploitasi *prompt injection* ketika menerima instruksi pengembalian dana (*refund*) mencurigakan pada saluran WhatsApp/Telegram.
2. **Multi-Agent Swarm Escrow:** Penyelesaian tugas terdistribusi antar agen AI dengan dana terkunci hingga konfirmasi final.
3. **Persistensi Supabase PostgreSQL:** Tabel `zeroclaw_solana_settlements` dan `zeroclaw_sop_checkpoints` dengan skema RLS mandiri dan WebSocket Realtime.

---

## ⚙️ 5. Spesifikasi Jalur API Fastify & Endpoint

| Endpoint | Method | Fungsi |
| :--- | :--- | :--- |
| `/v1/zeroclaw/status` | `GET` | Memeriksa status koneksi bridge & health daemon ZeroClaw v0.8.3 |
| `/v1/zeroclaw/pair` | `POST` | Memproses pairing token menggunakan `X-Pairing-Code` sekali pakai |
| `/v1/zeroclaw/solana-rpc` | `GET` | Mengambil data real-time block/slot dari Solana Devnet RPC |
| `/v1/zeroclaw/events` | `POST` | Menghasilkan reference key Solana Pay & mendaftarkan transaksi baru |
| `/v1/zeroclaw/approve-checkpoint` | `POST` | Memproses persetujuan/penolakan SOP checkpoint oleh admin manusia |

---

## 🏆 Status Akses
- **Front-end Web:** `http://localhost:3000` (Menu **Finance** & **ZeroClaw Solana Terminal**).
- **Back-end API:** `http://localhost:3001/v1/zeroclaw/status`.
- **ZeroClaw Gateway Daemon:** `http://127.0.0.1:4242` (Listening v0.8.3).
