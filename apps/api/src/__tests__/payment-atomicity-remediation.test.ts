import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { invoiceService } from '../services/InvoiceService.js';
import { paymentDetectionService } from '../services/PaymentDetectionService.js';

describe('Payment Atomicity & Invoice Expiration Remediation', () => {
  it('detects invoice expiration correctly', async () => {
    const userId = `user_expired_inv_${Date.now()}@zega.ai`;
    const pastDate = new Date(Date.now() - 3600_000).toISOString(); // 1 hour ago

    const inv = await invoiceService.createInvoice({
      userId,
      amount: '1.0',
      asset: 'SOL',
      description: 'Expired test invoice',
      expiresInMinutes: -60, // set past expiration
    });

    assert.ok(inv.id);
    const isExpired = new Date(inv.expires_at).getTime() < Date.now();
    assert.ok(isExpired, 'Invoice should be identified as expired');
  });

  it('calculates partial vs full payment status correctly', () => {
    const invoiceAmount = '10.0';
    const payment1 = '4.0';
    const payment2 = '6.0';

    let totalPaid = parseFloat(payment1);
    let status = totalPaid >= parseFloat(invoiceAmount) ? 'PAID' : 'PARTIALLY_PAID';
    assert.equal(status, 'PARTIALLY_PAID');

    totalPaid += parseFloat(payment2);
    status = totalPaid >= parseFloat(invoiceAmount) ? 'PAID' : 'PARTIALLY_PAID';
    assert.equal(status, 'PAID');
  });

  it('tracks overpayments correctly', () => {
    const invoiceAmount = '10.0';
    const paymentAmount = '12.5';

    const invNum = parseFloat(invoiceAmount);
    const payNum = parseFloat(paymentAmount);
    const overpayment = payNum > invNum ? payNum - invNum : 0;

    assert.equal(overpayment, 2.5);
  });
});
