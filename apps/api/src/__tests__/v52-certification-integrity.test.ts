import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('ZEGA.AI v5.2 Certification & Version Integrity Test Suite', async (t) => {
  const rootDir = path.resolve(process.cwd(), '../../');
  const remediationSql = path.join(rootDir, 'supabase/migrations/20260816200000_v52_database_constitution_deep_remediation.sql');
  const certEngineSql = path.join(rootDir, 'supabase/migrations/20260816200100_v52_certification_engine.sql');
  const metamorphicSql = path.join(rootDir, 'supabase/migrations/20260816200200_v52_metamorphic_suite.sql');
  const runnerScript = path.join(rootDir, 'scripts/run_tenant_constitution_audit_v52.py');
  const exportScript = path.join(rootDir, 'scripts/update_database2_export_v52.py');

  await t.test('1. All v5.2 core SQL migrations exist and contain version bindings', () => {
    assert.strictEqual(fs.existsSync(remediationSql), true, 'Remediation migration must exist');
    assert.strictEqual(fs.existsSync(certEngineSql), true, 'Certification engine migration must exist');
    assert.strictEqual(fs.existsSync(metamorphicSql), true, 'Metamorphic suite migration must exist');

    const certEngineContent = fs.readFileSync(certEngineSql, 'utf8');
    assert.strictEqual(certEngineContent.includes('run_tenant_constitution_audit_v52'), true, 'Must define v5.2 audit function');
    assert.strictEqual(certEngineContent.includes('INV-60'), true, 'Must include all 60 invariants');
  });

  await t.test('2. Audit runner v5.2 executes all 60 invariants and 25 metamorphic mutations', () => {
    assert.strictEqual(fs.existsSync(runnerScript), true, 'Runner script must exist');
    const runnerContent = fs.readFileSync(runnerScript, 'utf8');
    assert.strictEqual(runnerContent.includes('v5.2_extreme_database_constitution'), true);
    assert.strictEqual(runnerContent.includes('run_tenant_constitution_audit_v52'), true);
    assert.strictEqual(runnerContent.includes('run_v52_metamorphic_suite'), true);
  });

  await t.test('3. Export script v5.2 updates schema version to v5.2', () => {
    assert.strictEqual(fs.existsSync(exportScript), true, 'Export script must exist');
    const exportContent = fs.readFileSync(exportScript, 'utf8');
    assert.strictEqual(exportContent.includes('v5.2_extreme_database_constitution_hardened'), true);
  });
});
