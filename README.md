# ZEGA AI — Enterprise Autonomous Agent Orchestration Monorepo

![ZEGA AI Banner](https://img.shields.io/badge/ZEGA.AI-Enterprise%20Monorepo-ff6b35?style=for-the-badge)
![Production Domain](https://img.shields.io/badge/Production-zegaai.site-059669?style=for-the-badge&logo=vercel)
![Cloudflare CDN](https://img.shields.io/badge/CDN-cdn.zegaai.site-F38020?style=for-the-badge&logo=cloudflare)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![pnpm](https://img.shields.io/badge/pnpm-9.x-orange?style=for-the-badge&logo=pnpm)
![Turborepo](https://img.shields.io/badge/Turborepo-2.x-red?style=for-the-badge&logo=turborepo)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)

**ZEGA AI** ([zegaai.site](https://zegaai.site)) is an enterprise-grade monorepo designed for autonomous agent orchestration, high-performance workflow automation, real-time analytics, and seamless backend API services powered by Supabase, Fastify, Cloudflare R2 CDN, Cloudflare Turnstile, and Brevo SMTP Relay.

---

## 🏗️ Monorepo Architecture Overview

The repository is structured as a high-performance **pnpm + Turborepo monorepo** for enterprise scalability and modularity:

```
ZEGA/
├── apps/
│   ├── web/               # Frontend Application (React 18 + Vite + Tailwind CSS)
│   └── api/               # Backend API Microservice (Fastify + Node.js)
├── packages/
│   ├── config/            # Shared TypeScript & Tooling Configurations
│   ├── shared/            # Shared Types, Constants & Utility Functions
│   └── supabase/          # Supabase Client Factory & Database Types
├── supabase/              # Master SQL Migrations (20260729000001), Schema & RLS Policies
├── docs/                  # Enterprise Product & Architectural Specifications (PRD)
│   └── PRD/
│       ├── 12-IMPLEMENTED-FEATURES-STATUS.md
│       └── 13-ENTERPRISE-SECURITY-CDN-SUPABASE-HARDENING.md
├── vercel.json            # Vercel Monorepo Deployment Configuration
├── turbo.json             # Turborepo Task Pipeline Configuration
├── pnpm-workspace.yaml    # Workspace Packages Mapping
├── .gitignore             # OWASP-Compliant Root Zero-Secret Exposure Policy
└── README.md
```

---

## ✨ Implemented Platform & Security Features

### 1. 🛡️ OWASP ASVS 4.0 Supabase Database Schema (`20260729000001`)
- **Comprehensive 12-Table Schema**: `profiles`, `organizations`, `organization_members`, `user_api_keys`, `agents`, `workflows`, `sandboxes`, `sandbox_executions`, `integrations`, `agent_memory_store`, `security_audit_logs`, `rate_limit_logs`.
- **100% Idempotent Execution**: Guarded with `DROP TRIGGER IF EXISTS` and `DROP POLICY IF EXISTS` for repeatable migration execution.
- **OWASP Anti-Throttling**: Stored procedure `check_rate_limit()` tracks request rate limits per IP & User UUID.
- **OWASP Anti-Chunking Guard**: Check constraint `chk_input_payload_size` caps execution JSON payloads at 10MB (`octet_length <= 10485760`).
- **Row-Level Security (RLS)**: Enforced default-deny isolation policies across all core tables.

### 2. ⚡ Cloudflare R2 CDN Asset Delivery (`https://cdn.zegaai.site`)
- All static media and brand logos (`zegalogo.png`) are served globally from Cloudflare R2 CDN (`https://cdn.zegaai.site`).
- Automated upload script (`apps/api/src/scripts/uploadAssetsToR2.ts`) provisions R2 S3 buckets with HTTP cache headers (`max-age=31536000, immutable`).

### 3. 🔐 Cloudflare Turnstile Bot Defense, Brevo OTP & Auth Guards
- **Console Authentication Guards**: Console access requires active user session authentication while providing 1-Click Guest Demo mode for potential clients.
- **Interactive Cloudflare Turnstile**: Embedded widget in `AuthModal` validates CAPTCHA tokens via `/v1/auth/request-otp`.
- **Brevo Email OTP**: Primary HTTP API v3 delivery with Nodemailer Brevo SMTP Relay using verified sender (`siabang35@gmail.com`).
- **Session Cookies & Cache**: Cookie tracking (`zega_session`) with 7-day TTL and local telemetry caching (`auth_cache`).

### 4. 🗄️ Master Supabase Migrations (`20260729000000` — `20260729000003`)
- `public.users` master table synced automatically with `auth.users` & `public.profiles` via trigger `handle_user_sync()`.
- `public.user_sessions` and `public.auth_cache` stored procedures for secure session revocation and fast telemetry caching.

### 5. 🔒 Production-Grade Repository `.gitignore`
- Strict zero secret exposure policy across root `.gitignore`, `apps/api/.gitignore`, and `apps/web/.gitignore`.
- Blocks all `.env`, `.env.*`, keys, certs, and node_modules while preserving `.env.example` templates.

### 5. 🚀 Enterprise Documentation & Visual Console
- Interactive documentation hub accessible at `/docs` with global `⌘K` search dialog.
- Gaming-professional responsive UI for User, Enterprise, and SuperAdmin Workspaces.

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

# 3. Copy environment variables template
cp .env.example .env

# 4. Start all applications concurrently
pnpm dev
```

The web application will be live at `http://localhost:5173` and API server at `http://localhost:3001`.

### Workspace Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Run all applications (`apps/web` and `apps/api`) in development mode |
| `pnpm dev:web` | Run only the web frontend application |
| `pnpm dev:api` | Run only the Fastify backend service |
| `pnpm build` | Build all workspaces using Turborepo |
| `pnpm type-check` | Perform type-checking across all monorepo packages |
| `pnpm lint` | Run ESLint across all apps and packages |

---

## 🌐 Production Deployment

This monorepo is pre-configured for deployment on **Vercel** targeting primary production domain `zegaai.site` and CDN `cdn.zegaai.site`.

### Supabase Migration Steps
1. Open **Supabase Dashboard** → **SQL Editor**.
2. Run `supabase/schema.sql` or run `npx supabase db push`.

---

## 📄 Comprehensive Documentation

Detailed enterprise specs are available in `/docs`:
- [Implemented Features & Status](docs/PRD/12-IMPLEMENTED-FEATURES-STATUS.md)
- [Enterprise Security, CDN & Hardening](docs/PRD/13-ENTERPRISE-SECURITY-CDN-SUPABASE-HARDENING.md)
- [Monorepo Architecture Guide](docs/MONOREPO_ARCHITECTURE.md)

---

## 📄 License

Copyright © 2026 ZEGA AI (`zegaai.site`). All rights reserved.