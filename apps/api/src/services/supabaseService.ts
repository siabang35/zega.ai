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
   * FOUNDATION HARDENING (F-004 FIX): User-Scoped Supabase Client
   *
   * Creates a Supabase client using the ANON KEY + user's JWT token,
   * which means RLS policies are ENFORCED at the database layer.
   *
   * Use this for ALL tenant-scoped queries where data isolation matters:
   *   - agents, workflows, sandboxes, integrations, memory store
   *   - any table with `user_id`-based RLS policies
   *
   * The service-role client (`getClient()`) should ONLY be used for:
   *   - Admin operations (audit logs, rate limits)
   *   - Profile upserts during authentication
   *   - Operations that intentionally bypass RLS
   *
   * @param userJwt - The user's verified JWT token from the request
   * @returns SupabaseClient with RLS enforced, or null if not configured
   */
  public getUserScopedClient(userJwt: string): SupabaseClient | null {
    const url = process.env.SUPABASE_URL || envConfig.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY;

    if (!url || !anonKey || url.includes('placeholder') || anonKey.includes('placeholder')) {
      logger.warn('[SupabaseService] Cannot create user-scoped client — URL or ANON_KEY missing/placeholder');
      return null;
    }

    try {
      return createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${userJwt}`,
          },
        },
      });
    } catch (err) {
      logger.warn({ err }, '[SupabaseService] Failed to create user-scoped Supabase client');
      return null;
    }
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

      // 2. Sync to public.profiles table safely
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existing?.id) {
        const { data: updatedProfile, error: updateErr } = await supabase
          .from('profiles')
          .update({
            full_name: fullName || email.split('@')[0],
            role: dbRole,
            company_name: companyName || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!updateErr && updatedProfile) {
          logger.info(`[SupabaseService] Profile updated for ${email} (Profile ID: ${updatedProfile.id})`);
          return updatedProfile;
        }
      }

      // If no existing profile in public.profiles, find user in public.users to match ID or try insert
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      const profileId = userRow?.id || existing?.id;

      if (profileId) {
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
          .maybeSingle();

        if (!error && data) {
          logger.info(`[SupabaseService] Profile synced for ${email}. Profile ID: ${data.id}`);
          return data;
        }
      }

      return { id: email, email: email.toLowerCase(), role: dbRole };
    } catch (err) {
      logger.warn({ err }, '[SupabaseService] Failed to sync profile to Supabase.');
      return null;
    }
  }

  /**
   * FOUNDATION HARDENING (F-PERF-03): Maximum rows returned by any single query.
   * Prevents unbounded result sets that could exhaust server memory.
   */
  private static readonly MAX_QUERY_LIMIT = 500;

  /**
   * Health check — distinguishes "no data" from "DB unreachable" (F-REL-02 FIX).
   * Returns { healthy: true } if DB is reachable, { healthy: false, error } otherwise.
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const supabase = this.getClient();
    if (!supabase) {
      return { healthy: false, latencyMs: 0, error: 'Supabase client not initialized (missing credentials)' };
    }

    const start = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const latencyMs = Date.now() - start;
      if (error) {
        return { healthy: false, latencyMs, error: `DB query failed: ${error.message}` };
      }
      return { healthy: true, latencyMs };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: `DB connection failed: ${err?.message}` };
    }
  }

  /**
   * Fetch agents scoped to a specific organization.
   * SECURITY (C-02 FIX): Requires organizationId — never returns globally unscoped data.
   * FOUNDATION HARDENING (F-PERF-03): Bounded to MAX_QUERY_LIMIT rows.
   */
  async getAgents(organizationId: string) {
    const supabase = this.getClient();
    if (!supabase) return [];

    if (!organizationId) {
      logger.warn('[SupabaseService] getAgents DENIED — missing organizationId (fail-closed)');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(SupabaseBackendService.MAX_QUERY_LIMIT);

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
   * EA-02 FIX: Fetch agents scoped to a specific user.
   * This is the tenant-aware alternative to getAgents().
   * Service-role client still bypasses RLS, so we enforce the filter explicitly.
   */
  async getAgentsByUser(userId: string) {
    const supabase = this.getClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(SupabaseBackendService.MAX_QUERY_LIMIT);

      if (error) {
        logger.warn(`[SupabaseService] getAgentsByUser error: ${error.message}`);
        return [];
      }
      return data || [];
    } catch (err) {
      logger.warn({ err, userId }, '[SupabaseService] getAgentsByUser exception.');
      return [];
    }
  }

  /**
   * Save a newly deployed AI agent into public.agents table
   */
  async createAgent(agentData: {
    userId: string;
    organizationId: string;
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

    // SECURITY (C-02 FIX): Both userId and organizationId are REQUIRED.
    // Never auto-select a user or allow null organization.
    if (!agentData.userId) {
      logger.warn('[SupabaseService] createAgent DENIED — missing userId (fail-closed)');
      return null;
    }
    if (!agentData.organizationId) {
      logger.warn('[SupabaseService] createAgent DENIED — missing organizationId (fail-closed)');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            user_id: agentData.userId,
            organization_id: agentData.organizationId,
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

  // In-memory rate limiting map for fail-closed fallback
  private localRateLimitMap = new Map<string, { count: number; expiresAt: number }>();

  /**
   * OWASP Anti-Throttling Rate Limit Check (F-013 FIX: Distributed DB-Backed Architecture)
   * Tries RPC check_rate_limit -> falls back to direct query on public.rate_limits table -> falls back to bounded memory map.
   */
  async checkRateLimit(identifier: string, action: string, maxRequests = 100, windowSeconds = 60): Promise<boolean> {
    const supabase = this.getClient();
    const rateKey = `rate_${identifier.trim().toLowerCase()}_${action}`;
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    if (supabase) {
      try {
        // 1. Try RPC procedure if installed
        const { data, error } = await supabase.rpc('check_rate_limit', {
          p_identifier: identifier,
          p_action: action,
          p_max_requests: maxRequests,
          p_window_seconds: windowSeconds,
        });

        if (!error && typeof data === 'boolean') {
          return data;
        }

        // 2. Direct table check on public.rate_limits (F-013 FIX)
        const expiresAtIso = new Date(nowMs + windowSeconds * 1000).toISOString();
        const { data: currentEntry } = await supabase
          .from('rate_limits')
          .select('points, expires_at')
          .eq('key', rateKey)
          .gt('expires_at', nowIso)
          .maybeSingle();

        if (!currentEntry) {
          await supabase.from('rate_limits').upsert({
            key: rateKey,
            points: 1,
            window_start: nowIso,
            expires_at: expiresAtIso,
          });
          return true;
        }

        if (currentEntry.points >= maxRequests) {
          logger.warn({ rateKey, points: currentEntry.points, maxRequests }, '[SupabaseService] Distributed DB rate limit exceeded');
          return false;
        }

        await supabase
          .from('rate_limits')
          .update({ points: currentEntry.points + 1 })
          .eq('key', rateKey);

        return true;
      } catch (err) {
        logger.warn({ err, action, identifier }, '[SupabaseService] Rate limit DB error, invoking fail-closed memory fallback');
      }
    }

    // 3. Fail-Closed Fallback: Bounded Local Memory Sliding-Window Rate Limiter (F-015 FIX)
    const entry = this.localRateLimitMap.get(rateKey);

    if (!entry || entry.expiresAt <= nowMs) {
      // Prune stale entries if map exceeds 2,000 items
      if (this.localRateLimitMap.size > 2000) {
        for (const [k, v] of this.localRateLimitMap.entries()) {
          if (v.expiresAt <= nowMs) this.localRateLimitMap.delete(k);
        }
      }
      this.localRateLimitMap.set(rateKey, { count: 1, expiresAt: nowMs + windowSeconds * 1000 });
      return true;
    }

    if (entry.count >= maxRequests) {
      logger.warn({ rateKey, count: entry.count, maxRequests }, '[SupabaseService] Fail-closed memory rate limit exceeded');
      return false; // FAIL CLOSED
    }

    entry.count += 1;
    return true;
  }

  /**
   * Record Privy R2 CDN Audit Certificate in Supabase
   */
  async recordPrivyR2AuditCertificate({
    userId,
    email,
    privyWalletAddress,
    privyDid,
    r2CdnUrl,
    r2ObjectKey,
    sha256Checksum,
    metadata = {},
  }: {
    userId: string;
    email: string;
    privyWalletAddress: string;
    privyDid?: string;
    r2CdnUrl: string;
    r2ObjectKey: string;
    sha256Checksum: string;
    metadata?: any;
  }) {
    const supabase = this.getClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.rpc('record_privy_r2_audit_certificate', {
        p_user_id: userId,
        p_email: email,
        p_privy_wallet_address: privyWalletAddress,
        p_privy_did: privyDid || null,
        p_r2_cdn_url: r2CdnUrl,
        p_r2_object_key: r2ObjectKey,
        p_sha256_checksum: sha256Checksum,
        p_metadata: metadata,
      });

      if (error) {
        logger.warn(`[SupabaseService] recordPrivyR2AuditCertificate RPC fallback: ${error.message}`);
        const { data: directData } = await supabase
          .from('privy_r2_audit_certificates')
          .insert([
            {
              user_id: userId,
              email,
              privy_wallet_address: privyWalletAddress,
              privy_did: privyDid || null,
              r2_cdn_url: r2CdnUrl,
              r2_object_key: r2ObjectKey,
              sha256_checksum: sha256Checksum,
              metadata,
            },
          ])
          .select()
          .single();
        return directData;
      }
      return data;
    } catch (err) {
      logger.warn({ err }, '[SupabaseService] recordPrivyR2AuditCertificate exception.');
      return null;
    }
  }
}

export const SupabaseService = new SupabaseBackendService();
export const supabaseService = SupabaseService;
