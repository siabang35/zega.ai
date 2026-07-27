import { safeInfer } from '../ai/inference.pipeline.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — OmniOrchestrator Intelligence Engine
 *
 * The central "CEO Agent" that coordinates all domain meshes.
 * Implements:
 * - Strategic KPI decomposition into actionable mesh-level OKRs
 * - Multi-model consensus for high-stakes decisions
 * - Cross-mesh conflict resolution with weighted arbitration
 * - Adaptive task distribution based on agent capacity & performance
 * - Predictive resource allocation using historical patterns
 *
 * Design Principle: Every decision above a configurable threshold
 * is validated by multi-model consensus before execution.
 */

// ── Types ──

export interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  kpis: KPI[];
  priority: number; // 0-100
  deadline?: string;
  status: 'planning' | 'active' | 'achieved' | 'at_risk';
}

export interface KPI {
  name: string;
  target: number;
  current: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface MeshOKR {
  meshId: string;
  objectiveId: string;
  keyResults: { description: string; target: number; weight: number }[];
  assignedAt: string;
}

export interface ConsensusResult {
  decision: string;
  confidence: number;
  models: { provider: string; model: string; response: string; confidence: number }[];
  consensusReached: boolean;
  rationale: string;
}

export interface ConflictResolution {
  conflictId: string;
  meshA: string;
  meshB: string;
  subject: string;
  resolution: string;
  rationale: string;
  decidedBy: 'omni_orchestrator' | 'human';
}

// ── Strategic Decomposition ──

/**
 * Decomposes a high-level board objective into mesh-level OKRs.
 * Uses Claude Sonnet 4 for maximum reasoning accuracy.
 */
export async function decomposeObjective(objective: StrategicObjective): Promise<MeshOKR[]> {
  const result = await safeInfer({
    prompt: `You are the OmniOrchestrator — the central strategic AI coordinator for ZEGA AI platform.

OBJECTIVE: "${objective.title}"
DESCRIPTION: ${objective.description}
KPIs: ${JSON.stringify(objective.kpis)}
PRIORITY: ${objective.priority}/100
DEADLINE: ${objective.deadline || 'No deadline'}

Decompose this objective into specific, measurable OKRs for the following domain meshes:
- finance-mesh: Financial operations, budgeting, treasury
- procurement-mesh: Vendor management, purchasing, contracts
- supply-chain-mesh: Logistics, inventory, demand forecasting
- hr-mesh: Workforce, talent, payroll
- legal-mesh: Compliance, regulatory, audit
- security-mesh: Cybersecurity, threat detection
- sales-mesh: Revenue, campaigns, customer acquisition
- cx-mesh: Customer experience, support, retention
- manufacturing-mesh: Production, quality, maintenance
- sustainability-mesh: ESG, carbon tracking, circular economy
- rnd-mesh: Innovation, patents, technology scouting

For each relevant mesh, provide:
1. Specific key results with numeric targets
2. Weight (0-1) indicating importance to the overall objective
3. Only include meshes that are DIRECTLY relevant

Respond in JSON format:
{
  "mesh_okrs": [
    {
      "meshId": "finance-mesh",
      "keyResults": [
        { "description": "...", "target": 0, "weight": 0.0 }
      ]
    }
  ],
  "reasoning": "..."
}`,
    systemPrompt: 'You are a highly precise strategic AI orchestrator. Output ONLY valid JSON. Be specific with numeric targets. Focus on measurable, actionable outcomes.',
    strategy: 'accuracy',
    agentId: 'omni-orchestrator',
    meshId: 'central',
    temperature: 0.2,
    maxTokens: 4096,
  });

  try {
    const parsed = JSON.parse(result.response.content);
    const okrs: MeshOKR[] = (parsed.mesh_okrs || []).map((okr: { meshId: string; keyResults: { description: string; target: number; weight: number }[] }) => ({
      meshId: okr.meshId,
      objectiveId: objective.id,
      keyResults: okr.keyResults,
      assignedAt: new Date().toISOString(),
    }));

    logger.info({
      objectiveId: objective.id,
      meshCount: okrs.length,
      cost: result.response.costUsd,
    }, 'Strategic objective decomposed into mesh OKRs');

    return okrs;
  } catch {
    logger.error('Failed to parse OmniOrchestrator decomposition response');
    return [];
  }
}

/**
 * Multi-Model Consensus Engine
 *
 * For high-stakes decisions (financial >$10K, compliance-critical, cross-mesh),
 * queries multiple AI models and requires agreement before execution.
 *
 * Consensus threshold: 70% agreement across models.
 */
export async function multiModelConsensus(
  question: string,
  context: string,
  requiredConfidence = 0.7,
): Promise<ConsensusResult> {
  const CONSENSUS_SYSTEM_PROMPT = `You are a precise decision-making AI. Analyze the question with context provided.
Respond in JSON format:
{
  "decision": "APPROVE" | "DENY" | "ESCALATE",
  "confidence": 0.0-1.0,
  "rationale": "Clear reasoning"
}`;

  const fullPrompt = `QUESTION: ${question}\n\nCONTEXT:\n${context}`;

  // Query multiple models in parallel
  const models: { provider: string; strategy: 'accuracy' | 'cost' | 'latency' | 'compliance' }[] = [
    { provider: 'anthropic', strategy: 'accuracy' },
    { provider: 'openai', strategy: 'accuracy' },
  ];

  const modelResults: { provider: string; model: string; response: string; confidence: number }[] = [];

  for (const m of models) {
    try {
      const result = await safeInfer({
        prompt: fullPrompt,
        systemPrompt: CONSENSUS_SYSTEM_PROMPT,
        strategy: m.strategy,
        agentId: 'omni-orchestrator-consensus',
        meshId: 'central',
        temperature: 0.1,
        maxTokens: 1024,
      });

      let confidence = 0.5;
      let decision = 'ESCALATE';

      try {
        const parsed = JSON.parse(result.response.content);
        confidence = parsed.confidence || 0.5;
        decision = parsed.decision || 'ESCALATE';
      } catch {
        // If JSON parsing fails, use raw text analysis
        if (result.response.content.includes('APPROVE')) decision = 'APPROVE';
        if (result.response.content.includes('DENY')) decision = 'DENY';
      }

      modelResults.push({
        provider: result.response.provider,
        model: result.response.model,
        response: decision,
        confidence,
      });
    } catch (error) {
      logger.warn({ provider: m.provider, error }, 'Model failed in consensus — skipping');
    }
  }

  // Calculate consensus
  const approveCount = modelResults.filter((r) => r.response === 'APPROVE').length;
  const denyCount = modelResults.filter((r) => r.response === 'DENY').length;
  const totalModels = modelResults.length;

  const avgConfidence = totalModels > 0
    ? modelResults.reduce((sum, r) => sum + r.confidence, 0) / totalModels
    : 0;

  let consensusDecision: string;
  let consensusReached: boolean;

  if (totalModels === 0) {
    consensusDecision = 'ESCALATE';
    consensusReached = false;
  } else if (approveCount / totalModels >= requiredConfidence) {
    consensusDecision = 'APPROVE';
    consensusReached = true;
  } else if (denyCount / totalModels >= requiredConfidence) {
    consensusDecision = 'DENY';
    consensusReached = true;
  } else {
    consensusDecision = 'ESCALATE';
    consensusReached = false;
  }

  const result: ConsensusResult = {
    decision: consensusDecision,
    confidence: avgConfidence,
    models: modelResults,
    consensusReached,
    rationale: consensusReached
      ? `${approveCount}/${totalModels} models agreed on ${consensusDecision} with avg confidence ${(avgConfidence * 100).toFixed(1)}%`
      : `Consensus not reached (${approveCount} approve, ${denyCount} deny, ${totalModels - approveCount - denyCount} escalate). Routing to human review.`,
  };

  logger.info({
    decision: result.decision,
    confidence: result.confidence,
    consensusReached: result.consensusReached,
    modelCount: totalModels,
  }, 'Multi-model consensus completed');

  return result;
}

/**
 * Cross-Mesh Conflict Resolution
 *
 * When two meshes have competing resource or priority claims,
 * the OmniOrchestrator arbitrates based on:
 * 1. Enterprise-level KPI impact
 * 2. Financial implications
 * 3. Compliance requirements (always wins)
 * 4. Time sensitivity
 */
export async function resolveConflict(
  meshA: string,
  meshB: string,
  subject: string,
  contextA: string,
  contextB: string,
): Promise<ConflictResolution> {
  const result = await safeInfer({
    prompt: `You are the OmniOrchestrator resolving a cross-mesh conflict.

CONFLICT BETWEEN: ${meshA} vs ${meshB}
SUBJECT: ${subject}

${meshA} POSITION:
${contextA}

${meshB} POSITION:
${contextB}

ARBITRATION RULES (in priority order):
1. Compliance requirements ALWAYS take precedence
2. Financial impact to enterprise P&L
3. Strategic alignment with board objectives
4. Time sensitivity and opportunity cost
5. Precedent from similar past decisions

Respond in JSON:
{
  "resolution": "Favor ${meshA}" | "Favor ${meshB}" | "Compromise" | "Escalate to human",
  "rationale": "...",
  "conditions": ["..."],
  "impactAssessment": { "financial": "...", "operational": "...", "risk": "..." }
}`,
    systemPrompt: 'You are an impartial enterprise arbitrator. Be precise, data-driven, and always prioritize compliance.',
    strategy: 'accuracy',
    agentId: 'omni-orchestrator-arbiter',
    meshId: 'central',
    temperature: 0.1,
    maxTokens: 2048,
  });

  let resolution = 'Escalate to human';
  let rationale = 'Unable to parse arbitration result';

  try {
    const parsed = JSON.parse(result.response.content);
    resolution = parsed.resolution || resolution;
    rationale = parsed.rationale || rationale;
  } catch {
    // Use raw text as rationale
    rationale = result.response.content;
  }

  const conflictResult: ConflictResolution = {
    conflictId: `conflict-${crypto.randomUUID().slice(0, 8)}`,
    meshA,
    meshB,
    subject,
    resolution,
    rationale,
    decidedBy: 'omni_orchestrator',
  };

  logger.info({
    conflictId: conflictResult.conflictId,
    meshA,
    meshB,
    resolution,
  }, 'Cross-mesh conflict resolved');

  return conflictResult;
}
