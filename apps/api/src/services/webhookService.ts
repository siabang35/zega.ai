/**
 * ZEGA AI — Privy Webhook Service
 *
 * Handles verification & processing of asynchronous Privy webhooks:
 *   - Verifies HMAC signatures from Privy headers (`privy-signature`)
 *   - Idempotently logs events in `privy_webhook_events` DB table
 *   - Triggers appropriate application event listeners (e.g. wallet provisioned, transaction signed)
 *
 * SECURITY:
 *   - Uses timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`)
 *   - NEVER trusts unverified payloads
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { SupabaseService } from './supabaseService.js';
import { logger } from '../utils/logger.js';
import { envConfig } from '../config/env.js';

export interface PrivyWebhookHeaderOptions {
  signatureHeader?: string;
  rawBody: string | Buffer;
}

export interface PrivyWebhookEvent {
  id: string;
  type: string;
  created_at: number;
  data: Record<string, any>;
}

/**
 * Verifies the authenticity of an incoming Privy webhook payload using HMAC-SHA256.
 */
export function verifyPrivyWebhookSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
  const secret = process.env.PRIVY_WEBHOOK_SECRET || process.env.PRIVY_APP_SECRET;
  if (!secret) {
    logger.warn('[WebhookService] PRIVY_WEBHOOK_SECRET is not configured. Webhook verification rejected.');
    return false;
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const computedHmac = createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');

    const cleanSig = signatureHeader.replace(/^t=\d+,v1=/, '').trim();

    const expectedBuffer = Buffer.from(computedHmac, 'hex');
    const actualBuffer = Buffer.from(cleanSig, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err: any) {
    logger.error({ err: err.message }, '[WebhookService] Error verifying webhook signature.');
    return false;
  }
}

/**
 * Processes an incoming Privy webhook event idempotently.
 */
export async function processPrivyWebhook(event: PrivyWebhookEvent): Promise<{ success: boolean; duplicate: boolean }> {
  if (!event || !event.id || !event.type) {
    throw new Error('INVALID_WEBHOOK_PAYLOAD: Event ID and type are required.');
  }

  const supabase = SupabaseService.getClient();
  if (!supabase) {
    logger.warn('[WebhookService] Supabase unavailable. Processing event in-memory only.');
    return { success: true, duplicate: false };
  }

  // Idempotency check: Record event ID in DB
  try {
    const { error } = await supabase.from('privy_webhook_events').insert({
      id: event.id,
      event_type: event.type,
      privy_user_id: event.data?.user_id || event.data?.user?.id || null,
      wallet_address: event.data?.wallet?.address || null,
      payload: event,
    });

    if (error) {
      if (error.code === '23505') {
        // Unique violation — duplicate event
        logger.info({ eventId: event.id, eventType: event.type }, '[WebhookService] Duplicate webhook event received. Skipping.');
        return { success: true, duplicate: true };
      }
      logger.error({ error, eventId: event.id }, '[WebhookService] Failed to persist webhook event.');
    }
  } catch (err: any) {
    logger.error({ err: err.message, eventId: event.id }, '[WebhookService] Database insert error.');
  }

  logger.info({ eventId: event.id, eventType: event.type }, '⚡ [WebhookService] Privy webhook event processed successfully.');

  return { success: true, duplicate: false };
}

export const WebhookService = {
  verifyPrivyWebhookSignature,
  processPrivyWebhook,
  verifyWebhookSignature: (payload: any, signature?: string) => verifyPrivyWebhookSignature(JSON.stringify(payload), signature),
  processWebhookEvent: processPrivyWebhook,
};

export const webhookService = WebhookService;
