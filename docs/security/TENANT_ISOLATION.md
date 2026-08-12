# Multi-Layer Tenant Isolation Security Architecture

## 1. Defense-in-Depth Principle

Multi-tenancy security in ZEGA.AI is never entrusted to a single defense mechanism (such as application-layer `WHERE` clauses). It is enforced across 14 independent infrastructural layers:

```
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

## 2. Invariant Security Enforcement Rules

1. **Zero Client Trust**: Frontend-supplied `organization_id` or `workspace_id` parameters are treated as untrusted hints. The backend MUST independently verify user membership before executing queries.
2. **Database Level Guarantee**: If application middleware is bypassed or flawed, database RLS policies MUST block cross-tenant read/write operations.
3. **No Dual Authority**: The system recognizes `organization_id` as the sole canonical tenant isolation authority.
