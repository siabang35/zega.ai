import { privyService } from './privyService.js';
import { supabaseService } from './supabaseService.js';

export interface WalletRecord {
  id: string;
  user_id: string;
  privy_user_id: string;
  privy_wallet_id: string;
  wallet_address: string;
  chain: string;
  wallet_type: string;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export class PrivyWalletService {
  /**
   * Normalize email according to ZEGA identity invariant rules (trim & lowercase).
   */
  public normalizeEmail(email: string): string {
    if (!email) throw new Error('Email is required for wallet identity resolution.');
    return email.trim().toLowerCase();
  }

  /**
   * Enforces 1 Email = 1 ZEGA User = 1 Privy User = 1 Solana Wallet invariant.
   * This operation is idempotent.
   */
  public async ensureUserSolanaWallet(rawUserId: string): Promise<WalletRecord> {
    const userId = this.normalizeEmail(rawUserId);

    // 1. Check local database for existing primary Solana wallet
    const existingWallet = await this.getWalletByUserId(userId);
    if (existingWallet) {
      return existingWallet;
    }

    // 2. Resolve or create user via Privy SDK
    const privyUser = await privyService.getOrCreateUserByEmail(userId);
    const privyUserId = privyUser.id;

    // 3. Find embedded Solana wallet from Privy response
    let solanaWallet = privyUser.linkedAccounts?.find(
      (acc: any) => acc.type === 'wallet' && (acc.chainType === 'solana' || acc.chain_type === 'solana')
    );

    // 4. If Privy doesn't have an embedded Solana wallet yet, create one using Privy SDK
    if (!solanaWallet) {
      const createdWallet = await privyService.createSolanaWalletForUser(privyUserId);
      solanaWallet = {
        id: createdWallet.id,
        address: createdWallet.address,
        chainType: 'solana',
        walletClientType: 'privy',
      };
    }

    const walletAddress = solanaWallet.address;
    const privyWalletId = solanaWallet.id || `privy_wal_${walletAddress}`;

    // 5. Persist to DB with upsert safety
    const supabase = supabaseService.getClient();
    if (!supabase) {
      throw new Error('Database client uninitialized: cannot persist Solana wallet record');
    }

    const { data, error } = await supabase
      .from('wallets')
      .upsert(
        {
          user_id: userId,
          privy_user_id: privyUserId,
          privy_wallet_id: privyWalletId,
          wallet_address: walletAddress,
          chain: 'solana',
          wallet_type: 'privy_embedded',
          is_primary: true,
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, chain' }
      )
      .select()
      .single();

    if (error) {
      const racedWallet = await this.getWalletByUserId(userId);
      if (racedWallet) return racedWallet;
      throw new Error(`Failed to persist Privy wallet record: ${error.message}`);
    }

    // Sync to legacy table
    await supabase.from('privy_wallets').upsert(
      {
        user_id: userId,
        privy_user_id: privyUserId,
        wallet_address: walletAddress,
        chain: 'solana',
        is_primary: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, chain' }
    );

    return data as WalletRecord;
  }

  /**
   * Retrieves the primary Solana wallet for a user ID.
   */
  public async getWalletByUserId(userId: string): Promise<WalletRecord | null> {
    const normalized = this.normalizeEmail(userId);
    const supabase = supabaseService.getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', normalized)
      .eq('chain', 'solana')
      .eq('is_primary', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn(`[PrivyWalletService] Error fetching wallet for ${normalized}:`, error.message);
    }

    return (data as WalletRecord) || null;
  }

  /**
   * Resolves user ID by wallet address.
   */
  public async getWalletByAddress(address: string): Promise<WalletRecord | null> {
    const supabase = supabaseService.getClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('wallet_address', address)
      .maybeSingle();

    return (data as WalletRecord) || null;
  }
}

export const privyWalletService = new PrivyWalletService();
