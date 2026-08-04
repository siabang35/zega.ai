# PRD 32: Enterprise ZEGA Copilot OWASP Security, Multi-LLM Failover & Real-Time Engine Specification

## 1. Executive Overview
The **ZEGA Copilot Enterprise Assistant** is an ultra-secure, multi-provider AI assistant designed to provide real-time automated business intelligence, merchant sales analytics, and store management recommendations for UMKM and Enterprise merchants within the ZEGA AI ecosystem.

To guarantee 99.99% availability, zero key leakages, and strict adherence to international AI safety standards, ZEGA Copilot implements a **6-Layer OWASP Top 10 for LLM Defense Architecture**, a **5-Stage Real-Time Multi-LLM Failover Engine**, a **Dynamic Temporal Anchor (Year 2026)**, and an **Enterprise-Grade Real-Time Calendar & Schedule Popover**.

---

## 2. OWASP Top 10 for LLM Security Guardrail Suite (6 Layers)

All incoming chat prompts and inference requests routed to `POST /v1/umkm/copilot/chat` pass through six strict defense layers before reaching inference models:

1. **Layer 1: OWASP LLM01 - Prompt Injection & System Override Defense**:
   * Inspects prompt text for adversarial attack signatures (`"ignore previous instructions"`, `"act as DAN"`, `"print system prompt"`, `"reveal database secret"`).
   * Automatically sanitizes or rejects malicious payloads with structured audit log (`security_status = 'rejected'`).

2. **Layer 2: OWASP LLM02 - Data Isolation & Multi-Tenant Boundaries**:
   * Enforces mandatory `store_id` and `user_id` context binding in all database queries (`umkm_zega_copilot_conversations` & `umkm_zega_copilot_messages`).
   * Prevents cross-tenant data leaks by enforcing Supabase Row Level Security (RLS) policies.

3. **Layer 3: OWASP LLM06 - Secret & Credential Redaction**:
   * Automatically scans system prompts and user inputs for API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`, Supabase secrets, JWT tokens).
   * Masks secrets matching regex patterns (`[REDACTED_SECRET]`) prior to sending prompts to third-party LLM providers.

4. **Layer 4: Backend Proxy Key Isolation**:
   * No AI provider API keys are exposed to the client browser (`apps/web`).
   * All API calls are executed strictly server-side inside `apps/api` fastify environment variables (`.env`).

5. **Layer 5: OWASP LLM04 - Model Denial of Service (DoS) Cap**:
   * Restricts user prompt length to 2,048 characters and enforces rate-limiting per store tenant (100 req/min).

6. **Layer 6: Real-Time Security Audit Trail**:
   * Every conversation message is logged in `umkm_zega_copilot_messages` with cryptographic verification flags (`security_status = 'verified'`).

---

## 3. Multi-Provider Real-Time Failover Engine (5 Stages)

To eliminate downtime caused by provider rate limits (HTTP 429), API quota exhaustion, or upstream outages, the backend implements a automated 5-stage failover pipeline:

```
[User Chat Request]
       │
       ▼
┌───────────────┐
│ Stage 1:      │ ── (Success) ──► Return AI Response
│ Gemini 1.5    │
└───────┬───────┘
        │ (Error / Rate Limited)
        ▼
┌───────────────┐
│ Stage 2:      │ ── (Success) ──► Return AI Response
│ Groq Llama 3.3│
└───────┬───────┘
        │ (Error / Rate Limited)
        ▼
┌───────────────┐
│ Stage 3:      │ ── (Success) ──► Return AI Response
│ OpenRouter    │
└───────┬───────┘
        │ (Error / Rate Limited)
        ▼
┌───────────────┐
│ Stage 4:      │ ── (Success) ──► Return AI Response
│ HuggingFace   │
└───────┬───────┘
        │ (Error / Rate Limited)
        ▼
┌───────────────┐
│ Stage 5:      │ ── (Offline Mode) ──► Fallback Rule Engine
│ Deterministic │
└───────────────┘
```

---

## 4. Dynamic Temporal Anchoring (Year 2026 Context Injection)

To ensure ZEGA Copilot provides accurate, real-time answers without hallucinating past dates or outdated system contexts:
* **Current Year Context**: System prompt automatically injects `Tahun: 2026` and full ISO timestamp (`2026-08-05`).
* **Dynamic Date Calculation**: Relative questions ("apa promo hari ini?", "jadwal besok?") are dynamically evaluated relative to the current date in 2026.

---

## 5. UI/UX & Mobile Responsiveness Best Practices

1. **Floating Trigger Button**:
   * Positioned at `bottom-[76px]` on mobile screens to avoid obscuring the mobile bottom navigation bar (`Beranda`, `AI Agent`, `Inbox`, `Toko`, `Pengaturan`).
   * Clean brand display: 36px high-res `zega_copilot.png` icon separated from bold `ZEGA Copilot` text with `hover:scale-105` micro-animations.

2. **Mobile Bottom Sheet Drawer**:
   * Automatically adapts into a high-utility bottom sheet drawer (`w-[94vw]` & `h-[72vh]`) on screens `< sm`.

3. **Clean Markdown Renderer (`renderFormattedMessage`)**:
   * Custom parser rendering bold highlights, clean code blocks, lists, and spacing without raw markdown noise.

4. **100% Dynamic Real-Time Calendar & Schedule Popover**:
   * **Live Ticking Digital Clock**: `liveTime` state updating every second with live status pulse indicator.
   * **Programmatic Day Matrix Generator**: Calculates exact days, empty offset cells, and highlights today's date (**5 Agustus 2026**).
   * **Quick Date Filters**: 1-tap shortcuts (*Hari Ini*, *7 Hari Terakhir*, *Bulan Ini*) triggering real-time date filtering and toast notifications.
   * **Live AI Store Automation Schedule**: Displays upcoming automated tasks (*10:00 WIB - Re-stock Kopi*, *14:30 WIB - Broadcast Promo WA*).

5. **Seamless User Profile Header Dropdown (Control Center Bar)**:
   * **3-Column Uniform Grid Bar (`grid-cols-3 gap-1.5`, `h-8.5`, `rounded-xl`)**:
     * 🌗 **Theme Pill (`Dark` / `Light`)**: Height `h-8.5`, `rounded-xl`, Sun/Moon icon.
     * 📅 **Calendar Pill (`Kalender`)**: Height `h-8.5`, `rounded-xl`, Calendar icon + pulse dot.
     * 🌐 **Language Selector Pill (`EN` / `ID`)**: Custom `LanguageSelector` with matching `h-8.5` height and rounded borders.
   * **Shortened Account Links**: `Profil`, `Billing`, `Keluar`.

---

## 6. Supabase Database Migration Schema

The schema definition is located at `/supabase/migrations/sql_umkm/25_umkm_zega_copilot_enterprise_schema.sql`:
* Tables: `public.umkm_zega_copilot_conversations` and `public.umkm_zega_copilot_messages`.
* Realtime: `ALTER TABLE public.umkm_zega_copilot_messages REPLICA IDENTITY FULL;`
* Publication: Added to `supabase_realtime` publication.
* UUID Standard: Seed fallback conversation uses valid hex UUID `c0de0000-0000-0000-0000-000000000001`.
