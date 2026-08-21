import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = process.env.SUPABASE_JWT_SECRET;

function base64url(source) {
  let encoded = Buffer.from(JSON.stringify(source)).toString('base64');
  return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createSupabaseUserJwt(userId) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userId,
    role: 'authenticated',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const stringifiedHeader = base64url(header);
  const stringifiedPayload = base64url(payload);
  const token = `${stringifiedHeader}.${stringifiedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${token}.${signature}`;
}

async function testIsolation() {
  const userJwt = createSupabaseUserJwt('622a5612-0466-4407-822d-2f4c23ced099');

  console.log('--- TEST 1: Insert into umkm_store_categories directly ---');
  const catPayload = {
    name: 'Category Test ' + Date.now(),
    slug: 'cat-test-' + Date.now(),
    organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e',
    store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626'
  };

  const catRes = await fetch(`${url}/rest/v1/umkm_store_categories`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(catPayload)
  });
  console.log('Category Insert Status:', catRes.status, await catRes.text());

  console.log('\n--- TEST 2: Insert into umkm_store_products with store_id as UUID string ---');
  const prodUuidPayload = {
    store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626',
    organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e',
    name: 'Product UUID Test ' + Date.now(),
    sku: 'UUID-SKU-' + Date.now().toString().slice(-6),
    category: 'Lainnya',
    stock: 1,
    price_idr: 1000
  };

  const prodUuidRes = await fetch(`${url}/rest/v1/umkm_store_products`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(prodUuidPayload)
  });
  console.log('Product Insert (store_id=UUID string) Status:', prodUuidRes.status, await prodUuidRes.text());

  console.log('\n--- TEST 3: Insert into umkm_store_products with store_id as TEXT code (STORE-ACC0891A) ---');
  const prodTextPayload = {
    store_id: 'STORE-ACC0891A',
    organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e',
    name: 'Product Text Test ' + Date.now(),
    sku: 'TEXT-SKU-' + Date.now().toString().slice(-6),
    category: 'Lainnya',
    stock: 1,
    price_idr: 1000
  };

  const prodTextRes = await fetch(`${url}/rest/v1/umkm_store_products`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(prodTextPayload)
  });
  console.log('Product Insert (store_id=TEXT code) Status:', prodTextRes.status, await prodTextRes.text());
}

testIsolation().catch(console.error);
