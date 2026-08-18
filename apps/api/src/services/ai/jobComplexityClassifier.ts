import { ModelTier } from './aiModelTierRegistry.js';

export type JobClass =
  | 'CHAT_SIMPLE'
  | 'CHAT_GENERAL'
  | 'BUSINESS_ANALYSIS'
  | 'DATA_ANALYSIS'
  | 'FINANCIAL_ANALYSIS'
  | 'FORECASTING'
  | 'PLANNING'
  | 'RESEARCH'
  | 'CODING'
  | 'DEBUGGING'
  | 'ARCHITECTURE'
  | 'DOCUMENT_ANALYSIS'
  | 'TOOL_EXECUTION'
  | 'MULTI_TOOL_AGENT'
  | 'SUMMARIZATION'
  | 'EXTRACTION'
  | 'CLASSIFICATION'
  | 'TRANSLATION'
  | 'REPORT_GENERATION'
  | 'COPILOT_ACTION'
  | 'COPILOT_REASONING';

export type ComplexityLevel = 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'DEEP';

export type ToolRequirement = 'NO_TOOL' | 'ONE_TOOL' | 'MULTI_TOOL' | 'MULTI_STEP_TOOL';

export type CriticalityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScoreWeights {
  quality: number;
  latency: number;
  reliability: number;
  context: number;
  cost: number;
}

export interface JobExecutionPolicy {
  jobClass: JobClass;
  complexity: ComplexityLevel;
  preferredTier: ModelTier;
  fallbackTiers: ModelTier[];
  latencyBudgetMs: number;
  qualityTarget: number;
  contextBudgetTokens: number;
  maxSteps: number;
  maxToolCalls: number;
  maxExecutionTimeMs: number;
  maxRetries: number;
  maxOutputTokens: number;
  toolRequirement: ToolRequirement;
  criticality: CriticalityLevel;
  weights: ScoreWeights;
  requiresStructuredOutput: boolean;
}

export interface ClassifyInput {
  prompt: string;
  systemPrompt?: string;
  toolCalls?: any[];
  availableTools?: any[];
  contextLength?: number;
  preferredStrategy?: 'cost' | 'latency' | 'accuracy' | 'compliance';
  isCopilotAction?: boolean;
  isFinanceQuery?: boolean;
  userCriticality?: CriticalityLevel;
}

export interface JobClassificationResult {
  jobClass: JobClass;
  complexity: ComplexityLevel;
  policy: JobExecutionPolicy;
  classificationTimeMs: number;
  reasoning: string;
}

/**
 * Keyword rules and pattern lists for high-speed deterministic evaluation (<1ms)
 */
const FINANCIAL_KEYWORDS_REGEX = /\b(omzet|revenue|laba|profit|rugi|loss|kas|cashflow|pajak|tax|invoice|piutang|utang|laporan keuangan|balance sheet|roi|ebitda|margin|transaksi)\b/i;
const COMPLEX_ANALYSIS_KEYWORDS = ['analisis', 'analyze', 'strategi', 'strategy', 'proyeksi', 'forecast', 'optimasi', 'optimize', 'perbandingan', 'compare', 'audit', 'akar masalah', 'root cause', 'dekomposisi', 'roadmap'];
const CODING_KEYWORDS = ['code', 'function', 'class', 'bug', 'fix', 'typescript', 'python', 'refactor', 'api', 'endpoint', 'sql', 'query', 'database', 'schema', 'component', 'script'];
const SIMPLE_KEYWORDS = ['halo', 'hi', 'salam', 'terima kasih', 'thanks', 'siapa kamu', 'what is', 'siapa', 'apa itu', 'bantu', 'help', 'ping', 'tes', 'test'];

export function classifyJobComplexity(input: ClassifyInput): JobClassificationResult {
  const startTime = performance.now();
  const prompt = (input.prompt || '').trim();
  const promptLower = prompt.toLowerCase();
  const wordCount = prompt.split(/\s+/).filter(Boolean).length;
  const toolCount = input.availableTools?.length || 0;
  const contextTokens = input.contextLength || wordCount * 2;

  let jobClass: JobClass = 'CHAT_GENERAL';
  let complexity: ComplexityLevel = 'MODERATE';
  let criticality: CriticalityLevel = input.userCriticality || 'MEDIUM';

  // 1. Detect Copilot Actions & Tool Execution (if explicitly requested or tools passed)
  if (input.isCopilotAction || toolCount > 0 || (input.toolCalls && input.toolCalls.length > 0)) {
    if (toolCount > 3 || wordCount > 80 || promptLower.includes('otomatisasi') || promptLower.includes('workflow')) {
      jobClass = 'COPILOT_REASONING';
      complexity = 'DEEP';
    } else if (toolCount > 1) {
      jobClass = 'MULTI_TOOL_AGENT';
      complexity = 'COMPLEX';
    } else {
      jobClass = 'COPILOT_ACTION';
      complexity = 'MODERATE';
    }
  }
  // 2. Detect Financial AI Context
  else if (input.isFinanceQuery || FINANCIAL_KEYWORDS_REGEX.test(promptLower)) {
    criticality = 'HIGH';
    if (promptLower.includes('proyeksi') || promptLower.includes('forecast') || promptLower.includes('tren')) {
      jobClass = 'FORECASTING';
      complexity = 'COMPLEX';
    } else if (COMPLEX_ANALYSIS_KEYWORDS.some((kw) => promptLower.includes(kw)) || wordCount > 50) {
      jobClass = 'FINANCIAL_ANALYSIS';
      complexity = 'COMPLEX';
    } else {
      jobClass = 'FINANCIAL_ANALYSIS';
      complexity = 'MODERATE';
    }
  }
  // 3. Detect Coding & Debugging
  else if (CODING_KEYWORDS.some((kw) => promptLower.includes(kw))) {
    if (promptLower.includes('bug') || promptLower.includes('error') || promptLower.includes('fix') || promptLower.includes('gagal')) {
      jobClass = 'DEBUGGING';
      complexity = 'COMPLEX';
    } else if (promptLower.includes('arsitektur') || promptLower.includes('design pattern') || promptLower.includes('refactor')) {
      jobClass = 'ARCHITECTURE';
      complexity = 'DEEP';
    } else {
      jobClass = 'CODING';
      complexity = 'MODERATE';
    }
  }
  // 4. Detect Deep Reasoning & Complex Planning
  else if (COMPLEX_ANALYSIS_KEYWORDS.some((kw) => promptLower.includes(kw)) || wordCount > 120 || contextTokens > 4000) {
    if (promptLower.includes('rencana') || promptLower.includes('plan') || promptLower.includes('langkah')) {
      jobClass = 'PLANNING';
      complexity = 'COMPLEX';
    } else {
      jobClass = 'BUSINESS_ANALYSIS';
      complexity = 'COMPLEX';
    }
  }
  // 5. Detect Simple Greeting / Ultra Fast Chat
  else if (wordCount < 10 && SIMPLE_KEYWORDS.some((kw) => promptLower.includes(kw))) {
    jobClass = 'CHAT_SIMPLE';
    complexity = 'SIMPLE';
    criticality = 'LOW';
  }
  // 6. Summarization / Extraction
  else if (promptLower.includes('rangkum') || promptLower.includes('summarize') || promptLower.includes('ringkasan')) {
    jobClass = 'SUMMARIZATION';
    complexity = wordCount > 100 ? 'MODERATE' : 'SIMPLE';
  } else if (promptLower.includes('ekstrak') || promptLower.includes('extract') || promptLower.includes('ambil data')) {
    jobClass = 'EXTRACTION';
    complexity = 'SIMPLE';
  }

  // Override strategy preferences
  if (input.preferredStrategy === 'latency' && complexity !== 'DEEP') {
    complexity = 'SIMPLE';
  } else if (input.preferredStrategy === 'accuracy' && complexity === 'SIMPLE') {
    complexity = 'MODERATE';
  }

  // Derive Policy
  const policy = buildExecutionPolicy(jobClass, complexity, criticality, toolCount, contextTokens);
  const classificationTimeMs = Math.max(0.01, performance.now() - startTime);

  return {
    jobClass,
    complexity,
    policy,
    classificationTimeMs,
    reasoning: `Classified ${jobClass} (${complexity}) based on prompt features [words: ${wordCount}, tools: ${toolCount}, criticality: ${criticality}]`,
  };
}

function buildExecutionPolicy(
  jobClass: JobClass,
  complexity: ComplexityLevel,
  criticality: CriticalityLevel,
  toolCount: number,
  contextTokens: number
): JobExecutionPolicy {
  let preferredTier: ModelTier = 'TIER_1_FAST_GENERAL';
  let fallbackTiers: ModelTier[] = ['TIER_0_ULTRA_FAST'];
  let latencyBudgetMs = 3000;
  let qualityTarget = 0.85;
  let maxSteps = 3;
  let maxToolCalls = 2;
  let maxExecutionTimeMs = 8000;
  let maxRetries = 1;
  let maxOutputTokens = 1024;
  let requiresStructuredOutput = false;

  let toolReq: ToolRequirement = 'NO_TOOL';
  if (toolCount > 3) toolReq = 'MULTI_STEP_TOOL';
  else if (toolCount > 1) toolReq = 'MULTI_TOOL';
  else if (toolCount === 1) toolReq = 'ONE_TOOL';

  // Scoring Weights: default balanced
  let weights: ScoreWeights = { quality: 0.35, latency: 0.25, reliability: 0.2, context: 0.1, cost: 0.1 };

  switch (complexity) {
    case 'SIMPLE':
      preferredTier = 'TIER_0_ULTRA_FAST';
      fallbackTiers = ['TIER_1_FAST_GENERAL'];
      latencyBudgetMs = 800;
      qualityTarget = 0.75;
      maxSteps = 1;
      maxToolCalls = 1;
      maxExecutionTimeMs = 3000;
      maxOutputTokens = 512;
      weights = { quality: 0.15, latency: 0.5, reliability: 0.15, context: 0.05, cost: 0.15 };
      break;

    case 'MODERATE':
      preferredTier = 'TIER_1_FAST_GENERAL';
      fallbackTiers = ['TIER_0_ULTRA_FAST', 'TIER_2_ADVANCED'];
      latencyBudgetMs = 2500;
      qualityTarget = 0.85;
      maxSteps = 3;
      maxToolCalls = 3;
      maxExecutionTimeMs = 8000;
      maxOutputTokens = 1536;
      weights = { quality: 0.35, latency: 0.3, reliability: 0.2, context: 0.05, cost: 0.1 };
      break;

    case 'COMPLEX':
      preferredTier = 'TIER_2_ADVANCED';
      fallbackTiers = ['TIER_3_DEEP_REASONING', 'TIER_1_FAST_GENERAL'];
      latencyBudgetMs = 6000;
      qualityTarget = 0.95;
      maxSteps = 6;
      maxToolCalls = 6;
      maxExecutionTimeMs = 15000;
      maxRetries = 2;
      maxOutputTokens = 3072;
      weights = { quality: 0.5, latency: 0.15, reliability: 0.25, context: 0.05, cost: 0.05 };
      break;

    case 'DEEP':
      preferredTier = 'TIER_3_DEEP_REASONING';
      fallbackTiers = ['TIER_2_ADVANCED'];
      latencyBudgetMs = 15000;
      qualityTarget = 0.99;
      maxSteps = 10;
      maxToolCalls = 10;
      maxExecutionTimeMs = 30000;
      maxRetries = 3;
      maxOutputTokens = 4096;
      requiresStructuredOutput = true;
      weights = { quality: 0.65, latency: 0.05, reliability: 0.25, context: 0.05, cost: 0.0 };
      break;
  }

  // Adjustments for specific Job Classes & Criticality
  if (jobClass === 'FINANCIAL_ANALYSIS' || jobClass === 'FORECASTING') {
    criticality = 'CRITICAL';
    requiresStructuredOutput = true;
    qualityTarget = Math.max(qualityTarget, 0.95);
    weights.quality = 0.6;
    weights.reliability = 0.3;
    weights.latency = 0.05;
  } else if (jobClass === 'COPILOT_REASONING' || jobClass === 'MULTI_TOOL_AGENT') {
    maxSteps = Math.max(maxSteps, 8);
    maxToolCalls = Math.max(maxToolCalls, 8);
    maxExecutionTimeMs = 20000;
  }

  return {
    jobClass,
    complexity,
    preferredTier,
    fallbackTiers,
    latencyBudgetMs,
    qualityTarget,
    contextBudgetTokens: Math.max(8000, contextTokens + 4000),
    maxSteps,
    maxToolCalls,
    maxExecutionTimeMs,
    maxRetries,
    maxOutputTokens,
    toolRequirement: toolReq,
    criticality,
    weights,
    requiresStructuredOutput,
  };
}
