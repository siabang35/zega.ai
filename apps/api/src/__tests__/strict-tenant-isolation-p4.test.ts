import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚡ ZEGA.AI — Phase 4 Multi-Tenant Enforcement Test Suite
 *
 * Validates all Phase 4 hardening fixes:
 *   P4-01: Invoice GET unconditional tenant check (C-01 fix)
 *   P4-02: supabaseService.getAgents() requires organizationId (C-02 fix)
 *   P4-03: supabaseService.createAgent() requires userId + organizationId (C-02 fix)
 *   P4-04: requestContext.ts enhanced body stripping
 *   P4-05: Migration creates fn_is_store_member() helper
 *   P4-06: Migration adds RLS to store-only tables
 *   P4-07: Migration adds read-only RLS to marketplace catalog tables
 *   P4-08: Migration adds organization_members.status column
 *   P4-09: Migration creates performance indexes
 *   P4-10: Invoice routes DENY orphan invoices with no org_id
 *   P4-11: Agent route createAgent passes required organizationId
 *   P4-12: R2 storage paths enforce organization prefix
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
// P4-01: Invoice GET — Unconditional Tenant Check (C-01 Fix)
// ═══════════════════════════════════════════════════════════════════

describe('P4-01: Invoice GET — Unconditional Tenant Check', () => {
  const invoiceSrc = readSource('../routes/v1/invoice.routes.ts');

  it('Does NOT conditionally skip tenant check based on org_id truthiness', () => {
    assert.ok(
      !invoiceSrc.includes('invoice.organization_id && !verifyTenantAccess'),
      'Must NOT have conditional tenant bypass (old C-01 vulnerability)'
    );
  });

  it('Denies invoice when organization_id is null (fail-closed)', () => {
    assert.ok(
      invoiceSrc.includes("'INVOICE_TENANT_MISSING'"),
      'Must return INVOICE_TENANT_MISSING when invoice has no org_id'
    );
  });

  it('Logs orphan invoice denial', () => {
    assert.ok(
      invoiceSrc.includes("'invoice_denied_orphan'"),
      'Must log when orphan invoice access is denied'
    );
  });

  it('Calls verifyTenantAccess unconditionally after null check', () => {
    assert.ok(
      invoiceSrc.includes('!verifyTenantAccess(request, invoice.organization_id)'),
      'Must call verifyTenantAccess unconditionally'
    );
  });

  it('Contains C-01 FIX comment', () => {
    assert.ok(
      invoiceSrc.includes('C-01 FIX'),
      'Must document the fix with C-01 FIX marker'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-02: supabaseService.getAgents() Requires organizationId
// ═══════════════════════════════════════════════════════════════════

describe('P4-02: getAgents — Organization-Scoped (C-02 Fix)', () => {
  const supabaseSrc = readSource('../services/supabaseService.ts');

  it('getAgents requires organizationId parameter', () => {
    assert.ok(
      supabaseSrc.includes('async getAgents(organizationId: string)'),
      'getAgents must require organizationId parameter'
    );
  });

  it('getAgents filters by organization_id', () => {
    const fnStart = supabaseSrc.indexOf('async getAgents(');
    const fnEnd = supabaseSrc.indexOf('}', fnStart + 400);
    const fnBody = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes(".eq('organization_id', organizationId)"),
      'getAgents must filter by organization_id'
    );
  });

  it('getAgents denies when organizationId is missing (fail-closed)', () => {
    const fnStart = supabaseSrc.indexOf('async getAgents(');
    const fnEnd = supabaseSrc.indexOf('}', fnStart + 400);
    const fnBody = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('if (!organizationId)'),
      'Must check for missing organizationId and deny'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-03: supabaseService.createAgent() Requires userId + orgId
// ═══════════════════════════════════════════════════════════════════

describe('P4-03: createAgent — Required Tenant Identity (C-02 Fix)', () => {
  const supabaseSrc = readSource('../services/supabaseService.ts');

  it('createAgent requires userId (not optional)', () => {
    const fnStart = supabaseSrc.indexOf('async createAgent(');
    const fnEnd = supabaseSrc.indexOf(')', fnStart);
    const fnSig = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      fnSig.includes('userId: string;') && !fnSig.includes('userId?: string;'),
      'createAgent userId must be required (userId: string)'
    );
  });

  it('createAgent requires organizationId (not optional)', () => {
    assert.ok(
      supabaseSrc.includes('organizationId: string;') &&
      !supabaseSrc.includes('organizationId?: string;'),
      'organizationId must be required (string, not string?)'
    );
  });

  it('createAgent fails closed when userId is missing', () => {
    const fnStart = supabaseSrc.indexOf('async createAgent(');
    const fnEnd = supabaseSrc.indexOf('} catch', fnStart);
    const fnBody = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('if (!agentData.userId)'),
      'Must check for missing userId and deny'
    );
  });

  it('createAgent fails closed when organizationId is missing', () => {
    const fnStart = supabaseSrc.indexOf('async createAgent(');
    const fnEnd = supabaseSrc.indexOf('} catch', fnStart);
    const fnBody = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('if (!agentData.organizationId)'),
      'Must check for missing organizationId and deny'
    );
  });

  it('createAgent does NOT auto-select first user from profiles', () => {
    const fnStart = supabaseSrc.indexOf('async createAgent(');
    const fnEnd = supabaseSrc.indexOf('} catch', fnStart);
    const fnBody = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes("from('profiles').select('id').limit(1)"),
      'Must NOT auto-select a user from profiles table'
    );
  });

  it('createAgent does NOT use organizationId || null fallback', () => {
    const fnStart = supabaseSrc.indexOf('async createAgent(');
    const fnEnd = supabaseSrc.indexOf('} catch', fnStart);
    const fnBody = supabaseSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes('agentData.organizationId || null'),
      'Must NOT fallback organizationId to null'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-04: requestContext.ts Enhanced Body Stripping
// ═══════════════════════════════════════════════════════════════════

describe('P4-04: Body Stripping — Enhanced Mass Assignment Prevention', () => {
  const ctxSrc = readSource('../middleware/requestContext.ts');

  it('Strips store_id from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.store_id'),
      'Must strip store_id from body'
    );
  });

  it('Strips user_id from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.user_id'),
      'Must strip user_id from body'
    );
  });

  it('Strips created_by from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.created_by'),
      'Must strip created_by from body'
    );
  });

  it('Strips owner_id from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.owner_id'),
      'Must strip owner_id from body'
    );
  });

  it('Strips agent_id from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.agent_id'),
      'Must strip agent_id from body'
    );
  });

  it('Strips role from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.role'),
      'Must strip role from body'
    );
  });

  // Original fields still stripped
  it('Still strips organization_id from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.organization_id') || ctxSrc.includes('delete (request.body as Record<string, unknown>).organization_id'),
      'Must strip organization_id from body'
    );
  });

  it('Still strips workspace_id from request body', () => {
    assert.ok(
      ctxSrc.includes('delete body.workspace_id') || ctxSrc.includes('delete (request.body as Record<string, unknown>).workspace_id'),
      'Must strip workspace_id from body'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-05: Migration — fn_is_store_member() Helper
// ═══════════════════════════════════════════════════════════════════

describe('P4-05: Migration — fn_is_store_member Helper', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815100000_phase4_strict_multi_tenant_enforcement.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Migration creates fn_is_store_member function', () => {
    assert.ok(
      sqlContent.includes('fn_is_store_member'),
      'Must create fn_is_store_member function'
    );
  });

  it('fn_is_store_member is SECURITY DEFINER with SET search_path', () => {
    const fnStart = sqlContent.indexOf('CREATE OR REPLACE FUNCTION public.fn_is_store_member');
    assert.ok(fnStart > -1, 'fn_is_store_member declaration must exist');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('SECURITY DEFINER') && fnBody.includes('SET search_path = public'),
      'fn_is_store_member must be SECURITY DEFINER with SET search_path = public'
    );
  });

  it('fn_is_store_member checks auth.uid() (fail-closed)', () => {
    const fnStart = sqlContent.indexOf('CREATE OR REPLACE FUNCTION public.fn_is_store_member');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('auth.uid() IS NULL'),
      'Must check auth.uid() and deny if null'
    );
  });

  it('fn_is_store_member resolves store to organization via umkm_stores', () => {
    const fnStart = sqlContent.indexOf('CREATE OR REPLACE FUNCTION public.fn_is_store_member');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('FROM public.umkm_stores'),
      'Must resolve store_id to organization_id via umkm_stores'
    );
  });

  it('fn_is_store_member checks organization_members', () => {
    const fnStart = sqlContent.indexOf('CREATE OR REPLACE FUNCTION public.fn_is_store_member');
    const fnEnd = sqlContent.indexOf('$$;', fnStart);
    const fnBody = sqlContent.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes('FROM public.organization_members'),
      'Must verify membership in the store organization'
    );
  });

  it('fn_is_store_member is granted to authenticated and service_role only', () => {
    assert.ok(
      sqlContent.includes('GRANT EXECUTE ON FUNCTION public.fn_is_store_member(UUID) TO authenticated, service_role') &&
      sqlContent.includes('GRANT EXECUTE ON FUNCTION public.fn_is_store_member(TEXT) TO authenticated, service_role'),
      'Must grant UUID and TEXT overloads to authenticated and service_role'
    );
  });

  it('fn_is_store_member overload accepts TEXT for store_id text columns', () => {
    assert.ok(
      sqlContent.includes('fn_is_store_member(p_store_id TEXT)'),
      'Must provide TEXT overload for fn_is_store_member'
    );
  });

  it('fn_is_store_member execution revoked from anon', () => {
    assert.ok(
      sqlContent.includes('REVOKE EXECUTE ON FUNCTION public.fn_is_store_member(UUID) FROM anon'),
      'Must revoke from anon'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-06: Migration — Store-Only Table RLS Policies
// ═══════════════════════════════════════════════════════════════════

describe('P4-06: Migration — Store-Only Table RLS', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815100000_phase4_strict_multi_tenant_enforcement.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Migration applies RLS to store-only tables using fn_is_store_member', () => {
    assert.ok(
      sqlContent.includes('strict_store_tenant_isolation'),
      'Must create strict_store_tenant_isolation policies'
    );
    assert.ok(
      sqlContent.includes('fn_is_store_member(store_id)'),
      'Policy must use fn_is_store_member(store_id)'
    );
  });

  it('Covers key store-only tables', () => {
    const storeOnlyTables = [
      'umkm_inbox_notes',
      'umkm_knowledge_access_policies',
      'umkm_marketing_channels',
      'umkm_settings_api_keys',
      'umkm_settings_team_members',
      'umkm_zega_copilot_chats',
    ];
    for (const table of storeOnlyTables) {
      assert.ok(
        sqlContent.includes(`'${table}'`),
        `Must cover store-only table: ${table}`
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-07: Migration — Marketplace Catalog Read-Only RLS
// ═══════════════════════════════════════════════════════════════════

describe('P4-07: Migration — Marketplace Catalog Read-Only RLS', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815100000_phase4_strict_multi_tenant_enforcement.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Migration creates read-only catalog policies', () => {
    assert.ok(
      sqlContent.includes('catalog_read_only'),
      'Must create catalog_read_only policies for marketplace tables'
    );
  });

  it('Covers global marketplace tables', () => {
    const catalogTables = [
      'umkm_marketplace_agents',
      'umkm_marketplace_articles',
      'umkm_marketplace_categories',
      'umkm_marketplace_integrations',
      'umkm_marketplace_modules',
      'umkm_whats_new',
    ];
    for (const table of catalogTables) {
      assert.ok(
        sqlContent.includes(`'${table}'`),
        `Must cover catalog table: ${table}`
      );
    }
  });

  it('System tables restricted to service_role', () => {
    assert.ok(
      sqlContent.includes('system_service_role_only'),
      'Must create service_role-only policies for system tables'
    );
    assert.ok(
      sqlContent.includes("'umkm_rate_limits'"),
      'Must cover umkm_rate_limits as system table'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-08: Migration — organization_members.status Column
// ═══════════════════════════════════════════════════════════════════

describe('P4-08: Migration — organization_members.status Support', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815100000_phase4_strict_multi_tenant_enforcement.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Migration adds status column to organization_members', () => {
    assert.ok(
      sqlContent.includes("ADD COLUMN status TEXT DEFAULT 'active'"),
      'Must add status column with active default'
    );
  });

  it('Migration checks column existence before adding (idempotent)', () => {
    assert.ok(
      sqlContent.includes("table_name = 'organization_members' AND column_name = 'status'"),
      'Must check if status column already exists'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-09: Migration — Performance Indexes
// ═══════════════════════════════════════════════════════════════════

describe('P4-09: Migration — Performance Indexes', () => {
  const migrationPath = resolve(
    __dirname,
    '../../../../supabase/migrations/20260815100000_phase4_strict_multi_tenant_enforcement.sql'
  );
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Creates index on umkm_stores.organization_id', () => {
    assert.ok(
      sqlContent.includes('idx_umkm_stores_org_id'),
      'Must create index on umkm_stores.organization_id for fn_is_store_member resolution'
    );
  });

  it('Creates composite index on organization_members for RLS lookups', () => {
    assert.ok(
      sqlContent.includes('idx_org_members_user_org_status'),
      'Must create composite index for membership lookups'
    );
  });

  it('Migration is wrapped in transaction', () => {
    assert.ok(sqlContent.includes('BEGIN;'), 'Must start with BEGIN');
    assert.ok(sqlContent.includes('COMMIT;'), 'Must end with COMMIT');
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-10: Invoice + Payment — Consistent Fail-Closed Pattern
// ═══════════════════════════════════════════════════════════════════

describe('P4-10: Invoice + Payment — Consistent Fail-Closed', () => {
  const invoiceSrc = readSource('../routes/v1/invoice.routes.ts');
  const paymentSrc = readSource('../routes/v1/payment.routes.ts');

  it('Both invoice and payment routes deny orphan records', () => {
    assert.ok(
      invoiceSrc.includes("'INVOICE_TENANT_MISSING'"),
      'Invoice must deny orphan records'
    );
    assert.ok(
      paymentSrc.includes("'PAYMENT_TENANT_MISSING'"),
      'Payment must deny orphan records'
    );
  });

  it('Both routes require tenant context middleware', () => {
    assert.ok(invoiceSrc.includes('requireTenantContext'), 'Invoice must use requireTenantContext');
    assert.ok(paymentSrc.includes('requireTenantContext'), 'Payment must use requireTenantContext');
  });

  it('Both routes require JWT authentication', () => {
    assert.ok(invoiceSrc.includes('jwtVerify'), 'Invoice must verify JWT');
    assert.ok(paymentSrc.includes('jwtVerify'), 'Payment must verify JWT');
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-11: Agent Routes — Tenant-Scoped createAgent Call
// ═══════════════════════════════════════════════════════════════════

describe('P4-11: Agent Routes — createAgent with Required orgId', () => {
  const agentSrc = readSource('../routes/v1/agent.routes.ts');

  it('agent.routes.ts passes organizationId from principal', () => {
    assert.ok(
      agentSrc.includes('organizationId: principal.organizationId'),
      'Must pass principal.organizationId to createAgent'
    );
  });

  it('agent.routes.ts passes userId from principal', () => {
    assert.ok(
      agentSrc.includes('userId: principal.userId'),
      'Must pass principal.userId to createAgent'
    );
  });

  it('All agent routes require tenant context', () => {
    assert.ok(
      agentSrc.includes('requireTenantContext'),
      'Agent routes must enforce tenant context'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// P4-12: R2 Storage — Organization Path Enforcement
// ═══════════════════════════════════════════════════════════════════

describe('P4-12: R2 Storage — Organization Path Scoping', () => {
  const r2Src = readSource('../services/r2StorageService.ts');

  it('Presigned URL path includes organization prefix', () => {
    assert.ok(
      r2Src.includes('organizations/${organizationId}/'),
      'Presigned upload URL must scope path under organizations/'
    );
  });

  it('Privy audit certificate path is org-scoped', () => {
    assert.ok(
      r2Src.includes('organizations/${organizationId}/privy-audits'),
      'Privy audit cert must be under organizations/{orgId}/privy-audits'
    );
  });

  it('Withdrawal proof path is org-scoped', () => {
    assert.ok(
      r2Src.includes('organizations/${orgPrefix}/withdrawal-proofs'),
      'Withdrawal proof must be under organizations/{orgId}/withdrawal-proofs'
    );
  });
});
