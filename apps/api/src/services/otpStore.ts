import crypto from 'crypto';
import { SupabaseService } from './supabaseService.js';
import pino from 'pino';

const logger = pino({ name: 'OtpStore' });

interface OtpEntry {
  email: string;
  otpHash: string;
  expiresAt: number; // Unix timestamp ms
  attempts: number;
  fullName?: string;
  audienceSegment?: 'individual' | 'enterprise';
}

/**
 * ZEGA AI — OWASP Compliant Persistent OTP Store (F-006 FIX)
 *
 * Supports primary DB persistence via Supabase `public.otps` table,
 * with an in-memory fallback when DB is unreachable/unconfigured.
 */
class OtpStoreManager {
  private inMemoryStore: Map<string, OtpEntry> = new Map();

  /**
   * Generate 6-digit OTP code and store hash in DB (or memory fallback)
   */
  async createOtp(
    email: string,
    fullName?: string,
    audienceSegment: 'individual' | 'enterprise' = 'individual'
  ): Promise<string> {
    const rawEmail = email.trim().toLowerCase();

    // Generate secure 6-digit number
    const randomInt = crypto.randomInt(100000, 999999);
    const otp = randomInt.toString();

    // Hash OTP using SHA-256 for secure storage
    const otpHash = crypto.createHash('sha256').update(otp + ':' + rawEmail).digest('hex');
    const ttlMs = 5 * 60 * 1000; // 5 minutes TTL
    const expiresAtIso = new Date(Date.now() + ttlMs).toISOString();

    const supabase = SupabaseService.getClient();

    if (supabase) {
      try {
        // Delete existing OTPs for this email to prevent multiple valid active codes
        await supabase.from('otps').delete().eq('email', rawEmail);

        const { error } = await supabase.from('otps').insert({
          email: rawEmail,
          otp_hash: otpHash,
          expires_at: expiresAtIso,
          attempts: 0,
          metadata: { fullName, audienceSegment },
        });

        if (!error) {
          logger.info({ email: rawEmail }, '[OtpStore] OTP hash stored in DB successfully');
          return otp;
        }

        logger.warn({ error, email: rawEmail }, '[OtpStore] Failed to insert OTP into DB. Falling back to memory store.');
      } catch (err) {
        logger.warn({ err, email: rawEmail }, '[OtpStore] DB exception storing OTP. Falling back to memory store.');
      }
    }

    // Fallback: In-memory store
    this.inMemoryStore.set(rawEmail, {
      email: rawEmail,
      otpHash,
      expiresAt: Date.now() + ttlMs,
      attempts: 0,
      fullName,
      audienceSegment,
    });

    return otp;
  }

  /**
   * Verify provided OTP code against stored hash in DB or memory
   */
  async verifyOtp(
    email: string,
    otp: string
  ): Promise<{ valid: boolean; reason?: string; metadata?: OtpEntry }> {
    const rawEmail = email.trim().toLowerCase();
    const testHash = crypto.createHash('sha256').update(otp.trim() + ':' + rawEmail).digest('hex');

    const supabase = SupabaseService.getClient();

    if (supabase) {
      try {
        const { data: dbEntry, error } = await supabase
          .from('otps')
          .select('*')
          .eq('email', rawEmail)
          .maybeSingle();

        if (!error && dbEntry) {
          const expiresAtMs = new Date(dbEntry.expires_at).getTime();

          if (Date.now() > expiresAtMs) {
            await supabase.from('otps').delete().eq('email', rawEmail);
            return { valid: false, reason: 'OTP code has expired (5 minute limit). Please request a new code.' };
          }

          if (dbEntry.attempts >= 5) {
            await supabase.from('otps').delete().eq('email', rawEmail);
            return { valid: false, reason: 'Too many invalid attempts. Security lock triggered. Please request a new code.' };
          }

          if (testHash !== dbEntry.otp_hash) {
            const newAttempts = dbEntry.attempts + 1;
            await supabase.from('otps').update({ attempts: newAttempts }).eq('email', rawEmail);
            return { valid: false, reason: `Invalid verification code. ${5 - newAttempts} attempts remaining.` };
          }

          // OTP validated successfully -> clear DB entry to prevent replay attack
          await supabase.from('otps').delete().eq('email', rawEmail);

          const metadata: OtpEntry = {
            email: rawEmail,
            otpHash: dbEntry.otp_hash,
            expiresAt: expiresAtMs,
            attempts: dbEntry.attempts + 1,
            fullName: dbEntry.metadata?.fullName,
            audienceSegment: dbEntry.metadata?.audienceSegment || 'individual',
          };

          return { valid: true, metadata };
        }
      } catch (err) {
        logger.warn({ err, email: rawEmail }, '[OtpStore] DB exception verifying OTP. Trying memory fallback.');
      }
    }

    // Fallback: In-memory verification
    const entry = this.inMemoryStore.get(rawEmail);

    if (!entry) {
      return { valid: false, reason: 'OTP code expired or not requested. Please request a new code.' };
    }

    if (Date.now() > entry.expiresAt) {
      this.inMemoryStore.delete(rawEmail);
      return { valid: false, reason: 'OTP code has expired (5 minute limit). Please request a new code.' };
    }

    if (entry.attempts >= 5) {
      this.inMemoryStore.delete(rawEmail);
      return { valid: false, reason: 'Too many invalid attempts. Security lock triggered. Please request a new code.' };
    }

    entry.attempts += 1;

    if (testHash !== entry.otpHash) {
      return { valid: false, reason: `Invalid verification code. ${5 - entry.attempts} attempts remaining.` };
    }

    this.inMemoryStore.delete(rawEmail);
    return { valid: true, metadata: entry };
  }
}

export const OtpStore = new OtpStoreManager();
