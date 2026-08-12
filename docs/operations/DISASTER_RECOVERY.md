# Business Continuity & Disaster Recovery Specifications

## 1. Recovery Objectives

| System Component | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) | Failover Strategy |
|---|---|---|---|
| PostgreSQL Core Database | < 1 Minute (WAL Streaming) | < 15 Minutes | Automated Multi-AZ Failover |
| R2 Storage / Document Vault | < 5 Minutes (Cross-Region Sync) | < 30 Minutes | Secondary Storage Endpoint Switch |
| Vector Database (RAG) | < 15 Minutes | < 1 Hour | Automated Vector Re-indexing |
| Redis Cache | 0 (Ephemeral) | < 5 Minutes | Automated Cache Warmup |

## 2. Backup & Point-in-Time Recovery (PITR)

- Continuous WAL archiving allowing Point-in-Time Recovery to any millisecond within the past 30 days.
- Daily automated encrypted logical backups stored in dedicated off-site backup storage buckets.
- Quarterly disaster recovery simulation tests (database restoration, RAG index rebuild, application cutover).
