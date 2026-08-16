/**
 * ZEGA.AI v5.1 — Break-Glass Governance Test
 * Validates break-glass table, RLS, and no-self-approval constraint.
 */
const { describe, it, expect } = require('@jest/globals');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
  return res.json();
}
describe('v5.1 Break-Glass', () => {
  it('INV-25: Control plane RLS', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 25).status).toBe('PASSED');
  });
  it('INV-39: Break-glass table exists', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 39).status).toBe('PASSED');
  });
  it('INV-48: Membership integrity', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 48).status).toBe('PASSED');
  });
});
