import { supabaseService } from './supabaseService.js';
import { SolanaTransactionService } from './solanaTransactionService.js';

export interface LedgerEntryRecord {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'PAYMENT' | 'WITHDRAWAL' | 'REFUND' | 'ADJUSTMENT' | 'FEE';
  asset: string;
  token_mint?: string;
  amount: string;
  amount_base_units: string;
  reference_type?: string;
  reference_id?: string;
  direction: 'CREDIT' | 'DEBIT';
  created_at: string;
}

/**
 * ZEGA AI — Financial Audit Ledger Service
 *
 * Implements an immutable, append-only transaction audit ledger log.
 * Every financial credit or debit event produces a reference-linked entry.
 * Note: This service records single-sided transactional audit events
 * linked to on-chain operations and withdrawals for complete operational auditability.
 */
export class LedgerService {
  /**
   * Records a CREDIT entry in the internal auditable ledger.
   */
  public async recordCredit(params: {
    userId: string;
    walletId: string;
    organizationId: string;
    type: LedgerEntryRecord['type'];
    asset: string;
    tokenMint?: string;
    amount: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<LedgerEntryRecord> {
    const { userId, walletId, organizationId, type, asset, tokenMint, amount, referenceType, referenceId } = params;
    const baseUnits = SolanaTransactionService.safeConvertToBaseUnits(amount, asset);

    const supabase = supabaseService.getClient();
    if (!supabase) {
      // SECURITY (S-06 FIX): Fail closed — never silently create in-memory financial records
      throw new Error('LEDGER_UNAVAILABLE: Database client uninitialized. Cannot record financial entry.');
    }

    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        organization_id: organizationId,
        type,
        asset,
        token_mint: tokenMint || null,
        amount,
        amount_base_units: baseUnits.toString(),
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        direction: 'CREDIT',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record ledger credit: ${error.message}`);
    }

    return data as LedgerEntryRecord;
  }

  /**
   * Records a DEBIT entry in the internal auditable ledger.
   */
  public async recordDebit(params: {
    userId: string;
    walletId: string;
    organizationId: string;
    type: LedgerEntryRecord['type'];
    asset: string;
    tokenMint?: string;
    amount: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<LedgerEntryRecord> {
    const { userId, walletId, organizationId, type, asset, tokenMint, amount, referenceType, referenceId } = params;
    const baseUnits = SolanaTransactionService.safeConvertToBaseUnits(amount, asset);

    const supabase = supabaseService.getClient();
    if (!supabase) {
      // SECURITY (S-06 FIX): Fail closed — never silently create in-memory financial records
      throw new Error('LEDGER_UNAVAILABLE: Database client uninitialized. Cannot record financial entry.');
    }

    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        organization_id: organizationId,
        type,
        asset,
        token_mint: tokenMint || null,
        amount,
        amount_base_units: baseUnits.toString(),
        reference_type: referenceType || null,
        reference_id: referenceId || null,
        direction: 'DEBIT',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record ledger debit: ${error.message}`);
    }

    return data as LedgerEntryRecord;
  }

  /**
   * Retrieves user ledger entries.
   */
  public async getUserLedger(userId: string, limit = 50): Promise<LedgerEntryRecord[]> {
    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data as LedgerEntryRecord[]) || [];
  }
}

export const ledgerService = new LedgerService();
