import { privyWalletService } from './PrivyWalletService.js';
import { privyService } from './privyService.js';
import { solanaTransactionService, SolanaTransactionService } from './solanaTransactionService.js';
import { ledgerService } from './LedgerService.js';
import { supabaseService } from './supabaseService.js';

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

    if (supabase) {
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
    } else {
      // Fallback in-memory ledger balance check
      const userLedger = await ledgerService.getUserLedger(wallet.user_id);
      const credits = userLedger.filter((l) => l.direction === 'CREDIT' && l.asset === asset).reduce((acc, l) => acc + parseFloat(l.amount), 0);
      const debits = userLedger.filter((l) => l.direction === 'DEBIT' && l.asset === asset).reduce((acc, l) => acc + parseFloat(l.amount), 0);
      const available = credits - debits;

      if (available < requestedAmountNum) {
        throw new Error(`INSUFFICIENT_FUNDS: Available balance (${available}) is less than requested amount (${amount} ${asset}).`);
      }

      currentRecord = {
        id: `wdr_${Date.now()}`,
        user_id: wallet.user_id,
        wallet_id: wallet.id,
        privy_user_id: wallet.privy_user_id,
        asset,
        token_mint: tokenMint || undefined,
        amount,
        amount_base_units: baseUnits.toString(),
        sender,
        recipient,
        status: 'VALIDATING',
        idempotency_key: idempotencyKey || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

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
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    if (!supabase) {
      throw new Error('Database client uninitialized: cannot update withdrawal status');
    }

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

  public async listUserWithdrawals(userId: string, limit = 20): Promise<WithdrawalRecord[]> {
    const normalized = privyWalletService.normalizeEmail(userId);
    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', normalized)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data as WithdrawalRecord[]) || [];
  }
}

export const withdrawalService = new WithdrawalService();

