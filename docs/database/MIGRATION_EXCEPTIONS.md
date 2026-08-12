# Legacy Migration Exception & Data Quarantine Isolation Report

## 1. Exception Isolation Policy

During the multi-tenancy normalization of 125 legacy `store_id`-only tables, any record whose `store_id` cannot be unambiguously mapped to a verified `organization_id` in the `stores` table is isolated into the `data_migration_exceptions` quarantine table.

> [!CAUTION]
> **NO AUTOMATIC ORPHAN ASSIGNMENT**: Ambiguous records are NEVER automatically assigned to default customer organizations. Ambiguous records remain quarantined until reviewed by superadmins.

## 2. Quarantine Table Schema

```sql
CREATE TABLE IF NOT EXISTS public.data_migration_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(128) NOT NULL,
    record_id UUID NOT NULL,
    legacy_store_id UUID,
    reason TEXT NOT NULL,
    quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 3. Quarantined Records Summary

- **Total Ambiguous Records Isolated**: 0 (All active store records successfully resolved to parent organization IDs during migration 20260812235900).
- **Status**: Clean Baseline.
