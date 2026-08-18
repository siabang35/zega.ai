# ZEGA.AI — Multi-Tenant RLS Security & Authorization Hardening

**Document Version:** 1.2.0  
**Date:** August 17, 2026  
**Classification:** Security Architecture & Technical Documentation  
**Target Repository:** `siabang35/zega.ai`  

---

## 1. Executive Summary

This document details the architecture, forensic diagnostics, and implementation of multi-tenant Row-Level Security (RLS) hardening across the ZEGA.AI platform (DEEP FIX #16 through #21). 

The platform enforces strict, database-governed multi-tenant isolation for all chat streams (`umkm_ai_assistant_chats`, `umkm_zega_copilot_chats`) and tenant stores (`umkm_stores`). Under a strict **database schema freeze**, all security invariants are established at the application catalog boundary and verified against PostgreSQL kernel RLS policies without modifying existing database functions or tables.

---

## 2. Forensic Audit & PostgreSQL RLS Contract

### 2.1 Database RLS Function (`fn_validate_user_store_access`)
PostgreSQL enforces tenant boundaries using `fn_validate_user_store_access(user_id, org_id, store_id)`, which returns `TRUE` if and only if **at least one** of the following four canonical branches evaluates to `TRUE`:

1. **Branch 1 (Member Authorization)**:
   ```sql
   EXISTS (
     SELECT 1 FROM public.organization_members om
     WHERE om.organization_id = p_organization_id
       AND om.user_id = p_user_id
       AND om.status = 'active'
   )
   ```
2. **Branch 2 (Creator Authorization)**:
   ```sql
   EXISTS (
     SELECT 1 FROM public.organizations o
     WHERE o.id = p_organization_id
       AND o.created_by = p_user_id
   )
   ```
3. **Branch 3 (Direct Store Ownership by UUID)**:
   ```sql
   EXISTS (
     SELECT 1 FROM public.umkm_stores s
     WHERE s.id = p_store_id
       AND (s.created_by = p_user_id OR s.user_id = p_user_id)
   )
   ```
4. **Branch 4 (Direct Store Ownership by Email)**:
   ```sql
   EXISTS (
     SELECT 1 FROM public.umkm_stores s
     JOIN public.users u ON u.id = p_user_id
     WHERE s.id = p_store_id
       AND LOWER(s.email) = LOWER(u.email)
   )
   ```

### 2.2 Forensic Findings (DEEP FIX #21 — Error Classification)
When PostgREST queries against `/rest/v1/organizations` or `/rest/v1/organization_members` fail with HTTP `500`:
- **EXACT Root Cause**: PostgreSQL error `42P17` (`infinite recursion detected in policy for relation "organization_members"`).
- **Core Invariant**: **500 ERROR ≠ NO MEMBERSHIP. 500 ERROR ≠ UNAUTHORIZED.**
- Only a successful database query that returns zero rows proves no membership. Database query errors MUST be classified as `ORGANIZATION_AUTHORIZATION_ERROR` (`ORG_QUERY_ERROR`), triggering a `TENANT_AUTHORIZATION_UNAVAILABLE` fail-closed state without attempting store auto-provisioning.

---

## 3. 6-State Authorization Classification Matrix (DEEP FIX #21)

To prevent false authorization decisions, tenant context resolution evaluates queries against 6 explicit states:

| Classification State | Trigger Condition | Status Code / Action |
| :--- | :--- | :--- |
| **AUTHORIZED** | DB query succeeds, creator or active member row found | `STORE_READY` |
| **ORGANIZATION_UNAUTHORIZED** | DB query succeeds, zero rows returned | `STORE_CONTEXT_UNAVAILABLE` |
| **ORG_QUERY_ERROR** | DB query returns PostgREST error / 500 | `TENANT_AUTHORIZATION_UNAVAILABLE` |
| **STORE_QUERY_ERROR** | Store lookup query returns error | `STORE_QUERY_ERROR` |
| **AUTH_INVALID** | Supabase session JWT rejected | `AUTH_INVALID` |
| **UNKNOWN** | Unhandled resolution exception | Fail-Closed Abort |

---

## 4. Backend Diagnostics & Telemetry (`[TENANT_AUTH_DIAGNOSTIC]`)

All tenant resolution cycles output structured JSON diagnostics:

```json
[TENANT_AUTH_DIAGNOSTIC]
{
  "authUserId": "1e134159-623b-403d-bfca-0d6a9fc793b8",
  "organizationId": "6f287c60-d75e-4101-a11c-0012abcce43f",
  "organizationQuery": "ERROR",
  "membershipQuery": "NONE",
  "storeQuery": "NONE",
  "backendStoreResolver": "NOT_VERIFIED",
  "finalStatus": "ORGANIZATION_AUTHORIZATION_ERROR",
  "errorDetails": {
    "source": "organizations",
    "code": "42P17",
    "message": "infinite recursion detected in policy for relation \"organization_members\""
  }
}
```

---

## 5. Verification Test Suite Matrix

| Test Suite | Scenario Description | Expected State | Verified Outcome |
| :--- | :--- | :--- | :--- |
| **TEST A** | Organization creator login | `CREATOR` / `STORE_READY` | **PASS** |
| **TEST B** | Active organization member login | `MEMBER` / `STORE_READY` | **PASS** |
| **TEST C** | PostgREST HTTP 500 query error | `TENANT_AUTHORIZATION_UNAVAILABLE` | **PASS** |
| **TEST D** | `organization_members` 500 error | `ORG_QUERY_ERROR` (NOT Unauthorized) | **PASS** |
| **TEST E** | Store query HTTP 500 error | `STORE_QUERY_ERROR` | **PASS** |
| **TEST F** | Store query zero rows | `STORE_CONTEXT_UNAVAILABLE` | **PASS** |
| **TEST G** | Authorized organization + real store | `STORE_READY` | **PASS** |
| **TEST H** | Query error auto-provisioning check | Auto-provisioning strictly suppressed | **PASS** |
| **TEST I** | Query error chat execution check | Chat execution strictly blocked | **PASS** |

---

## 6. Compliance Statement

- **Database Schema Freeze**: **COMPLIANT (100%)** — Zero DDL, migrations, or policy alterations.
- **Error Classification**: **COMPLIANT (100%)** — 500 errors strictly separated from zero-row UNAUTHORIZED states.
- **Fail-Closed Security**: **COMPLIANT (100%)** — Zero unverified stores or unauthorized chat fallbacks.


