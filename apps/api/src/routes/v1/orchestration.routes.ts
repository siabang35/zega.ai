import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * ZEGA AI — Orchestration Routes
 *
 * Central OmniOrchestrator endpoints for:
 * - Task distribution across meshes
 * - Cross-mesh conflict resolution
 * - KPI monitoring and strategic decomposition
 */

interface TaskRecord {
  id: string;
  title: string;
  description: string;
  targetMesh: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  createdAt: string;
  completedAt?: string;
}

const taskStore = new Map<string, TaskRecord>();

const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  targetMesh: z.string().min(1),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
});

export async function orchestrationRoutes(app: FastifyInstance) {
  /** POST /v1/orchestration/tasks — Create and distribute a task */
  app.post('/tasks', async (request, reply) => {
    const body = createTaskSchema.parse(request.body);
    const id = `task-${crypto.randomUUID().slice(0, 8)}`;

    const task: TaskRecord = {
      id,
      title: body.title,
      description: body.description,
      targetMesh: body.targetMesh,
      priority: body.priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    taskStore.set(id, task);
    app.log.info({ taskId: id, mesh: body.targetMesh, priority: body.priority }, 'Task created by OmniOrchestrator');

    return reply.status(201).send({ success: true, data: task });
  });

  /** GET /v1/orchestration/tasks — List all tasks */
  app.get('/tasks', async (request) => {
    const query = z.object({
      status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'failed']).optional(),
      mesh: z.string().optional(),
      priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
    }).parse(request.query);

    let tasks = Array.from(taskStore.values());

    if (query.status) tasks = tasks.filter((t) => t.status === query.status);
    if (query.mesh) tasks = tasks.filter((t) => t.targetMesh === query.mesh);
    if (query.priority) tasks = tasks.filter((t) => t.priority === query.priority);

    return { success: true, data: tasks, total: tasks.length };
  });

  /** PATCH /v1/orchestration/tasks/:id/assign — Assign task to an agent */
  app.patch<{ Params: { id: string } }>('/tasks/:id/assign', async (request, reply) => {
    const task = taskStore.get(request.params.id);
    if (!task) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found', statusCode: 404 },
      });
    }

    const { agentId } = z.object({ agentId: z.string() }).parse(request.body);
    task.assignedAgent = agentId;
    task.status = 'assigned';

    app.log.info({ taskId: task.id, agentId }, 'Task assigned');
    return { success: true, data: task };
  });

  /** PATCH /v1/orchestration/tasks/:id/complete — Mark task as completed */
  app.patch<{ Params: { id: string } }>('/tasks/:id/complete', async (request, reply) => {
    const task = taskStore.get(request.params.id);
    if (!task) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found', statusCode: 404 },
      });
    }
    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    app.log.info({ taskId: task.id }, 'Task completed');
    return { success: true, data: task };
  });

  /** GET /v1/orchestration/meshes — Get mesh health overview */
  app.get('/meshes', async () => {
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
  app.get('/kpis', async () => {
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
