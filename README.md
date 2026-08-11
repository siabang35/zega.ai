# ZEGA

## Enterprise Agentic Execution & Settlement Platform

[![CI](https://github.com/siabang35/zega.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/siabang35/zega.ai/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](package.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](LICENSE)

ZEGA is an enterprise agentic execution platform that enables organizations to deploy, orchestrate, govern, and monetize AI agents across automated business workflows with verified financial settlement.

---

## Table of Contents

- [What is ZEGA?](#what-is-zega)
- [Product Thesis](#product-thesis)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Core Capabilities](#core-capabilities)
- [Privy SDK Integration](#privy-sdk-integration)
- [Custody Model](#custody-model)
- [Agent Runtime: ZeroClaw Integration](#agent-runtime-zeroclaw-integration)
- [ZeroClaw + Solana Showcase](#zeroclaw--solana-showcase)
- [Security & Trust Boundaries](#security--trust-boundaries)
- [Quickstart](#quickstart)
- [Build, Type-Check & Testing](#build-type-check--testing)
- [Documentation](#documentation)
- [License](#license)

---

## What is ZEGA?

ZEGA provides execution infrastructure for autonomous AI agents that perform enterprise operations — moving beyond conversational LLMs into governed workflows with deterministic on-chain verification and atomic state transitions.

The platform addresses a core enterprise integration requirement: LLM reasoning is probabilistic and cannot serve as the sole authority over security-critical state changes. ZEGA separates agent proposal generation from system state commits, ensuring that financial settlement, fund reservations, and governance approvals execute through PostgreSQL transactional RPCs and cryptographic blockchain verification.

---

## Product Thesis

ZEGA's execution lifecycle spans five defined stages:

| Stage | Description | Implementation Status |
|---|---|---|
| **Deploy** | Provision and configure agent runtimes | ZeroClaw configuration, skill, and SOP provisioning |
| **Orchestrate** | Coordinate multi-step agent workflows | SOP engine (cron triggers, event triggers) |
| **Govern** | Enforce security policies and human approval gates | Risk profiles, approval checkpoints, prompt injection guards |
| **Execute** | Connect agents to external systems and blockchains | Solana Pay settlement, Privy keyless signing, RPC failover pool |
| **Monetize** | Enable agent-driven revenue workflows | Solana Pay QRIS invoicing & automated reconciliation |

---

## Architecture

```text
┌─────────────────────────────────────┐
│         Enterprise Users            │
│   Merchant POS / Telegram / Webhook │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     ZEGA Agentic Platform Layer     │
│  React Console (apps/web)           │
│  Fastify API    (apps/api)          │
│  Privy Keyless SDK / JWT Auth       │
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
│  Atomic Payment Settlement          │
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
│   ├── api/                 # Fastify REST API backend (TypeScript)
│   └── web/                 # Next.js / React Enterprise Console (TypeScript)
├── packages/
│   ├── config/              # Shared ESLint, TypeScript, and Tailwind configurations
│   ├── shared/              # Shared TypeScript utilities, types, and schema models
│   ├── supabase/            # Shared Supabase client configuration and types
│   └── zeroclaw-bridge/     # ZeroClaw Rust agent bridge client package
├── supabase/
│   └── migrations/          # PostgreSQL database schema migrations & transactional RPCs
├── docs/                    # Architecture diagrams, specifications, audits, and runbooks
├── scripts/                 # Development, migration, and verification scripts
├── pnpm-workspace.yaml      # Monorepo workspace configuration
└── turbo.json               # Turborepo build & cache orchestration
```

---

## Core Capabilities

| Category | Capability | Status | Evidence |
|---|---|---|---|
| **Keyless Auth** | Privy SDK Server Signing (`@privy-io/server-auth`) | Implemented | `apps/api/src/services/privyService.ts` |
| **Agent Runtime** | ZeroClaw Rust binary integration via bridge client | Implemented | `packages/zeroclaw-bridge/`, `docs/zeroclaw/config.toml` |
| **Workflow Engine** | Cron-triggered SOP (`payment-reconciliation`) | Implemented | `docs/zeroclaw/sops/payment-reconciliation/` |
| **Governance** | Human-in-the-loop approval checkpoint (`quorum: 1`) | Implemented | `docs/zeroclaw/sops/refund-approval/SOP.md` |
| **Governance** | Supervised risk profile (blacklists `transfer`, `sign_transaction`) | Implemented | `docs/zeroclaw/config.toml` |
| **Security** | OWASP prompt injection screening (defense-in-depth) | Implemented | `apps/api/src/utils/settlementValidation.ts` |
| **Security** | Fastify JWT auth (`request.jwtVerify()`) & IDOR checks | Implemented | `apps/api/src/routes/v1/` |
| **Solana** | Solana Pay single-use reference key generation | Implemented | `docs/zeroclaw/skills/solana-pay/` |
| **Solana** | RPC pool with circuit breaker failover | Implemented | `apps/api/src/services/solanaRpcManager.ts` |
| **Solana** | Atomic PostgreSQL settlement RPCs & advisory locking | Implemented | `supabase/migrations/20260811_final_remediation.sql` |
| **Reconciliation** | Background multi-node scheduled reconciliation worker | Implemented | `apps/api/src/services/ReconciliationScheduler.ts` |

---

## Privy SDK Integration

ZEGA integrates `@privy-io/react-auth` (Client Browser Enclave) and `@privy-io/server-auth` (Server Enclave) to enforce a **Keyless, Non-Custodial Architecture**:

- **Zero-Key Invariant:** Raw private keys, seed phrases, and mnemonics are never stored, logged, or exposed in backend application code, database records, or AI agent context windows.
- **Dual-Auth Architecture:** Preserves native authentication (Email/Brevo OTP, Google, GitHub OAuth) while leveraging Privy's MPC embedded wallet enclave for Solana transaction signing.
- **Client & Server Enclave Signing:** Browser-side transaction signing executes via `@privy-io/react-auth/solana` (`useSignTransaction`) using resolved `effectiveSigningAddress`, with backend fallback to `@privy-io/server-auth`.
- **Keyless User Experience:** Users execute withdrawals non-custodially without requiring external browser extension wallets.
- **Architecture Documentation:** See [`docs/ZEGA_PRIVY_WITHDRAWAL_ARCHITECTURE.md`](docs/ZEGA_PRIVY_WITHDRAWAL_ARCHITECTURE.md) for complete technical details.

---

## Custody Model

**Custody Tier: T1 (Keyless Enclave).**

| Boundary | Design |
|---|---|
| Private Key Access | None. ZeroClaw runtime and ZEGA API never access or persist raw private keys. |
| LLM Context | Private keys are excluded from LLM prompt context windows. |
| Transaction Signing | Executed via Privy Wallet API or explicit user wallet signature approval. |
| Settlement Authority | Deterministic backend verification against Solana on-chain state. |

---

## Agent Runtime: ZeroClaw Integration

ZEGA integrates with ZeroClaw as a self-hosted agent execution runtime. ZeroClaw handles agent reasoning, channel I/O, SOP execution, and skill dispatch. ZEGA provides the platform application tier — REST APIs, Solana RPC management, settlement verification, and database persistence.

---

## ZeroClaw + Solana Showcase

Demonstrates an autonomous merchant workflow using ZeroClaw and Solana Pay:

1. **Invoice Request:** Cashier sends order to Telegram/Webhook channel.
2. **Solana Pay QRIS:** ZeroClaw generates locked-amount Solana Pay QR code with single-use reference key.
3. **Payment:** Customer pays via Solana-compatible wallet on Solana Devnet.
4. **Automated Settlement:** Signature monitor verifies on-chain transaction status and posts receipt.

---

## Security & Trust Boundaries

- **Advisory Locking:** Transactional lock `pg_advisory_xact_lock` prevents concurrent withdrawal race conditions.
- **Atomic Settlement:** Payments and invoice updates execute in single PostgreSQL transactions (`settle_payment_atomic`).
- **Replay Protection:** Enforced by `UNIQUE` constraints on transaction signatures and idempotency keys.
- **JWT Authorization:** Strict JWT verification and IDOR guards across financial endpoints.
- **RPC Failover:** Multi-provider RPC pool (Alchemy, Helius, QuickNode) with automatic failover.

---

## Quickstart

### Prerequisites

- **Node.js** `≥ 20`
- **pnpm** `≥ 9.0.0`

### Installation & Local Development

```bash
git clone https://github.com/siabang35/zega.ai.git
cd ZEGA
pnpm install
cp .env.example .env   # Configure JWT_SECRET, PRIVY_APP_ID, SUPABASE_URL
pnpm dev               # Starts web frontend (localhost:5173) and API backend (localhost:3001)
```

---

## Build, Type-Check & Testing

Validate codebase integrity and test coverage across the monorepo:

```bash
pnpm type-check   # Perform TypeScript type-checking across all monorepo packages
pnpm build        # Execute production builds for web frontend and API backend
pnpm test         # Run integration and concurrency test suites
```

---

## Documentation

| Topic | Document Path |
|---|---|
| **Payment Infrastructure Audit & Runbook** | [`docs/PAYMENT_INFRASTRUCTURE_AUDIT_AND_RUNBOOK.md`](docs/PAYMENT_INFRASTRUCTURE_AUDIT_AND_RUNBOOK.md) |
| **ZeroClaw Solana Integration & Showcase** | [`docs/ZEROCLAW_SOLANA_INTEGRATION_SHOWCASE.md`](docs/ZEROCLAW_SOLANA_INTEGRATION_SHOWCASE.md) |
| **ZeroClaw Integration Guide** | [`docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`](docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) |
| **Security Threat Model** | [`docs/zeroclaw/SECURITY_THREAT_MODEL.md`](docs/zeroclaw/SECURITY_THREAT_MODEL.md) |
| **Bounty Reproducibility Guide** | [`docs/zeroclaw/REPRODUCIBILITY.md`](docs/zeroclaw/REPRODUCIBILITY.md) |
| **RPC Failover Manager Spec** | [`docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md`](docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md) |

---

## License

Licensed under [AGPL-3.0](LICENSE).  
Copyright © 2026 ZEGA AI.