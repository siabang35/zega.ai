import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * ZEGA AI — Authentication Routes
 *
 * Handles user authentication via JWT + secure cookies.
 * Supabase Auth handles identity; this layer issues ZEGA session tokens.
 */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(100),
  organizationName: z.string().min(2).max(200).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  /** POST /v1/auth/login — Authenticate and issue session */
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // In production: validate against Supabase Auth
    // For now: issue a JWT token
    const token = app.jwt.sign(
      {
        sub: crypto.randomUUID(),
        email: body.email,
        roles: ['user'],
        tenant: 'default',
      },
      { expiresIn: '15m' },
    );

    const refreshToken = crypto.randomUUID();

    // Set secure HTTP-only cookie
    reply.setCookie('__zega_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    reply.setCookie('__zega_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return {
      success: true,
      data: {
        accessToken: token,
        expiresIn: 900,
        tokenType: 'Bearer',
      },
    };
  });

  /** POST /v1/auth/signup — Create new account */
  app.post('/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body);

    // In production: create user via Supabase Auth
    const userId = crypto.randomUUID();

    const token = app.jwt.sign(
      {
        sub: userId,
        email: body.email,
        roles: ['user'],
        tenant: 'default',
      },
      { expiresIn: '15m' },
    );

    reply.setCookie('__zega_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    return reply.status(201).send({
      success: true,
      data: {
        userId,
        accessToken: token,
        expiresIn: 900,
      },
    });
  });

  /** POST /v1/auth/refresh — Refresh access token */
  app.post('/refresh', async (request, reply) => {
    const refreshCookie = request.cookies['__zega_refresh'];

    if (!refreshCookie) {
      return reply.status(401).send({
        success: false,
        error: { code: 'REFRESH_TOKEN_MISSING', message: 'No refresh token', statusCode: 401 },
      });
    }

    // In production: validate refresh token from Redis store
    const token = app.jwt.sign(
      { sub: crypto.randomUUID(), roles: ['user'], tenant: 'default' },
      { expiresIn: '15m' },
    );

    reply.setCookie('__zega_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    return { success: true, data: { accessToken: token, expiresIn: 900 } };
  });

  /** POST /v1/auth/logout — Clear session */
  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('__zega_token', { path: '/' });
    reply.clearCookie('__zega_refresh', { path: '/v1/auth/refresh' });
    return { success: true, data: { message: 'Session terminated' } };
  });

  /** GET /v1/auth/me — Get current user */
  app.get('/me', async (request, reply) => {
    try {
      const decoded = await request.jwtVerify();
      return { success: true, data: decoded };
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token', statusCode: 401 },
      });
    }
  });
}
