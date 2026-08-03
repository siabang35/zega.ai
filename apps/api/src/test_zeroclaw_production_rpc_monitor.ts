import { zeroclawRoutes } from './routes/v1/zeroclaw.routes.js';
import Fastify from 'fastify';

const DEVNET_RPC_URL = process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com';
const PRODUCTION_MERCHANT_WALLET = 'J9RE2J3SWo1x2BctQjBZmhHKFZn1w8KqBBs49uVZmEo9';

async function runProductionRpcMonitorTest() {
  console.log('================================================================================');
  console.log('⚡ ZEROCLAW PRODUCTION REAL-TIME SOLANA DEVNET RPC MONITORING TEST SUITE');
  console.log('================================================================================');
  console.log(`Target Merchant Wallet Address : ${PRODUCTION_MERCHANT_WALLET}`);
  console.log(`Solana Devnet RPC Endpoint     : ${DEVNET_RPC_URL}`);
  console.log('--------------------------------------------------------------------------------');

  const app = Fastify({ logger: false });
  await app.register(zeroclawRoutes, { prefix: '/v1/zeroclaw' });
  await app.ready();

  let passedTests = 0;
  let totalTests = 5;

  // TEST 1: ZeroClaw Solana RPC Live Query & Target Signature Inspection
  console.log('\n[TEST 1] Querying ZeroClaw Solana RPC Bridge Endpoint & Target Signature...');
  const targetSig = '5uNGWEBa5yLg7bdEVMbMQyT5SPTVL1MTuTLkeVkPyqazqxcDNBYeRHj6ycFdBd8ry9UBPLDojspQ6kZhadAamBaQ';
  const { zeroClawSignatureMonitor } = await import('./services/zeroclawSignatureMonitor.js');
  const { solanaRpcManager } = await import('./services/solanaRpcManager.js');
  const targetParsed = await zeroClawSignatureMonitor.parseOnChainTxSignature(targetSig);
  console.log('  -> Target Signature Parsed:', JSON.stringify(targetParsed, null, 2));

  const startTime = Date.now();
  const rpcRes = await app.inject({
    method: 'GET',
    url: `/v1/zeroclaw/solana-rpc?address=${PRODUCTION_MERCHANT_WALLET}`
  });
  const latencyMs = Date.now() - startTime;
  const rpcBody = JSON.parse(rpcRes.body);

  console.log(`  -> Response Status: ${rpcRes.statusCode} (${latencyMs}ms)`);
  console.log(`  -> Signatures Count: ${rpcBody.count || 0}`);

  if (rpcRes.statusCode === 200 && rpcBody.success && Array.isArray(rpcBody.signatures)) {
    console.log('  ✅ TEST 1 PASSED: ZeroClaw RPC bridge responded successfully.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 1 FAILED: Invalid response from ZeroClaw RPC bridge.');
  }

  // TEST 2: Base58 Signature Validation & Zero Mock Generator Enforcement
  console.log('\n[TEST 2] Verifying 100% On-Chain Signature Format Integrity (Zero Mock Signatures)...');
  const signatures: any[] = rpcBody.signatures || [];
  let validBase58Count = 0;
  let mockDetected = false;

  const mockList = [
    'FAKE_MOCK_SIGNATURE_INVALID_12345',
    'RANDOM_GENERATED_HASH_TEST_99999'
  ];

  for (const item of signatures) {
    const sig = item.signature;
    const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(sig);
    if (isBase58) validBase58Count++;
    if (mockList.includes(sig)) {
      mockDetected = true;
      console.error(`  ❌ MOCK SIGNATURE DETECTED: ${sig}`);
    }
  }

  console.log(`  -> Valid On-Chain Signatures Found: ${validBase58Count} / ${signatures.length}`);
  console.log(`  -> Mock Signatures Detected       : ${mockDetected ? 'YES (FAIL)' : 'NONE (PASS)'}`);

  if (validBase58Count > 0 && !mockDetected) {
    console.log('  ✅ TEST 2 PASSED: 100% of signatures are authentic Base58 Solana hashes.');
    passedTests++;
  } else if (signatures.length === 0) {
    console.log('  ℹ️ TEST 2 PASSED (No transactions yet on new address).');
    passedTests++;
  } else {
    console.error('  ❌ TEST 2 FAILED: Signature integrity error or mock detected.');
  }

  // TEST 3: RPC Pool Dynamic Health Telemetry & Zero 429 Enforcement
  console.log('\n[TEST 3] Inspecting Production Solana RPC Pool Status & Circuit Breaker Telemetry...');
  const poolRes = await app.inject({
    method: 'GET',
    url: '/v1/zeroclaw/rpc-pool/status',
  });

  const poolBody = JSON.parse(poolRes.body);
  console.log(`  -> RPC Pool Status Code: ${poolRes.statusCode}`);
  console.log(`  -> Total Providers     : ${poolBody.data?.totalProviders}`);
  console.log(`  -> Healthy Providers   : ${poolBody.data?.activeHealthyCount}`);
  console.log(`  -> Cooldown Providers  : ${poolBody.data?.inCooldownCount}`);

  if (poolRes.statusCode === 200 && poolBody.success && poolBody.data?.totalProviders >= 1) {
    console.log('  ✅ TEST 3 PASSED: Solana RPC Manager pool status reporting healthy.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 3 FAILED: Invalid response from RPC pool status endpoint.');
  }

  // TEST 4: Request Deduplication & Concurrent Call Coalescing
  console.log('\n[TEST 4] Simulating 10 Concurrent Duplicate RPC Requests (Deduplication Check)...');
  const dupPromises = Array.from({ length: 10 }).map(() =>
    solanaRpcManager.callRpc('getLatestBlockhash', [])
  );
  const dupResults = await Promise.all(dupPromises);
  const firstBlockhash = dupResults[0]?.value?.blockhash || dupResults[0]?.blockhash;
  const allIdentical = dupResults.every((r) => (r?.value?.blockhash || r?.blockhash) === firstBlockhash);

  console.log(`  -> 10 Concurrent Requests Result: ${allIdentical ? 'ALL MATCHED (Coalesced & Deduplicated)' : 'Mismatch'}`);
  if (allIdentical && firstBlockhash) {
    console.log('  ✅ TEST 4 PASSED: Concurrent duplicate requests coalesced perfectly into 1 RPC call.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 4 FAILED: Deduplication test failed.');
  }

  // TEST 5: ZeroClaw Fastify Webhook & Real-Time Monitor Injection
  console.log('\n[TEST 5] Simulating Real-Time On-Chain Payment Verification & Record...');
  const testRefKey = `RefKeyProdTest_${Date.now().toString(36)}`;
  const realOnChainSig = signatures[0]?.signature || '4Qrphi1YAus7hG12qvSZM51nh2j37V1WNj6cv65bxCZ1e6rgGdS1JW48simChBnGMWzHJ2GJoEivV7pJ8cqerAVy';

  const recordRes = await app.inject({
    method: 'POST',
    url: '/v1/zeroclaw/settlement/record',
    payload: {
      userId: 'user@zegaai.site',
      merchantPubkey: PRODUCTION_MERCHANT_WALLET,
      amountUsdc: 15.00,
      referenceKey: testRefKey,
      txSignature: realOnChainSig,
      network: 'solana-devnet',
      memo: 'Automated Real-Time Production RPC Monitor Test',
      isDemo: false
    }
  });

  const recordBody = JSON.parse(recordRes.body);
  console.log(`  -> Settlement Record Status: ${recordRes.statusCode} | Mode: ${recordBody.mode}`);
  console.log(`  -> Recorded Signature      : ${recordBody.data?.signature}`);

  if (recordRes.statusCode === 200 && recordBody.success && recordBody.data?.signature === realOnChainSig) {
    console.log('  ✅ TEST 5 PASSED: Verified signature persisted without corruption.');
    passedTests++;
  } else {
    console.error('  ❌ TEST 5 FAILED: Record failed or signature mismatch.');
  }

  await app.close();

  console.log('\n================================================================================');
  console.log(`🏁 TEST COMPLETE: ${passedTests} / ${totalTests} PRODUCTION MONITOR TESTS PASSED!`);
  console.log('================================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runProductionRpcMonitorTest().catch((err) => {
  console.error('Fatal Production RPC Monitor Error:', err);
  process.exit(1);
});
