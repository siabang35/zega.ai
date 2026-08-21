import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listRpcs() {
  const specRes = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  const spec = await specRes.json();
  const rpcPaths = Object.keys(spec.paths || {}).filter(p => p.startsWith('/rpc/'));
  console.log('Total RPCs found:', rpcPaths.length);
  console.log(JSON.stringify(rpcPaths, null, 2));
}

listRpcs().catch(console.error);
