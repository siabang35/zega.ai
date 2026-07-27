# ZEGA AI PRD — AI Guardrails & Safety Framework

## 11. AI Guardrails, Safety & Model Governance

### 11.1 Guardrails Philosophy

Every AI agent in ZEGA AI operates within a **multi-layered safety envelope**. No agent can take any action — financial, operational, or communicative — without passing through at least three guardrail layers. The system is designed to be **fail-safe**: if any guardrail layer fails, the action is blocked and escalated.

```
User/Agent Request
  │
  ├─ Layer 1: INPUT GUARDRAILS ─────── Sanitize, validate, redact
  ├─ Layer 2: EXECUTION GUARDRAILS ── Budget, authority, policy
  ├─ Layer 3: OUTPUT GUARDRAILS ────── Hallucination, bias, safety
  ├─ Layer 4: BEHAVIORAL GUARDRAILS ─ Autonomy limits, escalation
  └─ Layer 5: AUDIT GUARDRAILS ─────── Log, trace, compliance
```

---

### 11.2 Layer 1 — Input Guardrails

| Control | Implementation | Trigger |
|---|---|---|
| **PII Redaction** | Regex + NER-based detection of SSN, credit cards, phone numbers, emails | All inputs before model inference |
| **Prompt Injection Detection** | Classifier model (fine-tuned DistilBERT) + heuristic rules | All user-facing text inputs |
| **Content Policy Filter** | Blocklist + semantic similarity check against harmful categories | All inputs |
| **Schema Validation** | Zod schemas on all API payloads; A2A message schema enforcement | Every API/A2A request |
| **Input Length Limits** | Per-route configurable max token counts | All text inputs |
| **Rate Limiting** | Per-user, per-agent, per-tenant request throttling (Redis) | All requests |

### 11.3 Layer 2 — Execution Guardrails

| Control | Scope | Enforcement |
|---|---|---|
| **Token Budget** | Per-agent daily/monthly inference token quotas | Redis counter; hard block at limit |
| **Spending Authority** | Per-agent, per-mesh, per-subsidiary financial limits | Policy Engine (OPA/Cedar) check before every payment |
| **Authority Boundaries** | Tier-based authority matrix (Tier 0/1/2) | Agent manifest declares max authority level |
| **Escalation Threshold** | Actions above agent authority auto-escalate to higher tier | A2A escalation message to coordinator/OmniOrchestrator |
| **Time-Boxing** | Maximum execution time per agent task | Fastify request timeout + BullMQ job TTL |
| **Resource Quotas** | CPU, memory, concurrent request limits per agent | Kubernetes resource limits + Fastify backpressure |

### 11.4 Layer 3 — Output Guardrails

| Control | Implementation | Action on Failure |
|---|---|---|
| **Hallucination Detection** | Cross-reference outputs against knowledge graph + source documents | Flag confidence score; block if below threshold |
| **Factual Grounding** | Require citations/sources for all factual claims | Append source links; warn if ungrounded |
| **Bias Monitoring** | Statistical bias detection on model outputs (gender, race, geography) | Log alert; trigger review queue |
| **Toxicity Filter** | Multi-class toxicity classifier on all generated text | Block and regenerate with safety prompt |
| **Financial Accuracy** | Automated reconciliation check on any financial output | Block if diverges >0.01% from source data |
| **PII Leak Prevention** | Re-scan outputs for any PII that survived redaction | Strip PII; log security event |
| **Schema Conformance** | Validate agent outputs against expected response schemas | Reject malformed outputs; retry with correction prompt |

### 11.5 Layer 4 — Behavioral Guardrails

| Control | Description | Implementation |
|---|---|---|
| **Autonomy Boundaries** | Define what each agent can do WITHOUT human approval | Capability manifest + Policy Engine |
| **Human-in-the-Loop** | Actions exceeding thresholds require human confirmation | WebSocket notification to dashboard; 15-min timeout |
| **Decision Chains** | Multi-agent decisions require consensus (configurable quorum) | A2A voting protocol; majority required |
| **Emergency Kill Switch** | Instant freeze of any agent, mesh, or entire platform | Redis pub/sub broadcast; <1s propagation |
| **Runaway Detection** | Detect agents in infinite loops or excessive resource consumption | Circuit breaker pattern; auto-suspend after 3 failures |
| **Feedback Loops** | Prevent recursive agent-to-agent escalation spirals | Max escalation depth (configurable, default: 3) |
| **Cooldown Periods** | Mandatory wait between consecutive high-impact decisions | Redis-based cooldown timers |

### 11.6 Layer 5 — Audit Guardrails

Every single AI action is logged immutably:

```json
{
  "audit_id": "uuid-v7",
  "timestamp": "2026-07-27T12:00:00.000Z",
  "agent_id": "fiscalguard-hybrid-001",
  "mesh": "finance-mesh",
  "action": "PAYMENT_APPROVED",
  "model_provider": "anthropic",
  "model_id": "claude-sonnet-4-20250514",
  "model_version": "2025-05-14",
  "input_tokens": 1247,
  "output_tokens": 89,
  "input_hash": "sha256:abc...",
  "output_hash": "sha256:def...",
  "guardrails_passed": ["pii_redact", "budget_check", "compliance_screen", "hallucination_check"],
  "guardrails_failed": [],
  "confidence_score": 0.94,
  "decision_rationale": "Payment within budget policy; vendor verified; compliance passed for US jurisdiction",
  "latency_ms": 342,
  "cost_usd": 0.0023,
  "tenant_id": "subsidiary-a",
  "trace_id": "01J..."
}
```

---

### 11.7 Multi-Model Router Architecture

#### 11.7.1 Provider Configuration

| Provider | Models | Use Cases | Latency (P99) | Cost Tier |
|---|---|---|---|---|
| **Anthropic** | Claude Sonnet 4, Claude Haiku | Complex reasoning, code, analysis | ~800ms | Medium |
| **OpenAI** | GPT-4.1, GPT-4.1-mini | General purpose, function calling | ~600ms | Medium-High |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash | Multi-modal, long context | ~700ms | Medium |
| **Mistral** | Mistral Large, Codestral | European compliance, code generation | ~400ms | Low-Medium |
| **Self-Hosted** | Llama 3, Qwen 3 | Sensitive data (no external API) | ~200ms | Infrastructure |

#### 11.7.2 Routing Strategies

| Strategy | Description | When Used |
|---|---|---|
| **Cost-Optimized** | Route to cheapest capable model | Batch operations, non-critical |
| **Latency-Optimized** | Route to fastest model | Real-time dashboards, user-facing |
| **Accuracy-Optimized** | Route to most capable model | Financial decisions, compliance |
| **Compliance-Restricted** | Route to EU/self-hosted only | GDPR-sensitive data processing |
| **Fallback Chain** | Auto-failover: Primary → Secondary → Tertiary | Provider outages |
| **A/B Routing** | Split traffic for model comparison | Continuous evaluation |

#### 11.7.3 Model Selection Decision Tree

```
Incoming Inference Request
  │
  ├─ Data contains PII/sensitive? ─── YES → Self-Hosted (Llama/Qwen)
  │                                    NO ↓
  ├─ GDPR jurisdiction? ──────────── YES → Mistral (EU) or Self-Hosted
  │                                    NO ↓
  ├─ Complex reasoning needed? ───── YES → Anthropic Claude Sonnet 4
  │                                    NO ↓
  ├─ Latency critical (<200ms)? ──── YES → Google Gemini Flash / Mistral
  │                                    NO ↓
  ├─ Budget remaining? ──────────── HIGH → OpenAI GPT-4.1
  │                                  LOW → GPT-4.1-mini / Gemini Flash
  └─ Default → Cost-optimized selection
```

---

### 11.8 Prompt Engineering Standards

| Standard | Requirement |
|---|---|
| **Structured Prompts** | All agent prompts use versioned templates stored in `@zega/shared` |
| **System Prompt Immutability** | System prompts are code-reviewed and version-controlled; agents cannot modify their own system prompts |
| **Context Windowing** | MCP enforces sliding window of relevant context (configurable per agent) |
| **Few-Shot Examples** | Critical agent tasks include validated few-shot examples in prompts |
| **Output Formatting** | All prompts specify structured output format (JSON schema) |
| **Chain-of-Thought** | Complex decisions require explicit reasoning chain in responses |
| **Prompt Injection Defense** | User inputs are wrapped in XML-tagged boundaries within prompts |

---

### 11.9 Continuous Safety Monitoring

| Metric | Alert Threshold | Action |
|---|---|---|
| **Hallucination Rate** | >5% of outputs | Reduce agent autonomy; increase human review |
| **Token Budget Burn Rate** | >80% of daily budget before noon | Alert OmniOrchestrator; throttle non-critical agents |
| **Guardrail Failure Rate** | >1% of requests blocked | Investigation ticket; model re-evaluation |
| **Agent Escalation Rate** | >10% of decisions escalated | Review agent authority boundaries |
| **Cross-Mesh Conflict Rate** | >3 unresolved conflicts/hour | OmniOrchestrator arbitration review |
| **PII Leak Detection** | Any incident | P0 incident; immediate containment |
| **Model Latency P99** | >2s for any provider | Activate failover routing |

### 11.10 Human Oversight Dashboard

The ZEGA AI Command Center provides real-time visibility into all AI agent operations:

| Panel | Data Displayed |
|---|---|
| **Agent Activity Feed** | Live stream of agent actions with confidence scores |
| **Guardrail Dashboard** | Pass/fail rates per guardrail layer, trending |
| **Token Budget Monitor** | Per-agent, per-mesh consumption with forecasting |
| **Escalation Queue** | Pending human-in-the-loop approvals with priority |
| **Model Performance** | Latency, cost, accuracy metrics per AI provider |
| **Compliance Status** | Real-time regulatory compliance across jurisdictions |
| **Kill Switch Controls** | One-click freeze for any agent, mesh, or platform-wide |

---

### 11.11 Frontend Chart.js Symbol Integration & Non-Gradient Color Standards

To maintain an enterprise-grade, data-driven visual aesthetic across all UI environments, the 5 Guardrail layers in the frontend visualization are mapped to standard **Chart.js SVG chart symbols** and strictly enforced **solid, non-gradient color tokens**:

| Guardrail Layer | Symbol Component | Primary Color Token | Hex Code | Visual Rationale |
|---|---|---|---|---|
| **`Input Sanitize`** | `ChartJsBarSymbol` | Chart.js Blue | `#36A2EB` | Represents structured input data validation & schema checking bars |
| **`PII Redaction`** | `ChartJsDoughnutSymbol` | Chart.js Purple | `#9966FF` | Represents data segmentation & selective masking sectors |
| **`Injection Block`** | `ChartJsScatterSymbol` | Chart.js Amber | `#FF9F40` | Represents anomaly point detection & threat scatter isolation |
| **`Output Filter`** | `ChartJsLineSymbol` | Chart.js Rose/Red | `#FF6384` | Represents output boundary threshold & safety curve filtering |
| **`Audit Trail`** | `ChartJsStepSymbol` | Chart.js Teal | `#4BC0C0` | Represents discrete step-by-step state verification & logging |

#### 11.11.1 Design System Rule for Safety Indicators
1. **No Gradients**: All 5 Guardrail pills and status badges must avoid gradient fills (`bg-gradient-to-...`) to eliminate visual clutter ("AI-slop") and maximize readability.
2. **Solid Color & Theme Awareness**: Each guardrail pill uses its designated Chart.js solid color for icons, text highlights, and high-contrast borders, backed by subtle solid background containers in both light and dark modes.

