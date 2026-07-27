# ZEGA AI — Enterprise Autonomous Agent Orchestration Monorepo

![ZEGA AI Banner](https://img.shields.io/badge/ZEGA.AI-Enterprise%20Monorepo-ff6b35?style=for-the-badge)
![pnpm](https://img.shields.io/badge/pnpm-9.x-orange?style=for-the-badge&logo=pnpm)
![Turborepo](https://img.shields.io/badge/Turborepo-2.x-red?style=for-the-badge&logo=turborepo)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)

**ZEGA AI** is an enterprise-grade monorepo designed for autonomous agent orchestration, high-performance workflow automation, real-time analytics, and seamless backend API services powered by Supabase and Hono.

---

## 🏗️ Architecture Overview

The repository is structured as a high-performance **pnpm + Turborepo monorepo** for enterprise scalability and modularity:

```
ZEGA/
├── apps/
│   ├── web/               # Frontend Application (React 18 + Vite + Tailwind CSS)
│   └── api/               # Backend Microservice (Hono + Node.js)
├── packages/
│   ├── config/            # Shared TypeScript & Tooling Configurations
│   ├── shared/            # Shared Types, Constants & Utility Functions
│   └── supabase/          # Supabase Client Factory & Database Types
├── supabase/              # SQL Migrations, Seed Scripts & RLS Policies
├── docs/                  # Enterprise Product & Architectural Specifications
├── vercel.json            # Vercel Monorepo Deployment Configuration
├── turbo.json             # Turborepo Task Pipeline Pipeline Configuration
├── pnpm-workspace.yaml    # Workspace Packages Mapping
└── README.md
```

---

## ⚡ Quick Start & Development Workflow

### Prerequisites
- **Node.js**: `>=20.0.0`
- **pnpm**: `>=9.0.0`

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/zega.git
cd ZEGA

# 2. Install workspace dependencies
pnpm install

# 3. Copy environment variables template
cp .env.example .env

# 4. Start all applications concurrently
pnpm dev
```

The web application will be live at `http://localhost:5173`.

### Workspace Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Run all applications (`apps/web` and `apps/api`) in development mode |
| `pnpm dev:web` | Run only the web frontend application |
| `pnpm dev:api` | Run only the API backend microservice |
| `pnpm build` | Build all workspaces using Turborepo |
| `pnpm type-check` | Perform type-checking across all monorepo packages |
| `pnpm lint` | Run ESLint across all apps and packages |
| `pnpm clean` | Wipe build caches (`.turbo`, `dist`) and `node_modules` |

---

## 🌐 Vercel Deployment

This monorepo comes pre-configured with root and sub-workspace `vercel.json` files for zero-config deployment on **Vercel**.

### Deploying via Vercel Dashboard

1. Import your repository into **Vercel**.
2. Vercel automatically detects the **pnpm Monorepo** setup.
3. Configure the following settings for the web app deployment:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or `apps/web`)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `apps/web/dist`
4. Add environment variables from `.env.example` in Vercel Project Settings.
5. Click **Deploy**.

### Deploying via Vercel CLI

```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

---

## 🗄️ Supabase Integration & Database Workflow

SQL schema files and migrations are managed under `supabase/`:
- `supabase/migrations/`: SQL migration files
- `supabase/seeds/`: Initial database seeds

To generate TypeScript types from your Supabase schema into `@zega/supabase`:

```bash
# In packages/supabase directory or via pnpm filter:
pnpm --filter=@zega/supabase generate-types
```

---

## 📄 Documentation

Detailed enterprise product requirements, system architecture diagrams, and agent specifications are available in the `/docs` directory:
- [System Architecture](docs/PRD/02-SYSTEM-ARCHITECTURE.md)
- [Agent Specifications](docs/PRD/03-AGENT-SPECIFICATIONS.md)
- [Monorepo Architecture Guide](docs/MONOREPO_ARCHITECTURE.md)

---

## 📄 License

Copyright © 2026 ZEGA AI. All rights reserved.