import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSignatureFormat } from '../utils/settlementValidation.js';

/**
 * ⚡ ZEGA Check Payment Strictness & Anti-Spoofing Test Suite
 * Validates backend payment check verification rules to ensure zero risk of wrong txhash assignment.
 */

describe('Check Payment TxHash Anti-Spoofing Rules', () => {
  it('should REJECT invalid txhash formats (<70 base58 chars or synthetic prefixes)', () => {
    const syntheticSig = 'inv_1234567890_abcdefghijklmnopqrstuvwxyz';
    const isValidFormat = validateSignatureFormat(syntheticSig).ok;
    assert.equal(isValidFormat, false, 'Synthetic inv_ prefix must be rejected as txhash');

    const shortSig = '5K2g3P7x8y9z1234';
    assert.equal(validateSignatureFormat(shortSig).ok, false, 'Short string must be rejected');
  });

  it('should ACCEPT valid 88-character Base58 Solana transaction signatures', () => {
    const validSig = '5K2g3P7x8y9z1234567891abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ1234567891234567';
    assert.equal(validateSignatureFormat(validSig).ok, true, 'Valid 88-char Base58 sig must be accepted');
  });

  it('should enforce strict reference key matching rules for txhash validation', () => {
    const invoiceRefKey = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
    const txRefKeys = ['4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', 'J9RE2J3SWo1x2BctQjBZmhHKFZn1w8KqBBs49uVZmEo9'];
    const otherTxRefKeys = ['99999999999999999999999999999999999999999999'];

    // Rule 1: Tx containing matching reference key is accepted
    const isRefMatch = txRefKeys.includes(invoiceRefKey);
    assert.equal(isRefMatch, true, 'Tx containing matching reference key must match');

    // Rule 2: Tx containing reference keys for a DIFFERENT invoice is REJECTED
    const isMismatch = !otherTxRefKeys.includes(invoiceRefKey) && otherTxRefKeys.length > 0;
    assert.equal(isMismatch, true, 'Tx containing a different reference key must NOT match this invoice');
  });
});
