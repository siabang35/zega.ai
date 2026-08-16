/**
 * ZEGA.AI v5.1 — RLS Policy Test
 * Validates SELECT/INSERT/UPDATE/DELETE policy coverage and safety.
 */
const { describe, it, expect } = require('@jest/globals');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}'
  });
  return res.json();
}

describe('v5.1 RLS Policy Audit', () => {
  it('INV-04: RLS enabled', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 4).status).toBe('PASSED');
  });
  it('INV-05: FORCE RLS enabled', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 5).status).toBe('PASSED');
  });
  it('INV-12: Policy exists on tenant tables', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 12).status).toBe('PASSED');
  });
  it('INV-13: No unsafe USING(true)', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 13).status).toBe('PASSED');
  });
  it('INV-14: No unsafe WITH CHECK(true)', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 14).status).toBe('PASSED');
  });
  it('INV-31..34: SELECT/INSERT/UPDATE/DELETE coverage', async () => {
    const d = await rpc('run_certification_v51_extended');
    for (const id of [31, 32, 33, 34]) {
      expect(d.find(r => r.check_id === id).status).toBe('PASSED');
    }
  });
  it('INV-43: No RLS-enabled table without policy', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 43).status).toBe('PASSED');
  });
  it('INV-47: No public permissive policies', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 47).status).toBe('PASSED');
  });
});
