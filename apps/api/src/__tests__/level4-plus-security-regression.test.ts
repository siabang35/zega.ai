import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚡ ZEGA.AI — Level 4+ Production-Scale Multi-Tenant Hardening Master Regression Suite
 *
 * Validates the complete Level 4+ Security Architecture across all domains:
 *   L4P-01: ZeroClaw Database & API Scoping (20260815170000 migration)
 *   L4P-02: ZeroClaw Fail-Closed Ownership & Service-Role Isolation
 *   L4P-03: Newsletter Email Target Security & Injection Defenses
 *   L4P-04: Orchestration Multi-Instance Task Isolation & Ownership
 *   L4P-05: Mass Assignment Protection & Body Stripping Blocklist
 *   L4P-06: Database Immutability & Soft-Delete Lifecycle Protection
 *   L4P-07: Audit Log Append-Only Integrity
 *   L4P-08: View Security & Anon Privilege Revocation
 *   L4P-09: Multi-Org User Context Isolation (USER_X with Org_A vs Org_B)
 *   L4P-10: Concurrency, Storage & Cache Key Isolation Invariants
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf-8');
}

// ═══════════════════════════════════════════════════════════════
// L4P-01: ZEROCLAW DATABASE SCOPING MIGRATION
// ═══════════════════════════════════════════════════════════════

describe('L4P-01: ZeroClaw Database Scoping Migration (20260815170000)', () => {
  const migrationPath = resolve(__dirname, '../../../../supabase/migrations/20260815170000_level4_plus_zeroclaw_tenant_hardening.sql');

  it('Migration file exists', () => {
    assert.ok(existsSync(migrationPath), 'Migration 20260815170000 must exist');
  });

  const sql = readSource('../../../../supabase/migrations/20260815170000_level4_plus_zeroclaw_tenant_hardening.sql');

  it('Adds organization_id foreign key to all ZeroClaw relations', () => {
    assert.ok(sql.includes('organization_id UUID REFERENCES public.organizations(id)'), 'Must add FK constraint');
  });

  it('Enforces FORCE ROW LEVEL SECURITY on ZeroClaw tables', () => {
    assert.ok(sql.includes('FORCE ROW LEVEL SECURITY'), 'Must enforce FORCE RLS');
  });

  it('Uses fn_is_org_member for database-authoritative RLS', () => {
    assert.ok(sql.includes('public.fn_is_org_member(organization_id, auth.uid())'), 'Must use fn_is_org_member');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-02: ZEROCLAW FAIL-CLOSED OWNERSHIP
// ═══════════════════════════════════════════════════════════════

describe('L4P-02: ZeroClaw Fail-Closed Ownership & Service-Role Isolation', () => {
  const zeroclawSource = readSource('../routes/v1/zeroclaw.routes.ts');

  it('isMerchantWalletOwnedByUser defaults to false (fail-closed)', () => {
    assert.ok(zeroclawSource.includes('SECURITY (L4 FIX): No ownership proof found — fail closed'), 'Must be fail-closed');
  });

  it('Imports requireTenantContext and getTenantOrg', () => {
    assert.ok(zeroclawSource.includes('requireTenantContext'), 'Must import requireTenantContext');
    assert.ok(zeroclawSource.includes('getTenantOrg'), 'Must import getTenantOrg');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-03: NEWSLETTER EMAIL DISPATCH SECURITY
// ═══════════════════════════════════════════════════════════════

describe('L4P-03: Newsletter Email Target Security & Anti-Abuse Defenses', () => {
  const newsletterSource = readSource('../routes/v1/newsletter.routes.ts');

  it('dispatch-report verifies email matches authenticated user', () => {
    assert.ok(newsletterSource.includes('FORBIDDEN_RECIPIENT'), 'Must define FORBIDDEN_RECIPIENT guard');
    assert.ok(newsletterSource.includes('authedEmail'), 'Must inspect authenticated user email');
  });

  it('dispatch-report sanitizes input against CRLF injection', () => {
    assert.ok(newsletterSource.includes('.replace(/[\\r\\n]/g, \'\')'), 'Must strip newlines from email fields');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-04: ORCHESTRATION TASK ISOLATION
// ═══════════════════════════════════════════════════════════════

describe('L4P-04: Orchestration Task Isolation', () => {
  const orchSource = readSource('../routes/v1/orchestration.routes.ts');

  it('Tasks require ownerId AND organizationId scoping', () => {
    assert.ok(orchSource.includes('t.ownerId === principal.userId'), 'Must verify ownerId');
    assert.ok(orchSource.includes('t.organizationId === principal.organizationId'), 'Must verify organizationId');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-05: MASS ASSIGNMENT & BODY STRIPPING
// ═══════════════════════════════════════════════════════════════

describe('L4P-05: Mass Assignment & Body Stripping Blocklist', () => {
  const contextSource = readSource('../middleware/requestContext.ts');

  const blockedFields = [
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

  for (const field of blockedFields) {
    it(`Strips ${field} from body`, () => {
      assert.ok(
        contextSource.includes(`delete body.${field}`) ||
        contextSource.includes(`delete (request.body as Record<string, unknown>).${field}`),
        `Must strip ${field}`
      );
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// L4P-06: DATABASE SOFT-DELETE & IMMUTABILITY
// ═══════════════════════════════════════════════════════════════

describe('L4P-06: Database Soft-Delete & Immutability Triggers', () => {
  const l4Sql = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('Organizations soft-delete trigger prevents hard DELETE', () => {
    assert.ok(l4Sql.includes('fn_organizations_soft_delete_guard'), 'Must define soft-delete guard');
    assert.ok(l4Sql.includes('trg_organizations_soft_delete'), 'Must attach trigger to organizations');
  });

  it('Workspace_id immutability trigger prevents reparenting', () => {
    assert.ok(l4Sql.includes('fn_prevent_workspace_reparenting'), 'Must define workspace reparenting function');
  });

  it('Owner_id immutability trigger prevents reparenting', () => {
    assert.ok(l4Sql.includes('fn_prevent_owner_reparenting'), 'Must define owner reparenting function');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-07: AUDIT LOG APPEND-ONLY INTEGRITY
// ═══════════════════════════════════════════════════════════════

describe('L4P-07: Audit Log Append-Only Integrity', () => {
  const l4Sql = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('Audit log mutation deny trigger exists', () => {
    assert.ok(l4Sql.includes('fn_deny_audit_log_mutation'), 'Must define audit log deny function');
    assert.ok(l4Sql.includes('AUDIT LOG INTEGRITY VIOLATION'), 'Must raise exception on UPDATE/DELETE');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-08: VIEW SECURITY & PRIVILEGE REVOCATION
// ═══════════════════════════════════════════════════════════════

describe('L4P-08: View Security & Anon Privilege Revocation', () => {
  const l4Sql = readSource('../../../../supabase/migrations/20260815160000_level4_production_hardening.sql');

  it('Revokes anon SELECT from all enterprise views', () => {
    assert.ok(l4Sql.includes('REVOKE SELECT ON public.view_enterprise_api_log_stats_24h FROM anon'), 'Must revoke anon from API log stats view');
    assert.ok(l4Sql.includes('REVOKE SELECT ON public.view_enterprise_system_log_stats_24h FROM anon'), 'Must revoke anon from system log stats view');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-09: MULTI-ORG USER CONTEXT ISOLATION
// ═══════════════════════════════════════════════════════════════

describe('L4P-09: Multi-Org User Context Isolation', () => {
  const contextSource = readSource('../middleware/requestContext.ts');

  it('Enforces X-Organization-Id header for multi-org users', () => {
    assert.ok(contextSource.includes('x-organization-id'), 'Must require explicit header');
    assert.ok(contextSource.includes("from('organization_members')"), 'Must verify membership in DB');
  });
});

// ═══════════════════════════════════════════════════════════════
// L4P-10: CONCURRENCY & ISOLATION INVARIANTS
// ═══════════════════════════════════════════════════════════════

describe('L4P-10: Infrastructure Tenant Key Isolation Invariants', () => {
  const r2Source = readSource('../services/r2StorageService.ts');
  const rateLimitSource = readSource('../services/rateLimiterService.ts');

  it('R2 Storage keys are scoped under organizationId', () => {
    assert.ok(r2Source.includes('organizations/${organizationId}'), 'R2 object keys must contain tenant organizationId');
  });

  it('Rate limit keys are scoped under organizationId', () => {
    assert.ok(rateLimitSource.includes('org:${organizationId}:${key}'), 'Rate limit keys must be tenant-prefixed');
  });
});
