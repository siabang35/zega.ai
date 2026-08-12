# ZEGA Platform Architecture & Domain Boundaries

## Executive Architecture Summary

ZEGA.AI is an AI-native enterprise platform structured around three distinct, decoupled security and operational domains:

1. **DOMAIN A: UMKM Platform** — Shared multi-tenant SaaS for small-to-medium enterprises with organization-scoped boundaries.
2. **DOMAIN B: Enterprise Platform** — High-governance multi-tenant and dedicated platform supporting custom RBAC/ABAC, workspace hierarchies, SSO/SCIM, and fine-grained resource policy controls.
3. **DOMAIN C: Superadmin / Control Plane** — Internal ZEGA administrative control-plane for infrastructure, tenant registry, telemetry, and security oversight, strictly prohibited from direct customer data plane access.

```
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

## Platform Domains & Security Boundaries

### 1. Domain A: UMKM Shared SaaS

- **Multi-Tenancy Hierarchy**: `User -> Organization Membership -> Organization -> Workspace -> Business Unit / Store -> Resource`.
- **Authoritative Identifier**: `organization_id`.
- **Sub-Scope Identifier**: `workspace_id`.
- **Business Unit Identifier**: `store_id` (represents branch/location, NEVER sole tenant authority).
- **Security Principle**: `user_id != tenant_id`. One organization contains multiple users with distinct roles (Owner, Admin, Manager, Staff, Viewer).

### 2. Domain B: Enterprise Governance Platform

- **Governance Hierarchy**: `Organization -> Department -> Workspace -> Team -> Project -> Environment -> Resource`.
- **Authentication**: SAML 2.0 / OIDC SSO, mandatory MFA, automated SCIM provisioning.
- **Authorization**: Fine-grained RBAC with optional ABAC conditions (IP ranges, time-windows, classification tags).
- **Deployment Topologies**:
  - `SHARED_CLOUD` (Logical isolation via RLS and tenant-aware routing)
  - `DEDICATED_CLOUD` (Isolated database/compute instance per enterprise)
  - `CUSTOMER_MANAGED` (Customer AWS/GCP/Azure tenant deployment)
  - `ON_PREMISE` (Self-hosted air-gapped enterprise execution node)

### 3. Domain C: Superadmin Control Plane

- **Role**: Platform management, telemetry, billing metadata, infrastructure health monitoring.
- **Data Isolation Rules**:
  - Superadmin accounts possess ZERO automatic access to customer data plane records (invoices, knowledge, chats, customer lists).
  - Customer data inspection requires explicit, audited **Break-Glass** activation (time-bounded, MFA-verified, customer-notified).

## Canonical Tenant Context Architecture

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
4. **Header Validation**: If request header `X-Organization-Id` or `X-Workspace-Id` is provided, backend MUST verify user membership before accepting context. NEVER blindly copy client headers into query parameters.
