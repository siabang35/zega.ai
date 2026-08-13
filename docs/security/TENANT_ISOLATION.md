# Multi-Layer Tenant Isolation Security Architecture

## 1. Defense-in-Depth Principle

Multi-tenancy security in ZEGA.AI is never entrusted to a single defense mechanism (such as application-layer `WHERE` clauses). It is enforced across 14 independent infrastructural layers:

```text
[ Client Request ]
       │
       ▼
 1. Identity & Auth (Privy JWT / Session Verification)
       │
       ▼
 2. Server Membership Resolution (DB-validated organization_memberships)
       │
       ▼
 3. API Middleware Authorization (RBAC Permission Checks)
       │
       ▼
 4. Application Query Scoping (Mandatory organization_id parameters)
       │
       ▼
 5. Database RLS Policies (PostgreSQL row-level isolation)
       │
       ▼
 6. Composite Foreign Key Constraints (Cross-tenant reference blocking)
       │
       ▼
 7. Cache Keyspace Namespacing (org:{organization_id}:...)
       │
       ▼
 8. Worker Job Validation (Payload vs DB ownership check)
       │
       ▼
 9. AI Agent Context Boundaries (Strict system prompt injection of tenant scope)
       │
       ▼
10. RAG Vector Namespacing (Pinecone/pgvector tenant filter constraints)
       │
       ▼
11. MCP Connector Isolation (Encrypted tenant connector credentials)
       │
       ▼
12. Storage Path Namespacing (organizations/{organization_id}/...)
       │
       ▼
13. Audit & Anomaly Detection (Real-time cross-tenant attempt logging)
       │
       ▼
[ Data Access ]
```

---

## 2. Invariant Security Enforcement Rules

1. **Zero Client Trust**: Frontend-supplied `organization_id` or `workspace_id` parameters are treated as untrusted hints. The backend MUST independently verify user membership before executing queries.
2. **Database Level Guarantee**: If application middleware is bypassed or flawed, database RLS policies MUST block cross-tenant read/write operations.
3. **No Dual Authority**: The system recognizes `organization_id` as the sole canonical tenant isolation authority.

---

## 3. Cache Isolation & Key Namespacing Standard

> [!WARNING]
> **Global Cache Key Risk**: Storing tenant-owned records under generic cache keys such as `product:123` or `customer:456` risks cross-tenant cache contamination if key collisions occur across organizations.

All Redis keys and memory cache items containing tenant-owned data MUST follow the mandatory pattern:

$$\text{org:\{organization\_id\}:ws:\{workspace\_id\}:\{entity\}:\{id\}}$$

```typescript
// Standard Tenant Cache Key Generator
export function getTenantCacheKey(
  orgId: string,
  wsId: string,
  entity: string,
  id: string
): string {
  return `org:${orgId}:ws:${wsId}:${entity}:${id}`;
}
```

---

## 4. Cloud Storage & CDN Path Isolation Standard

All files uploaded by tenants (invoices, logos, avatars, reports, PDFs, dataset attachments) MUST be stored under physically isolated storage key prefixes:

$$\text{organizations/\{organization\_id\}/workspaces/\{workspace\_id\}/\{category\}/\{file\_id\}}$$

### Direct Object Path Prevention & Signed Access
- Clients are strictly forbidden from passing arbitrary object storage keys to file retrieval endpoints.
- Private files require server-side generation of short-lived HMAC-signed URLs (expiration max 15 minutes) after validating user organization membership.

---

## 5. RAG & Vector Search Isolation Security Architecture

> [!CAUTION]
> **NEVER Global Vector Search then Filter in Application Memory**: Querying an un-partitioned vector index and post-filtering results in application code introduces extreme RAG cross-tenant leakage vulnerability. Metadata-level tenant filtering MUST occur at the retrieval boundary inside the vector engine.

Every document, chunk, vector embedding, and collection record stored in `pgvector` or external vector databases MUST include `organization_id` and `workspace_id`.

```typescript
// Querying Vector Engine with Strict Tenant Namespace Constraint
const vectorResults = await vectorStore.query({
  vector: queryEmbedding,
  topK: 10,
  filter: {
    organization_id: { $eq: context.organizationId },
    workspace_id: { $eq: context.workspaceId }
  }
});
```

---

## 6. AI Agent Context, Memory & Sandbox Isolation

> [!IMPORTANT]
> **AI Must NEVER Determine Tenant Scope**: AI agents, swarms, LLMs, and prompt engine components are untrusted context interpreters. The AI engine MUST NOT independently infer or decide tenant scope. All memory queries, execution parameters, and vector lookups are explicitly scoped by the server runtime before calling model endpoints.

### AI Memory Store Architecture (`umkm_ai_memory_entries` & `zeroclaw_memory_nodes`)
Every AI memory entry MUST preserve structural ownership fields (`organization_id`, `workspace_id`). Memory retrieval queries MUST enforce `.eq('organization_id', context.organizationId)` and `.eq('workspace_id', context.workspaceId)`.

### Sandbox Execution Security (`sandbox_executions`)
Every execution environment MUST inherit `organization_id` and `workspace_id`. Code executed within sandbox runtimes operates in isolated containers with zero access to filesystem directories of other tenants or local database credentials.

---

## 7. Model Context Protocol (MCP) Multi-Tenant Security

### Catalog vs Customer Connector Separation
1. **Global MCP Catalog** (`enterprise_mcp_catalog`, `enterprise_mcp_tools`): Contains metadata for public/standard integrations. Intentionally readable, but strictly read-only for non-superadmin users.
2. **Customer Connected MCP** (`enterprise_mcp_servers`, `enterprise_mcp_connectors`, `enterprise_mcp_configs`, `enterprise_mcp_logs`): Contains active tenant integrations, API tokens, webhooks, and execution logs. MUST be strictly scoped to `organization_id`.

### MCP Credential Protection
- MCP API keys and OAuth tokens are stored encrypted using AES-256-GCM in `enterprise_mcp_configs`.
- Invocations of MCP tools require verification that `connector.organization_id == serverTenantContext.organizationId`.
