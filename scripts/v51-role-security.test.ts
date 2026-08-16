/**
 * ZEGA.AI v5.1 — Role Security Test
 * Validates BYPASSRLS, SUPERUSER, CREATEROLE, CREATEDB checks.
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

describe('v5.1 Role Security', () => {
  it('INV-16: No BYPASSRLS roles', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    expect(data.find(r => r.check_id === 16).status).toBe('PASSED');
  });
  it('INV-17: No SUPERUSER app roles', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    expect(data.find(r => r.check_id === 17).status).toBe('PASSED');
  });
  it('INV-37: No CREATEROLE', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 37).status).toBe('PASSED');
  });
  it('INV-38: No CREATEDB', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 38).status).toBe('PASSED');
  });
  it('INV-28: No anon SECDEF execute', async () => {
    const d = await rpc('run_certification_v51_extended');
    expect(d.find(r => r.check_id === 28).status).toBe('PASSED');
  });
});
