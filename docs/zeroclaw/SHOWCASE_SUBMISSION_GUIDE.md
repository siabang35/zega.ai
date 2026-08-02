# ZeroClaw Solana Bounty Submission Guide & Showcase Template

## 📹 Video Recording Checklist (3 Minutes or Less)

1. **Scene 1: Customer Order via Channel (0:00 - 0:30)**
   - Show phone screen with WhatsApp/Telegram message to the ZeroClaw agent: *"Charge table 4, 15 USDC"*.
   - ZeroClaw agent responds with a **Solana Pay QR Code & Transfer Link**.
   - Show Blink URL shared in chat: `https://dial.to/?action=solana-action:...`

2. **Scene 2: Customer Solana Payment (0:30 - 1:00)**
   - Scan QR code via Phantom/Solflare wallet and confirm payment on Solana Devnet.
   - Or: Click Blink URL — wallet renders Action preview card, customer signs directly.

3. **Scene 3: SOP-Driven Reconciliation (1:00 - 1:40)**
   - ZeroClaw `payment-reconciliation` SOP detects payment via cron-polled `getSignaturesForAddress`.
   - SOP updates relationship memory with order interaction node.
   - Cut to **ZEGA AI Enterprise Dashboard** showing live reconciled transaction and memory graph.

4. **Scene 4: DeFi Guardian Alert (1:40 - 2:10)**
   - `defi-guardian` SOP triggers price check via Jupiter API.
   - Price threshold breached → alert sent to merchant channel.
   - Show DeFi portfolio panel in terminal with live SOL/USDC balances.

5. **Scene 5: Prompt Injection Defense & SOP Approval (2:10 - 2:50)**
   - Customer sends prompt-injection refund command via WhatsApp.
   - `refund-approval` SOP screens the request, flags injection, routes to checkpoint.
   - Merchant clicks **Reject** in ZEGA Dashboard — fails closed.

---

## 📝 Discord #solana-bounty Showcase Write-up Template

```markdown
🚀 **Submission: ZEGA AI Autonomous Solana Merchant Terminal & Financial Guardian powered by ZeroClaw**

### 1. What it does & Who it's for
ZEGA AI + ZeroClaw turns any WhatsApp/Telegram channel into a self-hosted, privacy-preserving Solana Pay merchant terminal for UMKM/small business owners. Features DeFi position monitoring, customer relationship memory, and SOP-driven financial reconciliation.

### 2. ZeroClaw Features Used
- **Self-Hosted Rust Daemon:** Stock ZeroClaw release binary.
- **Channels:** WhatsApp, Telegram, Webhook (HMAC-SHA256 verified).
- **Skills (4):** `solana-pay` (URLs + Blinks + durable nonces), `defi-guardian` (Jupiter/Switchboard monitoring), `merchant-memory` (CRM knowledge graph), `solana-blinks` (Solana Actions).
- **SOPs (4):** `payment-reconciliation` (cron + channel trigger), `refund-approval` (human checkpoint + injection screening), `defi-guardian` (cron price alerts), `balance-alert` (low-balance warnings).
- **MCP Client:** Helius MCP (DAS queries) + SendAI Solana MCP (60+ actions).
- **Relationship Memory:** Knowledge graph tracking customer orders, patterns, and merchant preferences.
- **Risk Profile:** `excluded_tools` blocks signing/transfer, `auto_approve` allows read-only Helius DAS queries.

### 3. Custody Tier & Threat Model
- **Custody Tier:** **T1 (Keyless / Unsigned)**. Zero private keys. Payments via Solana Pay URLs and Blinks (wallet signs, not agent).
- **HMAC-SHA256 Webhook Verification:** Inbound webhook channel requires cryptographic signature on every request.
- **MCP Trust:** Helius (read-only DAS, trusted); SendAI (configured but destructive tools excluded).
- **Prompt-Injection Defense:** Included in `SECURITY_THREAT_MODEL.md`. Injection attempts fail closed → SOP checkpoint.
- **Refund Safety:** All refunds require `merchant-owner` approval group quorum via SOP `human_approval` checkpoint.

### 4. Links & Reproducibility
- **GitHub:** [Link to ZEGA AI repo]
- **Config:** `docs/zeroclaw/config.toml` (full agent config with MCP, SOP, memory, channels, risk profiles)
- **SOPs:** `docs/zeroclaw/sops/*/SOP.toml + SOP.md`
- **Skills:** `docs/zeroclaw/skills/*/SKILL.md`
- **Operator Guide:** `docs/zeroclaw/AGENT_OPERATOR_GUIDE.md` (~15 min setup)
- **Security:** `docs/zeroclaw/SECURITY_THREAT_MODEL.md`
```
