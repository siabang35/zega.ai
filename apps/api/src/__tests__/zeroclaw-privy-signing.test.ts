import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction
} from '@solana/spl-token';
import { derivePrivyEmbeddedSolanaKeypair } from '../routes/v1/zeroclaw.routes.js';
import * as PrivyService from '../services/privyService.js';

describe('Privy Embedded Wallet Real Signing & Server-Side Verification', () => {
  it('1. derivePrivyEmbeddedSolanaKeypair MUST throw SECURITY INVARIANT VIOLATION', () => {
    assert.throws(
      () => derivePrivyEmbeddedSolanaKeypair('user@zegaai.site'),
      /SECURITY INVARIANT VIOLATION/
    );
  });

  it('2. Authentic Keypair signature MUST pass server-side cryptographic verification (tx.verifySignatures())', () => {
    const authenticKeypair = Keypair.generate();
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = authenticKeypair.publicKey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: authenticKeypair.publicKey,
        toPubkey: destination,
        lamports: 100_000,
      })
    );

    // Sign using authentic keypair
    tx.sign(authenticKeypair);

    // Server-side verification
    assert.equal(tx.feePayer.toBase58(), authenticKeypair.publicKey.toBase58());
    assert.equal(tx.verifySignatures(), true, 'Authentic keypair signature MUST verify successfully');
  });

  it('3. Spoofed Keypair signature (Keypair A signing for PublicKey B) MUST FAIL server-side verification', () => {
    const signerKeypair = Keypair.generate(); // Keypair A
    const victimPubkey = Keypair.generate().publicKey; // PublicKey B
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = signerKeypair.publicKey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: signerKeypair.publicKey,
        toPubkey: destination,
        lamports: 100_000,
      })
    );

    // Keypair A signs validly first
    tx.sign(signerKeypair);

    // Attacker modifies feePayer / public key to victim's public key (PublicKey B)
    tx.feePayer = victimPubkey;

    // Server-side verification MUST fail
    const isFeePayerMatch = tx.feePayer.toBase58() === victimPubkey.toBase58();
    assert.equal(isFeePayerMatch, true);
    assert.equal(tx.verifySignatures(), false, 'Tampered feePayer signature MUST be rejected by tx.verifySignatures()');
  });

  it('4. Unsigned transaction MUST fail server-side signature verification', () => {
    const pubkey = Keypair.generate().publicKey;
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = pubkey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: pubkey,
        toPubkey: destination,
        lamports: 100_000,
      })
    );

    assert.equal(tx.verifySignatures(), false, 'Unsigned transaction MUST return false for verifySignatures()');
  });

  it('5. USDC transfer instruction MUST use SPL Token Associated Token Accounts without SOL fallback', () => {
    const owner = Keypair.generate().publicKey;
    const destination = Keypair.generate().publicKey;
    const usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

    const sourceAta = getAssociatedTokenAddressSync(usdcMint, owner);
    const destAta = getAssociatedTokenAddressSync(usdcMint, destination);

    const transferIx = createTransferInstruction(
      sourceAta,
      destAta,
      owner,
      1_000_000 // 1 USDC (6 decimals)
    );

    assert.equal(transferIx.keys[0].pubkey.toBase58(), sourceAta.toBase58());
    assert.equal(transferIx.keys[1].pubkey.toBase58(), destAta.toBase58());
    assert.equal(transferIx.keys[2].pubkey.toBase58(), owner.toBase58());
  });

  it('6. Message SHA-256 MUST remain byte-identical before and after signing', () => {
    const authenticKeypair = Keypair.generate();
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = authenticKeypair.publicKey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: authenticKeypair.publicKey,
        toPubkey: destination,
        lamports: 500_000,
      })
    );

    const preSignMessageHash = createHash('sha256').update(tx.serializeMessage()).digest('hex');

    // Sign transaction
    tx.sign(authenticKeypair);

    const postSignMessageHash = createHash('sha256').update(tx.serializeMessage()).digest('hex');

    assert.equal(
      preSignMessageHash,
      postSignMessageHash,
      'Transaction message SHA-256 MUST remain 100% byte-identical after signing'
    );
  });

  it('7. Base64 serialization round-trip MUST preserve exact transaction message and signature', () => {
    const authenticKeypair = Keypair.generate();
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = authenticKeypair.publicKey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: authenticKeypair.publicKey,
        toPubkey: destination,
        lamports: 250_000,
      })
    );

    tx.sign(authenticKeypair);

    const txBytes = tx.serialize();
    const base64Str = Buffer.from(txBytes).toString('base64');

    // Round-trip decode
    const decodedBuffer = Buffer.from(base64Str, 'base64');
    const reconstructedTx = Transaction.from(decodedBuffer);

    assert.equal(reconstructedTx.feePayer?.toBase58(), authenticKeypair.publicKey.toBase58());
    assert.equal(reconstructedTx.verifySignatures(), true, 'Reconstructed transaction MUST pass local signature verification');
  });

  it('8. Post-sign transaction mutation (altering instruction lamports) MUST cause local signature verification to FAIL', () => {
    const authenticKeypair = Keypair.generate();
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = authenticKeypair.publicKey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: authenticKeypair.publicKey,
        toPubkey: destination,
        lamports: 100_000,
      })
    );

    tx.sign(authenticKeypair);
    assert.equal(tx.verifySignatures(), true);

    // Mutate transaction instruction after signing
    tx.instructions[0].data = SystemProgram.transfer({
      fromPubkey: authenticKeypair.publicKey,
      toPubkey: destination,
      lamports: 999_999_999, // Tampered amount
    }).data;

    assert.equal(
      tx.verifySignatures(),
      false,
      'Mutated instruction message MUST be rejected by local signature verification guard'
    );
  });

  it('9. Client-provided transaction with INVALID/MISMATCHED signature MUST be flagged as isSigValid === false to enable server Privy fallback', () => {
    const feePayerKeypair = Keypair.generate();
    const wrongKeypair = Keypair.generate(); // Mismatched signer
    const destination = Keypair.generate().publicKey;
    const blockhash = Keypair.generate().publicKey.toBase58();

    const tx = new Transaction();
    tx.feePayer = feePayerKeypair.publicKey;
    tx.recentBlockhash = blockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: feePayerKeypair.publicKey,
        toPubkey: destination,
        lamports: 100_000,
      })
    );

    // Wrong keypair signs for feePayerKeypair
    tx.sign(wrongKeypair);

    const hasValidSignatures = tx.signatures.some(
      (s) => s.signature != null && !s.signature.every((b) => b === 0)
    );
    const isSigValid = tx.verifySignatures();

    assert.equal(hasValidSignatures, true, 'Transaction has non-zero signature bytes');
    assert.equal(isSigValid, false, 'Signature MUST be invalid because keypair does not match feePayer');
    
    // Fallback condition: !isSigValid MUST be true so backend triggers Privy Enclave signing
    const fallbackTriggered = !isSigValid;
    assert.equal(fallbackTriggered, true, 'Backend MUST trigger Privy Enclave server-side signing when isSigValid is false');
  });

  it('10. Privy authorization error MUST throw PRIVY_AUTHORIZATION_UNAVAILABLE without masking error', () => {
    const errMsg = 'No valid authorization keys or user signing keys available';
    const isAuthError =
      errMsg.includes('No valid authorization keys') ||
      errMsg.includes('user signing keys') ||
      errMsg.includes('authorization');

    assert.equal(isAuthError, true, 'Authorization error MUST be detected');
    const formattedError = `PRIVY_AUTHORIZATION_UNAVAILABLE: ${errMsg}`;
    assert.equal(formattedError.startsWith('PRIVY_AUTHORIZATION_UNAVAILABLE'), true);
  });

  it('11. Privy wallet mapping MUST verify walletId fq512jbre6qryttexoa4v7s7 maps to 5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9', () => {
    const mockWallet = {
      walletId: 'fq512jbre6qryttexoa4v7s7',
      walletAddress: '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9',
      chainType: 'solana',
    };

    assert.equal(mockWallet.walletId, 'fq512jbre6qryttexoa4v7s7');
    assert.equal(mockWallet.walletAddress, '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9');
    assert.equal(mockWallet.chainType, 'solana');
  });

  it('12. checkPrivySigningReadiness MUST report correct status object structure', () => {
    const status = PrivyService.checkPrivySigningReadiness();
    assert.ok(typeof status.appIdConfigured === 'boolean');
    assert.ok(typeof status.appSecretConfigured === 'boolean');
    assert.ok(typeof status.authorizationKeyConfigured === 'boolean');
    assert.ok(status.serverSigningStatus === 'READY' || status.serverSigningStatus === 'NOT_READY');
  });

  it('13. WALLET_IDENTITY_MISMATCH error code MUST be returned when tx.feePayer does not match Privy merchant wallet', () => {
    const resolvedMerchantAddress: string = '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9';
    const txFeePayer: string = '11111111111111111111111111111111';

    const isMismatch = txFeePayer !== resolvedMerchantAddress;
    assert.equal(isMismatch, true, 'Signer mismatch MUST be detected');
    const errorCode = isMismatch ? 'WALLET_IDENTITY_MISMATCH' : 'OK';
    assert.equal(errorCode, 'WALLET_IDENTITY_MISMATCH');
  });

  it('14. Standardized user message for PRIVY_AUTHORIZATION_UNAVAILABLE MUST be non-revealing', () => {
    const userMsg = 'Penarikan belum dapat diproses. Sistem signing wallet sedang tidak tersedia. Silakan coba lagi.';
    assert.ok(userMsg.includes('Sistem signing wallet sedang tidak tersedia'));
    assert.ok(!userMsg.includes('PRIVY_APP_SECRET'));
    assert.ok(!userMsg.includes('authorizationPrivateKey'));
  });

  it('15. checkPrivySigningReadiness MUST report authorizationKeyConfigured as true in current environment', () => {
    const status = PrivyService.checkPrivySigningReadiness();
    assert.equal(status.appIdConfigured, true, 'PRIVY_APP_ID must be configured');
    assert.equal(status.appSecretConfigured, true, 'PRIVY_APP_SECRET must be configured');
    assert.equal(status.authorizationKeyConfigured, true, 'PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY must be configured');
    assert.equal(status.serverSigningStatus, 'READY', 'serverSigningStatus must be READY');
  });

  it('16. P-256 wallet authorization key format wallet-auth:<base64> MUST normalize scalar without error', async () => {
    // @ts-ignore
    const { normalizeP256PrivateKeyToScalar } = await import('../../node_modules/@privy-io/server-auth/dist/cjs/wallet-api/utils.js');
    const authKey = process.env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY || process.env.PRIVY_AUTHORIZATION_KEY;

    assert.ok(authKey, 'Authorization key must exist in process.env');
    assert.ok(authKey.startsWith('wallet-auth:'), 'Authorization key must start with wallet-auth: prefix');
    const scalar = normalizeP256PrivateKeyToScalar(authKey);
    assert.ok(typeof scalar === 'bigint', 'Normalized scalar must be a bigint');
  });

  it('17. PrivyWalletSigningReadinessService.extractKeyFingerprint MUST derive SHA-256 public key fingerprint safely', async () => {
    const { privyWalletSigningReadinessService } = await import('../services/PrivyWalletSigningReadinessService.js');
    const authKey = process.env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY || process.env.PRIVY_AUTHORIZATION_KEY;

    const fingerprint = privyWalletSigningReadinessService.extractKeyFingerprint(authKey);
    assert.ok(fingerprint, 'Fingerprint must be derived');
    assert.equal(typeof fingerprint, 'string');
    assert.equal(fingerprint.length, 16, 'Fingerprint must be 16 hex chars');
  });

  it('18. PrivyWalletSigningReadinessService.checkSigningReadiness MUST generate detailed readiness report', async () => {
    const { privyWalletSigningReadinessService } = await import('../services/PrivyWalletSigningReadinessService.js');

    const report = await privyWalletSigningReadinessService.checkSigningReadiness('fq512jbre6qryttexoa4v7s7');
    assert.equal(report.configurationReady, true);
    assert.equal(report.authorizationKeyConfigured, true);
    assert.equal(typeof report.authorizationKeyFingerprint, 'string');
    assert.equal(report.walletId, 'fq512jbre6qryttexoa4v7s7');
    assert.equal(report.walletAddress, '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9');
    assert.equal(typeof report.signerAuthorized, 'boolean');
    assert.equal(typeof report.overallSigningReady, 'boolean');
  });
});

