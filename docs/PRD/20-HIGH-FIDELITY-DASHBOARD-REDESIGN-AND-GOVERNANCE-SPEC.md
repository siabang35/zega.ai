# ZEGA AI PRD 20 — High-Fidelity Dashboard Redesign & Governance Architecture Specification

## 20.1 Overview & Scope

This specification documents the comprehensive high-fidelity UI redesign and structural modernization of the **ZEGA AI Platform Dashboards** (Enterprise Workspace & UMKM Retail Workspace). The initiative standardizes corporate aesthetic tokens, implements granular role-based governance controls, integrates keyless Solana agent settlement runtimes, and delivers full mobile accessibility via slide-out side drawers and fixed bottom navigation bars.

---

## 20.2 Enterprise Dashboard Redesign Matrix

The Enterprise Dashboard (`EnterpriseDashboard.tsx`) has been modularized into 18 specialized views categorized into logical governance domain groups:

```
ENTERPRISE DASHBOARD ARCHITECTURE
├── MAIN MENU
│   ├── Overview (OverviewView.tsx)
│   ├── AI Command Center (AiCommandCenterView.tsx)
│   ├── AI Agents (AgentSwarmsView.tsx)
│   ├── Workflow Studio (SandboxWorkflowView.tsx)
│   ├── Knowledge Hub (KnowledgeBrainView.tsx)
│   ├── MCP Hub (McpConnectorsView.tsx)
│   └── Integrations (IntegrationsView.tsx)
├── ANALYTICS
│   ├── Analytics (AnalyticsView.tsx)
│   ├── Cost Intelligence (CostIntelligenceView.tsx)
│   └── Reports (ReportsView.tsx)
├── PLATFORM
│   ├── Payments & Billing (UsageBillingView.tsx)
│   ├── ZeroClaw Terminal (ZeroClawTerminalView.tsx)
│   ├── Security Center (AiSafetyView.tsx)
│   ├── Infrastructure (InfrastructureView.tsx)
│   └── Audit Logs (AuditLogsView.tsx)
├── DEVELOPER PORTAL
│   ├── Developer Portal (DevPortalView.tsx)
│   ├── API & SDK (ApiSdkView.tsx)
│   ├── Webhooks (WebhooksView.tsx)
│   └── Logs (DeveloperLogsView.tsx)
└── GOVERNANCE
    ├── Organizations (OrganizationView.tsx)
    ├── Team & Roles (TeamRolesView.tsx)
    └── Settings (SettingsView.tsx)
```

---

## 20.3 Detailed Governance Suite Specifications

### A. Organizations Module (`OrganizationView.tsx`)
- **Header & Action Bar**: Global search bar (`Search organizations...`) and indigo `+ New Organization` modal trigger.
- **Top 4 KPI Metric Cards**:
  - `Total Organizations`: 7 (↑ 16.7% vs last 30 days)
  - `Active Organizations`: 6 (↑ 20.0% vs last 30 days)
  - `Total Members`: 128 (↑ 12.5% vs last 30 days)
  - `Total Projects`: 32 (↑ 10.8% vs last 30 days)
- **All Organizations Table**: Interactive list displaying organization name, status badge (`Active`, `Pending`, `Inactive`), member count, project count, and pagination controls.
- **Selected Organization Detail (Acme Enterprise)**:
  - Gradient avatar emblem (`A`).
  - Organization ID copy handle: `org_01H8QZ6VJ7GJ6JZVYB8K3M4N9WZ`.
  - Created Date: `Jan 10, 2025`.
  - Owner Profile: **Danz Assyidq** (`danz@acme.com`).
  - Usage Overview Bars: Members (45/100), Projects (8/20), API Calls (2.45M/10M), Storage (182.4GB/1TB).

### B. Team & Roles Module (`TeamRolesView.tsx`)
- **Sub-Navigation Tabs**: `Team Members` (active), `Roles`, `Permissions`.
- **Top 4 KPI Metric Cards**:
  - `Total Members`: 45 (↑ 12.5%)
  - `Active Members`: 38 (↑ 8.6%)
  - `Pending Invitations`: 7
  - `Roles`: 6
- **Team Members Table**: Complete member roster containing:
  - **Danz Assyidq** (`danz@acme.com`) — Role: `Enterprise Admin` | Status: `Active` | Last Active: `2 minutes ago`
  - **Alsa Dwi Nur H.** (`alsa@acme.com`) — Role: `Admin` | Status: `Active` | Last Active: `10 minutes ago`
  - **Faris Ramadhan** (`faris@acme.com`) — Role: `Developer` | Status: `Active` | Last Active: `1 hour ago`
  - **Siti Aisyah** (`aisyah@acme.com`) — Role: `Analyst` | Status: `Active` | Last Active: `2 hours ago`
  - **Dimas Pratama** (`dimas@acme.com`) — Role: `Viewer` | Status: `Active` | Last Active: `1 day ago`
  - **Rizky Abdullah** (`rizky@acme.com`) — Role: `Developer` | Status: `Inactive` | Last Active: `3 days ago`
  - **Naufal Hakim** (`naufal@acme.com`) — Role: `Viewer` | Status: `Pending` | Last Active: `-`
- **Roles & Permissions Overview**: Role breakdown card (`Enterprise Admin` 3, `Admin` 7, `Developer` 18, `Analyst` 9, `Viewer` 6, `Billing Manager` 2) paired with a Permission Matrix.

### C. Settings Module (`SettingsView.tsx`)
- **8-Category Navigation Panel**: `General`, `Security`, `API & Access`, `Billing & Plan`, `Notifications`, `Data & Privacy`, `Integrations`, `Advanced`.
- **General Settings**:
  - Organization Profile: Name (`Acme Enterprise`), Website (`https://acme.com`), Description (`Acme Enterprise is building the future with AI-powered automation.`), Logo upload handler.
  - Preferences: Switches for user invitations (`ALLOW`), 2FA requirement (`OFF`), and Default Project Visibility (`Private`).
- **Regional Settings**: Timezone (`(GMT+7) Asia/Jakarta`), Language (`English (US)`), Date Format (`May 27, 2025`), Time Format (`24-hour`).
- **Security Status Card**: Green Shield Check icon with security status audit (`SSO Enabled`, `2FA Enforcement Recommended`, `Strong Password Policy Enabled`, `Session Timeout 30m`).
- **Recent Activity Audit Log**: Real-time event feed by **Danz Assyidq**, **Alsa Dwi Nur H.**, and **Faris Ramadhan**.

---

## 20.4 Mobile Responsive Navigation Architecture

To guarantee 100% mobile accessibility across mobile phones and tablets, both Enterprise (`EnterpriseDashboard.tsx`) and UMKM (`UmkmDashboardContainer.tsx`) dashboards incorporate:

1. **Mobile Slide-Out Drawer Overlay (`mobileMenuOpen`)**:
   - Triggered via header hamburger menu button (`Menu` icon).
   - Renders a fixed overlay with backdrop blur (`bg-slate-950/70 backdrop-blur-xs`).
   - Displays brand logo, user profile card, full navigation menu list with badges, and sign-out trigger.
2. **Mobile Bottom Navigation Bar**:
   - `md:hidden` fixed bottom bar with `backdrop-blur-md` and `z-40` layer.
   - Enterprise bar items: `Overview`, `Swarms`, `ZeroClaw`, `Dev Portal`, `Menu`.
   - UMKM bar items: `Home`, `Agents`, `Inbox`, `Sales`, `Menu`.
   - Main content viewport padding offset (`pb-20 md:pb-6`) preventing content overlap.

---

## 20.5 Official Production Domain Standardization

All API endpoints, cURL code playgrounds, SDK initialization examples, and documentation URLs across the monorepo have been standardized to the official production domain:

- **Official Web Domain**: `https://zegaai.site`
- **Official API Gateway**: `https://api.zegaai.site`
- **Cloudflare CDN Storage**: `https://cdn.zegaai.site`
- **Official Support Email**: `support@zegaai.site`

---

## 20.6 Verification & Build Stability

The implementation has been verified for build compliance using Turborepo pipeline compilation:

```bash
pnpm --filter @zega/web build
```

All 18 Enterprise views, 14 UMKM views, and SuperAdmin modules compile cleanly with zero TypeScript errors or layout shifts.
