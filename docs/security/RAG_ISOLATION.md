# RAG & Vector Search Multi-Tenant Isolation Security Architecture

## 1. Vector Search Security Rule

> [!CAUTION]
> **NEVER Global Vector Search then Filter in Application Memory**: Querying an un-partitioned vector index and post-filtering results in application code introduces extreme RAG cross-tenant leakage vulnerability. Metadata-level tenant filtering MUST occur at the retrieval boundary inside the vector engine.

## 2. Namespace & Metadata Filtering Architecture

Every document, chunk, vector embedding, and collection record stored in `pgvector` or external vector databases MUST include:
- `organization_id`
- `workspace_id`

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
