import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Create a Supabase client instance.
 * 
 * Usage:
 *   import { createSupabaseClient } from '@zega/supabase'
 *   const supabase = createSupabaseClient(url, anonKey)
 */
export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * Create a Supabase admin client (for server-side operations).
 * Uses the service role key — NEVER expose this on the client.
 */
export function createSupabaseAdmin(
  supabaseUrl: string,
  supabaseServiceKey: string,
) {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type { Database }
