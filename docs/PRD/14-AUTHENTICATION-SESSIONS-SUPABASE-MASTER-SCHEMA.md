# 14 — ZEGA AI Enterprise Console: Authentication Guards, Sessions, Caching & Master Supabase Database Schema

## Executive Summary
This document provides a comprehensive technical overview of the production hardening, authentication guards, session management, Turnstile bot defense, transactional OTP email delivery via Brevo, and the master Supabase PostgreSQL database migration architecture for **ZEGA AI Enterprise Console**.

---

## 1. Authentication Guards & Session Security Architecture

### 1.1 Auth Guards for Console Access
* **Console Access Control**: Clicking **Console** or attempting to access `/console` checks for an active session (`SupabaseDashboardService.getCurrentSession()`).
* **Session Types**:
  1. **Authenticated Users**: Validated via Supabase Auth JWT / Brevo Email OTP passcode. Full access to user/enterprise workspace.
  2. **1-Click Guest Demo**: Non-intrusive preview mode accessible from `AuthModal` for potential enterprise clients to test agent capabilities without requiring account creation.

### 1.2 Interactive Cloudflare Turnstile CAPTCHA Bot Defense
* Dynamic widget rendering inside `AuthModal` via `https://challenges.cloudflare.com/turnstile/v0/api.js`.
* Token validation enforced on the backend at `/v1/auth/request-otp` via `TurnstileService`.
* Zero-trust bot detection blocking automated brute-force attacks and spam requests.

### 1.3 Brevo Transactional Email Delivery
* Dual delivery pipeline: Brevo HTTP API v3 (primary) with Nodemailer SMTP Relay (fallback).
* Sender Header Verification: Automatically routes emails from verified domain (`siabang35@gmail.com`) to prevent inbox drops.

---

## 2. Cookie Management & Local Telemetry Caching

### 2.1 Cookie Management (`zega_session`)
* **Session Persistence**: Stores session tokens in `zega_session` cookie with `SameSite=Lax`, `max-age=604800` (7 days), and `Secure` flag on HTTPS.
* **Cookie Revocation**: Calling `SupabaseDashboardService.signOut()` immediately purges `zega_session`, `sb-access-token`, `zega_mock_session`, and invalidates the session in the backend.

### 2.2 Local Telemetry & Metric Caching (`auth_cache`)
* `setCacheData` / `getCacheData` methods provide fast client-side and server-side caching with explicit Time-To-Live (TTL) expiration.
* Optimizes dashboard load times for agent metrics, sandbox execution logs, and user permissions.

---

## 3. Master Supabase Database Schema & Migrations

All database migration scripts are stored in `/supabase/migrations/` and follow 100% idempotent design standards (`DROP IF EXISTS` / `CREATE IF NOT EXISTS`):

| Migration File | Description | Key Tables & Stored Procedures |
| :--- | :--- | :--- |
| `20260729000000_enterprise_schema_and_security.sql` | Master enterprise tables & RLS | `profiles`, `organizations`, `agents`, `sandboxes` |
| `20260729000001_comprehensive_enterprise_schema.sql` | OWASP ASVS rate-limiting & constraints | `check_rate_limit()`, payload size validation |
| `20260729000002_users_auth_sessions_cache_and_cookies.sql` | Session tracking, cookies & caching | `user_sessions`, `auth_cache`, `create_user_session()`, `invalidate_user_session()` |
| `20260729000003_master_users_and_auth_integration.sql` | Master users table & auth auto-sync | `public.users`, `handle_user_sync()`, `upsert_zega_user()` |

---

## 4. Security & GitHub Readiness Best Practices

1. **Zero Secret Leakage**: No hardcoded API keys, database credentials, or private tokens exist in git tracking.
2. **Environment Variable Enforcement**: All keys managed via `.env` files (listed in `.gitignore`).
3. **OWASP Compliance**: RLS policies, input payload caps (10MB max), rate-limiting per IP/UUID, and strict session revocation.
