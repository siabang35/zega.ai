import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { safeInfer } from '../../services/ai/inference.pipeline.js';

/**
 * ZEGA AI — Agent Management Routes
 *
 * CRUD operations for AI agents with lifecycle management.
 * All agents are registered in an in-memory registry backed by persistence.
 */

// ── In-Memory Agent Registry ──
interface AgentRecord {
  id: string;
  name: string;
  meshId: string;
  tier: 0 | 1 | 2;
  status: 'provisioned' | 'active' | 'suspended' | 'decommissioned';
  capabilities: string[];
  authorityLevel: string;
  modelPreference: string;
  spendingLimit: { amount: number; currency: string; period: string };
  createdAt: string;
  updatedAt: string;
}

const agentRegistry = new Map<string, AgentRecord>();

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

export async function agentRoutes(app: FastifyInstance) {
  /** POST /v1/agents — Deploy a new agent */
  app.post('/', async (request, reply) => {
    const body = createAgentSchema.parse(request.body);
    const id = `agent-${crypto.randomUUID().slice(0, 8)}`;

    const agent: AgentRecord = {
      id,
      name: body.name,
      meshId: body.meshId,
      tier: body.tier as 0 | 1 | 2,
      status: 'active',
      capabilities: body.capabilities,
      authorityLevel: body.authorityLevel,
      modelPreference: body.modelPreference,
      spendingLimit: body.spendingLimit || { amount: 1000, currency: 'USD', period: 'day' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    agentRegistry.set(id, agent);
    app.log.info({ agentId: id, mesh: body.meshId }, 'Agent deployed');

    return reply.status(201).send({ success: true, data: agent });
  });

  /** GET /v1/agents — List all agents */
  app.get('/', async () => {
    const agents = Array.from(agentRegistry.values());
    return { success: true, data: agents, total: agents.length };
  });

  /** GET /v1/agents/:id — Get agent by ID */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const agent = agentRegistry.get(request.params.id);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }
    return { success: true, data: agent };
  });

  /** POST /v1/agents/:id/infer — Run AI inference as this agent */
  app.post<{ Params: { id: string } }>('/:id/infer', async (request, reply) => {
    const agent = agentRegistry.get(request.params.id);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
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

  /** PATCH /v1/agents/:id/suspend — Suspend an agent */
  app.patch<{ Params: { id: string } }>('/:id/suspend', async (request, reply) => {
    const agent = agentRegistry.get(request.params.id);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }
    agent.status = 'suspended';
    agent.updatedAt = new Date().toISOString();
    app.log.info({ agentId: agent.id }, 'Agent suspended');
    return { success: true, data: agent };
  });

  /** PATCH /v1/agents/:id/activate — Reactivate an agent */
  app.patch<{ Params: { id: string } }>('/:id/activate', async (request, reply) => {
    const agent = agentRegistry.get(request.params.id);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }
    agent.status = 'active';
    agent.updatedAt = new Date().toISOString();
    app.log.info({ agentId: agent.id }, 'Agent activated');
    return { success: true, data: agent };
  });

  /** DELETE /v1/agents/:id — Decommission an agent */
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const agent = agentRegistry.get(request.params.id);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found', statusCode: 404 },
      });
    }
    agent.status = 'decommissioned';
    agent.updatedAt = new Date().toISOString();
    app.log.info({ agentId: agent.id }, 'Agent decommissioned');
    return { success: true, data: { message: `Agent ${agent.id} decommissioned` } };
  });
}
