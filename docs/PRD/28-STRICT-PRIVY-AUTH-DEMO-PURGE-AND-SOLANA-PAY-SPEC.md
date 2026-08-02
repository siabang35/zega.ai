# PRD 28: Strict Privy Authentication, Demo Mode Purge & Standalone Solana Pay Checkout Architecture

## 1. Executive Summary
This document specifies the enterprise architecture transition of the ZEGA AI Platform from a hybrid guest/demo model to a **100% strict authenticated enterprise environment**. 

All guest session fallbacks, demo account bypass buttons, and mock data generators have been completely purged from the codebase. Platform interactions, settlement records, and audit logs are now strictly bound to authenticated Privy user sessions (`privy_user_id` / user email) with 1-to-1 derived Privy Embedded Solana Wallets.

---

## 2. Core Architectural Changes

### 2.1 Demo Mode & Guest Session Purge
- **AuthModal**: Removed all `1-Click Enterprise Demo` and `User Sandbox` bypass buttons. Users must authenticate via Google OAuth, GitHub OAuth, or Brevo Email OTP Passcode.
- **Enterprise & UMKM Dashboards**: Removed `isGuestSession` flags, guest banners, and sandbox exit buttons (`X`). Default session properties now default exclusively to authenticated sessions.
- **ZeroClaw Terminal (`ZeroClawTerminalView.tsx`)**: Deprecated mock invoice generators and mock fallback arrays. All terminal queries strictly fetch database records tied to the authenticated user.
- **Backend API (`zeroclaw.routes.ts`)**: Forced `isDemoBool = false` on `/v1/zeroclaw/settlement/list` and `/v1/zeroclaw/invoice/list` endpoints to prevent mock data leakage in production.

### 2.2 Presets as Strict Input Fillers
Quick Presets (e.g. `$15 AI Copywriting Batch`, `$50 Audit Report`, `$120 Autonomous Agent Task`) no longer create or auto-submit invoices or database records. Clicking a preset strictly populates the target UI input fields (amount, description, recipient details) for manual review and explicit user submission.

### 2.3 Standalone Solana Pay Public Checkout Route (`/checkout/:id`)
- Built an isolated, standalone public checkout view (`PublicCheckoutView.tsx`) accessible at `/checkout/:id`.
- Decoupled checkout from main app modals to prevent modal close race conditions or redirect loops on Vercel deployments.
- **Solflare Mobile Compatibility**: Standardized `solanaPayUrl` formats to standard `solana:<merchant>?amount=...&reference=...&label=...&message=...` deep-links, enabling seamless single-swipe payment resolution on Solflare and Phantom mobile apps.

### 2.4 Multi-Tier RPC Resolution & DB Persistence Guards
- Integrated 4-tier Solana RPC fallback strategy:
  1. Primary Helius RPC (`https://mainnet.helius-rpc.com/...`)
  2. Alchemy Solana RPC
  3. QuickNode / Triton RPC
  4. Official Solana Mainnet-Beta RPC (`https://api.mainnet-beta.solana.com`)
- Database persistence in `recordInvoiceToDatabaseAndR2` is strictly guarded by user identity; anonymous or unauthenticated writes are explicitly rejected.

---

## 3. Security & Zero-Leakage Compliance
- All sensitive API keys, bot tokens, and service credentials are provided strictly via environment variables (`.env`, `.env.production`).
- Zero API keys or secrets are exposed in client-side bundles or documentation files.
