/**
 * @zega/zeroclaw-bridge — Gateway Client
 *
 * Central HTTP client for communicating with the ZeroClaw v0.8.x gateway daemon.
 * Features zero-crash resilience (graceful fallback on offline/timeouts),
 * structured error mapping, version compatibility checks, and multi-endpoint support.
 *
 * Upstream References:
 *   - /health                      (Public health check)
 *   - /pair & /api/pair            (Pairing & authentication)
 *   - /webhook                     (Agent prompt execution)
 *   - /api/health                  (Extended telemetry)
 *   - /api/devices                 (Paired device list)
 *   - /api/version/check           (Daemon version check)
 */

import { ZeroClawAuthManager } from './auth.js';
import {
  GatewayTimeoutError,
  GatewayUnreachableError,
  WebhookError,
  ZeroClawBridgeError,
} from './errors.js';
import {
  ApiHealthResponse,
  BridgeState,
  DeviceListResponse,
  HealthResponse,
  PairResponse,
  SessionListResponse,
  VersionCheckResponse,
  VersionCompatibility,
  WebhookResponse,
  ZeroClawBridgeOptions,
} from './types.js';
import { checkVersionCompatibility } from './version.js';

export class ZeroClawGatewayClient {
  private gatewayUrl: string;
  private timeoutMs: number;
  private maxRetries: number;
  private authManager: ZeroClawAuthManager;
  private userAgent: string;

  constructor(options: ZeroClawBridgeOptions = {}) {
    this.gatewayUrl = (options.gatewayUrl || 'http://127.0.0.1:4242').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || 5000;
    this.maxRetries = options.maxRetries ?? 2;
    this.userAgent = options.userAgent || 'ZEGA-ZeroClaw-Bridge/0.1.0';

    this.authManager = new ZeroClawAuthManager({
      gatewayUrl: this.gatewayUrl,
      bearerToken: options.bearerToken,
      deviceName: options.deviceName,
      deviceType: options.deviceType,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  // ── Authentication & Token Access ─────────────────────────────────────

  /** Whether the client holds a paired bearer token. */
  public isAuthenticated(): boolean {
    return this.authManager.isAuthenticated();
  }

  /** Get the active bearer token. */
  public getBearerToken(): string | null {
    return this.authManager.getToken();
  }

  /** Set bearer token manually. */
  public setBearerToken(token: string | null): void {
    this.authManager.setToken(token);
  }

  /** Pair with the gateway daemon using a 6-digit pairing code. */
  public async pair(pairingCode: string): Promise<PairResponse> {
    return this.authManager.pair(pairingCode);
  }

  // ── Core API Calls ───────────────────────────────────────────────────

  /**
   * GET /health — Always public health probe.
   * Returns daemon health, pairing status, and runtime snapshot.
   */
  public async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', { method: 'GET', requiresAuth: false });
  }

  /**
   * Check version compatibility of the running daemon.
   */
  public async checkVersionCompatibility(): Promise<VersionCompatibility> {
    try {
      const healthData = await this.health();
      const daemonVersion = (healthData as any)?.runtime?.version || '0.8.3';
      return checkVersionCompatibility(daemonVersion);
    } catch {
      return checkVersionCompatibility(null);
    }
  }

  /**
   * Get complete bridge state summary including health, version, and component status.
   */
  public async getState(): Promise<BridgeState> {
    try {
      const healthData = await this.health();
      const components = healthData.runtime?.components || {};
      const versionComp = await this.checkVersionCompatibility();

      return {
        status: this.authManager.isAuthenticated() ? 'paired' : 'connecting',
        gatewayUrl: this.gatewayUrl,
        daemonVersion: versionComp.currentVersion || 'v0.8.3',
        paired: healthData.paired,
        lastHealthCheck: new Date().toISOString(),
        lastError: null,
        uptimeSeconds: healthData.runtime?.uptime_seconds || 0,
        components,
      };
    } catch (err: any) {
      return {
        status: 'error',
        gatewayUrl: this.gatewayUrl,
        daemonVersion: null,
        paired: false,
        lastHealthCheck: new Date().toISOString(),
        lastError: err.message || 'Gateway unreachable',
        uptimeSeconds: null,
        components: {},
      };
    }
  }

  /**
   * POST /webhook — Forward prompt to ZeroClaw agent runtime.
   *
   * @param message - User prompt or command string.
   * @param agentAlias - Optional agent alias (e.g. 'researcher').
   */
  public async webhook(message: string, agentAlias?: string): Promise<WebhookResponse> {
    const query = agentAlias ? `?agent=${encodeURIComponent(agentAlias)}` : '';
    const url = `/webhook${query}`;

    try {
      const res = await this.request<WebhookResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        requiresAuth: true,
      });
      return res;
    } catch (err: any) {
      if (err instanceof ZeroClawBridgeError) throw err;
      throw new WebhookError(`Webhook execution failed: ${err.message}`, 500, err);
    }
  }

  /**
   * GET /api/health — Extended health & session telemetry (requires auth).
   */
  public async getExtendedHealth(): Promise<ApiHealthResponse> {
    return this.request<ApiHealthResponse>('/api/health', { method: 'GET', requiresAuth: true });
  }

  /**
   * GET /api/devices — List paired devices registered in gateway database (requires auth).
   */
  public async listDevices(): Promise<DeviceListResponse> {
    return this.request<DeviceListResponse>('/api/devices', { method: 'GET', requiresAuth: true });
  }

  /**
   * GET /api/sessions — List active agent chat sessions (requires auth).
   */
  public async listSessions(): Promise<SessionListResponse> {
    return this.request<SessionListResponse>('/api/sessions', { method: 'GET', requiresAuth: true });
  }

  /**
   * GET /api/version/check — Query upstream release version check (requires auth).
   */
  public async checkVersion(): Promise<VersionCheckResponse> {
    return this.request<VersionCheckResponse>('/api/version/check', { method: 'GET', requiresAuth: true });
  }

  // ── HTTP Fetch Helper with AbortController & Retry ───────────────────

  private async request<T>(
    endpoint: string,
    options: {
      method: string;
      headers?: Record<string, string>;
      body?: string;
      requiresAuth?: boolean;
    },
  ): Promise<T> {
    const url = `${this.gatewayUrl}${endpoint}`;
    let authHeaders: Record<string, string> = {};

    if (options.requiresAuth && this.authManager.isAuthenticated()) {
      authHeaders = this.authManager.getAuthHeaders();
    }

    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      ...authHeaders,
      ...options.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(url, {
          method: options.method,
          headers,
          body: options.body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          throw new ZeroClawBridgeError(
            `Gateway HTTP ${res.status} on ${endpoint}: ${errorText}`,
            'HTTP_ERROR',
            { statusCode: res.status, retryable: res.status >= 500 },
          );
        }

        const data = (await res.json()) as T;
        return data;
      } catch (err: any) {
        clearTimeout(timeout);
        lastError = err;

        if (err.name === 'AbortError') {
          lastError = new GatewayTimeoutError(this.gatewayUrl, this.timeoutMs, err);
        } else if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
          lastError = new GatewayUnreachableError(this.gatewayUrl, err);
        }

        // Do not retry non-retryable errors (e.g. 401, 403, 404, 400)
        if (err instanceof ZeroClawBridgeError && !err.retryable) {
          throw err;
        }

        if (attempt < this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 200; // Exponential backoff: 200ms, 400ms
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    throw lastError || new GatewayUnreachableError(this.gatewayUrl);
  }
}
