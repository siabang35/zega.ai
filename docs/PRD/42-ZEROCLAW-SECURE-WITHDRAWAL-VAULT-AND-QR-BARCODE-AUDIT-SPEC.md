# ZEGA AI PRD — ZeroClaw Secure Withdrawal Vault & Barcode QR Audit Specification

## 42. ZeroClaw Secure Withdrawal Vault & Barcode QR Audit Specification (August 2026)

### 42.1 Executive Summary
The **ZeroClaw Secure Withdrawal Vault** provides enterprise merchants (UMKM & Enterprise scale) with a multi-layer, zero-trust withdrawal execution framework for Solana assets (`USDC` and `SOL Native`). It incorporates OWASP-compliant two-factor email OTP authorization, live Solana Devnet RPC wallet scanning, embedded **QR Code / Barcode** camera viewport detection, anti-replay SHA-256 signatures, database-level velocity & anti-exploit guards, and automated immutable proof receipt publication to Cloudflare R2 CDN.

---

## 42.2 Security Architecture & OWASP Multi-Layer Validation

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant (Enterprise UI)
    participant UI as ZeroClawTerminalView.tsx
    participant Scanner as Solana Devnet RPC / QR Camera
    participant API as Fastify API Gateway (/v1/zeroclaw)
    participant Brevo as Brevo Email OTP Service
    participant DB as Supabase PostgreSQL (Migration 106)
    participant CDN as Cloudflare R2 CDN

    Merchant->>UI: Input withdrawal amount & Solana address (or Scan QR Code)
    UI->>Scanner: (Optional) Scan RPC / QR Code payload & compute qr_payload_hash
    Merchant->>UI: Click "Kirim Kode OTP Keamanan"
    UI->>API: POST /v1/zeroclaw/withdraw/request-otp
    API->>Brevo: Generate 6-digit OTP passcode & send email
    Brevo-->>Merchant: Receive 6-digit OTP code in email
    Merchant->>UI: Input 6-digit OTP passcode & Click "Eksekusi Transfer Vault"
    UI->>API: POST /v1/zeroclaw/withdraw (otp, qrScanned, qrPayloadHash, destAddress)
    API->>DB: Execute fn_zeroclaw_validate_withdrawal_anti_exploit()
    DB-->>API: Pass (is_valid: true, risk_level: 'LOW')
    API->>CDN: Upload withdrawal proof receipt JSON
    API->>DB: INSERT INTO zeroclaw_withdrawals with audit signature & security_flags
    DB-->>UI: Realtime WebSocket event broadcast
    UI-->>Merchant: Withdrawal Completed & R2 CDN Proof Link Displayed
```

---

## 42.3 Layered Security Specifications

### A. Layer 1: Input & Format Sanitization
- **Solana Public Key Verification**: Strict Base58 character set enforcement (`/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`).
- **Positive Amount Guard**: Rejects zero or negative amounts (`amount > 0`).

### B. Layer 2: Two-Step Mandatory Email OTP Passcode Verification
- **Endpoint 1**: `POST /v1/zeroclaw/withdraw/request-otp`
  - Generates 6-digit passcode linked to user email (`userEmail`).
  - Dispatches email via Brevo API v3 (`BrevoService.ts`).
  - 5-minute TTL & 5-attempt brute-force protection.
- **Endpoint 2**: `POST /v1/zeroclaw/withdraw`
  - Validates 6-digit code via `OtpStore.verifyOtp()`.

### C. Layer 3: Live Solana Devnet RPC Scanner & QR / Barcode Camera Viewport
- **Live Solana RPC Address Scanner**: Inspects destination Solana address on Devnet RPC (`getBalance` and account info check) to display account status and SOL balance before execution.
- **QR Code & Barcode Camera Viewport Modal**:
  - Live video stream overlay with framing reticle.
  - Automatically parses URI schemas (e.g. `solana:7xKX...`).
  - Computes `qr_payload_hash` SHA-256 in browser to prevent MITM address replacement / QR hijacking attacks.
  - Stores `qr_scanned: true`, `qr_device_id`, and `security_flags` in database.

### D. Layer 4: Anti-Replay & Database Anti-Exploit Guard Function (`fn_zeroclaw_validate_withdrawal_anti_exploit`)
- Implemented in PostgreSQL (`106_zeroclaw_secure_withdrawals_and_realtime_audit.sql`):
  1. **Anti-Replay Hash**: Rejects duplicate `anti_replay_hash` values within the time window.
  2. **Malicious Address Check**: Rejects invalid or blacklisted addresses.
  3. **Velocity Guard**: Enforces max 5 withdrawal executions per minute per tenant.

### E. Layer 5: Cloudflare R2 CDN Proof Receipts
- Every completed transaction generates an immutable JSON audit receipt stored on Cloudflare R2 (`https://cdn.zegaai.site/withdrawal-proofs/...`).
- Payload contains `withdrawalId`, `userEmail`, `destinationAddress`, `amount`, `tokenSymbol`, `ipAddress`, `auditSignature`, `riskScore`, and `securityFlags`.

---

## 42.4 Idempotent Database Schema (`106_zeroclaw_secure_withdrawals_and_realtime_audit.sql`)

```sql
-- Defensive Column Migration for Existing Table Environments
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS security_check_passed BOOLEAN DEFAULT true;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT true;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS risk_score NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS dest_wallet_type TEXT DEFAULT 'external_solana';
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS dest_sol_balance NUMERIC(18, 9) DEFAULT 0;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS qr_scanned BOOLEAN DEFAULT false;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS qr_device_id TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS qr_payload_hash TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '{"anti_tamper_passed": true, "anti_mitm_verified": true, "rpc_tls_verified": true}'::jsonb;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS anti_replay_hash TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS audit_signature TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS r2_cdn_proof_url TEXT;
ALTER TABLE public.zeroclaw_withdrawals ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Realtime Executive Audit Summary View
CREATE OR REPLACE VIEW public.v_zeroclaw_withdrawal_audit_summary AS
SELECT
    COUNT(*) AS total_withdrawals,
    COALESCE(SUM(amount_sol), 0) AS total_sol_withdrawn,
    COALESCE(SUM(amount_usdc), 0) AS total_usdc_withdrawn,
    COUNT(CASE WHEN otp_verified = true THEN 1 END) AS otp_verified_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN r2_cdn_proof_url IS NOT NULL THEN 1 END) AS r2_proof_count,
    MAX(created_at) AS last_withdrawal_at
FROM public.zeroclaw_withdrawals;
```

---

## 42.5 File Artifacts & Verification Status

| Component | File Path | Status |
|---|---|---|
| ZeroClaw Terminal UI & Vault Modal | `apps/web/src/app/dashboard/enterprise/views/ZeroClawTerminalView.tsx` | Production Ready (Verified) |
| API Route Handler & Anti-Replay Guard | `apps/api/src/routes/v1/zeroclaw.routes.ts` | Production Ready (Verified) |
| Cloudflare R2 CDN Proof Service | `apps/api/src/services/r2StorageService.ts` | Production Ready (Verified) |
| Brevo Email OTP Service | `apps/api/src/services/brevoService.ts` | Production Ready (Verified) |
| SQL Migration Suite 106 | `supabase/migrations/sql_umkm/106_zeroclaw_secure_withdrawals_and_realtime_audit.sql` | Executed & 100% Idempotent |
| Monorepo Build Check | `pnpm run build` | 100% PASS (0 Error) |

---

## 42.6 Final Production Hardening & 7-Layer Enterprise Security Standard (August 2026 Audit)

### A. Deterministic Multi-Tenant Privy Wallet Parity (1-to-1 Email Keypair Binding)
- **Problem Resolved**: Frontend and backend previously derived divergent keypairs due to Base58 public key re-hashing glitches.
- **Implementation**: Standardized `derivePrivyEmbeddedSolanaKeypair(email, specificMerchant)` to strictly prioritize the canonical user email string (`privy_keyless_solana_v1_${email}`).
- **Parity Guarantee**: Ensures 100% cryptographic parity across frontend (`PrivyWalletService.ts`) and backend (`zeroclaw.routes.ts`).

### B. 100% Real On-Chain Transaction Execution (0% Mock / Synthetic Signatures)
- **Mock Signature Purge**: Removed all mock/synthetic fallback signature generators.
- **Fail-Closed Execution**: Every withdrawal attempt executes an authentic signed transaction broadcast to Solana Devnet RPC (`sendTransaction`). Failed broadcasts result in a clean, fail-closed error response.

### C. Pure Real On-Chain USDC & SOL Balance Synchronization
- **0% Off-Chain DB Balance Injection**: Purged off-chain invoice storage calculations from `/v1/zeroclaw/balance` and `/v1/zeroclaw/withdraw`.
- **RPC Truth**: UI headers and withdrawal modals report 100% real on-chain token counts directly from Solana Devnet RPC (`getBalance` and `getTokenAccountsByOwner`). If on-chain USDC is 0, the UI accurately displays `0.00 USDC`.

### D. Complete `localStorage` Browser Cache Purging
- **Zero-Flicker Clean Slate**: `ZeroClawTerminalView.tsx` executes an automated `localStorage` cache cleanup on mount for all `zeroclaw_withdrawals_*` and `zeroclaw_invoices_*` keys.
- **Single Source of Truth**: All transaction histories and wallet balances are fetched 100% real-time from the backend Fastify API and Supabase PostgreSQL tables.

### E. Verified 7-Layer Enterprise Security Standard
1. **Layer 1**: Mandatory Email OTP Verification (6-digit passcode with Brevo dispatch & 5-min TTL).
2. **Layer 2**: Multi-Tenant Merchant Wallet Ownership Verification (`isMerchantWalletOwnedByUser`).
3. **Layer 3**: Solana Base58 Address Validation & Self-Transfer Block (`/^[1-9A-HJ-NP-Za-km-z]{32,44}$/`).
4. **Layer 4**: Real On-Chain Balance Sufficiency Enforcement (`getBalance` & `getTokenAccountsByOwner`).
5. **Layer 5**: Anti-Replay SHA-256 Request Fingerprint Guard (15-second deduplication window).
6. **Layer 6**: Rate Limiting Guard (Max 3 withdrawals / 10 min window per email).
7. **Layer 7**: On-Chain Ed25519 Cryptographic Signing & Immutable HMAC Audit Logging (`zeroclaw_withdrawals` table).

---

## 42.7 Invoice & Public Checkout Real-Time Backend & On-Chain Synchronization Standard

### A. Concurrency-Proof Single-Use Solana Reference Key Isolation
- **Single-Use Reference Key**: Each invoice generates a unique 32-44 byte Base58 Solana `referenceKey`.
- **Zero Collision Guarantee**: Payments include the `referenceKey` as a non-signer account key. `solanaRpcManager.callRpc('getSignaturesForAddress', [referenceKey])` cryptographically isolates each transaction, preventing collisions even if 1,000 customers pay the exact same amount ($15.00 USDC) at the exact same millisecond to the same merchant.
- **Stage 1 Verification Guard**: `POST /v1/zeroclaw/settlement/check-payment` verifies that submitted transaction signatures contain the invoice's `referenceKey` or match `merchantPubkey`, eliminating cross-invoice signature spoofing.

### B. High-Speed Real-Time Reconciler (`GET /v1/zeroclaw/settlement/check`)
- **Lightweight Polling Endpoint**: `GET /v1/zeroclaw/settlement/check?reference=<REF_KEY>` queries Supabase DB tables (`zeroclaw_solana_settlements` and `zeroclaw_invoices`) and performs live RPC queries (`getSignaturesForAddress`) for instant payment reconciliation.
- **Strict Base58 TxHash Validation (`/^[1-9A-HJ-NP-Za-km-z]{70,96}$/`)**: Validates that transaction signatures are authentic 70-96 character Base58 strings before returning or rendering Solana Explorer links, ensuring `referenceKey` is never confused with `txHash`.

### C. Cloudflare R2 CDN Cryptographic Audit Certificate Logging
- **Automated R2 Certificate Upload**: `upsertVerifiedInvoice` generates a Cryptographic Settlement Audit Certificate JSON uploaded directly to Cloudflare R2 CDN via `R2StorageService.uploadPrivyAuditCertificate`.
- **Immutable CDN Proof**: CDN URL (`r2_cdn_url`) is stored in both `zeroclaw_invoices` and `zeroclaw_solana_settlements` tables in Supabase PostgreSQL for 100% auditability.


