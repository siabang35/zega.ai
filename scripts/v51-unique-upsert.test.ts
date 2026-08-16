/**
 * ZEGA.AI v5.1 — Unique Constraint & UPSERT Isolation Test
 * Validates tenant-scoped uniqueness and safe ON CONFLICT behavior.
 */
const { describe, it, expect } = require('@jest/globals');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
  return res.json();
}
describe('v5.1 Unique & UPSERT', () => {
  it('INV-02: Manifest uniqueness', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 2).status).toBe('PASSED');
  });
  it('INV-09: Zero fallback UUID', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 9).status).toBe('PASSED');
  });
});
