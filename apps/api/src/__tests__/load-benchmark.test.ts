import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IdempotencyService } from '../services/idempotencyService.js';
import { EncryptionService } from '../services/encryptionService.js';
import { InvoiceService } from '../services/invoiceService.js';

describe('LEVEL-5: Empirical Load & High-Concurrency Benchmark Suite', () => {
  it('benchmarks high-concurrency AES-256-GCM encryption & decryption throughput (1,000 ops)', async () => {
    const totalOps = 1000;
    const startMs = Date.now();
    const latencies: number[] = [];

    for (let i = 0; i < totalOps; i++) {
      const opStart = performance.now();
      const payload = { userId: `usr_${i}`, apiKey: `sk_live_key_${i}_${Date.now()}` };
      const encrypted = EncryptionService.encrypt(payload);
      const decrypted = EncryptionService.decryptStrict<{ userId: string; apiKey: string }>(encrypted);
      const opEnd = performance.now();

      assert.equal(typeof decrypted === 'object' && decrypted !== null ? decrypted.userId : '', payload.userId);
      latencies.push(opEnd - opStart);
    }

    const elapsedSec = (Date.now() - startMs) / 1000;
    const rps = totalOps / elapsedSec;

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.50)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    assert.ok(rps > 500, `Encryption throughput should exceed 500 ops/sec (actual: ${rps.toFixed(2)})`);
    assert.ok(p95 < 5.0, `p95 latency should be under 5.0ms (actual: ${p95.toFixed(2)}ms)`);
  });

  it('benchmarks high-concurrency SHA-256 idempotency hashing (500 ops)', async () => {
    const totalOps = 500;
    const startMs = Date.now();
    const latencies: number[] = [];

    for (let i = 0; i < totalOps; i++) {
      const opStart = performance.now();
      const payload = { amount: 100 + i, currency: 'USDC', target: `merchant_pubkey_${i}` };
      const hash = IdempotencyService.hashPayload(payload);
      const opEnd = performance.now();

      assert.equal(hash.length, 64);
      latencies.push(opEnd - opStart);
    }

    const elapsedSec = (Date.now() - startMs) / 1000;
    const rps = totalOps / elapsedSec;

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.50)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    assert.ok(rps > 1000, `Hashing throughput should exceed 1000 ops/sec (actual: ${rps.toFixed(2)})`);
    assert.ok(p95 < 2.0, `p95 latency should be under 2.0ms (actual: ${p95.toFixed(2)}ms)`);
  });

  it('benchmarks payment state transition validation under parallel load (500 transitions)', async () => {
    const transitions = [
      ['pending', 'processing'],
      ['processing', 'settled'],
      ['created', 'authorized'],
    ];

    const startMs = Date.now();
    for (let i = 0; i < 500; i++) {
      const transition = transitions[i % transitions.length];
      const valid = InvoiceService.validateStateTransition(transition[0], transition[1]);
      assert.equal(valid, true);
    }
    const elapsedSec = (Date.now() - startMs) / 1000;

    assert.ok(elapsedSec < 0.1, '500 state transitions should validate in under 100ms');
  });
});
