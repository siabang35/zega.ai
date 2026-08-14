# ⚡ ZEGA ZeroClaw Bounty Quickstart & Reproducibility Guide

This guide provides step-by-step instructions to reproduce the end-to-end ZeroClaw + Solana Pay merchant automation pipeline on Solana Devnet.

---

## 1. Prerequisites

- **Node.js**: v20.x or higher
- **pnpm**: v9.x or higher
- **Rust Toolchain**: v1.75+ (for building ZeroClaw binary)
- **Solana CLI**: v1.18+ (optional, for Devnet wallet management)
- **Telegram Account & Bot Token**: Obtained from @BotFather

---

## 2. Installation & Setup

### Step A: Clone & Install ZEGA Repository
```bash
git clone https://github.com/siabang35/zega.ai.git
cd zega.ai
pnpm install
```

### Step B: Install Pinned ZeroClaw Rust Binary (v0.8.3)
```bash
cargo install zeroclaw --version 0.8.3

# Verify binary installation
bash scripts/verify-zeroclaw.sh
```

### Step C: Environment Configuration
Copy sample environment files:
```bash
cp apps/api/.env.example apps/api/.env
```

Ensure `apps/api/.env` contains valid credentials:
```env
PORT=3001
ZEGA_DEMO_MODE=false
SOLANA_RPC_URL=https://api.devnet.solana.com
ZEROCLAW_WEBHOOK_SECRET=your_secure_hmac_secret_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

---

## 3. Launch & Verification Pipeline

### Step 1: Start ZEGA Fastify API
```bash
pnpm --filter @zega/api dev
```
*API starts on `http://localhost:3001`*

### Step 2: Run Security & Integration Test Suite
```bash
pnpm --filter @zega/api test
```
*Executes 28/28 tests covering Base58 signature format, SPL USDC mint validation, transaction freshness (<72h), OWASP anti-prompt injection, and timing-safe HMAC checks.*

### Step 3: Launch Official ZeroClaw Agent
```bash
zeroclaw agent --config docs/zeroclaw/config.toml
```

---

## 4. End-to-End Invoice Flow (Telegram -> Solana Devnet)

1. Open your configured Telegram channel.
2. Send prompt: `"Buatkan invoice 25 USDC untuk Meja 4"`
3. **ZeroClaw** receives the Telegram message, executes `SKILL.md`, and calls ZEGA API `/v1/zeroclaw/agent/execute`.
4. **ZEGA API** generates a deterministic Solana Pay link and reference key keypair.
5. **ZeroClaw** responds on Telegram with the QR / Solana Pay link.
6. **Buyer** completes the payment via Phantom or Solflare wallet on Solana Devnet.
7. **ZEGA RPC Manager** picks up the signature, runs the 5-layer deterministic validation pipeline, records settlement in Supabase, and dispatches Telegram receipt.
