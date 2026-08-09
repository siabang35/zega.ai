# Payment Reconciliation SOP Steps

Execute this procedure when a cron trigger fires or a `payment_detected` webhook arrives.

## Steps

- step: Check Pending Invoices
  Use `http_request` to fetch pending invoices from the ZEGA API:
  ```
  GET {ZEGA_API_URL}/v1/zeroclaw/settlement/list?userId={merchant_email}&isDemo=false
  ```
  Parse the response for any invoices with status `PENDING`.

- step: Query Solana for Payment
  For each pending invoice with a reference key, use `http_request` to trigger reconciliation:
  ```
  POST {ZEGA_API_URL}/v1/zeroclaw/settlement/record
  {
    "txSignature": "<detected_signature>",
    "amountUsdc": <amount>,
    "referenceKey": "<reference_key>",
    "userId": "<merchant_email>",
    "network": "solana-devnet",
    "isDemo": false
  }
  ```
  The ZEGA API performs 5-layer deterministic verification automatically.
  Do NOT attempt to verify transactions yourself.

- step: Notify Merchant
  If settlement succeeded, compose a confirmation message:
  ```
  ✅ Invoice #{id} Paid & Reconciled
  Amount: {amount} USDC
  Tx: {signature_first_16_chars}...
  Time: {timestamp}
  ```
  Send via the originating channel.

- step: Handle Failures
  If the ZEGA API rejects the settlement (wrong recipient, wrong mint, replay, stale):
  Log the rejection reason. Do NOT retry with modified parameters.
  Report the failure to the merchant with the specific rejection reason.
