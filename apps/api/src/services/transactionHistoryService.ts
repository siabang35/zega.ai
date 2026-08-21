/**
 * ZEGA AI — Transaction History Service
 *
 * Persists & queries transaction states in Supabase `transactions`:
 *   - CRUD operations for the transaction state machine
 *   - Pagination, status filtering, asset filtering
 *   - Audit trail logging
 */

import { SupabaseService } from './supabaseService.js';
import { logger } from '../utils/logger.js';

export type TransactionStatus =
  | 'CREATED'
  | 'VALIDATING'
  | 'BUILDING'
  | 'AWAITING_SIGNATURE'
  | 'SIGNED'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface TransactionRecord {
  id: string;
  userId: string;
  privyUserId?: string;
  walletId?: string;
  walletAddress: string;
  type: string;
  chain: string;
  network: string;
  asset: string;
  tokenMint?: string | null;
  amount: string;
  amountBaseUnits: string;
  sender: string;
  recipient: string;
  status: TransactionStatus;
  blockhash?: string | null;
  lastValidBlockHeight?: number | null;
  signature?: string | null;
  fee?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  confirmedAt?: string | null;
  failedAt?: string | null;
}

export interface TransactionQueryParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  asset?: string;
  type?: string;
}

export interface PaginatedTransactions {
  transactions: TransactionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function createTransactionRecord(record: TransactionRecord): Promise<TransactionRecord> {
  const supabase = SupabaseService.getClient();
  if (!supabase) {
    logger.warn('[TxHistoryService] Supabase client unavailable — skipping DB insert.');
    return record;
  }

  try {
    await supabase.from('transactions').insert({
      id: record.id,
      user_id: record.userId,
      privy_user_id: record.privyUserId || null,
      wallet_id: record.walletId || null,
      wallet_address: record.walletAddress,
      type: record.type,
      chain: record.chain || 'solana',
      network: record.network || 'devnet',
      asset: record.asset,
      token_mint: record.tokenMint || null,
      amount: record.amount,
      amount_base_units: record.amountBaseUnits,
      sender: record.sender,
      recipient: record.recipient,
      status: record.status,
      blockhash: record.blockhash || null,
      last_valid_block_height: record.lastValidBlockHeight || null,
      signature: record.signature || null,
      fee: record.fee || null,
      error_code: record.errorCode || null,
      error_message: record.errorMessage || null,
      idempotency_key: record.idempotencyKey || null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      submitted_at: record.submittedAt || null,
      confirmed_at: record.confirmedAt || null,
      failed_at: record.failedAt || null,
    });
  } catch (err: any) {
    logger.error({ err: err.message, txId: record.id }, '[TxHistoryService] Failed to insert transaction record.');
  }

  return record;
}

export async function updateTransactionStatus(
  txId: string,
  status: TransactionStatus,
  updates: Partial<TransactionRecord> = {}
): Promise<void> {
  const supabase = SupabaseService.getClient();
  if (!supabase) return;

  const nowIso = new Date().toISOString();
  const payload: any = {
    status,
    updated_at: nowIso,
    ...updates,
  };

  if (status === 'SUBMITTED') payload.submitted_at = nowIso;
  if (status === 'CONFIRMED') payload.confirmed_at = nowIso;
  if (status === 'FAILED' || status === 'REJECTED') payload.failed_at = nowIso;

  if (updates.signature) payload.signature = updates.signature;
  if (updates.errorCode) payload.error_code = updates.errorCode;
  if (updates.errorMessage) payload.error_message = updates.errorMessage;

  try {
    await supabase
      .from('transactions')
      .update(payload)
      .eq('id', txId);
  } catch (err: any) {
    logger.error({ err: err.message, txId, status }, '[TxHistoryService] Failed to update transaction status.');
  }
}

export async function getTransactionById(txId: string, userId?: string): Promise<TransactionRecord | null> {
  const supabase = SupabaseService.getClient();
  if (!supabase) return null;

  try {
    let query = supabase.from('transactions').select('*').eq('id', txId);
    if (userId) query = query.eq('user_id', userId);

    const { data } = await query.maybeSingle();
    return data ? mapDbRowToRecord(data) : null;
  } catch {
    return null;
  }
}

// SECURITY (S-24 FIX): Added userId parameter for IDOR protection
export async function getTransactionBySignature(signature: string, userId?: string): Promise<TransactionRecord | null> {
  const supabase = SupabaseService.getClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('signature', signature);
    // SECURITY: Scope to authenticated user when userId is provided
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query.maybeSingle();
    return data ? mapDbRowToRecord(data) : null;
  } catch {
    return null;
  }
}

export async function listTransactions(params: TransactionQueryParams): Promise<PaginatedTransactions> {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);
  const offset = (page - 1) * limit;

  const supabase = SupabaseService.getClient();
  if (!supabase) {
    return { transactions: [], total: 0, page, limit, totalPages: 0 };
  }

  try {
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.asset) query = query.eq('asset', params.asset);
    if (params.type) query = query.eq('type', params.type);

    query = query.range(offset, offset + limit - 1);

    const { data, count } = await query;
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      transactions: (data || []).map(mapDbRowToRecord),
      total,
      page,
      limit,
      totalPages,
    };
  } catch (err: any) {
    logger.error({ err: err.message, userId: params.userId }, '[TxHistoryService] Failed to list transactions.');
    return { transactions: [], total: 0, page, limit, totalPages: 0 };
  }
}

function mapDbRowToRecord(row: any): TransactionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    privyUserId: row.privy_user_id,
    walletId: row.wallet_id,
    walletAddress: row.wallet_address,
    type: row.type,
    chain: row.chain,
    network: row.network,
    asset: row.asset,
    tokenMint: row.token_mint,
    amount: row.amount,
    amountBaseUnits: row.amount_base_units,
    sender: row.sender,
    recipient: row.recipient,
    status: row.status,
    blockhash: row.blockhash,
    lastValidBlockHeight: row.last_valid_block_height,
    signature: row.signature,
    fee: row.fee,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    confirmedAt: row.confirmed_at,
    failedAt: row.failed_at,
  };
}

export const TransactionHistoryService = {
  createTransactionRecord,
  updateTransactionStatus,
  getTransactionById,
  getTransactionBySignature,
  listTransactions,
  getUserTransactions: async (userId: string, limit = 20) => (await listTransactions({ userId, limit })).transactions,
};

export const transactionHistoryService = TransactionHistoryService;
