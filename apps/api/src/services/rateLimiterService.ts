import { logger } from '../utils/logger.js';

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiterService {
  private static memoryStore = new Map<string, RateLimitRecord>();
  private static gcInterval: NodeJS.Timeout | null = null;
  public static readonly MAX_STORE_KEYS = 10000;

  /**
   * Format tenant-scoped rate limiter key
   */
  public static getTenantKey(organizationId: string, key: string): string {
    return `org:${organizationId}:${key}`;
  }

  /**
   * Check if request key exceeds sliding window rate limit.
   * Runs in O(1) time without blocking database disk I/O.
   */
  public static checkRateLimit(
    key: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.memoryStore.get(key);
    if (!record) {
      // Memory Bounding: Prevent OOM attack by evicting oldest entry if limit reached
      if (this.memoryStore.size >= this.MAX_STORE_KEYS) {
        const oldestKey = this.memoryStore.keys().next().value;
        if (oldestKey) {
          this.memoryStore.delete(oldestKey);
        }
      }
      record = { timestamps: [] };
      this.memoryStore.set(key, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldestInWindow = record.timestamps[0] || now;
      const resetMs = Math.max(0, oldestInWindow + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    // Record new request timestamp
    record.timestamps.push(now);
    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    return {
      allowed: true,
      remaining,
      resetMs: windowMs,
    };
  }

  /** Clear all stored rate limit keys (for testing / reset) */
  public static resetStore(): void {
    this.memoryStore.clear();
  }

  /** Start background Garbage Collector to prevent memory leaks */
  public static startGarbageCollection(intervalMs: number = 60000): void {
    if (this.gcInterval) return;

    this.gcInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.memoryStore.entries()) {
        record.timestamps = record.timestamps.filter((ts) => now - ts < 120000);
        if (record.timestamps.length === 0) {
          this.memoryStore.delete(key);
        }
      }
    }, intervalMs);

    if (this.gcInterval.unref) {
      this.gcInterval.unref();
    }
  }

  /** Stop background Garbage Collector */
  public static stopGarbageCollection(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }
}
