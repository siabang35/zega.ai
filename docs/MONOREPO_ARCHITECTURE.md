# ZEGA AI — Enterprise Monorepo Architecture & Deployment Guide

## Overview

ZEGA AI uses a enterprise-grade monorepo architecture built with **pnpm workspaces** and **Turborepo** build orchestration. This document details workspace boundaries, shared packages, environment configuration, and deployment strategies.

---

## Workspace Structure

```
ZEGA/
├── apps/
│   ├── web/                     # Frontend Application
│   │   ├── src/
│   │   │   ├── app/             # React Application & Components
│   │   │   ├── main.tsx         # Entrypoint
│   │   │   └── index.css        # Core Design System & Tokens
│   │   ├── public/              # Static Assets (Logo, Fonts)
│   │   ├── vercel.json          # Sub-workspace Vercel Config
│   │   └── package.json
│   └── api/                     # Backend Microservice
│       ├── src/                 # Hono Server & Routes
│       └── package.json
├── packages/
│   ├── config/                  # Base TypeScript & Tooling Configs
│   │   ├── tsconfig.base.json
│   │   └── package.json
│   ├── shared/                  # Monorepo Shared Utilities & Types
│   │   ├── src/index.ts
│   │   └── package.json
│   └── supabase/                # Supabase Integration Client & Types
│       ├── src/
│       │   ├── client.ts
│       │   └── types.ts
│       └── package.json
├── supabase/                    # Database Migrations & Seeds
│   ├── migrations/
│   └── seeds/
├── vercel.json                  # Monorepo Vercel Deployment Configuration
├── turbo.json                   # Pipeline Configuration
├── pnpm-workspace.yaml          # Monorepo Workspace Definitions
└── README.md
```

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
