import { supabaseService } from './supabaseService.js';
import { invoiceService } from './InvoiceService.js';
import { ledgerService } from './LedgerService.js';
import { solanaTransactionService, SolanaTransactionService } from './solanaTransactionService.js';
import { privyWalletService } from './PrivyWalletService.js';

export interface PaymentVerificationParams {
  signature: string;
  invoiceId?: string;
}

export interface PaymentRecord {
  id: string;
  invoice_id?: string;
  user_id: string;
  signature: string;
  sender: string;
  recipient: string;
  asset: string;
  token_mint?: string;
  amount: string;
  amount_base_units: string;
  status: string;
  block_slot?: number;
  block_time?: string;
  confirmation_status: string;
  created_at: string;
  confirmed_at: string;
}

export class PaymentDetectionService {
  /**
   * Verify and process a blockchain payment transaction.
   */
  public async verifyAndProcessPayment(params: PaymentVerificationParams): Promise<PaymentRecord> {
    const { signature, invoiceId } = params;
    const supabase = supabaseService.getClient();

    // 1. Check if signature was already processed in DB
    if (supabase) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('signature', signature)
        .maybeSingle();

      if (existingPayment) {
        return existingPayment as PaymentRecord;
      }
    }

    // 2. Query Solana blockchain via RPC for transaction details
    const parsedTx = await solanaTransactionService.parseAndVerifyTransaction(signature);
    if (!parsedTx || !parsedTx.verified) {
      throw new Error(`Transaction ${signature} could not be verified on Solana RPC.`);
    }

    const sender = parsedTx.sender || 'Unknown';
    const recipient = parsedTx.recipient || 'Unknown';
    const amount = parsedTx.amount || '0';
    const asset = parsedTx.asset || 'SOL';
    const tokenMint = (parsedTx as any).tokenMint || undefined;
    const slot = parsedTx.slot || 0;
    const blockTime = parsedTx.blockTime || Math.floor(Date.now() / 1000);

    // 3. Resolve recipient wallet in local database
    const walletRecord = await privyWalletService.getWalletByAddress(recipient);
    // SECURITY (S-03 FIX): Fail-closed when recipient wallet is unknown.
    // Never credit payments to a default/phantom user.
    if (!walletRecord) {
      throw new Error('PAYMENT_RECIPIENT_UNKNOWN: Recipient wallet address is not registered in ZEGA. Payment cannot be credited.');
    }
    const userId = walletRecord.user_id;
    const walletId = walletRecord.id;
    const baseUnits = SolanaTransactionService.safeConvertToBaseUnits(amount, asset);

    // 4. Match invoice (check status and expiration)
    // SECURITY (S-08 FIX): Deterministic invoice matching.
    // If invoiceId is provided, use it directly. Do NOT fuzzy-match by asset+amount.
    let invoice = invoiceId ? await invoiceService.getInvoice(invoiceId) : null;
    if (invoice && invoice.status !== 'PENDING' && invoice.status !== 'PARTIALLY_PAID') {
      // Invoice is not in a payable state — reject matching
      invoice = null;
    }

    const isExpired = invoice && new Date(invoice.expires_at).getTime() < Date.now();

    const fallbackRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      invoice_id: invoice?.id || undefined,
      user_id: userId,
      signature,
      sender,
      recipient,
      asset,
      token_mint: tokenMint,
      amount,
      amount_base_units: baseUnits.toString(),
      status: 'CONFIRMED',
      block_slot: slot,
      block_time: new Date(blockTime * 1000).toISOString(),
      confirmation_status: 'finalized',
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    };

    if (!supabase) {
      // SECURITY (S-17 FIX): Fail closed — financial operations require DB availability
      throw new Error('PAYMENT_UNAVAILABLE: Database client uninitialized. Cannot process payment.');
    }

    // 5. ATOMIC PAYMENT SETTLEMENT (Payment Insert + Invoice Status + Ledger Credit in 1 DB Transaction)
    const { data: settledPayment, error: settleError } = await supabase.rpc('settle_payment_atomic', {
      p_invoice_id: invoice?.id || null,
      p_user_id: userId,
      p_wallet_id: walletId,
      p_signature: signature,
      p_sender: sender,
      p_recipient: recipient,
      p_asset: asset,
      p_token_mint: tokenMint || null,
      p_amount: parseFloat(amount),
      p_amount_base_units: baseUnits.toString(),
      p_slot: slot,
      p_block_time: new Date(blockTime * 1000).toISOString(),
    });

    if (settleError) {
      if (settleError.code === '23505') {
        const raceCheck = await supabase.from('payments').select('*').eq('signature', signature).single();
        return raceCheck.data as PaymentRecord;
      }
      throw new Error(`Atomic payment settlement failed: ${settleError.message}`);
    }

    // Record ledger credit with tenant scoping
    await ledgerService.recordCredit({
      userId,
      walletId,
      organizationId: (walletRecord as any).organization_id || '',
      type: 'PAYMENT',
      asset,
      tokenMint,
      amount,
      referenceType: 'PAYMENT',
      referenceId: (settledPayment as PaymentRecord)?.id || fallbackRecord.id,
    });

    // Update invoice status if applicable
    if (invoice) {
      if (isExpired) {
        await invoiceService.updateInvoiceStatus(invoice.id, 'EXPIRED', signature);
      } else {
        const totalPaid = (parseFloat(invoice.paid_amount || '0') + parseFloat(amount)).toString();
        const isFull = parseFloat(totalPaid) >= parseFloat(invoice.amount);
        const newStatus = isFull ? 'PAID' : 'PARTIALLY_PAID';
        await invoiceService.updateInvoiceStatus(invoice.id, newStatus as any, signature, totalPaid);
      }
    }

    return (settledPayment as PaymentRecord) || fallbackRecord;
  }
}

export const paymentDetectionService = new PaymentDetectionService();

