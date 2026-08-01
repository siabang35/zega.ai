/**
 * @zega/zeroclaw-bridge — Authentication & Pairing Manager
 *
 * Implements pairing protocol against ZeroClaw v0.8.x gateway daemons.
 * Handles single-flight pairing code submission, token extraction, and headers generation.
 *
 * Upstream Reference:
 *   - crates/zeroclaw-gateway/src/lib.rs (handle_pair)
 *   - crates/zeroclaw-gateway/src/api_pairing.rs (submit_pairing_enhanced)
 */

import { AuthenticationError, PairingError, RateLimitError } from './errors.js';
import { PairResponse } from './types.js';

export interface AuthConfig {
  gatewayUrl: string;
  bearerToken?: string;
  deviceName?: string;
  deviceType?: string;
  timeoutMs?: number;
  userAgent?: string;
}

export class ZeroClawAuthManager {
  private gatewayUrl: string;
  private bearerToken: string | null = null;
  private deviceName: string;
  private deviceType: string;
  private timeoutMs: number;
  private userAgent: string;

  constructor(config: AuthConfig) {
    this.gatewayUrl = config.gatewayUrl.replace(/\/+$/, '');
    this.bearerToken = config.bearerToken || null;
    this.deviceName = config.deviceName || 'ZEGA AI Bridge';
    this.deviceType = config.deviceType || 'api-bridge';
    this.timeoutMs = config.timeoutMs || 5000;
    this.userAgent = config.userAgent || 'ZEGA-ZeroClaw-Bridge/0.1.0';
  }

  /** Whether the manager currently holds a bearer token. */
  public isAuthenticated(): boolean {
    return Boolean(this.bearerToken && this.bearerToken.trim().length > 0);
  }

  /** Get the current bearer token. */
  public getToken(): string | null {
    return this.bearerToken;
  }

  /** Manually set a bearer token (e.g. loaded from persistent storage). */
  public setToken(token: string | null): void {
    this.bearerToken = token ? token.trim() : null;
  }

  /**
   * Get HTTP headers for authenticated requests.
   * Throws AuthenticationError if no token is present.
   */
  public getAuthHeaders(): Record<string, string> {
    if (!this.bearerToken) {
      throw new AuthenticationError('No bearer token present. Perform pairing first via pair()');
    }

    return {
      'Authorization': `Bearer ${this.bearerToken}`,
      'User-Agent': this.userAgent,
    };
  }

  /**
   * Submit a one-time pairing code to exchange it for a bearer token.
   * Tries the enhanced `/api/pair` endpoint first, then falls back to `/pair`.
   *
   * @param pairingCode - The 6-digit code displayed in `zeroclaw gateway` stdout.
   * @returns PairResponse object containing the new bearer token.
   */
  public async pair(pairingCode: string): Promise<PairResponse> {
    const cleanCode = pairingCode.trim();

    if (!cleanCode) {
      throw new PairingError('Pairing code cannot be empty', 400);
    }

    // Try enhanced route first (POST /api/pair with JSON body)
    try {
      const response = await this.pairEnhanced(cleanCode);
      if (response.paired && response.token) {
        this.bearerToken = response.token;
        return response;
      }
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      // Fallback to legacy endpoint if enhanced endpoint fails
    }

    // Fallback route (POST /pair with X-Pairing-Code header)
    const response = await this.pairLegacy(cleanCode);
    if (response.paired && response.token) {
      this.bearerToken = response.token;
    }
    return response;
  }

  /** Primary pairing path: POST /api/pair */
  private async pairEnhanced(code: string): Promise<PairResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.gatewayUrl}/api/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
        },
        body: JSON.stringify({
          code,
          device_name: this.deviceName,
          device_type: this.deviceType,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const text = await res.text();
        const retryAfter = this.extractRetryAfter(res, text);
        throw new RateLimitError(retryAfter);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new PairingError(`Enhanced pairing failed (HTTP ${res.status}): ${text}`, res.status);
      }

      const data = (await res.json()) as PairResponse;
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Fallback pairing path: POST /pair */
  private async pairLegacy(code: string): Promise<PairResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.gatewayUrl}/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pairing-Code': code,
          'User-Agent': this.userAgent,
        },
        signal: controller.signal,
      });

      if (res.status === 429) {
        const text = await res.text();
        const retryAfter = this.extractRetryAfter(res, text);
        throw new RateLimitError(retryAfter);
      }

      if (res.status === 403) {
        throw new PairingError('Invalid pairing code. Double check the code printed in ZeroClaw terminal.', 403);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new PairingError(`Pairing failed (HTTP ${res.status}): ${text}`, res.status);
      }

      const data = (await res.json()) as PairResponse;
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractRetryAfter(res: Response, bodyText: string): number {
    const headerSecs = res.headers.get('retry-after');
    if (headerSecs) {
      const parsed = parseInt(headerSecs, 10);
      if (!isNaN(parsed)) return parsed;
    }

    try {
      const json = JSON.parse(bodyText);
      if (json.retry_after) return Number(json.retry_after);
    } catch {}

    return 60; // Default 60 seconds lockout
  }
}
