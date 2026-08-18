import { ModelSpec, MODEL_TIER_REGISTRY, getAvailableModelsByTier } from './aiModelTierRegistry.js';
import { JobExecutionPolicy } from './jobComplexityClassifier.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ModelHealthMetrics {
  modelId: string;
  provider: string;
  circuitState: CircuitState;
  p50TtftMs: number;
  p95TtftMs: number;
  p50InferenceMs: number;
  p95InferenceMs: number;
  errorRate: number;
  timeoutRate: number;
  lastFailureTimestamp: number;
  successCount: number;
  failureCount: number;
  totalRequests: number;
}

export interface CandidateScore {
  spec: ModelSpec;
  totalScore: number;
  qualityScore: number;
  latencyScore: number;
  reliabilityScore: number;
  contextScore: number;
  costPenalty: number;
  circuitState: CircuitState;
  estimatedTtftMs: number;
  reasoning: string;
}

export interface RoutingDecision {
  primaryModel: ModelSpec;
  fallbackModels: ModelSpec[];
  candidateScores: CandidateScore[];
  routingTimeMs: number;
  decisionReason: string;
}

// ── In-Memory Rolling Metrics & Circuit Breaker Store ──
const modelHealthStore = new Map<string, ModelHealthMetrics>();
const RESET_TIMEOUT_MS = 15000;

function getOrInitHealth(modelId: string, provider: string): ModelHealthMetrics {
  let health = modelHealthStore.get(modelId);
  if (!health) {
    // Default baseline initial metrics per provider
    let initialTtft = 400;
    if (provider === 'groq') initialTtft = 120;
    else if (provider === 'google') initialTtft = 250;
    else if (provider === '9router') initialTtft = 600;

    health = {
      modelId,
      provider,
      circuitState: 'CLOSED',
      p50TtftMs: initialTtft,
      p95TtftMs: initialTtft * 1.8,
      p50InferenceMs: initialTtft * 3,
      p95InferenceMs: initialTtft * 5,
      errorRate: 0.0,
      timeoutRate: 0.0,
      lastFailureTimestamp: 0,
      successCount: 10,
      failureCount: 0,
      totalRequests: 10,
    };
    modelHealthStore.set(modelId, health);
  }

  // Auto-transition OPEN to HALF_OPEN after timeout
  if (health.circuitState === 'OPEN' && Date.now() - health.lastFailureTimestamp > RESET_TIMEOUT_MS) {
    health.circuitState = 'HALF_OPEN';
  }

  return health;
}

export function recordModelMetric(modelId: string, ttftMs: number, inferenceMs: number, isSuccess: boolean, isTimeout = false): void {
  const spec = MODEL_TIER_REGISTRY[modelId];
  const provider = spec?.provider || 'unknown';
  const health = getOrInitHealth(modelId, provider);

  health.totalRequests++;

  if (isSuccess) {
    health.successCount++;
    if (health.circuitState === 'HALF_OPEN') {
      health.circuitState = 'CLOSED'; // Circuit recovered!
    }
    // Exponential Moving Average (EMA) for smooth metrics
    const alpha = 0.2;
    health.p50TtftMs = Math.round(health.p50TtftMs * (1 - alpha) + ttftMs * alpha);
    health.p95TtftMs = Math.round(Math.max(health.p95TtftMs, ttftMs * 1.2) * (1 - alpha) + ttftMs * alpha);
    health.p50InferenceMs = Math.round(health.p50InferenceMs * (1 - alpha) + inferenceMs * alpha);
    health.p95InferenceMs = Math.round(Math.max(health.p95InferenceMs, inferenceMs * 1.2) * (1 - alpha) + inferenceMs * alpha);
  } else {
    health.failureCount++;
    health.lastFailureTimestamp = Date.now();

    // Circuit Breaker trip conditions: 3+ failures or errorRate > 30%
    const recentErrorRate = health.failureCount / Math.max(1, health.totalRequests);
    if (health.failureCount >= 3 || recentErrorRate > 0.3 || isTimeout) {
      health.circuitState = 'OPEN';
    }
  }

  health.errorRate = health.failureCount / Math.max(1, health.totalRequests);
  health.timeoutRate = isTimeout ? 1.0 : health.timeoutRate * 0.8;
}

export function selectOptimalModel(policy: JobExecutionPolicy, availableModels?: ModelSpec[]): RoutingDecision {
  const startTime = performance.now();
  const modelsByTier = getAvailableModelsByTier();

  // Gather candidate models from preferred and fallback tiers
  let candidateSpecs: ModelSpec[] = [];
  if (availableModels && availableModels.length > 0) {
    candidateSpecs = availableModels;
  } else {
    const preferredList = modelsByTier[policy.preferredTier] || [];
    const fallbackList = policy.fallbackTiers.flatMap((t) => modelsByTier[t] || []);
    candidateSpecs = Array.from(new Set([...preferredList, ...fallbackList]));
    if (candidateSpecs.length === 0) {
      candidateSpecs = Object.values(MODEL_TIER_REGISTRY); // Fallback to full inventory
    }
  }

  // Filter out candidates missing required capabilities
  candidateSpecs = candidateSpecs.filter((spec) => {
    if (policy.toolRequirement !== 'NO_TOOL' && !spec.capabilities.toolCalling) return false;
    if (policy.requiresStructuredOutput && !spec.capabilities.structuredOutput) return false;
    return true;
  });

  const scores: CandidateScore[] = candidateSpecs.map((spec) => evaluateModelScore(spec, policy));

  // Sort descending by totalScore
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Filter out OPEN circuits unless all candidates are OPEN
  const healthyScores = scores.filter((s) => s.circuitState !== 'OPEN');
  const finalCandidates = healthyScores.length > 0 ? healthyScores : scores;

  const primary = finalCandidates[0]?.spec || Object.values(MODEL_TIER_REGISTRY)[0];
  const fallbacks = finalCandidates.slice(1, 4).map((s) => s.spec);

  const routingTimeMs = Math.max(0.01, performance.now() - startTime);

  return {
    primaryModel: primary,
    fallbackModels: fallbacks,
    candidateScores: scores,
    routingTimeMs,
    decisionReason: `Selected ${primary.id} (${primary.name}) via multi-factor routing score (Tier: ${primary.tier}, Score: ${finalCandidates[0]?.totalScore.toFixed(3)})`,
  };
}

function evaluateModelScore(spec: ModelSpec, policy: JobExecutionPolicy): CandidateScore {
  const health = getOrInitHealth(spec.id, spec.provider);
  const w = policy.weights;

  // 1. Quality Score (0..1)
  let qualityScore = 0.7;
  if (spec.tier === 'TIER_3_DEEP_REASONING') qualityScore = 0.98;
  else if (spec.tier === 'TIER_2_ADVANCED') qualityScore = 0.9;
  else if (spec.tier === 'TIER_1_FAST_GENERAL') qualityScore = 0.82;
  else if (spec.tier === 'TIER_0_ULTRA_FAST') qualityScore = 0.72;

  // 2. Latency Fit Score (0..1)
  const estTtft = health.p50TtftMs;
  const latencyScore = Math.max(0, 1 - estTtft / (policy.latencyBudgetMs || 3000));

  // 3. Reliability Score (0..1)
  let reliabilityScore = 1 - health.errorRate;
  if (health.circuitState === 'OPEN') reliabilityScore = 0.0;
  else if (health.circuitState === 'HALF_OPEN') reliabilityScore = 0.5;

  // 4. Context Fit Score (0..1)
  const contextScore = spec.maxContext >= policy.contextBudgetTokens ? 1.0 : spec.maxContext / policy.contextBudgetTokens;

  // 5. Cost Penalty (0..1)
  const costPenalty = (spec.costPer1kInputUsd * 2 + spec.costPer1kOutputUsd) * 5;

  // Total Weighted Score
  let totalScore =
    w.quality * qualityScore +
    w.latency * latencyScore +
    w.reliability * reliabilityScore +
    w.context * contextScore -
    w.cost * costPenalty;

  // Tier Match Boost
  if (spec.tier === policy.preferredTier) {
    totalScore += 0.15;
  }

  return {
    spec,
    totalScore: Math.max(0, totalScore),
    qualityScore,
    latencyScore,
    reliabilityScore,
    contextScore,
    costPenalty,
    circuitState: health.circuitState,
    estimatedTtftMs: estTtft,
    reasoning: `Quality=${qualityScore.toFixed(2)}, LatencyFit=${latencyScore.toFixed(2)}, Circuit=${health.circuitState}`,
  };
}

export function getHealthMetricsSnapshot(): ModelHealthMetrics[] {
  return Array.from(modelHealthStore.values());
}
