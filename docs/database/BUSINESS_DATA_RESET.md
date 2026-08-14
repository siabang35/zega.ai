# ZEGA Business Data Reset Standard Operating Procedure (SOP)

## Purpose
This document defines the documented and governed operational workflow and governance rules for resetting ZEGA's customer business data. The objective is to achieve a clean zero-state for all business metrics (Revenue, Orders, Products, Customers, Inventory, Financials, AI/RAG Memory, Reports, and Analytics) while preserving platform identity, multi-tenant hierarchy, authorization structures, and global configuration.

## Scope & Safety Invariants

### 1. Preserved Platform Layer (STRICT DO NOT DELETE)
- **Identity**: `users`, `auth_identities`, `user_profiles`
- **Tenancy**: `organizations`, `organization_memberships`, `organization_members`, `workspaces`, `workspace_memberships`, `workspace_members`, `tenant_config`, structural store definitions
- **Authorization**: `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions`
- **Control Plane**: `superadmin_accounts`, `superadmin_tenant_registry`, platform deployment records, licensing, plans, break-glass access logs
- **Global Data**: `product_catalog_templates`, `billing_plan_catalog`, `integration_catalog`, `mcp_catalog`, public documentation, FAQ templates, global system configuration
- **Security & Schema**: RLS policies, database functions, triggers, migration history, audit logs

### 2. Reset Scope (Purged Business State)
- **Customer Business Data**: `umkm_sales_products`, `umkm_crm_customers`, `umkm_orders`, `umkm_order_items`, `umkm_inventory`, products, customers, orders, order items, inventory transactions, campaign executions, live chat messages, business automations
- **Financial Data**: `invoices`, `payments`, `ledger_entries`, `withdrawals`, `billing_transactions`, `zeroclaw_invoices`, `zeroclaw_wallets`, `enterprise_invoices` (disposable test/demo financial records only)
- **Derived KPI & Reporting**: `umkm_dashboard_kpis`, `enterprise_overview_kpis`, `enterprise_analytics_kpis`, `enterprise_cost_overview_kpis`, `enterprise_finops_kpis`, sales metrics, marketing metrics, finance metrics
- **AI / RAG Memory**: `agent_memory_store`, business vector embeddings, AI agent execution logs, commander telemetry
- **Knowledge Data**: `enterprise_knowledge_documents`, `enterprise_knowledge_collections`, `enterprise_knowledge_databases`, `enterprise_knowledge_datasets`, `enterprise_knowledge_websites`
- **Analytics & Activities**: `enterprise_analytics_time_series`, `enterprise_analytics_workflow_executions`, `enterprise_live_activities`, `enterprise_organization_activities`
- **Cache**: `auth_cache`, Redis tenant namespaces (`org:{orgId}:*`)

## Foreign Key Dependency Order
To ensure atomic and clean deletion without foreign key violations, tables are purged in strict child-to-parent order:
1. Child derived KPI & reporting records (`umkm_dashboard_kpis`, `enterprise_overview_kpis`, etc.)
2. AI execution logs & RAG vector chunks (`agent_memory_store`, `enterprise_ai_agent_actions`, etc.)
3. Knowledge documents & datasets (`enterprise_knowledge_documents`, `enterprise_knowledge_datasets`, etc.)
4. Order items & transactional details (`umkm_order_items`, `billing_transactions`, etc.)
5. Parent orders, invoices, payments (`umkm_orders`, `invoices`, `payments`, `withdrawals`, `zeroclaw_invoices`)
6. Customer & product catalog records (`umkm_sales_products`, `umkm_crm_customers`, `products`, `customers`)

## Rollback & Safety Checklist
1. Generate `/tmp/zega_pre_reset_inventory.json` snapshot prior to deletion.
2. Confirm zero UNKNOWN tables are reset.
3. Wrap operations in transactions or execute verified batched PostgREST standard operations with exact row reconciliation.
4. Generate `/tmp/zega_post_reset_inventory.json` to verify preserved table row count parity.
5. Validate zero-state API endpoints return `0` / `[]` rather than null or fake demo values.
