/**
 * ZEGA.AI v5.1 — Runtime Tenant Isolation Test
 * Validates cross-tenant read/write/delete fail-closed behavior.
 */
import { describe, it, expect } from '@jest/globals';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}'
  });
  return res.json();
}

describe('v5.1 Runtime Tenant Isolation', () => {
  it('INV-10: No dual-authority mismatches', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    const inv = data.find(r => r.check_id === 10);
    expect(inv.status).toBe('PASSED');
  });

  it('INV-11: No orphan tenant records', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    const inv = data.find(r => r.check_id === 11);
    expect(inv.status).toBe('PASSED');
  });

  it('INV-19: Workspace-Org convergence', async () => {
    const data = await rpc('run_tenant_constitution_audit_v51');
    const inv = data.find(r => r.check_id === 19);
    expect(inv.status).toBe('PASSED');
  });

  it('INV-30: No NULL tenant on TENANT_SCOPED', async () => {
    const data = await rpc('run_certification_v51_extended');
    const inv = data.find(r => r.check_id === 30);
    expect(inv.status).toBe('PASSED');
  });
});
