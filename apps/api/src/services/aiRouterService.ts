import { envConfig } from '../config/env.js';
import { ZeroClawGatewayClient } from '@zega/zeroclaw-bridge';
import crypto from 'node:crypto';
import { CanonicalAssistantType, resolveCanonicalAssistantType, getAssistantDefinition } from './ai/assistantRegistry.js';
import { aiModelRouter } from './ai/aiModelRouter.js';
import { orchestrateAgentSwarm } from './ai/agentSwarmOrchestrator.js';

let zeroclawClientSingleton: any = null;

function getZeroClawClient(gatewayUrl: string, bearerToken?: string): any {
  if (!zeroclawClientSingleton) {
    zeroclawClientSingleton = new ZeroClawGatewayClient({
      gatewayUrl: gatewayUrl || 'http://127.0.0.1:4242',
      bearerToken: bearerToken,
      timeoutMs: 1200,
    });
  }
  return zeroclawClientSingleton;
}

export type TaskComplexity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ChatMessageContext {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RouteExecutionResult {
  replyText: string;
  aiModel: string;
  complexity: TaskComplexity;
  provider: string;
  inferenceMs: number;
  requestFingerprint?: string;
  repetitionDetected?: boolean;
  assistantType?: CanonicalAssistantType;
}

export interface RouteExecutionOptions {
  rawInput: string;
  hardenedSystemPrompt: string;
  maxTokensToUse: number;
  agentRole?: string;
  assistantType?: CanonicalAssistantType | string;
  targetLangCode?: string;
  chatHistory?: ChatMessageContext[];
  requestId?: string;
  requestFingerprint?: string;
  storeId?: string;
  tenantId?: string;
  userId?: string;
  conversationId?: string;
  logger?: any;
}

// In-memory cache to detect identical outputs generated for distinct inputs
const recentResponseHashMap = new Map<string, { inputFingerprint: string; timestamp: number }>();

/**
 * ZEGA AI — Smart Task Complexity Evaluator
 * Evaluates jobdesk/prompt difficulty to select the optimal model tier.
 */
export function evaluateTaskComplexity(input: string, agentRole?: string): TaskComplexity {
  const text = (input || '').toLowerCase().trim();
  const role = (agentRole || '').toLowerCase();

  // Role-based override: High complexity domains
  if (
    role.includes('finance') ||
    role.includes('zeroclaw') ||
    role.includes('cfo') ||
    role.includes('audit') ||
    role.includes('developer')
  ) {
    return 'HIGH';
  }

  // Keywords indicating High / Reasoning complexity
  const highKeywords = [
    'finance', 'solana', 'settlement', 'ppn', 'pph', 'pajak', 'cash flow', 'cashflow',
    'laporan keuangan', 'margin', 'proyeksi', 'audit', 'investasi', 'sop', 'otomatisasi',
    'workflow', 'algoritma', 'analisis data', 'rekonsiliasi', 'privy', 'wallet', 'crypto',
    'hitung', 'rumus', 'break even', 'bep', 'roi', 'neraca', 'laba rugi'
  ];

  if (highKeywords.some((kw) => text.includes(kw))) {
    return 'HIGH';
  }

  // Keywords indicating Medium complexity
  const mediumKeywords = [
    'strategi', 'marketing', 'promosi', 'diskon', 'stok', 'inventaris', 'harga',
    'pelanggan', 'pos', 'kasir', 'whatsapp', 'rekomendasi', 'optimasi', 'konten',
    'caption', 'iklan', 'penjualan', 'omzet', 'toko', 'produk', 'supplier', 'pesanan'
  ];

  if (mediumKeywords.some((kw) => text.includes(kw)) || text.length > 150) {
    return 'MEDIUM';
  }

  // Low complexity checks
  if (
    text.length < 30 ||
    text.startsWith('hi') ||
    text.startsWith('halo') ||
    text.startsWith('pagi') ||
    text.startsWith('siang') ||
    text.startsWith('malam') ||
    text.includes('terima kasih') ||
    text.includes('thanks') ||
    text.includes('apa itu zega') ||
    text.includes('siapa kamu')
  ) {
    return 'LOW';
  }

  return 'MEDIUM';
}

/**
 * Build messages payload array including conversation history for OpenAI-compatible LLMs.
 */
function buildMessagesPayload(
  hardenedSystemPrompt: string,
  rawInput: string,
  chatHistory?: ChatMessageContext[]
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: hardenedSystemPrompt }
  ];

  if (chatHistory && chatHistory.length > 0) {
    // Sanitize and include at most recent 6 messages to stay within prompt budgets
    const sanitizedHistory = chatHistory.slice(-6).filter(m => m.content && m.content.trim());
    for (const msg of sanitizedHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content.trim()
      });
    }
  }

  // Ensure current user message is always the last item
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== rawInput.trim()) {
    messages.push({ role: 'user', content: rawInput.trim() });
  }

  return messages;
}

/**
 * Execute dynamic model routing based on task complexity and canonical assistant type.
 */
export async function executeRoutedModelPipeline(
  options: RouteExecutionOptions
): Promise<RouteExecutionResult> {
  const {
    rawInput,
    hardenedSystemPrompt,
    maxTokensToUse,
    agentRole,
    assistantType: rawAssistantType,
    chatHistory,
    requestId,
    requestFingerprint,
    storeId,
    tenantId,
    userId,
    conversationId,
    logger
  } = options;

  const startTime = Date.now();
  const canonicalType = resolveCanonicalAssistantType(rawAssistantType || agentRole);

  const inputHash = crypto.createHash('sha256').update(`${storeId || ''}:${rawInput}`).digest('hex');
  const computedFingerprint = requestFingerprint || inputHash.slice(0, 16);

  const complexity = evaluateTaskComplexity(rawInput, agentRole);

  const groqApiKey = envConfig.GROQ_API_KEY || process.env.GROQ_API_KEY;
  const openrouterApiKey = envConfig.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  const geminiApiKey = envConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const nineRouterApiKey = envConfig.NINE_ROUTER_API_KEY || process.env.NINE_ROUTER_API_KEY;
  const zeroclawGatewayUrl = envConfig.ZEROCLAW_GATEWAY_URL || process.env.ZEROCLAW_GATEWAY_URL || 'http://127.0.0.1:4242';
  const zeroclawBearerToken = envConfig.ZEROCLAW_BEARER_TOKEN || process.env.ZEROCLAW_BEARER_TOKEN;

  if (logger) {
    logger.info(
      {
        requestId,
        assistantType: canonicalType,
        requestFingerprint: computedFingerprint,
        complexity,
        agentRole,
        historyLength: chatHistory?.length || 0,
        inputLength: rawInput.length,
      },
      '[AI_ROUTER] Evaluated Task Complexity & Available Providers'
    );
  }

  let replyText = '';
  let aiModel = 'fallback-llama-3.3-70b';
  let provider = 'Unknown';

  // Inter-Agent Swarm Orchestration Directive Synthesis
  const swarmResult = orchestrateAgentSwarm(canonicalType, rawInput);
  const enrichedSystemPrompt = `${hardenedSystemPrompt}${swarmResult.synthesizedDirective}`;

  const messagesPayload = buildMessagesPayload(enrichedSystemPrompt, rawInput, chatHistory);

  // Fast fetch wrapper with AbortController timeout
  async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 3000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // Helper to map assistant types to specialized ZeroClaw Agent aliases
  function getZeroClawAgentAlias(type: CanonicalAssistantType): string {
    switch (type) {
      case 'finance': return 'finance-specialist';
      case 'zega_copilot': return 'copilot-engineer';
      case 'knowledge': return 'knowledge-researcher';
      case 'help': return 'help-concierge';
      case 'home': default: return 'home-agent';
    }
  }

  const isHighReasoningTask = complexity === 'HIGH' || canonicalType === 'finance' || canonicalType === 'zega_copilot';

  // ========================================================================
  // 🎯 ASSISTANT-SPECIALIZED MULTI-MODEL ROUTING PIPELINE
  // - home: Ultra-fast LPU (qwen3.6-27b / gpt-oss-20b) -> gpt-4o-mini
  // - help: Friendly fast support (qwen3.6-27b / claude-3-haiku) -> gemini-3.6-flash
  // - knowledge: Deep RAG & High-Context (deepseek-chat / kimi-k2.5) -> groq-compound
  // - finance: ZeroClaw Finance Daemon -> gpt-4o -> claude-sonnet-5 -> groq-compound
  // - zega_copilot: ZeroClaw Copilot Daemon -> claude-sonnet-5 -> kimi-k2.5 -> gpt-4o
  // ========================================================================

  // ------------------------------------------------------------------------
  // 1. ZEROCLAW GATEWAY DAEMON (Primary for Finance, Copilot & Knowledge Agents)
  // ------------------------------------------------------------------------
  if (!replyText && (canonicalType === 'finance' || canonicalType === 'zega_copilot' || canonicalType === 'knowledge')) {
    if (zeroclawBearerToken || (agentRole || '').toLowerCase().includes('zeroclaw')) {
      try {
        const zeroclawClient = getZeroClawClient(zeroclawGatewayUrl, zeroclawBearerToken);
        const targetAgentAlias = getZeroClawAgentAlias(canonicalType);

        const healthData = await Promise.race([
          zeroclawClient.health(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 800))
        ]);

        if (healthData && (healthData.paired || healthData.status === 'ok')) {
          const historySummary = chatHistory?.length
            ? `\n\nContext History:\n${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
            : '';

          const zcRes = await zeroclawClient.webhook(
            `${hardenedSystemPrompt}${historySummary}\n\nPesan User: ${rawInput}`,
            targetAgentAlias
          );

          const replyVal = zcRes.response || (zcRes as any).reply;
          if (zcRes && replyVal && String(replyVal).trim()) {
            replyText = String(replyVal).trim();
            aiModel = `zeroclaw-agent-v0.8-${targetAgentAlias}`;
            provider = `ZeroClaw Gateway Daemon (${targetAgentAlias})`;
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs, agentAlias: targetAgentAlias, assistantType: canonicalType }, '[AI_ROUTER] ZeroClaw Agent Succeeded');
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message, assistantType: canonicalType }, '[AI_ROUTER] ZeroClaw Bridge Failover');
      }
    }
  }

  // ------------------------------------------------------------------------
  // 2. GROQ LPU HARDWARE ACCELERATION (Sub-800ms Fast Inference Pool)
  // ------------------------------------------------------------------------
  if (!replyText && groqApiKey) {
    const groqCandidatePool = canonicalType === 'finance' || canonicalType === 'zega_copilot'
      ? ['groq/compound', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b']
      : canonicalType === 'knowledge'
      ? ['groq/compound', 'qwen/qwen3.6-27b', 'groq/compound-mini']
      : ['qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'groq/compound-mini'];

    for (const targetGroqModel of groqCandidatePool) {
      try {
        const groqRes = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: targetGroqModel,
              messages: messagesPayload,
              temperature: canonicalType === 'finance' ? 0.2 : 0.6,
              max_tokens: maxTokensToUse,
            }),
          },
          2500
        );

        if (groqRes.ok) {
          const groqData: any = await groqRes.json();
          let groqText = groqData.choices?.[0]?.message?.content;
          if (groqText && groqText.trim()) {
            groqText = groqText.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*/gi, '').trim() || groqText.trim();
            replyText = groqText;
            aiModel = `groq-${targetGroqModel.split('/')[1] || targetGroqModel}`;
            provider = `Groq LPU (${targetGroqModel.split('/')[1] || targetGroqModel})`;
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs, model: targetGroqModel, assistantType: canonicalType }, '[AI_ROUTER] Groq LPU Route Succeeded');
            break;
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message, model: targetGroqModel }, '[AI_ROUTER] Groq Failover Triggered');
      }
    }
  }

  // ------------------------------------------------------------------------
  // 3. OPENROUTER ASSISTANT-SPECIALIZED MULTI-MODEL GATEWAY
  // ------------------------------------------------------------------------
  if (!replyText && openrouterApiKey) {
    const openrouterCandidatePool = canonicalType === 'finance'
      ? ['openai/gpt-4o', 'anthropic/claude-sonnet-5', 'deepseek/deepseek-chat']
      : canonicalType === 'zega_copilot'
      ? ['anthropic/claude-sonnet-5', 'moonshotai/kimi-k2.5', 'openai/gpt-4o']
      : canonicalType === 'knowledge'
      ? ['deepseek/deepseek-chat', 'moonshotai/kimi-k2.5', 'qwen/qwen-2.5-72b-instruct']
      : canonicalType === 'help'
      ? ['anthropic/claude-3-haiku', 'openai/gpt-4o-mini', 'qwen/qwen-2.5-72b-instruct']
      : ['qwen/qwen-2.5-72b-instruct', 'openai/gpt-4o-mini', 'deepseek/deepseek-chat'];

    for (const targetOrModel of openrouterCandidatePool) {
      try {
        const orRes = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openrouterApiKey}`,
              'HTTP-Referer': 'https://zegaai.site',
              'X-Title': 'ZEGA Enterprise AI Platform',
            },
            body: JSON.stringify({
              model: targetOrModel,
              messages: messagesPayload,
              temperature: canonicalType === 'finance' ? 0.2 : 0.6,
              max_tokens: maxTokensToUse,
            }),
          },
          3000
        );

        if (orRes.ok) {
          const orData: any = await orRes.json();
          let orText = orData.choices?.[0]?.message?.content;
          if (orText && orText.trim()) {
            orText = orText.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*/gi, '').trim() || orText.trim();
            replyText = orText;
            aiModel = `openrouter-${targetOrModel.split('/')[1] || targetOrModel}`;
            provider = `OpenRouter (${targetOrModel.split('/')[1] || targetOrModel})`;
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs, model: targetOrModel, assistantType: canonicalType }, '[AI_ROUTER] OpenRouter Route Succeeded');
            break;
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message, model: targetOrModel }, '[AI_ROUTER] OpenRouter Failover Triggered');
      }
    }
  }


  // ------------------------------------------------------------------------
  // ROUTE STRATEGY D: GEMINI 3.6 FLASH (Google AI Flagship Fallback)
  // ------------------------------------------------------------------------
  if (!replyText && geminiApiKey) {
    try {
      const formattedHistoryParts = chatHistory?.length
        ? chatHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        : [];

      const contentsPayload = [
        {
          role: 'user',
          parts: [{ text: `${hardenedSystemPrompt}\n\nPesan User: ${rawInput}` }],
        },
        ...formattedHistoryParts
      ];

      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contentsPayload,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: maxTokensToUse,
            },
          }),
        },
        6000
      );

      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          replyText = text.trim();
          aiModel = 'gemini-3.6-flash';
          provider = 'Google Gemini 3.6 Flash';
          const inferenceMs = Date.now() - startTime;
          if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] Gemini 3.6 Flash Succeeded');
        }
      }
    } catch (err: any) {
      if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] Gemini Flash Failover Triggered');
    }
  }

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY E: HUGGINGFACE INFERENCE API ROUTE (DeepSeek V3/V4, DeepSeek R1, Qwen 2.5)
  // ------------------------------------------------------------------------
  const huggingfaceApiKey = envConfig.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!replyText && huggingfaceApiKey) {
    const hfCandidateModels = [
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct'
    ];

    for (const hfModel of hfCandidateModels) {
      try {
        const hfRes = await fetchWithTimeout(
          'https://router.huggingface.co/hf-inference/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${huggingfaceApiKey}`,
            },
            body: JSON.stringify({
              model: hfModel,
              messages: messagesPayload,
              max_tokens: maxTokensToUse,
              temperature: canonicalType === 'finance' ? 0.3 : 0.6,
            }),
          },
          6000
        );

        if (hfRes.ok) {
          const hfData: any = await hfRes.json();
          const hfText = hfData.choices?.[0]?.message?.content;
          if (hfText && hfText.trim()) {
            replyText = hfText.trim();
            aiModel = `hf-${hfModel.split('/')[1] || hfModel}`;
            provider = `HuggingFace (${hfModel.split('/')[1] || hfModel})`;
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs, model: hfModel }, '[AI_ROUTER] HuggingFace Model Succeeded');
            break;
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message, model: hfModel }, '[AI_ROUTER] HuggingFace Failover Triggered');
      }
    }
  }

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY D: DYNAMIC CONTEXT-AWARE SYSTEM FALLBACK
  // ------------------------------------------------------------------------
  if (!replyText) {
    const inputClean = rawInput.trim();
    aiModel = 'zega-dynamic-system-rules';
    provider = 'ZEGA Dynamic Intelligence Rules';

    const def = getAssistantDefinition(canonicalType);
    replyText = `Halo! Saya ${def.name}. ${def.purpose}\n\nTerkait permintaan Anda: "${inputClean.slice(0, 100)}${inputClean.length > 100 ? '...' : ''}". Sistem AI ZEGA saat ini memproses permintaan Anda secara terisolasi dan aman.`;
  }

  const inferenceMs = Date.now() - startTime;

  // Repetition Telemetry & Hash Check
  const outputHash = crypto.createHash('sha256').update(replyText).digest('hex');
  let repetitionDetected = false;

  const previousRecord = recentResponseHashMap.get(outputHash);
  if (previousRecord && previousRecord.inputFingerprint !== computedFingerprint && Date.now() - previousRecord.timestamp < 300000) {
    repetitionDetected = true;
  } else {
    recentResponseHashMap.set(outputHash, { inputFingerprint: computedFingerprint, timestamp: Date.now() });
    if (recentResponseHashMap.size > 500) {
      const oldestKey = recentResponseHashMap.keys().next().value;
      if (oldestKey) recentResponseHashMap.delete(oldestKey);
    }
  }

  const finalReplyText = replyText;

  return {
    replyText: finalReplyText,
    aiModel,
    complexity,
    provider,
    inferenceMs,
    requestFingerprint: computedFingerprint,
    repetitionDetected,
    assistantType: canonicalType
  };
}
