# DeFi Guardian SOP

Monitors token prices and DeFi positions using Jupiter Price V2 API and Switchboard Crossbar as fallback. Alerts the merchant only when price movement exceeds configured thresholds. Custody Tier T0: read-only, no signing, no keys.

## Steps

1. **Fetch Token Prices** — Query Jupiter Price V2 API (`https://api.jup.ag/price/v2`) for configured token mints (SOL, USDC, tracked SPL tokens). Fallback to Switchboard Crossbar if Jupiter is unavailable. Shape output to mint address, price, and 24h change percentage only.
   - tools: http_request
   - output: {"type":"object","required":["prices"],"properties":{"prices":{"type":"array","items":{"type":"object","required":["mint","price","change_pct"],"properties":{"mint":{"type":"string"},"price":{"type":"number"},"change_pct":{"type":"number"}}}}}}

2. **Evaluate Thresholds** — Compare each token's price change against the merchant's configured alert thresholds. Only proceed if at least one token exceeds its threshold.
   - depends_on: 1
   - when: $.steps.1.prices != "[]"

3. **Build Alert Summary** — Compose a concise alert message (under 200 tokens) with token name, current price, percentage change, and recommended action (hold/review/urgent).
   - depends_on: 2

4. **Alert Merchant** — Send the alert via the merchant's preferred channel. Include a deep link to the ZEGA AI DeFi dashboard panel.
   - tools: http_request
   - depends_on: 3

5. **Update Memory** — Capture the price alert as a `lesson` node in relationship memory for historical trend tracking.
   - tools: knowledge
   - depends_on: 4
