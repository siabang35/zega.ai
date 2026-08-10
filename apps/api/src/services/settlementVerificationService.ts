import { Connection, PublicKey } from '@solana/web3.js';
import pino from 'pino';
import {
  validateSignatureFormat,
  validateUsdcMint,
  validateTxFreshness,
  ValidationResult,
} from '../utils/settlementValidation.js';
import { solanaRpcManager } from './solanaRpcManager.js';
import { SupabaseService } from './supabaseService.js';

const logger = pino({ name: 'SettlementVerificationService' });

export interface VerificationRequest {
  txSignature: string;
  expectedRecipient: string;
  expectedAmountLamportsOrUnits: number;
  splMint?: string | null;
  tenantId?: string;
}

export interface VerificationResponse {
  success: boolean;
  layer: string;
  error?: string;
  blockTime?: number;
  slot?: number;
  verifiedAt: string;
}

class CanonicalSettlementVerificationService {
  /**
   * Primary entrypoint: Enforces 5-Layer Deterministic Verification Pipeline
   */
  public async verifySettlement(req: VerificationRequest): Promise<VerificationResponse> {
    const verifiedAt = new Date().toISOString();

    // ── LAYER 1 & 2: Input & Base58 Signature Format Validation ──
    const formatCheck: ValidationResult = validateSignatureFormat(req.txSignature);
    if (!formatCheck.ok) {
      logger.warn({ req, err: formatCheck.error }, '[SettlementVerification] Layer 2 signature format failure');
      return {
        success: false,
        layer: formatCheck.layer || 'BASE58_FORMAT',
        error: formatCheck.error || 'Invalid Solana signature format',
        verifiedAt,
      };
    }

    const cleanSig = req.txSignature.trim();

    // ── LAYER 5 (Partial): SPL Token Mint Validation ──
    const mintCheck = validateUsdcMint(req.splMint || null);
    if (!mintCheck.ok) {
      return {
        success: false,
        layer: mintCheck.layer || 'SPL_MINT_MISMATCH',
        error: mintCheck.error || 'Invalid SPL token mint',
        verifiedAt,
      };
    }

    // ── LAYER 4: Database Anti-Replay Check ──
    const isDuplicate = await this.checkDuplicateSignature(cleanSig);
    if (isDuplicate) {
      logger.warn({ cleanSig }, '[SettlementVerification] Layer 4 anti-replay trigger: Signature already settled');
      return {
        success: false,
        layer: 'ANTI_REPLAY_DUPLICATE',
        error: 'Transaction signature has already been processed and settled',
        verifiedAt,
      };
    }

    // ── LAYER 3 & 5: On-Chain RPC Execution & Content Verification ──
    try {
      const rpcResult = await solanaRpcManager.callRpc('getParsedTransaction', [
        cleanSig,
        { maxSupportedTransactionVersion: 0, commitment: 'confirmed' },
      ]);

      if (!rpcResult) {
        return {
          success: false,
          layer: 'ONCHAIN_RPC_NOT_FOUND',
          error: 'Transaction not found on Solana blockchain or pending confirmation',
          verifiedAt,
        };
      }

      if (rpcResult.meta?.err) {
        return {
          success: false,
          layer: 'ONCHAIN_TX_FAILED',
          error: 'On-chain transaction execution failed with error state',
          verifiedAt,
        };
      }

      // Freshness check
      const blockTime = rpcResult.blockTime || null;
      const freshnessCheck = validateTxFreshness(blockTime);
      if (!freshnessCheck.ok) {
        return {
          success: false,
          layer: freshnessCheck.layer || 'TX_FRESHNESS',
          error: freshnessCheck.error || 'Transaction block time exceeds maximum age limit (72h)',
          verifiedAt,
        };
      }

      // ── LAYER 6: Business Intent Verification (Recipient + Amount) ──
      if (req.expectedRecipient) {
        const recipientVerified = this.verifyRecipient(rpcResult, req.expectedRecipient);
        if (!recipientVerified) {
          logger.warn({ cleanSig, expectedRecipient: req.expectedRecipient }, '[SettlementVerification] Recipient mismatch');
          return {
            success: false,
            layer: 'RECIPIENT_MISMATCH',
            error: `On-chain transaction recipient does not match expected recipient ${req.expectedRecipient}`,
            verifiedAt,
          };
        }
      }

      if (req.expectedAmountLamportsOrUnits && req.expectedAmountLamportsOrUnits > 0) {
        const amountVerified = this.verifyAmount(rpcResult, req.expectedAmountLamportsOrUnits);
        if (!amountVerified) {
          logger.warn({ cleanSig, expectedAmount: req.expectedAmountLamportsOrUnits }, '[SettlementVerification] Amount mismatch');
          return {
            success: false,
            layer: 'AMOUNT_MISMATCH',
            error: `On-chain transfer amount does not match expected ${req.expectedAmountLamportsOrUnits}`,
            verifiedAt,
          };
        }
      }

      logger.info({ cleanSig, slot: rpcResult.slot }, '[SettlementVerification] On-chain verification SUCCESS (recipient + amount verified)');

      return {
        success: true,
        layer: 'CANONICAL_VERIFIED',
        blockTime: blockTime || undefined,
        slot: rpcResult.slot,
        verifiedAt,
      };
    } catch (err: any) {
      logger.error({ err, cleanSig }, '[SettlementVerification] On-chain RPC verification exception');
      return {
        success: false,
        layer: 'RPC_PROVIDER_FAILURE',
        error: `Solana RPC lookup failed: ${err?.message || 'Unknown network error'}`,
        verifiedAt,
      };
    }
  }

  /** Check if signature already exists in public.zeroclaw_solana_settlements */
  private async checkDuplicateSignature(signature: string): Promise<boolean> {
    const supabase = SupabaseService.getClient();
    // SECURITY (F-05 FIX): Fail-closed — if DB is unavailable, treat as duplicate to prevent replay
    if (!supabase) {
      logger.warn('[SettlementVerification] Supabase unavailable — FAIL-CLOSED: treating as duplicate');
      return true;
    }

    try {
      const { data } = await supabase
        .from('zeroclaw_solana_settlements')
        .select('id')
        .eq('tx_signature', signature)
        .maybeSingle();

      return Boolean(data?.id);
    } catch (e) {
      // SECURITY (F-05 FIX): Fail-closed — DB errors treated as duplicate
      logger.warn({ e }, '[SettlementVerification] Anti-replay DB query exception — FAIL-CLOSED');
      return true;
    }
  }

  /** Verify the on-chain transaction includes a transfer to the expected recipient */
  private verifyRecipient(txResult: any, expectedRecipient: string): boolean {
    try {
      const accountKeys = txResult.transaction?.message?.accountKeys || [];
      // Check if expected recipient is in the transaction's account keys
      const recipientFound = accountKeys.some((key: any) => {
        const pubkey = typeof key === 'string' ? key : key?.pubkey;
        return pubkey === expectedRecipient;
      });

      if (recipientFound) return true;

      // Also check postTokenBalances for SPL transfers
      const postBalances = txResult.meta?.postTokenBalances || [];
      return postBalances.some((balance: any) => balance.owner === expectedRecipient);
    } catch {
      return false;
    }
  }

  /** Verify the on-chain transfer amount matches expected (in lamports or token units) */
  private verifyAmount(txResult: any, expectedAmount: number): boolean {
    try {
      // Check native SOL transfers via pre/post balance differences
      const preBalances: number[] = txResult.meta?.preBalances || [];
      const postBalances: number[] = txResult.meta?.postBalances || [];

      for (let i = 0; i < postBalances.length; i++) {
        const diff = postBalances[i] - (preBalances[i] || 0);
        if (diff > 0 && diff >= expectedAmount) return true;
      }

      // Check SPL token transfers via pre/post token balances
      const preTokenBals = txResult.meta?.preTokenBalances || [];
      const postTokenBals = txResult.meta?.postTokenBalances || [];

      for (const postBal of postTokenBals) {
        const preBal = preTokenBals.find(
          (p: any) => p.accountIndex === postBal.accountIndex
        );
        const preAmount = parseFloat(preBal?.uiTokenAmount?.amount || '0');
        const postAmount = parseFloat(postBal?.uiTokenAmount?.amount || '0');
        const diff = postAmount - preAmount;
        if (diff > 0 && diff >= expectedAmount) return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

export const SettlementVerificationService = new CanonicalSettlementVerificationService();
