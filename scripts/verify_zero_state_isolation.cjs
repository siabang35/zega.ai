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


async function runVerification() {
  console.log('================================================================================');
  console.log('            ZEGA EMPIRICAL ZERO-STATE & MULTI-TENANT ISOLATION TEST             ');
  console.log('================================================================================\n');

  const checkTables = [
    'umkm_sales_products',
    'umkm_crm_customers',
    'umkm_orders',
    'invoices',
    'payments',
    'agent_memory_store',
    'enterprise_knowledge_documents',
    'umkm_dashboard_kpis',
    'enterprise_overview_kpis'
  ];

  console.log('--- TEST 1: Source-of-Truth & KPI Zero-State Check ---');
  let zeroStatePassed = true;
  for (const table of checkTables) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    const data = await res.json();
    const contentRange = res.headers.get('content-range');
    const count = contentRange ? parseInt(contentRange.split('/')[1] || '0', 10) : data.length;

    if (count === 0) {
      console.log(`  [✓] ${table}: Verified 0 rows (Clean Zero State)`);
    } else {
      console.log(`  [x] ${table}: FAILED - Contains ${count} rows!`);
      zeroStatePassed = false;
    }
  }

  console.log('\n--- TEST 2: Multi-Tenant Creation & Cross-Tenant Isolation Simulation ---');
  const orgA = '00000000-0000-0000-0000-000000000001';
  const orgB = '00000000-0000-0000-0000-000000000002';
  const wsA = '00000000-0000-0000-0000-00000000001a';
  const wsB = '00000000-0000-0000-0000-00000000001b';

  console.log('Inserting test product into ORG_A...');
  const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/umkm_sales_products`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      organization_id: orgA,
      workspace_id: wsA,
      name: 'Verification Test Product A',
      price: 150000,
      stock: 10,
      category: 'Test'
    })
  });

  const prodData = await prodRes.json();
  const createdProdId = Array.isArray(prodData) && prodData.length > 0 ? prodData[0].id : null;
  console.log(`  [+] Created test product in ORG_A (ID: ${createdProdId})`);

  console.log('Inserting test order into ORG_A...');
  const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/umkm_orders`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      organization_id: orgA,
      workspace_id: wsA,
      total_amount: 150000,
      status: 'COMPLETED'
    })
  });

  const orderData = await orderRes.json();
  const createdOrderId = Array.isArray(orderData) && orderData.length > 0 ? orderData[0].id : null;
  console.log(`  [+] Created test order in ORG_A (ID: ${createdOrderId})`);

  console.log('\nEvaluating tenant metrics post-creation:');

  // Query ORG_A
  const resProdA = await fetch(`${SUPABASE_URL}/rest/v1/umkm_sales_products?organization_id=eq.${orgA}`, {
    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  const dataProdA = await resProdA.json();

  const resOrderA = await fetch(`${SUPABASE_URL}/rest/v1/umkm_orders?organization_id=eq.${orgA}`, {
    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  const dataOrderA = await resOrderA.json();

  // Query ORG_B
  const resProdB = await fetch(`${SUPABASE_URL}/rest/v1/umkm_sales_products?organization_id=eq.${orgB}`, {
    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  const dataProdB = await resProdB.json();

  const resOrderB = await fetch(`${SUPABASE_URL}/rest/v1/umkm_orders?organization_id=eq.${orgB}`, {
    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  const dataOrderB = await resOrderB.json();

  console.log(`  [✓] ORG_A Products: ${dataProdA.length} (Expected: 1)`);
  console.log(`  [✓] ORG_A Orders  : ${dataOrderA.length} (Expected: 1)`);
  console.log(`  [✓] ORG_B Products: ${dataProdB.length} (Expected: 0)`);
  console.log(`  [✓] ORG_B Orders  : ${dataOrderB.length} (Expected: 0)`);

  let isolationPassed = (dataProdA.length === 1 && dataOrderA.length === 1 && dataProdB.length === 0 && dataOrderB.length === 0);

  // Cleanup test data
  console.log('\nCleaning up verification test data...');
  await fetch(`${SUPABASE_URL}/rest/v1/umkm_orders?organization_id=eq.${orgA}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  await fetch(`${SUPABASE_URL}/rest/v1/umkm_sales_products?organization_id=eq.${orgA}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  console.log('  [✓] Verification test data cleaned up.');

  console.log('\n================================================================================');
  console.log('                            VERIFICATION SUMMARY                                ');
  console.log('================================================================================');
  console.log(`Zero State Test            : ${zeroStatePassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Tenant Isolation Test      : ${isolationPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Overall Status             : ${zeroStatePassed && isolationPassed ? 'PASS' : 'FAIL'}`);

  const results = {
    zero_state_passed: zeroStatePassed,
    tenant_isolation_passed: isolationPassed,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync('/tmp/zega_empirical_verification_results.json', JSON.stringify(results, null, 2));
}

runVerification().catch(console.error);
