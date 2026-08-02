---
name: solana-blinks
description: Construct Solana Actions endpoints and Blink shareable URLs for chat-channel payment requests. T1 keyless custody.
version: 1.0.0
author: zeroclaw_operator
tags: [slash, solana, blinks, actions, payment]
---

# Solana Blinks & Actions Skill

Use this skill when a merchant wants to share a payment link in a chat channel that a customer can pay directly from their wallet. Blinks make on-chain actions nearly free at T1 custody — the recipient's wallet builds, previews, and signs. Zero key handling.

## What is a Blink?

- A **Solana Action** is an HTTP endpoint: GET returns a preview, POST returns a ready-to-sign base64 transaction.
- A **Blink** is a shareable URL wrapping an Action. When shared in a compatible chat/wallet, the recipient sees a preview card and can sign directly.

## Constructing an Action Endpoint

The ZEGA API provides Action endpoints:

```
GET  https://zegaai.site/api/v1/zeroclaw/actions/<invoiceId>
POST https://zegaai.site/api/v1/zeroclaw/actions/<invoiceId>
```

### GET Response (Preview):
```json
{
  "icon": "https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg",
  "title": "Pay Invoice #8921",
  "description": "2x Cafe Latte - 15.00 USDC",
  "label": "Pay 15.00 USDC",
  "links": {
    "actions": [{
      "label": "Pay 15.00 USDC",
      "href": "/api/v1/zeroclaw/actions/<invoiceId>"
    }]
  }
}
```

### POST Request (from wallet):
```json
{
  "account": "<BUYER_WALLET_PUBKEY>"
}
```

### POST Response:
```json
{
  "transaction": "<BASE64_ENCODED_UNSIGNED_TX>",
  "message": "Payment for Invoice #8921"
}
```

## Creating a Blink URL

Wrap the Action URL in Blink format for sharing in chat:

```
https://dial.to/?action=solana-action:https://zegaai.site/api/v1/zeroclaw/actions/<invoiceId>
```

Drop this URL in WhatsApp, Telegram, or Discord. Wallets that support Actions will render a payment card.

## Jupiter Swap Actions

The agent can also prepare token swaps via Jupiter REST API (T1 keyless):

```
POST https://api.jup.ag/swap/v2
```

The API returns a base64 transaction that the human signs. Keyless tier: 0.5 req/s without API key, free API key for higher limits.

## Response Format

When generating a Blink for a customer:

```text
Payment link for Table 4 ready! 🔗
Amount: 15.00 USDC

Share this Blink in chat:
https://dial.to/?action=solana-action:https://zegaai.site/api/v1/zeroclaw/actions/inv_8921

Or scan the Solana Pay QR:
solana:ZeGAMerchant...?amount=15.00&reference=RefKey...
```

Keep responses under 200 tokens.
