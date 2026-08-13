# ZEGA.AI Claim & Evidence Reconciliation Matrix

## 1. Master Forensic Claim Audit

This document maps all material claims found across historical audit reports (`docs/audit/`, `docs/PRD/`) to empirical repository evidence.

```text
Evidence Legend:
  E0: Assertion Only (UNVERIFIED)
  E1: Design / Specification (PRD)
  E2: Source Code Implementation
  E3: SQL Schema / Migration / Policy
  E4: Executable Automated Test
  E5: Persisted Test Output / Log
  E6: Reproducible Verification Command
  E7: Independent Verification
```

---

## 2. Claim Reconciliation Table

| Claim ID | Category | Documented Assertion | Repository Evidence Reference | Evidence Level | Verification Command | Status |
|---|---|---|---|---|---|---|
| **CLM-DB-01** | Database | "397 database tables audited" | `supabase/migrations/*.sql` (56 files) | **E3 / E6** | `python3 /tmp/generate_db_inventory.py` | `RECONCILED` (77 tables exist) |
| **CLM-DB-02** | Database | "100% RLS tenant isolation" | 68/77 tables enabled; 9 system tables exempt | **E3 / E4** | `DATABASE_INVENTORY.md` | `PARTIALLY_VERIFIED` |
| **CLM-TST-01**| Verification| "30/30 test suites" | 30 test files in `apps/api` & `packages` | **E4 / E6** | `pnpm --filter @zega/api test` | `VERIFIED` (366 test cases) |
| **CLM-TST-02**| Verification| "89 platform security integration tests" | `foundation-hardening.test.ts` & `adversarial-security.test.ts` | **E4** | `TEST_MATRIX.md` | `RECONCILED` (89 subset tests) |
| **CLM-SOL-01**| Solana Pay | "Replay attack protection" | Unique index on signature in `zeroclaw_solana_settlements` | **E3 / E4** | `settlement-integration.test.ts` | `VERIFIED` |
| **CLM-SOL-02**| Solana Pay | "Mint & recipient verification" | `settlementValidation.ts` & `settlementVerificationService.ts` | **E2 / E4** | `check-payment-strictness.test.ts` | `VERIFIED` |
| **CLM-WTH-01**| Withdrawals | "Atomic concurrency lock" | Row-level `FOR UPDATE` lock in `WithdrawalService.ts` | **E2 / E4** | `withdrawal-concurrency-remediation.test.ts` | `VERIFIED` |
| **CLM-ZC-01** | ZeroClaw | "Privy wallet signing integration" | `zeroclaw.routes.ts` & Privy SDK signature check | **E2 / E4** | `zeroclaw-privy-signing.test.ts` | `VERIFIED` |
| **CLM-ZC-02** | ZeroClaw | "Live upstream production daemon" | `scripts/zeroclaw-daemon-harness.ts` bridge harness | **E2 / E6** | `scripts/verify-zeroclaw.sh` | `DOCUMENTED / PARTIALLY_VERIFIED` |
| **CLM-SEC-01**| Security | "Zero IDOR vulnerabilities" | `multi-tenant-isolation.test.ts` & `adversarial-security.test.ts` | **E4** | `pnpm test multi-tenant-isolation` | `RECONCILED` (No IDOR in scope) |
| **CLM-SEC-02**| Security | "Prompt injection defense" | `prompt-injection.test.ts` (7 guardrail tests) | **E4** | `pnpm test prompt-injection` | `VERIFIED` |

---

## 3. Discrepancy Resolution Summary

1. **Table Count Resolution**: Historical docs cited 397, 295, or 286 tables. Empirical code audit proves **77 unique database tables** exist across all 56 migration files. Previous numbers represented external schema benchmarks or unverified assertions.
2. **Security Claims Resolution**: Absolute claims ("zero IDOR", "100% secure") have been replaced with precise evidence-backed status ("No IDOR detected in 29 tested API routes").
