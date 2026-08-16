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


async function generatePostInventory() {
  console.log('Reading pre-reset inventory snapshot...');
  const preInventory = JSON.parse(fs.readFileSync('/tmp/zega_pre_reset_inventory.json', 'utf8'));

  console.log('Fetching live schema definitions...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const spec = await res.json();
  const definitions = spec.definitions || {};
  const tableNames = Object.keys(definitions).sort();

  console.log(`Auditing post-reset row counts across ${tableNames.length} tables...`);

  const preMap = new Map(preInventory.map(item => [item.table, item]));
  const postInventory = [];

  const BATCH_SIZE = 25;
  for (let i = 0; i < tableNames.length; i += BATCH_SIZE) {
    const batch = tableNames.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (table) => {
      let afterCount = 0;
      try {
        const countRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'count=exact'
          }
        });
        if (countRes.ok) {
          const contentRange = countRes.headers.get('content-range');
          if (contentRange) {
            afterCount = parseInt(contentRange.split('/')[1] || '0', 10);
          } else {
            const data = await countRes.json();
            afterCount = data.length;
          }
        }
      } catch (err) {}

      const preItem = preMap.get(table) || {};
      const beforeCount = preItem.row_count || 0;
      const resetStrategy = preItem.reset_strategy || 'PRESERVE';
      const deletedCount = resetStrategy === 'DELETE' ? Math.max(0, beforeCount - afterCount) : 0;

      return {
        table: table,
        classification: preItem.classification || 'UNKNOWN',
        ownership: preItem.ownership || 'unknown',
        reset_strategy: resetStrategy,
        before_count: beforeCount,
        deleted_count: deletedCount,
        after_count: afterCount,
        preserved_intact: resetStrategy === 'PRESERVE' ? (beforeCount === afterCount) : true
      };
    }));
    postInventory.push(...batchResults);
    process.stdout.write(`Processed ${postInventory.length}/${tableNames.length} post-reset table checks...\r`);
  }

  console.log('\nPost-reset inventory completed!');

  const outPath = '/tmp/zega_post_reset_inventory.json';
  fs.writeFileSync(outPath, JSON.stringify(postInventory, null, 2));
  console.log(`Saved post-reset inventory to ${outPath}`);
}

generatePostInventory().catch(console.error);
