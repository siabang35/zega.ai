import type { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyMultipart from '@fastify/multipart';
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
 * 6. Multipart file uploads (R2 CDN)
 * 7. WebSocket support (A2A protocol)
 * 8. Swagger OpenAPI & Swagger UI (/docs)
 * 9. Global error handler
 */
export async function registerPlugins(app: FastifyInstance) {
  // ── 1. Security Headers ──
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: envConfig.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // ── 2. Dynamic Enterprise CORS ──
  const configuredOrigins = envConfig.CORS_ORIGIN.split(',').map((o) => o.trim());

  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return cb(null, true);
      }

      // Check if origin matches configured origins, zegaai.site subdomains, or localhost
      const isConfigured = configuredOrigins.some((allowed) => {
        if (allowed === origin) return true;
        if (allowed.includes('*')) {
          const pattern = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
          return pattern.test(origin);
        }
        return false;
      });

      const isAllowedDomain =
        /^https:\/\/(www\.)?zega(ai)?\.(site|ai)$/i.test(origin) ||
        origin.endsWith('.zegaai.site') ||
        origin.endsWith('.zega.ai');
        // SECURITY (F-07 FIX): Removed wildcard hosting-provider subdomains
        // (*.vercel.app, *.onrender.com, *.netlify.app, *.pages.dev)
        // These allowed any attacker-deployed site to make authenticated requests.

      // SECURITY (F-003 FIX): Localhost origins are ONLY allowed in development mode.
      // In production, any local process could otherwise make authenticated cross-origin requests.
      const isLocalhost =
        envConfig.NODE_ENV !== 'production' &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

      if (isConfigured || isAllowedDomain || isLocalhost) {
        return cb(null, true);
      }

      app.log.warn({ origin }, 'CORS request blocked from origin');
      return cb(new Error('CORS Not Allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-CSRF-Token',
      'x-user-email',
      'x-user-id',
      'x-merchant-pubkey',
      'x-correlation-id',
      'x-privy-authorization',
      'x-authorization-attempt-id',
      'x-withdrawal-id',
      'X-Organization-Id',
      'x-organization-id',
      'X-Store-Id',
      'x-store-id',
      'X-Workspace-Id',
      'x-workspace-id'
    ],
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
      signed: false,
    },
  });

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid access token.', statusCode: 401 },
      });
    }
  });

  // ── 5. Rate Limiting ──
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      // SECURITY (F-08 FIX): Use Fastify's trusted request.ip (respects trustProxy config)
      // NOT the raw X-Forwarded-For header which is attacker-spoofable
      return req.ip;
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

  // ── 6. Multipart File Uploads (Cloudflare R2 CDN) ──
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file limit
      files: 5,
    },
  });

  // ── 6. WebSocket (A2A Agent Communication) ──
  await app.register(fastifyWebsocket);

  // ── 7. Swagger & OpenAPI Documentation (Disabled in Production & Render) ──
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    envConfig.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    !!process.env.RENDER_SERVICE_ID ||
    !!process.env.RENDER_INSTANCE_ID ||
    process.env.ENABLE_SWAGGER === 'false';

  if (!isProduction) {
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'ZEGA AI — Enterprise Orchestration API',
          description: 'OpenAPI 3.0 Documentation for ZEGA AI Autonomous Agent & Workflow Platform.',
          version: '3.2.0',
        },
        servers: [
          {
            url: envConfig.API_BASE_URL,
            description: 'Development Server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        tags: [
          { name: 'Auth', description: 'Authentication & Session Operations' },
          { name: 'Agents', description: 'AI Agent Swarm & Orchestration' },
          { name: 'Workflows', description: 'Workflow Automation Canvas' },
          { name: 'Telemetry', description: 'System Analytics & Guardrails' },
        ],
      },
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  } else {
    // Intercept all Swagger & OpenAPI requests in production before routing
    app.addHook('onRequest', async (request, reply) => {
      const url = request.url.toLowerCase();
      if (
        url.startsWith('/docs') ||
        url.startsWith('/api/docs') ||
        url.startsWith('/v1/docs') ||
        url.startsWith('/documentation')
      ) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'SWAGGER_DISABLED_IN_PRODUCTION',
            message: 'API Documentation (Swagger UI) is disabled in production environment for security compliance.',
            statusCode: 403,
          },
        });
      }
    });
  }

  // ── 7. Global OWASP Error Handler (F-020 FIX) ──
  app.setErrorHandler((err, request, reply) => {
    const correlationId = (request.raw as any)?.correlationId || (request.headers['x-correlation-id'] as string) || (request.headers['x-request-id'] as string) || request.id || 'unknown';
    const timestamp = new Date().toISOString();

    if (err instanceof ZegaError) {
      const json = err.toJSON();
      return reply.status(err.statusCode).send({
        ...json,
        error: {
          ...json.error,
          correlationId,
          timestamp,
        },
      });
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
          correlationId,
          timestamp,
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
          correlationId,
          timestamp,
        },
      });
    }

    // Unexpected errors — log with correlationId and return OWASP safe envelope
    app.log.error({ err: error, correlationId }, 'Unhandled server exception');
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: envConfig.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        statusCode: 500,
        correlationId,
        timestamp,
      },
    });
  });

  // ── 8. Request Correlation ID Propagation Hook (F-018 FIX) ──
  app.addHook('onRequest', async (request, reply) => {
    const incomingCorrelationId = (request.headers['x-correlation-id'] || request.headers['x-request-id'] || request.id) as string;
    const correlationId = String(incomingCorrelationId).trim();
    request.headers['x-correlation-id'] = correlationId;
    request.headers['x-request-id'] = correlationId;
    (request.raw as any).correlationId = correlationId;
    reply.header('x-correlation-id', correlationId);
  });

  app.log.info('✅ All core plugins registered');
}
