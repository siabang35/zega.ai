import { zeroclawRoutes } from './routes/v1/zeroclaw.routes.js';
import Fastify from 'fastify';

async function runRealtimeVaultTests() {
  console.log('================================================================');
  console.log('🧪 ZEROCLAW REAL-TIME VAULT & PRIVY WALLET AUTOMATED TEST SUITE');
  console.log('================================================================');

  const app = Fastify({ logger: false });
  await app.register(zeroclawRoutes, { prefix: '/v1/zeroclaw' });
  await app.ready();

  let passedTests = 0;
  let totalTests = 4;

  // TEST 1: Invoice Generation & R2 Audit Streaming for Authenticated User
  console.log('\n[TEST 1] Creating Invoice for Authenticated User (siabang35@gmail.com)...');
  const authInvRes = await app.inject({
    method: 'POST',
    url: '/v1/zeroclaw/invoice/create',
    payload: {
      userId: 'siabang35@gmail.com',
      merchantPubkey: 'PrivySolanaWallet32BytesDerivedAddress11',
      amount: '25.50',
      memo: 'Invoice Meja 4 (25.50 USDC)',
      solanaPayUrl: 'solana:PrivySolanaWallet32BytesDerivedAddress11?amount=25.50',
      referenceKey: `RefKeyAuth${Date.now().toString(36)}`,
      buyerEmail: 'customer.vip@zegaai.site',
      isDemo: false
    }
  });

  const authInvBody = JSON.parse(authInvRes.body);
  console.log(`  -> Status: ${authInvRes.statusCode} | Success: ${authInvBody.success}`);
  console.log(`  -> R2 CDN Audit Certificate URL: ${authInvBody.r2CdnUrl}`);
  console.log(`  -> Reference Key: ${authInvBody.invoice?.referenceKey}`);

  if (authInvRes.statusCode === 200 && authInvBody.success && authInvBody.r2CdnUrl) {
    console.log('  ✅ TEST 1 PASSED: Authenticated invoice generated & streamed to R2 CDN.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 1 FAILED!');
  }

  // TEST 2: Invoice Generation for Guest Demo Session
  console.log('\n[TEST 2] Creating Invoice for Guest Demo Session (guest@zegaai.site)...');
  const guestInvRes = await app.inject({
    method: 'POST',
    url: '/v1/zeroclaw/invoice/create',
    payload: {
      userId: 'guest@zegaai.site',
      merchantPubkey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      amount: '15.00',
      memo: 'Demo Coffee Order (15.00 USDC)',
      solanaPayUrl: 'solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?amount=15.00',
      referenceKey: `RefKeyDemo${Date.now().toString(36)}`,
      buyerEmail: 'guest@zegaai.site',
      isDemo: true
    }
  });

  const guestInvBody = JSON.parse(guestInvRes.body);
  console.log(`  -> Status: ${guestInvRes.statusCode} | Success: ${guestInvBody.success}`);
  console.log(`  -> Reference Key: ${guestInvBody.invoice?.referenceKey}`);

  if (guestInvRes.statusCode === 200 && guestInvBody.success) {
    console.log('  ✅ TEST 2 PASSED: Guest demo invoice successfully generated.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 2 FAILED!');
  }

  // TEST 3: Vault List Query Filtering for Authenticated User (Zero Demo Leakage)
  console.log('\n[TEST 3] Fetching Vault Invoice List for Authenticated User (siabang35@gmail.com)...');
  const vaultListRes = await app.inject({
    method: 'GET',
    url: '/v1/zeroclaw/invoice/list?userId=siabang35@gmail.com'
  });

  const vaultListBody = JSON.parse(vaultListRes.body);
  console.log(`  -> Status: ${vaultListRes.statusCode} | Count: ${vaultListBody.count || 0}`);
  
  const hasDemoItem = Array.isArray(vaultListBody.invoices) && vaultListBody.invoices.some((i: any) => i.is_demo === true);

  if (vaultListRes.statusCode === 200 && vaultListBody.success && !hasDemoItem) {
    console.log(`  ✅ TEST 3 PASSED: Vault list returned ${vaultListBody.invoices?.length || 0} real invoices with 0 demo leakage.`);
    passedTests++;
  } else {
    console.error(`  ❌ TEST 3 FAILED! Demo items found or query failed.`);
  }

  // TEST 4: Real-Time On-Chain Settlement Recording for Privy Embedded Wallet
  console.log('\n[TEST 4] Recording Settlement for Authenticated Privy Wallet...');
  const settlementRes = await app.inject({
    method: 'POST',
    url: '/v1/zeroclaw/settlement/record',
    payload: {
      userId: 'siabang35@gmail.com',
      merchantPubkey: 'PrivySolanaWallet32BytesDerivedAddress11',
      amountUsdc: 25.50,
      referenceKey: `RefKeyAuth${Date.now().toString(36)}`,
      txSignature: '5TLya5WZPUG4SLuEW6V7y8tCY1mzpm2jX8ZBFmPxKHhD2hFEsRiJvmQRtpdZQhDbRY85ccZRBgaUDYYotParPD23',
      network: 'solana-devnet',
      memo: 'Invoice Meja 4 Settlement (EXACT)',
      isDemo: false
    }
  });

  const settlementBody = JSON.parse(settlementRes.body);
  console.log(`  -> Status: ${settlementRes.statusCode} | Recorded Tx: ${settlementBody.data?.signature}`);

  if (settlementRes.statusCode === 200 && settlementBody.success) {
    console.log('  ✅ TEST 4 PASSED: Real settlement recorded in Master DB and R2 audit trail.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 4 FAILED!');
  }

  await app.close();

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED PERFECTLY!`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRealtimeVaultTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
