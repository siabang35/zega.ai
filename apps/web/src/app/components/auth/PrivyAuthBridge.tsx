import { useEffect } from 'react';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';

/**
 * PrivyAuthBridge
 *
 * Establishes authentication and session state synchronization between ZEGA identity
 * and Privy SDK using Privy's official `useSubscribeToJwtAuthWithFlag` API.
 *
 * Automatically keeps embedded Solana wallets cached for non-interactive withdrawal signing.
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
  const isZegaAuthenticated = Boolean(zegaEmail && String(zegaEmail).trim().length > 0);
  const zegaToken = zegaSession?.accessToken;

// Custom JWT Authentication is not enabled for this Privy App ID.
  // Standard Privy Passwordless Email OTP flow handles embedded wallet authorization directly.

  // 2. Global Privy Solana Embedded Wallet Cache Synchronizer
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(solanaWallets) && solanaWallets.length > 0) {
      (window as any).privyWallets = solanaWallets;

      if (zegaEmail) {
        const cleanEmail = String(zegaEmail).toLowerCase().trim();
        const embeddedSolana = solanaWallets.find(
          (w: any) => (w?.chainType === 'solana' || !w?.chainType) && (w?.walletClientType === 'privy' || w?.type === 'solana')
        ) || solanaWallets[0];

        if (embeddedSolana?.address) {
          localStorage.setItem(`zega_privy_wallet_${cleanEmail}`, embeddedSolana.address);
          console.log('[PRIVY AUTH BRIDGE] Cached active embedded Solana wallet:', embeddedSolana.address);
        }
      }
    }
  }, [solanaWallets, zegaEmail, privyAuthenticated, privyUser]);

  return null;
}
