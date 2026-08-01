/**
 * @zega/zeroclaw-bridge — Entry Point
 *
 * Official TypeScript bridge client for ZeroClaw v0.8.x runtime daemons.
 * Provides resilient, type-safe communication between ZEGA AI services
 * and ZeroClaw gateway daemons.
 */

export { ZeroClawGatewayClient } from './client.js';
export { ZeroClawAuthManager } from './auth.js';
export * from './types.js';
export * from './errors.js';
export {
  MIN_SUPPORTED_VERSION,
  TARGET_SUPPORTED_VERSION,
  MAX_SUPPORTED_VERSION,
  parseSemVer,
  compareSemVer,
  checkVersionCompatibility,
} from './version.js';
