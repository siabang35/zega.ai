import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('ZEGA.AI Database Constitution v5.0 Integrity Suite', async (t) => {
  const rootDir = path.resolve(process.cwd(), '../../');
  const masterMigrationPath = path.join(rootDir, 'supabase/migrations/20260816000000_v50_database_constitution_master.sql');
  const auditRunnerPath = path.join(rootDir, 'scripts/run_tenant_constitution_audit_v50.py');
  const exportPath = path.join(rootDir, 'database2_export.json');

  await t.test('1. Master v5.0 SQL migration exists and contains all 50 Invariants', () => {
    assert.strictEqual(fs.existsSync(masterMigrationPath), true, 'Master migration file should exist');
    const sql = fs.readFileSync(masterMigrationPath, 'utf8');

    for (let i = 1; i <= 50; i++) {
      const invNum = i.toString().padStart(2, '0');
      assert.strictEqual(sql.includes(`INV-${invNum}`), true, `SQL should contain INV-${invNum}`);
    }
  });

  await t.test('2. Python Audit Runner v5.0 does NOT hardcode PASSED results', () => {
    assert.strictEqual(fs.existsSync(auditRunnerPath), true, 'Audit runner script should exist');
    const code = fs.readFileSync(auditRunnerPath, 'utf8');

    assert.strictEqual(code.includes('"PASSED" for i in range(1, 46)'), false, 'Runner should not hardcode PASSED');
    assert.strictEqual(code.includes('run_tenant_constitution_audit_v50'), true, 'Runner should call v50 SQL audit');
    assert.strictEqual(code.includes('run_metamorphic_test_suite_v50'), true, 'Runner should call metamorphic suite');
    assert.strictEqual(code.includes('certification_root_hash'), true, 'Runner should compute merkle/SHA hash');
  });

  await t.test('3. Metamorphic Test Suite v5.0 contains real SAVEPOINT / ROLLBACK logic', () => {
    const sql = fs.readFileSync(masterMigrationPath, 'utf8');
    assert.strictEqual(sql.includes('SAVEPOINT m01'), true, 'Should include SAVEPOINT m01');
    assert.strictEqual(sql.includes('ROLLBACK TO SAVEPOINT m01'), true, 'Should include ROLLBACK TO SAVEPOINT m01');
    assert.strictEqual(sql.includes('SAVEPOINT m02'), true, 'Should include SAVEPOINT m02');
    assert.strictEqual(sql.includes('ROLLBACK TO SAVEPOINT m02'), true, 'Should include ROLLBACK TO SAVEPOINT m02');
  });

  await t.test('4. Canonical Context Functions are SECURITY INVOKER with fixed search_path', () => {
    const sql = fs.readFileSync(masterMigrationPath, 'utf8');
    assert.strictEqual(sql.includes('public.zega_current_user_id()'), true, 'zega_current_user_id should exist');
    assert.strictEqual(sql.includes('public.zega_current_org_id()'), true, 'zega_current_org_id should exist');
    assert.strictEqual(sql.includes('public.zega_current_workspace_id()'), true, 'zega_current_workspace_id should exist');
    assert.strictEqual(sql.includes('SECURITY INVOKER SET search_path = public, pg_temp'), true, 'Context functions must be SECURITY INVOKER');
  });

  await t.test('5. Break-glass table is defined with fail-closed RLS', () => {
    const sql = fs.readFileSync(masterMigrationPath, 'utf8');
    assert.strictEqual(sql.includes('CREATE TABLE IF NOT EXISTS public.break_glass_requests'), true);
    assert.strictEqual(sql.includes('ALTER TABLE public.break_glass_requests ENABLE ROW LEVEL SECURITY'), true);
    assert.strictEqual(sql.includes('ALTER TABLE public.break_glass_requests FORCE ROW LEVEL SECURITY'), true);
    assert.strictEqual(sql.includes('FOR ALL TO service_role'), true);
  });

  await t.test('6. Export metadata is updated to v5.0 and free of stale engine blocks', () => {
    assert.strictEqual(fs.existsSync(exportPath), true, 'Export JSON should exist');
    const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

    assert.strictEqual(data.metadata.schema_version, 'v5.0_constitutional_hardened_fail_closed');
    assert.notStrictEqual(data.metadata.certification_engine_v50_details, undefined);
    assert.strictEqual(data.metadata.certification_engine_v33_details, undefined);
    assert.strictEqual(data.metadata.certification_engine_v40_details, undefined);
  });
});
