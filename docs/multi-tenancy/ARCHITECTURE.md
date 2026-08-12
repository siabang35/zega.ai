# ZEGA.AI Multi-Tenant Enterprise Architecture

## Architecture Overview
ZEGA.AI enforces structural multi-tenant data isolation across UMKM, Enterprise, and Superadmin domains.

### Canonical Hierarchy
User -> Organization Membership -> Organization -> Workspace -> Business Resource

### Platform Models
- **UMKM**: Shared cloud infrastructure with logical Organization/Workspace isolation.
- **ENTERPRISE**: Dedicated/Managed cloud or on-premise infrastructure with full organizational RBAC.
- **SUPERADMIN**: ZEGA Control Plane managing platform telemetry, tenant registries, and licenses. Privileged support access to tenant data requires time-limited approval.
