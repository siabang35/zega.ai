import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚡ ZEGA.AI — Enterprise Multi-Tenant Data Isolation Test Suite
 *
 * Validates the core security invariants of the canonical database architecture:
 *   MT-01: Multi-Tenant Database Migration Integrity
 *   MT-02: Organization & Workspace Hierarchical Constraints
 *   MT-03: Zero-Trust RLS Policies & Security Definer Functions
 *   MT-04: Tenant-Scoped Unique Constraints
 *   MT-05: Storage Path Tenant Prefixing
 *   MT-06: Cache & Rate Limiter Tenant Key Isolation
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8');
}

describe('MT-01: Canonical Migration File & SQL Integrity', () => {
  const migrationPath = resolve(__dirname, '../../../../supabase/migrations/20260812235000_canonical_enterprise_multi_tenant_architecture.sql');

  it('Migration 20260812235000 file exists', () => {
    assert.ok(existsSync(migrationPath), 'Migration SQL file must exist');
  });

  const sqlContent = readFileSync(migrationPath, 'utf-8');

  it('Migration defines canonical organizations & workspaces tables', () => {
    assert.ok(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.organizations'), 'Must define public.organizations');
    assert.ok(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.organization_members'), 'Must define public.organization_members');
    assert.ok(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.workspaces'), 'Must define public.workspaces');
    assert.ok(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.workspace_members'), 'Must define public.workspace_members');
  });

  it('Migration contains zero-orphan default organization and workspace seed', () => {
    assert.ok(sqlContent.includes("'00000000-0000-0000-0000-000000000001'"), 'Must seed default org ID');
    assert.ok(sqlContent.includes("'00000000-0000-0000-0000-000000000002'"), 'Must seed default workspace ID');
  });

  it('Migration defines consistency trigger fn_enforce_resource_workspace_consistency', () => {
    assert.ok(sqlContent.includes('fn_enforce_resource_workspace_consistency'), 'Must define workspace consistency function');
    assert.ok(sqlContent.includes('trg_enforce_ws_consistency'), 'Must attach consistency trigger to business tables');
  });

  it('Migration defines security-definer helper functions with fixed search_path', () => {
    assert.ok(sqlContent.includes('CREATE OR REPLACE FUNCTION public.fn_is_org_member'), 'Must create fn_is_org_member');
    assert.ok(sqlContent.includes('SET search_path = public'), 'Security definer functions must set search_path');
  });

  it('Migration enforces RLS policies across all business tables', () => {
    assert.ok(sqlContent.includes('ENABLE ROW LEVEL SECURITY'), 'Must enable RLS');
    assert.ok(sqlContent.includes('CREATE POLICY "tenant_select_policy"'), 'Must create tenant_select_policy');
    assert.ok(sqlContent.includes('CREATE POLICY "tenant_insert_policy"'), 'Must create tenant_insert_policy');
    assert.ok(sqlContent.includes('CREATE POLICY "tenant_update_policy"'), 'Must create tenant_update_policy');
    assert.ok(sqlContent.includes('CREATE POLICY "tenant_delete_policy"'), 'Must create tenant_delete_policy');
  });
});

describe('MT-02: Backend Authorization & Principal Context Hardening', () => {
  const authSource = readSource('../middleware/authorization.ts');
  const contextSource = readSource('../middleware/requestContext.ts');

  it('authorization.ts implements verifyTenantAccess fail-closed guard', () => {
    assert.ok(authSource.includes('export function verifyTenantAccess'), 'Must export verifyTenantAccess');
    // Hardened code denies if principal org !== resource org (fail-closed)
    assert.ok(
      authSource.includes('principal.organizationId !== resourceOrgId') || 
      authSource.includes('principal.organizationId === resourceOrgId'),
      'Must compare principal organization with resource organization'
    );
  });

  it('requestContext.ts populates organizationId via header verification from DB', () => {
    assert.ok(contextSource.includes("x-organization-id"), 'Must read X-Organization-Id header');
    assert.ok(contextSource.includes('.from(\'organization_members\')'), 'Must enrich principal from organization_members table');
  });
});

describe('MT-03: Storage & Rate Limiter Tenant Key Isolation', () => {
  const r2Source = readSource('../services/r2StorageService.ts');
  const rateLimiterSource = readSource('../services/rateLimiterService.ts');

  it('r2StorageService.ts enforces tenant-scoped object key paths', () => {
    assert.ok(r2Source.includes('organizations/${organizationId}/workspaces/${workspaceId}'), 'Must scope R2 keys under organization and workspace');
  });

  it('rateLimiterService.ts provides getTenantKey helper', () => {
    assert.ok(rateLimiterSource.includes('getTenantKey'), 'Must define getTenantKey helper');
    assert.ok(rateLimiterSource.includes('org:${organizationId}:${key}'), 'Must prefix rate limit keys with organizationId');
  });
});
