/**
 * ZEGA AI — Inventory Swarm Multi-Agent Orchestrator
 *
 * Coordinates specialized agents (Coordinator, Inventory Monitor, Demand Forecaster,
 * Stock Analyst, Reorder Advisor, Inventory Reporter) to execute inventory intelligence
 * tasks safely within tenant boundaries.
 */

import { executeInventoryTool, InventoryTenantContext } from './inventoryTools.js';
import { executeRoutedModelPipeline, stripThinkingProcess } from '../aiRouterService.js';
import { SupabaseService } from '../supabaseService.js';
import { logger } from '../../utils/logger.js';

export interface SwarmAgentConfig {
  id?: string;
  role: 'COORDINATOR' | 'INVENTORY_MONITOR' | 'DEMAND_FORECASTER' | 'STOCK_ANALYST' | 'REORDER_ADVISOR' | 'INVENTORY_REPORTER';
  name: string;
  modelId: string;
  systemPrompt?: string;
  authorityLevel: 'READ_ONLY' | 'WRITE_WITH_APPROVAL' | 'FULL_AUTONOMOUS';
  skills: string[];
}

export interface SwarmExecutionInput {
  swarmId?: string;
  storeId: string;
  organizationId?: string;
  userId?: string;
  prompt: string;
  triggerType?: 'MANUAL' | 'SCHEDULED' | 'EVENT_LOW_STOCK' | 'CHAT_PROMPT';
  customAgents?: SwarmAgentConfig[];
}

export interface SwarmExecutionStepRecord {
  stepNumber: number;
  agentRole: string;
  agentName: string;
  actionType: 'TOOL_CALL' | 'DELEGATION' | 'REASONING' | 'SYNTHESIS';
  toolName?: string;
  input?: any;
  output?: any;
  latencyMs: number;
  status: 'COMPLETED' | 'FAILED';
}

export interface SwarmExecutionOutput {
  executionId: string;
  swarmId: string;
  storeId: string;
  status: 'COMPLETED' | 'FAILED';
  prompt: string;
  summary: string;
  executiveReport: {
    stockHealthScore: number; // 0-100
    metrics: {
      totalProducts: number;
      totalStockUnits: number;
      totalStockValueIdr: number;
      lowStockCount: number;
      outOfStockCount: number;
      deadStockCount: number;
    };
    criticalLowStock: Array<{ name: string; sku: string; stock: number; suggestedReorder: number }>;
    deadStockItems: Array<{ name: string; stock: number; tiedUpCapitalIdr: number }>;
    reorderRecommendations: Array<{ name: string; currentStock: number; suggestedReorderQty: number; estimatedInvestmentIdr: number; priority: string }>;
    demandForecastSummary: Array<{ name: string; currentStock: number; daysUntilStockout: number; stockoutRisk: string }>;
    actionPlan: string[];
  };
  steps: SwarmExecutionStepRecord[];
  totalSteps: number;
  creditsUsed: number;
  latencyMs: number;
  completedAt: string;
}

const DEFAULT_SWARM_WORKFORCE: SwarmAgentConfig[] = [
  {
    role: 'COORDINATOR',
    name: 'Inventory Swarm Coordinator',
    modelId: 'groq/compound',
    authorityLevel: 'READ_ONLY',
    skills: ['inventory.report'],
  },
  {
    role: 'INVENTORY_MONITOR',
    name: 'Stock Monitor Agent',
    modelId: 'gemini-3.6-flash',
    authorityLevel: 'READ_ONLY',
    skills: ['inventory.read', 'inventory.monitor', 'inventory.detect_low_stock'],
  },
  {
    role: 'DEMAND_FORECASTER',
    name: 'Demand Forecaster Agent',
    modelId: 'deepseek/deepseek-r1',
    authorityLevel: 'READ_ONLY',
    skills: ['inventory.forecast'],
  },
  {
    role: 'STOCK_ANALYST',
    name: 'Stock Performance Analyst',
    modelId: 'openai/gpt-oss-120b',
    authorityLevel: 'READ_ONLY',
    skills: ['inventory.analyze', 'inventory.detect_dead_stock', 'inventory.detect_fast_moving'],
  },
  {
    role: 'REORDER_ADVISOR',
    name: 'Reorder Optimization Advisor',
    modelId: 'qwen/qwen3.6-27b',
    authorityLevel: 'READ_ONLY',
    skills: ['inventory.reorder_recommendation'],
  },
  {
    role: 'INVENTORY_REPORTER',
    name: 'Inventory Intelligence Reporter',
    modelId: 'groq/compound-mini',
    authorityLevel: 'READ_ONLY',
    skills: ['inventory.report'],
  },
];

export class InventorySwarmOrchestrator {
  private context?: InventoryTenantContext;

  constructor(context?: InventoryTenantContext) {
    this.context = context;
  }

  async runSwarmPipeline(input: SwarmExecutionInput): Promise<SwarmExecutionOutput> {
    const storeId = input.storeId || this.context?.storeId || '';
    const organizationId = input.organizationId || this.context?.organizationId || storeId;
    const userId = input.userId || this.context?.userId || 'system';

    return InventorySwarmOrchestrator.executeSwarm({
      ...input,
      storeId,
      organizationId,
      userId,
    });
  }

  /**
   * Execute an inventory swarm run
   */
  static async executeSwarm(input: SwarmExecutionInput): Promise<SwarmExecutionOutput> {
    const startTime = Date.now();
    const executionId = `exec-${crypto.randomUUID().slice(0, 8)}`;
    const swarmId = input.swarmId || `swarm-${crypto.randomUUID().slice(0, 8)}`;
    const storeId = input.storeId;
    const orgId = input.organizationId || storeId;
    const userId = input.userId || 'system';

    const tenantContext: InventoryTenantContext = {
      storeId,
      organizationId: orgId,
      userId,
      agentAuthority: 'READ_ONLY',
    };

    const steps: SwarmExecutionStepRecord[] = [];
    const supabase = SupabaseService.getClient();

    // 1. Create execution record in DB
    if (supabase) {
      try {
        await supabase.from('ai_swarm_executions').insert({
          id: executionId,
          swarm_id: swarmId,
          organization_id: orgId,
          store_id: storeId,
          user_id: userId,
          trigger_type: input.triggerType || 'MANUAL',
          prompt: input.prompt,
          status: 'RUNNING',
          started_at: new Date().toISOString(),
        });
      } catch (e) {
        logger.warn({ e }, '[InventorySwarm] Failed to create initial execution record in DB');
      }
    }

    // 2. Resolve Swarm Workforce (Default or DB persisted)
    let workforce = input.customAgents && input.customAgents.length > 0 ? input.customAgents : DEFAULT_SWARM_WORKFORCE;

    if (supabase && input.swarmId) {
      try {
        const { data: dbAgents } = await supabase
          .from('ai_swarm_agents')
          .select('id, role, name, model_id, authority_level')
          .eq('swarm_id', input.swarmId);

        if (dbAgents && dbAgents.length > 0) {
          workforce = dbAgents.map((a: any) => ({
            id: a.id,
            role: a.role as any,
            name: a.name,
            modelId: a.model_id || 'groq/compound',
            authorityLevel: a.authority_level as any,
            skills: [],
          }));
        }
      } catch (e) {
        logger.warn({ e }, '[InventorySwarm] Failed to fetch swarm agents from DB');
      }
    }

    // ── GUARDRAIL 1: Max 5 agents per run ──
    const activeWorkforce = workforce.slice(0, 5);

    // ── STEP 1: COORDINATOR Initial Planning ──
    const coordinatorAgent = activeWorkforce.find(a => a.role === 'COORDINATOR') || DEFAULT_SWARM_WORKFORCE[0];
    const step1Start = Date.now();
    const planningPrompt = `Anda adalah Coordinator AI Swarm Inventaris ZEGA. Tugas Anda: Menganalisis permintaan pengguna: "${input.prompt}". Tentukan strategi delegasi ke sub-agen inventaris.`;

    const planningRes = await executeRoutedModelPipeline({
      rawInput: planningPrompt,
      hardenedSystemPrompt: 'Anda adalah Coordinator Swarm Inventaris. Berikan rencana eksekusi singkat dalam 2 kalimat.',
      maxTokensToUse: 500,
      agentRole: coordinatorAgent.role,
    }).catch(() => ({ replyText: 'Delegating inventory monitoring, demand forecasting, stock analysis, and reorder advice.' }));

    const step1: SwarmExecutionStepRecord = {
      stepNumber: 1,
      agentRole: coordinatorAgent.role,
      agentName: coordinatorAgent.name,
      actionType: 'DELEGATION',
      input: { prompt: input.prompt },
      output: { strategy: stripThinkingProcess(planningRes.replyText) },
      latencyMs: Date.now() - step1Start,
      status: 'COMPLETED',
    };
    steps.push(step1);

    // ── STEP 2: INVENTORY_MONITOR — Get Stock Metrics & Low Stock ──
    const monitorAgent = activeWorkforce.find(a => a.role === 'INVENTORY_MONITOR') || DEFAULT_SWARM_WORKFORCE[1];
    const step2Start = Date.now();

    const metricsRes = await executeInventoryTool('inventory.get_stock_metrics', {}, tenantContext);
    const lowStockRes = await executeInventoryTool('inventory.get_low_stock_products', { threshold: 10 }, tenantContext);

    const step2: SwarmExecutionStepRecord = {
      stepNumber: 2,
      agentRole: monitorAgent.role,
      agentName: monitorAgent.name,
      actionType: 'TOOL_CALL',
      toolName: 'inventory.get_stock_metrics & inventory.get_low_stock_products',
      input: { threshold: 10 },
      output: { metrics: metricsRes.result, lowStock: lowStockRes.result },
      latencyMs: Date.now() - step2Start,
      status: metricsRes.success ? 'COMPLETED' : 'FAILED',
    };
    steps.push(step2);

    // ── STEP 3: STOCK_ANALYST — Detect Dead Stock & Sales Velocity ──
    const analystAgent = activeWorkforce.find(a => a.role === 'STOCK_ANALYST') || DEFAULT_SWARM_WORKFORCE[3];
    const step3Start = Date.now();

    const deadStockRes = await executeInventoryTool('inventory.detect_dead_stock', { minStock: 5, maxSold: 1 }, tenantContext);
    const velocityRes = await executeInventoryTool('inventory.get_sales_velocity', { fastThreshold: 20, slowThreshold: 5 }, tenantContext);

    const step3: SwarmExecutionStepRecord = {
      stepNumber: 3,
      agentRole: analystAgent.role,
      agentName: analystAgent.name,
      actionType: 'TOOL_CALL',
      toolName: 'inventory.detect_dead_stock & inventory.get_sales_velocity',
      input: { minStock: 5, maxSold: 1 },
      output: { deadStock: deadStockRes.result, velocity: velocityRes.result },
      latencyMs: Date.now() - step3Start,
      status: deadStockRes.success ? 'COMPLETED' : 'FAILED',
    };
    steps.push(step3);

    // ── STEP 4: DEMAND_FORECASTER — Forecast Stockouts ──
    const forecasterAgent = activeWorkforce.find(a => a.role === 'DEMAND_FORECASTER') || DEFAULT_SWARM_WORKFORCE[2];
    const step4Start = Date.now();

    const forecastRes = await executeInventoryTool('inventory.forecast_demand', { daysAhead: 30 }, tenantContext);

    const step4: SwarmExecutionStepRecord = {
      stepNumber: 4,
      agentRole: forecasterAgent.role,
      agentName: forecasterAgent.name,
      actionType: 'TOOL_CALL',
      toolName: 'inventory.forecast_demand',
      input: { daysAhead: 30 },
      output: { forecast: forecastRes.result },
      latencyMs: Date.now() - step4Start,
      status: forecastRes.success ? 'COMPLETED' : 'FAILED',
    };
    steps.push(step4);

    // ── STEP 5: REORDER_ADVISOR — Calculate Reorder Recommendations ──
    const advisorAgent = activeWorkforce.find(a => a.role === 'REORDER_ADVISOR') || DEFAULT_SWARM_WORKFORCE[4];
    const step5Start = Date.now();

    const reorderRes = await executeInventoryTool('inventory.get_reorder_recommendations', { targetSafetyDays: 30 }, tenantContext);

    const step5: SwarmExecutionStepRecord = {
      stepNumber: 5,
      agentRole: advisorAgent.role,
      agentName: advisorAgent.name,
      actionType: 'TOOL_CALL',
      toolName: 'inventory.get_reorder_recommendations',
      input: { targetSafetyDays: 30 },
      output: { reorder: reorderRes.result },
      latencyMs: Date.now() - step5Start,
      status: reorderRes.success ? 'COMPLETED' : 'FAILED',
    };
    steps.push(step5);

    // ── STEP 6: COORDINATOR & INVENTORY_REPORTER Synthesis ──
    const reporterAgent = activeWorkforce.find(a => a.role === 'INVENTORY_REPORTER') || DEFAULT_SWARM_WORKFORCE[5];
    const step6Start = Date.now();

    const metricsData = metricsRes.result || { totalProducts: 0, totalStockUnits: 0, totalStockValueIdr: 0, lowStockCount: 0, outOfStockCount: 0 };
    const lowStockItems = lowStockRes.result?.lowStockItems || [];
    const deadStockItems = deadStockRes.result?.deadStockItems || [];
    const reorderRecs = reorderRes.result?.recommendations || [];
    const forecastItems = forecastRes.result?.forecast || [];

    // Calculate Stock Health Score (0 to 100)
    const totalProd = metricsData.totalProducts || 1;
    const lowStockPen = (metricsData.lowStockCount || 0) * 10;
    const outStockPen = (metricsData.outOfStockCount || 0) * 20;
    const deadStockPen = (deadStockRes.result?.deadStockCount || 0) * 5;
    const stockHealthScore = Math.max(0, Math.min(100, Math.round(100 - (lowStockPen + outStockPen + deadStockPen))));

    const synthesisPrompt = `
Syntesis laporan inventaris ZEGA AI:
- Total Produk: ${metricsData.totalProducts} SKU, Total Stok: ${metricsData.totalStockUnits} unit
- Nilai Inventaris: Rp ${metricsData.totalStockValueIdr?.toLocaleString('id-ID')}
- Stok Menipis/Habis: ${metricsData.lowStockCount} SKU Kritis
- Stok Mati (Dead Stock): ${deadStockRes.result?.deadStockCount || 0} SKU
- Rekomendasi Restok: ${reorderRecs.length} SKU

Susun ringkasan eksekutif 3 paragraf singkat dengan bahasa Indonesia yang jelas, profesional, dan actionable untuk pemilik toko UMKM.`;

    const synthesisRes = await executeRoutedModelPipeline({
      rawInput: synthesisPrompt,
      hardenedSystemPrompt: 'Anda adalah ZEGA AI Inventory Intelligence Analyst. Berikan ringkasan eksekutif yang bernilai bisnis tinggi.',
      maxTokensToUse: 1000,
      agentRole: reporterAgent.role,
    }).catch(() => ({
      replyText: `Hasil Analisis Inventaris Toko:
Kesehatan stok saat ini berada pada skor ${stockHealthScore}/100. Ditemukan ${metricsData.lowStockCount} produk kritis yang memerlukan pengisian ulang stok segera untuk mencegah potensi kehilangan penjualan.
Sebanyak ${deadStockRes.result?.deadStockCount || 0} produk teridentifikasi sebagai dead stock dengan nilai modal terendap Rp ${(deadStockRes.result?.totalTiedUpCapitalIdr || 0).toLocaleString('id-ID')}. Disarankan untuk melakukan program promosi bundel atau diskon pembersihan stok.
Disarankan segera memprioritaskan re-order pada ${reorderRecs.length} item utama dengan perkiraan estimasi investasi Rp ${(reorderRes.result?.totalEstimatedInvestmentIdr || 0).toLocaleString('id-ID')}.`
    }));

    const summaryText = stripThinkingProcess(synthesisRes.replyText);

    const step6: SwarmExecutionStepRecord = {
      stepNumber: 6,
      agentRole: reporterAgent.role,
      agentName: reporterAgent.name,
      actionType: 'SYNTHESIS',
      input: { synthesisPrompt },
      output: { summary: summaryText, stockHealthScore },
      latencyMs: Date.now() - step6Start,
      status: 'COMPLETED',
    };
    steps.push(step6);

    const totalLatency = Date.now() - startTime;
    const creditsUsed = 0.0500; // Estimated swarm execution credit cost

    // 3. Assemble Output Structure
    const output: SwarmExecutionOutput = {
      executionId,
      swarmId,
      storeId,
      status: 'COMPLETED',
      prompt: input.prompt,
      summary: summaryText,
      executiveReport: {
        stockHealthScore,
        metrics: {
          totalProducts: metricsData.totalProducts || 0,
          totalStockUnits: metricsData.totalStockUnits || 0,
          totalStockValueIdr: metricsData.totalStockValueIdr || 0,
          lowStockCount: metricsData.lowStockCount || 0,
          outOfStockCount: metricsData.outOfStockCount || 0,
          deadStockCount: deadStockRes.result?.deadStockCount || 0,
        },
        criticalLowStock: lowStockItems,
        deadStockItems,
        reorderRecommendations: reorderRecs,
        demandForecastSummary: forecastItems.slice(0, 10),
        actionPlan: [
          lowStockItems.length > 0 ? `Segera buat pesanan ulang (re-order) untuk ${lowStockItems.length} produk berkategori KRITIS.` : 'Stok produk utama dalam keadaan aman.',
          deadStockItems.length > 0 ? `Buat program promosi bundel untuk membebaskan modal terendap sebesar Rp ${(deadStockRes.result?.totalTiedUpCapitalIdr || 0).toLocaleString('id-ID')}.` : 'Tidak ditemukan penumpukan dead stock signifikan.',
          `Persiapkan anggaran restok berkala sebesar Rp ${(reorderRes.result?.totalEstimatedInvestmentIdr || 0).toLocaleString('id-ID')} untuk 30 hari ke depan.`,
        ],
      },
      steps,
      totalSteps: steps.length,
      creditsUsed,
      latencyMs: totalLatency,
      completedAt: new Date().toISOString(),
    };

    // 4. Persist execution output & steps to DB
    if (supabase) {
      try {
        await supabase
          .from('ai_swarm_executions')
          .update({
            status: 'COMPLETED',
            output: output.executiveReport,
            summary: output.summary,
            total_steps: output.totalSteps,
            credits_used: output.creditsUsed,
            latency_ms: output.latencyMs,
            completed_at: output.completedAt,
          })
          .eq('id', executionId);

        // Persist individual execution steps
        for (const step of steps) {
          await supabase.from('ai_swarm_execution_steps').insert({
            execution_id: executionId,
            agent_role: step.agentRole,
            agent_name: step.agentName,
            step_number: step.stepNumber,
            action_type: step.actionType,
            tool_name: step.toolName || null,
            input: step.input || null,
            output: step.output || null,
            status: step.status,
            latency_ms: step.latencyMs,
          });
        }
      } catch (e) {
        logger.error({ e, executionId }, '[InventorySwarm] Failed to persist execution steps to DB');
      }
    }

    return output;
  }
}
