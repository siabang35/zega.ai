// Node.js 18+ native fetch — Multi-User Invoice & Settlement Test Script
// Tests: Invoice dispatch to @Soft_yee, @comoc86, @slzyoung
// Tests: Exact, Underpaid, Overpaid settlement receipt dispatch

async function runMultiUserTests() {
  console.log('🚀 Starting Multi-User Invoice & Settlement Tests...\n');

  const targetApi = 'http://localhost:3001';

  console.log(`🌐 Active API Target: ${targetApi}\n`);

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: INVOICE GENERATION & TELEGRAM DISPATCH
  // ══════════════════════════════════════════════════════════════
  const invoiceTargets = [
    { target: '@Soft_yee', amount: 0.23, description: 'Snack Table 1 (0.23 USDC)' },
    { target: '@comoc86', amount: 0.43, description: 'Snack Table 2 (0.43 USDC)' },
    { target: '@slzyoung', amount: 0.24, description: 'Snack Table 3 (0.24 USDC)' }
  ];

  console.log('════════════════════════════════════════════════════════');
  console.log('  PHASE 1: INVOICE GENERATION & TELEGRAM DISPATCH');
  console.log('════════════════════════════════════════════════════════\n');

  const refKeys: Record<string, string> = {};

  for (const item of invoiceTargets) {
    console.log(`📡 Dispatching invoice → ${item.target} (${item.amount} USDC)...`);
    try {
      const res = await fetch(`${targetApi}/v1/zeroclaw/channels/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK',
          amount: item.amount,
          description: item.description,
          target: item.target,
          channel: 'telegram',
          tier: 'enterprise'
        })
      });

      const json: any = await res.json();
      const ok = res.status === 200 && json.success;
      console.log(`  ${ok ? '✅' : '❌'} Status: ${res.status} | Success: ${json.success}`);
      if (json.invoice) {
        refKeys[item.target] = json.invoice.referenceKey;
        console.log(`  └─ Ref: ${json.invoice.referenceKey}`);
        console.log(`  └─ Delivery: ${json.invoice.deliveryType}`);
        console.log(`  └─ Checkout: ${json.invoice.blinkUrl}`);
      } else {
        console.log(`  └─ Error: ${json.error || json.message}`);
      }
      console.log('');
    } catch (err: any) {
      console.error(`  ❌ Network Error → ${item.target}: ${err.message}\n`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: SETTLEMENT RECEIPT DISPATCH (Exact / Underpaid / Overpaid)
  // Uses isDemo=true to bypass on-chain RPC verification
  // ══════════════════════════════════════════════════════════════

  // Valid Base58 test signatures (87-88 chars, no 0/O/I/l)
  const fakeSigs = [
    '5J4X2K3k8y9z7W6v5u4t3s2r1qxP9N8n7m6k5K4J3H2G1FxE9D8C7B6A5432198765432198765432198765',
    '4K3J2h1g9F9E8d7C6B5A4321xP9n8N7m6k5K4J3h2G1FxE9d8C7B6A5432198765432198765432198765Ab',
    '3h2G1F9E8d7C6B5A4321xP9n8N7m6k5K4J3h2G1FxE9d8C7B6A543219876543219876543219876543Cd12',
  ];

  console.log('════════════════════════════════════════════════════════');
  console.log('  PHASE 2: SETTLEMENT & MULTI-STATUS RECEIPT DISPATCH');
  console.log('════════════════════════════════════════════════════════\n');

  const settlementTests = [
    {
      name: '🎯 EXACT PAYMENT (@Soft_yee)',
      target: '@Soft_yee',
      refKey: refKeys['@Soft_yee'],
      paidAmount: 0.23,
      sig: fakeSigs[0]
    },
    {
      name: '⚠️ UNDERPAID (@comoc86)',
      target: '@comoc86',
      refKey: refKeys['@comoc86'],
      paidAmount: 0.20,
      sig: fakeSigs[1]
    },
    {
      name: '💡 OVERPAID (@slzyoung → Refund Queue)',
      target: '@slzyoung',
      refKey: refKeys['@slzyoung'],
      paidAmount: 0.50,
      sig: fakeSigs[2]
    }
  ];

  for (const st of settlementTests) {
    console.log(`🧪 ${st.name}...`);
    if (!st.refKey) {
      console.log(`  ⏭️ Skipped — no reference key from Phase 1\n`);
      continue;
    }
    try {
      const res = await fetch(`${targetApi}/v1/zeroclaw/settlement/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-runner@zegaai.site',
          merchantPubkey: 'DwMUjkFPpHVV9zLPJA2iDMvfZiHZ1uUcCnVAdKu73bUK',
          amountUsdc: st.paidAmount,
          referenceKey: st.refKey,
          txSignature: st.sig,
          network: 'solana-devnet',
          memo: `Test Settlement for ${st.target}`,
          isDemo: true
        })
      });

      const json: any = await res.json();
      console.log(`  └─ Status Code: ${res.status}`);
      console.log(`  └─ Response: ${JSON.stringify(json, null, 2).split('\n').map((l: string, i: number) => i === 0 ? l : '       ' + l).join('\n')}`);
      console.log('');
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message}\n`);
    }
  }

  console.log('════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('════════════════════════════════════════════════════════');
}

runMultiUserTests();
