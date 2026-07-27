# ZEGA AI PRD — Backend Technical Design Document

## 10. Backend Technical Design (Fastify)

### 10.1 Architecture Philosophy

ZEGA AI's backend is built as a **high-performance Fastify application** within the monorepo (`apps/api`). It serves as the central nervous system connecting the frontend dashboard, AI agent meshes, payment infrastructure, and external integrations.

**Design Principles:**
- **Plugin-First**: Every capability is an isolated Fastify plugin with clean lifecycle
- **Schema-First**: All routes validate input/output via Zod → JSON Schema compilation
- **Zero Trust**: Every request authenticated; mTLS between internal services
- **Graceful Degradation**: Circuit breakers on all external dependencies
- **Observable**: Structured JSON logging (Pino) + OpenTelemetry tracing on every request

---

### 10.2 Fastify Plugin Architecture

```
Fastify Instance
├── @fastify/helmet          → Security headers (CSP, HSTS, X-Frame-Options)
├── @fastify/cors            → CORS with per-origin allowlisting
├── @fastify/cookie          → Secure cookie parsing (HTTP-only, SameSite=Strict)
├── @fastify/session         → Server-side sessions (Redis-backed)
├── @fastify/jwt             → JWT signing/verification (RS256, short-lived)
├── @fastify/rate-limit      → Tiered rate limiting per tenant (Redis counters)
├── @fastify/redis           → Redis/Dragonfly connection pool
├── @fastify/swagger         → OpenAPI 3.1 auto-generation
├── @fastify/multipart       → File upload handling
├── Custom Plugins:
│   ├── auth.plugin           → RBAC + session + JWT unified
│   ├── supabase.plugin       → Supabase client injection per-request
│   ├── stripe.plugin         → Stripe SDK singleton with webhook verification
│   ├── ai-router.plugin      → Multi-model AI provider management
│   └── agent-bus.plugin      → Redis pub/sub for A2A event broadcasting
```

### 10.3 Route Organization

All routes are versioned under `/v1/` and organized by domain:

| Endpoint Group | Path Prefix | Description |
|---|---|---|
| **Auth** | `/v1/auth/*` | Login, signup, session refresh, OAuth callbacks |
| **Agents** | `/v1/agents/*` | CRUD, lifecycle, deployment, health |
| **Orchestration** | `/v1/orchestration/*` | Task distribution, mesh commands, conflict resolution |
| **Payments — Stripe** | `/v1/payments/stripe/*` | Connect accounts, virtual cards, billing |
| **Payments — x402** | `/v1/payments/x402/*` | Stablecoin settlements, wallet management |
| **Payments — Router** | `/v1/payments/route` | 9router intelligent payment path selection |
| **Meshes** | `/v1/meshes/*` | Mesh management, health, scaling |
| **Analytics** | `/v1/analytics/*` | KPI dashboards, real-time metrics |
| **Compliance** | `/v1/compliance/*` | Audit trail queries, regulatory checks |
| **Webhooks** | `/v1/webhooks/stripe` | Stripe webhook ingestion (signature-verified) |
| **Health** | `/health`, `/ready` | Kubernetes liveness & readiness probes |

### 10.4 Request Lifecycle Pipeline

```
Incoming Request
  │
  ├─ 1. @fastify/helmet        → Inject security headers
  ├─ 2. @fastify/cors           → Validate origin
  ├─ 3. @fastify/rate-limit     → Check rate limit (Redis counter)
  ├─ 4. request-id.middleware   → Inject X-Request-ID (UUID v7, distributed tracing)
  ├─ 5. @fastify/cookie         → Parse cookies
  ├─ 6. auth.middleware          → Validate JWT OR session cookie → inject user context
  ├─ 7. tenant.middleware        → Resolve tenant (subsidiary_id) → inject tenant context
  ├─ 8. Zod Schema Validation   → Validate body, params, query against Zod schemas
  │
  ├─ 9. Route Handler           → Business logic execution
  │     ├─ Service Layer         → Domain logic (agent, payment, orchestration)
  │     ├─ Cache check (Redis)   → Return cached if hit
  │     ├─ Supabase query        → Database operations with RLS
  │     └─ External calls        → Stripe API, AI models, blockchain
  │
  ├─ 10. Response serialization  → JSON serialization with Fastify fast-json-stringify
  └─ 11. Audit logging           → Async audit trail entry (BullMQ job)
```

### 10.5 Caching Strategy

| Cache Layer | Store | TTL | Invalidation |
|---|---|---|---|
| **Session State** | Redis | 24h (rolling) | On logout / password change |
| **Agent Registry** | Redis Hash | 30s | On agent lifecycle event |
| **API Responses** | Redis | 60s–5min (per-route) | Cache-aside with stale-while-revalidate |
| **AI Model Responses** | Redis | 5min (deterministic prompts) | On prompt template change |
| **Payment Routes** | Redis | 10s | On 9router config change |
| **Tenant Config** | Redis | 5min | On admin settings change |
| **Rate Limit Counters** | Redis | Sliding window (60s/15min) | Auto-expire |

### 10.6 Job Queue System (BullMQ)

| Queue | Purpose | Concurrency | Retry Policy |
|---|---|---|---|
| `agent-health` | Periodic agent health checks | 10 | 3 retries, exponential backoff |
| `payment-reconciliation` | Stripe + x402 reconciliation | 5 | 5 retries, 30s delay |
| `compliance-scan` | Scheduled regulatory compliance scans | 3 | 3 retries, 60s delay |
| `audit-log` | Async immutable audit trail writes | 20 | 5 retries, no delay |
| `ai-inference` | Queued AI model calls (non-real-time) | 15 | 2 retries, 5s delay |
| `notification` | Email, Slack, webhook notifications | 10 | 3 retries, 10s delay |

### 10.7 Error Handling Strategy

All errors use a standardized JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_INSUFFICIENT_FUNDS",
    "message": "Agent budget exceeded for current billing period",
    "statusCode": 402,
    "details": { "agent_id": "...", "budget_remaining": 0.42 },
    "request_id": "01J...",
    "timestamp": "2026-07-27T12:00:00.000Z"
  }
}
```

Error classes:
- `ValidationError` (400) — Schema validation failure
- `AuthenticationError` (401) — Invalid/expired token
- `AuthorizationError` (403) — Insufficient permissions
- `PaymentRequiredError` (402) — x402 / budget exceeded
- `NotFoundError` (404) — Resource not found
- `ConflictError` (409) — Optimistic concurrency conflict
- `RateLimitError` (429) — Rate limit exceeded
- `InternalError` (500) — Unexpected server error

### 10.8 Cookie & Session Architecture

| Property | Value |
|---|---|
| **Cookie Name** | `__zega_sid` |
| **HttpOnly** | `true` |
| **Secure** | `true` (production) |
| **SameSite** | `Strict` |
| **Domain** | `.zega.ai` |
| **Max-Age** | 24 hours (rolling) |
| **Session Store** | Redis (encrypted, per-tenant namespace) |
| **CSRF Protection** | Double-submit cookie pattern (`__zega_csrf`) |
| **Session Data** | `{ user_id, tenant_id, roles[], permissions[], ip_hash, ua_hash }` |
| **Hijack Detection** | IP + User-Agent fingerprint mismatch → force re-authentication |

### 10.9 Deployment Topology

```
                    ┌─────────────────────┐
                    │   Vercel / CDN       │
                    │   (apps/web - SPA)   │
                    └──────────┬──────────┘
                               │ HTTPS
                    ┌──────────▼──────────┐
                    │   API Gateway /      │
                    │   Load Balancer      │
                    │   (Cloudflare/ALB)   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼───────┐ ┌──────▼───────┐
    │  Fastify Pod 1 │ │ Fastify Pod 2│ │ Fastify Pod N│
    │  (apps/api)    │ │  (apps/api)  │ │  (apps/api)  │
    └────┬───────────┘ └──────┬───────┘ └──────┬───────┘
         │                    │                │
    ┌────▼────────────────────▼────────────────▼────┐
    │              Redis Cluster / Dragonfly         │
    │   (sessions, cache, pub/sub, rate limits)      │
    └────────────────────┬──────────────────────────┘
                         │
    ┌────────────────────▼──────────────────────────┐
    │           Supabase (PostgreSQL 16)             │
    │   (auth, data, RLS, realtime, edge functions)  │
    └───────────────────────────────────────────────┘
```

### 10.10 Environment Variables Schema

```env
# Server
PORT=3001
NODE_ENV=production
LOG_LEVEL=info
API_BASE_URL=https://api.zega.ai

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Redis
REDIS_URL=redis://user:password@host:6379/0
REDIS_TLS=true

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# x402 / Blockchain
X402_NETWORK=base
X402_RPC_URL=https://mainnet.base.org
X402_HD_MASTER_SEED_ENCRYPTED=vault://x402/master-seed
X402_USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# Session / Security
SESSION_SECRET=random-256-bit-hex
JWT_PRIVATE_KEY=vault://jwt/private
JWT_PUBLIC_KEY=vault://jwt/public
CSRF_SECRET=random-128-bit-hex

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.zega.ai:4318
```
