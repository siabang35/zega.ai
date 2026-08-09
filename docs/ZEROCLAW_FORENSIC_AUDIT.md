# ZEGA × ZeroClaw — Repository Forensic Audit Report

> **Audit Date**: August 9, 2026  
> **Repository**: [github.com/siabang35/zega.ai](https://github.com/siabang35/zega.ai)  
> **Bounty Target**: Superteam Brasil — "Build Solana-native plugins for ZeroClaw"  
> **Prize Pool**: 5,000 USDG (1st Place: 1,800 USDG)  
> **Auditor Role**: Principal Engineer / Solana Security Engineer / DevSecOps  

---

## 1. Executive Summary

ZEGA is a **TypeScript monorepo** (Fastify API + Vite SPA) that provides a full-stack Solana Pay merchant operations platform with AI-assisted invoice generation, real-time on-chain payment detection, 5-layer OWASP security verification, and a production-grade multi-provider RPC failover engine.

### What Is Genuinely Implemented

| Component | Status | LOC | Evidence |
|:----------|:------:|:---:|:---------|
| Solana Pay URL construction | ✅ Real | — | `Keypair.generate().publicKey.toBase58()` reference keys |
| 5-layer on-chain settlement verification | ✅ Real | ~200 | Amount, Base58, anti-replay, signature status, tx detail |
| Multi-provider RPC Manager | ✅ Real | 632 | Circuit breaker, backoff, token bucket, dedup, cache |
| Signature Monitor (background poller) | ✅ Real | 605 | `getSignaturesForAddress` + `getTransaction` parsing |
| Prompt injection detection | ✅ Real | ~50 | 7 regex patterns + rate limiter + payload cap |
| T1 Keyless custody | ✅ Real | — | Zero private keys in server code. Privy embedded wallets. |
| ZeroClaw bridge client | ✅ Real | 267 | HTTP client with retry, auth, version check |
| ZeroClaw config.toml | ✅ Real | 138 | Correct schema, ENV_ placeholders for all secrets |
| ZeroClaw SOPs (TOML) | ✅ Real | 4 files | Correct trigger schemas (cron + channel) |
| ZeroClaw skills (markdown) | ✅ Real | 4 files | Solana Pay, merchant memory, DeFi guardian, Blinks |

### What Is Simulated or Mock

| Component | Status | Notes |
|:----------|:------:|:------|
| ZeroClaw daemon | ⚠️ TypeScript mock harness | Not the upstream Rust binary |
| SOP execution engine | ⚠️ Console.log only | SOPs are not executed by a real SOP runtime |
| Human approval checkpoints | ⚠️ ID generated, not blocking | Checkpoint IDs logged but execution is not gated |
| MCP server integration | ⚠️ Config-only | config.toml declares MCP servers but no runtime loads them |
| HMAC webhook verification | ⚠️ Documented, not coded | Threat model claims it; code does not verify signatures |

---

## 2. Repository Structure

```
ZEGA/
├── apps/
│   ├── api/                          # Fastify API (Node.js + TypeScript)
│   │   └── src/
│   │       ├── routes/v1/
│   │       │   └── zeroclaw.routes.ts    # 4,497 lines — core payment pipeline
│   │       └── services/
│   │           ├── solanaRpcManager.ts    # 632 lines — RPC pool + circuit breaker
│   │           └── zeroclawSignatureMonitor.ts  # 605 lines — background poller
│   └── web/                          # Vite SPA (React + TypeScript)
├── packages/
│   ├── zeroclaw-bridge/              # TypeScript HTTP client for ZeroClaw daemon
│   │   └── src/
│   │       ├── client.ts             # Gateway client with retry + auth
│   │       ├── auth.ts               # Bearer token manager
│   │       ├── version.ts            # SemVer compatibility checker
│   │       └── __tests__/smoke.test.ts   # 1 smoke test (15 assertions)
│   ├── config/
│   ├── shared/
│   └── supabase/
├── scripts/
│   ├── zeroclaw-daemon-harness.ts    # ⚠️ TypeScript mock (NOT Rust binary)
│   └── run-zeroclaw-demo.sh
├── docs/
│   ├── zeroclaw/
│   │   ├── config.toml               # Agent config (ENV_ secret placeholders)
│   │   ├── skills/                    # 4 skill definition files
│   │   ├── sops/                      # 4 SOP TOML configs
│   │   ├── SECURITY_THREAT_MODEL.md
│   │   └── REPRODUCIBILITY.md
│   └── superteam/                     # Grant application docs
├── .github/workflows/ci.yml          # Build + type-check only (no tests)
├── .env.example                       # Template with placeholder secrets
└── .gitignore                         # Properly excludes .env, keys, certs
```

**Key Finding**: Zero `.rs` (Rust) files exist in the entire repository. Zero `Cargo.toml`. Zero WASM/WASI components.

---

## 3. Feature-by-Feature Audit Matrix

### 3.1 Solana Payment Pipeline

| Feature | Implemented | Tested | Production Quality | Evidence |
|:--------|:---:|:---:|:---:|:---------|
| Reference key generation | ✅ | ⚠️ E2E only | ✅ | `Keypair.generate().publicKey.toBase58()` — real Ed25519 |
| Solana Pay URL construction | ✅ | ⚠️ E2E only | ✅ | `solana:<recipient>?amount=...&reference=...&spl-token=...` |
| QR code rendering | ✅ | ❌ | ✅ | Frontend renders scannable QR from URL |
| Payment detection (RPC polling) | ✅ | ❌ | ✅ | `getSignaturesForAddress` on reference keys |
| Transaction verification | ✅ | ❌ | ✅ | `getTransaction` + recipient + amount match |
| Recipient verification | ✅ | ❌ | ✅ | Layer 5: merchant wallet or reference key match |
| Amount verification | ✅ | ❌ | ✅ | Zero-amount rejection + underpaid/overpaid logic |
| Freshness verification | ✅ | ❌ | ✅ | 72-hour max transaction age |
| Anti-replay | ✅ | ❌ | ⚠️ In-memory | `processedSignaturesSet` — lost on restart |
| Mint verification | ⚠️ Partial | ❌ | ❌ | SPL parsing exists but no explicit mint address check |
| Failed tx handling | ⚠️ Partial | ❌ | ⚠️ | `err` field checked but no structured retry |
| Duplicate invoice detection | ❌ | ❌ | ❌ | Not implemented |

### 3.2 RPC Infrastructure

| Feature | Implemented | Evidence |
|:--------|:---:|:---------|
| Multi-provider pool | ✅ | 4 configurable providers via ENV vars |
| Circuit breaker | ✅ | Exponential cooldown: 30s → 60s → 120s |
| Exponential backoff + jitter | ✅ | 1s → 2s → 4s → 8s ± 200ms |
| Token bucket rate limiting | ✅ | Configurable RPS per provider |
| In-flight request deduplication | ✅ | Promise coalescing for identical calls |
| Smart response caching | ✅ | TTL-based per RPC method |
| Health-weighted provider selection | ✅ | Least latency + highest health score |
| RPC method whitelist | ✅ | Only 12 allowed methods; others rejected |
| URL sanitization in logs | ✅ | API keys stripped before logging |

### 3.3 Security Layer

| Feature | Implemented | Tested | Production Quality |
|:--------|:---:|:---:|:---:|
| T1 keyless custody | ✅ | — | ✅ |
| Rate limiting (30 req/min) | ✅ | ❌ | ✅ |
| Payload size cap (1MB) | ✅ | ❌ | ✅ |
| Prompt injection regex | ✅ (7 patterns) | ❌ | ⚠️ Regex-only |
| Base58 input sanitization | ✅ | ❌ | ✅ |
| Unicode zero-width stripping | ✅ | ❌ | ✅ |
| HMAC webhook verification | ❌ Not coded | — | ❌ |
| Deterministic policy engine | ❌ | — | ❌ |
| Real approval gate (blocking) | ❌ | — | ❌ |

### 3.4 ZeroClaw Integration

| Feature | Implemented | Status |
|:--------|:---:|:---------|
| Upstream Rust binary | ❌ | Not present in repo |
| WASM/WASI plugin | ❌ | Not present in repo |
| TypeScript daemon harness | ✅ | Mock HTTP server on :4242 |
| config.toml | ✅ | Well-structured, ENV_ placeholders |
| SOPs (TOML) | ✅ | 4 correctly-formatted SOP configs |
| Skills (markdown) | ✅ | 4 skill definition files |
| Bridge HTTP client | ✅ | Retry, auth, version check |
| Real SOP execution | ❌ | SOPs logged, never executed |
| Real skill loading | ❌ | Skills documented, never loaded |
| Real MCP runtime | ❌ | Config declares MCP, no runtime |

---

## 4. Custody Tier Verification

**Claimed**: T1 (Keyless / Unsigned)  
**Verification Result**: ✅ **CONFIRMED GENUINE**

### Evidence of T1 Compliance

1. **No private key handling in server code**: Searched entire `apps/` directory for `private_key`, `secret_key`, `mnemonic`, `seed_phrase` — zero results.
2. **`Keypair.generate()`** is used **only** to extract the public key for reference key generation. The secret key is immediately discarded.
3. **All transaction signing** happens client-side via Privy embedded wallets or customer wallet apps (Phantom, Solflare, Backpack).
4. **`config.toml`** explicitly declares `custody_tier = "T1"` and `excluded_tools = ["sendai-solana__transfer", "sendai-solana__sign_transaction"]`.
5. **No `signTransaction`, `sendTransaction` with private key, or `transfer` tool** exists in the Fastify backend.

**This is a genuine strength of the submission.**

---

## 5. Identified Risks (Prioritized)

### P0 — Potentially Disqualifying

| ID | Risk | Impact | File |
|:---|:-----|:-------|:-----|
| P0-1 | ZeroClaw daemon is a TypeScript mock, not the Rust binary | A judge asking "Is this actually ZeroClaw?" sees a 161-line TS faker | `scripts/zeroclaw-daemon-harness.ts` |
| P0-2 | Showcase claims "Built with 🦀 Rust" — zero Rust code exists | Materially false claim → immediate credibility loss | `ZEROCLAW_SOLANA_BOUNTY_SHOWCASE.md:144` |
| P0-3 | Zero automated security or payment tests. CI runs no tests. | Craft (20%) and Safety (25%) scores collapse | `.github/workflows/ci.yml` |
| P0-4 | Approval checkpoints are simulated, not blocking | Threat model promises human gates that don't actually block | `zeroclaw.routes.ts` |

### P1 — Significant Scoring Loss

| ID | Risk | Impact |
|:---|:-----|:-------|
| P1-1 | Anti-replay cache is in-memory `Set<string>` — lost on restart | Signature replay possible after server restart |
| P1-2 | HMAC webhook verification documented but not implemented | Threat model claim unsupported by code |
| P1-3 | Prompt injection defense is 7 regex patterns only | Creative attackers can bypass easily |
| P1-4 | No explicit USDC mint verification in settlement | Wrong SPL token could be accepted |
| P1-5 | CI runs `type-check` + `build` only — no test step | Zero test coverage enforcement |
| P1-6 | config.toml, SOPs, and skills are dead documentation | Never consumed by any runtime |

### P2 — Meaningful Improvements

| ID | Improvement |
|:---|:-----------|
| P2-1 | Merchant memory is in-memory only, lost on restart |
| P2-2 | No structured audit trail / observability dashboard |
| P2-3 | E2E test has hardcoded test wallet and signature |
| P2-4 | Dashboard is feature-rich but unrelated to bounty scoring |

---

## 6. Security Vulnerability Assessment

### 6.1 Prompt Injection Attack Surface

**Current Defense**: 7 static regex patterns:
```
/override\s+safety/i
/bypass\s+approval/i
/refund\s+without\s+verification/i
/force\s+payout/i
/ignore\s+previous\s+instructions/i
/transfer\s+all\s+funds/i
/system\s+prompt\s+leak/i
```

**Gap**: No semantic analysis, no LLM-based guard, no deterministic policy engine between LLM output and action execution. A creative attacker using synonyms, Unicode obfuscation, or indirect injection can bypass all 7 patterns.

### 6.2 Payment Attack Matrix

| Attack Vector | Expected Result | Current Behavior | Verdict |
|:--------------|:----------------|:-----------------|:-------:|
| Correct payment | PASS | ✅ Passes correctly | ✅ |
| Wrong amount (0) | REJECT | ✅ Rejected (Layer 5) | ✅ |
| Wrong recipient | REJECT | ✅ Rejected (Layer 5) | ✅ |
| Wrong mint (not USDC) | REJECT | ⚠️ Not explicitly checked | ⚠️ |
| Missing reference key | REJECT | ✅ Rejected (Layer 2) | ✅ |
| Replay after restart | REJECT | ❌ Accepted (in-memory cache cleared) | ❌ |
| Stale tx (>72h) | REJECT | ✅ Rejected (Layer 5) | ✅ |
| Failed tx (`err !== null`) | REJECT | ✅ Rejected (Layer 4) | ✅ |
| Malformed signature | REJECT | ✅ Rejected (Layer 2 Base58) | ✅ |
| RPC unavailable | FAIL CLOSED / RETRY | ✅ Circuit breaker + failover | ✅ |
| Duplicate invoice | REJECT | ❌ Not checked | ❌ |
| Prompt injection | BLOCK | ⚠️ Regex-only, bypassable | ⚠️ |

### 6.3 Secret Handling

| Check | Result |
|:------|:------:|
| `.env` files in `.gitignore` | ✅ |
| No hardcoded API keys in source | ✅ |
| `.env.example` uses placeholders | ✅ |
| `config.toml` uses `ENV_` prefixes | ✅ |
| `sanitizeRpcUrl()` strips keys from logs | ✅ |
| Daemon harness has hardcoded bearer token | ⚠️ Dev-only |

---

## 7. Testing Coverage

| Category | Count | Quality |
|:---------|:-----:|:-------:|
| Bridge smoke tests | 15 assertions | ⚠️ Basic verification |
| Security tests | 0 | ❌ |
| Payment reconciliation tests | 0 | ❌ |
| RPC failover tests | 0 | ❌ |
| Prompt injection tests | 0 | ❌ |
| Integration tests | 0 | ❌ |
| E2E tests | 1 manual script | ⚠️ |
| CI test execution | 0 | ❌ |

---

## 8. Documentation vs. Reality

| Document | Claim | Reality | Verdict |
|:---------|:------|:--------|:-------:|
| `BOUNTY_SHOWCASE.md:144` | "Built with 🦀 Rust" | Zero Rust code in repo | ❌ False |
| `BOUNTY_SHOWCASE.md:91` | "ZeroClaw daemon running" | TypeScript mock running | ⚠️ Misleading |
| `BOUNTY_SHOWCASE.md:13` | "ZeroClaw Rust agent" | No Rust agent exists | ❌ False |
| `THREAT_MODEL.md:15` | "HMAC-SHA256 webhook verification" | Not implemented in code | ❌ Unsupported |
| `THREAT_MODEL.md:27` | "Quorum 1 human approval" | Checkpoint ID logged, not blocking | ⚠️ Misleading |
| `config.toml:75-76` | SendAI MCP via stdio | No MCP runtime loads this config | ⚠️ Dead config |
| `REPRODUCIBILITY.md` | "Start ZeroClaw binary" | No binary available | ❌ Unsupported |
| Custody: T1 Keyless | Zero private keys | ✅ Verified genuine | ✅ Correct |
| 5-layer OWASP verification | Real on-chain checks | ✅ Verified in code | ✅ Correct |
| RPC failover pool | Circuit breaker + backoff | ✅ 632 LOC implementation | ✅ Correct |

---

## 9. Bounty Score Estimate

| Criteria | Weight | Score | Justification |
|:---------|:------:|:-----:|:--------------|
| **Use Case** | 30% | 18/30 | Real merchant workflow with genuine Solana interactions. However, not running on real ZeroClaw runtime. |
| **Safety & Custody** | 25% | 16/25 | T1 custody is genuine. 5-layer verification is real. But no policy engine, regex-only injection defense, simulated approval gates. |
| **Craft** | 20% | 8/20 | Excellent RPC manager and payment pipeline. But zero Rust/WASM, zero tests in CI, mock daemon falsely presented. |
| **Reproducibility** | 15% | 6/15 | Docs exist but reference non-existent ZeroClaw binary. Fresh-machine setup fails at "start ZeroClaw" step. |
| **Showcase** | 10% | 5/10 | Good video script structure. But claims real ZeroClaw + Rust when neither exists. |
| **TOTAL** | **100%** | **53/100** | |

---

## 10. Top 10 Actions to Maximize Winning Probability

| Priority | Action | Expected Score Impact |
|:--------:|:-------|:---------------------|
| P0 | Fix all "Built with Rust" and "ZeroClaw Rust agent" claims. Be honest: this is a TypeScript integration that provides config, SOPs, and skills for ZeroClaw, with a development harness for testing. | +5 Craft, +3 Showcase |
| P0 | Add automated security tests: prompt injection attacks, wrong recipient, wrong amount, replay, RPC failure. | +4 Safety, +3 Craft |
| P0 | Add settlement reconciliation tests: correct payment, underpaid, overpaid, stale, failed. | +3 Safety, +2 Craft |
| P0 | Make CI run tests (`pnpm test` step in `ci.yml`). | +2 Craft, +2 Reproducibility |
| P1 | Implement persistent replay prevention (Supabase or SQLite). | +2 Safety |
| P1 | Add explicit USDC mint verification in settlement pipeline. | +2 Safety |
| P1 | Implement HMAC-SHA256 webhook verification (match documented claim). | +2 Safety, +1 Craft |
| P1 | Strengthen prompt injection: add more patterns + length heuristics + tool deny-list policy engine. | +2 Safety |
| P2 | Create `ZEROCLAW_BOUNTY_QUICKSTART.md` with honest, minimal 15-minute setup guide. | +3 Reproducibility |
| P2 | Clean all documentation to ensure every claim has code evidence. | +2 Showcase, +1 Reproducibility |

---

## 11. Judge Simulation

**Question**: "Would I give this 1st place?"

**Answer**: **NOT YET**

**5 Blocking Issues**:

1. **ZeroClaw authenticity**: The daemon is a TypeScript mock. A strict judge will conclude "this is not actually running ZeroClaw."
2. **False documentation**: "Built with Rust" when zero Rust exists. Credibility collapse on discovery.
3. **Zero security tests**: No automated proof that the payment verification or prompt injection defense works.
4. **No real approval gates**: Human-in-the-loop is documented but simulated.
5. **Showcase video script references "ZeroClaw Rust agent"** — will not survive technical scrutiny.

**Path to Top 3**: The underlying Solana payment pipeline, RPC manager, and T1 custody architecture are **genuinely strong and well-engineered**. If documentation honesty is fixed, security tests are added, and the submission correctly positions itself as a "ZeroClaw plugin ecosystem with TypeScript integration layer + development harness", it has a realistic path to a competitive submission.

---

*This audit was performed against commit `2c362ba` (master branch) on August 9, 2026.*
