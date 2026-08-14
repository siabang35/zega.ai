# ZEGA AI × ZeroClaw Agent — Operator Quick Start Guide

Reproduce this setup in an evening. Stock ZeroClaw binary or 1-command executable daemon harness, zero compiled plugins required.

## Prerequisites

- ZeroClaw release binary (`>= v0.8.0, < v0.9.0-alpha`) OR Node.js 20+ daemon harness
- Solana wallet (Phantom, Solflare, or Backpack)
- Solana Devnet RPC access (default `api.devnet.solana.com`)

## 1. Clone & Install ZEGA AI

```sh
git clone https://github.com/siabang35/zega.ai.git
cd ZEGA
pnpm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` and set:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
ZEROCLAW_GATEWAY_URL=http://127.0.0.1:4242
ZEROCLAW_BEARER_TOKEN=<your-bearer-token>
ZEROCLAW_WEBHOOK_SECRET=<your-hmac-secret>
GROQ_API_KEY=<your-groq-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-key>
```

## 3. Launch Gateway Daemon & API

### Option A: Runnable Daemon Harness (< 1 min setup)
```sh
# Terminal 1: ZEGA API backend
pnpm dev:api

# Terminal 2: Executable ZeroClaw Gateway Daemon (port 4242)
pnpm zeroclaw:daemon
```

### Option B: Production ZeroClaw Rust Binary
```sh
cp docs/zeroclaw/config.toml <zeroclaw-install>/config.toml
cp -r docs/zeroclaw/sops/* <zeroclaw-install>/sops/
cp -r docs/zeroclaw/skills/* <zeroclaw-install>/skills/
zeroclaw start --config docs/zeroclaw/config.toml
```

## 4. Verify Live Connectivity

```sh
curl -s http://localhost:3001/v1/zeroclaw/status
```

**Verified Response:**
```json
{
  "success": true,
  "data": {
    "state": {
      "bridgeConnected": true,
      "bridgeStatus": "Connected to ZeroClaw Gateway (0.8.3) at http://127.0.0.1:4242",
      "custodyTier": "T1 (Keyless / Unsigned)"
    }
  }
}
```

## 5. Verify Features

1. Open ZEGA Dashboard at `http://localhost:5173/console`
2. Navigate to ZeroClaw Terminal or UMKM POS
3. Type "Generate invoice for table 4, 0.50 USDC" — generates Solana Pay QR
4. Check SOP runs: `GET /v1/zeroclaw/sops/runs` — shows 4 active SOPs
5. Check RPC status: `GET /v1/zeroclaw/rpc-pool/status` — shows Helius + failover pool

## Features Included

| Feature | Config Location | Route / Verification |
|:---|:---|:---|
| SOPs (4 total) | `docs/zeroclaw/sops/*/` | `/v1/zeroclaw/sops/runs` |
| Skills (4 total) | `docs/zeroclaw/skills/*/` | Agent context |
| MCP (Helius + SendAI) | `config.toml [mcp]` | `config.toml` |
| Memory Graph | `config.toml [knowledge]` | Supabase Realtime DB |
| Webhook HMAC | `config.toml [channels.webhook]` | `zeroclaw.routes.ts` |
| Blinks/Actions | Skills + routes | `/v1/zeroclaw/actions/*` |
| DeFi Guardian | SOP + skill + routes | `/v1/zeroclaw/sops/runs` |
| Custody: T1 Keyless | `config.toml [agent]` | Keyless URL construction |

## Custody Tier

**Tier 1 (Keyless / Unsigned)** — Zero private keys held. All payment URLs are plain strings. Refunds gated behind human approval checkpoints. MCP servers run as external tools with declared trust boundaries.
