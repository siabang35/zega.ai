# ZEGA AI PRD — SQL Migration, Cloudflare R2 CDN & Supabase Realtime Specification

## Document Control
- **Document ID**: PRD-21
- **Title**: Production Multi-Tenant SQL Migrations, Cloudflare R2 CDN Asset Resolver & Supabase Realtime Architecture
- **Author**: ZEGA AI Core Engineering Team
- **Date**: July 31, 2026
- **Status**: APPROVED & IMPLEMENTED
- **Domain**: [zegaai.site](https://zegaai.site) | CDN: [cdn.zegaai.site](https://cdn.zegaai.site)

---

## 1. Executive Summary

This document specifies the technical architecture for ZEGA AI's multi-tenant PostgreSQL schema migrations, Cloudflare R2 CDN asset delivery pipeline, OWASP-compliant security triggers, and real-time WebSocket synchronization across three distinct platform tiers:
1. **UMKM / Individual Developer Tier** (`supabase/migrations/sql_umkm/`)
2. **Enterprise Organization Tier** (`supabase/migrations/sql_enterprise/`)
3. **SuperAdmin Platform Control Plane** (`supabase/migrations/sql_superadmin/`)

---

## 2. SQL Migration Architecture & Directory Topology

The migration suite is organized into modular SQL scripts with zero-downtime execution capability and explicit idempotent guards (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`):

```
supabase/migrations/
├── sql_umkm/
│   ├── 01_umkm_core_tables.sql                       # umkm_stores, umkm_products, umkm_orders, umkm_customer_activity
│   ├── 02_umkm_security_and_rls_policies.sql         # Store-level multi-tenant RLS policies
│   ├── 03_umkm_anti_throttling_rate_limiter.sql      # Token Bucket rate limiter (300 capacity)
│   ├── 04_umkm_realtime_and_cdn_helpers.sql          # Cloudflare R2 CDN URL resolver & Supabase Realtime publications
│   └── 05_umkm_seed_realtime_demo_data.sql           # Production demo store, products & sales feed
├── sql_enterprise/
│   ├── 01_enterprise_core_tables.sql                 # enterprise_organizations, enterprise_ai_clusters, enterprise_mcp_connectors
│   ├── 02_enterprise_security_rbac_rls_and_owasp.sql # Multi-tenant RBAC policies & OWASP mutation triggers
│   ├── 03_enterprise_anti_throttling_anti_chunking.sql # Token Bucket rate limiter & 1MB anti-chunking payload validator
│   ├── 04_enterprise_realtime_and_cdn_helpers.sql    # Cloudflare R2 CDN URL helper & Realtime publications
│   └── 05_enterprise_seed_realtime_demo_data.sql     # Enterprise clusters, MCP servers & audit trail seed
├── sql_superadmin/
│   ├── 01_superadmin_core_tables.sql                 # platform KPIs, root accounts, tenant registry, OWASP threat logs
│   ├── 02_superadmin_security_owasp_and_root.sql     # fn_is_superadmin_root() security definer & root account audit
│   ├── 03_superadmin_anti_throttling_anti_chunking.sql # 500 token capacity rate limiter & 2MB anti-chunking validator
│   ├── 04_superadmin_realtime_and_cdn_helpers.sql    # SuperAdmin Cloudflare R2 CDN helper & Realtime publications
│   └── 05_superadmin_seed_realtime_demo_data.sql     # Telemetry KPIs ($485k MRR), root account & edge nodes
├── 20260731000000_master_umkm_realtime_schema.sql     # Master compiled migration script for UMKM
├── 20260731000100_master_enterprise_realtime_schema.sql # Master compiled migration script for Enterprise
└── 20260731000200_master_superadmin_realtime_schema.sql # Master compiled migration script for SuperAdmin
```

---

## 3. Security, OWASP ASVS 4.0 & Rate Limiting Controls

### 3.1 Token Bucket Anti-Throttling Engine
Each tier features an isolated Token Bucket rate limiter procedure executing in `SECURITY DEFINER` mode:
- **UMKM**: `fn_check_rate_limit(p_rate_key, p_max_tokens DEFAULT 300, p_refill_rate DEFAULT 5.0)`
- **Enterprise**: `fn_check_enterprise_rate_limit(p_rate_key, p_max_tokens DEFAULT 300, p_refill_rate DEFAULT 5.0)`
- **SuperAdmin**: `fn_check_superadmin_rate_limit(p_rate_key, p_max_tokens DEFAULT 500, p_refill_rate DEFAULT 10.0)`

### 3.2 OWASP Anti-Chunking Payload Validators
To protect against memory exhaustion and payload chunking DoS attacks:
- **Enterprise Logs**: `fn_validate_payload_chunk_size()` rejects payloads exceeding **1MB (1,048,576 bytes)** with PostgreSQL exception `22001`.
- **SuperAdmin Threat Logs**: `fn_validate_superadmin_payload_chunk_size()` rejects threat payloads exceeding **2MB (2,097,152 bytes)** with PostgreSQL exception `22001`.

---

## 4. Cloudflare R2 CDN Integration

All platform branding logos, payment gateway badges, and asset images resolve through the Cloudflare R2 CDN bucket (`https://cdn.zegaai.site`):

### 4.1 SQL & TypeScript Resolver Functions
- **Database Helper**: `fn_get_r2_cdn_url(p_asset_path TEXT)` returns normalized CDN URLs.
- **Frontend Utility**: `getR2CdnUrl(assetPath: string)` in `apps/web/src/app/utils/cdn.ts`.

### 4.2 Standardized CDN Asset Inventory
- Brand Logo: `https://cdn.zegaai.site/assets/logo/zegalogo.png`
- ZeroClaw Core: `https://cdn.zegaai.site/assets/logo/zeroclaw-logo.png`
- Visa / Mastercard: `https://cdn.zegaai.site/assets/logo/visa.svg`, `https://cdn.zegaai.site/assets/logo/mastercard.svg`
- WhatsApp Business: `https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp`
- Stripe & x402 Protocol: `https://cdn.zegaai.site/assets/visualization/stripe.webp`, `https://cdn.zegaai.site/assets/visualization/x402.jpg`
- Integrations: `https://cdn.zegaai.site/assets/logo/github.svg`, `https://cdn.zegaai.site/assets/logo/hubspot.png`, `https://cdn.zegaai.site/assets/logo/jira.webp`

---

## 5. Supabase Realtime & Frontend Service Binding

The frontend `SupabaseDashboardService` in `apps/web/src/app/dashboard/services/supabaseService.ts` provides unified real-time data fetching and WebSocket channel subscriptions:

- `getUmkmRealtimeData()` & `subscribeToUmkmRealtime()`
- `getEnterpriseRealtimeData()` & `subscribeToEnterpriseRealtime()`
- `getSuperAdminRealtimeData()` & `subscribeToSuperAdminRealtime()`

All 3 dashboard containers (`UmkmDashboardContainer.tsx`, `EnterpriseDashboard.tsx`, `SuperAdminDashboard.tsx`) execute `useEffect` hooks to fetch initial state and automatically re-render upon WebSocket Postgres mutation events.
