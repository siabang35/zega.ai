import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiterService } from '../services/rateLimiterService.js';

describe('L6-RateLimiter: High-Scale In-Memory Sliding Window Performance Suite', () => {
  it('allows requests within sliding window capacity', () => {
    RateLimiterService.resetStore();
    const key = 'user_test_key_1';

    for (let i = 0; i < 10; i++) {
      const res = RateLimiterService.checkRateLimit(key, 10, 60000);
      assert.equal(res.allowed, true, `Request ${i + 1} should be allowed`);
    }

    const overflowRes = RateLimiterService.checkRateLimit(key, 10, 60000);
    assert.equal(overflowRes.allowed, false, '11th request must be rejected');
    assert.equal(overflowRes.remaining, 0, 'Remaining count must be 0');
  });

  it('benchmarks rate limiter throughput under high concurrency (10,000 requests)', () => {
    RateLimiterService.resetStore();
    const totalOps = 10000;
    const startMs = Date.now();

    for (let i = 0; i < totalOps; i++) {
      const key = `user_bench_${i % 100}`;
      RateLimiterService.checkRateLimit(key, 1000, 60000);
    }

    const elapsedSec = (Date.now() - startMs) / 1000;
    const opsPerSec = totalOps / elapsedSec;

    assert.ok(
      opsPerSec > 50000,
      `RateLimiter throughput must exceed 50,000 ops/sec (actual: ${opsPerSec.toFixed(2)} ops/sec)`
    );
  });
});
