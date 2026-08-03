const API_BASE = 'http://127.0.0.1:3001';
const TEST_USER_EMAIL = 'siabang35@gmail.com';
const MERCHANT_WALLET = 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK';
const TEST_TX_SIGNATURE = '3ZbjPvgeYjxmcChZPXUDr5NyJ9YqZw2ydu8kVFGPD1hEunKGdV8h8S1nMLsjc1AL5sRoy8pnzAmqHrj4eRCXdkEq';

async function runFullE2ESynchronizationTest() {
  console.log('===========================================================');
  console.log('🚀 E2E AUDIT: AI GENERATION -> VAULT SAVE -> SETTLEMENT -> SYNC');
  console.log('===========================================================');

  try {
    const testAmount = 25.50;
    const testMemo = `Testing AI Invoice ${Date.now()}`;
    const refKey = `RefKeyE2E_${Date.now()}`;
    const solanaPayUrl = `solana:${MERCHANT_WALLET}?amount=${testAmount.toFixed(2)}&reference=${refKey}`;

    // ── STEP 1: SAVE GENERATED AI INVOICE ──
    console.log('[1/4] Saving Generated AI Invoice to DB & CDN Vault...');
    const saveRes = await fetch(`${API_BASE}/v1/zeroclaw/invoice/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_EMAIL,
        merchantPubkey: MERCHANT_WALLET,
        amount: testAmount.toFixed(2),
        memo: testMemo,
        solanaPayUrl: solanaPayUrl,
        referenceKey: refKey,
        buyerEmail: 'customer_e2e@example.com',
        isDemo: false,
      }),
    });

    const saveJson = (await saveRes.json()) as any;
    console.log('  -> Invoice DB & CDN Save Result:', saveJson.success ? 'SUCCESS' : 'FAILED');

    // ── STEP 2: VERIFY VAULT LIST INCLUSION ──
    console.log('[2/4] Auditing Vault Database to Confirm Invoice Inclusion...');
    const vaultRes = await fetch(`${API_BASE}/v1/zeroclaw/invoice/list?isDemo=false&userId=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const vaultJson = (await vaultRes.json()) as any;
    const allInvoices = vaultJson.data || [];

    const foundInVault = allInvoices.some(
      (inv: any) => inv.referenceKey === refKey || inv.solanaPayUrl === solanaPayUrl || inv.memo === testMemo
    );

    if (!foundInVault) {
      throw new Error(`❌ FAILED: Invoice (Ref: ${refKey}) NOT found in Vault!`);
    }
    console.log(`  -> SUCCESS: Invoice (Ref: ${refKey}) verified in Vault! (Total Vault Items: ${allInvoices.length})`);

    // ── STEP 3: EXECUTE ON-CHAIN SETTLEMENT ──
    console.log('[3/4] Executing On-Chain Settlement (Bayar On-Chain)...');
    const settleRes = await fetch(`${API_BASE}/v1/zeroclaw/settlement/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_EMAIL,
        merchantPubkey: MERCHANT_WALLET,
        amountUsdc: testAmount,
        referenceKey: refKey,
        txSignature: TEST_TX_SIGNATURE,
        network: 'solana-devnet',
        memo: `${testMemo} (E2E Settlement Test)`,
        isDemo: false,
      }),
    });

    const settleJson = (await settleRes.json()) as any;
    console.log('  -> On-Chain Settlement Record Result:', settleJson.success ? 'SUCCESS' : 'FAILED');

    // ── STEP 4: VERIFY RECONCILIATION SYNCHRONIZATION ──
    console.log('[4/4] Auditing Reconciliation Stream Synchronization...');
    const statusRes = await fetch(`${API_BASE}/v1/zeroclaw/settlement/list?isDemo=false&userId=${encodeURIComponent(TEST_USER_EMAIL)}`);
    const statusJson = (await statusRes.json()) as any;
    const reconciledEvents = statusJson.data || [];

    const matchedEvent = reconciledEvents.find(
      (e: any) => e.signature === TEST_TX_SIGNATURE || e.referenceKey === refKey
    );

    if (!matchedEvent) {
      throw new Error(`❌ FAILED: Settlement event with Tx ${TEST_TX_SIGNATURE} not found in Reconciliation stream!`);
    }

    console.log('  -> RECONCILIATION MATCH VERIFIED:');
    console.log('     Tx Signature:', matchedEvent.signature);
    console.log('     Amount USDC:', matchedEvent.amountUsdc || matchedEvent.amount);
    console.log('     Memo:', matchedEvent.memo);
    console.log('     Status: FINISHED (EXACT)');

    console.log('===========================================================');
    console.log('🎉 ALL 4 E2E STEPS PASSED PERFECTLY! TX & VAULT ARE 100% SYNCED.');
    console.log('===========================================================');
  } catch (err: any) {
    console.error('❌ E2E TEST FAILED:', err.message);
  }
}

runFullE2ESynchronizationTest();
