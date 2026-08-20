import { envConfig } from '../../config/env.js';

export type ModelTier = 'TIER_0_ULTRA_FAST' | 'TIER_1_FAST_GENERAL' | 'TIER_2_ADVANCED' | 'TIER_3_DEEP_REASONING';

export type ProviderType = 'groq' | 'google' | 'openai' | 'anthropic' | '9router' | 'openrouter' | 'huggingface' | 'zeroclaw_local';

export interface ModelCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  vision: boolean;
  longContext: boolean;
  reasoning: boolean;
  coding: boolean;
  multilingual: boolean;
}

export interface ModelSpec {
  id: string;
  name: string;
  provider: ProviderType;
  tier: ModelTier;
  maxContext: number;
  costPer1kInputUsd: number;
  costPer1kOutputUsd: number;
  capabilities: ModelCapabilities;
}

/**
 * Logical Capability Tiers Registry
 * Dynamic inventory maps configured provider models to capability tiers.
 */
export const MODEL_TIER_REGISTRY: Record<string, ModelSpec> = {
  // ── TIER 0: ULTRA FAST (Groq LPU Acceleration) ──
  'qwen/qwen3.6-27b': {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 3.6 27B Instant (Groq LPU)',
    provider: 'groq',
    tier: 'TIER_0_ULTRA_FAST',
    maxContext: 131072,
    costPer1kInputUsd: 0.00005,
    costPer1kOutputUsd: 0.00008,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: false, longContext: true, reasoning: true, coding: true, multilingual: true }
  },
  'openai/gpt-oss-20b': {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B (Groq Fast LPU)',
    provider: 'groq',
    tier: 'TIER_0_ULTRA_FAST',
    maxContext: 128000,
    costPer1kInputUsd: 0.00005,
    costPer1kOutputUsd: 0.00008,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: false, longContext: true, reasoning: false, coding: true, multilingual: true }
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    name: 'Google Gemini 3.6 Flash',
    provider: 'google',
    tier: 'TIER_0_ULTRA_FAST',
    maxContext: 1048576,
    costPer1kInputUsd: 0.000075,
    costPer1kOutputUsd: 0.0003,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: true, longContext: true, reasoning: true, coding: true, multilingual: true }
  },

  // ── TIER 1: FAST GENERAL ──
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (Groq LPU)',
    provider: 'groq',
    tier: 'TIER_1_FAST_GENERAL',
    maxContext: 128000,
    costPer1kInputUsd: 0.00015,
    costPer1kOutputUsd: 0.0006,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: false, longContext: true, reasoning: true, coding: true, multilingual: true }
  },
  'groq/compound-mini': {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini',
    provider: 'groq',
    tier: 'TIER_1_FAST_GENERAL',
    maxContext: 128000,
    costPer1kInputUsd: 0.0001,
    costPer1kOutputUsd: 0.0004,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: false, longContext: true, reasoning: true, coding: true, multilingual: true }
  },

  // ── TIER 2: ADVANCED ──
  'groq/compound': {
    id: 'groq/compound',
    name: 'Groq Compound Engine',
    provider: 'groq',
    tier: 'TIER_2_ADVANCED',
    maxContext: 128000,
    costPer1kInputUsd: 0.0005,
    costPer1kOutputUsd: 0.0015,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: false, longContext: true, reasoning: true, coding: true, multilingual: true }
  },
  'claude-3.5-sonnet': {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Anthropic)',
    provider: 'anthropic',
    tier: 'TIER_2_ADVANCED',
    maxContext: 200000,
    costPer1kInputUsd: 0.003,
    costPer1kOutputUsd: 0.015,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: true, longContext: true, reasoning: true, coding: true, multilingual: true }
  },

  // ── TIER 3: DEEP REASONING ──
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (9Router Reasoner)',
    provider: '9router',
    tier: 'TIER_3_DEEP_REASONING',
    maxContext: 128000,
    costPer1kInputUsd: 0.00055,
    costPer1kOutputUsd: 0.00219,
    capabilities: { streaming: true, toolCalling: true, structuredOutput: true, vision: false, longContext: true, reasoning: true, coding: true, multilingual: true }
  }
};

/**
 * Dynamic Provider Inventory Inspector
 * Detects configured API keys at runtime and filters available models accordingly.
 */
export interface ProviderInventory {
  provider: ProviderType;
  configured: boolean;
  keyPrefix: string;
  models: ModelSpec[];
}

export function inspectProviderInventory(): ProviderInventory[] {
  const checkKey = (val?: string) => Boolean(val && val.trim().length > 5);

  const groqKey = envConfig.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  const openrouterKey = envConfig.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const hfKey = envConfig.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '';
  const geminiKey = envConfig.GEMINI_API_KEY || envConfig.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
  const openaiKey = envConfig.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
  const anthropicKey = envConfig.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
  const nineRouterKey = envConfig.NINE_ROUTER_API_KEY || process.env.NINE_ROUTER_API_KEY || '';
  const zeroclawToken = envConfig.ZEROCLAW_BEARER_TOKEN || process.env.ZEROCLAW_BEARER_TOKEN || '';

  const allModels = Object.values(MODEL_TIER_REGISTRY);

  const providers: { provider: ProviderType; apiKey: string; isConfigured: boolean }[] = [
    { provider: 'groq', apiKey: groqKey, isConfigured: checkKey(groqKey) },
    { provider: 'google', apiKey: geminiKey, isConfigured: checkKey(geminiKey) },
    { provider: 'openai', apiKey: openaiKey, isConfigured: checkKey(openaiKey) },
    { provider: 'anthropic', apiKey: anthropicKey, isConfigured: checkKey(anthropicKey) },
    { provider: '9router', apiKey: nineRouterKey, isConfigured: checkKey(nineRouterKey) },
    { provider: 'openrouter', apiKey: openrouterKey, isConfigured: checkKey(openrouterKey) },
    { provider: 'huggingface', apiKey: hfKey, isConfigured: checkKey(hfKey) },
    { provider: 'zeroclaw_local', apiKey: zeroclawToken, isConfigured: checkKey(zeroclawToken) },
  ];

  return providers.map((p) => ({
    provider: p.provider,
    configured: p.isConfigured,
    keyPrefix: p.apiKey ? `${p.apiKey.substring(0, 6)}...` : 'MISSING',
    models: allModels.filter((m) => m.provider === p.provider && (p.isConfigured || process.env.NODE_ENV === 'test')),
  }));
}

/**
 * Get available models grouped by tier
 */
export function getAvailableModelsByTier(): Record<ModelTier, ModelSpec[]> {
  const inventory = inspectProviderInventory();
  const configuredProviders = new Set(inventory.filter((i) => i.configured).map((i) => i.provider));

  const result: Record<ModelTier, ModelSpec[]> = {
    TIER_0_ULTRA_FAST: [],
    TIER_1_FAST_GENERAL: [],
    TIER_2_ADVANCED: [],
    TIER_3_DEEP_REASONING: [],
  };

  for (const model of Object.values(MODEL_TIER_REGISTRY)) {
    // In test or dev mode with mock fallbacks, include models if provider configured or fallback enabled
    if (configuredProviders.has(model.provider) || process.env.NODE_ENV === 'test' || model.provider === 'groq') {
      result[model.tier].push(model);
    }
  }

  return result;
}
