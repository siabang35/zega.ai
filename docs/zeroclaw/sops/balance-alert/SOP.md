# Balance Alert SOP

Polls the merchant wallet's SOL and USDC balances on the configured Solana network. Sends an alert when either balance drops below the configured minimum threshold, enabling the merchant to top up before transactions fail.

## Steps

1. **Check SOL Balance** — Call `getBalance` on the merchant wallet via Solana RPC. Convert lamports to SOL.
   - tools: http_request
   - output: {"type":"object","required":["sol_balance"],"properties":{"sol_balance":{"type":"number"}}}

2. **Check USDC Balance** — Call `getTokenAccountsByOwner` for the USDC mint on the merchant wallet. Extract UI amount.
   - tools: http_request
   - output: {"type":"object","required":["usdc_balance"],"properties":{"usdc_balance":{"type":"number"}}}

3. **Evaluate Thresholds** — Compare SOL balance against minimum 0.01 SOL (rent + gas) and USDC balance against merchant-configured minimum. Only alert if below threshold.
   - depends_on: 1

4. **Alert Merchant** — Send a low-balance warning via the merchant's configured channel. Include current balances, minimum thresholds, and a Solana Explorer link to the wallet.
   - tools: http_request
   - depends_on: 3
