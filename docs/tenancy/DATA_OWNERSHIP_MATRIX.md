# ZEGA.AI Canonical Data Ownership & Tenancy Matrix

## 1. Overview & Authority Boundaries

ZEGA.AI enforces a 4-tier logical multi-tenant hierarchy across business domains:

1. **Organization Boundary (`organization_id` / `org_id`)**: Highest tenant isolation boundary for Enterprise clients.
2. **Workspace Boundary (`workspace_id`)**: Sub-tenant division within an organization.
3. **Store Boundary (`store_id`)**: Business unit isolation boundary for UMKM (SMB) merchants.
4. **User Boundary (`user_id` / `profile_id`)**: Individual identity and wallet ownership boundary.

---

## 2. Canonical Ownership Matrix (77 Database Tables)

| Table Name | Business Domain | Primary Tenancy Boundary | RLS Policy Status | Authority Enforcement |
|---|---|---|---|---|
| `agent_memory_store` | AI / Agent | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `agents` | AI / Swarm | `org_id`, `user_id` | `ENABLED` | RLS filter on `org_id` |
| `audit_logs` | Security / Telemetry | `org_id`, `workspace_id` | `ENABLED` | Organization membership |
| `auth_cache` | Identity / Auth | `Global System` | `ENABLED` | Service-role internal |
| `enterprise_ai_clusters` | Enterprise AI | `org_id` | `ENABLED` | Organization membership |
| `enterprise_audit_logs` | Security / Audit | `org_id` | `ENABLED` | Organization admin RBAC |
| `enterprise_cost_intelligence`| Enterprise Analytics| `org_id` | `ENABLED` | Organization admin RBAC |
| `enterprise_mcp_connectors` | Enterprise AI | `org_id` | `ENABLED` | Organization membership |
| `enterprise_members` | Organization | `org_id`, `user_id` | `ENABLED` | Organization membership |
| `enterprise_orchestrators` | Enterprise AI | `org_id` | `ENABLED` | Organization membership |
| `enterprise_organizations` | Organization | `Global Catalog` | `ENABLED` | Read-only / Admin |
| `enterprise_rate_limits` | Middleware | `Global System` | `EXEMPT` | Middleware service-role |
| `health_telemetry_logs` | Operations | `Global System` | `ENABLED` | Superadmin control plane |
| `idempotency_keys` | API Security | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `integrations` | Integrations | `org_id`, `user_id` | `ENABLED` | Organization membership |
| `invoices` | Billing | `user_id` | `EXEMPT` | Service-role API verification |
| `ledger_entries` | Settlement | `user_id` | `EXEMPT` | Service-role API verification |
| `newsletter_subscriptions` | Public Product | `Global Public` | `ENABLED` | Public insert, admin view |
| `organization_members` | Organization | `org_id`, `user_id` | `ENABLED` | Organization membership |
| `organizations` | Organization | `Global Catalog` | `ENABLED` | Tenant membership check |
| `otps` | Identity / Auth | `Global Auth` | `ENABLED` | Internal OTP verification |
| `payments` | Payments | `org_id` | `ENABLED` | Organization membership |
| `platform_break_glass_access_logs` | Security | `org_id`, `user_id` | `EXEMPT` | Service-role break-glass audit |
| `privy_r2_audit_certificates` | Privy / Storage | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `privy_wallets` | Privy / Custody | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `privy_webhook_events` | Webhook Security | `user_id` | `ENABLED` | HMAC signature check |
| `profiles` | Identity | `user_id` | `ENABLED` | Self-profile ownership |
| `rate_limit_logs` | Middleware | `Global System` | `ENABLED` | System logger |
| `rate_limits` | Middleware | `Global System` | `ENABLED` | System logger |
| `reconciliation_records` | Financial Recon | `Global System` | `EXEMPT` | Service-role scheduler |
| `sandbox_executions` | AI Security | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `sandboxes` | AI Security | `org_id`, `user_id` | `ENABLED` | RLS filter on `org_id` |
| `security_audit_logs` | Security | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `sessions` | Identity / Auth | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `social_oauth_accounts` | Identity | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `superadmin_infra_nodes` | Control Plane | `Global Control Plane` | `ENABLED` | Superadmin role filter |
| `superadmin_platform_kpis` | Control Plane | `Global Control Plane` | `ENABLED` | Superadmin role filter |
| `superadmin_rate_limits` | Middleware | `Global Control Plane` | `EXEMPT` | Service-role rate check |
| `superadmin_root_accounts` | Control Plane | `user_id` | `ENABLED` | Superadmin MFA required |
| `superadmin_security_threat_logs`| Security | `Global Control Plane` | `ENABLED` | Superadmin security team |
| `superadmin_tenant_registry` | Control Plane | `Global Control Plane` | `ENABLED` | Superadmin role filter |
| `support_access_requests` | Governance | `org_id`, `user_id` | `ENABLED` | Time-bound consent check |
| `telegram_dedup` | Messaging Queue | `Global System` | `ENABLED` | Queue deduplication |
| `transactions` | Finance / Solana | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `umkm_ai_employees` | UMKM Swarm | `store_id` | `ENABLED` | Store ownership check |
| `umkm_automations` | UMKM Workflow | `store_id` | `ENABLED` | Store ownership check |
| `umkm_customers` | UMKM CRM | `store_id` | `ENABLED` | Store ownership check |
| `umkm_dashboard_kpis` | UMKM Analytics | `store_id` | `ENABLED` | Store ownership check |
| `umkm_integrations` | UMKM Marketplace | `store_id` | `ENABLED` | Store ownership check |
| `umkm_invoices` | UMKM Billing | `store_id` | `ENABLED` | Store ownership check |
| `umkm_knowledge_docs` | UMKM RAG | `store_id` | `ENABLED` | Store ownership check |
| `umkm_products` | UMKM Inventory | `store_id` | `ENABLED` | Store ownership check |
| `umkm_rate_limits` | Middleware | `Global System` | `EXEMPT` | Service-role rate check |
| `umkm_stores` | UMKM Store | `store_id`, `user_id` | `ENABLED` | Merchant user ownership |
| `umkm_timeline_events` | UMKM Telemetry | `store_id` | `ENABLED` | Store ownership check |
| `umkm_transactions` | UMKM Finance | `store_id` | `ENABLED` | Store ownership check |
| `user_api_keys` | Security / Auth | `org_id`, `user_id` | `ENABLED` | RLS filter on `user_id` |
| `user_sessions` | Auth / Session | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `users` | Identity | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `wallets` | Privy / Solana | `user_id` | `EXEMPT` | Service-role API verification |
| `webhook_events` | Webhook Queue | `user_id` | `EXEMPT` | Service-role queue worker |
| `withdrawal_audit_logs` | Security / Audit | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `withdrawals` | Payments / Solana | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `workflows` | AI / Automation | `org_id`, `user_id` | `ENABLED` | RLS filter on `org_id` |
| `workspace_members` | Enterprise Workspace| `workspace_id`, `user_id` | `ENABLED` | Workspace membership |
| `workspaces` | Enterprise Workspace| `org_id` | `ENABLED` | Organization membership |
| `zeroclaw_checkpoints` | ZeroClaw Engine | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_defi_alerts` | ZeroClaw Engine | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_invoices` | ZeroClaw Payments | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_memory_edges` | ZeroClaw Memory | `Global System` | `ENABLED` | Service-role memory engine |
| `zeroclaw_memory_nodes` | ZeroClaw Memory | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_payment_events` | ZeroClaw Settlement | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_reconciliation_log` | ZeroClaw Recon | `Global System` | `ENABLED` | Service-role scheduler |
| `zeroclaw_solana_settlements` | ZeroClaw Settlement | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_sop_checkpoints` | ZeroClaw SOP | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_sop_runs` | ZeroClaw SOP | `user_id` | `ENABLED` | RLS filter on `user_id` |
| `zeroclaw_withdrawals` | ZeroClaw Vault | `user_id` | `ENABLED` | RLS filter on `user_id` |

---

## 3. Disambiguation of Tenant Identity Keys

* `org_id` vs `organization_id`: Both refer to the unique UUID primary key of an enterprise organization. Database policies filter on `org_id` for table efficiency.
* `store_id`: Business unit key for UMKM merchants (`umkm_stores`).
* `workspace_id`: Enterprise organizational subdivision key (`workspaces`).
