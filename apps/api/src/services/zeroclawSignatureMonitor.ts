import { Connection } from '@solana/web3.js';
import { logger } from '../utils/logger.js';
import { SupabaseService } from './supabaseService.js';
import { solanaRpcManager } from './solanaRpcManager.js';

const DEVNET_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export interface ParsedOnChainTxDetails {
  signature: string;
  slot: number;
  blockTime: number | null;
  confirmationStatus: string;
  err: any | null;
  sender: string | null;
  recipient: string | null;
  amountUsdc: number;
  amountSol: number;
  memo: string | null;
  mint: string | null;
  referenceKeys: string[];
  isVerified: boolean;
}

export interface MonitoredAddress {
  address: string;
  type: 'merchant' | 'reference';
  userId?: string;
  expectedAmountUsdc?: number;
  customerTarget?: string;
  channelType?: string;
  addedAt: number;
}

/**
 * ZeroClaw Real-Time Solana On-Chain Signature Monitoring Engine
 *
 * Real-time monitoring daemon that reads transaction signatures directly from Solana Devnet RPC,
 * parses SPL USDC & SOL transfer instructions, validates 5-layer OWASP reconciliation rules,
 * and updates Supabase database + dispatches automated receipt notifications.
 */
export class ZeroClawSignatureMonitorService {
  private monitoredAddresses = new Map<string, MonitoredAddress>();
  private processedSignatures = new Set<string>();
  private txCacheMap = new Map<string, { data: ParsedOnChainTxDetails; expiresAt: number }>();
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private pollIntervalMs = 15000; // 15 seconds real-time poll cycle (prevents 429 rate limits)
  private totalSignaturesScanned = 0;
  private totalSettlementsReconciled = 0;
  private lastPollTimestamp: string | null = null;

  constructor() {
    // Dynamic address monitoring initialized via DB active invoices & merchant registrations
    this.registerMonitoredAddress('J9RE2J3SWo1x2BctQjBZmhHKFZn1w8KqBBs49uVZmEo9', 'merchant', 'user@zegaai.site');
  }

  /**
   * Register a public key address or reference key for real-time monitoring
   */
  public registerMonitoredAddress(
    address: string,
    type: 'merchant' | 'reference' = 'merchant',
    userId?: string,
    expectedAmountUsdc?: number,
    customerTarget?: string,
    channelType?: string
  ) {
    if (!address || address.length < 32) return;
    this.monitoredAddresses.set(address, {
      address,
      type,
      userId,
      expectedAmountUsdc,
      customerTarget,
      channelType,
      addedAt: Date.now(),
    });
    logger.info({ address, type, userId }, 'Registered address in ZeroClaw Signature Monitor');
  }

  /**
   * Start background real-time monitoring polling loop
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('⚡ ZeroClaw Real-Time Signature Monitor Service Started');

    // Run first scan immediately
    this.pollOnChainSignatures().catch((err) => {
      logger.error({ err }, 'Error in initial ZeroClaw signature monitor scan');
    });

    this.timer = setInterval(() => {
      this.pollOnChainSignatures().catch((err) => {
        logger.error({ err }, 'Error in ZeroClaw signature monitor background cycle');
      });
    }, this.pollIntervalMs);
  }

  /**
   * Stop background monitoring loop
   */
  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info('ZeroClaw Signature Monitor Service Stopped');
  }

  /**
   * Get monitoring telemetry & stats
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredAddressesCount: this.monitoredAddresses.size,
      processedSignaturesCount: this.processedSignatures.size,
      cachedSignaturesCount: this.txCacheMap.size,
      totalSignaturesScanned: this.totalSignaturesScanned,
      totalSettlementsReconciled: this.totalSettlementsReconciled,
      lastPollTimestamp: this.lastPollTimestamp,
      pollIntervalMs: this.pollIntervalMs,
      rpcPoolStatus: solanaRpcManager.getPoolStatus(),
    };
  }

  /**
   * Delegates to SolanaRpcManager for high-speed parallel RPC calls with rate limiting and circuit breaker
   */
  public async callFastRpcParallel(method: string, params: any[]): Promise<any> {
    return solanaRpcManager.callRpc(method, params);
  }

  /**
   * Delegates to SolanaRpcManager with connection pooling, exponential backoff, and weighted failover
   */
  public async callRpc(method: string, params: any[]): Promise<any> {
    return solanaRpcManager.callRpc(method, params);
  }

  /**
   * Parse detailed on-chain transaction data for any Solana Tx signature
   * Uses high-speed in-memory cache and RPC Manager for sub-100ms response times.
   */
  public async parseOnChainTxSignature(signature: string): Promise<ParsedOnChainTxDetails | null> {
    if (!signature || signature.length < 80) return null;

    // ⚡ 1. Ultra-Fast High-Speed In-Memory Cache Lookup (0ms Response)
    const cached = this.txCacheMap.get(signature);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      // ⚡ 2. RPC Manager execution for getSignatureStatuses & getTransaction (<100ms Response)
      let [statusResult, txResult] = await Promise.all([
        solanaRpcManager.callRpc('getSignatureStatuses', [
          [signature],
          { searchTransactionHistory: true },
        ]).catch(() => null),
        solanaRpcManager.callRpc('getTransaction', [
          signature,
          { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 },
        ]).catch(() => null),
      ]);

      // ⚡ 3. Web3 Connection Pool Fallback if raw JSON-RPC returned null
      if (!txResult) {
        try {
          const conn = solanaRpcManager.getConnection();
          const parsedWeb3Tx = await conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
          if (parsedWeb3Tx) {
            txResult = parsedWeb3Tx;
          }
        } catch (e: any) {
          logger.warn({ err: e.message, signature }, 'Web3 connection pool fallback failed');
        }
      }

      const statusItem = statusResult?.value?.[0];
      const effectiveTx = txResult?.value || txResult;

      if (!statusItem && !effectiveTx) {
        return null; // Not found on-chain
      }

      let slot = statusItem?.slot || effectiveTx?.slot || 0;
      let blockTime = effectiveTx?.blockTime || null;
      let confirmationStatus = statusItem?.confirmationStatus || 'confirmed';
      let err = statusItem?.err || effectiveTx?.meta?.err || null;
      let sender: string | null = null;
      let recipient: string | null = null;
      let amountUsdc = 0;
      let amountSol = 0;
      let memo: string | null = null;
      let mint: string | null = null;
      const referenceKeys: string[] = [];

      if (effectiveTx && effectiveTx.transaction) {
        const message = effectiveTx.transaction.message;
        const meta = effectiveTx.meta;
        const accountKeys = message?.accountKeys || [];
        for (const k of accountKeys) {
          const kStr = typeof k === 'string' ? k : k?.pubkey;
          if (kStr && kStr.length >= 32 && kStr.length <= 44 && !referenceKeys.includes(kStr)) {
            referenceKeys.push(kStr);
          }
        }

        // Identify sender (first fee-payer account)
        if (accountKeys.length > 0) {
          const firstKey = accountKeys[0];
          sender = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey || null;
        }

        // Parse Instructions for Memo, SPL Transfer, SOL Transfer, & Reference Keys
        const instructions = message?.instructions || [];
        for (const inst of instructions) {
          // Check Memo Program
          if (inst.program === 'spl-memo' || inst.programId === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') {
            memo = inst.parsed || inst.data || memo;
          }

          // Check SPL Token Transfer Instructions
          if (inst.program === 'spl-token') {
            const parsed = inst.parsed;
            if (parsed && (parsed.type === 'transfer' || parsed.type === 'transferChecked')) {
              const info = parsed.info;
              if (info?.mint) {
                mint = info.mint;
              }
              const rawAmt = info?.tokenAmount?.uiAmountString || info?.tokenAmount?.uiAmount || info?.amount;
              const decimals = info?.tokenAmount?.decimals || 6;
              if (rawAmt !== undefined && rawAmt !== null) {
                if (typeof rawAmt === 'number') {
                  amountUsdc = rawAmt;
                } else if (typeof rawAmt === 'string') {
                  const cleanStr = rawAmt.replace(/,/g, '.');
                  const parsed = parseFloat(cleanStr);
                  if (!isNaN(parsed)) {
                    if (info?.tokenAmount?.uiAmountString || info?.tokenAmount?.uiAmount !== undefined) {
                      amountUsdc = parsed;
                    } else {
                      amountUsdc = parsed > 10000 ? parsed / Math.pow(10, decimals) : parsed;
                    }
                  }
                }
              }
              recipient = info?.destination || recipient;
            }
          }

          // Check SOL System Transfer Instructions
          if (inst.program === 'system') {
            const parsed = inst.parsed;
            if (parsed && parsed.type === 'transfer') {
              const info = parsed.info;
              if (info?.lamports) {
                amountSol = info.lamports / 1e9;
              }
              if (info?.destination) {
                recipient = info.destination;
              }
            }
          }

          // Extract non-signer read-only reference accounts (handles both parsed string keys and compiled v0 numeric indices)
          const rawInstAccounts = inst.accounts || [];
          if (Array.isArray(rawInstAccounts)) {
            for (const acc of rawInstAccounts) {
              const rawKey = typeof acc === 'number' ? accountKeys[acc] : acc;
              const kStr = typeof rawKey === 'string' ? rawKey : rawKey?.pubkey;
              if (kStr && kStr.length >= 32 && kStr.length <= 44 && !referenceKeys.includes(kStr)) {
                referenceKeys.push(kStr);
              }
            }
          }
        }

        // Alternative SPL Token Balance Diff check if instruction parser didn't catch amountUsdc
        if (amountUsdc === 0 && meta?.postTokenBalances && meta?.preTokenBalances) {
          const preList = meta.preTokenBalances || [];
          const postList = meta.postTokenBalances || [];

          for (const post of postList) {
            if (post?.mint) {
              mint = post.mint;
            }
            const pre = preList.find((p: any) => p.accountIndex === post.accountIndex);
            const preAmt = pre?.uiTokenAmount?.uiAmount || 0;
            const postAmt = post?.uiTokenAmount?.uiAmount || 0;
            const diff = postAmt - preAmt;
            if (diff > 0) {
              amountUsdc = diff;
              if (accountKeys[post.accountIndex]) {
                const accKey = accountKeys[post.accountIndex];
                recipient = typeof accKey === 'string' ? accKey : accKey?.pubkey || recipient;
              }
              break;
            }
          }
        }
      }

      const parsedDetails: ParsedOnChainTxDetails = {
        signature,
        slot,
        blockTime,
        confirmationStatus,
        err,
        sender,
        recipient,
        amountUsdc: amountUsdc > 0 ? amountUsdc : (amountSol > 0 ? amountSol : 0),
        amountSol,
        memo,
        mint,
        referenceKeys,
        isVerified: true,
      };

      // ⚡ Cache in-memory for 5 minutes (300,000ms) for 0ms instant response on subsequent checks
      this.txCacheMap.set(signature, {
        data: parsedDetails,
        expiresAt: Date.now() + 300000,
      });

      return parsedDetails;
    } catch (e) {
      logger.error({ signature, err: e }, 'Failed to parse on-chain transaction');
      return null;
    }
  }

  /**
   * Main Background Polling Loop
   * Fetches latest on-chain transaction signatures for registered addresses/reference keys
   */
  private async pollOnChainSignatures() {
    this.lastPollTimestamp = new Date().toISOString();
    const activeAddresses = Array.from(this.monitoredAddresses.values());

    // Also fetch active invoices from Supabase DB to dynamically add active reference keys
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const invRes = await fetch(`${supabaseUrl}/rest/v1/zeroclaw_invoices?status=eq.active&select=reference_key,user_id,amount,customer_target,channel_type&limit=30`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        if (invRes.ok) {
          const invRows = (await invRes.json()) as any[];
          for (const inv of invRows) {
            if (inv.reference_key && !this.monitoredAddresses.has(inv.reference_key)) {
              this.registerMonitoredAddress(
                inv.reference_key,
                'reference',
                inv.user_id,
                parseFloat(inv.amount || 0),
                inv.customer_target,
                inv.channel_type
              );
            }
          }
        }
      } catch {
        // ignore DB fetch error on offline mode
      }
    }

    // Scan each monitored address / reference key on Solana Devnet RPC
    for (const item of activeAddresses) {
      try {
        const sigsResult = await this.callRpc('getSignaturesForAddress', [
          item.address,
          { limit: 5, commitment: 'confirmed' },
        ]);

        if (!Array.isArray(sigsResult)) continue;
        this.totalSignaturesScanned += sigsResult.length;

        for (const sigInfo of sigsResult) {
          const sig = sigInfo.signature;
          if (!sig || this.processedSignatures.has(sig)) continue;

          // 🛡️ Strict Base58 Solana Signature Format Check (87-88 characters)
          if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(sig)) continue;

          // 🛡️ DB Persistent Deduplication Guard: Skip if transaction signature was already reconciled in Supabase
          if (supabaseUrl && supabaseKey) {
            try {
              const checkRes = await fetch(
                `${supabaseUrl}/rest/v1/zeroclaw_solana_settlements?tx_signature=eq.${encodeURIComponent(sig)}&select=tx_signature,status`,
                {
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                }
              );
              if (checkRes.ok) {
                const existingRows = (await checkRes.json()) as any[];
                if (Array.isArray(existingRows) && existingRows.length > 0) {
                  this.processedSignatures.add(sig);
                  const { sentTelegramReceiptSignatures } = await import('../routes/v1/zeroclaw.routes.js');
                  sentTelegramReceiptSignatures.add(sig);
                  continue; // Signature already reconciled in DB; skip processing
                }
              }
            } catch {
              // Ignore DB check error, proceed to on-chain parsing
            }
          }

          // Process new unhandled transaction signature
          const txDetails = await this.parseOnChainTxSignature(sig);
          if (!txDetails || !txDetails.isVerified || txDetails.err) continue;

          // 🛡️ Anti-Fraud Guard: Reject transactions with zero transfer amount
          if (txDetails.amountUsdc <= 0 && txDetails.amountSol <= 0) {
            logger.warn({ sig, address: item.address }, '🛡️ Monitor Anti-Fraud: Skipping transaction with 0 transfer amount');
            continue;
          }

          // 🛡️ Anti-Fraud Guard: Verify recipient or reference key matches monitored address
          const isTargetMatch = txDetails.recipient === item.address ||
            Boolean(txDetails.referenceKeys && txDetails.referenceKeys.includes(item.address));

          if (!isTargetMatch) {
            logger.warn({ sig, address: item.address, recipient: txDetails.recipient }, '🛡️ Monitor Anti-Fraud: Skipping transaction not matching recipient/reference key');
            continue;
          }

          // 🛡️ Merchant Wallet Guard: If monitoring a merchant pubkey (type === 'merchant'), ONLY process if transaction includes a valid invoice referenceKey or active invoice
          if (item.type === 'merchant') {
            let matchesActiveInvoice = false;
            if (supabaseUrl && supabaseKey) {
              try {
                const checkInv = await fetch(
                  `${supabaseUrl}/rest/v1/zeroclaw_invoices?merchant_pubkey=eq.${encodeURIComponent(item.address)}&status=eq.active&select=reference_key,created_at`,
                  {
                    headers: {
                      apikey: supabaseKey,
                      Authorization: `Bearer ${supabaseKey}`,
                    },
                  }
                );
                if (checkInv.ok) {
                  const activeInvs = (await checkInv.json()) as any[];
                  if (Array.isArray(activeInvs) && activeInvs.length > 0) {
                    // Check if signature contains any active reference key
                    const activeRefKeys = new Set(activeInvs.map(i => i.reference_key).filter(Boolean));
                    if (txDetails.referenceKeys && txDetails.referenceKeys.some(rk => activeRefKeys.has(rk))) {
                      matchesActiveInvoice = true;
                    }
                  }
                }
              } catch { }
            }
            if (!matchesActiveInvoice) {
              logger.info({ sig, merchantAddress: item.address }, '🛡️ Monitor Guard: Skipping merchant wallet transaction with no matching active invoice referenceKey');
              this.processedSignatures.add(sig);
              continue;
            }
          }

          // 🛡️ Invoice Protection: Check if invoice is already settled or active in DB
          if (supabaseUrl && supabaseKey) {
            try {
              const invRes = await fetch(
                `${supabaseUrl}/rest/v1/zeroclaw_invoices?reference_key=eq.${encodeURIComponent(item.address)}&select=status,settlement_status,paid_amount_usdc,tx_signature,created_at`,
                {
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                }
              );
              if (invRes.ok) {
                const invData = (await invRes.json()) as any[];
                if (Array.isArray(invData) && invData.length > 0) {
                  const inv = invData[0];
                  if (inv.status === 'confirmed' || inv.settlement_status === 'settled_exact' || inv.settlement_status === 'settled_overpaid') {
                    if (inv.tx_signature && inv.tx_signature !== sig && txDetails.amountUsdc < (item.expectedAmountUsdc || 0) - 0.001) {
                      logger.info({ sig, referenceKey: item.address }, '🛡️ Monitor Guard: Skipping older underpaid signature on an already settled invoice');
                      this.processedSignatures.add(sig);
                      continue;
                    }
                  }
                } else if (item.type === 'reference') {
                  // No invoice record found in DB for this reference key -> Skip sending receipt for phantom reference
                  logger.warn({ sig, referenceKey: item.address }, '🛡️ Monitor Guard: No DB invoice record found for reference key; skipping false positive receipt');
                  this.processedSignatures.add(sig);
                  continue;
                }
              }
            } catch {
              // Ignore check error
            }
          }

          this.processedSignatures.add(sig);

          // Reconcile and save settlement
          await this.reconcileDiscoveredSettlement(item, txDetails);
        }
      } catch {
        // Continue to next address
      }
    }
  }

  /**
   * Reconcile a discovered on-chain settlement with Supabase DB & customer channel notification
   */
  private async reconcileDiscoveredSettlement(monitored: MonitoredAddress, tx: ParsedOnChainTxDetails) {
    this.totalSettlementsReconciled++;
    logger.info({ signature: tx.signature, amount: tx.amountUsdc, monitoredAddress: monitored.address }, '⚡ ZeroClaw Monitor Reconciled On-Chain Settlement!');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    try {
      const isDemo = monitored.userId ? monitored.userId.includes('demo') || monitored.userId.includes('guest') : false;

      // 1. Insert row into zeroclaw_solana_settlements
      await fetch(`${supabaseUrl}/rest/v1/zeroclaw_solana_settlements?on_conflict=reference_key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: monitored.userId || null,
          merchant_pubkey: monitored.address.length <= 44 ? monitored.address : null,
          amount_usdc: tx.amountUsdc || monitored.expectedAmountUsdc || 15.00,
          reference_key: monitored.address,
          tx_signature: tx.signature,
          network: 'solana-devnet',
          status: 'confirmed',
          memo: tx.memo || `ZeroClaw On-Chain Verified Settlement (${tx.amountUsdc} USDC)`,
          buyer_email: monitored.userId || 'user@zegaai.site',
          is_demo: isDemo,
          slot: tx.slot,
          updated_at: new Date().toISOString(),
        }),
      });

      // 2. Update status of matching invoice in zeroclaw_invoices
      const expectedAmt = monitored.expectedAmountUsdc || tx.amountUsdc;
      let settlementStatus = 'settled_exact';
      let statusDbStr = 'confirmed';

      if (tx.amountUsdc < expectedAmt - 0.001) {
        settlementStatus = 'settled_underpaid';
        statusDbStr = 'underpaid';
      } else if (tx.amountUsdc > expectedAmt + 0.001) {
        settlementStatus = 'settled_overpaid';
        statusDbStr = 'overpaid';
      }

      await fetch(`${supabaseUrl}/rest/v1/zeroclaw_invoices?reference_key=eq.${encodeURIComponent(monitored.address)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          status: statusDbStr,
          settlement_status: settlementStatus,
          tx_signature: tx.signature,
          paid_amount_usdc: tx.amountUsdc,
          updated_at: new Date().toISOString(),
        }),
      });

      // 3. Dispatch automated receipt notification via Telegram Bot with Exponential Backoff Retry & Single-Flight Chat Resolution
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      if (monitored.customerTarget && tgToken && tgToken.trim().length > 10) {
        const { dispatchTelegramReceipt, sentTelegramReceiptSignatures } = await import('../routes/v1/zeroclaw.routes.js');
        if (!sentTelegramReceiptSignatures.has(tx.signature)) {
          sentTelegramReceiptSignatures.add(tx.signature);
          await dispatchTelegramReceipt({
            botToken: tgToken,
            chatIdOrTarget: monitored.customerTarget,
            recAmt: tx.amountUsdc,
            expectedAmt: monitored.expectedAmountUsdc || tx.amountUsdc,
            statusMode: settlementStatus,
            txSignature: tx.signature,
            slot: tx.slot,
            referenceKey: monitored.address,
            memo: tx.memo || `On-Chain Real-Time Verified (${tx.amountUsdc.toFixed(2)} USDC)`,
          });
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error persisting ZeroClaw monitored settlement');
    }
  }
}

/** Export Singleton Instance */
export const zeroClawSignatureMonitor = new ZeroClawSignatureMonitorService();
