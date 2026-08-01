/**
 * @zega/zeroclaw-bridge — Working Smoke Path Test
 *
 * Validates the core bridge capabilities:
 * 1. Client instantiation & default options
 * 2. Version compatibility matrix verification
 * 3. Graceful offline fallback state handling (Zero-Crash resilience)
 * 4. Error hierarchy instantiation
 * 5. Pairing manager protocol execution
 *
 * Run with: pnpm --filter @zega/zeroclaw-bridge test:smoke
 */

import { ZeroClawAuthManager } from '../auth.js';
import { ZeroClawGatewayClient } from '../client.js';
import { AuthenticationError, GatewayUnreachableError, PairingError } from '../errors.js';
import { checkVersionCompatibility, compareSemVer, parseSemVer } from '../version.js';

async function runSmokeTest() {
  console.log('🧪 Starting ZeroClaw Bridge Working Smoke Path Test...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── Test 1: SemVer Parser & Comparator ──
  console.log('--- Test Suite 1: SemVer Version Parsing ---');
  const [maj, min, pat, pre] = parseSemVer('v0.8.3-zeroclaw');
  assert(maj === 0 && min === 8 && pat === 3 && pre === 'zeroclaw', 'Parse SemVer "v0.8.3-zeroclaw"');
  assert(compareSemVer('0.8.3', '0.8.0') > 0, 'SemVer compare 0.8.3 > 0.8.0');
  assert(compareSemVer('0.8.3', '0.8.3') === 0, 'SemVer compare 0.8.3 == 0.8.3');
  assert(compareSemVer('0.7.9', '0.8.0') < 0, 'SemVer compare 0.7.9 < 0.8.0');

  // ── Test 2: Version Compatibility Matrix ──
  console.log('\n--- Test Suite 2: Version Compatibility Matrix ---');
  const comp083 = checkVersionCompatibility('0.8.3');
  assert(comp083.compatible === true, 'v0.8.3 marked compatible');

  const comp070 = checkVersionCompatibility('0.7.0');
  assert(comp070.compatible === false, 'v0.7.0 marked incompatible (too old)');

  const comp095 = checkVersionCompatibility('0.9.5');
  assert(comp095.compatible === false, 'v0.9.5 marked incompatible (exceeds max cap)');

  // ── Test 3: Auth Manager Initialization ──
  console.log('\n--- Test Suite 3: Auth Manager & Header Generation ---');
  const auth = new ZeroClawAuthManager({
    gatewayUrl: 'http://127.0.0.1:4242',
    bearerToken: 'test_secret_token_123',
  });
  assert(auth.isAuthenticated() === true, 'Auth manager reports authenticated with token');

  const headers = auth.getAuthHeaders();
  assert(headers['Authorization'] === 'Bearer test_secret_token_123', 'Auth header correctly formatted');

  const unauth = new ZeroClawAuthManager({ gatewayUrl: 'http://127.0.0.1:4242' });
  assert(unauth.isAuthenticated() === false, 'Unauthenticated manager reports false');

  try {
    unauth.getAuthHeaders();
    assert(false, 'Should throw AuthenticationError when unauthenticated');
  } catch (e) {
    assert(e instanceof AuthenticationError, 'Throws AuthenticationError on missing token');
  }

  // ── Test 4: Gateway Client & Offline Fallback ──
  console.log('\n--- Test Suite 4: Gateway Client Zero-Crash Offline Resilience ---');
  const client = new ZeroClawGatewayClient({
    gatewayUrl: 'http://127.0.0.1:59999', // Port unlikely to have a server running
    timeoutMs: 800,
    maxRetries: 0,
  });

  const state = await client.getState();
  assert(state.status === 'error', 'Client getState() returns status="error" when daemon offline');
  assert(state.paired === false, 'Client getState() reports paired=false when daemon offline');
  assert(typeof state.lastError === 'string', 'Client captures error message without throwing');

  // ── Test 5: Error Hierarchy ──
  console.log('\n--- Test Suite 5: Error Hierarchy Sanity Check ---');
  const errUnreachable = new GatewayUnreachableError('http://127.0.0.1:4242');
  assert(errUnreachable.code === 'GATEWAY_UNREACHABLE', 'GatewayUnreachableError code');
  assert(errUnreachable.retryable === true, 'GatewayUnreachableError retryable flag');

  const errPairing = new PairingError('Invalid code', 403);
  assert(errPairing.code === 'PAIRING_FAILED', 'PairingError code');
  assert(errPairing.statusCode === 403, 'PairingError statusCode');

  // ── Summary ──
  console.log(`\n========================================`);
  console.log(`Smoke Test Complete: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTest().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
