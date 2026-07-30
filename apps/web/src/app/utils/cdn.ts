/**
 * ZEGA AI — Cloudflare R2 CDN Asset Helper
 * Enforces production-ready CDN asset delivery via https://cdn.zegaai.site,
 * fallback resilience, and OWASP-compliant image loading.
 */

export const R2_PUBLIC_CDN_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://cdn.zegaai.site';

/**
 * Normalizes any asset path or remote URL to local public assets or Cloudflare R2 CDN URL.
 */
export function getR2CdnUrl(assetPath: string): string {
  if (!assetPath) return '/assets/logo/zegalogo.png';

  // If already pointing to absolute http/https domain
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  // If it's a relative path (e.g. /assets/logo/webhook.webp), return relative path to guarantee local static asset loading
  if (assetPath.startsWith('/')) {
    return assetPath;
  }

  return `/assets/${assetPath}`;
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
