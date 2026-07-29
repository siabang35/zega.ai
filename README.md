# ZEGA AI — Enterprise Autonomous Agent Orchestration Monorepo

![ZEGA AI Banner](https://img.shields.io/badge/ZEGA.AI-Enterprise%20Monorepo-ff6b35?style=for-the-badge)
![Production Domain](https://img.shields.io/badge/Production-zegaai.site-059669?style=for-the-badge&logo=vercel)
![Cloudflare CDN](https://img.shields.io/badge/CDN-cdn.zegaai.site-F38020?style=for-the-badge&logo=cloudflare)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
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
  - **Collapsible Accordion Navigation**: Enterprise sidebar organized into smooth, collapsible categories (`Orchestration & Agents`, `Intelligence & MCP`, `Autonomous Payments & Wallets`, `Governance & Security`, `Infrastructure & Control`) with automatic active tab expansion.
  - **Mobile Responsive Drawer**: Hamburger menu toggle (`Menu` icon) opening a slide-out backdrop-blurred sidebar drawer for mobile devices.

### 3. 🎨 Corporate Design System & Visual Polish
- **Flat 1px Border Standard**: Enforced `border-slate-200` in Light Mode and `border-slate-800` in Dark Mode across all components.
- **Official ZEGA AI Logo Display**: High-resolution `zegalogo.png` header branding with dark mode filter inversion.
- **Theme-Safe Emerald WhatsApp CS Bot**: High-contrast, theme-safe Emerald status badges (`text-emerald-700 dark:text-emerald-300`, `bg-emerald-50 dark:bg-emerald-950/60`, `border-emerald-200 dark:border-emerald-800`).

### 4. 🛡️ OWASP ASVS 4.0 Supabase Schema (`20260729000001`)
- **12 Core Tables**: `profiles`, `organizations`, `organization_members`, `user_api_keys`, `agents`, `workflows`, `sandboxes`, `sandbox_executions`, `integrations`, `agent_memory_store`, `security_audit_logs`, `rate_limit_logs`.
- **Anti-Chunking Guard**: Input payload size cap (`octet_length <= 10485760` / 10MB).
- **Row-Level Security (RLS)**: Enforced isolation policies preventing cross-tenant data leaks.

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

---

## 📄 License

Copyright © 2026 **ZEGA AI** ([zegaai.site](https://zegaai.site)). All rights reserved.