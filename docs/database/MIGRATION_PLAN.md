# Production Non-Destructive 14-Phase Migration Master Execution Plan

## 1. Migration Governance Rules

> [!WARNING]
> **NO DESTRUCTIVE MUTATIONS**: The migration strategy strictly forbids `DROP TABLE`, `TRUNCATE`, `DELETE`, `DROP COLUMN`, or immediate renaming of active columns in production without establishing dual-writing backwards compatibility and verified rollback procedures.

## 2. 14 Execution Phases

```
Phase 0: Read-Only Forensic Audit (COMPLETED)
Phase 1: Table Ownership Matrix Formulation (COMPLETED)
Phase 2: Data Reconciliation Mapping & Exception Isolation (IN PROGRESS)
Phase 3: Schema Normalization (Add nullable organization_id / workspace_id)
Phase 4: Staging Data Backfill & Store Lineage Resolution
Phase 5: RLS Policy Deployment (Staging & Validation)
Phase 6: Backend Query Scoping & Middleware Context Hardening
Phase 7: AI, RAG Vector Namespace & MCP Security Enforcement
Phase 8: Cache, Queue, & Storage Bucket Isolation
Phase 9: Enterprise Data & Control Plane Partitioning
Phase 10: Superadmin Control Plane & Break-Glass System Deployment
Phase 11: Comprehensive Cross-Tenant Security & Load Testing
Phase 12: Staging Final Sign-Off & Cutover Simulation
Phase 13: Non-Disruptive Production Migration Execution
```

## 3. Rollback & Precondition Requirements

Every migration step MUST specify:
1. **Precondition**: `SELECT COUNT(*) FROM table WHERE organization_id IS NULL;`
2. **Migration Script**: `ALTER TABLE ... ADD COLUMN ...; UPDATE ... SET organization_id = ...;`
3. **Validation Script**: Verify foreign key integrity and zero null records.
4. **Rollback Script**: `UPDATE ... SET organization_id = NULL; ALTER TABLE ... DROP COLUMN IF EXISTS ...;`
