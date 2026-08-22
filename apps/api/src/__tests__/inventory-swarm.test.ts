import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeInventoryTool } from '../services/ai/inventoryTools.js';
import { INVENTORY_SKILLS } from '../services/ai/inventorySkills.js';
import { InventorySwarmOrchestrator } from '../services/ai/inventorySwarmOrchestrator.js';

describe('AI Inventory Swarm Suite', () => {
  const sampleContext = {
    userId: '11111111-1111-1111-1111-111111111111',
    organizationId: '12345678-1234-1234-1234-123456789012',
    storeId: '87654321-4321-4321-4321-210987654321',
    permissions: ['inventory.read', 'inventory.write'],
  };

  describe('1. Inventory Tools Guardrails & Multi-Tenant Context', () => {
    it('should reject execution if storeId context is missing', async () => {
      const invalidCtx = { ...sampleContext, storeId: '' };
      const res = await executeInventoryTool('inventory.get_stock_metrics', {}, invalidCtx as any);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('INVALID_TENANT_CONTEXT'));
    });

    it('should return mock stock metrics for valid tenant context when database is empty', async () => {
      const res = await executeInventoryTool('inventory.get_stock_metrics', {}, sampleContext as any);
      assert.strictEqual(res.success, true);
      assert.ok(res.result && typeof res.result === 'object');
      assert.ok('totalProducts' in (res.result as object));
    });

    it('should execute low-stock detection tool successfully', async () => {
      const res = await executeInventoryTool('inventory.get_low_stock_products', { threshold: 10 }, sampleContext as any);
      assert.strictEqual(res.success, true);
      assert.ok(Array.isArray((res.result as any)?.lowStockItems));
    });

    it('should execute dead-stock detection tool successfully', async () => {
      const res = await executeInventoryTool('inventory.detect_dead_stock', { daysUnsold: 60 }, sampleContext as any);
      assert.strictEqual(res.success, true);
      assert.ok(Array.isArray((res.result as any)?.deadStockItems));
    });

    it('should calculate demand forecasting successfully', async () => {
      const res = await executeInventoryTool('inventory.forecast_demand', { daysToForecast: 30 }, sampleContext as any);
      assert.strictEqual(res.success, true);
      assert.strictEqual((res.result as any)?.daysAhead, 30);
    });

    it('should generate reorder recommendations successfully', async () => {
      const res = await executeInventoryTool('inventory.get_reorder_recommendations', {}, sampleContext as any);
      assert.strictEqual(res.success, true);
      assert.ok(Array.isArray((res.result as any)?.recommendations));
    });

    it('should reject stock update when agent has READ_ONLY authority', async () => {
      const readOnlyCtx = { ...sampleContext, agentAuthority: 'READ_ONLY' };
      const res = await executeInventoryTool('inventory.update_stock', { productId: 'prod-123', newStock: 50 }, readOnlyCtx as any);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('AUTHORITY_VIOLATION'));
    });

    it('should reject stock update if required parameters are missing under WRITE authority', async () => {
      const writeCtx = { ...sampleContext, agentAuthority: 'FULL_AUTONOMOUS' };
      const res = await executeInventoryTool('inventory.update_stock', { productId: 'prod-123' }, writeCtx as any);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('productId and newStock are required'));
    });
  });

  describe('2. Inventory Skills Registry', () => {
    it('should define required first-class inventory skills', () => {
      const skillIds = Object.keys(INVENTORY_SKILLS);
      assert.ok(skillIds.includes('inventory.read'));
      assert.ok(skillIds.includes('inventory.monitor'));
      assert.ok(skillIds.includes('inventory.forecast'));
      assert.ok(skillIds.includes('inventory.detect_low_stock'));
      assert.ok(skillIds.includes('inventory.detect_dead_stock'));
      assert.ok(skillIds.includes('inventory.reorder_recommendation'));
    });

    it('should map tools to skills correctly', () => {
      const monitorSkill = INVENTORY_SKILLS['inventory.monitor'];
      assert.ok(monitorSkill?.requiredTools.includes('inventory.get_stock_metrics'));
      assert.ok(monitorSkill?.requiredTools.includes('inventory.get_low_stock_products'));
    });
  });

  describe('3. Multi-Agent Swarm Orchestrator Execution Pipeline', () => {
    it('should run multi-agent swarm pipeline and produce structured result', async () => {
      const orchestrator = new InventorySwarmOrchestrator(sampleContext as any);

      const result = await orchestrator.runSwarmPipeline({
        storeId: sampleContext.storeId,
        prompt: 'Lakukan audit stok kritis dan buat saran restok 30 hari.',
        triggerType: 'MANUAL',
      });

      assert.strictEqual(result.status, 'COMPLETED');
      assert.ok(result.executionId);
      assert.ok(result.executiveReport && typeof result.executiveReport === 'object');
      assert.ok('stockHealthScore' in (result.executiveReport as object));
      assert.ok(Array.isArray(result.steps));
      assert.ok(result.steps.length > 0);
    });
  });

  describe('4. Swarm Chat Router & Write Operations Security', () => {
    it('should route inventory intent and generate grounded response', async () => {
      const { SwarmChatRouter } = await import('../services/ai/swarmChatRouter.js');
      const response = await SwarmChatRouter.processChatMessage({
        sessionId: 'sess-123',
        swarmId: 'swarm-123',
        prompt: 'Produk mana yang stoknya menipis?',
        storeId: sampleContext.storeId,
        organizationId: sampleContext.organizationId,
        userId: sampleContext.userId
      });

      assert.strictEqual(response.sessionId, 'sess-123');
      assert.ok(response.content);
      assert.ok((response.structuredPayload?.groundedItems?.length ?? 0) > 0);
      assert.ok((response.agentActivity?.length ?? 0) > 0);
    });

    it('should issue write confirmation request for inventory mutation intent', async () => {
      const { SwarmChatRouter } = await import('../services/ai/swarmChatRouter.js');
      const response = await SwarmChatRouter.processChatMessage({
        sessionId: 'sess-123',
        swarmId: 'swarm-123',
        prompt: 'Update stok SKU-100 menjadi 45 unit',
        storeId: sampleContext.storeId,
        organizationId: sampleContext.organizationId,
        userId: sampleContext.userId
      });

      assert.strictEqual(response.requiresConfirmation, true);
      assert.ok(response.pendingMutation);
      assert.ok(response.pendingMutation.confirmationToken);
      assert.strictEqual(response.pendingMutation.action, 'UPDATE_STOCK');
    });

    it('should execute write mutation with valid confirmation token', async () => {
      const { SwarmChatRouter } = await import('../services/ai/swarmChatRouter.js');
      const routeRes = await SwarmChatRouter.processChatMessage({
        sessionId: 'sess-123',
        swarmId: 'swarm-123',
        prompt: 'Update stok SKU-100 menjadi 45 unit',
        storeId: sampleContext.storeId,
        organizationId: sampleContext.organizationId,
        userId: sampleContext.userId
      });

      const token = routeRes.pendingMutation?.confirmationToken;
      assert.ok(token);

      const confirmRes = await SwarmChatRouter.confirmMutation({
        sessionId: 'sess-123',
        swarmId: 'swarm-123',
        confirmationToken: token,
        action: 'UPDATE_STOCK',
        params: { productId: '00000000-0000-0000-0000-000000000100', newStock: 45 },
        storeId: sampleContext.storeId,
        organizationId: sampleContext.organizationId,
        userId: sampleContext.userId
      });

      assert.ok(confirmRes.content);
      assert.ok(confirmRes.content.toLowerCase().includes('stok') || confirmRes.content.toLowerCase().includes('diperbarui'));
    });
  });

  describe('5. Universal AI Chat Multi-Swarm Gateway Suite', () => {
    it('should classify intent into capabilities via keyword resolver', async () => {
      const { resolveCapabilitiesFromKeywords, resolveDomainsFromCapabilities } = await import('../services/ai/swarmCapabilityRegistry.js');

      const caps1 = resolveCapabilitiesFromKeywords('stok produk mana yang menipis?');
      assert.ok(caps1.includes('inventory.read'));
      assert.ok(caps1.includes('inventory.low_stock'));

      const domains1 = resolveDomainsFromCapabilities(caps1);
      assert.ok(domains1.includes('inventory'));

      const caps2 = resolveCapabilitiesFromKeywords('berapa omzet dan penjualan toko hari ini?');
      assert.ok(caps2.includes('sales.read'));

      const domains2 = resolveDomainsFromCapabilities(caps2);
      assert.ok(domains2.includes('sales'));

      const capsMulti = resolveCapabilitiesFromKeywords('apa rekomendasi restok dan prediksi stockout minggu ini?');
      const domainsMulti = resolveDomainsFromCapabilities(capsMulti);
      assert.ok(domainsMulti.includes('inventory') || domainsMulti.includes('procurement') || domainsMulti.includes('demand'));
    });

    it('should execute universal cross-domain tools with tenant boundary checks', async () => {
      const { executeUniversalTool } = await import('../services/ai/universalSwarmTools.js');

      const salesRes = await executeUniversalTool('sales.summary', {}, { storeId: sampleContext.storeId, organizationId: sampleContext.organizationId });
      assert.strictEqual(salesRes.success, true);
      assert.strictEqual(salesRes.domain, 'sales');

      const opsRes = await executeUniversalTool('operations.store_overview', {}, { storeId: sampleContext.storeId, organizationId: sampleContext.organizationId });
      assert.strictEqual(opsRes.success, true);
      assert.strictEqual(opsRes.domain, 'operations');

      const invalidCtxRes = await executeUniversalTool('sales.summary', {}, { storeId: '', organizationId: '' });
      assert.strictEqual(invalidCtxRes.success, false);
      assert.ok(invalidCtxRes.error?.includes('INVALID_TENANT_CONTEXT'));
    });

    it('should route user message through UniversalChatOrchestrator', async () => {
      const { UniversalChatOrchestrator } = await import('../services/ai/universalChatOrchestrator.js');

      const response = await UniversalChatOrchestrator.processMessage({
        sessionId: '00000000-0000-0000-0000-000000000001',
        storeId: sampleContext.storeId,
        organizationId: sampleContext.organizationId,
        userId: sampleContext.userId,
        prompt: 'Berapa total omzet dan produk yang stoknya menipis?',
      });

      assert.strictEqual(response.sessionId, '00000000-0000-0000-0000-000000000001');
      assert.ok(response.content);
      assert.strictEqual(response.requiresConfirmation, false);
      assert.ok((response.structuredPayload?.domains?.length ?? 0) > 0);
    });

    it('should issue mutation confirmation for write intent in universal chat', async () => {
      const { UniversalChatOrchestrator } = await import('../services/ai/universalChatOrchestrator.js');

      const response = await UniversalChatOrchestrator.processMessage({
        sessionId: '00000000-0000-0000-0000-000000000001',
        storeId: sampleContext.storeId,
        organizationId: sampleContext.organizationId,
        userId: sampleContext.userId,
        prompt: 'Update stok SKU-TEST menjadi 100 unit',
      });

      assert.strictEqual(response.requiresConfirmation, true);
      assert.ok(response.pendingMutation);
      assert.strictEqual(response.pendingMutation.action, 'UPDATE_STOCK');
      assert.ok(response.pendingMutation.confirmationToken);
    });
  });
});

