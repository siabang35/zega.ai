import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ZEGA.AI — Phase 2 Strict Tenant Isolation Adversarial Test Suite
 *
 * Validates P2 hardening invariants:
 *   P2-01: Financial routes enforce authentication + tenant context
 *   P2-02: Financial routes use principal-derived userId (no client trust)
 *   P2-03: Idempotency keys are tenant-scoped
 *   P2-04: Rate limiter has tenant-scoped method
 *   P2-05: Agent cache uses tenant-scoped keys
 *   P2-06: Storage routes enforce tenant context
 *   P2-07: Authorization control flow verified clean
 *   P2-08: Adversarial fail-closed matrix assertions
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

// ═══════════════════════════════════════════════════════════════════
// P2-01: Financial Route Authentication Enforcement
// ═══════════════════════════════════════════════════════════════════

describe('P2-01: Financial Routes Enforce Auth + Tenant Context', () => {
  const paymentSrc = readSource('../routes/v1/payment.routes.ts');
  const invoiceSrc = readSource('../routes/v1/invoice.routes.ts');
  const withdrawalSrc = readSource('../routes/v1/withdrawal.routes.ts');
  const transactionSrc = readSource('../routes/v1/transaction.routes.ts');
  const walletSrc = readSource('../routes/v1/wallet.routes.ts');

  it('payment.routes requires jwtVerify', () => {
    assert.ok(paymentSrc.includes('jwtVerify'), 'payment.routes must enforce JWT');
  });
  it('payment.routes requires requireTenantContext', () => {
    assert.ok(paymentSrc.includes('requireTenantContext'), 'payment.routes must enforce tenant context');
  });
  it('payment.routes verifies invoice tenant before processing', () => {
    assert.ok(paymentSrc.includes('verifyTenantAccess'), 'payment.routes must check invoice org ownership');
  });

  it('invoice.routes requires jwtVerify', () => {
    assert.ok(invoiceSrc.includes('jwtVerify'), 'invoice.routes must enforce JWT');
  });
  it('invoice.routes requires requireTenantContext', () => {
    assert.ok(invoiceSrc.includes('requireTenantContext'), 'invoice.routes must enforce tenant context');
  });
  it('invoice.routes does NOT contain dev fallback user', () => {
    assert.ok(
      !invoiceSrc.includes("'user@zegaai.site'"),
      'invoice.routes must NOT have dev fallback user identity'
    );
  });
  it('invoice.routes verifies org before returning invoice', () => {
    assert.ok(invoiceSrc.includes('verifyTenantAccess'), 'invoice.routes must verify org on GET');
  });

  it('withdrawal.routes requires jwtVerify', () => {
    assert.ok(withdrawalSrc.includes('jwtVerify'), 'withdrawal.routes must enforce JWT');
  });
  it('withdrawal.routes requires requireTenantContext', () => {
    assert.ok(withdrawalSrc.includes('requireTenantContext'), 'withdrawal.routes must enforce tenant context');
  });

  it('transaction.routes requires jwtVerify', () => {
    assert.ok(transactionSrc.includes('jwtVerify'), 'transaction.routes must enforce JWT');
  });
  it('transaction.routes requires requireTenantContext', () => {
    assert.ok(transactionSrc.includes('requireTenantContext'), 'transaction.routes must enforce tenant context');
  });
  it('transaction.routes does NOT trust client-supplied userId', () => {
    assert.ok(
      !transactionSrc.includes("x-user-id") && !transactionSrc.includes("x-user-email"),
      'transaction.routes must NOT read userId from x-user-id/x-user-email headers'
    );
    assert.ok(
      !transactionSrc.includes("(req.body as any)?.userId") && !transactionSrc.includes("(req.query as any)?.userId"),
      'transaction.routes must NOT read userId from body or query'
    );
  });

  it('wallet.routes requires jwtVerify', () => {
    assert.ok(walletSrc.includes('jwtVerify'), 'wallet.routes must enforce JWT');
  });
  it('wallet.routes requires requireTenantContext', () => {
    assert.ok(walletSrc.includes('requireTenantContext'), 'wallet.routes must enforce tenant context');
  });
  it('wallet.routes does NOT contain dev fallback user', () => {
    assert.ok(
      !walletSrc.includes("'user@zegaai.site'"),
      'wallet.routes must NOT have dev fallback user identity'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-02: Principal-Derived Identity (No Client Trust)
// ═══════════════════════════════════════════════════════════════════

describe('P2-02: Financial Routes Use Principal-Derived Identity', () => {
  const transactionSrc = readSource('../routes/v1/transaction.routes.ts');
  const invoiceSrc = readSource('../routes/v1/invoice.routes.ts');
  const withdrawalSrc = readSource('../routes/v1/withdrawal.routes.ts');
  const walletSrc = readSource('../routes/v1/wallet.routes.ts');

  it('transaction.routes derives userId from principal', () => {
    assert.ok(
      transactionSrc.includes('request.principal') || transactionSrc.includes('principal?.email'),
      'Must derive userId from authenticated principal'
    );
  });

  it('invoice.routes derives userId from principal', () => {
    assert.ok(invoiceSrc.includes('principal.userId') || invoiceSrc.includes('principal?.userId'), 'Must use principal.userId');
  });

  it('withdrawal.routes derives userId from principal', () => {
    assert.ok(withdrawalSrc.includes('principal.email') || withdrawalSrc.includes('principal.userId'), 'Must use principal identity');
  });

  it('wallet.routes derives userId from principal', () => {
    assert.ok(walletSrc.includes('principal.email') || walletSrc.includes('principal.userId'), 'Must use principal identity');
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-03: Idempotency Keys Tenant-Scoped
// ═══════════════════════════════════════════════════════════════════

describe('P2-03: Idempotency Service Tenant-Scoped Keys', () => {
  const idempSrc = readSource('../services/idempotencyService.ts');

  it('checkIdempotency accepts organizationId parameter', () => {
    assert.ok(
      idempSrc.includes('checkIdempotency(key: string, requestHash: string, organizationId'),
      'checkIdempotency must accept organizationId'
    );
  });

  it('saveIdempotency accepts organizationId parameter', () => {
    assert.ok(
      idempSrc.includes('organizationId?: string'),
      'saveIdempotency must accept organizationId'
    );
  });

  it('DB query filters by organization_id when provided', () => {
    assert.ok(
      idempSrc.includes("query.eq('organization_id', organizationId)"),
      'Must filter DB query by organization_id'
    );
  });

  it('Memory map key is org-scoped', () => {
    assert.ok(
      idempSrc.includes('`${organizationId}:${key}`'),
      'Memory map key must be prefixed with organizationId'
    );
  });

  it('DB insert includes organization_id', () => {
    assert.ok(
      idempSrc.includes('organization_id: organizationId'),
      'Upsert must include organization_id column'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-04: Rate Limiter Tenant-Scoped Method
// ═══════════════════════════════════════════════════════════════════

describe('P2-04: Rate Limiter Tenant Isolation', () => {
  const rateSrc = readSource('../services/rateLimiterService.ts');

  it('RateLimiterService exports checkTenantRateLimit', () => {
    assert.ok(
      rateSrc.includes('checkTenantRateLimit'),
      'Must provide checkTenantRateLimit method'
    );
  });

  it('checkTenantRateLimit uses getTenantKey internally', () => {
    assert.ok(
      rateSrc.includes('this.getTenantKey(organizationId, endpoint)'),
      'checkTenantRateLimit must delegate to getTenantKey'
    );
  });

  it('checkTenantRateLimit denies on missing org (fail-closed)', () => {
    assert.ok(
      rateSrc.includes('if (!organizationId)'),
      'Must check for missing organizationId'
    );
    assert.ok(
      rateSrc.includes('allowed: false'),
      'Must return allowed:false when org is missing'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-05: Agent Cache Tenant-Scoped Keys
// ═══════════════════════════════════════════════════════════════════

describe('P2-05: Agent Cache Tenant Isolation', () => {
  const agentSrc = readSource('../routes/v1/agent.routes.ts');

  it('Agent routes require requireTenantContext', () => {
    assert.ok(
      agentSrc.includes('requireTenantContext'),
      'Agent routes must enforce tenant context'
    );
  });

  it('Agent cache key includes organizationId', () => {
    assert.ok(
      agentSrc.includes('`${record.organizationId}:${agentRouteId}`') ||
      agentSrc.includes('`${organizationId}:${agentRouteId}`'),
      'Agent cache key must be org-prefixed'
    );
  });

  it('resolveAgent accepts organizationId parameter', () => {
    assert.ok(
      agentSrc.includes('resolveAgent(agentRouteId: string, organizationId'),
      'resolveAgent must accept organizationId for scoped lookup'
    );
  });

  it('Agent routes use getTenantOrg for cache lookups', () => {
    assert.ok(
      agentSrc.includes('getTenantOrg(request)'),
      'Agent routes must derive org from tenant context'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-06: Storage Routes Enforce Tenant Context
// ═══════════════════════════════════════════════════════════════════

describe('P2-06: Storage Routes Tenant Enforcement', () => {
  const storageSrc = readSource('../routes/v1/storage.routes.ts');

  it('Storage upload route requires requireTenantContext', () => {
    assert.ok(
      storageSrc.includes('requireTenantContext'),
      'Storage routes must enforce tenant context'
    );
  });

  it('Storage upload does NOT fall back to bare path', () => {
    // Must not have a fallback to bare 'images' without any user/org scope
    const lines = storageSrc.split('\n');
    let hasBareImagesFallback = false;
    for (const line of lines) {
      // Check for bare fallback like: : 'images'
      if (line.trim() === ": 'images';") hasBareImagesFallback = true;
    }
    assert.ok(!hasBareImagesFallback, 'Storage must NOT fall back to bare "images" path');
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-07: Authorization Control Flow — No Superadmin Bypass
// ═══════════════════════════════════════════════════════════════════

describe('P2-07: Authorization — Verified Clean', () => {
  const authSrc = readSource('../middleware/authorization.ts');

  it('verifyTenantAccess has no superadmin bypass in executable code', () => {
    const fnStart = authSrc.indexOf('export function verifyTenantAccess');
    const fnEnd = authSrc.indexOf('export function', fnStart + 1);
    const fnBody = authSrc.slice(fnStart, fnEnd > fnStart ? fnEnd : authSrc.length);

    // Check for actual bypass patterns in code, not in JSDoc comments
    assert.ok(
      !fnBody.includes("role === 'superadmin') return true"),
      'verifyTenantAccess must not have superadmin shortcut return'
    );
    assert.ok(
      !fnBody.includes("isSuperadmin(request)) return true"),
      'verifyTenantAccess must not call isSuperadmin to bypass'
    );
  });

  it('verifyOwnership has no superadmin bypass in executable code', () => {
    const fnStart = authSrc.indexOf('export function verifyOwnership');
    const fnEnd = authSrc.indexOf('export function', fnStart + 1);
    const fnBody = authSrc.slice(fnStart, fnEnd > fnStart ? fnEnd : authSrc.length);

    // Check for actual bypass patterns in code, not in JSDoc comments
    assert.ok(
      !fnBody.includes("role === 'superadmin') return true"),
      'verifyOwnership must not have superadmin shortcut return'
    );
    assert.ok(
      !fnBody.includes("isSuperadmin(request)) return true"),
      'verifyOwnership must not call isSuperadmin to bypass'
    );
  });

  it('Break-glass module exists', () => {
    const bgPath = resolve(__dirname, '../middleware/breakGlass.ts');
    assert.ok(existsSync(bgPath), 'breakGlass.ts must exist');
  });
});

// ═══════════════════════════════════════════════════════════════════
// P2-08: Adversarial Fail-Closed Matrix
// ═══════════════════════════════════════════════════════════════════

describe('P2-08: Adversarial Fail-Closed Assertions', () => {
  const authSrc = readSource('../middleware/authorization.ts');
  const reqCtxSrc = readSource('../middleware/requestContext.ts');

  it('ATK-02: Body org_id/organization_id stripped by middleware', () => {
    assert.ok(
      reqCtxSrc.includes("delete (request.body"),
      'Middleware must strip client-supplied tenant IDs from body'
    );
  });

  it('ATK-14: Missing org context on financial route = DENY', () => {
    assert.ok(
      reqCtxSrc.includes("'NO_TENANT_CONTEXT'"),
      'requireTenantContext must return NO_TENANT_CONTEXT error code'
    );
  });

  it('ATK-15: NULL resource organization = DENY', () => {
    assert.ok(
      authSrc.includes("if (!resourceOrgId)"),
      'verifyTenantAccess must deny when resource org is null'
    );
  });

  it('ATK-11: Superadmin without break-glass = DENY', () => {
    // Verify that isSuperadmin() does NOT appear inside verifyTenantAccess
    const fnStart = authSrc.indexOf('export function verifyTenantAccess');
    const fnEnd = authSrc.indexOf('}', authSrc.indexOf('return true', fnStart));
    const fnBody = authSrc.slice(fnStart, fnEnd + 1);

    assert.ok(!fnBody.includes('isSuperadmin'), 'verifyTenantAccess must not call isSuperadmin');
  });

  it('ATK-07: Idempotency replay across tenants = MISS', () => {
    const idempSrc = readSource('../services/idempotencyService.ts');
    // Different org prefix on key = different memory map entry = MISS
    assert.ok(
      idempSrc.includes('`${organizationId}:${key}`'),
      'Idempotency keys must be org-scoped to prevent cross-tenant replay'
    );
  });

  it('ATK-16: Tenant A flooding cannot throttle Tenant B', () => {
    const rateSrc = readSource('../services/rateLimiterService.ts');
    assert.ok(
      rateSrc.includes('`org:${organizationId}:${key}`'),
      'Rate limiter keys must include org prefix for tenant isolation'
    );
  });

  it('ATK-01/05/06: Cross-tenant resource access = DENY', () => {
    // verifyTenantAccess returns false on mismatch
    assert.ok(
      authSrc.includes('principal.organizationId !== resourceOrgId'),
      'Must deny when principal org does not match resource org'
    );
    assert.ok(
      authSrc.includes("'cross_tenant_access_denied'"),
      'Must log cross-tenant access attempts'
    );
  });
});
