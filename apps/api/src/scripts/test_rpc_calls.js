import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Base64URL encode function
function base64url(source) {
  let encoded = Buffer.from(JSON.stringify(source)).toString('base64');
  return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Generate HS256 JWT using crypto module directly (no external jsonwebtoken pkg needed)
import crypto from 'crypto';

function createSupabaseUserJwt(userId, secret) {
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

async function testRpc() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  const userJwt = createSupabaseUserJwt('622a5612-0466-4407-822d-2f4c23ced099', secret);

  console.log('--- 1. Testing fn_create_umkm_store_product with authenticated JWT ---');
  const payload = {
    p_store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626',
    p_name: 'Test Product ' + Date.now(),
    p_sku: 'SKU-' + Date.now().toString().slice(-6),
    p_category: 'Makanan & Minuman',
    p_stock: 10,
    p_sold: 0,
    p_price_idr: 15000,
    p_discount_price_idr: null,
    p_weight_gram: 250,
    p_status: 'Aktif',
    p_description: 'Test description',
    p_image_path: '/assets/products/verify.png',
    p_cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    p_organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    p_workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e'
  };

  const res = await fetch(`${url}/rest/v1/rpc/fn_create_umkm_store_product`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const status = res.status;
  const text = await res.text();
  console.log('Status:', status);
  console.log('Body:', text);

  console.log('\n--- 2. Testing Direct REST Insert to umkm_store_products ---');
  const restPayload = {
    store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626',
    organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e',
    name: 'Direct REST Product ' + Date.now(),
    sku: 'REST-SKU-' + Date.now().toString().slice(-6),
    category: 'Lainnya',
    stock: 5,
    sold: 0,
    price_idr: 20000,
    status: 'Aktif'
  };

  const restRes = await fetch(`${url}/rest/v1/umkm_store_products`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(restPayload)
  });

  const restStatus = restRes.status;
  const restText = await restRes.text();
  console.log('Direct REST Status:', restStatus);
  console.log('Direct REST Body:', restText);
}

testRpc().catch(console.error);
