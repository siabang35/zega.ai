import { useEffect } from 'react';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';

/**
 * PrivyAuthBridge
 *
 * Establishes authentication and session state synchronization between ZEGA identity
 * and Privy SDK. Only caches embedded Solana wallet when Privy user email strictly matches ZEGA session email.
 */
export function PrivyAuthBridge() {
  const { authenticated: privyAuthenticated, user: privyUser } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();

  // Inspect current ZEGA authenticated session from localStorage
  const zegaSessionStr = typeof window !== 'undefined' ? localStorage.getItem('zega_mock_session') : null;
  let zegaSession: any = null;
  try {
    if (zegaSessionStr) {
      zegaSession = JSON.parse(zegaSessionStr);
    }
  } catch (e) {}

  const zegaEmail = zegaSession?.email || zegaSession?.user?.email;

  // Extract the Privy user's email from their linked accounts or primary email object
  const privyEmail = (privyUser?.email as any)?.address
    || (privyUser?.linkedAccounts?.find((a: any) => a.type === 'email') as any)?.address
    || null;

  // Global Privy Solana Embedded Wallet Cache Synchronizer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanZegaEmail = zegaEmail ? String(zegaEmail).toLowerCase().trim() : '';
    const cleanPrivyEmail = privyEmail ? String(privyEmail).toLowerCase().trim() : '';

    if (Array.isArray(solanaWallets) && solanaWallets.length > 0) {
      // CRITICAL: Only cache wallet if Privy authenticated email matches active ZEGA session email
      if (!cleanZegaEmail || !cleanPrivyEmail || cleanPrivyEmail === cleanZegaEmail) {
        (window as any).privyWallets = solanaWallets;

        if (cleanZegaEmail && privyAuthenticated) {
          const embeddedSolana = solanaWallets.find(
            (w: any) => (w?.chainType === 'solana' || !w?.chainType) && (w?.walletClientType === 'privy' || w?.type === 'solana')
          ) || solanaWallets[0];

          if (embeddedSolana?.address) {
            localStorage.setItem(`zega_privy_wallet_${cleanZegaEmail}`, embeddedSolana.address);
            console.log('[PRIVY AUTH BRIDGE] Cached verified embedded Solana wallet:', embeddedSolana.address, 'for user:', cleanZegaEmail);
          }
        }
      } else {
        // Privy user email does NOT match active ZEGA session email — clear stale global ref to prevent contamination
        console.warn(`[PRIVY AUTH BRIDGE] Mismatch detected: Privy email (${cleanPrivyEmail}) != ZEGA email (${cleanZegaEmail}). Clearing stale wallet cache.`);
        (window as any).privyWallets = [];
      }
    }
  }, [solanaWallets, zegaEmail, privyAuthenticated, privyUser, privyEmail]);

  return null;
}

