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

async function testCategoryIsolation() {
  const userJwt = createSupabaseUserJwt('622a5612-0466-4407-822d-2f4c23ced099');

  console.log('--- TEST A: Minimal category insert (name & slug only) ---');
  const catA = await fetch(`${url}/rest/v1/umkm_store_categories`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Cat Min ' + Date.now(),
      slug: 'cat-min-' + Date.now()
    })
  });
  console.log('Cat A Status:', catA.status, await catA.text());

  console.log('--- TEST B: Category insert with organization_id ---');
  const catB = await fetch(`${url}/rest/v1/umkm_store_categories`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Cat Org ' + Date.now(),
      slug: 'cat-org-' + Date.now(),
      organization_id: '601ff884-2259-403d-93e1-7649c248e653'
    })
  });
  console.log('Cat B Status:', catB.status, await catB.text());

  console.log('--- TEST C: Category insert with store_id as UUID vs TEXT code ---');
  const catC1 = await fetch(`${url}/rest/v1/umkm_store_categories`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Cat Store UUID ' + Date.now(),
      slug: 'cat-store-uuid-' + Date.now(),
      store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626'
    })
  });
  console.log('Cat C1 (store_id=UUID) Status:', catC1.status, await catC1.text());

  const catC2 = await fetch(`${url}/rest/v1/umkm_store_categories`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Cat Store Code ' + Date.now(),
      slug: 'cat-store-code-' + Date.now(),
      store_id: 'STORE-ACC0891A'
    })
  });
  console.log('Cat C2 (store_id=TEXT code) Status:', catC2.status, await catC2.text());
}

testCategoryIsolation().catch(console.error);
