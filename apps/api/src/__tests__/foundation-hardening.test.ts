import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

/**
 * ⚡ ZEGA Foundation Engineering Hardening — Security Regression Tests
 *
 * These tests verify the P0 critical fixes implemented during the
 * Foundation Engineering Audit. They test SECURITY INVARIANTS that
 * must never regress.
 *
 * Test Categories:
 *   FH-01: Production Startup Guard (env.ts)
 *   FH-02: Superadmin Configuration (auth.routes.ts)
 *   FH-03: Turnstile Enforcement (auth.routes.ts)
 *   FH-04: JWT Expiry Reduction (auth.routes.ts)
 *   FH-05: Keypair Derivation Safety (zeroclaw.routes.ts)
 *   FH-06: Query Bounds (supabaseService.ts)
 *   FH-07: Foundation SQL Migration Integrity
 *   FH-08: Idempotency Key Infrastructure
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════════
// FH-01: Production Startup Guard
// ═══════════════════════════════════════════════════════════════════════
describe('FH-01: Production Startup Guard — Placeholder Credential Rejection', () => {
  const envSource = readSource('../config/env.ts');

  it('env.ts contains validateProductionGuard function', () => {
    assert.ok(envSource.includes('validateProductionGuard'), 'Must contain production guard function');
  });

  it('env.ts rejects placeholder SUPABASE_URL in production', () => {
    assert.ok(envSource.includes("SUPABASE_URL is a placeholder"), 'Must check SUPABASE_URL placeholder');
  });

  it('env.ts rejects placeholder SUPABASE_SERVICE_ROLE_KEY in production', () => {
    assert.ok(envSource.includes("SUPABASE_SERVICE_ROLE_KEY is a placeholder"), 'Must check service role key');
  });

  it('env.ts rejects placeholder SUPABASE_ANON_KEY in production', () => {
    assert.ok(envSource.includes("SUPABASE_ANON_KEY is a placeholder"), 'Must check anon key');
  });

  it('env.ts calls process.exit(1) on production violations', () => {
    assert.ok(envSource.includes("process.exit(1)"), 'Must exit on violation');
  });

  it('env.ts contains PLACEHOLDER_VALUES constant for detection', () => {
    assert.ok(envSource.includes('PLACEHOLDER_VALUES'), 'Must define placeholder values list');
    assert.ok(envSource.includes('placeholder-service-role-key'), 'Must include service role placeholder');
    assert.ok(envSource.includes('placeholder.supabase.co'), 'Must include URL placeholder');
  });

  it('env.ts includes SUPERADMIN_EMAILS as explicit schema field', () => {
    assert.ok(envSource.includes('SUPERADMIN_EMAILS:'), 'Must define SUPERADMIN_EMAILS in Zod schema');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-02: Superadmin Hardcoded Fallback Removal
// ═══════════════════════════════════════════════════════════════════════
describe('FH-02: Superadmin Configuration — No Hardcoded Fallback', () => {
  const authSource = readSource('../routes/v1/auth.routes.ts');

  it('auth.routes.ts does NOT contain hardcoded superadmin email fallback', () => {
    assert.ok(
      !authSource.includes("|| 'admin@zegaai.site,superadmin@zegaai.site'"),
      'Hardcoded superadmin fallback MUST be removed'
    );
  });

  it('auth.routes.ts does NOT use process.env.SUPERADMIN_EMAILS with hardcoded default', () => {
    // Verify the old pattern is gone
    const oldPattern = "process.env.SUPERADMIN_EMAILS || 'admin@zegaai.site";
    assert.ok(!authSource.includes(oldPattern), 'Old hardcoded fallback pattern must be removed');
  });

  it('auth.routes.ts uses getConfiguredSuperAdmins helper', () => {
    assert.ok(authSource.includes('getConfiguredSuperAdmins'), 'Must use centralized helper function');
  });

  it('auth.routes.ts checks configuredSuperAdmins.length before granting superadmin', () => {
    assert.ok(
      authSource.includes('configuredSuperAdmins.length > 0'),
      'Must verify list is non-empty before granting superadmin'
    );
  });

  it('getConfiguredSuperAdmins uses envConfig.SUPERADMIN_EMAILS', () => {
    assert.ok(authSource.includes('envConfig.SUPERADMIN_EMAILS'), 'Must read from envConfig');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-03: Cloudflare Turnstile Mandatory in Production
// ═══════════════════════════════════════════════════════════════════════
describe('FH-03: Turnstile Bot Defense — Mandatory in Production', () => {
  const authSource = readSource('../routes/v1/auth.routes.ts');

  it('auth.routes.ts contains CAPTCHA_REQUIRED error code', () => {
    assert.ok(authSource.includes('CAPTCHA_REQUIRED'), 'Must return CAPTCHA_REQUIRED when missing in production');
  });

  it('auth.routes.ts checks isProduction before requiring turnstile', () => {
    assert.ok(authSource.includes('isProduction'), 'Must check production mode');
    assert.ok(authSource.includes("envConfig.NODE_ENV === 'production'"), 'Must use envConfig for env check');
  });

  it('auth.routes.ts checks hasTurnstileKey before mandating token', () => {
    assert.ok(authSource.includes('hasTurnstileKey'), 'Must verify Turnstile is configured before mandating');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-04: JWT Expiry Reduction
// ═══════════════════════════════════════════════════════════════════════
describe('FH-04: JWT Expiry — Reduced Breach Window', () => {
  const authSource = readSource('../routes/v1/auth.routes.ts');

  it('JWT expiresIn is set to 1 hour (not 8h)', () => {
    assert.ok(authSource.includes("expiresIn: '1h'"), 'JWT must expire in 1h');
    assert.ok(!authSource.includes("expiresIn: '8h'"), 'Old 8h expiry must be removed');
  });

  it('cookie maxAge matches JWT expiry (1h = 3600s)', () => {
    assert.ok(authSource.includes('maxAge: 1 * 3600'), 'Cookie maxAge must be 1h');
    assert.ok(!authSource.includes('maxAge: 8 * 3600'), 'Old 8h cookie maxAge must be removed');
  });

  it('response expiresIn is 3600 (not 28800)', () => {
    assert.ok(authSource.includes('expiresIn: 3600'), 'Response expiry must be 3600');
    assert.ok(!authSource.includes('expiresIn: 28800'), 'Old 28800 response expiry must be removed');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-05: Deterministic Keypair Derivation — Production Safety Guard
// ═══════════════════════════════════════════════════════════════════════
describe('FH-05: Keypair Derivation — Production/Mainnet Block', () => {
  const zeroclawSource = readSource('../routes/v1/zeroclaw.routes.ts');

  it('zeroclaw.routes.ts contains assertDevnetOnly guard function', () => {
    assert.ok(zeroclawSource.includes('assertDevnetOnly'), 'Must contain devnet-only assertion');
  });

  it('assertDevnetOnly blocks production+mainnet combination', () => {
    assert.ok(zeroclawSource.includes("nodeEnv === 'production' && isMainnet"), 'Must check production+mainnet');
  });

  it('assertDevnetOnly checks for mainnet in RPC URL', () => {
    assert.ok(zeroclawSource.includes("rpcUrl.includes('mainnet')"), 'Must detect mainnet RPC');
    assert.ok(zeroclawSource.includes("rpcUrl.includes('api.solana.com')"), 'Must detect official mainnet');
  });

  it('derive32SeedFromEmail calls assertDevnetOnly', () => {
    // Find the function and verify it calls the guard
    const fnStart = zeroclawSource.indexOf('function derive32SeedFromEmail');
    const fnBody = zeroclawSource.slice(fnStart, fnStart + 500);
    assert.ok(fnBody.includes('assertDevnetOnly'), 'derive32SeedFromEmail must call assertDevnetOnly');
  });

  it('derivePrivyEmbeddedSolanaKeypair calls assertDevnetOnly', () => {
    const fnStart = zeroclawSource.indexOf('function derivePrivyEmbeddedSolanaKeypair') || 
                    zeroclawSource.indexOf('export function derivePrivyEmbeddedSolanaKeypair');
    assert.ok(fnStart > 0, 'derivePrivyEmbeddedSolanaKeypair must exist');
    const fnBody = zeroclawSource.slice(fnStart, fnStart + 500);
    assert.ok(fnBody.includes('assertDevnetOnly'), 'derivePrivyEmbeddedSolanaKeypair must call assertDevnetOnly');
  });

  it('derivePrivyEmbeddedSolanaWallet calls assertDevnetOnly', () => {
    const fnStart = zeroclawSource.indexOf('function derivePrivyEmbeddedSolanaWallet');
    assert.ok(fnStart > 0, 'derivePrivyEmbeddedSolanaWallet must exist');
    const fnBody = zeroclawSource.slice(fnStart, fnStart + 500);
    assert.ok(fnBody.includes('assertDevnetOnly'), 'derivePrivyEmbeddedSolanaWallet must call assertDevnetOnly');
  });

  it('custom SHA-256 reimplementation replaced with native crypto', () => {
    assert.ok(
      !zeroclawSource.includes('function rightRotate(value: number, amount: number)'),
      'Custom SHA-256 rightRotate MUST be removed — use Node.js crypto'
    );
    // Verify native createHash is used instead
    const deriveFnStart = zeroclawSource.indexOf('function derive32SeedFromEmail');
    const deriveFnBody = zeroclawSource.slice(deriveFnStart, deriveFnStart + 400);
    assert.ok(deriveFnBody.includes("createHash('sha256')"), 'Must use native crypto.createHash');
  });

  it('functions are marked @deprecated in JSDoc', () => {
    assert.ok(zeroclawSource.includes('@deprecated SECURITY RISK'), 'Functions must have @deprecated JSDoc');
  });

  it('deprecation counter tracks total derivation calls', () => {
    assert.ok(zeroclawSource.includes('_keypairDerivationCallCount'), 'Must track derivation call count');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-06: Unbounded Query Protection
// ═══════════════════════════════════════════════════════════════════════
describe('FH-06: Query Bounds — Unbounded Result Set Protection', () => {
  const supabaseSource = readSource('../services/supabaseService.ts');

  it('supabaseService.ts defines MAX_QUERY_LIMIT constant', () => {
    assert.ok(supabaseSource.includes('MAX_QUERY_LIMIT'), 'Must define MAX_QUERY_LIMIT');
  });

  it('getAgents() uses .limit()', () => {
    const fnStart = supabaseSource.indexOf('async getAgents()');
    const fnBody = supabaseSource.slice(fnStart, fnStart + 500);
    assert.ok(fnBody.includes('.limit('), 'getAgents must include .limit()');
  });

  it('getAgentsByUser() uses .limit()', () => {
    const fnStart = supabaseSource.indexOf('async getAgentsByUser');
    const fnBody = supabaseSource.slice(fnStart, fnStart + 500);
    assert.ok(fnBody.includes('.limit('), 'getAgentsByUser must include .limit()');
  });

  it('supabaseService.ts has healthCheck method', () => {
    assert.ok(supabaseSource.includes('async healthCheck()'), 'Must have healthCheck method');
    assert.ok(supabaseSource.includes('latencyMs'), 'Health check must report latency');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-07: Foundation SQL Migration Integrity
// ═══════════════════════════════════════════════════════════════════════
describe('FH-07: Foundation SQL Migration — Structural Integrity', () => {
  const migrationPath = resolve(__dirname, '../../../../supabase/migrations/20260810030000_foundation_engineering_hardening.sql');
  
  it('foundation migration file exists', () => {
    assert.ok(existsSync(migrationPath), 'Migration file must exist at expected path');
  });

  const migrationSource = readFileSync(migrationPath, 'utf-8');

  it('migration contains org-scoped RLS policy for agents', () => {
    assert.ok(migrationSource.includes('agents_org_read'), 'Must create agents org read policy');
  });

  it('migration contains org-scoped RLS policy for workflows', () => {
    assert.ok(migrationSource.includes('workflows_org_read'), 'Must create workflows org read policy');
  });

  it('migration contains performance indexes', () => {
    assert.ok(migrationSource.includes('idx_agents_user_id'), 'Must create user_id index on agents');
    assert.ok(migrationSource.includes('idx_agents_org_id'), 'Must create org_id index on agents');
    assert.ok(migrationSource.includes('idx_workflows_user_id'), 'Must create user_id index on workflows');
    assert.ok(migrationSource.includes('idx_zeroclaw_invoices_ref'), 'Must create reference_key index');
  });

  it('migration contains log retention cleanup function', () => {
    assert.ok(migrationSource.includes('cleanup_old_logs'), 'Must create log cleanup function');
    assert.ok(migrationSource.includes("INTERVAL '30 days'"), 'Rate limit logs: 30 day retention');
    assert.ok(migrationSource.includes("INTERVAL '90 days'"), 'Audit logs: 90 day retention');
  });

  it('migration contains idempotency_keys table', () => {
    assert.ok(migrationSource.includes('idempotency_keys'), 'Must create idempotency_keys table');
    assert.ok(migrationSource.includes('request_hash'), 'Must include request_hash column');
    assert.ok(migrationSource.includes('expires_at'), 'Must include expires_at column');
  });

  it('migration sets search_path on SECURITY DEFINER functions', () => {
    assert.ok(
      migrationSource.includes('SET search_path = public, extensions'),
      'SECURITY DEFINER functions must set search_path'
    );
  });

  it('migration enables RLS on idempotency_keys', () => {
    assert.ok(
      migrationSource.includes('ENABLE ROW LEVEL SECURITY'),
      'Must enable RLS on new tables'
    );
  });

  it('migration uses idempotent DDL (IF NOT EXISTS / DO $$ blocks)', () => {
    assert.ok(migrationSource.includes('IF NOT EXISTS'), 'Must use IF NOT EXISTS for safety');
    assert.ok(migrationSource.includes('CREATE INDEX IF NOT EXISTS'), 'Indexes must be idempotent');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FH-08: Architectural Invariant Regression Guards
// ═══════════════════════════════════════════════════════════════════════
describe('FH-08: Architectural Invariant — No Secrets in Env Defaults', () => {
  const envSource = readSource('../config/env.ts');

  it('JWT_SECRET has NO default value', () => {
    // JWT_SECRET must use z.string().min(32) with NO .default()
    assert.ok(!envSource.includes("JWT_SECRET: z.string().min(32).default("), 'JWT_SECRET must not have a default');
    assert.ok(!envSource.includes('zega-ai-dev-jwt-secret'), 'Old dev JWT secret must not exist');
  });

  it('COOKIE_SECRET has NO default value', () => {
    assert.ok(!envSource.includes("COOKIE_SECRET: z.string().min(32).default("), 'COOKIE_SECRET must not have a default');
    assert.ok(!envSource.includes('zega-ai-dev-cookie-secret'), 'Old dev cookie secret must not exist');
  });
});
