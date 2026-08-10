import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ZegaPrincipal } from '../types/fastify.js';
import { SupabaseService } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

/**
 * ZEGA AI — Request Context Middleware
 *
 * Extracts the server-derived principal from the verified JWT and
 * populates `request.principal` with the canonical identity, role,
 * and tenant context for downstream authorization decisions.
 *
 * Design Principles:
 *   - Section 0.2 (Zero Trust): JWT claims are verified, then enriched
 *     with server-side DB lookup where necessary.
 *   - Section 0.3 (Server Authority): role and organizationId are
 *     derived from the database, never from client input.
 *   - Section 11 (Tenant Context Propagation): org_id flows from
 *     JWT → request.principal → service queries → DB filters.
 *
 * Usage:
 *   Register as a Fastify plugin or call extractPrincipal() in a
 *   preHandler hook after app.authenticate.
 */
export async function extractPrincipal(request: FastifyRequest): Promise<ZegaPrincipal | null> {
  try {
    const jwtPayload = request.user;
    if (!jwtPayload || !jwtPayload.sub) {
      return null;
    }

    const principal: ZegaPrincipal = {
      userId: jwtPayload.sub,
      email: jwtPayload.email || '',
      role: (jwtPayload.role as ZegaPrincipal['role']) || 'individual',
      organizationId: jwtPayload.organizationId || undefined,
      orgRole: (jwtPayload.orgRole as ZegaPrincipal['orgRole']) || undefined,
    };

    // If JWT doesn't carry role/org, attempt DB enrichment
    if (!jwtPayload.role || !jwtPayload.organizationId) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase && principal.userId) {
          // Fetch profile for role
          if (!jwtPayload.role) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', principal.userId)
              .maybeSingle();
            if (profile?.role) {
              principal.role = profile.role as ZegaPrincipal['role'];
            }
          }

          // Fetch primary organization membership
          if (!jwtPayload.organizationId) {
            const { data: membership } = await supabase
              .from('organization_members')
              .select('organization_id, role')
              .eq('user_id', principal.userId)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();
            if (membership) {
              principal.organizationId = membership.organization_id;
              principal.orgRole = membership.role as ZegaPrincipal['orgRole'];
            }
          }
        }
      } catch (err) {
        // DB enrichment failure is non-fatal — principal still has JWT-level identity
        logger.warn({ err, userId: principal.userId }, '[RequestContext] DB enrichment failed, using JWT-only principal');
      }
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
 *
 * Usage in routes:
 *   app.get('/endpoint', {
 *     onRequest: [app.authenticate],
 *     preHandler: [populatePrincipal],
 *   }, handler);
 */
export async function populatePrincipal(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const principal = await extractPrincipal(request);
  if (principal) {
    request.principal = principal;
  }
}
