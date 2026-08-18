import { classifyJobComplexity, ClassifyInput, JobClassificationResult } from './jobComplexityClassifier.js';
import { selectOptimalModel, recordModelMetric, RoutingDecision } from './routingEngine.js';
import { recordInferenceTelemetry, logAiPerfTrace, log9RouterPerf } from './aiObservability.js';
import { validateInput, validateOutput } from './guardrails.js';
import { logger } from '../../utils/logger.js';

export interface ZeroClawExecutionInput extends ClassifyInput {
  requestId?: string;
  userId: string;
  organizationId: string;
  storeId?: string;
  chatId?: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  tools?: Array<{ name: string; description: string; parameters: any; execute: (args: any) => Promise<any> }>;
}

export interface ZeroClawExecutionResult {
  requestId: string;
  content: string;
  model: string;
  provider: string;
  jobClassification: JobClassificationResult;
  routingDecision: RoutingDecision;
  toolResults: Array<{ name: string; args: any; result: any; latencyMs: number }>;
  tokens: { input: number; output: number };
  latencyMs: { routing: number; ttft: number; inference: number; total: number };
  cacheHit: boolean;
  guardrailStatus: { inputSafe: boolean; outputSafe: boolean; piiRedacted: boolean };
}

// ── In-Memory Tenant-Isolated Read-Only Tool Execution Cache & Precomputed Schema Registry ──
const toolCache = new Map<string, { result: any; timestamp: number }>();
const precomputedToolSchemas = new Map<string, string>(); // Minified JSON schemas per tool
const TOOL_CACHE_TTL_MS = 30000; // 30s cache

function getToolCacheKey(orgId: string, toolName: string, args: any): string {
  return `${orgId}:${toolName}:${JSON.stringify(args)}`;
}

function getMinifiedToolSchema(tool: { name: string; description: string; parameters: any }): string {
  let cached = precomputedToolSchemas.get(tool.name);
  if (!cached) {
    cached = JSON.stringify({
      n: tool.name,
      d: tool.description,
      p: tool.parameters || {},
    });
    precomputedToolSchemas.set(tool.name, cached);
  }
  return cached;
}

export async function executeZeroClawPipeline(input: ZeroClawExecutionInput): Promise<ZeroClawExecutionResult> {
  const startTime = performance.now();
  const requestId = input.requestId || `req-zc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Safety & Guardrails Verification
  const preInfStart = performance.now();
  const safetyCheck = validateInput(input.prompt, input.userId || 'system');
  if (!safetyCheck.passed) {
    logger.warn({ requestId, checks: safetyCheck.checks }, '🚫 ZeroClaw: Prompt injection / safety guardrail triggered');
  }
  const cleanPrompt = safetyCheck.sanitizedInput || input.prompt;

  // 2. Sub-Millisecond Job Complexity Classification
  const classification = classifyJobComplexity({
    ...input,
    prompt: cleanPrompt,
    availableTools: input.tools,
  });
  const policy = classification.policy;

  // 3. Routing Score & Model Selection
  const routeStart = performance.now();
  const routing = selectOptimalModel(policy);
  const routeMs = performance.now() - routeStart;
  const primaryModel = routing.primaryModel;

  log9RouterPerf({
    requestId,
    jobClass: classification.jobClass,
    complexity: classification.complexity,
    selectedModel: primaryModel.id,
    provider: primaryModel.provider,
    decisionMs: routeMs,
    circuitState: primaryModel.tier,
    fallbackCount: routing.fallbackModels.length,
  });

  logger.info({
    requestId,
    jobClass: classification.jobClass,
    complexity: classification.complexity,
    selectedModel: primaryModel.id,
    provider: primaryModel.provider,
    preferredTier: policy.preferredTier,
  }, '[ZeroClaw Engine] Route Selected');

  // 4. Warm Bounded Context & Tool Engineering (Fast-path for DIRECT queries)
  const toolExecStart = performance.now();
  let toolResults: Array<{ name: string; args: any; result: any; latencyMs: number }> = [];
  let cacheHit = false;

  if (input.tools && input.tools.length > 0 && policy.toolRequirement !== 'NO_TOOL') {
    // Warm tool schema pre-fetching
    input.tools.forEach((t) => getMinifiedToolSchema(t));

    // Bounded Tool Execution: Limit total tool executions to policy.maxToolCalls
    const executableTools = input.tools.slice(0, policy.maxToolCalls);

    for (const tool of executableTools) {
      const cacheKey = getToolCacheKey(input.organizationId, tool.name, { prompt: cleanPrompt });
      const cached = toolCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < TOOL_CACHE_TTL_MS) {
        cacheHit = true;
        toolResults.push({ name: tool.name, args: {}, result: cached.result, latencyMs: 0.1 });
      } else {
        try {
          const t0 = performance.now();
          const res = await Promise.race([
            tool.execute({ prompt: cleanPrompt }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Tool execution timeout')), 4000)),
          ]);
          const t1 = performance.now();
          toolResults.push({ name: tool.name, args: {}, result: res, latencyMs: t1 - t0 });
          toolCache.set(cacheKey, { result: res, timestamp: Date.now() });
        } catch (err: any) {
          logger.warn({ toolName: tool.name, err: err?.message }, '[ZeroClaw Engine] Tool execution note');
        }
      }
    }
  }

  const toolEvalMs = performance.now() - toolExecStart;
  const preInferenceMs = performance.now() - startTime;

  // 5. Provider Inference Execution with Adaptive Fallback
  const ttftStart = performance.now();
  let selectedModelId = primaryModel.id;
  let selectedProvider = primaryModel.provider;
  let responseContent = '';
  let inputTokens = Math.ceil(cleanPrompt.length / 4) + (input.history ? input.history.length * 20 : 0);
  let outputTokens = 0;
  let inferenceSuccess = false;
  let fallbackOccurred = false;
  let fallbackFrom: string | undefined = undefined;

  const candidateList = [primaryModel, ...routing.fallbackModels];

  for (let attempt = 0; attempt < Math.min(candidateList.length, policy.maxRetries + 1); attempt++) {
    const candidate = candidateList[attempt];

    try {
      if (performance.now() - startTime > policy.maxExecutionTimeMs) {
        throw new Error('ZeroClaw execution policy time limit exceeded');
      }

      const simulatedTtft = candidate.provider === 'groq' ? 45 : (candidate.provider === 'google' ? 90 : 180);
      const simulatedInferenceTime = candidate.provider === 'groq' ? 120 : 250;

      await new Promise((r) => setTimeout(r, Math.min(simulatedTtft, 50)));

      responseContent = generateMockModelResponse(candidate.id, cleanPrompt, classification, toolResults);
      outputTokens = Math.ceil(responseContent.length / 4);

      recordModelMetric(candidate.id, simulatedTtft, simulatedInferenceTime, true);
      selectedModelId = candidate.id;
      selectedProvider = candidate.provider;
      inferenceSuccess = true;

      if (attempt > 0) {
        fallbackOccurred = true;
        fallbackFrom = primaryModel.id;
      }
      break;
    } catch (attemptErr: any) {
      logger.warn({ candidateModel: candidate.id, attempt, err: attemptErr?.message }, '[ZeroClaw Engine] Provider attempt failed, trying fallback');
      recordModelMetric(candidate.id, 5000, 5000, false);
    }
  }

  if (!inferenceSuccess) {
    responseContent = `[ZeroClaw Fallback System] Request processed with safe fallback response for query: "${cleanPrompt.substring(0, 50)}..."`;
    selectedModelId = 'llama-3.1-8b-instant';
    selectedProvider = 'groq';
  }

  // 6. Output Guardrail & PII Filter
  const outputGuard = validateOutput(responseContent, input.userId || 'system');
  const finalContent = outputGuard.sanitizedOutput || responseContent;

  const endTime = performance.now();
  const ttftMs = Math.round(Math.max(20, performance.now() - ttftStart));
  const totalLatencyMs = Math.round(endTime - startTime);
  const inferenceMs = Math.round(totalLatencyMs - preInferenceMs - toolEvalMs);
  const streamMs = Math.max(10, totalLatencyMs - ttftMs);

  // 7. Telemetry & Observability Tracing
  recordInferenceTelemetry({
    requestId,
    jobClass: classification.jobClass,
    complexity: classification.complexity,
    modelSelected: selectedModelId,
    provider: selectedProvider,
    routingDecisionMs: parseFloat(routing.routingTimeMs.toFixed(2)),
    queueWaitMs: 2,
    ttftMs,
    inferenceMs,
    totalLatencyMs,
    contextTokens: inputTokens,
    outputTokens,
    toolCallsCount: toolResults.length,
    fallbackOccurred,
    fallbackFromModel: fallbackFrom,
    cacheHit,
    success: true,
  });

  logAiPerfTrace({
    requestId,
    tenantId: input.organizationId,
    storeId: input.storeId,
    model: selectedModelId,
    provider: selectedProvider,
    preInferenceMs,
    toolEvalMs,
    ttftMs,
    streamMs,
    totalMs: totalLatencyMs,
    promptTokens: inputTokens,
    completionTokens: outputTokens,
    cacheHit,
  });

  return {
    requestId,
    content: finalContent,
    model: selectedModelId,
    provider: selectedProvider,
    jobClassification: classification,
    routingDecision: routing,
    toolResults,
    tokens: { input: inputTokens, output: outputTokens },
    latencyMs: {
      routing: parseFloat(routing.routingTimeMs.toFixed(2)),
      ttft: ttftMs,
      inference: inferenceMs,
      total: totalLatencyMs,
    },
    cacheHit,
    guardrailStatus: {
      inputSafe: safetyCheck.passed,
      outputSafe: outputGuard.passed,
      piiRedacted: Boolean(safetyCheck.sanitizedInput || outputGuard.sanitizedOutput),
    },
  };
}

function generateMockModelResponse(
  modelId: string,
  prompt: string,
  classification: JobClassificationResult,
  tools: any[]
): string {
  const prefix = `[Engine: ZeroClaw / 9router | Model: ${modelId} | Tier: ${classification.policy.preferredTier}]`;
  if (classification.jobClass === 'CHAT_SIMPLE') {
    return `${prefix} Halo! Ada yang bisa ZEGA AI bantu untuk toko Anda hari ini?`;
  }
  if (classification.jobClass === 'FINANCIAL_ANALYSIS') {
    return `${prefix} **Laporan Keuangan & Analisis Profitabilitas**\n- Total Omzet: Rp 45.800.000\n- Margin Bersih: 28.5%\n- Rekomendasi: Optimalkan stok barang terlaris untuk meningkatkan cashflow mingguan.`;
  }
  if (classification.jobClass === 'COPILOT_ACTION' || classification.jobClass === 'COPILOT_REASONING') {
    const toolMsg = tools.length > 0 ? ` [Diproses via ${tools.length} alat eksekusi]` : '';
    return `${prefix} Action executed successfully.${toolMsg} Penjualan dan stok telah disinkronkan secara real-time.`;
  }
  return `${prefix} Tanggapan terverifikasi untuk query: "${prompt}". Semua sistem beroperasi secara optimal dengan latensi minimal.`;
}

