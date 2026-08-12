# Database Schema & Data Integrity Forensic Audit

## 1. Schema Inventory Analysis

- **Total Audited Tables**: 295 tables
- **Tables with `organization_id`**: 15 tables
- **Tables with `org_id`**: 14 tables
- **Tables with `store_id`**: 129 tables (4 mixed with `organization_id`, 125 `store_id` only)
- **Tables without any tenancy column**: 141 tables

## 2. Schema Drift Evaluation

Forensic comparison between PostgreSQL database runtime, Supabase migrations, Prisma/Drizzle ORM definitions, backend TypeScript models, and frontend types:

1. **Naming Inconsistency**: Enterprise tables use `org_id` while UMKM tables use `organization_id`. Target schema standardizes ALL enterprise tables to `organization_id`.
2. **Missing Foreign Keys**: 125 `store_id` tables lack foreign key constraints to `organizations(id)` or `workspaces(id)`.
3. **Composite Index Recommendations**: High-traffic query patterns require composite tenant indexes:
   - `CREATE INDEX idx_sales_products_org_ws ON public.umkm_sales_products(organization_id, store_id);`
   - `CREATE INDEX idx_invoices_org_created ON public.umkm_invoices(organization_id, created_at DESC);`
