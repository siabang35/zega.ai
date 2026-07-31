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
│   └── supabase/          # Supabase Client Factory & Master Database Types
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

### 1. 🔐 Multi-Tenant Authentication & Session Management
- **Dual-Segment Onboarding (`AuthModal`)**: Dedicated workflows for Individual/UMKM developers and Enterprise organization accounts.
- **Transactional Brevo OTP Email Gateway**: 6-digit cryptographic verification passcodes via Brevo API v3 (`SMTP_BREVO`), backed by SHA-256 OTP hashing and 5-minute expiration window.
- **Cloudflare Turnstile Bot Defense**: Protection against automated scraping and bot requests on `/v1/auth/request-otp`.
- **Strict Session Clearance & Route Guarding**: Sign Out clears session keys (`zega_mock_session`), cookies, and cache with safe fall-through redirects to `/`. Accessing `/console` when logged out prompts users via `AuthModal`.
- **Guest Demo Mode**: 1-Click interactive Guest Demo mode for potential clients (`Guest Explorer` and `Acme Enterprise Guest`) with non-intrusive notification banner.

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

### 5. 🦀 ZeroClaw Solana-Native Multi-LLM Agent Runtime (SuperteamBR Bounty)
- **Multi-LLM Tiered Provider Engine**: Supports **Groq (`llama-3.3-70b-versatile`)**, **Google Gemini (`gemini-1.5-flash`)**, **OpenRouter**, **HuggingFace**, **Jatevo AI**, and **9Router Swarm** with automatic failover chain.
- **Keyless Tier 1 Custody**: Zero private keys stored server-side. Mobile & browser wallets (Phantom, Solflare) sign transactions client-side.
- **Dedicated Keyless Embedded Wallet per Account**: Deterministic keyless wallet derivation (`deriveEmbeddedWallet`) assigns private Solana receiver addresses (e.g. `4zMMC7x...`) to authenticated users, separating them from public demo receivers (`7xKX...`).
- **Authenticated Dashboard Isolation**: Authenticated UMKM and Enterprise sessions purge all guest banners and fallbacks (`Guest Store`, `Guest Enterprise (Demo)`, `GUEST-1283`). Close `X` header buttons are hidden to enforce formal **Sign Out** flow.
- **Valid Solana Pay Spec & High-Res QR Code**: Generates fully compliant Base58 Solana Pay URIs (`solana:<activeMerchantWallet>?amount=15.00&spl-token=4zMMC9...`) and scannable high-resolution QR codes (`api.qrserver.com`).
- **Real-Time QRIS Auto-Reconciliation**: Automatic Solana Devnet RPC listener stream (<2s confirmation) with instant cashier success pop-up modal (`paymentSuccessModal`) without requiring manual cashier approval.
- **OWASP Prompt Injection Defense**: Real-time regex scanner blocks malicious payout override prompts (`injectionDetected = true`) and routes them to SOP Human Approval Checkpoints (`chk_auto_*`).
- **Cloudflare R2 CDN Logo Delivery**: All AI model logos served via `getR2CdnUrl(...)` from `https://cdn.zegaai.site/assets/logo/` with fallback resilience.
- **Detailed Specification**: Complete architecture documented in [`docs/PRD/22-ZEROCLAW-SOLANA-MULTI-LLM-AGENT-SPEC.md`](docs/PRD/22-ZEROCLAW-SOLANA-MULTI-LLM-AGENT-SPEC.md) and User Guides [`docs/PRD/23-ZEROCLAW-TERMINAL-USER-GUIDE.md`](docs/PRD/23-ZEROCLAW-TERMINAL-USER-GUIDE.md) / [`docs/PRD/24-ZEROCLAW-TERMINAL-PANDUAN-PENGGUNA-ID.md`](docs/PRD/24-ZEROCLAW-TERMINAL-PANDUAN-PENGGUNA-ID.md).


### 5. 🦀 ZeroClaw Solana-Native Multi-LLM Agent Engine & Keyless Embedded Wallet
- **Multi-LLM Tiered Failover**: Automatic failover across 6 LLM providers (Groq Llama-3.3-70B, Gemini 1.5 Flash, OpenRouter, Jatevo, 9Router Swarm, HuggingFace) with sub-300ms execution times.
- **Deterministic Keyless Embedded Wallet**: Automatically derives unique, private Solana merchant addresses (`4zMMC7x9...`) for authenticated users under Tier 1 Keyless Custody.
- **Privy SDK Integration Compatibility**: Ready for optional Privy (`@privy-io/react-auth` / `@privy-io/solana-provider`) non-custodial user signer integration.
- **Dashboard Refresh Route Persistence**: Automatically restores active dashboard routes (`/console`, `/dashboard`, `/admin`) for authenticated accounts on page refresh.

### 6. 🛡️ Multi-Tenant Realtime SQL Migrations & Cloudflare R2 CDN Integration
- **Modular Database Migration Suites**:
  - `supabase/migrations/sql_umkm/` (`20260731000000_master_umkm_realtime_schema.sql`): Store-level RLS, Token Bucket rate limiter (300 cap), real-time order streams.
  - `supabase/migrations/sql_enterprise/` (`20260731000100_master_enterprise_realtime_schema.sql`): Multi-tenant RBAC (`owner`, `admin`, `secops`, `finops`), Token Bucket rate limiter (300 cap), OWASP 1MB anti-chunking payload size validator, audit trail triggers.
  - `supabase/migrations/sql_superadmin/` (`20260731000200_master_superadmin_realtime_schema.sql`): Privileged root security guard `fn_is_superadmin_root()`, Token Bucket rate limiter (500 cap), OWASP Sentinel 2MB anti-chunking payload validator, platform telemetry KPIs ($485k MRR), root account audit triggers.
- **Cloudflare R2 CDN Asset Resolver (`https://cdn.zegaai.site`)**: Standardized asset path resolution (`getR2CdnUrl`) across landing page, marketplace, MCP hub, store views, and payment gateways.
- **Supabase Realtime Channel Subscriptions**: `SupabaseDashboardService` (`supabaseService.ts`) streaming WebSocket update events across UMKM, Enterprise, and SuperAdmin dashboard containers.

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

# 4. Start frontend and backend concurrently
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

---

## 📄 License

Copyright © 2026 **ZEGA AI** ([zegaai.site](https://zegaai.site)). All rights reserved.