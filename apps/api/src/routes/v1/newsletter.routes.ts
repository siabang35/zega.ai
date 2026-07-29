import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SupabaseService } from '../../services/supabaseService.js';
import { BrevoService } from '../../services/brevoService.js';

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().optional().default('landing_page_banner'),
});

export async function newsletterRoutes(app: FastifyInstance) {
  /** POST /v1/newsletter/subscribe — Subscribe email to ZEGA AI Newsletter */
  app.post(
    '/subscribe',
    {
      schema: {
        tags: ['Newsletter'],
        summary: 'Subscribe email to ZEGA AI Newsletter',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            source: { type: 'string', default: 'landing_page_banner' },
          },
        },
      },
    },
    async (request, reply) => {
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
      const client = SupabaseService.getClient();

      try {
        if (client) {
          // Upsert subscriber into public.newsletter_subscriptions
          const { error } = await client
            .from('newsletter_subscriptions')
            .upsert(
              {
                email,
                source,
                status: 'subscribed',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'email' }
            );

          if (error) {
            request.log.warn({ err: error }, 'Supabase newsletter subscription upsert error');
          }
        }

        // Send a welcome email via Brevo SMTP if configured
        await BrevoService.sendOtpEmail({
          email,
          otp: 'WELCOME',
          fullName: 'ZEGA AI Subscriber',
        }).catch((err: any) => {
          request.log.warn({ err }, 'Brevo welcome email sending warning (non-blocking)');
        });

        return reply.send({
          success: true,
          data: {
            message: 'Successfully subscribed to ZEGA AI Newsletter!',
            email,
          },
        });
      } catch (err: any) {
        request.log.error({ err }, 'Failed to process newsletter subscription');
        return reply.send({
          success: true,
          data: {
            message: 'Thank you for subscribing!',
            email,
          },
        });
      }
    }
  );
}
