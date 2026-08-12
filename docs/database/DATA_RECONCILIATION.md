# Legacy Data Reconciliation & Store Lineage Framework

## 1. Store Lineage Mapping Logic

To resolve 125 tables utilizing `store_id` without `organization_id`, the system queries the primary `stores` registry:

```sql
-- Step 1: Populate organization_id and workspace_id on umkm_sales_products
UPDATE public.umkm_sales_products p
SET 
  organization_id = s.organization_id,
  workspace_id = s.workspace_id
FROM public.stores s
WHERE p.store_id = s.id
  AND p.organization_id IS NULL;
```

## 2. Ambiguous Record Exception Isolation

If a `store_id` cannot be unambiguously resolved to a valid `organization_id` (e.g., orphan stores, deleted stores, legacy test data):

> [!CAUTION]
> **NO AUTOMATIC ORPHAN MIGRATION**: Ambiguous records MUST NOT be blindly assigned to a fallback or default organization. Ambiguous records are isolated in an audit quarantine table for manual admin reconciliation.

```sql
CREATE TABLE public.data_migration_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  record_id UUID NOT NULL,
  legacy_store_id UUID,
  reason TEXT NOT NULL,
  quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
