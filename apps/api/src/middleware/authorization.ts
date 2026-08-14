import type { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * ZEGA AI — Authorization Middleware
 *
 * Central authorization primitives for the ZEGA platform.
 * Implements ownership verification, role-based access control,
 * and tenant-scoped resource authorization.
 *
 * Design Principles:
 *   - Section 0.1 (Security is a System Property): Authorization is NOT
 *     just authentication. Every resource access must verify ownership.
 *   - Section 0.3 (Server Authority): The server determines who owns
 *     what. Client claims are never trusted.
 *   - Section 0.4 (Least Privilege): Users only access their own resources
 *     unless explicitly granted higher scope.
 *   - Section 0.5 (Fail Closed): Missing principal or ownership data = deny.
 *
 * IMPORTANT: These functions assume request.principal has been populated
 * by the populatePrincipal middleware. If principal is missing, access
 * is DENIED (fail-closed).
 */

/**
 * Verify that the current principal owns the given resource.
 *
 * @param request - The Fastify request (must have request.principal populated)
 * @param resourceOwnerId - The user_id that owns the resource
 * @returns true if the principal is the owner OR a superadmin
 */
export function verifyOwnership(request: FastifyRequest, resourceOwnerId: string | undefined): boolean {
  const principal = request.principal;

  // FAIL-CLOSED: No principal = deny
  if (!principal || !principal.userId) {
    return false;
  }

  // Superadmin bypasses ownership checks (but is still logged)
  if (principal.role === 'superadmin') {
    logger.info(
      { userId: principal.userId, resourceOwnerId, action: 'superadmin_override' },
      '[Authorization] Superadmin ownership override'
    );
    return true;
  }

  // Standard ownership check
  if (!resourceOwnerId) {
    return false; // Resource has no owner — deny by default
  }

  return principal.userId === resourceOwnerId;
}

/**
 * Verify that the current principal has access to a resource within
 * a specific organization (tenant isolation check).
 *
 * @param request - The Fastify request (must have request.principal populated)
 * @param resourceOrgId - The organization_id that owns the resource
 * @returns true if the principal belongs to the resource's organization
 */
export function verifyTenantAccess(request: FastifyRequest, resourceOrgId: string | undefined | null): boolean {
  const principal = request.principal;

  // FAIL-CLOSED: No principal = deny
  if (!principal || !principal.userId) {
    return false;
  }

  // Superadmin can access any tenant (logged for audit trail)
  if (principal.role === 'superadmin') {
    logger.info(
      { userId: principal.userId, resourceOrgId, action: 'superadmin_tenant_override' },
      '[Authorization] Superadmin cross-tenant access'
    );
    return true;
  }

  // Resource has no org scope — fall back to ownership check only
  if (!resourceOrgId) {
    return true; // Resource is user-scoped, not org-scoped
  }

  // Principal must belong to the resource's organization
  if (!principal.organizationId) {
    return false; // Principal has no org membership — deny
  }

  return principal.organizationId === resourceOrgId;
}

/**
 * Verify that the current principal has a minimum required role.
 *
 * Role hierarchy: superadmin > enterprise > umkm > individual
 *
 * @param request - The Fastify request (must have request.principal populated)
 * @param minimumRole - The minimum role required for this action
 * @returns true if the principal's role >= minimumRole
 */
const ROLE_HIERARCHY: Record<string, number> = {
  individual: 0,
  umkm: 1,
  enterprise: 2,
  superadmin: 3,
};

export function verifyMinimumRole(request: FastifyRequest, minimumRole: string): boolean {
  const principal = request.principal;

  // FAIL-CLOSED: No principal = deny
  if (!principal || !principal.role) {
    return false;
  }

  const principalLevel = ROLE_HIERARCHY[principal.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

  return principalLevel >= requiredLevel;
}

/**
 * Verify that the current principal has a minimum required org role
 * within their organization.
 *
 * Org role hierarchy: owner > admin > member > billing_contact
 *
 * @param request - The Fastify request (must have request.principal populated)
 * @param minimumOrgRole - The minimum org role required
 * @returns true if the principal's org role >= minimumOrgRole
 */
const ORG_ROLE_HIERARCHY: Record<string, number> = {
  billing_contact: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function verifyMinimumOrgRole(request: FastifyRequest, minimumOrgRole: string): boolean {
  const principal = request.principal;

  // FAIL-CLOSED: No principal or no org role = deny
  if (!principal || !principal.orgRole) {
    return false;
  }

  // Superadmin always passes org role checks
  if (principal.role === 'superadmin') {
    return true;
  }

  const principalLevel = ORG_ROLE_HIERARCHY[principal.orgRole] ?? 0;
  const requiredLevel = ORG_ROLE_HIERARCHY[minimumOrgRole] ?? 0;

  return principalLevel >= requiredLevel;
}

/**
 * Pre-built Fastify preHandler that denies access with a 403 response
 * when ownership verification fails.
 *
 * Usage: Call this inside route handlers AFTER populatePrincipal.
 *
 * Example:
 *   if (!verifyOwnership(request, resource.user_id)) {
 *     return denyAccess(reply, 'FORBIDDEN', 'You do not have access to this resource.');
 *   }
 */
export function denyAccess(
  reply: FastifyReply,
  code: string = 'FORBIDDEN',
  message: string = 'Access denied. You do not have permission to access this resource.'
) {
  return reply.status(403).send({
    success: false,
    error: { code, message, statusCode: 403 },
  });
}

/**
 * Create a Fastify preHandler that enforces a minimum platform role.
 *
 * Usage:
 *   app.get('/admin/users', {
 *     onRequest: [app.authenticate],
 *     preHandler: [populatePrincipal, requireRole('enterprise')],
 *   }, handler);
 */
export function requireRole(minimumRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!verifyMinimumRole(request, minimumRole)) {
      return denyAccess(reply, 'INSUFFICIENT_ROLE', `This action requires at least '${minimumRole}' role.`);
    }
  };
}

/**
 * Create a Fastify preHandler that enforces a minimum org role.
 */
export function requireOrgRole(minimumOrgRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!verifyMinimumOrgRole(request, minimumOrgRole)) {
      return denyAccess(reply, 'INSUFFICIENT_ORG_ROLE', `This action requires at least '${minimumOrgRole}' organization role.`);
    }
  };
}
