# ZEGA AI PRD — Enterprise Security, CDN Asset Architecture & Supabase Hardening

## 13. Production Hardening & Infrastructure Specifications (As of July 2026)

### 13.1 Executive Infrastructure Summary
The **ZEGA AI Enterprise Console** (`zegaai.site`) has completed production-level hardening across bot defense, CDN asset delivery, database security, anti-throttling, and repository access control adhering to **OWASP ASVS 4.0** standards.

---

### 13.2 Cloudflare Turnstile Bot Defense & CAPTCHA Enforcement

1. **Backend Verification Service (`apps/api/src/services/turnstileService.ts`)**:
   - Gated behind Cloudflare Turnstile siteverify API endpoint (`https://challenges.cloudflare.com/turnstile/v0/siteverify`).
   - Strict production mode enforcement (`NODE_ENV=production`): Reject any mock or dev-bypass tokens (`dev-bypass-token`).
   - Uses `CLOUDFLARE_TURNSTILE_SECRET_KEY` with IP address logging.

2. **Frontend Integration (`apps/web/src/app/App.tsx`)**:
   - Dynamically injects Cloudflare Turnstile script (`https://challenges.cloudflare.com/turnstile/v0/api.js`).
   - Passes real verification token `turnstileToken` to `/v1/auth/request-otp` API endpoint during authentication.

---

### 13.3 Cloudflare R2 CDN Asset Delivery Architecture

1. **CDN Domain**: `https://cdn.zegaai.site`
2. **Automated Upload Script (`apps/api/src/scripts/uploadAssetsToR2.ts`)**:
   - Reads local logo assets (`/apps/web/public/assets/logo/zegalogo.png`).
   - Uploads directly to Cloudflare R2 S3-compatible object storage via S3 Client SDK.
   - Serves assets globally with HTTP cache headers (`Cache-Control: public, max-age=31536000, immutable`).

3. **Frontend CDN Components (`ZegaLogo.tsx`)**:
   - Dynamic asset URL binding: `https://cdn.zegaai.site/logo/zegalogo.png`.
   - Responsive scaling (`h-8 sm:h-9 md:h-11 w-auto`) tailored for high DPI screens, mobile viewports, and desktop consoles.

---

### 13.4 Transactional Brevo Email OTP & SMTP Relay

1. **Primary REST API Pathway (`BrevoService.ts`)**:
   - Dispatches 6-digit cryptographic security passcodes via Brevo API v3 (`https://api.brevo.com/v3/smtp/email`).
   - Uses `SMTP_BREVO` key with automated error detection.

2. **Fallback SMTP Relay Pathway**:
   - Automated fall-through to Nodemailer SMTP Relay (`smtp-relay.brevo.com:587`) if HTTP API returns 401/403 errors.
   - Enforces SHA-256 OTP hashing, 5-minute time-to-live (TTL), and brute-force attempt tracking.

---

### 13.5 OWASP-Compliant Supabase Master Database Migration

- **Migration Scripts**:
  - `supabase/migrations/20260729000001_comprehensive_enterprise_schema.sql`
  - `supabase/schema.sql` (Master SQL for Supabase Dashboard Editor)

- **Key Security & Schema Controls**:
  1. **100% Idempotent Execution**: Guarded with `DROP TRIGGER IF EXISTS` and `DROP POLICY IF EXISTS` to prevent duplicate error codes (e.g. `ERROR 42710`).
  2. **Row-Level Security (RLS)**: Enforced across all 12 core tables (`profiles`, `organizations`, `organization_members`, `user_api_keys`, `agents`, `workflows`, `sandboxes`, `sandbox_executions`, `integrations`, `agent_memory_store`, `security_audit_logs`, `rate_limit_logs`).
  3. **OWASP Anti-Throttling**: Stored procedure `check_rate_limit()` tracks request windows per IP/UUID.
  4. **OWASP Anti-Chunking & DoS Guard**: Check constraint `chk_input_payload_size` caps execution JSON payloads at 10MB (`octet_length(input_payload::text) <= 10485760`).
  5. **Audit Logging**: Stored procedure `log_security_event()` records IP, user ID, status code, and resource actions.

---

### 13.6 Repository Security & Gitignore Standard

- **Zero Secret Exposure Policy**:
  - Root `.gitignore`, `apps/api/.gitignore`, and `apps/web/.gitignore` created.
  - Strict blocking of `.env`, `.env.*`, `*.pem`, `*.key`, `*.cert`, `*.pfx`, `node_modules/`, `dist/`, `.next/`, `.cache/`, and `.DS_Store`.
  - Preserves `.env.example` templates for onboarding without exposing live production keys.
