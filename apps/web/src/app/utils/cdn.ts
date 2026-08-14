/**
 * ZEGA AI — Cloudflare R2 CDN Asset Helper
 * Enforces production-ready CDN asset delivery via https://cdn.zegaai.site,
 * fallback resilience, and OWASP-compliant image loading.
 */

export const R2_PUBLIC_CDN_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://cdn.zegaai.site';

/**
 * Normalizes any asset path or remote URL to local public assets or Cloudflare R2 CDN URL.
 */
export function getR2CdnUrl(assetPath: string, preferRemote = false): string {
  if (!assetPath) return `${R2_PUBLIC_CDN_DOMAIN}/assets/logo/zegalogo.png`;

  let cleanPath = assetPath;
  // If legacy R2 direct bucket URL is stored in database, strip protocol and domain
  if (cleanPath.includes('.r2.dev') || cleanPath.includes('pub-')) {
    cleanPath = cleanPath.replace(/^https?:\/\/[^\/]+/, '');
  }

  // If already pointing to an external absolute http/https domain or inline data/blob URI
  if (
    cleanPath.startsWith('http://') ||
    cleanPath.startsWith('https://') ||
    cleanPath.startsWith('data:') ||
    cleanPath.startsWith('blob:')
  ) {
    return cleanPath;
  }

  // Ensure clean leading slash
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  // If path doesn't start with /assets/ or /design/ or /videos/ or /images/, prefix /assets/
  if (
    !cleanPath.startsWith('/assets/') &&
    !cleanPath.startsWith('/design/') &&
    !cleanPath.startsWith('/videos/') &&
    !cleanPath.startsWith('/images/')
  ) {
    cleanPath = `/assets${cleanPath}`;
  }

  // Always force Cloudflare R2 CDN URL resolution (https://cdn.zegaai.site)
  return `${R2_PUBLIC_CDN_DOMAIN}${cleanPath}`;
}

/**
 * High-performance SVG Avatar Generator for fallback when remote images fail
 */
export function generateInitialsAvatar(name: string, bgGradient = 'linear-gradient(135deg, #7c3aed, #2563eb)'): string {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ZA';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#grad)" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="700" font-size="38">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 100% Fail-safe Vector USDC Brand Fallback SVG
 */
export function getUsdcSvgFallback(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="50" fill="#2775CA"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.4"/>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="800" font-size="44">$</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 100% Fail-safe Vector Solana Brand Fallback SVG
 */
export function getSolanaSvgFallback(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9945FF"/>
        <stop offset="50%" stop-color="#14F195"/>
        <stop offset="100%" stop-color="#00C2FF"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#solGrad)"/>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="900" font-size="40">S</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
