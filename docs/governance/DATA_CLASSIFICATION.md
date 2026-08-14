# Enterprise Data Classification & Governance Framework

## 1. Classification Levels

All data stored within ZEGA.AI is categorized under four strict security sensitivity tiers:

1. **PUBLIC (Tier 0)**: Public catalogs, system FAQs, platform status indicators (`enterprise_help_faqs`, `enterprise_system_status`). Publicly readable.
2. **INTERNAL (Tier 1)**: System metadata, anonymized telemetry, global product catalogs. Authenticated system users only.
3. **SENSITIVE (Tier 2)**: Customer PII, customer address lists, email directories (`umkm_customers`, `users`). Encrypted at rest, restricted RBAC.
4. **CONFIDENTIAL (Tier 3)**: Financial invoices, transactions, AI memory, vector knowledge chunk embeddings, webhook secrets, passwords (`umkm_invoices`, `umkm_ai_memory_entries`, `otps`). Highly restricted RLS, zero anon access, encrypted at rest.
