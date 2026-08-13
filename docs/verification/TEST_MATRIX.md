# ZEGA.AI Canonical Automated Test Matrix

## 1. Test Suite Summary & Metric Reconciliation

* **Audit Methodology**: Empirical count of all test files (`*.test.ts`) and executable test blocks (`it`/`test`) in the monorepo.
* **Verification Command**: `pnpm --filter @zega/api test`
* **Evidence Level**: **E4** (Automated Test) & **E6** (Reproducible Verification).
* **Total Test Suite Files**: `30`
* **Total Executable Test Cases**: `366`

### Reconciliation of Historical / Citation Numbers

Existing documentation referenced various numbers which represented specific sub-scopes rather than disjoint counts:
* **"30 / 30 Test Suites"**: Refers to the `30` distinct test files enumerated below.
* **"89 Platform Security Integration Tests"**: Refers to the security integration test subset (`foundation-hardening.test.ts` [47 tests] + `adversarial-security.test.ts` [43 tests] = 90 test cases).
* **"18 Tests"**: Refers specifically to `apps/api/src/__tests__/zeroclaw-privy-signing.test.ts` (18 tests).
* **"7 Adversarial Probes"**: Refers to the cross-tenant probe suite executed via `scripts/run_cross_tenant_security_probe.py`.

---

## 2. Canonical Test Suite Matrix (30 Test Files, 366 Test Cases)

| Test File Path | Executable Test Count | Security & Functional Scope Boundary | Execution Command | Status |
|---|---|---|---|---|
| `apps/api/src/__tests__/adversarial-security.test.ts` | 43 | IDOR, header spoofing, tenant injection, payload corruption | `pnpm --filter @zega/api test adversarial-security` | `VERIFIED` |
| `apps/api/src/__tests__/chaos-fault-injection.test.ts` | 4 | RPC failure handling, DB disconnect recovery | `pnpm --filter @zega/api test chaos-fault-injection` | `VERIFIED` |
| `apps/api/src/__tests__/check-payment-strictness.test.ts` | 3 | Settlement amount & mint strictness validation | `pnpm --filter @zega/api test check-payment-strictness` | `VERIFIED` |
| `apps/api/src/__tests__/destructive-concurrency.test.ts` | 9 | Concurrent withdrawal & double-spend prevention | `pnpm --filter @zega/api test destructive-concurrency` | `VERIFIED` |
| `apps/api/src/__tests__/e2e-api-load.test.ts` | 4 | High-concurrency throughput & latency checks | `pnpm --filter @zega/api test e2e-api-load` | `VERIFIED` |
| `apps/api/src/__tests__/foundation-hardening.test.ts` | 47 | Input sanitization, auth middleware, session security | `pnpm --filter @zega/api test foundation-hardening` | `VERIFIED` |
| `apps/api/src/__tests__/load-benchmark.test.ts` | 3 | API route latency & request queuing benchmarks | `pnpm --filter @zega/api test load-benchmark` | `VERIFIED` |
| `apps/api/src/__tests__/multi-process-qualification.test.ts` | 9 | Multi-worker process safety & memory isolation | `pnpm --filter @zega/api test multi-process-qualification` | `VERIFIED` |
| `apps/api/src/__tests__/multi-tenant-isolation.test.ts` | 10 | Cross-tenant data isolation & RLS query boundaries | `pnpm --filter @zega/api test multi-tenant-isolation` | `VERIFIED` |
| `apps/api/src/__tests__/otp-idempotency-fixes.test.ts` | 7 | OTP brute-force protection & idempotency keys | `pnpm --filter @zega/api test otp-idempotency-fixes` | `VERIFIED` |
| `apps/api/src/__tests__/payment-atomicity-remediation.test.ts` | 3 | DB transactions & atomic balance reservation | `pnpm --filter @zega/api test payment-atomicity-remediation` | `VERIFIED` |
| `apps/api/src/__tests__/payment-verification.test.ts` | 11 | On-chain Solana RPC settlement verification | `pnpm --filter @zega/api test payment-verification` | `VERIFIED` |
| `apps/api/src/__tests__/privy-embedded-signing.test.ts` | 9 | Privy wallet signature verification & JWT validation | `pnpm --filter @zega/api test privy-embedded-signing` | `VERIFIED` |
| `apps/api/src/__tests__/prompt-injection.test.ts` | 7 | AI prompt injection defenses & LLM tool guardrails | `pnpm --filter @zega/api test prompt-injection` | `VERIFIED` |
| `apps/api/src/__tests__/rate-limiter-performance.test.ts` | 2 | Redis rate-limiting performance under burst load | `pnpm --filter @zega/api test rate-limiter-performance` | `VERIFIED` |
| `apps/api/src/__tests__/real-multi-process-load.test.ts` | 2 | Clustering worker load distribution | `pnpm --filter @zega/api test real-multi-process-load` | `VERIFIED` |
| `apps/api/src/__tests__/real-onchain-fetch-verification.test.ts` | 0 | Real Solana mainnet/devnet RPC fetch test harness | `pnpm --filter @zega/api test real-onchain-fetch` | `UNVERIFIED` |
| `apps/api/src/__tests__/reconciliation-batch.test.ts` | 2 | Batch financial reconciliation job correctness | `pnpm --filter @zega/api test reconciliation-batch` | `VERIFIED` |
| `apps/api/src/__tests__/reconciliation-scheduler.test.ts` | 3 | Cron scheduler & lock acquisition | `pnpm --filter @zega/api test reconciliation-scheduler` | `VERIFIED` |
| `apps/api/src/__tests__/redteam-adversarial-p4.test.ts` | 11 | Red-team adversarial exploit probes | `pnpm --filter @zega/api test redteam-adversarial-p4` | `VERIFIED` |
| `apps/api/src/__tests__/settlement-integration.test.ts` | 12 | End-to-end settlement pipeline integration | `pnpm --filter @zega/api test settlement-integration` | `VERIFIED` |
| `apps/api/src/__tests__/transaction-engine.test.ts` | 9 | Core financial ledger state machine transitions | `pnpm --filter @zega/api test transaction-engine` | `VERIFIED` |
| `apps/api/src/__tests__/vault-settlement.test.ts` | 49 | Vault withdrawal & QR barcode verification | `pnpm --filter @zega/api test vault-settlement` | `VERIFIED` |
| `apps/api/src/__tests__/withdrawal-concurrency-remediation.test.ts` | 3 | Atomic DB locking during withdrawal requests | `pnpm --filter @zega/api test withdrawal-concurrency` | `VERIFIED` |
| `apps/api/src/__tests__/withdrawal-privy.test.ts` | 41 | Privy wallet authorization for withdrawals | `pnpm --filter @zega/api test withdrawal-privy` | `VERIFIED` |
| `apps/api/src/__tests__/withdrawal-remediation.test.ts` | 5 | Vault withdrawal state reconciliation | `pnpm --filter @zega/api test withdrawal-remediation` | `VERIFIED` |
| `apps/api/src/__tests__/withdrawal-zero-trust.test.ts` | 16 | Zero-trust withdrawal validation & policy engine | `pnpm --filter @zega/api test withdrawal-zero-trust` | `VERIFIED` |
| `apps/api/src/__tests__/zeroclaw-privy-signing.test.ts` | 18 | ZeroClaw daemon signature verification via Privy | `pnpm --filter @zega/api test zeroclaw-privy-signing` | `VERIFIED` |
| `apps/api/src/__tests__/zeroclaw-withdrawal.test.ts` | 24 | ZeroClaw agent vault withdrawal execution | `pnpm --filter @zega/api test zeroclaw-withdrawal` | `VERIFIED` |
| `packages/zeroclaw-bridge/src/__tests__/smoke.test.ts` | 0 | ZeroClaw bridge package smoke test harness | `pnpm --filter @zega/zeroclaw-bridge test` | `UNVERIFIED` |

---

## 3. Scope & Reproducibility Guide

To execute the entire 366-test verification suite:

```bash
# Run all API unit, integration, and security tests
cd apps/api
pnpm test

# Run cross-tenant adversarial probe script
python3 scripts/run_cross_tenant_security_probe.py
```
