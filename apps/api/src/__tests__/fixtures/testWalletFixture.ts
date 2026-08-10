import { Keypair } from '@solana/web3.js';
import { createHash } from 'node:crypto';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * DEVNET TEST FIXTURE — DISAMBIGUATED TEST WALLET GENERATOR
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EXPLICIT TEST UTILITY ONLY ⚠️
 * This module is STRICTLY FOR AUTOMATED REGRESSION & INTEGRATION TESTS.
 * It MUST NEVER be imported or invoked by production wallet services.
 *
 * Production wallets MUST be provisioned/managed by authentic Privy integration
 * and stored as public metadata (`privy_wallets` table in Supabase).
 * ═══════════════════════════════════════════════════════════════════════
 */

export class DevnetTestWallet {
  /**
   * Deterministically derives a 32-byte seed for devnet test keypairs.
   * FOR TEST FIXTURES ONLY.
   */
  public static deriveDevnetTest32Seed(emailOrAddress?: string): Uint8Array {
    const raw = (emailOrAddress || 'test_user@zegaai.site').toLowerCase().trim();
    const seedStr = `zega_devnet_test_fixture_seed_v1_${raw}`;
    const hash = createHash('sha256').update(seedStr).digest();
    return new Uint8Array(hash);
  }

  /**
   * Derives a full signing Keypair for test suite execution.
   * FOR TEST FIXTURES ONLY.
   */
  public static deriveDevnetTestKeypair(emailOrPubkey?: string): Keypair {
    const seed32 = this.deriveDevnetTest32Seed(emailOrPubkey);
    return Keypair.fromSeed(seed32);
  }

  /**
   * Derives a Solana Base58 public key string for test suite assertions.
   * FOR TEST FIXTURES ONLY.
   */
  public static deriveDevnetTestWalletAddress(email?: string): string {
    const keypair = this.deriveDevnetTestKeypair(email);
    return keypair.publicKey.toBase58();
  }
}
