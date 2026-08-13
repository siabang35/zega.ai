# Canonical Tenancy Architecture & Isolation Model

## 1. Tenancy Hierarchy & Invariants

The canonical model for multi-tenancy across all ZEGA domains is defined as:

```text
User (Identity)
  └── Organization Membership (Role & Permissions)
       └── Organization (Canonical Security & Isolation Boundary: organization_id)
            └── Workspace (Sub-Scope Isolation Boundary: workspace_id)
                 └── Business Unit / Store (Business Structural Entity: store_id)
                      └── Resource (Entity owned by Organization & Workspace)
```

### Mandatory Tenancy Invariants
1. **Authoritative Boundary**: `organization_id` is the primary tenant ownership boundary.
2. **Sub-Scope Boundary**: `workspace_id` provides scope isolation within an organization.
3. **Business Structure**: `store_id` represents a physical or digital branch entity. `store_id` is NEVER treated as sole tenant authority.
4. **No Dual Tenancy Authority**: Tables MUST NOT rely on conflicting or un-reconciled combinations of `store_id`, `organization_id`, `org_id`, and `user_id`.

---

## 2. Store Reconciliation Strategy

In legacy components of ZEGA, 125 tables used `store_id` without an accompanying `organization_id`. The reconciliation framework maps every legacy `store_id` to its canonical tenant lineage:

$$\text{legacy\_store\_id} \longrightarrow \text{organization\_id} + \text{workspace\_id} + \text{store\_unit\_id}$$

```sql
-- Store Reconciliation Schema Mapping
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
```

---

## 3. Server-Side Context Enforcement

Client applications (web, mobile, integrations) send authentication tokens and requested tenant headers (`X-Organization-Id`, `X-Workspace-Id`). The backend application middleware resolves context strictly via database-verified memberships:

```typescript
export async function resolveTenantContext(
  req: Request,
  db: SupabaseClient
): Promise<ServerTenantContext> {
  const userId = extractAuthenticatedUser(req);
  const reqOrgId = req.headers.get('x-organization-id');
  const reqWsId = req.headers.get('x-workspace-id');

  // Verify membership in DB
  const { data: membership, error } = await db
    .from('organization_memberships')
    .select('id, organization_id, role_id, status')
    .eq('user_id', userId)
    .eq('organization_id', reqOrgId)
    .single();

  if (error || !membership || membership.status !== 'ACTIVE') {
    throw new SecurityException('INVALID_TENANT_MEMBERSHIP', 403);
  }

  // Validate workspace boundary
  if (reqWsId) {
    const { data: ws } = await db
      .from('workspaces')
      .select('id')
      .eq('id', reqWsId)
      .eq('organization_id', reqOrgId)
      .single();

    if (!ws) throw new SecurityException('WORKSPACE_TENANT_MISMATCH', 403);
  }

  return {
    userId,
    organizationId: membership.organization_id,
    workspaceId: reqWsId || DEFAULT_WORKSPACE,
    membershipId: membership.id,
    tenantType: 'UMKM',
    role: membership.role_id,
    permissions: await fetchRolePermissions(membership.role_id)
  };
}
```

---

## 4. UMKM Shared SaaS Tenancy Architecture

The UMKM platform is a shared multi-tenant SaaS application serving Indonesian Small-to-Medium Enterprises (Usaha Mikro, Kecil, dan Menengah). 

- **Tenant Isolation Strategy**: Logical isolation in a shared database schema using PostgreSQL Row Level Security (RLS) and mandatory `organization_id` foreign keys.
- **Resource Ownership Scope**: All products, sales, customers, invoices, inventory, chats, AI agent configurations, and marketing campaigns are strictly scoped to an `organization_id`.

### Shared Infrastructure Safeguards (Noisy Neighbor Protection)
- **API Rate Limiting**: Max 500 requests / minute per `organization_id`.
- **Database Connection Limits**: Tenant-aware query timeouts set to 5000ms.
- **AI Token Quotas**: Daily token budgets tracked per `organization_id` in Redis.

---

## 5. Enterprise Multi-Level Governance Architecture

Enterprise tenants require multi-level organizational hierarchies, fine-grained access control, deployment isolation, audit logging, and compliance integrations.

```text
Enterprise Organization (e.g., Global Retail Corp)
├── Departments:
│   ├── Finance & Accounting
│   ├── Sales & Marketing
│   └── Logistics & Operations
├── Workspaces:
│   ├── Production EU (workspace_eu_prod)
│   └── Staging APAC (workspace_apac_stage)
└── Governance:
    ├── Custom Roles (e.g., Financial Auditor, Regional Store Manager)
    ├── SAML SSO & SCIM Provisioning
    └── Dedicated Cloud Deployment (deployment_dep_987)
```

### Table Scope Standardization (`org_id` -> `organization_id`)
All enterprise tables are migrated to use `organization_id` as the standard foreign key column. Enterprise tables lacking tenant columns are assigned explicit ownership (`organization_id` or `workspace_id`) or reclassified as `GLOBAL` system catalogs.

---

## 6. Superadmin Control Plane Architecture & Security Model

Superadmin is ZEGA's internal control-plane identity. It is responsible for platform monitoring, tenant provisioning, system health, license enforcement, and security oversight.

> [!WARNING]
> **Superadmin Identity Boundary**: Superadmin is NOT a tenant. Superadmin credentials do NOT grant blanket bypass access to customer data plane tables (invoices, knowledge chats, customer records, AI execution histories).

```text
Superadmin Control Plane Identity
├── Platform Observability (Metrics, Health, Threat Logs)
├── Tenant Registry & Licensing (Billing Metadata, Deployment Configurations)
└── Break-Glass Support Access System (Time-Bounded, Audited, MFA-Enforced)
```

### Break-Glass Customer Data Access Control
When a ZEGA support engineer requires access to investigate a tenant-reported production issue:
1. **Request Creation**: Engineer submits a `break_glass_request` specifying target `organization_id`, justification, ticket reference, and duration (max 120 minutes).
2. **Approval & Verification**: Requires dual-factor approval by a Security Admin and automatic notification to the customer enterprise security team.
3. **Audit Trail**: Every SQL query and API call executed under an active break-glass session is recorded to `platform_break_glass_access_logs` with cryptographically signed hashes.

```sql
CREATE TABLE public.platform_break_glass_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES public.users(id),
  target_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  reason TEXT NOT NULL,
  ticket_ref TEXT NOT NULL,
  query_text TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  signature TEXT NOT NULL
);
```
