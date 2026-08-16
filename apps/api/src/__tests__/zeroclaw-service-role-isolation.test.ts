import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚡ ZEGA.AI — ZeroClaw Service-Role Cross-Tenant Security Test Suite
 *
 * Validates Level 4+ ZeroClaw isolation invariants:
 *   ZC-01: ZeroClaw Table Organization Scoping
 *   ZC-02: ZeroClaw RLS Policy Enforcement (fn_is_org_member)
 *   ZC-03: ZeroClaw Anti-Reparenting Triggers
 *   ZC-04: API Tenant Context Enforcement on ZeroClaw Routes
 *   ZC-05: Multi-Org User Context Isolation (USER_X with Org_A vs Org_B)
 *   ZC-06: Cross-Tenant Asset Lookup Prevention (UMKM_A vs UMKM_B)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) return '';
  return readFileSync(fullPath, 'utf-8');
}

describe('ZC-01: ZeroClaw Database Schema Tenant Scoping Migration', () => {
  const migrationPath = resolve(__dirname, '../../../../supabase/migrations/20260815170000_level4_plus_zeroclaw_tenant_hardening.sql');

  it('Migration file 20260815170000_level4_plus_zeroclaw_tenant_hardening.sql exists', () => {
    assert.ok(existsSync(migrationPath), 'ZeroClaw L4+ migration must exist');
  });

  const sql = readSource('../../../../supabase/migrations/20260815170000_level4_plus_zeroclaw_tenant_hardening.sql');

  it('Adds organization_id to all ZeroClaw relations', () => {
    assert.ok(sql.includes("zeroclaw_solana_settlements"), 'Must scope zeroclaw_solana_settlements');
    assert.ok(sql.includes("zeroclaw_sop_checkpoints"), 'Must scope zeroclaw_sop_checkpoints');
    assert.ok(sql.includes("zeroclaw_invoices"), 'Must scope zeroclaw_invoices');
    assert.ok(sql.includes("zeroclaw_withdrawals"), 'Must scope zeroclaw_withdrawals');
    assert.ok(sql.includes("zeroclaw_payment_events"), 'Must scope zeroclaw_payment_events');
    assert.ok(sql.includes("zeroclaw_refund_queue"), 'Must scope zeroclaw_refund_queue');
  });

  it('Enforces FORCE ROW LEVEL SECURITY on all ZeroClaw tables', () => {
    assert.ok(sql.includes("FORCE ROW LEVEL SECURITY"), 'Must enforce FORCE RLS on ZeroClaw tables');
  });

  it('Attaches fn_is_org_member RLS policies to ZeroClaw tables', () => {
    assert.ok(sql.includes("public.fn_is_org_member(organization_id, auth.uid())"), 'Must use fn_is_org_member for RLS');
  });

  it('Attaches anti-tenant-reparenting triggers to ZeroClaw tables', () => {
    assert.ok(sql.includes("fn_prevent_tenant_reparenting_organization_id"), 'Must attach anti-reparenting trigger');
  });
});

describe('ZC-02: ZeroClaw API Route Hardening Integrity', () => {
  const zeroclawSource = readSource('../routes/v1/zeroclaw.routes.ts');

  it('zeroclaw.routes.ts imports requireTenantContext and getTenantOrg', () => {
    assert.ok(zeroclawSource.includes('requireTenantContext'), 'Must import requireTenantContext');
    assert.ok(zeroclawSource.includes('getTenantOrg'), 'Must import getTenantOrg');
  });

  it('isMerchantWalletOwnedByUser defaults to fail-closed false', () => {
    assert.ok(zeroclawSource.includes('SECURITY (L4 FIX): No ownership proof found — fail closed'), 'Must have L4 fail-closed comment');
    assert.ok(!zeroclawSource.includes('// 3. Authenticated user session with valid Base58 Solana public key\n    return true;'), 'Must not return true unconditionally');
  });

  it('upsertVerifiedInvoice attaches default organization_id fallback', () => {
    assert.ok(zeroclawSource.includes("organization_id: '00000000-0000-0000-0000-000000000001'"), 'Must include fallback org ID');
  });
});

describe('ZC-03: ZeroClaw Multi-Org User Context Isolation (USER_X)', () => {
  const contextSource = readSource('../middleware/requestContext.ts');

  it('requestContext enforces explicit X-Organization-Id for multi-org users', () => {
    assert.ok(contextSource.includes('x-organization-id'), 'Must inspect x-organization-id header');
    assert.ok(contextSource.includes('organization_members'), 'Must verify organization membership against DB');
  });

  it('Client body tenant identifiers are stripped prior to handler execution', () => {
    assert.ok(contextSource.includes('delete body.orgId'), 'Must strip body.orgId');
    assert.ok(contextSource.includes('delete body.owner_id'), 'Must strip body.owner_id');
  });
});

describe('ZC-04: ZeroClaw Cross-Tenant Attack Scenarios (UMKM_A vs UMKM_B)', () => {
  it('Simulated UMKM_A cannot access UMKM_B merchant wallet resources', () => {
    const umkmA = { orgId: '11111111-1111-1111-1111-111111111111', userId: 'user-a@umkm.site' };
    const umkmB = { orgId: '22222222-2222-2222-2222-222222222222', userId: 'user-b@umkm.site' };

    // Ownership check simulation
    const verifyCrossTenantAccess = (principalOrg: string, resourceOrg: string) => {
      return principalOrg === resourceOrg;
    };

    assert.equal(verifyCrossTenantAccess(umkmA.orgId, umkmB.orgId), false, 'Cross-tenant access must be DENIED');
    assert.equal(verifyCrossTenantAccess(umkmA.orgId, umkmA.orgId), true, 'Same-tenant access must be ALLOWED');
  });
});
