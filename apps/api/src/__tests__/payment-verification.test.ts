import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * ⚡ ZEGA ZeroClaw Settlement Verification Security Test Suite
 * Validates the 5-layer OWASP deterministic payment verification pipeline.
 *
 * ⚠️ IMPORTANT: All validation functions are IMPORTED from the production
 * utility module (settlementValidation.ts) — NOT redefined locally.
 * This ensures tests exercise the EXACT same code that runs in production.
 */

import {
  validateSignatureFormat,
  validateUsdcMint,
  validateTxFreshness,
} from '../utils/settlementValidation.js';

describe('Layer 2: Base58 Solana Signature Validation', () => {
  it('should REJECT missing or undefined signature', () => {
    const res = validateSignatureFormat(undefined as any);
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'MISSING_SIGNATURE');
  });

  it('should REJECT synthetic sol_... prefix signatures', () => {
    const res = validateSignatureFormat('sol_fake_signature_1234567890_abcdefghijklmnopqrstuvwxyz_1234567890');
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'BASE58_FORMAT');
  });

  it('should REJECT synthetic gen_inv_... prefix signatures', () => {
    const res = validateSignatureFormat('gen_inv_9876543210_abcdefghijklmnopqrstuvwxyz_1234567890');
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'BASE58_FORMAT');
  });

  it('should REJECT signatures shorter than 80 characters', () => {
    const res = validateSignatureFormat('5K2g3P7x8y9z1234567890abcdef');
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'BASE58_FORMAT');
  });

  it('should REJECT signatures containing invalid non-Base58 characters (0, O, I, l)', () => {
    const invalidSig = '5K2g3P7x8y9z0OIl' + 'A'.repeat(75);
    const res = validateSignatureFormat(invalidSig);
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'BASE58_FORMAT');
  });

  it('should ACCEPT valid 88-character Base58 Solana signature format', () => {
    const validSig = '5K2g3P7x8y9z1234567891abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ1234567891234567';
    const res = validateSignatureFormat(validSig);
    assert.equal(res.ok, true);
  });
});

describe('Layer 5: SPL Token Mint Verification', () => {
  it('should ACCEPT valid Devnet USDC mint (4zMMC9...)', () => {
    const res = validateUsdcMint('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    assert.equal(res.ok, true);
  });

  it('should ACCEPT valid Mainnet USDC mint (EPjFWd...)', () => {
    const res = validateUsdcMint('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    assert.equal(res.ok, true);
  });

  it('should REJECT fake / arbitrary token mint (e.g. FAKE_TOKEN_MINT)', () => {
    const res = validateUsdcMint('FakeTokenMintAddress1111111111111111111111');
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'SPL_MINT_MISMATCH');
  });
});

describe('Layer 5: Transaction Freshness Check', () => {
  it('should ACCEPT fresh transaction (1 hour old)', () => {
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    const res = validateTxFreshness(oneHourAgo);
    assert.equal(res.ok, true);
  });

  it('should REJECT stale transaction (>72 hours old)', () => {
    const fourDaysAgo = Math.floor(Date.now() / 1000) - (4 * 24 * 3600);
    const res = validateTxFreshness(fourDaysAgo);
    assert.equal(res.ok, false);
    assert.equal(res.layer, 'TX_FRESHNESS');
  });
});
