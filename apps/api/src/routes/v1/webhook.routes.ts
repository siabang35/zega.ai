/**
 * ZEGA AI — Privy Webhook Routes (`/api/webhooks`)
 *
 * Endpoints:
 *   POST /api/webhooks/privy - Handle incoming Privy webhook events
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebhookService } from '../../services/webhookService.js';
import { logger } from '../../utils/logger.js';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Ensure raw body parsing is preserved for HMAC verification
  fastify.post('/api/webhooks/privy', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const signatureHeader =
        (req.headers['privy-signature'] as string) ||
        (req.headers['x-privy-signature'] as string);

      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      // Verify HMAC-SHA256 signature if in production/devnet mode with secret
      if (process.env.PRIVY_WEBHOOK_SECRET || process.env.PRIVY_APP_SECRET) {
        const isValid = WebhookService.verifyPrivyWebhookSignature(rawBody, signatureHeader);
        if (!isValid) {
          logger.warn({ signatureHeader }, '[WebhookRoutes] Privy webhook signature verification failed.');
          return reply.status(401).send({
            error: 'UNAUTHORIZED_WEBHOOK',
            message: 'Invalid or missing HMAC webhook signature.',
          });
        }
      }

      const event = req.body as any;
      const result = await WebhookService.processPrivyWebhook(event);

      return reply.send({
        status: 'OK',
        duplicate: result.duplicate,
      });
    } catch (err: any) {
      logger.error({ err: err.message }, '[WebhookRoutes] Error handling Privy webhook.');
      return reply.status(400).send({
        error: 'WEBHOOK_PROCESSING_FAILED',
        message: err.message || 'Failed to process Privy webhook event.',
      });
    }
  });
}
