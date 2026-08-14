/**
 * ZEGA AI — Wallet Service
 *
 * Manages the complete user wallet lifecycle:
 *   - Resolving Privy user metadata
 *   - Resolving linked Privy Solana embedded wallets
 *   - Ensuring / synchronizing wallet records in Supabase `privy_wallets`
 *
 * SECURITY INVARIANTS:
 *   - NEVER generates local keypairs (`Keypair.generate()` prohibited)
 *   - NEVER derives deterministic private keys
 *   - ALL signing authority belongs exclusively to Privy
 */

import { PublicKey } from '@solana/web3.js';
import { PrivyService, type PrivyUserWallet } from './privyService.js';
import { SupabaseService } from './supabaseService.js';
import { logger } from '../utils/logger.js';

export interface WalletRecord {
  id?: string;
  userId: string;
  privyUserId: string;
  email?: string;
  walletId?: string;
  walletAddress: string;
  chain: 'solana';
  walletType: string;
  status: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const WalletErrors = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',
  MULTIPLE_WALLETS: 'MULTIPLE_WALLETS',
  WALLET_MISMATCH: 'WALLET_MISMATCH',
  INVALID_CHAIN: 'INVALID_CHAIN',
} as const;

/**
 * Get Privy user details by user ID (email or DID).
 */
export async function getPrivyUser(identifier: string) {
  if (!identifier) throw new Error('Identifier is required.');

  if (identifier.startsWith('did:privy:')) {
    return await PrivyService.resolvePrivyUserById(identifier);
  }
  return await PrivyService.resolvePrivyUserByEmail(identifier);
}

/**
 * Get Privy user's Solana wallet details from Privy SDK.
 */
export async function getUserWallet(identifier: string): Promise<PrivyUserWallet> {
  const isDid = identifier.startsWith('did:privy:');
  const type = isDid ? 'privyUserId' : 'email';
  return await PrivyService.getUserSolanaWallet(identifier, type);
}

/**
 * Get user's Solana wallet address from Supabase cache or Privy SDK fallback.
 */
export async function getSolanaWallet(userId: string): Promise<string> {
  const supabase = SupabaseService.getClient();

  if (supabase) {
    try {
      const { data } = await supabase
        .from('privy_wallets')
        .select('wallet_address')
        .eq('user_id', userId)
        .eq('chain', 'solana')
        .eq('is_primary', true)
        .maybeSingle();

      if (data?.wallet_address) {
        return data.wallet_address;
      }
    } catch (err: any) {
      logger.warn({ err: err.message, userId }, '[WalletService] DB lookup failed, falling back to Privy SDK.');
    }
  }

  // Fallback to Privy SDK resolution
  const wallet = await getUserWallet(userId);
  return wallet.walletAddress;
}

/**
 * Ensure user has a registered Privy wallet record in Supabase.
 * Resolves wallet from Privy SDK and upserts metadata into `privy_wallets`.
 */
export async function ensureUserWallet(userId: string): Promise<WalletRecord> {
  if (!userId) {
    throw Object.assign(new Error('User ID is required.'), {
      code: WalletErrors.USER_NOT_FOUND,
    });
  }

  const privyWallet = await getUserWallet(userId);

  // Validate address
  try {
    new PublicKey(privyWallet.walletAddress);
  } catch {
    throw Object.assign(
      new Error(`Resolved wallet address "${privyWallet.walletAddress}" is invalid.`),
      { code: WalletErrors.INVALID_WALLET_ADDRESS }
    );
  }

  const walletRecord: WalletRecord = {
    userId,
    privyUserId: privyWallet.privyUserId,
    email: privyWallet.privyUserEmail || (userId.includes('@') ? userId : undefined),
    walletId: privyWallet.walletId,
    walletAddress: privyWallet.walletAddress,
    chain: 'solana',
    walletType: 'privy_keyless_embedded',
    status: 'active',
    isPrimary: true,
  };

  const supabase = SupabaseService.getClient();
  if (supabase) {
    try {
      await supabase.from('privy_wallets').upsert(
        {
          user_id: walletRecord.userId,
          privy_user_id: walletRecord.privyUserId,
          email: walletRecord.email || null,
          wallet_id: walletRecord.walletId || null,
          wallet_address: walletRecord.walletAddress,
          chain: walletRecord.chain,
          wallet_type: walletRecord.walletType,
          status: walletRecord.status,
          is_primary: walletRecord.isPrimary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,chain' }
      );
      logger.info({ userId, walletAddress: walletRecord.walletAddress }, '[WalletService] Wallet synchronized with DB.');
    } catch (err: any) {
      logger.warn({ err: err.message, userId }, '[WalletService] DB upsert failed.');
    }
  }

  return walletRecord;
}

export const WalletService = {
  getPrivyUser,
  getUserWallet,
  getSolanaWallet,
  ensureUserWallet,
};
