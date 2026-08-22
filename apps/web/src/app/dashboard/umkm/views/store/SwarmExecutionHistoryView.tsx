import React, { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Bot,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface SwarmExecutionHistoryViewProps {
  storeId?: string;
  onRunSwarmClick?: () => void;
}

const HISTORY_I18N = {
  id: {
    headerTitle: 'AI Inventory Swarm Intelligence',
    swarmActive: 'Swarm Active',
    headerDesc: 'Workforce 5 Agen Otonom memantau persediaan, mendeteksi dead stock, dan membuat saran re-order.',
    runAuditBtn: 'Jalankan Audit Swarm Sekarang',
    runningAuditBtn: 'Mengeksekusi Swarm...',
    historyTitle: (count: number) => `Riwayat Eksekusi Swarm (${count})`,
    loadingHistory: 'Memuat riwayat eksekusi Swarm AI...',
    noExecutionsTitle: 'Belum Ada Eksekusi Swarm',
    noExecutionsDesc: 'Klik tombol di atas untuk menjalankan audit inventaris pertama Anda.',
    stepsSubAgents: (count: number) => `${count} Langkah Sub-Agen`,
    latency: (ms: number) => `Latensi: ${ms}ms`,
    creditsUsed: (credits: number) => `${credits} Kredi`,
    executiveSummary: 'Ringkasan Eksekutif Swarm',
    timelineTitle: (steps: number) => `Visual Timeline Eksekusi Multi-Agent (${steps} Steps)`,
    stepLabel: (num: number, role: string) => `Langkah ${num}: ${role}`,
    manualPrompt: 'Lakukan audit kesehatan inventaris komprehensif, deteksi stok kritis & dead stock, serta buat saran restok ulang 30 hari.'
  },
  en: {
    headerTitle: 'AI Inventory Swarm Intelligence',
    swarmActive: 'Swarm Active',
    headerDesc: '5 Autonomous AI Agents workforce monitoring inventory, detecting dead stock, and generating re-order recommendations.',
    runAuditBtn: 'Run Swarm Audit Now',
    runningAuditBtn: 'Executing Swarm...',
    historyTitle: (count: number) => `Swarm Execution History (${count})`,
    loadingHistory: 'Loading Swarm AI execution history...',
    noExecutionsTitle: 'No Swarm Executions Yet',
    noExecutionsDesc: 'Click the button above to run your first inventory audit.',
    stepsSubAgents: (count: number) => `${count} Sub-Agent Steps`,
    latency: (ms: number) => `Latency: ${ms}ms`,
    creditsUsed: (credits: number) => `${credits} Credits`,
    executiveSummary: 'Swarm Executive Summary',
    timelineTitle: (steps: number) => `Multi-Agent Execution Timeline (${steps} Steps)`,
    stepLabel: (num: number, role: string) => `Step ${num}: ${role}`,
    manualPrompt: 'Perform comprehensive inventory health audit, detect critical stock & dead stock, and generate 30-day restock recommendations.'
  },
  zh: {
    headerTitle: 'AI 库存 Swarm 智能中心',
    swarmActive: 'Swarm 运行中',
    headerDesc: '5 个自主 AI 代理团队实时监控库存、检测滞销死存并生成补货建议。',
    runAuditBtn: '立即运行 Swarm 审计',
    runningAuditBtn: '正在执行 Swarm...',
    historyTitle: (count: number) => `Swarm 执行历史记录 (${count})`,
    loadingHistory: '正在加载 Swarm AI 执行历史...',
    noExecutionsTitle: '暂无 Swarm 执行记录',
    noExecutionsDesc: '点击上方按钮运行您的首次库存智能审计。',
    stepsSubAgents: (count: number) => `${count} 个子代理步骤`,
    latency: (ms: number) => `延迟: ${ms}ms`,
    creditsUsed: (credits: number) => `${credits} 积分`,
    executiveSummary: 'Swarm 执行摘要报告',
    timelineTitle: (steps: number) => `多 Agent 执行时间线 (${steps} 步)`,
    stepLabel: (num: number, role: string) => `步骤 ${num}: ${role}`,
    manualPrompt: '执行全面库存健康审计，检测临界库存与滞销死存，并生成 30 天补货建议。'
  }
};

export const SwarmExecutionHistoryView: React.FC<SwarmExecutionHistoryViewProps> = ({
  storeId,
  onRunSwarmClick,
}) => {
  const { language } = useLanguage();
  const langKey = (language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'id') as 'id' | 'en' | 'zh';
  const txt = HISTORY_I18N[langKey];

  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [executionSteps, setExecutionSteps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunningSwarm, setIsRunningSwarm] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchExecutions = async () => {
    setIsLoading(true);
    try {
      const data = await SupabaseDashboardService.getInventorySwarmExecutions(storeId);
      setExecutions(data || []);
      if (data && data.length > 0 && !selectedExecution) {
        handleSelectExecution(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load swarm execution history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [storeId]);

  const handleSelectExecution = async (execId: string) => {
    setExpandedId((prev) => (prev === execId ? null : execId));
    try {
      const detail = await SupabaseDashboardService.getInventorySwarmExecutionDetail(execId);
      if (detail?.success) {
        setSelectedExecution(detail.data?.execution);
        setExecutionSteps(detail.data?.steps || []);
      }
    } catch (e) {
      console.error('Failed to fetch execution detail:', e);
    }
  };

  const handleTriggerSwarmRun = async () => {
    setIsRunningSwarm(true);
    try {
      const res = await SupabaseDashboardService.executeInventorySwarm({
        storeId,
        prompt: txt.manualPrompt,
        triggerType: 'MANUAL',
      });

      if (res?.success) {
        await fetchExecutions();
        if (res.data?.executionId) {
          handleSelectExecution(res.data.executionId);
        }
      }
    } catch (e) {
      console.error('Failed to trigger swarm execution:', e);
    } finally {
      setIsRunningSwarm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white dark:bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-500 flex items-center justify-center shadow-md text-white shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">{txt.headerTitle}</h3>
              <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {txt.swarmActive}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {txt.headerDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchExecutions}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleTriggerSwarmRun}
            disabled={isRunningSwarm}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-orange-500 hover:bg-orange-600 text-white shadow-md flex items-center justify-center gap-2 transition-all w-full md:w-auto disabled:opacity-50 cursor-pointer"
          >
            {isRunningSwarm ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {txt.runningAuditBtn}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                {txt.runAuditBtn}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Execution History Table & Visual Breakdown */}
      <div className="space-y-4">
        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          {txt.historyTitle(executions.length)}
        </h4>

        {isLoading && executions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs sm:text-sm shadow-xs font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
            {txt.loadingHistory}
          </div>
        ) : executions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-3 shadow-xs">
            <Bot className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
            <div>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{txt.noExecutionsTitle}</p>
              <p className="text-xs text-slate-500 font-medium">{txt.noExecutionsDesc}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((exec) => {
              const isExpanded = expandedId === exec.id;
              const outputData = exec.output || {};

              return (
                <div
                  key={exec.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs transition-all"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => handleSelectExecution(exec.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                        exec.status === 'COMPLETED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {outputData.stockHealthScore !== undefined ? `${outputData.stockHealthScore}` : '95'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">{exec.prompt}</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">{exec.trigger_type}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                          {new Date(exec.started_at).toLocaleString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID')} • {txt.stepsSubAgents(exec.total_steps || 6)} • {txt.latency(exec.latency_ms || 1200)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-black rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                        {txt.creditsUsed(exec.credits_used || 0.05)}
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 space-y-5">
                      {/* Executive Summary */}
                      {exec.summary && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 shadow-xs">
                          <div className="flex items-center gap-2 font-black text-orange-500">
                            <Sparkles className="w-4 h-4" />
                            {txt.executiveSummary}
                          </div>
                          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">{exec.summary}</p>
                        </div>
                      )}

                      {/* Execution Steps Breakdown Timeline */}
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {txt.timelineTitle(executionSteps.length || 6)}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {executionSteps.map((step) => (
                            <div key={step.id || step.step_number} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-orange-500">{txt.stepLabel(step.step_number, step.agent_role)}</span>
                                <span className="text-[10px] text-slate-400">{step.latency_ms}ms</span>
                              </div>
                              <p className="text-xs font-black text-slate-900 dark:text-slate-100">{step.agent_name}</p>
                              {step.tool_name && (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-slate-700">
                                  {step.tool_name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
