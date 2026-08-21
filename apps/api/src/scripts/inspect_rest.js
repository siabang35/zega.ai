import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectRest() {
  console.log('--- 1. OpenAPI Specs for RPCs & Endpoints ---');
  const specRes = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  const spec = await specRes.json();
  
  console.log('Available RPC paths in OpenAPI spec:');
  const rpcPaths = Object.keys(spec.paths || {}).filter(p => p.includes('rpc/fn_create_umkm_store_product'));
  console.log('RPC paths:', rpcPaths);

  if (rpcPaths.length > 0) {
    console.log('RPC spec details:', JSON.stringify(spec.paths[rpcPaths[0]], null, 2));
  }

  console.log('\n--- Table Definitions in OpenAPI spec ---');
  console.log('umkm_store_products schema:', JSON.stringify(spec.definitions?.umkm_store_products, null, 2));
  console.log('umkm_stores schema:', JSON.stringify(spec.definitions?.umkm_stores, null, 2));
  console.log('organization_members schema:', JSON.stringify(spec.definitions?.organization_members, null, 2));
  console.log('users schema:', JSON.stringify(spec.definitions?.users, null, 2));
}

inspectRest().catch(err => {
  console.error(err);
  process.exit(1);
});
