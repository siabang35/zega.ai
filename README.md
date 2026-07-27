# ZEGA AI — Enterprise Autonomous Agent Orchestration Monorepo

![ZEGA AI Banner](https://img.shields.io/badge/ZEGA.AI-Enterprise%20Monorepo-ff6b35?style=for-the-badge)
![Production Domain](https://img.shields.io/badge/Production-zegaai.site-059669?style=for-the-badge&logo=vercel)
![pnpm](https://img.shields.io/badge/pnpm-9.x-orange?style=for-the-badge&logo=pnpm)
![Turborepo](https://img.shields.io/badge/Turborepo-2.x-red?style=for-the-badge&logo=turborepo)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)

**ZEGA AI** ([zegaai.site](https://zegaai.site)) is an enterprise-grade monorepo designed for autonomous agent orchestration, high-performance workflow automation, real-time analytics, and seamless backend API services powered by Supabase and Hono.

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
├── docs/                  # Enterprise Product & Architectural Specifications (PRD)
├── vercel.json            # Vercel Monorepo Deployment Configuration
├── turbo.json             # Turborepo Task Pipeline Configuration
├── pnpm-workspace.yaml    # Workspace Packages Mapping
└── README.md
```

---

## ✨ Key Implemented Platform Features

- **🚀 Dedicated Enterprise Documentation Portal (`DocsPage.tsx`)**:
  - Full-featured Stripe/Vercel standard documentation UI accessible via `/docs`.
  - Global `⌘K` search dialog, interactive code blocks (TypeScript / Python / cURL / REST API), and dedicated responsive navigation header with quick links and light/dark theme toggle.

- **⚡ 60FPS Orchestration Card & 9Router Engine (`App.tsx`)**:
  - **Identical Locked Card Dimensions**: The 4-tab center Orchestrator card (`Agent`, `Integration`, `Automation`, `Memory`) maintains locked fixed dimensions (`max-w-[490px]`, Header: 76px, Pipeline: 235px, Footer: 38px) with zero visual jumping during tab switches.
  - **Anti-Throttling & Smooth Transitions**: Replaced layout-thrashing interval loops with `requestAnimationFrame` + `ResizeObserver` SVG coordinate tracing and hardware-accelerated `transform-gpu` key-frame fade animations.
  - **LLM Brand Icon Mapping**: Native rendering of official webp/png/jpg brand assets for 7 models (`GPT-4.1`, `Gemini 2.5`, `DeepSeek`, `Qwen 2.5`, `Llama 3.1`, `Claude`, `Mistral`).

- **🛡️ 5-Layer AI Guardrails System**:
  - Fail-safe protection hierarchy (Input Sanitize, PII Redaction, Injection Block, Output Filter, Audit Trail) mapped to Chart.js SVG symbols with solid, non-gradient enterprise color standards.

- **📊 Dynamic Contextual Demonstration Tabs ("Experience ZEGA in Action")**:
  - Interactive 3-way workspace panel switching between:
    - **`Utilization`**: Workplace AI Agent capacity load, active fleet stats (87%), concurrent tasks (1,420), and real-time customer support chat.
    - **`Tools & Systems`**: Unified Gateway connectors (Stripe, WhatsApp, BigQuery, Supabase, Slack, GitHub) and live API event logs.
    - **`Analytics`**: Telemetry engine with interactive Chart.js Doughnut model traffic distribution and ROI insights.

- **🌐 Google Search SEO Optimization (`zegaai.site`)**:
  - Primary production canonical URL set to `https://zegaai.site`.
  - Structured Schema.org JSON-LD (`Organization`, `WebSite`, `SoftwareApplication`), OpenGraph, Twitter Cards, `robots.txt`, and `sitemap.xml` for maximum ranking on `"ZEGA AI"`, `"ZEGA Automation"`, and `"ZEGA Orchestration"`.

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

This monorepo comes pre-configured with root and sub-workspace `vercel.json` files for zero-config deployment on **Vercel** targeting production domain `zegaai.site`.

### Deploying via Vercel Dashboard

1. Import your repository into **Vercel**.
2. Vercel automatically detects the **pnpm Monorepo** setup.
3. Configure the following settings for the web app deployment:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or `apps/web`)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `apps/web/dist`
4. Add environment variables from `.env.example` in Vercel Project Settings.
5. Set custom domain to `zegaai.site`.
6. Click **Deploy**.

---

## 📄 Documentation

Detailed enterprise product requirements, system architecture diagrams, and agent specifications are available in the `/docs` directory:
- [Product Requirements Document (PRD)](docs/PRD/README.md)
- [System Architecture](docs/PRD/02-SYSTEM-ARCHITECTURE.md)
- [Agent Specifications](docs/PRD/03-AGENT-SPECIFICATIONS.md)
- [Monorepo Architecture Guide](docs/MONOREPO_ARCHITECTURE.md)

---

## 📄 License

Copyright © 2026 ZEGA AI (`zegaai.site`). All rights reserved.