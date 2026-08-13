# ZEGA

## Agentic Execution & Settlement Platform

[![CI](https://github.com/siabang35/zega.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/siabang35/zega.ai/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](package.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](LICENSE)

ZEGA is a platform for deploying, orchestrating, governing, and monetizing AI agents across automated business workflows with on-chain financial settlement on Solana.

---

## Table of Contents

- [Overview](#overview)
- [Product Lifecycle](#product-lifecycle)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Implemented Capabilities](#implemented-capabilities)
- [Privy SDK Integration](#privy-sdk-integration)
- [Custody Model](#custody-model)
- [Agent Runtime: ZeroClaw Integration](#agent-runtime-zeroclaw-integration)
- [ZeroClaw + Solana Pay Workflow](#zeroclaw--solana-pay-workflow)
- [Security & Trust Boundaries](#security--trust-boundaries)
- [Quickstart](#quickstart)
- [Build, Type-Check & Testing](#build-type-check--testing)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

ZEGA provides execution infrastructure for AI agents that perform business operations — bridging LLM reasoning with deterministic on-chain verification and atomic database state transitions.

The platform separates agent proposal generation from system state commits. Financial settlement, fund reservations, and governance approvals execute through PostgreSQL transactional RPCs (`settle_payment_atomic`, `process_withdrawal_request`) and Solana on-chain signature verification, rather than relying on LLM output as the authority over security-critical state changes.

---

## Product Lifecycle

ZEGA's execution lifecycle spans five stages:

| Stage | Description | Current Implementation |
|---|---|---|
| **Deploy** | Provision and configure agent runtimes | ZeroClaw v0.8.3 `config.toml` provisioning with skills and SOPs |
| **Orchestrate** | Coordinate multi-step agent workflows | SOP engine with cron triggers (`payment-reconciliation`) and event triggers |
| **Govern** | Enforce security policies and human approval gates | Risk profiles with tool exclusion lists, approval checkpoints (`quorum: 1`) |
| **Execute** | Connect agents to external systems and blockchains | Solana Pay settlement, Privy SDK wallet signing, multi-provider RPC pool |
| **Monetize** | Enable agent-driven revenue workflows | Solana Pay QR invoicing and scheduled reconciliation |

---

## Architecture

```text
┌─────────────────────────────────────┐
│         Client Interfaces           │
│   Merchant POS / Telegram / Webhook │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     ZEGA Platform Layer             │
│  Vite + React SPA    (apps/web)     │
│  Fastify v5 REST API (apps/api)     │
│  Privy SDK / Fastify JWT Auth       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Agent Runtime / Integrations      │
│  ZeroClaw Rust Runtime (v0.8.3)     │
│  Skills / SOPs / MCP Servers        │
│  @zega/zeroclaw-bridge              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Business Workflow Execution       │
│  Invoice Generation                 │
│  Atomic Payment Settlement (RPC)    │
│  Solana Signature Monitoring        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   External Systems                  │
│  Solana Devnet / Supabase / R2 CDN  │
└─────────────────────────────────────┘
```

---

## Repository Structure

```text
.
├── apps/
│   ├── api/                 # Fastify v5 REST API backend (TypeScript)
│   └── web/                 # Vite + React SPA frontend (TypeScript)
├── packages/
│   ├── config/              # Shared ESLint, TypeScript, and Tailwind configurations
│   ├── shared/              # Shared TypeScript utilities, types, and schema models
│   ├── supabase/            # Shared Supabase client configuration and types
│   └── zeroclaw-bridge/     # ZeroClaw Rust agent bridge client package
├── supabase/
│   └── migrations/          # PostgreSQL database schema migrations & transactional RPCs
├── docs/                    # Architecture diagrams, specifications, audits, and runbooks
├── scripts/                 # Development, migration, and verification scripts
├── guidelines/              # Contribution and development guidelines
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── turbo.json               # Turborepo build & cache orchestration
├── render.yaml              # Render.com deployment configuration
└── vercel.json              # Vercel deployment configuration
```

---

## Implemented Capabilities

Each capability below is referenced to its implementing source file for independent verification.

| Category | Capability | Source Reference |
|---|---|---|
| **Auth** | Privy server-side auth via `@privy-io/server-auth` v1.32.x | [`apps/api/src/services/privyService.ts`](apps/api/src/services/privyService.ts) |
| **Auth** | Fastify JWT verification (`request.jwtVerify()`) on financial endpoints | [`apps/api/src/routes/v1/withdrawal.routes.ts`](apps/api/src/routes/v1/withdrawal.routes.ts), [`apps/api/src/plugins/index.ts`](apps/api/src/plugins/index.ts) |
| **Agent Runtime** | ZeroClaw v0.8.3 Rust binary integration via TypeScript bridge client | [`packages/zeroclaw-bridge/`](packages/zeroclaw-bridge/) |
| **Workflow** | Cron-triggered SOP: `payment-reconciliation` | [`docs/zeroclaw/sops/payment-reconciliation/`](docs/zeroclaw/sops/payment-reconciliation/) |
| **Governance** | Human-in-the-loop approval checkpoint (`quorum: 1`) | [`docs/zeroclaw/sops/refund-approval/SOP.md`](docs/zeroclaw/sops/refund-approval/SOP.md) |
| **Governance** | Risk profile excluding `sendai-solana__transfer` and `sendai-solana__sign_transaction` MCP tools | [`docs/zeroclaw/config.toml`](docs/zeroclaw/config.toml) |
| **Security** | Regex-based prompt injection detection (18 patterns covering known attack phrases) | [`apps/api/src/utils/settlementValidation.ts`](apps/api/src/utils/settlementValidation.ts) |
| **Security** | RPC method whitelist restricting callable Solana JSON-RPC methods | [`apps/api/src/services/solanaRpcManager.ts`](apps/api/src/services/solanaRpcManager.ts) |
| **Solana** | Multi-provider RPC pool with circuit breaker failover, token bucket rate limiting, and request deduplication | [`apps/api/src/services/solanaRpcManager.ts`](apps/api/src/services/solanaRpcManager.ts) |
| **Solana** | Atomic PostgreSQL settlement RPC with advisory locking (`pg_advisory_xact_lock`) | [`supabase/migrations/20260811_final_remediation.sql`](supabase/migrations/20260811_final_remediation.sql) |
| **Solana** | Replay protection via `UNIQUE` constraints on transaction signatures and idempotency keys | [`supabase/migrations/20260811_withdrawals.sql`](supabase/migrations/20260811_withdrawals.sql) |
| **Reconciliation** | Background scheduled reconciliation worker with multi-node lock guard (`setInterval`, 120s default cycle) | [`apps/api/src/services/ReconciliationScheduler.ts`](apps/api/src/services/ReconciliationScheduler.ts) |

---

## Privy SDK Integration

ZEGA integrates `@privy-io/react-auth` v2.11.x (browser) and `@privy-io/server-auth` v1.32.x (server) for wallet management and transaction signing:

- **Key Management:** Private keys are managed by Privy's SDK infrastructure. Raw keys, seed phrases, and mnemonics are not stored, logged, or accessed in ZEGA application code or database records.
- **Dual-Auth Architecture:** Preserves native authentication (Email/Brevo OTP, Google, GitHub OAuth) while using Privy's embedded wallet for Solana transaction signing.
- **Client-Side Signing:** Browser-side transaction signing executes via `useSignTransaction` from `@privy-io/react-auth/solana`, targeting `effectiveSigningAddress` resolved from the authenticated user's Privy wallet list.
- **Wallet-less UX:** Users execute withdrawals without requiring external browser extension wallets (e.g., Phantom, Solflare).
- **Technical Details:** See [`docs/payments/x402_PAYMENT_INFRASTRUCTURE.md`](docs/payments/x402_PAYMENT_INFRASTRUCTURE.md) and [`docs/PRD/44-ZERO-TRUST-WITHDRAWAL-SECURITY-AND-IDEMPOTENCY-SPEC.md`](docs/PRD/44-ZERO-TRUST-WITHDRAWAL-SECURITY-AND-IDEMPOTENCY-SPEC.md).

---

## Custody Model

**Custody Classification: Non-Custodial (Privy SDK Delegated Signing)**

| Boundary | Implementation |
|---|---|
| Private Key Storage | Not stored by ZEGA. Keys are managed within Privy's SDK infrastructure. |
| LLM Context Isolation | Private keys are excluded from LLM prompt context via ZeroClaw's `excluded_tools` configuration. |
| Transaction Signing | Executed via Privy's `useSignTransaction` hook (client) or `@privy-io/server-auth` (server). |
| Settlement Authority | Deterministic backend verification against Solana on-chain transaction state via `getSignatureStatuses`. |

---

## Agent Runtime: ZeroClaw Integration

ZEGA integrates with [ZeroClaw](https://github.com/zeroclaw-labs/zeroclaw) v0.8.3 as a self-hosted agent execution runtime (pinned version range: `>=0.8.0 <0.9.0-alpha`). ZeroClaw handles agent reasoning, channel I/O (Telegram, Webhook), SOP execution, and skill dispatch. ZEGA provides the application tier — REST APIs, Solana RPC management, settlement verification, and database persistence.

The bridge client (`@zega/zeroclaw-bridge`) communicates with the ZeroClaw daemon's HTTP Gateway API on port `4242`. See [`packages/zeroclaw-bridge/`](packages/zeroclaw-bridge/) for implementation and [`docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`](docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) for the integration guide.

---

## ZeroClaw + Solana Pay Workflow

Demonstrates a merchant payment workflow using ZeroClaw and Solana Pay on Devnet:

1. **Invoice Request:** Cashier sends order to Telegram or Webhook channel connected to ZeroClaw.
2. **Solana Pay QR Generation:** ZeroClaw invokes the `solana-pay` skill to generate a Solana Pay QR code with a single-use reference key.
3. **Payment:** Customer pays via a Solana-compatible wallet on Solana Devnet.
4. **Settlement:** The signature monitor (`zeroclawSignatureMonitor.ts`) detects the on-chain transaction and calls the `settle_payment_atomic` PostgreSQL RPC to finalize the invoice.

---

## Security & Trust Boundaries

| Control | Implementation | Source |
|---|---|---|
| **Advisory Locking** | `pg_advisory_xact_lock` prevents concurrent withdrawal race conditions | [`20260811_final_remediation.sql`](supabase/migrations/20260811_final_remediation.sql) |
| **Atomic Settlement** | Payments and invoice updates execute in a single PostgreSQL transaction (`settle_payment_atomic`) | [`20260811_remediate_lifecycle_consistency.sql`](supabase/migrations/20260811_remediate_lifecycle_consistency.sql) |
| **Replay Protection** | `UNIQUE` constraints on `idempotency_key` and `tx_signature` columns | [`20260811_withdrawals.sql`](supabase/migrations/20260811_withdrawals.sql), [`20260811_transactions_engine.sql`](supabase/migrations/20260811_transactions_engine.sql) |
| **JWT Authorization** | `request.jwtVerify()` on all financial endpoints with user identity binding | [`apps/api/src/routes/v1/`](apps/api/src/routes/v1/) |
| **RPC Failover** | Multi-provider pool (env-configured, e.g., Alchemy, Helius, QuickNode) with exponential cooldown circuit breaker | [`solanaRpcManager.ts`](apps/api/src/services/solanaRpcManager.ts) |
| **Prompt Injection** | Regex-based detection of 18 known attack patterns (e.g., `ignore previous instructions`, `bypass safety`) | [`settlementValidation.ts`](apps/api/src/utils/settlementValidation.ts) |
| **CI Security Gates** | Dependency audit, secret scanning, destructive migration detection | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |

---

## Quickstart

### Prerequisites

- **Node.js** `≥ 20` (CI tested on Node 22)
- **pnpm** `≥ 9.0.0`

### Installation & Local Development

```bash
git clone https://github.com/siabang35/zega.ai.git
cd ZEGA
pnpm install
cp .env.example .env   # Configure required environment variables (see .env.example for full list)
pnpm dev               # Starts web frontend (localhost:5173) and API backend (localhost:3001)
```

> **Note:** The `.env.example` file documents all required variables including Supabase credentials, Cloudflare R2, Turnstile, JWT secrets, and rate limiting configuration. Solana RPC and Privy credentials must be added separately for blockchain and wallet features.

---

## Build, Type-Check & Testing

```bash
pnpm type-check   # TypeScript type-checking across all monorepo packages
pnpm build        # Production builds for web frontend and API backend
pnpm test         # Run test suites (security, payment verification, concurrency)
```

The CI pipeline (`.github/workflows/ci.yml`) executes: dependency security audit, secret scanning, type-check, build, API test suites, ZeroClaw skill schema validation, and migration safety checks.

---

## Documentation

| Topic | Path |
|---|---|
| Payment & Withdrawal Infrastructure | [`docs/payments/x402_PAYMENT_INFRASTRUCTURE.md`](docs/payments/x402_PAYMENT_INFRASTRUCTURE.md) |
| Zero-Trust Withdrawal Specification | [`docs/PRD/44-ZERO-TRUST-WITHDRAWAL-SECURITY-AND-IDEMPOTENCY-SPEC.md`](docs/PRD/44-ZERO-TRUST-WITHDRAWAL-SECURITY-AND-IDEMPOTENCY-SPEC.md) |
| ZeroClaw Integration Guide | [`docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`](docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) |
| ZeroClaw Integration Matrix | [`docs/zeroclaw/ZEROCLAW_INTEGRATION_MATRIX.md`](docs/zeroclaw/ZEROCLAW_INTEGRATION_MATRIX.md) |
| Security Threat Model | [`docs/zeroclaw/SECURITY_THREAT_MODEL.md`](docs/zeroclaw/SECURITY_THREAT_MODEL.md) |
| RPC Failover Manager Specification | [`docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md`](docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md) |

---

## License

Licensed under [AGPL-3.0](LICENSE).
Copyright © 2026 ZEGA AI.