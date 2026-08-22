# PRD 47: ZEGA AI Inventory Swarm — Production Security, Multi-Tenant Isolation & Orchestration Specification

## 1. Executive Summary

This document specifies the technical architecture, security implementation, and orchestration pipeline for the **AI Inventory Auto-Stock Swarm** feature inside ZEGA AI. The implementation allows retail and UMKM merchants to deploy an autonomous workforce of specialized AI agents for monitoring inventory, detecting low stock, analyzing sales velocity, forecasting demand, recommending reorders, and reporting inventory metrics.

---

## 2. Empirical Database Architecture (`supabase/migrations/`)

### 2.1 Core Relational Schema (`20260823000000_ai_inventory_swarm_infrastructure.sql`)
The swarm infrastructure consists of 5 relational database tables linked via UUID foreign keys:

1. **`public.ai_swarms`**: Stores top-level swarm metadata, multi-tenant owner references (`store_id`, `organization_id`), operational status (`ACTIVE`, `PAUSED`, `DECOMMISSIONED`), and configuration JSON.
2. **`public.ai_swarm_agents`**: Stores individual specialized agent worker profiles linked to a swarm, including role, status, model ID (e.g. `groq/llama-3.3-70b-versatile`, `google/gemini-2.5-flash`), authority level (`READ_ONLY`, `WRITE_WITH_APPROVAL`, `FULL_AUTONOMOUS`), system prompts, and execution priority.
3. **`public.ai_swarm_skills`**: Maps capabilities (`inventory.read`, `inventory.monitor`, `inventory.forecast`, `inventory.detect_low_stock`, `inventory.detect_dead_stock`, `inventory.reorder_recommendation`) to specific agents.
4. **`public.ai_swarm_executions`**: Tracks swarm run instances, execution triggers (`MANUAL`, `SCHEDULED`, `WEBHOOK`), input prompts, status (`RUNNING`, `COMPLETED`, `FAILED`), and executive summary reports.
5. **`public.ai_swarm_execution_steps`**: Stores fine-grained step-by-step reasoning logs, tool calls, tool results, and token/latency telemetry per agent execution step.

### 2.2 Row-Level Security & Audit Logging (`20260823100000_harden_ai_swarm_rls_and_audit.sql`)
All 5 swarm tables enforce strict multi-tenant Row-Level Security (RLS). Access is restricted via explicit subqueries against `public.organization_members`:

- **RLS Predicate**:
  ```sql
  CREATE POLICY "Tenant Members View Swarms" ON ai_swarms
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    );
  ```
- **Audit Logging Table (`public.ai_swarm_audit_logs`)**:
  Stores non-blocking operational audit trail records for all swarm mutations (`DEPLOY_SWARM`, `EXECUTE_SWARM`, `UPDATE_SWARM_STATUS`, `DELETE_SWARM`) with fields: `id`, `swarm_id`, `tenant_id` (`organization_id`), `user_id`, `action`, `metadata`, `ip_address`, `user_agent`, `created_at`.

---

## 3. Backend Route Architecture & OWASP Authorization (`apps/api/src/routes/v1/swarm.routes.ts`)

The backend API exposes REST endpoints under `/v1/umkm/swarm`:

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/v1/umkm/swarm/deploy` | `requireTenantContext` + `write` | Deploys a pre-configured 5-agent AI inventory swarm. |
| `POST` | `/v1/umkm/swarm/execute` | `requireTenantContext` + `write` | Executes an active swarm run. Verifies swarm ownership matching current tenant (`403 TENANT_SCOPE_VIOLATION` on mismatch). |
| `GET` | `/v1/umkm/swarm/list` | `requireTenantContext` + `read` | Returns active/paused swarms with nested agent rosters for the tenant store. |
| `GET` | `/v1/umkm/swarm/executions` | `requireTenantContext` + `read` | Lists past swarm execution records for the tenant. |
| `GET` | `/v1/umkm/swarm/executions/:id` | `requireTenantContext` + `read` | Fetches single execution details, verifying tenant ownership (`403` on mismatch). |
| `PATCH` | `/v1/umkm/swarm/:id` | `requireTenantContext` + `write` | Updates swarm status (`ACTIVE` / `PAUSED`) or configuration. |
| `DELETE` | `/v1/umkm/swarm/:id` | `requireTenantContext` + `write` | Decommissions a swarm (`status = 'DECOMMISSIONED'`). |

---

## 4. Controlled Inventory Tools & Execution Engine (`apps/api/src/services/ai/inventoryTools.ts`)

### 4.1 Tool Definitions & Authority Enforcement
The orchestrator executes controlled tools against database ground truth (`umkm_store_products`, `umkm_store_metrics`). Every tool invocation undergoes authority verification before execution:

1. **`inventory.get_stock_metrics`** (Authority: `READ_ONLY`): Calculates total products, low-stock items, total inventory value, out-of-stock items, and slow-moving items.
2. **`inventory.get_low_stock_products`** (Authority: `READ_ONLY`): Retrieves items where `stock <= reorder_point` or `stock <= threshold`.
3. **`inventory.detect_dead_stock`** (Authority: `READ_ONLY`): Identifies products unsold for `X` days (default 60).
4. **`inventory.forecast_demand`** (Authority: `READ_ONLY`): Projects product demand based on 30-day sales velocity (`unitsPerDay * daysToForecast`).
5. **`inventory.get_reorder_recommendations`** (Authority: `READ_ONLY`): Calculates recommended reorder quantities using `(lead_time_days * daily_sales) + safety_stock - current_stock`.
6. **`inventory.update_stock`** (Authority: `WRITE_WITH_APPROVAL` / `FULL_AUTONOMOUS`): Updates product stock level in database. **Hardened with mandatory `store_id` / `organization_id` tenant boundary filter on the SQL `UPDATE` statement**.

---

## 5. Swarm Orchestrator Pipeline (`apps/api/src/services/ai/inventorySwarmOrchestrator.ts`)

The `InventorySwarmOrchestrator` executes swarms via a multi-agent sequential pipeline:

```
[Trigger / User Prompt] ➔ [Coordinator Agent] ➔ [Inventory Monitor Agent] ➔ [Demand Forecaster Agent] ➔ [Stock Analyst Agent] ➔ [Reorder Advisor Agent] ➔ [Executive Synthesis Report]
```

1. **Context Resolution**: Resolves tenant IDs (`storeId`, `organizationId`, `userId`) and validates permissions.
2. **Execution Initialization**: Inserts a record into `ai_swarm_executions` with status `RUNNING`.
3. **Agent Step Execution**:
   - Each agent evaluates context, executes authorized tools via `executeInventoryTool()`, and appends step output to `ai_swarm_execution_steps`.
   - Tool outputs feed into subsequent agent reasoning context.
4. **Executive Summary Synthesis**: Aggregates insights into structured JSON (`stockHealthScore`, `lowStockAlerts`, `demandForecasts`, `reorderRecommendations`, `actionItems`).
5. **Completion**: Updates execution record to `COMPLETED` with latency and token metrics.

---

## 6. Frontend Integration Layer (`apps/web/src/app/dashboard/`)

### 6.1 Supabase Service Layer (`services/supabaseService.ts`)
Standardized API calls prefixed with `${API_BASE}` (`https://zega-ai.onrender.com/api` or `http://localhost:3001/api`):
- `getInventorySwarmList()`: `GET ${API_BASE}/v1/umkm/swarm/list`
- `updateSwarmStatus(swarmId, status)`: `PATCH ${API_BASE}/v1/umkm/swarm/:id`
- `deleteSwarm(swarmId)`: `DELETE ${API_BASE}/v1/umkm/swarm/:id`
- `executeInventorySwarm(params)`: `POST ${API_BASE}/v1/umkm/swarm/execute`

### 6.2 Swarm Management UI (`views/store/SwarmDashboardView.tsx`)
Rendered directly within `StoreView.tsx`:
- Displays active swarms with status pills (`ACTIVE`, `PAUSED`, `DECOMMISSIONED`).
- Agent Roster card grid displaying model IDs, agent roles, and online indicators.
- Quick action controls: `Run Now` (executes swarm manually), `Jeda/Aktifkan` (status toggle), `Detail` (expands agent roster), `Hapus` (decommissions swarm).
- Integrated transition button to `SwarmExecutionHistoryView.tsx` for inspecting historical execution reports and step logs.

---

## 7. Verification & Empirical Test Proof

### Automated Unit Test Suite (`apps/api/src/__tests__/inventory-swarm.test.ts`)
Run via `npx vitest run src/__tests__/inventory-swarm.test.ts`:
- **Result**: 11 / 11 tests passed.
- **Coverage**: Missing store context rejection, stock metrics generation, low-stock detection, dead-stock detection, demand forecasting, reorder recommendations, authority violation handling (`READ_ONLY` block on write tools), parameter validation under `WRITE` authority, skill-to-tool mappings, and full orchestrator execution pipeline.
