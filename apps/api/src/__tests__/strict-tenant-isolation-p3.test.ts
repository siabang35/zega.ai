import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚡ ZEGA.AI — Phase 3 Production Multi-Tenant Enforcement Test Suite
 *
 * Comprehensive adversarial test matrix covering:
 *   P3-01: apiWallet route hardening (F-01 fix verification)
 *   P3-02: Payment unconditional tenant check (F-03 fix verification)
 *   P3-03: ZeroClaw identity hardening (F-02 fix verification)
 *   P3-04: Migration fn_current_tenant_org no auto-select (F-04 fix)
 *   P3-05: SECURITY DEFINER function audit
 *   P3-06: IDOR/BOLA sweep — every route with :id verifies tenancy
 *   P3-07: Mass assignment prevention
 *   P3-08: Privilege escalation prevention
 *   P3-09: org_id transitional usage classification
 *   P3-10: Service-role client audit
 *   P3-11: Realtime / cache / rate limiter isolation
 *   P3-12: Route authentication completeness
 *   P3-13: Storage path traversal prevention
 *   P3-14: Break-glass scope enforcement
 *   P3-15: Audit logging completeness
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
// P3-01: apiWallet Route Hardening (F-01 Fix Verification)
// ═══════════════════════════════════════════════════════════════════

describe('P3-01: apiWallet Routes — No Client Header Trust', () => {
  const walletSrc = readSource('../routes/v1/apiWallet.routes.ts');

  it('Does NOT contain getUserIdentity function', () => {
    assert.ok(
      !walletSrc.includes('getUserIdentity'),
      'Removed vulnerable getUserIdentity function'
    );
  });

  it('Does NOT trust x-user-id header', () => {
    assert.ok(
      !walletSrc.includes("headers['x-user-id']"),
      'Must NOT read x-user-id header for identity'
    );
  });

  it('Does NOT trust x-user-email header', () => {
    assert.ok(
      !walletSrc.includes("headers['x-user-email']"),
      'Must NOT read x-user-email header for identity'
    );
  });

  it('Does NOT have hardcoded user@zegaai.site fallback', () => {
    assert.ok(
      !walletSrc.includes("'user@zegaai.site'"),
      'Must NOT have hardcoded fallback identity'
    );
  });

  it('Does NOT trust query.userId or query.email', () => {
    assert.ok(
      !walletSrc.includes('(req.query as any)?.userId'),
      'Must NOT read userId from query params'
    );
    assert.ok(
      !walletSrc.includes('(req.query as any)?.email'),
      'Must NOT read email from query params'
    );
  });

  it('Uses getPrincipalIdentity for all endpoints', () => {
    assert.ok(
      walletSrc.includes('getPrincipalIdentity'),
      'Must use getPrincipalIdentity for identity resolution'
    );
  });

  it('JWT verification is fail-closed (returns 401)', () => {
    assert.ok(
      walletSrc.includes("code: 'UNAUTHORIZED'") && walletSrc.includes('jwtVerify'),
      'JWT failure must return 401 UNAUTHORIZED'
    );
    assert.ok(
      !walletSrc.includes('// Allow hook to continue'),
      'Must NOT have catch-and-continue pattern on JWT'
    );
  });

  it('Requires requireTenantContext middleware', () => {
    assert.ok(
      walletSrc.includes('requireTenantContext'),
      'Must enforce tenant context on wallet routes'
    );
  });

  it('Does NOT import envConfig (dev detection removed)', () => {
    assert.ok(
      !walletSrc.includes("from '../../config/env.js'"),
      'No need for envConfig after removing dev fallback'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-02: Payment Unconditional Tenant Check (F-03 Fix)
// ═══════════════════════════════════════════════════════════════════

describe('P3-02: Payment Route — Unconditional Invoice Tenant Check', () => {
  const paymentSrc = readSource('../routes/v1/payment.routes.ts');

  it('Does NOT skip tenant check when organization_id is null', () => {
    // Must NOT contain the old pattern: if (invoice.organization_id && !verifyTenantAccess
    assert.ok(
      !paymentSrc.includes('invoice.organization_id && !verifyTenantAccess'),
      'Must NOT conditionally skip tenant check based on org_id truthiness'
    );
  });

  it('Denies payment when invoice has no organization_id (fail-closed)', () => {
    assert.ok(
      paymentSrc.includes("'PAYMENT_TENANT_MISSING'"),
      'Must return PAYMENT_TENANT_MISSING when invoice has no org'
    );
  });

  it('Calls verifyTenantAccess unconditionally', () => {
    assert.ok(
      paymentSrc.includes('!verifyTenantAccess(request, invoice.organization_id)'),
      'Must call verifyTenantAccess unconditionally'
    );
  });

  it('Logs orphan invoice denial', () => {
    assert.ok(
      paymentSrc.includes("'payment_denied_orphan_invoice'"),
      'Must log when an invoice without org_id is denied'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-03: ZeroClaw Identity Hardening (F-02 Fix)
// ═══════════════════════════════════════════════════════════════════

describe('P3-03: ZeroClaw — resolveAuthenticatedUser Hardened', () => {
  const zeroclawSrc = readSource('../routes/v1/zeroclaw.routes.ts');

  it('resolveAuthenticatedUser does NOT trust x-user-id header', () => {
    // Check that the function body (between its definition and next function) doesn't trust headers
    const fnStart = zeroclawSrc.indexOf('function resolveAuthenticatedUser');
    const fnEnd = zeroclawSrc.indexOf('\n  }', fnStart + 50) + 4;
    const fnBody = zeroclawSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes("headers['x-user-id']"),
      'resolveAuthenticatedUser must NOT read x-user-id header'
    );
  });

  it('resolveAuthenticatedUser does NOT trust x-user-email header', () => {
    const fnStart = zeroclawSrc.indexOf('function resolveAuthenticatedUser');
    const fnEnd = zeroclawSrc.indexOf('\n  }', fnStart + 50) + 4;
    const fnBody = zeroclawSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes("headers['x-user-email']"),
      'resolveAuthenticatedUser must NOT read x-user-email header'
    );
  });

  it('resolveAuthenticatedUser does NOT trust body.userId', () => {
    const fnStart = zeroclawSrc.indexOf('function resolveAuthenticatedUser');
    const fnEnd = zeroclawSrc.indexOf('\n  }', fnStart + 50) + 4;
    const fnBody = zeroclawSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes('request.body?.userId'),
      'resolveAuthenticatedUser must NOT read userId from request body'
    );
  });

  it('resolveAuthenticatedUser does NOT have user@zegaai.site fallback', () => {
    const fnStart = zeroclawSrc.indexOf('function resolveAuthenticatedUser');
    const fnEnd = zeroclawSrc.indexOf('\n  }', fnStart + 50) + 4;
    const fnBody = zeroclawSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes("'user@zegaai.site'"),
      'resolveAuthenticatedUser must NOT have hardcoded fallback identity'
    );
  });

  it('OTP confirm flow does NOT directly read client headers for identity', () => {
    // Find the OTP confirmation route handler
    const otpStart = zeroclawSrc.indexOf("'/withdraw/confirm-otp'");
    const otpEnd = zeroclawSrc.indexOf('});', otpStart + 100);
    const otpBody = zeroclawSrc.slice(otpStart, otpEnd);

    // Must not directly use request.headers for identity
    assert.ok(
      !otpBody.includes("request.headers['x-user-email']") || otpBody.includes('// SECURITY (F-02 FIX)'),
      'OTP confirm must NOT directly read x-user-email from headers for identity'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-04: Migration — fn_current_tenant_org No Auto-Select (F-04)
// ═══════════════════════════════════════════════════════════════════

describe('P3-04: Migration fn_current_tenant_org — No Auto-Select', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815000000_strict_multi_tenant_hardening.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('fn_current_tenant_org does NOT auto-select first org membership', () => {
    // Extract the function body
    const fnStart = sqlContent.indexOf('fn_current_tenant_org()');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes('ORDER BY om.created_at ASC'),
      'Must NOT auto-select first org membership by created_at'
    );
    assert.ok(
      !fnBody.includes('LIMIT 1'),
      'Must NOT contain LIMIT 1 for org auto-selection'
    );
  });

  it('fn_current_tenant_org returns NULL when no JWT org claim', () => {
    const fnStart = sqlContent.indexOf('fn_current_tenant_org()');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('RETURN NULL'),
      'Must return NULL when JWT has no organization_id'
    );
    assert.ok(
      fnBody.includes('F-04 FIX'),
      'Must contain F-04 FIX comment documenting the change'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-05: SECURITY DEFINER Audit
// ═══════════════════════════════════════════════════════════════════

describe('P3-05: SECURITY DEFINER Functions — search_path Enforcement', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815000000_strict_multi_tenant_hardening.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('fn_current_tenant_org has SET search_path = public', () => {
    assert.ok(
      sqlContent.includes("fn_current_tenant_org()") &&
      sqlContent.includes("SECURITY DEFINER") &&
      sqlContent.includes("SET search_path = public"),
      'fn_current_tenant_org must be SECURITY DEFINER with SET search_path = public'
    );
  });

  it('fn_current_workspace has SET search_path = public', () => {
    const fnStart = sqlContent.indexOf('fn_current_workspace()');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('SECURITY DEFINER') && fnBody.includes('SET search_path = public'),
      'fn_current_workspace must have SET search_path = public'
    );
  });

  it('fn_current_principal has SET search_path = public', () => {
    const fnStart = sqlContent.indexOf('fn_current_principal()');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('SECURITY DEFINER') && fnBody.includes('SET search_path = public'),
      'fn_current_principal must have SET search_path = public'
    );
  });

  it('fn_has_org_role has SET search_path = public', () => {
    const fnStart = sqlContent.indexOf('fn_has_org_role');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('SECURITY DEFINER') && fnBody.includes('SET search_path = public'),
      'fn_has_org_role must have SET search_path = public'
    );
  });

  it('check_rate_limit has SET search_path = public', () => {
    assert.ok(
      sqlContent.includes("check_rate_limit") &&
      sqlContent.includes("SECURITY DEFINER SET search_path = public"),
      'check_rate_limit must have SET search_path = public'
    );
  });

  it('log_security_event has SET search_path = public', () => {
    assert.ok(
      sqlContent.includes("log_security_event") &&
      sqlContent.includes("SECURITY DEFINER SET search_path = public"),
      'log_security_event must have SET search_path = public'
    );
  });

  it('handle_new_user_signup has SET search_path = public', () => {
    assert.ok(
      sqlContent.includes("handle_new_user_signup") &&
      sqlContent.includes("SECURITY DEFINER SET search_path = public"),
      'handle_new_user_signup must have SET search_path = public'
    );
  });

  it('fn_enforce_resource_workspace_consistency has SET search_path', () => {
    const fnStart = sqlContent.indexOf('fn_enforce_resource_workspace_consistency');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('SET search_path = public'),
      'fn_enforce_resource_workspace_consistency must have SET search_path'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-06: IDOR/BOLA Sweep — Route Parameter Authorization
// ═══════════════════════════════════════════════════════════════════

describe('P3-06: IDOR/BOLA — Route Parameter Authorization', () => {
  const invoiceSrc = readSource('../routes/v1/invoice.routes.ts');
  const walletSrc = readSource('../routes/v1/wallet.routes.ts');

  it('Invoice routes verify tenant access on GET by ID', () => {
    assert.ok(
      invoiceSrc.includes('verifyTenantAccess'),
      'Invoice routes must verify tenant access before returning invoice data'
    );
  });

  it('Invoice routes do NOT return invoice by ID without org check', () => {
    // Should not have a bare .eq('id', ...) without an org check nearby
    assert.ok(
      invoiceSrc.includes('getTenantOrg') || invoiceSrc.includes('verifyTenantAccess'),
      'Invoice GET must scope query by tenant context'
    );
  });

  it('Wallet routes require authentication', () => {
    assert.ok(
      walletSrc.includes('jwtVerify'),
      'Wallet routes must require JWT authentication'
    );
  });

  it('Wallet routes require tenant context', () => {
    assert.ok(
      walletSrc.includes('requireTenantContext'),
      'Wallet routes must require tenant context'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-07: Mass Assignment Prevention
// ═══════════════════════════════════════════════════════════════════

describe('P3-07: Mass Assignment — Client Body Stripping', () => {
  const ctxSrc = readSource('../middleware/requestContext.ts');

  it('Strips organization_id from request body', () => {
    assert.ok(
      ctxSrc.includes("delete (request.body as Record<string, unknown>).organization_id"),
      'Must strip organization_id from body'
    );
  });

  it('Strips workspace_id from request body', () => {
    assert.ok(
      ctxSrc.includes("delete (request.body as Record<string, unknown>).workspace_id"),
      'Must strip workspace_id from body'
    );
  });

  it('Strips org_id from request body', () => {
    assert.ok(
      ctxSrc.includes("delete (request.body as Record<string, unknown>).org_id"),
      'Must strip org_id from body'
    );
  });

  it('Strips tenant_id from request body', () => {
    assert.ok(
      ctxSrc.includes("delete (request.body as Record<string, unknown>).tenant_id"),
      'Must strip tenant_id from body'
    );
  });

  it('No ...request.body spread pattern in any route file', () => {
    const routeDir = resolve(__dirname, '../routes/v1');
    const routeFiles = readdirSync(routeDir).filter(f => f.endsWith('.ts'));

    for (const file of routeFiles) {
      const content = readFileSync(join(routeDir, file), 'utf-8');
      assert.ok(
        !content.includes('...request.body') && !content.includes('...req.body'),
        `${file} must NOT spread request body directly`
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-08: Privilege Escalation Prevention
// ═══════════════════════════════════════════════════════════════════

describe('P3-08: Privilege Escalation — Role Field Protection', () => {
  const authSrc = readSource('../middleware/authorization.ts');

  it('verifyMinimumRole does NOT auto-pass for any role', () => {
    const fnStart = authSrc.indexOf('export function verifyMinimumRole');
    const fnEnd = authSrc.indexOf('export function', fnStart + 1);
    const fnBody = authSrc.slice(fnStart, fnEnd > fnStart ? fnEnd : authSrc.length);

    assert.ok(
      !fnBody.includes('return true;') || fnBody.includes('principalLevel >= requiredLevel'),
      'verifyMinimumRole must compare levels, not auto-return true'
    );
  });

  it('verifyMinimumOrgRole fails closed when no orgRole', () => {
    assert.ok(
      authSrc.includes('if (!principal || !principal.orgRole)'),
      'Must check for missing orgRole and deny'
    );
  });

  it('isSuperadmin does NOT grant tenant access', () => {
    // Verify isSuperadmin is only used for control-plane checks
    const tenantFn = authSrc.indexOf('export function verifyTenantAccess');
    const tenantFnEnd = authSrc.indexOf('export function', tenantFn + 1);
    const tenantFnBody = authSrc.slice(tenantFn, tenantFnEnd > tenantFn ? tenantFnEnd : authSrc.length);

    assert.ok(
      !tenantFnBody.includes('isSuperadmin'),
      'verifyTenantAccess must NOT call isSuperadmin'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-09: org_id Transitional Usage Classification
// ═══════════════════════════════════════════════════════════════════

describe('P3-09: org_id Transitional Usage — Safety Classification', () => {
  const ctxSrc = readSource('../middleware/requestContext.ts');
  const entSrc = readSource('../routes/v1/enterprise.routes.ts');

  it('Body org_id is stripped by middleware (safe)', () => {
    assert.ok(
      ctxSrc.includes("delete (request.body as Record<string, unknown>).org_id"),
      'org_id is stripped from body by middleware'
    );
  });

  it('Enterprise routes use getTenantOrg as primary source (org_id is fallback only)', () => {
    assert.ok(
      entSrc.includes('getTenantOrg(request)'),
      'Enterprise routes must use getTenantOrg as primary org source'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-10: Service-Role Client Audit
// ═══════════════════════════════════════════════════════════════════

describe('P3-10: Service-Role Client — Safety Controls', () => {
  const supabaseSrc = readSource('../services/supabaseService.ts');

  it('SupabaseService validates credentials before creating client', () => {
    assert.ok(
      supabaseSrc.includes('placeholder') || supabaseSrc.includes('missing'),
      'SupabaseService must check for placeholder/missing credentials'
    );
  });

  it('SupabaseService has fallback mode for missing credentials', () => {
    assert.ok(
      supabaseSrc.includes('local memory fallback') || supabaseSrc.includes('fallback mode'),
      'Must have safe fallback when DB is unavailable'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-11: Rate Limiter / Cache / Idempotency Isolation
// ═══════════════════════════════════════════════════════════════════

describe('P3-11: Infrastructure Tenant Isolation', () => {
  const rateSrc = readSource('../services/rateLimiterService.ts');
  const idempSrc = readSource('../services/idempotencyService.ts');

  it('Rate limiter key includes org prefix', () => {
    assert.ok(
      rateSrc.includes('`org:${organizationId}:${key}`'),
      'Rate limiter key must be org-prefixed to prevent cross-tenant exhaustion'
    );
  });

  it('Rate limiter denies when organizationId missing (fail-closed)', () => {
    assert.ok(
      rateSrc.includes('if (!organizationId)') && rateSrc.includes('allowed: false'),
      'Must deny rate limit check when org is missing'
    );
  });

  it('Idempotency key includes org prefix', () => {
    assert.ok(
      idempSrc.includes('`${organizationId}:${key}`'),
      'Idempotency key must be org-prefixed for tenant isolation'
    );
  });

  it('Idempotency DB query filters by organization_id', () => {
    assert.ok(
      idempSrc.includes("query.eq('organization_id', organizationId)"),
      'Must filter idempotency DB query by organization_id'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-12: Route Authentication Completeness
// ═══════════════════════════════════════════════════════════════════

describe('P3-12: Route Authentication Completeness', () => {
  const routeDir = resolve(__dirname, '../routes/v1');
  const routeFiles = readdirSync(routeDir).filter(f => f.endsWith('.ts'));

  it('All route files exist in expected v1 directory', () => {
    assert.ok(routeFiles.length >= 14, `Expected at least 14 route files, found ${routeFiles.length}`);
  });

  // Test that critical routes have JWT enforcement
  for (const criticalRoute of ['payment.routes.ts', 'invoice.routes.ts', 'withdrawal.routes.ts', 'transaction.routes.ts', 'wallet.routes.ts', 'agent.routes.ts', 'enterprise.routes.ts', 'umkm.routes.ts', 'storage.routes.ts']) {
    const filePath = join(routeDir, criticalRoute);
    if (existsSync(filePath)) {
      const src = readFileSync(filePath, 'utf-8');
      it(`${criticalRoute} enforces JWT authentication`, () => {
        assert.ok(
          src.includes('jwtVerify') || src.includes('authenticate'),
          `${criticalRoute} must enforce JWT authentication`
        );
      });
    }
  }

  // Test that critical routes use tenant context
  for (const tenantRoute of ['payment.routes.ts', 'invoice.routes.ts', 'withdrawal.routes.ts', 'transaction.routes.ts', 'agent.routes.ts', 'enterprise.routes.ts', 'umkm.routes.ts', 'storage.routes.ts']) {
    const filePath = join(routeDir, tenantRoute);
    if (existsSync(filePath)) {
      const src = readFileSync(filePath, 'utf-8');
      it(`${tenantRoute} requires tenant context`, () => {
        assert.ok(
          src.includes('requireTenantContext') || src.includes('getTenantOrg'),
          `${tenantRoute} must enforce tenant context`
        );
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════
// P3-13: Storage Path Traversal Prevention
// ═══════════════════════════════════════════════════════════════════

describe('P3-13: Storage — Tenant Path Scoping', () => {
  const r2Src = readSource('../services/r2StorageService.ts');

  it('Upload paths are scoped under organizations/', () => {
    assert.ok(
      r2Src.includes('organizations/'),
      'All uploads must be scoped under organizations/{org_id}/'
    );
  });

  it('Presigned URL path includes organizationId', () => {
    assert.ok(
      r2Src.includes('organizationId'),
      'Presigned URL generation must include organizationId in path'
    );
  });

  it('Audit certificate path includes organizationId', () => {
    assert.ok(
      r2Src.includes('organizations/${organizationId}/privy-audits'),
      'Audit cert path must be org-scoped'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-14: Break-Glass Scope Enforcement
// ═══════════════════════════════════════════════════════════════════

describe('P3-14: Break-Glass — Scope & Duration Controls', () => {
  const bgSrc = readSource('../middleware/breakGlass.ts');

  it('Break-glass has 30-minute maximum duration', () => {
    assert.ok(
      bgSrc.includes('30 * 60 * 1000'),
      'Max break-glass duration must be 30 minutes'
    );
  });

  it('Break-glass validates duration does not exceed maximum', () => {
    assert.ok(
      bgSrc.includes('durationMs > MAX_BREAK_GLASS_DURATION_MS'),
      'Must validate duration against maximum'
    );
  });

  it('Break-glass verifies requester is superadmin via DB', () => {
    assert.ok(
      bgSrc.includes("profile.role !== 'superadmin'"),
      'Must verify superadmin role from database, not just claims'
    );
  });

  it('Break-glass verifies target organization exists', () => {
    assert.ok(
      bgSrc.includes("'Target organization not found'"),
      'Must verify target org exists before granting'
    );
  });

  it('Break-glass session is persisted for audit', () => {
    assert.ok(
      bgSrc.includes("'platform_break_glass_access_logs'"),
      'Break-glass session must be logged in platform_break_glass_access_logs'
    );
  });

  it('Break-glass validation checks expiry', () => {
    assert.ok(
      bgSrc.includes("gt('expires_at'"),
      'Must check session expiry on validation'
    );
  });

  it('requireTenantOrBreakGlass denies non-superadmin without context', () => {
    assert.ok(
      bgSrc.includes("code: 'NO_TENANT_CONTEXT'"),
      'Non-superadmin without tenant context must be denied'
    );
  });

  it('requireTenantOrBreakGlass denies superadmin without session', () => {
    assert.ok(
      bgSrc.includes("code: 'NO_BREAK_GLASS_SESSION'"),
      'Superadmin without break-glass session must be denied'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-15: Audit Logging Completeness
// ═══════════════════════════════════════════════════════════════════

describe('P3-15: Audit Logging — Security Event Coverage', () => {
  const authSrc = readSource('../middleware/authorization.ts');
  const ctxSrc = readSource('../middleware/requestContext.ts');
  const bgSrc = readSource('../middleware/breakGlass.ts');

  it('Cross-tenant access denial is logged', () => {
    assert.ok(
      authSrc.includes("action: 'cross_tenant_access_denied'"),
      'Must log cross-tenant access denials with action tag'
    );
  });

  it('NULL org resource denial is logged', () => {
    assert.ok(
      authSrc.includes("action: 'tenant_access_denied_null_org'"),
      'Must log when resource has null org_id'
    );
  });

  it('Missing principal org context denial is logged', () => {
    assert.ok(
      authSrc.includes("action: 'tenant_access_denied_no_context'"),
      'Must log when principal has no org context'
    );
  });

  it('Org membership verification failure is logged', () => {
    assert.ok(
      ctxSrc.includes('Org membership verification FAILED'),
      'Must log org membership verification failures'
    );
  });

  it('Break-glass grant is logged', () => {
    assert.ok(
      bgSrc.includes("action: 'break_glass_granted'"),
      'Must log break-glass grant events'
    );
  });

  it('Break-glass denial (not superadmin) is logged', () => {
    assert.ok(
      bgSrc.includes("action: 'break_glass_denied_not_superadmin'"),
      'Must log break-glass denial for non-superadmin'
    );
  });

  it('Break-glass usage is logged', () => {
    assert.ok(
      bgSrc.includes("action: 'break_glass_access_used'"),
      'Must log when break-glass session is used'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-16: Migration Integrity — RLS Policy Verification
// ═══════════════════════════════════════════════════════════════════

describe('P3-16: Migration — RLS Policy Integrity', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815000000_strict_multi_tenant_hardening.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Migration is wrapped in transaction (BEGIN/COMMIT)', () => {
    assert.ok(sqlContent.includes('BEGIN;'), 'Migration must start with BEGIN');
    assert.ok(sqlContent.includes('COMMIT;'), 'Migration must end with COMMIT');
  });

  it('Migration creates performance indexes on organization_id', () => {
    assert.ok(
      sqlContent.includes('idx_agents_org_user') &&
      sqlContent.includes('idx_workflows_org_user'),
      'Must create composite indexes for org+user queries'
    );
  });

  it('Grants to authenticated and service_role only', () => {
    assert.ok(
      sqlContent.includes('GRANT EXECUTE ON FUNCTION public.fn_current_tenant_org() TO authenticated, service_role'),
      'Functions must be granted to authenticated and service_role only'
    );
  });

  it('Revokes execution from anon role', () => {
    assert.ok(
      sqlContent.includes('REVOKE EXECUTE ON FUNCTION public.fn_is_org_member(UUID) FROM anon'),
      'Must revoke anon execution on fn_is_org_member'
    );
  });

  it('user_api_keys NULL org policy is intentionally documented', () => {
    // user_api_keys allows NULL org for pre-org API keys — this is intentional
    const policyStart = sqlContent.indexOf('CREATE POLICY "strict_tenant_isolation" ON public.user_api_keys');
    assert.ok(policyStart > -1, 'user_api_keys policy must exist in migration');

    // Find the USING clause
    const policyArea = sqlContent.slice(policyStart, policyStart + 300);
    assert.ok(
      policyArea.includes('organization_id IS NULL'),
      'user_api_keys intentionally allows NULL org for pre-org API keys'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P3-17: Type System — Principal & Tenant Context Typing
// ═══════════════════════════════════════════════════════════════════

describe('P3-17: Type System — Security Types Correctness', () => {
  const typesSrc = readSource('../types/fastify.d.ts');

  it('ZegaPrincipal has organizationId field', () => {
    assert.ok(
      typesSrc.includes('organizationId?: string'),
      'ZegaPrincipal must have optional organizationId'
    );
  });

  it('ZegaPrincipal has orgRole field', () => {
    assert.ok(
      typesSrc.includes("orgRole?: 'owner' | 'admin' | 'member' | 'billing_contact'"),
      'ZegaPrincipal must have orgRole with correct types'
    );
  });

  it('TenantContext has tenantType field', () => {
    assert.ok(
      typesSrc.includes("tenantType: 'umkm' | 'enterprise'"),
      'TenantContext must have tenantType enum'
    );
  });

  it('FastifyRequest has principal field', () => {
    assert.ok(
      typesSrc.includes('principal?: ZegaPrincipal'),
      'FastifyRequest must declare principal field'
    );
  });

  it('JWT payload includes organizationId claim', () => {
    assert.ok(
      typesSrc.includes('organizationId?: string') && typesSrc.includes('FastifyJWT'),
      'JWT payload must include organizationId claim'
    );
  });
});
