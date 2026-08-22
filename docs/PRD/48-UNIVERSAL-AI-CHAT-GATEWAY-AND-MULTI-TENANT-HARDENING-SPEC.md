# PRD 48: Universal AI Chat Gateway — Production Multi-Tenant Security, Realtime Swarm Orchestration & Empirical Grounding Specification

## 1. Executive Summary

This specification documents the technical architecture, security guards, multi-tenant RLS isolation boundaries, and empirical data grounding system for the **Universal AI Chat Gateway** in ZEGA AI. The gateway serves as a unified conversational interface connecting 6 domain swarms (`inventory`, `sales`, `product`, `demand`, `procurement`, `operations`) with zero-trust multi-tenant isolation, real-time database grounding, and zero reasoning leakage.

---

## 2. Empirical Database Architecture (`supabase/migrations/`)

### 2.1 Core Relational Schema (`20260824000000_universal_ai_chat_and_rls_hardening.sql`)
The chat gateway persistence engine relies on 3 core database tables:

1. **`public.ai_chat_sessions`**:
   - Stores session records indexed by `id` (UUID), `store_id`, `organization_id`, `user_id`, `title`, and `created_at` / `updated_at`.
2. **`public.ai_chat_messages`**:
   - Stores granular chat messages with fields: `id` (UUID), `session_id`, `swarm_id`, `organization_id`, `store_id`, `user_id`, `sender_type` (`USER` / `SWARM`), `sender_name`, `content`, `structured_payload` (JSONB), `agent_activity` (JSONB), `requires_confirmation` (BOOLEAN), `pending_mutation` (JSONB), `created_at`.
3. **`public.umkm_settings_ai_preferences`**:
   - Authoritative source for store-specific AI behavior: `store_id`, `organization_id`, `default_language` (`id` / `en` / `zh`), `response_style` (`Professional`, `Friendly`, `Direct`), `response_length` (`Short`, `Medium`, `Detailed`), `response_format` (`Structured`, `Bullet`, `Paragraph`), `default_model`.

### 2.2 Row-Level Security (RLS) & Multi-Tenant Boundaries
All tables enforce strict PostgreSQL RLS policies to guarantee zero cross-tenant data leakage:
```sql
CREATE POLICY "Tenant Members View AI Sessions" ON ai_chat_sessions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Tenant Members Delete AI Sessions" ON ai_chat_sessions
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );
```

---

## 3. Backend Route Architecture & Security Controls (`apps/api/src/routes/v1/universalChat.routes.ts`)

### 3.1 REST Endpoint Matrix

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/v1/umkm/ai-chat/messages` | `requireTenantContext` + Rate Limited (30/min) | Processes natural language prompts via `UniversalChatOrchestrator`. Accepts `x-zega-ai-language` header. |
| `POST` | `/v1/umkm/ai-chat/mutations/confirm` | `requireTenantContext` + Write Confirmation Token | Executes user-approved data mutations (`UPDATE_STOCK`, `CREATE_RESTOCK_PLAN`, `CREATE_PURCHASE_REQUEST`). |
| `GET` | `/v1/umkm/ai-chat/sessions` | `requireTenantContext` + `read` | Lists historical chat sessions scoped strictly by `store_id` or `user_id`. |
| `GET` | `/v1/umkm/ai-chat/sessions/:id/messages` | `requireTenantContext` + `read` | Returns message history for a specific chat session with tenant validation. |
| `DELETE` | `/v1/umkm/ai-chat/sessions/:id` | `requireTenantContext` + Ownership Check | Deletes a single chat session and cascades deleting associated messages. Handles body-less DELETE. |
| `DELETE` | `/v1/umkm/ai-chat/sessions` | `requireTenantContext` + Ownership Check | Bulk clears all chat history for the authenticated tenant. |

### 3.2 CORS & Request Parsing Security (`apps/api/src/plugins/index.ts`)
- **CORS Whitelist Header**: Added `x-zega-ai-language` to `ZEGA_ALLOWED_HEADERS` to permit language preference headers during browser preflight requests.
- **Empty Body Handling**: Configured global error handling for Fastify `FST_ERR_CTP_EMPTY_JSON_BODY` to ensure body-less HTTP `DELETE` requests complete with HTTP 200 without throwing 500 errors.

---

## 4. Universal Multi-Swarm Orchestrator (`apps/api/src/services/ai/`)

### 4.1 Orchestration Workflow (`UniversalChatOrchestrator.ts`)

```
User Prompt ➔ Zero-Trust Input Sanitizer ➔ Intent Classifier ➔ Swarm Capability Resolver ➔ Parallel Domain Tool Executions ➔ Empirical Grounding Filter ➔ 9-Model AI Router Synthesis ➔ Response Transmission
```

1. **Zero-Trust Input Sanitization**: Neutrals prompt injection attack vectors and strips control characters via `sanitizePrompt()`.
2. **Server-Side Tenant Resolution**: Injects `storeId`, `organizationId`, and `userId` derived exclusively from server JWT (`resolveServerSideTenantGraph`). The LLM is **never** the security or tenant authorization boundary.
3. **Multi-Domain Swarm Dispatch**: Maps keywords to required capabilities (`OPERATIONS_MONITORING`, `INVENTORY_READ`, `SALES_ANALYTICS`, `DEMAND_FORECASTING`, `PROCUREMENT_REORDER`).
4. **Realtime Domain Execution**: Invokes tools in parallel via `Promise.allSettled`:
   - `operations.store_overview` (`universalSwarmTools.ts`)
   - `inventory.get_stock_metrics` (`inventoryTools.ts`)
   - `sales.summary` (`universalSwarmTools.ts`)
   - `product.catalog_summary` (`universalSwarmTools.ts`)
   - `procurement.reorder_recommendations` (`universalSwarmTools.ts`)
5. **Zero-Data Grounding Rule**: When database tables contain 0 records (e.g. 0 products for new stores), the system prompt mandates reporting **0 SKU** explicitly, prohibiting hallucination of sample data counts.
6. **Zero Reasoning Leakage**: Server-side and client-side sanitizers (`stripThinkingProcess`) purge internal chain-of-thought (`<think>` tags, numbered CoT steps) before client delivery.

---

## 5. Implementation Evidence & Real-World Database Verification

### 5.1 Verification Script Audit (`apps/api/src/scripts/inspect_user_real.ts`)
Direct database inspection against live Supabase instance confirmed empirical isolation:

```
=== REAL DB INSPECTION FOR coacole9@gmail.com ===

1. Users table record: null
2. UMKM User Profiles: [
  {
    id: 'ea9cf89b-c0cc-4d7d-8d67-2db20f93fdca',
    email: 'coacole9@gmail.com',
    store_id: '67b89f6f-c940-4a0b-b705-8e3e08cf1d80',
    account_id: '04a2920e-7a52-4f2f-a4a4-347e77ae2023',
    store_name: 'Cole Coa'
  }
]

3. Target Store ID: 67b89f6f-c940-4a0b-b705-8e3e08cf1d80
4. Products in Database for Store ID (67b89f6f-c940-4a0b-b705-8e3e08cf1d80):
   - TOTAL PRODUCTS COUNT: 0
   - RESULT: 0 PRODUCTS FOUND (EMPIRICAL DATABASE GROUND TRUTH: 0 PRODUCTS)
```

---

## 6. Frontend Integration & Subview UI/UX (`apps/web/src/app/dashboard/`)

- **Sub-Navigation Tab Integration**: The AI Chatbot is integrated directly as a primary sub-navigation view in `StoreHeaderShell.tsx` and `StoreView.tsx`.
- **Responsive Layout**: Designed with a clean split-panel desktop chat workspace and mobile responsive sheet view.
- **Language Preference Sync**: `supabaseService.ts` extracts `default_language` from `umkm_settings_ai_preferences` and transmits it via `x-zega-ai-language` header on every chat request.
- **Session History Controls**: Offers session switching, single session deletion, and one-click history purge with optimistic state updates.
