import { getHealthMetricsSnapshot } from './routingEngine.js';

export interface TelemetryRecord {
  requestId: string;
  timestamp: string;
  jobClass: string;
  complexity: string;
  modelSelected: string;
  provider: string;
  routingDecisionMs: number;
  queueWaitMs: number;
  ttftMs: number;
  inferenceMs: number;
  totalLatencyMs: number;
  contextTokens: number;
  outputTokens: number;
  toolCallsCount: number;
  fallbackOccurred: boolean;
  fallbackFromModel?: string;
  cacheHit: boolean;
  success: boolean;
  errorCode?: string;
}

export interface SystemPerformanceSummary {
  totalRequests: number;
  successRate: number;
  avgRoutingMs: number;
  p50TtftMs: number;
  p95TtftMs: number;
  p50TotalLatencyMs: number;
  p95TotalLatencyMs: number;
  cacheHitRate: number;
  fallbackCount: number;
  modelDistribution: Record<string, number>;
  jobClassDistribution: Record<string, number>;
  modelHealth: ReturnType<typeof getHealthMetricsSnapshot>;
}

const telemetryHistory: TelemetryRecord[] = [];
const MAX_HISTORY = 1000;

export function recordInferenceTelemetry(record: Omit<TelemetryRecord, 'timestamp'>): void {
  const fullRecord: TelemetryRecord = {
    ...record,
    timestamp: new Date().toISOString(),
  };

  telemetryHistory.push(fullRecord);
  if (telemetryHistory.length > MAX_HISTORY) {
    telemetryHistory.shift();
  }
}

export function getPerformanceSummary(): SystemPerformanceSummary {
  const total = telemetryHistory.length;
  if (total === 0) {
    return {
      totalRequests: 0,
      successRate: 1.0,
      avgRoutingMs: 0,
      p50TtftMs: 0,
      p95TtftMs: 0,
      p50TotalLatencyMs: 0,
      p95TotalLatencyMs: 0,
      cacheHitRate: 0,
      fallbackCount: 0,
      modelDistribution: {},
      jobClassDistribution: {},
      modelHealth: getHealthMetricsSnapshot(),
    };
  }

  const successCount = telemetryHistory.filter((t) => t.success).length;
  const cacheHitCount = telemetryHistory.filter((t) => t.cacheHit).length;
  const fallbackCount = telemetryHistory.filter((t) => t.fallbackOccurred).length;

  const routingTimes = telemetryHistory.map((t) => t.routingDecisionMs).sort((a, b) => a - b);
  const ttfts = telemetryHistory.map((t) => t.ttftMs).sort((a, b) => a - b);
  const totalLatencies = telemetryHistory.map((t) => t.totalLatencyMs).sort((a, b) => a - b);

  const modelDist: Record<string, number> = {};
  const jobDist: Record<string, number> = {};

  for (const t of telemetryHistory) {
    modelDist[t.modelSelected] = (modelDist[t.modelSelected] || 0) + 1;
    jobDist[t.jobClass] = (jobDist[t.jobClass] || 0) + 1;
  }

  const p50Idx = Math.floor(total * 0.5);
  const p95Idx = Math.floor(total * 0.95);

  return {
    totalRequests: total,
    successRate: parseFloat((successCount / total).toFixed(4)),
    avgRoutingMs: parseFloat((routingTimes.reduce((a, b) => a + b, 0) / total).toFixed(2)),
    p50TtftMs: ttfts[p50Idx] || 0,
    p95TtftMs: ttfts[p95Idx] || 0,
    p50TotalLatencyMs: totalLatencies[p50Idx] || 0,
    p95TotalLatencyMs: totalLatencies[p95Idx] || 0,
    cacheHitRate: parseFloat((cacheHitCount / total).toFixed(4)),
    fallbackCount,
    modelDistribution: modelDist,
    jobClassDistribution: jobDist,
    modelHealth: getHealthMetricsSnapshot(),
  };
}

export function logAiPerfTrace(trace: {
  requestId: string;
  tenantId?: string;
  organizationId?: string;
  storeId?: string;
  model: string;
  provider: string;
  preInferenceMs: number;
  toolEvalMs: number;
  ttftMs: number;
  streamMs: number;
  totalMs: number;
  promptTokens: number;
  completionTokens: number;
  cacheHit: boolean;
}): void {
  console.log('[AI_PERF_TRACE]', JSON.stringify({
    requestId: trace.requestId,
    tenantId: trace.tenantId || trace.organizationId || null,
    storeId: trace.storeId || null,
    model: trace.model,
    provider: trace.provider,
    timingsMs: {
      preInference: Math.round(trace.preInferenceMs * 100) / 100,
      toolEval: Math.round(trace.toolEvalMs * 100) / 100,
      ttft: Math.round(trace.ttftMs * 100) / 100,
      stream: Math.round(trace.streamMs * 100) / 100,
      total: Math.round(trace.totalMs * 100) / 100,
    },
    tokens: {
      prompt: trace.promptTokens,
      completion: trace.completionTokens,
      total: trace.promptTokens + trace.completionTokens,
    },
    cacheHit: trace.cacheHit,
    timestamp: new Date().toISOString(),
  }));
}

export function log9RouterPerf(perf: {
  requestId: string;
  jobClass: string;
  complexity: string;
  selectedModel: string;
  provider: string;
  decisionMs: number;
  circuitState: string;
  fallbackCount: number;
}): void {
  console.log('[9ROUTER_PERF]', JSON.stringify({
    requestId: perf.requestId,
    jobClass: perf.jobClass,
    complexity: perf.complexity,
    selectedModel: perf.selectedModel,
    provider: perf.provider,
    decisionMs: Math.round(perf.decisionMs * 100) / 100,
    circuitState: perf.circuitState,
    fallbackCount: perf.fallbackCount,
    timestamp: new Date().toISOString(),
  }));
}

