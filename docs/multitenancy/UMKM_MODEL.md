# UMKM Multi-Tenant SaaS Platform Model

## 1. Domain A Overview

The UMKM platform is a shared multi-tenant SaaS application serving Indonesian Small-to-Medium Enterprises (Usaha Mikro, Kecil, dan Menengah). 

- **Tenant Isolation Strategy**: Logical isolation in a shared database schema using PostgreSQL Row Level Security (RLS) and mandatory `organization_id` foreign keys.
- **Resource Ownership Scope**: All products, sales, customers, invoices, inventory, chats, AI agent configurations, and marketing campaigns are strictly scoped to an `organization_id`.

## 2. Organization & Workspace Structure

```
UMKM Organization (e.g., Toko Kopi Jaya)
├── Organization ID: org_tokokopi_123
├── Type: UMKM
├── Workspaces:
│   ├── Main Operations (Workspace ID: ws_main)
│   └── Online E-Commerce (Workspace ID: ws_online)
└── Stores / Branches:
    ├── Jakarta Branch (Store ID: store_jkt_01)
    └── Bandung Branch (Store ID: store_bdg_02)
```

## 3. Store ID Reconciliation in UMKM Tables

125 tables in the legacy database contained `store_id` without `organization_id`. Under the hardened architecture:

1. **Foreign Key Rule**: Every table containing `store_id` MUST also contain `organization_id` as a non-nullable foreign key referencing `organizations(id)`.
2. **Composite FK Enforcement**:
```sql
ALTER TABLE public.umkm_sales_products
  ADD COLUMN organization_id UUID NOT NULL REFERENCES public.organizations(id);

-- Enforce that store_id belongs to the same organization_id
ALTER TABLE public.umkm_sales_products
  ADD CONSTRAINT fk_sales_products_store_org
  FOREIGN KEY (store_id, organization_id)
  REFERENCES public.stores(id, organization_id);
```

## 4. Shared Infrastructure Safeguards (Noisy Neighbor Protection)

To prevent resource exhaustion by a single UMKM tenant:
- **API Rate Limiting**: Max 500 requests / minute per `organization_id`.
- **Database Connection Limits**: Tenant-aware query timeouts set to 5000ms.
- **AI Token Quotas**: Daily token budgets tracked per `organization_id` in Redis.
