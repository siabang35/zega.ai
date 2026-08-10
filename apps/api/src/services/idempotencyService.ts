import { SupabaseService } from './supabaseService.js';
import crypto from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'IdempotencyService' });

export interface IdempotencyRecord {
  key: string;
  userId?: string;
  requestHash: string;
  responseBody: any;
  statusCode: number;
  expiresAt: string;
}

/**
 * ZEGA AI — Idempotency Service (F-016 FIX)
 *
 * Prevents double-execution of financial transactions and critical state modifications
 * by storing request hashes and cached response bodies in `public.idempotency_keys`.
 */
class IdempotencyServiceManager {
  private localMemoryMap = new Map<string, IdempotencyRecord>();

  /**
   * Compute request payload SHA-256 hash for payload verification
   */
  hashPayload(payload: unknown): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Check if idempotency key exists and is valid
   */
  async checkIdempotency(key: string, requestHash: string): Promise<IdempotencyRecord | null> {
    if (!key || typeof key !== 'string') return null;

    const supabase = SupabaseService.getClient();
    const nowIso = new Date().toISOString();

    if (supabase) {
      try {
        const { data } = await supabase
          .from('idempotency_keys')
          .select('key, user_id, request_hash, response_body, status_code, expires_at')
          .eq('key', key)
          .gt('expires_at', nowIso)
          .maybeSingle();

        if (data) {
          if (data.request_hash !== requestHash) {
            logger.warn({ key, storedHash: data.request_hash, incomingHash: requestHash }, '[Idempotency] Request payload mismatch for key!');
            throw new Error('Idempotency key payload mismatch');
          }
          return {
            key: data.key,
            userId: data.user_id,
            requestHash: data.request_hash,
            responseBody: data.response_body,
            statusCode: data.status_code,
            expiresAt: data.expires_at,
          };
        }
      } catch (err: any) {
        if (err.message === 'Idempotency key payload mismatch') throw err;
        logger.warn({ err, key }, '[Idempotency] DB lookup exception — checking memory map fallback');
      }
    }

    // Memory fallback check
    const local = this.localMemoryMap.get(key);
    if (local && new Date(local.expiresAt).getTime() > Date.now()) {
      if (local.requestHash !== requestHash) {
        throw new Error('Idempotency key payload mismatch');
      }
      return local;
    }

    return null;
  }

  /**
   * Save completed idempotent response (24h default TTL)
   */
  async saveIdempotency(key: string, requestHash: string, responseBody: any, statusCode = 200, ttlSeconds = 86400, userId?: string): Promise<void> {
    if (!key) return;

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const record: IdempotencyRecord = {
      key,
      userId,
      requestHash,
      responseBody,
      statusCode,
      expiresAt,
    };

    const supabase = SupabaseService.getClient();
    if (supabase) {
      try {
        await supabase.from('idempotency_keys').upsert({
          key,
          user_id: userId || null,
          request_hash: requestHash,
          response_body: responseBody,
          status_code: statusCode,
          expires_at: expiresAt,
        });
      } catch (err) {
        logger.warn({ err, key }, '[Idempotency] Failed to persist idempotency key to DB');
      }
    }

    // Always record in local memory (bound size to max 1,000 items) (F-015 FIX)
    if (this.localMemoryMap.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.localMemoryMap.entries()) {
        if (new Date(v.expiresAt).getTime() <= now) {
          this.localMemoryMap.delete(k);
        }
      }
    }
    this.localMemoryMap.set(key, record);
  }
}

export const IdempotencyService = new IdempotencyServiceManager();
