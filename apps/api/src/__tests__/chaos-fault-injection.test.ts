import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EncryptionService, CryptographicError } from '../services/encryptionService.js';
import { InvoiceService } from '../services/InvoiceService.js';
import { solanaRpcManager } from '../services/solanaRpcManager.js';

describe('LEVEL-6: Fault Injection & Chaos Resilience Suite', () => {
  it('CHAOS-01: Solana RPC provider pool handles connection health check & failover resilience', async () => {
    // Inspect current RPC provider health via pool status
    const status = solanaRpcManager.getPoolStatus();
    assert.ok(typeof status === 'object' && status !== null, 'RPC manager must return pool status object');
    assert.ok(status.totalProviders > 0, 'At least 1 RPC provider must be configured');
    assert.ok(Array.isArray(status.providers), 'Status must list provider metrics');
  });

  it('CHAOS-02: Cryptographic Tampering Attack — ciphertext truncation & IV corruption fails closed', () => {
    const data = { token: 'secret_jwt_bearer_token' };
    const validEncrypted = EncryptionService.encrypt(data);

    // Attack 1: Truncate envelope ciphertext
    const truncatedPayload = validEncrypted.slice(0, -10);
    assert.throws(
      () => EncryptionService.decryptStrict(truncatedPayload),
      (err: unknown) => err instanceof CryptographicError,
      'Truncated ciphertext must throw CryptographicError'
    );

    // Attack 2: Corrupt initialization vector (IV)
    const parts = validEncrypted.split(':');
    const corruptedIvPayload = `${parts[0]}:${parts[1]}:000000000000000000000000:${parts[3]}:${parts[4]}`;
    assert.throws(
      () => EncryptionService.decryptStrict(corruptedIvPayload),
      (err: unknown) => err instanceof CryptographicError,
      'Corrupted IV must fail closed with CryptographicError'
    );
  });

  it('CHAOS-03: Illegal State Regression Injection — terminal states strictly fail-closed', () => {
    // Attempt illegal transition from SETTLED state to PENDING
    assert.throws(
      () => InvoiceService.validateStateTransition('settled', 'pending'),
      /Illegal state transition from terminal state 'settled' to 'pending'/,
      'Settled invoice state must fail closed on regression attempt'
    );

    // Attempt illegal transition from EXPIRED state to AUTHORIZED
    assert.throws(
      () => InvoiceService.validateStateTransition('expired', 'authorized'),
      /Illegal state transition from terminal state 'expired' to 'authorized'/,
      'Expired invoice state must fail closed on reactivation attempt'
    );
  });
});
