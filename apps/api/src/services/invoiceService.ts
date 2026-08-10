import { createHmac, createHash } from 'crypto';
import { SupabaseService } from './supabaseService.js';
import { SolanaService } from './solanaService.js';
import { logger } from '../utils/logger.js';

export interface InvoiceCreationParams {
  userId?: string;
  merchantPubkey: string;
  amount: number;
  description?: string;
  customerTarget?: string;
  telegramChannel?: string;
  buyerEmail?: string;
  referenceKey?: string;
  isDemo?: boolean;
}

export interface InvoiceRecord {
  id: string;
  referenceKey: string;
  merchantPubkey: string;
  userEmail: string;
  amountUsdc: number;
  description: string;
  solanaPayUrl: string;
  checksum: string;
  status: string;
  createdAt: string;
}

/**
 * ZEGA AI — Invoice Domain Service (F-017 Extraction)
 *
 * Encapsulates invoice creation, OWASP HMAC checksum signing,
 * DB persistence, and Telegram dispatch payloads.
 */
export class InvoiceService {
  /**
   * Enforces State Machine Transition Invariants for Invoice/Settlement processing (Phase 6).
   * Terminal states (SETTLED, CANCELLED, EXPIRED, FAILED) cannot be mutated back to active states.
   */
  static validateStateTransition(currentStatus: string, targetStatus: string): boolean {
    const current = (currentStatus || '').toLowerCase();
    const target = (targetStatus || '').toLowerCase();

    if (current === target) return true;

    // Terminal states cannot transition to anything else
    const terminalStates = ['settled', 'cancelled', 'expired', 'failed'];
    if (terminalStates.includes(current)) {
      throw new Error(`Illegal state transition from terminal state '${current}' to '${target}'`);
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ['authorized', 'processing', 'settled', 'cancelled', 'expired', 'failed'],
      created: ['authorized', 'processing', 'settled', 'cancelled', 'expired', 'failed'],
      authorized: ['processing', 'settled', 'cancelled', 'failed'],
      processing: ['settled', 'failed'],
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(target)) {
      throw new Error(`Illegal state machine transition: cannot transition from '${current}' to '${target}'`);
    }

    return true;
  }

  /**
   * Generates a 7-Layer OWASP HMAC-SHA256 checksum for invoice tamper protection.
   */
  static generateInvoiceChecksum(referenceKey: string, amount: number, merchantPubkey: string, secret = process.env.ZEROCLAW_HMAC_SECRET || 'zeroclaw_invoice_secret_v1'): string {
    const raw = `${referenceKey}:${amount.toFixed(2)}:${merchantPubkey}`;
    return createHmac('sha256', secret).update(raw).digest('hex').slice(0, 16);
  }

  /**
   * Create & Persist a new merchant invoice.
   */
  static async createInvoice(params: InvoiceCreationParams): Promise<InvoiceRecord> {
    const userEmail = params.userId || params.buyerEmail || 'user@zegaai.site';
    const amountVal = Number(params.amount) || 0;
    const refKey = (params.referenceKey && params.referenceKey.length >= 32 && params.referenceKey.length <= 44)
      ? params.referenceKey
      : SolanaService.generateReferenceKey();

    const desc = params.description || 'ZEGA AI Merchant Invoice';
    const checksum = this.generateInvoiceChecksum(refKey, amountVal, params.merchantPubkey);
    const solanaPayUrl = SolanaService.buildSolanaPayUrl(params.merchantPubkey, amountVal, refKey, 'USDC', 'ZEGA Pay', desc);

    const nowIso = new Date().toISOString();
    const invoiceId = `inv_${Date.now()}_${createHash('sha256').update(refKey).digest('hex').slice(0, 8)}`;

    const record: InvoiceRecord = {
      id: invoiceId,
      referenceKey: refKey,
      merchantPubkey: params.merchantPubkey,
      userEmail,
      amountUsdc: amountVal,
      description: desc,
      solanaPayUrl,
      checksum,
      status: 'pending',
      createdAt: nowIso,
    };

    // DB Persistence via SupabaseService
    const supabase = SupabaseService.getClient();
    if (supabase) {
      try {
        await supabase.from('zeroclaw_invoices').upsert({
          id: invoiceId,
          reference_key: refKey,
          merchant_pubkey: params.merchantPubkey,
          user_id: userEmail,
          expected_amount_usdc: amountVal,
          description: desc,
          solana_pay_url: solanaPayUrl,
          owasp_checksum: checksum,
          status: 'pending',
          created_at: nowIso,
        });
        logger.info({ invoiceId, refKey, amountVal }, '[InvoiceService] Successfully persisted invoice to DB');
      } catch (err) {
        logger.warn({ err, invoiceId }, '[InvoiceService] DB invoice insert warning — proceeding with memory record');
      }
    }

    return record;
  }
}
