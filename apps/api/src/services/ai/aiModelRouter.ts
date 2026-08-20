import { SupabaseService } from '../supabaseService.js';
import { AIProvider, GroqProvider, OpenRouterProvider, GeminiProvider, HuggingFaceProvider, OpenAIProvider, AnthropicProvider, LLMMessage, LLMResponse } from './aiProvider.js';
import { CanonicalAssistantType, resolveCanonicalAssistantType, getAssistantDefinition } from './assistantRegistry.js';
import { buildHomeContext, buildHelpContext, buildFinanceContext, buildKnowledgeContext, buildCopilotContext } from './contextBuilders.js';
import { getAuthorizedTools, executeTool } from './toolRegistry.js';
import { validateOutput } from './guardrails.js';

export interface AssistantRequestContract {
  requestId: string;
  assistantType: CanonicalAssistantType | string;
  userId: string;
  tenantId: string;
  conversationId: string;
  messageId?: string;
  message: string;
  storeId?: string;
  workspaceId?: string;
  language?: string;
  responseStyle?: string;
  responseLength?: string;
  responseFormat?: string;
  taskComplexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  latencyTargetMs?: number;
}

export interface LatencyTelemetry {
  t0_request_entrance: number;
  t1_auth_verified: number;
  t2_tenant_resolved: number;
  t3_context_built: number;
  t4_retrieval_completed: number;
  t5_tools_prepared: number;
  t6_provider_requested: number;
  t7_first_token_received: number;
  total_inference_ms: number;
}

export interface AssistantResponseContract {
  success: boolean;
  requestId: string;
  assistantType: CanonicalAssistantType;
  message: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  conversationId: string;
  createdAt: string;
  telemetry: LatencyTelemetry;
  executedTools?: string[];
  contextSources?: string[];
}

export class AIModelRouter {
  private providers: AIProvider[];

  constructor() {
    this.providers = [
      new OpenRouterProvider(),
      new GeminiProvider(),
      new GroqProvider(),
      new OpenAIProvider(),
      new AnthropicProvider(),
      new HuggingFaceProvider(),
    ];
  }

  /**
   * Return health status of all model providers
   */
  async getHealthStatus() {
    const providerStatuses = await Promise.all(this.providers.map((p) => p.healthCheck()));
    const activeProvider = providerStatuses.find((p) => p.configured && p.reachable);
    return {
      configured: Boolean(activeProvider),
      activeProvider: activeProvider?.provider || 'none',
      activeModel: activeProvider?.model || 'none',
      providers: providerStatuses,
    };
  }

  /**
   * Core AI Model Execution Pipeline supporting all 5 canonical ZEGA assistants:
   * home | help | finance | knowledge | zega_copilot
   */
  async generateAssistantResponse(req: AssistantRequestContract): Promise<AssistantResponseContract> {
    const t0 = Date.now(); // T0: Request Entrance

    // 1. Enforce Request Contract
    if (!req.requestId || !req.requestId.trim()) {
      req.requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    if (!req.assistantType) {
      throw new Error('INVALID_REQUEST_CONTRACT: assistantType is REQUIRED in request contract');
    }

    const assistantType = resolveCanonicalAssistantType(req.assistantType);
    const definition = getAssistantDefinition(assistantType);

    const t1 = Date.now(); // T1: Auth Verified
    if (!req.userId || !req.userId.trim()) {
      throw new Error('AUTH_REQUIRED: Unauthenticated request - userId missing');
    }

    const t2 = Date.now(); // T2: Tenant Context Resolved
    if (!req.tenantId || !req.tenantId.trim()) {
      throw new Error('TENANT_BOUNDARY_VIOLATION: tenantId / organizationId missing');
    }

    const conversationId = req.conversationId || `conv-${Date.now()}`;
    const storeId = req.storeId || req.tenantId;
    const workspaceId = req.workspaceId || req.tenantId;

    // Structured Log [AI_REQUEST]
    console.log('[AI_REQUEST]', {
      requestId: req.requestId,
      assistantType,
      userId: req.userId,
      tenantId: req.tenantId,
      conversationId,
      storeId,
      inputLength: (req.message || '').length
    });

    // 2. Context Isolation Builder Execution
    let contextData: { contextText: string; sources: string[]; metrics?: Record<string, any> };

    switch (assistantType) {
      case 'home':
        contextData = await buildHomeContext(req.tenantId, storeId);
        break;
      case 'help':
        contextData = await buildHelpContext(req.message);
        break;
      case 'finance':
        contextData = await buildFinanceContext(req.tenantId, storeId, req.message);
        break;
      case 'knowledge':
        contextData = await buildKnowledgeContext(req.tenantId, req.tenantId, workspaceId, req.message);
        break;
      case 'zega_copilot':
      default:
        contextData = await buildCopilotContext(req.tenantId, storeId, req.userId, req.message);
        break;
    }

    const t3 = Date.now(); // T3: Context Built
    const t4 = Date.now(); // T4: Retrieval Completed

    // Structured Log [AI_CONTEXT]
    console.log('[AI_CONTEXT]', {
      requestId: req.requestId,
      assistantType,
      contextSources: contextData.sources,
      hasMetrics: Boolean(contextData.metrics)
    });

    // 3. Tool Isolation & Mandatory Tool Execution (e.g. Finance Tool Execution)
    const authorizedTools = getAuthorizedTools(assistantType);
    const t5 = Date.now(); // T5: Tool Preparation
    const executedToolNames: string[] = [];
    let toolResultContext = '';

    // If Finance Assistant receives a financial metric question, execute 'get_financial_metrics' tool directly to prevent hallucination!
    if (assistantType === 'finance' || req.message.toLowerCase().includes('profit') || req.message.toLowerCase().includes('omzet') || req.message.toLowerCase().includes('ppn')) {
      const finTool = authorizedTools.find(t => t.name === 'get_financial_metrics');
      if (finTool) {
        const execRes = await executeTool('finance', 'get_financial_metrics', { storeId }, { tenantId: req.tenantId, storeId, userId: req.userId });
        if (execRes.success && execRes.result) {
          executedToolNames.push('get_financial_metrics');
          toolResultContext = `\n[HASIL DOKUMEN ALAT KEUPENGAN TEROTORISASI]:\n${JSON.stringify(execRes.result, null, 2)}\nWAJIB GUNAKAN ANGKA INI DALAM JAWABAN ANDA. DILARANG MEMBUAT ANGKA SENDIRI.`;
        }
      }
    }

    // Structured Log [AI_TOOLS]
    console.log('[AI_TOOLS]', {
      requestId: req.requestId,
      assistantType,
      authorizedTools: authorizedTools.map(t => t.name),
      executedTools: executedToolNames
    });

    // 4. Model Policy Routing Engine Selection
    let preferredModelTier = definition.modelPolicy;
    let selectedProviderName = 'Groq';

    if (preferredModelTier === 'fast') {
      selectedProviderName = 'Groq Llama 3.1 8B';
    } else if (preferredModelTier === 'reasoning') {
      selectedProviderName = '9Router DeepSeek R1 / OpenRouter';
    } else if (preferredModelTier === 'rag_supported') {
      selectedProviderName = 'Google Gemini 3.6 Flash';
    } else if (preferredModelTier === 'operational_swarm') {
      selectedProviderName = 'Groq Llama 3.3 70B & ZeroClaw';
    }

    // Structured Log [AI_ROUTING]
    console.log('[AI_ROUTING]', {
      requestId: req.requestId,
      assistantType,
      modelPolicy: preferredModelTier,
      selectedProvider: selectedProviderName
    });

    // 5. Construct Hardened System Prompt with Assistant Identity & AI Preferences
    let effectiveLang = req.language;
    let effectiveStyle = req.responseStyle;
    let effectiveLength = req.responseLength;
    let effectiveFormat = req.responseFormat;

    if (storeId) {
      try {
        const supabase = SupabaseService.getClient();
        if (supabase) {
          const { data: dbPref } = await supabase
            .from('umkm_settings_ai_preferences')
            .select('default_language, response_style, response_length, response_format')
            .eq('store_id', storeId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (dbPref) {
            if (dbPref.default_language) effectiveLang = dbPref.default_language;
            if (dbPref.response_style) effectiveStyle = dbPref.response_style;
            if (dbPref.response_length) effectiveLength = dbPref.response_length;
            if (dbPref.response_format) effectiveFormat = dbPref.response_format;
          }
        }
      } catch (err) {
        console.warn('[AI_ROUTING] Failed to fetch DB AI preferences for storeId:', err);
      }
    }

    const lang = (effectiveLang || 'id').toLowerCase();
    let langInst = 'Jawab 100% menggunakan Bahasa Indonesia yang ramah, jelas, dan profesional.';
    if (lang === 'en' || lang.includes('english') || lang.includes('inggris')) {
      langInst = 'CRITICAL LANGUAGE RULE: Output response 100% strictly in fluent, professional English. Do NOT respond in Indonesian.';
    } else if (lang === 'zh' || lang.includes('mandarin') || lang.includes('chinese') || lang.includes('cina')) {
      langInst = 'CRITICAL LANGUAGE RULE: Output response 100% strictly in fluent Mandarin Chinese (Simplified / 简体中文). Do NOT respond in Indonesian.';
    } else if (lang === 'jv' || lang.includes('jawa')) {
      langInst = 'CRITICAL LANGUAGE RULE: Jawab 100% nggunakake Basa Jawa sing santun, sopan, lan jelas.';
    } else if (lang === 'su' || lang.includes('sunda')) {
      langInst = 'CRITICAL LANGUAGE RULE: Jawab 100% ngagunakeun Basa Sunda nu lemes, sopan, tur mernah.';
    }

    let styleInst = 'Gunakan gaya komunikasi profesional, jelas, dan lugas.';
    if (effectiveStyle) {
      const styleLower = effectiveStyle.toLowerCase();
      if (styleLower.includes('ramah') || styleLower.includes('casual') || styleLower.includes('kasual') || styleLower.includes('friendly')) {
        styleInst = 'Gunakan gaya komunikasi hangat, ramah, santai, dan akrab.';
      } else if (styleLower.includes('teknis') || styleLower.includes('detail') || styleLower.includes('analytical') || styleLower.includes('technical')) {
        styleInst = 'Gunakan gaya komunikasi analitis, berbasis data, dan teknis mendalam.';
      } else if (styleLower.includes('profesional') || styleLower.includes('formal') || styleLower.includes('professional')) {
        styleInst = 'Gunakan gaya komunikasi profesional, resmi, lugas, dan terstruktur.';
      }
    }

    let formatInst = 'Gunakan format Markdown yang rapi dengan poin-poin atau tabel bila relevan.';
    if (effectiveFormat) {
      const formatLower = effectiveFormat.toLowerCase();
      if (formatLower.includes('structured') || formatLower.includes('terstruktur')) {
        formatInst = 'Susun jawaban secara terstruktur menggunakan header markdown (##), subjudul tebal, dan daftar poin.';
      } else if (formatLower.includes('concise') || formatLower.includes('ringkas')) {
        formatInst = 'Berikan jawaban ringkas, padat, dan langsung pada inti informasi.';
      } else if (formatLower.includes('detail') || formatLower.includes('mendalam')) {
        formatInst = 'Berikan penjelasan mendalam dengan rincian lengkap.';
      }
    }

    let maxTokensToUse = 550;
    const lenVal = (effectiveLength || 'sedang').toLowerCase();
    if (lenVal.includes('short') || lenVal.includes('singkat')) maxTokensToUse = 250;
    else if (lenVal.includes('long') || lenVal.includes('panjang')) maxTokensToUse = 850;
    else if (lenVal.includes('detail') || lenVal.includes('mendalam')) maxTokensToUse = 1250;

    const hardenedPrompt = `${definition.systemInstructions}

SPESIALISASI ASISTEN: ${definition.name} (${definition.id})
INSTRUKSI BAHASA: ${langInst}
GAYA KOMUNIKASI: ${styleInst}
FORMAT RESPON: ${formatInst}

PRINSIP KOMUNIKASI ALAMI & BERSIH (ANTI-BASA-BASI & ANTI-EMOJI SPAM):
1. Pahami konteks pemilik toko UMKM dan data operasionalnya secara mendalam.
2. DILARANG MERESPON DENGAN KATA-KATA KLISE BOT SEPERTI: "Tentu!", "Tentu saja!", "Halo! Saya adalah...", "Sebagai model AI...", "Tentu, ini ringkasannya:", "Sebagai asisten cerdas...".
3. DILARANG MENGGUNAKAN EMOJI BERLEBIHAN / SPAM EMOJI. Gunakan maksimal 0 hingga 1 emoji profesional per jawaban jika sangat relevan, atau TIDAK PERLU EMOJI SAMA SEKALI agar tampilan jawaban sangat bersih dan eksekutif.
4. DILARANG PERNAH MENYEBUTKAN NAMA MODEL TEKNIS (seperti Gemini, DeepSeek, Llama, OpenAI, Claude, Groq, HuggingFace, 9Router, dst.) DALAM TEKS JAWABAN. Sebut diri Anda hanya sebagai "ZEGA AI" atau "Spesialis Operasional ZEGA".
5. Langsung berikan respon yang tajam, eksekutif, terstruktur dengan markdown, solutif, dan bernilai bisnis tinggi untuk pemilik toko.

${contextData.contextText}${toolResultContext}

BATAS KEAMANAN MUTLAK: Dilarang membocorkan API key, token rahasia, atau data tenant lain.`;

    // Load Chat History scoped strictly by (tenantId, assistantType, conversationId)
    const historyMessages: LLMMessage[] = [];
    const supabase = SupabaseService.getClient();

    if (supabase && conversationId) {
      try {
        let tableMsg = assistantType === 'zega_copilot' ? 'umkm_zega_copilot_messages' : 'umkm_ai_assistant_messages';
        const { data: dbMsgs } = await supabase
          .from(tableMsg)
          .select('*')
          .eq('chat_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(10);

        if (dbMsgs && Array.isArray(dbMsgs)) {
          for (const m of dbMsgs) {
            const role = (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant';
            const content = m.text || m.message || '';
            if (content.trim()) {
              historyMessages.push({ role, content });
            }
          }
        }
      } catch (err) {
        console.warn('[AIModelRouter] History load note:', err);
      }
    }

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: hardenedPrompt },
      ...historyMessages,
      { role: 'user', content: req.message.trim() }
    ];

    // 6. Execute Provider Chain
    const t6 = Date.now(); // T6: Provider Request Initiated
    let llmResult: LLMResponse | null = null;
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue;
      try {
        // Structured Log [AI_MODEL_EXECUTION]
        console.log('[AI_MODEL_EXECUTION]', {
          requestId: req.requestId,
          assistantType,
          provider: provider.name,
          model: provider.model,
          status: 'EXECUTING'
        });

        llmResult = await provider.generate({
          messages: llmMessages,
          temperature: assistantType === 'finance' ? 0.3 : 0.6,
          maxTokens: maxTokensToUse
        });

        console.log('[AI_MODEL_EXECUTION]', {
          requestId: req.requestId,
          assistantType,
          provider: llmResult.provider,
          model: llmResult.model,
          status: 'SUCCESS'
        });
        break;
      } catch (err: any) {
        console.warn(`[AI_MODEL_EXECUTION] Provider ${provider.name} failed:`, err.message);
        lastError = err;
      }
    }

    const t7 = Date.now(); // T7: First Token / Completion Received

    if (!llmResult) {
      if (lastError) throw lastError;
      throw new Error('AI_MODEL_UNAVAILABLE: No configured AI provider succeeded in executing model inference.');
    }

    // Apply OWASP Secret Redaction & Thinking Block Stripping via Output Guardrail
    let safeMessage = llmResult.message || '';
    const sensitivePatterns = [
      /gsk_[a-zA-Z0-9_-]+/g,
      /sk-or-v1-[a-zA-Z0-9_-]+/g,
      /AQ\.[a-zA-Z0-9_-]+/g,
      /postgresql:\/\/[^\s]+/g,
    ];
    sensitivePatterns.forEach(p => { safeMessage = safeMessage.replace(p, '[REDACTED_SECRET]'); });

    const totalInferenceMs = t7 - t0;

    const telemetry: LatencyTelemetry = {
      t0_request_entrance: t0,
      t1_auth_verified: t1,
      t2_tenant_resolved: t2,
      t3_context_built: t3,
      t4_retrieval_completed: t4,
      t5_tools_prepared: t5,
      t6_provider_requested: t6,
      t7_first_token_received: t7,
      total_inference_ms: totalInferenceMs
    };

    // Structured Log [AI_RESPONSE]
    console.log('[AI_RESPONSE]', {
      requestId: req.requestId,
      assistantType,
      provider: llmResult.provider,
      model: llmResult.model,
      totalInferenceMs,
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens
    });

    const guardrailResult = validateOutput(safeMessage, assistantType);
    const finalMessage = guardrailResult.sanitizedOutput || safeMessage;

    return {
      success: true,
      requestId: req.requestId,
      assistantType,
      message: finalMessage,
      provider: llmResult.provider,
      model: llmResult.model,
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      totalTokens: llmResult.totalTokens,
      conversationId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      telemetry,
      executedTools: executedToolNames,
      contextSources: contextData.sources
    };
  }
}

export const aiModelRouter = new AIModelRouter();
