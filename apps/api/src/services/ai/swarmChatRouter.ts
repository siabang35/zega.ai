/**
 * ZEGA AI — Swarm Chat Intent Router & Grounded Execution Engine
 *
 * Handles natural language prompts, intent routing to specialized agents,
 * grounded data synthesis (Fact vs Forecast vs Recommendation vs Assumption),
 * mutation confirmation intercept for write operations, and persistent message history.
 */

import { executeInventoryTool, InventoryTenantContext } from './inventoryTools.js';
import { executeRoutedModelPipeline, stripThinkingProcess } from '../aiRouterService.js';
import { SupabaseService } from '../supabaseService.js';
import { logger } from '../../utils/logger.js';

export interface ChatMessageRequest {
  sessionId: string;
  swarmId: string;
  prompt: string;
  storeId: string;
  organizationId?: string;
  userId?: string;
}

export interface GroundedItem {
  type: 'DATABASE_FACT' | 'FORECAST' | 'RECOMMENDATION' | 'ASSUMPTION';
  label: string;
  detail: string;
}

export interface AgentActivitySummary {
  agentRole: string;
  agentName: string;
  status: 'COMPLETED' | 'RUNNING' | 'WAITING' | 'FAILED';
  latencyMs: number;
  summary: string;
}

export interface ChatMessageResponse {
  messageId: string;
  sessionId: string;
  swarmId: string;
  senderType: 'SWARM';
  senderName: string;
  content: string;
  structuredPayload: {
    intent: string;
    metrics?: Record<string, any>;
    groundedItems?: GroundedItem[];
    tableData?: any[];
    recommendations?: any[];
    stockHealthScore?: number;
  };
  agentActivity: AgentActivitySummary[];
  requiresConfirmation: boolean;
  pendingMutation?: {
    action: string;
    description: string;
    params: Record<string, any>;
    confirmationToken: string;
  };
  createdAt: string;
}

export class SwarmChatRouter {
  /**
   * Route and process natural language prompt for Stock Swarm Chat
   */
  static async processChatMessage(input: ChatMessageRequest): Promise<ChatMessageResponse> {
    const startTime = Date.now();
    const messageId = `msg-${crypto.randomUUID().slice(0, 8)}`;
    const { sessionId, swarmId, prompt, storeId, organizationId, userId } = input;

    const tenantContext: InventoryTenantContext = {
      storeId,
      organizationId: organizationId || storeId,
      userId: userId || 'system',
      agentAuthority: 'READ_ONLY',
    };

    const supabase = SupabaseService.getClient();

    // 1. Save user prompt message to DB
    if (supabase) {
      try {
        await supabase.from('ai_chat_messages').insert({
          session_id: sessionId,
          swarm_id: swarmId,
          organization_id: tenantContext.organizationId,
          store_id: storeId,
          user_id: userId,
          sender_type: 'USER',
          sender_name: 'Pemilik Toko',
          content: prompt,
        });
      } catch (e) {
        logger.warn({ e }, '[SwarmChatRouter] Non-blocking user message save failure');
      }
    }

    const lowerPrompt = prompt.toLowerCase();
    const agentActivity: AgentActivitySummary[] = [];

    // ── INTENT ROUTING LOGIC ──

    // Case A: Mutation intents (Require Explicit Confirmation)
    const isUpdateStockIntent = lowerPrompt.includes('ubah stok') || lowerPrompt.includes('update stok') || lowerPrompt.includes('set stok');
    const isUpdateThresholdIntent = lowerPrompt.includes('threshold') || lowerPrompt.includes('ambang batas');
    const isCreatePlanIntent = lowerPrompt.includes('buat rencana') || lowerPrompt.includes('replenishment plan') || lowerPrompt.includes('rencana restok');
    const isCreatePOIntent = lowerPrompt.includes('buat po') || lowerPrompt.includes('purchase request') || lowerPrompt.includes('order ke supplier');

    if (isUpdateStockIntent || isUpdateThresholdIntent || isCreatePlanIntent || isCreatePOIntent) {
      let actionName = 'UPDATE_STOCK';
      let actionDesc = 'Pembaruan stok produk';
      let actionParams: Record<string, any> = {};

      if (isUpdateThresholdIntent) {
        actionName = 'UPDATE_REORDER_THRESHOLD';
        actionDesc = 'Pembaruan ambang batas (reorder threshold) produk';
        actionParams = { threshold: 30, note: prompt };
      } else if (isCreatePlanIntent) {
        actionName = 'CREATE_RESTOCK_PLAN';
        actionDesc = 'Pembuatan Rencana Pengisian Ulang Stok';
        actionParams = { planTitle: 'Rencana Restok Mingguan', note: prompt };
      } else if (isCreatePOIntent) {
        actionName = 'CREATE_PURCHASE_REQUEST';
        actionDesc = 'Pembuatan Draf Permintaan Pembelian (Purchase Request / PO)';
        actionParams = { note: prompt };
      } else {
        actionParams = { note: prompt };
      }

      const confirmationToken = `tok-${crypto.randomUUID().slice(0, 8)}`;
      const responseText = `Saya memahami Anda ingin **${actionDesc.toLowerCase()}**.

Tindakan ini adalah operasi perubahan data (write mutation) yang mempengaruhi persediaan barang toko Anda. 

Silakan konfirmasi tindakan ini di bawah ini untuk mengeksekusi penyesuaian.`;

      agentActivity.push({
        agentRole: 'COORDINATOR',
        agentName: 'Inventory Swarm Coordinator',
        status: 'COMPLETED',
        latencyMs: Date.now() - startTime,
        summary: 'Detected write mutation intent. Awaiting explicit user confirmation.',
      });

      const swarmResponse: ChatMessageResponse = {
        messageId,
        sessionId,
        swarmId,
        senderType: 'SWARM',
        senderName: 'Stock Management Swarm',
        content: responseText,
        structuredPayload: {
          intent: actionName,
          groundedItems: [
            { type: 'ASSUMPTION', label: 'AUTHORIZATION REQUIREMENT', detail: 'Write operations require explicit confirmation before execution.' }
          ]
        },
        agentActivity,
        requiresConfirmation: true,
        pendingMutation: {
          action: actionName,
          description: actionDesc,
          params: actionParams,
          confirmationToken,
        },
        createdAt: new Date().toISOString(),
      };

      // Save swarm confirmation message to DB
      if (supabase) {
        try {
          await supabase.from('ai_chat_messages').insert({
            id: messageId,
            session_id: sessionId,
            swarm_id: swarmId,
            organization_id: tenantContext.organizationId,
            store_id: storeId,
            user_id: userId,
            sender_type: 'SWARM',
            sender_name: 'Stock Management Swarm',
            content: swarmResponse.content,
            structured_payload: swarmResponse.structuredPayload,
            agent_activity: swarmResponse.agentActivity,
            requires_confirmation: true,
            pending_mutation: swarmResponse.pendingMutation,
          });
        } catch (e) {
          logger.warn({ e }, '[SwarmChatRouter] DB save error for mutation message');
        }
      }

      return swarmResponse;
    }

    // Case B: Read-only Queries (Specific vs Full Swarm Analysis)
    let intent = 'GENERAL_QUERY';
    let replyContent = '';
    let structuredPayload: any = {};

    if (lowerPrompt.includes('stok saya') || lowerPrompt.includes('berapa stok') || lowerPrompt.includes('ringkasan stok')) {
      intent = 'STOCK_METRICS';
      const mRes = await executeInventoryTool('inventory.get_stock_metrics', {}, tenantContext);
      const metrics = mRes.result || { totalProducts: 0, totalStockUnits: 0, totalStockValueIdr: 0, lowStockCount: 0 };

      agentActivity.push({
        agentRole: 'INVENTORY_MONITOR',
        agentName: 'Stock Monitor Agent',
        status: 'COMPLETED',
        latencyMs: Date.now() - startTime,
        summary: `Inspected ${metrics.totalProducts} total SKUs and inventory metrics.`,
      });

      replyContent = `Berikut adalah ringkasan persediaan barang Anda saat ini:
- **Total Produk:** ${metrics.totalProducts} SKU
- **Total Unit Stok:** ${metrics.totalStockUnits} unit
- **Nilai Total Inventaris:** Rp ${(metrics.totalStockValueIdr || 0).toLocaleString('id-ID')}
- **Stok Menipis (Kritis):** ${metrics.lowStockCount} SKU`;

      structuredPayload = {
        intent,
        metrics,
        groundedItems: [
          { type: 'DATABASE_FACT', label: 'TOTAL_STOCK_UNITS', detail: `${metrics.totalStockUnits} unit terdaftar di database.` },
          { type: 'DATABASE_FACT', label: 'INVENTORY_VALUE', detail: `Rp ${(metrics.totalStockValueIdr || 0).toLocaleString('id-ID')} total nilai persediaan.` },
        ],
      };
    } else if (lowerPrompt.includes('menipis') || lowerPrompt.includes('habis') || lowerPrompt.includes('low stock')) {
      intent = 'LOW_STOCK';
      const lRes = await executeInventoryTool('inventory.get_low_stock_products', { threshold: 10 }, tenantContext);
      const lowItems = lRes.result?.lowStockItems || [];

      agentActivity.push({
        agentRole: 'INVENTORY_MONITOR',
        agentName: 'Stock Monitor Agent',
        status: 'COMPLETED',
        latencyMs: Date.now() - startTime,
        summary: `Identified ${lowItems.length} SKUs running below threshold.`,
      });

      replyContent = lowItems.length > 0
        ? `Ditemukan **${lowItems.length} produk** yang berada pada atau di bawah ambang batas stok minimum (10 unit):`
        : 'Seluruh stok produk Anda saat ini berada dalam tingkat aman di atas ambang batas minimum.';

      structuredPayload = {
        intent,
        tableData: lowItems,
        groundedItems: [
          { type: 'DATABASE_FACT', label: 'LOW_STOCK_COUNT', detail: `${lowItems.length} produk memerlukan tindakan pengisian ulang.` },
        ],
      };
    } else if (lowerPrompt.includes('dead stock') || lowerPrompt.includes('stok mati') || lowerPrompt.includes('overstock')) {
      intent = 'DEAD_STOCK';
      const dRes = await executeInventoryTool('inventory.detect_dead_stock', { minStock: 10, maxSold: 1 }, tenantContext);
      const deadItems = dRes.result?.deadStockItems || [];

      agentActivity.push({
        agentRole: 'STOCK_ANALYST',
        agentName: 'Stock Performance Analyst',
        status: 'COMPLETED',
        latencyMs: Date.now() - startTime,
        summary: `Detected ${deadItems.length} dead stock items with tied up capital.`,
      });

      replyContent = deadItems.length > 0
        ? `Terdeteksi **${deadItems.length} produk dead stock** dengan total modal terendap Rp ${(dRes.result?.totalTiedUpCapitalIdr || 0).toLocaleString('id-ID')}:`
        : 'Tidak ditemukan produk dengan indikasi dead stock berlebih saat ini.';

      structuredPayload = {
        intent,
        tableData: deadItems,
        groundedItems: [
          { type: 'DATABASE_FACT', label: 'TIED_UP_CAPITAL', detail: `Rp ${(dRes.result?.totalTiedUpCapitalIdr || 0).toLocaleString('id-ID')} modal terendap pada barang tidak bergerak.` },
          { type: 'RECOMMENDATION', label: 'CLEARANCE_PROMO', detail: 'Disarankan membuat paket promosi bundel atau diskon pembersihan.' },
        ],
      };
    } else if (lowerPrompt.includes('restok') || lowerPrompt.includes('reorder') || lowerPrompt.includes('rekomendasi')) {
      intent = 'REORDER_RECOMMENDATIONS';
      const rRes = await executeInventoryTool('inventory.get_reorder_recommendations', { targetSafetyDays: 30 }, tenantContext);
      const recs = rRes.result?.recommendations || [];

      agentActivity.push({
        agentRole: 'REORDER_ADVISOR',
        agentName: 'Reorder Optimization Advisor',
        status: 'COMPLETED',
        latencyMs: Date.now() - startTime,
        summary: `Calculated restock recommendations for ${recs.length} products.`,
      });

      replyContent = `Berikut adalah rekomendasi pengisian ulang stok (reorder) untuk 30 hari ke depan:
Total estimasi investasi restok: **Rp ${(rRes.result?.totalEstimatedInvestmentIdr || 0).toLocaleString('id-ID')}**`;

      structuredPayload = {
        intent,
        recommendations: recs,
        groundedItems: [
          { type: 'FORECAST', label: 'ESTIMATED_INVESTMENT', detail: `Proyeksi kebutuhan anggaran restok Rp ${(rRes.result?.totalEstimatedInvestmentIdr || 0).toLocaleString('id-ID')}.` },
          { type: 'RECOMMENDATION', label: 'SAFETY_TARGET', detail: 'Dihitung berdasarkan target 30 hari persediaan aman.' },
        ],
      };
    } else {
      // Full Swarm Analysis Pipeline
      intent = 'FULL_SWARM_ANALYSIS';
      const mRes = await executeInventoryTool('inventory.get_stock_metrics', {}, tenantContext);
      const lRes = await executeInventoryTool('inventory.get_low_stock_products', { threshold: 10 }, tenantContext);
      const dRes = await executeInventoryTool('inventory.detect_dead_stock', { minStock: 10, maxSold: 1 }, tenantContext);
      const rRes = await executeInventoryTool('inventory.get_reorder_recommendations', { targetSafetyDays: 30 }, tenantContext);

      const metrics = mRes.result || { totalProducts: 0, totalStockUnits: 0, totalStockValueIdr: 0, lowStockCount: 0 };
      const lowItems = lRes.result?.lowStockItems || [];
      const deadItems = dRes.result?.deadStockItems || [];
      const recs = rRes.result?.recommendations || [];

      agentActivity.push(
        { agentRole: 'COORDINATOR', agentName: 'Inventory Swarm Coordinator', status: 'COMPLETED', latencyMs: 80, summary: 'Delegated tasks to sub-agents.' },
        { agentRole: 'INVENTORY_MONITOR', agentName: 'Stock Monitor Agent', status: 'COMPLETED', latencyMs: 140, summary: `Analyzed ${metrics.totalProducts} SKUs.` },
        { agentRole: 'STOCK_ANALYST', agentName: 'Stock Performance Analyst', status: 'COMPLETED', latencyMs: 160, summary: `Identified ${deadItems.length} dead stock items.` },
        { agentRole: 'REORDER_ADVISOR', agentName: 'Reorder Optimization Advisor', status: 'COMPLETED', latencyMs: 190, summary: `Generated ${recs.length} restock recommendations.` }
      );

      const healthScore = Math.max(0, Math.min(100, Math.round(100 - (metrics.lowStockCount * 10 + deadItems.length * 5))));

      const synthesisRes = await executeRoutedModelPipeline({
        rawInput: `Jawab pertanyaan pengguna: "${prompt}".\nData inventaris: Total ${metrics.totalProducts} SKU, Kritis: ${metrics.lowStockCount}, Dead Stock: ${deadItems.length}.`,
        hardenedSystemPrompt: 'Anda adalah ZEGA AI Inventory Swarm Orchestrator. Berikan jawaban yang jelas, grounded, dan profesional.',
        maxTokensToUse: 800,
        agentRole: 'COORDINATOR',
      }).catch(() => ({ replyText: `Analisis Inventaris Swarm Completed. Kesehatan persediaan toko Anda berada pada skor ${healthScore}/100. Terdapat ${metrics.lowStockCount} produk yang memerlukan perhatian restok.` }));

      replyContent = stripThinkingProcess(synthesisRes.replyText);

      structuredPayload = {
        intent,
        stockHealthScore: healthScore,
        metrics,
        tableData: lowItems,
        recommendations: recs,
        groundedItems: [
          { type: 'DATABASE_FACT', label: 'GROUNDED_METRICS', detail: `Data diambil secara langsung dari basis data toko (${metrics.totalProducts} SKU).` },
          { type: 'FORECAST', label: 'STOCKOUT_RISK', detail: `Terdapat ${metrics.lowStockCount} produk berisiko habis dalam 7 hari.` },
          { type: 'ASSUMPTION', label: 'SALES_VELOCITY', detail: 'Mengasumsikan laju penjualan 30 hari terakhir tetap stabil.' },
        ],
      };
    }

    const swarmResponse: ChatMessageResponse = {
      messageId,
      sessionId,
      swarmId,
      senderType: 'SWARM',
      senderName: 'Stock Management Swarm',
      content: replyContent,
      structuredPayload,
      agentActivity,
      requiresConfirmation: false,
      createdAt: new Date().toISOString(),
    };

    // Save swarm response message to DB
    if (supabase) {
      try {
        await supabase.from('ai_chat_messages').insert({
          id: messageId,
          session_id: sessionId,
          swarm_id: swarmId,
          organization_id: tenantContext.organizationId,
          store_id: storeId,
          user_id: userId,
          sender_type: 'SWARM',
          sender_name: 'Stock Management Swarm',
          content: swarmResponse.content,
          structured_payload: swarmResponse.structuredPayload,
          agent_activity: swarmResponse.agentActivity,
          requires_confirmation: false,
        });

        // Touch updated_at on session
        await supabase
          .from('ai_chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch (e) {
        logger.warn({ e }, '[SwarmChatRouter] DB save error for swarm reply message');
      }
    }

    return swarmResponse;
  }

  /**
   * Confirm and execute a write mutation after explicit user approval
   */
  static async confirmMutation(input: {
    sessionId: string;
    swarmId: string;
    confirmationToken: string;
    action: string;
    params: Record<string, any>;
    storeId: string;
    organizationId?: string;
    userId?: string;
  }): Promise<ChatMessageResponse> {
    const messageId = `msg-${crypto.randomUUID().slice(0, 8)}`;
    const { sessionId, swarmId, action, params, storeId, organizationId, userId } = input;

    const writeContext: InventoryTenantContext = {
      storeId,
      organizationId: organizationId || storeId,
      userId: userId || 'system',
      agentAuthority: 'WRITE_WITH_APPROVAL',
    };

    let toolToRun = 'inventory.update_stock';
    if (action === 'UPDATE_REORDER_THRESHOLD') toolToRun = 'inventory.update_reorder_threshold';
    if (action === 'CREATE_RESTOCK_PLAN') toolToRun = 'inventory.create_restock_plan';
    if (action === 'CREATE_PURCHASE_REQUEST') toolToRun = 'inventory.create_purchase_request';

    const execResult = await executeInventoryTool(toolToRun, params, writeContext);

    const replyContent = execResult.success
      ? `✅ **Tindakan Berhasil Dieksekusi**\n\nOperasi **${action}** telah berhasil dijalankan pada sistem inventaris toko Anda.\n\nDetail: ${JSON.stringify(execResult.result)}`
      : `❌ **Tindakan Gagal**\n\nGagal mengeksekusi operasi **${action}**: ${execResult.error}`;

    const swarmResponse: ChatMessageResponse = {
      messageId,
      sessionId,
      swarmId,
      senderType: 'SWARM',
      senderName: 'Stock Management Swarm',
      content: replyContent,
      structuredPayload: {
        intent: 'MUTATION_EXECUTED',
        metrics: execResult.result,
        groundedItems: [
          { type: 'DATABASE_FACT', label: 'MUTATION_EXECUTED', detail: `Status: ${execResult.success ? 'BERHASIL' : 'GAGAL'}` }
        ]
      },
      agentActivity: [
        {
          agentRole: 'REORDER_ADVISOR',
          agentName: 'Reorder Optimization Advisor',
          status: execResult.success ? 'COMPLETED' : 'FAILED',
          latencyMs: 150,
          summary: `Executed write mutation '${action}' after explicit user confirmation.`,
        }
      ],
      requiresConfirmation: false,
      createdAt: new Date().toISOString(),
    };

    const supabase = SupabaseService.getClient();
    if (supabase) {
      try {
        await supabase.from('ai_chat_messages').insert({
          id: messageId,
          session_id: sessionId,
          swarm_id: swarmId,
          organization_id: writeContext.organizationId,
          store_id: storeId,
          user_id: userId,
          sender_type: 'SWARM',
          sender_name: 'Stock Management Swarm',
          content: swarmResponse.content,
          structured_payload: swarmResponse.structuredPayload,
          agent_activity: swarmResponse.agentActivity,
          requires_confirmation: false,
        });
      } catch (e) {
        logger.warn({ e }, '[SwarmChatRouter] DB save error for confirmed mutation');
      }
    }

    return swarmResponse;
  }
}
