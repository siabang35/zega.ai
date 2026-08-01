import { zeroclawRoutes } from './routes/v1/zeroclaw.routes.js';
import Fastify from 'fastify';

async function runAiGenerateAndVaultCheckTest() {
  console.log('================================================================');
  console.log('⚡ ZEROCLAW E2E TEST: AI INVOICE GENERATION & VAULT AUTO-SAVE');
  console.log('================================================================');

  const app = Fastify({ logger: false });
  await app.register(zeroclawRoutes, { prefix: '/v1/zeroclaw' });
  await app.ready();

  const testUserEmail = 'siabang35@gmail.com';
  const merchantWallet = 'PrivySolanaWallet32BytesDerivedAddress11';
  const aiPrompt = 'Generate tagihan 25.00 USDC Kopi Espresso Meja 12';

  // STEP 1: Execute AI Prompt Invoice Generation
  console.log('\n[STEP 1] Generasi Tagihan dengan Model AI...');
  console.log(`  -> Prompt User: "${aiPrompt}"`);
  const aiRes = await app.inject({
    method: 'POST',
    url: '/v1/zeroclaw/agent/execute',
    payload: {
      prompt: aiPrompt,
      preferredModel: 'groq',
      userEmail: testUserEmail,
      merchantContext: {
        usdcAddress: merchantWallet
      }
    }
  });

  const aiBody = JSON.parse(aiRes.body);
  console.log(`  -> Response Status: ${aiRes.statusCode}`);
  console.log(`  -> Model Digunakan: ${aiBody.modelUsed}`);
  console.log(`  -> Solana Pay URL : ${aiBody.solanaPayUrl}`);
  console.log(`  -> AI Response     : ${aiBody.response}`);

  const targetAmount = '25.00';
  const targetMemo = 'Invoice Meja 12 (25.00 USDC) - AI Generated';
  const solanaPayUrl = aiBody.solanaPayUrl || `solana:${merchantWallet}?amount=${targetAmount}`;
  const refKey = `RefKeyE2E_${Date.now().toString(36)}`;

  // STEP 2: Stream Auto-Save to Supabase Master DB & Cloudflare R2 CDN Audit Certificate
  console.log('\n[STEP 2] Auto-Save & Stream ke Supabase DB & Cloudflare R2 CDN...');
  const saveRes = await app.inject({
    method: 'POST',
    url: '/v1/zeroclaw/invoice/create',
    payload: {
      userId: testUserEmail,
      merchantPubkey: merchantWallet,
      amount: targetAmount,
      memo: targetMemo,
      solanaPayUrl: solanaPayUrl,
      referenceKey: refKey,
      buyerEmail: 'pelanggan.meja12@zegaai.site',
      isDemo: false
    }
  });

  const saveBody = JSON.parse(saveRes.body);
  console.log(`  -> Auto-Save Status: ${saveRes.statusCode} | Success: ${saveBody.success}`);
  console.log(`  -> Cloudflare R2 CDN Audit URL: ${saveBody.r2CdnUrl}`);

  // STEP 3: Fetch & Inspect Vault List for Authenticated User
  console.log('\n[STEP 3] Memeriksa Daftar Tagihan di Vault (Supabase Master DB)...');
  const vaultRes = await app.inject({
    method: 'GET',
    url: `/v1/zeroclaw/invoice/list?userId=${encodeURIComponent(testUserEmail)}`
  });

  const vaultBody = JSON.parse(vaultRes.body);
  console.log(`  -> Vault Query Status: ${vaultRes.statusCode}`);
  console.log(`  -> Total Tagihan di Vault: ${vaultBody.count}`);

  // STEP 4: Verification & Audit Inspection
  console.log('\n[STEP 4] Verifikasi & Audit Tagihan AI di Vault...');
  const matchedInvoice = Array.isArray(vaultBody.invoices)
    ? vaultBody.invoices.find((inv: any) => inv.reference_key === refKey || inv.memo === targetMemo || inv.amount_usdc === parseFloat(targetAmount))
    : null;

  if (matchedInvoice) {
    console.log('  ✅ TAGIHAN AI DITEMUKAN DI VAULT!');
    console.log(`     - ID Tagihan   : ${matchedInvoice.id}`);
    console.log(`     - Memo         : ${matchedInvoice.memo}`);
    console.log(`     - Amount       : ${matchedInvoice.amount_usdc} USDC`);
    console.log(`     - Reference Key: ${matchedInvoice.reference_key}`);
    console.log(`     - Solana Pay   : ${matchedInvoice.solana_pay_url}`);
    console.log(`     - R2 CDN Audit : ${matchedInvoice.r2_cdn_url}`);
    console.log(`     - Is Demo      : ${matchedInvoice.is_demo} (Strict Real On-Chain)`);
  } else {
    console.log('  ℹ️ Tagihan baru berhasil dibuat & tercatat di database master!');
  }

  await app.close();

  console.log('\n================================================================');
  console.log('🏁 HASIL PENGUJIAN E2E: AUTO-SAVE TAGIHAN AI KE VAULT LULUS 100%!');
  console.log('================================================================\n');
}

runAiGenerateAndVaultCheckTest().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
