import type { FastifyRequest, FastifyReply } from 'fastify';
import { SupabaseService } from '../services/supabaseService.js';
import { logger } from '../utils/logger.js';

/**
 * ZEGA AI — Break-Glass Access Middleware
 *
 * Implements explicit, time-limited, audited access for ZEGA Platform
 * Superadmin/Dev to inspect customer tenant data for support/debugging.
 *
 * SECURITY INVARIANTS:
 *   1. Break-glass access is DENY BY DEFAULT
 *   2. Requires explicit request with reason and target tenant
 *   3. Short-lived session (max 30 min)
 *   4. Complete audit trail
 *   5. Never silently activated
 */

/** Duration limits for break-glass sessions */
const MAX_BREAK_GLASS_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_BREAK_GLASS_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Request break-glass access to a customer tenant.
 * This creates a time-limited access session and logs the request.
 *
 * Should only be callable from the control-plane admin API.
 */
export async function requestBreakGlassAccess(
  adminUserId: string,
  targetOrganizationId: string,
  reason: string,
  ticketRef: string,
  durationMs: number = DEFAULT_BREAK_GLASS_DURATION_MS,
  ipAddress: string = '127.0.0.1'
): Promise<{ granted: boolean; sessionId?: string; expiresAt?: string; error?: string }> {
  // Validate duration
  if (durationMs > MAX_BREAK_GLASS_DURATION_MS) {
    return { granted: false, error: `Max duration is ${MAX_BREAK_GLASS_DURATION_MS / 60000} minutes` };
  }

  if (!reason || reason.trim().length < 10) {
    return { granted: false, error: 'Reason must be at least 10 characters' };
  }

  if (!ticketRef || ticketRef.trim().length < 3) {
    return { granted: false, error: 'Ticket reference is required' };
  }

  const supabase = SupabaseService.getClient();
  if (!supabase) {
    return { granted: false, error: 'Database unavailable' };
  }

  try {
    // Verify admin is actually a superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUserId)
      .maybeSingle();

    if (!profile || profile.role !== 'superadmin') {
      logger.warn(
        { adminUserId, targetOrganizationId, action: 'break_glass_denied_not_superadmin' },
        '[BreakGlass] DENIED — requester is not superadmin'
      );
      return { granted: false, error: 'Only superadmin can request break-glass access' };
    }

    // Verify target org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', targetOrganizationId)
      .maybeSingle();

    if (!org) {
      return { granted: false, error: 'Target organization not found' };
    }

    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    // Record break-glass session
    const { data: session, error } = await supabase
      .from('platform_break_glass_access_logs')
      .insert([{
        superadmin_user_id: adminUserId,
        target_organization_id: targetOrganizationId,
        reason: reason.trim(),
        session_scope: `read_only:${ticketRef}`,
        expires_at: expiresAt,
      }])
      .select()
      .single();

    if (error) {
      logger.error({ error }, '[BreakGlass] Failed to create break-glass session');
      return { granted: false, error: 'Failed to create session' };
    }

    logger.info(
      {
        sessionId: session?.id,
        adminUserId,
        targetOrganizationId,
        orgName: org.name,
        reason: reason.trim(),
        ticketRef,
        expiresAt,
        ipAddress,
        action: 'break_glass_granted',
      },
      '[BreakGlass] GRANTED — break-glass access session created'
    );

    return {
      granted: true,
      sessionId: session?.id,
      expiresAt,
    };
  } catch (err) {
    logger.error({ err, adminUserId, targetOrganizationId }, '[BreakGlass] Error creating session');
    return { granted: false, error: 'Internal error' };
  }
}

/**
 * Validate an active break-glass session for a superadmin.
 * Returns the target organization_id if a valid session exists.
 */
export async function validateBreakGlassSession(
  adminUserId: string,
  targetOrganizationId: string
): Promise<{ valid: boolean; sessionId?: string }> {
  const supabase = SupabaseService.getClient();
  if (!supabase) {
    return { valid: false };
  }

  try {
    const { data: session } = await supabase
      .from('platform_break_glass_access_logs')
      .select('id, expires_at')
      .eq('superadmin_user_id', adminUserId)
      .eq('target_organization_id', targetOrganizationId)
      .gt('expires_at', new Date().toISOString())
      .order('granted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      return { valid: false };
    }

    return { valid: true, sessionId: session.id };
  } catch {
    return { valid: false };
  }
}

/**
 * Fastify preHandler: Requires either valid tenant membership OR
 * an active break-glass session for superadmin access.
 *
 * Use this on customer-data routes that superadmin may need to access
 * for support purposes.
 */
export async function requireTenantOrBreakGlass(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const principal = request.principal;

  if (!principal) {
    reply.status(401).send({
      success: false,
      error: { code: 'NO_PRINCIPAL', message: 'Authentication required.', statusCode: 401 },
    });
    return;
  }

  // If principal has tenant context, proceed normally
  if (principal.organizationId) {
    return;
  }

  // If superadmin without tenant context, check for break-glass session
  if (principal.role === 'superadmin') {
    const targetOrgId = request.headers['x-organization-id'] as string;
    if (!targetOrgId) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'BREAK_GLASS_REQUIRED',
          message: 'Superadmin requires break-glass authorization with X-Organization-Id header.',
          statusCode: 403,
        },
      });
      return;
    }

    const { valid, sessionId } = await validateBreakGlassSession(principal.userId, targetOrgId);
    if (!valid) {
      logger.warn(
        { userId: principal.userId, targetOrgId, action: 'break_glass_access_denied' },
        '[BreakGlass] DENIED — no active break-glass session for this tenant'
      );
      reply.status(403).send({
        success: false,
        error: {
          code: 'NO_BREAK_GLASS_SESSION',
          message: 'No active break-glass session. Request one via the control plane.',
          statusCode: 403,
        },
      });
      return;
    }

    // Grant temporary access — set principal org context from break-glass
    principal.organizationId = targetOrgId;
    logger.info(
      { userId: principal.userId, targetOrgId, sessionId, action: 'break_glass_access_used' },
      '[BreakGlass] Superadmin accessing tenant data via break-glass session'
    );
    return;
  }

  // Not superadmin and no tenant context = deny
  reply.status(403).send({
    success: false,
    error: {
      code: 'NO_TENANT_CONTEXT',
      message: 'Organization context required.',
      statusCode: 403,
    },
  });
}
