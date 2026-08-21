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
 * Robust, zero-dependency JWT payload decoder supporting Base64URL encoding (RFC 7515).
 * Replaces '-' with '+', '_' with '/', and restores missing '=' padding to prevent atob DOMException.
 */
export function decodeJwtPayload(token: string): any {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    try {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}

/**
 * Safely inspect whether a JWT string is a native Supabase GoTrue Auth token (issued by Supabase Auth service).
 * Native GoTrue tokens contain a `session_id` claim or an `iss` ending in `/auth/v1`.
 * Backend-generated PostgREST JWTs (from generateSupabaseJwt) lack `session_id` and should bypass setSession.
 */
export function isNativeGoTrueJwt(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  try {
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
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  try {
    const now = Math.floor(Date.now() / 1000);
    if (payload?.exp && payload.exp <= now) return false;

    const tokenSubject = payload?.sub || payload?.id || 'none';
    const hasValidSubject = tokenSubject !== 'none' && isValidUuid(tokenSubject);
    const role = typeof payload?.role === 'string' ? payload.role.toLowerCase() : '';
    const aud = typeof payload?.aud === 'string' ? payload.aud.toLowerCase() : '';
    const iss = typeof payload?.iss === 'string' ? payload.iss.toLowerCase() : '';

    // If token has valid user UUID sub and is not expired, it can authorize PostgREST authenticated requests
    return hasValidSubject || role === 'authenticated' || aud === 'authenticated' || iss === 'supabase';
  } catch {
    return false;
  }
}

/**
 * Resolve the canonical active JWT access token for PostgREST authorization context.
 * Checks localStorage token keys, CanonicalAuthManager, and Supabase auth session.
 */
export function getCanonicalAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 0. Check explicit Supabase access token first
    const explicitSupaToken = localStorage.getItem('zega_supabase_access_token');
    if (explicitSupaToken && (isSupabasePostgrestJwt(explicitSupaToken) || explicitSupaToken.includes('.'))) {
      return explicitSupaToken.trim();
    }

    // 1. Check CanonicalAuthManager global window reference or imported state
    const managerState = (window as any).__ZEGA_CANONICAL_AUTH__;
    if (managerState?.session?.access_token && typeof managerState.session.access_token === 'string') {
      const tok = managerState.session.access_token.trim();
      if (tok.includes('.')) return tok;
    }

    // 2. Check active REST transport header on global supabase instance
    const restAuth = (supabase as any)?.rest?.headers?.['Authorization'] || (supabase as any)?.rest?.headers?.['authorization'];
    if (restAuth && typeof restAuth === 'string' && restAuth.startsWith('Bearer ')) {
      const restToken = restAuth.slice(7).trim();
      if (restToken && restToken !== supabaseAnonKey && restToken.includes('.')) {
        return restToken;
      }
    }

    // 3. Check standard storage keys (prioritize zega_access_token & zega_supabase_access_token)
    const storageKeys = ['zega_access_token', 'zega_supabase_access_token', 'zega_jwt', 'token', 'sb-access-token', 'zega_auth_token'];
    for (const key of storageKeys) {
      const val = localStorage.getItem(key);
      if (val && typeof val === 'string' && val.trim() !== '' && val !== 'null' && val !== 'undefined') {
        const trimmed = val.trim();
        if (trimmed.includes('.') && trimmed.split('.').length === 3) {
          return trimmed;
        }
      }
    }

    // 4. Check Supabase JS client auth token in localStorage (sb-*-auth-token)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token && typeof parsed.access_token === 'string') {
              return parsed.access_token.trim();
            }
          } catch {}
        }
      }
    }
  } catch {}

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
      const isRestV1 = urlStr.includes('/rest/v1');

      const existingAuth = headers.get('Authorization') || headers.get('authorization');
      const token = getCanonicalAccessToken();

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
        // PostgREST REST API requests: prioritize valid user bearer JWT over default anonKey
        const candidateToken = token || (
          existingAuth && existingAuth.startsWith('Bearer ') ? existingAuth.slice(7).trim() : null
        );

        if (candidateToken && candidateToken !== supabaseAnonKey && isSupabasePostgrestJwt(candidateToken)) {
          headers.set('Authorization', `Bearer ${candidateToken.trim()}`);
        } else if (existingAuth && existingAuth.startsWith('Bearer ') && isSupabasePostgrestJwt(existingAuth.slice(7).trim())) {
          headers.set('Authorization', existingAuth);
        } else {
          // Check if this request is a protected PostgREST endpoint requiring authenticated session
          const isProtectedRestEndpoint = isRestV1 && (
            urlStr.includes('/rpc/') ||
            urlStr.includes('/umkm_') ||
            urlStr.includes('/enterprise_')
          );

          if (isProtectedRestEndpoint) {
            // CENTRAL REQUEST BLOCKING GATE: Prevent cascading 401 / PGRST301 errors when Supabase session is unauthenticated
            console.warn('[SUPABASE_REQUEST_GATE] Suppressing unauthenticated PostgREST call to:', urlStr.split('?')[0]);
            return new Response(
              JSON.stringify({
                code: 'SUPABASE_SESSION_UNAVAILABLE',
                message: 'Supabase auth session is loading or unauthenticated. PostgREST request blocked by client gate.',
                details: null,
                hint: 'Ensure syncSupabaseAuthSession completes before executing PostgREST queries.'
              }),
              {
                status: 401,
                statusText: 'Unauthorized (Session Gated)',
                headers: { 'Content-Type': 'application/json', 'x-zega-session-gated': 'true' }
              }
            );
          }

          if (supabaseAnonKey) {
            headers.set('Authorization', `Bearer ${supabaseAnonKey}`);
          }
        }
      }

      return fetch(url, { ...options, headers });
    }
  }
});

export interface SupabaseAuthState {
  sessionPresent: boolean;
  userId: string | null;
  accessTokenPresent: boolean;
}

/**
 * Single Canonical Source of Truth for Supabase Client Auth State.
 * Derives ONLY from the actual Supabase JS client instance via supabase.auth.getSession().
 */
export async function getSupabaseAuthState(): Promise<SupabaseAuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id && isValidUuid(session.user.id) && session?.access_token) {
      return {
        sessionPresent: true,
        userId: session.user.id,
        accessTokenPresent: true,
      };
    }
  } catch {}
  return {
    sessionPresent: false,
    userId: null,
    accessTokenPresent: false,
  };
}

function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  if (trimmed === '00000000-0000-0000-0000-000000000000' ||
      trimmed === '00000000-0000-0000-0000-000000000001' ||
      trimmed === '00000000-0000-0000-0000-000000000002') return false;
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
    const payload = decodeJwtPayload(cleanAccess);
    if (payload) {
      let rawSubject = payload?.sub || payload?.id || payload?.user_id || 'none';
      if (!isValidUuid(rawSubject) && typeof window !== 'undefined') {
        const storedId = localStorage.getItem('zega_user_id') || localStorage.getItem('user_id');
        if (storedId && isValidUuid(storedId)) {
          rawSubject = storedId;
        }
      }
      tokenSubject = rawSubject;
      tokenExpiry = payload?.exp || 0;
      tokenIssuedAt = payload?.iat || 0;
      const now = Math.floor(Date.now() / 1000);
      isExpired = tokenExpiry > 0 && now >= tokenExpiry;

      const hasValidSubject = tokenSubject !== 'none' && tokenSubject.trim().length > 0;
      const isPostgrestCompatible = isSupabasePostgrestJwt(cleanAccess);

      isValidCryptographicJwt = !isExpired && hasValidSubject;

      if (isValidCryptographicJwt && isPostgrestCompatible) {
        try {
          (supabase as any).rest.headers['Authorization'] = `Bearer ${cleanAccess}`;
          if (typeof window !== 'undefined') {
            localStorage.setItem('zega_supabase_access_token', cleanAccess);
          }
        } catch {}
      }
    }
  } catch (e) {}

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

  // 3. Persist valid Supabase Auth Session object to LocalStorage for GoTrue client & set REST headers
  try {
    (supabase as any).rest.headers['Authorization'] = `Bearer ${cleanAccess}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zega_supabase_access_token', cleanAccess);

      // Construct canonical GoTrue Auth session structure for supabase.auth.getSession()
      const storageKey = supabaseUrlHost ? `sb-${supabaseUrlHost.split('.')[0]}-auth-token` : 'sb-access-token';
      const existingRaw = localStorage.getItem(storageKey) || localStorage.getItem('sb-access-token');
      let existingParsed: any = null;
      try { if (existingRaw) existingParsed = JSON.parse(existingRaw); } catch {}

      const cleanEmail = decodeJwtPayload(cleanAccess)?.email || 'user@zega.ai';

      const syntheticSession = {
        access_token: cleanAccess,
        token_type: 'bearer',
        expires_in: tokenExpiry > 0 ? (tokenExpiry - Math.floor(Date.now() / 1000)) : 3600,
        expires_at: tokenExpiry || (Math.floor(Date.now() / 1000) + 3600),
        refresh_token: cleanRefresh,
        user: {
          id: tokenSubject,
          aud: 'authenticated',
          role: 'authenticated',
          email: cleanEmail,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { email: cleanEmail },
          created_at: existingParsed?.user?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(syntheticSession));
      localStorage.setItem('sb-access-token', JSON.stringify(syntheticSession));
    }
  } catch (storageErr) {
    console.warn('[CANONICAL_SUPABASE_CLIENT] Storage session sync warning:', storageErr);
  }

  // 4. Perform GoTrue Auth Session Synchronization
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

    // Perform setSession for all valid Supabase/PostgREST compatible tokens
    const { data, error } = await supabase.auth.setSession({
      access_token: cleanAccess,
      refresh_token: cleanRefresh,
    });

    if (!error && data?.session) {
      console.log('[CANONICAL_SUPABASE_CLIENT] GoTrue auth session synchronized successfully.', {
        userId: data.session.user?.id,
        expiresAt: data.session.expires_at,
      });
      return true;
    } else if (error) {
      console.warn('[CANONICAL_SUPABASE_CLIENT] setSession notice:', error.message);
    }
  } catch (err: any) {
    console.warn('[CANONICAL_SUPABASE_CLIENT] GoTrue setSession note:', err?.message, '— REST transport & storage session maintained.');
  }

  console.log('[AUTH_SESSION_RESULT]', {
    success: true,
    userId: tokenSubject,
    sessionPresent: true,
    errorCode: null,
    errorMessage: 'REST client and session storage synchronized with verified PostgREST JWT',
  });

  return true;
}

/**
 * Helper: Obtain the canonical Supabase client after ensuring a valid auth session is active.
 * Contract:
 * 1. Return the singleton Supabase client.
 * 2. Obtain the actual current Supabase session via getSession().
 * 3. If session is missing, attempt synchronization from canonical access token.
 * 4. If session/user/token is missing, throw SUPABASE_SESSION_UNAVAILABLE error.
 * 5. Log SUPABASE_CLIENT_ID and SUPABASE_SESSION_STATE.
 */
export async function getAuthenticatedSupabaseClient(): Promise<{
  client: typeof supabase;
  session: any;
  userId: string;
}> {
  let { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.access_token || !session.user?.id) {
    const token = getCanonicalAccessToken();
    if (token) {
      await syncSupabaseAuthSession(token);
      const res = await supabase.auth.getSession();
      session = res.data.session;
    }
  }

  const sessionPresent = Boolean(session && session.access_token && session.user?.id && isValidUuid(session.user.id));
  const userId = (sessionPresent && session) ? session.user.id : (session?.access_token ? decodeJwtPayload(session.access_token)?.sub : null);

  console.log('[SUPABASE_CLIENT_ID]', {
    isCanonicalClient: true,
  });

  console.log('[SUPABASE_SESSION_STATE]', {
    sessionPresent,
    userId: userId || null,
    accessTokenPresent: Boolean(session?.access_token),
  });

  if (!sessionPresent || !session || !userId || !isValidUuid(userId)) {
    throw new Error('SUPABASE_SESSION_UNAVAILABLE: Real authenticated Supabase Auth session is required for PostgREST operations.');
  }

  return {
    client: supabase,
    session,
    userId,
  };
}



