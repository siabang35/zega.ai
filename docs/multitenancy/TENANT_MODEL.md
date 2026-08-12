# Canonical Tenancy Architecture & Isolation Model

## 1. Tenancy Hierarchy

The canonical model for multi-tenancy across all ZEGA domains is defined as:

```
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

## 2. Store Reconciliation Strategy

In legacy components of ZEGA, 125 tables used `store_id` without an accompanying `organization_id`. The reconciliation framework maps every legacy `store_id` to its canonical tenant lineage:

$$\text{legacy\_store\_id} \longrightarrow \text{organization\_id} + \text{workspace\_id} + \text{store\_unit\_id}$$

```sql
-- Store Reconciliation Schema Mapping
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);
```

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
