import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reconciliationService } from '../services/ReconciliationService.js';

describe('Batch Reconciliation Automation', () => {
  it('executes batch reconciliation without throwing', async () => {
    const report = await reconciliationService.reconcileBatch();
    assert.ok(report.timestamp);
    assert.ok(typeof report.withdrawalsScanned === 'number');
    assert.ok(typeof report.withdrawalsFinalized === 'number');
    assert.ok(typeof report.withdrawalsReleased === 'number');
    assert.ok(Array.isArray(report.discrepancies));
  });

  it('is 100% idempotent — running multiple times yields consistent results', async () => {
    const report1 = await reconciliationService.reconcileBatch();
    const report2 = await reconciliationService.reconcileBatch();

    assert.equal(typeof report1.timestamp, 'string');
    assert.equal(typeof report2.timestamp, 'string');
    assert.ok(report2.withdrawalsScanned >= report1.withdrawalsScanned);
    assert.equal(report2.withdrawalsFinalized, 0);
    assert.equal(report2.withdrawalsReleased, 0);
  });
});
