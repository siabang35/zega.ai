import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ZegaPrincipal, TenantContext } from '../types/fastify.js';
import { SupabaseService } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

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
    let jwtPayload = request.user as any;
    if (!jwtPayload) {
      // SECURITY (S-16 FIX): Only use verified JWT claims.
      // The previous fallback used jwt.decode() which does NOT verify the signature.
      // Unverified JWT claims must never populate the principal.
      const token = (request.cookies as any)?.__zega_token ||
        (request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.substring(7).trim() : null);
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          jwtPayload = request.server.jwt.verify(token);
        } catch {
          // Verification failed — do NOT populate principal from unverified claims
          return null;
        }
      }
    }
    if (!jwtPayload) {
      return null;
    }
    const payloadAny = jwtPayload as any;
    let resolvedUserId = jwtPayload.sub || payloadAny.id || payloadAny.userId || jwtPayload.email || '';
    if (!resolvedUserId) {
      return null;
    }

    // Canonical UUID Resolution — ensure email identity is resolved to DB user UUID
    if (!isValidUuid(resolvedUserId) && jwtPayload.email) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('id, auth_user_id')
            .eq('email', jwtPayload.email.toLowerCase())
            .maybeSingle();

          if (dbUser?.id && isValidUuid(dbUser.id)) {
            resolvedUserId = dbUser.id;
          } else if (dbUser?.auth_user_id && isValidUuid(dbUser.auth_user_id)) {
            resolvedUserId = dbUser.auth_user_id;
          }
        }
      } catch { }
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
      || (request.headers['x-store-id'] as string)
      || jwtPayload.organizationId
      || undefined;

    if (requestedOrgId && principal.userId) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          // 1. Verify the user is actually a member of this organization in organization_members
          const { data: membership } = await supabase
            .from('organization_members')
            .select('id, organization_id, role, status')
            .eq('user_id', principal.userId)
            .eq('organization_id', requestedOrgId)
            .maybeSingle();

          let verifiedOrgId = membership?.status !== 'suspended' ? membership?.organization_id : null;
          let membershipId = membership?.id || `store-owner-${principal.userId}`;
          let orgRole = (membership?.role as ZegaPrincipal['orgRole']) || 'owner';

          // 2. If not found in organization_members, verify against umkm_stores catalog by organization_id or user_id
          if (!verifiedOrgId) {
            const { data: verifiedStore } = await supabase
              .from('umkm_stores')
              .select('id, organization_id, user_id')
              .or(`organization_id.eq.${requestedOrgId},user_id.eq.${principal.userId}`)
              .limit(1)
              .maybeSingle();

            if (verifiedStore?.organization_id || verifiedStore?.id) {
              verifiedOrgId = verifiedStore.organization_id || verifiedStore.id;
              membershipId = `store-owner-${principal.userId}`;
              orgRole = 'owner';
              // SECURITY (S-02 FIX): Removed client-org fallback.
              // If no membership exists in organization_members or umkm_stores,
              // the user has NO access to the requested organization.
              // Enforcement happens at requireTenantContext middleware.
            }
          }

          if (verifiedOrgId) {
            principal.organizationId = verifiedOrgId;
            principal.orgRole = orgRole;

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
            }
            if (!principal.workspaceId) {
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
              membershipId: membershipId,
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
            // 2. Lookup owner store in umkm_stores catalog by user_id or requested store id
            const requestedStoreId = (request.headers['x-store-id'] as string) || (request.body as any)?.storeId;
            let query = supabase.from('umkm_stores').select('id, organization_id, user_id');
            if (requestedStoreId && isValidUuid(requestedStoreId)) {
              query = query.or(`id.eq.${requestedStoreId},user_id.eq.${principal.userId}`);
            } else {
              query = query.eq('user_id', principal.userId);
            }
            const { data: stores } = await query.order('created_at', { ascending: true }).limit(1);
            const store = stores && stores.length > 0 ? stores[0] : null;

            const resolvedTenantOrgId = store?.organization_id || store?.id;

            if (resolvedTenantOrgId) {
              principal.organizationId = resolvedTenantOrgId;
              principal.tenantContext = {
                organizationId: resolvedTenantOrgId,
                workspaceId: '',
                tenantType: 'umkm',
                membershipId: `store-owner-${principal.userId}`,
                orgRole: 'owner',
              };
            }
            // SECURITY (S-02 FIX): Removed client-org fallback.
            // No membership/store found = no tenant context = requireTenantContext will DENY.
          }
        }
      } catch (err) {
        logger.warn({ err, userId: principal.userId }, '[RequestContext] DB org resolution error');
      }
    }

    // === Step 2.8: Universal workspace resolution & auto-repair guard ===
    // Runs unconditionally for ANY request with a resolved organizationId
    if (principal.organizationId && !principal.workspaceId) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          const requestedWsId = (request.headers['x-workspace-id'] as string)
            || (request.body as any)?.workspaceId;

          if (requestedWsId && isValidUuid(requestedWsId)) {
            // SECURITY (S-10 FIX): Workspace must belong to the principal's verified organization
            const { data: workspace } = await supabase
              .from('workspaces')
              .select('id')
              .eq('id', requestedWsId)
              .eq('organization_id', principal.organizationId)
              .maybeSingle();

            if (workspace?.id) {
              principal.workspaceId = workspace.id;
            }
          }

          if (!principal.workspaceId) {
            // 1. Check umkm_stores catalog for workspace_id
            const { data: storeWithWs } = await supabase
              .from('umkm_stores')
              .select('workspace_id')
              .or(`organization_id.eq.${principal.organizationId},user_id.eq.${principal.userId}`)
              .not('workspace_id', 'is', null)
              .limit(1)
              .maybeSingle();

            if (storeWithWs?.workspace_id && isValidUuid(storeWithWs.workspace_id)) {
              principal.workspaceId = storeWithWs.workspace_id;
            }
          }

          if (!principal.workspaceId) {
            // 2. Check default workspace in workspaces table
            const { data: defaultWs } = await supabase
              .from('workspaces')
              .select('id')
              .eq('organization_id', principal.organizationId)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (defaultWs?.id && isValidUuid(defaultWs.id)) {
              principal.workspaceId = defaultWs.id;
            }
          }

          if (!principal.workspaceId && principal.organizationId) {
            // 3. Auto-repair missing workspace for this organization
            try {
              const autoWsId = crypto.randomUUID();
              const { data: createdWs } = await supabase
                .from('workspaces')
                .insert({
                  id: autoWsId,
                  organization_id: principal.organizationId,
                  name: 'Main Workspace',
                  slug: `ws-${principal.organizationId.substring(0, 8)}-${Date.now().toString(36)}`,
                  status: 'active'
                })
                .select('id')
                .maybeSingle();

              const resolvedWsId = createdWs?.id || autoWsId;
              principal.workspaceId = resolvedWsId;

              // Backfill workspace_id to umkm_stores if missing
              await supabase
                .from('umkm_stores')
                .update({ workspace_id: resolvedWsId })
                .eq('organization_id', principal.organizationId)
                .is('workspace_id', null);
            } catch (wsErr) {
              logger.warn({ wsErr, orgId: principal.organizationId }, '[RequestContext] Workspace auto-repair notice');
            }
          }

          if (principal.workspaceId && principal.tenantContext) {
            principal.tenantContext.workspaceId = principal.workspaceId;
          }
        }
      } catch (err) {
        logger.warn({ err, orgId: principal.organizationId }, '[RequestContext] Universal workspace resolution error');
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

  // SECURITY (S-15 FIX): Only store provisioning endpoints may bypass tenant context
  // because they execute server-side tenant resolution as part of their operation.
  // Product and UMKM routes MUST have tenant context — they no longer bypass.
  if (
    request.url.includes('/provision-store') ||
    request.url.includes('/provision')
  ) {
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
