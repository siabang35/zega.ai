# Fine-Grained Role-Based Access Control (RBAC) Architecture

## 1. System Roles Hierarchy

ZEGA.AI defines canonical roles across UMKM and Enterprise organization memberships:

```
[ Organization Owner ] ── supreme administrative authority
    ├── [ Organization Admin ] ── operational administration
    │     ├── [ Manager ] ── team & business unit supervisor
    │     │     └── [ Staff ] ── standard operational user
    │     └── [ Auditor ] ── read-only compliance supervisor
    └── [ Guest / External ] ── restricted interaction scope
```

## 2. Granular Permissions Registry

| Permission Key | Description | Allowed Roles |
|---|---|---|
| `org:manage_settings` | Modify organization profile, security, billing | Owner |
| `org:manage_members` | Invite/remove members, assign roles | Owner, Admin |
| `workspace:create` | Create new operational workspaces | Owner, Admin |
| `finance:view` | Access financial reports, metrics, invoices | Owner, Admin, Auditor |
| `finance:transact` | Initiate sales transactions, billing edits | Owner, Admin, Manager |
| `ai:configure` | Configure custom AI agents, swarms, prompts | Owner, Admin |
| `ai:execute` | Execute AI workflows and interactive chats | Owner, Admin, Manager, Staff |
| `mcp:manage` | Install and configure MCP server tools | Owner, Admin |
| `breakglass:request` | Request emergency break-glass data access | Superadmin Security Role |
