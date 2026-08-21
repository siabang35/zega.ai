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

const userAuthUid = '622a5612-0466-4407-822d-2f4c23ced099';
const token = jwt.sign({
  sub: userAuthUid,
  role: 'authenticated',
  iss: 'supabase',
  exp: Math.floor(Date.now() / 1000) + 3600
}, secret);

const headers = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function testLive() {
  console.log('=== 1. TEST fn_is_org_member RPC ===');
  const r1 = await fetch(`${url}/rest/v1/rpc/fn_is_org_member`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ p_org_id: '601ff884-2259-403d-93e1-7649c248e653' })
  });
  console.log('fn_is_org_member status:', r1.status);
  console.log('fn_is_org_member response:', await r1.text());

  console.log('\n=== 2. TEST fn_create_umkm_store_product RPC ===');
  const payload = {
    p_store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626',
    p_name: 'Produk Tes Diagnostic',
    p_sku: 'SKU-DIAG-' + Date.now().toString().slice(-4),
    p_category: 'Makanan & Minuman',
    p_stock: 10,
    p_sold: 0,
    p_price_idr: 15000,
    p_discount_price_idr: null,
    p_weight_gram: 250,
    p_status: 'Aktif',
    p_description: 'Deskripsi tes',
    p_image_path: '',
    p_cdn_icon_url: '',
    p_organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    p_workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e'
  };

  const r2 = await fetch(`${url}/rest/v1/rpc/fn_create_umkm_store_product`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  console.log('fn_create_umkm_store_product status:', r2.status);
  console.log('fn_create_umkm_store_product response:', await r2.text());

  console.log('\n=== 3. TEST DIRECT REST INSERT ===');
  const directPayload = {
    store_id: 'ccaa50fc-76d2-46ca-a561-f64d3cf85626',
    organization_id: '601ff884-2259-403d-93e1-7649c248e653',
    workspace_id: '225a1d3e-f774-4df4-b3e2-e09ed63ea71e',
    name: 'Produk Direct Diagnostic',
    sku: 'SKU-DIR-' + Date.now().toString().slice(-4),
    category: 'Makanan & Minuman',
    stock: 10,
    sold: 0,
    price_idr: 15000,
    status: 'Aktif'
  };

  const r3 = await fetch(`${url}/rest/v1/umkm_store_products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(directPayload)
  });
  console.log('Direct REST Insert status:', r3.status);
  console.log('Direct REST Insert response:', await r3.text());
}

testLive().catch(err => {
  console.error(err);
  process.exit(1);
});
