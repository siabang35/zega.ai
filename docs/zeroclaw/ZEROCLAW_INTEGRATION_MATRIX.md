# ZEGA.AI ZeroClaw Integration Matrix

## 1. Scope & Concept Disambiguation

To prevent ambiguity, ZeroClaw capabilities are categorized into upstream core features vs ZEGA platform integrations:

```text
Upstream ZeroClaw (Rust Core Daemon)
  ├─► ZEGA Bridge Package (`packages/zeroclaw-bridge`)
  ├─► ZEGA Daemon Harness (`scripts/zeroclaw-daemon-harness.ts`)
  ├─► ZEGA Solana Skills (`zeroclaw/skills/solana-pay/`, `solana-blinks/`)
  ├─► ZEGA Database Realtime Sync (`zeroclaw_solana_settlements`, `zeroclaw_checkpoints`)
  └─► ZEGA Web / UI Terminals (`UmkmZeroClawTerminalView.tsx`, `EnterpriseZeroClawTerminalView.tsx`)
```

---

## 2. Integration Provenance & Evidence Matrix

| Component / Feature | Scope | Repository Implementation | Test / Verification Artifact | Evidence Level | Status |
|---|---|---|---|---|---|
| **ZeroClaw Bridge Package** | ZEGA Monorepo Package | `packages/zeroclaw-bridge/src/` | `packages/zeroclaw-bridge/dist/__tests__/smoke.test.js` | **E2** | `IMPLEMENTED` |
| **Daemon Harness** | CLI Integration Harness | `scripts/zeroclaw-daemon-harness.ts` | `scripts/verify-zeroclaw.sh` | **E2 / E6** | `VERIFIED` |
| **Solana Pay Skill** | ZeroClaw Skill Spec | `docs/zeroclaw/skills/solana-pay/SKILL.md` | `check-payment-strictness.test.ts` | **E1 / E4** | `VERIFIED` |
| **Privy Signing Integration** | Auth / Signature Bridge | `apps/api/src/routes/v1/zeroclaw.routes.ts` | `zeroclaw-privy-signing.test.ts` | **E2 / E4** | `VERIFIED` |
| **Vault Withdrawal Agent** | Settlement Execution | `apps/api/src/services/WithdrawalService.ts` | `zeroclaw-withdrawal.test.ts` | **E2 / E4** | `VERIFIED` |
| **Realtime Telemetry DB** | Database Tables & RLS | `supabase/migrations/20260730233500_zeroclaw_solana_settlements.sql` | `DATABASE_INVENTORY.md` | **E3 / E6** | `VERIFIED` |
| **ZeroClaw Terminal UI** | Merchant Frontend | `apps/web/src/app/dashboard/enterprise/views/ZeroClawTerminalView.tsx` | UI Build (`npm run build`) | **E2** | `VERIFIED` |
| **Upstream Rust Runtime** | External Rust Binary | `https://github.com/zeroclaw/zeroclaw` | Upstream Binary | **E0** | `DOCUMENTED / NOT INDEPENDENTLY VERIFIED` |

---

## 3. Reproduction & Execution Instructions

To execute the ZeroClaw integration verification harness:

```bash
# Run ZeroClaw integration verification script
bash scripts/verify-zeroclaw.sh

# Run ZeroClaw signature & withdrawal tests
pnpm --filter @zega/api test zeroclaw
```
