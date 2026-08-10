import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token';
import { createHash } from 'crypto';
import { solanaRpcManager } from './solanaRpcManager.js';
import { logger } from '../utils/logger.js';
import { VALID_USDC_MINTS } from '../utils/settlementValidation.js';

export interface MerchantBalanceResult {
  sol: number;
  usdc: number;
  availableSolLamports: bigint;
  availableUsdcRaw: bigint;
}

/**
 * ZEGA AI — Solana Domain Service (F-017 Extraction)
 *
 * Encapsulates core Solana blockchain operations:
 * - Keypair derivation
 * - On-chain SOL and SPL token balance checks
 * - Solana Pay URL construction
 */
export class SolanaService {
  private static USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

  /**
   * Generates a unique Base58 Solana Pay reference key.
   */
  static generateReferenceKey(): string {
    return Keypair.generate().publicKey.toBase58();
  }

  /**
   * Construct Solana Pay URL
   */
  static buildSolanaPayUrl(recipient: string, amount: number, referenceKey: string, tokenSymbol: 'USDC' | 'SOL' = 'USDC', label = 'ZEGA Pay', message = 'Invoice'): string {
    const cleanRecipient = recipient.trim();
    const encodedLabel = encodeURIComponent(label);
    const encodedMessage = encodeURIComponent(message);

    if (tokenSymbol === 'USDC') {
      return `solana:${cleanRecipient}?amount=${amount}&spl-token=${this.USDC_MINT_DEVNET}&reference=${referenceKey}&label=${encodedLabel}&message=${encodedMessage}`;
    }
    return `solana:${cleanRecipient}?amount=${amount}&reference=${referenceKey}&label=${encodedLabel}&message=${encodedMessage}`;
  }

  /**
   * Query on-chain SOL and USDC balance for a merchant pubkey using SolanaRpcManager provider pool.
   */
  static async getMerchantBalance(merchantPubkey: string): Promise<MerchantBalanceResult> {
    let solBalance = 0;
    let usdcBalance = 0;
    let availableSolLamports = 0n;
    let availableUsdcRaw = 0n;

    try {
      const pubkey = new PublicKey(merchantPubkey);

      // 1. Fetch SOL Balance
      const lamports = await solanaRpcManager.callRpc<any>('getBalance', [pubkey.toBase58()]);
      const rawLamports = typeof lamports === 'number'
        ? lamports
        : (typeof lamports?.value === 'number' ? lamports.value : 0);

      if (rawLamports > 0) {
        availableSolLamports = BigInt(rawLamports);
        solBalance = rawLamports / LAMPORTS_PER_SOL;
      }

      // 2. Fetch USDC SPL Token Balance
      for (const mintStr of VALID_USDC_MINTS) {
        try {
          const usdcMint = new PublicKey(mintStr);
          const ata = getAssociatedTokenAddressSync(usdcMint, pubkey);

          const tokenAccInfo = await solanaRpcManager.callRpc<any>('getTokenAccountBalance', [ata.toBase58()]);
          if (tokenAccInfo && tokenAccInfo.value) {
            const rawAmount = BigInt(tokenAccInfo.value.amount || '0');
            const decimals = tokenAccInfo.value.decimals || 6;
            if (rawAmount > availableUsdcRaw) {
              availableUsdcRaw = rawAmount;
              usdcBalance = Number(rawAmount) / Math.pow(10, decimals);
            }
          }
        } catch {
          // Continue checking alternate USDC mints
        }
      }
    } catch (err: any) {
      logger.warn({ merchantPubkey, err: err.message }, '[SolanaService] Balance check exception — returning zero balance fallback');
    }

    return {
      sol: solBalance,
      usdc: usdcBalance,
      availableSolLamports,
      availableUsdcRaw,
    };
  }
}
