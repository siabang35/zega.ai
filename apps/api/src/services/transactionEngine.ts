/**
 * ZEGA AI — Transaction Engine
 *
 * Central transaction orchestrator & state machine execution pipeline:
 *
 *   CREATED ──► VALIDATING ──► BUILDING ──► AWAITING_SIGNATURE
 *                                                    │
 *   CONFIRMED ◄── CONFIRMING ◄── SUBMITTED ◄── SIGNED
 *       │
 *   FAILED / REJECTED / EXPIRED / CANCELLED (Terminal)
 *
 * SECURITY INVARIANTS:
 *   - 100% Privy-managed wallet signing via `PrivyService.signTransactionViaPrivy`
 *   - NO local keypairs or private key access
 *   - Idempotency & concurrency lock enforcement
 */

import { createHash, randomBytes } from 'crypto';
import { WalletService } from './walletService.js';
import { BalanceService } from './balanceService.js';
import { SolanaTransactionService, type BuildTxOptions } from './solanaTransactionService.js';
import { PrivyService } from './privyService.js';
import { TransactionHistoryService, type TransactionRecord, type TransactionStatus } from './transactionHistoryService.js';
import { IdempotencyService } from './idempotencyService.js';
import { solanaRpcManager } from './solanaRpcManager.js';
import { logger } from '../utils/logger.js';
import { envConfig } from '../config/env.js';

export interface ExecuteTransactionRequest {
  userId: string;
  recipient: string;
  amount: string;
  asset?: 'SOL' | 'USDC' | 'SPL';
  mint?: string;
  idempotencyKey?: string;
}

export const TransactionEngineErrors = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_INPUT: 'INVALID_INPUT',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  BUILD_FAILED: 'BUILD_FAILED',
  SIGNING_FAILED: 'SIGNING_FAILED',
  SUBMISSION_FAILED: 'SUBMISSION_FAILED',
  CONFIRMATION_TIMEOUT: 'CONFIRMATION_TIMEOUT',
  CONCURRENCY_LOCK: 'CONCURRENCY_LOCK',
} as const;

// In-memory concurrency locks to prevent double-execution per user
const activeTransactionLocks = new Set<string>();

/**
 * Execute a transaction end-to-end through the state machine.
 */
export async function executeTransaction(req: ExecuteTransactionRequest): Promise<TransactionRecord> {
  const { userId, recipient, amount, asset = 'SOL', mint, idempotencyKey } = req;

  if (!userId) {
    throw Object.assign(new Error('User ID is required.'), { code: TransactionEngineErrors.UNAUTHENTICATED });
  }

  const payloadHash = IdempotencyService.hashPayload({ userId, recipient, amount, asset, mint });

  // 1. Idempotency Check
  if (idempotencyKey) {
    const existing = await IdempotencyService.checkIdempotency(idempotencyKey, payloadHash);
    if (existing && existing.responseBody) {
      logger.info({ userId, idempotencyKey }, '[TxEngine] Returning existing idempotent response.');
      return existing.responseBody as TransactionRecord;
    }
  }

  // 2. Concurrency Lock Check
  if (activeTransactionLocks.has(userId)) {
    throw Object.assign(
      new Error('A transaction is already in progress for this user. Please wait for completion.'),
      { code: TransactionEngineErrors.CONCURRENCY_LOCK }
    );
  }

  activeTransactionLocks.add(userId);

  const txId = `tx_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const nowIso = new Date().toISOString();

  let txRecord: TransactionRecord = {
    id: txId,
    userId,
    walletAddress: '',
    type: asset === 'SOL' ? 'SOL_TRANSFER' : 'SPL_TRANSFER',
    chain: 'solana',
    network: envConfig.SOLANA_NETWORK || 'devnet',
    asset,
    tokenMint: mint || null,
    amount,
    amountBaseUnits: '0',
    sender: '',
    recipient,
    status: 'CREATED',
    idempotencyKey: idempotencyKey || null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    // ─── STATE: VALIDATING ─────────────────────────────────────────────────
    await updateStatus(txRecord, 'VALIDATING');

    const wallet = await WalletService.ensureUserWallet(userId);
    txRecord.walletAddress = wallet.walletAddress;
    txRecord.privyUserId = wallet.privyUserId;
    txRecord.walletId = wallet.walletId;
    txRecord.sender = wallet.walletAddress;

    // Check fee sufficiency
    const feeEst = await SolanaTransactionService.estimateFees(
      wallet.walletAddress,
      recipient,
      amount,
      asset,
      mint
    );

    if (!feeEst.sufficient) {
      throw Object.assign(
        new Error(`Insufficient balance. Required: ${feeEst.totalRequiredSol} SOL, Available: ${feeEst.availableSol} SOL.`),
        { code: TransactionEngineErrors.INSUFFICIENT_FUNDS }
      );
    }

    // ─── STATE: BUILDING ───────────────────────────────────────────────────
    await updateStatus(txRecord, 'BUILDING');

    const buildOptions: BuildTxOptions = {
      sender: wallet.walletAddress,
      recipient,
      amount,
      asset,
      mint,
    };

    const built = await SolanaTransactionService.buildTransactionData(buildOptions);
    txRecord.amountBaseUnits = built.amountBaseUnits.toString();
    txRecord.blockhash = built.blockhash;
    txRecord.lastValidBlockHeight = built.lastValidBlockHeight;

    // ─── STATE: AWAITING_SIGNATURE & SIGNED ────────────────────────────────
    await updateStatus(txRecord, 'AWAITING_SIGNATURE');

    logger.info({ txId, walletAddress: wallet.walletAddress }, '[TxEngine] Sending transaction to Privy for enklave signing...');
    const signResult = await PrivyService.signTransactionViaPrivy(
      wallet.walletId || '',
      wallet.walletAddress,
      built.transaction,
      idempotencyKey
    );

    await updateStatus(txRecord, 'SIGNED');

    // ─── STATE: SUBMITTED ──────────────────────────────────────────────────
    logger.info({ txId }, '[TxEngine] Submitting signed transaction to Solana RPC Pool...');

    const signature = await solanaRpcManager.callRpc<string>(
      'sendTransaction',
      [
        signResult.signedTxBase64,
        {
          encoding: 'base64',
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        },
      ],
      { skipCache: true }
    );

    if (!signature || typeof signature !== 'string') {
      throw Object.assign(new Error('Solana RPC did not return a signature.'), {
        code: TransactionEngineErrors.SUBMISSION_FAILED,
      });
    }

    txRecord.signature = signature;
    await updateStatus(txRecord, 'SUBMITTED', { signature });

    // ─── STATE: CONFIRMING ─────────────────────────────────────────────────
    await updateStatus(txRecord, 'CONFIRMING');

    const confirmed = await pollTransactionConfirmation(signature, 30000);
    if (!confirmed) {
      throw Object.assign(new Error('Transaction confirmation timed out on Solana network.'), {
        code: TransactionEngineErrors.CONFIRMATION_TIMEOUT,
      });
    }

    // ─── STATE: CONFIRMED ──────────────────────────────────────────────────
    await updateStatus(txRecord, 'CONFIRMED');
    logger.info({ txId, signature }, '✅ [TxEngine] Transaction successfully confirmed on-chain!');

    if (idempotencyKey) {
      await IdempotencyService.saveIdempotency(
        idempotencyKey,
        payloadHash,
        txRecord,
        200,
        86400,
        userId
      );
    }

    return txRecord;
  } catch (err: any) {
    const errorCode = err.code || TransactionEngineErrors.BUILD_FAILED;
    const errorMessage = err.message || 'Transaction execution failed.';

    logger.error({ err: errorMessage, code: errorCode, txId }, '❌ [TxEngine] Transaction execution failed.');

    txRecord.errorCode = errorCode;
    txRecord.errorMessage = errorMessage;
    await updateStatus(txRecord, 'FAILED', { errorCode, errorMessage });

    throw err;
  } finally {
    activeTransactionLocks.delete(userId);
  }
}

/**
 * Updates status in memory and syncs with DB.
 */
async function updateStatus(
  record: TransactionRecord,
  status: TransactionStatus,
  extra: Partial<TransactionRecord> = {}
): Promise<void> {
  record.status = status;
  record.updatedAt = new Date().toISOString();
  Object.assign(record, extra);

  if (status === 'CREATED') {
    await TransactionHistoryService.createTransactionRecord(record);
  } else {
    await TransactionHistoryService.updateTransactionStatus(record.id, status, extra);
  }
}

/**
 * Polls Solana RPC for signature confirmation status.
 */
async function pollTransactionConfirmation(signature: string, timeoutMs = 30000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await solanaRpcManager.callRpc<any>(
        'getSignatureStatuses',
        [[signature], { searchTransactionHistory: true }],
        { skipCache: true }
      );

      const status = res?.value?.[0];
      if (status) {
        if (status.err) {
          logger.error({ err: status.err, signature }, '[TxEngine] On-chain transaction execution error.');
          return false;
        }

        if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
          return true;
        }
      }
    } catch (err: any) {
      logger.warn({ err: err.message, signature }, '[TxEngine] Error polling signature status.');
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}

export const TransactionEngine = {
  executeTransaction,
};
