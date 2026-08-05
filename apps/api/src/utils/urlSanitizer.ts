/**
 * ZEGA AI — URL Sanitizer Utility
 *
 * Sanitizes URLs before logging or returning telemetry to prevent
 * accidental exposure of third-party API keys, bearer tokens, or query secrets.
 *
 * Examples:
 * - `https://solana-devnet.g.alchemy.com/v2/alch_O-QLJJeqpS3MpXj4k4VPd`
 *   -> `https://solana-devnet.g.alchemy.com/v2/alch_***`
 * - `https://devnet.helius-rpc.com/?api-key=22e1d47d-c5c3-4225-b949-187b19f03331`
 *   -> `https://devnet.helius-rpc.com/?api-key=***`
 */
export function sanitizeRpcUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  try {
    const parsed = new URL(rawUrl);

    // 1. Mask query parameter values (api-key, apiKey, key, token, secret, etc.)
    for (const param of Array.from(parsed.searchParams.keys())) {
      parsed.searchParams.set(param, '***');
    }

    // 2. Mask sensitive path segments (e.g. /v2/alch_... or /v1/<key>)
    const pathSegments = parsed.pathname.split('/');
    const sanitizedSegments = pathSegments.map((segment, idx) => {
      if (!segment) return segment;

      // Alchemy key format (starts with alch_)
      if (segment.startsWith('alch_')) {
        return 'alch_***';
      }

      // Check if previous segment is an API version endpoint like /v1, /v2, /v3, /rpc
      const prevSegment = pathSegments[idx - 1]?.toLowerCase();
      if (prevSegment && ['v1', 'v2', 'v3', 'rpc'].includes(prevSegment)) {
        if (segment.length > 6 || /[0-9a-fA-F_\-]{8,}/.test(segment)) {
          return '***';
        }
      }

      // Check if standalone segment looks like an API key (long hex/uuid/token)
      if (segment.length > 20 && /^[a-zA-Z0-9_\-]+$/.test(segment)) {
        return `${segment.substring(0, 4)}***`;
      }

      return segment;
    });

    parsed.pathname = sanitizedSegments.join('/');
    return parsed.toString();
  } catch {
    // Regex fallback if URL parsing fails
    return rawUrl
      .replace(/([?&](?:api-key|apiKey|key|token|secret|auth|pass)=)[^&]+/gi, '$1***')
      .replace(/(\/(?:v1|v2|v3|rpc)\/)(alch_[a-zA-Z0-9_\-]+|[a-zA-Z0-9_\-]{12,})/gi, '$1***');
  }
}
