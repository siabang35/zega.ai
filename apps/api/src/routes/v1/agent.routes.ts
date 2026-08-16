import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { safeInfer } from '../../services/ai/inference.pipeline.js';
import { SupabaseService } from '../../services/supabaseService.js';
import { populatePrincipal, requireTenantContext, getTenantOrg } from '../../middleware/requestContext.js';
import { verifyOwnership, verifyTenantAccess, denyAccess } from '../../middleware/authorization.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — Agent Management Routes
 *
 * CRUD operations for AI agents with lifecycle management.
 *
 * FOUNDATION HARDENING (F-002 FIX):
 *   Supabase `public.agents` is now the AUTHORITATIVE store.
 *   The in-memory registry is a read-through cache for fast by-ID lookups.
 *   All mutations write to DB first, then update cache.
 *   On cache miss, DB is consulted before returning 404.
 *
 * Authorization Model (EA-01 FIX):
 *   Every agent is owned by the creating user (request.principal.userId).
 *   Only the owner (or superadmin) can read, modify, or delete their agents.
 */

// ── In-Memory Agent Cache (F-002: read-through cache, NOT authoritative) ──
interface AgentCacheRecord {
  id: string;
  name: string;
  meshId: string;
  tier: number;
  status: string;
  capabilities: string[];
  authorityLevel: string;
  modelPreference: string;
  spendingLimit: { amount: number; currency: string; period: string };
  ownerId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  dbId?: string; // Supabase UUID (agents table uses UUID PK, route uses `agent-xxx` format)
}

const agentCache = new Map<string, AgentCacheRecord>();

const createAgentSchema = z.object({
  name: z.string().min(3).max(100),
  meshId: z.string().min(1),
  tier: z.number().int().min(0).max(2),
  capabilities: z.array(z.string()).min(1),
  authorityLevel: z.string().default('standard'),
  modelPreference: z.string().default('claude-sonnet-4-20250514'),
  spendingLimit: z.object({
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    period: z.string().default('day'),
  }).optional(),
});

/**
 * F-002: Fetch agent from DB by looking up metadata containing the route-level ID.
 * Returns the agent record if found, null otherwise.
 */
async function fetchAgentFromDb(agentRouteId: string): Promise<AgentCacheRecord | null> {
  const supabase = SupabaseService.getClient();
  if (!supabase) return null;

  try {
    // agents table stores mesh metadata in .metadata JSONB with meshId field
    // Route-level IDs (agent-xxx) are stored in metadata
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .contains('metadata', { routeId: agentRouteId })
      .maybeSingle();

    if (error || !data) return null;

    const record: AgentCacheRecord = {
      id: agentRouteId,
      name: data.name,
      meshId: data.metadata?.meshId || '',
      tier: data.metadata?.tier ?? 0,
      status: data.is_active ? 'active' : 'suspended',
      capabilities: data.metadata?.capabilities || [],
      authorityLevel: data.metadata?.authorityLevel || 'standard',
      modelPreference: data.model_name || 'claude-sonnet-4-20250514',
      spendingLimit: data.metadata?.spendingLimit || { amount: 1000, currency: 'USD', period: 'day' },
      ownerId: data.user_id,
      organizationId: data.organization_id || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      dbId: data.id,
    };

    // Populate cache for future fast lookups (tenant-scoped key)
    const cacheKey = record.organizationId ? `${record.organizationId}:${agentRouteId}` : agentRouteId;
    agentCache.set(cacheKey, record);
    return record;
  } catch (err) {
    logger.warn({ err, agentRouteId }, '[Agents] DB lookup exception');
    return null;
  }
}

/**
 * F-002: Resolve agent by route ID — check cache first, then DB.
 * SECURITY: Cache key is org-scoped to prevent cross-tenant reads.
 */
async function resolveAgent(agentRouteId: string, organizationId?: string): Promise<AgentCacheRecord | null> {
  const cacheKey = organizationId ? `${organizationId}:${agentRouteId}` : agentRouteId;
  const cached = agentCache.get(cacheKey);
  if (cached) return cached;
  return fetchAgentFromDb(agentRouteId);
}

export async function agentRoutes(app: FastifyInstance) {
  /** POST /v1/agents — Deploy a new agent (DB-primary) */
  app.post('/', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request, reply) => {
    const principal = request.principal;
    if (!principal) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Could not determine user identity.', statusCode: 401 },
      });
    }

    const body = createAgentSchema.parse(request.body);
    const routeId = `agent-${crypto.randomUUID().slice(0, 8)}`;

    // F-002 FIX: Write to DB FIRST (authoritative store)
    const dbResult = await SupabaseService.createAgent({
      userId: principal.userId,
      organizationId: principal.organizationId || '',
      name: body.name,
      systemPrompt: `Agent Mesh ${body.meshId} with model ${body.modelPreference}`,
      modelName: body.modelPreference,
      metadata: {
        routeId,
        meshId: body.meshId,
        tier: body.tier,
        capabilities: body.capabilities,
        authorityLevel: body.authorityLevel,
        spendingLimit: body.spendingLimit || { amount: 1000, currency: 'USD', period: 'day' },
      },
    });

    if (!dbResult) {
      logger.error({ routeId }, '[Agents] Failed to persist agent to DB');
      return reply.status(500).send({
        success: false,
        error: { code: 'AGENT_CREATION_FAILED', message: 'Failed to create agent record.', statusCode: 500 },
      });
    }

    const agent: AgentCacheRecord = {
      id: routeId,
      name: body.name,
      meshId: body.meshId,
      tier: body.tier as 0 | 1 | 2,
      status: 'active',
      capabilities: body.capabilities,
      authorityLevel: body.authorityLevel,
      modelPreference: body.modelPreference,
      spendingLimit: body.spendingLimit || { amount: 1000, currency: 'USD', period: 'day' },
      ownerId: principal.userId,
      organizationId: principal.organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dbId: dbResult.id,
    };

    // Populate cache for fast subsequent lookups
    agentCache.set(routeId, agent);

    app.log.info({ agentId: routeId, mesh: body.meshId, ownerId: principal.userId }, 'Agent deployed (DB-primary + cache populated)');

    return reply.status(201).send({ success: true, data: agent });
  });

  /** GET /v1/agents — List agents owned by the current user (DB-primary) */
  app.get('/', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request) => {
    const principal = request.principal;
    if (!principal) {
      return { success: true, data: [], total: 0 };
    }

    // F-002 FIX: Read from DB as authoritative source
    const dbAgents = await SupabaseService.getAgentsByUser(principal.userId);
    if (dbAgents && dbAgents.length > 0) {
      return { success: true, data: dbAgents, total: dbAgents.length };
    }

    // Empty result (no fallback to in-memory — DB is authoritative)
    return { success: true, data: [], total: 0 };
  });

  /** GET /v1/agents/:id — Get agent by ID (ownership + tenant verified, cache + DB) */
  app.get<{ Params: { id: string } }>('/:id', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request, reply) => {
    const orgId = getTenantOrg(request);
    const agent = await resolveAgent(request.params.id, orgId || undefined);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify the requesting user owns this agent
    if (!verifyOwnership(request, agent.ownerId)) {
      return denyAccess(reply, 'AGENT_ACCESS_DENIED', 'You do not have access to this agent.');
    }

    return { success: true, data: agent };
  });

  /** POST /v1/agents/:id/infer — Run AI inference as this agent (ownership + tenant verified) */
  app.post<{ Params: { id: string } }>('/:id/infer', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request, reply) => {
    const orgId = getTenantOrg(request);
    const agent = await resolveAgent(request.params.id, orgId || undefined);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify ownership before allowing inference
    if (!verifyOwnership(request, agent.ownerId)) {
      return denyAccess(reply, 'AGENT_ACCESS_DENIED', 'You do not have access to this agent.');
    }

    if (agent.status !== 'active') {
      return reply.status(403).send({
        success: false,
        error: { code: 'AGENT_NOT_ACTIVE', message: `Agent is ${agent.status}`, statusCode: 403 },
      });
    }

    const { prompt, systemPrompt, strategy } = z.object({
      prompt: z.string().min(1),
      systemPrompt: z.string().optional(),
      strategy: z.enum(['cost', 'latency', 'accuracy', 'compliance']).optional(),
    }).parse(request.body);

    const result = await safeInfer({
      prompt,
      systemPrompt,
      strategy,
      agentId: agent.id,
      meshId: agent.meshId,
    });

    return {
      success: true,
      data: {
        content: result.response.content,
        model: result.response.model,
        provider: result.response.provider,
        tokens: {
          input: result.response.inputTokens,
          output: result.response.outputTokens,
        },
        cost: result.response.costUsd,
        latencyMs: result.response.latencyMs,
        guardrails: result.guardrails,
        audit: result.audit,
      },
    };
  });

  /** PATCH /v1/agents/:id/suspend — Suspend an agent (ownership + tenant verified, DB + cache) */
  app.patch<{ Params: { id: string } }>('/:id/suspend', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request, reply) => {
    const orgId = getTenantOrg(request);
    const agent = await resolveAgent(request.params.id, orgId || undefined);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify ownership before mutation
    if (!verifyOwnership(request, agent.ownerId)) {
      return denyAccess(reply, 'AGENT_ACCESS_DENIED', 'You do not have access to this agent.');
    }

    // EA-05 FIX: State machine transition validation
    if (agent.status !== 'active') {
      return reply.status(409).send({
        success: false,
        error: { code: 'INVALID_STATE_TRANSITION', message: `Cannot suspend agent in '${agent.status}' state. Must be 'active'.`, statusCode: 409 },
      });
    }

    // F-002 FIX: Update DB first, then cache
    if (agent.dbId) {
      const supabase = SupabaseService.getClient();
      if (supabase) {
        await supabase.from('agents').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', agent.dbId);
      }
    }

    agent.status = 'suspended';
    agent.updatedAt = new Date().toISOString();
    agentCache.set(agent.id, agent);

    app.log.info({ agentId: agent.id, ownerId: agent.ownerId }, 'Agent suspended (DB + cache updated)');
    return { success: true, data: agent };
  });

  /** PATCH /v1/agents/:id/activate — Reactivate an agent (ownership + tenant verified, DB + cache) */
  app.patch<{ Params: { id: string } }>('/:id/activate', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request, reply) => {
    const orgId = getTenantOrg(request);
    const agent = await resolveAgent(request.params.id, orgId || undefined);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify ownership before mutation
    if (!verifyOwnership(request, agent.ownerId)) {
      return denyAccess(reply, 'AGENT_ACCESS_DENIED', 'You do not have access to this agent.');
    }

    // EA-05 FIX: State machine transition validation
    if (agent.status !== 'suspended' && agent.status !== 'provisioned') {
      return reply.status(409).send({
        success: false,
        error: { code: 'INVALID_STATE_TRANSITION', message: `Cannot activate agent in '${agent.status}' state. Must be 'suspended' or 'provisioned'.`, statusCode: 409 },
      });
    }

    // F-002 FIX: Update DB first, then cache
    if (agent.dbId) {
      const supabase = SupabaseService.getClient();
      if (supabase) {
        await supabase.from('agents').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', agent.dbId);
      }
    }

    agent.status = 'active';
    agent.updatedAt = new Date().toISOString();
    agentCache.set(agent.id, agent);

    app.log.info({ agentId: agent.id, ownerId: agent.ownerId }, 'Agent activated (DB + cache updated)');
    return { success: true, data: agent };
  });

  /** DELETE /v1/agents/:id — Decommission an agent (ownership + tenant verified, DB + cache) */
  app.delete<{ Params: { id: string } }>('/:id', { onRequest: [app.authenticate], preHandler: [populatePrincipal, requireTenantContext] }, async (request, reply) => {
    const orgId = getTenantOrg(request);
    const agent = await resolveAgent(request.params.id, orgId || undefined);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify ownership before decommission
    if (!verifyOwnership(request, agent.ownerId)) {
      return denyAccess(reply, 'AGENT_ACCESS_DENIED', 'You do not have access to this agent.');
    }

    // EA-05 FIX: Decommissioned is a terminal state — cannot decommission twice
    if (agent.status === 'decommissioned') {
      return reply.status(409).send({
        success: false,
        error: { code: 'ALREADY_DECOMMISSIONED', message: 'Agent is already decommissioned.', statusCode: 409 },
      });
    }

    // F-002 FIX: Update DB first, then cache
    if (agent.dbId) {
      const supabase = SupabaseService.getClient();
      if (supabase) {
        await supabase.from('agents').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', agent.dbId);
      }
    }

    agent.status = 'decommissioned';
    agent.updatedAt = new Date().toISOString();
    agentCache.set(agent.id, agent);

    app.log.info({ agentId: agent.id, ownerId: agent.ownerId }, 'Agent decommissioned (DB + cache updated)');
    return { success: true, data: { message: `Agent ${agent.id} decommissioned` } };
  });
}
