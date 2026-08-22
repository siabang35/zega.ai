/**
 * ZEGA AI — Universal Chat Orchestrator
 *
 * The core multi-swarm orchestration engine that:
 * 1. Classifies user intent into required capabilities
 * 2. Resolves which authorized swarms provide those capabilities
 * 3. Dispatches to swarm handlers (parallel when independent)
 * 4. Aggregates results from multiple swarms
 * 5. Synthesizes a unified response via LLM
 *
 * Security contract:
 * - Tenant context is ALWAYS derived server-side (identityResolver)
 * - The LLM is NEVER the authorization boundary
 * - All tool executions are tenant-scoped
 * - Write operations require explicit user confirmation
 */

import {
  SwarmDomain,
  SWARM_CAPABILITY_MAP,
  resolveCapabilitiesFromKeywords,
  resolveDomainsFromCapabilities,
  resolveAuthorizedSwarms,
  ResolvedSwarm,
} from './swarmCapabilityRegistry.js';
import { executeUniversalTool, getToolsForDomain } from './universalSwarmTools.js';
import { executeInventoryTool, InventoryTenantContext } from './inventoryTools.js';
import { SupabaseService } from '../supabaseService.js';
import { logger } from '../../utils/logger.js';
import { executeRoutedModelPipeline, stripThinkingProcess } from '../aiRouterService.js';
import crypto from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UniversalChatContext {
  sessionId: string;
  storeId: string;
  organizationId: string;
  userId: string;
  prompt: string;
  swarmId?: string;
  preferredLanguage?: string;
}

export interface SwarmExecutionStep {
  domain: SwarmDomain;
  swarmName: string;
  toolName: string;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
  result: any;
  latencyMs: number;
}

export interface UniversalChatResponse {
  sessionId: string;
  content: string;
  structuredPayload: {
    groundedItems?: Array<{ type: string; label: string; detail: string }>;
    tableData?: any[];
    domains?: string[];
  };
  agentActivity: Array<{
    agentRole: string;
    summary: string;
    status: string;
    latencyMs: number;
  }>;
  requiresConfirmation: boolean;
  pendingMutation?: {
    confirmationToken: string;
    action: string;
    description: string;
    params: any;
  };
  swarmSteps: SwarmExecutionStep[];
}

// ─── Execution Limits ───────────────────────────────────────────────────────

const MAX_SWARM_DOMAINS = 5;
const MAX_EXECUTION_STEPS = 10;
const STEP_TIMEOUT_MS = 15000;

// ─── Mutation Detection ─────────────────────────────────────────────────────

const WRITE_INTENT_PATTERNS = [
  /\bupdate\b.*\bstok\b/i,
  /\bubah\b.*\bstok\b/i,
  /\bperbarui\b.*\bstok\b/i,
  /\bsesuaikan\b.*\bstok\b/i,
  /\bset\b.*\bstock\b/i,
  /\bbuat\b.*\brencana\b.*\brestok\b/i,
  /\bbuat\b.*\bpurchase\b/i,
  /\bdelete\b.*\bproduk\b/i,
  /\bhapus\b.*\bproduk\b/i,
  /\bcreate\b.*\brestock\b/i,
];

// ─── Zero-Trust Input Sanitizer ──────────────────────────────────────────────

/**
 * Zero-Trust Prompt Sanitizer & Anti-Prompt Injection Filter
 * 
 * Sanitizes incoming user prompt:
 * 1. Strips control characters & null bytes
 * 2. Neutralizes prompt injection & system prompt override patterns
 * 3. Truncates prompt to maximum safe token length (max 2,000 chars)
 */
export function sanitizePrompt(rawPrompt: string): string {
  if (!rawPrompt || typeof rawPrompt !== 'string') return '';
  
  // 1. Remove control characters and non-printable bytes
  let cleaned = rawPrompt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Remove adversarial system prompt override vectors
  const injectionPatterns = [
    /system\s*:/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[inst\]/gi,
    /\[\/inst\]/gi,
    /ignore\s+(all\s+)?(previous|above)\s+(instructions|prompts)/gi,
    /override\s+(system\s+)?prompt/gi,
    /you\s+are\s+now\s+(in\s+)?developer\s+mode/gi,
    /disregard\s+all\s+safety\s+rules/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, '[filtered]');
  }

  // 3. Hard limit length to prevent token overflow attacks (max 2000 chars)
  return cleaned.trim().slice(0, 2000);
}

function detectWriteIntent(prompt: string): { isWrite: boolean; action: string; description: string } {
  const lower = prompt.toLowerCase();

  for (const pattern of WRITE_INTENT_PATTERNS) {
    if (pattern.test(lower)) {
      if (/update|ubah|perbarui|sesuaikan|set/i.test(lower) && /stok|stock/i.test(lower)) {
        return {
          isWrite: true,
          action: 'UPDATE_STOCK',
          description: `Permintaan perubahan data stok: "${prompt}"`,
        };
      }
      if (/buat.*rencana.*restok|create.*restock/i.test(lower)) {
        return {
          isWrite: true,
          action: 'CREATE_RESTOCK_PLAN',
          description: `Permintaan pembuatan rencana restok: "${prompt}"`,
        };
      }
      if (/buat.*purchase|create.*purchase/i.test(lower)) {
        return {
          isWrite: true,
          action: 'CREATE_PURCHASE_REQUEST',
          description: `Permintaan pembuatan order pembelian: "${prompt}"`,
        };
      }
      if (/hapus.*produk|delete.*product/i.test(lower)) {
        return {
          isWrite: true,
          action: 'DELETE_PRODUCT',
          description: `Permintaan penghapusan produk: "${prompt}"`,
        };
      }
    }
  }

  return { isWrite: false, action: '', description: '' };
}

// ─── Core Orchestrator ──────────────────────────────────────────────────────

export class UniversalChatOrchestrator {
  /**
   * Resolve store AI preferences from database and optional request override.
   */
  static async resolveStorePreferences(storeId: string, overrideLang?: string): Promise<{
    langCode: 'id' | 'en' | 'zh';
    responseStyle: string;
    responseLength: string;
    responseFormat: string;
    defaultModel: string;
  }> {
    let langCode: 'id' | 'en' | 'zh' = 'id';
    let responseStyle = 'Profesional';
    let responseLength = 'Sedang';
    let responseFormat = 'Ringkas';
    let defaultModel = 'GPT-4o (Recommended)';

    // Check request override first
    if (overrideLang) {
      const lower = overrideLang.toLowerCase();
      if (lower.includes('en') || lower.includes('english')) langCode = 'en';
      else if (lower.includes('zh') || lower.includes('mandarin') || lower.includes('chinese')) langCode = 'zh';
      else if (lower.includes('id') || lower.includes('indonesia')) langCode = 'id';
    }

    try {
      const supabase = SupabaseService.getClient();
      if (supabase && storeId) {
        const { data: prefs } = await supabase
          .from('umkm_settings_ai_preferences')
          .select('*')
          .eq('store_id', storeId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (prefs) {
          if (prefs.response_style) responseStyle = prefs.response_style;
          if (prefs.response_length) responseLength = prefs.response_length;
          if (prefs.response_format) responseFormat = prefs.response_format;
          if (prefs.default_model) defaultModel = prefs.default_model;

          if (!overrideLang && prefs.default_language) {
            const l = prefs.default_language.toLowerCase();
            if (l.includes('en') || l === 'english') langCode = 'en';
            else if (l.includes('zh') || l.includes('mandarin') || l === 'chinese') langCode = 'zh';
            else langCode = 'id';
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, '[UniversalOrchestrator] AI preferences lookup notice');
    }

    return { langCode, responseStyle, responseLength, responseFormat, defaultModel };
  }

  /**
   * Process a universal chat message through capability-based routing.
   */
  static async processMessage(ctx: UniversalChatContext): Promise<UniversalChatResponse> {
    const startTime = Date.now();

    // 0. Sanitize input prompt (anti-prompt injection & zero-trust control char filtering)
    ctx.prompt = sanitizePrompt(ctx.prompt);

    // 0b. Resolve store AI language and persona preferences
    const aiPrefs = await UniversalChatOrchestrator.resolveStorePreferences(ctx.storeId, ctx.preferredLanguage);

    // 1. Detect write mutation intent
    const writeCheck = detectWriteIntent(ctx.prompt);
    if (writeCheck.isWrite) {
      return UniversalChatOrchestrator.handleWriteConfirmation(ctx, writeCheck, aiPrefs.langCode);
    }

    // 2. Classify intent into capabilities (keyword-based Layer 1)
    const requiredCapabilities = resolveCapabilitiesFromKeywords(ctx.prompt);
    const targetDomains = resolveDomainsFromCapabilities(requiredCapabilities).slice(0, MAX_SWARM_DOMAINS);

    // 3. Resolve authorized swarms for this tenant
    const authorizedSwarms = await resolveAuthorizedSwarms({
      organizationId: ctx.organizationId,
      storeId: ctx.storeId,
      userId: ctx.userId,
    });

    // Filter to only swarms that match the target domains
    const matchedSwarms = authorizedSwarms.filter(s => targetDomains.includes(s.domain));

    // Fallback: If tenant has no explicit ai_swarms DB rows deployed yet, build virtual swarm instances for core domains
    const effectiveDomains: SwarmDomain[] = targetDomains.length > 0
      ? targetDomains
      : ['operations', 'inventory', 'sales'];

    const effectiveSwarms: ResolvedSwarm[] = matchedSwarms.length > 0
      ? matchedSwarms
      : effectiveDomains.map(domain => ({
          id: `virtual-${domain}`,
          domain,
          name: SWARM_CAPABILITY_MAP[domain]?.name || `${domain.toUpperCase()} Swarm`,
          status: 'ACTIVE',
          capabilities: SWARM_CAPABILITY_MAP[domain]?.capabilities || [],
          organizationId: ctx.organizationId,
          storeId: ctx.storeId,
        }));

    // 4. Execute tools for each matched domain
    const steps: SwarmExecutionStep[] = [];
    const agentActivity: UniversalChatResponse['agentActivity'] = [];
    let stepCount = 0;

    // Run all domains in parallel
    const domainResults = await Promise.allSettled(
      effectiveSwarms.map(async (swarm) => {
        if (stepCount >= MAX_EXECUTION_STEPS) return null;

        const domainStartTime = Date.now();

        try {
          const result = await UniversalChatOrchestrator.executeSwarmDomain(
            swarm,
            ctx
          );
          stepCount++;

          const latency = Date.now() - domainStartTime;

          steps.push({
            domain: swarm.domain,
            swarmName: swarm.name,
            toolName: result.toolName,
            status: result.success ? 'COMPLETED' : 'FAILED',
            result: result.result,
            latencyMs: latency,
          });

          const localizedSummary = result.success
            ? (aiPrefs.langCode === 'en' ? `${swarm.name}: Analysis completed` : aiPrefs.langCode === 'zh' ? `${swarm.name}: 分析完成` : `${swarm.name}: Analisis selesai`)
            : (aiPrefs.langCode === 'en' ? `${swarm.name}: Failed` : aiPrefs.langCode === 'zh' ? `${swarm.name}: 失败` : `${swarm.name}: ${result.error || 'Gagal'}`);

          agentActivity.push({
            agentRole: swarm.domain.toUpperCase(),
            summary: localizedSummary,
            status: result.success ? 'COMPLETED' : 'FAILED',
            latencyMs: latency,
          });

          return result;
        } catch (err: any) {
          const latency = Date.now() - domainStartTime;
          steps.push({
            domain: swarm.domain,
            swarmName: swarm.name,
            toolName: 'error',
            status: 'FAILED',
            result: null,
            latencyMs: latency,
          });
          return null;
        }
      })
    );

    // 5. Collect successful results for LLM synthesis
    const successfulResults = steps
      .filter(s => s.status === 'COMPLETED' && s.result)
      .map(s => ({
        domain: s.domain,
        swarmName: s.swarmName,
        data: s.result,
      }));

    // 6. Synthesize response via ZeroClaw / 9-Model Router AI Pipeline
    const totalLatency = Date.now() - startTime;
    const synthesizedContent = await UniversalChatOrchestrator.synthesizeResponse(
      ctx.prompt,
      successfulResults,
      targetDomains,
      aiPrefs.langCode,
      aiPrefs,
      ctx
    );

    // 7. Build grounded items from results
    const groundedItems = UniversalChatOrchestrator.buildGroundedItems(
      successfulResults,
      targetDomains,
      aiPrefs.langCode
    );

    // 8. Build table data if appropriate
    const tableData = UniversalChatOrchestrator.buildTableData(successfulResults);

    // 9. Persist messages to database
    await UniversalChatOrchestrator.persistMessages(ctx, synthesizedContent, {
      groundedItems,
      tableData,
      domains: targetDomains,
    }, agentActivity);

    return {
      sessionId: ctx.sessionId,
      content: synthesizedContent,
      structuredPayload: {
        groundedItems,
        tableData,
        domains: targetDomains,
      },
      agentActivity,
      requiresConfirmation: false,
      swarmSteps: steps,
    };
  }

  /**
   * Execute tools for a specific swarm domain based on user intent.
   */
  private static async executeSwarmDomain(
    swarm: ResolvedSwarm,
    ctx: UniversalChatContext
  ): Promise<{ toolName: string; success: boolean; result: any; error?: string }> {
    const tenantCtx = {
      storeId: ctx.storeId,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    };

    // For inventory domain, delegate to the existing specialized inventory tools
    if (swarm.domain === 'inventory') {
      const inventoryCtx: InventoryTenantContext = {
        storeId: ctx.storeId,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        agentAuthority: 'READ_ONLY',
      };

      // Select the most appropriate inventory tool based on intent
      const toolName = UniversalChatOrchestrator.selectInventoryTool(ctx.prompt);
      const result = await executeInventoryTool(toolName, {}, inventoryCtx);

      return {
        toolName: result.toolName,
        success: result.success,
        result: result.result,
        error: result.error,
      };
    }

    // For other domains, use universal tools
    const tools = getToolsForDomain(swarm.domain);
    if (tools.length === 0) {
      return { toolName: 'none', success: false, result: null, error: 'No tools for domain' };
    }

    // Select the primary tool for this domain
    const primaryTool = UniversalChatOrchestrator.selectDomainTool(swarm.domain, ctx.prompt, tools);
    const result = await executeUniversalTool(primaryTool, { query: ctx.prompt }, tenantCtx);

    return {
      toolName: result.toolName,
      success: result.success,
      result: result.result,
      error: result.error,
    };
  }

  /**
   * Select the most appropriate inventory tool based on user intent.
   */
  private static selectInventoryTool(prompt: string): string {
    const lower = prompt.toLowerCase();

    if (/menipis|low.?stock|kritis|hampir.?habis|running.?low/i.test(lower)) return 'inventory.get_low_stock_products';
    if (/dead.?stock|menumpuk|tidak.?laku|stagnant/i.test(lower)) return 'inventory.detect_dead_stock';
    if (/reorder|restok|isi.?ulang|pengisian|rekomendasi|replenish/i.test(lower)) return 'inventory.get_reorder_recommendations';
    if (/prediksi|forecast|proyeksi|estimasi|risiko.*habis/i.test(lower)) return 'inventory.forecast_demand';
    if (/velocity|perputaran|fast.?moving|slow.?moving/i.test(lower)) return 'inventory.get_sales_velocity';
    if (/riwayat|history|pergerakan|movement/i.test(lower)) return 'inventory.get_stock_movements';
    if (/cari|search|find|temukan/i.test(lower)) return 'inventory.search';
    if (/daftar|list|semua.?produk|all.?product/i.test(lower)) return 'inventory.list_products';
    if (/how.?many|how.?much|berapa.?banyak|berapa.?stok|stok.?tersedia/i.test(lower)) return 'inventory.get_stock_metrics';

    return 'inventory.get_stock_metrics';
  }

  /**
   * Select the best tool for a given domain based on intent.
   */
  private static selectDomainTool(domain: SwarmDomain, prompt: string, availableTools: string[]): string {
    const lower = prompt.toLowerCase();

    switch (domain) {
      case 'sales':
        if (/produk|product|per.?item/i.test(lower)) return 'sales.by_product';
        if (/tren|trend|naik|turun/i.test(lower)) return 'sales.trends';
        return 'sales.summary';

      case 'product':
        if (/cari|search|temukan/i.test(lower)) return 'product.search';
        return 'product.catalog_summary';

      case 'demand':
        return 'demand.stockout_risk';

      case 'procurement':
        return 'procurement.reorder_plan';

      case 'operations':
        return 'operations.store_overview';

      default:
        return availableTools[0] || 'operations.store_overview';
    }
  }

  /**
   * Handle write mutation intent — issue confirmation token, DO NOT execute.
   */
  private static async handleWriteConfirmation(
    ctx: UniversalChatContext,
    writeCheck: { action: string; description: string },
    langCode: 'id' | 'en' | 'zh' = 'id'
  ): Promise<UniversalChatResponse> {
    const confirmationToken = crypto.randomUUID();

    // Parse mutation params from prompt
    const params = UniversalChatOrchestrator.parseMutationParams(ctx.prompt, writeCheck.action);

    const title = langCode === 'en'
      ? '⚠️ **Data Change Confirmation Required**'
      : langCode === 'zh'
      ? '⚠️ **需要数据修改确认**'
      : '⚠️ **Konfirmasi Perubahan Data Diperlukan**';

    const sub = langCode === 'en'
      ? 'This operation will permanently modify data. Please confirm to proceed.'
      : langCode === 'zh'
      ? '此操作将永久修改数据。请确认以继续。'
      : 'Operasi ini akan mengubah data secara permanen. Silakan konfirmasi untuk melanjutkan.';

    const confirmationContent = `${title}\n\n${writeCheck.description}\n\n${sub}`;

    const activitySummary = langCode === 'en'
      ? 'Awaiting user authorization for data mutation'
      : langCode === 'zh'
      ? '等待用户授权执行数据修改'
      : 'Menunggu konfirmasi wewenang pengguna untuk mutasi data';

    // Persist the confirmation request message
    await UniversalChatOrchestrator.persistMessages(ctx, confirmationContent, {
      groundedItems: [{ type: 'MUTATION', label: writeCheck.action, detail: writeCheck.description }],
    }, [{
      agentRole: 'SECURITY',
      summary: activitySummary,
      status: 'AWAITING_CONFIRMATION',
      latencyMs: 0,
    }], true, { confirmationToken, ...writeCheck, params });

    return {
      sessionId: ctx.sessionId,
      content: confirmationContent,
      structuredPayload: {
        groundedItems: [{ type: 'MUTATION', label: writeCheck.action, detail: writeCheck.description }],
      },
      agentActivity: [{
        agentRole: 'SECURITY',
        summary: activitySummary,
        status: 'AWAITING_CONFIRMATION',
        latencyMs: 0,
      }],
      requiresConfirmation: true,
      pendingMutation: {
        confirmationToken,
        action: writeCheck.action,
        description: writeCheck.description,
        params,
      },
      swarmSteps: [],
    };
  }

  /**
   * Execute a confirmed write mutation.
   */
  static async executeMutation(params: {
    sessionId: string;
    confirmationToken: string;
    action: string;
    mutationParams: any;
    storeId: string;
    organizationId: string;
    userId: string;
  }): Promise<UniversalChatResponse> {
    const inventoryCtx: InventoryTenantContext = {
      storeId: params.storeId,
      organizationId: params.organizationId,
      userId: params.userId,
      agentAuthority: 'WRITE_WITH_APPROVAL',
    };

    let result: any;

    switch (params.action) {
      case 'UPDATE_STOCK':
        result = await executeInventoryTool('inventory.update_stock', params.mutationParams, inventoryCtx);
        break;
      case 'CREATE_RESTOCK_PLAN':
        result = await executeInventoryTool('inventory.create_restock_plan', params.mutationParams, inventoryCtx);
        break;
      case 'CREATE_PURCHASE_REQUEST':
        result = await executeInventoryTool('inventory.create_purchase_request', params.mutationParams, inventoryCtx);
        break;
      default:
        result = { success: false, error: `Unknown mutation action: ${params.action}` };
    }

    const content = result.success
      ? `✅ **Operasi ${params.action} berhasil diperbarui.**\n\n${JSON.stringify(result.result, null, 2)}`
      : `❌ **Operasi gagal:** ${result.error}`;

    await UniversalChatOrchestrator.persistMessages(
      { sessionId: params.sessionId, storeId: params.storeId, organizationId: params.organizationId, userId: params.userId, prompt: '' },
      content,
      { groundedItems: [{ type: result.success ? 'CONFIRMATION' : 'ERROR', label: params.action, detail: content }] },
      [{ agentRole: 'MUTATION_ENGINE', summary: content, status: result.success ? 'COMPLETED' : 'FAILED', latencyMs: 0 }]
    );

    return {
      sessionId: params.sessionId,
      content,
      structuredPayload: {
        groundedItems: [{ type: result.success ? 'CONFIRMATION' : 'ERROR', label: params.action, detail: content }],
      },
      agentActivity: [{
        agentRole: 'MUTATION_ENGINE',
        summary: result.success ? 'Mutasi berhasil dieksekusi' : 'Mutasi gagal',
        status: result.success ? 'COMPLETED' : 'FAILED',
        latencyMs: 0,
      }],
      requiresConfirmation: false,
      swarmSteps: [],
    };
  }

  /**
   * Parse mutation parameters from natural language prompt.
   */
  private static parseMutationParams(prompt: string, action: string): any {
    if (action === 'UPDATE_STOCK') {
      const skuMatch = prompt.match(/(?:sku|SKU)[\s-]*([A-Za-z0-9-]+)/i);
      const qtyMatch = prompt.match(/(?:menjadi|to|jadi|=)\s*(\d+)/i);
      return {
        productId: skuMatch?.[1] || '',
        newStock: qtyMatch ? parseInt(qtyMatch[1], 10) : 0,
        reason: `User request: ${prompt}`,
      };
    }
    return { prompt };
  }

  /**
   * Build structured domain result fallback text.
   */
  private static buildFormattedFallback(
    results: Array<{ domain: string; swarmName: string; data: any }>,
    domains: string[],
    langCode: 'id' | 'en' | 'zh' = 'id'
  ): string {
    if (results.length === 0) {
      if (langCode === 'en') {
        return 'Sorry, I could not find relevant data for your query. Please try asking a more specific question about stock, sales, or store operations.';
      }
      if (langCode === 'zh') {
        return '抱歉，未找到与您的查询相关的数据。请尝试询问有关库存、销售或店铺运营的更具体问题。';
      }
      return 'Maaf, saya tidak dapat menemukan data yang relevan untuk pertanyaan Anda. Silakan coba pertanyaan yang lebih spesifik tentang stok, penjualan, atau operasional toko Anda.';
    }

    const sections: string[] = [];

    for (const r of results) {
      const def = SWARM_CAPABILITY_MAP[r.domain as SwarmDomain];
      if (!def) continue;

      sections.push(`### ${def.name}\n${formatDomainResult(r.domain, r.data, langCode)}`);
    }

    if (sections.length === 1) {
      return sections[0].replace(/^###\s+.*\n/, '');
    }

    const header = langCode === 'en'
      ? 'Here is the multi-domain analysis for your request:'
      : langCode === 'zh'
      ? '以下是针对您查询的多领域分析结果：'
      : 'Berikut hasil analisis multi-domain untuk pertanyaan Anda:';

    return `${header}\n\n${sections.join('\n\n---\n\n')}`;
  }

  /**
   * Synthesize a human-readable response from multi-swarm execution results using ZeroClaw & 9-Model Router.
   */
  private static async synthesizeResponse(
    prompt: string,
    results: Array<{ domain: string; swarmName: string; data: any }>,
    domains: string[],
    langCode: 'id' | 'en' | 'zh' = 'id',
    aiPrefs?: { responseStyle?: string; responseLength?: string; responseFormat?: string; defaultModel?: string },
    ctx?: UniversalChatContext
  ): Promise<string> {
    const formattedFallback = UniversalChatOrchestrator.buildFormattedFallback(results, domains, langCode);

    try {
      const languageInstruction = langCode === 'en'
        ? 'IMPORTANT: You MUST respond in ENGLISH.'
        : langCode === 'zh'
        ? 'IMPORTANT: You MUST respond in MANDARIN / CHINESE (Simplified).'
        : 'IMPORTANT: You MUST respond in BAHASA INDONESIA.';

      const styleInstruction = `Response Tone & Style: ${aiPrefs?.responseStyle || 'Professional'}. Length: ${aiPrefs?.responseLength || 'Medium'}. Format: ${aiPrefs?.responseFormat || 'Structured'}.`;

      const factsContext = results.map(r => `[Domain: ${r.domain.toUpperCase()} | Swarm: ${r.swarmName}]\nData:\n${JSON.stringify(r.data, null, 2)}`).join('\n\n');

      const systemPrompt = `You are ZEGA AI, the intelligent universal store management assistant.
Your goal is to provide a clean, executive-ready, highly professional, and natural conversational response grounded strictly in EMPIRICAL EVIDENCE fetched from store domain swarms (inventory, sales, product catalog, demand, procurement, operations).

${languageInstruction}
${styleInstruction}

CRITICAL FORMATTING & PRIVACY RULES:
1. NEVER EXPOSE RAW DATABASE UUIDs: Do NOT print, display, or quote raw UUID strings (such as store ID "${ctx?.storeId || ''}", user ID, or org ID) in customer responses. Address the store user naturally by store name or "Toko Anda" / "Your Store".
2. EXECUTIVE SUMMARY & RICH MARKDOWN: Format metrics neatly using bold labels, structured bullet points, and key-value sections. Avoid unformatted walls of text.
3. EMPIRICAL GROUNDING & ACCURACY: Base your answer strictly on the provided store facts. If totalProducts is 0, state 0 products. If totalProducts is 2, state 2 products. Never hallucinate metrics.
4. CONVERSATIONAL & PROFESSIONAL: Synthesize findings into a polished, professional executive update.
5. ZERO REASONING LEAKAGE: Do NOT output internal chain-of-thought (CoT) reasoning, scratchpads, or <think> tags.

EMPIRICAL STORE DOMAIN DATA:
${factsContext || 'No specific domain data retrieved.'}`;

      const routeResult = await executeRoutedModelPipeline({
        rawInput: prompt,
        hardenedSystemPrompt: systemPrompt,
        maxTokensToUse: 800,
        agentRole: 'universal_swarm',
        assistantType: 'SWARM_ORCHESTRATOR',
        targetLangCode: langCode,
        storeId: ctx?.storeId,
        tenantId: ctx?.organizationId,
        userId: ctx?.userId,
      });

      if (routeResult && routeResult.replyText && routeResult.replyText.trim().length > 10) {
        const cleaned = stripThinkingProcess(routeResult.replyText);
        if (cleaned) return cleaned;
      }
    } catch (err) {
      logger.warn({ err }, '[UniversalOrchestrator] AI model synthesis fallback notice');
    }

    return formattedFallback;
  }

  /**
   * Build grounded items (type-tagged evidence tags) from results.
   */
  private static buildGroundedItems(
    results: Array<{ domain: string; data: any }>,
    domains: string[],
    langCode: 'id' | 'en' | 'zh' = 'id'
  ): Array<{ type: string; label: string; detail: string }> {
    const items: Array<{ type: string; label: string; detail: string }> = [];

    for (const r of results) {
      const swarmName = SWARM_CAPABILITY_MAP[r.domain as SwarmDomain]?.name || r.domain;
      const detailStr = langCode === 'en'
        ? `Data from ${swarmName}`
        : langCode === 'zh'
        ? `来自 ${swarmName} 的数据`
        : `Data dari ${swarmName}`;

      items.push({
        type: 'DATA',
        label: `${r.domain.toUpperCase()} Analysis`,
        detail: detailStr,
      });
    }

    if (domains.length > 1) {
      const crossDetail = langCode === 'en'
        ? `Cross-domain analysis: ${domains.join(', ')}`
        : langCode === 'zh'
        ? `跨领域分析: ${domains.join(', ')}`
        : `Analisis lintas domain: ${domains.join(', ')}`;

      items.push({
        type: 'CROSS_DOMAIN',
        label: `Multi-Swarm (${domains.length} domains)`,
        detail: crossDetail,
      });
    }

    return items;
  }

  /**
   * Build structured table data from results.
   */
  private static buildTableData(
    results: Array<{ domain: string; data: any }>
  ): any[] {
    const tableData: any[] = [];

    for (const r of results) {
      const data = r.data;
      if (!data) continue;

      // Extract array data that can be displayed in a table
      if (data.products && Array.isArray(data.products)) {
        tableData.push(...data.products.slice(0, 10));
      }
      if (data.lowStockItems && Array.isArray(data.lowStockItems)) {
        tableData.push(...data.lowStockItems.slice(0, 10));
      }
      if (data.deadStockItems && Array.isArray(data.deadStockItems)) {
        tableData.push(...data.deadStockItems.slice(0, 10));
      }
      if (data.recommendations && Array.isArray(data.recommendations)) {
        tableData.push(...data.recommendations.slice(0, 10));
      }
      if (data.atRisk && Array.isArray(data.atRisk)) {
        tableData.push(...data.atRisk.slice(0, 10));
      }
      if (data.forecast && Array.isArray(data.forecast)) {
        tableData.push(...data.forecast.filter((f: any) => f.stockoutRisk === 'CRITICAL' || f.stockoutRisk === 'HIGH').slice(0, 10));
      }
    }

    return tableData;
  }

  /**
   * Persist user message and swarm response to the database.
   */
  private static async persistMessages(
    ctx: { sessionId: string; storeId: string; organizationId: string; userId: string; prompt: string },
    responseContent: string,
    structuredPayload: any,
    agentActivity: any[],
    requiresConfirmation = false,
    pendingMutation?: any
  ): Promise<void> {
    const supabase = SupabaseService.getClient();
    if (!supabase) return;

    try {
      // Persist user message (only if prompt is non-empty)
      if (ctx.prompt) {
        await supabase.from('ai_chat_messages').insert({
          session_id: ctx.sessionId,
          swarm_id: null,
          organization_id: ctx.organizationId,
          store_id: ctx.storeId,
          user_id: ctx.userId,
          sender_type: 'USER',
          sender_name: 'Pemilik Toko',
          content: ctx.prompt,
        });
      }

      // Persist swarm response
      await supabase.from('ai_chat_messages').insert({
        session_id: ctx.sessionId,
        swarm_id: null,
        organization_id: ctx.organizationId,
        store_id: ctx.storeId,
        user_id: ctx.userId,
        sender_type: 'SWARM',
        sender_name: 'AI Workforce',
        content: responseContent,
        structured_payload: structuredPayload,
        agent_activity: agentActivity,
        requires_confirmation: requiresConfirmation,
        pending_mutation: pendingMutation || null,
      });

      // Update session updated_at
      await supabase
        .from('ai_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ctx.sessionId);
    } catch (err: any) {
      logger.warn({ error: err?.message }, '[UniversalOrchestrator] DB persist notice');
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDomainResult(domain: string, data: any, langCode: 'id' | 'en' | 'zh' = 'id'): string {
  const noDataMsg = langCode === 'en' ? 'Data not available.' : langCode === 'zh' ? '暂无数据。' : 'Data tidak tersedia.';
  if (!data) return noDataMsg;

  const numLoc = langCode === 'en' ? 'en-US' : langCode === 'zh' ? 'zh-CN' : 'id-ID';

  switch (domain) {
    case 'inventory': {
      if (data.totalProducts !== undefined) {
        if (langCode === 'en') {
          return `**Total Products:** ${data.totalProducts} SKUs\n**Total Units in Stock:** ${data.totalStockUnits?.toLocaleString(numLoc) || 0}\n**Stock Value:** Rp ${data.totalStockValueIdr?.toLocaleString(numLoc) || 0}\n**Low Stock:** ${data.lowStockCount || 0} products\n**Out of Stock:** ${data.outOfStockCount || 0} products`;
        }
        if (langCode === 'zh') {
          return `**产品总数：** ${data.totalProducts} SKU\n**库存总件数：** ${data.totalStockUnits?.toLocaleString(numLoc) || 0}\n**库存总价值：** Rp ${data.totalStockValueIdr?.toLocaleString(numLoc) || 0}\n**库存告急：** ${data.lowStockCount || 0} 个产品\n**已售罄：** ${data.outOfStockCount || 0} 个产品`;
        }
        return `**Total Produk:** ${data.totalProducts} SKU\n**Total Unit Stok:** ${data.totalStockUnits?.toLocaleString(numLoc) || 0}\n**Nilai Stok:** Rp ${data.totalStockValueIdr?.toLocaleString(numLoc) || 0}\n**Stok Menipis:** ${data.lowStockCount || 0} produk\n**Habis:** ${data.outOfStockCount || 0} produk`;
      }
      if (data.lowStockItems) {
        const count = data.count || data.lowStockItems.length;
        if (langCode === 'en') {
          return `**${count} products** are low on stock:\n${data.lowStockItems.map((i: any) => `- **${i.name}** (${i.sku}): ${i.stock} units remaining`).join('\n')}`;
        }
        if (langCode === 'zh') {
          return `**${count} 个产品**库存告急：\n${data.lowStockItems.map((i: any) => `- **${i.name}** (${i.sku}): 剩余 ${i.stock} 件`).join('\n')}`;
        }
        return `**${count} produk** stoknya menipis:\n${data.lowStockItems.map((i: any) => `- **${i.name}** (${i.sku}): ${i.stock} unit tersisa`).join('\n')}`;
      }
      if (data.forecast) {
        const critical = data.forecast.filter((f: any) => f.stockoutRisk === 'CRITICAL');
        const count = data.criticalItemsCount || critical.length;
        if (langCode === 'en') {
          return `**${count} products** at risk of running out within 7 days:\n${critical.slice(0, 5).map((f: any) => `- **${f.name}**: ~${f.daysUntilStockout} days remaining`).join('\n')}`;
        }
        if (langCode === 'zh') {
          return `**${count} 个产品**存在7天内售罄风险：\n${critical.slice(0, 5).map((f: any) => `- **${f.name}**: 约剩余 ~${f.daysUntilStockout} 天`).join('\n')}`;
        }
        return `**${count} produk** berisiko habis dalam 7 hari:\n${critical.slice(0, 5).map((f: any) => `- **${f.name}**: ~${f.daysUntilStockout} hari tersisa`).join('\n')}`;
      }
      return JSON.stringify(data, null, 2);
    }

    case 'sales': {
      if (data.revenueToday !== undefined) {
        if (langCode === 'en') {
          return `**Today's Revenue:** Rp ${data.revenueToday?.toLocaleString(numLoc) || 0}\n**Total Transactions:** ${data.ordersToday || 0}\n**Average Order Value:** Rp ${data.averageOrderValue?.toLocaleString(numLoc) || 0}`;
        }
        if (langCode === 'zh') {
          return `**今日营业额：** Rp ${data.revenueToday?.toLocaleString(numLoc) || 0}\n**交易笔数：** ${data.ordersToday || 0}\n**笔均消费：** Rp ${data.averageOrderValue?.toLocaleString(numLoc) || 0}`;
        }
        return `**Omzet Hari Ini:** Rp ${data.revenueToday?.toLocaleString(numLoc) || 0}\n**Jumlah Transaksi:** ${data.ordersToday || 0}\n**Rata-rata Per Transaksi:** Rp ${data.averageOrderValue?.toLocaleString(numLoc) || 0}`;
      }
      if (data.products) {
        if (langCode === 'en') {
          return `**${data.total} top-selling products:**\n${data.products.slice(0, 5).map((p: any) => `- **${p.name}**: ${p.unitsSold} units (Rp ${p.revenueIdr?.toLocaleString(numLoc)})`).join('\n')}`;
        }
        if (langCode === 'zh') {
          return `热销前 **${data.total}** 名产品：\n${data.products.slice(0, 5).map((p: any) => `- **${p.name}**: 售出 ${p.unitsSold} 件 (Rp ${p.revenueIdr?.toLocaleString(numLoc)})`).join('\n')}`;
        }
        return `**${data.total} produk** dengan penjualan tertinggi:\n${data.products.slice(0, 5).map((p: any) => `- **${p.name}**: ${p.unitsSold} unit (Rp ${p.revenueIdr?.toLocaleString(numLoc)})`).join('\n')}`;
      }
      return JSON.stringify(data, null, 2);
    }

    case 'product': {
      if (data.totalProducts !== undefined) {
        if (langCode === 'en') {
          return `**Total Products:** ${data.totalProducts}\n**Active Products:** ${data.activeProducts}\n**Stock Value:** Rp ${data.totalStockValueIdr?.toLocaleString(numLoc)}\n**Categories:** ${data.categoryBreakdown?.map((c: any) => `${c.category} (${c.count})`).join(', ')}`;
        }
        if (langCode === 'zh') {
          return `**产品总数：** ${data.totalProducts}\n**上架产品：** ${data.activeProducts}\n**库存价值：** Rp ${data.totalStockValueIdr?.toLocaleString(numLoc)}\n**分类：** ${data.categoryBreakdown?.map((c: any) => `${c.category} (${c.count})`).join(', ')}`;
        }
        return `**Total Produk:** ${data.totalProducts}\n**Produk Aktif:** ${data.activeProducts}\n**Nilai Stok:** Rp ${data.totalStockValueIdr?.toLocaleString(numLoc)}\n**Kategori:** ${data.categoryBreakdown?.map((c: any) => `${c.category} (${c.count})`).join(', ')}`;
      }
      if (data.matches) {
        if (langCode === 'en') {
          return `**${data.matchCount} products** found:\n${data.matches.slice(0, 5).map((m: any) => `- **${m.name}** (${m.sku}): Stock ${m.stock}, Rp ${m.priceIdr?.toLocaleString(numLoc)}`).join('\n')}`;
        }
        if (langCode === 'zh') {
          return `找到 **${data.matchCount} 个产品**：\n${data.matches.slice(0, 5).map((m: any) => `- **${m.name}** (${m.sku}): 库存 ${m.stock}, Rp ${m.priceIdr?.toLocaleString(numLoc)}`).join('\n')}`;
        }
        return `**${data.matchCount} produk** ditemukan:\n${data.matches.slice(0, 5).map((m: any) => `- **${m.name}** (${m.sku}): Stok ${m.stock}, Rp ${m.priceIdr?.toLocaleString(numLoc)}`).join('\n')}`;
      }
      return JSON.stringify(data, null, 2);
    }

    case 'demand': {
      if (data.atRisk) {
        if (langCode === 'en') {
          return `**${data.count} products** at risk of stockout:\n- **Critical:** ${data.criticalCount}\n- **High Risk:** ${data.highRiskCount}\n\n${data.atRisk.slice(0, 5).map((p: any) => `- **${p.name}**: ~${p.daysUntilStockout} days remaining (${p.riskLevel})`).join('\n')}`;
        }
        if (langCode === 'zh') {
          return `**${data.count} 个产品**存在缺货风险：\n- **紧急：** ${data.criticalCount}\n- **高风险：** ${data.highRiskCount}\n\n${data.atRisk.slice(0, 5).map((p: any) => `- **${p.name}**: 约剩余 ~${p.daysUntilStockout} 天 (${p.riskLevel})`).join('\n')}`;
        }
        return `**${data.count} produk** berisiko stockout:\n- **Kritis:** ${data.criticalCount}\n- **Tinggi:** ${data.highRiskCount}\n\n${data.atRisk.slice(0, 5).map((p: any) => `- **${p.name}**: ~${p.daysUntilStockout} hari tersisa (${p.riskLevel})`).join('\n')}`;
      }
      return JSON.stringify(data, null, 2);
    }

    case 'procurement': {
      if (data.recommendations) {
        if (langCode === 'en') {
          return `**${data.total} products** need restocking (safety stock ${data.safetyDays} days):\n**Total Investment:** Rp ${data.totalEstimatedInvestmentIdr?.toLocaleString(numLoc)}\n\n${data.recommendations.slice(0, 5).map((r: any) => `- **${r.name}**: Order ${r.suggestedReorderQty} units (${r.priority})`).join('\n')}`;
        }
        if (langCode === 'zh') {
          return `**${data.total} 个产品**需要补货（安全库存 ${data.safetyDays} 天）：\n**预计总投资：** Rp ${data.totalEstimatedInvestmentIdr?.toLocaleString(numLoc)}\n\n${data.recommendations.slice(0, 5).map((r: any) => `- **${r.name}**: 建议订购 ${r.suggestedReorderQty} 件 (${r.priority})`).join('\n')}`;
        }
        return `**${data.total} produk** perlu restock (safety ${data.safetyDays} hari):\n**Total Investasi:** Rp ${data.totalEstimatedInvestmentIdr?.toLocaleString(numLoc)}\n\n${data.recommendations.slice(0, 5).map((r: any) => `- **${r.name}**: Pesan ${r.suggestedReorderQty} unit (${r.priority})`).join('\n')}`;
      }
      return JSON.stringify(data, null, 2);
    }

    case 'operations': {
      if (data.healthScore !== undefined) {
        if (langCode === 'en') {
          return `**Store Health Score:** ${data.healthScore}/100 (${data.status})\n**Today's Revenue:** Rp ${data.revenueToday?.toLocaleString(numLoc)}\n**Transactions:** ${data.ordersToday}\n**Total Products:** ${data.totalProducts}\n**Low Stock:** ${data.lowStockCount} products`;
        }
        if (langCode === 'zh') {
          return `**店铺健康评分：** ${data.healthScore}/100 (${data.status})\n**今日营业额：** Rp ${data.revenueToday?.toLocaleString(numLoc)}\n**交易笔数：** ${data.ordersToday}\n**产品总数：** ${data.totalProducts}\n**库存告急：** ${data.lowStockCount} 个产品`;
        }
        return `**Skor Kesehatan Toko:** ${data.healthScore}/100 (${data.status})\n**Omzet Hari Ini:** Rp ${data.revenueToday?.toLocaleString(numLoc)}\n**Transaksi:** ${data.ordersToday}\n**Total Produk:** ${data.totalProducts}\n**Stok Menipis:** ${data.lowStockCount} produk`;
      }
      return JSON.stringify(data, null, 2);
    }

    default:
      return JSON.stringify(data, null, 2);
  }
}
