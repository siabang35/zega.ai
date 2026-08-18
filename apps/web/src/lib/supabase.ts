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

// Auto-cleanup stale/expired Supabase auth session tokens from localStorage
if (typeof window !== 'undefined') {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
              console.log('[Supabase Client] Cleared expired auth session token from localStorage:', key);
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch {}
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
    }
  }
});

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

