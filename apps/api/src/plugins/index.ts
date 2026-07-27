import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import { envConfig } from '../config/env.js';
import { ZegaError } from '../utils/errors.js';

/**
 * ZEGA AI — Plugin Registration
 *
 * Registers all Fastify plugins in the correct lifecycle order:
 * 1. Security headers (Helmet)
 * 2. CORS
 * 3. Cookie parsing
 * 4. JWT authentication
 * 5. Rate limiting
 * 6. WebSocket support (A2A protocol)
 * 7. Global error handler
 */
export async function registerPlugins(app: FastifyInstance) {
  // ── 1. Security Headers ──
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: envConfig.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // ── 2. CORS ──
  await app.register(fastifyCors, {
    origin: envConfig.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
    maxAge: 86400,
  });

  // ── 3. Cookies ──
  await app.register(fastifyCookie, {
    secret: envConfig.COOKIE_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: envConfig.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    },
  });

  // ── 4. JWT Authentication ──
  await app.register(fastifyJwt, {
    secret: envConfig.JWT_SECRET,
    sign: {
      expiresIn: '15m', // Short-lived access tokens
      algorithm: 'HS256',
    },
    cookie: {
      cookieName: '__zega_token',
      signed: true,
    },
  });

  // ── 5. Rate Limiting ──
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      // Rate limit by authenticated user, or by IP for anonymous
      return (req.headers['x-forwarded-for'] as string) || req.ip;
    },
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Retry after ${Math.round(context.ttl / 1000)}s`,
        statusCode: 429,
        details: { retry_after_seconds: Math.round(context.ttl / 1000) },
      },
    }),
  });

  // ── 6. WebSocket (A2A Agent Communication) ──
  await app.register(fastifyWebsocket);

  // ── 7. Global Error Handler ──
  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof ZegaError) {
      return reply.status(err.statusCode).send(err.toJSON());
    }

    // Cast for property access (Fastify enriches errors with these fields)
    const error = err as Error & { validation?: unknown[]; statusCode?: number };

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          statusCode: 400,
          details: { validation: error.validation },
        },
      });
    }

    // Rate limit errors from @fastify/rate-limit
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
          statusCode: 429,
        },
      });
    }

    // Unexpected errors — log and return generic 500
    app.log.error(error, 'Unhandled error');
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: envConfig.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        statusCode: 500,
      },
    });
  });

  // ── 8. Request ID Decoration ──
  app.addHook('onRequest', async (request) => {
    request.headers['x-request-id'] = request.headers['x-request-id'] || request.id;
  });

  app.log.info('✅ All core plugins registered');
}
