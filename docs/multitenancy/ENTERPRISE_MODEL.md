# Enterprise Platform & Governance Architecture Model

## 1. Domain B Overview

Enterprise tenants require multi-level organizational hierarchies, fine-grained access control, deployment isolation, audit logging, and compliance integrations.

```
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

## 2. Table Scope Standardization (`org_id` -> `organization_id`)

Legacy enterprise tables utilized `org_id` as the tenant column name, causing schema ambiguity with UMKM tables (`organization_id`). Under the target model:

1. All enterprise tables are migrated to use `organization_id` as the standard foreign key column.
2. 54 enterprise tables currently lacking tenant columns (e.g., `enterprise_team_members`, `enterprise_finops_categories`, `enterprise_mcp_servers`, `enterprise_knowledge_collections`, `enterprise_support_tickets`) are assigned explicit ownership (`organization_id` or `workspace_id`) or reclassified as `GLOBAL` system catalogs.

## 3. Fine-Grained RBAC / ABAC Framework

Role-Based Access Control (RBAC) is enforced at the API and database levels using permission strings attached to `organization_memberships`.

### Sample RBAC Matrix
| Role | Financial Reports | System Settings | Knowledge Base | AI Agent Executions | Break-Glass Access |
|---|---|---|---|---|---|
| Enterprise Owner | Admin | Admin | Admin | Admin | Request Only |
| Financial Auditor | Read Only | None | None | None | None |
| Knowledge Manager | None | None | Admin | Read Only | None |
| Staff Member | None | None | Read Only | Execute | None |

Attribute-Based Access Control (ABAC) rules evaluate environmental attributes:
- Allowed IP Ranges (`ip_whitelist`)
- Time Window Constraints (`access_hours`)
- Data Sensitivity Classifications (`PII_LEVEL_3`, `FINANCIAL_CONFIDENTIAL`)
