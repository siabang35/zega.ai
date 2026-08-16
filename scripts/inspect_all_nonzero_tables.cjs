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


async function checkAllNonZero() {
  console.log('Fetching live table list...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const spec = await res.json();
  const definitions = spec.definitions || {};
  const tables = Object.keys(definitions).sort();

  console.log(`Checking live row counts across all ${tables.length} tables...`);

  const nonzeroList = [];
  const BATCH_SIZE = 30;

  for (let i = 0; i < tables.length; i += BATCH_SIZE) {
    const chunk = tables.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (table) => {
      try {
        const cRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'count=exact'
          }
        });
        if (cRes.ok) {
          const contentRange = cRes.headers.get('content-range');
          const count = contentRange ? parseInt(contentRange.split('/')[1] || '0', 10) : 0;
          if (count > 0) {
            nonzeroList.push({ table, count });
          }
        }
      } catch (e) {}
    }));
  }

  console.log(`\nFound ${nonzeroList.length} non-zero tables live:`);
  nonzeroList.sort((a, b) => b.count - a.count);
  for (const item of nonzeroList) {
    console.log(`  - ${item.table}: ${item.count} rows`);
  }

  fs.writeFileSync('/tmp/live_nonzero_tables.json', JSON.stringify(nonzeroList, null, 2));
}

checkAllNonZero().catch(console.error);
