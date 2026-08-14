import crypto from 'crypto';
import { envConfig } from '../config/env.js';
import pino from 'pino';

const logger = pino({ name: 'EncryptionService' });

export class CryptographicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicError';
  }
}

/**
 * ZEGA AI — AES-256-GCM At-Rest Field Encryption Service (F-011 & DV-001 FIX)
 *
 * Provides OWASP-compliant authenticated encryption for sensitive fields
 * stored in the database (e.g. `integrations.auth_data`, API keys, webhooks).
 *
 * Key Derivation:
 * Uses HKDF to derive a 256-bit AES key from `JWT_SECRET` or `COOKIE_SECRET` + explicit salt.
 */
class EncryptionServiceManager {
  private masterKey: Buffer;

  constructor() {
    const rawSecret = envConfig.JWT_SECRET || process.env.JWT_SECRET || process.env.COOKIE_SECRET || 'zega-fallback-development-master-encryption-key-32b';
    // Derive deterministic 32-byte key using HKDF-SHA256
    this.masterKey = Buffer.from(crypto.hkdfSync('sha256', Buffer.from(rawSecret), Buffer.from('zega_at_rest_salt'), Buffer.from('zega_field_encryption_v1'), 32));
  }

  /**
   * Encrypt arbitrary object or text into an AES-256-GCM envelope
   * Format: `enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
   */
  encrypt(data: unknown): string {
    if (data === null || data === undefined) return '';

    const textToEncrypt = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const ivHex = iv.toString('hex');

    return `enc:v1:${ivHex}:${authTag}:${encrypted}`;
  }

  /**
   * Strict authenticated decryption (DV-001 FIX).
   * Throws CryptographicError on tampered tags, invalid IVs, malformed envelopes,
   * or unencrypted plaintext inputs.
   */
  decryptStrict<T = unknown>(encryptedEnvelope: string): T | string {
    if (!encryptedEnvelope || typeof encryptedEnvelope !== 'string') {
      throw new CryptographicError('Empty or invalid ciphertext input');
    }

    if (!encryptedEnvelope.startsWith('enc:v1:')) {
      throw new CryptographicError('Missing valid enc:v1: ciphertext envelope prefix');
    }

    const parts = encryptedEnvelope.split(':');
    if (parts.length !== 5) {
      throw new CryptographicError('Malformed ciphertext envelope structure');
    }

    try {
      const [, , ivHex, authTagHex, ciphertextHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      try {
        return JSON.parse(decrypted) as T;
      } catch {
        return decrypted;
      }
    } catch (err: any) {
      if (err instanceof CryptographicError) throw err;
      logger.error({ err }, '[EncryptionService] Strict decryption failed (authentication tag mismatch)');
      throw new CryptographicError(`Decryption authentication failed: ${err?.message || 'bad tag'}`);
    }
  }

  /**
   * Decrypt an AES-256-GCM envelope back to text or parsed JSON (with legacy fallback)
   */
  decrypt<T = unknown>(encryptedEnvelope: string): T | string | null {
    if (!encryptedEnvelope || typeof encryptedEnvelope !== 'string') return null;

    // Check envelope prefix
    if (!encryptedEnvelope.startsWith('enc:v1:')) {
      // Return unencrypted data as-is if legacy plaintext, with warning
      try {
        return JSON.parse(encryptedEnvelope) as T;
      } catch {
        return encryptedEnvelope;
      }
    }

    try {
      return this.decryptStrict<T>(encryptedEnvelope);
    } catch (err) {
      logger.error({ err }, '[EncryptionService] Decryption failed (bad tag or key mismatch)');
      return null;
    }
  }

  /**
   * Helper to inspect if string is encrypted envelope
   */
  isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith('enc:v1:');
  }
}

export const EncryptionService = new EncryptionServiceManager();
