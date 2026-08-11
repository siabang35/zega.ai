import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reconciliationScheduler } from '../services/ReconciliationScheduler.js';

describe('FINDING-04 — Reconciliation Scheduler Automated Execution', () => {
  it('starts and stops background reconciliation scheduler gracefully', () => {
    assert.equal(reconciliationScheduler.getStatus().isRunning, false);

    reconciliationScheduler.start();
    const activeStatus = reconciliationScheduler.getStatus();
    assert.equal(activeStatus.isRunning, true);
    assert.equal(typeof activeStatus.intervalMs, 'number');

    reconciliationScheduler.stop();
    assert.equal(reconciliationScheduler.getStatus().isRunning, false);
  });

  it('runs a single manual reconciliation cycle without throwing', async () => {
    const report = await reconciliationScheduler.runReconciliationCycle();
    if (report) {
      assert.ok(report.timestamp);
      assert.ok(typeof report.withdrawalsScanned === 'number');
      assert.ok(typeof report.withdrawalsFinalized === 'number');
      assert.ok(typeof report.withdrawalsReleased === 'number');
      assert.ok(Array.isArray(report.discrepancies));
    }
  });

  it('prevents overlapping concurrent execution of cycles on the same scheduler instance', async () => {
    const p1 = reconciliationScheduler.runReconciliationCycle();
    const p2 = reconciliationScheduler.runReconciliationCycle(); // Overlapping request

    const [r1, r2] = await Promise.all([p1, p2]);
    assert.ok(!(r1 !== null && r2 !== null), 'Overlapping concurrent execution must be prevented (at least one cycle must be skipped)');
  });
});
