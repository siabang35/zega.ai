# ZEGA AI × ZeroClaw Agent — Operator Quick Start Guide

Reproduce this setup in an evening. Stock ZeroClaw binary, no compiled plugins required.

## Prerequisites

- ZeroClaw release binary (`>= v0.8.0, < v0.9.0-alpha`)
- Node.js 18+ (for ZEGA API backend)
- Solana wallet (Phantom, Solflare, or Backpack)
- Solana Devnet RPC access (default `api.devnet.solana.com`)

## 1. Clone & Install ZEGA AI

```sh
git clone https://github.com/siabang35/zega.ai
cd zega.ai
pnpm install
```

## 2. Configure Environment

Copy `.env.example` to `apps/api/.env` and set:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
ZEROCLAW_GATEWAY_URL=http://127.0.0.1:4242
ZEROCLAW_BEARER_TOKEN=<your-bearer-token>
ZEROCLAW_WEBHOOK_SECRET=<your-hmac-secret>
GROQ_API_KEY=<your-groq-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-key>
```

## 3. Copy ZeroClaw Agent Config

```sh
cp docs/zeroclaw/config.toml <zeroclaw-install>/config.toml
```

Edit the config to replace `ENV_*` placeholders with your real values.

## 4. Install Skills & SOPs

```sh
# Create skill bundle
zeroclaw skills bundle add solana-ops

# Install skills into the bundle
zeroclaw skills install ./docs/zeroclaw/skills/solana-pay --bundle solana-ops
zeroclaw skills install ./docs/zeroclaw/skills/defi-guardian --bundle solana-ops
zeroclaw skills install ./docs/zeroclaw/skills/merchant-memory --bundle solana-ops
zeroclaw skills install ./docs/zeroclaw/skills/solana-blinks --bundle solana-ops

# Copy SOPs
cp -r docs/zeroclaw/sops/* <zeroclaw-install>/sops/
zeroclaw sop validate
```

## 5. Start Everything

```sh
# Terminal 1: ZeroClaw daemon
zeroclaw start

# Terminal 2: ZEGA API backend
cd apps/api && npm run start:dev

# Terminal 3: ZEGA web frontend
cd apps/web && npm run dev
```

## 6. Pair ZEGA to ZeroClaw

```sh
# Get pairing code from ZeroClaw CLI
zeroclaw pair

# Enter code in ZEGA Terminal dashboard or via API:
curl -X POST http://localhost:4000/api/v1/zeroclaw/pair \
  -H "Content-Type: application/json" \
  -d '{"pairingCode": "<code>"}'
```

## 7. Verify

1. Open ZEGA Dashboard at `http://localhost:5173/console`
2. Navigate to ZeroClaw Terminal
3. Type "Generate invoice for table 4, 0.50 USDC" — should generate Solana Pay QR
4. Check SOP list: `GET /v1/zeroclaw/sop/list` — should show 4 SOPs
5. Check MCP servers: `GET /v1/zeroclaw/mcp/servers` — should show Helius + SendAI

## Features Included

| Feature | Config Location | Route |
|:---|:---|:---|
| SOPs (4 total) | `docs/zeroclaw/sops/*/` | `/v1/zeroclaw/sop/*` |
| Skills (4 total) | `docs/zeroclaw/skills/*/` | Agent context |
| MCP (Helius + SendAI) | `config.toml [mcp]` | `/v1/zeroclaw/mcp/*` |
| Memory Graph | `config.toml [knowledge]` | `/v1/zeroclaw/memory/*` |
| Webhook HMAC | `config.toml [channels.webhook]` | `/v1/zeroclaw/webhook/*` |
| Blinks/Actions | Skills + routes | `/v1/zeroclaw/actions/*` |
| DeFi Guardian | SOP + skill + routes | `/v1/zeroclaw/defi/*` |
| Custody: T1 Keyless | `config.toml [agent]` | All routes |

## Custody Tier

**Tier 1 (Keyless / Unsigned)** — Zero private keys held. All payment URLs are plain strings. Refunds gated behind human approval checkpoints. MCP servers run as external tools with declared trust boundaries.
