# 📚 ZEGA AI Documentation Index

Welcome to the official documentation repository for **ZEGA AI × ZeroClaw** — Autonomous Solana Pay Merchant Infrastructure.

---

## 🛡️ Security, Hardening & Audit Reports

These documents contain the complete hostile forensic audit, threat model, automated test matrices, and security remediation history for the Superteam Brasil ZeroClaw Bounty.

| Document | Category | Summary |
|----------|----------|---------|
| [**`ZEROCLAW_FORENSIC_AUDIT.md`**](ZEROCLAW_FORENSIC_AUDIT.md) | 🛡️ Audit Report | **Hostile Forensic Security Audit (Score 91/100 GO Verdict)** — 10-layer deep code, config, & schema evaluation. |
| [**`ZEGA_PRIVY_WITHDRAWAL_ARCHITECTURE.md`**](ZEGA_PRIVY_WITHDRAWAL_ARCHITECTURE.md) | 🔑 Architecture | **Privy Non-Custodial Solana Withdrawal Architecture** — Dual-auth integration, Base58 address resolution, and enclave signing. |
| [**`ZEGA_FINAL_HARDENING_REPORT.md`**](ZEGA_FINAL_HARDENING_REPORT.md) | 🔒 Verification | **Final System Hardening Report** — Automated test suite breakdown (89/89 PASS) & deployment matrices. |
| [**`REMEDIATION_BASELINE.md`**](REMEDIATION_BASELINE.md) | 🧪 Remediation | **Security Remediation Baseline Log** — Fixes for anti-replay, RLS policies, & PostgreSQL triggers. |
| [**`SECURITY_THREAT_MODEL.md`**](zeroclaw/SECURITY_THREAT_MODEL.md) | 🛡️ OWASP Security | **Threat Model & OWASP Level 3 Prompt Injection Protection** — Injection prevention & T1 custody boundaries. |

---

## 🤖 ZeroClaw Integration Guides

| Document | Description |
|----------|-------------|
| [**`zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md`**](zeroclaw/ZEROCLAW_ZEGA_INTEGRATION_GUIDE.md) | Architectural guide connecting ZeroClaw Rust runtime with Fastify & Supabase. |
| [**`zeroclaw/AGENT_OPERATOR_GUIDE.md`**](zeroclaw/AGENT_OPERATOR_GUIDE.md) | Operational manual for running merchant agents on WhatsApp, Telegram, & Web POS. |
| [**`zeroclaw/REPRODUCIBILITY.md`**](zeroclaw/REPRODUCIBILITY.md) | **Step-by-Step Judge Reproducibility Manual** for setting up local & devnet daemons. |
| [**`zeroclaw/config.toml`**](zeroclaw/config.toml) | Reference production ZeroClaw agent configuration file. |

---

## 📐 Product Requirement Documents (PRDs)

The [`PRD/`](PRD/) directory contains 41 detailed specifications covering every aspect of ZEGA AI:

- [**`PRD/01-EXECUTIVE-SUMMARY.md`**](PRD/01-EXECUTIVE-SUMMARY.md) — Platform Vision & Objectives
- [**`PRD/02-SYSTEM-ARCHITECTURE.md`**](PRD/02-SYSTEM-ARCHITECTURE.md) — System Topology & Component Layout
- [**`PRD/04-PAYMENT-INFRASTRUCTURE.md`**](PRD/04-PAYMENT-INFRASTRUCTURE.md) — Solana Pay Reference Key Polling & Reconciliation
- [**`PRD/05-SECURITY-COMPLIANCE.md`**](PRD/05-SECURITY-COMPLIANCE.md) — OWASP Security & Keyless T1 Custody Rules
- [**`PRD/19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md`**](PRD/19-ZEROCLAW-SOLANA-INTEGRATION-SPEC.md) — Native ZeroClaw Integration Specification
- [**`PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md`**](PRD/29-SOLANA-RPC-FAILOVER-MANAGER-SPEC.md) — 4-Tier RPC Provider Failover Architecture
- [**`PRD/36-ZERO-CLAW-HARDENED-INVOICE-DELIVERY-AND-REALTIME-VAULT-SPEC.md`**](PRD/36-ZERO-CLAW-HARDENED-INVOICE-DELIVERY-AND-REALTIME-VAULT-SPEC.md) — Hardened Invoice Vault & CDN Spec

---

*Copyright © 2026 ZEGA AI. All rights reserved.*
