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

  // Alias for Render health check path
  app.get('/v1/health', async () => ({
    status: 'healthy',
    service: 'zega-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // ── Swagger UI Aliases (Development Only) ──
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    !!process.env.RENDER_SERVICE_ID ||
    !!process.env.RENDER_INSTANCE_ID ||
    process.env.ENABLE_SWAGGER === 'false';

  if (!isProduction) {
    app.get('/api/docs', async (_req, reply) => reply.redirect('/docs'));
    app.get('/v1/docs', async (_req, reply) => reply.redirect('/docs'));
    app.get('/documentation', async (_req, reply) => reply.redirect('/docs'));
  }

  // ── API v1 routes ──
  app.register(
    async (v1) => {
      // Import and register route modules
      const { authRoutes } = await import('./v1/auth.routes.js');
      const { agentRoutes } = await import('./v1/agent.routes.js');
      const { orchestrationRoutes } = await import('./v1/orchestration.routes.js');
      const { paymentRoutes } = await import('./v1/payment.routes.js');
      const { storageRoutes } = await import('./v1/storage.routes.js');
      const { newsletterRoutes } = await import('./v1/newsletter.routes.js');
      const { zeroclawRoutes } = await import('./v1/zeroclaw.routes.js');

      v1.register(authRoutes, { prefix: '/auth' });
      v1.register(agentRoutes, { prefix: '/agents' });
      v1.register(orchestrationRoutes, { prefix: '/orchestration' });
      v1.register(paymentRoutes, { prefix: '/payments' });
      v1.register(storageRoutes, { prefix: '/storage' });
      v1.register(newsletterRoutes, { prefix: '/newsletter' });
      v1.register(zeroclawRoutes, { prefix: '/zeroclaw' });
    },
    { prefix: '/v1' },
  );

  app.log.info('✅ All routes registered');
}
