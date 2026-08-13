# ZEGA.AI Canonical Payment Infrastructure & Settlement Matrix (`x402`)

**Executive Certification Status:** `LEVEL A+ — PRODUCTION OPERATIONALLY VERIFIED`  
**Monorepo Packages:** `@zega/api`, `@zega/web`, `@zega/shared`, `@zega/supabase`  
**Authoritative Source of Truth:** `docs/payments/x402_PAYMENT_INFRASTRUCTURE.md`  
**Verification Date:** August 11, 2026  

---

## 1. End-to-End Settlement & Payment Execution Flow

```text
ZeroClaw Agent / User
  └─► Webhook / Skill Execution
        └─► API Endpoint (`/v1/zeroclaw/settle` / `/v1/withdrawals`)
              └─► Authentication (Privy JWT / Session Token)
                    └─► Authorization (Organization / Store / User Tenant Ownership)
                          └─► Input Validation (Schema, Mint, Recipient, Amount)
                                ├─► Database Idempotency Check (`idempotency_keys` table)
                                ├─► Solana RPC Verification (`SolanaRpcManager` Failover)
                                ├─► Transaction Parsing & Signature Verification
                                ├─► Mint & Recipient Verification (`settlementValidation.ts`)
                                ├─► Amount & Freshness Verification (Blocktime / Timestamp)
                                └─► Replay Attack Check (`zeroclaw_solana_settlements` Unique Index)
                                      └─► Atomic Database Balance Mutation & Audit Log (`settle_payment_atomic`)
                                            └─► Receipt Certificate Issued
```

---

## 2. Comprehensive Security Control & Invariant Matrix

| Layer | Security Invariant | Repository Implementation | Verification Test File | Evidence Level | Status |
|---|---|---|---|---|---|
| **RPC Failover** | Automatic failover across primary & backup RPC endpoints | `apps/api/src/services/solanaRpcManager.ts` | `test_zeroclaw_production_rpc_monitor.ts` | **E2 / E4** | `VERIFIED` |
| **Transaction Freshness** | Signature must be recent (< 300s blocktime) | `apps/api/src/services/settlementVerificationService.ts` | `payment-verification.test.ts` | **E2 / E4** | `VERIFIED` |
| **Mint Verification** | Must match authorized mint address (SOL / USDC / SPL token) | `apps/api/src/utils/settlementValidation.ts` | `check-payment-strictness.test.ts` | **E2 / E4** | `VERIFIED` |
| **Recipient Validation** | Receiver address must match tenant vault address | `apps/api/src/utils/settlementValidation.ts` | `payment-verification.test.ts` | **E2 / E4** | `VERIFIED` |
| **Amount Validation** | Transfer amount must equal or exceed requested invoice amount | `apps/api/src/utils/settlementValidation.ts` | `check-payment-strictness.test.ts` | **E2 / E4** | `VERIFIED` |
| **Replay Protection** | On-chain signature index enforces single-execution uniqueness | `supabase/migrations/20260730233500_zeroclaw_solana_settlements.sql` | `settlement-integration.test.ts` | **E3 / E4** | `VERIFIED` |
| **Idempotency** | Duplicate requests blocked via atomic idempotency keys | `apps/api/src/services/WithdrawalService.ts` | `destructive-concurrency.test.ts` | **E2 / E4** | `VERIFIED` |
| **Atomic Concurrency** | Double-spend withdrawals blocked via DB row locks (`FOR UPDATE`) | `apps/api/src/services/WithdrawalService.ts` | `withdrawal-concurrency-remediation.test.ts` | **E2 / E4** | `VERIFIED` |
| **Privy Signature Check**| Privy wallet custody signature verified before withdrawal | `apps/api/src/routes/v1/withdrawal.routes.ts` | `withdrawal-privy.test.ts` | **E2 / E4** | `VERIFIED` |
| **Zero-Trust Audit** | Audit log record emitted before balance mutation | `apps/api/src/routes/v1/zeroclaw.routes.ts` | `withdrawal-zero-trust.test.ts` | **E2 / E4** | `VERIFIED` |

---

## 3. Core Stored Procedures & Financial Atomicity

### 1. `reserve_withdrawal_atomic`
- **Advisory Lock:** `pg_advisory_xact_lock` prevents concurrent double-reservation for the same user and asset.
- **Balance Calculation:** Safely computes `available = credits - debits - active_reservations`.
- **Status:** Inserts new withdrawal with status `VALIDATING`.

### 2. `finalize_withdrawal_atomic`
- **Atomicity:** Transitions withdrawal status to `CONFIRMED` and inserts ledger `DEBIT` entry within a single transaction block.

### 3. `settle_payment_atomic`
- **Atomicity:** Inserts `payments` record, updates invoice status (`PAID` / `PARTIALLY_PAID` / overpaid), and inserts ledger `CREDIT` row.
- **Replay Protection:** `payments(signature)` enforced by `UNIQUE` constraint.

### 4. `release_withdrawal_reservation_atomic`
- **Safety:** Marks failed/cancelled withdrawals as `FAILED` and restores reserved balance safely.

---

## 4. Privy Keyless Signing & RPC Failover Architecture

### Privy Keyless Security Invariant
- **Zero Key Custody:** Raw private keys (`Keypair.fromSecretKey`, `Keypair.fromSeed`, `mnemonic`) are **NEVER** stored, logged, or derived in backend code.
- **Server Signing:** Server-side transaction signing delegates exclusively to Privy Wallet API (`privyClient.walletApi.solana.signTransaction()`).

### Multi-Provider Solana RPC Pool
- **Managed by:** `solanaRpcManager.ts`
- **Provider Failover:** Automatic fallback between Alchemy, Helius, QuickNode, and official Solana RPCs upon HTTP 429/5xx responses.
- **Confirmation Level:** Requires `confirmed` or `finalized` commitment.

---

## 5. Background Reconciliation & Multi-Node Safety

- **Worker:** `ReconciliationScheduler.ts`
- **Polling Interval:** 120,000 ms (2 minutes) periodic cycle with 5s boot delay.
- **Multi-Node Lock:** Distributed single-instance guard via DB advisory lock key `reconciliation_worker_lock`. Prevents duplicate worker execution across scaled API containers.

---

## 6. Operational Runbook & Maintenance

### Operational Scenarios

#### Scenario A: Withdrawal Stuck in `CONFIRMING` or `BUILDING`
1. Check DB state:
   ```sql
   SELECT id, status, signature, created_at FROM public.withdrawals WHERE id = 'wdr_...';
   ```
2. If `signature` exists, verify status on Solana Explorer.
3. If confirmed on-chain, trigger manual reconciliation cycle via `reconciliationScheduler.runReconciliationCycle()`.
4. If failed on-chain, execute `release_withdrawal_reservation_atomic` to safely return reserved balance.

#### Scenario B: Payment Verified On-Chain but Invoice Uncredited
1. Submit signature verification via `POST /api/payments/verify`.
2. `settle_payment_atomic` will idempotently process invoice status and credit user ledger.

#### Scenario C: Secret Rotation Protocol
- **JWT Secret (`JWT_SECRET`):** Rotate in `.env`. Invalidates active 15-min JWTs without affecting DB financial records.
- **Privy Secret (`PRIVY_APP_SECRET`):** Rotate in Privy Console, then update server `.env` and restart process.

---

## 7. Financial Incident Response Protocol

### Incident Workflow
```text
STOP AUTOMATIC RETRIES
        ↓
PRESERVE EVIDENCE (Logs, Signatures, DB State)
        ↓
IDENTIFY TRANSACTION (Withdrawal ID / Payment Signature)
        ↓
CHECK SOLANA BLOCKCHAIN STATUS
        ↓
CHECK DATABASE & LEDGER STATE
        ↓
RUN RECONCILIATION CYCLE
        ↓
APPLY AUDITED CORRECTION (RPC Function Only)
```

### Strict Financial Invariants
1. **NO MANUAL BALANCE EDITS:** Under no circumstances should database tables or balances be manually modified in SQL without executing audit-logged atomic RPC functions.
2. **EVIDENCE PRESERVATION:** Retain raw transaction payloads, correlation IDs, and Privy API logs before taking corrective action.

---

## 8. Disambiguation of Demo Mode vs Production Settlement

* **Client Demo Mode**: UI components (`UmkmZeroClawTerminalView.tsx`) feature visual demo mode toggles for UI walk-throughs.
* **Production API Enforcement**: API routes strictly reject simulated transaction signatures. All backend settlement routes require on-chain RPC verification against Solana mainnet/devnet nodes.
