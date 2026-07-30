# ZeroClaw Solana Bounty Submission Guide & Showcase Template

## 📹 Video Recording Checklist (3 Minutes or Less)

1. **Scene 1: Customer Order via Channel (0:00 - 0:40)**
   - Show phone screen with WhatsApp/Telegram message to the ZeroClaw agent: *"Charge table 4, 15 USDC"*.
   - ZeroClaw agent responds with a **Solana Pay QR Code & Transfer Link**.
2. **Scene 2: Customer Solana Payment (0:40 - 1:20)**
   - Scan QR code via Phantom/Solflare wallet on phone and confirm payment on Solana Devnet/Mainnet.
3. **Scene 3: Real-Time On-Chain Reconciliation (1:20 - 2:00)**
   - ZeroClaw terminal detects payment via `getSignaturesForAddress` on reference key.
   - Cut to **ZEGA AI Enterprise Dashboard**, showing live reconciled transaction update (`+$15.00 USDC`).
4. **Scene 4: Prompt Injection Defense & Approval Checkpoint (2:00 - 2:50)**
   - Show customer sending prompt-injection refund command via WhatsApp.
   - ZeroClaw pauses execution & flags SOP approval checkpoint in ZEGA AI Dashboard.
   - Click **Reject** in ZEGA AI Dashboard, showing fails-closed safety.

---

## 📝 Discord #solana-bounty Showcase Write-up Template

Copy and paste the text below into the **#solana-bounty** channel on ZeroClaw Discord:

```markdown
🚀 **Submission: ZEGA AI Autonomous Solana Merchant Terminal & Financial Guardian powered by ZeroClaw**

### 1. What it does & Who it's for
ZEGA AI + ZeroClaw turns any WhatsApp/Telegram channel into a self-hosted, privacy-preserving Solana Pay merchant terminal for UMKM/small business owners. Customers order and pay via Solana Pay QR codes, while the ZeroClaw daemon polls reference keys on Solana RPC and syncs financial reconciliation live into the ZEGA AI Enterprise Dashboard.

### 2. ZeroClaw Features Used
- **Self-Hosted Rust Daemon:** Stock ZeroClaw release running on local node.
- **Channels:** WhatsApp & Telegram channel integration.
- **Skills:** `solana-pay` skill for keyless transfer request URL construction.
- **SOP Engine:** Cron-based reference key RPC watcher (`getSignaturesForAddress`) + `human_approval` checkpoint for refund safety.
- **MCP Client:** Connected to ZEGA AI Monorepo Fastify API (`apps/api`).

### 3. Custody Tier & Threat Model
- **Custody Tier:** **Tier 1 (Keyless / Unsigned)**. The agent holds NO private keys. All payment URLs are plain strings, and refunds are gated behind 1-click human owner approval checkpoints.
- **Prompt-Injection Defense:** Included in repo (`docs/zeroclaw/SECURITY_THREAT_MODEL.md`). Attempted prompt injection attacks fail closed and trigger dashboard review.

### 4. Links & Reproducibility
- **GitHub Repository:** [Link to your ZEGA AI repo branch]
- **ZeroClaw Config & SOP Gist:** Included in `/docs/zeroclaw/`
  - Config: `docs/zeroclaw/config.toml`
  - SOP: `docs/zeroclaw/sops/solana-merchant-sop.toml`
  - Skill: `docs/zeroclaw/skills/solana-pay.md`
- **Setup Time:** ~15 minutes for any operator using standard stock binary!
```
