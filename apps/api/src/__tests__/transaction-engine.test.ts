import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  safeConvertToBaseUnits,
  validatePublicKey,
  estimateFees,
  previewTransaction,
} from '../services/solanaTransactionService.js';
import { verifyPrivyWebhookSignature } from '../services/webhookService.js';

describe('Transaction Engine & Service Unit Tests', () => {
  describe('Amount & Public Key Validation', () => {
    it('safeConvertToBaseUnits converts SOL to lamports accurately', () => {
      const lamports = safeConvertToBaseUnits('1.25', 9);
      assert.equal(lamports, 1_250_000_000n);
    });

    it('safeConvertToBaseUnits converts USDC to base units (6 decimals)', () => {
      const baseUnits = safeConvertToBaseUnits('125.50', 6);
      assert.equal(baseUnits, 125_500_000n);
    });

    it('safeConvertToBaseUnits rejects excessive decimal precision', () => {
      assert.throws(
        () => safeConvertToBaseUnits('1.1234567', 6),
        /Amount exceeds maximum decimal precision/
      );
    });

    it('safeConvertToBaseUnits rejects negative or invalid numbers', () => {
      assert.throws(() => safeConvertToBaseUnits('-5.0', 9), /Invalid numeric amount/);
      assert.throws(() => safeConvertToBaseUnits('abc', 9), /Invalid numeric amount/);
    });

    it('validatePublicKey parses valid Solana base58 keys', () => {
      const kp = Keypair.generate();
      const pub = validatePublicKey(kp.publicKey.toBase58());
      assert.ok(pub instanceof PublicKey);
      assert.equal(pub.toBase58(), kp.publicKey.toBase58());
    });

    it('validatePublicKey rejects invalid public keys', () => {
      assert.throws(() => validatePublicKey('invalid_key_123'), /not a valid Solana Base58/);
    });
  });

  describe('Transaction Preview & Fee Estimation', () => {
    it('previewTransaction returns structured fee & breakdown data', async () => {
      const sender = Keypair.generate().publicKey.toBase58();
      const recipient = Keypair.generate().publicKey.toBase58();

      const preview = await previewTransaction({
        sender,
        recipient,
        amount: '0.5',
        asset: 'SOL',
      });

      assert.equal(preview.type, 'SOL_TRANSFER');
      assert.equal(preview.amount, '0.5');
      assert.equal(preview.amountBaseUnits, '500000000');
      assert.equal(preview.sender, sender);
      assert.equal(preview.recipient, recipient);
      assert.ok(preview.estimatedFee.networkFeeLamports > 0);
    });
  });

  describe('Privy Webhook Verification', () => {
    it('verifies valid HMAC-SHA256 webhook signatures', () => {
      const secret = 'test_webhook_secret_123';
      process.env.PRIVY_WEBHOOK_SECRET = secret;

      const body = JSON.stringify({ id: 'evt_123', type: 'user.created' });
      const hmac = createHmac('sha256', secret).update(body).digest('hex');
      const sigHeader = `t=1700000000,v1=${hmac}`;

      const isValid = verifyPrivyWebhookSignature(body, sigHeader);
      assert.ok(isValid, 'Valid HMAC signature must verify');

      // Cleanup
      delete process.env.PRIVY_WEBHOOK_SECRET;
    });

    it('rejects tampered webhook payloads', () => {
      const secret = 'test_webhook_secret_123';
      process.env.PRIVY_WEBHOOK_SECRET = secret;

      const body = JSON.stringify({ id: 'evt_123', type: 'user.created' });
      const tamperedBody = JSON.stringify({ id: 'evt_123', type: 'user.created', malicious: true });
      const hmac = createHmac('sha256', secret).update(body).digest('hex');
      const sigHeader = `t=1700000000,v1=${hmac}`;

      const isValid = verifyPrivyWebhookSignature(tamperedBody, sigHeader);
      assert.ok(!isValid, 'Tampered webhook payload must fail verification');

      delete process.env.PRIVY_WEBHOOK_SECRET;
    });
  });
});
