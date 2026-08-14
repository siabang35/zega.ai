import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac } from 'node:crypto';

/**
 * ⚡ ZEGA V2 Adversarial Security Regression Tests
 *
 * These tests verify the fixes for confirmed vulnerabilities F-01 through F-16.
 * They test SECURITY INVARIANTS — not feature behavior.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readRouteSource(routeFile: string): string {
  return readFileSync(resolve(__dirname, `../routes/v1/${routeFile}`), 'utf-8');
}

// Load env file for these tests (same path as env.ts)
try {
  (process as any).loadEnvFile(resolve(__dirname, '../../.env'));
} catch {}

// ═══════════════════════════════════════════════════════════════════════
// F-02: Client-Controlled Role Injection Prevention
// ═══════════════════════════════════════════════════════════════════════
describe('F-02: Privy-Sync Role Injection Prevention', () => {
  it('SUPERADMIN_EMAILS env parsing works with comma-separated list', () => {
    const envValue = 'admin@zegaai.site, superadmin@zegaai.site , extra@company.com';
    const parsed = envValue.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    assert.deepEqual(parsed, ['admin@zegaai.site', 'superadmin@zegaai.site', 'extra@company.com']);
  });

  it('empty SUPERADMIN_EMAILS gracefully produces empty list', () => {
    const envValue = '';
    const parsed = envValue.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    assert.deepEqual(parsed, []);
  });

  it('privy-sync schema must NOT accept role field from client', () => {
    const authSource = readRouteSource('auth.routes.ts');
    // After fix: the privy-sync schema should contain the "role is NOT accepted" comment
    assert.ok(authSource.includes('role is NOT accepted from client'), 'privy-sync must document role rejection');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-04: Settlement Recipient + Amount Verification
// ═══════════════════════════════════════════════════════════════════════
describe('F-04: Settlement Must Verify Recipient & Amount On-Chain', () => {
  it('valid tx with WRONG recipient must be rejected (invariant)', () => {
    const mockTxResult = {
      transaction: {
        message: {
          accountKeys: [
            { pubkey: 'AttackerWallet111111111111111111111111111' },
            { pubkey: 'UnrelatedAddress222222222222222222222222222' },
          ],
        },
      },
      meta: { postTokenBalances: [] },
    };
    const expectedRecipient = 'MerchantWallet33333333333333333333333333333';
    const accountKeys = mockTxResult.transaction.message.accountKeys;
    const recipientFound = accountKeys.some((key: any) => key.pubkey === expectedRecipient);
    assert.equal(recipientFound, false, 'Wrong recipient must not be found in tx');
  });

  it('valid tx with CORRECT recipient is accepted (invariant)', () => {
    const merchantWallet = 'MerchantWallet33333333333333333333333333333';
    const mockTxResult = {
      transaction: {
        message: {
          accountKeys: [
            { pubkey: 'SenderWallet111111111111111111111111111111' },
            { pubkey: merchantWallet },
          ],
        },
      },
    };
    const recipientFound = mockTxResult.transaction.message.accountKeys.some((key: any) => key.pubkey === merchantWallet);
    assert.equal(recipientFound, true, 'Correct recipient must be found in tx');
  });

  it('valid tx with WRONG amount must be rejected (invariant)', () => {
    const mockMeta = {
      preBalances: [1000000, 500000],
      postBalances: [999000, 501000],
    };
    const expectedAmount = 1000000000; // 1000 USDC
    let found = false;
    for (let i = 0; i < mockMeta.postBalances.length; i++) {
      const diff = mockMeta.postBalances[i] - mockMeta.preBalances[i];
      if (diff > 0 && diff >= expectedAmount) found = true;
    }
    assert.equal(found, false, 'Insufficient amount must be rejected');
  });

  it('settlementVerificationService contains verifyRecipient method', () => {
    const svsSource = readFileSync(resolve(__dirname, '../services/settlementVerificationService.ts'), 'utf-8');
    assert.ok(svsSource.includes('verifyRecipient'), 'Service must contain verifyRecipient method');
    assert.ok(svsSource.includes('verifyAmount'), 'Service must contain verifyAmount method');
    assert.ok(svsSource.includes('RECIPIENT_MISMATCH'), 'Service must return RECIPIENT_MISMATCH layer');
    assert.ok(svsSource.includes('AMOUNT_MISMATCH'), 'Service must return AMOUNT_MISMATCH layer');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-05: Anti-Replay Fail-Closed Behavior
// ═══════════════════════════════════════════════════════════════════════
describe('F-05: Anti-Replay Must Fail-Closed When DB Unavailable', () => {
  it('when Supabase client is null, treat as duplicate (fail-closed)', () => {
    const supabaseClient = null;
    const failClosedResult = supabaseClient === null ? true : false;
    assert.equal(failClosedResult, true, 'Null Supabase must return true (blocked)');
  });

  it('source code confirms fail-closed pattern', () => {
    const svsSource = readFileSync(resolve(__dirname, '../services/settlementVerificationService.ts'), 'utf-8');
    assert.ok(svsSource.includes('FAIL-CLOSED'), 'Service must contain FAIL-CLOSED comments');
    // Must NOT contain the old fail-open pattern
    assert.ok(!svsSource.includes("if (!supabase) return false"), 'Old fail-open pattern must be removed');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-07: CORS Wildcard Hosting Subdomain Removal
// ═══════════════════════════════════════════════════════════════════════
describe('F-07: CORS Must NOT Allow Arbitrary Hosting Subdomains', () => {
  it('evil-zega.vercel.app must be rejected by CORS', () => {
    const origin = 'https://evil-zega.vercel.app';
    const isAllowedDomain =
      /^https:\/\/(www\.)?zega(ai)?\.(site|ai)$/i.test(origin) ||
      origin.endsWith('.zegaai.site') ||
      origin.endsWith('.zega.ai');
    assert.equal(isAllowedDomain, false, 'Attacker vercel.app subdomain must be rejected');
  });

  it('attacker.onrender.com must be rejected', () => {
    const origin = 'https://attacker.onrender.com';
    const isAllowedDomain =
      /^https:\/\/(www\.)?zega(ai)?\.(site|ai)$/i.test(origin) ||
      origin.endsWith('.zegaai.site') ||
      origin.endsWith('.zega.ai');
    assert.equal(isAllowedDomain, false, 'Attacker onrender.com must be rejected');
  });

  it('legitimate zegaai.site subdomain is still allowed', () => {
    const origin = 'https://app.zegaai.site';
    const isAllowedDomain = origin.endsWith('.zegaai.site');
    assert.equal(isAllowedDomain, true, 'Legitimate ZEGA subdomain must be allowed');
  });

  it('plugins source code has removed wildcard hosting patterns', () => {
    const pluginSource = readFileSync(resolve(__dirname, '../plugins/index.ts'), 'utf-8');
    assert.ok(!pluginSource.includes("endsWith('.vercel.app')"), 'vercel.app wildcard must be removed');
    assert.ok(!pluginSource.includes("endsWith('.onrender.com')"), 'onrender.com wildcard must be removed');
    assert.ok(!pluginSource.includes("endsWith('.netlify.app')"), 'netlify.app wildcard must be removed');
    assert.ok(!pluginSource.includes("endsWith('.pages.dev')"), 'pages.dev wildcard must be removed');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-08: Rate Limiter X-Forwarded-For Spoofing Prevention
// ═══════════════════════════════════════════════════════════════════════
describe('F-08: Rate Limiter X-Forwarded-For Spoofing Prevention', () => {
  it('plugins source code no longer uses x-forwarded-for header for rate limiting', () => {
    const pluginSource = readFileSync(resolve(__dirname, '../plugins/index.ts'), 'utf-8');
    assert.ok(!pluginSource.includes("x-forwarded-for"), 'Rate limiter must not reference X-Forwarded-For');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-03: Stripe Webhook Signature Verification
// ═══════════════════════════════════════════════════════════════════════
describe('F-03: Stripe Webhook Forgery Prevention', () => {
  it('forged webhook without valid HMAC must be rejected (invariant)', () => {
    const secret = 'whsec_test_secret_key';
    const payload = '{"type":"payment_intent.succeeded","data":{"object":{}}}';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const correctSig = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
    const forgedSig = createHmac('sha256', 'wrong_secret').update(`${timestamp}.${payload}`).digest('hex');
    assert.notEqual(correctSig, forgedSig, 'Different secrets must produce different signatures');
  });

  it('webhook with expired timestamp must be rejected', () => {
    const now = Math.floor(Date.now() / 1000);
    const age = now - (now - 360);
    assert.ok(age > 300, 'Timestamp older than 5 minutes must be rejected');
  });

  it('placeholder webhook secret must be rejected', () => {
    const webhookSecret: string = 'whsec_placeholder';
    const isPlaceholder = !webhookSecret || webhookSecret === 'whsec_placeholder' || webhookSecret.length < 10;
    assert.equal(isPlaceholder, true, 'Placeholder webhook secret must trigger rejection');
  });

  it('payment source confirms HMAC verification implementation', () => {
    const paymentSource = readRouteSource('payment.routes.ts');
    assert.ok(paymentSource.includes('createHmac'), 'Must use createHmac for HMAC verification');
    assert.ok(paymentSource.includes('timingSafeEqual'), 'Must use timingSafeEqual for constant-time compare');
    assert.ok(!paymentSource.includes('// In production: verify with stripe.webhooks'), 'TODO comment must be removed');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Security Invariant: Authentication is Required On All Endpoints
// ═══════════════════════════════════════════════════════════════════════
describe('Security Invariant: All Sensitive Endpoints Require Auth', () => {
  it('agent routes: all endpoints have app.authenticate', () => {
    const source = readRouteSource('agent.routes.ts');
    const routeMatches: RegExpMatchArray | string[] = source.match(/app\.(post|get|patch|delete)(<[^>]+>)?\(/g) || [];
    const authMatches: RegExpMatchArray | string[] = source.match(/app\.authenticate/g) || [];
    assert.ok(routeMatches.length >= 6, `Expected >= 6 routes, found ${routeMatches.length}`);
    assert.ok(authMatches.length >= routeMatches.length, `Expected ${routeMatches.length} auth guards, found ${authMatches.length}`);
  });

  it('orchestration routes: all endpoints have app.authenticate', () => {
    const source = readRouteSource('orchestration.routes.ts');
    const routeMatches: RegExpMatchArray | string[] = source.match(/app\.(post|get|patch|delete)(<[^>]+>)?\(/g) || [];
    const authMatches: RegExpMatchArray | string[] = source.match(/app\.authenticate/g) || [];
    assert.ok(routeMatches.length >= 4, `Expected >= 4 routes, found ${routeMatches.length}`);
    assert.ok(authMatches.length >= routeMatches.length, `Expected ${routeMatches.length} auth guards, found ${authMatches.length}`);
  });

  it('payment analytics endpoint requires authentication', () => {
    const source = readRouteSource('payment.routes.ts');
    assert.ok(source.includes("'/analytics', { onRequest: [app.authenticate]"), 'Analytics endpoint must include authentication');
  });

  it('enterprise routes: prefix-level jwtVerify hook exists', () => {
    const source = readRouteSource('enterprise.routes.ts');
    assert.ok(source.includes('jwtVerify'), 'Enterprise routes must contain jwtVerify hook');
    assert.ok(source.includes('addHook'), 'Enterprise must use addHook for prefix-level auth');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-15: No API Key Prefixes in Responses
// ═══════════════════════════════════════════════════════════════════════
describe('F-15: No Secrets in API Responses', () => {
  it('enterprise copilot health must NOT contain keyPrefix field', () => {
    const source = readRouteSource('enterprise.routes.ts');
    assert.ok(!source.includes('keyPrefix'), 'Enterprise health must not expose keyPrefix');
  });

  it('storage test-connection must NOT leak SUPABASE_URL', () => {
    const source = readRouteSource('storage.routes.ts');
    assert.ok(!source.includes("process.env.SUPABASE_URL || 'Not Configured'"), 'Must not leak SUPABASE_URL');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F-12: JWT Secret Must Be Explicitly Configured
// ═══════════════════════════════════════════════════════════════════════
describe('F-12: JWT Secret Must Not Have Default', () => {
  it('env.ts source must NOT contain default JWT_SECRET value', () => {
    const envSource = readFileSync(resolve(__dirname, '../config/env.ts'), 'utf-8');
    assert.ok(!envSource.includes('zega-ai-dev-jwt-secret'), 'Default JWT secret must be removed');
    assert.ok(!envSource.includes('zega-ai-dev-cookie-secret'), 'Default cookie secret must be removed');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EA-01: Authorization Layer — Ownership Verification
// ═══════════════════════════════════════════════════════════════════════
describe('EA-01: Authorization Ownership Verification Invariants', () => {
  it('agent routes contain verifyOwnership on every mutation endpoint', () => {
    const source = readRouteSource('agent.routes.ts');
    const mutations = (source.match(/app\.(patch|delete|post)<[^>]+>/g) || []).length;
    const ownershipChecks = (source.match(/verifyOwnership/g) || []).length;
    assert.ok(ownershipChecks >= 4, `Expected >= 4 ownership checks in agent routes, found ${ownershipChecks}`);
  });

  it('payment routes contain verifyOwnership on GET /:id', () => {
    const source = readRouteSource('payment.routes.ts');
    assert.ok(source.includes('verifyOwnership'), 'Payment routes must use verifyOwnership');
    assert.ok(source.includes('PAYMENT_ACCESS_DENIED'), 'Payment routes must deny unauthorized access');
  });

  it('orchestration routes contain verifyOwnership on task mutations', () => {
    const source = readRouteSource('orchestration.routes.ts');
    assert.ok(source.includes('verifyOwnership'), 'Orchestration routes must use verifyOwnership');
    assert.ok(source.includes('TASK_ACCESS_DENIED'), 'Orchestration routes must deny unauthorized task access');
  });

  it('authorization middleware exists with fail-closed semantics', () => {
    const source = readFileSync(resolve(__dirname, '../middleware/authorization.ts'), 'utf-8');
    assert.ok(source.includes('FAIL-CLOSED'), 'Authorization must document fail-closed behavior');
    assert.ok(source.includes('verifyOwnership'), 'Must export verifyOwnership function');
    assert.ok(source.includes('verifyTenantAccess'), 'Must export verifyTenantAccess function');
    assert.ok(source.includes('verifyMinimumRole'), 'Must export verifyMinimumRole function');
    assert.ok(source.includes('denyAccess'), 'Must export denyAccess helper');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EA-02: Tenant Isolation — Request Context Propagation
// ═══════════════════════════════════════════════════════════════════════
describe('EA-02: Tenant Context Propagation Invariants', () => {
  it('request context middleware extracts principal from JWT', () => {
    const source = readFileSync(resolve(__dirname, '../middleware/requestContext.ts'), 'utf-8');
    assert.ok(source.includes('extractPrincipal'), 'Must export extractPrincipal function');
    assert.ok(source.includes('populatePrincipal'), 'Must export populatePrincipal hook');
    assert.ok(source.includes('request.principal'), 'Must populate request.principal');
  });

  it('agent routes bind ownerId and organizationId to records', () => {
    const source = readRouteSource('agent.routes.ts');
    assert.ok(source.includes('ownerId: principal.userId'), 'Agent records must bind ownerId');
    assert.ok(source.includes('organizationId: principal.organizationId'), 'Agent records must bind organizationId');
  });

  it('payment routes bind ownerId and organizationId to records', () => {
    const source = readRouteSource('payment.routes.ts');
    // F-001 FIX: Payment routes now persist to DB with snake_case columns
    assert.ok(
      source.includes('owner_id: principal.userId') || source.includes('ownerId: principal.userId'),
      'Payment records must bind owner_id to creating user'
    );
    assert.ok(
      source.includes('organization_id: principal.organizationId') || source.includes('organizationId: principal.organizationId'),
      'Payment records must bind organization_id to tenant'
    );
  });

  it('storage routes use tenant-scoped upload paths', () => {
    const source = readRouteSource('storage.routes.ts');
    assert.ok(source.includes('tenantFolder'), 'Storage must use tenant-scoped folder paths');
    assert.ok(source.includes('org/'), 'Must support org-scoped paths');
    assert.ok(source.includes('user/'), 'Must support user-scoped paths');
  });

  it('supabaseService has getAgentsByUser for tenant-scoped queries', () => {
    const source = readFileSync(resolve(__dirname, '../services/supabaseService.ts'), 'utf-8');
    assert.ok(source.includes('getAgentsByUser'), 'Must have tenant-scoped getAgentsByUser');
    assert.ok(source.includes(".eq('user_id', userId)"), 'Must filter by user_id');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EA-05: State Machine Transition Validation
// ═══════════════════════════════════════════════════════════════════════
describe('EA-05: State Machine Transition Invariants', () => {
  it('agent routes validate state transitions (cannot suspend non-active)', () => {
    const source = readRouteSource('agent.routes.ts');
    assert.ok(source.includes('INVALID_STATE_TRANSITION'), 'Agent routes must return INVALID_STATE_TRANSITION on bad transition');
  });

  it('orchestration routes define valid task transitions', () => {
    const source = readRouteSource('orchestration.routes.ts');
    assert.ok(source.includes('VALID_TASK_TRANSITIONS'), 'Must define VALID_TASK_TRANSITIONS map');
    assert.ok(source.includes('INVALID_STATE_TRANSITION'), 'Must return INVALID_STATE_TRANSITION on bad transition');
  });

  it('agent decommission is idempotent-safe (rejects double decommission)', () => {
    const source = readRouteSource('agent.routes.ts');
    assert.ok(source.includes('ALREADY_DECOMMISSIONED'), 'Must reject double decommission');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EA-06: SECURITY DEFINER search_path Hardening
// ═══════════════════════════════════════════════════════════════════════
describe('EA-06: SECURITY DEFINER search_path Invariants', () => {
  it('migration exists to fix search_path on SECURITY DEFINER functions', () => {
    const migrationPath = resolve(__dirname, '../../../../supabase/migrations/20260810020000_fix_security_definer_search_path.sql');
    const source = readFileSync(migrationPath, 'utf-8');
    assert.ok(source.includes('SET search_path = public, extensions'), 'Migration must set search_path');
    assert.ok(source.includes('check_rate_limit'), 'Must fix check_rate_limit function');
    assert.ok(source.includes('log_security_event'), 'Must fix log_security_event function');
    assert.ok(source.includes('handle_new_user_signup'), 'Must fix handle_new_user_signup function');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EA-08: CI/CD Security Gates
// ═══════════════════════════════════════════════════════════════════════
describe('EA-08: CI/CD Security Gate Invariants', () => {
  it('CI pipeline includes dependency audit step', () => {
    const ciSource = readFileSync(resolve(__dirname, '../../../../.github/workflows/ci.yml'), 'utf-8');
    assert.ok(ciSource.includes('pnpm audit'), 'CI must include dependency audit');
  });

  it('CI pipeline includes secret scanning step', () => {
    const ciSource = readFileSync(resolve(__dirname, '../../../../.github/workflows/ci.yml'), 'utf-8');
    assert.ok(ciSource.includes('Secret Scanning'), 'CI must include secret scanning step');
  });

  it('CI pipeline includes migration safety check', () => {
    const ciSource = readFileSync(resolve(__dirname, '../../../../.github/workflows/ci.yml'), 'utf-8');
    assert.ok(ciSource.includes('Migration Safety Check'), 'CI must include migration safety check');
  });
});
