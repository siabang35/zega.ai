import { logger } from '../../utils/logger.js';

/**
 * ZEGA AI — AI Guardrails System
 *
 * Multi-layer safety filters applied to ALL AI inputs and outputs.
 *
 * Layer 1: Input sanitization (PII redaction, injection detection)
 * Layer 2: Output validation (hallucination flags, PII leak prevention)
 *
 * Every guardrail check is logged for audit compliance.
 */

export interface GuardrailResult {
  passed: boolean;
  checks: GuardrailCheck[];
  sanitizedInput?: string;
  sanitizedOutput?: string;
}

export interface GuardrailCheck {
  name: string;
  passed: boolean;
  details?: string;
  severity: 'info' | 'warning' | 'critical';
}

// ── PII Patterns ──
const PII_PATTERNS: { name: string; pattern: RegExp; replacement: string }[] = [
  { name: 'credit_card', pattern: /\b(?:\d[ -]*?){13,19}\b/g, replacement: '[REDACTED_CC]' },
  { name: 'ssn', pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, replacement: '[REDACTED_SSN]' },
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },
  { name: 'phone', pattern: /\b(?:\+?1[-.]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, replacement: '[REDACTED_PHONE]' },
  { name: 'ip_address', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[REDACTED_IP]' },
];

// ── Prompt Injection Patterns ──
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(a|an|in)\s+/i,
  /system\s*:\s*/i,
  /\{?\{?\s*system\s*\}?\}?/i,
  /forget\s+(everything|all|your)\s+(you|instructions)/i,
  /override\s+(your|the)\s+(instructions|rules|guidelines)/i,
  /pretend\s+you\s+(are|were)/i,
  /act\s+as\s+(if|though)\s+you/i,
  /disregard\s+(all|your|the)\s+(previous|prior|above)/i,
  /do\s+not\s+follow\s+(your|the)\s+(instructions|rules)/i,
  // Hardened patterns — discovered via empirical adversarial testing 2026-08-20
  /developer\s+mode/i,
  /jailbreak/i,
  /bypass\s+(safety|security|filter|guard|restriction)/i,
  /(leak|show|reveal|output|print|display)\s+(the\s+)?(api|secret|private|internal)\s*(key|token|password|credential)?/i,
  /mark\s+as\s+paid\s+without/i,
  /(force|execute|trigger)\s+(payout|refund|transfer|withdrawal)\s+without/i,
];

/**
 * INPUT GUARDRAILS — applied before sending to any AI model
 */
export function validateInput(input: string, agentId: string): GuardrailResult {
  const checks: GuardrailCheck[] = [];
  let sanitized = input;

  // 1. PII Redaction
  for (const pii of PII_PATTERNS) {
    if (pii.pattern.test(sanitized)) {
      checks.push({
        name: `pii_redact_${pii.name}`,
        passed: true, // passes after redaction
        details: `Found and redacted ${pii.name} pattern`,
        severity: 'warning',
      });
      sanitized = sanitized.replace(pii.pattern, pii.replacement);
    }
  }

  // 2. Prompt Injection Detection
  let injectionDetected = false;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      injectionDetected = true;
      checks.push({
        name: 'prompt_injection',
        passed: false,
        details: `Potential prompt injection detected: ${pattern.source}`,
        severity: 'critical',
      });
      break;
    }
  }

  if (!injectionDetected) {
    checks.push({ name: 'prompt_injection', passed: true, severity: 'info' });
  }

  // 3. Input Length Validation
  const MAX_INPUT_TOKENS = 100_000;
  const estimatedTokens = Math.ceil(input.length / 4);
  if (estimatedTokens > MAX_INPUT_TOKENS) {
    checks.push({
      name: 'input_length',
      passed: false,
      details: `Input exceeds maximum length: ${estimatedTokens} estimated tokens (max: ${MAX_INPUT_TOKENS})`,
      severity: 'warning',
    });
  } else {
    checks.push({ name: 'input_length', passed: true, severity: 'info' });
  }

  const allPassed = checks.every((c) => c.passed);

  logger.info({
    agent: agentId,
    guardrail: 'input',
    passed: allPassed,
    checks: checks.map((c) => ({ name: c.name, passed: c.passed })),
  }, 'Input guardrail evaluation');

  return { passed: allPassed, checks, sanitizedInput: sanitized };
}

/**
 * OUTPUT GUARDRAILS — applied after receiving from any AI model
 */
export function validateOutput(output: string, agentId: string): GuardrailResult {
  const checks: GuardrailCheck[] = [];
  let sanitized = output || '';

  // 0. Strip DeepSeek / OpenRouter / LLM internal reasoning <think>...<think> blocks & scratchpads
  if (sanitized.includes('<think>') || /^Here's a thinking process:/i.test(sanitized) || /^Thinking Process:/i.test(sanitized)) {
    // 0a. If closed <think> tag exists, strip it
    if (/<\/think>/i.test(sanitized)) {
      sanitized = sanitized.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    }

    // 0b. Try extracting from Draft / Mental Draft / Formulate Response sections
    const draftMatch = sanitized.match(/(?:Draft|Mental Draft|Formulate Response[\s\S]*?:|Final Response|Response|Output):\s*\n*([\s\S]+?)(?=\n\s*(?:4\.|5\.|Check|Constraint|\*|#)|$)/i);
    if (draftMatch && draftMatch[1] && draftMatch[1].trim().length > 10) {
      sanitized = draftMatch[1]
        .replace(/^(?:Draft|Mental Draft|Formulate Response[\s\S]*?:|Final Response|Response|Output):\s*/i, '')
        .trim();
    } else {
      // 0c. Try extracting greeting block (Hello..., Halo...) if model output starts with greeting line inside scratchpad
      const greetingMatch = sanitized.match(/\n\s*((?:Hello|Halo|Hi|Welcome|Greetings)\b[\s\S]+?)(?=\n\s*(?:4\.|5\.|Check|Constraint|\*|#)|$)/i);
      if (greetingMatch && greetingMatch[1] && greetingMatch[1].trim().length > 10) {
        sanitized = greetingMatch[1].trim();
      } else {
        // 0d. General unclosed think tag & scratchpad stripper fallback
        sanitized = sanitized
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<think>[\s\S]*$/gi, '')
          .replace(/^(?:Here's a thinking process:|Thinking Process:)[\s\S]*?\n\n/gi, '')
          .replace(/^(?:Here's a thinking process:|Thinking Process:)/gi, '')
          .trim();
      }
    }
  }

  // If stripping left empty string, preserve original output without raw <think> tags
  if (!sanitized && output) {
    sanitized = output.replace(/<\/?think>/gi, '').trim();
  }

  // 1. PII Leak Prevention (re-scan output)
  for (const pii of PII_PATTERNS) {
    if (pii.pattern.test(sanitized)) {
      checks.push({
        name: `output_pii_leak_${pii.name}`,
        passed: true, // passes after stripping
        details: `PII detected in output and stripped: ${pii.name}`,
        severity: 'critical',
      });
      sanitized = sanitized.replace(pii.pattern, pii.replacement);
    }
  }

  // 2. Confidence/Uncertainty Detection
  const uncertaintyPhrases = [
    /i('m| am) not (sure|certain)/i,
    /i don'?t (know|have (enough )?information)/i,
    /this (may|might|could) (not )?be (accurate|correct)/i,
    /i (cannot|can't) (verify|confirm)/i,
  ];

  let hasUncertainty = false;
  for (const phrase of uncertaintyPhrases) {
    if (phrase.test(output)) {
      hasUncertainty = true;
      break;
    }
  }

  checks.push({
    name: 'confidence_check',
    passed: !hasUncertainty,
    details: hasUncertainty ? 'Model expressed uncertainty — flag for human review' : undefined,
    severity: hasUncertainty ? 'warning' : 'info',
  });

  // 3. Output Length Check (prevent extremely short/empty responses)
  if (output.trim().length < 5) {
    checks.push({
      name: 'output_completeness',
      passed: false,
      details: 'Output is too short or empty — possible generation failure',
      severity: 'warning',
    });
  } else {
    checks.push({ name: 'output_completeness', passed: true, severity: 'info' });
  }

  const allPassed = checks.every((c) => c.passed);

  logger.info({
    agent: agentId,
    guardrail: 'output',
    passed: allPassed,
    checks: checks.map((c) => ({ name: c.name, passed: c.passed })),
  }, 'Output guardrail evaluation');

  return { passed: allPassed, checks, sanitizedOutput: sanitized };
}
