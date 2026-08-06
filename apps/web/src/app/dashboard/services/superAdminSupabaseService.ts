import { supabase } from '../../../lib/supabase';

async function safeQuery<T>(builder: PromiseLike<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    const res = await builder;
    if (res?.error) return fallback;
    return (res?.data ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export const superAdminSupabaseService = {
  // 1. Fetch Realtime SuperAdmin Platform Data
  async getSuperAdminRealtimeData() {
    try {
      const [kpiRes, rootRes, tenantRes, threatRes, nodeRes] = await Promise.all([
        safeQuery<any>(supabase.from('superadmin_platform_kpis').select('*').limit(1).single(), null),
        safeQuery<any[]>(supabase.from('superadmin_root_accounts').select('*').order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('superadmin_tenant_registry').select('*').order('created_at', { ascending: false }), []),
        safeQuery<any[]>(supabase.from('superadmin_security_threat_logs').select('*').order('created_at', { ascending: false }).limit(20), []),
        safeQuery<any[]>(supabase.from('superadmin_infra_nodes').select('*').order('created_at', { ascending: true }), []),
      ]);

      return {
        kpis: kpiRes || null,
        rootAccounts: rootRes || [],
        tenants: tenantRes || [],
        threatLogs: threatRes || [],
        infraNodes: nodeRes || [],
        error: null
      };
    } catch (err: any) {
      return { kpis: null, rootAccounts: [], tenants: [], threatLogs: [], infraNodes: [], error: null };
    }
  },

  // 2. Realtime WebSocket updates on SuperAdmin tables
  subscribeToSuperAdminRealtime(onUpdate: (payload: any) => void) {
    try {
      const channel = supabase
        .channel('superadmin-realtime-global')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'superadmin_platform_kpis' }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'superadmin_security_threat_logs' }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'superadmin_infra_nodes' }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'superadmin_tenant_registry' }, onUpdate)
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch (e) { }
      };
    } catch (e) {
      return () => { };
    }
  },

  // 3. Platform Overview
  async getSuperAdminPlatformOverview() {
    try {
      const { data, error } = await supabase
        .from('platform_organizations')
        .select('*');

      if (error || !data) return { data: [], error };
      return { data, error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  // 4. Platform System Logs
  async getPlatformSystemLogs() {
    try {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) return { data: [], error };
      return { data, error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  }
};
