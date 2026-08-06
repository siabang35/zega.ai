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

export const umkmSupabaseService = {
  // Helper: Resolve CDN URLs for assets
  getCdnUrl(path?: string): string {
    if (!path) return '/assets/logo/zegalogo.png';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/design/') || path.startsWith('/assets/')) return path;
    const baseCdn = (import.meta.env.VITE_CDN_URL || '').replace(/\/$/, '');
    return baseCdn ? `${baseCdn}${path.startsWith('/') ? '' : '/'}${path}` : path;
  },

  // 1. Fetch Realtime UMKM Dashboard Data
  async getUmkmRealtimeData(storeId: string = '11111111-1111-1111-1111-111111111111') {
    try {
      const getCdnUrl = (path?: string) => this.getCdnUrl(path);

      const [storeRes, kpiRes, empRes, autoRes, timelineRes, intRes, knowRes] = await Promise.all([
        safeQuery<any>(supabase.from('umkm_stores').select('*').eq('id', storeId).maybeSingle(), null),
        safeQuery<any>(supabase.from('umkm_dashboard_kpis').select('*').eq('store_id', storeId).maybeSingle(), null),
        safeQuery<any[]>(supabase.from('umkm_ai_employees').select('*').eq('store_id', storeId).order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('umkm_automations').select('*').eq('store_id', storeId).order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('umkm_timeline_events').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).limit(10), []),
        safeQuery<any[]>(supabase.from('umkm_integrations').select('*').eq('store_id', storeId).order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('umkm_knowledge_docs').select('*').eq('store_id', storeId).order('created_at', { ascending: false }), []),
      ]);

      const store = storeRes ? {
        ...storeRes,
        logo_path: getCdnUrl(storeRes.logo_path),
        avatar_path: getCdnUrl(storeRes.avatar_path),
      } : null;

      return {
        store,
        kpis: kpiRes || null,
        aiEmployees: (empRes || []).map(emp => ({
          ...emp,
          avatar_path: getCdnUrl(emp.avatar_path)
        })),
        automations: autoRes || [],
        timelineEvents: timelineRes || [],
        integrations: (intRes || []).map(item => ({
          ...item,
          icon_url: getCdnUrl(item.icon_url)
        })),
        knowledgeDocs: knowRes || [],
        error: null
      };
    } catch (err: any) {
      return { store: null, kpis: null, aiEmployees: [], automations: [], timelineEvents: [], integrations: [], knowledgeDocs: [], error: null };
    }
  },

  // 2. Notifications Feed
  async getUmkmNotifications(storeId: string = '11111111-1111-1111-1111-111111111111') {
    try {
      const { data, error } = await supabase
        .from('umkm_notifications')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  },

  // 3. What's New Feed
  async getUmkmWhatsNew() {
    try {
      const { data, error } = await supabase
        .from('umkm_whats_new')
        .select('*')
        .eq('is_active', true)
        .order('release_date', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  },

  // 4. Stores List
  async getUmkmStores() {
    try {
      const { data, error } = await supabase
        .from('umkm_stores')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  },

  // 5. Update AI Employee Status
  async updateUmkmAiEmployeeStatus(employeeId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('umkm_ai_employees')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 6. Full Update AI Employee
  async updateUmkmAiEmployee(employeeId: string, payload: any) {
    try {
      const { data, error } = await supabase
        .from('umkm_ai_employees')
        .update({
          name: payload.name,
          agent_name: payload.name,
          role: payload.category || payload.role,
          role_title: payload.category || payload.role,
          category: payload.category || payload.role,
          description: payload.desc || payload.description,
          status: payload.status,
          capabilities: payload.capabilities,
          avatar_path: payload.avatar_path,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 7. Add / Deploy New AI Employee
  async addUmkmAiEmployee(storeId: string, payload: any) {
    try {
      const newAgentCode = payload.agent_code || `AGENT-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase
        .from('umkm_ai_employees')
        .insert({
          store_id: storeId,
          agent_code: newAgentCode,
          name: payload.name,
          agent_name: payload.name,
          role: payload.category || 'Support & Ops',
          role_title: payload.category || 'Specialist',
          category: payload.category || 'Support & Ops',
          description: payload.desc || 'Autonomous enterprise AI worker.',
          status: payload.status || 'active',
          avatar_path: payload.avatar_path || 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
          capabilities: payload.capabilities || ['WhatsApp API', 'Supabase RAG'],
          tasks_completed_today: 0,
          chats_solved: 0,
          chats_today: 0,
          resolution_rate: 98.5,
          avg_response_time_sec: 1.2,
          metrics: payload.metrics || {
            m1Label: 'Tasks Today',
            m1Val: '0 tasks',
            m2Label: 'Resolution Rate',
            m2Val: '98.5%',
            m3Label: 'Avg Response',
            m3Val: '1.2s'
          },
          sparkline_data: payload.sparkline_data || [{ v: 10 }, { v: 25 }, { v: 40 }, { v: 75 }, { v: 100 }]
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 8. Realtime WebSocket Subscription on UMKM tables
  subscribeToUmkmRealtime(storeId: string, onUpdate: (payload: any) => void) {
    try {
      const channel = supabase
        .channel(`umkm-realtime-${storeId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_stores', filter: `id=eq.${storeId}` }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_dashboard_kpis', filter: `store_id=eq.${storeId}` }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_ai_employees', filter: `store_id=eq.${storeId}` }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_automations', filter: `store_id=eq.${storeId}` }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_transactions', filter: `store_id=eq.${storeId}` }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_timeline_events', filter: `store_id=eq.${storeId}` }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_integrations', filter: `store_id=eq.${storeId}` }, onUpdate)
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch (e) { }
      };
    } catch (e) {
      return () => { };
    }
  },

  // 9. Automations Management
  async getUmkmAutomations(storeId: string = '11111111-1111-1111-1111-111111111111') {
    try {
      const { data, error } = await supabase
        .from('umkm_automations')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch (e) {
      return [];
    }
  },

  async toggleAutomationStatus(automationId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { data, error } = await supabase
        .from('umkm_automations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', automationId)
        .select()
        .single();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  },

  async createAutomation(storeId: string = '11111111-1111-1111-1111-111111111111', payload: any) {
    try {
      const insertData = {
        store_id: storeId,
        title: payload.title || 'New Workflow Automation',
        description: payload.description || 'Custom automated workflow trigger',
        trigger_event: payload.trigger_event || 'New Event Trigger',
        last_run: 'Just now',
        status: payload.status || 'active',
        success_rate: 100.00,
        workflow_steps: payload.workflow_steps || ['Event Trigger', 'AI Processor', 'Action Executed'],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('umkm_automations')
        .insert(insertData)
        .select()
        .single();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  },

  async deleteAutomation(automationId: string) {
    try {
      const { error } = await supabase
        .from('umkm_automations')
        .delete()
        .eq('id', automationId);

      return { success: !error, error };
    } catch (e: any) {
      return { success: false, error: e };
    }
  },

  // 10. Products & Sales Transactions
  async getUmkmProducts(orgId: string = 'umkm-org-01') {
    try {
      const { data, error } = await supabase
        .from('umkm_products')
        .select('*')
        .eq('org_id', orgId)
        .order('name', { ascending: true });

      if (error || !data) return { data: [], error };
      return { data, error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  async createUmkmProduct(product: any) {
    try {
      const { data, error } = await supabase
        .from('umkm_products')
        .insert(product)
        .select()
        .single();

      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async getUmkmSales(orgId: string = 'umkm-org-01') {
    try {
      const { data, error } = await supabase
        .from('umkm_sales_transactions')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error || !data) return { data: [], error };
      return { data, error: null };
    } catch (err: any) {
      return { data: [], error: err };
    }
  },

  async createUmkmSaleTransaction(transaction: any) {
    try {
      const { data, error } = await supabase
        .from('umkm_sales_transactions')
        .insert(transaction)
        .select()
        .single();

      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
};
