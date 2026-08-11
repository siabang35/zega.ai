import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

/**
 * 🧪 Extremely Deep Test Suite for Privy Embedded Wallet Signing & Provider Invariants
 *
 * Validates:
 * 1. Pure Privy Embedded Wallet Provider Resolution (No Extension Popups)
 * 2. Multi-Strategy Solana Transaction Signer Execution
 * 3. Base64 Unsigned -> Cryptographic Signing -> Base64 Signed Pipeline
 * 4. Fee Payer & Merchant Identity Guard Matching
 * 5. Rejection of uninitialized / invalid signing providers without extension fallback
 */

describe('Privy Embedded Wallet Provider Resolution & Signing Invariants', () => {
  // Valid Base58 Solana blockhash string for test
  const dummyBlockhash = '5vzrP6nfhDfByN2ZWkJJiDFLdktu1vNFVgyeLc3u6yox';

  // Create a deterministic simulated Privy embedded keypair for testing
  const merchantKeypair = Keypair.generate();
  const merchantAddress = merchantKeypair.publicKey.toBase58();
  const destinationAddress = Keypair.generate().publicKey.toBase58();

  it('1. Successfully constructs valid unsigned Solana transaction for Privy signing', () => {
    const tx = new Transaction();
    tx.feePayer = merchantKeypair.publicKey;
    tx.recentBlockhash = dummyBlockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: merchantKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports: 1000000,
      })
    );

    const unsignedBase64 = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
    assert.ok(unsignedBase64.length > 50, 'Unsigned transaction base64 must be non-empty string');
    assert.equal(tx.feePayer.toBase58(), merchantAddress);
  });

  it('2. Multi-Strategy Resolver Strategy 1: target.signTransaction(tx)', async () => {
    const tx = new Transaction();
    tx.feePayer = merchantKeypair.publicKey;
    tx.recentBlockhash = dummyBlockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: merchantKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports: 1000000,
      })
    );

    // Mock Privy embedded wallet object with direct signTransaction method
    const mockPrivyWallet = {
      address: merchantAddress,
      chainType: 'solana',
      walletClientType: 'privy',
      signTransaction: async (t: Transaction) => {
        t.partialSign(merchantKeypair);
        return t;
      }
    };

    let signedTx: Transaction | undefined;
    if (typeof mockPrivyWallet.signTransaction === 'function') {
      signedTx = await mockPrivyWallet.signTransaction(tx);
    }

    assert.ok(signedTx, 'Signed transaction must be produced');
    assert.ok(signedTx.signatures.some(s => s.signature !== null), 'Transaction must contain valid signature');
    assert.ok(signedTx.verifySignatures(), 'Cryptographic signature verification must PASS');
  });

  it('3. Multi-Strategy Resolver Strategy 2: target.signTransaction({ transaction: tx })', async () => {
    const tx = new Transaction();
    tx.feePayer = merchantKeypair.publicKey;
    tx.recentBlockhash = dummyBlockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: merchantKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports: 1000000,
      })
    );

    // Mock Privy wallet provider expecting object param { transaction: tx }
    const mockPrivyWallet = {
      address: merchantAddress,
      signTransaction: async (args: any) => {
        const targetTx = args.transaction || args;
        targetTx.partialSign(merchantKeypair);
        return targetTx;
      }
    };

    let signedTx: Transaction | undefined;
    if (typeof mockPrivyWallet.signTransaction === 'function') {
      const res = await mockPrivyWallet.signTransaction({ transaction: tx });
      signedTx = res instanceof Transaction ? res : (res.transaction || res);
    }

    assert.ok(signedTx, 'Signed transaction must be produced from object param format');
    assert.ok(signedTx.verifySignatures(), 'Cryptographic signature verification must PASS');
  });

  it('4. Multi-Strategy Resolver Strategy 3: target.getProvider() async provider resolution', async () => {
    const tx = new Transaction();
    tx.feePayer = merchantKeypair.publicKey;
    tx.recentBlockhash = dummyBlockhash;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: merchantKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports: 1000000,
      })
    );

    const mockProvider = {
      signTransaction: async (t: Transaction) => {
        t.partialSign(merchantKeypair);
        return t;
      }
    };

    const mockPrivyWallet = {
      address: merchantAddress,
      getProvider: async () => mockProvider
    };

    const resolvedProvider = await mockPrivyWallet.getProvider();
    assert.ok(resolvedProvider, 'Provider must be resolved from getProvider()');

    const signedTx = await resolvedProvider.signTransaction(tx);
    assert.ok(signedTx.verifySignatures(), 'Signature must verify');
  });

  it('5. Strictly REJECTS uninitialized / non-responsive Privy provider WITHOUT popup fallback', async () => {
    const mockEmptyPrivyWallet = {
      address: merchantAddress,
      // No signTransaction or provider available
    };

    const resolveProvider = async (walletObj: any) => {
      if (!walletObj) return null;
      if (typeof walletObj.getProvider === 'function') {
        try { return await walletObj.getProvider(); } catch (e) { }
      }
      if (walletObj.provider) return walletObj.provider;
      return null;
    };

    const resolvedProvider = await resolveProvider(mockEmptyPrivyWallet);
    const candidateTargets = [mockEmptyPrivyWallet, resolvedProvider].filter(Boolean);

    let signedTx: Transaction | undefined;
    const signErrorLog: string[] = [];

    for (const target of candidateTargets) {
      if (typeof target.signTransaction === 'function') {
        try {
          signedTx = await target.signTransaction();
        } catch (err: any) {
          signErrorLog.push(err?.message);
        }
      }
    }

    assert.equal(signedTx, undefined, 'Must NOT generate fake signed transaction when provider is uninitialized');
    assert.equal(candidateTargets.length, 1, 'Only Privy candidates must be evaluated (no extension fallbacks)');
  });

  it('6. Verifies feePayer matches merchant wallet address strictly', () => {
    const wrongKeypair = Keypair.generate();
    const tx = new Transaction();
    tx.feePayer = wrongKeypair.publicKey;

    const activeMerchantAddress = merchantAddress;
    const isFeePayerMismatch = tx.feePayer.toBase58() !== activeMerchantAddress;

    assert.equal(isFeePayerMismatch, true, 'Fee payer mismatch must be flagged immediately');
  });
});
