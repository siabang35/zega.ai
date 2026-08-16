/**
 * ZEGA.AI v5.1 — RAG Tenant Isolation Test
 * Validates AI/RAG/memory tables carry tenant scope.
 */
const { describe, it, expect } = require('@jest/globals');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
  return res.json();
}
describe('v5.1 RAG Isolation', () => {
  it('INV-23: AI/RAG tables have tenant metadata', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 23).status).toBe('PASSED');
  });
  it('INV-08: Immutability triggers on AI tables', async () => {
    const d = await rpc('run_tenant_constitution_audit_v51');
    expect(d.find(r => r.check_id === 8).status).toBe('PASSED');
  });
});
