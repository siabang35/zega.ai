/**
 * ZEGA.AI v5.1 — Composite FK Test
 * Validates composite foreign key constraints for hierarchical ownership.
 */
const { describe, it, expect } = require('@jest/globals');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
  return res.json();
}
describe('v5.1 Composite FK', () => {
  it('INV-07: Tenant FK integrity', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 7).status).toBe('PASSED');
  });
  it('INV-35: Workspace FK->Org', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 35).status).toBe('PASSED');
  });
  it('INV-45: Workspace composite unique', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 45).status).toBe('PASSED');
  });
  it('INV-46: Store-Org FK', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 46).status).toBe('PASSED');
  });
});
