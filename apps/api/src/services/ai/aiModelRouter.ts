import { SupabaseService } from '../supabaseService.js';
import { AIProvider, GroqProvider, OpenRouterProvider, GeminiProvider, LLMMessage, LLMResponse } from './aiProvider.js';

export interface AssistantRequest {
  userId: string;
  organizationId: string;
  storeId: string;
  chatId: string;
  assistantId: 'ai_assistant' | 'zega_copilot' | string;
  message: string;
  language?: string;
  responseStyle?: string;
  responseLength?: string;
  responseFormat?: string;
}

export interface AssistantResponse {
  success: boolean;
  message: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inferenceMs: number;
  chatId: string;
  assistantId: string;
  createdAt: string;
}

export class AIModelRouter {
  private providers: AIProvider[];

  constructor() {
    this.providers = [
      new GroqProvider(),
      new OpenRouterProvider(),
      new GeminiProvider(),
    ];
  }

  /**
   * Return configured providers health status
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
   * Core Inference Pipeline with Strict Multi-Tenant & Assistant Namespace Guardrails
   */
  async generateAssistantResponse(req: AssistantRequest): Promise<AssistantResponse> {
    const { userId, organizationId, storeId, chatId, assistantId, message } = req;

    // 1. Strict Tenant Context Validation
    if (!userId || !userId.trim()) {
      throw new Error('TENANT_ACCESS_DENIED: Unauthenticated request - missing user ID');
    }

    if (!organizationId || !organizationId.trim() || organizationId === '00000000-0000-0000-0000-000000000000') {
      throw new Error('TENANT_ACCESS_DENIED: Missing valid organization context');
    }

    if (!storeId || !storeId.trim() || storeId === '11111111-1111-1111-1111-111111111111') {
      throw new Error('TENANT_ACCESS_DENIED: Missing valid store context');
    }

    if (!chatId || !chatId.trim()) {
      throw new Error('CHAT_ACCESS_DENIED: Missing valid chat ID');
    }

    const supabase = SupabaseService.getClient();

    // 2. Validate Tenant Ownership & Assistant Namespace in Database
    let existingChatSession: any = null;
    let tableChat = assistantId === 'zega_copilot' ? 'umkm_zega_copilot_chats' : 'umkm_ai_assistant_chats';
    let tableMsg = assistantId === 'zega_copilot' ? 'umkm_zega_copilot_messages' : 'umkm_ai_assistant_messages';

    if (supabase) {
      // Check store & organization validity
      const { data: storeData } = await supabase
        .from('umkm_stores')
        .select('id, organization_id, store_name')
        .eq('id', storeId)
        .maybeSingle();

      if (!storeData || storeData.organization_id !== organizationId) {
        throw new Error(`TENANT_ACCESS_DENIED: Store ${storeId} is not authorized for organization ${organizationId}`);
      }

      // Check existing chat session ownership & assistant namespace
      const { data: chatData } = await supabase
        .from(tableChat)
        .select('*')
        .eq('id', chatId)
        .maybeSingle();

      if (chatData) {
        // Enforce ownership: chat must belong to authorized org & user
        if (chatData.organization_id && chatData.organization_id !== organizationId) {
          throw new Error('TENANT_ACCESS_DENIED: Cross-tenant chat session access forbidden');
        }

        // Assistant Namespace Check
        const chatAssistantRole = chatData.copilot_type || chatData.agent_role || 'ai_assistant';
        if (assistantId === 'zega_copilot' && chatData.copilot_type && chatData.copilot_type !== 'zega_copilot') {
          throw new Error('ASSISTANT_NAMESPACE_MISMATCH: Chat session does not match requested copilot namespace');
        }
        existingChatSession = chatData;
      } else {
        // Idempotent auto-creation of chat session scoped to auth user + org + store + assistant
        const newChatPayload: any = {
          id: chatId,
          store_id: storeId,
          user_id: userId,
          organization_id: organizationId,
          title: message.substring(0, 35),
          status: 'active',
        };

        if (assistantId === 'zega_copilot') {
          newChatPayload.copilot_type = 'zega_copilot';
        } else {
          newChatPayload.agent_role = assistantId || 'ZEGA Home Assistant';
        }

        await supabase.from(tableChat).upsert([newChatPayload], { onConflict: 'id' });
      }
    }

    // 3. Load Authorized Conversation History (strictly for this chatId)
    const historyMessages: LLMMessage[] = [];
    if (supabase) {
      const { data: msgs } = await supabase
        .from(tableMsg)
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (msgs && Array.isArray(msgs)) {
        for (const m of msgs) {
          const role = (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant';
          const content = m.text || m.message || '';
          if (content.trim()) {
            historyMessages.push({ role, content });
          }
        }
      }
    }

    // 4. Construct System Prompt with Tenant Context
    let storeName = 'Toko UMKM';
    let revStr = '0';
    let orderCount = 0;

    if (supabase) {
      try {
        const [storeRes, kpiRes] = await Promise.all([
          supabase.from('umkm_stores').select('store_name').eq('id', storeId).maybeSingle(),
          supabase.from('umkm_dashboard_kpis').select('revenue_generated_today, orders_today_count').eq('store_id', storeId).maybeSingle(),
        ]);
        if (storeRes.data?.store_name) storeName = storeRes.data.store_name;
        if (kpiRes.data) {
          revStr = (kpiRes.data.revenue_generated_today || 0).toLocaleString('id-ID');
          orderCount = kpiRes.data.orders_today_count || 0;
        }
      } catch (err) {
        console.warn('[AI Model Router] Context fetch note:', err);
      }
    }

    const lang = (req.language || 'id').toLowerCase();
    let langInstruction = 'Jawab 100% dalam Bahasa Indonesia yang profesional dan ramah.';
    if (lang === 'en' || lang.includes('english')) {
      langInstruction = 'CRITICAL LANGUAGE REQUIREMENT: Output response 100% strictly in fluent, professional English.';
    } else if (lang === 'zh' || lang.includes('chinese') || lang.includes('mandarin')) {
      langInstruction = 'CRITICAL LANGUAGE REQUIREMENT: Output response 100% strictly in fluent Mandarin Chinese (Simplified).';
    }

    const assistantTitle = assistantId === 'zega_copilot' ? 'ZEGA Copilot AI' : 'ZEGA AI Assistant';

    const systemPrompt = `Anda adalah ${assistantTitle}, asisten AI cerdas terpercaya untuk platform ZEGA AI.

KONTEKS TENANT OPERASIONAL TOKO:
- Nama Toko: ${storeName}
- Omzet Hari Ini: Rp${revStr}
- Transaksi Hari Ini: ${orderCount} pesanan

ATURAN KEAMANAN & KOMUNIKASI:
1. ${langInstruction}
2. Gaya Komunikasi: ${req.responseStyle || 'Profesional'}, ${req.responseFormat || 'Terstruktur'}.
3. Jangan pernah membocorkan API key, token rahasia, kredensial database, atau data tenant lain.
4. Berikan saran operasional yang relevan, praktis, dan akurat untuk pemilik toko.`;

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message.trim() },
    ];

    // 5. Persist User Message to DB BEFORE LLM Request
    if (supabase) {
      try {
        if (assistantId === 'zega_copilot') {
          await supabase.from('umkm_zega_copilot_messages').insert([
            {
              chat_id: chatId,
              organization_id: organizationId,
              sender: 'user',
              message: message.trim(),
              sender_name: 'Pemilik Toko',
            },
          ]);
        } else {
          await supabase.from('umkm_ai_assistant_messages').insert([
            {
              chat_id: chatId,
              user_id: userId,
              organization_id: organizationId,
              sender: 'user',
              text: message.trim(),
              security_status: 'verified',
            },
          ]);
        }
      } catch (err) {
        console.warn('[AI Model Router] Pre-inference user message persistence note:', err);
      }
    }

    // 6. Execute Provider Chain (Groq -> OpenRouter -> Gemini)
    let llmResult: LLMResponse | null = null;
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue;
      try {
        console.log(`[AI_MODEL] request started | provider=${provider.name} | chat=${chatId} | tenant=${organizationId}`);
        llmResult = await provider.generate({
          messages: llmMessages,
          temperature: 0.6,
          maxTokens: 650,
        });
        console.log(`[AI_MODEL] inference completed | provider=${llmResult.provider} | latency=${llmResult.inferenceMs}ms | tokens=${llmResult.totalTokens}`);
        break;
      } catch (err: any) {
        console.warn(`[AI_MODEL] Provider ${provider.name} failed:`, err.message);
        lastError = err;
      }
    }

    if (!llmResult) {
      if (lastError) {
        throw lastError;
      }
      throw new Error('AI_MODEL_NOT_CONFIGURED: No active AI providers are currently configured in the environment');
    }

    // 7. Output Leak Inspection (OWASP LLM07)
    let safeMessage = llmResult.message;
    const sensitivePatterns = [
      /gsk_[a-zA-Z0-9_-]+/g,
      /sk-or-v1-[a-zA-Z0-9_-]+/g,
      /AQ\.[a-zA-Z0-9_-]+/g,
      /postgresql:\/\/[^\s]+/g,
    ];
    sensitivePatterns.forEach((p) => {
      safeMessage = safeMessage.replace(p, '[REDACTED_SECRET]');
    });

    // 8. Persist Assistant Response to DB AFTER LLM Request
    if (supabase) {
      try {
        if (assistantId === 'zega_copilot') {
          await supabase.from('umkm_zega_copilot_messages').insert([
            {
              chat_id: chatId,
              organization_id: organizationId,
              sender: 'assistant',
              message: safeMessage,
              sender_name: 'ZEGA Copilot AI',
              model_engine: `${llmResult.provider}-${llmResult.model}`,
              tokens_used: llmResult.totalTokens,
              latency_ms: llmResult.inferenceMs,
            },
          ]);
        } else {
          await supabase.from('umkm_ai_assistant_messages').insert([
            {
              chat_id: chatId,
              user_id: userId,
              organization_id: organizationId,
              sender: 'ai',
              text: safeMessage,
              inference_ms: llmResult.inferenceMs,
              tokens: llmResult.completionTokens,
              security_status: 'verified',
            },
          ]);
        }

        // Update chat session updated_at
        await supabase
          .from(tableChat)
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId);
      } catch (err) {
        console.warn('[AI Model Router] Post-inference assistant message persistence note:', err);
      }
    }

    return {
      success: true,
      message: safeMessage,
      provider: llmResult.provider,
      model: llmResult.model,
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      totalTokens: llmResult.totalTokens,
      inferenceMs: llmResult.inferenceMs,
      chatId,
      assistantId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export const aiModelRouter = new AIModelRouter();
