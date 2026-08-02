---
name: defi-guardian
description: Monitor DeFi positions, token prices, and portfolio health using Jupiter and Switchboard. Alert only when action is needed.
version: 1.0.0
author: zeroclaw_operator
tags: [solana, defi, monitoring, alerts]
---

# DeFi Guardian Skill

Use this skill when the merchant asks about token prices, portfolio health, DeFi positions, or wants to set up price alerts. Custody Tier T0: read-only, no signing, no keys held.

## Price Monitoring

Query Jupiter Price V2 API for current token prices:

```
GET https://api.jup.ag/price/v2?ids=<MINT_ADDRESS>&vsToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

Common mint addresses:
- SOL (wrapped): `So11111111111111111111111111111111111111112`
- USDC (mainnet): `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- USDC (devnet): `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

### Switchboard Crossbar Fallback

If Jupiter is unavailable, use Switchboard Crossbar:

```
GET https://crossbar.switchboard.xyz/simulate/<FEED_HASH>
```

> **Note:** Pyth Core deprecates July 31, 2026. Use Switchboard as primary fallback. Crossbar is unauthenticated but rate-limited — fine for cron alerts, self-host for production.

## Portfolio Summary

When asked for a portfolio overview, compute:
1. Fetch SOL balance via `getBalance` RPC call
2. Fetch USDC balance via `getTokenAccountsByOwner`
3. Fetch current SOL/USD price from Jupiter
4. Calculate total portfolio value in USD
5. Compare against last-known values from memory

Shape the response concisely:
```text
Portfolio Summary:
• SOL: 2.5 ($375.00 @ $150/SOL)
• USDC: 485.50
• Total: $860.50
• 24h Change: +2.3%
```

## Alert Configuration

Store alert thresholds in relationship memory as `decision` nodes:
- Token mint address
- Direction: `above` or `below`
- Threshold percentage or absolute value
- Channel to notify

## Response Rules

- Keep all responses under 200 tokens
- Never expose raw API responses to the model context
- Shape output to: token name, price, change percentage, recommended action
- Use relationship memory to track historical alerts and avoid duplicate notifications
