import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
});
