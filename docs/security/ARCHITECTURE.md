# ZEGA Security Architecture & Production Hardening Guide

## Overview

ZEGA (Zero-friction Enterprise Generative AI & Automation) enforces a **7-Layer Defense Depth Architecture** designed to protect multi-tenant enterprise autonomous agent swarms, financial settlement flows, and execution pipelines.

---

## 7-Layer Defense Depth Model

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Edge & Network Security (Helmet, CORS, WAF)   │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Authentication & HTTP-Only Session Security    │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Server-Side RBAC & Anti-Privilege Escalation  │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Fail-Closed Rate Limiting & Sliding Windows   │
├─────────────────────────────────────────────────────────┤
│ Layer 5: Tenant-Aware Database Row Level Security (RLS)│
├─────────────────────────────────────────────────────────┤
│ Layer 6: Canonical Solana 5-Layer Settlement Pipeline   │
├─────────────────────────────────────────────────────────┤
│ Layer 7: Immutable Security Audit Logging & R2 Vault    │
└─────────────────────────────────────────────────────────┘
```

---

## Key Security Controls

### 1. Authentication & Role Derivation (`auth.routes.ts`)
- **Server-Side Authority**: Client-supplied parameters (e.g. `audienceSegment`) are strictly ignored for privilege determination.
- **Database Scope**: User roles (`superadmin`, `enterprise`, `individual`) are resolved exclusively from server-side `public.users` / `public.profiles` database records or canonical root admin configuration.
- **Session Security**: JWT tokens are transmitted via signed `HttpOnly`, `SameSite=Strict`, `Secure` cookies (`__zega_token`).

### 2. Fail-Closed Rate Limiting (`supabaseService.ts`)
- **Resilient Fallback**: If the database or `check_rate_limit` RPC call fails or times out, the system fails closed by invoking an in-memory sliding-window rate limiter rather than granting un-throttled access.

### 3. Canonical Settlement Verification Pipeline (`settlementVerificationService.ts`)
1. **Input & Format Validation**: Base58 transaction signature syntax checks (length 80–92).
2. **SPL Token Validation**: Explicit checking against USDC Devnet/Mainnet mint public keys.
3. **Database Anti-Replay Protection**: Persistent verification against `public.zeroclaw_settlements`.
4. **On-Chain Solana RPC Lookup**: Queries the multi-provider RPC pool (`solanaRpcManager`) with exponential backoff and circuit breaking.
5. **Freshness & Recipient Check**: Validates block time age (<72h) and destination wallet matching.

### 4. Tenant-Aware Row Level Security (`supabase/migrations/20260810000000_production_security_rls_hardening.sql`)
- All database tables enforce RLS.
- Policies check `auth.uid() = user_id` or query `public.organization_members` for multi-tenant enterprise isolation, preventing cross-tenant IDOR access.
