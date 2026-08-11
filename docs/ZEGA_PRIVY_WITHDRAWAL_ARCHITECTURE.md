# ZEGA AI — Privy Non-Custodial Solana Withdrawal Architecture & Implementation Guide

> **Version**: 3.5.0  
> **Last Updated**: 2026-08-11  
> **Author**: ZEGA AI Engineering Team  
> **Status**: Production Verified (Passed `npm run build` & `npm run type-check` on Frontend & Backend)

---

## 1. Executive Summary

ZEGA AI implements a **dual-authentication, zero-custody Solana withdrawal architecture**. The system decouples platform authentication (handled natively via ZEGA Email/Brevo OTP, Google OAuth, and GitHub OAuth) from cryptographic transaction signing (handled via Privy's browser-side MPC wallet enclave).

### Core Principles
1. **ZEGA Auth Autonomy**: Users log into ZEGA using their preferred native authentication method (Email/Brevo OTP, Google, GitHub). Privy login modals never replace ZEGA's primary authentication.
2. **Zero-Custody Guarantee**: No private keys, seed phrases, or synthetic keypairs are stored on ZEGA servers or Supabase database. Server-side `Keypair.generate()` is strictly prohibited.
3. **Canonical Enclave Signing**: Transactions are signed exclusively by the user's Privy embedded wallet (`J8V6QvAfyCzE37McMApRGdcXQHq6ziMQEp8jfahXz9qb`) inside the browser context using `@privy-io/react-auth/solana` `useSignTransaction`.
4. **On-Chain Settlement**: Signed Base64 transactions are verified via Ed25519 signature validation and broadcast directly to Solana Devnet via RPC gateway.

---

## 2. Dual-Authentication & Wallet Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER AUTHENTICATION (ZEGA)                      │
│                                                                        │
│   Email (Brevo OTP)  │  Google OAuth  │  GitHub OAuth                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ZEGA AUTHENTICATED SESSION                         │
│                     `userEmail` (e.g. vantport@gmail.com)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  RUNTIME WALLET ADDRESS RESOLUTION                     │
│                                                                        │
│  effectiveSigningAddress =                                             │
│    runtimeWalletMatch?.address ||                                      │
│    solanaWalletObj?.address ||                                         │
│    activeMerchantWallet (J8V6QvAf...)                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               SOLANA TRANSACTION PREPARATION (/v1/zeroclaw/withdraw/prepare) │
│                                                                        │
│  ▸ Validates vault balance & fee payer (J8V6QvAf...)                   │
│  ▸ Constructs serialized unsigned Solana Transaction                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│           STRATEGY 0: PRIVY ENCLAVE TRANSACTION SIGNING                │
│                                                                        │
│  `useSignTransaction({ transaction, connection, address })`            │
│  ▸ Browser-side enclave cryptographic signing                          │
│  ▸ Returns Ed25519 signature on transaction                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 BACKEND VERIFICATION & ON-CHAIN BROADCAST              │
│                                                                        │
│  POST /v1/zeroclaw/withdraw                                            │
│  ▸ Verifies Ed25519 signature against fee payer pubkey                 │
│  ▸ Broadcasts to Solana Devnet RPC gateway                             │
│  ▸ Records confirmed settlement in Supabase                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Runtime Wallet Resolution & Address Normalization

To resolve runtime hydration race conditions, `ZeroClawTerminalView.tsx` implements a 3-tier address resolution guard:

```typescript
const normalizeAddress = (addr?: string | null): string => (addr ?? '').trim();

// 1. Filter Privy Solana embedded wallets from runtime SDK
const runtimeSolanaWallets = (solanaWallets || []).filter(
  (w: any) => w && (w.chainType === 'solana' || !w.chainType) && w.walletClientType === 'privy'
);

// 2. Match active merchant wallet or fallback
const runtimeWalletMatch = (solanaWallets || []).find(
  (w: any) => w && normalizeAddress(w.address) === normalizeAddress(activeMerchantWallet)
) || runtimeSolanaWallets[0] || solanaWalletObj;

// 3. Resolve effective signing address
const effectiveSigningAddress = normalizeAddress(
  runtimeWalletMatch?.address || solanaWalletObj?.address || activeMerchantWallet
);
```

---

## 4. Solana Enclave Transaction Signing Sequence

Transaction signing prioritizes Privy's official Solana signing API from `@privy-io/react-auth/solana`:

```typescript
// Strategy 0A: Enclave signing with resolved effective signing address
try {
  const hookRes = await privySignSolanaHook({
    transaction: tx,
    connection: solConn,
    address: effectiveSigningAddress
  });
  if (hookRes) {
    signedTx = hookRes instanceof Transaction ? hookRes : hookRes.transaction || hookRes;
  }
} catch (errA) {
  console.warn('[WITHDRAW] Strategy 0A note:', errA);
}

// Strategy 0B: Default HD index 0 fallback (omit address parameter)
if (!signedTx || !signedTx.signatures?.some((s: any) => s.signature !== null)) {
  try {
    const hookRes = await privySignSolanaHook({
      transaction: tx,
      connection: solConn
    });
    if (hookRes) {
      signedTx = hookRes instanceof Transaction ? hookRes : hookRes.transaction || hookRes;
    }
  } catch (errB) {
    console.warn('[WITHDRAW] Strategy 0B note:', errB);
  }
}
```

---

## 5. Security Model & OWASP Compliance

1. **Zero Key Storage**: Neither frontend nor backend stores private keys or seed phrases.
2. **Environment Variable Hygiene**:
   - `apps/web/.env` strictly contains public client IDs (`VITE_PRIVY_APP_ID`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDFLARE_TURNSTILE_SITEKEY`, `VITE_GOOGLE_OAUTH_CLIENT_ID`, `VITE_GITHUB_OAUTH_CLIENT_ID`).
   - Server secrets (`PRIVY_APP_SECRET`, `SUPABASE_SERVICE_KEY`) are restricted exclusively to `apps/api/.env`.
3. **Build Verification**:
   - Frontend (`apps/web`): `npm run build` succeeds with **Exit Code 0** (Vite / Rollup bundle).
   - Backend (`apps/api`): `npm run build` succeeds with **Exit Code 0** (`tsc`).

---

---

## 7. Stateful Privy OTP Verification & Zero Key Leakage Security Model

### Stateful OTP Verification Lifecycle
To eliminate infinite OTP loops and state desynchronization:
1. **Stateful SDK Guard**: `handleVerifyPrivyOtpAndResume` enforces `privyEmailState.status === 'awaiting-code-input'` pre-checks prior to calling `loginWithCode()`.
2. **Custom JWT 401 Elimination**: Removed `useSubscribeToJwtAuthWithFlag` from `PrivyAuthBridge.tsx`. Standard Privy Passwordless Email OTP flow manages authentication without triggering un-configured `custom_jwt_account/authenticate` calls that reset Privy SDK session state.
3. **Correlation ID Bounding**: Each withdrawal session binds to a single `authAttemptId` to prevent parallel or duplicated OTP dispatches.
4. **Idempotent Single Dispatch**: OTP is dispatched strictly once per explicit withdrawal authorization intent. Automatic resends on verification failure are prohibited.

### Zero Key Leakage Audit & Hygiene
1. **Zero Secret Storage**: No private keys, seed phrases, access tokens, or real OTPs are logged or stored in application state, localStorage, or database columns.
2. **Environment Variable Security**: All secret keys (`PRIVY_APP_SECRET`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`) reside strictly in server environment files (`apps/api/.env`) and are never exposed to browser bundles.
3. **Automated CI Security Scanning**: Codebase automated scans (`.github/workflows/ci.yml`) enforce strict secret detection and zero hardcoded credential rules.


