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
  model?: string;
  isConfigured(): boolean;
  generate(options: LLMGenerateOptions): Promise<LLMResponse>;
  healthCheck(): Promise<{ configured: boolean; reachable: boolean; provider: string; model: string }>;
}

/**
 * Groq Hardware LPU Provider Implementation
 */
export class GroqProvider implements AIProvider {
  name = 'groq';
  model = 'llama-3.3-70b-versatile';
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

    const candidateModels = [
      'llama-3.3-70b-versatile'
    ];
    let lastErr = '';
    let res: Response | null = null;
    let usedModel = this.defaultModel;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: options.messages,
            temperature: options.temperature ?? 0.6,
            max_tokens: options.maxTokens ?? 600,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          res = response;
          usedModel = modelName;
          break;
        } else {
          lastErr = await response.text().catch(() => '');
        }
      } catch (err: any) {
        lastErr = err.message;
      }
    }

    const inferenceMs = Date.now() - startTime;

    if (!res || !res.ok) {
      throw new Error(`AI_PROVIDER_UNAVAILABLE: Groq API error - ${lastErr.substring(0, 100)}`);
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
  model = 'deepseek/deepseek-chat';
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
    const candidateModels = [
      'deepseek/deepseek-chat',
      'openai/gpt-4o-mini',
      'openai/gpt-3.5-turbo'
    ];
    let lastErr = '';
    let res: Response | null = null;
    let usedModel = this.defaultModel;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://zegaai.site',
            'X-Title': 'ZEGA AI Enterprise Platform',
          },
          body: JSON.stringify({
            model: modelName,
            messages: options.messages,
            temperature: options.temperature ?? 0.6,
            max_tokens: options.maxTokens ?? 600,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          res = response;
          usedModel = modelName;
          break;
        } else {
          lastErr = await response.text().catch(() => `HTTP ${response.status}`);
        }
      } catch (err: any) {
        lastErr = err.message;
      }
    }

    const inferenceMs = Date.now() - startTime;

    if (!res || !res.ok) {
      throw new Error(`AI_PROVIDER_UNAVAILABLE: OpenRouter error - ${lastErr.substring(0, 100)}`);
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
  model = 'gemini-3.6-flash';
  private apiKey: string;
  private defaultModel = 'gemini-3.6-flash';

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

    const candidateModels = ['gemini-3.6-flash', 'gemini-1.5-flash'];
    let lastErr = '';
    let res: Response | null = null;
    let usedModel = this.defaultModel;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`,
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
            signal: AbortSignal.timeout(8000),
          }
        );

        if (response.ok) {
          res = response;
          usedModel = modelName;
          break;
        } else {
          lastErr = await response.text().catch(() => `HTTP ${response.status}`);
        }
      } catch (err: any) {
        lastErr = err.message;
      }
    }

    const inferenceMs = Date.now() - startTime;

    if (!res || !res.ok) {
      throw new Error(`AI_PROVIDER_UNAVAILABLE: Gemini API error - ${lastErr.substring(0, 100)}`);
    }

    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const finishReason = data.candidates?.[0]?.finishReason || 'STOP';

    const promptTokens = Math.floor(promptText.length * 1.2);
    const completionTokens = Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'gemini',
      model: usedModel,
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

/**
 * HuggingFace Inference Provider Implementation (Supports DeepSeek-V4, DeepSeek-V3 & DeepSeek-R1)
 */
export class HuggingFaceProvider implements AIProvider {
  name = 'huggingface';
  model = 'deepseek-ai/DeepSeek-V4';
  private apiKey: string;
  private defaultModel = 'deepseek-ai/DeepSeek-V4';

  constructor() {
    this.apiKey = envConfig.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_MODEL_NOT_CONFIGURED: HUGGINGFACE_API_KEY is not configured');
    }

    const startTime = Date.now();
    const candidateModels = [
      'deepseek-ai/DeepSeek-V4',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'meta-llama/Llama-3.3-70B-Instruct'
    ];

    let lastErr = '';
    let res: Response | null = null;
    let usedModel = this.defaultModel;

    const endpoints = [
      'https://victor-chat-with-deepseek-flash-0731.hf.space/v1/chat/completions',
      'https://router.huggingface.co/hf-inference/v1/chat/completions',
      'https://api-inference.huggingface.co/v1/chat/completions'
    ];

    for (const endpoint of endpoints) {
      for (const modelName of candidateModels) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages: options.messages,
              temperature: options.temperature ?? 0.6,
              max_tokens: options.maxTokens ?? 600,
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (response.ok) {
            res = response;
            usedModel = modelName;
            break;
          } else {
            lastErr = await response.text().catch(() => '');
          }
        } catch (err: any) {
          lastErr = err.message;
        }
      }
      if (res && res.ok) break;
    }

    const inferenceMs = Date.now() - startTime;

    if (!res || !res.ok) {
      throw new Error(`AI_PROVIDER_UNAVAILABLE: HuggingFace API error - ${lastErr.substring(0, 100)}`);
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason || 'stop';

    const promptTokens = data.usage?.prompt_tokens || Math.floor((options.messages[options.messages.length - 1]?.content || '').length * 1.2);
    const completionTokens = data.usage?.completion_tokens || Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'huggingface',
      model: usedModel,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
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
      const res = await fetch('https://router.huggingface.co/hf-inference/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return { configured: true, reachable: res.ok, provider: this.name, model: this.defaultModel };
    } catch {
      return { configured: true, reachable: false, provider: this.name, model: this.defaultModel };
    }
  }
}

/**
 * OpenAI Provider Implementation (GPT-4o Mini & GPT-4o)
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  model = 'gpt-4o-mini';
  private apiKey: string;
  private defaultModel = 'gpt-4o-mini';

  constructor() {
    this.apiKey = envConfig.GPT_API_KEY || envConfig.OPENAI_API_KEY || process.env.GPT_API_KEY || process.env.OPENAI_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_MODEL_NOT_CONFIGURED: OPENAI_API_KEY is not configured');
    }

    const startTime = Date.now();
    const candidateModels = ['gpt-4o-mini', 'gpt-4o'];
    let lastErr = '';
    let res: Response | null = null;
    let usedModel = this.defaultModel;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: options.messages,
            temperature: options.temperature ?? 0.6,
            max_tokens: options.maxTokens ?? 600,
          }),
        });

        if (response.ok) {
          res = response;
          usedModel = modelName;
          break;
        } else {
          lastErr = await response.text().catch(() => `HTTP ${response.status}`);
        }
      } catch (err: any) {
        lastErr = err.message;
      }
    }

    const inferenceMs = Date.now() - startTime;

    if (!res || !res.ok) {
      throw new Error(`AI_PROVIDER_UNAVAILABLE: OpenAI error - ${lastErr.substring(0, 100)}`);
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason || 'stop';

    const promptTokens = data.usage?.prompt_tokens || Math.floor((options.messages[options.messages.length - 1]?.content || '').length * 1.2);
    const completionTokens = data.usage?.completion_tokens || Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'openai',
      model: usedModel,
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
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return { configured: true, reachable: res.ok, provider: this.name, model: this.defaultModel };
    } catch {
      return { configured: true, reachable: false, provider: this.name, model: this.defaultModel };
    }
  }
}

/**
 * Anthropic Claude Provider Implementation (Claude 3.5 Haiku & Claude 3.5 Sonnet)
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  model = 'claude-3-5-haiku-20241022';
  private apiKey: string;
  private defaultModel = 'claude-3-5-haiku-20241022';

  constructor() {
    this.apiKey = envConfig.CLAUDE_API_KEY || envConfig.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_MODEL_NOT_CONFIGURED: ANTHROPIC_API_KEY is not configured');
    }

    const startTime = Date.now();
    const systemMsg = options.messages.find((m) => m.role === 'system')?.content || '';
    const userMessages = options.messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const candidateModels = ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'];
    let lastErr = '';
    let res: Response | null = null;
    let usedModel = this.defaultModel;

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: modelName,
            system: systemMsg,
            messages: userMessages,
            max_tokens: options.maxTokens ?? 600,
            temperature: options.temperature ?? 0.6,
          }),
        });

        if (response.ok) {
          res = response;
          usedModel = modelName;
          break;
        } else {
          lastErr = await response.text().catch(() => `HTTP ${response.status}`);
        }
      } catch (err: any) {
        lastErr = err.message;
      }
    }

    const inferenceMs = Date.now() - startTime;

    if (!res || !res.ok) {
      throw new Error(`AI_PROVIDER_UNAVAILABLE: Anthropic Claude error - ${lastErr.substring(0, 100)}`);
    }

    const data: any = await res.json();
    const text = data.content?.[0]?.text || '';
    const finishReason = data.stop_reason || 'end_turn';

    const promptTokens = data.usage?.input_tokens || Math.floor((options.messages[options.messages.length - 1]?.content || '').length * 1.2);
    const completionTokens = data.usage?.output_tokens || Math.floor(text.length * 0.8);

    return {
      message: text,
      provider: 'anthropic',
      model: usedModel,
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
