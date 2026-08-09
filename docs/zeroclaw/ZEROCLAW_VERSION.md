# ZeroClaw Version & Compatibility Matrix

**Pinned Release**: ZeroClaw `v0.8.3`  
**Upstream Repository**: https://github.com/zeroclaw-labs/zeroclaw  
**Target Architecture**: `x86_64-unknown-linux-gnu` / `aarch64-apple-darwin`  
**License**: MIT / Apache-2.0  

---

## 1. Verified Core Capabilities in v0.8.3

| Feature / Component | Status in v0.8.3 | ZEGA Integration Mechanism |
|---|---|---|
| **Rust Core Agent Engine** | ✅ Supported | Native Rust compiled binary (`zeroclaw`) |
| **Telegram Inbound Channel** | ✅ Supported | Configured via `config.toml` `[channels.telegram]` |
| **HTTP Webhook Ingress** | ✅ Supported | Signs request via `X-Webhook-Signature` HMAC-SHA256 |
| **Custom Markdown Skills** | ✅ Supported | Loaded from `docs/zeroclaw/skills/solana-pay/SKILL.md` |
| **SOP Standard Operating Procedures** | ✅ Supported | Loaded from `docs/zeroclaw/sops/invoice-flow.toml` |
| **Tier 1 Keyless Custody** | ✅ Supported | LLM interprets intent; payment requests delegated to ZEGA Fastify API |

---

## 2. Installation Verification

To verify the ZeroClaw Rust binary installation on the host system:

```bash
# Check version
zeroclaw --version
# Output must match: zeroclaw 0.8.3 (or higher)

# Run verification script
bash scripts/verify-zeroclaw.sh
```

---

## 3. Environment Variable Standards

ZeroClaw v0.8.3 consumes the following environment variables:
- `TELEGRAM_BOT_TOKEN`: Token issued by @BotFather
- `ZEROCLAW_WEBHOOK_SECRET`: Secret key for HMAC-SHA256 signature verification
- `ZEGA_API_URL`: Fastify API base endpoint (default: `http://localhost:3001`)
- `SOLANA_RPC_URL`: Solana Devnet RPC endpoint
