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

async function debug() {
  const userJwt = createSupabaseUserJwt('622a5612-0466-4407-822d-2f4c23ced099');

  console.log('--- 1. Testing fn_is_org_member ---');
  const orgRes = await fetch(`${url}/rest/v1/rpc/fn_is_org_member`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_org_id: '601ff884-2259-403d-93e1-7649c248e653' })
  });
  console.log('fn_is_org_member status:', orgRes.status, await orgRes.text());

  console.log('\n--- 2. Testing SELECT from umkm_store_products with RLS ---');
  const selRes = await fetch(`${url}/rest/v1/umkm_store_products?select=*&limit=1`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`
    }
  });
  console.log('SELECT umkm_store_products status:', selRes.status, await selRes.text());

  console.log('\n--- 3. Testing SELECT from umkm_store_categories with RLS ---');
  const catRes = await fetch(`${url}/rest/v1/umkm_store_categories?select=*&limit=1`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`
    }
  });
  console.log('SELECT umkm_store_categories status:', catRes.status, await catRes.text());
}

debug().catch(console.error);
