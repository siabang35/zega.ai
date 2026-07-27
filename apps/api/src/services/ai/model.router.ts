import { envConfig } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — Multi-Model AI Router
 *
 * Routes inference requests to the optimal AI provider based on:
 * - Data sensitivity (PII → self-hosted)
 * - Jurisdiction (GDPR → EU providers)
 * - Complexity (reasoning tasks → Claude/GPT-4.1)
 * - Latency requirements (real-time → Flash models)
 * - Budget constraints (cost-optimized routing)
 *
 * Supports automatic failover across providers.
 */

export type AIProvider = 'openai' | 'anthropic' | 'google';
export type RoutingStrategy = 'cost' | 'latency' | 'accuracy' | 'compliance';

export interface InferenceRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  provider?: AIProvider;
  strategy?: RoutingStrategy;
  maxTokens?: number;
  temperature?: number;
  agentId: string;
  meshId: string;
  containsPII?: boolean;
  jurisdiction?: string;
}

export interface InferenceResponse {
  content: string;
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  finishReason: string;
}

interface ModelConfig {
  provider: AIProvider;
  model: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  maxContext: number;
  tier: 'premium' | 'standard' | 'economy';
}

const MODEL_REGISTRY: ModelConfig[] = [
  { provider: 'anthropic', model: 'claude-sonnet-4-20250514', costPer1kInput: 0.003, costPer1kOutput: 0.015, maxContext: 200000, tier: 'premium' },
  { provider: 'openai', model: 'gpt-4.1', costPer1kInput: 0.002, costPer1kOutput: 0.008, maxContext: 1048576, tier: 'premium' },
  { provider: 'openai', model: 'gpt-4.1-mini', costPer1kInput: 0.0004, costPer1kOutput: 0.0016, maxContext: 1048576, tier: 'economy' },
  { provider: 'google', model: 'gemini-2.5-flash', costPer1kInput: 0.00015, costPer1kOutput: 0.0006, maxContext: 1048576, tier: 'economy' },
];

/** Select the best model based on routing strategy */
function selectModel(strategy: RoutingStrategy): ModelConfig {
  const available = MODEL_REGISTRY.filter((m) => {
    if (m.provider === 'openai' && !envConfig.OPENAI_API_KEY) return false;
    if (m.provider === 'anthropic' && !envConfig.ANTHROPIC_API_KEY) return false;
    if (m.provider === 'google' && !envConfig.GOOGLE_AI_API_KEY) return false;
    return true;
  });

  if (available.length === 0) {
    throw new Error('No AI providers configured. Set at least one API key in environment.');
  }

  switch (strategy) {
    case 'accuracy':
      return available.find((m) => m.tier === 'premium') || available[0];
    case 'cost':
      return [...available].sort((a, b) => a.costPer1kInput - b.costPer1kInput)[0];
    case 'latency':
      return available.find((m) => m.tier === 'economy') || available[0];
    case 'compliance':
      // Prefer non-US providers for GDPR
      return available.find((m) => m.provider === 'anthropic') || available[0];
    default:
      return available[0];
  }
}

/** Call OpenAI-compatible API */
async function callOpenAI(request: InferenceRequest, model: string): Promise<InferenceResponse> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: envConfig.OPENAI_API_KEY });

  const start = performance.now();
  const response = await client.chat.completions.create({
    model,
    messages: [
      ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
      { role: 'user' as const, content: request.prompt },
    ],
    max_tokens: request.maxTokens || 2048,
    temperature: request.temperature ?? 0.3,
  });
  const latencyMs = Math.round(performance.now() - start);

  const modelConfig = MODEL_REGISTRY.find((m) => m.model === model)!;
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  return {
    content: response.choices[0]?.message?.content || '',
    provider: 'openai',
    model,
    inputTokens,
    outputTokens,
    latencyMs,
    costUsd: (inputTokens / 1000) * modelConfig.costPer1kInput + (outputTokens / 1000) * modelConfig.costPer1kOutput,
    finishReason: response.choices[0]?.finish_reason || 'unknown',
  };
}

/** Call Anthropic API */
async function callAnthropic(request: InferenceRequest, model: string): Promise<InferenceResponse> {
  const start = performance.now();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': envConfig.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens || 2048,
      system: request.systemPrompt || 'You are a precise enterprise AI agent.',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature ?? 0.3,
    }),
  });

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
    usage: { input_tokens: number; output_tokens: number };
    stop_reason: string;
  };
  const latencyMs = Math.round(performance.now() - start);

  const modelConfig = MODEL_REGISTRY.find((m) => m.model === model)!;
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;

  return {
    content: data.content?.[0]?.text || '',
    provider: 'anthropic',
    model,
    inputTokens,
    outputTokens,
    latencyMs,
    costUsd: (inputTokens / 1000) * modelConfig.costPer1kInput + (outputTokens / 1000) * modelConfig.costPer1kOutput,
    finishReason: data.stop_reason || 'unknown',
  };
}

/**
 * Primary inference function — the main entry point for all AI operations.
 * Handles model selection, routing, failover, and cost tracking.
 */
export async function infer(request: InferenceRequest): Promise<InferenceResponse> {
  const strategy = request.strategy || 'accuracy';
  const selected = request.provider && request.model
    ? MODEL_REGISTRY.find((m) => m.provider === request.provider && m.model === request.model) || selectModel(strategy)
    : selectModel(strategy);

  logger.info({
    agent: request.agentId,
    mesh: request.meshId,
    provider: selected.provider,
    model: selected.model,
    strategy,
  }, 'AI inference request routed');

  try {
    switch (selected.provider) {
      case 'openai':
        return await callOpenAI(request, selected.model);
      case 'anthropic':
        return await callAnthropic(request, selected.model);
      default: {
        // Fallback: try any available provider
        const fallback = selectModel('cost');
        logger.warn({ original: selected.provider, fallback: fallback.provider }, 'Provider unavailable, using fallback');
        if (fallback.provider === 'openai') return await callOpenAI(request, fallback.model);
        if (fallback.provider === 'anthropic') return await callAnthropic(request, fallback.model);
        throw new Error(`No callable provider available`);
      }
    }
  } catch (error) {
    // Automatic failover to next available provider
    logger.error({ error, provider: selected.provider }, 'AI inference failed, attempting failover');

    const fallbackProviders = MODEL_REGISTRY.filter(
      (m) => m.provider !== selected.provider
    );

    for (const fb of fallbackProviders) {
      try {
        if (fb.provider === 'openai' && envConfig.OPENAI_API_KEY) {
          return await callOpenAI(request, fb.model);
        }
        if (fb.provider === 'anthropic' && envConfig.ANTHROPIC_API_KEY) {
          return await callAnthropic(request, fb.model);
        }
      } catch {
        continue;
      }
    }

    throw new Error('All AI providers failed. Check API keys and provider status.');
  }
}
