# ZEGA

## Zero-friction Enterprise Generative AI & Automation

[![CI](https://github.com/siabang35/zega.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/siabang35/zega.ai/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](package.json)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](LICENSE)

ZEGA is an agentic execution platform that lets organizations deploy, orchestrate, govern, and monetize AI agents across business workflows.

The current repository includes a concrete, reproducible showcase: a **ZeroClaw + Solana Pay merchant workflow** demonstrating keyless agent-driven invoice generation, on-chain settlement verification, and human-in-the-loop refund governance — submitted for the [Superteam Brasil ZeroClaw bounty](https://superteam.fun/earn/listing/zeroclaw).

---

## Table of Contents

- [What is ZEGA?](#what-is-zega)
- [Product Thesis](#product-thesis)
- [Architecture](#architecture)
- [Core Capabilities](#core-capabilities)
- [Agent Runtime: ZeroClaw Integration](#agent-runtime-zeroclaw-integration)
- [ZeroClaw + Solana Showcase](#zeroclaw--solana-showcase)
- [Custody Model](#custody-model)
- [Security & Trust Boundaries](#security--trust-boundaries)
- [Quickstart](#quickstart)
- [Reproduce the ZeroClaw + Solana Demo](#reproduce-the-zeroclaw--solana-demo)
- [Testing](#testing)
- [Repository Structure](#repository-structure)
- [Project Status](#project-status)
- [Known Limitations](#known-limitations)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## What is ZEGA?

ZEGA provides infrastructure for running AI agents that interact with real business systems — not just generating text responses, but executing governed workflows with deterministic verification.

The platform addresses a fundamental challenge: LLM reasoning is non-deterministic and should never be the sole authority over security-critical state transitions. ZEGA enforces a strict boundary between what an agent *proposes* and what the system *commits*, ensuring that financial settlement, approval decisions, and external actions are verified through deterministic backend logic rather than LLM-generated text.

---

## Product Thesis

ZEGA's execution lifecycle spans five stages:

| Stage | Description | Current Implementation Status |
|---|---|---|
| **Deploy** | Provision and configure agent runtimes | ✅ ZeroClaw config, skill, and SOP provisioning |
| **Orchestrate** | Coordinate multi-step agent workflows | ✅ SOP engine (cron triggers, channel triggers) |
| **Govern** | Enforce security policies and human approval gates | ✅ Risk profiles, approval checkpoints, prompt injection guards |
| **Execute** | Connect agents to external systems and blockchains | ✅ Solana Pay settlement, RPC pool management |
| **Monetize** | Enable agent-driven revenue workflows | ⚠️ Demonstrated via Solana Pay invoicing (Devnet) |

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
│  Governance / Security / RLS        │
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
│  Settlement Verification            │
│  Signature Monitoring               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   External Systems                  │
│  Solana Devnet / Supabase / R2 CDN  │
└─────────────────────────────────────┘
```

ZEGA itself is a TypeScript monorepo (React 18 + Fastify). It integrates with the [ZeroClaw](https://github.com/zeroclaw-labs/zeroclaw) Rust agent runtime as the primary agent execution engine for the demonstrated workflow. Solana serves as the blockchain execution and settlement rail.

---

## Core Capabilities

| Category | Capability | Status | Evidence |
|---|---|---|---|
| **Agent Runtime** | ZeroClaw Rust binary integration via bridge client | ✅ Implemented | `packages/zeroclaw-bridge/`, `docs/zeroclaw/config.toml` |
| **Workflow Engine** | Cron-triggered SOP (`payment-reconciliation`) | ✅ Implemented | `docs/zeroclaw/sops/payment-reconciliation/` |
| **Workflow Engine** | Channel-triggered SOP (`refund-approval`) | ✅ Implemented | `docs/zeroclaw/sops/refund-approval/` |
| **Governance** | Human-in-the-loop approval checkpoint (`quorum: 1`) | ✅ Implemented | `docs/zeroclaw/sops/refund-approval/SOP.md` |
| **Governance** | Supervised risk profile (blacklists `transfer`, `sign_transaction`) | ✅ Implemented | `docs/zeroclaw/config.toml` |
| **Security** | Prompt injection regex screening (defense-in-depth) | ✅ Implemented | `apps/api/src/utils/settlementValidation.ts` |
| **Security** | HMAC-SHA256 webhook verification (timing-safe) | ✅ Implemented | `apps/api/src/routes/v1/zeroclaw.routes.ts` |
| **Solana** | Solana Pay single-use reference key generation | ✅ Implemented | `docs/zeroclaw/skills/solana-pay/` |
| **Solana** | RPC pool with circuit breaker failover | ✅ Implemented | `apps/api/src/services/solanaRpcManager.ts` |
| **Solana** | Deterministic settlement verification (Base58, mint, freshness) | ⚠️ Devnet | `apps/api/src/services/zeroclawSignatureMonitor.ts` |
| **Solana** | Atomic replay protection (`tx_signature UNIQUE`) | ✅ Implemented | `supabase/migrations/` |
| **Enterprise UI** | Multi-tenant dashboard (Enterprise, UMKM, CRM) | ✅ Implemented | `apps/web/`, `apps/api/src/routes/v1/enterprise.routes.ts` |
| **Channels** | Telegram, Webhook, WhatsApp configuration | ✅ Configured | `docs/zeroclaw/config.toml` |
| **MCP** | Helius DAS (SSE) and SendAI Solana (stdio) MCP servers | ✅ Configured | `docs/zeroclaw/config.toml` |
| **Local Testing** | TypeScript dev harness | 🧪 Dev Only | `scripts/zeroclaw-daemon-harness.ts` |
| **Mainnet**| Production mainnet settlement | 🗺️ Planned | — |

---

## Agent Runtime: ZeroClaw Integration

ZEGA integrates with ZeroClaw as a self-hosted agent execution runtime within ZEGA's broader execution architecture. ZeroClaw handles agent reasoning, channel I/O, SOP execution, and skill dispatch. ZEGA provides the application layer — API endpoints, Solana RPC management, settlement verification, and database persistence.

### Component Hierarchy

| Component | Role | Location |
|---|---|---|
| **ZeroClaw Rust Runtime** | Primary agent execution engine (official binary) | External: [zeroclaw-labs/zeroclaw](https://github.com/zeroclaw-labs/zeroclaw) |
| **ZEGA API** | Application backend (invoices, settlement, RPC pool) | `apps/api/` |
| **ZEGA Skills** | Teach ZeroClaw how to call ZEGA API endpoints | `docs/zeroclaw/skills/` |
| **ZEGA SOPs** | Define multi-step workflow triggers and approval gates | `docs/zeroclaw/sops/` |
| **@zega/zeroclaw-bridge** | TypeScript client for ZeroClaw gateway pairing | `packages/zeroclaw-bridge/` |
| **Agent Config** | Runtime configuration (channels, risk profile, MCP, custody) | `docs/zeroclaw/config.toml` |
| **Dev Harness** | Local HTTP mock for offline testing **(not the bounty runtime)** | `scripts/zeroclaw-daemon-harness.ts` |

### Runtime vs. Development Harness

**Primary bounty runtime**: The official ZeroClaw Rust binary (`v0.8.3`), installed via `curl -fsSL https://raw.githubusercontent.com/zeroclaw-labs/zeroclaw/master/install.sh | bash` and started with `zeroclaw agent`.

**Development harness**: `scripts/zeroclaw-daemon-harness.ts` is a lightweight HTTP mock for offline unit testing. It does not execute real SOPs, does not load real skills, and provides no security guarantees. It is explicitly not the production or bounty demonstration path.

---

## ZeroClaw + Solana Showcase

This showcase demonstrates one concrete ZEGA execution workflow using ZeroClaw + Solana, submitted for the **Superteam Brasil ZeroClaw bounty**. It is a demonstration of ZEGA's broader agentic execution thesis, not the complete definition of ZEGA.

### Demonstrated Workflow

```text
Merchant / Cashier
      │
      ▼
Telegram / Webhook Channel
      │
      ▼
ZeroClaw Rust Runtime (v0.8.3)
      │
      │ solana-pay Skill (HTTP call)
      ▼
ZEGA API (Fastify)
      │
      ├── Generates Solana Pay URL with single-use reference key
      ├── Returns QR payload to ZeroClaw (<200 tokens)
      │
      ▼
Customer Wallet (Phantom / Solflare)
      │  Signs transaction on Solana Devnet (T1 Keyless)
      ▼
Solana Devnet
      │
      ▼
payment-reconciliation SOP (Cron every 30s)
      │
      ├── getSignaturesForAddress(reference_key)
      ├── getTransaction(tx_signature)
      ├── Verifies: recipient pubkey, USDC mint, Base58 format, blockTime freshness
      ├── Atomic UPSERT (on_conflict=tx_signature)
      │
      ▼
Merchant Notification
      "Invoice #412 paid ✓"
```

### Bounty Resources

| Resource | Link |
|---|---|
| Bounty Showcase Document | [`ZEROCLAW_SOLANA_BOUNTY_SHOWCASE.md`](ZEROCLAW_SOLANA_BOUNTY_SHOWCASE.md) |
| Judge Reproducibility Manual | [`docs/zeroclaw/REPRODUCIBILITY.md`](docs/zeroclaw/REPRODUCIBILITY.md) |
| ZeroClaw Integration Guide | [`docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`](docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) |
| Upstream PR Guide | [`docs/book/src/integrations/zega-ai.md`](docs/book/src/integrations/zega-ai.md) (PR #9806) |
| Live Console (Devnet) | [https://zegaai.site](https://zegaai.site) |

---

## Custody Model

**Demonstrated custody tier: T1 (Build / Keyless).**

The agent constructs payment requests but does not hold, generate, or expose private keys. The customer wallet signs the transaction.

| Boundary | Design |
|---|---|
| Private key access | None. ZeroClaw and ZEGA API never access or store private keys. |
| LLM context | Private keys are never passed to or accessible within the LLM context window. |
| Transaction signing | Performed exclusively by the customer's wallet (Phantom / Solflare). |
| Settlement authority | Deterministic backend verification against Solana on-chain state. |
| Agent capability | Agent constructs unsigned Solana Pay URLs; cannot autonomously sign or transfer funds. |

---

## Security & Trust Boundaries

| Control | Description | Location |
|---|---|---|
| **Risk Profile** | `supervised` profile blacklists `sendai-solana__transfer` and `sendai-solana__sign_transaction` | `docs/zeroclaw/config.toml` |
| **Human Approval** | Refund requests require merchant approval (`checkpoint`, `quorum: 1`) | `docs/zeroclaw/sops/refund-approval/SOP.md` |
| **Prompt Injection** | Regex-based defense-in-depth screening of untrusted payloads (not a complete defense; reduces attack surface as part of a layered approach) | `apps/api/src/utils/settlementValidation.ts` |
| **Replay Protection** | `tx_signature UNIQUE` constraint + `on_conflict=tx_signature` atomic upsert | `supabase/migrations/` |
| **Webhook HMAC** | Timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`) | `apps/api/src/routes/v1/zeroclaw.routes.ts` |
| **RPC Resilience** | Multi-provider pool (Alchemy, Helius, Solana Devnet) with circuit breaker cooldowns | `apps/api/src/services/solanaRpcManager.ts` |
| **Settlement Rule** | LLM output is never authoritative over settlement state; only deterministic RPC verification commits database state | `apps/api/src/services/zeroclawSignatureMonitor.ts` |

> **Note**: The forensic audit report (`docs/ZEROCLAW_FORENSIC_AUDIT.md`) represents an internal self-assessment. It should not be treated as a third-party audit certification. Independent security review is recommended before any production deployment.

---

## Quickstart

### Prerequisites

- **Node.js** `≥ 20` (enforced via `.nvmrc`)
- **pnpm** `≥ 9.0.0` (enforced via `packageManager` in `package.json`)

### Install & Run ZEGA

```bash
git clone https://github.com/siabang35/zega.ai.git
cd ZEGA
pnpm install
cp .env.example .env   # Populate database, RPC, and API keys
pnpm dev               # Starts web (localhost:5173) + API (localhost:3001)
```

### Verify

```bash
pnpm type-check   # TypeScript validation across all monorepo packages
pnpm build        # Production build
pnpm test         # Automated test suite
```

---

## Reproduce the ZeroClaw + Solana Demo

### Step 1: Start ZEGA API

```bash
pnpm dev:api
```

### Step 2: Install and Start ZeroClaw Rust Runtime

```bash
curl -fsSL https://raw.githubusercontent.com/zeroclaw-labs/zeroclaw/master/install.sh | bash
cp docs/zeroclaw/config.toml ~/.zeroclaw/config.toml
zeroclaw agent
```

### Step 3: Connect Telegram Channel

Configure your Telegram bot token in `config.toml` under `[channels.telegram]`.

### Step 4: Send a Merchant Command

Via Telegram (or webhook), send:

> "Charge Table 4, 15 USDC for 2x Espresso"

### Step 5: Pay & Verify

1. Scan the returned Solana Pay QR with Phantom or Solflare.
2. Sign the transaction on Solana Devnet.
3. Wait for the `payment-reconciliation` SOP to detect and verify the settlement.
4. Merchant receives confirmation via channel.

### Development-Only Harness

For offline testing without the Rust binary:

```bash
pnpm zeroclaw:dev-harness   # Starts mock on http://127.0.0.1:4242
```

This is a TypeScript HTTP mock. It does not execute real SOPs, does not load skills, and is not the bounty demonstration path.

> Full step-by-step instructions: [`docs/zeroclaw/REPRODUCIBILITY.md`](docs/zeroclaw/REPRODUCIBILITY.md)

---

## Testing

The repository includes 4 test suites in `apps/api/src/__tests__/`:

| Test File | Coverage Area |
|---|---|
| `payment-verification.test.ts` | Solana Pay amount validation, signature format, USDC mint enforcement |
| `prompt-injection.test.ts` | OWASP-pattern prompt injection detection |
| `settlement-integration.test.ts` | Settlement freshness, replay protection, state machine invariants |
| `vault-settlement.test.ts` | Base58 exhaustive validation, T1 custody invariants, demo mode boundaries |

Run locally:

```bash
pnpm test
```

These are unit and integration tests exercising validation logic, security guards, and database contract invariants. They do not require external RPC connections or a running ZeroClaw instance.

CI executes these tests automatically on push to `master`/`main`/`develop` via `.github/workflows/ci.yml`.

---

## Repository Structure

```text
ZEGA/
├── apps/
│   ├── web/                    # React 18 + Vite + Tailwind CSS Console
│   └── api/                    # Fastify + TypeScript Backend
│       └── src/
│           ├── routes/v1/      # API Routes (auth, zeroclaw, enterprise, umkm, payment, ...)
│           ├── services/       # Solana RPC Manager, Signature Monitor, R2 Storage
│           ├── utils/          # Settlement Validation, OWASP Guards
│           └── __tests__/      # Automated Test Suites
├── packages/
│   ├── zeroclaw-bridge/        # @zega/zeroclaw-bridge — typed gateway client
│   ├── shared/                 # Shared type definitions
│   ├── supabase/               # Database client factory & types
│   └── config/                 # Shared ESLint & TypeScript configs
├── docs/
│   ├── zeroclaw/               # ZeroClaw config, skills, SOPs, guides
│   ├── PRD/                    # Product requirement documents
│   └── *.md                    # Audit reports, hardening reports
├── scripts/                    # ZeroClaw dev harness, verification scripts
├── supabase/migrations/        # Database schema & triggers
└── .github/workflows/ci.yml    # CI pipeline
```

---

## Project Status

| Area | Status | Notes |
|---|---|---|
| ZEGA Platform Monorepo | Active Development | TypeScript 5.x, Fastify, React 18, Supabase RLS |
| ZeroClaw Integration | Reference Implementation | Configured for ZeroClaw v0.8.3 Rust runtime |
| Solana Settlement | Devnet Reference | Reference-key polling on Solana Devnet |
| Automated Tests | Passing | Unit and integration tests across 4 test suites |
| Mainnet Deployment | Planned | Mainnet USDC settlement is a future milestone |
| Enterprise Features | Active Development | Multi-tenant dashboard, CRM, billing modules |

---

## Known Limitations

- **Solana Devnet only**: Settlement verification operates on Devnet. Mainnet deployment requires independent security review and is not currently claimed.
- **Prompt injection defense is defense-in-depth**: Regex-based pattern screening reduces attack surface but is not a complete mitigation against all prompt injection techniques.
- **MCP trust boundary**: Helius and SendAI MCP servers are third-party services; their availability and correctness are outside ZEGA's control.
- **Development harness is not production**: The TypeScript daemon harness simulates ZeroClaw API endpoints but does not execute real SOPs, skills, or provide runtime security guarantees.
- **Self-assessed audit**: The forensic audit report is an internal self-assessment, not a third-party certification.
- **RPC availability**: Settlement verification depends on Solana RPC provider availability and is subject to rate limiting and network conditions.

---

## Documentation

| Topic | Document |
|---|---|
| ZeroClaw Integration Guide | [`docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`](docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) |
| Security Threat Model | [`docs/zeroclaw/SECURITY_THREAT_MODEL.md`](docs/zeroclaw/SECURITY_THREAT_MODEL.md) |
| Agent Operator Guide | [`docs/zeroclaw/AGENT_OPERATOR_GUIDE.md`](docs/zeroclaw/AGENT_OPERATOR_GUIDE.md) |
| ZeroClaw Version Matrix | [`docs/zeroclaw/ZEROCLAW_VERSION.md`](docs/zeroclaw/ZEROCLAW_VERSION.md) |
| Bounty Reproducibility | [`docs/zeroclaw/REPRODUCIBILITY.md`](docs/zeroclaw/REPRODUCIBILITY.md) |
| Self-Assessed Audit | [`docs/ZEROCLAW_FORENSIC_AUDIT.md`](docs/ZEROCLAW_FORENSIC_AUDIT.md) |
| Hardening Report | [`docs/ZEGA_FINAL_HARDENING_REPORT.md`](docs/ZEGA_FINAL_HARDENING_REPORT.md) |
| RPC Failover Spec | [`docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md`](docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md) |
| Bounty Showcase | [`ZEROCLAW_SOLANA_BOUNTY_SHOWCASE.md`](ZEROCLAW_SOLANA_BOUNTY_SHOWCASE.md) |
| Upstream Integration | [`docs/book/src/integrations/zega-ai.md`](docs/book/src/integrations/zega-ai.md) (PR #9806) |

---

## Contributing

Contributions are welcome.

1. Fork and create a feature branch.
2. Ensure `pnpm type-check` and `pnpm test` pass.
3. Open a Pull Request with a clear description.

---

## License

Licensed under [AGPL-3.0](LICENSE).
Copyright © 2026 ZEGA AI.