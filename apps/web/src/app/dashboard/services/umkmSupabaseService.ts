import { supabase } from '../../../lib/supabase';
export { getActiveTenantIds } from '../contexts/TenantContext';
import { getActiveTenantIds, updateActiveTenantStore, updateActiveTenantOrg, updateActiveTenantWorkspace } from '../contexts/TenantContext';

/**
 * Extract the real user UUID (sub claim) from the backend-issued JWT
 * stored in localStorage. This is the DB profile ID from public.profiles.
 * Returns null if no valid JWT is available.
 */
function extractUserIdFromStoredJwt(): { userId: string | null; email: string | null } {
  try {
    // 1. Try accessToken from OTP verify response stored in mock session
    const mockStr = localStorage.getItem('zega_mock_session');
    if (mockStr) {
      const mock = JSON.parse(mockStr);
      if (mock?.accessToken && typeof mock.accessToken === 'string' && mock.accessToken.includes('.')) {
        const payload = JSON.parse(atob(mock.accessToken.split('.')[1]));
        const sub = payload?.sub;
        const email = payload?.email || mock?.email || null;
        if (sub && typeof sub === 'string' && sub.length > 10) {
          return { userId: sub, email };
        }
      }
      // Fallback: extract email from mock session even without JWT
      if (mock?.email) {
        return { userId: null, email: mock.email };
      }
    }

    // 2. Try standalone token keys
    const tokenKeys = ['zega_access_token', 'zega_jwt', 'token'];
    for (const key of tokenKeys) {
      const token = localStorage.getItem(key);
      if (token && token.includes('.')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.sub) return { userId: payload.sub, email: payload.email || null };
        } catch { /* skip invalid JWT */ }
      }
    }

    // 3. Try Supabase auth token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (parsed?.user?.id) {
            return { userId: parsed.user.id, email: parsed.user.email || null };
          }
        }
      }
    }
  } catch { /* non-blocking */ }
  return { userId: null, email: null };
}

export function isValidUuid(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed);
}

async function safeQuery<T>(builder: PromiseLike<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    const res = await builder;
    if (res?.error) return fallback;
    return (res?.data ?? fallback) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// IN-FLIGHT & CACHED RESOLUTIONS: Prevents provisioning storm from concurrent React effects
// ============================================================================
const _inflightResolutions = new Map<string, Promise<{ userId: string; organizationId: string; workspaceId: string; storeId: string | null }>>();
const _resolvedStoresCache = new Map<string, { userId: string; organizationId: string; workspaceId: string; storeId: string | null; timestamp: number }>();
const CACHE_TTL_MS = 30000; // 30 seconds cache

/** Session-level guard: tracks organization IDs where provisioning has already been attempted. */
const _provisioningAttempted = new Set<string>();

/**
 * Classify PostgREST / Supabase errors as structural (never retry) vs transient (may retry).
 * Structural errors: missing column (PGRST204), missing table/function (404), bad request (400).
 */
function isStructuralError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const status = err.status || err.statusCode || 0;
  const msg = (err.message || '').toLowerCase();
  // PGRST204: column not found in schema cache
  if (code === 'PGRST204' || code === 'PGRST301' || code === 'PGRST200') return true;
  // 404: function/table does not exist
  if (status === 404) return true;
  // 400: bad request (schema mismatch)
  if (status === 400 && (msg.includes('schema cache') || msg.includes('column') || msg.includes('not found'))) return true;
  return false;
}

export const umkmSupabaseService = {
  // Helper: Resolve CDN URLs for assets
  getCdnUrl(path?: string): string {
    const baseCdn = (import.meta.env.VITE_CDN_URL || import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'https://cdn.zegaai.site').replace(/\/$/, '');
    if (!path) return `${baseCdn}/assets/logo/zegalogo.png`;
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:') ||
      path.startsWith('blob:')
    ) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullPath = (cleanPath.startsWith('/assets/') || cleanPath.startsWith('/design/') || cleanPath.startsWith('/videos/') || cleanPath.startsWith('/images/'))
      ? cleanPath
      : `/assets${cleanPath}`;
    return `${baseCdn}${fullPath}`;
  },

  // Helper: Resolve dynamic authenticated Tenant Context (User -> Organization -> Workspace -> Store)
  // PURE RESOLVER with RPC fallback — queries by organization_id first, uses fn_ensure_store_for_organization RPC if store is missing.
  async getAuthenticatedTenantContext(providedStoreId?: string | null) {
    const active = getActiveTenantIds();
    let targetStoreId = providedStoreId || active.storeId || undefined;
    let targetOrgId = active.organizationId;
    const targetWsId = active.workspaceId;

    // Extract real user identity from backend JWT
    const jwtIdentity = extractUserIdFromStoredJwt();
    const rawUserId = jwtIdentity.userId || (isValidUuid(active.userId) ? active.userId : null);
    const userEmail = jwtIdentity.email || active.userEmail || null;
    const effectiveUserId = rawUserId || active.userId || userEmail || '';

    const authenticatedUserReady = !!effectiveUserId;
    const organizationReady = !!targetOrgId && targetOrgId !== '00000000-0000-0000-0000-000000000000';
    const organizationIdValid = organizationReady && isValidUuid(targetOrgId);

    // Pre-Auth & Org Guard: If user identity or organization context is not ready, keep store in loading or deferred
    if (!authenticatedUserReady || !organizationReady) {
      return {
        userId: effectiveUserId,
        organizationId: targetOrgId,
        workspaceId: targetWsId,
        storeId: null
      };
    }

    // 0. Check session cache first to prevent infinite RPC retries on re-renders
    const dedupeKey = `${targetOrgId}::${effectiveUserId}`;
    const cached = _resolvedStoresCache.get(dedupeKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS) && cached.storeId) {
      updateActiveTenantStore(cached.storeId, 'ready');
      return cached;
    }

    // In-flight deduplication: share in-flight resolution promise per organization and user
    const inflight = _inflightResolutions.get(dedupeKey);
    if (inflight) {
      return inflight;
    }

    const resolutionPromise = this._resolveStoreContext(
      targetOrgId, targetWsId, targetStoreId || null,
      rawUserId, userEmail, effectiveUserId,
      authenticatedUserReady, organizationReady, organizationIdValid
    );

    _inflightResolutions.set(dedupeKey, resolutionPromise);
    try {
      const res = await resolutionPromise;
      if (res.storeId) {
        _resolvedStoresCache.set(dedupeKey, { ...res, timestamp: Date.now() });
      }
      return res;
    } finally {
      _inflightResolutions.delete(dedupeKey);
    }
  },

  /** Internal: actual store resolution logic via organization_id query & RPC */
  async _resolveStoreContext(
    targetOrgId: string, targetWsId: string, targetStoreId: string | null,
    rawUserId: string | null, userEmail: string | null, effectiveUserId: string,
    authenticatedUserReady: boolean, organizationReady: boolean, organizationIdValid: boolean
  ) {
    try {
      // 1. Query stores strictly by organization_id (canonical tenant boundary)
      const { data: orgStores, error: orgErr } = await supabase
        .from('umkm_stores')
        .select('*')
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: true });

      if (orgErr) {
        console.error('[StoreContextResolver] Error querying umkm_stores:', orgErr.message, orgErr.code);
        if (isStructuralError(orgErr)) {
          updateActiveTenantStore(null, 'error');
          return { userId: effectiveUserId, organizationId: targetOrgId, workspaceId: targetWsId, storeId: null };
        }
      }

      if (orgStores && orgStores.length > 0) {
        let selected = orgStores[0];
        if (targetStoreId && isValidUuid(targetStoreId)) {
          const matched = orgStores.find((s: any) => s.id === targetStoreId || s.store_id === targetStoreId);
          if (matched) selected = matched;
        }

        const selectedStoreId = selected.id || selected.store_id;
        const selectedWorkspaceId = selected.workspace_id || targetWsId;

        console.log('[StoreContextResolver]', {
          phase: 'STORE_READY',
          organizationId: targetOrgId,
          workspaceId: selectedWorkspaceId,
          storeId: selectedStoreId,
          storesCount: orgStores.length
        });

        updateActiveTenantStore(selectedStoreId, 'ready');
        if (selectedWorkspaceId && isValidUuid(selectedWorkspaceId)) {
          updateActiveTenantWorkspace(selectedWorkspaceId);
        }

        return {
          userId: effectiveUserId,
          organizationId: targetOrgId,
          workspaceId: selectedWorkspaceId,
          storeId: selectedStoreId
        };
      }

      // 2. Provisioning check & RPC call
      if (!_provisioningAttempted.has(targetOrgId)) {
        _provisioningAttempted.add(targetOrgId);
        console.log('[StoreContextResolver] Calling fn_ensure_store_for_organization RPC for org:', targetOrgId);
        const { data: rpcRes, error: rpcErr } = await supabase
          .rpc('fn_ensure_store_for_organization', { p_org_id: targetOrgId });

        if (!rpcErr && rpcRes && rpcRes.storeId) {
          console.log('[StoreContextResolver] Store provisioned/resolved via RPC successfully:', rpcRes);
          updateActiveTenantStore(rpcRes.storeId, 'ready');
          if (rpcRes.workspaceId && isValidUuid(rpcRes.workspaceId)) {
            updateActiveTenantWorkspace(rpcRes.workspaceId);
          }
          return {
            userId: effectiveUserId,
            organizationId: targetOrgId,
            workspaceId: rpcRes.workspaceId || targetWsId,
            storeId: rpcRes.storeId
          };
        }

        if (rpcErr) {
          console.warn('[StoreContextResolver] fn_ensure_store_for_organization RPC returned error:', rpcErr.message, rpcErr.code);
        }
      }

      // 3. Unresolved Context: If store could not be resolved or provisioned, return storeId: null strictly (no cross-tenant fallbacks)
      console.warn('[StoreContextResolver] STORE_UNAVAILABLE: Store could not be resolved for organization:', targetOrgId);
      updateActiveTenantStore(null, 'error');
      return {
        userId: effectiveUserId,
        organizationId: targetOrgId,
        workspaceId: targetWsId,
        storeId: null
      };

    } catch (err: any) {
      console.error('[StoreContextResolver] Exception during store context resolution:', err?.message || err);
      updateActiveTenantStore(null, 'error');
      return {
        userId: effectiveUserId,
        organizationId: targetOrgId,
        workspaceId: targetWsId,
        storeId: null
      };
    }
  },

  // Helper: Resolve dynamic authenticated store ID
  async getAuthenticatedStoreId(providedStoreId?: string | null): Promise<string | null> {
    const ctx = await this.getAuthenticatedTenantContext(providedStoreId);
    return ctx.storeId;
  },

  // 1. Fetch Realtime UMKM Dashboard Data
  async getUmkmRealtimeData(providedStoreId?: string) {
    try {
      const getCdnUrl = (path?: string) => this.getCdnUrl(path);
      const tenantCtx = await this.getAuthenticatedTenantContext(providedStoreId);
      const storeId = tenantCtx.storeId;

      if (!storeId) {
        return { tenantContext: tenantCtx, store: null, kpis: null, aiEmployees: [], automations: [], timelineEvents: [], transactions: [], integrations: [], knowledgeDocs: [], error: null };
      }

      const [storeRes, kpiRes, empRes, autoRes, timelineRes, intRes, knowRes, trxRes] = await Promise.all([
        safeQuery<any>(supabase.from('umkm_stores').select('*').eq('id', storeId).maybeSingle(), null),
        safeQuery<any>(supabase.from('umkm_dashboard_kpis').select('*').eq('store_id', storeId).maybeSingle(), null),
        safeQuery<any[]>(supabase.from('umkm_ai_employees').select('*').eq('store_id', storeId).order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('umkm_automations').select('*').eq('store_id', storeId).order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('umkm_timeline_events').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).limit(10), []),
        safeQuery<any[]>(supabase.from('umkm_integrations').select('*').eq('store_id', storeId).order('created_at', { ascending: true }), []),
        safeQuery<any[]>(supabase.from('umkm_knowledge_docs').select('*').eq('store_id', storeId).order('created_at', { ascending: false }), []),
        safeQuery<any[]>(supabase.from('umkm_transactions').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).limit(10), []),
      ]);

      const store = storeRes ? {
        ...storeRes,
        logo_path: getCdnUrl(storeRes.logo_path),
        avatar_path: getCdnUrl(storeRes.avatar_path),
      } : null;

      const kpis = kpiRes || null;

      return {
        tenantContext: tenantCtx,
        store,
        kpis,
        aiEmployees: (empRes || []).map(emp => ({
          ...emp,
          avatar_path: getCdnUrl(emp.avatar_path)
        })),
        automations: autoRes || [],
        timelineEvents: timelineRes || [],
        transactions: trxRes || [],
        integrations: (intRes || []).map(item => ({
          ...item,
          icon_url: getCdnUrl(item.icon_url)
        })),
        knowledgeDocs: knowRes || [],
        error: null
      };
    } catch (err: any) {
      return { tenantContext: null, store: null, kpis: null, aiEmployees: [], automations: [], timelineEvents: [], transactions: [], integrations: [], knowledgeDocs: [], error: err?.message || 'Failed to fetch realtime overview data' };
    }
  },

  // 1b. Fetch Dynamic Sales Summary (7d / 30d / 90d) via PostgreSQL Stored Procedure
  async getUmkmSalesSummary(providedStoreId?: string, days: number = 7) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId);
      const { data, error } = await supabase.rpc('fn_get_umkm_sales_summary', {
        p_store_id: storeId,
        p_days: days
      });

      if (error || !data || data.length === 0) return null;
      return data.map((row: any) => ({
        date: row.sales_date,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.orders) || 0
      }));
    } catch (err) {
      return null;
    }
  },

  // 2. Notifications Feed
  async getUmkmNotifications(providedStoreId?: string | null) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId || undefined);
      if (!storeId) {
        return { data: [], error: null };
      }
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

  // 6.1 Delete AI Employee
  async deleteUmkmAiEmployee(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('umkm_ai_employees')
        .delete()
        .eq('id', employeeId)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 7. Add / Deploy New AI Employee with Real LLM Engine Specs
  async addUmkmAiEmployee(providedStoreId?: string, payload: any = {}) {
    try {
      const tenantCtx = await this.getAuthenticatedTenantContext(providedStoreId);
      const storeId = tenantCtx.storeId;
      const newAgentCode = payload.agent_code || `AGENT-${Math.floor(1000 + Math.random() * 9000)}`;
      const cdnAvatar = this.getCdnUrl(payload.avatar_path || 'assets/visualization/ai-avatar.png');
      const { data, error } = await supabase
        .from('umkm_ai_employees')
        .insert({
          organization_id: tenantCtx.organizationId,
          workspace_id: tenantCtx.workspaceId,
          store_id: storeId,
          agent_code: newAgentCode,
          name: payload.name,
          agent_name: payload.name,
          role: payload.role || payload.category || 'Support & Ops',
          role_title: payload.role || payload.category || 'Specialist',
          category: payload.category || payload.role || 'Support & Ops',
          description: payload.desc || payload.description || 'Autonomous enterprise AI worker.',
          status: payload.status || 'working',
          model_engine: payload.model_engine || 'ZEGA-Swarm-Llama-3.3-70B',
          routing_strategy: payload.routing_strategy || '9Router-Auto-Cost-Optimizer',
          execution_gateway: payload.execution_gateway || 'ZeroClaw-Edge-Gateway',
          system_prompt: payload.system_prompt || 'You are an autonomous AI employee assisting UMKM operations.',
          temperature: payload.temperature ?? 0.7,
          max_tokens: payload.max_tokens ?? 4096,
          model_type: payload.model_type || 'llm_swarm',
          est_cost_per_1k_tokens: payload.est_cost_per_1k_tokens ?? 0.0005,
          avatar_path: cdnAvatar,
          cdn_avatar_url: cdnAvatar,
          capabilities: payload.capabilities || ['WhatsApp API', 'Supabase RAG', 'Live Analytics', '9Router Engine', 'ZeroClaw Gateway'],
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

      // Update KPI active agents count
      const { data: currentKpi } = await supabase.from('umkm_dashboard_kpis').select('tasks_completed_today, usage_percentage').eq('store_id', storeId).maybeSingle();
      await supabase.from('umkm_dashboard_kpis').upsert({
        organization_id: tenantCtx.organizationId,
        workspace_id: tenantCtx.workspaceId,
        store_id: storeId,
        tasks_completed_today: (currentKpi?.tasks_completed_today || 126) + 1,
        updated_at: new Date().toISOString()
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 7.1 Quick Action: Create Real Invoice Transaction
  async createUmkmInvoiceQuickAction(providedStoreId?: string, payload: { title: string; detail: string; amount: number } = { title: '', detail: '', amount: 0 }) {
    try {
      const tenantCtx = await this.getAuthenticatedTenantContext(providedStoreId);
      const storeId = tenantCtx.storeId;
      const invNum = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('umkm_transactions')
        .insert({
          organization_id: tenantCtx.organizationId,
          workspace_id: tenantCtx.workspaceId,
          store_id: storeId,
          transaction_code: invNum,
          customer_name: payload.title || 'General Customer',
          payment_method: 'QRIS / E-Wallet',
          amount_idr: payload.amount || 500000,
          status: 'confirmed',
          notes: payload.detail || 'Generated from Overview Quick Actions',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 7.2 Quick Action: Send Broadcast
  async sendUmkmBroadcastQuickAction(providedStoreId?: string, payload: { title: string; detail: string } = { title: '', detail: '' }) {
    try {
      const tenantCtx = await this.getAuthenticatedTenantContext(providedStoreId);
      const storeId = tenantCtx.storeId;
      const { data, error } = await supabase
        .from('umkm_timeline_events')
        .insert({
          organization_id: tenantCtx.organizationId,
          workspace_id: tenantCtx.workspaceId,
          store_id: storeId,
          event_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon_symbol: 'Send',
          title: 'Broadcast Sent',
          event_text: `WA Broadcast "${payload.title}" delivered to customers`,
          badge_label: 'Delivered',
          event_type: 'broadcast',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 7.3 Quick Action: Add Product to Catalog
  async addUmkmProductQuickAction(providedStoreId?: string, payload: { title: string; detail: string; amount: number } = { title: '', detail: '', amount: 0 }) {
    try {
      const tenantCtx = await this.getAuthenticatedTenantContext(providedStoreId);
      const storeId = tenantCtx.storeId;
      const { data, error } = await supabase
        .from('umkm_products')
        .insert({
          organization_id: tenantCtx.organizationId,
          workspace_id: tenantCtx.workspaceId,
          store_id: storeId,
          org_id: tenantCtx.organizationId,
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: payload.title || 'New Item',
          category: payload.detail || 'General',
          price: payload.amount || 150000,
          stock: 50,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log timeline event
      await supabase.from('umkm_timeline_events').insert({
        organization_id: tenantCtx.organizationId,
        workspace_id: tenantCtx.workspaceId,
        store_id: storeId,
        event_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon_symbol: 'ShoppingBag',
        title: 'Product Catalog Updated',
        event_text: `Added new product "${payload.title}" (${payload.amount ? 'Rp' + payload.amount.toLocaleString('id-ID') : 'Rp0'})`,
        badge_label: 'Catalog',
        event_type: 'inventory',
        created_at: new Date().toISOString()
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 8. Realtime WebSocket Subscription on UMKM tables
  subscribeToUmkmRealtime(storeId?: string | null, onUpdate?: (payload: any) => void) {
    if (!storeId || !onUpdate) return () => {};
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
  async getUmkmAutomations(providedStoreId?: string) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId);
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

  async createAutomation(providedStoreId?: string, payload: any = {}) {
    try {
      const tenantCtx = await this.getAuthenticatedTenantContext(providedStoreId);
      const storeId = tenantCtx.storeId;
      const insertData = {
        organization_id: tenantCtx.organizationId,
        workspace_id: tenantCtx.workspaceId,
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
  async getUmkmProducts(orgId?: string) {
    try {
      const resolvedOrgId = orgId || getActiveTenantIds().organizationId;
      if (!resolvedOrgId) return { data: [], error: 'Organization context unavailable' };
      const { data, error } = await supabase
        .from('umkm_products')
        .select('*')
        .eq('org_id', resolvedOrgId)
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

  async getUmkmSales(orgId?: string) {
    try {
      const resolvedOrgId = orgId || getActiveTenantIds().organizationId;
      if (!resolvedOrgId) return { data: [], error: 'Organization context unavailable' };
      const { data, error } = await supabase
        .from('umkm_sales_transactions')
        .select('*')
        .eq('org_id', resolvedOrgId)
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
  },

  // 11. Update UMKM Store & Profile Metadata with CDN Avatar
  async updateUmkmUserProfile(payload: any, providedStoreId?: string | null) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId || undefined);
      if (!storeId) return { data: null, error: 'Store context unavailable' };
      const avatarPath = payload.avatar_url || payload.avatar_path;
      const { data, error } = await supabase
        .from('umkm_stores')
        .update({
          store_name: payload.store_name,
          description: payload.description,
          avatar_path: avatarPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .select()
        .maybeSingle();

      if (typeof window !== 'undefined') {
        try {
          const session = JSON.parse(localStorage.getItem('zega_mock_session') || '{}');
          if (session?.user) {
            session.user.user_metadata = {
              ...session.user?.user_metadata,
              avatar_url: avatarPath,
              full_name: payload.fullname
            };
            localStorage.setItem('zega_mock_session', JSON.stringify(session));
          }
        } catch (e) {}
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 12. Deploy Real AI Model Sales Swarm & Insights Generation
  async deploySalesAiSwarm(providedStoreId?: string | null, modelPayload?: any) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId || undefined);
      if (!storeId) return { data: null, error: 'Store context unavailable' };
      const insertInsight = {
        store_id: storeId,
        model_engine: modelPayload?.model_engine || '9Router-Auto-Cost-Optimizer',
        model_provider: modelPayload?.model_provider || '9router/gpt-4o-mini',
        execution_gateway: modelPayload?.execution_gateway || 'ZeroClaw-Edge-Gateway',
        cdn_icon_url: modelPayload?.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png',
        insight_type: modelPayload?.insight_type || 'forecast',
        headline: modelPayload?.headline || `Real AI Model Swarm Strategy (${modelPayload?.model_engine || '9Router'})`,
        content: modelPayload?.content || 'AI model menganalisis histori penjualan.',
        action_suggestion: modelPayload?.action_suggestion || 'Optimalkan alokasi iklan.',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('umkm_sales_insights')
        .insert(insertInsight)
        .select()
        .single();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  },

  // 13. Update Sales Goal
  async updateSalesGoal(providedStoreId?: string | null, targetRevenue: number = 0) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId || undefined);
      if (!storeId) return { data: null, error: 'Store context unavailable' };
      const { data, error } = await supabase
        .from('umkm_sales_goals')
        .upsert({
          store_id: storeId,
          target_revenue: targetRevenue,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  },

  // 14. Realtime Subscription for Sales
  subscribeToSalesRealtime(providedStoreId?: string | null, callback?: () => void) {
    if (!providedStoreId || !callback) return () => {};
    const channel = supabase
      .channel(`sales_realtime_${providedStoreId}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_sales_metrics' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_sales_goals' }, () => callback())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'umkm_sales_insights' }, () => callback())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // 15. Log System Audit Log
  async logSystemAuditLog(action: string, status: string = 'Success', details: any = {}, providedStoreId?: string | null) {
    try {
      const storeId = await this.getAuthenticatedStoreId(providedStoreId || undefined);
      if (!storeId) return { data: null, error: 'Store context unavailable' };
      const payload = {
        store_id: storeId,
        event_action: action,
        status: status,
        details: details,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('umkm_system_audit_logs')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) return { data: null, error };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  },

  // 16. Enterprise Zero-Lag Anti-Throttling Global Search RPC
  async executeGlobalSearch(query: string, limit: number = 20, offset: number = 0, providedStoreId?: string) {
    try {
      const trimmedQuery = (query || '').trim();
      if (trimmedQuery.length < 2) return { data: [], error: null };

      const storeId = await this.getAuthenticatedStoreId(providedStoreId);
      const { data, error } = await supabase.rpc('umkm_global_search_all', {
        p_store_id: storeId,
        p_query: trimmedQuery,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Failed to execute global search' };
    }
  }
};
