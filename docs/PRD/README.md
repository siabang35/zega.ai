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
| 17 | [Dashboard Theme, Store CDN & Avatars](./17-DASHBOARD-THEME-STORE-CDN-INBOX-AVATARS-SPEC.md) | `17-DASHBOARD-THEME-STORE-CDN-INBOX-AVATARS-SPEC.md` | Light mode default for dashboards, Dark mode default for landing page, Cloudflare R2 Store CDN, Customer avatars, 3D mascot popover |
| 18 | [Modular Enterprise Dashboard & Role Routing](./18-MODULAR-ENTERPRISE-DASHBOARD-ROLE-ROUTING-SPEC.md) | `18-MODULAR-ENTERPRISE-DASHBOARD-ROLE-ROUTING-SPEC.md` | Role-based routing (/dashboard vs /console vs /admin), domain-isolated enterprise/superadmin/umkm modules, 0-error build verification |
| 19 | [ZeroClaw Solana Agent Integration](./19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md) | `19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md` | Self-hosted Rust node, Keyless Tier 1 Custody, Solana Pay QR, Devnet RPC signatures, SOP Checkpoints, dual USD/IDR mode, role-separated streams |
| 20 | [High-Fidelity Redesign & Governance](./20-HIGH-FIDELITY-DASHBOARD-REDESIGN-AND-GOVERNANCE-SPEC.md) | `20-HIGH-FIDELITY-DASHBOARD-REDESIGN-AND-GOVERNANCE-SPEC.md` | High-fidelity UI redesign across 18 Enterprise & 14 UMKM views, Governance Suite (Organizations, Team & Roles, Settings with Danz Assyidq), Developer Suite, mobile drawer overlay & bottom bar |
| 21 | [SQL Migrations, CDN R2 & Realtime](./21-ENTERPRISE-SQL-MIGRATION-CDN-R2-SUPABASE-REALTIME-SPEC.md) | `21-ENTERPRISE-SQL-MIGRATION-CDN-R2-SUPABASE-REALTIME-SPEC.md` | Modular SQL migration suites for UMKM, Enterprise, and SuperAdmin, Token Bucket rate limiters, OWASP anti-chunking payload size validators, Cloudflare R2 CDN integration, and Supabase Realtime synchronization |
| 27 | [ZeroClaw Solana Bounty Production Suite](./27-ZEROCLAW-SOLANA-BOUNTY-PRODUCTION-SUITE-SPEC.md) | `27-ZEROCLAW-SOLANA-BOUNTY-PRODUCTION-SUITE-SPEC.md` | Complete specification of ZeroClaw upstream features integrated into ZEGA AI: SOP engine, Skills, MCP client, Relationship Memory graph, HMAC Webhook verification, Blinks/Solana Actions, and DeFi Guardian |
| 29 | [Solana RPC Failover Manager](./29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md) | `29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md` | Enterprise Solana RPC Manager with multi-provider failover pool, circuit breaker cooldowns, token bucket rate limiting, in-flight request deduplication, OWASP method whitelisting, and IPv4 forced resolution |
| 31 | [Zero-Trust Anti-Fraud & Resilient Queue](./31-ZERO-TRUST-ANTI-FRAUD-MESSAGING-QUEUE-SPEC.md) | `31-ZERO-TRUST-ANTI-FRAUD-MESSAGING-QUEUE-SPEC.md` | Zero-Trust 5-layer on-chain validation pipeline, zero-amount transfer rejection, merchant/reference matching, Indonesian comma decimal normalization, single-flight handle lock, and exponential backoff retry queue |
| 32 | [ZEGA Copilot Enterprise Security & Multi-LLM](./32-ZEGA-COPILOT-ENTERPRISE-SECURITY-AND-MULTI-LLM-SPEC.md) | `32-ZEGA-COPILOT-ENTERPRISE-SECURITY-AND-MULTI-LLM-SPEC.md` | 6-layer OWASP Top 10 for LLM guardrails, 5-stage multi-LLM real-time failover engine, dynamic temporal anchor (2026), mobile UX bottom sheet, real-time dynamic calendar popover, and seamless profile icon pill bar |
| 33 | [2026 Flagship AI Models & Security](./33-ZEGA-2026-FLAGSHIP-AI-MODELS-AND-SECURITY-SPEC.md) | `33-ZEGA-2026-FLAGSHIP-AI-MODELS-AND-SECURITY-SPEC.md` | 2026 flagship AI models (DeepSeek V4, Groq Llama 3.3, Gemini 3.6 Flash), 9Router Layer 5 Engine daemon, OWASP 5-layer LLM security architecture, and zero-trust auth |
| 34 | [ZEGA AI 6-Layer Architecture Spec](./34-ZEGA-AI-6-LAYER-SWARM-ARCHITECTURE-SPEC.md) | `34-ZEGA-AI-6-LAYER-SWARM-ARCHITECTURE-SPEC.md` | Comprehensive 6-layer enterprise swarm architecture (Event Sources, Integrations, Jatevo Orchestrator, Autonomous AI Agents, 9Router Engine, Model Swarm & OWASP Guardrails) |
| 35 | [RPC URL Sanitization & Strict Env Security](./35-RPC-URL-SANITIZATION-AND-STRICT-ENV-SECURITY-SPEC.md) | `35-RPC-URL-SANITIZATION-AND-STRICT-ENV-SECURITY-SPEC.md` | RPC URL API key log sanitization engine, Pino redaction serializers, Zod 25+ env schema validation, and complete hardcoded fallback string purge |
| 36 | [Hardened Invoice Delivery & Realtime Vault](./36-ZERO-CLAW-HARDENED-INVOICE-DELIVERY-AND-REALTIME-VAULT-SPEC.md) | `36-ZERO-CLAW-HARDENED-INVOICE-DELIVERY-AND-REALTIME-VAULT-SPEC.md` | Single-flight invoice delivery engine, Cloudflare R2 CDN audit certificates, 5-layer OWASP anti-hacking guard, and Supabase Realtime WebSocket sync |
| 37 | [Enterprise Mobile Navigation & Routing Modernization](./37-ENTERPRISE-MOBILE-NAVIGATION-AND-ROUTING-MODERNIZATION-SPEC.md) | `37-ENTERPRISE-MOBILE-NAVIGATION-AND-ROUTING-MODERNIZATION-SPEC.md` | Unified Chevron design language across desktop & mobile, single border toggle, unclipped floating Chevron button, scrollbar line removal, and `/console/payments-billing` route isolation |

---

## Key Implemented Platform Features

### 1. Dual-Segment Enterprise AuthModal (`App.tsx`)
- **Individual & UMKM vs Enterprise Scale Tabs**: Dedicated onboarding workflows matching exact corporate spec.
- **Social OAuth & Email Authentication**: Google/GitHub 1-click sign-in + custom domain email routing.
- **Transactional Brevo OTP Email Gateway**: 6-digit cryptographic verification passcodes via Brevo API v3 with SHA-256 OTP hashing, 5-minute TTL, and 5-attempt brute-force protection.
- **Cloudflare Turnstile Bot Defense**: Turnstile CAPTCHA token verification protecting `/request-otp` endpoints against automated bots and scrapers.
- **Cloudflare R2 Object Storage CDN**: Production CDN media delivery via `cdn.zegaai.site`.
- **1-Click Sandbox & Enterprise Demo**: Instant interactive demo access targeting `UserDashboard` (Individual or Enterprise workspace) with `admin@zegaai.site` SuperAdmin direct route.
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
