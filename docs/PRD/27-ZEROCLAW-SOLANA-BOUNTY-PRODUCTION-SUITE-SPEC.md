# PRD 27 — ZeroClaw Solana Bounty Production Suite Specification

## Executive Summary

This document specifies the complete, production-ready integration of the **ZeroClaw v0.8.3 self-hosted Rust AI Agent runtime** into the **ZEGA AI Platform** to meet and exceed all requirements for the **Superteam Solana ZeroClaw Bounty**.

By bridging ZEGA AI's enterprise microservices engine (Fastify + Supabase + React) with ZeroClaw's upstream runtime capabilities, ZEGA AI delivers a secure, reproducible, self-hosted merchant terminal and financial guardian powered by Solana.

---

## Technical Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │        Inbound Channels & Triggers           │
                        │  (WhatsApp, Telegram, Webhook + HMAC-256)   │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │      ZEGA Fastify API Gateway (/v1/zeroclaw) │
                        │   - HMAC-SHA256 Signature Verification   │
                        │   - Fastify 1MB Anti-Chunking Guard      │
                        │   - 100 req/min Anti-Throttling Limiter  │
                        └──────────────────────┬───────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │                                             │
                        ▼                                             ▼
       ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
       │   ZeroClaw Daemon (v0.8.3 Rust)   │           │     Solana Devnet RPC Nodes     │
       │   - SOP Engine (SOP.toml/SOP.md)    │           │   - Helius DAS API / MCP SSE    │
       │   - Skills Engine (SKILL.md)     │           │   - SendAI Solana MCP           │
       │   - Relationship Memory Graph   │           │   - Jupiter Price V2 / Switchboard│
       │   - Risk Profiles & Checkpoints │           │   - Solana Actions & Blinks       │
       └────────────────┬────────────────┘           └────────────────┬────────────────┘
                        │                                             │
                        └──────────────────────┬──────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │        Supabase PostgreSQL + RLS             │
                        │  (zeroclaw_memory_nodes, zeroclaw_sop_runs,  │
                        │   zeroclaw_defi_alerts, zeroclaw_settlements)│
                        └──────────────────────────────────────────────┘
```

---

## Upstream ZeroClaw Feature Coverage

| Upstream Feature | ZEGA AI Integration Strategy | Configuration & File Location | Route / Endpoint |
|:---|:---|:---|:---|
| **SOP Engine** | Multi-step deterministic workflows with human approval gates | `docs/zeroclaw/sops/*/{SOP.toml,SOP.md}` | `GET/POST /v1/zeroclaw/sop/*` |
| **Skills Framework** | Modular tool declarations with strict output formatting | `docs/zeroclaw/skills/*/{SKILL.md}` | Invoked in agent context |
| **MCP Client** | Helius DAS (12 tools) + SendAI Solana (60 tools) proxy | `docs/zeroclaw/config.toml [mcp]` | `GET/POST /v1/zeroclaw/mcp/*` |
| **Relationship Memory** | In-memory graph + Supabase persistence (7 actions) | `docs/zeroclaw/config.toml [knowledge]` | `POST /v1/zeroclaw/memory/action` |
| **Webhook HMAC** | Cryptographic signature verification on ingress | `docs/zeroclaw/config.toml [channels.webhook]` | `POST /v1/zeroclaw/webhook/inbound` |
| **Blinks / Solana Actions**| GET preview card + POST unsigned tx builder | `solana-blinks` skill + API builder | `GET/POST /v1/zeroclaw/actions/*` |
| **DeFi Guardian** | Price monitoring via Jupiter V2 + Switchboard fallback | `defi-guardian` SOP + skill + routes | `GET/POST /v1/zeroclaw/defi/*` |
| **Tier 1 Keyless Custody**| Agent constructs transactions/URLs; human signs | `docs/zeroclaw/config.toml [agent]` | All payment endpoints |

---

## Detailed Component Specifications

### 1. SOP Engine (4 Production SOPs)
- **Directory Structure**: Every SOP uses the upstream-compliant directory format (`<name>/SOP.toml` + `<name>/SOP.md`).
- **`payment-reconciliation`**: 6-step polling and on-chain signature verification using Helius DAS / Solana RPC.
- **`refund-approval`**: 5-step workflow screening prompt injection and pausing at `kind: checkpoint` human gate.
- **`defi-guardian`**: 5-step cron SOP checking token prices against user-defined threshold percentages.
- **`balance-alert`**: 4-step cron SOP warning merchants when SOL/USDC balances drop below minimum operational limits.

### 2. Relationship Memory Knowledge Graph
- **Node Types**: `client`, `contact`, `interaction`, `pattern`, `decision`, `lesson`, `expert`, `technology`.
- **Relations**: `uses`, `replaces`, `extends`, `authored_by`, `applies_to`, `manages_client`, `contact_of`, `interacted_with`.
- **Database Tables**: Persisted to Supabase PostgreSQL `zeroclaw_memory_nodes` and `zeroclaw_memory_edges` with user-isolated RLS.

### 3. Security Threat Model & Custody Tier
- **Custody Model**: Tier 1 (Keyless / Unsigned). Zero private keys are held by the agent daemon or ZEGA backend.
- **Prompt Injection Defense**: Automated regex scanning flags malicious prompts (e.g. override requests, unauthorized transfers) and routes them to a pending SOP checkpoint.
- **HMAC Verification**: Inbound webhooks enforce `X-Webhook-Signature: sha256=<HMAC-SHA256>` calculated using `ZEROCLAW_WEBHOOK_SECRET`.

---

## Verification & Compliance

- **Smoke Suite**: Passed 18/18 test assertions (`@zega/zeroclaw-bridge`).
- **API Parity**: 100% route availability verified via live curl tests on port 3001.
- **Operator Reproducibility**: Documented in `docs/zeroclaw/AGENT_OPERATOR_GUIDE.md` (~15 min setup time).
