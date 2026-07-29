# ⚡ ZEGA AI: Solana Agentic Architecture Specification

## 1. Executive Technical Summary
This specification defines the integration of **Solana Blockchain Infrastructure** and **Claude Code / Codex Agentic Engineering** into the **ZEGA AI Autonomous Agent Orchestration Monorepo**. It covers:
1. **Claude Code / Codex & `solana.new` Agentic Workflow Engine** for rapid Solana program generation, Anchor scaffolding, and subagent orchestration.
2. **Solana Agent SDK (`@solana/agent-kit`) Integration** into Fastify API Microservices (`apps/api`).
3. **x402 Solana HTTP Micropayment Engine** for M2M agent API monetization using USDC/SPL tokens.
4. **Solana Actions & Blinks Engine** for executable agent workflows directly in social media / chat feeds.
5. **Anchor Smart Contract Framework (`zega-agent-escrow`)** for non-custodial agent treasury management and daily spending limit enforcement.

---

## 2. System Topology & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ZEGA AI MONOREPO TOPOLOGY                             │
│                                                                                 │
│  ┌───────────────────────┐                  ┌────────────────────────────────┐  │
│  │   React 18 Frontend   │                  │  Fastify API Microservice      │  │
│  │   (`apps/web`)        │ ◄── REST/WS ──►  │  (`apps/api`)                  │  │
│  │   + Solana Wallet     │                  │  + Solana Agent Kit Engine     │  │
│  │     Adapter           │                  │  + x402 Payment Middleware     │  │
│  └───────────┬───────────┘                  └───────────────┬────────────────┘  │
│              │                                              │                   │
└──────────────┼──────────────────────────────────────────────┼───────────────────┘
               │                                              │
               │ Solana Transactions                          │ M2M Micropayments &
               │ & Action Blinks                              │ On-Chain Execution
               ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             SOLANA BLOCKCHAIN NETWORK                           │
│                                                                                 │
│  ┌────────────────────┐   ┌─────────────────────┐   ┌────────────────────────┐  │
│  │ Solana Actions /   │   │  x402 Payment       │   │ Anchor Agent Escrow    │  │
│  │ Blinks Protocol    │   │  (USDC SPL Token)   │   │ Smart Contract         │  │
│  └────────────────────┘   └─────────────────────┘   └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Solana Agent Kit SDK Integration Architecture

### 3.1 Agent Wallet & Authority Delegation
ZEGA AI agents utilize a hybrid key delegation model:
- **Master Treasury Wallet:** Controlled by user via Solana Wallet Adapter (Phantom, Solflare, Backpack).
- **Agent Sub-Wallets (Keypairs):** Programmatically generated ephemeral or persistent HD keypairs stored encrypted with AES-256-GCM in Supabase PostgreSQL (`public.user_api_keys` / `public.agents`).
- **Anchor Escrow Allowance:** Master wallet deposits SOL / USDC into the `zega-agent-escrow` Anchor account. The agent sub-wallet is granted allowance up to $N USDC per day.

### 3.2 Code Specification: Fastify Solana Agent Plugin

```typescript
// apps/api/src/plugins/solanaAgentPlugin.ts
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { SolanaAgentKit, createSolanaTools } from 'solana-agent-kit';
import { PublicKey, Connection } from '@solana/web3.js';

export interface SolanaAgentOptions {
  rpcUrl: string;
  privateKey: string; // Encrypted in DB, decrypted at runtime in secure memory
}

const solanaAgentPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('createAgentKit', (agentPrivateKey: string) => {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const agentKit = new SolanaAgentKit(
      agentPrivateKey,
      connection.rpcEndpoint,
      process.env.HELIUS_API_KEY || ''
    );
    const tools = createSolanaTools(agentKit);
    return { agentKit, tools };
  });
};

export default fp(solanaAgentPlugin, { name: 'solana-agent-plugin' });
```

---

## 4. x402 Machine-to-Machine Payments on Solana

### 4.1 Transaction Lifecycle (HTTP 402 Flow)
1. **Requester Agent** calls an endpoint (e.g. `POST /v1/agents/research/execute`).
2. **Server Middleware** checks for payment authorization header `X-Solana-Payment-Signature`.
3. If missing/invalid, server returns **HTTP Status 402 Payment Required**:
   ```json
   {
     "status": 402,
     "error": "Payment Required",
     "paymentDetails": {
       "recipient": "ZegaAgentTreasuryPublicKey...",
       "amount": 0.005,
       "currency": "USDC",
       "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
       "network": "solana-mainnet",
       "reference": "unique-tx-reference-id-12345"
     }
   }
   ```
4. **Requester Agent** signs & executes a transfer of 0.005 USDC on Solana targeting `recipient` with `reference` as memo or instruction reference key.
5. **Requester Agent** retries request including header `X-Solana-Payment-Signature: <TxSignature>`.
6. **Server Middleware** performs instant zero-confirmation or 1-commitment check on Solana RPC and releases payload.

---

## 5. Solana Actions & Blinks Integration

### 5.1 Agent Action Endpoints (`apps/api/src/routes/actions/`)
ZEGA AI exposes standardized Action endpoints compliant with `@solana/actions`:
- `GET /api/actions/deploy-agent` -> Returns metadata (icon, title, description, disabled state).
- `POST /api/actions/deploy-agent` -> Returns serialized Solana transaction for user signature.

```typescript
// apps/api/src/routes/actions/deployAgentAction.ts
import { ActionGetResponse, ActionPostResponse, ACTIONS_CORS_HEADERS } from '@solana/actions';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

export async function handleGetDeployAgentAction(): Promise<ActionGetResponse> {
  return {
    icon: 'https://cdn.zegaai.site/zegalogo.png',
    title: 'Deploy Autonomous SEO Agent on ZEGA AI',
    description: 'Instantly provision a 24/7 AI agent that optimizes your site content and settles M2M tasks on Solana.',
    label: 'Deploy Agent (0.05 SOL)',
    links: {
      actions: [
        {
          label: 'Deploy Standard Agent',
          href: '/api/actions/deploy-agent?tier=standard',
        },
        {
          label: 'Deploy Enterprise Mesh',
          href: '/api/actions/deploy-agent?tier=enterprise',
        }
      ]
    }
  };
}
```

---

## 6. Anchor Smart Contract: `zega-agent-escrow`

### 6.1 Rust Anchor Program Spec (`programs/zega-agent-escrow/src/lib.rs`)

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("ZegaAgentEscrow111111111111111111111111111111");

#[program]
pub mod zega_agent_escrow {
    use super::*;

    pub fn initialize_agent_escrow(
        ctx: Context<InitializeAgentEscrow>,
        daily_limit: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.owner = ctx.accounts.owner.key();
        escrow.agent = ctx.accounts.agent.key();
        escrow.daily_limit = daily_limit;
        escrow.spent_today = 0;
        escrow.last_reset_timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn execute_agent_payment(
        ctx: Context<ExecuteAgentPayment>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;

        // Reset daily spending counter if 24 hours passed
        if clock.unix_timestamp - escrow.last_reset_timestamp > 86400 {
            escrow.spent_today = 0;
            escrow.last_reset_timestamp = clock.unix_timestamp;
        }

        require!(
            escrow.spent_today.checked_add(amount).unwrap() <= escrow.daily_limit,
            EscrowError::DailyLimitExceeded
        );

        escrow.spent_today = escrow.spent_today.checked_add(amount).unwrap();

        // Perform SPL token transfer from escrow vault to recipient
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        Ok(())
    }
}

#[account]
pub struct AgentEscrowAccount {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub daily_limit: u64,
    pub spent_today: u64,
    pub last_reset_timestamp: i64,
}

#[error_code]
pub enum EscrowError {
    #[msg("Agent daily spending limit exceeded.")]
    DailyLimitExceeded,
}
```

---

## 7. Security, Auditing & Guardrails
- **5-Layer Security Guardrails:** Every Solana transaction proposed by an agent is evaluated against input validation, daily budget caps, velocity rate limits, blacklisted recipient public keys, and Supabase security audit logs (`security_audit_logs`).
- **Zero Exposure of Private Keys:** Agent private keys are retained solely in ephemeral backend execution memory and decrypted using KMS keys.

---

*Specification Document for Superteam Grant Evaluation.*
