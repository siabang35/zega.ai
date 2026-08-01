/**
 * @zega/zeroclaw-bridge — Error Classes
 *
 * Structured error hierarchy for bridge operations.
 * Each error class maps to a specific failure domain so callers
 * can distinguish between network issues, auth failures, and
 * upstream daemon errors.
 */

/** Base error for all bridge operations. */
export class ZeroClawBridgeError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(message: string, code: string, options?: { statusCode?: number; retryable?: boolean; cause?: Error }) {
    super(message, { cause: options?.cause });
    this.name = 'ZeroClawBridgeError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable ?? false;
  }
}

/** Gateway is unreachable (connection refused, DNS failure, timeout). */
export class GatewayUnreachableError extends ZeroClawBridgeError {
  constructor(gatewayUrl: string, cause?: Error) {
    super(
      `ZeroClaw gateway unreachable at ${gatewayUrl}`,
      'GATEWAY_UNREACHABLE',
      { retryable: true, cause },
    );
    this.name = 'GatewayUnreachableError';
  }
}

/** Request timed out before the gateway responded. */
export class GatewayTimeoutError extends ZeroClawBridgeError {
  public readonly timeoutMs: number;

  constructor(gatewayUrl: string, timeoutMs: number, cause?: Error) {
    super(
      `ZeroClaw gateway at ${gatewayUrl} did not respond within ${timeoutMs}ms`,
      'GATEWAY_TIMEOUT',
      { retryable: true, cause },
    );
    this.name = 'GatewayTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/** Pairing code was invalid, expired, or too many attempts. */
export class PairingError extends ZeroClawBridgeError {
  public readonly retryAfterSecs?: number;

  constructor(message: string, statusCode: number, retryAfterSecs?: number) {
    super(message, 'PAIRING_FAILED', { statusCode, retryable: false });
    this.name = 'PairingError';
    this.retryAfterSecs = retryAfterSecs;
  }
}

/** Bearer token is missing, invalid, or revoked. */
export class AuthenticationError extends ZeroClawBridgeError {
  constructor(message: string = 'Unauthorized — bearer token is missing or invalid') {
    super(message, 'UNAUTHORIZED', { statusCode: 401, retryable: false });
    this.name = 'AuthenticationError';
  }
}

/** Rate limit exceeded (429). */
export class RateLimitError extends ZeroClawBridgeError {
  public readonly retryAfterSecs: number;

  constructor(retryAfterSecs: number) {
    super(
      `Rate limit exceeded. Retry after ${retryAfterSecs}s`,
      'RATE_LIMITED',
      { statusCode: 429, retryable: true },
    );
    this.name = 'RateLimitError';
    this.retryAfterSecs = retryAfterSecs;
  }
}

/** The running ZeroClaw version is not compatible with this bridge. */
export class VersionIncompatibleError extends ZeroClawBridgeError {
  public readonly detectedVersion: string;
  public readonly supportedRange: string;

  constructor(detectedVersion: string, supportedRange: string) {
    super(
      `ZeroClaw version ${detectedVersion} is not supported. This bridge requires ${supportedRange}`,
      'VERSION_INCOMPATIBLE',
      { retryable: false },
    );
    this.name = 'VersionIncompatibleError';
    this.detectedVersion = detectedVersion;
    this.supportedRange = supportedRange;
  }
}

/** Webhook request failed at the daemon level. */
export class WebhookError extends ZeroClawBridgeError {
  constructor(message: string, statusCode: number, cause?: Error) {
    super(message, 'WEBHOOK_FAILED', { statusCode, retryable: statusCode >= 500, cause });
    this.name = 'WebhookError';
  }
}
