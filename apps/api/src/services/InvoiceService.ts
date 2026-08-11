import { privyWalletService } from './PrivyWalletService.js';
import { supabaseService } from './supabaseService.js';
import { SolanaTransactionService } from './solanaTransactionService.js';

export interface CreateInvoiceParams {
  userId: string;
  amount: string;
  asset?: string;
  tokenMint?: string;
  description?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, any>;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  user_id: string;
  wallet_id: string;
  currency: string;
  asset: string;
  token_mint?: string;
  amount: string;
  amount_base_units: string;
  recipient_address: string;
  status: 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
  description?: string;
  metadata?: Record<string, any>;
  expires_at: string;
  payment_signature?: string;
  paid_amount: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export class InvoiceService {
  /**
   * Enforces state machine transition invariants for invoices.
   */
  public static validateStateTransition(currentStatus: string, targetStatus: string): boolean {
    const current = (currentStatus || '').toLowerCase();
    const target = (targetStatus || '').toLowerCase();

    if (current === target) return true;

    const terminalStates = ['settled', 'cancelled', 'expired', 'failed', 'paid'];
    if (terminalStates.includes(current)) {
      throw new Error(`Illegal state transition from terminal state '${current}' to '${target}'`);
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ['authorized', 'processing', 'partially_paid', 'paid', 'settled', 'cancelled', 'expired', 'failed'],
      created: ['authorized', 'processing', 'partially_paid', 'paid', 'settled', 'cancelled', 'expired', 'failed'],
      authorized: ['processing', 'partially_paid', 'paid', 'settled', 'cancelled', 'failed'],
      processing: ['partially_paid', 'paid', 'settled', 'failed'],
      partially_paid: ['paid', 'failed', 'expired', 'cancelled'],
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(target)) {
      throw new Error(`Illegal state machine transition: cannot transition from '${current}' to '${target}'`);
    }

    return true;
  }
  /**
   * Create receiving invoice. Recipient address is STRICTLY bound to user's Privy wallet address from DB.
   */
  public async createInvoice(params: CreateInvoiceParams): Promise<InvoiceRecord> {
    const { userId, amount, asset = 'SOL', tokenMint, description, expiresInMinutes = 60, metadata } = params;

    const wallet = await privyWalletService.ensureUserSolanaWallet(userId);
    const baseUnits = SolanaTransactionService.safeConvertToBaseUnits(amount, asset);
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const supabase = supabaseService.getClient();
    if (!supabase) {
      return {
        id: `inv_${Date.now()}`,
        invoice_number: invoiceNumber,
        user_id: wallet.user_id,
        wallet_id: wallet.id,
        currency: asset,
        asset,
        token_mint: tokenMint || undefined,
        amount,
        amount_base_units: baseUnits.toString(),
        recipient_address: wallet.wallet_address,
        status: 'PENDING',
        description: description || 'ZEGA AI Payment Invoice',
        metadata: metadata || {},
        expires_at: expiresAt,
        paid_amount: '0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: wallet.user_id,
        wallet_id: wallet.id,
        currency: asset,
        asset,
        token_mint: tokenMint || null,
        amount,
        amount_base_units: baseUnits.toString(),
        recipient_address: wallet.wallet_address,
        status: 'PENDING',
        description: description || 'ZEGA AI Payment Invoice',
        metadata: metadata || {},
        expires_at: expiresAt,
        paid_amount: '0',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    return data as InvoiceRecord;
  }

  /**
   * Retrieves invoice by ID or invoice number.
   */
  public async getInvoice(idOrNumber: string): Promise<InvoiceRecord | null> {
    const supabase = supabaseService.getClient();
    if (!supabase) return null;

    const isUuid = idOrNumber.includes('-');
    const query = supabase.from('invoices').select('*');
    const { data } = isUuid ? await query.eq('id', idOrNumber).maybeSingle() : await query.eq('invoice_number', idOrNumber).maybeSingle();

    return (data as InvoiceRecord) || null;
  }

  /**
   * List invoices for a user.
   */
  public async listUserInvoices(userId: string, limit = 20): Promise<InvoiceRecord[]> {
    const normalized = privyWalletService.normalizeEmail(userId);
    const supabase = supabaseService.getClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', normalized)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data as InvoiceRecord[]) || [];
  }

  /**
   * Updates invoice status.
   */
  public async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceRecord['status'],
    paymentSignature?: string,
    paidAmount?: string
  ): Promise<InvoiceRecord> {
    const supabase = supabaseService.getClient();
    if (!supabase) {
      throw new Error('Supabase client unavailable for updateInvoiceStatus.');
    }

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (paymentSignature) updatePayload.payment_signature = paymentSignature;
    if (paidAmount) updatePayload.paid_amount = paidAmount;
    if (status === 'PAID') updatePayload.paid_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }

    return data as InvoiceRecord;
  }
}

export const invoiceService = new InvoiceService();
