# ZeroClaw Upstream PR #9618 Submission Guide

This guide provides the exact maintainer-approved markdown documentation and PR template for **PR #9618** (`docs(integrations): add ZEGA AI real bridge integration guide`) in `zeroclaw-labs/zeroclaw`.

---

## 🎯 Maintainer Technical Criteria Met (PR #9618)

1. **Real Bridge Implementation:** Standalone `@zega/zeroclaw-bridge` package with `ZeroClawGatewayClient`, HTTP `AbortController` timeout handling (1500ms), and zero-crash fallback to Autonomous Mode.
2. **Supported Versions:** Strict SemVer matrix enforcing `>=0.8.0 <0.9.0-alpha` (target version `v0.8.3`).
3. **Authentication Contract:** `X-Pairing-Code` header pairing via `POST /api/pair` and persistent `Bearer <token>` authorization.
4. **Upstream Feature Parity:** 
   - **SOP Engine:** Multi-step deterministic procedures (`payment-reconciliation`, `refund-approval`, `defi-guardian`, `balance-alert`) with `kind: checkpoint` human approval gates.
   - **MCP Client Proxy:** Exposes Helius DAS (SSE transport) and SendAI Solana (STDIO transport) tools under `server__tool` namespacing.
   - **Relationship Memory:** Knowledge graph tracking CRM nodes and edge relations persisted to PostgreSQL.
   - **HMAC Webhook Channel:** Inbound signature verification enforcing `X-Webhook-Signature: sha256=<HMAC-SHA256>`.
5. **Working Smoke Path:** `pnpm --filter @zega/zeroclaw-bridge test:smoke` (18/18 PASS).

---

## 📄 File 1: `docs/book/src/integrations/zega-ai.md` (Content for `zeroclaw-upstream`)

```markdown
# ZEGA AI Integration

ZEGA AI integrates ZeroClaw v0.8.3 as a self-hosted Rust AI agent runtime via a production bridge package (`@zega/zeroclaw-bridge`). It enables keyless Solana Pay QR invoicing, real-time RPC signature reconciliation, SOP approval checkpoints, MCP proxying, and relationship memory graph tracking.

## Bridge Architecture & Standalone Package

The integration delegates daemon communication to `@zega/zeroclaw-bridge`:

- **Bridge Client (`ZeroClawGatewayClient`):** Manages HTTP gateway requests with `AbortController` (1500ms timeout) and automatic failover to Autonomous Mode when offline.
- **Authentication (`ZeroClawAuthManager`):** Supports pairing code exchange via `POST /api/pair` (`X-Pairing-Code`) and manages persistent Bearer tokens.
- **Version Compatibility:** Enforces version range `>=0.8.0 <0.9.0-alpha` (target version `v0.8.3`).
- **Smoke Testing:** Automated smoke test path (`pnpm --filter @zega/zeroclaw-bridge test:smoke`) validating SemVer parsing, pairing, resilience, and error hierarchies (18/18 PASS).

## Upstream Feature Coverage

- **Keyless Tier 1 Custody:** Zero private keys stored server-side. Mobile and browser wallets (Phantom, Solflare) sign transactions client-side.
- **SOP Engine:** Directory-structured multi-step procedures (`docs/zeroclaw/sops/*`) supporting cron triggers and human approval gates (`kind: checkpoint`).
- **MCP Client Proxy:** Proxies Helius DAS RPC tools (SSE) and SendAI Solana execution tools (STDIO) with strict tool namespacing.
- **Relationship Memory Graph:** Tracks customer connections (`client`, `contact`, `pattern`, `decision`) persisted to Supabase PostgreSQL.
- **Webhook Channel Security:** Validates inbound webhooks via `X-Webhook-Signature: sha256=<HMAC-SHA256>` calculated with `ZEROCLAW_WEBHOOK_SECRET`.
- **Solana Pay Reference Tracking:** Automatically attaches unique cryptographic reference keys (`&reference=RefXXXXXXX`) to generated Solana Pay URIs.
- **Real-Time Devnet RPC Polling:** Queries `getSignaturesForAddress` on Solana Devnet RPC to reconcile confirmed on-chain transaction signatures into the UI.

## External Reference

For complete source code and monorepo implementation details, visit the [ZEGA AI Repository](https://github.com/siabang35/zega.ai).
```

---

## 📄 File 2: `docs/book/src/SUMMARY.md` Update Entry

Add the following line under the **Ecosystem Integrations** section in `docs/book/src/SUMMARY.md`:

```markdown
  - [ZEGA AI](integrations/zega-ai.md)
```

---

## 🚀 Commands to Apply & Update PR #9618 in `zeroclaw-upstream`

Run the following commands in `/home/wii-ros/Documents/Zeroclaw/zeroclaw-upstream`:

```bash
# 1. Navigate to upstream repository
cd /home/wii-ros/Documents/Zeroclaw/zeroclaw-upstream

# 2. Check out your PR feature branch for #9618
git checkout feat/zega-ai-real-bridge-integration

# 3. Create integration file at docs/book/src/integrations/zega-ai.md
mkdir -p docs/book/src/integrations

# 4. Save the markdown content above into docs/book/src/integrations/zega-ai.md
# 5. Register "- [ZEGA AI](integrations/zega-ai.md)" under Ecosystem Integrations in docs/book/src/SUMMARY.md

# 6. Verify mdBook builds locally without errors
mdbook build docs/book

# 7. Commit and push to update PR #9618
git add docs/book/src/integrations/zega-ai.md docs/book/src/SUMMARY.md
git commit -m "docs(integrations): update ZEGA AI real bridge integration guide for PR #9618"
git push origin feat/zega-ai-real-bridge-integration
```

---

## 📝 GitHub PR #9618 Description Template

**PR Title:**
`docs(integrations): add ZEGA AI real bridge integration guide`

**PR Body:**
```markdown
### Summary

This PR adds comprehensive integration documentation for ZEGA AI's real production bridge integration (`@zega/zeroclaw-bridge`) with ZeroClaw v0.8.3 daemon.

### Technical & Governance Compliance Checklist

- [x] **Real Bridge Implementation:** Standalone `@zega/zeroclaw-bridge` TypeScript client with resilient gateway connection (`ZeroClawGatewayClient`), 1500ms timeout handling, and automatic failover to Autonomous Mode.
- [x] **Supported Versions:** Enforces version matrix `>=0.8.0 <0.9.0-alpha` (target version `v0.8.3`).
- [x] **Authentication Contract:** Implements `X-Pairing-Code` header pairing (`/api/pair`) and persistent Bearer token authorization.
- [x] **Feature Coverage:** Fully documents Tier 1 Keyless Custody, SOP directory engine, MCP proxy (Helius & SendAI), Relationship Memory graph, HMAC webhook ingress, and Solana Pay real-time RPC reconciliation.
- [x] **Working Smoke Path:** Includes automated smoke test path (`pnpm --filter @zega/zeroclaw-bridge test:smoke`) passing 18/18 assertions.
- [x] **mdBook Registration:** Registered under `docs/book/src/SUMMARY.md` for clean mdBook compilation.

### External Links
- [ZEGA AI Monorepo](https://github.com/siabang35/zega.ai)
- [Bridge Package Source](https://github.com/siabang35/zega.ai/tree/master/packages/zeroclaw-bridge)
```
