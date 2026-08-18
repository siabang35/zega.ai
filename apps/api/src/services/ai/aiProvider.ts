import { envConfig } from '../../config/env.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  message: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inferenceMs: number;
  finishReason?: string;
}

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  generate(options: LLMGenerateOptions): Promise<LLMResponse>;
  healthCheck(): Promise<{ configured: boolean; reachable: boolean; provider: string; model: string }>;
}

/**
 * Groq Hardware LPU Provider Implementation
 */
export class GroqProvider implements AIProvider {
  name = 'groq';
  private apiKey: string;
  private defaultModel = 'llama-3.3-70b-versatile';

  constructor() {
    this.apiKey = envConfig.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_MODEL_NOT_CONFIGURED: GROQ_API_KEY is not configured');
    }

    const startTime = Date.now();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: options.messages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 600,
      }),
    });

    const inferenceMs = Date.now() - startTime;

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('AI_PROVIDER_AUTH_FAILED: Invalid Groq API credentials');
      } else if (res.status === 429) {
        throw new Error('AI_RATE_LIMITED: Groq API rate limit exceeded');
      } else {
        const errText = await res.text().catch(() => '');
        throw new Error(`AI_PROVIDER_UNAVAILABLE: Groq API error HTTP ${res.status} - ${errText.substring(0, 100)}`);
      }
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason || 'stop';

    const promptTokens = data.usage?.prompt_tokens || Math.floor((options.messages[options.messages.length - 1]?.content || '').length * 1.2);
    const completionTokens = data.usage?.completion_tokens || Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'groq',
      model: this.defaultModel,
      promptTokens,
      completionTokens,
      totalTokens: data.usage?.total_tokens || (promptTokens + completionTokens),
      inferenceMs,
      finishReason,
    };
  }

  async healthCheck(): Promise<{ configured: boolean; reachable: boolean; provider: string; model: string }> {
    const configured = this.isConfigured();
    if (!configured) {
      return { configured: false, reachable: false, provider: this.name, model: this.defaultModel };
    }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return { configured: true, reachable: res.ok, provider: this.name, model: this.defaultModel };
    } catch {
      return { configured: true, reachable: false, provider: this.name, model: this.defaultModel };
    }
  }
}

/**
 * OpenRouter Multi-LLM Gateway Provider Implementation
 */
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private defaultModel = 'deepseek/deepseek-chat';

  constructor() {
    this.apiKey = envConfig.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_MODEL_NOT_CONFIGURED: OPENROUTER_API_KEY is not configured');
    }

    const startTime = Date.now();
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://zegaai.site',
        'X-Title': 'ZEGA AI Enterprise Platform',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: options.messages,
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 600,
      }),
    });

    const inferenceMs = Date.now() - startTime;

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('AI_PROVIDER_AUTH_FAILED: Invalid OpenRouter credentials');
      } else if (res.status === 429) {
        throw new Error('AI_RATE_LIMITED: OpenRouter rate limit exceeded');
      } else {
        const errText = await res.text().catch(() => '');
        throw new Error(`AI_PROVIDER_UNAVAILABLE: OpenRouter error HTTP ${res.status} - ${errText.substring(0, 100)}`);
      }
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason || 'stop';

    const promptTokens = data.usage?.prompt_tokens || Math.floor((options.messages[options.messages.length - 1]?.content || '').length * 1.2);
    const completionTokens = data.usage?.completion_tokens || Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'openrouter',
      model: this.defaultModel,
      promptTokens,
      completionTokens,
      totalTokens: data.usage?.total_tokens || (promptTokens + completionTokens),
      inferenceMs,
      finishReason,
    };
  }

  async healthCheck(): Promise<{ configured: boolean; reachable: boolean; provider: string; model: string }> {
    const configured = this.isConfigured();
    if (!configured) {
      return { configured: false, reachable: false, provider: this.name, model: this.defaultModel };
    }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return { configured: true, reachable: res.ok, provider: this.name, model: this.defaultModel };
    } catch {
      return { configured: true, reachable: false, provider: this.name, model: this.defaultModel };
    }
  }
}

/**
 * Google Gemini Flash Provider Implementation
 */
export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private defaultModel = 'gemini-1.5-flash';

  constructor() {
    this.apiKey = envConfig.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_MODEL_NOT_CONFIGURED: GEMINI_API_KEY is not configured');
    }

    const startTime = Date.now();
    const systemMsg = options.messages.find((m) => m.role === 'system')?.content || '';
    const userMsg = options.messages.filter((m) => m.role !== 'system').map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const promptText = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.defaultModel}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.6,
            maxOutputTokens: options.maxTokens ?? 600,
          },
        }),
      }
    );

    const inferenceMs = Date.now() - startTime;

    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        throw new Error('AI_PROVIDER_AUTH_FAILED: Invalid Gemini API key');
      } else if (res.status === 429) {
        throw new Error('AI_RATE_LIMITED: Gemini rate limit exceeded');
      } else {
        throw new Error(`AI_PROVIDER_UNAVAILABLE: Gemini API error HTTP ${res.status}`);
      }
    }

    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const finishReason = data.candidates?.[0]?.finishReason || 'STOP';

    const promptTokens = Math.floor(promptText.length * 1.2);
    const completionTokens = Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'gemini',
      model: this.defaultModel,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      inferenceMs,
      finishReason,
    };
  }

  async healthCheck(): Promise<{ configured: boolean; reachable: boolean; provider: string; model: string }> {
    const configured = this.isConfigured();
    return { configured, reachable: configured, provider: this.name, model: this.defaultModel };
  }
}
