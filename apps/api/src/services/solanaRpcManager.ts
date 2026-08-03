import https from 'https';
import http from 'http';
import { URL } from 'url';
import { Connection } from '@solana/web3.js';
import { logger } from '../utils/logger.js';

export interface RpcProviderConfig {
  name: string;
  url: string;
  weight?: number;
}

export interface RpcProviderMetrics {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'cooldown';
  consecutiveFailures: number;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  rateLimitCount: number;
  timeoutCount: number;
  averageLatencyMs: number;
  healthScore: number;
  cooldownUntil: number;
  lastError: string | null;
  lastStatusChange: string;
}

export interface RpcManagerConfig {
  timeoutMs: number;
  maxRetries: number;
  backoffBaseMs: number;
  cooldownBaseMs: number;
  rateLimitRps: number;
  defaultCacheTtlMs: number;
}

/**
 * Enterprise Production-Grade Solana RPC Manager
 *
 * Implements:
 * 1. Multi-Provider RPC Pool (Primary, Secondary, Tertiary, Official)
 * 2. Connection Reuse / Pooling (`Connection` instance per provider)
 * 3. Circuit Breaker (Exponential Cooldown: 30s -> 60s -> 120s on 429 / failure)
 * 4. Exponential Backoff with Random Jitter (1s -> 2s -> 4s -> 8s ± 200ms)
 * 5. Token Bucket Rate Limiting (Protects providers from rate spikes)
 * 6. Request Deduplication (In-flight promise coalescing for identical calls)
 * 7. Smart Caching (TTL-based caching for blockhash, account info, tx signatures)
 * 8. Health Monitoring & Dynamic Weighted Failover (Least Latency + High Success Rate)
 * 9. Structured Enterprise Logging
 */
export class SolanaRpcManager {
  private providers: Map<string, RpcProviderMetrics> = new Map();
  private connections: Map<string, Connection> = new Map();
  private tokenBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private rpcCacheMap: Map<string, { data: any; expiresAt: number }> = new Map();

  private config: RpcManagerConfig = {
    timeoutMs: parseInt(process.env.RPC_TIMEOUT_MS || '8000', 10),
    maxRetries: parseInt(process.env.RPC_MAX_RETRIES || '3', 10),
    backoffBaseMs: parseInt(process.env.RPC_BACKOFF_BASE_MS || '1000', 10),
    cooldownBaseMs: parseInt(process.env.RPC_COOLDOWN_BASE_MS || '30000', 10),
    rateLimitRps: parseInt(process.env.RPC_RATE_LIMIT_RPS || '10', 10),
    defaultCacheTtlMs: parseInt(process.env.RPC_CACHE_TTL_MS || '30000', 10),
  };

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize RPC Provider Pool from ENV variables or Production-Grade Fallbacks
   * Never includes hardcoded demo endpoints.
   */
  private initializeProviders() {
    const rawProviders: RpcProviderConfig[] = [];

    const candidateUrls: { name: string; url: string | undefined }[] = [
      { name: 'Alchemy-Devnet-RPC', url: process.env.SOLANA_RPC_1 || process.env.SOLANA_RPC_PRIMARY },
      { name: 'Helius-Devnet-RPC', url: process.env.SOLANA_RPC_2 || process.env.SOLANA_RPC_SECONDARY },
      { name: 'QuickNode-Devnet-RPC', url: process.env.SOLANA_RPC_3 || process.env.SOLANA_RPC_TERTIARY },
      { name: 'Official-Solana-Devnet', url: process.env.SOLANA_RPC_4 || process.env.SOLANA_RPC_OFFICIAL || process.env.SOLANA_RPC_FALLBACK || process.env.SOLANA_RPC_URL },
      { name: 'Official-Solana-Devnet-Fallback', url: 'https://api.devnet.solana.com' },
    ];

    for (const cand of candidateUrls) {
      if (!cand.url) continue;
      const urlStr = cand.url.trim();

      // Skip demo endpoint, placeholders like <YOUR_...>, or empty strings
      if (!urlStr || urlStr.includes('alchemy.com/v2/demo') || urlStr.includes('<') || urlStr.includes('>')) {
        continue;
      }

      // Validate URL syntax
      try {
        new URL(urlStr);
        rawProviders.push({ name: cand.name, url: urlStr });
      } catch {
        // Skip malformed URL
      }
    }

    // Deduplicate providers by URL
    const uniqueMap = new Map<string, RpcProviderConfig>();
    for (const p of rawProviders) {
      if (!uniqueMap.has(p.url)) {
        uniqueMap.set(p.url, p);
      }
    }

    // Fallback if no valid provider configured
    if (uniqueMap.size === 0) {
      uniqueMap.set('https://api.devnet.solana.com', {
        name: 'Official-Solana-Devnet',
        url: 'https://api.devnet.solana.com',
      });
    }

    const nowStr = new Date().toISOString();

    for (const [url, cfg] of uniqueMap.entries()) {
      this.providers.set(url, {
        name: cfg.name,
        url,
        status: 'healthy',
        consecutiveFailures: 0,
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        rateLimitCount: 0,
        timeoutCount: 0,
        averageLatencyMs: 150, // Initial optimistic estimate
        healthScore: 100,
        cooldownUntil: 0,
        lastError: null,
        lastStatusChange: nowStr,
      });

      // Pre-initialize Connection Pool for object reuse
      try {
        const conn = new Connection(url, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: this.config.timeoutMs + 2000,
        });
        this.connections.set(url, conn);
      } catch (err: any) {
        logger.warn({ url, err: err.message }, 'Failed to pre-initialize Connection object for RPC provider');
      }

      // Initialize Token Bucket (Capacity = rateLimitRps)
      this.tokenBuckets.set(url, {
        tokens: this.config.rateLimitRps,
        lastRefill: Date.now(),
      });
    }

    logger.info(
      {
        providerCount: this.providers.size,
        providers: Array.from(this.providers.values()).map((p) => ({ name: p.name, url: p.url })),
      },
      '⚡ Solana RPC Pool Initialized Successfully'
    );
  }

  /**
   * Get Web3 Connection object from pool (Reuses pre-initialized Connection)
   */
  public getConnection(url?: string): Connection {
    const targetUrl = url || this.selectBestProvider()?.url || 'https://api.devnet.solana.com';
    let conn = this.connections.get(targetUrl);
    if (!conn) {
      conn = new Connection(targetUrl, { commitment: 'confirmed' });
      this.connections.set(targetUrl, conn);
    }
    return conn;
  }

  /**
   * Execute raw JSON-RPC call across the RPC Pool with weighted failover, backoff, and deduplication
   * OWASP Hardened: Validates RPC method whitelist & sanitizes parameters against injection attacks
   */
  public async callRpc<T = any>(
    method: string,
    params: any[] = [],
    options: { cacheTtlMs?: number; skipCache?: boolean } = {}
  ): Promise<T> {
    // 🛡️ OWASP Security Guard: Validate RPC Method Whitelist
    const ALLOWED_RPC_METHODS = new Set([
      'getSignatureStatuses',
      'getTransaction',
      'getParsedTransaction',
      'getLatestBlockhash',
      'getAccountInfo',
      'getBalance',
      'getTokenAccountBalance',
      'getSignaturesForAddress',
      'sendTransaction',
      'simulateTransaction',
      'getHealth',
      'getSlot',
      'getBlockTime',
    ]);

    if (!ALLOWED_RPC_METHODS.has(method)) {
      throw new Error(`🛡️ Security Guard: Unauthorized RPC Method "${method}" rejected.`);
    }

    // 🛡️ OWASP Security Guard: Sanitize String Parameters against Zero-Width Unicode & Injection Attacks
    const sanitizedParams = params.map((param) => {
      if (typeof param === 'string') {
        return param.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      }
      return param;
    });

    const cacheKey = `${method}:${JSON.stringify(sanitizedParams)}`;

    // 1. Smart Caching Lookup
    if (!options.skipCache) {
      const cached = this.rpcCacheMap.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    // 2. Request Deduplication (In-flight Coalescing)
    if (this.inFlightRequests.has(cacheKey)) {
      logger.debug({ method, cacheKey }, '🔄 Deduplicating concurrent RPC request (Awaiting existing promise)');
      return this.inFlightRequests.get(cacheKey)!;
    }

    const requestPromise = this.executeRpcWithFailover<T>(method, sanitizedParams, cacheKey, options.cacheTtlMs);

    this.inFlightRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Core RPC Failover & Retry Execution Engine
   */
  private async executeRpcWithFailover<T>(
    method: string,
    params: any[],
    cacheKey: string,
    overrideCacheTtlMs?: number
  ): Promise<T> {
    let lastError: Error | null = null;
    const attemptedProviders = new Set<string>();

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      const provider = this.selectBestProvider(attemptedProviders);

      if (!provider) {
        // All providers in pool are in cooldown — wait for shortest cooldown to expire
        const shortestCooldown = Math.max(1000, this.getShortestCooldownMs());
        logger.warn(
          { attempt, shortestCooldownMs: shortestCooldown },
          '⚠️ All RPC providers in cooldown. Waiting before retrying pool...'
        );
        await this.sleep(shortestCooldown);
        attemptedProviders.clear(); // Reset attempts for next cycle
        continue;
      }

      attemptedProviders.add(provider.url);

      // Check & consume token bucket rate limit
      const tokenAcquired = this.consumeToken(provider.url);
      if (!tokenAcquired) {
        logger.warn({ provider: provider.name }, '⏳ Token bucket rate limit hit for provider. Trying next candidate...');
        continue;
      }

      // Calculate exponential backoff with jitter if not first attempt
      if (attempt > 1) {
        const backoffMs = this.calculateBackoffWithJitter(attempt);
        logger.info(
          { attempt, backoffMs, provider: provider.name, method },
          `⚡ Applying exponential backoff with jitter before retry (${backoffMs}ms)`
        );
        await this.sleep(backoffMs);
      }

      const startTime = Date.now();

      try {
        const result = await this.performHttpRequest(provider.url, method, params);
        const latencyMs = Date.now() - startTime;

        // Record metrics on success
        this.recordSuccess(provider.url, latencyMs);

        // Calculate TTL and populate Smart Cache
        const cacheTtl = overrideCacheTtlMs !== undefined ? overrideCacheTtlMs : this.determineCacheTtl(method);
        if (cacheTtl > 0 && result !== null && result !== undefined) {
          this.rpcCacheMap.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + cacheTtl,
          });
        }

        return result;
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        lastError = err;

        const isRateLimit = err.message && (err.message.includes('429') || err.message.toLowerCase().includes('too many requests'));
        const isTimeout = err.message && (err.message.includes('timeout') || err.message.includes('ETIMEDOUT'));

        // Record metrics and trigger Circuit Breaker
        this.recordFailure(provider.url, err.message, isRateLimit, isTimeout);

        logger.error(
          {
            provider: provider.name,
            url: provider.url,
            method,
            attempt,
            latencyMs,
            error: err.message,
            nextAction: attempt < this.config.maxRetries ? 'Switching Provider / Retrying' : 'Exhausted Retries',
          },
          `❌ Solana RPC Call Failed`
        );
      }
    }

    throw lastError || new Error(`All RPC providers failed after ${this.config.maxRetries} attempts.`);
  }

  /**
   * Perform Low-Level HTTP/HTTPS Request with Forced IPv4 Socket & Configurable Timeout
   */
  private performHttpRequest(rpcUrl: string, method: string, params: any[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(rpcUrl);
      } catch (e) {
        return reject(new Error(`Invalid RPC URL: ${rpcUrl}`));
      }

      const postData = JSON.stringify({
        jsonrpc: '2.0',
        id: `zega_rpc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        method,
        params,
      });

      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        parsedUrl,
        {
          method: 'POST',
          family: 4, // Force IPv4 family resolution to prevent node fetch hanging
          timeout: this.config.timeoutMs,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'ZEGA-SolanaRPCManager/2.0',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode === 429) {
              return reject(new Error(`HTTP 429 Too Many Requests`));
            }

            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(body);
                if (json.error) {
                  const errCode = json.error.code;
                  const errMsg = json.error.message || 'RPC Error';
                  if (errCode === 429 || errMsg.includes('429')) {
                    return reject(new Error(`HTTP 429 Rate Limit Exceeded`));
                  }
                  return reject(new Error(`RPC Error (${errCode}): ${errMsg}`));
                }
                resolve(json.result !== undefined ? json.result : null);
              } catch (e) {
                reject(new Error(`Invalid JSON response from RPC provider`));
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage || ''}`));
            }
          });
        }
      );

      req.on('error', (err) => {
        reject(new Error(`Network Error: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`RPC Request Timeout (${this.config.timeoutMs}ms)`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Smart Dynamic Provider Selection algorithm based on weighted latency + health score + non-cooldown state
   */
  private selectBestProvider(excludeUrls: Set<string> = new Set()): RpcProviderMetrics | null {
    const now = Date.now();
    const candidates: RpcProviderMetrics[] = [];

    for (const p of this.providers.values()) {
      if (excludeUrls.has(p.url)) continue;

      // Check if cooldown expired
      if (p.status === 'cooldown') {
        if (now >= p.cooldownUntil) {
          // Cooldown expired — recover to degraded state for probe testing
          p.status = 'degraded';
          p.lastStatusChange = new Date().toISOString();
          logger.info({ provider: p.name, url: p.url }, '🟢 RPC Provider Cooldown Expired. Status updated to DEGRADED.');
        } else {
          continue; // Still in cooldown
        }
      }

      candidates.push(p);
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort candidates by Health Score (descending) and Average Latency (ascending)
    candidates.sort((a, b) => {
      if (b.healthScore !== a.healthScore) {
        return b.healthScore - a.healthScore; // Higher health score first
      }
      return a.averageLatencyMs - b.averageLatencyMs; // Lower latency first
    });

    return candidates[0];
  }

  /**
   * Record Successful RPC Request & Update Rolling Average Latency & Health Score
   */
  private recordSuccess(url: string, latencyMs: number) {
    const p = this.providers.get(url);
    if (!p) return;

    p.totalRequests++;
    p.successCount++;
    p.consecutiveFailures = 0;

    // Rolling exponential average latency update
    p.averageLatencyMs = Math.round(p.averageLatencyMs * 0.7 + latencyMs * 0.3);

    // Increment health score back up to max 100
    p.healthScore = Math.min(100, p.healthScore + 5);

    if (p.status === 'degraded' && p.healthScore >= 80) {
      p.status = 'healthy';
      p.lastStatusChange = new Date().toISOString();
      logger.info({ provider: p.name, latencyMs, healthScore: p.healthScore }, '✨ RPC Provider Status Restored to HEALTHY');
    }
  }

  /**
   * Record Failed RPC Request & Trigger Exponential Circuit Breaker Cooldown
   */
  private recordFailure(url: string, errorMsg: string, isRateLimit: boolean, isTimeout: boolean) {
    const p = this.providers.get(url);
    if (!p) return;

    p.totalRequests++;
    p.failureCount++;
    p.consecutiveFailures++;
    p.lastError = errorMsg;

    if (isRateLimit) p.rateLimitCount++;
    if (isTimeout) p.timeoutCount++;

    // Deduct health score significantly on 429 or timeout
    const penalty = isRateLimit ? 50 : isTimeout ? 30 : 20;
    p.healthScore = Math.max(0, p.healthScore - penalty);

    // Trigger Circuit Breaker Cooldown
    const cooldownMultiplier = Math.pow(2, Math.min(p.consecutiveFailures - 1, 3));
    const cooldownDurationMs = this.config.cooldownBaseMs * cooldownMultiplier;
    p.cooldownUntil = Date.now() + cooldownDurationMs;
    p.status = 'cooldown';
    p.lastStatusChange = new Date().toISOString();

    logger.warn(
      {
        provider: p.name,
        url: p.url,
        error: errorMsg,
        consecutiveFailures: p.consecutiveFailures,
        cooldownDurationSeconds: cooldownDurationMs / 1000,
        healthScore: p.healthScore,
      },
      `⚡ CIRCUIT BREAKER TRIPPED! Placing RPC Provider into COOLDOWN for ${cooldownDurationMs / 1000}s`
    );
  }

  /**
   * Consume 1 Token from Token Bucket Rate Limiter
   */
  private consumeToken(url: string): boolean {
    const bucket = this.tokenBuckets.get(url);
    if (!bucket) return true;

    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;

    // Refill tokens based on elapsed time
    if (elapsedSeconds > 0) {
      bucket.tokens = Math.min(
        this.config.rateLimitRps,
        bucket.tokens + elapsedSeconds * this.config.rateLimitRps
      );
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Calculate Exponential Backoff with Random Jitter (1s -> 2s -> 4s -> 8s ± 200ms)
   */
  private calculateBackoffWithJitter(attempt: number): number {
    const base = this.config.backoffBaseMs * Math.pow(2, attempt - 1);
    const maxBackoff = 8000;
    const jitter = Math.floor(Math.random() * 400) - 200; // ±200ms random jitter
    return Math.min(base, maxBackoff) + jitter;
  }

  /**
   * Determine Cache TTL based on RPC Method
   */
  private determineCacheTtl(method: string): number {
    switch (method) {
      case 'getLatestBlockhash':
        return 10000; // 10 seconds
      case 'getAccountInfo':
      case 'getBalance':
      case 'getTokenAccountBalance':
        return 15000; // 15 seconds
      case 'getSignatureStatuses':
      case 'getSignaturesForAddress':
        return 20000; // 20 seconds
      case 'getTransaction':
      case 'getParsedTransaction':
        return 300000; // 5 minutes for immutable confirmed transactions
      default:
        return this.config.defaultCacheTtlMs;
    }
  }

  /**
   * Get shortest remaining cooldown time among all providers in pool
   */
  private getShortestCooldownMs(): number {
    const now = Date.now();
    let shortest = Infinity;

    for (const p of this.providers.values()) {
      if (p.cooldownUntil > now) {
        const remaining = p.cooldownUntil - now;
        if (remaining < shortest) {
          shortest = remaining;
        }
      }
    }

    return shortest === Infinity ? 5000 : shortest;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get Pool Status & Telemetry Metrics for Monitoring & Admin Dashboard
   */
  public getPoolStatus() {
    return {
      totalProviders: this.providers.size,
      activeHealthyCount: Array.from(this.providers.values()).filter((p) => p.status === 'healthy').length,
      inCooldownCount: Array.from(this.providers.values()).filter((p) => p.status === 'cooldown').length,
      cachedItemsCount: this.rpcCacheMap.size,
      inFlightRequestsCount: this.inFlightRequests.size,
      providers: Array.from(this.providers.values()),
    };
  }

  /**
   * Clear In-Memory Cache (useful for tests or forced cache invalidation)
   */
  public clearCache() {
    this.rpcCacheMap.clear();
  }
}

/** Export Centralized Singleton Instance */
export const solanaRpcManager = new SolanaRpcManager();
