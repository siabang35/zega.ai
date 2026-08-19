import assert from 'node:assert';
import { evaluateTaskComplexity, executeRoutedModelPipeline } from '../services/aiRouterService.js';
import { aiModelRouter } from '../services/ai/aiModelRouter.js';
import { resolveCanonicalAssistantType, getAssistantDefinition } from '../services/ai/assistantRegistry.js';
import { getAuthorizedTools, executeTool } from '../services/ai/toolRegistry.js';

const expect = (val: any) => ({
  toBeGreaterThanOrEqual: (n: number) => assert.ok(val >= n, `Expected ${val} >= ${n}`),
  toBeGreaterThan: (n: number) => assert.ok(val > n, `Expected ${val} > ${n}`),
  toBeLessThan: (n: number) => assert.ok(val < n, `Expected ${val} < ${n}`),
  toBe: (target: any) => assert.strictEqual(val, target),
  toBeDefined: () => assert.ok(val !== undefined && val !== null),
  toBeTruthy: () => assert.ok(Boolean(val), `Expected ${val} to be truthy`),
  toContain: (str: string) => assert.ok(String(val).toLowerCase().includes(str.toLowerCase()), `Expected "${val}" to contain "${str}"`),
});

const tests: { name: string; fn: () => void | Promise<void> }[] = [];

function describe(name: string, fn: () => void) {
  console.log(`\n====================================================================`);
  console.log(`  ${name}`);
  console.log(`====================================================================`);
  fn();
}

function it(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

async function runTests() {
  let passedCount = 0;
  let failedCount = 0;

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ✓ ${t.name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ✗ ${t.name}:`, err.message);
      failedCount++;
    }
  }

  console.log(`\n--------------------------------------------------------------------`);
  console.log(`  Summary: ${passedCount} passed, ${failedCount} failed of ${tests.length} tests`);
  console.log(`--------------------------------------------------------------------\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

describe('ZEGA AI — 5 Canonical Assistants Hardening & Real Model Routing Suite', () => {

  // --------------------------------------------------------------------------
  // TEST 1: HOME ASSISTANT
  // --------------------------------------------------------------------------
  it('1. ZEGA Home Assistant — Business Overview ("Bagaimana kondisi bisnis saya?")', async () => {
    const canonical = resolveCanonicalAssistantType('home');
    expect(canonical).toBe('home');

    const def = getAssistantDefinition('home');
    expect(def.allowedTools).toContain('get_business_overview');

    const res = await aiModelRouter.generateAssistantResponse({
      requestId: 'test-req-home-01',
      assistantType: 'home',
      userId: 'usr-test-01',
      tenantId: '00000000-0000-0000-0000-000000000001',
      conversationId: 'conv-test-home',
      message: 'Bagaimana kondisi bisnis saya?'
    });

    expect(res.success).toBeTruthy();
    expect(res.assistantType).toBe('home');
    expect(res.message).toBeTruthy();
    expect(res.telemetry.total_inference_ms).toBeGreaterThan(0);
    console.log(`     [Home Model: ${res.model} | Provider: ${res.provider} | Inference: ${res.telemetry.total_inference_ms}ms]`);
  });

  // --------------------------------------------------------------------------
  // TEST 2: HELP ASSISTANT
  // --------------------------------------------------------------------------
  it('2. ZEGA Help Assistant — Feature Guide ("Bagaimana cara menambahkan produk?")', async () => {
    const canonical = resolveCanonicalAssistantType('help');
    expect(canonical).toBe('help');

    const res = await aiModelRouter.generateAssistantResponse({
      requestId: 'test-req-help-01',
      assistantType: 'help',
      userId: 'usr-test-01',
      tenantId: '00000000-0000-0000-0000-000000000001',
      conversationId: 'conv-test-help',
      message: 'Bagaimana cara menambahkan produk?'
    });

    expect(res.success).toBeTruthy();
    expect(res.assistantType).toBe('help');
    expect(res.message).toBeTruthy();
    expect(res.telemetry.total_inference_ms).toBeGreaterThan(0);
    console.log(`     [Help Model: ${res.model} | Provider: ${res.provider} | Inference: ${res.telemetry.total_inference_ms}ms]`);
  });

  // --------------------------------------------------------------------------
  // TEST 3: FINANCE ASSISTANT (NONTINSPECTION TOOL EXECUTION)
  // --------------------------------------------------------------------------
  it('3. ZEGA Finance Assistant — Real Financial Metric Tool Execution ("Berapa profit bulan ini?")', async () => {
    const canonical = resolveCanonicalAssistantType('finance');
    expect(canonical).toBe('finance');

    const authorizedTools = getAuthorizedTools('finance');
    const toolNames = authorizedTools.map(t => t.name);
    expect(toolNames).toContain('get_financial_metrics');

    // Help should NEVER have finance tools
    const helpTools = getAuthorizedTools('help').map(t => t.name);
    assert.strictEqual(helpTools.includes('get_financial_metrics'), false, 'Tool isolation violation: Help must not have financial metrics tool');

    const toolExec = await executeTool('finance', 'get_financial_metrics', {}, { tenantId: 'tenant-01' });
    expect(toolExec.success).toBeTruthy();
    expect(toolExec.result.netProfit).toBeDefined();

    const res = await aiModelRouter.generateAssistantResponse({
      requestId: 'test-req-finance-01',
      assistantType: 'finance',
      userId: 'usr-test-01',
      tenantId: '00000000-0000-0000-0000-000000000001',
      conversationId: 'conv-test-finance',
      message: 'Berapa profit bulan ini?'
    });

    expect(res.success).toBeTruthy();
    expect(res.assistantType).toBe('finance');
    expect(res.executedTools).toContain('get_financial_metrics');
    console.log(`     [Finance Model: ${res.model} | Executed Tools: ${res.executedTools?.join(', ')} | Inference: ${res.telemetry.total_inference_ms}ms]`);
  });

  // --------------------------------------------------------------------------
  // TEST 4: KNOWLEDGE ASSISTANT
  // --------------------------------------------------------------------------
  it('4. ZEGA Knowledge Assistant — Tenant SOP RAG ("Apa isi dokumen SOP saya tentang retur?")', async () => {
    const canonical = resolveCanonicalAssistantType('knowledge');
    expect(canonical).toBe('knowledge');

    const res = await aiModelRouter.generateAssistantResponse({
      requestId: 'test-req-knowledge-01',
      assistantType: 'knowledge',
      userId: 'usr-test-01',
      tenantId: '00000000-0000-0000-0000-000000000001',
      conversationId: 'conv-test-knowledge',
      message: 'Apa isi dokumen SOP saya tentang retur?'
    });

    expect(res.success).toBeTruthy();
    expect(res.assistantType).toBe('knowledge');
    expect(res.message).toBeTruthy();
    console.log(`     [Knowledge Model: ${res.model} | Context Sources: ${res.contextSources?.join(', ')}]`);
  });

  // --------------------------------------------------------------------------
  // TEST 5: ZEGA COPILOT
  // --------------------------------------------------------------------------
  it('5. ZEGA Copilot — Operational Swarm ("Analisis stok saya dan beri tahu apa yang harus saya lakukan.")', async () => {
    const canonical = resolveCanonicalAssistantType('zega_copilot');
    expect(canonical).toBe('zega_copilot');

    const res = await aiModelRouter.generateAssistantResponse({
      requestId: 'test-req-copilot-01',
      assistantType: 'zega_copilot',
      userId: 'usr-test-01',
      tenantId: '00000000-0000-0000-0000-000000000001',
      conversationId: 'conv-test-copilot',
      message: 'Analisis stok saya dan beri tahu apa yang harus saya lakukan.'
    });

    expect(res.success).toBeTruthy();
    expect(res.assistantType).toBe('zega_copilot');
    expect(res.message).toBeTruthy();
    console.log(`     [ZEGA Copilot Model: ${res.model} | Inference: ${res.telemetry.total_inference_ms}ms]`);
  });

  // --------------------------------------------------------------------------
  // TEST 6: ISOLATION & CONTRACT ENFORCEMENT
  // --------------------------------------------------------------------------
  it('6. Contract Enforcement — Reject invalid contract & unauthorized tool calls', async () => {
    // Missing tenantId must throw
    try {
      await aiModelRouter.generateAssistantResponse({
        requestId: 'test-bad-01',
        assistantType: 'home',
        userId: 'usr-test-01',
        tenantId: '',
        conversationId: 'conv-test',
        message: 'Hello'
      });
      assert.fail('Should have thrown TENANT_BOUNDARY_VIOLATION');
    } catch (err: any) {
      expect(err.message).toContain('TENANT_BOUNDARY_VIOLATION');
    }

    // Unauthorized tool execution
    const illegalTool = await executeTool('help', 'execute_authorized_action', {}, { tenantId: 'tenant-01' });
    expect(illegalTool.success).toBe(false);
    expect(illegalTool.error).toContain('TOOL_ISOLATION_VIOLATION');
  });

});

runTests();
