/**
 * ZEGA AI — Balance Service
 *
 * Direct on-chain balance retrieval service:
 *   - SOL balance (lamports + SOL)
 *   - SPL Token balances (Parsed Associated Token Accounts)
 *
 * SECURITY:
 *   - NEVER trusts client-reported balances
 *   - Fetches real-time data directly from multi-provider Solana RPC Pool
 */

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { solanaRpcManager } from './solanaRpcManager.js';
import { logger } from '../utils/logger.js';

export interface TokenBalanceInfo {
  mint: string;
  symbol: string;
  balance: string;
  decimals: number;
  uiAmount: number;
  ataAddress?: string;
}

export interface AccountBalances {
  wallet: string;
  sol: {
    lamports: number;
    sol: number;
  };
  tokens: TokenBalanceInfo[];
}

const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_MAINNET_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * Get SOL balance for a given wallet address.
 */
export async function getSolBalance(walletAddress: string): Promise<{ lamports: number; sol: number }> {
  try {
    const result = await solanaRpcManager.callRpc<any>(
      'getBalance',
      [walletAddress],
      { skipCache: true }
    );

    const lamports =
      typeof result?.value === 'number'
        ? result.value
        : typeof result === 'number'
          ? result
          : 0;

    return {
      lamports,
      sol: lamports / LAMPORTS_PER_SOL,
    };
  } catch (err: any) {
    logger.error({ err: err.message, walletAddress }, '[BalanceService] Failed to fetch SOL balance.');
    throw new Error(`BALANCE_FETCH_FAILED: ${err.message}`);
  }
}

/**
 * Get SPL token balances for a wallet address.
 */
export async function getTokenBalances(walletAddress: string): Promise<TokenBalanceInfo[]> {
  const tokens: TokenBalanceInfo[] = [];

  try {
    const result = await solanaRpcManager.callRpc<any>(
      'getParsedTokenAccountsByOwner',
      [
        walletAddress,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ],
      { skipCache: true }
    );

    if (result?.value && Array.isArray(result.value)) {
      for (const account of result.value) {
        const info = account?.account?.data?.parsed?.info;
        const ataAddress = account?.pubkey;

        if (info?.tokenAmount) {
          const decimals = info.tokenAmount.decimals || 0;
          const uiAmount = parseFloat(info.tokenAmount.uiAmountString || '0');
          const amount = info.tokenAmount.amount || '0';
          const mint = info.mint || '';

          let symbol = 'UNKNOWN';
          if (mint === USDC_DEVNET_MINT || mint === USDC_MAINNET_MINT) {
            symbol = 'USDC';
          }

          if (BigInt(amount) > 0n) {
            tokens.push({
              mint,
              symbol,
              balance: amount,
              decimals,
              uiAmount,
              ataAddress,
            });
          }
        }
      }
    }
  } catch (err: any) {
    logger.warn({ err: err.message, walletAddress }, '[BalanceService] Failed to fetch SPL token balances.');
  }

  return tokens;
}

/**
 * Get comprehensive balances (SOL + SPL tokens) for a wallet address.
 */
export async function getAccountBalances(walletAddress: string): Promise<AccountBalances> {
  const [sol, tokens] = await Promise.all([
    getSolBalance(walletAddress),
    getTokenBalances(walletAddress),
  ]);

  return {
    wallet: walletAddress,
    sol,
    tokens,
  };
}

export const BalanceService = {
  getSolBalance,
  getTokenBalances,
  getAccountBalances,
  getBalances: getAccountBalances,
};

export const balanceService = BalanceService;
