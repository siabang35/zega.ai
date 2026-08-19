# PRD 46 — ZEGA UMKM AI Assistant & Copilot Architecture Specification

> **Version:** 1.1.0 | **Date:** 2026-08-20 | **Status:** Active | **Domain:** [zegaai.site](https://zegaai.site)

---

## 1. Executive Summary

ZEGA AI provides UMKM (Micro, Small, and Medium Enterprises) with a 360° AI-powered business orchestration suite. The platform features 5 specialized canonical AI assistants operating under strict Zero-Trust multi-tenant isolation while seamlessly interoperating through the **ZEGA Copilot Swarm Leader**, powered by the **ZeroClaw Engine** and **9Router Intelligent Router**.

---

## 2. Canonical AI Assistants Architecture

The platform architecture divides operational responsibilities into 5 distinct, specialized AI agents:

| Assistant ID | Canonical Name | Core Role & Specialization | Allowed Tools & Scope | Retrieval & Memory Policy |
|---|---|---|---|---|
| `home` | **ZEGA Home Assistant** | Daily business overview, sales summaries, active AI employee tracking, executive growth guidance | `get_business_overview`, `get_sales_summary`, `get_inventory_overview` | `none` \| `tenant_assistant_scoped` |
| `help` | **ZEGA Help Assistant** | Onboarding, feature guides, troubleshooting, WhatsApp POS setup, platform FAQ | `search_help_docs`, `get_feature_guide` | `help_center` \| `tenant_assistant_scoped` |
| `finance` | **ZEGA Finance Specialist** | Real-time financial intelligence (Revenue, HPP ~60%, PPN 11%, Net Profit ~25%, cash flow) | `get_financial_metrics`, `calculate_margin`, `get_cash_flow_statement` | `none` \| `tenant_assistant_scoped` |
| `knowledge` | **ZEGA Knowledge Assistant** | Tenant-scoped Knowledge Base retrieval (RAG pipeline for merchant SOPs & product docs) | `search_tenant_knowledge`, `extract_sop_document` | `tenant_knowledge` \| `tenant_assistant_scoped` |
| `zega_copilot` | **ZEGA Copilot** | Master Swarm Leader & 360° Operational AI Coworker (Multi-step planning & tool execution) | `inspect_sales`, `inspect_inventory`, `analyze_finance`, `execute_authorized_action` | `full_operational` \| `tenant_assistant_scoped` |

---

## 3. Inter-Assistant Communication & Swarm Interoperability

### 3.1 ZEGA Copilot Swarm Orchestration
- **ZEGA Copilot (`zega_copilot`)** acts as the central coordinator (*Master Swarm Leader*).
- When a user interacts with Copilot, it evaluates intent across domains (Finance, Sales, Inventory, Knowledge) and executes authorized tool calls across domain modules without requiring manual mode switching.
- Specialized assistants (`home`, `help`, `finance`, `knowledge`) maintain isolated scopes to provide domain-focused responses without cluttering system context.

### 3.2 Authorization & Tenant Security Boundaries
- **Strict Server-Authoritative Multi-Tenancy**: Every AI invocation requires validated `store_id`, `organization_id`, `workspace_id`, and `user_id` headers passed via JWT authentication.
- **Zero Cross-Tenant Leakage**: DB queries are strictly filtered by `.eq('store_id', storeId)` or `.or('organization_id.eq.${organizationId},store_id.eq.${storeId}')`.
- **RBAC & Tool Scoping**: Each assistant can only invoke tools explicitly enumerated in its backend registry (`allowedTools` in `assistantRegistry.ts`).

---

## 4. Real-Time Data Context Builders Engine

Every user query triggers a real-time context resolution engine in the backend (`contextBuilders.ts`):

```
+-----------------------------------------------------------------------------------+
|                            USER QUERY + JWT HEADERS                               |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         AI MODEL ROUTER ENGINE        |
                      |        (aiModelRouter.ts)               |
                      +---------------------------------------+
                                          |
      +-------------------+---------------+---------------+-------------------+
      |                   |                               |                   |
      v                   v                               v                   v
+--------------+   +--------------+               +---------------+   +--------------+
| buildHome    |   | buildFinance |               | buildKnowledge|   | buildCopilot |
| Context()    |   | Context()    |               | Context()     |   | Context()    |
+--------------+   +--------------+               +---------------+   +--------------+
      |                   |                               |                   |
      v                   v                               v                   v
  DB Tables:          DB Tables:                      DB Tables:          DB Tables:
  umkm_stores         umkm_transactions               umkm_knowledge_docs umkm_stores
  umkm_user_profiles  umkm_dashboard_kpis             (RAG Pipeline)      umkm_dashboard_kpis
  umkm_kpis           (Real Revenue, HPP, Profit)                         umkm_user_profiles
```

---

## 5. Role of ZeroClaw Engine (`packages/zeroclaw-bridge`)

The **ZeroClaw Engine** serves as the autonomous agent runtime and security enforcement bridge:
1. **Autonomous Tool Execution**: Executes verified store operations (POS updates, invoice generation, customer notification triggers) upon AI intent resolution.
2. **On-Chain Solana & Bounty Settlement**: Manages keyless wallet custody, USDC settlement verification, and QR code invoice generation for instant merchant checkout.
3. **Security Invariant Enforcement**: Enforces cryptographic anti-tamper storage guards and single-flight handle locks to prevent unauthorized execution.

---

## 6. Role of 9Router Intelligent Model Router (`aiModelRouter.ts`)

The **9Router Engine** provides intelligent, high-availability model routing across multiple LLM providers:
1. **Provider Load Balancing**: Dynamically balances request volume across primary and backup LLM providers.
2. **Deterministic Fallback Routing**: Instantly routes requests to secondary providers if a primary provider experiences downtime or API errors.
3. **Latency & Cost Optimization**: Selects fast inference models (e.g., Groq Llama 3.1 8B Instant) for simple queries and deep reasoning models (e.g., DeepSeek R1 / Gemini 3.6 Flash) for complex financial reasoning.

---

## 7. Multi-LLM Flagship Provider Palette

ZEGA AI integrates a multi-tier flagship LLM palette, giving merchants access to top-tier global AI models:

| Provider | Model Name | Primary Use Case & Characteristics | Timeout Protection |
|---|---|---|---|
| **Groq** | `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` | Ultra-fast inference (Sub-second response times for Home & Help Assistant queries) | `AbortSignal.timeout(8000)` |
| **Google Gemini** | `gemini-3.6-flash` / `gemini-1.5-flash` | Large-context analysis, complex multi-step reasoning, and multimodal context processing | `AbortSignal.timeout(8000)` |
| **OpenRouter / HuggingFace** | `deepseek-ai/DeepSeek-V4`, `DeepSeek-V3`, `DeepSeek-R1` | Advanced mathematical reasoning, financial analysis, and structured code/JSON generation | `AbortSignal.timeout(8000)` |
| **OpenAI** | `gpt-4o` / `gpt-3.5-turbo` | General intelligence fallback and complex intent classification | `AbortSignal.timeout(8000)` |
| **Anthropic** | `claude-3-5-sonnet` | Specialized executive writing and high-precision document synthesis | `AbortSignal.timeout(8000)` |

---

## 8. Mandatory Zero-Hallucination Tool Guards

To guarantee numeric precision for UMKM financial and inventory queries:
- The backend injects real-time metric snapshots directly into the prompt context.
- When financial tools (`get_financial_metrics`) execute, the system injects a mandatory system guard:
  > *"WAJIB GUNAKAN ANGKA INI DALAM JAWABAN ANDA. DILARANG MEMBUAT ANGKA SENDIRI / HALUSINASI."*

---

## 9. Universal UX & Click-to-Copy Standards

1. **Universal Click-to-Copy**: Integrated across all chat message bubbles (`EnterpriseCopilot`, `HelpView`, `KnowledgeBrainView`, `AskAIKnowledgeModal`).
2. **Mobile Z-Index Isolation**: Standardized `z-40` for floating action launchers and `z-[70]` for expanded AI modals to prevent mobile UI overlap.
3. **Persisted Chat History**: 100% database persistence via Supabase RPC (`fn_save_ai_assistant_message`), completely eliminating localStorage data loss.
