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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://ikxiclpvywxxnkcaldbx.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

export const supabaseUrlHost = (() => {
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return 'ikxiclpvywxxnkcaldbx.supabase.co';
  }
})();

// Note: Supabase JS client handles autoRefreshToken natively via persistSession.
// We NEVER manually purge sb-*-auth-token from localStorage on startup, as doing so
// destroys the refresh_token and causes session loss (leading to 401 / 42501 errors).


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
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

  // Set default REST header authorization as fallback for PostgREST queries
  try {
    (supabase as any).rest.headers['Authorization'] = `Bearer ${cleanAccess}`;
  } catch {}

  // 1. Inspect JWT payload for safe diagnostics and token issuer validation
  let tokenIssuer = 'unknown';
  let tokenAudience = 'unknown';
  let tokenSubject = 'none';
  let tokenExpiry = 0;
  let tokenIssuedAt = 0;
  let isExpired = false;
  let isSupabaseIssuer = false;

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

        // Valid Supabase Auth tokens for this project MUST have iss matching Supabase Auth URL / path / "supabase"
        const expectedHost = supabaseUrlHost || 'ikxiclpvywxxnkcaldbx.supabase.co';
        const cleanIssuer = typeof tokenIssuer === 'string' ? tokenIssuer.toLowerCase() : '';
        isSupabaseIssuer = (
          cleanIssuer.includes(expectedHost.toLowerCase()) ||
          cleanIssuer.includes('/auth/v1') ||
          cleanIssuer === 'supabase' ||
          cleanIssuer.includes('supabase')
        ) && !cleanIssuer.includes('privy');
      }
    }
  } catch (e) {}

  // Diagnostic Forensic Logging (Safe metadata only, NEVER print token itself)
  console.log('[AUTH_TOKEN_FORENSIC]', {
    source: 'syncSupabaseAuthSession',
    issuer: tokenIssuer,
    audience: tokenAudience,
    subject: tokenSubject !== 'none' ? `${tokenSubject.slice(0, 8)}...` : 'none',
    expiresAt: tokenExpiry,
    issuedAt: tokenIssuedAt,
    isExpired,
    isSupabaseIssuer,
    tokenPresent: Boolean(cleanAccess),
    tokenLength: cleanAccess.length,
  });

  // 2. Bypass setSession if token was not issued directly by Supabase Auth for this project
  if (!isSupabaseIssuer) {
    console.log('[CANONICAL_SUPABASE_CLIENT] External or Non-Supabase Auth JWT detected (iss:', tokenIssuer, '). Bypassing setSession.');
    const hasValidSubject = tokenSubject !== 'none' && isValidUuid(tokenSubject);
    console.log('[AUTH_SESSION_RESULT]', {
      success: hasValidSubject,
      userId: tokenSubject !== 'none' ? tokenSubject : null,
      sessionPresent: false,
      errorCode: 'NON_SUPABASE_JWT',
      errorMessage: hasValidSubject ? 'Non-Supabase JWT with valid user identity attached' : 'Bypassed setSession for non-Supabase JWT',
    });
    // Return false for Supabase auth session sync if setSession was bypassed, ensuring sessionPresent remains false until exchanged
    return false;
  }

  try {
    // 3. Inspect existing session to avoid unnecessary setSession churn
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

    // 4. Pass genuine Supabase JWT into Supabase Auth Client
    const { data, error } = await supabase.auth.setSession({
      access_token: cleanAccess,
      refresh_token: cleanRefresh,
    });

    if (error) {
      console.warn('[CANONICAL_SUPABASE_CLIENT] setSession note:', error.message);
      console.log('[AUTH_SESSION_RESULT]', {
        success: false,
        userId: null,
        sessionPresent: false,
        errorCode: error.name || 'SETSESSION_ERROR',
        errorMessage: error.message,
      });
      // DO NOT call signOut() on setSession failure; simply retain local auth state
      return false;
    }

    if (data?.session) {
      console.log('[CANONICAL_SUPABASE_CLIENT] Auth session synchronized successfully.', {
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
    console.warn('[CANONICAL_SUPABASE_CLIENT] syncSupabaseAuthSession exception:', err?.message);
    console.log('[AUTH_SESSION_RESULT]', {
      success: false,
      userId: null,
      sessionPresent: false,
      errorCode: 'EXCEPTION',
      errorMessage: err?.message || 'Unknown exception',
    });
  }

  return false;
}


