import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { withdrawalService } from '../services/WithdrawalService.js';
import { ledgerService } from '../services/LedgerService.js';
import { supabaseService } from '../services/supabaseService.js';

describe('BLOCKER-01 — Withdrawal Concurrency & Advisory Lock Verification', () => {
  it('prevents double reservation under 2 concurrent withdrawal requests (80 + 80 against 100 available)', async () => {
    const testUserId = `user_concurrent_${Date.now()}@zega.ai`;
    const walletId = `wal_conc_${Date.now()}`;
    const recipient1 = Keypair.generate().publicKey.toBase58();
    const recipient2 = Keypair.generate().publicKey.toBase58();
    const sender = Keypair.generate().publicKey.toBase58();

    // 1. Seed initial available balance = 100 SOL
    await ledgerService.recordCredit({
      userId: testUserId,
      walletId,
      type: 'PAYMENT',
      asset: 'SOL',
      amount: '100.0',
    });

    const supabase = supabaseService.getClient();
    let fulfilledCount = 0;
    let rejectedCount = 0;
    let rejectedErrorMessage = '';

    if (supabase) {
      const results = await Promise.allSettled([
        supabase.rpc('reserve_withdrawal_atomic', {
          p_user_id: testUserId,
          p_wallet_id: walletId,
          p_privy_user_id: `privy_${testUserId}`,
          p_asset: 'SOL',
          p_token_mint: null,
          p_amount: 80.0,
          p_amount_base_units: '80000000000',
          p_sender: sender,
          p_recipient: recipient1,
        }),
        supabase.rpc('reserve_withdrawal_atomic', {
          p_user_id: testUserId,
          p_wallet_id: walletId,
          p_privy_user_id: `privy_${testUserId}`,
          p_asset: 'SOL',
          p_token_mint: null,
          p_amount: 80.0,
          p_amount_base_units: '80000000000',
          p_sender: sender,
          p_recipient: recipient2,
        }),
      ]);

      results.forEach((r) => {
        if (r.status === 'fulfilled' && !r.value.error && r.value.data) {
          fulfilledCount++;
        } else {
          rejectedCount++;
          if (r.status === 'fulfilled' && r.value.error) {
            rejectedErrorMessage = r.value.error.message;
          } else if (r.status === 'rejected') {
            rejectedErrorMessage = (r as PromiseRejectedResult).reason?.message || '';
          }
        }
      });
    } else {
      const results = await Promise.allSettled([
        withdrawalService.executeWithdrawal({
          userId: testUserId,
          recipient: recipient1,
          amount: '80.0',
          asset: 'SOL',
        }),
        withdrawalService.executeWithdrawal({
          userId: testUserId,
          recipient: recipient2,
          amount: '80.0',
          asset: 'SOL',
        }),
      ]);
      fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
      rejectedCount = results.filter((r) => r.status === 'rejected').length;
      if (rejectedCount > 0) {
        rejectedErrorMessage = (results.find((r) => r.status === 'rejected') as PromiseRejectedResult)?.reason?.message || '';
      }
    }

    // Expected invariant: EXACTLY 1 succeeds, EXACTLY 1 fails with INSUFFICIENT_FUNDS
    assert.equal(fulfilledCount, 1, 'Only ONE concurrent withdrawal request must succeed');
    assert.equal(rejectedCount, 1, 'The second concurrent request must be rejected');
    assert.ok(
      rejectedErrorMessage.includes('INSUFFICIENT_FUNDS') || rejectedErrorMessage.includes('insufficient'),
      `Error must cite INSUFFICIENT_FUNDS. Received: ${rejectedErrorMessage}`
    );
  });

  it('enforces maximum 5 successful reservations out of 10 concurrent requests of 20 SOL against 100 available balance', async () => {
    const testUserId = `user_multi_conc_${Date.now()}@zega.ai`;
    const walletId = `wal_multi_${Date.now()}`;
    const sender = Keypair.generate().publicKey.toBase58();

    // Seed initial balance = 100 SOL
    await ledgerService.recordCredit({
      userId: testUserId,
      walletId,
      type: 'PAYMENT',
      asset: 'SOL',
      amount: '100.0',
    });

    const supabase = supabaseService.getClient();
    let fulfilledCount = 0;
    let rejectedCount = 0;

    if (supabase) {
      const tasks = Array.from({ length: 10 }, () => {
        const recipient = Keypair.generate().publicKey.toBase58();
        return supabase.rpc('reserve_withdrawal_atomic', {
          p_user_id: testUserId,
          p_wallet_id: walletId,
          p_privy_user_id: `privy_${testUserId}`,
          p_asset: 'SOL',
          p_token_mint: null,
          p_amount: 20.0,
          p_amount_base_units: '20000000000',
          p_sender: sender,
          p_recipient: recipient,
        });
      });

      const results = await Promise.allSettled(tasks);
      results.forEach((r) => {
        if (r.status === 'fulfilled' && !r.value.error && r.value.data) {
          fulfilledCount++;
        } else {
          rejectedCount++;
        }
      });
    } else {
      const tasks = Array.from({ length: 10 }, () => {
        const recipient = Keypair.generate().publicKey.toBase58();
        return withdrawalService.executeWithdrawal({
          userId: testUserId,
          recipient,
          amount: '20.0',
          asset: 'SOL',
        });
      });
      const results = await Promise.allSettled(tasks);
      fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
      rejectedCount = results.filter((r) => r.status === 'rejected').length;
    }

    assert.equal(fulfilledCount, 5, 'Exactly 5 out of 10 concurrent requests of 20 SOL must succeed against 100 SOL');
    assert.equal(rejectedCount, 5, 'Exactly 5 requests must be rejected due to insufficient available funds');
  });

  it('releases transactional lock cleanly on rollback/failure without permanently blocking subsequent valid withdrawals', async () => {
    const testUserId = `user_rollback_${Date.now()}@zega.ai`;
    const walletId = `wal_roll_${Date.now()}`;
    const recipient = Keypair.generate().publicKey.toBase58();
    const sender = Keypair.generate().publicKey.toBase58();

    // Seed balance = 50 SOL
    await ledgerService.recordCredit({
      userId: testUserId,
      walletId,
      type: 'PAYMENT',
      asset: 'SOL',
      amount: '50.0',
    });

    const supabase = supabaseService.getClient();

    if (supabase) {
      const { error: overspendErr } = await supabase.rpc('reserve_withdrawal_atomic', {
        p_user_id: testUserId,
        p_wallet_id: walletId,
        p_privy_user_id: `privy_${testUserId}`,
        p_asset: 'SOL',
        p_token_mint: null,
        p_amount: 80.0,
        p_amount_base_units: '80000000000',
        p_sender: sender,
        p_recipient: recipient,
      });

      assert.ok(
        overspendErr && overspendErr.message.includes('INSUFFICIENT_FUNDS'),
        'Overspending reservation must fail with INSUFFICIENT_FUNDS'
      );

      // Subsequent valid withdrawal (30 SOL) MUST succeed immediately (proving lock was released upon rollback)
      const validRecipient = Keypair.generate().publicKey.toBase58();
      const { data: reserved, error: validErr } = await supabase.rpc('reserve_withdrawal_atomic', {
        p_user_id: testUserId,
        p_wallet_id: walletId,
        p_privy_user_id: `privy_${testUserId}`,
        p_asset: 'SOL',
        p_token_mint: null,
        p_amount: 30.0,
        p_amount_base_units: '30000000000',
        p_sender: sender,
        p_recipient: validRecipient,
      });

      assert.ifError(validErr);
      assert.ok(reserved?.id, 'Subsequent valid reservation must succeed');
      assert.equal(reserved.status, 'VALIDATING');
    }
  });
});
