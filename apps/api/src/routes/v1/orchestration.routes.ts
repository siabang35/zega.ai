import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { populatePrincipal } from '../../middleware/requestContext.js';
import { verifyOwnership, denyAccess } from '../../middleware/authorization.js';

/**
 * ZEGA AI — Orchestration Routes
 *
 * Central OmniOrchestrator endpoints for:
 * - Task distribution across meshes
 * - Cross-mesh conflict resolution
 * - KPI monitoring and strategic decomposition
 *
 * Authorization Model (EA-01 FIX):
 *   Every task record is owned by the creating user.
 *   Users can only view/modify their own tasks unless superadmin.
 *   State transitions are validated (EA-05).
 */

interface TaskRecord {
  id: string;
  title: string;
  description: string;
  targetMesh: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  ownerId: string; // EA-01 FIX: owner association
  organizationId?: string; // EA-02 FIX: tenant scoping
  createdAt: string;
  completedAt?: string;
}

const taskStore = new Map<string, TaskRecord>();

// EA-05 FIX: Valid task state transitions
const VALID_TASK_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'failed'],
  assigned: ['in_progress', 'failed'],
  in_progress: ['completed', 'failed'],
  completed: [], // terminal
  failed: ['pending'], // allow retry
};

const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  targetMesh: z.string().min(1),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
});

export async function orchestrationRoutes(app: FastifyInstance) {
  /** POST /v1/orchestration/tasks — Create and distribute a task */
  app.post('/tasks', { onRequest: [app.authenticate], preHandler: [populatePrincipal] }, async (request, reply) => {
    const principal = request.principal;
    if (!principal) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Could not determine user identity.', statusCode: 401 },
      });
    }

    const body = createTaskSchema.parse(request.body);
    const id = `task-${crypto.randomUUID().slice(0, 8)}`;

    const task: TaskRecord = {
      id,
      title: body.title,
      description: body.description,
      targetMesh: body.targetMesh,
      priority: body.priority,
      status: 'pending',
      ownerId: principal.userId, // EA-01 FIX: bind to creating user
      organizationId: principal.organizationId, // EA-02 FIX: bind to tenant
      createdAt: new Date().toISOString(),
    };

    taskStore.set(id, task);
    app.log.info({ taskId: id, mesh: body.targetMesh, priority: body.priority, ownerId: principal.userId }, 'Task created by OmniOrchestrator');

    return reply.status(201).send({ success: true, data: task });
  });

  /** GET /v1/orchestration/tasks — List tasks (ownership-scoped) */
  app.get('/tasks', { onRequest: [app.authenticate], preHandler: [populatePrincipal] }, async (request) => {
    const principal = request.principal;
    const query = z.object({
      status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'failed']).optional(),
      mesh: z.string().optional(),
      priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
    }).parse(request.query);

    // EA-01 FIX: Filter by ownership
    let tasks = Array.from(taskStore.values()).filter(
      (t) => principal && (t.ownerId === principal.userId || principal.role === 'superadmin')
    );

    if (query.status) tasks = tasks.filter((t) => t.status === query.status);
    if (query.mesh) tasks = tasks.filter((t) => t.targetMesh === query.mesh);
    if (query.priority) tasks = tasks.filter((t) => t.priority === query.priority);

    return { success: true, data: tasks, total: tasks.length };
  });

  /** PATCH /v1/orchestration/tasks/:id/assign — Assign task to an agent (ownership-verified) */
  app.patch<{ Params: { id: string } }>('/tasks/:id/assign', { onRequest: [app.authenticate], preHandler: [populatePrincipal] }, async (request, reply) => {
    const task = taskStore.get(request.params.id);
    if (!task) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify ownership
    if (!verifyOwnership(request, task.ownerId)) {
      return denyAccess(reply, 'TASK_ACCESS_DENIED', 'You do not have access to this task.');
    }

    // EA-05 FIX: Validate state transition
    const allowed = VALID_TASK_TRANSITIONS[task.status] || [];
    if (!allowed.includes('assigned')) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot assign task in '${task.status}' state. Valid transitions: ${allowed.join(', ') || 'none'}.`,
          statusCode: 409,
        },
      });
    }

    const { agentId } = z.object({ agentId: z.string() }).parse(request.body);
    task.assignedAgent = agentId;
    task.status = 'assigned';

    app.log.info({ taskId: task.id, agentId, ownerId: task.ownerId }, 'Task assigned');
    return { success: true, data: task };
  });

  /** PATCH /v1/orchestration/tasks/:id/complete — Mark task as completed (ownership-verified) */
  app.patch<{ Params: { id: string } }>('/tasks/:id/complete', { onRequest: [app.authenticate], preHandler: [populatePrincipal] }, async (request, reply) => {
    const task = taskStore.get(request.params.id);
    if (!task) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found', statusCode: 404 },
      });
    }

    // EA-01 FIX: Verify ownership
    if (!verifyOwnership(request, task.ownerId)) {
      return denyAccess(reply, 'TASK_ACCESS_DENIED', 'You do not have access to this task.');
    }

    // EA-05 FIX: Validate state transition
    const allowed = VALID_TASK_TRANSITIONS[task.status] || [];
    if (!allowed.includes('completed')) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot complete task in '${task.status}' state. Valid transitions: ${allowed.join(', ') || 'none'}.`,
          statusCode: 409,
        },
      });
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    app.log.info({ taskId: task.id, ownerId: task.ownerId }, 'Task completed');
    return { success: true, data: task };
  });

  /** GET /v1/orchestration/meshes — Get mesh health overview */
  app.get('/meshes', { onRequest: [app.authenticate], preHandler: [populatePrincipal] }, async () => {
    const meshes = [
      { id: 'finance-mesh', name: 'Finance', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'procurement-mesh', name: 'Procurement', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'supply-chain-mesh', name: 'Supply Chain', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'hr-mesh', name: 'Human Resources', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'legal-mesh', name: 'Legal & Compliance', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'security-mesh', name: 'Cybersecurity', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'sales-mesh', name: 'Sales & Marketing', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'cx-mesh', name: 'Customer Experience', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'manufacturing-mesh', name: 'Manufacturing', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'sustainability-mesh', name: 'Sustainability', status: 'healthy', agents: 0, tasksInProgress: 0 },
      { id: 'rnd-mesh', name: 'R&D', status: 'healthy', agents: 0, tasksInProgress: 0 },
    ];

    return { success: true, data: meshes, total: meshes.length };
  });

  /** GET /v1/orchestration/kpis — Get enterprise KPI overview */
  app.get('/kpis', { onRequest: [app.authenticate], preHandler: [populatePrincipal] }, async () => {
    return {
      success: true,
      data: {
        totalAgents: 0,
        activeAgents: 0,
        tasksCompleted24h: 0,
        avgResponseTimeMs: 0,
        aiInferenceCost24h: 0,
        guardrailPassRate: 100,
        uptime: process.uptime(),
        meshHealth: { healthy: 11, degraded: 0, down: 0 },
      },
    };
  });
}
