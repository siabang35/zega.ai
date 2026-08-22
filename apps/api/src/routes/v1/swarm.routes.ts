import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { SupabaseService } from '../../services/supabaseService.js';
import { populatePrincipal, requireTenantContext, getTenantOrg } from '../../middleware/requestContext.js';
import { resolveCanonicalApplicationUser, resolveServerSideTenantGraph } from '../../services/identityResolver.js';
import { InventorySwarmOrchestrator } from '../../services/ai/inventorySwarmOrchestrator.js';
import { SwarmChatRouter } from '../../services/ai/swarmChatRouter.js';
import { logger } from '../../utils/logger.js';

const deploySwarmSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  objective: z.string().default('INVENTORY_MANAGEMENT'),
  idempotencyKey: z.string().optional(),
  storeId: z.string().optional(),
  agents: z.array(z.object({
    role: z.enum(['COORDINATOR', 'INVENTORY_MONITOR', 'DEMAND_FORECASTER', 'STOCK_ANALYST', 'REORDER_ADVISOR', 'INVENTORY_REPORTER']),
    name: z.string().min(2),
    modelId: z.string().default('groq/compound'),
    authorityLevel: z.enum(['READ_ONLY', 'WRITE_WITH_APPROVAL', 'FULL_AUTONOMOUS']).default('READ_ONLY'),
    skills: z.array(z.string()).default([]),
  })).optional(),
});

const executeSwarmSchema = z.object({
  swarmId: z.string().optional(),
  storeId: z.string().optional(),
  prompt: z.string().min(1),
  triggerType: z.enum(['MANUAL', 'SCHEDULED', 'EVENT_LOW_STOCK', 'CHAT_PROMPT']).default('MANUAL'),
});

const updateSwarmSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'DECOMMISSIONED']).optional(),
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
});

const createChatSessionSchema = z.object({
  swarmId: z.string().min(1),
  title: z.string().optional(),
  storeId: z.string().optional(),
});

const sendChatMessageSchema = z.object({
  sessionId: z.string().min(1),
  swarmId: z.string().min(1),
  prompt: z.string().min(1),
  storeId: z.string().optional(),
});

const confirmMutationSchema = z.object({
  sessionId: z.string().min(1),
  swarmId: z.string().min(1),
  confirmationToken: z.string().min(1),
  action: z.string().min(1),
  params: z.record(z.any()).default({}),
  storeId: z.string().optional(),
});

// ── Audit Logger Helper ──
async function logSwarmAudit(action: string, ctx: {
  organizationId?: string;
  workspaceId?: string;
  storeId?: string;
  userId?: string;
  swarmId?: string;
  executionId?: string;
  result?: string;
  metadata?: any;
}) {
  const supabase = SupabaseService.getClient();
  if (!supabase) return;
  try {
    await supabase.from('ai_swarm_audit_logs').insert({
      organization_id: ctx.organizationId || null,
      workspace_id: ctx.workspaceId || null,
      store_id: ctx.storeId || null,
      user_id: ctx.userId || null,
      swarm_id: ctx.swarmId || null,
      execution_id: ctx.executionId || null,
      action,
      result: ctx.result || 'SUCCESS',
      metadata: ctx.metadata || {},
    });
  } catch (e) {
    logger.warn({ e, action }, '[SwarmAudit] Non-blocking audit log failure');
  }
}

export const swarmRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', populatePrincipal);
  fastify.addHook('preHandler', requireTenantContext);

  /**
   * POST /v1/umkm/swarm/deploy
   * Deploy a multi-agent inventory swarm with strict idempotency and DB persistence.
   */
  fastify.post('/deploy', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const body = deploySwarmSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email,
        body.storeId
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({
          success: false,
          error: { code: 'DATABASE_UNAVAILABLE', message: 'Database service unavailable.', statusCode: 503 }
        });
      }

      // 1. Check Idempotency Key
      if (body.idempotencyKey) {
        const { data: existingSwarm } = await supabase
          .from('ai_swarms')
          .select('*, ai_swarm_agents(*)')
          .eq('idempotency_key', body.idempotencyKey)
          .eq('organization_id', tenantGraph.organizationId)
          .maybeSingle();

        if (existingSwarm) {
          logger.info({ swarmId: existingSwarm.id, idempotencyKey: body.idempotencyKey }, '[SwarmRoutes] Idempotent deploy hit, returning existing swarm');
          return reply.send({
            success: true,
            data: {
              swarm: existingSwarm,
              isExisting: true,
              message: 'Swarm with this idempotency key already deployed.'
            }
          });
        }
      }

      // 2. Persist Swarm Record to DB
      const swarmId = crypto.randomUUID();
      const { data: swarmRecord, error: swarmErr } = await supabase
        .from('ai_swarms')
        .insert({
          id: swarmId,
          organization_id: tenantGraph.organizationId || null,
          workspace_id: tenantGraph.workspaceId || null,
          store_id: tenantGraph.storeId || null,
          user_id: canonicalUser.appUserId,
          name: body.name.trim(),
          description: body.description || 'Production AI Inventory Workforce',
          objective: body.objective,
          status: 'ACTIVE',
          idempotency_key: body.idempotencyKey || `idem-${swarmId.slice(0, 8)}`,
          configuration: {
            maxAgents: 5,
            maxSteps: 10,
            deployedAt: new Date().toISOString(),
          }
        })
        .select('*')
        .single();

      if (swarmErr || !swarmRecord) {
        logger.error({ swarmErr }, '[SwarmRoutes] Failed to insert swarm record');
        await logSwarmAudit('SWARM_DEPLOY_FAILED', {
          organizationId: tenantGraph.organizationId,
          storeId: tenantGraph.storeId,
          userId: canonicalUser.appUserId,
          result: 'FAILED',
          metadata: { error: swarmErr?.message }
        });
        return reply.status(400).send({
          success: false,
          error: { code: 'SWARM_DEPLOY_FAILED', message: swarmErr?.message || 'Failed to create swarm record in DB.', statusCode: 400 }
        });
      }

      // 3. Persist Swarm Agents & Skills
      const agentConfigs = body.agents && body.agents.length > 0 ? body.agents : [
        { role: 'COORDINATOR', name: 'Inventory Swarm Coordinator', modelId: 'groq/compound', authorityLevel: 'READ_ONLY', skills: ['inventory.report'] },
        { role: 'INVENTORY_MONITOR', name: 'Stock Monitor Agent', modelId: 'gemini-3.6-flash', authorityLevel: 'READ_ONLY', skills: ['inventory.read', 'inventory.monitor'] },
        { role: 'DEMAND_FORECASTER', name: 'Demand Forecaster Agent', modelId: 'deepseek/deepseek-r1', authorityLevel: 'READ_ONLY', skills: ['inventory.forecast'] },
        { role: 'STOCK_ANALYST', name: 'Stock Performance Analyst', modelId: 'openai/gpt-oss-120b', authorityLevel: 'READ_ONLY', skills: ['inventory.analyze', 'inventory.detect_dead_stock'] },
        { role: 'REORDER_ADVISOR', name: 'Reorder Optimization Advisor', modelId: 'qwen/qwen3.6-27b', authorityLevel: 'READ_ONLY', skills: ['inventory.reorder_recommendation'] },
      ];

      const insertedAgents = [];
      for (const agent of agentConfigs) {
        const agentId = crypto.randomUUID();
        const { data: agentData } = await supabase
          .from('ai_swarm_agents')
          .insert({
            id: agentId,
            swarm_id: swarmId,
            role: agent.role,
            name: agent.name,
            model_id: agent.modelId,
            authority_level: agent.authorityLevel,
            status: 'ACTIVE',
          })
          .select('*')
          .single();

        if (agentData) {
          insertedAgents.push(agentData);
          if (agent.skills && agent.skills.length > 0) {
            for (const skillName of agent.skills) {
              await supabase.from('ai_swarm_skills').insert({
                agent_id: agentId,
                skill_name: skillName,
                enabled: true,
              });
            }
          }
        }
      }

      // 4. Audit Log
      await logSwarmAudit('SWARM_CREATED', {
        organizationId: tenantGraph.organizationId,
        workspaceId: tenantGraph.workspaceId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId,
        metadata: { name: body.name, agentCount: insertedAgents.length, objective: body.objective }
      });

      logger.info({ swarmId, storeId: tenantGraph.storeId, agentCount: insertedAgents.length }, '[SwarmRoutes] Swarm successfully deployed');

      return reply.status(201).send({
        success: true,
        data: {
          swarm: swarmRecord,
          agents: insertedAgents,
          message: `AI Inventory Swarm '${body.name}' deployed successfully.`
        }
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Deploy Swarm Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'SWARM_DEPLOY_EXCEPTION', message: err?.message || 'Failed to deploy swarm.', statusCode: 500 }
      });
    }
  });

  /**
   * POST /v1/umkm/swarm/execute
   * Execute an inventory swarm analysis run.
   */
  fastify.post('/execute', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const body = executeSwarmSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email,
        body.storeId
      );

      // Verify swarm ownership if swarmId is provided
      if (body.swarmId) {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          const { data: swarmCheck } = await supabase
            .from('ai_swarms')
            .select('id, organization_id, store_id, status')
            .eq('id', body.swarmId)
            .maybeSingle();

          if (!swarmCheck) {
            return reply.status(404).send({
              success: false,
              error: { code: 'SWARM_NOT_FOUND', message: 'Swarm not found.', statusCode: 404 }
            });
          }

          // Verify tenant ownership
          if (swarmCheck.organization_id && swarmCheck.organization_id !== tenantGraph.organizationId) {
            await logSwarmAudit('SWARM_EXECUTION_DENIED', {
              organizationId: tenantGraph.organizationId,
              storeId: tenantGraph.storeId,
              userId: canonicalUser.appUserId,
              swarmId: body.swarmId,
              result: 'DENIED',
              metadata: { reason: 'CROSS_TENANT_VIOLATION', targetOrg: swarmCheck.organization_id }
            });
            return reply.status(403).send({
              success: false,
              error: { code: 'TENANT_SCOPE_VIOLATION', message: 'Cannot execute swarm belonging to another tenant.', statusCode: 403 }
            });
          }

          if (swarmCheck.status === 'DECOMMISSIONED') {
            return reply.status(400).send({
              success: false,
              error: { code: 'SWARM_DECOMMISSIONED', message: 'Cannot execute a decommissioned swarm.', statusCode: 400 }
            });
          }
        }
      }

      await logSwarmAudit('SWARM_EXECUTED', {
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId: body.swarmId,
        metadata: { prompt: body.prompt, triggerType: body.triggerType }
      });

      const output = await InventorySwarmOrchestrator.executeSwarm({
        swarmId: body.swarmId,
        storeId: tenantGraph.storeId,
        organizationId: tenantGraph.organizationId,
        userId: canonicalUser.appUserId,
        prompt: body.prompt,
        triggerType: body.triggerType,
      });

      return reply.send({
        success: true,
        data: output
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Execute Swarm Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'SWARM_EXECUTION_EXCEPTION', message: err?.message || 'Failed to execute swarm.', statusCode: 500 }
      });
    }
  });

  /**
   * GET /v1/umkm/swarm/list
   * List deployed swarms for store/organization
   */
  fastify.get('/list', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.send({ success: true, data: [] });
      }

      // Strict tenant-scoped query
      let query = supabase.from('ai_swarms').select('*, ai_swarm_agents(*)');

      if (tenantGraph.organizationId) {
        query = query.eq('organization_id', tenantGraph.organizationId);
      } else if (tenantGraph.storeId) {
        query = query.eq('store_id', tenantGraph.storeId);
      } else {
        query = query.eq('user_id', canonicalUser.appUserId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return reply.send({
        success: true,
        data: data || []
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[List Swarms Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'LIST_SWARMS_EXCEPTION', message: err?.message || 'Failed to fetch swarms.', statusCode: 500 }
      });
    }
  });

  /**
   * PATCH /v1/umkm/swarm/:id
   * Update swarm status or configuration
   */
  fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const swarmId = request.params.id;
      const body = updateSwarmSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({
          success: false,
          error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.', statusCode: 503 }
        });
      }

      // Verify ownership with tenant predicate
      const { data: swarm } = await supabase
        .from('ai_swarms')
        .select('id, organization_id, store_id, user_id')
        .eq('id', swarmId)
        .maybeSingle();

      if (!swarm) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SWARM_NOT_FOUND', message: 'Swarm not found.', statusCode: 404 }
        });
      }

      if (swarm.organization_id && tenantGraph.organizationId && swarm.organization_id !== tenantGraph.organizationId) {
        await logSwarmAudit('SWARM_UPDATE_DENIED', {
          organizationId: tenantGraph.organizationId,
          userId: canonicalUser.appUserId,
          swarmId,
          result: 'DENIED',
          metadata: { reason: 'CROSS_TENANT_VIOLATION' }
        });
        return reply.status(403).send({
          success: false,
          error: { code: 'TENANT_SCOPE_VIOLATION', message: 'Cannot modify swarm belonging to another tenant.', statusCode: 403 }
        });
      }

      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (body.status) updatePayload.status = body.status;
      if (body.name) updatePayload.name = body.name;
      if (body.description) updatePayload.description = body.description;

      let updateQuery = supabase
        .from('ai_swarms')
        .update(updatePayload)
        .eq('id', swarmId);

      if (swarm.organization_id && tenantGraph.organizationId) {
        updateQuery = updateQuery.eq('organization_id', tenantGraph.organizationId);
      } else if (swarm.store_id && tenantGraph.storeId) {
        updateQuery = updateQuery.eq('store_id', tenantGraph.storeId);
      } else if (swarm.user_id) {
        updateQuery = updateQuery.eq('user_id', canonicalUser.appUserId);
      }

      const { data: updated, error: updateErr } = await updateQuery
        .select('*')
        .single();

      if (updateErr) {
        return reply.status(400).send({
          success: false,
          error: { code: 'SWARM_UPDATE_FAILED', message: updateErr.message, statusCode: 400 }
        });
      }

      const auditAction = body.status === 'PAUSED' ? 'SWARM_DISABLED' : body.status === 'ACTIVE' ? 'SWARM_ENABLED' : 'SWARM_UPDATED';
      await logSwarmAudit(auditAction, {
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId,
        metadata: { changes: body }
      });

      return reply.send({
        success: true,
        data: updated
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Update Swarm Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'UPDATE_SWARM_EXCEPTION', message: err?.message || 'Failed to update swarm.', statusCode: 500 }
      });
    }
  });

  /**
   * DELETE /v1/umkm/swarm/:id
   * Soft-delete (decommission) a swarm
   */
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const swarmId = request.params.id;
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({
          success: false,
          error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.', statusCode: 503 }
        });
      }

      // Verify ownership
      const { data: swarm } = await supabase
        .from('ai_swarms')
        .select('id, organization_id, store_id, user_id')
        .eq('id', swarmId)
        .maybeSingle();

      if (!swarm) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SWARM_NOT_FOUND', message: 'Swarm not found.', statusCode: 404 }
        });
      }

      if (swarm.organization_id && tenantGraph.organizationId && swarm.organization_id !== tenantGraph.organizationId) {
        await logSwarmAudit('SWARM_DELETE_DENIED', {
          organizationId: tenantGraph.organizationId,
          userId: canonicalUser.appUserId,
          swarmId,
          result: 'DENIED',
          metadata: { reason: 'CROSS_TENANT_VIOLATION' }
        });
        return reply.status(403).send({
          success: false,
          error: { code: 'TENANT_SCOPE_VIOLATION', message: 'Cannot delete swarm belonging to another tenant.', statusCode: 403 }
        });
      }

      // Soft-delete: set status to DECOMMISSIONED
      let deleteQuery = supabase
        .from('ai_swarms')
        .update({ status: 'DECOMMISSIONED', updated_at: new Date().toISOString() })
        .eq('id', swarmId);

      if (swarm.organization_id && tenantGraph.organizationId) {
        deleteQuery = deleteQuery.eq('organization_id', tenantGraph.organizationId);
      } else if (swarm.store_id && tenantGraph.storeId) {
        deleteQuery = deleteQuery.eq('store_id', tenantGraph.storeId);
      } else if (swarm.user_id) {
        deleteQuery = deleteQuery.eq('user_id', canonicalUser.appUserId);
      }

      const { error: deleteErr } = await deleteQuery;
      if (deleteErr) {
        logger.error({ deleteErr, swarmId }, '[SwarmRoutes] Decommission update failed');
        return reply.status(400).send({
          success: false,
          error: { code: 'SWARM_DELETE_FAILED', message: deleteErr.message, statusCode: 400 }
        });
      }

      await logSwarmAudit('SWARM_DECOMMISSIONED', {
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId,
      });

      return reply.send({
        success: true,
        data: { message: 'Swarm decommissioned successfully.' }
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Delete Swarm Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'DELETE_SWARM_EXCEPTION', message: err?.message || 'Failed to delete swarm.', statusCode: 500 }
      });
    }
  });

  /**
   * GET /v1/umkm/swarm/executions
   * Fetch execution history for current store
   */
  fastify.get('/executions', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.send({ success: true, data: [] });
      }

      // Strict tenant-scoped query
      let query = supabase.from('ai_swarm_executions').select('*');
      if (tenantGraph.organizationId) {
        query = query.eq('organization_id', tenantGraph.organizationId);
      } else if (tenantGraph.storeId) {
        query = query.eq('store_id', tenantGraph.storeId);
      } else {
        query = query.eq('user_id', canonicalUser.appUserId);
      }

      const { data, error } = await query.order('started_at', { ascending: false }).limit(20);
      if (error) throw error;

      return reply.send({
        success: true,
        data: data || []
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Get Executions Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'GET_EXECUTIONS_EXCEPTION', message: err?.message || 'Failed to fetch execution history.', statusCode: 500 }
      });
    }
  });

  /**
   * GET /v1/umkm/swarm/executions/:id
   * Fetch specific execution details with step-by-step breakdown
   */
  fastify.get<{ Params: { id: string } }>('/executions/:id', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable', statusCode: 503 } });
      }

      const executionId = request.params.id;

      // Tenant-scoped execution lookup
      let execQuery = supabase
        .from('ai_swarm_executions')
        .select('*')
        .eq('id', executionId);

      if (tenantGraph.organizationId) {
        execQuery = execQuery.eq('organization_id', tenantGraph.organizationId);
      } else {
        execQuery = execQuery.eq('user_id', canonicalUser.appUserId);
      }

      const { data: execData, error: execErr } = await execQuery.maybeSingle();

      if (execErr || !execData) {
        return reply.status(404).send({
          success: false,
          error: { code: 'EXECUTION_NOT_FOUND', message: 'Swarm execution record not found or access denied.', statusCode: 404 }
        });
      }

      const { data: stepsData } = await supabase
        .from('ai_swarm_execution_steps')
        .select('*')
        .eq('execution_id', executionId)
        .order('step_number', { ascending: true });

      return reply.send({
        success: true,
        data: {
          execution: execData,
          steps: stepsData || []
        }
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Get Execution Detail Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'GET_EXECUTION_DETAIL_EXCEPTION', message: err?.message || 'Failed to fetch execution detail.', statusCode: 500 }
      });
    }
  });

  /**
   * POST /v1/umkm/swarm/chat/sessions
   * Create a new persistent chat session attached to a swarm
   */
  fastify.post('/chat/sessions', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const body = createChatSessionSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email,
        body.storeId
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) {
        return reply.status(503).send({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.', statusCode: 503 } });
      }

      // Verify Swarm Tenant Ownership
      const { data: swarmCheck } = await supabase
        .from('ai_swarms')
        .select('id, organization_id, store_id')
        .eq('id', body.swarmId)
        .maybeSingle();

      if (!swarmCheck) {
        return reply.status(404).send({ success: false, error: { code: 'SWARM_NOT_FOUND', message: 'Swarm not found.', statusCode: 404 } });
      }

      if (swarmCheck.organization_id && tenantGraph.organizationId && swarmCheck.organization_id !== tenantGraph.organizationId) {
        return reply.status(403).send({ success: false, error: { code: 'TENANT_SCOPE_VIOLATION', message: 'Cannot attach chat session to another tenant\'s swarm.', statusCode: 403 } });
      }

      const sessionId = crypto.randomUUID();
      const { data: session, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          id: sessionId,
          swarm_id: body.swarmId,
          organization_id: tenantGraph.organizationId || null,
          workspace_id: tenantGraph.workspaceId || null,
          store_id: tenantGraph.storeId || null,
          user_id: canonicalUser.appUserId,
          title: body.title || 'Stock Swarm Chat',
          status: 'ACTIVE',
        })
        .select('*')
        .single();

      if (error || !session) throw error;

      await logSwarmAudit('CHAT_SESSION_CREATED', {
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId: body.swarmId,
        metadata: { sessionId: session.id, title: session.title }
      });

      return reply.status(201).send({
        success: true,
        data: session
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Create Chat Session Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'CREATE_SESSION_EXCEPTION', message: err?.message || 'Failed to create chat session.', statusCode: 500 }
      });
    }
  });

  /**
   * GET /v1/umkm/swarm/chat/sessions
   * List tenant chat sessions
   */
  fastify.get('/chat/sessions', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) return reply.send({ success: true, data: [] });

      let query = supabase.from('ai_chat_sessions').select('*');
      if (tenantGraph.organizationId) {
        query = query.eq('organization_id', tenantGraph.organizationId);
      } else if (tenantGraph.storeId) {
        query = query.eq('store_id', tenantGraph.storeId);
      } else {
        query = query.eq('user_id', canonicalUser.appUserId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) throw error;

      return reply.send({
        success: true,
        data: data || []
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[List Chat Sessions Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'LIST_SESSIONS_EXCEPTION', message: err?.message || 'Failed to list chat sessions.', statusCode: 500 }
      });
    }
  });

  /**
   * GET /v1/umkm/swarm/chat/sessions/:id/messages
   * Fetch chat message history for a session
   */
  fastify.get<{ Params: { id: string } }>('/chat/sessions/:id/messages', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const sessionId = request.params.id;
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) return reply.send({ success: true, data: [] });

      // Verify Session Tenant Ownership
      let sessionQuery = supabase.from('ai_chat_sessions').select('id, organization_id, store_id, user_id').eq('id', sessionId);
      if (tenantGraph.organizationId) {
        sessionQuery = sessionQuery.eq('organization_id', tenantGraph.organizationId);
      } else {
        sessionQuery = sessionQuery.eq('user_id', canonicalUser.appUserId);
      }

      const { data: sessionData } = await sessionQuery.maybeSingle();
      if (!sessionData) {
        return reply.status(404).send({ success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found or access denied.', statusCode: 404 } });
      }

      const { data: messages, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return reply.send({
        success: true,
        data: messages || []
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Get Chat Messages Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'GET_MESSAGES_EXCEPTION', message: err?.message || 'Failed to fetch chat messages.', statusCode: 500 }
      });
    }
  });

  /**
   * DELETE /v1/umkm/swarm/chat/sessions/:id
   * Delete a chat session
   */
  fastify.delete<{ Params: { id: string } }>('/chat/sessions/:id', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const sessionId = request.params.id;
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) return reply.status(503).send({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.', statusCode: 503 } });

      let deleteQuery = supabase.from('ai_chat_sessions').delete().eq('id', sessionId);
      if (tenantGraph.organizationId) {
        deleteQuery = deleteQuery.eq('organization_id', tenantGraph.organizationId);
      } else {
        deleteQuery = deleteQuery.eq('user_id', canonicalUser.appUserId);
      }

      const { error } = await deleteQuery;
      if (error) throw error;

      return reply.send({
        success: true,
        data: { message: 'Chat session deleted successfully.' }
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Delete Chat Session Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'DELETE_SESSION_EXCEPTION', message: err?.message || 'Failed to delete chat session.', statusCode: 500 }
      });
    }
  });

  /**
   * POST /v1/umkm/swarm/chat/message
   * Send a natural language prompt to the Stock Swarm
   */
  fastify.post('/chat/message', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const body = sendChatMessageSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email,
        body.storeId
      );

      const supabase = SupabaseService.getClient();
      if (!supabase) return reply.status(503).send({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.', statusCode: 503 } });

      // Verify Session & Swarm Tenant Ownership
      const { data: session } = await supabase
        .from('ai_chat_sessions')
        .select('id, swarm_id, organization_id, store_id')
        .eq('id', body.sessionId)
        .maybeSingle();

      if (!session) {
        return reply.status(404).send({ success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found.', statusCode: 404 } });
      }

      if (session.organization_id && tenantGraph.organizationId && session.organization_id !== tenantGraph.organizationId) {
        await logSwarmAudit('CHAT_MESSAGE_DENIED', {
          organizationId: tenantGraph.organizationId,
          userId: canonicalUser.appUserId,
          swarmId: body.swarmId,
          result: 'DENIED',
          metadata: { reason: 'CROSS_TENANT_VIOLATION' }
        });
        return reply.status(403).send({ success: false, error: { code: 'TENANT_SCOPE_VIOLATION', message: 'Cannot message chat session belonging to another tenant.', statusCode: 403 } });
      }

      const swarmReply = await SwarmChatRouter.processChatMessage({
        sessionId: body.sessionId,
        swarmId: body.swarmId,
        prompt: body.prompt,
        storeId: tenantGraph.storeId,
        organizationId: tenantGraph.organizationId,
        userId: canonicalUser.appUserId,
      });

      await logSwarmAudit('CHAT_MESSAGE_SENT', {
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId: body.swarmId,
        metadata: { sessionId: body.sessionId, intent: swarmReply.structuredPayload?.intent }
      });

      return reply.send({
        success: true,
        data: swarmReply
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Send Chat Message Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'SEND_MESSAGE_EXCEPTION', message: err?.message || 'Failed to process chat message.', statusCode: 500 }
      });
    }
  });

  /**
   * POST /v1/umkm/swarm/chat/confirm-mutation
   * Confirm and execute a write mutation after explicit user approval
   */
  fastify.post('/chat/confirm-mutation', async (request, reply) => {
    const principal = request.principal;
    if (!principal?.userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authenticated session required.', statusCode: 401 }
      });
    }

    try {
      const body = confirmMutationSchema.parse(request.body);
      const canonicalUser = await resolveCanonicalApplicationUser({
        authUserId: principal.userId,
        email: principal.email
      });

      const tenantGraph = await resolveServerSideTenantGraph(
        canonicalUser.appUserId,
        canonicalUser.email,
        body.storeId
      );

      const response = await SwarmChatRouter.confirmMutation({
        sessionId: body.sessionId,
        swarmId: body.swarmId,
        confirmationToken: body.confirmationToken,
        action: body.action,
        params: body.params,
        storeId: tenantGraph.storeId,
        organizationId: tenantGraph.organizationId,
        userId: canonicalUser.appUserId,
      });

      await logSwarmAudit('MUTATION_CONFIRMED', {
        organizationId: tenantGraph.organizationId,
        storeId: tenantGraph.storeId,
        userId: canonicalUser.appUserId,
        swarmId: body.swarmId,
        metadata: { action: body.action, params: body.params }
      });

      return reply.send({
        success: true,
        data: response
      });
    } catch (err: any) {
      fastify.log.error({ err }, '[Confirm Mutation Exception]');
      return reply.status(500).send({
        success: false,
        error: { code: 'CONFIRM_MUTATION_EXCEPTION', message: err?.message || 'Failed to execute write mutation.', statusCode: 500 }
      });
    }
  });
};

