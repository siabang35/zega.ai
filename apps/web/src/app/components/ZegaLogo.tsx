import React from 'react';
import { R2_PUBLIC_CDN_DOMAIN } from '../utils/cdn';

interface ZegaLogoProps {
  size?: number | string;
  showText?: boolean;
  className?: string;
  imgClassName?: string;
  textClassName?: string;
}

/**
 * ZEGA AI — Official Brand Logo Component
 * Loads official PNG logo directly from Cloudflare R2 CDN (https://cdn.zegaai.site/assets/logo/zegalogo.png)
 * ensuring 100% CDN delivery, high performance, and dark mode adaptation.
 */
export function ZegaLogo({
  size = 40,
  showText = false,
  className = '',
  imgClassName = '',
  textClassName = '',
}: ZegaLogoProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const cdnLogoUrl = `${R2_PUBLIC_CDN_DOMAIN}/assets/logo/zegalogo.png`;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official ZEGA PNG Logo directly served from Cloudflare R2 CDN */}
      <img
        src={cdnLogoUrl}
        alt="ZEGA AI Logo"
        style={size && !imgClassName ? { height: pixelSize, width: 'auto' } : { width: 'auto' }}
        className={`h-8 sm:h-9.5 lg:h-11 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.2)] transition-[filter,transform] duration-300 hover:scale-102 ${imgClassName}`}
        loading="eager"
        decoding="async"
      />

      {showText && (
        <span
          className={`font-black tracking-tight text-foreground flex items-center ${textClassName}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span>ZEGA</span>
          <span className="ml-0.5 bg-gradient-to-r from-[#ff6b35] via-[#9b27d4] to-[#0ea5e9] bg-clip-text text-transparent">
            .AI
          </span>
        </span>
      )}
    </div>
  );
}

interface ZegaCopilotLogoProps {
  size?: number | string;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

/**
 * ZEGA Copilot — Official Brand Logo Component
 * Served directly from Cloudflare R2 CDN (https://cdn.zegaai.site/assets/logo/zega_copilot.png)
 */
export function ZegaCopilotLogo({
  size = 32,
  className = '',
  imgClassName = '',
  alt = 'ZEGA Copilot Logo',
}: ZegaCopilotLogoProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const cdnCopilotLogoUrl = `${R2_PUBLIC_CDN_DOMAIN}/assets/logo/zega_copilot.png`;

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={cdnCopilotLogoUrl}
        alt={alt}
        style={{ width: pixelSize, height: pixelSize }}
        className={`object-contain transition-transform duration-300 ${imgClassName}`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

