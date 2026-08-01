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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
