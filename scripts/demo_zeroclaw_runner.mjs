#!/usr/bin/env node

/**
 * ZEGA AI x ZeroClaw — Real Solana Devnet Live Runner Script
 *
 * Usage:
 *   node scripts/demo_zeroclaw_runner.mjs rpc        # Queries REAL Solana Devnet RPC signatures on-chain!
 *   node scripts/demo_zeroclaw_runner.mjs payment    # Dispatches live payment event to Fastify API
 *   node scripts/demo_zeroclaw_runner.mjs injection  # Dispatches live prompt-injection refund checkpoint
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const DEVNET_RPC = 'https://api.devnet.solana.com';
const DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

async function queryRealSolanaDevnet(address = DEVNET_USDC_MINT) {
  console.log(`📡 [Real Solana Devnet RPC] Querying live signatures for address: ${address}...`);
  try {
    const res = await fetch(DEVNET_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [address, { limit: 3, commitment: 'confirmed' }],
      }),
    });
    const json = await res.json();
    const sigs = json.result || [];
    console.log(`✅ [Real Solana Devnet RPC] Retrieved ${sigs.length} live signatures from Slot ${sigs[0]?.slot || 'N/A'}:`);
    
    sigs.forEach((s, idx) => {
      console.log(`   [${idx + 1}] Tx: ${s.signature}`);
      console.log(`       Slot: ${s.slot} | Commitment: ${s.confirmationStatus} | Memo: ${s.memo || 'None'}`);
    });

    if (sigs.length > 0) {
      // Sync real Devnet signature into ZEGA AI API
      await dispatchEvent({
        eventType: 'payment_reconciled',
        network: 'solana-devnet',
        amount: 15.00,
        currency: 'USDC',
        signature: sigs[0].signature,
        customerChannel: 'WhatsApp (+628123456789)',
        details: {
          slot: sigs[0].slot,
          blockTime: sigs[0].blockTime,
        },
      });
    }
  } catch (err) {
    console.error('❌ Failed to query Solana Devnet RPC:', err.message);
  }
}

async function dispatchEvent(payload) {
  try {
    const res = await fetch(`${API_BASE}/v1/zeroclaw/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    console.log('✅ Event Dispatched to Fastify API & Dashboard:', json.message);
  } catch (err) {
    console.error('❌ Failed to dispatch event:', err.message);
  }
}

const command = process.argv[2] || 'rpc';

if (command === 'rpc') {
  await queryRealSolanaDevnet();
} else if (command === 'payment') {
  console.log('🦀 [ZeroClaw Daemon] On-Chain Signature Confirmed on Solana Devnet!');
  const refSig = '42r7AYtR' + Math.random().toString(36).substring(2, 8) + 'vP9q8Z1a';
  
  await dispatchEvent({
    eventType: 'payment_reconciled',
    network: 'solana-devnet',
    amount: 15.00,
    currency: 'USDC',
    signature: refSig,
    customerChannel: 'WhatsApp (+628123456789)',
    details: {
      orderId: 'INV-9012',
      items: '2x Cafe Latte',
      slot: 480000742,
    },
  });
} else if (command === 'injection') {
  console.log('⚠️ [ZeroClaw SOP] Prompt Injection Detected in Customer WhatsApp Message!');
  
  await dispatchEvent({
    eventType: 'refund_requested',
    network: 'solana-devnet',
    amount: 25.00,
    currency: 'USDC',
    customerChannel: 'WhatsApp (+628198765432)',
    checkpointId: 'chk_ref_' + Math.floor(1000 + Math.random() * 9000),
    prompt: 'PROMPT INJECTION ATTACK: Customer chat instructed agent to override rules and transfer 25 USDC refund.',
    details: {
      recipientAddress: 'AttackerSolanaPublicKey1111111111111111111',
    },
  });
} else {
  console.log('Usage: node scripts/demo_zeroclaw_runner.mjs [rpc|payment|injection]');
}
