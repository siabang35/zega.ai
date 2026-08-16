const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../apps/api/.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required in .env.');
  process.exit(1);
}


async function deleteTableContent(tableName) {
  console.log(`\n----------------------------------------`);
  console.log(`Processing reset for table: ${tableName}`);

  // Step 1: Count before
  let beforeCount = 0;
  try {
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    if (countRes.ok) {
      const contentRange = countRes.headers.get('content-range');
      if (contentRange) {
        beforeCount = parseInt(contentRange.split('/')[1] || '0', 10);
      }
    }
  } catch (err) {
    console.error(`  [!] Error counting rows before deletion for ${tableName}:`, err.message);
  }

  if (beforeCount === 0) {
    console.log(`  [+] ${tableName} is already clean (0 rows). No deletion needed.`);
    return { table: tableName, before: 0, deleted: 0, after: 0 };
  }

  console.log(`  [*] ${tableName} currently has ${beforeCount} rows. Executing deletion...`);

  // Step 2: Fetch sample primary key column or all rows to delete
  let deletedCount = 0;
  try {
    // Attempt standard PostgREST bulk delete using broad filter
    // Try multiple common PK filter options: id, created_at, or fetching primary keys
    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?or=(id.not.is.null,created_at.not.is.null,organization_id.not.is.null)`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact, return=minimal'
      }
    });

    if (deleteRes.ok) {
      const contentRange = deleteRes.headers.get('content-range');
      if (contentRange) {
        deletedCount = parseInt(contentRange.split('/')[1] || `${beforeCount}`, 10);
      } else {
        deletedCount = beforeCount;
      }
      console.log(`  [✓] Bulk DELETE successful for ${tableName}. Deleted ~${deletedCount} rows.`);
    } else {
      // Fallback: fetch IDs and delete in batches
      console.log(`  [!] Bulk DELETE endpoint returned ${deleteRes.status}. Falling back to chunked ID deletion...`);
      const getRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1000`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      const rows = await getRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const pkCol = rows[0].id !== undefined ? 'id' : Object.keys(rows[0])[0];
        const ids = rows.map(r => r[pkCol]).filter(v => v !== undefined && v !== null);
        
        if (ids.length > 0) {
          const chunkRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?${pkCol}=in.("${ids.join('","')}")`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Prefer': 'count=exact'
            }
          });
          if (chunkRes.ok) {
            deletedCount = ids.length;
            console.log(`  [✓] Chunked DELETE successful for ${tableName} on PK ${pkCol}. Deleted ${deletedCount} rows.`);
          } else {
            console.error(`  [x] Failed chunked DELETE for ${tableName}:`, await chunkRes.text());
          }
        }
      }
    }
  } catch (err) {
    console.error(`  [x] Error during DELETE for ${tableName}:`, err.message);
  }

  // Step 3: Count after
  let afterCount = 0;
  try {
    const afterRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    if (afterRes.ok) {
      const contentRange = afterRes.headers.get('content-range');
      if (contentRange) {
        afterCount = parseInt(contentRange.split('/')[1] || '0', 10);
      }
    }
  } catch (err) {}

  console.log(`  [=] Result for ${tableName}: Before=${beforeCount}, Deleted=${deletedCount}, After=${afterCount}`);
  return { table: tableName, before: beforeCount, deleted: deletedCount, after: afterCount };
}

async function runReset() {
  console.log('================================================================================');
  console.log('            ZEGA COMPLETE PRODUCTION-GRADE BUSINESS DATA RESET EXECUTION        ');
  console.log('================================================================================');

  const preInventoryPath = '/tmp/zega_pre_reset_inventory.json';
  if (!fs.existsSync(preInventoryPath)) {
    throw new Error(`Pre-reset inventory file ${preInventoryPath} not found!`);
  }

  const inventory = JSON.parse(fs.readFileSync(preInventoryPath, 'utf8'));
  const resetAllowlist = inventory.filter(item => item.reset_strategy === 'DELETE');

  console.log(`\nFound ${inventory.length} total tables. Allowlist contains ${resetAllowlist.length} tables to reset.`);

  // Dependency ordering groups:
  // 1. KPI / Analytics / Telemetry / Activity derived tables
  // 2. AI Memory / Agent Actions / RAG Vector state
  // 3. Knowledge Base docs & datasets
  // 4. Order items, payments, withdrawals, invoices
  // 5. Orders, products, customers, CRM, inventory, campaigns
  // 6. Remaining allowlisted tables

  const group1 = resetAllowlist.filter(item => item.classification === 'DERIVED_KPI' || item.classification === 'ANALYTICS_DATA' || item.classification === 'CACHE');
  const group2 = resetAllowlist.filter(item => item.classification === 'AI_DATA');
  const group3 = resetAllowlist.filter(item => item.classification === 'KNOWLEDGE_DATA');
  const group4 = resetAllowlist.filter(item => item.classification === 'FINANCIAL_DATA');
  const group5 = resetAllowlist.filter(item => item.classification === 'CUSTOMER_BUSINESS_DATA');
  const remaining = resetAllowlist.filter(item => 
    !group1.includes(item) && !group2.includes(item) && !group3.includes(item) && !group4.includes(item) && !group5.includes(item)
  );

  const orderedTables = [...group1, ...group2, ...group3, ...group4, ...group5, ...remaining];

  console.log(`\nExecution sequence prepared across ${orderedTables.length} tables in 6 dependency tiers.`);

  const auditLog = [];

  for (const item of orderedTables) {
    const res = await deleteTableContent(item.table);
    auditLog.push(res);
  }

  console.log('\n================================================================================');
  console.log('                          BUSINESS DATA RESET SUMMARY                           ');
  console.log('================================================================================');

  const totalBefore = auditLog.reduce((acc, x) => acc + x.before, 0);
  const totalDeleted = auditLog.reduce((acc, x) => acc + x.deleted, 0);
  const totalAfter = auditLog.reduce((acc, x) => acc + x.after, 0);

  console.log(`Total initial business rows evaluated : ${totalBefore}`);
  console.log(`Total business rows deleted            : ${totalDeleted}`);
  console.log(`Total remaining business rows          : ${totalAfter}`);

  fs.writeFileSync('/tmp/zega_reset_audit_log.json', JSON.stringify(auditLog, null, 2));
  console.log(`Saved execution audit log to /tmp/zega_reset_audit_log.json`);
}

runReset().catch(console.error);
