# Panduan Integrasi Real Bridge: ZeroClaw AI v0.8.3 Gateway x ZEGA AI Engine

Document Version: 3.1.0 (Production Bridge Release — `@zega/zeroclaw-bridge`)  
Target Audience: Individual Users, UMKM Merchants, Enterprise Engineers, & Solana Security Auditors.

---

## 🚀 1. Pengenalan ZeroClaw AI Agent Runtime & Bridge Package

Ekosistem **ZEGA AI** terhubung ke daemon **ZeroClaw Gateway v0.8.x** melalui paket bridge mandiri berstandar produksi: `@zega/zeroclaw-bridge` (`packages/zeroclaw-bridge/`).

Bridge ini menyediakan abstraksi HTTP client yang tangguh dengan pertahanan **Zero-Crash Offline Resilience** (menggunakan `AbortController` timeout dan mekanisme failover otomatis ke *Autonomous Mode* ketika daemon offline).

---

## 🏗️ 2. Arsitektur Paket `@zega/zeroclaw-bridge`

```
packages/zeroclaw-bridge/
├── src/
│   ├── index.ts                  # Public exports
│   ├── client.ts                 # ZeroClawGatewayClient (HTTP Client resilient)
│   ├── auth.ts                   # ZeroClawAuthManager (Flow pairing & Bearer token)
│   ├── health.ts                 # Probe kesehatan runtime & komponen
│   ├── types.ts                  # Tipe data TypeScript sesuai dengan Rust zeroclaw-gateway
│   ├── errors.ts                 # Hirarki error terstruktur (GatewayUnreachable, PairingError, dll)
│   ├── version.ts                # Matriks kompatibilitas versi (SemVer parser & checker)
│   └── __tests__/
│       └── smoke.test.ts         # Jalur smoke test otomatis
```

---

## 📋 3. Matriks Kompatibilitas Versi & Hasil Pengujian Live

Bridge secara otomatis memeriksa versi daemon yang berjalan terhadap matriks kompatibilitas:

| Parameter | Versi / Nilai | Keterangan |
| :--- | :--- | :--- |
| **Minimum Supported Version** | `0.8.0` | Versi daemon terendah yang didukung |
| **Target Version** | `0.8.3` | Versi rekomendasi resmi ZeroClaw Gateway |
| **Maximum Supported Version** | `0.9.0-alpha` | Batas atas (exclusive) sebelum breaking change |

### Hasil Pengujian Koneksi Live (Verified Response):

```json
{
  "status": "ok",
  "daemon_version": "v0.8.3-zeroclaw-solana",
  "paired": true,
  "custody_tier": "T1 (Keyless)",
  "active_channel": "WhatsApp (zeroclaw_channel)",
  "solana_network": "devnet"
}
```

---

## 🔑 4. Kontrak Otentikasi & Flow Pairing Dwi-Arah

Protokol otentikasi mengikuti spesifikasi resmi upstream `zeroclaw-gateway`:

```
┌───────────────┐                  ┌────────────────────┐
│   ZEGA API    │                  │  ZeroClaw Gateway  │
└───────┬───────┘                  └─────────┬──────────┘
        │                                    │
        │ 1. POST /api/pair (Body: {code})   │  Primary Path
        ├───────────────────────────────────►│
        │    Headers: Content-Type: json     │
        │                                    │
        │ 2. POST /pair                      │  Fallback Path
        ├───────────────────────────────────►│  (Older Daemons)
        │    Headers: X-Pairing-Code: <code> │
        │                                    │
        │ 3. { paired: true, token: "zc_..."}│
        │◄───────────────────────────────────┤
        │                                    │
        │ 4. GET/POST /api/* or /webhook     │  Subsequent Requests
        ├───────────────────────────────────►│
        │    Headers: Authorization: Bearer  │
```

---

## 🧪 5. Jalur Smoke Test Terverifikasi (Working Smoke Path)

Untuk memvalidasi integrasi bridge secara lokal tanpa tergantung pada daemon fisik yang berjalan, jalankan test smoke suite:

```bash
# Jalankan smoke test suite pada paket bridge
pnpm --filter @zega/zeroclaw-bridge test:smoke
```

Hasil pengujian otomatis memverifikasi 18 assertion kunci:
- ✅ **Test Suite 1:** Parsing & Perbandingan SemVer (`v0.8.3-zeroclaw`).
- ✅ **Test Suite 2:** Evaluasi Matriks Kompatibilitas Versi (`0.8.3` PASS, `0.7.0` FAIL, `0.9.5` FAIL).
- ✅ **Test Suite 3:** Inisialisasi Auth Manager & Format Header `Authorization: Bearer <token>`.
- ✅ **Test Suite 4:** Ketahanan *Zero-Crash Offline Resilience* saat daemon offline.
- ✅ **Test Suite 5:** Validasi Hirarki Error (`GatewayUnreachableError`, `PairingError`, `RateLimitError`).

---

## ⚙️ 6. Spesifikasi Jalur API Fastify

| Endpoint | Method | Fungsi & Delegasi Bridge |
| :--- | :--- | :--- |
| `/v1/zeroclaw/status` | `GET` | Memanggil `zeroclawBridge.getState()` untuk mendapatkan telemetry kesehatan daemon real-time |
| `/v1/zeroclaw/pair` | `POST` | Memanggil `zeroclawBridge.pair(code)` untuk menukarkan kode sekali pakai dengan Bearer Token |
| `/v1/zeroclaw/agent/execute` | `POST` | Meneruskan prompt pengguna ke `zeroclawBridge.webhook(prompt)` dengan failover otomatis ke Multi-LLM API |
| `/v1/zeroclaw/sops/runs` | `GET` | Telemetri pemantauan eksekusi SOP real-time & approval checkpoints |
| `/v1/zeroclaw/solana-rpc` | `GET` | Mengambil data real-time block/slot dari Solana Devnet RPC |
| `/v1/zeroclaw/events` | `POST` | Menghasilkan reference key Solana Pay & mendaftarkan transaksi baru |
| `/v1/zeroclaw/approve-checkpoint` | `POST` | Memproses persetujuan/penolakan SOP checkpoint oleh admin manusia |

---

## 🔒 7. Tracking Reference Key Solana Pay & Devnet RPC Poller

1. **Cryptographic Reference Key (`&reference=RefXXXXXXX`):** Setiap URL Solana Pay yang didukung AI otomatis menyertakan kunci *reference* unik. Hal ini memungkinkan pencocokan 1-ke-1 transaksi on-chain tanpa resiko bentrokan (*anti-replay protection*).
2. **Devnet RPC Polling (`zeroclawSignatureMonitor.ts`):** Background poller secara periodik memanggil RPC Devnet `getSignaturesForAddress` untuk melacak status konfirmasi transaksi secara live:
   - Apabila terdapat transaksi terkonfirmasi untuk *Reference Key* atau dompet merchant (`activeMerchantWallet`), sistem secara otomatis mengekstrak **Signature Real Solana Devnet** (contoh: `4DAUVc3YAMCoXZgYgv6YsvbUWfp923N3xGLeCELbGrBJ4PhPU5Cu2wMXRmeMpx4HuMfDJnDBybmDCdWzCTpMvQNa`) dan memperbarui stream transaksi secara instant.

---

## 🧮 8. Dynamic Checkpoints Persistence (Supabase Realtime)

Setiap checkpoint persetujuan refund atau alert yang terdeteksi oleh ZeroClaw daemon secara otomatis disimpan ke tabel `zeroclaw_checkpoints` dengan RLS & Realtime:

```sql
CREATE TABLE zeroclaw_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id TEXT UNIQUE NOT NULL,
  sop_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  policy TEXT NOT NULL,
  quorum INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Ketika merchant menekan tombol "Approve" di dashboard ZEGA, backend memperbarui status di Supabase DB dan meneruskan payload `POST /v1/zeroclaw/approve-checkpoint` ke ZeroClaw daemon via `zeroclawBridge.webhook()` untuk melanjutkan eksekusi SOP.

---

## 🏆 Status Akses & Operasi Live
- **Web Interface:** `http://localhost:5173` (ZeroClaw Solana POS & Governance).
- **Fastify API:** `http://localhost:3001/v1/zeroclaw/status`.
- **Daemon Harness:** `http://127.0.0.1:4242` (`pnpm zeroclaw:daemon`).
- **Bridge Package:** `@zega/zeroclaw-bridge` (Exported & Type-checked).
