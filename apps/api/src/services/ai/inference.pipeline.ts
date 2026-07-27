import { infer, type InferenceRequest, type InferenceResponse } from './model.router.js';
import { validateInput, validateOutput } from './guardrails.js';
import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — Safe Inference Pipeline
 *
 * Orchestrates the full inference lifecycle:
 * 1. Input guardrails (PII redaction, injection detection)
 * 2. Model routing & inference
 * 3. Output guardrails (PII leak prevention, confidence checks)
 * 4. Audit logging
 *
 * This is the ONLY entry point for AI inference in the entire platform.
 * Direct calls to model.router are forbidden outside this module.
 */

export interface SafeInferenceResult {
  response: InferenceResponse;
  guardrails: {
    inputPassed: boolean;
    outputPassed: boolean;
    inputChecks: string[];
    outputChecks: string[];
  };
  audit: {
    agentId: string;
    meshId: string;
    timestamp: string;
    traceId: string;
  };
}

export async function safeInfer(request: InferenceRequest): Promise<SafeInferenceResult> {
  const traceId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // ── Layer 1: Input Guardrails ──
  const inputResult = validateInput(request.prompt, request.agentId);

  if (!inputResult.passed) {
    const failedChecks = inputResult.checks.filter((c) => !c.passed);
    const critical = failedChecks.some((c) => c.severity === 'critical');

    if (critical) {
      logger.warn({
        traceId,
        agent: request.agentId,
        failedChecks: failedChecks.map((c) => c.name),
      }, 'CRITICAL: Input guardrail blocked — inference denied');

      throw new Error(
        `Input guardrail violation: ${failedChecks.map((c) => c.name).join(', ')}. ` +
        'Request blocked for security. This incident has been logged.'
      );
    }
  }

  // Use sanitized input (PII redacted)
  const sanitizedRequest: InferenceRequest = {
    ...request,
    prompt: inputResult.sanitizedInput || request.prompt,
  };

  // ── Layer 2: AI Model Inference ──
  const response = await infer(sanitizedRequest);

  // ── Layer 3: Output Guardrails ──
  const outputResult = validateOutput(response.content, request.agentId);

  // Apply output sanitization (strip any leaked PII)
  const sanitizedResponse: InferenceResponse = {
    ...response,
    content: outputResult.sanitizedOutput || response.content,
  };

  // ── Layer 4: Audit Log ──
  const auditEntry = {
    traceId,
    timestamp,
    agentId: request.agentId,
    meshId: request.meshId,
    provider: response.provider,
    model: response.model,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    costUsd: response.costUsd,
    latencyMs: response.latencyMs,
    inputGuardrailPassed: inputResult.passed,
    outputGuardrailPassed: outputResult.passed,
    guardrailChecks: [
      ...inputResult.checks.map((c) => `input:${c.name}:${c.passed}`),
      ...outputResult.checks.map((c) => `output:${c.name}:${c.passed}`),
    ],
  };

  logger.info(auditEntry, 'AI inference audit trail');

  return {
    response: sanitizedResponse,
    guardrails: {
      inputPassed: inputResult.passed,
      outputPassed: outputResult.passed,
      inputChecks: inputResult.checks.map((c) => c.name),
      outputChecks: outputResult.checks.map((c) => c.name),
    },
    audit: {
      agentId: request.agentId,
      meshId: request.meshId,
      timestamp,
      traceId,
    },
  };
}
