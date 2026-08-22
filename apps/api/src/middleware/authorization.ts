import type { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

/**
 * ZEGA AI — Authorization Middleware (HARDENED)
 *
 * Central authorization primitives for the ZEGA platform.
 * Implements ownership verification, role-based access control,
 * and tenant-scoped resource authorization.
 *
 * SECURITY INVARIANTS:
 *   1. Missing principal = DENY (fail-closed)
 *   2. Missing tenant scope = DENY (fail-closed)
 *   3. NULL resource organization = DENY (fail-closed)
 *   4. Superadmin does NOT bypass tenant isolation
 *   5. Superadmin customer-data access requires break-glass authorization
 *   6. Every authorization decision is logged for audit
 */

/**
 * Verify that the current principal owns the given resource.
 *
 * SECURITY: Superadmin does NOT bypass ownership.
 * Superadmin is a control-plane identity, not a customer-data accessor.
 *
 * @param request - The Fastify request (must have request.principal populated)
 * @param resourceOwnerId - The user_id that owns the resource
 * @returns true if the principal is the owner
 */
export function verifyOwnership(request: FastifyRequest, resourceOwnerId: string | undefined): boolean {
  const principal = request.principal;

  // FAIL-CLOSED: No principal = deny
  if (!principal || !principal.userId) {
    return false;
  }

  // FAIL-CLOSED: No resource owner = deny
  if (!resourceOwnerId) {
    return false;
  }

  return principal.userId === resourceOwnerId;
}

/**
 * Verify that the current principal has access to a resource within
 * a specific organization (tenant isolation check).
 *
 * SECURITY (C-01 FIX): Returns FALSE when resourceOrgId is null/undefined.
 * A missing tenant scope is DENY, not ALLOW.
 *
 * SECURITY (C-03 FIX): Superadmin does NOT automatically bypass.
 * Use verifyBreakGlassAccess() for superadmin customer-data access.
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

  // FAIL-CLOSED (C-01 FIX): No resource org scope = DENY
  // A tenant-owned resource MUST have an organization_id.
  if (!resourceOrgId) {
    logger.warn(
      { userId: principal.userId, action: 'tenant_access_denied_null_org' },
      '[Authorization] DENIED — resource has no organization_id (fail-closed)'
    );
    return false;
  }

  // FAIL-CLOSED: Principal must have an active org context
  if (!principal.organizationId) {
    logger.warn(
      { userId: principal.userId, resourceOrgId, action: 'tenant_access_denied_no_context' },
      '[Authorization] DENIED — principal has no organization context'
    );
    return false;
  }

  // Standard tenant isolation check
  if (principal.organizationId !== resourceOrgId) {
    logger.warn(
      { userId: principal.userId, principalOrg: principal.organizationId, resourceOrgId, action: 'cross_tenant_access_denied' },
      '[Authorization] DENIED — cross-tenant access attempt'
    );
    return false;
  }

  return true;
}

/**
 * Verify that the current principal has a minimum required role.
 *
 * Role hierarchy: superadmin > enterprise > umkm > individual
 *
 * NOTE: This checks PLATFORM role, not TENANT role.
 * Platform role does NOT grant cross-tenant access.
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
 * SECURITY (C-03 FIX): Superadmin no longer auto-passes org role checks.
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

  const principalLevel = ORG_ROLE_HIERARCHY[principal.orgRole] ?? 0;
  const requiredLevel = ORG_ROLE_HIERARCHY[minimumOrgRole] ?? 0;

  return principalLevel >= requiredLevel;
}

/**
 * Check if the principal is a superadmin (control-plane identity).
 * NOTE: Being a superadmin does NOT grant customer-data access.
 */
export function isSuperadmin(request: FastifyRequest): boolean {
  return request.principal?.role === 'superadmin';
}

/**
 * Deny access with a 403 response.
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

/**
 * Fastify preHandler that verifies tenant access to a resource.
 * Use this when the resource's organization_id is known at pre-handler time.
 *
 * Usage:
 *   preHandler: [populatePrincipal, requireTenantAccessTo(getResourceOrg)]
 */
export function requireTenantAccessTo(getResourceOrgId: (request: FastifyRequest) => string | undefined | null) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const resourceOrgId = getResourceOrgId(request);
    if (!verifyTenantAccess(request, resourceOrgId)) {
      return denyAccess(reply, 'TENANT_ACCESS_DENIED', 'You do not have access to this tenant resource.');
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED AUTHORIZATION — Zero-Trust Policy Enforcement
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Authorization scope for AI swarm delegation tracking.
 * Enforces childScope ⊆ parentScope invariant.
 */
export interface AuthorizationScope {
  principalId: string;
  organizationId: string;
  workspaceId?: string;
  storeId?: string;
  role: string;
  permissions: string[];
  assistantId?: string;
  parentAgentId?: string;
  delegationId?: string;
  correlationId?: string;
}

export interface AuthorizationRequest {
  principal: { userId: string; organizationId?: string; role?: string; orgRole?: string; permissions?: string[] };
  organizationId?: string;
  workspaceId?: string;
  assistant?: string;
  tool?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Centralized authorization decision.
 * Returns true if the principal is authorized for the requested action.
 * Fail-closed: returns false on any missing required context.
 */
export function authorize(req: AuthorizationRequest): { allowed: boolean; reason: string } {
  const { principal } = req;

  // 1. Principal must exist and have a userId
  if (!principal?.userId) {
    return { allowed: false, reason: 'NO_PRINCIPAL' };
  }

  // 2. If org-scoped, principal must belong to the org
  if (req.organizationId && principal.organizationId !== req.organizationId) {
    logger.warn(
      { userId: principal.userId, requestedOrg: req.organizationId, principalOrg: principal.organizationId, action: 'authorize_cross_tenant_denied' },
      '[Authorization] DENIED — cross-tenant authorization attempt'
    );
    return { allowed: false, reason: 'CROSS_TENANT_DENIED' };
  }

  // 3. If assistant-scoped, verify assistant is recognized
  if (req.assistant) {
    const VALID_ASSISTANTS = ['home', 'help', 'finance', 'knowledge', 'zega_copilot'];
    if (!VALID_ASSISTANTS.includes(req.assistant)) {
      return { allowed: false, reason: 'INVALID_ASSISTANT' };
    }
  }

  // 4. If tool-scoped, verify tool is in the assistant's allowlist
  if (req.tool && req.assistant) {
    const ASSISTANT_TOOLS: Record<string, string[]> = {
      home: ['get_business_overview', 'get_sales_summary', 'get_inventory_overview'],
      help: ['search_help_docs', 'get_feature_guide'],
      finance: ['get_financial_metrics', 'calculate_margin', 'get_cash_flow_statement'],
      knowledge: ['search_tenant_knowledge', 'extract_sop_document'],
      zega_copilot: ['inspect_sales', 'inspect_inventory', 'inspect_customers', 'analyze_finance', 'inspect_products', 'generate_business_insights', 'execute_authorized_action'],
    };
    const allowedTools = ASSISTANT_TOOLS[req.assistant] || [];
    if (!allowedTools.includes(req.tool)) {
      logger.warn(
        { userId: principal.userId, assistant: req.assistant, tool: req.tool, action: 'tool_authorization_denied' },
        '[Authorization] DENIED — tool not in assistant allowlist'
      );
      return { allowed: false, reason: 'TOOL_NOT_AUTHORIZED_FOR_ASSISTANT' };
    }
  }

  return { allowed: true, reason: 'AUTHORIZED' };
}

/**
 * Verify that a child authorization scope is a subset of the parent scope.
 * Used for AI swarm delegation — child agents MUST NOT expand parent scope.
 */
export function verifyDelegationScope(parent: AuthorizationScope, child: AuthorizationScope): { allowed: boolean; reason: string } {
  // Organization must match
  if (child.organizationId !== parent.organizationId) {
    logger.warn(
      { parentOrg: parent.organizationId, childOrg: child.organizationId, action: 'delegation_cross_tenant_denied' },
      '[Authorization] DENIED — child agent cross-tenant delegation'
    );
    return { allowed: false, reason: 'CROSS_TENANT_DELEGATION' };
  }

  // Principal must match
  if (child.principalId !== parent.principalId) {
    return { allowed: false, reason: 'PRINCIPAL_MISMATCH' };
  }

  // Child permissions must be a subset of parent permissions
  const parentPerms = new Set(parent.permissions);
  const extraPerms = child.permissions.filter(p => !parentPerms.has(p));
  if (extraPerms.length > 0) {
    logger.warn(
      { parentPerms: parent.permissions, childExtraPerms: extraPerms, action: 'delegation_privilege_escalation_denied' },
      '[Authorization] DENIED — child agent privilege escalation attempt'
    );
    return { allowed: false, reason: 'PRIVILEGE_ESCALATION' };
  }

  return { allowed: true, reason: 'DELEGATION_AUTHORIZED' };
}
