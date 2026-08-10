import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EncryptionService, CryptographicError } from '../services/encryptionService.js';
import { InvoiceService } from '../services/invoiceService.js';
import { IdempotencyService } from '../services/idempotencyService.js';

describe('QUALIFICATION-01: Cryptographic Boundary Hardening (DV-001 Fix)', () => {
  it('decryptStrict throws CryptographicError on tampered GCM authentication tag', () => {
    const secretData = { apiKey: 'sk_live_prod_123456789' };
    const encrypted = EncryptionService.encrypt(secretData);
    const parts = encrypted.split(':');

    // Mutate the auth tag
    const tamperedTag = parts[3].slice(0, -2) + 'aa';
    const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedTag}:${parts[4]}`;

    assert.throws(
      () => EncryptionService.decryptStrict(tamperedPayload),
      (err: unknown) => {
        return err instanceof CryptographicError && err.message.includes('authentication failed');
      },
      'Tampered GCM auth tag must throw CryptographicError'
    );
  });

  it('decryptStrict throws CryptographicError on unencrypted raw plaintext', () => {
    const rawPlaintext = 'unencrypted_raw_api_secret_key';

    assert.throws(
      () => EncryptionService.decryptStrict(rawPlaintext),
      (err: unknown) => {
        return err instanceof CryptographicError && err.message.includes('Missing valid enc:v1:');
      },
      'Unencrypted raw plaintext supplied to decryptStrict must throw CryptographicError'
    );
  });

  it('decryptStrict successfully decrypts valid encrypted envelope', () => {
    const data = { dbUrl: 'postgresql://postgres:secret@localhost:5432/zega' };
    const encrypted = EncryptionService.encrypt(data);

    const decrypted = EncryptionService.decryptStrict<typeof data>(encrypted);
    assert.deepEqual(decrypted, data, 'Valid encrypted envelope must decrypt accurately');
  });
});

describe('QUALIFICATION-02: Payment & Settlement State Machine Invariants', () => {
  it('allows legal state transitions (pending -> processing -> settled)', () => {
    assert.equal(InvoiceService.validateStateTransition('pending', 'processing'), true);
    assert.equal(InvoiceService.validateStateTransition('processing', 'settled'), true);
    assert.equal(InvoiceService.validateStateTransition('created', 'authorized'), true);
  });

  it('rejects illegal transition from SETTLED to PROCESSING', () => {
    assert.throws(
      () => InvoiceService.validateStateTransition('settled', 'processing'),
      /Illegal state transition from terminal state 'settled' to 'processing'/,
      'Cannot regress terminal settled state back to processing'
    );
  });

  it('rejects illegal transition from FAILED to SETTLED', () => {
    assert.throws(
      () => InvoiceService.validateStateTransition('failed', 'settled'),
      /Illegal state transition from terminal state 'failed' to 'settled'/,
      'Cannot jump from failed state to settled'
    );
  });

  it('rejects illegal transition from CANCELLED to AUTHORIZED', () => {
    assert.throws(
      () => InvoiceService.validateStateTransition('cancelled', 'authorized'),
      /Illegal state transition from terminal state 'cancelled' to 'authorized'/
    );
  });
});

describe('QUALIFICATION-03: Multi-Node Financial Idempotency & SHA-256 Hashes', () => {
  it('generates deterministic SHA-256 request payload hashes', () => {
    const payload = { amount: 1500, currency: 'USDC', destination: 'So11111111111111111111111111111111111111112' };
    const hash1 = IdempotencyService.hashPayload(payload);
    const hash2 = IdempotencyService.hashPayload(payload);

    assert.equal(hash1, hash2, 'Payload hashes must be strictly deterministic');
    assert.equal(hash1.length, 64, 'SHA-256 hash length must be 64 hex characters');
  });
});
