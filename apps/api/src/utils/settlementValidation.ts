/**
 * ⚡ ZEGA Settlement Validation Utility Module
 *
 * Extracted, importable validation functions for the 5-layer deterministic
 * settlement pipeline. Used by both the production route handler AND the
 * automated test suite — ensuring tests exercise the EXACT same logic
 * that runs in production.
 *
 * @module settlementValidation
 */

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

/** Valid USDC SPL token mint addresses (Devnet + Mainnet) */
export const VALID_USDC_MINTS = [
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
  'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet USDC Alt
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
];

/** Base58 character set regex (excludes 0, O, I, l) */
const BASE58_REGEX = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

/** Maximum transaction age in seconds (72 hours) */
const MAX_TX_AGE_SECONDS = 72 * 60 * 60;

/** OWASP Anti-Prompt-Injection regex patterns */
export const INJECTION_PATTERNS: RegExp[] = [
  /override\s+safety/i,
  /prompt\s+override/i,
  /grant\s+admin\s+access/i,
  /bypass\s+safety/i,
  /bypass\s+approval/i,
  /refund\s+without\s+verification/i,
  /force\s+payout/i,
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /transfer\s+all\s+funds/i,
  /system\s+prompt\s+(leak|override)/i,
  /disregard\s+(all\s+)?prior\s+instructions/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /bypass\s+security\s+layer/i,
  /fake\s+settlement/i,
  /mark\s+as\s+paid\s+without\s+tx/i,
  /reveal\s+private\s+key/i,
  /dump\s+environment\s+variables/i,
];

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  ok: boolean;
  layer?: string;
  error?: string;
}

/**
 * Layer 2: Validate Solana transaction signature format (Base58, 80-92 chars).
 * Rejects synthetic prefixes (sol_, gen_inv_) and invalid characters.
 */
export function validateSignatureFormat(txSignature: string | undefined): ValidationResult {
  if (!txSignature || typeof txSignature !== 'string') {
    return { ok: false, layer: 'MISSING_SIGNATURE', error: 'Signature missing' };
  }

  const cleanSig = txSignature.trim();

  if (
    cleanSig.startsWith('sol_') ||
    cleanSig.startsWith('gen_inv_') ||
    cleanSig.length < 80 ||
    cleanSig.length > 92 ||
    !BASE58_REGEX.test(cleanSig)
  ) {
    return { ok: false, layer: 'BASE58_FORMAT', error: 'Invalid Base58 signature format' };
  }

  return { ok: true };
}

/**
 * Layer 5: Validate SPL token mint address against known USDC mints.
 * Returns ok:true if mint is null (SOL transfer) or matches a valid USDC mint.
 */
export function validateUsdcMint(mint: string | null): ValidationResult {
  if (mint && !VALID_USDC_MINTS.includes(mint)) {
    return { ok: false, layer: 'SPL_MINT_MISMATCH', error: `Invalid token mint: ${mint}` };
  }
  return { ok: true };
}

/**
 * Layer 5: Validate transaction freshness — reject transactions older than 72 hours.
 */
export function validateTxFreshness(txBlockTime: number | null): ValidationResult {
  if (txBlockTime) {
    const txAge = Date.now() / 1000 - txBlockTime;
    if (txAge > MAX_TX_AGE_SECONDS) {
      return { ok: false, layer: 'TX_FRESHNESS', error: `Transaction too old: ${Math.floor(txAge / 3600)} hours` };
    }
  }
  return { ok: true };
}

/**
 * OWASP Prompt Injection Detection.
 * Scans input text against 16 regex patterns for known injection phrases.
 */
export function detectPromptInjection(prompt: string): { blocked: boolean; matchedPattern?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return { blocked: true, matchedPattern: pattern.source };
    }
  }
  return { blocked: false };
}
