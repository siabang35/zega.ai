import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseService } from '../../services/supabaseService.js';
import { populatePrincipal, requireTenantContext } from '../../middleware/requestContext.js';
import { resolveCanonicalApplicationUser, resolveServerSideTenantGraph } from '../../services/identityResolver.js';
import { UniversalChatOrchestrator } from '../../services/ai/universalChatOrchestrator.js';
import { resolveAuthorizedSwarms } from '../../services/ai/swarmCapabilityRegistry.js';
import { logger } from '../../utils/logger.js';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const createSessionSchema = z.object({
  title: z.string().max(200).optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  prompt: z.string().min(1).max(4000),
  preferredLanguage: z.string().optional(),
});

const confirmMutationSchema = z.object({
  sessionId: z.string().uuid(),
  confirmationToken: z.string().uuid(),
  action: z.string().min(1),
  params: z.record(z.any()).default({}),
});

// ── Route Plugin ─────────────────────────────────────────────────────────────

export const universalChatRoutes: FastifyPluginAsync = async (fastify) => {
  // Auth hooks — every request requires valid principal + tenant context
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  /**
   * POST /v1/umkm/ai-chat/sessions
   * Create a new universal chat session (no specific swarm required).
   */
  fastify.post('/sessions', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const body = createSessionSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database service unavailable.' } });
      }

      const { data: session, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          swarm_id: null,
          organization_id: tenantGraph.organizationId,
          workspace_id: tenantGraph.workspaceId || null,
          store_id: tenantGraph.storeId,
          user_id: canonicalUser.appUserId,
          title: body.title || 'AI Store Assistant Chat',
          status: 'ACTIVE',
          metadata: { type: 'universal', created_by: 'universal_chat_gateway' },
        })
        .select()
        .single();

      if (error) {
        logger.warn({ error }, '[UniversalChat] Session creation error');
        return reply.status(500).send({ success: false, error: { code: 'SESSION_CREATE_FAILED', message: error.message } });
      }

      return reply.status(201).send({ success: true, data: session });
    } catch (err: any) {
      logger.error({ err }, '[UniversalChat] Session creation exception');
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * GET /v1/umkm/ai-chat/sessions
   * List the authenticated user's universal chat sessions (tenant-scoped).
   */
  fastify.get('/sessions', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database service unavailable.' } });
      }

      const { data: sessions, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .or(`organization_id.eq.${tenantGraph.organizationId},user_id.eq.${canonicalUser.appUserId}`)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        return reply.status(500).send({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
      }

      return reply.send({ success: true, data: sessions || [] });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * DELETE /v1/umkm/ai-chat/sessions/:id
   * Delete a single universal chat session and all its messages (tenant-scoped).
   */
  fastify.delete('/sessions/:id', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const { id } = request.params as { id: string };
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database service unavailable.' } });
      }

      // Fetch session to check ownership
      const { data: session, error: fetchErr } = await supabase
        .from('ai_chat_sessions')
        .select('id, organization_id, store_id, user_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) {
        logger.error({ fetchErr, id }, '[UniversalChat] Session fetch for deletion error');
        return reply.status(500).send({ success: false, error: { code: 'FETCH_FAILED', message: fetchErr.message } });
      }

      // If session does not exist (already deleted), return success idempotently
      if (!session) {
        return reply.send({ success: true, data: { deleted: id } });
      }

      const isOwner =
        !session.store_id ||
        (tenantGraph.storeId && session.store_id === tenantGraph.storeId) ||
        !session.organization_id ||
        (tenantGraph.organizationId && session.organization_id === tenantGraph.organizationId) ||
        session.user_id === canonicalUser.appUserId ||
        session.user_id === principal.userId;

      if (!isOwner) {
        logger.warn({ session, tenantGraph, authUserId: principal.userId }, '[UniversalChat] Cross-tenant delete blocked');
        return reply.status(403).send({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Cross-tenant access denied.' } });
      }

      // Delete messages first
      const { error: msgErr } = await supabase.from('ai_chat_messages').delete().eq('session_id', id);
      if (msgErr) {
        logger.error({ msgErr, id }, '[UniversalChat] Failed to delete session messages');
      }

      // Delete session
      const { error: sessErr } = await supabase.from('ai_chat_sessions').delete().eq('id', id);
      if (sessErr) {
        logger.error({ sessErr, id }, '[UniversalChat] Failed to delete session record');
        return reply.status(500).send({ success: false, error: { code: 'SESSION_DELETE_FAILED', message: sessErr.message } });
      }

      return reply.send({ success: true, data: { deleted: id } });
    } catch (err: any) {
      logger.error({ err }, '[UniversalChat] Session delete exception');
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * DELETE /v1/umkm/ai-chat/sessions
   * Clear all chat sessions and history for the active store tenant.
   */
  fastify.delete('/sessions', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database service unavailable.' } });
      }

      // Get all session IDs for this store/tenant
      const { data: userSessions } = await supabase
        .from('ai_chat_sessions')
        .select('id')
        .or(`store_id.eq.${tenantGraph.storeId},user_id.eq.${canonicalUser.appUserId}`);

      if (userSessions && userSessions.length > 0) {
        const sessionIds = userSessions.map(s => s.id);
        await supabase.from('ai_chat_messages').delete().in('session_id', sessionIds);
        await supabase.from('ai_chat_sessions').delete().in('id', sessionIds);
      }

      return reply.send({ success: true, data: { cleared: true } });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * POST /v1/umkm/ai-chat/messages
   * Send a message through the universal chat orchestrator.
   */
  fastify.post('/messages', {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const body = sendMessageSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      // Verify session belongs to this tenant
      const supabase = SupabaseService.getClient();
      if (supabase) {
        const { data: session } = await supabase
          .from('ai_chat_sessions')
          .select('id, organization_id, user_id')
          .eq('id', body.sessionId)
          .maybeSingle();

        if (session && session.organization_id !== tenantGraph.organizationId && session.user_id !== canonicalUser.appUserId) {
          return reply.status(403).send({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Session does not belong to this tenant.' } });
        }
      }

      const reqLangHeader = request.headers['x-zega-ai-language'] as string | undefined;
      const resolvedLangPref = body.preferredLanguage || reqLangHeader;

      // Route through universal orchestrator
      const response = await UniversalChatOrchestrator.processMessage({
        sessionId: body.sessionId,
        storeId: tenantGraph.storeId,
        organizationId: tenantGraph.organizationId,
        userId: canonicalUser.appUserId,
        prompt: body.prompt,
        preferredLanguage: resolvedLangPref,
      });

      return reply.send({ success: true, data: response });
    } catch (err: any) {
      logger.error({ err }, '[UniversalChat] Message processing exception');
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * GET /v1/umkm/ai-chat/sessions/:id/messages
   * Get messages for a specific chat session (tenant-scoped).
   */
  fastify.get('/sessions/:id/messages', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const { id } = request.params as { id: string };
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database service unavailable.' } });
      }

      // Verify session ownership
      const { data: session } = await supabase
        .from('ai_chat_sessions')
        .select('id, organization_id, user_id')
        .eq('id', id)
        .maybeSingle();

      if (!session) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found.' } });
      }

      if (session.organization_id !== tenantGraph.organizationId && session.user_id !== canonicalUser.appUserId) {
        return reply.status(403).send({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Cross-tenant access denied.' } });
      }

      const { data: messages, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        return reply.status(500).send({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
      }

      return reply.send({ success: true, data: messages || [] });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * POST /v1/umkm/ai-chat/messages/confirm
   * Confirm a write mutation that was previously requested.
   */
  fastify.post('/messages/confirm', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const body = confirmMutationSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const response = await UniversalChatOrchestrator.executeMutation({
        sessionId: body.sessionId,
        confirmationToken: body.confirmationToken,
        action: body.action,
        mutationParams: body.params,
        storeId: tenantGraph.storeId,
        organizationId: tenantGraph.organizationId,
        userId: canonicalUser.appUserId,
      });

      return reply.send({ success: true, data: response });
    } catch (err: any) {
      logger.error({ err }, '[UniversalChat] Mutation confirmation exception');
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });

  /**
   * GET /v1/umkm/ai-chat/swarms
   * Get all authorized swarms for the current tenant.
   */
  fastify.get('/swarms', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({ authUserId: principal.userId, email: principal.email });
      const tenantGraph = await resolveServerSideTenantGraph(canonicalUser.appUserId, canonicalUser.email);

      const swarms = await resolveAuthorizedSwarms({
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
      });

      return reply.send({
        success: true,
        data: {
          swarms,
          tenantContext: {
            storeId: tenantGraph.storeId,
            organizationId: tenantGraph.organizationId,
          },
        },
      });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, error: { code: err.code || 'INTERNAL', message: err.message } });
    }
  });
};
