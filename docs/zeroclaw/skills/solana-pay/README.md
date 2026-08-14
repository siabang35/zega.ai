# zega-solana-pay

Solana Pay merchant payment skill for ZeroClaw agents.

## What It Does

Turns your ZeroClaw agent into a Solana Pay merchant terminal. The agent can:

- **Create invoices** with unique Solana reference keys
- **Generate Solana Pay URLs** scannable by Phantom / Solflare / Backpack
- **Check payment status** via the ZEGA API
- **Reconcile settlements** with 5-layer deterministic on-chain verification

## Custody Tier

**T1 (Keyless)**. The agent constructs Solana Pay transfer-request URLs. The customer's wallet signs the transaction. Zero private keys are held by the agent.

## Install

```bash
zeroclaw skills install zega-solana-pay
```

## Prerequisites

- Running ZEGA API server (`apps/api`) — provides the Solana payment backend
- Solana Devnet RPC access (free public endpoint or Helius/QuickNode)
- Merchant wallet public key (receive-only)

## Permissions

- `web_fetch` — required to call the ZEGA API via `http_request`

## Configuration

Set in your ZeroClaw `config.toml` or as environment variables:

```toml
[agents.default]
environment.ZEGA_API_URL = "http://127.0.0.1:3001"
environment.MERCHANT_WALLET = "YourSolanaWalletPublicKey"
```

## Example Usage

**Merchant** (via Telegram):
> "Charge table 4, 15 USDC for 2x espresso"

**Agent**:
> ☕ Invoice Created!
> Amount: 15.00 USDC
> Reference: 7kXp...mN2q
>
> Scan with Phantom / Solflare:
> solana:DwMU...3bUK?amount=15.00&spl-token=4zMMC9...&reference=7kXp...
>
> Payment will be detected automatically.

## Security

- Refund requests are routed to the `refund-approval` SOP (human checkpoint required)
- Prompt injection attempts are blocked by the ZEGA API OWASP guard
- Settlement verification is deterministic — the LLM cannot override financial checks
