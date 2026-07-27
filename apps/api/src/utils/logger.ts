import pino from 'pino';
import { envConfig } from '../config/env.js';

/**
 * ZEGA AI — Structured JSON Logger (Pino)
 *
 * All log entries include:
 * - Timestamp (ISO 8601)
 * - Log level
 * - Service name
 * - Message
 * - Optional context (request_id, agent_id, tenant_id, etc.)
 */
export const logger = pino({
  name: 'zega-api',
  level: envConfig.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      '*.api_key',
      '*.apiKey',
      '*.private_key',
      '*.privateKey',
    ],
    remove: true,
  },
});
