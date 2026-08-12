# Data Lifecycle, Retention & Compliance Archiving Policy

## 1. Retention Matrix by Table Category

| Table Category | Default Retention | Enterprise Configurable | Archiving Location | Deletion Strategy |
|---|---|---|---|---|
| Customer Financial Invoices | 7 Years | Yes (Extended) | Cold Storage (R2 Archive) | Hard Delete after 7 Years |
| AI Chat Messages & Prompts | 1 Year | Yes (30 days - 3 yrs) | Active DB -> R2 | Soft -> Hard Delete |
| Vector Chunk Embeddings | Active Knowledge | Yes | Vector Database | Synced with Source Doc |
| Audit Logs (`security_audit_logs`) | 2 Years | Yes | Immutable Log Bucket | WORM Storage Retention |
| User Session Records | 30 Days | No | Redis / Memory | Automated Purge |

## 2. Automated Cleanup Background Workers

Background cron workers execute daily data retention purges:
```sql
-- Delete expired sessions older than 30 days
DELETE FROM public.umkm_user_sessions WHERE last_active_at < NOW() - INTERVAL '30 days';
```
