# ZEGA AI PRD — Newsletter, HTML5 URL Routing & GDPR Compliance Specification

## 15. Newsletter, URL Routing & Compliance Technical Specification

### 15.1 Newsletter Subscriptions System

#### A. Database Schema (`public.newsletter_subscriptions`)
The platform implements a GDPR-compliant opt-in newsletter subscription table with Row-Level Security (RLS) and automatic timestamp triggers.

```sql
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    source TEXT DEFAULT 'landing_page_banner',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### B. API Endpoint (`POST /v1/newsletter/subscribe`)
- **Validation**: Strict email regex & Zod schema validation.
- **Database Upsert**: Atomically upserts subscribers in `newsletter_subscriptions` on email conflict.
- **Brevo SMTP Welcome Email**: Asynchronously sends welcome confirmation emails.
- **Client Fallback**: If backend API is unreachable in offline dev mode, saves subscription to `localStorage` and logs OWASP audit trail.

---

### 15.2 URL-Driven HTML5 History API Routing Architecture

The frontend (`App.tsx`) enforces a clean URL routing architecture without hash fragments, adhering to modern SaaS best practices:

| Route Path | View Component / Section | Dynamic SEO Page Title |
| :--- | :--- | :--- |
| `/home` (or `/`) | Landing Page Home | `ZEGA AI \| Autonomous Enterprise Orchestration Platform` |
| `/products` | Landing Page + Smooth Scroll to `#products` | `Products & AI Engines — ZEGA AI` |
| `/pricing` | Landing Page + Smooth Scroll to `#pricing` | `Enterprise Pricing & Tiers — ZEGA AI` |
| `/docs` | `DocsPage` (Developer Guides & API Spec) | `Documentation & API Spec — ZEGA AI` |
| `/terms` | `TermsOfService` (14 Legal Sections) | `Terms of Service — ZEGA AI` |
| `/privacy` | `PrivacyPolicy` (12 Compliance Sections) | `Privacy Policy — ZEGA AI` |
| `/console` | `UserDashboard` or `SuperAdminDashboard` | `Enterprise Console — ZEGA AI` |

---

### 15.3 Deployment Rewrites (Vercel & Render)

Both **Vercel** (`vercel.json`) and **Render** (`render.yaml`) are configured with SPA fallback rewrite rules:
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```
This guarantees zero `404 Not Found` errors when users navigate directly to sub-paths like `https://zegaai.site/docs` or `https://zegaai.site/console`.
