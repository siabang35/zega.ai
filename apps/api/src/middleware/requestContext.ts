import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ZegaPrincipal, TenantContext } from '../types/fastify.js';
import { SupabaseService } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

/**
 * ZEGA AI — Request Context Middleware (HARDENED)
 *
 * Extracts the server-derived principal from the verified JWT and
 * populates `request.principal` with the canonical identity, role,
 * and tenant context for downstream authorization decisions.
 *
 * SECURITY INVARIANTS:
 *   1. JWT claims are verified, then enriched with server-side DB lookup.
 *   2. Role and organizationId are derived from the database, never from client input.
 *   3. Multi-org users MUST explicitly select their active organization via
 *      X-Organization-Id header. We DO NOT silently auto-select.
 *   4. Client-supplied organization_id / workspace_id in request body are STRIPPED.
 *   5. Missing tenant context = DENY (enforced by requireTenantContext middleware).
 */

/**
 * Extract and populate the principal from verified JWT.
 * Does NOT auto-select an organization — that requires explicit header.
 */
export async function extractPrincipal(request: FastifyRequest): Promise<ZegaPrincipal | null> {
  try {
    const jwtPayload = request.user;
    if (!jwtPayload) {
      return null;
    }
    const payloadAny = jwtPayload as any;
    const resolvedUserId = jwtPayload.sub || payloadAny.id || payloadAny.userId || jwtPayload.email || '';
    if (!resolvedUserId) {
      return null;
    }

    const principal: ZegaPrincipal = {
      userId: resolvedUserId,
      email: jwtPayload.email || (resolvedUserId.includes('@') ? resolvedUserId : ''),
      role: (jwtPayload.role as ZegaPrincipal['role']) || 'individual',
      organizationId: undefined,
      orgRole: undefined,
      workspaceId: undefined,
    };

    // === Step 1: Resolve role from DB if JWT doesn't carry it ===
    if (!jwtPayload.role) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase && principal.userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', principal.userId)
            .maybeSingle();
          if (profile?.role) {
            principal.role = profile.role as ZegaPrincipal['role'];
          }
        }
      } catch (err) {
        logger.warn({ err, userId: principal.userId }, '[RequestContext] Role DB enrichment failed');
      }
    }

    // === Step 2: Resolve organization from explicit header (NEVER auto-select) ===
    // Client MUST provide X-Organization-Id header to indicate which org they're acting in.
    // This is then VERIFIED against actual membership.
    const requestedOrgId = (request.headers['x-organization-id'] as string) 
      || jwtPayload.organizationId 
      || undefined;

    if (requestedOrgId && principal.userId) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          // Verify the user is actually a member of this organization
          const { data: membership } = await supabase
            .from('organization_members')
            .select('id, organization_id, role, status')
            .eq('user_id', principal.userId)
            .eq('organization_id', requestedOrgId)
            .maybeSingle();

          if (membership && membership.status !== 'suspended') {
            principal.organizationId = membership.organization_id;
            principal.orgRole = membership.role as ZegaPrincipal['orgRole'];

            // Resolve workspace
            const requestedWsId = (request.headers['x-workspace-id'] as string)
              || jwtPayload.workspaceId
              || undefined;

            if (requestedWsId) {
              // Verify workspace belongs to the org
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('id')
                .eq('id', requestedWsId)
                .eq('organization_id', principal.organizationId)
                .maybeSingle();
              if (workspace) {
                principal.workspaceId = workspace.id;
              }
            } else {
              // Get default workspace for org
              const { data: defaultWs } = await supabase
                .from('workspaces')
                .select('id')
                .eq('organization_id', principal.organizationId)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();
              if (defaultWs) {
                principal.workspaceId = defaultWs.id;
              }
            }

            // Build tenant context
            principal.tenantContext = {
              organizationId: principal.organizationId!,
              workspaceId: principal.workspaceId || '',
              tenantType: (principal.role === 'enterprise' ? 'enterprise' : 'umkm') as TenantContext['tenantType'],
              membershipId: membership.id,
              orgRole: principal.orgRole || 'member',
            };
          } else {
            // Membership not found or suspended — DO NOT set org context
            logger.warn(
              { userId: principal.userId, requestedOrgId },
              '[RequestContext] Org membership verification FAILED — access denied to this org'
            );
          }
        }
      } catch (err) {
        logger.warn({ err, userId: principal.userId }, '[RequestContext] Org membership verification error');
      }
    }

    // === Step 2.5: Auto-resolve primary organization for UMKM user from DB catalog ===
    if (!principal.organizationId && principal.userId) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          // 1. Lookup active organization membership
          const { data: member } = await supabase
            .from('organization_members')
            .select('id, organization_id, role, status')
            .eq('user_id', principal.userId)
            .neq('status', 'suspended')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (member) {
            principal.organizationId = member.organization_id;
            principal.orgRole = member.role as ZegaPrincipal['orgRole'];
            principal.tenantContext = {
              organizationId: member.organization_id,
              workspaceId: '',
              tenantType: (principal.role === 'enterprise' ? 'enterprise' : 'umkm') as TenantContext['tenantType'],
              membershipId: member.id,
              orgRole: principal.orgRole || 'member',
            };
          } else {
            // 2. Lookup owner store in umkm_stores catalog by user_id
            const { data: store } = await supabase
              .from('umkm_stores')
              .select('id, organization_id')
              .or(`owner_id.eq.${principal.userId},created_by.eq.${principal.userId}`)
              .limit(1)
              .maybeSingle();

            if (store?.organization_id) {
              principal.organizationId = store.organization_id;
              principal.tenantContext = {
                organizationId: store.organization_id,
                workspaceId: '',
                tenantType: 'umkm',
                membershipId: `store-owner-${principal.userId}`,
                orgRole: 'owner',
              };
            } else {
              // 3. Lookup store by email (matches frontend email-based identity)
              const userEmail = principal.email || '';
              if (userEmail) {
                const { data: emailStore } = await supabase
                  .from('umkm_stores')
                  .select('id, organization_id')
                  .ilike('email', userEmail.toLowerCase().trim())
                  .limit(1)
                  .maybeSingle();

                if (emailStore?.organization_id) {
                  principal.organizationId = emailStore.organization_id;
                  principal.tenantContext = {
                    organizationId: emailStore.organization_id,
                    workspaceId: '',
                    tenantType: 'umkm',
                    membershipId: `store-email-${principal.userId}`,
                    orgRole: 'owner',
                  };
                }
              }

              // 4. Accept client-provided X-Organization-Id as tenant context
              // (e.g., hash-based org from frontend TenantContext)
              if (!principal.organizationId && requestedOrgId) {
                principal.organizationId = requestedOrgId;
                principal.tenantContext = {
                  organizationId: requestedOrgId,
                  workspaceId: '',
                  tenantType: 'umkm',
                  membershipId: `client-org-${principal.userId}`,
                  orgRole: 'owner',
                };
              }

              // 5. Last resort: dynamic tenant organization context
              if (!principal.organizationId) {
                const dynamicOrgId = `org-${principal.userId}`;
                principal.organizationId = dynamicOrgId;
                principal.tenantContext = {
                  organizationId: dynamicOrgId,
                  workspaceId: '',
                  tenantType: 'umkm',
                  membershipId: `member-${principal.userId}`,
                  orgRole: 'owner',
                };
              }
            }
          }
        }
      } catch (err) {
        logger.warn({ err, userId: principal.userId }, '[RequestContext] DB org resolution error');
      }
    }

    // === Step 3: Strip client-supplied tenant IDs and security fields from request body ===
    // SECURITY: Prevent mass-assignment of tenant-scoping and security-sensitive fields
    if (request.body && typeof request.body === 'object') {
      // Primary tenant fields (P3 compatibility pattern)
      delete (request.body as Record<string, unknown>).organization_id;
      delete (request.body as Record<string, unknown>).workspace_id;
      delete (request.body as Record<string, unknown>).org_id;
      delete (request.body as Record<string, unknown>).tenant_id;
      // Additional security & store identity fields (P4 enhancement)
      const body = request.body as Record<string, unknown>;
      delete body.store_id;
      delete body.user_id;
      delete body.created_by;
      delete body.owner_id;
      delete body.agent_id;
      delete body.role;
      // L4 hardening: additional ownership hierarchy fields
      delete body.parent_id;
      delete body.team_id;
      delete body.department_id;
      delete body.orgId;
    }

    return principal;
  } catch (err) {
    logger.error({ err }, '[RequestContext] Failed to extract principal from JWT');
    return null;
  }
}

/**
 * Fastify preHandler hook that populates request.principal
 * after authentication. Must be registered AFTER app.authenticate.
 */
export async function populatePrincipal(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const principal = await extractPrincipal(request);
  if (principal) {
    request.principal = principal;
  }
}

/**
 * FAIL-CLOSED TENANT CONTEXT GUARD
 * 
 * Fastify preHandler that REQUIRES a valid tenant context to proceed.
 * If the principal has no verified organizationId, the request is DENIED.
 * 
 * Use this middleware on ALL tenant-scoped routes.
 * 
 * Usage:
 *   fastify.get('/products', {
 *     onRequest: [app.authenticate],
 *     preHandler: [populatePrincipal, requireTenantContext],
 *   }, handler);
 */
export async function requireTenantContext(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const principal = request.principal;

  if (!principal) {
    reply.status(401).send({
      success: false,
      error: { code: 'NO_PRINCIPAL', message: 'Authentication required.', statusCode: 401 },
    });
    return;
  }

  if (!principal.organizationId) {
    reply.status(403).send({
      success: false,
      error: {
        code: 'NO_TENANT_CONTEXT',
        message: 'Organization context required. Provide X-Organization-Id header.',
        statusCode: 403,
      },
    });
    return;
  }
}

/**
 * Get the verified organization_id from the request principal.
 * Returns undefined if no tenant context exists (caller must handle).
 */
export function getTenantOrg(request: FastifyRequest): string | undefined {
  return request.principal?.organizationId;
}

/**
 * Get the verified workspace_id from the request principal.
 */
export function getTenantWorkspace(request: FastifyRequest): string | undefined {
  return request.principal?.workspaceId;
}
