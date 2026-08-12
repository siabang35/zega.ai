# Model Context Protocol (MCP) Multi-Tenant Security Architecture

## 1. Catalog vs Customer Connector Separation

MCP tables in ZEGA are strictly bifurcated:

1. **Global MCP Catalog** (`enterprise_mcp_catalog`, `enterprise_mcp_tools`): Contains metadata for public/standard integrations. Intentionally readable, but strictly read-only for non-superadmin users.
2. **Customer Connected MCP** (`enterprise_mcp_servers`, `enterprise_mcp_connectors`, `enterprise_mcp_configs`, `enterprise_mcp_logs`, `enterprise_mcp_activities`): Contains active tenant integrations, API tokens, webhooks, and execution logs. MUST be strictly scoped to `organization_id`.

## 2. MCP Credential Protection

- MCP API keys and OAuth tokens are stored encrypted using AES-256-GCM in `enterprise_mcp_configs`.
- Invocations of MCP tools require verification that `connector.organization_id == serverTenantContext.organizationId`.
