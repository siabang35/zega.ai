import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SupabaseService } from '../../services/supabaseService.js';
import { BrevoService } from '../../services/brevoService.js';

const subscribeSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .max(100, { message: 'Email address exceeds maximum length' })
    .transform((val) => val.trim().toLowerCase()),
  source: z.string().optional().default('landing_page_banner'),
  website: z.string().optional(), // Honeypot field for bot trapping
  hp_token: z.string().optional(), // Secondary honeypot token
});

// Simple in-memory IP rate limiter for newsletter subscription
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 }); // 10 minute window
    return false;
  }
  if (entry.count >= 5) {
    return true; // Max 5 subscriptions per IP per 10 minutes
  }
  entry.count += 1;
  return false;
}

export async function newsletterRoutes(app: FastifyInstance) {
  /** POST /v1/newsletter/subscribe — Anti-Bot Hardened Newsletter Subscription */
  app.post(
    '/subscribe',
    {
      schema: {
        tags: ['Newsletter'],
        summary: 'Subscribe email to ZEGA AI Newsletter with Anti-Bot Protection',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            source: { type: 'string', default: 'landing_page_banner' },
            website: { type: 'string' },
            hp_token: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const clientIp = request.ip || '127.0.0.1';

      // 1. Anti-Bot Honeypot Defense: If bot filled hidden field, return fake success
      const bodyAny = request.body as any;
      if (bodyAny && (bodyAny.website || bodyAny.hp_token)) {
        request.log.info({ ip: clientIp }, 'Honeypot triggered on newsletter endpoint. Trapped bot request.');
        return reply.send({
          success: true,
          data: {
            message: 'Thank you for subscribing to ZEGA AI Newsletter!',
            email: bodyAny.email || 'subscriber@domain.com',
          },
        });
      }

      // 2. IP Rate Limiting Guardrail
      if (isRateLimited(clientIp)) {
        return reply.status(429).send({
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many subscription attempts from this IP address. Please try again in 10 minutes.',
            statusCode: 429,
          },
        });
      }

      // 3. Input Validation & Sanitization
      const parseResult = subscribeSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_INPUT',
            message: 'Please provide a valid email address.',
            details: parseResult.error.flatten(),
          },
        });
      }

      const { email, source } = parseResult.data;

      // 4. Save subscriber to Supabase Database (or local memory fallback)
      try {
        const client = SupabaseService.getClient();
        if (client) {
          const { error } = await client.from('newsletter_subscriptions').upsert(
            {
              email,
              source,
              status: 'subscribed',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );

          if (error) {
            request.log.warn({ err: error }, 'Supabase newsletter subscription database upsert warning');
          } else {
            request.log.info({ email }, 'Newsletter subscriber recorded in database');
          }
        }
      } catch (dbErr) {
        request.log.warn({ err: dbErr }, 'Supabase DB fallback triggered for newsletter subscription');
      }

      // 5. Non-Blocking Email Notification (Failure won't break client response)
      BrevoService.sendOtpEmail({
        email,
        otp: 'WELCOME',
        fullName: 'ZEGA AI Subscriber',
      }).catch((emailErr) => {
        request.log.warn({ err: emailErr }, 'Brevo email dispatch warning (non-blocking)');
      });

      return reply.send({
        success: true,
        data: {
          message: 'Successfully subscribed to ZEGA AI Newsletter!',
          email,
        },
      });
    }
  );
}
