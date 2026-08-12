# Superadmin Control Plane Architecture & Security Model

## 1. Domain C Overview

Superadmin is ZEGA's internal control-plane identity. It is responsible for platform monitoring, tenant provisioning, system health, license enforcement, and security oversight.

> [!WARNING]
> **Superadmin Identity Boundary**: Superadmin is NOT a tenant. Superadmin credentials do NOT grant blanket bypass access to customer data plane tables (invoices, knowledge chats, customer records, AI execution histories).

```
Superadmin Control Plane Identity
├── Platform Observability (Metrics, Health, Threat Logs)
├── Tenant Registry & Licensing (Billing Metadata, Deployment Configurations)
└── Break-Glass Support Access System (Time-Bounded, Audited, MFA-Enforced)
```

## 2. Platform KPI Materialization Rules

Legacy database contains tables like `superadmin_platform_kpis` and `superadmin_tenant_registry`.
Under the canonical architecture:
- Platform metrics MUST be calculated programmatically from authoritative backend control-plane aggregations.
- No direct insertion of fake/mock metrics into control-plane tables is permitted in production environments.

## 3. Break-Glass Customer Data Access Control

When a ZEGA support engineer requires access to investigate a tenant-reported production issue:

1. **Request Creation**: Engineer submits a `break_glass_request` specifying target `organization_id`, justification, ticket reference, and required duration (max 120 minutes).
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
