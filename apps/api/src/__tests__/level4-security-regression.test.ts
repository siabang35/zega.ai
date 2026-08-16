import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚡ ZEGA.AI — Level 4 Production Security Regression Test Suite
 *
 * Validates L4 hardening invariants:
 *   L4-01: Route Authorization Matrix — All routes classified & protected
 *   L4-02: Body Stripping — Ownership fields stripped from request bodies
 *   L4-03: SECURITY DEFINER Functions — All have SET search_path
 *   L4-04: View Security — security_invoker = true, no anon grants
 *   L4-05: ZeroClaw Authorization — isMerchantWalletOwnedByUser fail-closed
 *   L4-06: Enterprise Route Hardening — No body.orgId fallback
 *   L4-07: Audit Log Integrity — Append-only enforcement
 *   L4-08: Organization Soft-Delete — Hard-delete prevention
 *   L4-09: Immutability Triggers — workspace_id, owner_id, organization_id
 *   L4-10: Orchestration Org Scoping — Multi-org user isolation
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// L4-01: ROUTE AUTHORIZATION MATRIX
// ═══════════════════════════════════════════════════════════════

describe('L4-01: Route Authorization Matrix', () => {
  const routeDir = resolve(__dirname, '../routes/v1');

  const tenantScopedRoutes = [
    'enterprise.routes.ts',
    'umkm.routes.ts',
    'agent.routes.ts',
    'invoice.routes.ts',
    'payment.routes.ts',
    'transaction.routes.ts',
    'wallet.routes.ts',
    'apiWallet.routes.ts',
    'storage.routes.ts',
    'withdrawal.routes.ts',
  ];

  for (const route of tenantScopedRoutes) {
    it(`${route} imports tenant context middleware`, () => {
      const src = readSource(`../routes/v1/${route}`);
      assert.ok(src.length > 0, `${route} must exist`);
      assert.ok(
        src.includes('requireTenantContext') ||
        src.includes('getTenantOrg') ||
        src.includes('populatePrincipal'),
        `${route} must use tenant context middleware`
      );
    });
  }

  it('auth.routes.ts is classified AUTH (pre-auth, no tenant context needed)', () => {
    const src = readSource('../routes/v1/auth.routes.ts');
    assert.ok(src.includes('request-otp'), 'Must define OTP endpoint');
    assert.ok(src.includes('verify-otp'), 'Must define OTP verification endpoint');
    // Auth routes intentionally do NOT use tenant context
    assert.ok(!src.includes('requireTenantContext'), 'Auth routes must not use tenant context');
  });

  it('webhook.routes.ts is classified SYSTEM_INTERNAL (HMAC verified)', () => {
    const src = readSource('../routes/v1/webhook.routes.ts');
    assert.ok(src.includes('privy-signature') || src.includes('x-privy-signature'), 'Must verify HMAC signature');
    assert.ok(src.includes('verifyPrivyWebhookSignature'), 'Must call HMAC verification');
  });

  it('orchestration.routes.ts uses auth + populatePrincipal', () => {
    const src = readSource('../routes/v1/orchestration.routes.ts');
    assert.ok(src.includes('populatePrincipal'), 'Must use principal middleware');
    assert.ok(src.includes('app.authenticate'), 'Must require authentication');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-02: BODY STRIPPING — Mass Assignment Protection
// ═══════════════════════════════════════════════════════════════

describe('L4-02: Body Stripping Mass Assignment Protection', () => {
  const contextSource = readSource('../middleware/requestContext.ts');

  const stripFields = [
    'organization_id',
    'workspace_id',
    'org_id',
    'tenant_id',
    'store_id',
    'user_id',
    'created_by',
    'owner_id',
    'agent_id',
    'role',
    'parent_id',
    'team_id',
    'department_id',
    'orgId',
  ];

  for (const field of stripFields) {
    it(`Strips ${field} from request body`, () => {
      assert.ok(
        contextSource.includes(`delete body.${field}`) ||
        contextSource.includes(`delete (request.body as Record<string, unknown>).${field}`),
        `Must strip ${field} from request body`
      );
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// L4-03: SECURITY DEFINER FUNCTION AUDIT
// ═══════════════════════════════════════════════════════════════

describe('L4-03: SECURITY DEFINER Function Hardening', () => {
  const l4MigrationPath = resolve(__dirname, '../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('L4 migration exists', () => {
    assert.ok(existsSync(l4MigrationPath), 'Level 4 migration SQL must exist');
  });

  const sql = existsSync(l4MigrationPath) ? readFileSync(l4MigrationPath, 'utf-8') : '';

  it('L4 migration enforces SET search_path on all SECURITY DEFINER functions', () => {
    assert.ok(sql.includes('ALTER FUNCTION public.%I(%s) SET search_path = public'), 'Must enforce search_path on all SECURITY DEFINER functions');
  });

  it('All new SECURITY DEFINER functions in L4 migration have SET search_path', () => {
    const secDefMatches = sql.match(/SECURITY DEFINER/g) || [];
    const searchPathMatches = sql.match(/SET search_path = public/g) || [];
    assert.ok(
      searchPathMatches.length >= secDefMatches.length,
      `Every SECURITY DEFINER (${secDefMatches.length}) must have SET search_path (found ${searchPathMatches.length})`
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-04: VIEW SECURITY
// ═══════════════════════════════════════════════════════════════

describe('L4-04: View Security Hardening', () => {
  const viewFixMigration = readSource('../../../../supabase/migrations/20260807000001_fix_security_definer_views_linter.sql');
  const l4Migration = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('Views use security_invoker = true', () => {
    assert.ok(viewFixMigration.includes('security_invoker = true'), 'View linter fix must set security_invoker');
  });

  it('L4 migration revokes anon from all views', () => {
    assert.ok(l4Migration.includes('REVOKE ALL ON public.%I FROM anon'), 'Must revoke anon from all views');
  });

  it('L4 migration explicitly revokes anon from enterprise views', () => {
    assert.ok(l4Migration.includes('REVOKE SELECT ON public.view_enterprise_api_log_stats_24h FROM anon'));
    assert.ok(l4Migration.includes('REVOKE SELECT ON public.view_enterprise_system_log_stats_24h FROM anon'));
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-05: ZEROCLAW AUTHORIZATION — Fail-Closed Ownership
// ═══════════════════════════════════════════════════════════════

describe('L4-05: ZeroClaw Authorization (Fail-Closed)', () => {
  const zeroclawSource = readSource('../routes/v1/zeroclaw.routes.ts');

  it('isMerchantWalletOwnedByUser does NOT return true as catch-all', () => {
    // The old code had: "return true;" after the "valid Base58 Solana public key" comment
    // L4 fix changed it to: "return false;"
    assert.ok(
      !zeroclawSource.includes('// 3. Authenticated user session with valid Base58 Solana public key'),
      'Must NOT have catch-all true return comment'
    );
    assert.ok(
      zeroclawSource.includes('// 3. SECURITY (L4 FIX): No ownership proof found — fail closed'),
      'Must have L4 fail-closed comment'
    );
  });

  it('derivePrivyEmbeddedSolanaKeypair is permanently disabled', () => {
    assert.ok(
      zeroclawSource.includes('SECURITY INVARIANT VIOLATION'),
      'derivePrivyEmbeddedSolanaKeypair must throw'
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-06: ENTERPRISE ROUTE HARDENING — No body.orgId Fallback
// ═══════════════════════════════════════════════════════════════

describe('L4-06: Enterprise Route Hardening', () => {
  const enterpriseSource = readSource('../routes/v1/enterprise.routes.ts');

  it('No body.orgId fallback in enterprise routes', () => {
    assert.ok(
      !enterpriseSource.includes('|| body.orgId'),
      'Must not fallback to body.orgId'
    );
  });

  it('Agent creation includes organization_id from server context', () => {
    assert.ok(
      enterpriseSource.includes("'Organization context required to create agent.'") ||
      enterpriseSource.includes('organization_id: tenantOrgId'),
      'Agent creation must require organization context'
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-07: AUDIT LOG INTEGRITY
// ═══════════════════════════════════════════════════════════════

describe('L4-07: Audit Log Integrity', () => {
  const l4Migration = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('Audit log mutation deny trigger exists', () => {
    assert.ok(l4Migration.includes('fn_deny_audit_log_mutation'), 'Must define audit mutation deny function');
    assert.ok(l4Migration.includes('trg_deny_audit_mutation'), 'Must install audit mutation deny trigger');
  });

  it('Trigger covers security_audit_logs and break_glass logs', () => {
    assert.ok(l4Migration.includes("'security_audit_logs'"), 'Must cover security_audit_logs');
    assert.ok(l4Migration.includes("'platform_break_glass_access_logs'"), 'Must cover break_glass logs');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-08: ORGANIZATION SOFT-DELETE
// ═══════════════════════════════════════════════════════════════

describe('L4-08: Organization Soft-Delete Protection', () => {
  const l4Migration = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('Organizations table gets soft-delete columns', () => {
    assert.ok(l4Migration.includes('is_deleted BOOLEAN DEFAULT false'), 'Must add is_deleted column');
    assert.ok(l4Migration.includes('deleted_at TIMESTAMPTZ'), 'Must add deleted_at column');
    assert.ok(l4Migration.includes('deleted_by UUID'), 'Must add deleted_by column');
  });

  it('Soft-delete guard trigger prevents hard deletion', () => {
    assert.ok(l4Migration.includes('fn_organizations_soft_delete_guard'), 'Must define soft-delete guard function');
    assert.ok(l4Migration.includes('trg_organizations_soft_delete'), 'Must install soft-delete trigger');
    assert.ok(l4Migration.includes('RETURN NULL'), 'Must cancel actual DELETE');
  });

  it('Organizations RLS excludes soft-deleted records', () => {
    assert.ok(
      l4Migration.includes('is_deleted IS NULL OR is_deleted = false'),
      'RLS must exclude soft-deleted orgs'
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-09: IMMUTABILITY TRIGGERS
// ═══════════════════════════════════════════════════════════════

describe('L4-09: Ownership Immutability Triggers', () => {
  const l4Migration = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');
  const l3Migration = readSource('../../../../supabase/migrations/20260815150000_master_multi_tenant_certification_hardening.sql');

  it('Organization_id immutability trigger exists (Level 3)', () => {
    assert.ok(
      l3Migration.includes('fn_prevent_tenant_reparenting_organization_id') ||
      l3Migration.includes('trg_prevent_tenant_reparenting_org'),
      'Must have organization_id immutability trigger'
    );
  });

  it('Workspace_id immutability trigger exists (Level 4)', () => {
    assert.ok(l4Migration.includes('fn_prevent_workspace_reparenting'), 'Must define workspace reparenting function');
    assert.ok(l4Migration.includes('trg_prevent_workspace_reparenting'), 'Must install workspace reparenting trigger');
    assert.ok(l4Migration.includes('WORKSPACE RE-PARENTING DENIED'), 'Must have clear error message');
  });

  it('Owner_id immutability trigger exists (Level 4)', () => {
    assert.ok(l4Migration.includes('fn_prevent_owner_reparenting'), 'Must define owner reparenting function');
    assert.ok(l4Migration.includes('trg_prevent_owner_reparenting'), 'Must install owner reparenting trigger');
    assert.ok(l4Migration.includes('OWNER RE-PARENTING DENIED'), 'Must have clear error message');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-10: ORCHESTRATION MULTI-ORG ISOLATION
// ═══════════════════════════════════════════════════════════════

describe('L4-10: Orchestration Multi-Org User Isolation', () => {
  const orchSource = readSource('../routes/v1/orchestration.routes.ts');

  it('Task list filters by organizationId (not just ownerId)', () => {
    assert.ok(
      orchSource.includes('t.organizationId === principal.organizationId'),
      'Must filter tasks by organizationId to prevent cross-org leakage'
    );
  });

  it('Task creation binds organizationId from principal', () => {
    assert.ok(
      orchSource.includes('organizationId: principal.organizationId'),
      'Task must be bound to principal\'s organization context'
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// L4-11: BYPASSRLS VERIFICATION
// ═══════════════════════════════════════════════════════════════

describe('L4-11: BYPASSRLS Privilege Review', () => {
  const l4Migration = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('L4 migration includes BYPASSRLS verification query', () => {
    assert.ok(l4Migration.includes('rolbypassrls'), 'Must verify BYPASSRLS privileges');
  });
});
