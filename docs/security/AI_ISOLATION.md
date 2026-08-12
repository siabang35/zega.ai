# AI Agent Context, Memory & Sandbox Security Architecture

## 1. Fundamental Principle of AI Tenancy

> [!IMPORTANT]
> **AI Must NEVER Determine Tenant Scope**: AI agents, swarms, LLMs, and prompt engine components are untrusted context interpreters. The AI engine MUST NOT independently infer or decide tenant scope. All memory queries, execution parameters, and vector lookups are explicitly scoped by the server runtime before calling model endpoints.

## 2. AI Memory Store Architecture (`umkm_ai_memory_entries` & `zeroclaw_memory_nodes`)

Every AI memory entry MUST preserve structural ownership fields:

```sql
CREATE TABLE public.umkm_ai_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  agent_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id),
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Isolation Invariants
- Memory retrieval queries MUST include `.eq('organization_id', context.organizationId)` and `.eq('workspace_id', context.workspaceId)`.
- No cross-tenant memory sharing between AI swarms.

## 3. Sandbox Execution Security (`sandbox_executions`)

Legacy table `sandbox_executions` contained `user_id` without `organization_id`. Under the hardened architecture:
- Every execution environment MUST inherit `organization_id` and `workspace_id`.
- Code executed within sandbox runtimes operates in isolated containers with zero access to filesystem directories of other tenants, external network endpoints (unless whitelisted), or local database credentials.
