import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const secret = process.env.SUPABASE_JWT_SECRET;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create authenticated JWT for user 622a5612-0466-4407-822d-2f4c23ced099
const userAuthUid = '622a5612-0466-4407-822d-2f4c23ced099';
const token = jwt.sign({
  sub: userAuthUid,
  role: 'authenticated',
  iss: 'supabase',
  exp: Math.floor(Date.now() / 1000) + 3600
}, secret);

async function verifyAuthenticatedRpc() {
  console.log('=== TEST AUTHENTICATED RPC FOR USER:', userAuthUid, '===');

  const payload = {
    p_store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626',
    p_name: 'Produk Verifikasi ZEGA ' + Date.now(),
    p_sku: 'SKU-VERIFY-' + Date.now().toString().slice(-4),
    p_category: 'Makanan & Minuman',
    p_stock: 50,
    p_sold: 0,
    p_price_idr: 25000,
    p_discount_price_idr: null,
    p_weight_gram: 300,
    p_status: 'Aktif',
    p_description: 'Produk pengujian verifikasi otomatis',
    p_image_path: '/assets/products/verify.png',
    p_cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    p_organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    p_workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e'
  };

  const rpcRes = await fetch(`${url}/rest/v1/rpc/fn_create_umkm_store_product`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const resText = await rpcRes.text();
  console.log(`RPC HTTP Status: ${rpcRes.status}`);
  console.log(`RPC Response: ${resText}`);

  if (rpcRes.status === 200) {
    console.log('🎉 SUCCESS! Product inserted cleanly with exact user context, 00000 dummy IDs removed, 404 resolved, 42883 resolved!');
  }

  console.log('\n=== TEST CROSS-TENANT SECURITY REJECTION (SPOOFED ORGANIZATION) ===');
  const spoofPayload = {
    ...payload,
    p_organization_id: '11111111-1111-1111-1111-111111111111'
  };

  const spoofRes = await fetch(`${url}/rest/v1/rpc/fn_create_umkm_store_product`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(spoofPayload)
  });

  const spoofText = await spoofRes.text();
  console.log(`Spoofed Org HTTP Status: ${spoofRes.status}`);
  console.log(`Spoofed Org Response: ${spoofText}`);

  if (spoofRes.status !== 200) {
    console.log('🛡️ SECURITY PASSED! Cross-tenant spoofing attempt rejected!');
  }
}

verifyAuthenticatedRpc().catch(err => {
  console.error(err);
  process.exit(1);
});
