/**
 * ZEGA AI — Solana Transaction Service
 *
 * Core Solana transaction builder & RPC operator:
 *   - Builds SOL transfers (`SystemProgram.transfer`)
 *   - Builds SPL transfers (`createTransferInstruction`) with automated ATA creation
 *   - Fetches fresh blockhashes & estimates fees
 *   - Previews transactions with net fee / rent breakdowns
 *   - Converts human amounts to base units using BigInt (no floating-point loss)
 */

import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getMint,
} from '@solana/spl-token';
import { createHash } from 'crypto';
import { solanaRpcManager } from './solanaRpcManager.js';
import { logger } from '../utils/logger.js';
import { envConfig } from '../config/env.js';

export interface FeeEstimateResult {
  networkFeeLamports: number;
  networkFeeSol: number;
  rentExemptLamports: number;
  rentExemptSol: number;
  totalRequiredLamports: number;
  totalRequiredSol: number;
  availableLamports: number;
  availableSol: number;
  sufficient: boolean;
  requiresAtaCreation: boolean;
}

export interface TransactionPreviewResult {
  type: 'SOL_TRANSFER' | 'SPL_TRANSFER';
  sender: string;
  recipient: string;
  amount: string;
  amountBaseUnits: string;
  asset: string;
  tokenMint?: string;
  decimals: number;
  estimatedFee: FeeEstimateResult;
  network: string;
}

export interface BuildTxOptions {
  sender: string;
  recipient: string;
  amount: string;          // Human string, e.g. "1.5"
  asset: 'SOL' | 'USDC' | 'SPL';
  mint?: string;           // Mint address if SPL
  decimals?: number;       // Custom decimals if known
}

export interface BuiltTransactionData {
  transaction: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
  amountBaseUnits: bigint;
  senderPubkey: PublicKey;
  recipientPubkey: PublicKey;
  mintPubkey?: PublicKey;
  decimals: number;
  requiresAtaCreation: boolean;
}

const DEFAULT_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MIN_RENT_LAMPORTS = 890880;
const ESTIMATED_TX_FEE = 5000;

/**
 * Safely converts decimal string to BigInt base units.
 */
export function safeConvertToBaseUnits(amountStr: string, assetOrDecimals: string | number = 9): bigint {
  let decimals = 9;
  if (typeof assetOrDecimals === 'number') {
    decimals = assetOrDecimals;
  } else if (assetOrDecimals === 'USDC') {
    decimals = 6;
  } else if (assetOrDecimals === 'SOL') {
    decimals = 9;
  }

  if (!amountStr || typeof amountStr !== 'string') {
    throw new Error('Amount string is required.');
  }

  const trimmed = amountStr.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid numeric amount: "${trimmed}"`);
  }

  const [intPart, decPart = ''] = trimmed.split('.');

  if (decPart.length > decimals) {
    throw new Error(`Amount exceeds maximum decimal precision of ${decimals} places.`);
  }

  const paddedDec = decPart.padEnd(decimals, '0');
  const fullStr = intPart + paddedDec;
  const cleaned = fullStr.replace(/^0+/, '') || '0';

  return BigInt(cleaned);
}

/**
 * Validates a base58 Solana public key.
 */
export function validatePublicKey(address: string, label = 'Address'): PublicKey {
  if (!address || typeof address !== 'string') {
    throw new Error(`${label} is required.`);
  }
  const cleaned = address.trim();
  const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!BASE58_REGEX.test(cleaned)) {
    throw new Error(`${label} "${cleaned}" is not a valid Solana Base58 public key.`);
  }
  try {
    return new PublicKey(cleaned);
  } catch {
    throw new Error(`${label} "${cleaned}" is invalid.`);
  }
}

/**
 * Get latest blockhash from Solana RPC pool.
 */
export async function getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  const result = await solanaRpcManager.callRpc<any>(
    'getLatestBlockhash',
    [{ commitment: 'confirmed' }],
    { skipCache: true }
  );

  const blockhash = result?.value?.blockhash || result?.blockhash;
  const lastValidBlockHeight = result?.value?.lastValidBlockHeight || result?.lastValidBlockHeight || 0;

  if (!blockhash || typeof blockhash !== 'string') {
    throw new Error('Failed to retrieve recent blockhash from Solana RPC.');
  }

  return { blockhash, lastValidBlockHeight };
}

/**
 * Build an unsigned Solana Transaction object for SOL or SPL token transfers.
 */
export async function buildTransactionData(options: BuildTxOptions): Promise<BuiltTransactionData> {
  const senderPubkey = validatePublicKey(options.sender, 'Sender address');
  const recipientPubkey = validatePublicKey(options.recipient, 'Recipient address');

  if (senderPubkey.equals(recipientPubkey)) {
    throw new Error('Self-transfer is not permitted.');
  }

  const isSol = options.asset === 'SOL';
  let mintPubkey: PublicKey | undefined;
  let decimals = 9;
  let requiresAtaCreation = false;

  if (!isSol) {
    const mintStr = options.mint || DEFAULT_USDC_MINT;
    mintPubkey = validatePublicKey(mintStr, 'Token mint');
    decimals = options.decimals ?? 6;
  }

  const amountBaseUnits = safeConvertToBaseUnits(options.amount, decimals);
  if (amountBaseUnits <= 0n) {
    throw new Error('Transfer amount must be greater than zero.');
  }

  const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();

  const transaction = new Transaction();
  transaction.feePayer = senderPubkey;
  transaction.recentBlockhash = blockhash;

  if (isSol) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderPubkey,
        toPubkey: recipientPubkey,
        lamports: amountBaseUnits,
      })
    );
  } else {
    const sourceAta = getAssociatedTokenAddressSync(mintPubkey!, senderPubkey);
    const destAta = getAssociatedTokenAddressSync(mintPubkey!, recipientPubkey);

    let destAtaExists = false;
    try {
      const acctInfo = await solanaRpcManager.callRpc<any>(
        'getAccountInfo',
        [destAta.toBase58(), { encoding: 'jsonParsed' }]
      );
      destAtaExists = !!(acctInfo?.value);
    } catch {
      destAtaExists = false;
    }

    if (!destAtaExists) {
      requiresAtaCreation = true;
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderPubkey,
          destAta,
          recipientPubkey,
          mintPubkey!
        )
      );
    }

    transaction.add(
      createTransferInstruction(
        sourceAta,
        destAta,
        senderPubkey,
        amountBaseUnits
      )
    );
  }

  return {
    transaction,
    blockhash,
    lastValidBlockHeight,
    amountBaseUnits,
    senderPubkey,
    recipientPubkey,
    mintPubkey,
    decimals,
    requiresAtaCreation,
  };
}

/**
 * Estimate fees and verify balance sufficiency.
 */
export async function estimateFees(
  sender: string,
  recipient: string,
  amount: string,
  asset: 'SOL' | 'USDC' | 'SPL',
  mint?: string
): Promise<FeeEstimateResult> {
  const senderPubkey = validatePublicKey(sender, 'Sender address');
  const recipientPubkey = validatePublicKey(recipient, 'Recipient address');

  const balanceResult = await solanaRpcManager.callRpc<any>(
    'getBalance',
    [senderPubkey.toBase58()],
    { skipCache: true }
  );

  const availableLamports =
    typeof balanceResult?.value === 'number'
      ? balanceResult.value
      : typeof balanceResult === 'number'
        ? balanceResult
        : 0;

  let requiresAtaCreation = false;
  let rentExemptLamports = 0;

  if (asset !== 'SOL') {
    const mintPubkey = validatePublicKey(mint || DEFAULT_USDC_MINT, 'Token mint');
    const destAta = getAssociatedTokenAddressSync(mintPubkey, recipientPubkey);

    try {
      const acctInfo = await solanaRpcManager.callRpc<any>(
        'getAccountInfo',
        [destAta.toBase58(), { encoding: 'jsonParsed' }]
      );
      if (!acctInfo?.value) {
        requiresAtaCreation = true;
        rentExemptLamports = MIN_RENT_LAMPORTS;
      }
    } catch {
      requiresAtaCreation = true;
      rentExemptLamports = MIN_RENT_LAMPORTS;
    }
  }

  const networkFeeLamports = ESTIMATED_TX_FEE;
  const totalRequiredLamports =
    asset === 'SOL'
      ? Number(safeConvertToBaseUnits(amount, 9)) + networkFeeLamports + MIN_RENT_LAMPORTS
      : networkFeeLamports + rentExemptLamports + MIN_RENT_LAMPORTS;

  const sufficient = availableLamports >= totalRequiredLamports;

  return {
    networkFeeLamports,
    networkFeeSol: networkFeeLamports / LAMPORTS_PER_SOL,
    rentExemptLamports,
    rentExemptSol: rentExemptLamports / LAMPORTS_PER_SOL,
    totalRequiredLamports,
    totalRequiredSol: totalRequiredLamports / LAMPORTS_PER_SOL,
    availableLamports,
    availableSol: availableLamports / LAMPORTS_PER_SOL,
    sufficient,
    requiresAtaCreation,
  };
}

/**
 * Preview transaction breakdown before signing.
 */
export async function previewTransaction(options: BuildTxOptions): Promise<TransactionPreviewResult> {
  const feeEstimate = await estimateFees(
    options.sender,
    options.recipient,
    options.amount,
    options.asset,
    options.mint
  );

  const isSol = options.asset === 'SOL';
  const decimals = isSol ? 9 : (options.decimals ?? 6);
  const amountBaseUnits = safeConvertToBaseUnits(options.amount, decimals).toString();

  return {
    type: isSol ? 'SOL_TRANSFER' : 'SPL_TRANSFER',
    sender: options.sender,
    recipient: options.recipient,
    amount: options.amount,
    amountBaseUnits,
    asset: options.asset,
    tokenMint: options.mint || (isSol ? undefined : DEFAULT_USDC_MINT),
    decimals,
    estimatedFee: feeEstimate,
    network: envConfig.SOLANA_NETWORK || 'devnet',
  };
}

/**
 * Submit signed transaction (base64 string) to Solana RPC pool.
 */
export async function submitSignedTransaction(signedTxBase64: string): Promise<string> {
  const result = await solanaRpcManager.callRpc<string>(
    'sendTransaction',
    [signedTxBase64, { encoding: 'base64', preflightCommitment: 'confirmed' }],
    { skipCache: true }
  );

  if (!result || typeof result !== 'string') {
    throw new Error('Failed to submit signed transaction to Solana RPC.');
  }

  return result;
}

/**
 * Confirm transaction signature on-chain.
 */
export async function confirmTransactionSignature(signature: string, maxWaitMs = 30000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const statusRes = await solanaRpcManager.callRpc<any>('getSignatureStatuses', [[signature]]);
      const status = statusRes?.value?.[0];

      if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
        if (status.err) {
          throw new Error(`Transaction ${signature} failed on-chain: ${JSON.stringify(status.err)}`);
        }
        return true;
      }
    } catch (err: any) {
      if (err.message.includes('failed on-chain')) throw err;
    }

    await new Promise((res) => setTimeout(res, 1500));
  }

  throw new Error(`Transaction ${signature} confirmation timed out after ${maxWaitMs}ms.`);
}

/**
 * Parse and verify a transaction signature from Solana RPC.
 */
export async function parseAndVerifyTransaction(signature: string) {
  const txRes = await solanaRpcManager.callRpc<any>(
    'getTransaction',
    [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    { skipCache: true }
  );

  if (!txRes) {
    return { verified: false, error: 'Transaction not found on-chain' };
  }

  const slot = txRes.slot;
  const blockTime = txRes.blockTime;
  const meta = txRes.meta;

  if (meta?.err) {
    return { verified: false, error: 'Transaction failed on-chain' };
  }

  const transaction = txRes.transaction;
  const message = transaction?.message;
  const accountKeys = message?.accountKeys || [];

  let sender = accountKeys[0]?.pubkey || accountKeys[0] || 'Unknown';
  let recipient = accountKeys[1]?.pubkey || accountKeys[1] || 'Unknown';
  let amount = '0';
  let asset = 'SOL';

  if (meta?.preBalances && meta?.postBalances && meta.preBalances.length > 1) {
    const diffLamports = meta.postBalances[1] - meta.preBalances[1];
    if (diffLamports > 0) {
      amount = (diffLamports / LAMPORTS_PER_SOL).toString();
    }
  }

  return {
    verified: true,
    signature,
    sender,
    recipient,
    amount,
    asset,
    slot,
    blockTime,
  };
}

/**
 * Helper to estimate transaction fee.
 */
export async function estimateTransactionFee(params: { asset?: string }) {
  return {
    networkFeeSol: 0.000005,
    rentExemptSol: params.asset === 'SOL' ? 0 : 0.00203928,
    totalSol: params.asset === 'SOL' ? 0.000005 : 0.00204428,
  };
}

export interface FingerprintParams {
  feePayer: string;
  sender: string;
  recipient: string;
  amountBaseUnits: string;
  asset: 'SOL' | 'USDC' | 'SPL';
  tokenMint?: string;
}

export function computeTransactionFingerprint(params: FingerprintParams): string {
  const normalized = {
    feePayer: params.feePayer.trim(),
    sender: params.sender.trim(),
    recipient: params.recipient.trim(),
    amountBaseUnits: params.amountBaseUnits.trim(),
    asset: params.asset,
    tokenMint: (params.tokenMint || '').trim(),
  };
  return createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}

export interface VerificationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  signerPubkey?: string;
  feePayer?: string;
  fingerprint?: string;
}

export function verifySignedTransaction(
  signedTxBase64: string,
  expectedFeePayer: string,
  expectedFingerprintParams?: FingerprintParams
): VerificationResult {
  if (!signedTxBase64 || typeof signedTxBase64 !== 'string') {
    return { valid: false, errorCode: 'SIGNATURE_MISSING', errorMessage: 'Signed transaction string is missing or invalid.' };
  }

  let tx: Transaction;
  try {
    const rawBuffer = Buffer.from(signedTxBase64.trim(), 'base64');
    if (rawBuffer.length === 0) {
      return { valid: false, errorCode: 'SIGNATURE_INVALID', errorMessage: 'Signed transaction buffer is empty.' };
    }
    tx = Transaction.from(rawBuffer);
  } catch (err: any) {
    return { valid: false, errorCode: 'TRANSACTION_INVALID', errorMessage: `Failed to deserialize transaction: ${err.message}` };
  }

  if (!tx.feePayer) {
    return { valid: false, errorCode: 'FEE_PAYER_MISSING', errorMessage: 'Transaction is missing a fee payer.' };
  }

  const feePayerStr = tx.feePayer.toBase58();
  if (feePayerStr !== expectedFeePayer.trim()) {
    return { valid: false, errorCode: 'SIGNER_MISMATCH', errorMessage: `Fee payer "${feePayerStr}" does not match expected server wallet "${expectedFeePayer}".` };
  }

  let isSigValid = false;
  try {
    isSigValid = tx.verifySignatures();
  } catch {
    isSigValid = false;
  }

  if (!isSigValid) {
    return { valid: false, errorCode: 'SIGNATURE_INVALID', errorMessage: 'Cryptographic Ed25519 signature verification failed.' };
  }

  let extractedAmountBaseUnits: string | null = null;
  for (const ix of tx.instructions) {
    if (ix.programId.equals(SystemProgram.programId)) {
      if (ix.data.length >= 12 && ix.data.readUInt32LE(0) === 2) {
        const lamports = ix.data.readBigUInt64LE(4);
        extractedAmountBaseUnits = lamports.toString();
        break;
      }
    } else if (ix.programId.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      if (ix.data.length >= 9 && ix.data[0] === 3) {
        const rawAmount = ix.data.readBigUInt64LE(1);
        extractedAmountBaseUnits = rawAmount.toString();
        break;
      }
    }
  }

  if (expectedFingerprintParams) {
    const expectedFingerprint = computeTransactionFingerprint(expectedFingerprintParams);
    const actualFingerprint = computeTransactionFingerprint({
      feePayer: feePayerStr,
      sender: expectedFingerprintParams.sender,
      recipient: expectedFingerprintParams.recipient,
      amountBaseUnits: extractedAmountBaseUnits || expectedFingerprintParams.amountBaseUnits,
      asset: expectedFingerprintParams.asset,
      tokenMint: expectedFingerprintParams.tokenMint,
    });

    if (extractedAmountBaseUnits && extractedAmountBaseUnits !== expectedFingerprintParams.amountBaseUnits) {
      return { valid: false, errorCode: 'WITHDRAWAL_INTENT_MISMATCH', errorMessage: 'Transaction instruction amount mismatches prepared server intent.' };
    }

    if (expectedFingerprint !== actualFingerprint) {
      return { valid: false, errorCode: 'WITHDRAWAL_INTENT_MISMATCH', errorMessage: 'Transaction parameters or instructions mismatch prepared server intent.' };
    }
  }

  return {
    valid: true,
    signerPubkey: feePayerStr,
    feePayer: feePayerStr,
  };
}

export const SolanaTransactionService = {
  safeConvertToBaseUnits,
  validatePublicKey,
  getLatestBlockhash,
  buildTransactionData,
  estimateFees,
  previewTransaction,
  submitSignedTransaction,
  confirmTransactionSignature,
  parseAndVerifyTransaction,
  estimateTransactionFee,
  computeTransactionFingerprint,
  verifySignedTransaction,
};

export const solanaTransactionService = SolanaTransactionService;


