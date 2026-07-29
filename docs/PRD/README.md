# ZEGA AI Product Requirements Document

## Autonomous Agentic AI Orchestration Platform
### Federated Multi-Agent Architecture (FMAA)

> **Version:** 3.2.0 | **Date:** 2026-07-27 | **Status:** Active | **Production Domain:** [zegaai.site](https://zegaai.site)

---

## Document Structure

| # | Section | File | Description |
|---|---|---|---|
| 01 | [Executive Summary](./01-EXECUTIVE-SUMMARY.md) | `01-EXECUTIVE-SUMMARY.md` | Vision, multi-scale platform (individual → government), agent-as-worker model, market differentiation |
| 02 | [System Architecture](./02-SYSTEM-ARCHITECTURE.md) | `02-SYSTEM-ARCHITECTURE.md` | FMAA topology, A2A/MCP protocols, event bus, Fastify backend, platform services |
| 03 | [Agent Specifications](./03-AGENT-SPECIFICATIONS.md) | `03-AGENT-SPECIFICATIONS.md` | 8 pre-built agent templates, Division architecture, real platform integrations (WhatsApp, Instagram, TikTok, Shopee, Stripe) |
| 04 | [Payment Infrastructure](./04-PAYMENT-INFRASTRUCTURE.md) | `04-PAYMENT-INFRASTRUCTURE.md` | x402 machine-to-machine stablecoin payments, Stripe Connect, 9router intelligent routing |
| 05 | [Security & Compliance](./05-SECURITY-COMPLIANCE.md) | `05-SECURITY-COMPLIANCE.md` | Zero Trust IAM, encryption, audit trails, GDPR/SOX/SOC2/ISO 27001 |
| 06 | [UI/UX Requirements](./06-UI-UX-REQUIREMENTS.md) | `06-UI-UX-REQUIREMENTS.md` | Design system, agent builder UI, responsive layouts, 9Router branding, dynamic contextual action tabs, 60fps card visualization |
| 07 | [Integration & Scalability](./07-INTEGRATION-SCALABILITY.md) | `07-INTEGRATION-SCALABILITY.md` | 200+ native connectors, multi-region, sovereign deployment, multi-tenancy |
| 08 | [Non-Functional Requirements](./08-NON-FUNCTIONAL-REQUIREMENTS.md) | `08-NON-FUNCTIONAL-REQUIREMENTS.md` | Performance, reliability, observability, AI model management |
| 09 | [Development Roadmap](./09-DEVELOPMENT-ROADMAP.md) | `09-DEVELOPMENT-ROADMAP.md` | 5-phase / 24-month delivery plan, budget, risks, success metrics |
| 10 | [Backend Technical Design](./10-BACKEND-TECHNICAL-DESIGN.md) | `10-BACKEND-TECHNICAL-DESIGN.md` | Fastify architecture, plugin system, caching, sessions, job queues, deployment |
| 11 | [AI Guardrails & Safety](./11-AI-GUARDRAILS-SAFETY.md) | `11-AI-GUARDRAILS-SAFETY.md` | 5-layer guardrails, Chart.js symbol mapping, solid non-gradient color standards, prompt engineering |
| 12 | [Implemented Features & Status](./12-IMPLEMENTED-FEATURES-STATUS.md) | `12-IMPLEMENTED-FEATURES-STATUS.md` | Dual-segment AuthModal, SuperAdmin & User/Enterprise Dashboards, Gaming-Professional UI, Supabase DB Schema |
| 16 | [Auth, Sessions & UI/UX](./16-AUTHENTICATION-SESSION-HARDENING-AND-UX-SPEC.md) | `16-AUTHENTICATION-SESSION-HARDENING-AND-UX-SPEC.md` | Session clearance, Console CTA route guarding, Guest Demo standards, Enterprise accordion sidebar, theme ergonomics |

---

## Key Implemented Platform Features

### 1. Dual-Segment Enterprise AuthModal (`App.tsx`)
- **Individual & UMKM vs Enterprise Scale Tabs**: Dedicated onboarding workflows matching exact corporate spec.
- **Social OAuth & Email Authentication**: Google/GitHub 1-click sign-in + custom domain email routing.
- **Transactional Brevo OTP Email Gateway**: 6-digit cryptographic verification passcodes via Brevo API v3 with SHA-256 OTP hashing, 5-minute TTL, and 5-attempt brute-force protection.
- **Cloudflare Turnstile Bot Defense**: Turnstile CAPTCHA token verification protecting `/request-otp` endpoints against automated bots and scrapers.
- **Cloudflare R2 Object Storage CDN**: Production CDN media delivery via `cdn.zegaai.site`.
- **1-Click Sandbox & Enterprise Demo**: Instant interactive demo access targeting `UserDashboard` (Individual or Enterprise workspace) with `admin@zega.ai` SuperAdmin direct route.
- **Modal Lifecycle Safety**: Strict `if (!isOpen) return null` render guards, isolated z-index layer (`z-[99999]`), and explicit close button event handling.

### 2. Dual Role-Based Dashboard Architecture (`App.tsx`)
- **SuperAdmin Control Suite (`SuperAdminDashboard.tsx`)**: Tenant management table, RLS policy enforcement, live audit trails, platform telemetry, and live role switching.
- **User & Enterprise Console (`UserDashboard.tsx`)**: Integrated AI Sandbox Console (`AiSandboxConsole.tsx`), model playground (ZEGA-Omni 4.5, Claude 3.5 Sonnet, GPT-4o), API key management, and workflow builder.

### 3. Enterprise Documentation Portal (`DocsPage.tsx`)
- **Stripe/Vercel Standard UI**: Full documentation suite accessible via `/docs` route with sidebar navigation, code snippets, interactive tabbed code blocks (TypeScript / Python / cURL / REST API).
- **Global Search (`⌘K`)**: Instant search dialog filtering through getting started guides, agent templates, connector APIs, and 9Router model specs.
- **Dedicated Responsive Header**: Enterprise top navigation bar with search shortcut, light/dark mode switcher, GitHub link, and seamless "Back to Main Site" routing.

### 4. Gaming-Professional Design System
- **High-Contrast Aesthetics**: Sharp card containers with minimal shadows, Plus Jakarta Sans typography, and Chakra Petch font for futuristic metrics.
- **Theme Safety**: Safe dark mode (`#0a0b10`) and light mode styling with non-AI generic presentation.

---

## Multi-Scale Deployment

| Scale | Target Users | Agents | Key Use Cases |
|---|---|---|---|
| **Individual** | Freelancers, solopreneurs | 1-10 | CS bot on WhatsApp, Social media agent, Invoice agent |
| **SMB** | Small businesses | 10-100 | Full marketing team, automated customer support, financial reporting |
| **Enterprise** | Mid-large companies | 100-10K | Cross-department orchestration, compliance, procurement optimization |
| **Conglomerate** | Holding companies | 10K-100K | Cross-subsidiary intelligence, digital twin, M&A simulation |
| **Government** | National agencies | 100K+ | Citizen services, budget optimization, regulatory enforcement |

---

## Target Outcomes (24 months)
| Metric | Target |
|---|---|
| Active Organizations | 10,000+ |
| Process Automation | 85%+ |
| OpEx Reduction | 30–60% |
| Decision Speed | 20x faster |
| Platform Uptime | 99.99% |
| Agent Precision | >90% |
| Native Integrations | 200+ |
| Transaction Volume | $1B+ |
