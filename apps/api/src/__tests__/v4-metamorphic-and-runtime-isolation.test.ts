import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyTenantAccess, verifyOwnership, isSuperadmin } from '../middleware/authorization.js';
import { validateBreakGlassSession } from '../middleware/breakGlass.js';

describe('ZEGA.AI — Constitutional Multi-Tenant Isolation v4.0', () => {
  const orgA = '11111111-1111-1111-1111-111111111111';
  const orgB = '22222222-2222-2222-2222-222222222222';
  const enterpriseOrg = '33333333-3333-3333-3333-333333333333';

  it('INV-01: UMKM Org A access to Org A resource -> ALLOW', () => {
    const mockRequest = {
      principal: { userId: 'user-1', organizationId: orgA, role: 'umkm' },
    } as any;
    assert.equal(verifyTenantAccess(mockRequest, orgA), true);
  });

  it('INV-02: UMKM Org A access to UMKM Org B resource -> DENY', () => {
    const mockRequest = {
      principal: { userId: 'user-1', organizationId: orgA, role: 'umkm' },
    } as any;
    assert.equal(verifyTenantAccess(mockRequest, orgB), false);
  });

  it('INV-03: UMKM Org A access to Enterprise Org resource -> DENY', () => {
    const mockRequest = {
      principal: { userId: 'user-1', organizationId: orgA, role: 'umkm' },
    } as any;
    assert.equal(verifyTenantAccess(mockRequest, enterpriseOrg), false);
  });

  it('INV-04: Enterprise Org access to UMKM Org A resource -> DENY', () => {
    const mockRequest = {
      principal: { userId: 'ent-user', organizationId: enterpriseOrg, role: 'enterprise' },
    } as any;
    assert.equal(verifyTenantAccess(mockRequest, orgA), false);
  });

  it('INV-05: NULL resource organization_id -> FAIL CLOSED (DENY)', () => {
    const mockRequest = {
      principal: { userId: 'user-1', organizationId: orgA, role: 'umkm' },
    } as any;
    assert.equal(verifyTenantAccess(mockRequest, null), false);
    assert.equal(verifyTenantAccess(mockRequest, undefined), false);
  });

  it('INV-06: Superadmin customer data access without break-glass -> DENY', () => {
    const mockRequest = {
      principal: { userId: 'admin-1', role: 'superadmin' },
    } as any;
    assert.equal(verifyTenantAccess(mockRequest, orgA), false);
  });

  it('INV-07: Superadmin identity check -> isSuperadmin returns true', () => {
    const mockRequest = {
      principal: { userId: 'admin-1', role: 'superadmin' },
    } as any;
    assert.equal(isSuperadmin(mockRequest), true);
  });
});
