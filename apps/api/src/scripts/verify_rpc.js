import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || 'https://ikxiclpvywxxnkcaldbx.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyRpc() {
  console.log('=== 1. VERIFY RPC DISCOVERY IN POSTGREST OPENAPI ===');
  const specRes = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  const spec = await specRes.json();
  const rpcPath = Object.keys(spec.paths || {}).find(p => p.includes('fn_create_umkm_store_product'));

  if (rpcPath) {
    console.log('✅ PostgREST successfully discovered RPC endpoint:', rpcPath);
    console.log('Parameter signature:', JSON.stringify(spec.paths[rpcPath]?.post?.parameters || [], null, 2));
  } else {
    console.warn('⚠️ RPC path fn_create_umkm_store_product not found in OpenAPI spec yet.');
  }

  console.log('\n=== 2. TEST RPC EXECUTION WITH SERVICE ROLE / AUTH CONTEXT ===');
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
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const resText = await rpcRes.text();
  console.log(`RPC HTTP Status: ${rpcRes.status}`);
  console.log(`RPC Response: ${resText}`);

  if (rpcRes.status === 200) {
    console.log('✅ SUCCESS! Product created cleanly via RPC without 404 or 42883 error!');
  } else {
    console.error('❌ RPC Call Failed. Status:', rpcRes.status);
  }
}

verifyRpc().catch(err => {
  console.error(err);
  process.exit(1);
});
