import type { FastifyInstance } from 'fastify';

/**
 * ZEGA AI — Route Registration
 *
 * All routes are versioned under /v1/ and organized by domain.
 * Each route file is a self-contained Fastify plugin.
 */
export async function registerRoutes(app: FastifyInstance) {
  // ── Health probes (no auth required) ──
  app.get('/health', async () => ({
    status: 'healthy',
    service: 'zega-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/ready', async () => ({
    status: 'ready',
    service: 'zega-api',
    timestamp: new Date().toISOString(),
  }));

  // ── API v1 routes ──
  app.register(
    async (v1) => {
      // Import and register route modules
      const { authRoutes } = await import('./v1/auth.routes.js');
      const { agentRoutes } = await import('./v1/agent.routes.js');
      const { orchestrationRoutes } = await import('./v1/orchestration.routes.js');
      const { paymentRoutes } = await import('./v1/payment.routes.js');

      v1.register(authRoutes, { prefix: '/auth' });
      v1.register(agentRoutes, { prefix: '/agents' });
      v1.register(orchestrationRoutes, { prefix: '/orchestration' });
      v1.register(paymentRoutes, { prefix: '/payments' });
    },
    { prefix: '/v1' },
  );

  app.log.info('✅ All routes registered');
}
