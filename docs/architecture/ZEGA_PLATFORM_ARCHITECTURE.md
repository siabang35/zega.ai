# ZEGA Platform Architecture & Domain Boundaries

## 1. Executive Architecture Summary

ZEGA.AI is an AI-native enterprise platform structured around three distinct, decoupled security and operational domains:

1. **DOMAIN A: UMKM Platform** — Shared multi-tenant SaaS for small-to-medium enterprises with organization-scoped boundaries.
2. **DOMAIN B: Enterprise Platform** — High-governance multi-tenant and dedicated platform supporting custom RBAC/ABAC, workspace hierarchies, SSO/SCIM, and fine-grained resource policy controls.
3. **DOMAIN C: Superadmin / Control Plane** — Internal ZEGA administrative control-plane for infrastructure, tenant registry, telemetry, and security oversight, strictly prohibited from direct customer data plane access.

```text
+-----------------------------------------------------------------------------------+
|                            ZEGA CONTROL PLANE (SUPERADMIN)                         |
|   Tenant Registry | Deployment Registry | System Health | Break-Glass Audit       |
+-----------------------------------------------------------------------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
+-------------------------------+               +-------------------------------+
|     DOMAIN A: UMKM SAAS       |               |     DOMAIN B: ENTERPRISE      |
| Shared Multi-Tenant Infra     |               | Dedicated / Hybrid / Cloud    |
| Org -> Workspace -> Business  |               | Org -> Dept -> Team -> WS     |
+-------------------------------+               +-------------------------------+
```

---

## 2. Monorepo Workspace Structure & Deployment Architecture

ZEGA AI uses an enterprise-grade monorepo architecture built with **pnpm workspaces** and **Turborepo** build orchestration:

```text
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
├── docs/                        # Complete PRD & Architectural Documentation
├── vercel.json                  # Monorepo Vercel Deployment Configuration
├── turbo.json                   # Pipeline Configuration
└── pnpm-workspace.yaml          # Monorepo Workspace Definitions
```

---

## 3. Platform Domains & Security Boundaries

### Domain A: UMKM Shared SaaS
- **Multi-Tenancy Hierarchy**: `User -> Organization Membership -> Organization -> Workspace -> Business Unit / Store -> Resource`.
- **Authoritative Identifier**: `organization_id`.
- **Sub-Scope Identifier**: `workspace_id`.
- **Business Unit Identifier**: `store_id` (represents branch/location, NEVER sole tenant authority).

### Domain B: Enterprise Governance Platform
- **Governance Hierarchy**: `Organization -> Department -> Workspace -> Team -> Project -> Environment -> Resource`.
- **Authentication**: SAML 2.0 / OIDC SSO, mandatory MFA, automated SCIM provisioning.
- **Authorization**: Fine-grained RBAC with optional ABAC conditions (IP ranges, time-windows, classification tags).
- **Deployment Topologies**: `SHARED_CLOUD`, `DEDICATED_CLOUD`, `CUSTOMER_MANAGED`, `ON_PREMISE`.

### Domain C: Superadmin Control Plane
- **Role**: Platform management, telemetry, billing metadata, infrastructure health monitoring.
- **Data Isolation Rules**: Superadmin accounts possess ZERO automatic access to customer data plane records. Customer data inspection requires explicit, audited **Break-Glass** activation.

---

## 4. Canonical Tenant Context Architecture

Every backend request, API invocation, worker job execution, and AI prompt context MUST derive identity from a verified, server-side `TenantContext`:

```typescript
export interface ServerTenantContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly membershipId: string;
  readonly tenantType: 'UMKM' | 'ENTERPRISE';
  readonly deploymentId: string;
  readonly role: string;
  readonly permissions: ReadonlySet<string>;
  readonly isSuperadmin: boolean;
  readonly isBreakGlassActive: boolean;
}
```

### Context Derivation Hierarchy
1. **Authentication Token**: Extract `auth_user_id` from cryptographically signed JWT / Privy session.
2. **Membership Resolution**: Lookup `organization_memberships` table for valid `(user_id, organization_id)` association.
3. **Workspace Validation**: Confirm target `workspace_id` belongs to resolved `organization_id`.
4. **Header Validation**: If request header `X-Organization-Id` or `X-Workspace-Id` is provided, backend MUST verify user membership before accepting context.
