import { privyWalletService } from './PrivyWalletService.js';
import { privyService } from './privyService.js';
import { solanaTransactionService, SolanaTransactionService } from './solanaTransactionService.js';
import { ledgerService } from './LedgerService.js';
import { supabaseService } from './supabaseService.js';
import { logger } from '../utils/logger.js';

/**
 * SECURITY (S-09): Valid withdrawal state transitions.
 * Only explicitly allowed transitions are permitted.
 * Any transition not in this map is REJECTED.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['VALIDATING', 'FAILED', 'CANCELLED'],
  VALIDATING: ['BUILDING', 'FAILED', 'CANCELLED'],
  BUILDING: ['AWAITING_SIGNATURE', 'FAILED', 'CANCELLED'],
  AWAITING_SIGNATURE: ['SIGNED', 'SUBMITTED', 'FAILED', 'CANCELLED', 'EXPIRED'],
  SIGNED: ['SUBMITTED', 'FAILED'],
  SUBMITTED: ['CONFIRMING', 'FAILED'],
  CONFIRMING: ['CONFIRMED', 'FAILED'],
  // Terminal states — no further transitions
  CONFIRMED: [],
  FAILED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export interface CreateWithdrawalParams {
  userId: string;
  recipient: string;
  amount: string;
  asset?: string;
  tokenMint?: string;
  idempotencyKey?: string;
}

export interface WithdrawalRecord {
  id: string;
  user_id: string;
  wallet_id: string;
  privy_user_id: string;
  asset: string;
  token_mint?: string;
  amount: string;
  amount_base_units: string;
  sender: string;
  recipient: string;
  status: 'REQUESTED' | 'VALIDATING' | 'BUILDING' | 'AWAITING_SIGNATURE' | 'SIGNED' | 'SUBMITTED' | 'CONFIRMING' | 'CONFIRMED' | 'FAILED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  signature?: string;
  fee?: string;
  error_code?: string;
  error_message?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export class WithdrawalService {
  /**
   * Orchestrates withdrawal execution through full state machine with Privy Enclave signing,
   * atomic database fund reservation, and post-confirmation ledger debit settlement.
   */
  public async executeWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalRecord> {
    const { userId, recipient, amount, asset = 'SOL', tokenMint, idempotencyKey } = params;
    const supabase = supabaseService.getClient();

    if (idempotencyKey && supabase) {
      const { data: existing } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existing) {
        return existing as WithdrawalRecord;
      }
    }

    SolanaTransactionService.validatePublicKey(recipient, 'Recipient Address');

    const wallet = await privyWalletService.ensureUserSolanaWallet(userId);
    const sender = wallet.wallet_address;

    if (sender === recipient) {
      throw new Error('Self-transfer prohibited: Source and recipient addresses cannot be identical.');
    }

    const baseUnits = SolanaTransactionService.safeConvertToBaseUnits(amount, asset);
    const requestedAmountNum = parseFloat(amount);
    if (isNaN(requestedAmountNum) || requestedAmountNum <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    // ── 1. PRE-WITHDRAWAL BALANCE ENFORCEMENT & ATOMIC FUND RESERVATION ──
    let currentRecord: WithdrawalRecord;

    if (!supabase) {
      // SECURITY (S-07 FIX): Fail closed — never execute financial operations without database
      throw new Error('WITHDRAWAL_UNAVAILABLE: Database client uninitialized. Cannot execute withdrawal.');
    }

    const { data: reservedData, error: reserveError } = await supabase.rpc('reserve_withdrawal_atomic', {
      p_user_id: wallet.user_id,
      p_wallet_id: wallet.id,
      p_privy_user_id: wallet.privy_user_id,
      p_asset: asset,
      p_token_mint: tokenMint || null,
      p_amount: requestedAmountNum,
      p_amount_base_units: baseUnits.toString(),
      p_sender: sender,
      p_recipient: recipient,
      p_idempotency_key: idempotencyKey || null,
    });

    if (reserveError) {
      if (reserveError.message.includes('INSUFFICIENT_FUNDS')) {
        throw new Error(`INSUFFICIENT_FUNDS: Available balance is insufficient for requested withdrawal of ${amount} ${asset}.`);
      }
      throw new Error(`WITHDRAWAL_RESERVATION_FAILED: ${reserveError.message}`);
    }

    currentRecord = reservedData as WithdrawalRecord;

    try {
      currentRecord = await this.updateWithdrawalStatus(currentRecord.id, 'BUILDING');

      // Build transaction object
      const { transaction } = await solanaTransactionService.buildTransactionData({
        sender,
        recipient,
        amount,
        asset: asset as any,
        mint: tokenMint,
      });

      currentRecord = await this.updateWithdrawalStatus(currentRecord.id, 'AWAITING_SIGNATURE');
      
      // ── 2. PRIVY ENCLAVE SIGNING ──
      let signedTxBase64: string;
      try {
        const signResult = await privyService.signTransactionViaPrivy(
          wallet.privy_wallet_id,
          wallet.wallet_address,
          transaction
        );
        signedTxBase64 = typeof signResult === 'string' ? signResult : signResult.signedTxBase64;
      } catch (signErr: any) {
        await this.releaseReservation(currentRecord.id, 'PRIVY_SIGNING_FAILED', signErr.message);
        throw signErr;
      }

      currentRecord = await this.updateWithdrawalStatus(currentRecord.id, 'SUBMITTED');
      
      // ── 3. SOLANA RPC SUBMISSION ──
      let signature: string;
      try {
        signature = await solanaTransactionService.submitSignedTransaction(signedTxBase64);
      } catch (submitErr: any) {
        await this.releaseReservation(currentRecord.id, 'RPC_SUBMISSION_FAILED', submitErr.message);
        throw submitErr;
      }

      currentRecord = await this.updateWithdrawalStatus(currentRecord.id, 'CONFIRMING', { signature });
      
      // ── 4. ON-CHAIN CONFIRMATION ──
      try {
        await solanaTransactionService.confirmTransactionSignature(signature);
      } catch (confirmErr: any) {
        console.warn(`[WithdrawalService] On-chain confirmation pending/timed out for signature ${signature}:`, confirmErr.message);
        // Do NOT release reservation for unknown/pending states; leave in CONFIRMING for background reconciliation
        throw confirmErr;
      }

      // ── 5. ATOMIC FINAL SETTLEMENT & DEBIT ──
      currentRecord = await this.finalizeWithdrawal(currentRecord.id, signature);
      return currentRecord;
    } catch (err: any) {
      console.error(`[WithdrawalService] Withdrawal ${currentRecord.id} failed:`, err.message);
      throw err;
    }
  }

  /**
   * Finalizes withdrawal status to CONFIRMED and records ledger DEBIT atomically.
   */
  public async finalizeWithdrawal(withdrawalId: string, signature: string, fee?: string): Promise<WithdrawalRecord> {
    const supabase = supabaseService.getClient();
    if (supabase) {
      const { data, error } = await supabase.rpc('finalize_withdrawal_atomic', {
        p_withdrawal_id: withdrawalId,
        p_signature: signature,
        p_fee: fee ? parseFloat(fee) : null,
      });

      if (error) {
        throw new Error(`Failed to finalize withdrawal ${withdrawalId}: ${error.message}`);
      }

      return data as WithdrawalRecord;
    }

    const current = await this.updateWithdrawalStatus(withdrawalId, 'CONFIRMED', { signature });

      await ledgerService.recordDebit({
        userId: current.user_id,
        walletId: current.wallet_id,
        organizationId: (current as any).organization_id || '',
        type: 'WITHDRAWAL',
        asset: current.asset,
        tokenMint: current.token_mint,
        amount: current.amount,
        referenceType: 'WITHDRAWAL',
        referenceId: current.id,
      });

    return current;
  }

  /**
   * Releases reserved withdrawal balance when execution fails before broadcast.
   */
  public async releaseReservation(withdrawalId: string, errorCode?: string, errorMessage?: string): Promise<WithdrawalRecord> {
    const supabase = supabaseService.getClient();
    if (supabase) {
      const { data, error } = await supabase.rpc('release_withdrawal_reservation_atomic', {
        p_withdrawal_id: withdrawalId,
        p_error_code: errorCode || 'WITHDRAWAL_RELEASED',
        p_error_message: errorMessage || 'Withdrawal reservation released',
      });

      if (!error && data) {
        return data as WithdrawalRecord;
      }
    }

    return this.updateWithdrawalStatus(withdrawalId, 'FAILED', {
      error_code: errorCode || 'WITHDRAWAL_FAILED',
      error_message: errorMessage || 'Withdrawal execution failed',
    });
  }

  private async updateWithdrawalStatus(
    id: string,
    status: WithdrawalRecord['status'],
    additionalData: Partial<WithdrawalRecord> = {}
  ): Promise<WithdrawalRecord> {
    const supabase = supabaseService.getClient();
    if (!supabase) {
      throw new Error('Database client uninitialized: cannot update withdrawal status');
    }

    // SECURITY (S-09 FIX): Validate state transition before applying
    const { data: current } = await supabase
      .from('withdrawals')
      .select('status')
      .eq('id', id)
      .single();

    if (current) {
      const currentStatus = current.status as string;
      const allowedNext = VALID_TRANSITIONS[currentStatus];
      if (allowedNext && !allowedNext.includes(status)) {
        logger.error(
          { withdrawalId: id, currentStatus, targetStatus: status },
          '[WithdrawalService] INVALID_STATE_TRANSITION — rejected'
        );
        throw new Error(`INVALID_STATE_TRANSITION: Cannot transition withdrawal from ${currentStatus} to ${status}.`);
      }
    }

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { data, error } = await supabase
      .from('withdrawals')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update withdrawal status to ${status}: ${error.message}`);
    }

    return data as WithdrawalRecord;
  }

  // SECURITY (S-05/S-20 FIX): Use userId (UUID) directly, not normalizeEmail
  public async listUserWithdrawals(userId: string, limit = 20): Promise<WithdrawalRecord[]> {
    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data as WithdrawalRecord[]) || [];
  }
}

export const withdrawalService = new WithdrawalService();

