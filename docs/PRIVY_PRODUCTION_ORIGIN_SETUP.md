# Production Remediation Guide: Privy "403 Origin Not Allowed" & CSP Framing Errors

## Exact Production Environment URLs
- **Frontend (FE)**: `https://zegaai.site` (and `https://www.zegaai.site`)
- **Backend (BE)**: `https://zega-ai.onrender.com`
- **Privy App ID**: `cms9cnybp002k0bl7ts2nm8ra`

---

## Technical Cause of the Error in Production

When accessing `https://zegaai.site`, Privy SDK requests to `https://auth.privy.io/api/v1/passwordless/init` and iframe mounting fail with:

```text
1. auth.privy.io/api/v1/passwordless/init:1 Failed to load resource: 403 (Forbidden)
   Passwordless initialization / OTP send warning: Origin not allowed

2. Framing 'https://auth.privy.io/' violates Content Security Policy directive:
   "frame-ancestors 'self' https://zegaai.site http://localhost:5173 https://auth.privy.io"
```

This happens because `https://zegaai.site` has **not been whitelisted** in the Privy Dashboard. Privy enforces origin checking and CSP iframe headers to block unauthorized origins from using your Privy App ID.

---

## Step-by-Step Resolution in Privy Dashboard

### Step 1: Log in to Privy Dashboard
1. Open [https://dashboard.privy.io/](https://dashboard.privy.io/).
2. Select App: **`cms9cnybp002k0bl7ts2nm8ra`**.

---

### Step 2: Add Frontend Domains to Privy Allowed Origins
1. In Privy Dashboard menu, go to **App Settings** (or **Settings**).
2. Under **Allowed Origins** (or **Client Origins**), click **Add Origin**.
3. Add the following exact origins:
   - `https://zegaai.site`
   - `https://www.zegaai.site`
   - `https://zega-ai.onrender.com`
   - `http://localhost:5173` (for local development)
4. Click **Save Changes**.

---

### Step 3: Add Domains to Embedded Wallet Allowed Domains (CSP Frame Ancestors)
1. In Privy Dashboard menu, go to **Embedded Wallets** -> **Security & Domains**.
2. Under **Allowed Domains** (or **Frame Ancestors**), add:
   - `https://zegaai.site`
   - `https://www.zegaai.site`
   - `https://zega-ai.onrender.com`
   - `http://localhost:5173`
3. Click **Save Changes**.

---

### Step 4: Backend Render Environment Variables (`https://zega-ai.onrender.com`)
Ensure the following variables are set on Render environment settings for `https://zega-ai.onrender.com`:
- `CORS_ORIGIN=https://zegaai.site,https://www.zegaai.site`
- `PRIVY_APP_ID=cms9cnybp002k0bl7ts2nm8ra`
- `PRIVY_APP_SECRET=privy_app_secret_...`

---

## Summary of Code Fixes Applied in Repo
1. **`apps/web/src/main.tsx`**: Increased `EventEmitter.defaultMaxListeners = 100` to eliminate `MaxListenersExceededWarning` from Web3 extension content scripts (Phantom, Solflare, etc.).
2. **`apps/web/src/app/dashboard/enterprise/views/ZeroClawTerminalView.tsx`**: Enforced strict single-OTP state machine and `awaiting-code-input` guard.
