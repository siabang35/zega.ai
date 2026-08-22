import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Play, Pause, Trash2, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Activity, Zap, Shield,
  Users, TrendingUp, BarChart2, Settings, MessageSquare
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { SwarmExecutionHistoryView } from './SwarmExecutionHistoryView';
import { SwarmChatView } from './SwarmChatView';
import { useLanguage } from '../../../../../i18n/translations';

interface SwarmDashboardViewProps {
  storeId?: string;
  triggerToast: (msg: string) => void;
  onDeployNew?: () => void;
}

const DASHBOARD_I18N = {
  id: {
    backToDashboard: '← Kembali ke Swarm Dashboard',
    loadingDashboard: 'Memuat AI Swarm Dashboard...',
    noSwarmTitle: 'Belum Ada AI Swarm Terdeploy',
    noSwarmDesc: 'Deploy AI Inventory Swarm untuk mengaktifkan agen-agen AI otonom yang akan memantau stok, menganalisis penjualan, dan memberikan rekomendasi restok otomatis.',
    deployNowBtn: 'Deploy AI Swarm Sekarang',
    dashboardTitle: 'AI Inventory Swarm Dashboard',
    activeCount: (count: number) => `${count} Aktif`,
    dashboardSubtitle: 'Multi-agent workforce untuk inventaris & analisis stok otonom',
    execHistoryBtn: 'Execution History',
    deployNewBtn: '+ Deploy Baru',
    agentsCount: (count: number) => `${count} Agen`,
    tenantIsolated: 'Tenant-Isolated',
    runNowBtn: 'Run Now',
    runningBtn: 'Running...',
    pauseBtn: 'Jeda',
    activateBtn: 'Aktifkan',
    detailBtn: 'Detail',
    deleteTitle: 'Hapus Swarm',
    agentRoster: (count: number) => `Agent Roster (${count} Agen Deploy)`,
    confirmDelete: (name: string) => `Apakah Anda yakin ingin menonaktifkan swarm "${name}"? Tindakan ini akan menghentikan semua agen AI dalam swarm.`,
    deleteSuccess: (name: string) => `✓ Swarm "${name}" berhasil dihapus.`,
    toggleSuccess: (name: string, status: string) => `✓ Swarm "${name}" ${status === 'ACTIVE' ? 'diaktifkan' : 'dijeda'}.`,
    execSuccess: (name: string) => `✓ Swarm "${name}" berhasil dieksekusi! Lihat hasil di Execution History.`,
    onlineStatus: '● Online',
    statusActive: 'Aktif',
    statusPaused: 'Dijeda',
    statusDecommissioned: 'Dihapus',
  },
  en: {
    backToDashboard: '← Back to Swarm Dashboard',
    loadingDashboard: 'Loading AI Swarm Dashboard...',
    noSwarmTitle: 'No AI Swarms Deployed Yet',
    noSwarmDesc: 'Deploy an AI Inventory Swarm to activate autonomous AI agents that monitor stock, analyze sales, and provide automated restock recommendations.',
    deployNowBtn: 'Deploy AI Swarm Now',
    dashboardTitle: 'AI Inventory Swarm Dashboard',
    activeCount: (count: number) => `${count} Active`,
    dashboardSubtitle: 'Multi-agent workforce for autonomous inventory & stock analytics',
    execHistoryBtn: 'Execution History',
    deployNewBtn: '+ Deploy New',
    agentsCount: (count: number) => `${count} Agents`,
    tenantIsolated: 'Tenant-Isolated',
    runNowBtn: 'Run Now',
    runningBtn: 'Running...',
    pauseBtn: 'Pause',
    activateBtn: 'Activate',
    detailBtn: 'Details',
    deleteTitle: 'Decommission Swarm',
    agentRoster: (count: number) => `Agent Roster (${count} Deployed Agents)`,
    confirmDelete: (name: string) => `Are you sure you want to decommission swarm "${name}"? This action will stop all AI agents in this swarm.`,
    deleteSuccess: (name: string) => `✓ Swarm "${name}" successfully decommissioned.`,
    toggleSuccess: (name: string, status: string) => `✓ Swarm "${name}" is now ${status === 'ACTIVE' ? 'active' : 'paused'}.`,
    execSuccess: (name: string) => `✓ Swarm "${name}" executed successfully! View results in Execution History.`,
    onlineStatus: '● Online',
    statusActive: 'Active',
    statusPaused: 'Paused',
    statusDecommissioned: 'Decommissioned',
  },
  zh: {
    backToDashboard: '← 返回 Swarm 控制台',
    loadingDashboard: '正在加载 AI Swarm 控制台...',
    noSwarmTitle: '暂未部署 AI Swarm 集群',
    noSwarmDesc: '部署 AI 库存 Swarm 即可激活自主 AI 代理，实时监控库存、分析销售并生成自动补货建议。',
    deployNowBtn: '立即部署 AI Swarm',
    dashboardTitle: 'AI 库存 Swarm 控制台',
    activeCount: (count: number) => `${count} 个运行中`,
    dashboardSubtitle: '多 Agent 智能团队，实现自主库存与存货分析',
    execHistoryBtn: '执行历史日志',
    deployNewBtn: '+ 新建部署',
    agentsCount: (count: number) => `${count} 个代理`,
    tenantIsolated: '租户安全隔离',
    runNowBtn: '立即运行',
    runningBtn: '运行中...',
    pauseBtn: '暂停',
    activateBtn: '激活',
    detailBtn: '详细配置',
    deleteTitle: '下线 Swarm',
    agentRoster: (count: number) => `代理阵营 (${count} 个已部署代理)`,
    confirmDelete: (name: string) => `确定要下线 Swarm "${name}" 吗？此操作将停止该 Swarm 中的所有 AI 代理。`,
    deleteSuccess: (name: string) => `✓ Swarm "${name}" 已成功下线。`,
    toggleSuccess: (name: string, status: string) => `✓ Swarm "${name}" 已${status === 'ACTIVE' ? '激活' : '暂停'}。`,
    execSuccess: (name: string) => `✓ Swarm "${name}" 执行成功！可在执行历史中查看结果。`,
    onlineStatus: '● 在线',
    statusActive: '运行中',
    statusPaused: '已暂停',
    statusDecommissioned: '已下线',
  }
};

const AGENT_ICONS: Record<string, string> = {
  COORDINATOR: '🎯',
  INVENTORY_MONITOR: '📊',
  DEMAND_FORECASTER: '📈',
  STOCK_ANALYST: '🔬',
  REORDER_ADVISOR: '💡',
  INVENTORY_REPORTER: '📋',
};

export const SwarmDashboardView: React.FC<SwarmDashboardViewProps> = ({
  storeId,
  triggerToast,
  onDeployNew,
}) => {
  const { language } = useLanguage();
  const langKey = (language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'id') as 'id' | 'en' | 'zh';
  const txt = DASHBOARD_I18N[langKey];

  const [swarms, setSwarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSwarmId, setSelectedSwarmId] = useState<string | null>(null);
  const [executingSwarmId, setExecutingSwarmId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeChatSwarm, setActiveChatSwarm] = useState<any | null>(null);

  const STATUS_CONFIGS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    ACTIVE: {
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      label: txt.statusActive,
    },
    PAUSED: {
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
      label: txt.statusPaused,
    },
    DECOMMISSIONED: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-500 dark:text-slate-400',
      dot: 'bg-slate-400',
      label: txt.statusDecommissioned,
    },
  };

  const loadSwarms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getInventorySwarmList();
      setSwarms(Array.isArray(data) ? data.filter((s: any) => s.status !== 'DECOMMISSIONED') : []);
    } catch (e) {
      console.warn('Failed to load swarms:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSwarms();
  }, [loadSwarms]);

  const handleRunSwarm = async (swarm: any) => {
    setExecutingSwarmId(swarm.id);
    try {
      const result = await SupabaseDashboardService.executeInventorySwarm({
        swarmId: swarm.id,
        storeId,
        prompt: 'Lakukan analisis inventaris lengkap: deteksi stok menipis, analisis kecepatan penjualan, dan berikan rekomendasi restok otomatis.',
        triggerType: 'MANUAL',
      });

      if (result?.success) {
        triggerToast(txt.execSuccess(swarm.name));
      } else {
        triggerToast(`⚠️ Error: ${result?.error?.message || 'Execution error'}`);
      }
    } catch (err: any) {
      triggerToast(`⚠️ Error: ${err?.message || 'Network error'}`);
    } finally {
      setExecutingSwarmId(null);
    }
  };

  const handleToggleStatus = async (swarm: any) => {
    const newStatus = swarm.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const result = await SupabaseDashboardService.updateSwarmStatus(swarm.id, newStatus);
      if (result?.success) {
        triggerToast(txt.toggleSuccess(swarm.name, newStatus));
        loadSwarms();
      } else {
        triggerToast(`⚠️ Error: ${result?.error?.message || 'Error'}`);
      }
    } catch (err: any) {
      triggerToast(`⚠️ Error: ${err?.message || 'Network error'}`);
    }
  };

  const handleDelete = async (swarm: any) => {
    if (!window.confirm(txt.confirmDelete(swarm.name))) {
      return;
    }
    try {
      const result = await SupabaseDashboardService.deleteSwarm(swarm.id);
      if (result?.success) {
        triggerToast(txt.deleteSuccess(swarm.name));
        loadSwarms();
      } else {
        triggerToast(`⚠️ Error: ${result?.error?.message || 'Error'}`);
      }
    } catch (err: any) {
      triggerToast(`⚠️ Error: ${err?.message || 'Network error'}`);
    }
  };

  if (activeChatSwarm) {
    return (
      <SwarmChatView
        swarm={activeChatSwarm}
        onBackToOverview={() => setActiveChatSwarm(null)}
      />
    );
  }

  if (showHistory) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowHistory(false)}
          className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-colors"
        >
          {txt.backToDashboard}
        </button>
        <SwarmExecutionHistoryView storeId={storeId} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <RefreshCw size={18} className="text-orange-500 animate-spin" />
          <span className="text-xs sm:text-sm font-bold text-slate-500">{txt.loadingDashboard}</span>
        </div>
      </div>
    );
  }

  if (swarms.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 shadow-xs">
        <div className="size-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 mx-auto flex items-center justify-center">
          <Bot size={28} className="text-orange-500" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{txt.noSwarmTitle}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 font-medium leading-relaxed">
            {txt.noSwarmDesc}
          </p>
        </div>
        {onDeployNew && (
          <button
            onClick={onDeployNew}
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all flex items-center gap-2 mx-auto"
          >
            <Zap size={16} /> {txt.deployNowBtn}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot size={18} className="text-orange-500" />
            <span>{txt.dashboardTitle}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800">
              {txt.activeCount(swarms.filter(s => s.status === 'ACTIVE').length)}
            </span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
            {txt.dashboardSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Clock size={14} /> {txt.execHistoryBtn}
          </button>
          {onDeployNew && (
            <button
              onClick={onDeployNew}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
            >
              <Zap size={14} /> {txt.deployNewBtn}
            </button>
          )}
        </div>
      </div>

      {/* Swarm Cards */}
      {swarms.map((swarm) => {
        const agents = swarm.ai_swarm_agents || [];
        const statusCfg = STATUS_CONFIGS[swarm.status] || STATUS_CONFIGS.ACTIVE;
        const isExpanded = selectedSwarmId === swarm.id;
        const isExecuting = executingSwarmId === swarm.id;
        const deployedAt = swarm.created_at ? new Date(swarm.created_at) : null;

        return (
          <div
            key={swarm.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
          >
            {/* Swarm Header */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-md">
                  🤖
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{swarm.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text}`}>
                      <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1"><Users size={11} /> {txt.agentsCount(agents.length)}</span>
                    <span className="flex items-center gap-1"><Shield size={11} /> {txt.tenantIsolated}</span>
                    {deployedAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {deployedAt.toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleRunSwarm(swarm)}
                  disabled={swarm.status !== 'ACTIVE' || isExecuting}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <><RefreshCw size={13} className="animate-spin" /> {txt.runningBtn}</>
                  ) : (
                    <><Play size={13} /> {txt.runNowBtn}</>
                  )}
                </button>

                <button
                  onClick={() => setActiveChatSwarm(swarm)}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                  title="Buka Interaktif Chatbot Control Plane"
                >
                  <MessageSquare size={13} />
                  <span>Buka Chat</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(swarm)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                >
                  {swarm.status === 'ACTIVE' ? <><Pause size={13} /> {txt.pauseBtn}</> : <><Play size={13} /> {txt.activateBtn}</>}
                </button>

                <button
                  onClick={() => setSelectedSwarmId(isExpanded ? null : swarm.id)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                >
                  <Settings size={13} /> {txt.detailBtn}
                </button>

                <button
                  onClick={() => handleDelete(swarm)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-500 cursor-pointer transition-all"
                  title={txt.deleteTitle}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Expanded Agent Roster */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={12} /> {txt.agentRoster(agents.length)}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {agents.map((agent: any, idx: number) => (
                    <div
                      key={agent.id || idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3"
                    >
                      <div className="size-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-lg flex-shrink-0">
                        {AGENT_ICONS[agent.role] || '🤖'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">{agent.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400">{agent.role}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                            agent.status === 'ACTIVE' 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}>
                            {agent.status === 'ACTIVE' ? txt.onlineStatus : agent.status}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block truncate mt-0.5">{agent.model_id}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Swarm Metadata */}
                <div className="flex flex-wrap gap-2 pt-2 text-[10px] font-bold text-slate-400">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">ID: {swarm.id?.slice(0, 8)}...</span>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Objective: {swarm.objective || 'INVENTORY_MANAGEMENT'}</span>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">Authority: {agents[0]?.authority_level || 'READ_ONLY'}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
