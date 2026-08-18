import { envConfig } from '../config/env.js';
import { ZeroClawGatewayClient } from '@zega/zeroclaw-bridge';

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



export interface RouteExecutionResult {
  replyText: string;
  aiModel: string;
  complexity: TaskComplexity;
  provider: string;
  inferenceMs: number;
}

export interface RouteExecutionOptions {
  rawInput: string;
  hardenedSystemPrompt: string;
  maxTokensToUse: number;
  agentRole?: string;
  targetLangCode?: string;
  logger?: any;
}

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
 * Execute dynamic model routing based on task complexity.
 * Supports ZeroClaw Bridge, 9Router, Groq, OpenRouter, and Gemini Flash.
 */
export async function executeRoutedModelPipeline(
  options: RouteExecutionOptions
): Promise<RouteExecutionResult> {
  const { rawInput, hardenedSystemPrompt, maxTokensToUse, agentRole, logger } = options;
  const startTime = Date.now();

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
        complexity,
        agentRole,
        inputLength: rawInput.length,
        has9Router: Boolean(nineRouterApiKey),
        hasZeroClaw: Boolean(zeroclawBearerToken),
        hasGroq: Boolean(groqApiKey),
        hasOpenRouter: Boolean(openrouterApiKey),
        hasGemini: Boolean(geminiApiKey),
      },
      '[AI_ROUTER] Evaluated Task Complexity & Available Providers'
    );
  }

  let replyText = '';
  let aiModel = 'fallback-llama-3.3-70b';
  let provider = 'Unknown';

  // Fast fetch wrapper with AbortController timeout to prevent provider hangs
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

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY A: FAST HIGH-SPEED PROVIDERS (Groq 70B & Instant Priority)
  // ------------------------------------------------------------------------
  if (groqApiKey) {
    const targetGroqModel = complexity === 'HIGH' ? 'llama-3.3-70b-versatile' : 'llama-3.3-70b-versatile';
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
            messages: [
              { role: 'system', content: hardenedSystemPrompt },
              { role: 'user', content: rawInput },
            ],
            temperature: 0.5,
            max_tokens: maxTokensToUse,
          }),
        },
        1800
      );

      if (groqRes.ok) {
        const groqData: any = await groqRes.json();
        const groqText = groqData.choices?.[0]?.message?.content;
        if (groqText && groqText.trim()) {
          replyText = groqText.trim();
          aiModel = `groq-${targetGroqModel}`;
          provider = 'Groq Ultra-Fast Llama 3.3';
          const inferenceMs = Date.now() - startTime;
          if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] Groq Llama 3.3 Succeeded');
          return { replyText, aiModel, complexity, provider, inferenceMs };
        }
      }
    } catch (err: any) {
      if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] Groq Fast Route Failover Triggered');
    }
  }

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY B: HIGH / ADVANCED COMPLEXITY (9Router & ZeroClaw Priority)
  // ------------------------------------------------------------------------
  if (complexity === 'HIGH') {
    // 1. Try ZeroClaw Bridge Gateway Agent Runtime if Finance/ZeroClaw task
    if (zeroclawBearerToken || (agentRole || '').toLowerCase().includes('zeroclaw')) {
      try {
        const zeroclawClient = getZeroClawClient(zeroclawGatewayUrl, zeroclawBearerToken);

        const state = await zeroclawClient.getState();
        if (state.status === 'paired' || state.paired) {
          const zcRes = await zeroclawClient.webhook(
            `${hardenedSystemPrompt}\n\nPesan User: ${rawInput}`,
            'finance-specialist'
          );

          const replyVal = zcRes.response || (zcRes as any).reply;
          if (zcRes && replyVal) {
            replyText = String(replyVal).trim();
            aiModel = 'zeroclaw-agent-v0.8';
            provider = 'ZeroClaw Gateway Daemon';
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] ZeroClaw Gateway Agent Execution Succeeded');
            return { replyText, aiModel, complexity, provider, inferenceMs };
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] ZeroClaw Bridge Failover Triggered');
      }
    }


    // 2. Try 9Router Engine (DeepSeek R1 / GPT-4o Flagship Router)
    if (!replyText && nineRouterApiKey) {
      try {
        const routerUrl = 'https://api.9router.com/v1/chat/completions';
        const res = await fetchWithTimeout(
          routerUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${nineRouterApiKey}`,
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-r1',
              messages: [
                { role: 'system', content: hardenedSystemPrompt },
                { role: 'user', content: rawInput },
              ],
              temperature: 0.4,
              max_tokens: maxTokensToUse,
            }),
          },
          3000
        );

        if (res.ok) {
          const data: any = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            replyText = text.trim();
            aiModel = '9router-deepseek-r1';
            provider = '9Router AI Engine';
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] 9Router DeepSeek R1 Succeeded');
            return { replyText, aiModel, complexity, provider, inferenceMs };
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] 9Router Failover Triggered');
      }
    }

    // 3. Fallback to OpenRouter DeepSeek / Claude 3.5 Sonnet
    if (!replyText && openrouterApiKey) {
      try {
        const res = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openrouterApiKey}`,
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-chat',
              messages: [
                { role: 'system', content: hardenedSystemPrompt },
                { role: 'user', content: rawInput },
              ],
              temperature: 0.5,
              max_tokens: maxTokensToUse,
            }),
          },
          3500
        );

        if (res.ok) {
          const data: any = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            replyText = text.trim();
            aiModel = 'openrouter-deepseek-chat';
            provider = 'OpenRouter Reasoning';
            const inferenceMs = Date.now() - startTime;
            return { replyText, aiModel, complexity, provider, inferenceMs };
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] OpenRouter High Complexity Failover');
      }
    }
  }

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY B: MEDIUM COMPLEXITY (Groq 70B Flagship / OpenRouter)
  // ------------------------------------------------------------------------
  if (!replyText && (complexity === 'MEDIUM' || complexity === 'HIGH')) {
    if (groqApiKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: hardenedSystemPrompt },
              { role: 'user', content: rawInput },
            ],
            temperature: 0.6,
            max_tokens: maxTokensToUse,
          }),
        });

        if (groqRes.ok) {
          const groqData: any = await groqRes.json();
          const groqText = groqData.choices?.[0]?.message?.content;
          if (groqText && groqText.trim()) {
            replyText = groqText.trim();
            aiModel = 'groq-llama-3.3-70b';
            provider = 'Groq Flagship';
            const inferenceMs = Date.now() - startTime;
            if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] Groq Llama 3.3 70B Succeeded');
            return { replyText, aiModel, complexity, provider, inferenceMs };
          }
        }
      } catch (err: any) {
        if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] Groq 70B Failover Triggered');
      }
    }
  }

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY C: LOW COMPLEXITY / FAST RESPONSE (Groq 8B / Gemini Flash)
  // ------------------------------------------------------------------------
  if (!replyText && groqApiKey) {
    try {
      const groqInstantRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: hardenedSystemPrompt },
            { role: 'user', content: rawInput },
          ],
          temperature: 0.6,
          max_tokens: maxTokensToUse,
        }),
      });

      if (groqInstantRes.ok) {
        const data: any = await groqInstantRes.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          replyText = text.trim();
          aiModel = 'groq-llama-3.1-8b-instant';
          provider = 'Groq Instant';
          const inferenceMs = Date.now() - startTime;
          if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] Groq Llama 3.1 8B Instant Succeeded');
          return { replyText, aiModel, complexity, provider, inferenceMs };
        }
      }
    } catch (err: any) {
      if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] Groq Instant Failover Triggered');
    }
  }

  // ------------------------------------------------------------------------
  // ROUTE STRATEGY D: GEMINI 3.6 FLASH (Google AI Fallback)
  // ------------------------------------------------------------------------
  if (!replyText && geminiApiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${hardenedSystemPrompt}\n\nPesan User: ${rawInput}` }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: maxTokensToUse,
            },
          }),
        }
      );

      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          replyText = text.trim();
          aiModel = 'gemini-3.6-flash';
          provider = 'Google Gemini AI';
          const inferenceMs = Date.now() - startTime;
          if (logger) logger.info({ inferenceMs }, '[AI_ROUTER] Gemini 3.6 Flash Succeeded');
          return { replyText, aiModel, complexity, provider, inferenceMs };
        }
      }
    } catch (err: any) {
      if (logger) logger.warn({ err: err.message }, '[AI_ROUTER] Gemini Flash Failover Triggered');
    }
  }

  // Final fallback text if all providers are unreachable
  if (!replyText) {
    replyText = `Halo! ZEGA Copilot AI siap membantu Anda memproses operasional dan pertumbuhan bisnis UMKM. Silakan ketik pertanyaan atau perintah Anda.`;
    aiModel = 'zega-native-fallback';
    provider = 'ZEGA System Rules';
  }

  const inferenceMs = Date.now() - startTime;
  return { replyText, aiModel, complexity, provider, inferenceMs };
}
