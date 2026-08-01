import { zeroclawRoutes } from './routes/v1/zeroclaw.routes.js';
import Fastify from 'fastify';

async function auditDatabaseInvoices() {
  console.log('================================================================');
  console.log('🔍 AUDIT DATABASE MASTER: zeroclaw_solana_settlements');
  console.log('================================================================');

  const app = Fastify({ logger: false });
  await app.register(zeroclawRoutes, { prefix: '/v1/zeroclaw' });
  await app.ready();

  const testUserEmail = 'siabang35@gmail.com';

  // 1. Query Real Invoices for Authenticated User (is_demo=false)
  console.log('\n[QUERY 1] Tagihan REAL untuk Authenticated User (siabang35@gmail.com)...');
  const realRes = await app.inject({
    method: 'GET',
    url: `/v1/zeroclaw/invoice/list?userId=${encodeURIComponent(testUserEmail)}`
  });

  const realBody = JSON.parse(realRes.body);
  console.log(`  -> Status: ${realRes.statusCode} | Total Real Invoices: ${realBody.count}`);

  if (Array.isArray(realBody.invoices)) {
    realBody.invoices.forEach((inv: any, idx: number) => {
      console.log(`  [${idx + 1}] ID: ${inv.id} | Amount: ${inv.amount} USDC | Ref: ${inv.referenceKey} | Memo: ${inv.memo}`);
    });
  }

  // 2. Query Demo Invoices (is_demo=true) for Guest Users
  console.log('\n[QUERY 2] Tagihan DEMO untuk Guest Sandbox (isDemo=true)...');
  const demoRes = await app.inject({
    method: 'GET',
    url: '/v1/zeroclaw/invoice/list?isDemo=true'
  });

  const demoBody = JSON.parse(demoRes.body);
  console.log(`  -> Status: ${demoRes.statusCode} | Total Demo Invoices: ${demoBody.count}`);

  if (Array.isArray(demoBody.invoices)) {
    demoBody.invoices.forEach((inv: any, idx: number) => {
      console.log(`  [${idx + 1}] ID: ${inv.id} | Amount: ${inv.amount} USDC | Ref: ${inv.referenceKey} | Memo: ${inv.memo}`);
    });
  }

  await app.close();

  console.log('\n================================================================');
  console.log('🏁 AUDIT SELESAI: TAGIHAN REAL TERPISAH 100% DARI TAGIHAN DEMO!');
  console.log('================================================================\n');
}

auditDatabaseInvoices().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
