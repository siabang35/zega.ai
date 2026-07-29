import pino from 'pino';

const logger = pino({ name: 'TurnstileService' });

/**
 * Cloudflare Turnstile Bot Defense Service
 * Verifies Turnstile CAPTCHA response tokens with Cloudflare siteverify API.
 * In production (`NODE_ENV === 'production'`), Turnstile verification is strictly enforced with zero bypass.
 */
export class TurnstileService {
  private static getSecretKey(): string | null {
    return process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || null;
  }

  private static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Verify Cloudflare Turnstile Token
   */
  static async verifyToken({
    token,
    remoteIp,
  }: {
    token: string;
    remoteIp?: string;
  }): Promise<{ success: boolean; errorCodes?: string[]; devBypass?: boolean }> {
    const isProd = this.isProduction();
    const secretKey = this.getSecretKey();

    // 1. Production Mode: Strict Enforcement (No Dev Bypass Allowed)
    if (isProd) {
      if (!token || token === 'DEVELOPMENT_BYPASS_TOKEN' || token.startsWith('1x00000')) {
        logger.warn(`[TurnstileService] [PRODUCTION REJECT] Missing or dev bypass token attempted in production.`);
        return { success: false, errorCodes: ['missing-input-response'] };
      }

      if (!secretKey) {
        logger.error(`[TurnstileService] [CRITICAL CONFIG ERROR] CLOUDFLARE_TURNSTILE_SECRET_KEY is missing in PRODUCTION.`);
        return { success: false, errorCodes: ['turnstile-secret-missing'] };
      }
    } else {
      // 2. Development Mode: Allow bypass tokens or missing secret key for easy local dev testing
      if (!token || token.startsWith('1x00000') || token === 'DEVELOPMENT_BYPASS_TOKEN' || token.toLowerCase().includes('bypass')) {
        logger.info(`[TurnstileService] Turnstile dev bypass token accepted [DEV MODE].`);
        return { success: true, devBypass: true };
      }

      if (!secretKey) {
        logger.info(`[TurnstileService] CLOUDFLARE_TURNSTILE_SECRET_KEY not set. Granting dev bypass [DEV MODE].`);
        return { success: true, devBypass: true };
      }
    }

    // 3. Verify real token against Cloudflare Siteverify API endpoint
    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        logger.error(`[TurnstileService] Cloudflare API HTTP error: ${response.status}`);
        if (isProd) {
          return { success: false, errorCodes: ['cloudflare-siteverify-http-error'] };
        }
        return { success: true, devBypass: true }; // Fallback only in non-prod
      }

      const outcome = (await response.json()) as {
        success: boolean;
        'error-codes'?: string[];
      };

      if (!outcome.success) {
        logger.warn(`[TurnstileService] Failed Turnstile verification: ${JSON.stringify(outcome['error-codes'])}`);
        return { success: false, errorCodes: outcome['error-codes'] };
      }

      logger.info(`[TurnstileService] Turnstile token successfully verified via Cloudflare API.`);
      return { success: true };
    } catch (err) {
      logger.error({ err }, `[TurnstileService] Exception during Turnstile verification.`);
      if (isProd) {
        return { success: false, errorCodes: ['turnstile-verification-exception'] };
      }
      return { success: true, devBypass: true };
    }
  }
}
