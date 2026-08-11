import Fastify from 'fastify';
import { envConfig } from './config/env.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';
import { reconciliationScheduler } from './services/ReconciliationScheduler.js';

/**
 * ZEGA AI — Enterprise Backend Server
 *
 * High-performance Fastify application serving as the central nervous system
 * for AI agent orchestration, payment infrastructure, and enterprise operations.
 */
async function bootstrap() {
  const app = Fastify({
    logger: {
      level: envConfig.LOG_LEVEL,
      transport:
        envConfig.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
          : undefined,
    },
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
    bodyLimit: 1_048_576, // 1MB
  });

  // ── Register all plugins (security, auth, cache, payments) ──
  await registerPlugins(app);

  // ── Register all versioned routes ──
  await registerRoutes(app);

  // ── Graceful shutdown ──
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info({ signal }, 'Received shutdown signal, closing server...');
      reconciliationScheduler.stop();
      await app.close();
      process.exit(0);
    });
  }

  // ── Start server ──
  try {
    const address = await app.listen({
      port: envConfig.PORT,
      host: '0.0.0.0',
    });
    app.log.info(`🚀 ZEGA AI API Server running at ${address}`);

    // ── Start background reconciliation scheduler ──
    reconciliationScheduler.start();
  } catch (err) {
    app.log.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
