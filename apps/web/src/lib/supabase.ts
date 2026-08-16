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
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlreGljbHB2eXd4eG5rY2FsZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDA4NzcsImV4cCI6MjEwMDg3Njg3N30.vCQzR2ppnAxe7ugL6TTo1K5hqk6PdowjA59zDSf1dmo');

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
  (supabase as any).rest.headers['x-organization-id'] = organizationId;
  (supabase as any).realtime?.setAuth?.(undefined); // refresh realtime channel
}

