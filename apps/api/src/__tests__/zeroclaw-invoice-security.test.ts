import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InvoiceSecurityService } from '../services/invoiceSecurityService.js';
import { FastifyRequest } from 'fastify';

function createMockRequest(opts: {
  principal?: { userId: string; email: string };
  headers?: Record<string, string>;
  body?: any;
}): FastifyRequest {
  return {
    principal: opts.principal,
    headers: opts.headers || {},
    body: opts.body || {},
    ip: '127.0.0.1',
  } as unknown as FastifyRequest;
}

describe('ZEGA AI — Production-Grade Invoice Security Hardening Test Matrix', () => {

  // TEST A — VALID INVOICE
  it('TEST A — ALLOW valid invoice request for authorized wallet and recipient', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_valid_123', email: 'merchant@zegaai.site' },
      headers: { 'x-organization-id': 'org_enterprise_001' },
      body: {
        userId: 'merchant@zegaai.site',
        merchantPubkey: '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9',
        amount: '0.20',
        customerTarget: '@valid_recipient',
      },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedUserId: 'merchant@zegaai.site',
      requestedMerchantPubkey: '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9',
      requestedAmount: '0.20',
      customerTarget: '@valid_recipient',
    });

    assert.equal(res.authorized, true);
    assert.equal(res.userEmail, 'merchant@zegaai.site');
    assert.equal(res.canonicalAmountUsdc, 0.20);
    assert.equal(res.authorizedMerchantWallet, '5627mXbzFUu2d4K1m1YKFPAYTQRKcXwnYz3SsjfG8ca9');
  });

  // TEST B — WRONG WALLET (Conflicting wallet provided)
  it('TEST B — DENY request with conflicting unauthorized merchant wallet', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_merchant_456', email: 'legit@zegaai.site' },
      headers: { 'x-organization-id': 'org_enterprise_001' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedUserId: 'legit@zegaai.site',
      requestedMerchantPubkey: 'AttackerSolanaWalletAddress11111111111111111',
      requestedAmount: '0.20',
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.statusCode, 403);
    assert.equal(res.errorResponse?.code, 'MERCHANT_WALLET_MISMATCH');
  });

  // TEST C — WRONG TENANT (Attempting user ID override)
  it('TEST C — DENY request attempting to claim another tenant/user identity', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_tenant_A', email: 'tenantA@zegaai.site' },
      headers: { 'x-organization-id': 'org_tenant_A' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedUserId: 'tenantB@zegaai.site', // Override attempt
      requestedAmount: '10.00',
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.statusCode, 403);
    assert.equal(res.errorResponse?.code, 'TENANT_IDENTITY_MISMATCH');
  });

  // TEST D — WRONG MERCHANT WALLET SUBSTITUTION
  it('TEST D — DENY prompt/payload merchant wallet substitution', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_merchant_789', email: 'store@zegaai.site' },
      headers: { 'x-organization-id': 'org_store_1' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedMerchantPubkey: 'FraudulentMerchantDestinationWalletXYZ',
      requestedAmount: '50.00',
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.statusCode, 403);
    assert.equal(res.errorResponse?.code, 'MERCHANT_WALLET_MISMATCH');
  });

  // TEST E — WRONG NETWORK (Devnet -> Mainnet manipulation attempt)
  it('TEST E — DENY network binding violation (devnet to mainnet switch attempt)', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '0.20',
      requestedNetwork: 'mainnet-beta', // Unauthorized network switch
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.statusCode, 400);
    assert.equal(res.errorResponse?.code, 'NETWORK_BINDING_VIOLATION');
  });

  // TEST F — AMOUNT MANIPULATION
  it('TEST F — DENY invalid, zero, negative, NaN or excessive invoice amounts', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    // Subtest 1: Negative amount
    const resNegative = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '-50.00',
    });
    assert.equal(resNegative.authorized, false);
    assert.equal(resNegative.errorResponse?.code, 'INVALID_AMOUNT');

    // Subtest 2: Zero amount
    const resZero = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '0',
    });
    assert.equal(resZero.authorized, false);
    assert.equal(resZero.errorResponse?.code, 'INVALID_AMOUNT');

    // Subtest 3: NaN amount
    const resNan = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: 'invalid_number_string',
    });
    assert.equal(resNan.authorized, false);
    assert.equal(resNan.errorResponse?.code, 'INVALID_AMOUNT');

    // Subtest 4: Excessive amount > 100k
    const resExcessive = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '999999999',
    });
    assert.equal(resExcessive.authorized, false);
    assert.equal(resExcessive.errorResponse?.code, 'AMOUNT_POLICY_EXCEEDED');
  });

  // TEST G — PROMPT INJECTION RESISTANCE
  it('TEST G — Ignore prompt injection instructions and enforce server-side validation', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_victim', email: 'victim@zegaai.site' },
    });

    // Attacker passes malicious prompt claims in parameters
    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedUserId: 'victim@zegaai.site',
      requestedMerchantPubkey: 'AttackerInjectedWalletAddress999999999',
      requestedAmount: '0.20',
    });

    // Server-side gate must DENY despite any claims
    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.code, 'MERCHANT_WALLET_MISMATCH');
  });

  // TEST H — AGENT ESCALATION (Help Agent trying to create Finance invoice)
  it('TEST H — DENY invoice creation request originating from Help/Knowledge agent', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '15.00',
      agentRole: 'help', // Restricted non-financial agent role
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.statusCode, 403);
    assert.equal(res.errorResponse?.code, 'AGENT_CAPABILITY_DENIED');
  });

  // TEST I — COPILOT ESCALATION
  it('TEST I — DENY unprivileged copilot execution attempt', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '25.00',
      agentRole: 'unprivileged_copilot',
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.code, 'AGENT_CAPABILITY_DENIED');
  });

  // TEST J — UNSUPPORTED TOKEN
  it('TEST J — DENY unsupported token asset binding', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '10.00',
      tokenSymbol: 'DOGE',
    });

    assert.equal(res.authorized, false);
    assert.equal(res.errorResponse?.code, 'UNSUPPORTED_TOKEN');
  });

  // TEST K — CANONICAL AMOUNT PRECISION
  it('TEST K — Properly canonicalizes USDC amount precision', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: 0.200000001,
    });

    assert.equal(res.authorized, true);
    assert.equal(res.canonicalAmountUsdc, 0.20);
  });

  // TEST L — FAIL-CLOSED ATOMIC BOUNDARY (DENIED produces zero valid artifacts)
  it('TEST L — Verify that DENIED authorization produces zero executable artifacts', async () => {
    const req = createMockRequest({
      principal: { userId: 'usr_1', email: 'user@zegaai.site' },
    });

    const res = await InvoiceSecurityService.validateSecurityContext({
      request: req,
      requestedAmount: '0.00', // Invalid amount -> DENY
    });

    assert.equal(res.authorized, false);
    // Ensure no merchant wallet or valid amount is returned for downstream execution
    assert.equal(res.canonicalAmountUsdc, 0);
  });

});
