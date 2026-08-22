import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Plus, Trash2, RefreshCw, Send, ShieldCheck,
  AlertTriangle, CheckCircle2, TrendingUp, Box, Layers, Zap,
  Activity, ArrowRight, CornerDownRight, Database, Search,
  Sliders, AlertOctagon, HelpCircle, FileText, Check, X,
  Maximize2, Minimize2, Copy, ChevronDown, ShoppingBag, BarChart3,
  Truck, ShieldAlert, Sparkles, Bot, User, CheckSquare, Users, Menu,
  Clock, ChevronRight, Info, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface UniversalAIChatViewProps {
  onBackToOverview?: () => void;
}

const UNIVERSAL_CHAT_I18N = {
  id: {
    gatewayTitle: 'Universal AI Chat',
    convoHistory: 'Riwayat Percakapan',
    newChatBtn: 'Baru',
    loadingSessions: 'Memuat sesi...',
    noSessions: 'Belum ada percakapan. Klik (+ Baru) untuk memulai.',
    activeWorkforceBadge: 'UNIVERSAL WORKFORCE',
    emptyTitle: 'Universal AI Store Management Chat',
    emptyDesc: 'Tanyakan persediaan, omzet penjualan, produk, stok menipis, atau rekomendasi restok.',
    ownerName: 'Pemilik Toko',
    confirmTitle: 'Konfirmasi Wewenang Perubahan Data',
    executing: 'Mengeksekusi...',
    confirmExec: 'Konfirmasi & Eksekusi',
    inputPlaceholder: 'Tanyakan stok, penjualan, produk, atau pengadaan (Tekan Enter untuk kirim)...',
    processing: 'Memproses Swarm...',
    sendBtn: 'Kirim',
    workforceRosterTitle: 'AI Workforce (6 Domain)',
    liveTelemetryBadge: 'REALTIME',
    recentExecTitle: 'Aktivitas Eksekusi',
    noExecLogs: 'Belum ada log eksekusi.',
    securityBadge: 'Multi-Tenant RLS Active',
    insightsTitle: 'Telemetri Insight Toko Realtime',
    quickActions: [
      { label: 'Kesehatan Toko', prompt: 'Berapa skor kesehatan toko saya hari ini?', icon: Activity, domain: 'operations' },
      { label: 'Analisis Stok', prompt: 'Analisis seluruh kondisi stok barang toko saya saat ini', icon: Box, domain: 'inventory' },
      { label: 'Ringkasan Omzet', prompt: 'Berapa omzet dan total penjualan toko saya hari ini?', icon: BarChart3, domain: 'sales' },
      { label: 'Stok Menipis', prompt: 'Daftar produk mana saja yang stoknya menipis?', icon: AlertTriangle, domain: 'inventory' },
      { label: 'Risiko Stockout', prompt: 'Produk mana yang berisiko habis dalam 7-14 hari ke depan?', icon: AlertOctagon, domain: 'demand' },
      { label: 'Rencana Pengadaan', prompt: 'Beri rekomendasi rencana pengadaan barang (restok) bulan ini', icon: Truck, domain: 'procurement' },
    ]
  },
  en: {
    gatewayTitle: 'Universal AI Chat',
    convoHistory: 'Conversation History',
    newChatBtn: 'New',
    loadingSessions: 'Loading sessions...',
    noSessions: 'No conversations yet. Click (+ New) to start.',
    activeWorkforceBadge: 'UNIVERSAL WORKFORCE',
    emptyTitle: 'Universal AI Store Management Chat',
    emptyDesc: 'Ask about stock inventory, sales revenue, product catalog, or restocking plans.',
    ownerName: 'Store Owner',
    confirmTitle: 'Confirm Mutation Authority',
    executing: 'Executing...',
    confirmExec: 'Confirm & Execute',
    inputPlaceholder: 'Ask about inventory, sales, products, or procurement (Press Enter to send)...',
    processing: 'Processing Swarm...',
    sendBtn: 'Send',
    workforceRosterTitle: 'AI Workforce (6 Domains)',
    liveTelemetryBadge: 'LIVE',
    recentExecTitle: 'Recent Executions',
    noExecLogs: 'No execution logs yet.',
    securityBadge: 'Multi-Tenant RLS Active',
    insightsTitle: 'Realtime Store AI Telemetry Insights',
    quickActions: [
      { label: 'Store Health', prompt: 'What is my store health score today?', icon: Activity, domain: 'operations' },
      { label: 'Stock Analysis', prompt: 'Analyze overall stock condition of my store', icon: Box, domain: 'inventory' },
      { label: 'Sales Summary', prompt: 'What is my total revenue and sales count today?', icon: BarChart3, domain: 'sales' },
      { label: 'Low Stock', prompt: 'Which products are running low on stock?', icon: AlertTriangle, domain: 'inventory' },
      { label: 'Stockout Risk', prompt: 'Which products are at risk of stockout within 7-14 days?', icon: AlertOctagon, domain: 'demand' },
      { label: 'Procurement Plan', prompt: 'Provide procurement and restocking recommendations for this month', icon: Truck, domain: 'procurement' },
    ]
  },
  zh: {
    gatewayTitle: '通用 AI 聊天',
    convoHistory: '对话历史',
    newChatBtn: '新建',
    loadingSessions: '正在加载...',
    noSessions: '暂无对话。点击 (+ 新建) 开始。',
    activeWorkforceBadge: '通用 AI 团队',
    emptyTitle: '通用 AI 店铺管理聊天',
    emptyDesc: '查询库存状况、销售额、商品目录或补货计划。',
    ownerName: '店铺管理者',
    confirmTitle: '确认数据变更授权',
    executing: '正在执行...',
    confirmExec: '确认并执行',
    inputPlaceholder: '输入关于库存、销售、商品或采购 (按 Enter 发送)...',
    processing: 'Swarm 处理中...',
    sendBtn: '发送',
    workforceRosterTitle: 'AI 团队名册（6 个领域）',
    liveTelemetryBadge: '实时',
    recentExecTitle: '最新执行活动',
    noExecLogs: '暂无执行日志。',
    securityBadge: 'Multi-Tenant RLS Active',
    insightsTitle: '实时店铺 AI 遥测洞察',
    quickActions: [
      { label: '店铺健康', prompt: '今天我店铺的健康评分是多少？', icon: Activity, domain: 'operations' },
      { label: '库存分析', prompt: '分析 boot 店铺目前的整体库存状况', icon: Box, domain: 'inventory' },
      { label: '销售摘要', prompt: '今天我店铺的总销售额和订单量是多少？', icon: BarChart3, domain: 'sales' },
      { label: '低库存预警', prompt: '哪些商品的库存即将耗尽？', icon: AlertTriangle, domain: 'inventory' },
      { label: '断货风险预测', prompt: '未来 7-14 天内哪些商品有断货风险？', icon: AlertOctagon, domain: 'demand' },
      { label: '采购计划', prompt: '提供本月的商品采购与补货计划建议', icon: Truck, domain: 'procurement' },
    ]
  }
};

const DOMAIN_ICONS: Record<string, any> = {
  inventory: Box,
  sales: BarChart3,
  product: ShoppingBag,
  demand: Zap,
  procurement: Truck,
  operations: Activity,
};

const DOMAIN_COLORS: Record<string, string> = {
  inventory: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  sales: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  product: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  demand: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  procurement: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  operations: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

/** Simple inline Markdown formatting parser to render bold, italics, bullets, and linebreaks cleanly */
const FormattedMessageContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1" />;

        const parts = line.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className={isUser ? 'font-bold text-white' : 'font-semibold text-slate-900 dark:text-slate-100'}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={lIdx} className="flex items-start space-x-2 pl-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${isUser ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>{renderedLine}</span>
            </div>
          );
        }

        return <p key={lIdx}>{renderedLine}</p>;
      })}
    </div>
  );
};

export const UniversalAIChatView: React.FC<UniversalAIChatViewProps> = ({ onBackToOverview }) => {
  const { language } = useLanguage();
  const langKey = (language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'id') as 'id' | 'en' | 'zh';
  const txt = UNIVERSAL_CHAT_I18N[langKey];

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [confirmingMutation, setConfirmingMutation] = useState<boolean>(false);
  const [agentActivity, setAgentActivity] = useState<any[]>([]);
  const [swarms, setSwarms] = useState<any[]>([]);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState<boolean>(false);
  const [showWorkforceRoster, setShowWorkforceRoster] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showInsightsBar, setShowInsightsBar] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Initial load: fetch authorized swarms and chat sessions
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sessionsData, swarmsRes] = await Promise.all([
        SupabaseDashboardService.getUniversalChatSessions(),
        SupabaseDashboardService.getAuthorizedSwarms(),
      ]);

      if (swarmsRes?.swarms) {
        setSwarms(swarmsRes.swarms);
      }

      if (sessionsData && sessionsData.length > 0) {
        setSessions(sessionsData);
        setActiveSessionId(sessionsData[0].id);
        await loadSessionMessages(sessionsData[0].id);
      } else {
        const newSess = await SupabaseDashboardService.createUniversalChatSession('Universal AI Store Chat');
        if (newSess) {
          setSessions([newSess]);
          setActiveSessionId(newSess.id);
        }
      }
    } catch (err) {
      console.error('Failed to initialize Universal AI Chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const msgs = await SupabaseDashboardService.getUniversalChatMessages(sessionId);
      setMessages(msgs || []);

      const latestActivity = (msgs || [])
        .filter((m: any) => m.agent_activity && Array.isArray(m.agent_activity))
        .flatMap((m: any) => m.agent_activity);
      setAgentActivity(latestActivity.slice(-10));
    } catch (err) {
      console.error('Failed to load session messages:', err);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistorySidebar(false);
    await loadSessionMessages(sessionId);
  };

  const handleCreateNewSession = async () => {
    try {
      const title = `Store Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const newSess = await SupabaseDashboardService.createUniversalChatSession(title);
      if (newSess) {
        setSessions(prev => [newSess, ...prev]);
        setActiveSessionId(newSess.id);
        setMessages([]);
        setAgentActivity([]);
        setShowHistorySidebar(false);
      }
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await SupabaseDashboardService.deleteUniversalChatSession(sessionId);
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
          await loadSessionMessages(updated[0].id);
        } else {
          handleCreateNewSession();
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const prompt = (promptToSend || inputPrompt).trim();
    if (!prompt || sending || !activeSessionId) return;

    setInputPrompt('');
    setSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId,
      sender_type: 'USER',
      sender_name: txt.ownerName,
      content: prompt,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await SupabaseDashboardService.sendUniversalChatMessage({
        sessionId: activeSessionId,
        prompt,
        preferredLanguage: language,
      });

      if (response) {
        await loadSessionMessages(activeSessionId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfirmMutation = async (pendingMutation: any) => {
    if (!activeSessionId || confirmingMutation) return;

    setConfirmingMutation(true);
    try {
      const res = await SupabaseDashboardService.confirmUniversalMutation({
        sessionId: activeSessionId,
        confirmationToken: pendingMutation.confirmationToken,
        action: pendingMutation.action,
        params: pendingMutation.params || {},
      });

      if (res) {
        await loadSessionMessages(activeSessionId);
      }
    } catch (err) {
      console.error('Failed to confirm mutation:', err);
    } finally {
      setConfirmingMutation(false);
    }
  };

  const handleCopyMessage = (content: string, msgId: string) => {
    try {
      navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  const activeSessionObj = sessions.find(s => s.id === activeSessionId);

  return (
    <div className={`flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all duration-300 ${
      isMaximized
        ? 'fixed inset-0 z-50 p-2 sm:p-4 bg-slate-900/50 backdrop-blur-md'
        : 'w-full max-w-6xl mx-auto h-[520px] sm:h-[620px] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-xl'
    }`}>
      {/* ── Top Header / Control Plane ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className={`p-2 rounded-xl border text-xs font-semibold transition shrink-0 ${
              showHistorySidebar
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Riwayat Sesi"
          >
            {showHistorySidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {txt.gatewayTitle}
              </h2>
              <span className="hidden lg:inline-flex px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                {txt.activeWorkforceBadge}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[240px]">
              {activeSessionObj?.title || 'Universal AI Store Chat'}
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={handleCreateNewSession}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="Sesi Baru"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{txt.newChatBtn}</span>
          </button>

          <button
            onClick={() => setShowInsightsBar(!showInsightsBar)}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold transition ${
              showInsightsBar
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="Telemetry Insights"
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowWorkforceRoster(!showWorkforceRoster)}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold transition ${
              showWorkforceRoster
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title="AI Swarm Workforce"
          >
            <Users className="w-4 h-4" />
          </button>

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 transition"
            >
              Overview
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition hidden sm:block"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Collapsible AI Telemetry Insights Bar ─────────────────────────── */}
      {showInsightsBar && (
        <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs gap-2 animate-in fade-in shrink-0">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Multi-Tenant Context: <span className="font-mono text-emerald-600 dark:text-emerald-400">Strict RLS Active</span></span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
            <span>Model: ZeroClaw</span>
            <span>RLS: Enforced</span>
          </div>
        </div>
      )}

      {/* ── Main Content Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* ── Left Sidebar Drawer (History) ──────────────────────────────── */}
        {showHistorySidebar && (
          <>
            <div
              onClick={() => setShowHistorySidebar(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
            />
            <div className="absolute lg:relative inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{txt.convoHistory}</span>
                <button
                  onClick={handleCreateNewSession}
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  title="Sesi Baru"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                  <div className="p-4 text-center text-xs text-slate-400 animate-pulse">{txt.loadingSessions}</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">{txt.noSessions}</div>
                ) : (
                  sessions.map(sess => {
                    const isActive = sess.id === activeSessionId;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess.id)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold border border-slate-200 dark:border-slate-700'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className="truncate">{sess.title || 'Chat Session'}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[10px] text-slate-500 flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{txt.securityBadge}</span>
              </div>
            </div>
          </>
        )}

        {/* ── Center Column: Contained Width Chat Stream ─────────────────── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden min-h-0">
          {/* Contained Width Scroll Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
            <div className="max-w-3xl mx-auto space-y-4 w-full">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 sm:p-6 space-y-4 min-h-[300px]">
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 shadow-xs">
                    <Bot className="w-9 h-9 sm:w-12 sm:h-12" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-200">{txt.emptyTitle}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{txt.emptyDesc}</p>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full pt-1">
                    {txt.quickActions.map((qa, idx) => {
                      const IconComp = qa.icon;
                      const domainColor = DOMAIN_COLORS[qa.domain] || 'bg-slate-100 text-slate-700';
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(qa.prompt)}
                          className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 text-left transition group shadow-2xs"
                        >
                          <div className={`p-1.5 rounded-xl ${domainColor} shrink-0`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                              {qa.label}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {qa.prompt}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                messages.map(msg => {
                  const isUser = msg.sender_type === 'USER';
                  const hasPayload = msg.structured_payload;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 shadow-xs ${
                        isUser
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      {/* Content Box */}
                      <div className={`flex flex-col max-w-[90%] sm:max-w-[82%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 px-1">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{msg.sender_name || (isUser ? txt.ownerName : 'AI Workforce')}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={`p-3.5 rounded-2xl text-xs ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                            : 'bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                        }`}>
                          <FormattedMessageContent content={msg.content} isUser={isUser} />

                          {/* Grounded items / evidence tags */}
                          {hasPayload?.groundedItems && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
                              {hasPayload.groundedItems.map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700"
                                >
                                  <CheckSquare className="w-3 h-3 text-emerald-500" />
                                  <span>{item.label}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Agent Execution Logs / Telemetry Accordion */}
                          {msg.agent_activity && msg.agent_activity.length > 0 && (
                            <details className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] group">
                              <summary className="font-mono text-slate-500 hover:text-emerald-500 cursor-pointer flex items-center justify-between select-none py-0.5">
                                <span className="flex items-center gap-1 font-bold">
                                  <Activity className="w-3 h-3 text-emerald-500" />
                                  <span>Telemetri & Log Swarm ({msg.agent_activity.length} Langkah)</span>
                                </span>
                                <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                              </summary>
                              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/30">
                                {msg.agent_activity.map((act: any, aIdx: number) => (
                                  <div key={aIdx} className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-0.5">
                                    <div className="flex items-center justify-between font-mono">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[9px]">{act.agentRole || act.agentName || 'Agent Step'}</span>
                                      <span className="text-slate-400 text-[8px]">{act.latencyMs ? `${act.latencyMs}ms` : '0ms'}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-[9px] leading-snug">{act.summary || act.output || 'Step completed'}</p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}

                          {/* Table payload if present */}
                          {hasPayload?.tableData && hasPayload.tableData.length > 0 && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
                              <table className="w-full text-[10px] text-left text-slate-700 dark:text-slate-300">
                                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 uppercase font-mono text-[9px]">
                                  <tr>
                                    <th className="p-1">Nama</th>
                                    <th className="p-1">SKU</th>
                                    <th className="p-1">Stok</th>
                                    <th className="p-1">Terjual</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                  {hasPayload.tableData.slice(0, 5).map((row: any, rIdx: number) => (
                                    <tr key={rIdx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                                      <td className="p-1 font-medium text-slate-900 dark:text-slate-200">{row.name || row.productName || '-'}</td>
                                      <td className="p-1 font-mono text-slate-400">{row.sku || '-'}</td>
                                      <td className="p-1 font-mono text-emerald-600 dark:text-emerald-400">{row.stock ?? row.currentStock ?? '-'}</td>
                                      <td className="p-1 font-mono text-slate-600 dark:text-slate-300">{row.sold ?? row.unitsSold ?? '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Write Mutation Confirmation Box */}
                          {msg.requires_confirmation && msg.pending_mutation && (
                            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                              <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>{txt.confirmTitle}</span>
                              </div>
                              <p className="text-[10px] text-amber-800 dark:text-amber-300/80 leading-relaxed">
                                {msg.pending_mutation.description}
                              </p>
                              <div className="flex items-center space-x-2 pt-0.5">
                                <button
                                  onClick={() => handleConfirmMutation(msg.pending_mutation)}
                                  disabled={confirmingMutation}
                                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition disabled:opacity-50 shadow-xs"
                                >
                                  {confirmingMutation ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                  <span>{confirmingMutation ? txt.executing : txt.confirmExec}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Copy Action */}
                        <button
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="text-[9px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center space-x-1 transition px-1"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* In-flight streaming indicator */}
              {sending && (
                <div className="flex items-start space-x-2.5">
                  <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-500 border border-slate-200 dark:border-slate-700 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>{txt.processing}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Taller, Seamless Prompt Field ──────────────────────────────── */}
          <div className="p-3 sm:p-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md shrink-0 shadow-lg">
            <div className="max-w-3xl mx-auto w-full">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-end space-x-2 bg-white dark:bg-slate-950 p-2 sm:p-2.5 rounded-2xl border border-slate-300 dark:border-slate-800 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 shadow-sm transition"
              >
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={txt.inputPlaceholder}
                  disabled={sending}
                  rows={2}
                  className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none resize-none leading-relaxed px-2 py-1 min-h-[44px] max-h-32"
                />
                <button
                  type="submit"
                  disabled={sending || !inputPrompt.trim()}
                  className="flex items-center justify-center space-x-1.5 h-10 sm:h-11 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition shrink-0 shadow-md"
                >
                  <span className="hidden sm:inline">{txt.sendBtn}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right Column: AI Workforce Roster & Telemetry Drawer ─────────── */}
        {showWorkforceRoster && (
          <>
            <div
              onClick={() => setShowWorkforceRoster(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
            />
            <div className="absolute lg:relative inset-y-0 right-0 z-40 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">{txt.workforceRosterTitle}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>

              <div className="p-3 space-y-2 overflow-y-auto flex-1 border-b border-slate-200 dark:border-slate-800">
                {swarms.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">Memuat data swarm...</div>
                ) : (
                  swarms.map((s: any) => {
                    const IconComp = DOMAIN_ICONS[s.domain] || Activity;
                    const colorClass = DOMAIN_COLORS[s.domain] || 'bg-slate-100 text-slate-700';
                    return (
                      <div
                        key={s.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg ${colorClass}`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono capitalize">{s.domain} • {s.status}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/80 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{txt.recentExecTitle}</span>
                  <span className="flex items-center space-x-1 text-[10px] text-emerald-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>LIVE</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px]">
                  {agentActivity.length === 0 ? (
                    <div className="text-slate-400 text-center py-6 leading-relaxed">{txt.noExecLogs}</div>
                  ) : (
                    agentActivity.map((act: any, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">{act.agentRole}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{act.latencyMs}ms</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[9px] leading-tight">{act.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
