# ZEGA AI PRD — Modular Enterprise Dashboard Architecture & Role Routing Spec

## 18. Modular Enterprise Dashboard Architecture & Dynamic Role Routing (July 2026)

### 18.1 Executive Summary
To achieve high debuggability, clean code maintenance, and infinite enterprise scalability, the **ZEGA AI Platform** frontend architecture was refactored into domain-isolated modules. In addition, the authentication and guest demo routing engine was hardened to strictly enforce role-based access control (RBAC), ensuring that:
- **Individual / UMKM Users** are routed to `/dashboard` (rendering the UMKM Starter Pro Dashboard).
- **Enterprise Organization Administrators** are routed to `/console` (rendering the Enterprise Telemetry Hub).
- **Platform SuperAdmins** are routed to `/admin` (rendering the SuperAdmin Control Matrix).

---

### 18.2 Role-Based Routing & Session Logic

#### A. AuthModal Dynamic Callback (`onSubmitSuccess`)
- `onSubmitSuccess` accepts `(message: string, role?: 'superadmin' | 'enterprise' | 'individual')`.
- Authenticated role is dynamically resolved from session metadata (`session.role`) or the selected modal segment (`audienceSegment`).
- Dynamic navigation rules:
  - `role === 'individual'` → `navigateTo('/dashboard')`
  - `role === 'enterprise'` → `navigateTo('/console')`
  - `role === 'superadmin'` → `navigateTo('/admin')`

#### B. Header Console CTA Button
- Resolves current session via `SupabaseDashboardService.getCurrentSession()`.
- Dynamically routes to the user's role-appropriate path (`/dashboard`, `/console`, or `/admin`).

---

### 18.3 Modular Enterprise Directory Structure

```
apps/web/src/app/dashboard/
├── umkm/
│   ├── UmkmDashboardContainer.tsx      # Full-screen UMKM Layout & Navigation
│   ├── UmkmDashboard.tsx               # UMKM Sub-view Router (Home, Agents, Sales, Finance, Inbox)
│   └── views/                          # Modular UMKM Views
├── enterprise/
│   ├── EnterpriseDashboard.tsx         # Enterprise Telemetry Layout & Navigation
│   └── views/                          # Enterprise Domain Sub-Views
│       ├── AgentSwarmsView.tsx         # Swarm topology & consensus controls
│       ├── KnowledgeBrainView.tsx      # Vector RAG & Qdrant indexing
│       ├── McpConnectorsView.tsx       # Model Context Protocol registry
│       ├── AgentEvalsView.tsx          # Hallucination & benchmark suite
│       ├── CryptoWalletsView.tsx       # Gas & multi-sig vault manager
│       ├── UsageBillingView.tsx        # Token telemetry & credit metering
│       ├── AiSafetyView.tsx            # OWASP prompt injection firewall
│       ├── AuditLogsView.tsx           # Cryptographic audit ledger
│       └── RbacSsoView.tsx             # Enterprise RBAC & SAML/Okta SSO
├── superadmin/
│   └── SuperAdminDashboard.tsx         # SuperAdmin Root Orchestrator Matrix
└── UserDashboard.tsx                   # High-level Role Router Delegator
```

---

### 18.4 Module Responsibilities

1. **`UserDashboard.tsx` (Role Delegator)**:
   - Ultra-lightweight container (under 40 lines of code).
   - Inspects `userRole` prop (`individual` | `enterprise` | `superadmin`).
   - Delegates rendering to `EnterpriseDashboardView` if `userRole === 'enterprise'`, or `UmkmDashboardContainer` if `userRole === 'individual'`.

2. **`EnterpriseDashboardView` (`enterprise/EnterpriseDashboard.tsx`)**:
   - Manages Enterprise sidebar categorization (Orchestration & Agents, Intelligence & MCP, Autonomous Payments & Wallets, Governance & Security).
   - Routes `activeTab` to dedicated sub-view components.
   - Provides enterprise header controls (Qdrant vector status, release badge, toast notifications).

3. **`UmkmDashboardContainer` (`umkm/UmkmDashboardContainer.tsx`)**:
   - Manages UMKM sidebar navigation (Home, My AI Employees, Automation, Inbox, Sales, Marketing, Finance, Store, Customers, Reports, Knowledge, Marketplace, Billing, Settings).
   - Displays UMKM starter quota usage and store identity switcher.

4. **`SuperAdminDashboard` (`superadmin/SuperAdminDashboard.tsx`)**:
   - Isolated in `superadmin/` module.
   - Displays 5-layer OWASP guardrail metrics, tenant roster management, and global platform telemetry.

---

### 18.5 Verification & Build Artifacts

| Component / Module | File Path | Status |
|---|---|---|
| Role Router Delegator | `apps/web/src/app/dashboard/UserDashboard.tsx` | Verified (0 TypeScript Errors) |
| Enterprise Dashboard Container | `apps/web/src/app/dashboard/enterprise/EnterpriseDashboard.tsx` | Verified & Built |
| Enterprise Sub-Views | `apps/web/src/app/dashboard/enterprise/views/*.tsx` | Verified (9 Sub-views) |
| UMKM Dashboard Container | `apps/web/src/app/dashboard/umkm/UmkmDashboardContainer.tsx` | Verified & Built |
| SuperAdmin Module | `apps/web/src/app/dashboard/superadmin/SuperAdminDashboard.tsx` | Verified & Built |
| Main Router & AuthModal | `apps/web/src/app/App.tsx` | Verified & Built |
| Vite Production Bundle | `dist/assets/index-*.js` | Built in 4.67s |
