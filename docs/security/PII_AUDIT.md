# Personally Identifiable Information (PII) Audit & Governance

## 1. PII Classification Matrix

Audit of customer data fields across tables (`umkm_customers`, `umkm_inbox_conversations`, `umkm_user_sessions`, `users`):

| Data Field | PII Level | Storage Encrypted | Retention Period | Export Restrictions |
|---|---|---|---|---|
| Customer Email (`email`) | LEVEL 2 (Sensitive) | At Rest | Account Lifetime | Tenant Admin Only |
| Customer Phone (`phone`) | LEVEL 2 (Sensitive) | At Rest | Account Lifetime | Tenant Admin Only |
| Customer Address (`address`) | LEVEL 2 (Sensitive) | Standard | Account Lifetime | Masked in Exports |
| IP Address (`ip_address`) | LEVEL 1 (Internal) | Standard | 90 Days | Operational Logs |
| Chat Conversation Messages | LEVEL 3 (Confidential) | At Rest | 1 Year / Custom | Enterprise Admin |

## 2. Retention & Deletion Policy

When a customer or organization requests account deletion (GDPR / PDP Compliance):
- Hard deletion of all `organization_id` records across 295 tables within 30 days.
- Audit logs retained in anonymized format for legal compliance.
