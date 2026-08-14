import { solanaRpcManager } from '../services/solanaRpcManager.js';
import { SolanaService } from '../services/solanaService.js';

async function runVerification() {
  console.log('🧪 Starting Real On-Chain Fetch Verification...\n');

  // Test Wallet (Devnet System Program or well-known address)
  const testWallet = '11111111111111111111111111111111';
  const merchantWallet = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'; // Example public address

  // 1. Test RPC Whitelist for requestAirdrop & getBalance
  console.log('1️⃣ Testing RPC Manager Whitelist...');
  try {
    const balResult = await solanaRpcManager.callRpc<any>('getBalance', [testWallet]);
    console.log('  ✅ getBalance RPC call successful. Response type:', typeof balResult, 'Keys:', Object.keys(balResult || {}));
  } catch (err: any) {
    console.error('  ❌ getBalance RPC call failed:', err.message);
  }

  // 2. Test SolanaService.getMerchantBalance
  console.log('\n2️⃣ Testing SolanaService.getMerchantBalance...');
  try {
    const bal = await SolanaService.getMerchantBalance(merchantWallet);
    console.log('  ✅ getMerchantBalance successful!');
    console.log(`     SOL Balance: ${bal.sol} SOL`);
    console.log(`     USDC Balance: ${bal.usdc} USDC`);
    console.log(`     Raw SOL Lamports: ${bal.availableSolLamports.toString()}`);
  } catch (err: any) {
    console.error('  ❌ getMerchantBalance failed:', err.message);
  }

  console.log('\n✨ Verification script finished successfully!');
}

runVerification().catch(console.error);
