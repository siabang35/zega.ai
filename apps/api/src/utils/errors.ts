/**
 * ZEGA AI — Standardized Error Classes
 *
 * All errors follow a consistent JSON envelope pattern for API responses.
 * Each error class maps to a specific HTTP status code.
 */

export interface ZegaErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export class ZegaError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(payload: ZegaErrorPayload) {
    super(payload.message);
    this.name = 'ZegaError';
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.details = payload.details;
  }

  toJSON(): { success: false; error: ZegaErrorPayload } {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

// ── Concrete Error Classes ──

export class ValidationError extends ZegaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({ code: 'VALIDATION_ERROR', message, statusCode: 400, details });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ZegaError {
  constructor(message = 'Authentication required') {
    super({ code: 'AUTHENTICATION_REQUIRED', message, statusCode: 401 });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ZegaError {
  constructor(message = 'Insufficient permissions') {
    super({ code: 'AUTHORIZATION_DENIED', message, statusCode: 403 });
    this.name = 'AuthorizationError';
  }
}

export class PaymentRequiredError extends ZegaError {
  constructor(message = 'Payment required', details?: Record<string, unknown>) {
    super({ code: 'PAYMENT_REQUIRED', message, statusCode: 402, details });
    this.name = 'PaymentRequiredError';
  }
}

export class NotFoundError extends ZegaError {
  constructor(resource: string) {
    super({ code: 'RESOURCE_NOT_FOUND', message: `${resource} not found`, statusCode: 404 });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ZegaError {
  constructor(message: string) {
    super({ code: 'CONFLICT', message, statusCode: 409 });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ZegaError {
  constructor(retryAfter?: number) {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      statusCode: 429,
      details: retryAfter ? { retry_after_seconds: retryAfter } : undefined,
    });
    this.name = 'RateLimitError';
  }
}

export class InternalError extends ZegaError {
  constructor(message = 'Internal server error') {
    super({ code: 'INTERNAL_ERROR', message, statusCode: 500 });
    this.name = 'InternalError';
  }
}
