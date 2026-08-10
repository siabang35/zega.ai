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

  // F-019 FIX: Telemetry & Metrics Endpoint (/v1/health/telemetry)
  app.get('/v1/health/telemetry', async (request) => {
    const memoryUsage = process.memoryUsage();
    const rssMb = Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100;
    const heapUsedMb = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
    const heapTotalMb = Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100;

    const { solanaRpcManager } = await import('../services/solanaRpcManager.js');
    const { SupabaseService } = await import('../services/supabaseService.js');

    const rpcPoolStatus = solanaRpcManager.getPoolStatus();
    const dbHealthy = await SupabaseService.healthCheck();

    const correlationId = (request.raw as any)?.correlationId || (request.headers['x-correlation-id'] as string) || request.id;

    // Log snapshot to DB asynchronously
    const supabase = SupabaseService.getClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('health_telemetry_logs').insert({
            node_id: process.env.NODE_ID || 'api-node-1',
            memory_rss_mb: rssMb,
            memory_heap_used_mb: heapUsedMb,
            rpc_pool_healthy_count: rpcPoolStatus.activeHealthyCount,
            rpc_pool_cooldown_count: rpcPoolStatus.inCooldownCount,
            db_pool_healthy: dbHealthy,
            metrics_json: {
              uptimeSeconds: Math.round(process.uptime()),
              totalProviders: rpcPoolStatus.totalProviders,
              cachedItemsCount: rpcPoolStatus.cachedItemsCount,
              inFlightRequestsCount: rpcPoolStatus.inFlightRequestsCount,
            },
          });
        } catch {
          // Non-blocking background log capture
        }
      })();
    }

    return {
      status: 'healthy',
      service: 'zega-api',
      correlationId,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMb,
        heapUsedMb,
        heapTotalMb,
      },
      database: {
        healthy: dbHealthy,
      },
      rpcPool: rpcPoolStatus,
    };
  });

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
      const { umkmRoutes } = await import('./v1/umkm.routes.js');
      const { enterpriseRoutes } = await import('./v1/enterprise.routes.js');

      v1.register(authRoutes, { prefix: '/auth' });
      v1.register(agentRoutes, { prefix: '/agents' });
      v1.register(orchestrationRoutes, { prefix: '/orchestration' });
      v1.register(paymentRoutes, { prefix: '/payments' });
      v1.register(storageRoutes, { prefix: '/storage' });
      v1.register(newsletterRoutes, { prefix: '/newsletter' });
      v1.register(zeroclawRoutes, { prefix: '/zeroclaw' });
      v1.register(umkmRoutes, { prefix: '/umkm' });
      v1.register(enterpriseRoutes, { prefix: '/enterprise' });
    },
    { prefix: '/v1' },
  );

  app.log.info('✅ All routes registered');
}
