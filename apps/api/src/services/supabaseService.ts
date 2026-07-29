import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pino from 'pino';
import { envConfig } from '../config/env.js';

const logger = pino({ name: 'SupabaseService' });

/**
 * ZEGA AI — Backend Supabase Service (Service Role Admin Client)
 * Handles user profile synchronization, OWASP audit logging, multi-tenant RLS enforcement,
 * agent deployment, workflow state, and anti-throttling / rate-limiting stored procedures.
 */
// Ensure WebSocket polyfill exists for Node.js < 22 environments to prevent @supabase/realtime-js initialization failure
if (typeof (globalThis as any).WebSocket === 'undefined') {
  class NodeWebSocketFallback {
    constructor() {}
    close() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  }
  (globalThis as any).WebSocket = NodeWebSocketFallback;
}

class SupabaseBackendService {
  private client: SupabaseClient | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const url = process.env.SUPABASE_URL || envConfig.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;

    if (url && serviceKey && !url.includes('placeholder')) {
      try {
        this.client = createClient(url, serviceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        logger.info('[SupabaseService] Initialized Supabase Service-Role Admin Client successfully.');
      } catch (err) {
        logger.warn({ err }, '[SupabaseService] Failed to initialize Supabase client.');
      }
    } else {
      logger.warn('[SupabaseService] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing or placeholder. Running in local memory fallback mode.');
    }
  }

  public getClient(): SupabaseClient | null {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  }

  /**
   * Upsert user profile into public.profiles table upon OTP verification or Quick Demo
   */
  async upsertProfile({
    email,
    fullName,
    role = 'individual',
    companyName,
  }: {
    email: string;
    fullName?: string;
    role?: 'individual' | 'umkm' | 'enterprise' | 'superadmin';
    companyName?: string;
  }) {
    const supabase = this.getClient();
    if (!supabase) return null;

    try {
      const dbRole = role === 'superadmin' ? 'enterprise' : role;

      // 1. Sync to master public.users table
      try {
        await supabase.from('users').upsert(
          {
            email: email.toLowerCase(),
            full_name: fullName || email.split('@')[0],
            role: dbRole,
            company_name: companyName || null,
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      } catch (e: any) {
        logger.warn(`[SupabaseService] public.users upsert note: ${e?.message}`);
      }

      // 2. Sync to public.profiles table
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      const profileId = existing?.id || crypto.randomUUID();

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profileId,
            email: email.toLowerCase(),
            full_name: fullName || email.split('@')[0],
            role: dbRole,
            company_name: companyName || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (error) {
        logger.warn(`[SupabaseService] upsertProfile error: ${error.message}`);
        return null;
      }

      logger.info(`[SupabaseService] Profile & User synced for ${email} (Role: ${dbRole}). Profile ID: ${data.id}`);
      return data;
    } catch (err) {
      logger.warn({ err }, '[SupabaseService] Failed to sync profile to Supabase.');
      return null;
    }
  }

  /**
   * Fetch all registered agents from public.agents
   */
  async getAgents() {
    const supabase = this.getClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn(`[SupabaseService] getAgents error: ${error.message}`);
        return [];
      }
      return data || [];
    } catch (err) {
      logger.warn({ err }, '[SupabaseService] getAgents exception.');
      return [];
    }
  }

  /**
   * Save a newly deployed AI agent into public.agents table
   */
  async createAgent(agentData: {
    userId?: string;
    organizationId?: string;
    name: string;
    description?: string;
    systemPrompt: string;
    modelName?: string;
    temperature?: number;
    rateLimitPerMin?: number;
    metadata?: any;
  }) {
    const supabase = this.getClient();
    if (!supabase) return null;

    try {
      // Find or default user ID
      let userId = agentData.userId;
      if (!userId) {
        const { data: firstUser } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        userId = firstUser?.id;
      }

      if (!userId) {
        logger.warn('[SupabaseService] Cannot insert agent: No user profile found.');
        return null;
      }

      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            user_id: userId,
            organization_id: agentData.organizationId || null,
            name: agentData.name,
            description: agentData.description || null,
            system_prompt: agentData.systemPrompt,
            model_name: agentData.modelName || 'zega-agent-v1',
            temperature: agentData.temperature ?? 0.70,
            rate_limit_per_min: agentData.rateLimitPerMin ?? 60,
            metadata: agentData.metadata || {},
          },
        ])
        .select()
        .single();

      if (error) {
        logger.warn(`[SupabaseService] createAgent error: ${error.message}`);
        return null;
      }
      return data;
    } catch (err) {
      logger.warn({ err }, '[SupabaseService] createAgent exception.');
      return null;
    }
  }

  /**
   * Log OWASP Security Audit Event to public.security_audit_logs
   */
  async logAuditEvent({
    userId,
    ipAddress = '127.0.0.1',
    action,
    resource,
    statusCode = 200,
    payloadSummary,
  }: {
    userId?: string;
    ipAddress?: string;
    action: string;
    resource: string;
    statusCode?: number;
    payloadSummary?: string;
  }) {
    const supabase = this.getClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: userId || null,
        p_ip_address: ipAddress.includes(':') ? '127.0.0.1' : ipAddress,
        p_action: action,
        p_resource: resource,
        p_status_code: statusCode,
        p_payload_summary: payloadSummary || null,
      });

      if (error) {
        await supabase.from('security_audit_logs').insert([
          {
            user_id: userId || null,
            ip_address: ipAddress.includes(':') ? '127.0.0.1' : ipAddress,
            action,
            resource,
            status_code: statusCode,
            payload_summary: payloadSummary || null,
          },
        ]);
      }
    } catch (e) {
      // Non-blocking security audit logger
    }
  }

  /**
   * OWASP Anti-Throttling Rate Limit Check Stored Procedure
   */
  async checkRateLimit(identifier: string, action: string, maxRequests = 100, windowSeconds = 60): Promise<boolean> {
    const supabase = this.getClient();
    if (!supabase) return true;

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action: action,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
      });

      if (error) return true;
      return Boolean(data);
    } catch {
      return true;
    }
  }
}

export const SupabaseService = new SupabaseBackendService();
