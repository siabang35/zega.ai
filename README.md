# ZEGA AI — Enterprise Autonomous Agent Orchestration Monorepo

![ZEGA AI Banner](https://img.shields.io/badge/ZEGA.AI-Enterprise%20Monorepo-ff6b35?style=for-the-badge)
![Production Domain](https://img.shields.io/badge/Production-zegaai.site-059669?style=for-the-badge&logo=vercel)
![Cloudflare CDN](https://img.shields.io/badge/CDN-cdn.zegaai.site-F38020?style=for-the-badge&logo=cloudflare)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Solana](https://img.shields.io/badge/Blockchain-Solana%20Devnet-14F195?style=for-the-badge&logo=solana)
![Fastify](https://img.shields.io/badge/API-Fastify-000000?style=for-the-badge&logo=fastify)
![pnpm](https://img.shields.io/badge/pnpm-9.x-orange?style=for-the-badge&logo=pnpm)
![Turborepo](https://img.shields.io/badge/Turborepo-2.x-red?style=for-the-badge&logo=turborepo)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)

**ZEGA AI** ([zegaai.site](https://zegaai.site)) is an enterprise-grade monorepo designed for autonomous agent orchestration, high-performance workflow automation, real-time telemetry analytics, and backend microservices powered by **Fastify**, **Supabase PostgreSQL**, **Cloudflare R2 CDN**, **Cloudflare Turnstile**, and **Brevo SMTP Relay**.

---

## 🏗️ Monorepo Architecture Overview

The repository is organized as a high-performance **pnpm + Turborepo monorepo** built for enterprise scale, code reusability, and modular separation of concerns:

```
ZEGA/
├── apps/
│   ├── web/               # Frontend Web Console (React 18 + Vite + Tailwind CSS)
│   └── api/               # Backend Microservices Engine (Fastify + TypeScript)
├── packages/
│   ├── config/            # Shared ESLint, TypeScript & Tooling Configurations
│   ├── shared/            # Shared Types, DTO Interfaces & Utility Libraries
│   ├── supabase/          # Supabase Client Factory & Master Database Types
│   └── zeroclaw-bridge/   # Standalone Production ZeroClaw v0.8.3 Runtime Bridge Client (@zega/zeroclaw-bridge)
├── supabase/              # SQL Migrations (20260729000001), RLS Policies & Triggers
├── docs/                  # Enterprise Product & Architecture Specs (PRD 01-16)
│   └── PRD/               # Comprehensive System Architecture Documents
├── vercel.json            # Vercel Deployment & Route Rewrites Configuration
├── turbo.json             # Turborepo Build & Task Cache Pipeline
├── pnpm-workspace.yaml    # Workspace Monorepo Package Topology
└── README.md              # Project Master Documentation
```

---

## ✨ Key Implemented Architecture Features

### 1. 🔒 100% Strict Privy Authentication & Demo Mode Purge
- **Purged Guest Demo Mode**: All Guest Demo login buttons, Guest Banners, and fallback sessions have been completely removed from `AuthModal`, `EnterpriseDashboard`, `UserDashboard`, and `ZeroClawTerminalView`.
- **Pure Privy Session Binding**: Every user session is strictly authenticated via Google OAuth, GitHub OAuth, or Brevo Email OTP Passcode, deterministically binding 1 user email to 1 non-custodial Solana Embedded Wallet (`PrivyWalletService`).
- **Standalone Solana Pay Public Checkout (`/checkout/:id`)**: Public checkout URLs run on isolated standalone routes to prevent modal race conditions, supporting native single-swipe deep-linking for mobile wallets like Solflare and Phantom.
- **Presets as Strict Input Fillers**: Quick Presets act strictly as UI input fillers, populating invoice amounts and messages for manual user review without auto-generating database records.

### 2. 🎛️ Role-Based Workspaces & Dynamic Dashboards
- **SuperAdmin Console (`SuperAdminDashboard.tsx`)**: Global tenant management, security policy enforcement, real-time audit trail logs, and instant role switching.
- **Enterprise & User Workspace (`UserDashboard.tsx`)**:
  - **AI Sandbox Console (`AiSandboxConsole.tsx`)**: Interactive playground for **ZEGA-Omni 4.5**, **Claude 3.5 Sonnet**, and **GPT-4o**.
  - **Collapsible Accordion Navigation**: Enterprise sidebar organized into smooth, collapsible categories (`MAIN MENU`, `ANALYTICS`, `PLATFORM`, `DEVELOPER PORTAL`, `GOVERNANCE`) with active tab expansion.
  - **Mobile Responsive Drawer & Bottom Bar**: Slide-out backdrop-blurred sidebar drawer and 1-tap fixed bottom navigation bar (`Overview`, `Swarms`, `ZeroClaw`, `Dev Portal`, `Menu`) across Enterprise and UMKM dashboards.

### 3. 🏛️ Enterprise Governance & Developer Suite
- **Organizations Module (`OrganizationView.tsx`)**: All Organizations list with active/pending status filter, selected organization detail card (Acme Enterprise), 4 usage progress bars, and owner profile (**Danz Assyidq**, `danz@acme.com`).
- **Team & Roles Module (`TeamRolesView.tsx`)**: Member roster table with **Danz Assyidq** as `Enterprise Admin`, role count cards, and permission matrix.
- **Settings Module (`SettingsView.tsx`)**: 8-section navigation panel, organization profile editor, regional settings (`(GMT+7) Asia/Jakarta`), Security Status audit card, and recent activity audit log.
- **Developer Suite & Official Domain**: Developer Portal, API & SDK playground, Webhooks manager, and System Logs with real-time streaming — all standardized to the official `zegaai.site` production domain.

### 4. 🎨 Corporate Design System & Visual Polish
- **Flat 1px Border Standard**: Enforced `border-slate-200` in Light Mode and `border-slate-800` in Dark Mode across all components.
- **Official ZEGA AI Logo Display**: High-resolution `zegalogo.png` header branding with dark mode filter inversion.
- **Theme-Safe Emerald WhatsApp CS Bot**: High-contrast, theme-safe Emerald status badges (`text-emerald-700 dark:text-emerald-300`, `bg-emerald-50 dark:bg-emerald-950/60`, `border-emerald-200 dark:border-emerald-800`).

### 5. 🛡️ Privy Keyless Solana Embedded Wallet & Enterprise OWASP Security Engine
- **Privy Official Cloud REST API Synchronization (`/v1/auth/privy-sync`)**: Automated backend registration route directly syncing user accounts to the official Privy Cloud Infrastructure (`dashboard.privy.io`) with server-side authentication (`PRIVY_APP_ID` & `PRIVY_APP_SECRET`). Generates unique Privy DIDs (`did:privy:...`) for UMKM, Enterprise, and SuperAdmin users.
- **Authentic 1-to-1 Base58 Solana Public Key Derivation (`PrivyWalletService`)**: Cryptographically sound 32-byte SHA-256 expansion and Base58 encoder generating valid 44-character Solana Public Keys (e.g. `9ohi99xP3rtzk3kBe7Cbm1W65mBF5DMyVuXxat8ytYes`). 100% compatible with Solana Pay URIs (`solana:<address>?amount=15.00`), Phantom, Solflare, and Web3 SDKs.
- **Official Privy Branding (`AuthModal`)**: Official `Protected by` Privy logo badge rendered via Cloudflare R2 CDN (`https://cdn.zegaai.site/assets/logo/privy-logo.png`) adhering to official Privy UI/UX standards.
- **OWASP Enterprise Anti-Hacking Suite**:
  - **Anti-Throttling**: 60-second cooldown timer enforcing rate limiting per IP address on authentication and Privy sync endpoints.
  - **Anti-Chunking & Payload Validation**: Max 256-byte payload length cap and Fastify 1MB payload size validator blocking buffer overflow & DoS attacks.
  - **Bot Defense**: Integrated Cloudflare Turnstile CAPTCHA protection on all authentication flows.
  - **CSRF & PKCE Defense**: 64-hex CSRF state token generation and PKCE S256 code challenge verification for Google and GitHub OAuth.
  - **Prompt Injection Defense**: Automated ZeroClaw SOP approval checkpoints (`zeroclaw_sop_checkpoints`) blocking malicious payment override prompts.

### 6. 🦀 ZeroClaw v0.8.3 Real Gateway Protocol & Standalone Bridge Client (@zega/zeroclaw-bridge)
- **Standalone Production Bridge Package (`@zega/zeroclaw-bridge`)**: Standalone TypeScript package (`packages/zeroclaw-bridge/`) implementing `ZeroClawGatewayClient` with `AbortController` (1500ms timeout), exponential backoff, and zero-crash fallback to Autonomous Mode.
- **Strict SemVer Version Compatibility Matrix (`src/version.ts`)**: Automatic runtime compatibility validation enforcing version range `>=0.8.0 <0.9.0-alpha` (target version `v0.8.3`).
- **One-Time Pairing Code Flow (`POST /v1/zeroclaw/pair`)**: Supports `X-Pairing-Code` header pairing (e.g. `137170`) directly via ZeroClaw Terminal UI, storing active Bearer tokens (`zc_a6f6...`) in browser `localStorage`.
- **Daemon Health Check (`GET /health`)**: Automatic 1.2s timeout ping checking daemon PID and component health without blocking backend startup or causing crashes.
- **Webhook Prompt Forwarding (`POST /webhook`)**: Prompts executed in ZeroClaw Terminal are forwarded to `http://127.0.0.1:4242/webhook` (`{"message": prompt}`).
- **Multi-LLM Tiered Provider Engine**: Supports **ZeroClaw Gateway v0.8.3**, **Groq (`llama-3.3-70b-versatile`)**, **Google Gemini (`gemini-1.5-flash`)**, **OpenRouter**, **HuggingFace**, **Jatevo AI**, and **9Router Swarm** with automatic failover chain.
- **Keyless Tier 1 Custody**: Zero private keys stored server-side. Mobile & browser wallets (Phantom, Solflare, Privy) sign transactions client-side.
- **Cryptographic Solana Pay Reference Key Tracking**: Every generated Solana Pay URI automatically attaches a unique reference key (`&reference=RefXXXXXXX`) to ensure 1-to-1 on-chain transaction tracking.
- **Production Vercel + Render Real-Time Solana Reconciliation & ZeroClaw Signature Monitor (`ZeroClawSignatureMonitorService`)**: Real-time background signature scanner executing direct Solana Devnet RPC queries over forced IPv4 sockets (`family: 4`) with zero-polling latency, dynamic Associated Token Account (ATA) derivation (`getTokenAccountsByOwner`), and 100% automated on-chain signature verification.
- **5-Layer Backend Validation Pipeline & OWASP Top 10 Anti-Hacking Hardening**: Hardened Fastify backend routes (`/v1/zeroclaw/settlement/check-payment`) with 5 security validation layers:
  1. **OWASP API3 Base58 Input Sanitization**: Rejection of malformed Base58 reference keys and pubkeys (`/^[1-9A-HJ-NP-Za-km-z]{32,88}$/`), blocking SQLi and XSS payloads.
  2. **OWASP API8 Anti-Replay Signature Guard**: Automatic database lookup in `zeroclaw_solana_settlements` to prevent processing the same transaction signature for multiple invoices.
  3. **OWASP API4 Anti-Throttling & Anti-DDoS**: 100 req/min rate limiting per IP and 1MB payload size cap.
  4. **OWASP API1 On-Chain Proof Verification**: Direct RPC validation enforcing `err === null` and `confirmationStatus: 'confirmed' | 'finalized'`.
  5. **OWASP API9 Secure Error Masking**: Sanitized API error outputs and structured security audit logging.
- **Detailed Specification**: Complete architecture documented in [`docs/PRD/26-PRODUCTION-RECONCILIATION-AND-OWASP-SECURITY-SPEC.md`](docs/PRD/26-PRODUCTION-RECONCILIATION-AND-OWASP-SECURITY-SPEC.md), [`docs/PRD/27-ZEROCLAW-SOLANA-BOUNTY-PRODUCTION-SUITE-SPEC.md`](docs/PRD/27-ZEROCLAW-SOLANA-BOUNTY-PRODUCTION-SUITE-SPEC.md), [`docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md`](docs/PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md), [`docs/ARCHITECTURE_ZEROCLAW_PRIVY_REALTIME.md`](docs/ARCHITECTURE_ZEROCLAW_PRIVY_REALTIME.md), [`docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`](docs/zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md), [`docs/zeroclaw/AGENT_OPERATOR_GUIDE.md`](docs/zeroclaw/AGENT_OPERATOR_GUIDE.md), [`docs/zeroclaw/SECURITY_THREAT_MODEL.md`](docs/zeroclaw/SECURITY_THREAT_MODEL.md), [`docs/PRD/19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md`](docs/PRD/19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md), [`docs/PRD/22-ZEROCLAW-SOLANA-MULTI-LLM-AGENT-SPEC.md`](docs/PRD/22-ZEROCLAW-SOLANA-MULTI-LLM-AGENT-SPEC.md), and User Guides [`docs/PRD/23-ZEROCLAW-TERMINAL-USER-GUIDE.md`](docs/PRD/23-ZEROCLAW-TERMINAL-USER-GUIDE.md) / [`docs/PRD/24-ZEROCLAW-TERMINAL-PANDUAN-PENGGUNA-ID.md`](docs/PRD/24-ZEROCLAW-TERMINAL-PANDUAN-PENGGUNA-ID.md).

### 7. 🚀 Enterprise Solana RPC Failover Manager (`SolanaRpcManager`)
- **Multi-Provider Failover Pool**: Orchestrates dynamic RPC routing across Alchemy Devnet, Helius Devnet, and Official Solana Devnet configured via `.env` variables (`SOLANA_RPC_PRIMARY`, `SOLANA_RPC_SECONDARY`, `SOLANA_RPC_TERTIARY`, `SOLANA_RPC_OFFICIAL`).
- **Circuit Breaker Cooldowns**: Exponential isolation timers (30s → 60s → 120s) for degraded or rate-limited providers, eliminating HTTP 429 retry storms.
- **Token Bucket Rate Limiting**: Per-provider RPS caps protecting node quota limits.
- **In-Flight Request Deduplication**: Promise coalescing for parallel identical requests (reducing network call volume by up to 90%).
- **OWASP Hardened Security**: Base58 zero-width space unicode sanitization and strict JSON-RPC method whitelisting.
- **Socket-Level Resilience**: Forced IPv4 DNS resolution (`family: 4`) preventing node-fetch DNS timeouts.
- **Live Status Telemetry**: Endpoint `/v1/zeroclaw/rpc-pool/status` reporting live provider health scores, active cooldowns, average latency, and in-flight request counts.

### 7. 🏆 Superteam Solana ZeroClaw Bounty Full Production Suite
- **Directory-Based SOP Engine (`docs/zeroclaw/sops/`)**: 4 production SOPs (`payment-reconciliation`, `refund-approval`, `defi-guardian`, `balance-alert`) featuring `SOP.toml` + `SOP.md` structure, cron scheduling, and human approval checkpoints (`kind: checkpoint`).
- **ZeroClaw Skills System (`docs/zeroclaw/skills/`)**: 4 skills (`solana-pay`, `defi-guardian`, `merchant-memory`, `solana-blinks`) with frontmatter metadata, concise output rules (<200 tokens), and token mint safety boundaries.
- **Model Context Protocol (MCP) Client (`/v1/zeroclaw/mcp/*`)**: Integrated proxy routing across **Helius DAS MCP** (12 tools for Solana RPC/compressed NFTs) and **SendAI Solana MCP** (60+ Solana actions).
- **Relationship Memory Knowledge Graph (`/v1/zeroclaw/memory/action`)**: CRM knowledge graph with 8 node types and 8 edge relation types, backed by in-memory graph engine and Supabase PostgreSQL persistence (`zeroclaw_memory_nodes`, `zeroclaw_memory_edges`).
- **HMAC-SHA256 Webhook Verification (`/v1/zeroclaw/webhook/inbound`)**: Upstream-aligned inbound webhook ingress verifying cryptographic `X-Webhook-Signature: sha256=<hash>` headers.
- **Blinks & Solana Actions (`/v1/zeroclaw/actions/*`)**: Native Solana Actions GET preview card renderer & POST transaction builder with shareable `dial.to` Blink link generator.
- **DeFi Financial Guardian (`/v1/zeroclaw/defi/*`)**: Real-time token price checks via Jupiter Price V2 API & Switchboard Crossbar fallback with customizable percentage threshold alerts and wallet portfolio tracking.
- **Operator Reproducibility**: Complete single-evening setup instructions documented in [`docs/zeroclaw/AGENT_OPERATOR_GUIDE.md`](docs/zeroclaw/AGENT_OPERATOR_GUIDE.md).

### 8. 🛡️ Zero-Trust On-Chain Anti-Fraud Pipeline & High-Concurrency Resilient Queue
- **5-Layer On-Chain Anti-Fraud Pipeline**: Enforces 87-88 Base58 signature format verification, zero-amount transfer rejection (`ZERO_AMOUNT_CHECK`), and strict merchant/reference key matching (`RECIPIENT_MATCH_FAIL`). Synthetic signature IDs or zero-transfer transactions are rejected with HTTP 403.
- **Indonesian Comma Decimal Normalization**: Automatically converts `,` to `.` (`0,32` -> `0.32 USDC`) across prompt parsing, `/generate-qr`, `/invoice`, and webhooks, with 6-decimal precision and SPL token micro-unit scaling.
- **Single-Flight Messaging Lock & Exponential Backoff Queue**: Eliminates Telegram `HTTP 409 Conflict: terminated by other getUpdates request` via single-flight promise locks, and handles Telegram `HTTP 429` rate limits with 3-attempt exponential backoff retry (1s, 2s, 4s).
- **Solana Pay Reference Key Concurrency Indexing**: Dynamically appends unique single-use `reference_key` accounts to Solana Pay URIs, allowing thousands of concurrent same-amount payments (e.g. 10 users sending 1.00 USDC at the exact same millisecond) without misattribution.

### 7. 🛡️ Multi-Tenant Realtime SQL Migrations & Cloudflare R2 CDN Audit Certificates
- **Cloudflare R2 CDN Cryptographic Audit Certificates (`R2StorageService`)**:
  - Automatically generates and uploads SHA-256 hashed JSON audit certificates (`https://cdn.zegaai.site/privy-audits/{email}/{timestamp}-audit.json`) to Cloudflare R2 bucket `zega-ai` upon every user sync or ZeroClaw settlement.
  - Serves public CDN audit proofs with 1-year edge cache control (`public, max-age=31536000, immutable`).
- **Master Enterprise Supabase SQL Migration Suite**:
  - `20260801000000_zeroclaw_privy_embedded_wallet.sql`: Settlement table Privy columns (`privy_wallet_address`, `privy_user_id`, `privy_verified`).
  - `20260801000100_zeroclaw_privy_wallets_table.sql`: Primary table `public.privy_wallets` with atomic RPC `upsert_privy_wallet` and RLS.
  - `20260801000200_zeroclaw_social_oauth_accounts.sql`: Table `public.social_oauth_accounts` for Google/GitHub OAuth profile persistence with atomic RPC `upsert_social_oauth_account`.
  - `20260801000300_zeroclaw_privy_enterprise_r2_sync.sql`: Table `public.privy_r2_audit_certificates`, atomic RPC `record_privy_r2_audit_certificate`, RLS policies, and Realtime WebSocket publication (`supabase_realtime`).
  - `supabase/migrations/sql_umkm/` (`20260731000000_master_umkm_realtime_schema.sql`): Store-level RLS, Token Bucket rate limiter (300 cap), real-time order streams.
  - `supabase/migrations/sql_enterprise/` (`20260731000100_master_enterprise_realtime_schema.sql`): Multi-tenant RBAC (`owner`, `admin`, `secops`, `finops`), Token Bucket rate limiter (300 cap), OWASP 1MB anti-chunking payload size validator, audit trail triggers.
  - `supabase/migrations/sql_superadmin/` (`20260731000200_master_superadmin_realtime_schema.sql`): Privileged root security guard `fn_is_superadmin_root()`, Token Bucket rate limiter (500 cap), OWASP Sentinel 2MB anti-chunking payload validator, platform telemetry KPIs ($485k MRR), root account audit triggers.
- **Supabase Realtime Channel Subscriptions**: `SupabaseDashboardService` (`supabaseService.ts`) streaming WebSocket update events across UMKM, Enterprise, and SuperAdmin dashboard containers.

### 9. 🤖 Enterprise ZEGA Copilot AI Assistant, 2026 Flagship Models & 9Router Layer 5 Engine
- **2026 Flagship LLM Engine Suite**:
  - **Groq Llama 3.3 70B**: Primary ultra-fast versatile model (<300ms latency).
  - **DeepSeek V4 / V3**: Analytical reasoning engine served via HuggingFace Inference Endpoints & OpenRouter.
  - **Google Gemini 3.6 Flash**: Multimodal AI engine powering real-time context & schedule processing.
- **9Router Layer 5 Model Router Engine**:
  - Multi-LLM load balance and cost optimization hub listening on `http://localhost:20128/v1/chat/completions`.
  - Automatic fallback to native swarm consensus if local daemon is unreachable.
- **5-Layer OWASP LLM Top 10 Security Architecture (`POST /v1/umkm/copilot/chat`)**:
  1. Input sanitization & 2,048-character length capping.
  2. IP-based rate limiting (100 req/min).
  3. Target E.164 / Telegram recipient validation gate.
  4. Prompt injection & system prompt override guard.
  5. Secret redaction (`[REDACTED_SECRET]`) masking API keys.
- **Zero-Trust Mandatory User Authentication**:
  - All dashboard and terminal features require verified email login (`App.tsx` zero-trust route guard). Guest sessions are completely isolated and blocked from accessing financial/agent tools.
- **Detailed Specification**: Complete architecture documented in [`docs/PRD/32-ZEGA-COPILOT-ENTERPRISE-SECURITY-AND-MULTI-LLM-SPEC.md`](docs/PRD/32-ZEGA-COPILOT-ENTERPRISE-SECURITY-AND-MULTI-LLM-SPEC.md) and [`docs/PRD/33-ZEGA-2026-FLAGSHIP-AI-MODELS-AND-SECURITY-SPEC.md`](docs/PRD/33-ZEGA-2026-FLAGSHIP-AI-MODELS-AND-SECURITY-SPEC.md).

---

## ⚡ Quick Start & Development Workflow

### Prerequisites
- **Node.js**: `>=20.0.0`
- **pnpm**: `>=9.0.0`

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/siabang35/zega.ai.git
cd ZEGA

# 2. Install workspace dependencies
pnpm install

# 3. Copy environment configuration
cp .env.example .env

# 4. (Optional) Run 9Router Local Daemon
npm install -g 9router
9router

# 5. Start frontend and backend concurrently
pnpm dev
```

The web application runs locally at `http://localhost:5173` and the Fastify API server at `http://localhost:3001`.

### Workspace Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start `apps/web` and `apps/api` concurrently in development mode |
| `pnpm dev:web` | Run only the React web frontend application |
| `pnpm dev:api` | Run only the Fastify API backend service |
| `pnpm build` | Build all workspaces using Turborepo pipeline |
| `pnpm type-check` | Execute TypeScript verification across all packages |
| `pnpm lint` | Run ESLint across apps and shared packages |

---

## 📄 Comprehensive Documentation

Product Requirement Documents (PRD) are organized in `/docs/PRD`:
- [01. Executive Summary](docs/PRD/01-EXECUTIVE-SUMMARY.md)
- [02. System Architecture](docs/PRD/02-SYSTEM-ARCHITECTURE.md)
- [12. Implemented Features & Status](docs/PRD/12-IMPLEMENTED-FEATURES-STATUS.md)
- [13. Enterprise Security & CDN Hardening](docs/PRD/13-ENTERPRISE-SECURITY-CDN-SUPABASE-HARDENING.md)
- [16. Authentication, Sessions & UI/UX Specs](docs/PRD/16-AUTHENTICATION-SESSION-HARDENING-AND-UX-SPEC.md)
- [18. Modular Enterprise Dashboard & Role Routing](docs/PRD/18-MODULAR-ENTERPRISE-DASHBOARD-ROLE-ROUTING-SPEC.md)
- [19. ZeroClaw Solana Agent Integration](docs/PRD/19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md)
- [20. High-Fidelity Dashboard Redesign & Governance](docs/PRD/20-HIGH-FIDELITY-DASHBOARD-REDESIGN-AND-GOVERNANCE-SPEC.md)
- [21. SQL Migrations, CDN R2 & Realtime Specification](docs/PRD/21-ENTERPRISE-SQL-MIGRATION-CDN-R2-SUPABASE-REALTIME-SPEC.md)
- [22. ZeroClaw Solana Multi-LLM Agent Specification](docs/PRD/22-ZEROCLAW-SOLANA-MULTI-LLM-AGENT-SPEC.md)
- [23. ZeroClaw Terminal User Guide (English)](docs/PRD/23-ZEROCLAW-TERMINAL-USER-GUIDE.md)
- [24. ZeroClaw Terminal Panduan Pengguna (Bahasa Indonesia)](docs/PRD/24-ZEROCLAW-TERMINAL-PANDUAN-PENGGUNA-ID.md)
- [32. ZEGA Copilot Enterprise Security & Multi-LLM Specification](docs/PRD/32-ZEGA-COPILOT-ENTERPRISE-SECURITY-AND-MULTI-LLM-SPEC.md)
- [33. 2026 Flagship AI Models, 9Router Swarm & OWASP Security Specification](docs/PRD/33-ZEGA-2026-FLAGSHIP-AI-MODELS-AND-SECURITY-SPEC.md)
- [34. ZEGA AI 6-Layer Enterprise Swarm Architecture Specification](docs/PRD/34-ZEGA-AI-6-LAYER-SWARM-ARCHITECTURE-SPEC.md)

---

## 📄 License

Copyright © 2026 **ZEGA AI** ([zegaai.site](https://zegaai.site)). All rights reserved.