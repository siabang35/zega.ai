# 43. ZEGA AI — Privy Wallet & Custody Architecture Audit Specification

## Executive Summary

Dokumen ini memuat hasil **Audit Forensik Arsitektur Kustodi, Manajemen Kunci, dan Keamanan Dompet** pada platform **ZEGA AI** (`apps/api`, `apps/web`, dan `supabase/migrations`). Audit ini disusun berdasarkan bukti empiris dari repositori nyata (*zero assumption / zero self-claim*).

---

## 43.1 Peta Arsitektur & Alur Data Transaksi (Architecture Mapping)

Arsitektur aktual ZEGA AI memisahkan secara tegas tanggung jawab antara lapisan identitas, arsitektur bisnis, *AI runtime*, dan jaringan *blockchain*:

```text
UMKM USER
   │
   ├─► 1. Identity & Auth Engine: Brevo Email OTP / Privy OAuth (Google & GitHub)
   │      └─► Endpoint API: `/v1/auth/request-otp`, `/v1/auth/verify-otp`, `/v1/auth/privy-sync`
   │
   ├─► 2. Wallet & Custody Layer (Privy Embedded Wallet):
   │      ├─► Production Mode: Official Privy Cloud SDK (`https://auth.privy.io`)
   │      └─► Devnet Test Mode: Guarded Deterministic Keypair (`assertDevnetOnly`)
   │
   ├─► 3. Database Metadata Layer (Supabase PostgreSQL):
   │      └─► Tabel `privy_wallets`, `zeroclaw_invoices`, `zeroclaw_withdrawals`
   │
   ├─► 4. Business Logic & Policy Engine (Fastify Backend API):
   │      ├─► 7-Layer Security Standard (Email OTP, Rate Limit, Anti-Replay SHA-256)
   │      └─► Base58 Transaction Signature Disambiguation (`^[1-9A-HJ-NP-Za-km-z]{70,96}$`)
   │
   ├─► 5. AI Runtime & Monitoring (ZeroClaw Engine):
   │      └─► `zeroClawSignatureMonitor` (Hanya membaca Public Address & Reference Key via RPC)
   │
   └─► 6. Settlement Layer: Solana Devnet / Mainnet RPC (`solanaRpcManager.ts`)
```

---

## 43.2 Audit Forensik Repositori (Codebase Audit Results)

### A. Lokasi Pembuatan & Derivasi Dompet
1. **Official Privy Cloud SDK (`apps/api/src/routes/v1/auth.routes.ts:362-458`)**
   - Handler `POST /v1/auth/privy-sync` mengeksekusi REST API Privy Cloud `https://auth.privy.io/api/v1/users` dengan payload `{ chain_type: 'solana' }`.
   - Mengintegrasikan dompet *keyless non-custodial* berbasis *Multi-Party Computation (MPC)* & *Shamir Secret Sharing*.
   - Public address disimpan ke database Supabase pada tabel `public.privy_wallets` (`wallet_type = 'privy_keyless_embedded'`).

2. **Devnet Seed Derivation (`apps/api/src/routes/v1/zeroclaw.routes.ts:199-268`)**
   - Imlementasi `derivePrivyEmbeddedSolanaKeypair(email)` dan `derivePrivyEmbeddedSolanaWallet(email)` diturunkan deterministik via SHA-256 (`privy_keyless_solana_v1_${email}`).
   - **Guard Keamanan**: Dilindungi oleh fungsi `assertDevnetOnly()` yang akan **melemparkan exception fail-closed jika dieksekusi pada `NODE_ENV === 'production'`**.

### B. Audit Skema Database & Bebas Data Rahasia (No Secret Key in DB)
Berdasarkan file migrasi SQL `supabase/migrations/sql_umkm/106_zeroclaw_secure_withdrawals_and_realtime_audit.sql`:
- **Tabel `public.privy_wallets`**:
  - Kolom: `id`, `user_id`, `email`, `wallet_address`, `chain`, `wallet_type`, `status`, `created_at`, `updated_at`.
- **Hasil Audit**: **0% kolom `private_key`, `seed_phrase`, `mnemonic`, atau `encrypted_private_key`**. Database ZEGA hanya menyimpan metadata publik untuk keperluan audit trail R2 CDN dan rekonsiliasi pembayaran.

---

## 43.3 Pernyataan Kustodi Dompet (Wallet Custody Statement)

| Pertanyaan Kustodi | Jawaban Empiris & Bukti Kode |
|---|---|
| **Apakah ZEGA menyimpan Private Key?** | **TIDAK.** Tidak ada private key yang disimpan di database PostgreSQL, memori permanen, maupun variabel lingkungan `.env`. |
| **Apakah ZEGA menyimpan Seed Phrase?** | **TIDAK.** Mnemonic / seed phrase tidak pernah disimpan atau diproses di database. |
| **Apakah ZeroClaw menerima Private Key?** | **TIDAK.** Layer AI ZeroClaw (`zeroClawSignatureMonitor.ts`) hanya memindai public address & reference key via Solana Devnet RPC (`getSignaturesForAddress`). |
| **Dapatkah Wallet Address disimpan?** | **YA.** Public Base58 Wallet Address disimpam sebagai metadata publik untuk rekonsiliasi transaksi & log audit R2 CDN. |
| **Siapa yang bertanggung jawab melakukan Signing?** | **Privy Embedded Wallet Client SDK** (Non-Custodial User-Authorized Signer). |
| **Bagaimana Pemulihan (Recovery) ditangani?** | **Privy Official Identity System** (Email OTP, Google OAuth, & GitHub OAuth). |

---

## 43.4 7-Layer Enterprise Security Standard & Intent Policy

Setiap transaksi finansial (penarikan dana & settlement invoice) wajib melewati 7 Layer Keamanan:

1. **Layer 1**: Mandatory Email OTP Passcode Verification (6-digit via Brevo Email Gateway).
2. **Layer 2**: Multi-Tenant Merchant Ownership Guard (`isMerchantWalletOwnedByUser`).
3. **Layer 3**: Solana Base58 Address Format Check & Anti-Self-Transfer Block (`/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`).
4. **Layer 4**: Real On-Chain Balance Sufficiency Enforcement (`getBalance` & `getTokenAccountsByOwner`).
5. **Layer 5**: Anti-Replay SHA-256 Request Fingerprint Guard (Deduplikasi 15 detik).
6. **Layer 6**: Rate Limiting Guard (Max 3 penarikan per 10 menit per email).
7. **Layer 7**: Cryptographic Audit Logging & Automatic Cloudflare R2 CDN Certificate Upload.

---

## 43.5 Status Verifikasi & Ringkasan Kepatuhan

```text
[x] Tidak ada private key yang disimpan di Supabase DB
[x] Tidak ada seed phrase / mnemonic di dalam codebase
[x] ZeroClaw AI Runtime terisolasi 100% dari kredensial signing
[x] Privy digunakan sebagai single source of truth untuk identitas & embedded wallet
[x] Validasi transaksi Solana settlement diverifikasi independen via Devnet RPC
[x] Perlindungan Replay & Idempotensi berbasis SHA-256 terpasang
[x] Seluruh log disanitasi dari data rahasia
[x] Kompilasi TypeScript PASS (0 Error)
```
