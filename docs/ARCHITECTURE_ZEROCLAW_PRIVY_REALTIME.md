# ZEGA AI — ZeroClaw v0.8.3 + Privy Keyless Wallet Real-Time Architecture

> **Version**: 3.1.0  
> **Last Updated**: 2026-08-04  
> **Author**: ZEGA AI Engineering Team  
> **Status**: Production (Live on Render `https://zega-ai.onrender.com` + Vercel `https://zegaai.site` + Solana Devnet RPC)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architectural Layers](#2-architectural-layers)
3. [Layer 1: Privy Keyless Embedded Wallet (Client-Side)](#3-layer-1-privy-keyless-embedded-wallet)
4. [Layer 2: ZeroClaw v0.8.3 Agent Runtime (Server-Side)](#4-layer-2-zeroclaw-v083-agent-runtime)
5. [Layer 3: Supabase PostgreSQL + Realtime (Data Layer)](#5-layer-3-supabase-postgresql--realtime)
6. [Layer 4: Cloudflare R2 CDN (Asset Storage)](#6-layer-4-cloudflare-r2-cdn)
7. [Layer 5: Solana Devnet RPC (Blockchain Layer)](#7-layer-5-solana-devnet-rpc)
8. [Authentication Flow: Guest vs Authenticated](#8-authentication-flow-guest-vs-authenticated)
9. [Data Flow: Invoice Creation to On-Chain Settlement](#9-data-flow-invoice-creation-to-on-chain-settlement)
10. [Zero-Collision Guarantee: Privy ↔ ZeroClaw Separation](#10-zero-collision-guarantee)
11. [REST API Endpoint Reference](#11-rest-api-endpoint-reference)
12. [Supabase Database Schema](#12-supabase-database-schema)
13. [Environment Variables Reference](#13-environment-variables-reference)
14. [Security Model](#14-security-model)
15. [Deployment Architecture](#15-deployment-architecture)

---

## 1. System Overview

ZEGA AI integrates three independent runtime layers to deliver a **zero-custody, real-time Solana Pay agent platform** for UMKM and Enterprise users:

| Runtime | Technology | Location | Responsibility |
|---------|-----------|----------|---------------|
| **Privy SDK** | `@privy-io/react-auth` | Client-Side (Browser) | Identity, OAuth, Keyless Embedded Wallet |
| **ZeroClaw v0.8.3** | Rust Daemon + Fastify Bridge | Server-Side (Render API + Local Daemon) | Agent execution, Invoice CRUD, Payment polling, Guardrails |
| **Supabase** | PostgreSQL + Realtime | Cloud (Supabase Project) | Persistent storage, RLS partitioning, WebSocket push |

```
┌──────────────────────────────────────────────────────────────────┐
│                    ZEGA AI PLATFORM                              │
│                                                                  │
│  ┌────────────────────┐     ┌──────────────────────────────┐     │
│  │  LAYER 1: PRIVY    │     │  LAYER 2: ZEROCLAW v0.8.3   │     │
│  │  (Client Browser)  │     │  (Fastify API + Rust Daemon) │     │
│  │                    │     │                              │     │
│  │  ▸ Google OAuth    │     │  ▸ /v1/zeroclaw/status       │     │
│  │  ▸ GitHub OAuth    │     │  ▸ /v1/zeroclaw/pair         │     │
│  │  ▸ OTP Email Login │     │  ▸ /v1/zeroclaw/solana-rpc   │     │
│  │  ▸ Embedded Wallet │     │  ▸ /v1/zeroclaw/events       │     │
│  │    (Keyless Sol)   │     │  ▸ /v1/zeroclaw/invoice/*    │     │
│  └────────┬───────────┘     │  ▸ /v1/zeroclaw/agent/*      │     │
│           │                 │  ▸ /v1/zeroclaw/approve-*    │     │
│           │ userEmail +     └──────────┬───────────────────┘     │
│           │ walletAddress              │                         │
│           │                            │ fetch() + Supabase      │
│           ▼                            ▼                         │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  LAYER 3: SUPABASE PostgreSQL + Realtime               │     │
│  │                                                         │     │
│  │  Tables:                                                │     │
│  │  ▸ zeroclaw_solana_settlements (RLS per userId)         │     │
│  │  ▸ zeroclaw_invoices (RLS per userId)                   │     │
│  │  ▸ zeroclaw_sop_checkpoints                             │     │
│  │  ▸ privy_embedded_wallets                               │     │
│  │                                                         │     │
│  │  Realtime Channels:                                     │     │
│  │  ▸ zeroclaw_solana_settlements → INSERT push to UI      │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐    │
│  │  LAYER 4: R2 CDN    │    │  LAYER 5: SOLANA DEVNET RPC  │    │
│  │  (Cloudflare)       │    │  (api.devnet.solana.com)      │    │
│  │                     │    │                               │    │
│  │  ▸ QR Code Images   │    │  ▸ getBalance (SOL)           │    │
│  │  ▸ Invoice Receipts │    │  ▸ getTokenAccountsByOwner    │    │
│  │  ▸ Logo Assets      │    │  ▸ getSignaturesForAddress    │    │
│  └─────────────────────┘    │  ▸ requestAirdrop (1 SOL)     │    │
│                              └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Layers

### Layer Isolation Principle

Each layer operates on a **strict isolation boundary**:

- **Privy** never calls ZeroClaw endpoints directly.
- **ZeroClaw** never accesses Privy private keys or OAuth tokens.
- **Supabase RLS** ensures user A cannot see user B's invoices.
- **Solana RPC** is consumed read-only for balance and signature verification.

This guarantees **zero collision** between identity management (Privy) and business logic (ZeroClaw).

---

## 3. Layer 1: Privy Keyless Embedded Wallet

### Technology
- **SDK**: `@privy-io/react-auth` v1.x
- **Runtime**: Client-side only (React browser context)
- **Custody Model**: Non-custodial, keyless (MPC-based)

### Core Behavior

| Feature | Description |
|---------|------------|
| **1-to-1 Deterministic Binding** | Each authenticated email maps to exactly 1 Solana wallet address |
| **Zero Server-Side Keys** | Private keys are NEVER stored on ZEGA servers or Supabase |
| **Client-Side Signing** | All transaction signatures happen in the user's browser |
| **OAuth Integration** | Google OAuth + GitHub OAuth + OTP Email (Brevo SMTP) |

### Wallet Derivation Logic

```typescript
// File: apps/web/src/app/dashboard/enterprise/views/ZeroClawTerminalView.tsx
// Lines: 136-141

const deriveEmbeddedWallet = (email?: string): string => {
  if (!email || isGuestSession) {
    return 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK'; // Public sandbox
  }
  return PrivyWalletService.getEmbeddedSolanaWallet(email).address;
};

const activeMerchantWallet = accountMode === 'authenticated'
  ? deriveEmbeddedWallet(userEmail)
  : 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK';
```

### What Privy Provides to ZeroClaw

| Data | How It's Used |
|------|--------------|
| `userEmail` | Supabase RLS partition key for invoices and settlements |
| `walletAddress` | `merchantPubkey` parameter when creating Solana Pay invoices |
| `privyUserId` | Stored in `privy_embedded_wallets` table for audit trail |
| `privyVerified: true` | Settlement metadata tag for reconciled payments |

---

## 4. Layer 2: ZeroClaw Agent Runtime & Bridge Package (`@zega/zeroclaw-bridge`)

### Technology
- **Bridge Package**: Standalone Monorepo Package `@zega/zeroclaw-bridge` (`packages/zeroclaw-bridge/`)
- **Daemon**: Self-hosted Rust binary (`zeroclaw gateway --port 4242`)
- **Bridge API**: Fastify REST routes (`/v1/zeroclaw/*`)
- **Location**: Server-side (Render cloud + optional local daemon)

### Gateway Bridge Architecture & Client Protocol

The ZEGA Fastify API delegates daemon communications to the production-ready `ZeroClawGatewayClient` provided by `@zega/zeroclaw-bridge`:

```
Browser UI  →  Fastify API (zeroclaw.routes.ts)  →  ZeroClawGatewayClient (@zega/zeroclaw-bridge)  →  ZeroClaw Daemon (127.0.0.1:4242)
                                                                 │
                                                                 ├── /health     (GET)  — Daemon health & version compatibility check
                                                                 ├── /api/pair   (POST) — Enhanced pairing flow (Primary)
                                                                 ├── /pair       (POST) — Legacy X-Pairing-Code flow (Fallback)
                                                                 └── /webhook    (POST) — Prompt forwarding
```

### Standalone Bridge Modules (`packages/zeroclaw-bridge/`)
1. **`ZeroClawGatewayClient` (`src/client.ts`)**: HTTP client featuring configurable timeouts (default 1500ms via `AbortController`), zero-crash resilience, and automatic retries.
2. **`ZeroClawAuthManager` (`src/auth.ts`)**: Manages pairing code exchange and generates Bearer token headers (`Authorization: Bearer <token>`).
3. **`version.ts`**: SemVer parser and version compatibility matrix enforcer (`>=0.8.0 <0.9.0-alpha`).
4. **`errors.ts`**: Structured error hierarchy (`GatewayUnreachableError`, `GatewayTimeoutError`, `PairingError`, `AuthenticationError`, `RateLimitError`).
5. **`src/__tests__/smoke.test.ts`**: Automated smoke test suite (18/18 PASS).

### Native ZeroClaw Daemon Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `http://127.0.0.1:4242/health` | GET | Returns daemon runtime status (PID, uptime, component health) |
| `http://127.0.0.1:4242/pair` / `/api/pair` | POST | Accepts pairing code, returns session Bearer token |
| `http://127.0.0.1:4242/webhook` | POST | Accepts `{"message": "prompt"}` for agent execution |

### Zero-Crash Resilience

All calls to the daemon via `zeroclawBridge` use `AbortController` timeouts and graceful error handling:

```typescript
// File: apps/api/src/routes/v1/zeroclaw.routes.ts

import { ZeroClawGatewayClient } from '@zega/zeroclaw-bridge';

const zeroclawBridge = new ZeroClawGatewayClient({
  gatewayUrl: process.env.ZEROCLAW_GATEWAY_URL || 'http://127.0.0.1:4242',
  bearerToken: process.env.ZEROCLAW_BEARER_TOKEN || '',
  timeoutMs: 1500,
  maxRetries: 1,
});
```

When the daemon is offline (e.g., on Render cloud where no local daemon runs), the API returns:

```json
{
  "bridgeConnected": false,
  "bridgeStatus": "Standby / Autonomous Mode (Gateway at http://127.0.0.1:4242 offline)"
}
```

This ensures the platform **never crashes** regardless of daemon availability.

### ZEGA Fastify API Endpoints (Server-Side)

| Endpoint | Method | Function | Database |
|----------|--------|----------|----------|
| `/v1/zeroclaw/status` | GET | Gateway health + telemetry state | — |
| `/v1/zeroclaw/pair` | POST | Pair with ZeroClaw daemon via pairing code | localStorage |
| `/v1/zeroclaw/solana-rpc` | GET | Proxy to Solana Devnet RPC for signature fetching | — |
| `/v1/zeroclaw/events` | POST | Register settlement events into Supabase | `zeroclaw_solana_settlements` |
| `/v1/zeroclaw/agent/execute` | POST | Execute AI prompt via 9Router multi-LLM | Agent logs |
| `/v1/zeroclaw/invoice/create` | POST | Create invoice → Supabase + R2 CDN QR image | `zeroclaw_invoices` |
| `/v1/zeroclaw/invoice/list` | GET | List user invoices (RLS-partitioned by userId) | `zeroclaw_invoices` |
| `/v1/zeroclaw/settlement/list` | GET | List settlements (RLS-partitioned by userId) | `zeroclaw_solana_settlements` |
| `/v1/zeroclaw/settlement/record` | POST | Record a verified settlement with Privy metadata | `zeroclaw_solana_settlements` |
| `/v1/zeroclaw/approve-checkpoint` | POST | Approve/Reject SOP security checkpoint | `zeroclaw_sop_checkpoints` |

---

## 5. Layer 3: Supabase PostgreSQL + Realtime

### Row-Level Security (RLS) Partitioning

Every table uses RLS policies to isolate data per user:

```sql
-- Example: zeroclaw_invoices table
CREATE POLICY "Users can only see their own invoices"
  ON zeroclaw_invoices
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id'));
```

**Guest/Demo users** access rows where `is_demo = true` and `user_id = 'demo'`.  
**Authenticated users** access rows where `user_id = their_email`.

### Real-Time WebSocket Push

The frontend subscribes to Supabase Realtime channels for instant settlement notifications:

```typescript
// File: ZeroClawTerminalView.tsx (Lines ~680-720)

const channel = supabase
  .channel('zeroclaw_solana_settlements')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'zeroclaw_solana_settlements' },
    (payload) => {
      const newRow = payload.new;
      // Instantly push new settlement to UI without polling
      setEvents(prev => [newEvt, ...prev]);
      onTriggerToast(`⚡ Real-Time On-Chain Settlement: +${amount} USDC!`);
    }
  )
  .subscribe();
```

### Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `zeroclaw_invoices` | Solana Pay invoice records (amount, memo, QR URL, status) | Per `user_id` |
| `zeroclaw_solana_settlements` | Confirmed on-chain settlement records | Per `user_id` |
| `zeroclaw_sop_checkpoints` | SOP human approval audit log | Admin only |
| `privy_embedded_wallets` | User-to-wallet mapping (email → Solana address) | Per `user_id` |
| `social_oauth_accounts` | Google/GitHub OAuth profile metadata | Per `user_id` |

---

## 6. Layer 4: Cloudflare R2 CDN

### Purpose
- Host QR Code images for Solana Pay invoices
- Store invoice receipt PDFs and logo assets
- Global CDN distribution via `cdn.zegaai.site`

### Upload Flow

```
Invoice Created → POST /v1/zeroclaw/invoice/create
                      │
                      ├── 1. Insert row into Supabase `zeroclaw_invoices`
                      ├── 2. Generate QR Code image (server-side)
                      ├── 3. Upload QR to Cloudflare R2 bucket
                      └── 4. Return `r2CdnUrl` to frontend
```

### CDN URL Pattern
```
https://cdn.zegaai.site/invoices/{userId}/{referenceKey}.png
https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg
https://cdn.zegaai.site/assets/logo/solana.png
```

---

## 7. Layer 5: Solana Devnet RPC

### Direct RPC Calls (Client-Side)

The frontend makes direct JSON-RPC calls to `https://api.devnet.solana.com` for:

| RPC Method | Purpose | Location |
|------------|---------|----------|
| `getBalance` | Fetch SOL balance for merchant wallet | Client-side |
| `getTokenAccountsByOwner` | Fetch USDC SPL token balance | Client-side |
| `requestAirdrop` | Request 1 SOL devnet airdrop for testing | Client-side |

### Proxied RPC Calls (Server-Side via Fastify)

| Endpoint | RPC Proxy | Purpose |
|----------|-----------|---------|
| `GET /v1/zeroclaw/solana-rpc` | `getSignaturesForAddress` | Fetch confirmed transaction signatures |
| `GET /v1/zeroclaw/solana-rpc?address={refKey}` | `getSignaturesForAddress` | Poll for Solana Pay reference key confirmation |

### Verified Live Data (2026-08-01)

```
Wallet: DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK
Network: solana-devnet
Confirmed Signatures: 20+ (Slot 480320796+)
Status: All signatures "finalized"
```

---

## 8. Authentication Flow: Guest vs Authenticated

### Guest (Demo) Mode

```
1. User visits ZEGA without login
2. accountMode = 'demo'
3. Wallet = Public sandbox (7xKX...gAsU)
4. Invoices fetched with isDemo=true
5. Settlements channel = SOLANA-PAY-DEMO
6. SOP Checkpoints displayed from /v1/zeroclaw/status
```

### Authenticated (Privy) Mode

```
1. User logs in via Google/GitHub OAuth or OTP Email
2. Privy SDK creates/retrieves embedded Solana wallet
3. accountMode = 'authenticated'
4. Wallet = Privy deterministic address (unique per email)
5. Invoices fetched with userId=userEmail (RLS partition)
6. Settlements channel = SOLANA-PAY-PRIVATE
7. Real-time Supabase subscription scoped to user
8. All invoices stored with merchantPubkey = Privy wallet
```

---

## 9. Data Flow: Invoice Creation to On-Chain Settlement

```
┌─────────────────┐     ┌──────────────────────┐    ┌─────────────────────┐
│  1. USER CLICKS │     │  2. FASTIFY API       │    │  3. SUPABASE DB     │
│  "Generate QR"  │────▸│  /v1/zeroclaw/        │───▸│  INSERT INTO        │
│  in Terminal UI │     │  invoice/create       │    │  zeroclaw_invoices  │
└─────────────────┘     └──────────┬───────────┘    └─────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  4. CLOUDFLARE R2 CDN │
                        │  Upload QR Code PNG   │
                        │  Return r2CdnUrl      │
                        └──────────────────────┘

┌──────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  5. CUSTOMER     │    │  6. SOLANA DEVNET     │    │  7. REFERENCE KEY   │
│  Scans QR Code   │───▸│  Transaction          │───▸│  POLLER detects     │
│  with Phantom    │    │  Confirmed on-chain   │    │  confirmed sig      │
└──────────────────┘    └──────────────────────┘    └─────────┬───────────┘
                                                              │
                        ┌──────────────────────┐              │
                        │  8. SUPABASE          │◂─────────────┘
                        │  INSERT INTO          │
                        │  zeroclaw_solana_     │
                        │  settlements          │
                        └──────────┬───────────┘
                                   │
                                   ▼ (Realtime WebSocket)
                        ┌──────────────────────┐
                        │  9. FRONTEND UI       │
                        │  Instant settlement   │
                        │  toast notification   │
                        │  "⚡ +15.00 USDC!"   │
                        └──────────────────────┘
```

---

## 10. Zero-Collision Guarantee

### Why Privy and ZeroClaw Never Conflict

| Dimension | Privy | ZeroClaw |
|-----------|-------|----------|
| **Runtime** | Client-side (Browser) | Server-side (Fastify + Daemon) |
| **Scope** | Identity & wallet derivation | Business logic & payment ops |
| **Key Access** | Manages private keys (MPC) | Zero key access (Tier 1 Keyless) |
| **Auth Tokens** | OAuth session tokens | Gateway pairing tokens (separate) |
| **Network Calls** | Privy API servers | ZeroClaw daemon (127.0.0.1:4242) |
| **State Storage** | Privy cloud + browser | Supabase + localStorage |

### Interaction Contract

```
Privy OUTPUTS:
  ├── userEmail         → ZeroClaw uses as Supabase partition key
  ├── walletAddress     → ZeroClaw uses as merchantPubkey
  └── privyUserId       → ZeroClaw logs for audit trail

ZeroClaw OUTPUTS:
  ├── invoice records   → Displayed in Privy-authenticated UI
  ├── settlement events → Pushed via Supabase Realtime
  └── checkpoint flags  → Shown in enterprise admin panel

NEVER SHARED:
  ├── Privy private keys → ZeroClaw has ZERO access
  ├── OAuth tokens       → ZeroClaw has ZERO access
  ├── ZeroClaw pairing   → Privy has ZERO involvement
  └── Daemon gateway URL → Privy has ZERO knowledge
```

---

## 11. REST API Endpoint Reference

### ZeroClaw Gateway Bridge (Fastify)

| Endpoint | Method | Auth | Body | Response |
|----------|--------|------|------|----------|
| `/v1/zeroclaw/status` | GET | None | — | `{ success, data: { state: { bridgeConnected, daemonVersion, gatewayUrl } } }` |
| `/v1/zeroclaw/pair` | POST | None | `{ pairingCode: "137170" }` | `{ success, token }` or `{ success: false, error }` |
| `/v1/zeroclaw/solana-rpc` | GET | None | — | `{ success, network, signatures[] }` |
| `/v1/zeroclaw/events` | POST | None | `{ eventType, channel, amountUsdc, memo }` | `{ success, message }` |
| `/v1/zeroclaw/agent/execute` | POST | None | `{ prompt, preferredModel }` | `{ response, model, latencyMs, tps }` |
| `/v1/zeroclaw/invoice/create` | POST | None | `{ userId, merchantPubkey, amount, memo, solanaPayUrl, referenceKey }` | `{ success, r2CdnUrl }` |
| `/v1/zeroclaw/invoice/list` | GET | Query | `?userId=email&isDemo=bool` | `{ invoices[] }` |
| `/v1/zeroclaw/settlement/list` | GET | Query | `?isDemo=bool&userId=email` | `{ data[] }` |
| `/v1/zeroclaw/settlement/record` | POST | None | `{ signature, amount, memo, privyVerified, privyWalletAddress }` | `{ success }` |
| `/v1/zeroclaw/approve-checkpoint` | POST | None | `{ checkpointId, decision: "approve"\|"reject" }` | `{ success }` |

---

## 12. Supabase Database Schema

### Migration Files (Production)

| Migration | Purpose |
|-----------|---------|
| `20260730233500_zeroclaw_solana_settlements.sql` | Core settlement table with RLS |
| `20260801000000_zeroclaw_privy_embedded_wallet.sql` | Privy wallet metadata |
| `20260801000100_zeroclaw_privy_wallets_table.sql` | Wallet-to-email deterministic mapping |
| `20260801000200_zeroclaw_social_oauth_accounts.sql` | Google/GitHub OAuth profile store |
| `20260801000300_zeroclaw_privy_enterprise_r2_sync.sql` | Enterprise R2 CDN sync triggers |
| `20260801000400_zeroclaw_invoices_and_settlements_cdn_vault.sql` | Invoice + CDN vault schema |
| `20260801000500_seed_real_zeroclaw_invoices_and_settlements.sql` | Seed data for demo mode |

### Key Table: `zeroclaw_invoices`

```sql
CREATE TABLE zeroclaw_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  merchant_pubkey TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  memo TEXT,
  solana_pay_url TEXT NOT NULL,
  reference_key TEXT NOT NULL UNIQUE,
  buyer_email TEXT,
  status TEXT DEFAULT 'active',
  r2_cdn_url TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Table: `zeroclaw_solana_settlements`

```sql
CREATE TABLE zeroclaw_solana_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tx_signature TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  channel TEXT,
  network TEXT DEFAULT 'solana-devnet',
  memo TEXT,
  slot BIGINT,
  privy_verified BOOLEAN DEFAULT false,
  privy_wallet_address TEXT,
  privy_user_id TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Realtime publication for instant UI push
ALTER PUBLICATION supabase_realtime ADD TABLE zeroclaw_solana_settlements;
```

---

## 13. Environment Variables Reference

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=https://zega-ai.onrender.com
VITE_PRIVY_APP_ID=cm6_privy_app_id
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://cdn.zegaai.site
```

### Backend (`apps/api/.env`)

```env
# Privy Server-Side Verification
PRIVY_APP_ID=cm6_privy_app_id
PRIVY_APP_SECRET=sec_privy_app_secret

# Supabase Service Key (bypasses RLS for admin operations)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ZeroClaw Gateway
ZEROCLAW_GATEWAY_URL=http://127.0.0.1:4242
ZEROCLAW_BEARER_TOKEN=zc_bearer_token

# Cloudflare R2
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=zega-cdn
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_MERCHANT_PUBKEY=DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK
```

---

## 14. Security Model

### OWASP Prompt Injection Defense

All AI agent prompts are scanned for injection patterns before execution:

```typescript
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)/i,
  /system\s*prompt/i,
  /act\s+as\s+(admin|root|superuser)/i,
  /transfer.*all.*funds/i,
  /refund.*instant/i,
];
```

Flagged prompts generate **SOP Checkpoints** requiring human admin approval.

### Tier 1 Keyless Custody

- **No private keys** stored on ZEGA backend servers
- **No private keys** stored in Supabase database
- All on-chain operations require **explicit user wallet signing** via Privy embedded wallet
- ZeroClaw operates in **read-only observation mode** for Solana RPC

### Data Isolation

- **RLS Policies**: Every Supabase table enforces row-level security per `user_id`
- **Demo Partition**: Guest users see only `is_demo=true` rows
- **Network Separation**: Privy auth tokens and ZeroClaw gateway tokens are completely independent

---

## 15. Deployment Architecture

```
┌─────────────────────────────┐
│       VERCEL (Frontend)     │
│  apps/web (Vite + React)    │
│  https://zegaai.site        │
│                             │
│  ▸ Privy SDK (client-side)  │
│  ▸ Supabase JS (client)    │
│  ▸ Solana RPC (direct)     │
└─────────────┬───────────────┘
              │ API calls
              ▼
┌─────────────────────────────┐
│      RENDER (Backend API)   │
│  apps/api (Fastify + Node)  │
│  https://zega-ai.onrender.  │
│  com                        │
│                             │
│  ▸ ZeroClaw Bridge Routes   │
│  ▸ Supabase Service Client  │
│  ▸ R2 CDN Upload            │
│  ▸ 9Router Multi-LLM        │
└─────────────┬───────────────┘
              │ Optional local
              ▼
┌─────────────────────────────┐
│   LOCAL DEV (ZeroClaw CLI)  │
│   zeroclaw gateway          │
│   --port 4242               │
│   --network solana-devnet   │
│                             │
│   ▸ /health                 │
│   ▸ /pair                   │
│   ▸ /webhook                │
└─────────────────────────────┘
```

### Live Production Endpoints

| Service | URL | Status |
|---------|-----|--------|
| Frontend | `https://zegaai.site` | ✅ Live |
| Backend API | `https://zega-ai.onrender.com` | ✅ Live |
| CDN Assets | `https://cdn.zegaai.site` | ✅ Live |
| Solana RPC | `https://api.devnet.solana.com` | ✅ Live |
| ZeroClaw Daemon | `http://127.0.0.1:4242` | ✅ Local Only |

---

## 16. Real-Time Solana Pay Reconciliation & Enterprise Invoice Management

### Pure Automated RPC Monitoring (No Manual Inputs)
- **Zero-Trust Automated Polling**: Settlement reconciliation relies exclusively on automated RPC calls (`getSignaturesForAddress`) against Solana Devnet reference accounts and Associated Token Accounts (ATAs). Manual input forms are intentionally omitted to prevent anti-replay spoofing.
- **Strict Base58 Signature Regex (`70-96` chars)**: Enforces `/^[1-9A-HJ-NP-Za-km-z]{70,96}$/` for transaction signatures, guaranteeing that 32-44 character Public Keys or Reference Keys are never confused with authentic 86-90 character ed25519 signatures.

### Official Brand Explorer Integration
- **Solscan Explorer**: Displays official brand logo loaded via Cloudflare R2 CDN (`/assets/logo/solscan.png`), linking directly to on-chain tx signatures: `https://solscan.io/tx/{sig}?cluster=devnet`.
- **Solana Official Explorer**: Displays official brand logo (`/assets/logo/Solana Explorer.png`), linking directly to `https://explorer.solana.com/tx/{sig}?cluster=devnet`.

### Enterprise Double-Confirmation Modal UX
- **Invoice Management**: Replaced raw deletion buttons with an interactive **Kelola / Edit** modal (`editInvoiceModal`).
- **Parameter Adjustments**: Merchants can edit Memo, Customer Target (Telegram/WhatsApp), or Amount.
- **Double-Confirmation Alert**: Deleting an invoice triggers an explicit confirmation card with red alert styling: *"Apakah Anda yakin ingin membatalkan & menghapus tagihan ini dari Supabase DB dan Cloudflare R2 Vault CDN?"*.

---

## Appendix: File References

| File | Purpose |
|------|---------|
| `apps/api/src/routes/v1/zeroclaw.routes.ts` | All ZeroClaw REST API route handlers |
| `apps/web/src/app/dashboard/enterprise/views/ZeroClawTerminalView.tsx` | Enterprise ZeroClaw Terminal UI |
| `apps/web/src/app/dashboard/umkm/views/FinanceView.tsx` | UMKM Finance + ZeroClaw Settlement Stream |
| `apps/web/src/app/DocsPage.tsx` | Public documentation page with API reference |
| `apps/web/src/services/privyWalletService.ts` | Privy wallet derivation service |
| `supabase/migrations/20260801000400_*.sql` | Invoice + Settlement CDN vault schema |
| `docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md` | Integration guide for ZeroClaw v0.8.3 |
