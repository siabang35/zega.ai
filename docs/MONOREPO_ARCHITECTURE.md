# ZEGA AI — Enterprise Monorepo Architecture & Deployment Guide

## Overview

ZEGA AI uses a enterprise-grade monorepo architecture built with **pnpm workspaces** and **Turborepo** build orchestration. This document details workspace boundaries, shared packages, environment configuration, and deployment strategies.

---

## Workspace Structure

```
ZEGA/
├── apps/
│   ├── web/                     # Frontend React + Vite Application
│   │   ├── src/
│   │   │   ├── app/             # Modular Dashboards (Enterprise, UMKM, SuperAdmin)
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── enterprise/views/ZeroClawTerminalView.tsx # ZeroClaw Solana Terminal
│   │   │   │   │   └── umkm/views/FinanceView.tsx               # UMKM Solana Pay Finance View
│   │   │   │   └── DocsPage.tsx  # Web Documentation Portal (/docs)
│   │   │   ├── main.tsx         # Entrypoint
│   │   │   └── index.css        # Core Design System & Tokens
│   │   ├── public/              # Static Assets (Logo, Fonts)
│   │   ├── vercel.json          # Sub-workspace Vercel Config
│   │   └── package.json
│   └── api/                     # Backend Fastify Microservice
│       ├── src/
│       │   └── routes/v1/
│       │       ├── zeroclaw.routes.ts # ZeroClaw Solana RPC & Checkpoint Endpoints
│       │       └── auth.routes.ts     # Brevo OTP & Turnstile Auth Routes
│       └── package.json
├── packages/
│   ├── config/                  # Base TypeScript & Tooling Configs
│   ├── shared/                  # Monorepo Shared Utilities & Types
│   └── supabase/                # Supabase Integration Client & Types
├── supabase/                    # Database Migrations & Seeds
│   ├── migrations/
│   │   ├── 20260729000000_enterprise_schema_and_security.sql
│   │   └── 20260730233500_zeroclaw_solana_settlements.sql # ZeroClaw Settlements & SOP Checkpoints
│   └── seeds/
├── docs/                        # Complete PRD & Architectural Documentation
├── vercel.json                  # Monorepo Vercel Deployment Configuration
├── turbo.json                   # Pipeline Configuration
├── pnpm-workspace.yaml          # Monorepo Workspace Definitions
└── README.md
```

---

## ZeroClaw Solana Agent Runtime Infrastructure

ZEGA AI incorporates **ZeroClaw**, a self-hosted Rust AI agent runtime operating on **Keyless Tier 1 Custody**:

1. **Fastify REST API Routes (`apps/api/src/routes/v1/zeroclaw.routes.ts`)**:
   - `GET /v1/zeroclaw/status`: Agent node status & active channel telemetry.
   - `GET /v1/zeroclaw/solana-rpc`: Solana Devnet RPC live slot stream.
   - `POST /v1/zeroclaw/events`: Solana Pay reference key generation & invoice registration.
   - `POST /v1/zeroclaw/approve-checkpoint`: SOP prompt injection refund checkpoint clearance.

2. **Database & Idempotent Migrations (`supabase/migrations/20260730233500_zeroclaw_solana_settlements.sql`)**:
   - Tables: `zeroclaw_solana_settlements` and `zeroclaw_sop_checkpoints`.
   - Idempotent policy guards (`DROP POLICY IF EXISTS`) to prevent deployment collisions.

3. **Dual USD/IDR Currency Switcher**:
   - Fixed conversion rate **1 USD = Rp 18.000 IDR** applied across all metrics, Chart.js sparklines, and live stream rows.

---

## Environment Variables

Environment variables are managed per workspace using a unified `.env` at the root directory during development.

Refer to `.env.example`:

```env
# Web Frontend
VITE_SUPABASE_URL=https://your-supabase-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3001

# Backend API
PORT=3001
SUPABASE_URL=https://your-supabase-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your-turnstile-secret
```

---

## Vercel Deployment Guide

### Deployment Architecture
- **Root Configuration**: `vercel.json` at root delegates build execution to `pnpm build` via Turborepo.
- **Output Target**: `apps/web/dist` containing optimized production Vite bundle.

### 1-Click Vercel Import Settings
- **Framework Preset**: `Vite`
- **Build Command**: `pnpm build` (or `pnpm --filter=@zega/web build`)
- **Output Directory**: `apps/web/dist`
- **Install Command**: `pnpm install`

---

## Database & Type Generation Workflow

1. Write SQL schema changes in `supabase/migrations/*.sql`.
2. Apply migrations via Supabase CLI:
   ```bash
   npx supabase db push
   ```
3. Generate TypeScript types into `@zega/supabase`:
   ```bash
   pnpm --filter=@zega/supabase generate-types
   ```

