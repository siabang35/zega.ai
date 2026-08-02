---
name: solana-pay
description: Skill for generating Solana Pay transfer request URLs, Blinks/Actions, and detecting on-chain transactions via reference public keys.
version: 2.0.0
author: zeroclaw_operator
tags: [slash, solana, payment, blinks, actions]
---

# Solana Pay & Transaction Reconciliation Skill

This skill enables ZeroClaw agents to construct standard **Solana Pay Transfer Request URLs**, generate **Blinks (Solana Actions)** for shareable payment links, and verify completed payments on Solana without needing private key access (Custody Tier 1).

## 1. Constructing Solana Pay Transfer Request URLs

When a customer or user requests a payment, format a Solana Pay URL:

`solana:<RECIPIENT_PUBKEY>?amount=<AMOUNT>&spl-token=<TOKEN_MINT>&reference=<REFERENCE_PUBKEY>&label=<LABEL>&message=<MESSAGE>&memo=<MEMO>`

### Parameters:
- `RECIPIENT_PUBKEY`: The merchant wallet address from agent memory or config.
- `amount`: Decimal string representing USDC or SOL (e.g. `15.00`).
- `spl-token` (Optional): SPL Token Mint. Devnet USDC: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`. Mainnet USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
- `reference`: A fresh, single-use public key generated for this specific invoice. The SOP cron poller uses this to detect payment.
- `label`: Merchant name (e.g. `ZEGA AI Merchant`).
- `message`: Order description (e.g. `Invoice #8921 - 2x Cafe Latte`).

### Response Example (keep under 200 tokens):
```text
Order Created! ☕
Total: 15.00 USDC
Pay via Solana Pay QR or click below:

solana:ZeGAMerchant...?amount=15.00&spl-token=4zMMC9...&reference=RefKey...&label=ZEGA%20Merchant&message=Invoice%208921

Scanning with Phantom / Solflare populates the exact amount and reference key.
```

## 2. Blinks / Solana Actions

A **Blink** wraps a Solana Action (HTTP endpoint) into a shareable URL. Use when the customer's wallet supports Actions:

### Constructing a Blink URL:
1. Format the ZEGA action endpoint: `https://zegaai.site/api/v1/zeroclaw/actions/<invoiceId>`
2. Wrap in Blink format: `https://dial.to/?action=solana-action:<actionUrl>`

The Action endpoint:
- **GET** returns a preview: `{ icon, title, description, label }`
- **POST** returns a base64-encoded unsigned transaction for the wallet to sign

Blinks are T1 custody: the recipient's wallet builds, previews, and signs. Zero key handling.

## 3. Detecting On-Chain Payment via Reference Key

Use the built-in `http_request` tool to query Solana RPC:

**RPC Method:** `getSignaturesForAddress`

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getSignaturesForAddress",
  "params": ["<REFERENCE_PUBKEY>", {"limit": 1, "commitment": "confirmed"}]
}
```

### Verification:
1. If `result` array is non-empty, a transaction targeting the reference key was confirmed.
2. Extract `signature` from result.
3. Dispatch webhook event to ZEGA AI (`POST /api/v1/zeroclaw/events`).

## 4. Durable Nonces for Approval-Gated Transactions

When a transaction waits in an approval queue, its blockhash expires (~90 seconds). Use durable nonces:

- Create a nonce account (locks ~0.0015 SOL rent)
- `AdvanceNonceAccount` must be the first instruction
- One nonce account = one in-flight transaction (use separate accounts for parallel approvals)

## 5. Response Shaping Rules

- Keep all tool responses under 200 tokens
- Never return raw `getProgramAccounts` responses
- Shape to: reference key, signature, amount, confirmation status only
- Strip unnecessary account metadata before returning to model context

## 6. Jupiter Swap Preparation (T1 Keyless)

Jupiter's Swap V2 API (`api.jup.ag`) returns a ready-to-sign base64 transaction over HTTPS:

```
GET https://api.jup.ag/price/v2?ids=<MINT>&vsToken=<VS_TOKEN>
POST https://api.jup.ag/swap/v2 (with route and user wallet)
```

The agent prepares the swap; the human signs. Keyless tier: 0.5 requests/second without API key.
