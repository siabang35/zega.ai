import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ZEGA AI — Security Hardening Audit Test Suite
 *
 * Static analysis tests verifying the security remediations from the
 * full-repository security audit (S-01 through S-21).
 * Tests scan actual source files for banned patterns and required patterns.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Source file not found: ${fullPath}`);
  }
  return readFileSync(fullPath, 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════════════
// S-02: No client-org fallback in requestContext
// ═══════════════════════════════════════════════════════════════════════════
describe('S-02: No client-org-${userId} fallback', () => {
  const src = readSource('../middleware/requestContext.ts');

  it('requestContext.ts does NOT contain client-org- pattern', () => {
    assert.ok(
      !src.includes('client-org-'),
      'CRITICAL: requestContext.ts still contains client-org- fallback. This allows unverified tenant context creation.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-03: No default user for unknown payment recipients
// ═══════════════════════════════════════════════════════════════════════════
describe('S-03: No user@zegaai.site default', () => {
  const src = readSource('../services/PaymentDetectionService.ts');

  it('PaymentDetectionService does NOT contain user@zegaai.site', () => {
    assert.ok(
      !src.includes('user@zegaai.site'),
      'CRITICAL: PaymentDetectionService still uses default user@zegaai.site for unknown recipients.'
    );
  });

  it('PaymentDetectionService throws on unknown recipient', () => {
    assert.ok(
      src.includes('PAYMENT_RECIPIENT_UNKNOWN'),
      'Must throw PAYMENT_RECIPIENT_UNKNOWN when recipient wallet is not registered.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-04: No positional account key assumptions in Solana parsing
// ═══════════════════════════════════════════════════════════════════════════
describe('S-04: Instruction-based Solana transaction parsing', () => {
  const src = readSource('../services/solanaTransactionService.ts');

  it('parseAndVerifyTransaction does NOT use positional accountKeys[0]', () => {
    // Find the parseAndVerifyTransaction function
    const fnStart = src.indexOf('export async function parseAndVerifyTransaction');
    const fnBody = src.slice(fnStart, src.indexOf('}\n\n', fnStart + 100) + 1);

    assert.ok(
      !fnBody.includes('accountKeys[0]'),
      'CRITICAL: Solana parser still uses positional accountKeys[0] as sender.'
    );
    assert.ok(
      !fnBody.includes('accountKeys[1]'),
      'CRITICAL: Solana parser still uses positional accountKeys[1] as recipient.'
    );
  });

  it('parseAndVerifyTransaction parses instruction data', () => {
    assert.ok(
      src.includes("ix.program === 'system'"),
      'Must parse SystemProgram instructions for SOL transfers.'
    );
    assert.ok(
      src.includes("ix.program === 'spl-token'"),
      'Must parse spl-token instructions for SPL transfers.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-05: UUID-based financial identity (no email preference)
// ═══════════════════════════════════════════════════════════════════════════
describe('S-05: UUID-based financial identity', () => {
  const withdrawSrc = readSource('../routes/v1/withdrawal.routes.ts');
  const walletSrc = readSource('../routes/v1/wallet.routes.ts');

  it('withdrawal.routes does NOT use principal.email || principal.userId', () => {
    assert.ok(
      !withdrawSrc.includes('principal.email || principal.userId'),
      'withdrawal.routes.ts still prefers email over UUID for financial identity.'
    );
  });

  it('wallet.routes does NOT use principal.email || principal.userId', () => {
    assert.ok(
      !walletSrc.includes('principal.email || principal.userId'),
      'wallet.routes.ts still prefers email over UUID for financial identity.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-06: LedgerService requires organizationId
// ═══════════════════════════════════════════════════════════════════════════
describe('S-06: LedgerService tenant-scoped', () => {
  const src = readSource('../services/LedgerService.ts');

  it('LedgerService recordCredit requires organizationId', () => {
    assert.ok(
      src.includes('organizationId: string'),
      'recordCredit must require organizationId parameter.'
    );
  });

  it('LedgerService inserts organization_id to ledger_entries', () => {
    assert.ok(
      src.includes('organization_id: organizationId'),
      'Must insert organization_id into ledger_entries table.'
    );
  });

  it('LedgerService does NOT create in-memory fallback entries', () => {
    assert.ok(
      !src.includes("id: `led_${Date.now()}`"),
      'Must not create in-memory fallback ledger entries.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-08: No fuzzy invoice matching
// ═══════════════════════════════════════════════════════════════════════════
describe('S-08: No fuzzy invoice matching', () => {
  const src = readSource('../services/PaymentDetectionService.ts');

  it('PaymentDetectionService does NOT fuzzy-match by amount', () => {
    assert.ok(
      !src.includes('parseFloat(inv.amount) <= parseFloat(amount)'),
      'Must not fuzzy-match invoices by amount comparison.'
    );
  });

  it('PaymentDetectionService does NOT iterate pending invoices for matching', () => {
    assert.ok(
      !src.includes('listUserInvoices'),
      'Must not use listUserInvoices for fuzzy invoice matching.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-09: Withdrawal state machine validation
// ═══════════════════════════════════════════════════════════════════════════
describe('S-09: Withdrawal state transition validation', () => {
  const src = readSource('../services/WithdrawalService.ts');

  it('WithdrawalService has VALID_TRANSITIONS map', () => {
    assert.ok(
      src.includes('VALID_TRANSITIONS'),
      'Must define VALID_TRANSITIONS state machine map.'
    );
  });

  it('updateWithdrawalStatus validates transitions', () => {
    assert.ok(
      src.includes('INVALID_STATE_TRANSITION'),
      'Must throw INVALID_STATE_TRANSITION for invalid status changes.'
    );
  });

  it('CONFIRMED is a terminal state', () => {
    assert.ok(
      src.includes("CONFIRMED: []"),
      'CONFIRMED must be a terminal state with no further transitions.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-11: Reconciliation distributed locking
// ═══════════════════════════════════════════════════════════════════════════
describe('S-11: Reconciliation advisory locking', () => {
  const src = readSource('../services/ReconciliationService.ts');

  it('ReconciliationService acquires advisory lock', () => {
    assert.ok(
      src.includes('pg_try_advisory_lock'),
      'Must acquire pg_try_advisory_lock before reconciliation.'
    );
  });

  it('ReconciliationService releases advisory lock in finally', () => {
    assert.ok(
      src.includes('pg_advisory_unlock'),
      'Must release advisory lock in finally block.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-12: Tool registry tenant validation
// ═══════════════════════════════════════════════════════════════════════════
describe('S-12: Tool registry tenant-scoped storeId', () => {
  const src = readSource('../services/ai/toolRegistry.ts');

  it('executeTool validates storeId against tenantId', () => {
    assert.ok(
      src.includes('TENANT_ISOLATION_VIOLATION'),
      'Must reject storeId that does not belong to tenantId.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-14: CI security scanning covers entire repo
// ═══════════════════════════════════════════════════════════════════════════
describe('S-14: CI security gates', () => {
  const ciPath = resolve(__dirname, '../../../../.github/workflows/ci.yml');

  it('CI workflow exists', () => {
    assert.ok(existsSync(ciPath), 'CI workflow file must exist');
  });

  const ciSrc = readFileSync(ciPath, 'utf-8');

  it('CI scans entire repo, not just apps/web/src', () => {
    assert.ok(
      !ciSrc.includes("-- 'apps/web/src'"),
      'CI secret scan must NOT be limited to apps/web/src only.'
    );
  });

  it('CI includes type-check step', () => {
    assert.ok(
      ciSrc.includes('type-check') || ciSrc.includes('type_check'),
      'CI must include TypeScript type-check step.'
    );
  });

  it('CI includes test step', () => {
    assert.ok(
      ciSrc.includes('pnpm --filter @zega/api test') || ciSrc.includes('Run Security Test Suite'),
      'CI must include test execution step.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-16: JWT verification (no decode fallback)
// ═══════════════════════════════════════════════════════════════════════════
describe('S-16: JWT verification only', () => {
  const src = readSource('../middleware/requestContext.ts');

  it('requestContext.ts does NOT use jwt.decode for principal extraction', () => {
    assert.ok(
      !src.includes('jwt.decode(token)'),
      'Must not use jwt.decode for principal extraction — only jwt.verify is acceptable.'
    );
  });

  it('requestContext.ts uses jwt.verify', () => {
    assert.ok(
      src.includes('jwt.verify(token)'),
      'Must use jwt.verify for token verification.'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S-20: listUserWithdrawals uses UUID, not normalizeEmail
// ═══════════════════════════════════════════════════════════════════════════
describe('S-20: listUserWithdrawals uses UUID identity', () => {
  const src = readSource('../services/WithdrawalService.ts');

  it('listUserWithdrawals does NOT use normalizeEmail', () => {
    // Find the function
    const fnStart = src.indexOf('listUserWithdrawals');
    const fnBody = src.slice(fnStart, src.indexOf('}', fnStart + 100) + 1);

    assert.ok(
      !fnBody.includes('normalizeEmail'),
      'listUserWithdrawals must use UUID directly, not normalizeEmail.'
    );
  });
});
