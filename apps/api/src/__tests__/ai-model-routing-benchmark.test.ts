import assert from 'node:assert';
import { inspectProviderInventory, getAvailableModelsByTier, MODEL_TIER_REGISTRY } from '../services/ai/aiModelTierRegistry.js';
import { classifyJobComplexity } from '../services/ai/jobComplexityClassifier.js';
import { selectOptimalModel, recordModelMetric, getHealthMetricsSnapshot } from '../services/ai/routingEngine.js';
import { executeZeroClawPipeline } from '../services/ai/zeroclawRuntime.js';
import { createTokenChunk, createFinishChunk } from '../services/ai/streamProtocol.js';
import { getPerformanceSummary } from '../services/ai/aiObservability.js';

const expect = (val: any) => ({
  toBeGreaterThanOrEqual: (n: number) => assert.ok(val >= n, `Expected ${val} >= ${n}`),
  toBeGreaterThan: (n: number) => assert.ok(val > n, `Expected ${val} > ${n}`),
  toBeLessThan: (n: number) => assert.ok(val < n, `Expected ${val} < ${n}`),
  toBe: (target: any) => assert.strictEqual(val, target),
  toBeDefined: () => assert.ok(val !== undefined && val !== null),
  toContain: (str: string) => assert.ok(String(val).includes(str), `Expected "${val}" to contain "${str}"`),
});

const tests: { name: string; fn: () => void | Promise<void> }[] = [];

function describe(name: string, fn: () => void) {
  console.log(`\n--- ${name} ---`);
  fn();
}

function it(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

async function runTests() {
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
    } catch (err: any) {
      console.error(`  ✗ ${t.name}:`, err.message);
      process.exit(1);
    }
  }
}

describe('ZEGA AI — High-Performance Model Routing & ZeroClaw / 9router Benchmark', () => {
  it('1. Model Inventory & Capability Tiers', () => {
    const inventory = inspectProviderInventory();
    expect(inventory.length).toBeGreaterThanOrEqual(5);

    const tiers = getAvailableModelsByTier();
    expect(tiers.TIER_0_ULTRA_FAST.length).toBeGreaterThan(0);
    expect(tiers.TIER_1_FAST_GENERAL.length).toBeGreaterThan(0);
    expect(tiers.TIER_2_ADVANCED.length).toBeGreaterThan(0);
    expect(tiers.TIER_3_DEEP_REASONING.length).toBeGreaterThan(0);
  });

  it('2. Job Complexity Classifier Sub-Millisecond Speed & Taxonomy', () => {
    // Test Simple Chat
    const simpleRes = classifyJobComplexity({ prompt: 'halo zega, selamat pagi' });
    expect(simpleRes.jobClass).toBe('CHAT_SIMPLE');
    expect(simpleRes.complexity).toBe('SIMPLE');
    expect(simpleRes.policy.preferredTier).toBe('TIER_0_ULTRA_FAST');
    expect(simpleRes.classificationTimeMs).toBeLessThan(5); // Sub-ms overhead

    // Test Financial Analysis
    const financeRes = classifyJobComplexity({ prompt: 'analisis omzet dan laba bersih bulan ini', isFinanceQuery: true });
    expect(financeRes.jobClass).toBe('FINANCIAL_ANALYSIS');
    expect(financeRes.complexity).toBe('COMPLEX');
    expect(financeRes.policy.criticality).toBe('CRITICAL');
    expect(financeRes.policy.requiresStructuredOutput).toBe(true);

    // Test Copilot Action
    const copilotRes = classifyJobComplexity({
      prompt: 'sinkronkan sistem kasir',
      isCopilotAction: true,
      availableTools: [{ name: 'syncSales' }],
    });
    expect(copilotRes.jobClass).toBe('COPILOT_ACTION');
    expect(copilotRes.policy.toolRequirement).toBe('ONE_TOOL');
  });

  it('3. Multi-Factor Routing Score Calculation', () => {
    const classification = classifyJobComplexity({ prompt: 'halo' });
    const decision = selectOptimalModel(classification.policy);

    expect(decision.primaryModel).toBeDefined();
    expect(decision.candidateScores.length).toBeGreaterThan(0);
    expect(decision.primaryModel.tier).toBe('TIER_0_ULTRA_FAST');
    expect(decision.routingTimeMs).toBeLessThan(10);
  });

  it('4. Circuit Breakers & Adaptive Fallback Machine', () => {
    const testModelId = 'llama-3.3-70b-versatile';

    // Simulate consecutive failures
    recordModelMetric(testModelId, 5000, 5000, false);
    recordModelMetric(testModelId, 5000, 5000, false);
    recordModelMetric(testModelId, 5000, 5000, false);

    const snapshot = getHealthMetricsSnapshot();
    const metric = snapshot.find((m) => m.modelId === testModelId);

    expect(metric).toBeDefined();
    expect(metric?.circuitState).toBe('OPEN');
    expect(metric?.failureCount).toBeGreaterThanOrEqual(3);
  });

  it('5. End-to-End ZeroClaw Pipeline Execution with Bounds', async () => {
    const result = await executeZeroClawPipeline({
      userId: 'usr-test-01',
      organizationId: 'org-test-01',
      prompt: 'Berapa omzet toko saya hari ini?',
      tools: [
        {
          name: 'getTodaySales',
          description: 'Fetches today sales amount',
          parameters: {},
          execute: async () => ({ salesIdr: 4850000 }),
        },
      ],
    });

    expect(result.requestId).toBeDefined();
    expect(result.content).toContain('ZeroClaw');
    expect(result.tokens.input).toBeGreaterThan(0);
    expect(result.tokens.output).toBeGreaterThan(0);
    expect(result.latencyMs.total).toBeGreaterThan(0);
    expect(result.guardrailStatus.inputSafe).toBe(true);
    expect(result.guardrailStatus.outputSafe).toBe(true);
  });

  it('6. Stream Protocol Formatting & Telemetry Aggregation', () => {
    const tokenSSE = createTokenChunk('Halo ', 'gemini-2.5-flash', 'google');
    expect(tokenSSE).toContain('data: {"type":"token"');

    const finishSSE = createFinishChunk('gemini-2.5-flash', 'google', 15, 30, 120);
    expect(finishSSE).toContain('data: {"type":"finish"');

    const summary = getPerformanceSummary();
    expect(summary.totalRequests).toBeGreaterThan(0);
    expect(summary.successRate).toBe(1.0);
    expect(summary.modelDistribution).toBeDefined();
  });
});

runTests();
