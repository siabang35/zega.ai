# PRD Specification #44: Zero-Trust Withdrawal Security & Operation Idempotency

> **Document ID**: PRD-44-ZERO-TRUST-WITHDRAWAL-IDEMPOTENCY  
> **Status**: APPROVED & IMPLEMENTED  
> **Version**: 1.0.0  
> **Date**: 2026-08-12  
> **Target Components**: `apps/api/src/routes/v1/zeroclaw.routes.ts`, `apps/api/src/services/solanaTransactionService.ts`, `apps/web/src/app/dashboard/enterprise/views/ZeroClawTerminalView.tsx`

---

## 1. Executive Summary

This document specifies the **Zero-Trust Withdrawal Security Architecture** for ZEGA AI. Under this architecture, the frontend browser client is treated strictly as an untrusted presentation layer. All security decisions, authorization checks, transaction intent verification, Ed25519 signature validation, integer precision calculations, operation idempotency locks, and ledger settlements are determined and enforced exclusively by the backend server.

---

## 2. Zero-Trust 10-Layer Backend Validation Pipeline

```text
[ Client Request ]
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 1 & 2: User Session & Wallet Ownership Isolation      │
│ - Validates userEmail against authenticated session         │
│ - Rejects cross-user wallet tampering (403 Forbidden)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3 & 4: Server Intent & Single-Use Authorization       │
│ - SHA-256 Intent Fingerprinting (withdrawalId + amt + dest) │
│ - Prevents reuse of authorizationAttemptId (400 Bad Request) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Integer Base-Unit Precision                        │
│ - BigInt conversion for SOL (lamports) & USDC (6 decimals)  │
│ - Prevents IEEE-754 floating point arithmetic loss          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 6 & 7: Cryptographic Ed25519 Signature Verification   │
│ - Validates signed transaction against fee payer pubkey     │
│ - Verifies instruction payload against prepared intent      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 8, 9 & 10: Anti-Replay, Idempotency & Settlement       │
│ - Active Lock (`activeLockKey`) per in-flight operation      │
│ - Immediate lock release upon terminal state completion     │
│ - Atomic ledger settlement & RPC broadcast confirmation     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Technical Requirements

### 3.1 Bug A Remediation: String-Based OTP Handling
- **Requirement**: OTP input validation must accept string inputs matching `/^\d{6}$/`.
- **Invariants**:
  - OTP values must never be converted or cast to Javascript numbers (`Number(otp)`).
  - Leading zeros (e.g., `000000`, `000123`) must be preserved as literal string characters.
  - Stale state closures during rapid user typing must be eliminated by passing input strings directly to the verification handler (`handleVerifyPrivyOtpAndResume(undefined, val)`).

### 3.2 Bug B Remediation: Operation Idempotency vs Time-Based Locking
- **Requirement**: The 15-second timestamp-based anti-replay guard is replaced with **Active Operation Idempotency Locks** (`lock_${userEmail}_${reqWithdrawalId}`).
- **Invariants**:
  - An active lock blocks concurrent duplicate executions of the *same* in-flight transaction.
  - Upon reaching a terminal state (`COMPLETED`, `SUCCESS`, `FAILED`, `CANCELLED`, `EXPIRED`), the active processing lock is immediately released.
  - Completed past transactions must never block a subsequent legitimate withdrawal.

### 3.3 UI Scoping & Double Execution Guards
- **Requirement**: Prevent race conditions that cause duplicate execution of `handleExecuteWithdrawal`.
- **Invariants**:
  - Enforce an in-flight ref guard (`withdrawalExecutionInFlightRef`) in `handleExecuteWithdrawal`.
  - Remove automatic execution triggers inside `useEffect` upon OTP state change.
  - `withdrawModalAlert` must be reset (`null`) on `SUCCESS` step, and suppressed when `withdrawStep === 'SUCCESS'`.

### 3.4 History Persistence & Query Optimization
- **Requirement**: Withdrawal history must persist across page refreshes.
- **Invariants**:
  - Backend query parameters in `/v1/zeroclaw/withdraw/list` must construct PostgREST `.or()` parameters without double URL encoding parameter values.
  - Client state initializes from `localStorage` (`zeroclaw_withdraw_history_${userEmail}`) for zero-lag rendering on refresh.

---

## 4. Verification & Automated Test Matrix

| Test Suite | Coverage Area | Status |
| :--- | :--- | :--- |
| `otp-idempotency-fixes.test.ts` | Bug A (OTP string handling, leading zeros, space normalization) & Bug B (operation idempotency, lock release) | PASSED (7/7) |
| `withdrawal-zero-trust.test.ts` | 10-Layer Backend Validation (Identity, Ownership, Fingerprinting, Ed25519 verification, Integer precision) | PASSED (12/12) |
| Frontend Build | Production bundle verification (`apps/web` - `pnpm run build`) | PASSED |
