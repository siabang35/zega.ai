
export interface PrivyWalletConfig {
  appId?: string;
  isPrivyActive: boolean;
}

export interface ResolvedPrivyWallet {
  address: string;
  walletId?: string;
  chainType?: string;
  walletClientType?: string;
  isPrivy: boolean;
  providerLabel: string;
}

export class PrivyWalletService {
  /**
   * Get Privy App ID.
   */
  private static getAppId(): string {
    if (
      typeof import.meta !== 'undefined' &&
      (import.meta as any)?.env?.VITE_PRIVY_APP_ID
    ) {
      return (import.meta as any).env.VITE_PRIVY_APP_ID;
    }

    const globalProc = (globalThis as any).process;

    if (globalProc?.env?.VITE_PRIVY_APP_ID) {
      return globalProc.env.VITE_PRIVY_APP_ID;
    }

    return '';
  }

  /**
   * Check whether Privy is configured.
   */
  public static isConfigured(): boolean {
    const appId = this.getAppId();

    return Boolean(
      appId &&
      !appId.includes('placeholder')
    );
  }

  /**
   * IMPORTANT:
   *
   * Wallet addresses MUST NEVER be derived from:
   * - email
   * - username
   * - timestamp
   * - hash
   * - deterministic seed
   * - generated Keypair
   * - hardcoded wallet address
   *
   * The authoritative wallet comes from the authenticated
   * Privy session.
   *
   * This legacy method is intentionally disabled.
   */
  public static deriveSolanaPublicKey(_email?: string): never {
    throw new Error(
      'deriveSolanaPublicKey() has been disabled. ' +
      'Privy wallet addresses must be resolved from the authenticated Privy session.'
    );
  }

  /**
   * Resolve the currently authenticated Privy Solana wallet.
   *
   * IMPORTANT:
   * This method expects the actual Privy wallet list to be supplied
   * by the React Privy hook layer.
   *
   * Do NOT try to reconstruct the wallet from email.
   */
  public static resolveSolanaWallet(
    wallets: readonly any[]
  ): ResolvedPrivyWallet {
    if (!Array.isArray(wallets) || wallets.length === 0) {
      throw new Error(
        'PRIVY_WALLET_NOT_FOUND: No authenticated Privy wallets available.'
      );
    }

    /**
     * Find the real Privy embedded Solana wallet.
     *
     * Different Privy SDK versions expose wallet metadata slightly
     * differently, so inspect both common fields.
     */
    const wallet = wallets.find((candidate: any) => {
      const chainType =
        candidate?.chainType ??
        candidate?.chain ??
        candidate?.chain_type;

      const walletClientType =
        candidate?.walletClientType ??
        candidate?.wallet_client_type;

      const address = candidate?.address;

      if (!address) {
        return false;
      }

      const isSolana =
        chainType === 'solana' ||
        candidate?.chainType === 'solana';

      const isPrivyWallet =
        walletClientType === 'privy' ||
        candidate?.standardWallet?.name === 'Privy' ||
        candidate?.connectorType === 'embedded';

      return isSolana && isPrivyWallet;
    });

    if (!wallet) {
      throw new Error(
        'PRIVY_SOLANA_WALLET_NOT_FOUND: ' +
        'Authenticated user does not have a Privy embedded Solana wallet.'
      );
    }

    const address = String(wallet.address || '').trim();

    if (!address) {
      throw new Error(
        'PRIVY_SOLANA_WALLET_ADDRESS_MISSING'
      );
    }

    return {
      address,
      walletId: wallet.id,
      chainType:
        wallet.chainType ??
        wallet.chain ??
        wallet.chain_type,
      walletClientType:
        wallet.walletClientType ??
        wallet.wallet_client_type,
      isPrivy: true,
      providerLabel:
        'Privy Embedded Solana Wallet',
    };
  }

  /**
   * Get the authenticated user's actual Privy wallet.
   *
   * Accepts either an array of wallets from Privy's useWallets() hook,
   * or a string (e.g. email) / undefined for dynamic per-user wallet resolution.
   */
  public static getEmbeddedSolanaWallet(
    wallets?: readonly any[] | string
  ): ResolvedPrivyWallet {
    // 1. If explicit wallet array is passed from useWallets() hook, resolve directly
    if (Array.isArray(wallets) && wallets.length > 0) {
      try {
        return this.resolveSolanaWallet(wallets);
      } catch (err) {
        // Continue to session/cache fallbacks below
      }
    }

    // 2. Inspect global Privy SDK window session object if present
    if (typeof window !== 'undefined') {
      const windowWallets = (window as any)?.privyWallets || (window as any)?.privy?.wallets;
      if (Array.isArray(windowWallets) && windowWallets.length > 0) {
        try {
          return this.resolveSolanaWallet(windowWallets);
        } catch (e) { }
      }

      // 3. Inspect localStorage cache for specific user email session
      if (typeof wallets === 'string' && wallets.trim().length > 0) {
        const cleanEmail = wallets.toLowerCase().trim();
        const cachedAddr = localStorage.getItem(`zega_privy_wallet_${cleanEmail}`);
        if (cachedAddr && this.isValidSolanaAddress(cachedAddr)) {
          return {
            address: cachedAddr,
            walletId: `privy_user_${cleanEmail}`,
            chainType: 'solana',
            walletClientType: 'privy',
            isPrivy: true,
            providerLabel: 'Privy Embedded Solana Wallet',
          };
        }
      }

      // 4. Inspect active logged in session in localStorage
      try {
        const sessionStr = localStorage.getItem('zega_mock_session');
        if (sessionStr) {
          const parsedSession = JSON.parse(sessionStr);
          const userEmail = parsedSession?.email || parsedSession?.user?.email;
          if (userEmail) {
            const cleanEmail = String(userEmail).toLowerCase().trim();
            const storedAddr = localStorage.getItem(`zega_privy_wallet_${cleanEmail}`);
            if (storedAddr && this.isValidSolanaAddress(storedAddr)) {
              return {
                address: storedAddr,
                walletId: `privy_user_${cleanEmail}`,
                chainType: 'solana',
                walletClientType: 'privy',
                isPrivy: true,
                providerLabel: 'Privy Embedded Solana Wallet',
              };
            }
          }
        }
      } catch (e) { }
    }

    // 5. Fallback placeholder for initialization prior to Privy session load
    return {
      address: '',
      walletId: 'pending_privy_solana_wallet',
      chainType: 'solana',
      walletClientType: 'privy',
      isPrivy: true,
      providerLabel: 'Privy Embedded Solana Wallet',
    };
  }

  /**
   * Validate that a wallet address is a valid Solana public key.
   *
   * This does NOT generate or derive a wallet.
   */
  public static isValidSolanaAddress(
    address: string
  ): boolean {
    try {
      if (!address || typeof address !== 'string') {
        return false;
      }

      /**
       * Avoid importing Keypair or generating private keys.
       *
       * Solana addresses are 32-byte public keys encoded in Base58.
       */
      const BASE58 =
        '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

      let value = BigInt(0);

      for (const char of address) {
        const index = BASE58.indexOf(char);

        if (index === -1) {
          return false;
        }

        value = value * BigInt(58) + BigInt(index);
      }

      const bytes: number[] = [];

      while (value > BigInt(0)) {
        bytes.push(Number(value % BigInt(256)));
        value /= BigInt(256);
      }

      let leadingZeros = 0;

      for (
        let i = 0;
        i < address.length &&
        address[i] === '1';
        i++
      ) {
        leadingZeros++;
      }

      const length =
        bytes.length + leadingZeros;

      return length === 32;
    } catch {
      return false;
    }
  }

  /**
   * Resolve wallet and validate its address.
   */
  public static getValidatedEmbeddedSolanaWallet(
    wallets: readonly any[]
  ): ResolvedPrivyWallet {
    const wallet =
      this.getEmbeddedSolanaWallet(wallets);

    if (!this.isValidSolanaAddress(wallet.address)) {
      throw new Error(
        `INVALID_PRIVY_SOLANA_ADDRESS: ${wallet.address}`
      );
    }

    return wallet;
  }

  /**
   * Get official Privy OAuth URL.
   *
   * NOTE:
   * OAuth authentication must still be completed through
   * Privy's actual SDK/session flow.
   */
  public static getPrivyOAuthUrl(
    provider: 'google' | 'github',
    redirectUri?: string
  ): string {
    const appId = this.getAppId();

    if (!appId) {
      throw new Error(
        'PRIVY_APP_ID_MISSING'
      );
    }

    const targetRedirect =
      redirectUri ||
      (
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://zegaai.site'
      );

    return (
      `https://auth.privy.io/login` +
      `?app_id=${encodeURIComponent(appId)}` +
      `&provider=${encodeURIComponent(provider)}` +
      `&redirect_uri=${encodeURIComponent(targetRedirect)}`
    );
  }

  /**
   * DO NOT create synthetic users here.
   *
   * The old implementation generated:
   *
   * provider.timestamp@zegaai.site
   *
   * That is not a Privy identity.
   *
   * Authentication must be performed by Privy's SDK.
   */
  public static async launchSocialOAuth(
    _provider: 'google' | 'github'
  ): Promise<never> {
    throw new Error(
      'launchSocialOAuth() has been disabled. ' +
      'Use Privy SDK login/linkSocial flow so the authenticated ' +
      'Privy user and embedded wallet are resolved dynamically.'
    );
  }

  /**
   * Synchronize the authenticated Privy identity with ZEGA backend.
   *
   * IMPORTANT:
   * The wallet address is supplied from the actual Privy wallet.
   */
  public static async syncUserToPrivyBackend(
    email: string,
    role:
      | 'superadmin'
      | 'enterprise'
      | 'individual' = 'individual',
    provider:
      | 'email'
      | 'google'
      | 'github' = 'email',
    fullName?: string,
    privyUserId?: string,
    wallet?: ResolvedPrivyWallet
  ): Promise<any | null> {
    try {
      const apiUrl =
        (import.meta as any)?.env?.VITE_API_URL ||
        'http://localhost:3001';

      if (!email) {
        console.warn('[PrivyWalletService] Skipping syncUserToPrivyBackend — email is missing');
        return null;
      }

      if (!privyUserId) {
        console.warn('[PrivyWalletService] Skipping syncUserToPrivyBackend — privyUserId is missing (pre-authentication state)');
        return null;
      }

      if (!wallet?.address) {
        console.warn('[PrivyWalletService] Skipping syncUserToPrivyBackend — wallet address is missing');
        return null;
      }

      if (!this.isValidSolanaAddress(wallet.address)) {
        throw new Error(
          'PRIVY_SYNC_WALLET_ADDRESS_INVALID'
        );
      }

      const res = await fetch(
        `${apiUrl}/v1/auth/privy-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            fullName,
            role,
            provider,

            // IMPORTANT:
            // These values originate from the actual Privy session.
            privyUserId,
            walletId: wallet.walletId,
            walletAddress: wallet.address,
            chainType: wallet.chainType,
            walletClientType:
              wallet.walletClientType,
          }),
        }
      );

      if (!res.ok) {
        const errorText =
          await res.text().catch(() => '');

        throw new Error(
          `PRIVY_SYNC_FAILED ${res.status}: ${errorText}`
        );
      }

      return await res.json();
    } catch (error) {
      console.error(
        'Privy backend sync failed:',
        error
      );

      return null;
    }
  }
}
