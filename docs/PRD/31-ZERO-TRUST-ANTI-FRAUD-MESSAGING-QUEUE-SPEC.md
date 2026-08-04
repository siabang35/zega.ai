# PRD 31: Zero-Trust On-Chain Anti-Fraud Validation & High-Concurrency Resilient Messaging Queue

## Executive Overview

PRD 31 documents the enterprise hardening of ZEGA AI's Solana Devnet Payment Gateway and Messaging Delivery Engine. It establishes a zero-trust 5-layer on-chain validation pipeline, comma decimal normalization, single-flight handle resolution, and an exponential backoff notification retry queue.

---

## 1. Zero-Trust 5-Layer On-Chain Anti-Fraud Validation Pipeline

To protect merchants and prevent spoofed or fake payment confirmations, all settlements are evaluated through 5 strict backend layers:

```
[Incoming Tx Hash]
        │
        ▼
[Layer 1: Amount Check] ─── Positive, non-zero number? ──► REJECT (400) if <= 0
        │
        ▼
[Layer 2: Base58 Check] ─── Valid 87-88 char Base58? ────► REJECT (400) if synthetic/invalid
        │
        ▼
[Layer 3: Anti-Replay] ─── Duplicate signature? ─────────► RETURN IDEMPOTENT (200)
        │
        ▼
[Layer 4: RPC Status] ──── On-Chain confirmed & no err? ──► REJECT (403) if unconfirmed/err
        │
        ▼
[Layer 5: Deep Check] ──── Non-zero transfer & target? ─► REJECT (403) if 0 amount or mismatch
        │
        ▼
[SETTLEMENT CONFIRMED & PERSISTED]
```

### Key Anti-Fraud Rules:
1. **Base58 Signature Enforcement**: Only authentic 87-88 character Solana Base58 transaction signatures (`/^[1-9A-HJ-NP-Za-km-z]{87,88}$/`) are accepted. Synthetic IDs (`sol_...`, `gen_inv_...`) are rejected at Layer 2.
2. **Zero-Amount Transfer Rejection**: Transactions with `0` USDC or SOL transfer amount (e.g. account initializations, vote transactions, or non-transfer contract interactions) are rejected at Layer 5 (`ZERO_AMOUNT_CHECK`). No fallback to expected amount occurs.
3. **Recipient & Reference Key Matching**: Deep inspection verifies that the transaction's destination account or account list includes the merchant's Privy wallet address or invoice `reference_key` (`RECIPIENT_MATCH_FAIL`).
4. **RPC Existence & Freshness**: Transactions must be confirmed on Solana Devnet RPC with `err === null` and executed within 72 hours.

---

## 2. Indonesian Comma Decimal Normalization & SPL Token Precision

To prevent decimal parsing errors (e.g., misreading `0,32 USDC` as `32 USDC`):
- **Comma Normalization**: Automatically converts `,` between digits to `.` (`replace(/(\d+),(\d+)/g, '$1.$2')`) before regex parsing across prompt handlers, `/generate-qr`, `/invoice`, and webhooks.
- **6-Decimal Extended Regex**: Regex patterns match up to 6 decimal places (`/(\d+(?:\.\d{1,6})?)/`) to preserve exact small fractions like `0.32 USDC`.
- **Atomic Unit Scaling**: SPL token balance parsing uses `uiAmountString` and `uiAmount` with fallback scaling for micro-USDC (`320000` -> `0.32 USDC`).

---

## 3. High-Concurrency Single-Flight Messaging Queue

To prevent dropped messages during concurrent invoice generation and payment receipts:
- **Single-Flight Promise Lock (`syncTelegramBotUpdatesSingleFlight`)**: Eliminates Telegram `HTTP 409 Conflict: terminated by other getUpdates request` by deduplicating concurrent `getUpdates` requests into a single shared flight promise.
- **Exponential Backoff Retry (`sendTelegramMessageWithRetry`)**:
  - Automatically handles Telegram `HTTP 429 Too Many Requests` by reading `retry_after` parameters and resuming.
  - Implements 3-attempt exponential backoff retry (1s, 2s, 4s) for network resilience.
  - Triggers self-healing chat ID re-resolution on `HTTP 400 Bad Request`.

---

## 4. Solana Pay Reference Key Concurrency Architecture

When multiple users pay the exact same amount (e.g., 10 users sending 1.00 USDC at the exact same millisecond):
- Each invoice receives a unique, single-use Solana Public Key (`reference_key`).
- The reference key is appended to the Solana Pay transaction as a non-signer read-only account.
- Solana RPC indexes transactions by account keys, allowing `getSignaturesForAddress(reference_key)` to return **only the 1 transaction belonging to that specific invoice**.
- This guarantees 100% deterministic invoice reconciliation without cross-user misattribution.

---

## 5. Security & Compliance (Zero Secret Leaks)

- All environment variables (`SOLANA_RPC_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `PRIVY_APP_SECRET`) are accessed strictly via `process.env`.
- No hardcoded API keys, private keys, or credentials exist in codebase or documentation.
