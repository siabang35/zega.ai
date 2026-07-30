---
name: solana-pay
description: Skill for generating Solana Pay transfer request URLs and detecting on-chain transactions via reference public keys.
version: 1.0.0
---

# Solana Pay & Transaction Reconciliation Skill for ZeroClaw

This skill enables ZeroClaw agents to construct standard **Solana Pay Transfer Request URLs** and verify completed payments on Solana Devnet or Mainnet without needing private key access (Custody Tier 1).

## 1. Constructing Solana Pay Transfer Request URLs

When a customer or user requests to make a payment or purchase, format a Solana Pay URL as follows:

`solana:<RECIPIENT_PUBKEY>?amount=<AMOUNT>&spl-token=<TOKEN_MINT>&reference=<REFERENCE_PUBKEY>&label=<LABEL>&message=<MESSAGE>&memo=<MEMO>`

### Parameters:
- `RECIPIENT_PUBKEY`: The merchant wallet address (e.g. `ZeGA...` or configured merchant address).
- `amount`: Decimal string representing USDC or SOL (e.g. `15.00`).
- `spl-token` (Optional): SPL Token Mint address. For Devnet USDC: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (or Mainnet USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).
- `reference`: A fresh, single-use Solana Keypair Public Key generated for this specific invoice.
- `label`: Name of the merchant (e.g. `ZEGA AI Merchant`).
- `message`: Description of order (e.g. `Invoice #8921 - 2x Cafe Latte`).

### Response Example to Customer:
```text
Order Created! ☕
Total: 15.00 USDC
Pay via Solana Pay QR or click the link below:

solana:ZeGAMerchantPublicKey111111111111111111111?amount=15.00&spl-token=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU&reference=RefPubKey1234567890abcdef&label=ZEGA%20Merchant&message=Invoice%208921

Scanning with Phantom / Solflare wallet will populate the exact amount and reference key automatically.
```

---

## 2. Detecting On-Chain Payment via Reference Key

To check if a transaction with the reference public key has been confirmed on Solana:

### Using Built-in `http_request` Tool to Solana RPC:

**RPC Method:** `getSignaturesForAddress`

**Request Payload:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getSignaturesForAddress",
  "params": [
    "<REFERENCE_PUBKEY>",
    {
      "limit": 1,
      "commitment": "confirmed"
    }
  ]
}
```

### Verification Criteria:
1. If response `result` array is non-empty, a transaction targeting `<REFERENCE_PUBKEY>` was confirmed!
2. Extract `signature` from the result.
3. Post notification to the merchant channel and dispatch webhook event to ZEGA AI Dashboard endpoint (`POST /api/v1/zeroclaw/events`).
