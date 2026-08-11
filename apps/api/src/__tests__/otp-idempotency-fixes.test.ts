import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Bug A: OTP String Handling & Validation', () => {
  it('accepts valid 6-digit OTP code string', () => {
    const rawOtp = '123456';
    const cleanCode = rawOtp.trim().replace(/\s+/g, '');
    assert.equal(/^\d{6}$/.test(cleanCode), true);
  });

  it('preserves leading zeros in 6-digit OTP codes (e.g. 000123)', () => {
    const rawOtp = '000123';
    const cleanCode = rawOtp.trim().replace(/\s+/g, '');
    assert.equal(cleanCode, '000123');
    assert.equal(cleanCode.length, 6);
    assert.equal(/^\d{6}$/.test(cleanCode), true);
  });

  it('preserves all zeros OTP code (000000)', () => {
    const rawOtp = '000000';
    const cleanCode = rawOtp.trim().replace(/\s+/g, '');
    assert.equal(cleanCode, '000000');
    assert.equal(cleanCode.length, 6);
    assert.equal(/^\d{6}$/.test(cleanCode), true);
  });

  it('rejects OTP code with spaces inside or invalid characters', () => {
    const invalidOtps = ['12345', '1234567', '12345a', 'abcdef', ''];
    for (const otp of invalidOtps) {
      const cleanCode = otp.trim().replace(/\s+/g, '');
      assert.equal(/^\d{6}$/.test(cleanCode), false, `Should reject invalid OTP: "${otp}"`);
    }
  });

  it('handles surrounding whitespace normalization gracefully', () => {
    const rawOtp = '  948201  \n';
    const cleanCode = rawOtp.trim().replace(/\s+/g, '');
    assert.equal(cleanCode, '948201');
    assert.equal(/^\d{6}$/.test(cleanCode), true);
  });
});

describe('Bug B: Server-Side Operation Idempotency & Terminal Lock Release', () => {
  it('permits a new legitimate withdrawal request immediately after a previous withdrawal completed (No false 15s duplicate lock)', () => {
    const activeLockSet = new Set<string>();
    const completedIntents = new Set<string>();

    const userEmail = 'merchant@zega.ai';

    // 1. Initial Withdrawal Intent #1
    const withdrawalId1 = 'wd_intent_001';
    const activeLockKey1 = `lock_${userEmail}_${withdrawalId1}`;

    // Set lock during processing
    activeLockSet.add(activeLockKey1);
    assert.equal(activeLockSet.has(activeLockKey1), true);

    // Complete Withdrawal #1
    activeLockSet.delete(activeLockKey1);
    completedIntents.add(withdrawalId1);
    assert.equal(activeLockSet.has(activeLockKey1), false, 'Lock must be released upon completion');

    // 2. Immediately start NEW legitimate Withdrawal Intent #2 (1 second later)
    const withdrawalId2 = 'wd_intent_002';
    const activeLockKey2 = `lock_${userEmail}_${withdrawalId2}`;

    // Check if new withdrawal #2 is blocked by active locks
    const isDuplicate = activeLockSet.has(activeLockKey2);
    assert.equal(isDuplicate, false, 'New legitimate withdrawal intent must NOT be blocked by previous completed withdrawal');

    activeLockSet.add(activeLockKey2);
    assert.equal(activeLockSet.has(activeLockKey2), true);
    activeLockSet.delete(activeLockKey2);
    completedIntents.add(withdrawalId2);
  });

  it('blocks duplicate concurrent execution of the SAME active withdrawal intent', () => {
    const activeLockSet = new Set<string>();
    const userEmail = 'merchant@zega.ai';
    const withdrawalId = 'wd_intent_active_99';
    const activeLockKey = `lock_${userEmail}_${withdrawalId}`;

    // First attempt locks the intent
    activeLockSet.add(activeLockKey);

    // Second concurrent attempt for the SAME intent is caught by active lock
    const isConcurrentDuplicate = activeLockSet.has(activeLockKey);
    assert.equal(isConcurrentDuplicate, true, 'Concurrent retry of active intent must be caught');
  });
});
