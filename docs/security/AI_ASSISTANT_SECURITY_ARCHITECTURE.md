# ZEGA AI Multi-Model Assistant — Security Architecture & Authorization Spec

> Last Updated: 2026-08-20 | Status: **Production Hardened** | Audit: Empirical Pass 25/26

## 1. Canonical Assistant Registry

ZEGA AI operates **5 canonical assistants**, each with distinct jobdesk, tools, permissions, and model policy. Authorization is enforced at the backend registry level — the frontend CANNOT override canonical boundaries.

| # | Assistant | ID | Purpose | Model Policy | Retrieval |
|---|-----------|-----|---------|-------------|-----------|
| 1 | **ZEGA Home** | `home` | Business overview, daily KPIs, growth guidance | `balanced` | `none` |
| 2 | **ZEGA Help** | `help` | Platform FAQ, onboarding, troubleshooting | `fast` | `help_center` |
| 3 | **ZEGA Finance** | `finance` | CFO AI: profit/loss, margin, PPN/PPh, cash flow | `reasoning` | `none` |
| 4 | **ZEGA Knowledge** | `knowledge` | Tenant-scoped SOP & document RAG | `rag_supported` | `tenant_knowledge` |
| 5 | **ZEGA Copilot** | `zega_copilot` | Operational swarm leader, multi-step execution | `operational_swarm` | `full_operational` |

**Source**: [`assistantRegistry.ts`](../apps/api/src/services/ai/assistantRegistry.ts)

## 2. Tool Isolation Matrix (RBAC)

Each assistant is assigned a strict tool allowlist. Cross-domain tool calls return `TOOL_ISOLATION_VIOLATION`.

| Tool | Home | Help | Finance | Knowledge | Copilot |
|------|:----:|:----:|:-------:|:---------:|:-------:|
| `get_business_overview` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `get_sales_summary` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `get_inventory_overview` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `search_help_docs` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `get_feature_guide` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `get_financial_metrics` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `calculate_margin` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `get_cash_flow_statement` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `search_tenant_knowledge` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `extract_sop_document` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `inspect_sales` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `inspect_inventory` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `inspect_customers` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `analyze_finance` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `inspect_products` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `generate_business_insights` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `execute_authorized_action` | ❌ | ❌ | ❌ | ❌ | ✅ |

**Source**: [`toolRegistry.ts`](../apps/api/src/services/ai/toolRegistry.ts)

## 3. Task Complexity → Model Tier Routing

| Complexity | Trigger | Model Tier | Example |
|-----------|---------|------------|---------|
| **LOW** | Greetings, <30 chars, "halo", "thanks" | TIER_0_ULTRA_FAST | "Halo selamat pagi" |
| **MEDIUM** | Business keywords (stok, produk, promosi) | TIER_1_FAST_GENERAL | "Rekomendasi promosi kopi" |
| **HIGH** | Finance/crypto/tax/audit keywords, or finance/CFO role | TIER_2/TIER_3 | "Hitung margin PPn cash flow" |

Role override: `finance`, `cfo`, `audit`, `developer` roles always resolve to HIGH.

**Source**: [`aiRouterService.ts`](../apps/api/src/services/aiRouterService.ts)

## 4. Inter-Agent Swarm Orchestration

Agents collaborate via the **Swarm Orchestrator** when queries span multiple domains. The Copilot acts as Master Swarm Leader.

| Scenario | Primary → Collaborators | Mode |
|----------|------------------------|------|
| Home asks about PPN + SOP | Home → Finance + Knowledge | AGENTIC COLLABORATION |
| Finance needs sales data + SOP | Finance → Home + Knowledge | AGENTIC COLLABORATION |
| Help asks about margin calc | Help → Finance | AGENTIC COLLABORATION |
| Copilot multi-domain query | Copilot → all relevant sub-agents | AGENTIC COLLABORATION |
| Single-domain query | Direct agent only | DIRECT DOMAIN EXECUTION |

**Source**: [`agentSwarmOrchestrator.ts`](../apps/api/src/services/ai/agentSwarmOrchestrator.ts)

## 5. Prompt Injection & PII Defense (Dual-Layer)

### Layer 1: `guardrails.ts` (Input/Output)
- 16 OWASP anti-injection regex patterns
- PII redaction: credit card, SSN, email, phone, IP address
- Output: confidence check, completeness validation, PII leak scan

### Layer 2: `settlementValidation.ts` (Financial Pipeline)
- 28 anti-injection regex patterns
- Covers: persona hijacking, developer mode, jailbreak, bypass, forget-instructions, leak-secrets, force-payout

**Sources**: [`guardrails.ts`](../apps/api/src/services/ai/guardrails.ts), [`settlementValidation.ts`](../apps/api/src/utils/settlementValidation.ts)

## 6. Zero-Trust Identity Contract Enforcement

Every AI request must pass 3 mandatory contract checks before inference:

1. **`assistantType`** — Must be non-empty → `INVALID_REQUEST_CONTRACT` rejection
2. **`userId`** — Must be non-empty → `AUTH_REQUIRED` rejection
3. **`tenantId`** — Must be non-empty → `TENANT_BOUNDARY_VIOLATION` rejection

**Source**: [`aiModelRouter.ts`](../apps/api/src/services/ai/aiModelRouter.ts)

## 7. Model Provider Chain

| Priority | Provider | Models | Timeout |
|----------|----------|--------|---------|
| 1 | ZeroClaw Gateway | finance-specialist, copilot-engineer, knowledge-researcher | 800ms health |
| 2 | Groq LPU | qwen3.6-27b, gpt-oss-20b/120b, compound | 2500ms |
| 3 | OpenRouter | deepseek-chat, gpt-4o, claude-sonnet-5, kimi-k2.5 | 3000ms |
| 4 | Google Gemini | gemini-3.6-flash | 6000ms |
| 5 | HuggingFace | DeepSeek-V4/V3/R1, Llama-3.3-70B | 6000ms |
| 6 | Fallback | ZEGA Dynamic Intelligence Rules | Instant |

**Source**: [`aiRouterService.ts`](../apps/api/src/services/aiRouterService.ts), [`aiProvider.ts`](../apps/api/src/services/ai/aiProvider.ts)
