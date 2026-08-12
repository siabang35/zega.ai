# ZEGA KPI Zero-State Specification

## Purpose
This document defines the exact metric sources of truth, calculation queries, tenant scope rules, and empty-state contracts for all ZEGA KPI dashboard endpoints.

## Zero-State Contracts & API Responses

When a customer organization or workspace has zero business data, the API contracts MUST return explicit zero values or empty arrays. Fake placeholder values, demo numbers, `null`, `undefined`, or `NaN` are strictly prohibited.

### 1. Dashboard Overview Metrics Contract
```json
{
  "revenue": 0,
  "orders": 0,
  "products": 0,
  "customers": 0,
  "inventory": 0,
  "growth_rate": 0,
  "conversion_rate": 0,
  "ai_business_usage": 0
}
```

### 2. List & Collection Endpoints Contract
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

## Source of Truth Mapping & Deterministic Queries

All KPI metrics must be calculated deterministically from source tables. Materialized zero rows should NOT be inserted unless application architecture explicitly requires zero-state records.

| Metric | Category | Source-of-Truth Table | Zero-State SQL Query |
| :--- | :--- | :--- | :--- |
| **Total Revenue** | Financial | `umkm_orders` / `invoices` | `SELECT COALESCE(SUM(total_amount), 0) FROM umkm_orders WHERE organization_id = :orgId AND status = 'COMPLETED';` |
| **Total Orders** | Operations | `umkm_orders` | `SELECT COUNT(*) FROM umkm_orders WHERE organization_id = :orgId;` |
| **Total Products** | Catalog | `umkm_sales_products` | `SELECT COUNT(*) FROM umkm_sales_products WHERE organization_id = :orgId;` |
| **Total Customers**| CRM | `umkm_crm_customers` | `SELECT COUNT(*) FROM umkm_crm_customers WHERE organization_id = :orgId;` |
| **Total Invoices** | Financial | `invoices` / `zeroclaw_invoices` | `SELECT COUNT(*) FROM invoices WHERE organization_id = :orgId;` |
| **AI Memory Chunks**| AI / RAG | `agent_memory_store` | `SELECT COUNT(*) FROM agent_memory_store WHERE organization_id = :orgId;` |
| **Knowledge Docs** | RAG | `enterprise_knowledge_documents` | `SELECT COUNT(*) FROM enterprise_knowledge_documents WHERE organization_id = :orgId;` |

## Tenant Scoping & Isolation Invariants
1. Queries MUST include `WHERE organization_id = :orgId` (or `workspace_id = :wsId`).
2. Aggregate operations on empty tables yield `0` via `COALESCE(SUM(...), 0)` or `COUNT(*)`.
3. In multi-tenant evaluation:
   - `ORG_A` business rows = 0 -> `ORG_A` KPI = 0
   - `ORG_B` business rows = 0 -> `ORG_B` KPI = 0
   - Creation of 1 order in `ORG_A` -> `ORG_A` orders = 1, `ORG_B` orders = 0.
