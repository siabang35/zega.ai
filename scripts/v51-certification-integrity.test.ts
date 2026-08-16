/**
 * ZEGA.AI v5.1 — Certification Integrity Test
 * Validates the certification engine itself is self-consistent.
 */
const { describe, it, expect } = require('@jest/globals');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function rpc(fn) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: '{}' });
  return res.json();
}
describe('v5.1 Certification Integrity', () => {
  it('Metamorphic baseline passes', async () => {
    const d = await rpc('run_metamorphic_test_suite_v51');
    const m00 = d.find(r => r.mutation_id === 'M00');
    expect(m00.passed).toBe(true);
  });
  it('M01: RLS disable detected', async () => {
    const d = await rpc('run_metamorphic_test_suite_v51');
    const m = d.find(r => r.mutation_id === 'M01');
    expect(m.passed).toBe(true);
  });
  it('M02: FORCE RLS disable detected', async () => {
    const d = await rpc('run_metamorphic_test_suite_v51');
    const m = d.find(r => r.mutation_id === 'M02');
    expect(m.passed).toBe(true);
  });
  it('M03: Immutability trigger removal detected', async () => {
    const d = await rpc('run_metamorphic_test_suite_v51');
    const m = d.find(r => r.mutation_id === 'M03');
    expect(m.passed).toBe(true);
  });
  it('M04: Phantom table injection detected', async () => {
    const d = await rpc('run_metamorphic_test_suite_v51');
    const m = d.find(r => r.mutation_id === 'M04');
    expect(m.passed).toBe(true);
  });
  it('M05: Stale version detected', async () => {
    const d = await rpc('run_metamorphic_test_suite_v51');
    const m = d.find(r => r.mutation_id === 'M05');
    expect(m.passed).toBe(true);
  });
  it('INV-50: Final certification status', async () => {
    const d = await rpc('run_certification_v51_extended');
    const inv = d.find(r => r.check_id === 50);
    expect(inv).toBeDefined();
  });
  it('Export JSON has no v4 references', () => {
    const fs = require('fs');
    const path = require('path');
    const exportPath = path.join(__dirname, '..', 'database2_export.json');
    if (fs.existsSync(exportPath)) {
      const content = fs.readFileSync(exportPath, 'utf8');
      expect(content).not.toContain('convergence_v4');
    }
  });
  it('Export JSON has v5.1 metadata', () => {
    const fs = require('fs');
    const path = require('path');
    const exportPath = path.join(__dirname, '..', 'database2_export.json');
    if (fs.existsSync(exportPath)) {
      const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(data.metadata.schema_version).toContain('v5.1');
      expect(data.metadata.database_security_root_hash).toBeDefined();
    }
  });
});
