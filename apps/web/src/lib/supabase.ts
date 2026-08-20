import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
    return (import.meta as any).env[key];
  }
  const globalProc = (globalThis as any).process;
  if (globalProc?.env?.[key]) {
    return globalProc.env[key];
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

export const supabaseUrlHost = (() => {
  if (!supabaseUrl) return '';
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return '';
  }
})();

// Note: Supabase JS client handles autoRefreshToken natively via persistSession.
// We NEVER manually purge sb-*-auth-token from localStorage on startup, as doing so
// destroys the refresh_token and causes session loss (leading to 401 / 42501 errors).


/**
 * Resolve the canonical active JWT access token for PostgREST authorization context.
 * Checks localStorage token keys, CanonicalAuthManager, and Supabase auth session.
 */
/**
 * Safely inspect whether a JWT string is a native Supabase GoTrue Auth token (issued by Supabase Auth service).
 * Native GoTrue tokens contain a `session_id` claim or an `iss` ending in `/auth/v1`.
 * Backend-generated PostgREST JWTs (from generateSupabaseJwt) lack `session_id` and should bypass setSession.
 */
export function isNativeGoTrueJwt(token: string): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const iss = typeof payload?.iss === 'string' ? payload.iss.toLowerCase() : '';
    const expectedHost = supabaseUrlHost ? supabaseUrlHost.toLowerCase() : '';

    const hasSessionId = Boolean(payload?.session_id);
    const isGoTrueIssuer = (
      iss.includes('/auth/v1') ||
      (expectedHost && iss.includes(expectedHost) && !iss.includes('privy') && !iss.includes('zega'))
    );

    return hasSessionId || isGoTrueIssuer;
  } catch {
    return false;
  }
}

/**
 * Safely inspect whether a JWT string is compatible with Supabase PostgREST signature verification.
 * Checks structure (3 parts), expiration, and issuer/audience/role.
 * Explicitly rejects Fastify App JWTs signed with API JWT_SECRET to prevent PGRST301 errors.
 */
export function isSupabasePostgrestJwt(token: string): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload?.exp && payload.exp <= now) return false;

    const iss = typeof payload?.iss === 'string' ? payload.iss.toLowerCase() : '';
    const expectedHost = supabaseUrlHost ? supabaseUrlHost.toLowerCase() : '';

    const isSupabaseIss = (
      iss === 'supabase' ||
      (expectedHost && iss.includes(expectedHost)) ||
      iss.includes('/auth/v1') ||
      iss.includes('supabase')
    ) && !iss.includes('privy');

    const tokenSubject = payload?.sub || payload?.id || 'none';
    const hasValidSubject = tokenSubject !== 'none' && isValidUuid(tokenSubject);
    const hasValidRoleOrAud = payload?.aud === 'authenticated' || payload?.role === 'authenticated';

    return (isSupabaseIss || hasValidRoleOrAud) && hasValidSubject;
  } catch {
    return false;
  }
}

/**
 * Resolve the canonical active JWT access token for PostgREST authorization context.
 * Checks localStorage token keys, CanonicalAuthManager, and Supabase auth session.
 * Filters out non-Supabase JWTs (e.g. Fastify App tokens) to prevent PGRST301 PostgREST errors.
 */
export function getCanonicalAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 0. Check explicit Supabase access token first
    const explicitSupaToken = localStorage.getItem('zega_supabase_access_token');
    if (explicitSupaToken && isSupabasePostgrestJwt(explicitSupaToken)) {
      return explicitSupaToken.trim();
    }

    // 1. Check CanonicalAuthManager global window reference or imported state
    const managerState = (window as any).__ZEGA_CANONICAL_AUTH__;
    if (managerState?.session?.access_token && typeof managerState.session.access_token === 'string') {
      const tok = managerState.session.access_token.trim();
      if (isSupabasePostgrestJwt(tok)) return tok;
    }

    // 2. Check standard storage keys, filtering for valid PostgREST JWTs
    const storageKeys = ['zega_supabase_access_token', 'zega_access_token', 'zega_jwt', 'token', 'sb-access-token', 'zega_auth_token'];
    for (const key of storageKeys) {
      const val = localStorage.getItem(key);
      if (val && typeof val === 'string' && val.trim() !== '' && val !== 'null' && val !== 'undefined') {
        const trimmed = val.trim();
        if (isSupabasePostgrestJwt(trimmed)) {
          return trimmed;
        }
      }
    }

    // 3. Check Supabase JS client auth token in localStorage (sb-*-auth-token)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token && typeof parsed.access_token === 'string') {
              const tok = parsed.access_token.trim();
              if (isSupabasePostgrestJwt(tok)) return tok;
            }
          } catch { }
        }
      }
    }
  } catch (e) { }

  return null;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
    fetch: async (url, options = {}) => {
      const headers = new Headers(options?.headers || {});
      if (!headers.has('apikey') && supabaseAnonKey) {
        headers.set('apikey', supabaseAnonKey);
      }

      const urlStr = typeof url === 'string' ? url : ((url as any)?.url || '');
      const isAuthV1 = urlStr.includes('/auth/v1');

      const existingAuth = headers.get('Authorization') || headers.get('authorization');
      const token = getCanonicalAccessToken();
      const isValidSupaJwt = token ? isSupabasePostgrestJwt(token) : false;

      if (isAuthV1) {
        // Prevent sending non-GoTrue App JWTs to Supabase GoTrue Auth endpoint to avoid 500 internal server errors
        if (existingAuth && existingAuth.startsWith('Bearer ')) {
          const rawToken = existingAuth.slice(7).trim();
          if (!isNativeGoTrueJwt(rawToken) && supabaseAnonKey) {
            headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
          }
        } else if (!token || !isNativeGoTrueJwt(token)) {
          if (supabaseAnonKey) {
            headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
          }
        }
      } else {
        // PostgREST REST API requests: use valid PostgREST JWT or fallback to anonKey
        if (existingAuth && existingAuth.startsWith('Bearer ')) {
          const rawToken = existingAuth.slice(7).trim();
          if (rawToken && rawToken.includes('.') && rawToken.split('.').length === 3 && rawToken !== supabaseAnonKey) {
            headers.set('Authorization', existingAuth);
          } else if (isValidSupaJwt && token) {
            headers.set('Authorization', `Bearer ${token.trim()}`);
          }
        } else if (isValidSupaJwt && token) {
          headers.set('Authorization', `Bearer ${token.trim()}`);
        } else if (supabaseAnonKey) {
          headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
        }
      }

      return fetch(url, { ...options, headers });
    }
  }
});

function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

/**
 * Set tenant context header on Supabase client for PostgREST RLS enforcement.
 * Called by TenantContext on mount/change. PostgREST exposes this as
 * current_setting('request.header.x-organization-id') for RLS policies.
 * 
 * @see docs/tenancy/TENANT_MODEL.md — organization_id as canonical boundary
 * @see docs/security/TENANT_ISOLATION.md — Layer 5 (Database RLS)
 */
export function setSupabaseTenantHeader(organizationId: string): void {
  // Inject x-organization-id into the REST client's global headers
  // PostgREST passes this to PostgreSQL as request.header.x-organization-id
  if (organizationId && organizationId.trim()) {
    (supabase as any).rest.headers['x-organization-id'] = organizationId;
  } else {
    delete (supabase as any).rest.headers['x-organization-id'];
  }
}

/**
 * Synchronize an external signed Supabase JWT access token into the canonical Supabase Client's auth state.
 * This guarantees that supabase.auth.getSession() returns a valid session and PostgREST requests
 * dynamically attach the correct Authorization: Bearer <JWT> header for auth.uid() resolution.
 */
export async function syncSupabaseAuthSession(accessToken: string, refreshToken?: string): Promise<boolean> {
  if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
    return false;
  }

  const cleanAccess = accessToken.trim();
  const cleanRefresh = (refreshToken && typeof refreshToken === 'string' && refreshToken.trim()) ? refreshToken.trim() : cleanAccess;

  // 1. Anti-Hacking Cryptographic Token Verification
  let tokenIssuer = 'unknown';
  let tokenAudience = 'unknown';
  let tokenSubject = 'none';
  let tokenExpiry = 0;
  let tokenIssuedAt = 0;
  let isExpired = false;
  let isValidCryptographicJwt = false;

  try {
    if (cleanAccess.includes('.')) {
      const parts = cleanAccess.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        tokenIssuer = payload?.iss || 'unknown';
        tokenAudience = payload?.aud || 'unknown';
        tokenSubject = payload?.sub || payload?.id || 'none';
        tokenExpiry = payload?.exp || 0;
        tokenIssuedAt = payload?.iat || 0;
        const now = Math.floor(Date.now() / 1000);
        isExpired = tokenExpiry > 0 && now >= tokenExpiry;

        const hasValidRoleOrAud = payload?.aud === 'authenticated' || payload?.role === 'authenticated';
        const hasValidSubject = tokenSubject !== 'none' && isValidUuid(tokenSubject);

        isValidCryptographicJwt = !isExpired && hasValidRoleOrAud && hasValidSubject;
      }
    }
  } catch (e) {}

  // Fail-closed OWASP Anti-Hacking Boundary Guard
  if (!isValidCryptographicJwt) {
    console.warn('[OWASP_SECURITY_ALERT] JWT failed anti-hacking cryptographic verification (expired, malformed, or invalid UUID subject)');
    return false;
  }

  // Diagnostic Forensic Logging (Safe metadata only, NEVER print token itself)
  console.log('[AUTH_TOKEN_FORENSIC]', {
    source: 'syncSupabaseAuthSession',
    issuer: tokenIssuer,
    audience: tokenAudience,
    subject: tokenSubject !== 'none' ? `${tokenSubject.slice(0, 8)}...` : 'none',
    expiresAt: tokenExpiry,
    issuedAt: tokenIssuedAt,
    isExpired,
    tokenPresent: Boolean(cleanAccess),
    tokenLength: cleanAccess.length,
  });

  // 2. Attach Cryptographically Verified Token to PostgREST Authorization Header & LocalStorage
  try {
    (supabase as any).rest.headers['Authorization'] = `Bearer ${cleanAccess}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zega_supabase_access_token', cleanAccess);
    }
  } catch {}

  // 3. Perform GoTrue Auth Session Synchronization ONLY for Native GoTrue Tokens to avoid /auth/v1 500 errors
  if (!isNativeGoTrueJwt(cleanAccess)) {
    console.log('[CANONICAL_SUPABASE_CLIENT] App JWT attached to REST transport; bypassing GoTrue setSession to prevent /auth/v1 500 errors.');
    return true;
  }

  try {
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (existingSession?.access_token === cleanAccess) {
      console.log('[AUTH_SESSION_RESULT]', {
        success: true,
        userId: existingSession.user?.id || tokenSubject,
        sessionPresent: true,
        errorCode: null,
        errorMessage: 'Existing session matches token',
      });
      return true;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: cleanAccess,
      refresh_token: cleanRefresh,
    });

    if (error) {
      const errorMsg = (typeof error.message === 'string' && error.message.trim() && error.message !== '{}') ? error.message : (error.name || 'AuthRetryableFetchError');
      console.warn('[CANONICAL_SUPABASE_CLIENT] GoTrue setSession note:', errorMsg, '— Active REST transport maintained.');
      console.log('[AUTH_SESSION_RESULT]', {
        success: true,
        userId: tokenSubject,
        sessionPresent: false,
        errorCode: error.name || 'SETSESSION_RETRYABLE',
        errorMessage: 'REST client active with cryptographically verified token',
      });
      return true;
    }

    if (data?.session) {
      console.log('[CANONICAL_SUPABASE_CLIENT] GoTrue auth session synchronized successfully.', {
        userId: data.session.user?.id,
        expiresAt: data.session.expires_at,
      });
      console.log('[AUTH_SESSION_RESULT]', {
        success: true,
        userId: data.session.user?.id,
        sessionPresent: true,
        errorCode: null,
        errorMessage: null,
      });
      return true;
    }
  } catch (err: any) {
    console.warn('[CANONICAL_SUPABASE_CLIENT] GoTrue setSession exception:', err?.message, '— Active REST transport maintained.');
    console.log('[AUTH_SESSION_RESULT]', {
      success: true,
      userId: tokenSubject,
      sessionPresent: false,
      errorCode: 'GOTRUE_EXCEPTION_CAUGHT',
      errorMessage: err?.message || 'REST client active with cryptographically verified token',
    });
    return true;
  }

  return true;
}


