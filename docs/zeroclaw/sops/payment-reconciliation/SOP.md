# Payment Reconciliation SOP

Polls Solana RPC for pending invoice reference keys, verifies on-chain payment confirmation, reconciles the settlement to the ZEGA AI dashboard, and notifies the merchant via their configured channel.

## Steps

1. **Poll Pending Invoices** — Query ZEGA API for active invoices with unconfirmed reference keys.
   - tools: http_request
   - output: {"type":"object","required":["pending_refs"],"properties":{"pending_refs":{"type":"array","items":{"type":"object","required":["referenceKey","amount"],"properties":{"referenceKey":{"type":"string"},"amount":{"type":"number"}}}}}}

2. **Check On-Chain Signatures** — For each pending reference key, call `getSignaturesForAddress` on the configured Solana RPC endpoint. Limit response to 1 confirmed signature per reference key. Shape output to reference key, signature, slot, and confirmation status only (keep under 200 tokens).
   - tools: http_request
   - depends_on: 1
   - output: {"type":"object","required":["confirmed"],"properties":{"confirmed":{"type":"array","items":{"type":"object","required":["referenceKey","signature","slot"],"properties":{"referenceKey":{"type":"string"},"signature":{"type":"string"},"slot":{"type":"integer"}}}}}}

3. **Verify Transaction Details** — For each confirmed signature, call `getTransaction` to verify the recipient matches the merchant wallet and the transaction succeeded (no `err`). Reject transactions older than 72 hours.
   - tools: http_request
   - depends_on: 2
   - when: $.steps.2.confirmed != "[]"
   - on_failure: retry:2

4. **Reconcile to ZEGA Dashboard** — POST confirmed settlements to `/api/v1/zeroclaw/settlement/record` with amount, signature, reference key, and network.
   - tools: http_request
   - depends_on: 3

5. **Notify Merchant** — Send a payment confirmation message to the merchant's configured channel (WhatsApp, Telegram, or webhook). Include invoice ID, amount in USDC, and Solana Explorer link.
   - tools: http_request
   - depends_on: 4

6. **Update Memory** — Capture the reconciled payment as an interaction node in relationship memory for customer tracking.
   - tools: knowledge
   - depends_on: 5
