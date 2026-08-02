---
name: merchant-memory
description: Capture and query merchant customer relationships, order history, and preferences using the knowledge graph.
version: 1.0.0
author: zeroclaw_operator
tags: [knowledge, merchant, crm, memory]
---

# Merchant Memory Skill

Use the `knowledge` tool to build and query a relationship graph of customers, orders, and merchant preferences. This enables the agent to remember repeat customers, track order patterns, and personalize interactions.

## Node Types

Capture merchant data as these node types:

- **`client`**: A customer or business entity. Title: customer identifier (channel handle, not PII). Content: order frequency, preferred products, channel.
- **`contact`**: A contact point for a client. Title: channel type (WhatsApp, Telegram). Content: contact role, not personal details.
- **`interaction`**: An order, payment, or conversation. Title: order description. Content: amount, items, timestamp, payment status.
- **`pattern`**: A recurring order pattern. Title: pattern name. Content: typical order, frequency, preferred time.
- **`decision`**: A merchant preference or policy. Title: policy name. Content: wallet address, accepted tokens, minimum order, operating hours.

## Capturing a New Customer Order

After a successful payment reconciliation:

```json
{
  "action": "capture",
  "node_type": "interaction",
  "title": "Order #8921 - 2x Cafe Latte",
  "content": "15.00 USDC paid via Solana Pay. Reference: RefKey123. Confirmed at Slot 480269120.",
  "tags": ["order", "paid", "solana-pay"]
}
```

Then relate it to the customer:

```json
{
  "action": "relate",
  "from_id": "<customer-node-id>",
  "to_id": "<interaction-node-id>",
  "relation": "interacted_with"
}
```

## Querying Customer History

When asked about a customer's order history:

```json
{
  "action": "interaction_log",
  "client_id": "<customer-node-id>",
  "limit": 10
}
```

## Privacy Rules

- **Never store** personal email addresses, phone numbers, real names, or government IDs.
- Use **channel handles** or **role labels** as customer identifiers (e.g., `WhatsApp:Customer-A`, `Telegram:Regular-42`).
- Store amounts and order descriptions, not payment signatures or wallet addresses in content.
- Prefer neutral identifiers: `repeat-customer-cafe`, `bulk-buyer-office`.
- Do not store secrets, tokens, or private URLs.
