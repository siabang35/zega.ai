import crypto from 'crypto';

interface OtpEntry {
  email: string;
  otpHash: string;
  expiresAt: number; // Unix timestamp ms
  attempts: number;
  fullName?: string;
  audienceSegment?: 'individual' | 'enterprise';
}

/**
 * In-memory secure OTP Store with expiration & attempt protection (OWASP compliant)
 */
class OtpStoreManager {
  private store: Map<string, OtpEntry> = new Map();

  /**
   * Generate 6-digit OTP code and store hash
   */
  createOtp(
    email: string,
    fullName?: string,
    audienceSegment: 'individual' | 'enterprise' = 'individual'
  ): string {
    const rawEmail = email.trim().toLowerCase();
    
    // Generate secure 6-digit number
    const randomInt = crypto.randomInt(100000, 999999);
    const otp = randomInt.toString();

    // Hash OTP using SHA-256 for secure storage
    const otpHash = crypto.createHash('sha256').update(otp + ':' + rawEmail).digest('hex');
    
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    this.store.set(rawEmail, {
      email: rawEmail,
      otpHash,
      expiresAt,
      attempts: 0,
      fullName,
      audienceSegment,
    });

    return otp;
  }

  /**
   * Verify provided OTP code against stored hash
   */
  verifyOtp(email: string, otp: string): { valid: boolean; reason?: string; metadata?: OtpEntry } {
    const rawEmail = email.trim().toLowerCase();
    const entry = this.store.get(rawEmail);

    if (!entry) {
      return { valid: false, reason: 'OTP code expired or not requested. Please request a new code.' };
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(rawEmail);
      return { valid: false, reason: 'OTP code has expired (5 minute limit). Please request a new code.' };
    }

    if (entry.attempts >= 5) {
      this.store.delete(rawEmail);
      return { valid: false, reason: 'Too many invalid attempts. Security lock triggered. Please request a new code.' };
    }

    entry.attempts += 1;

    const testHash = crypto.createHash('sha256').update(otp.trim() + ':' + rawEmail).digest('hex');

    if (testHash !== entry.otpHash) {
      return { valid: false, reason: `Invalid verification code. ${5 - entry.attempts} attempts remaining.` };
    }

    // OTP validated successfully -> clear entry to prevent replay attack
    this.store.delete(rawEmail);
    return { valid: true, metadata: entry };
  }
}

export const OtpStore = new OtpStoreManager();
