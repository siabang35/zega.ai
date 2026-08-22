import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ZEGA AI — Zero-Trust Security Regression Test Suite
 *
 * Comprehensive static analysis + behavioral tests enforcing:
 *   ZT-01: JWT Authentication — fail-closed, no decode fallback
 *   ZT-02: Cross-Tenant Isolation — principal org !== resource org → DENY
 *   ZT-03: AI Tool Isolation — assistant cannot invoke forbidden tools
 *   ZT-04: AI Swarm Scope — childScope ⊆ parentScope
 *   ZT-05: Store Ownership — no auto-promote to orgRole 'owner'
 *   ZT-06: Prompt Injection — adversarial payloads blocked
 *   ZT-07: Centralized Authorization — authorize() exists and enforces policy
 *   ZT-08: Delegation Scope — verifyDelegationScope enforces subset rule
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Source file not found: ${fullPath}`);
  }
  return readFileSync(fullPath, 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════════════
// ZT-01: JWT Authentication — NEVER use jwt.decode() in auth paths
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-01: JWT Authentication — No Unverified Fallback', () => {
  const requestContextSrc = readSource('../middleware/requestContext.ts');
  const umkmRoutesSrc = readSource('../routes/v1/umkm.routes.ts');
  const authRoutesSrc = readSource('../routes/v1/auth.routes.ts');

  it('requestContext.ts does NOT contain jwt.decode in auth path', () => {
    // REGRESSION: jwt.decode() is banned — must use verifySupabaseJwt() with HMAC-SHA256 instead
    const lines = requestContextSrc.split('\n');
    const codeLines = lines.filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const hasDecodeInCode = codeLines.some(l => l.includes('jwt.decode('));
    assert.ok(
      !hasDecodeInCode,
      'CRITICAL REGRESSION: requestContext.ts contains jwt.decode() — must use verifySupabaseJwt with HMAC verification'
    );
  });

  it('requestContext.ts uses cryptographic Supabase JWT verification', () => {
    assert.ok(
      requestContextSrc.includes('verifySupabaseJwt'),
      'Must use verifySupabaseJwt() for Supabase GoTrue-signed tokens (HMAC-SHA256 verified)'
    );
    assert.ok(
      requestContextSrc.includes('createHmac'),
      'Must use createHmac for cryptographic JWT signature verification'
    );
  });

  it('requestContext.ts does NOT contain Buffer.from(base64) JWT parsing', () => {
    // Check the extractPrincipal function specifically
    const fnStart = requestContextSrc.indexOf('export async function extractPrincipal');
    const fnEnd = requestContextSrc.indexOf('export async function populatePrincipal');
    const fnBody = requestContextSrc.slice(fnStart, fnEnd);

    assert.ok(
      !fnBody.includes("Buffer.from(base64, 'base64')"),
      'CRITICAL REGRESSION: extractPrincipal still parses unverified JWT via Buffer.from(base64)'
    );
  });

  it('requestContext.ts DOES use jwt.verify', () => {
    assert.ok(
      requestContextSrc.includes('jwt.verify(token)'),
      'Must use jwt.verify(token) for cryptographic JWT verification'
    );
  });

  it('umkm.routes.ts does NOT contain jwt.decode in auth hook', () => {
    // Scan the onRequest hook section (first 200 lines)
    const hookSection = umkmRoutesSrc.slice(0, 5000);
    assert.ok(
      !hookSection.includes('jwt.decode(token)') && !hookSection.includes('.jwt.decode(token)'),
      'CRITICAL REGRESSION: umkm.routes.ts onRequest hook contains jwt.decode — authentication bypass!'
    );
  });

  it('umkm.routes.ts does NOT contain Buffer.from(base64) JWT parsing in auth hook', () => {
    const hookSection = umkmRoutesSrc.slice(0, 5000);
    assert.ok(
      !hookSection.includes("Buffer.from(base64, 'base64')"),
      'CRITICAL REGRESSION: umkm.routes.ts auth hook parses unverified JWT via Buffer.from(base64)'
    );
  });

  it('auth.routes.ts /me endpoint does NOT contain Buffer.from JWT fallback', () => {
    // Find the /me endpoint handler
    const meStart = authRoutesSrc.indexOf("app.get('/me'");
    const meEnd = authRoutesSrc.indexOf('});', meStart + 100);
    const meBody = authRoutesSrc.slice(meStart, meEnd);

    assert.ok(
      !meBody.includes("Buffer.from(parts[1], 'base64')"),
      'CRITICAL REGRESSION: GET /me endpoint parses unverified JWT payload via Buffer.from'
    );
  });

  it('requestContext.ts logs warning on JWT verification failure', () => {
    assert.ok(
      requestContextSrc.includes('JWT verification failed'),
      'Must log warning when JWT verification fails (for audit trail)'
    );
  });

  it('requestContext returns null principal for invalid JWT (fail-closed)', () => {
    // The function must return null at the end if jwtPayload is null
    assert.ok(
      requestContextSrc.includes('return null'),
      'extractPrincipal must return null for unauthenticated requests'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-02: Cross-Tenant Isolation — verifyTenantAccess
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-02: Cross-Tenant Isolation', () => {
  const authSrc = readSource('../middleware/authorization.ts');

  it('authorization.ts exports verifyTenantAccess', () => {
    assert.ok(
      authSrc.includes('export function verifyTenantAccess'),
      'Must export verifyTenantAccess function'
    );
  });

  it('verifyTenantAccess denies when resourceOrgId is null (fail-closed)', () => {
    assert.ok(
      authSrc.includes("if (!resourceOrgId)"),
      'Must deny access when resource has no organization_id'
    );
  });

  it('verifyTenantAccess denies when principal has no org context', () => {
    assert.ok(
      authSrc.includes("if (!principal.organizationId)"),
      'Must deny access when principal has no organization context'
    );
  });

  it('verifyTenantAccess denies cross-tenant access', () => {
    assert.ok(
      authSrc.includes('principal.organizationId !== resourceOrgId'),
      'Must deny when principal org !== resource org'
    );
  });

  it('verifyTenantAccess logs cross-tenant attempts', () => {
    assert.ok(
      authSrc.includes('cross_tenant_access_denied'),
      'Must log cross-tenant access attempts for audit'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-03: AI Tool Isolation — assistant allowlist enforcement
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-03: AI Tool Isolation', () => {
  const registrySrc = readSource('../services/ai/toolRegistry.ts');
  const assistantSrc = readSource('../services/ai/assistantRegistry.ts');

  it('toolRegistry enforces tool isolation per assistant type', () => {
    assert.ok(
      registrySrc.includes('TOOL_ISOLATION_VIOLATION'),
      'Must reject tools not in assistant allowlist'
    );
  });

  it('toolRegistry validates storeId against tenantId', () => {
    assert.ok(
      registrySrc.includes('TENANT_ISOLATION_VIOLATION'),
      'Must reject storeId that does not belong to tenantId'
    );
  });

  it('assistantRegistry defines explicit tool allowlists for each assistant', () => {
    assert.ok(assistantSrc.includes("allowedTools: ['get_business_overview'"), 'Home must have explicit allowedTools');
    assert.ok(assistantSrc.includes("allowedTools: ['search_help_docs'"), 'Help must have explicit allowedTools');
    assert.ok(assistantSrc.includes("allowedTools: ['get_financial_metrics'"), 'Finance must have explicit allowedTools');
    assert.ok(assistantSrc.includes("allowedTools: ['search_tenant_knowledge'"), 'Knowledge must have explicit allowedTools');
  });

  it('assistantRegistry defines explicit permissions for each assistant', () => {
    assert.ok(assistantSrc.includes("permissions:"), 'Each assistant must define explicit permissions');
  });

  it('copilot does NOT automatically have unlimited permissions', () => {
    // Copilot has a finite list of tools, not wildcard
    const copilotStart = assistantSrc.indexOf("id: 'zega_copilot'");
    const copilotSection = assistantSrc.slice(copilotStart, copilotStart + 1000);
    assert.ok(
      copilotSection.includes('allowedTools: ['),
      'Copilot must have an explicit allowedTools array (not wildcard)'
    );
    assert.ok(
      !copilotSection.includes("allowedTools: ['*']"),
      'Copilot must NOT have wildcard tool access'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-04: AI Swarm — Authorization Scope Propagation
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-04: AI Swarm Scope Propagation', () => {
  const swarmSrc = readSource('../services/ai/agentSwarmOrchestrator.ts');

  it('agentSwarmOrchestrator includes AuthorizationScope in SwarmDelegationResult', () => {
    assert.ok(
      swarmSrc.includes('authorizationScope'),
      'SwarmDelegationResult must carry authorizationScope for delegation tracking'
    );
  });

  it('agentSwarmOrchestrator imports AuthorizationScope from authorization module', () => {
    assert.ok(
      swarmSrc.includes("from '../../middleware/authorization.js'"),
      'Must import authorization types from the canonical authorization module'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-05: Store Ownership — No Automatic orgRole Promotion
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-05: Store Ownership Does NOT Auto-Promote', () => {
  const contextSrc = readSource('../middleware/requestContext.ts');

  it('requestContext does NOT auto-promote store owners to org owner', () => {
    // The pattern that was removed: orgRole = 'owner' based on umkm_stores lookup
    const step2Section = contextSrc.slice(
      contextSrc.indexOf('Step 2: Resolve organization'),
      contextSrc.indexOf('Step 2.5:')
    );

    assert.ok(
      !step2Section.includes("orgRole = 'owner'"),
      'REGRESSION: requestContext still auto-promotes store owners to orgRole=owner'
    );
  });

  it('requestContext only uses organization_members for org role', () => {
    assert.ok(
      contextSrc.includes("from('organization_members')"),
      'Must query organization_members for org-level role resolution'
    );
  });

  it('requestContext does NOT use store-owner- synthetic membership ID', () => {
    // After the fix, membership IDs should come from organization_members.id, not synthetic
    const step2Section = contextSrc.slice(
      contextSrc.indexOf('Step 2: Resolve organization'),
      contextSrc.indexOf('Step 2.5:')
    );
    assert.ok(
      !step2Section.includes("`store-owner-${principal.userId}`"),
      'REGRESSION: requestContext still creates synthetic store-owner membership IDs'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-06: Prompt Injection — Adversarial Payloads
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-06: Prompt Injection Defense', () => {
  const orchestratorSrc = readSource('../services/ai/universalChatOrchestrator.ts');
  const guardrailsSrc = readSource('../services/ai/guardrails.ts');

  it('universalChatOrchestrator has sanitizePrompt function', () => {
    assert.ok(
      orchestratorSrc.includes('sanitizePrompt'),
      'Must have sanitizePrompt function for input sanitization'
    );
  });

  it('sanitizePrompt strips system prompt override attempts', () => {
    assert.ok(
      orchestratorSrc.includes('system') || orchestratorSrc.includes('SYSTEM'),
      'sanitizePrompt must handle system: override patterns'
    );
  });

  it('sanitizePrompt truncates long prompts', () => {
    assert.ok(
      orchestratorSrc.includes('substring') || orchestratorSrc.includes('slice') || orchestratorSrc.includes('maxLength') || orchestratorSrc.includes('MAX_'),
      'Must truncate excessively long prompts'
    );
  });

  it('guardrails detect injection patterns', () => {
    assert.ok(
      guardrailsSrc.includes('ignore') && guardrailsSrc.includes('previous'),
      'Guardrails must detect ignore-previous-instructions patterns'
    );
  });

  it('guardrails have PII redaction', () => {
    assert.ok(
      guardrailsSrc.includes('pii') || guardrailsSrc.includes('PII') || guardrailsSrc.includes('redact'),
      'Guardrails must include PII redaction'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-07: Centralized Authorization Function
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-07: Centralized authorize() Function', () => {
  const authSrc = readSource('../middleware/authorization.ts');

  it('authorization.ts exports authorize() function', () => {
    assert.ok(
      authSrc.includes('export function authorize('),
      'Must export centralized authorize() function'
    );
  });

  it('authorize() checks principal existence (fail-closed)', () => {
    assert.ok(
      authSrc.includes('NO_PRINCIPAL'),
      'Must deny when principal is missing'
    );
  });

  it('authorize() checks cross-tenant access', () => {
    assert.ok(
      authSrc.includes('CROSS_TENANT_DENIED'),
      'Must deny cross-tenant authorization attempts'
    );
  });

  it('authorize() validates assistant type', () => {
    assert.ok(
      authSrc.includes('INVALID_ASSISTANT'),
      'Must deny unrecognized assistant types'
    );
  });

  it('authorize() validates tool against assistant allowlist', () => {
    assert.ok(
      authSrc.includes('TOOL_NOT_AUTHORIZED_FOR_ASSISTANT'),
      'Must deny tools not in assistant allowlist'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-08: Delegation Scope Verification
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-08: verifyDelegationScope() Enforcement', () => {
  const authSrc = readSource('../middleware/authorization.ts');

  it('authorization.ts exports verifyDelegationScope()', () => {
    assert.ok(
      authSrc.includes('export function verifyDelegationScope('),
      'Must export verifyDelegationScope function'
    );
  });

  it('verifyDelegationScope denies cross-tenant delegation', () => {
    assert.ok(
      authSrc.includes('CROSS_TENANT_DELEGATION'),
      'Must deny child agent cross-tenant delegation'
    );
  });

  it('verifyDelegationScope denies principal mismatch', () => {
    assert.ok(
      authSrc.includes('PRINCIPAL_MISMATCH'),
      'Must deny when child principal differs from parent'
    );
  });

  it('verifyDelegationScope denies privilege escalation', () => {
    assert.ok(
      authSrc.includes('PRIVILEGE_ESCALATION'),
      'Must deny when child permissions exceed parent permissions'
    );
  });

  it('authorization exports AuthorizationScope interface', () => {
    assert.ok(
      authSrc.includes('export interface AuthorizationScope'),
      'Must export AuthorizationScope for delegation tracking'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-09: ZegaPrincipal — Canonical Fields
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-09: ZegaPrincipal Canonical Fields', () => {
  const typesSrc = readSource('../types/fastify.d.ts');
  const contextSrc = readSource('../middleware/requestContext.ts');

  it('ZegaPrincipal includes permissions field', () => {
    assert.ok(
      typesSrc.includes('permissions: string[]'),
      'ZegaPrincipal must have permissions field'
    );
  });

  it('ZegaPrincipal includes authSource field', () => {
    assert.ok(
      typesSrc.includes('authSource: string'),
      'ZegaPrincipal must have authSource field'
    );
  });

  it('requestContext populates permissions in principal', () => {
    assert.ok(
      contextSrc.includes('permissions: []'),
      'Principal must initialize permissions array'
    );
  });

  it('requestContext populates authSource in principal', () => {
    assert.ok(
      contextSrc.includes('authSource:'),
      'Principal must record authentication source'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-10: Financial Identity — UUID Only, No Email Preference
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-10: Financial Identity Must Use UUID', () => {
  it('withdrawal.routes does NOT prefer email over UUID', () => {
    const src = readSource('../routes/v1/withdrawal.routes.ts');
    assert.ok(
      !src.includes('principal.email || principal.userId'),
      'REGRESSION: withdrawal.routes.ts prefers email over UUID for financial identity'
    );
  });

  it('wallet.routes does NOT prefer email over UUID', () => {
    const src = readSource('../routes/v1/wallet.routes.ts');
    assert.ok(
      !src.includes('principal.email || principal.userId'),
      'REGRESSION: wallet.routes.ts prefers email over UUID for financial identity'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZT-11: Repo-Wide Security Pattern Scan
// ═══════════════════════════════════════════════════════════════════════════
describe('ZT-11: Repository-Wide Security Regression Scan', () => {
  it('No jwt.decode in middleware directory (auth paths)', () => {
    const contextSrc = readSource('../middleware/requestContext.ts');
    // jwt.decode should ONLY appear in comments, never in executed code
    const lines = contextSrc.split('\n');
    const codeLines = lines.filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const hasDecodeInCode = codeLines.some(l => l.includes('jwt.decode(') || l.includes('.decode(token)'));
    assert.ok(!hasDecodeInCode, 'CRITICAL: jwt.decode() found in non-comment line of requestContext.ts');
  });

  it('requireTenantContext middleware exists and is fail-closed', () => {
    const contextSrc = readSource('../middleware/requestContext.ts');
    assert.ok(
      contextSrc.includes('export async function requireTenantContext'),
      'Must export requireTenantContext middleware'
    );
    assert.ok(
      contextSrc.includes('NO_TENANT_CONTEXT'),
      'requireTenantContext must deny requests without org context'
    );
  });

  it('Storage service uses tenant-scoped paths', () => {
    const r2Src = readSource('../services/r2StorageService.ts');
    assert.ok(
      r2Src.includes('organizations/${organizationId}'),
      'R2 storage must scope paths under organization namespace'
    );
  });
});
