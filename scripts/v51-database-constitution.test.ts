/**
 * ZEGA.AI v5.1 — Database Constitution Master Test
 * Tests all 50 dynamic invariants via RPC.
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

describe('v5.1 Database Constitution', () => {
  it('INV-01..25 all pass via run_tenant_constitution_audit_v51', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    const results = data.filter(r => r.check_name !== '_INTERNAL_COUNTERS');
    const failed = results.filter(r => r.status === 'FAILED');
    const unverified = results.filter(r => r.status === 'UNVERIFIED');
    expect(failed.length).toBe(0);
    expect(unverified.length).toBe(0);
  });

  it('INV-26..50 all pass via run_certification_v51_extended', async () => {
    const data = await rpc('run_certification_v51_extended');
    const failed = data.filter(r => r.status === 'FAILED');
    const unverified = data.filter(r => r.status === 'UNVERIFIED');
    expect(failed.length).toBe(0);
    expect(unverified.length).toBe(0);
  });

  it('INV-22: No stale v4 trigger references', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    const inv22 = data.find(r => r.check_id === 22);
    expect(inv22).toBeDefined();
    expect(inv22.status).toBe('PASSED');
    expect(inv22.violating_count).toBe(0);
  });

  it('INV-36: Manifest version is v5.1', async () => {
    const data = await rpc('run_certification_v51_extended');
    const inv36 = data.find(r => r.check_id === 36);
    expect(inv36).toBeDefined();
    expect(inv36.status).toBe('PASSED');
  });
});
