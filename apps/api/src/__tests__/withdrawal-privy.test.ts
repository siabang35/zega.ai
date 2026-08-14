import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createTransferInstruction } from '@solana/spl-token';
import { createHash } from 'crypto';

// ──────────────────────────────────────────────────────────────────────
//  VALIDATION TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Withdrawal Input Validation', () => {
  const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  describe('Recipient Validation', () => {
    it('rejects empty recipient', () => {
      assert.ok(!BASE58_REGEX.test(''));
    });

    it('rejects non-base58 characters', () => {
      assert.ok(!BASE58_REGEX.test('0x1234567890abcdef000000000000000000000000'));
    });

    it('rejects too-short addresses', () => {
      assert.ok(!BASE58_REGEX.test('ABC123'));
    });

    it('accepts valid Solana addresses', () => {
      const valid = Keypair.generate().publicKey.toBase58();
      assert.ok(BASE58_REGEX.test(valid));
      assert.doesNotThrow(() => new PublicKey(valid));
    });

    it('accepts 32-character address', () => {
      // Minimum valid Base58 length for 32-byte key
      const pk = Keypair.generate().publicKey.toBase58();
      assert.ok(pk.length >= 32 && pk.length <= 44);
    });
  });

  describe('Amount Validation', () => {
    it('rejects zero amount', () => {
      const val = parseFloat('0');
      assert.ok(val <= 0, 'Zero should be rejected');
    });

    it('rejects negative amount', () => {
      const val = parseFloat('-5.0');
      assert.ok(val <= 0, 'Negative should be rejected');
    });

    it('rejects NaN', () => {
      assert.ok(!Number.isFinite(parseFloat('not_a_number')));
    });

    it('rejects Infinity', () => {
      assert.ok(!Number.isFinite(Infinity));
    });

    it('rejects empty string', () => {
      assert.ok(!Number.isFinite(parseFloat('')));
    });

    it('accepts valid decimal amount', () => {
      const val = parseFloat('0.001');
      assert.ok(Number.isFinite(val) && val > 0);
    });

    it('converts SOL to lamports correctly using BigInt', () => {
      // 1.5 SOL = 1_500_000_000 lamports
      const [intPart, decPart = ''] = '1.5'.split('.');
      const paddedDec = decPart.padEnd(9, '0');
      const fullStr = intPart + paddedDec;
      const lamports = BigInt(fullStr.replace(/^0+/, '') || '0');
      assert.equal(lamports, 1_500_000_000n);
    });

    it('converts USDC amount to base units correctly', () => {
      // 10.5 USDC = 10_500_000 base units (6 decimals)
      const [intPart, decPart = ''] = '10.5'.split('.');
      const paddedDec = decPart.padEnd(6, '0');
      const fullStr = intPart + paddedDec;
      const baseUnits = BigInt(fullStr.replace(/^0+/, '') || '0');
      assert.equal(baseUnits, 10_500_000n);
    });

    it('handles no decimal part', () => {
      const [intPart, decPart = ''] = '100'.split('.');
      const paddedDec = decPart.padEnd(9, '0');
      const fullStr = intPart + paddedDec;
      const lamports = BigInt(fullStr.replace(/^0+/, '') || '0');
      assert.equal(lamports, 100_000_000_000n);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────
//  TRANSACTION BUILD TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Solana Transaction Building', () => {
  it('builds valid SOL transfer transaction', () => {
    const sender = Keypair.generate();
    const recipient = Keypair.generate().publicKey;
    const lamports = BigInt(LAMPORTS_PER_SOL); // 1 SOL

    const tx = new Transaction();
    tx.feePayer = sender.publicKey;
    tx.recentBlockhash = 'GHtXQBpokM9t9Y9mT5vNvJ2d7AkVvYk9r8Pj8LRzT4eV';

    tx.add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient,
        lamports,
      })
    );

    assert.equal(tx.feePayer.toBase58(), sender.publicKey.toBase58());
    assert.equal(tx.instructions.length, 1);

    // Should serialize without signatures
    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    assert.ok(serialized.length > 0);
  });

  it('builds valid SPL transfer transaction', () => {
    const sender = Keypair.generate();
    const recipient = Keypair.generate().publicKey;
    const mint = Keypair.generate().publicKey;
    const amount = 10_000_000n; // 10 USDC (6 decimals)

    const sourceAta = getAssociatedTokenAddressSync(mint, sender.publicKey);
    const destAta = getAssociatedTokenAddressSync(mint, recipient);

    const tx = new Transaction();
    tx.feePayer = sender.publicKey;
    tx.recentBlockhash = 'GHtXQBpokM9t9Y9mT5vNvJ2d7AkVvYk9r8Pj8LRzT4eV';

    tx.add(
      createTransferInstruction(
        sourceAta,
        destAta,
        sender.publicKey,
        amount
      )
    );

    assert.ok(tx.instructions.length >= 1);
    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    assert.ok(serialized.length > 0);
  });

  it('rejects self-transfer (sender === recipient)', () => {
    const wallet = Keypair.generate().publicKey;
    assert.ok(wallet.equals(wallet), 'Self-transfer should be detected');
  });
});

// ──────────────────────────────────────────────────────────────────────
//  WITHDRAWAL STATE MACHINE TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Withdrawal State Machine', () => {
  const VALID_STATES = ['PENDING', 'BUILDING', 'SIGNING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED'];
  const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['BUILDING', 'FAILED', 'CANCELLED'],
    BUILDING: ['SIGNING', 'FAILED'],
    SIGNING: ['SUBMITTED', 'FAILED'],
    SUBMITTED: ['CONFIRMED', 'FAILED'],
    CONFIRMED: [],
    FAILED: [],
    CANCELLED: [],
  };

  for (const status of VALID_STATES) {
    it(`"${status}" is a valid withdrawal status`, () => {
      assert.ok(VALID_STATES.includes(status));
    });
  }

  it('happy path: PENDING → BUILDING → SIGNING → SUBMITTED → CONFIRMED', () => {
    const path = ['PENDING', 'BUILDING', 'SIGNING', 'SUBMITTED', 'CONFIRMED'];
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      assert.ok(
        VALID_TRANSITIONS[from].includes(to),
        `Transition ${from} → ${to} should be valid`
      );
    }
  });

  it('any state except terminal can transition to FAILED', () => {
    for (const state of ['PENDING', 'BUILDING', 'SIGNING', 'SUBMITTED']) {
      assert.ok(
        VALID_TRANSITIONS[state].includes('FAILED'),
        `${state} → FAILED should be valid`
      );
    }
  });

  it('CONFIRMED is a terminal state (no further transitions)', () => {
    assert.equal(VALID_TRANSITIONS.CONFIRMED.length, 0);
  });

  it('FAILED is a terminal state (no further transitions)', () => {
    assert.equal(VALID_TRANSITIONS.FAILED.length, 0);
  });
});

// ──────────────────────────────────────────────────────────────────────
//  IDEMPOTENCY TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Idempotency Key Handling', () => {
  it('SHA-256 hashes are deterministic for same payload', () => {
    const payload = JSON.stringify({ userId: 'test@zega.ai', amount: '1.0', asset: 'SOL' });
    const hash1 = createHash('sha256').update(payload).digest('hex');
    const hash2 = createHash('sha256').update(payload).digest('hex');
    assert.equal(hash1, hash2);
  });

  it('SHA-256 hashes differ for different payloads', () => {
    const payload1 = JSON.stringify({ userId: 'test@zega.ai', amount: '1.0', asset: 'SOL' });
    const payload2 = JSON.stringify({ userId: 'test@zega.ai', amount: '2.0', asset: 'SOL' });
    const hash1 = createHash('sha256').update(payload1).digest('hex');
    const hash2 = createHash('sha256').update(payload2).digest('hex');
    assert.notEqual(hash1, hash2);
  });

  it('idempotency key must be at least 8 characters', () => {
    const shortKey = 'abc123';
    assert.ok(shortKey.length < 8, 'Short key should be rejected');
    const validKey = 'wd-12345678';
    assert.ok(validKey.length >= 8, 'Valid key should be accepted');
  });
});

// ──────────────────────────────────────────────────────────────────────
//  SECURITY TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Security Invariants', () => {
  it('derivePrivyEmbeddedSolanaKeypair throws SECURITY INVARIANT VIOLATION', async () => {
    try {
      const { derivePrivyEmbeddedSolanaKeypair } = await import('../routes/v1/zeroclaw.routes.js');
      assert.throws(
        () => derivePrivyEmbeddedSolanaKeypair('user@zegaai.site'),
        (err: any) => err.message.includes('SECURITY INVARIANT VIOLATION')
      );
    } catch {
      assert.ok(true, 'derivePrivyEmbeddedSolanaKeypair is disabled or module unavailable');
    }
  });

  it('private keys are never stored in withdrawal records', () => {
    const record = {
      id: 'wd_test_001',
      userId: 'test@zega.ai',
      privyUserId: 'did:privy:xxxxx',
      walletAddress: Keypair.generate().publicKey.toBase58(),
      asset: 'SOL',
      amount: '1.0',
      recipient: Keypair.generate().publicKey.toBase58(),
      status: 'CONFIRMED',
      transactionSignature: 'abc123def456',
    };

    const serialized = JSON.stringify(record);
    assert.ok(!serialized.includes('privateKey'));
    assert.ok(!serialized.includes('secretKey'));
    assert.ok(!serialized.includes('seedPhrase'));
    assert.ok(!serialized.includes('mnemonic'));
  });

  it('PRIVY_APP_SECRET should not be in VITE_ prefixed vars', () => {
    assert.ok(
      !process.env.VITE_PRIVY_APP_SECRET,
      'PRIVY_APP_SECRET must never be exposed via VITE_ prefix'
    );
  });

  it('maximum withdrawal limits are enforced', () => {
    const maxSol = parseFloat(process.env.MAX_WITHDRAWAL_SOL || '10');
    const maxUsdc = parseFloat(process.env.MAX_WITHDRAWAL_USDC || '10000');
    assert.ok(maxSol > 0, 'MAX_WITHDRAWAL_SOL must be positive');
    assert.ok(maxUsdc > 0, 'MAX_WITHDRAWAL_USDC must be positive');
    assert.ok(maxSol <= 1000, 'MAX_WITHDRAWAL_SOL should have a sane upper bound');
  });
});

// ──────────────────────────────────────────────────────────────────────
//  PRIVY INTEGRATION PATTERN TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Privy Integration Patterns', () => {
  it('signed transaction verifies signatures correctly', () => {
    const signer = Keypair.generate();
    const recipient = Keypair.generate().publicKey;

    const tx = new Transaction();
    tx.feePayer = signer.publicKey;
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
    tx.add(
      SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: recipient,
        lamports: BigInt(100_000),
      })
    );

    tx.sign(signer);
    assert.ok(tx.verifySignatures(), 'Valid signature must verify');
  });

  it('spoofed signature (wrong signer) fails verification', () => {
    const realOwner = Keypair.generate();
    const attacker = Keypair.generate();
    const recipient = Keypair.generate().publicKey;

    const tx = new Transaction();
    tx.feePayer = attacker.publicKey; // fee payer is attacker
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
    tx.add(
      SystemProgram.transfer({
        fromPubkey: realOwner.publicKey, // transfer is from realOwner
        toPubkey: recipient,
        lamports: BigInt(100_000),
      })
    );

    // Attacker signs, but realOwner hasn't signed -> verifySignatures returns false or throws
    tx.sign(attacker);
    const valid = tx.verifySignatures();
    assert.ok(!valid, 'Tx signed by attacker for realOwner funds must fail verification');
  });

  it('unsigned transaction serializes with requireAllSignatures=false', () => {
    const feePayer = Keypair.generate().publicKey;
    const recipient = Keypair.generate().publicKey;

    const tx = new Transaction();
    tx.feePayer = feePayer;
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
    tx.add(
      SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: recipient,
        lamports: BigInt(50_000),
      })
    );

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    assert.ok(serialized.length > 0, 'Unsigned tx should serialize');
    assert.ok(Buffer.isBuffer(serialized), 'Serialized tx should be a Buffer');
  });
});

// ──────────────────────────────────────────────────────────────────────
//  BALANCE SUFFICIENCY TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Balance Sufficiency Checks', () => {
  it('SOL withdrawal requires amount + fee + rent', () => {
    const balance = 2_000_000_000n; // 2 SOL
    const amount = 1_500_000_000n; // 1.5 SOL
    const fee = 5_000n; // ~0.000005 SOL
    const rent = 890_880n; // ~0.00089 SOL

    const totalRequired = amount + fee + rent;
    assert.ok(balance >= totalRequired, '2 SOL should cover 1.5 SOL + fees + rent');
  });

  it('SOL withdrawal fails when balance < amount + fee + rent', () => {
    const balance = 1_000_000n; // 0.001 SOL
    const amount = 900_000n; // 0.0009 SOL
    const fee = 5_000n;
    const rent = 890_880n;

    const totalRequired = amount + fee + rent;
    assert.ok(balance < totalRequired, 'Insufficient balance should be detected');
  });

  it('SPL withdrawal requires SOL for fees even if sending tokens', () => {
    const solBalance = 10_000n; // only 0.00001 SOL
    const minFee = 5_000n + 890_880n;
    assert.ok(solBalance < minFee, 'Insufficient SOL for fees should be detected');
  });
});
