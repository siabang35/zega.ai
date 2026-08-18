import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('ZEGA.AI v5.3 Certification & Database Export Integrity Test Suite', async (t) => {
  let rootDir = process.cwd();
  while (rootDir !== path.parse(rootDir).root && !fs.existsSync(path.join(rootDir, 'database2_export.json'))) {
    rootDir = path.dirname(rootDir);
  }
  const exportPath = path.join(rootDir, 'database2_export.json');
  const remediationSql = path.join(rootDir, 'supabase/migrations/20260817010000_v53_database_constitution_deep_remediation.sql');
  const auditScript = path.join(rootDir, 'scripts/run_tenant_constitution_audit_v53.py');
  const updateScript = path.join(rootDir, 'scripts/update_database2_export_v53.py');
  const liveRemediationScript = path.join(rootDir, 'scripts/v53_final_live_remediation_suite.py');

  await t.test('1. Database export file exists and conforms to v5.3 Database Constitution', () => {
    assert.strictEqual(fs.existsSync(exportPath), true, 'database2_export.json must exist');
    const exportContent = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    assert.strictEqual(exportContent.version, 'v5.3', 'Version must be v5.3');
    assert.strictEqual(exportContent.constitution_version, 'v5.3', 'Constitution version must be v5.3');
    assert.strictEqual(exportContent.last_audit_version, 'v5.3', 'Last audit version must be v5.3');
    assert.ok(exportContent.total_relations >= 415, 'Total relations must be at least 415');
    assert.ok(exportContent.tables, 'Tables object must exist');
  });

  await t.test('2. Remediated P0 tables are TENANT_SCOPED with ENFORCED_V53 status', () => {
    const exportContent = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    const remediatedTables = [
      'umkm_ai_assistant_messages',
      'umkm_copilot_messages',
      'umkm_finance_ai_messages',
      'umkm_finance_messages',
      'umkm_help_live_messages',
      'umkm_live_help_messages',
      'umkm_zega_copilot_messages',
      'umkm_help_tickets',
      'withdrawal_audit_logs',
      'umkm_finance_chats'
    ];

    for (const tbl of remediatedTables) {
      const tableData = exportContent.tables[tbl];
      assert.ok(tableData, `Table ${tbl} must exist in database2_export.json`);
      assert.strictEqual(tableData.ownership_model, 'TENANT_SCOPED', `${tbl} must be TENANT_SCOPED`);
      assert.strictEqual(tableData.v53_remediated, true, `${tbl} must be v53_remediated`);
      assert.strictEqual(tableData.child_lineage_verified, true, `${tbl} must have verified child lineage`);
      
      const hasOrgId = Array.isArray(tableData.columns) && tableData.columns.some((c: any) => c.column_name === 'organization_id');
      assert.strictEqual(hasOrgId, true, `${tbl} must have organization_id column`);
    }
  });

  await t.test('3. v5.3 Deep Remediation SQL migration exists and contains catalog parity bindings', () => {
    assert.strictEqual(fs.existsSync(remediationSql), true, 'Remediation migration must exist');
    const sqlContent = fs.readFileSync(remediationSql, 'utf8');
    assert.strictEqual(sqlContent.includes('v5.3'), true, 'Must include v5.3 catalog updates');
    assert.strictEqual(sqlContent.includes('tenant_security_manifest'), true, 'Must reference tenant_security_manifest');
  });

  await t.test('4. Audit & update scripts exist and reference v5.3 Constitution standard', () => {
    assert.strictEqual(fs.existsSync(auditScript), true, 'run_tenant_constitution_audit_v53.py must exist');
    assert.strictEqual(fs.existsSync(updateScript), true, 'update_database2_export_v53.py must exist');
    assert.strictEqual(fs.existsSync(liveRemediationScript), true, 'v53_final_live_remediation_suite.py must exist');

    const updateContent = fs.readFileSync(updateScript, 'utf8');
    assert.strictEqual(updateContent.includes('v5.3'), true, 'Update script must bind to v5.3');
  });
});
