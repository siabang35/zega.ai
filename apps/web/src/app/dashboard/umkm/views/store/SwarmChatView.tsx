import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Plus, Trash2, RefreshCw, Send, ShieldCheck,
  AlertTriangle, CheckCircle2, TrendingUp, Box, Layers, Zap,
  Activity, ArrowRight, CornerDownRight, Database, Search,
  Sliders, AlertOctagon, HelpCircle, FileText, Check, X,
  Maximize2, Minimize2, Copy, ChevronDown
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { useLanguage } from '../../../../../i18n/translations';

interface SwarmChatViewProps {
  swarm?: any;
  onBackToOverview?: () => void;
}

const CHAT_I18N = {
  id: {
    controlPlane: 'Swarm Control Plane',
    convoHistory: 'Riwayat Percakapan',
    newChatBtn: 'Baru',
    loadingSessions: 'Memuat sesi...',
    noSessions: 'Belum ada percakapan. Klik (+ Baru) untuk memulai.',
    backToOverview: 'Kembali ke Swarm Overview',
    activeSwarmBadge: 'SWARM AKTIF',
    agentsOnlineSub: '5 Agen Khusus Online • Eksekusi Terisolasi Multi-Tenant',
    stockHealthScore: 'Skor Kesehatan Stok',
    emptyTitle: 'AI Swarm Stock Control Plane',
    emptyDesc: 'Tanyakan kondisi persediaan barang, prediksi risiko stockout, atau minta swarm merekomendasikan rencana restok otomatis.',
    ownerName: 'Pemilik Toko',
    confirmTitle: 'Konfirmasi Wewenang Perubahan Data',
    executing: 'Mengeksekusi...',
    confirmExec: 'Konfirmasi & Eksekusi',
    inputPlaceholder: 'Tanyakan analisis stok, prediksi stockout, atau instruksi restok...',
    processing: 'Memproses...',
    sendBtn: 'Kirim',
    swarmActivityTitle: 'Aktivitas Swarm',
    liveTelemetryBadge: 'TELEMETRI REALTIME',
    agentRosterTitle: 'Daftar Agen (5 Online)',
    recentExecTitle: 'Aktivitas Eksekusi Terkini',
    noExecLogs: 'Belum ada log eksekusi. Jalankan query untuk melihat telemetry agent secara real-time.',
    securityBadge: 'Eksekusi Terisolasi Multi-Tenant Ketat',
    quickActions: [
      { label: 'Analisis Stok', prompt: 'Analisis seluruh kondisi stok barang toko saya saat ini', icon: Activity },
      { label: 'Stok Menipis', prompt: 'Daftar produk mana saja yang stoknya menipis?', icon: AlertTriangle },
      { label: 'Risiko Stockout', prompt: 'Produk mana yang berisiko habis dalam 7-14 hari ke depan?', icon: AlertOctagon },
      { label: 'Dead Stock', prompt: 'Tampilkan produk yang menumpuk / dead stock', icon: Box },
      { label: 'Rekomendasi Restok', prompt: 'Beri rekomendasi restok barang untuk 30 hari ke depan', icon: TrendingUp },
      { label: 'Proyeksi Demand', prompt: 'Proyeksikan estimasi kebutuhan stok bulan ini', icon: Zap },
      { label: 'Buat Rencana Restok', prompt: 'Buat rencana pengisian ulang stok minggu ini', icon: FileText },
    ]
  },
  en: {
    controlPlane: 'Swarm Control Plane',
    convoHistory: 'Conversation History',
    newChatBtn: 'New',
    loadingSessions: 'Loading sessions...',
    noSessions: 'No conversations yet. Click (+ New) to start.',
    backToOverview: 'Back to Swarm Overview',
    activeSwarmBadge: 'ACTIVE SWARM',
    agentsOnlineSub: '5 Specialized Agents Online • Multi-Tenant Isolated Execution',
    stockHealthScore: 'Stock Health Score',
    emptyTitle: 'AI Swarm Stock Control Plane',
    emptyDesc: 'Ask about inventory health, forecast stockout risks, or request automated reorder recommendations.',
    ownerName: 'Store Owner',
    confirmTitle: 'Confirm Mutation Authority',
    executing: 'Executing...',
    confirmExec: 'Confirm & Execute',
    inputPlaceholder: 'Ask about stock analysis, stockout risks, or restok instructions...',
    processing: 'Processing...',
    sendBtn: 'Send',
    swarmActivityTitle: 'Swarm Activity',
    liveTelemetryBadge: 'LIVE TELEMETRY',
    agentRosterTitle: 'Agent Roster (5 Online)',
    recentExecTitle: 'Recent Execution Activity',
    noExecLogs: 'No execution logs yet. Run a query to view agent telemetry in real-time.',
    securityBadge: 'Strict Multi-Tenant Isolated Execution',
    quickActions: [
      { label: 'Stock Analysis', prompt: 'Analyze current stock conditions of my store', icon: Activity },
      { label: 'Low Stock', prompt: 'Which products are low on stock?', icon: AlertTriangle },
      { label: 'Stockout Risk', prompt: 'Which products are at risk of stockout within 7-14 days?', icon: AlertOctagon },
      { label: 'Dead Stock', prompt: 'Show slow-moving or dead stock items', icon: Box },
      { label: 'Restock Recs', prompt: 'Provide restock recommendations for the next 30 days', icon: TrendingUp },
      { label: 'Demand Forecast', prompt: 'Project demand requirements for this month', icon: Zap },
      { label: 'Restock Plan', prompt: 'Create a weekly stock replenishment plan', icon: FileText },
    ]
  },
  zh: {
    controlPlane: 'Swarm 控制台',
    convoHistory: '对话历史记录',
    newChatBtn: '新建',
    loadingSessions: '正在加载会话...',
    noSessions: '暂无对话。点击 (+ 新建) 开始。',
    backToOverview: '返回 Swarm 概览',
    activeSwarmBadge: '运行中 SWARM',
    agentsOnlineSub: '5 个专有 AI 代理在线 • 多租户安全隔离',
    stockHealthScore: '库存健康度评分',
    emptyTitle: 'AI 库存 Swarm 控制台',
    emptyDesc: '查询库存状况、预测断货风险或获取自动补货计划建议。',
    ownerName: '店铺管理者',
    confirmTitle: '确认数据变更授权',
    executing: '正在执行...',
    confirmExec: '确认并执行',
    inputPlaceholder: '输入库存分析、断货预测或补货指令...',
    processing: '处理中...',
    sendBtn: '发送',
    swarmActivityTitle: 'Swarm 活动状态',
    liveTelemetryBadge: '实时遥测',
    agentRosterTitle: '代理团队（5 个在线）',
    recentExecTitle: '最新执行活动',
    noExecLogs: '暂无执行日志。发送查询即可实时查看代理遥测。',
    securityBadge: '严格的多租户安全隔离',
    quickActions: [
      { label: '库存分析', prompt: '分析我店铺当前的整体库存状况', icon: Activity },
      { label: '低库存预警', prompt: '哪些商品的库存即将耗尽？', icon: AlertTriangle },
      { label: '断货风险预测', prompt: '未来 7-14 天内哪些商品有断货风险？', icon: AlertOctagon },
      { label: '积压死存检测', prompt: '显示滞销或资金占用积压商品', icon: Box },
      { label: '补货建议', prompt: '提供未来 30 天的商品补货建议', icon: TrendingUp },
      { label: '需求预测', prompt: '预测本月的库存需求量', icon: Zap },
      { label: '制定补货计划', prompt: '制定本周的补货计划', icon: FileText },
    ]
  }
};

export const SwarmChatView: React.FC<SwarmChatViewProps> = ({ swarm, onBackToOverview }) => {
  const { language, setLanguage } = useLanguage();
  const langKey = (language === 'zh' ? 'zh' : language === 'en' ? 'en' : 'id') as 'id' | 'en' | 'zh';
  const txt = CHAT_I18N[langKey];

  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [confirmingMutation, setConfirmingMutation] = useState<boolean>(false);
  const [swarmActivity, setSwarmActivity] = useState<any[]>([]);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyMessage = (content: string, msgId: string) => {
    try {
      navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [swarm?.id]);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const fetched = await SupabaseDashboardService.getSwarmChatSessions();
      setSessions(fetched || []);
      if (fetched && fetched.length > 0) {
        setActiveSessionId(fetched[0].id);
      } else if (swarm?.id) {
        // Auto create first session if none exists
        const defaultTitle = language === 'zh' ? '库存对话' : language === 'en' ? 'Stock Inventory Chat' : 'Percakapan Persediaan Barang';
        const newSession = await SupabaseDashboardService.createSwarmChatSession(swarm.id, defaultTitle);
        if (newSession) {
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      }
    } catch (err) {
      console.error('Load sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const fetched = await SupabaseDashboardService.getSwarmChatMessages(sessionId);
      setMessages(fetched || []);
      
      // Update swarm activity from latest swarm message
      const latestSwarmMsg = [...(fetched || [])].reverse().find((m: any) => m.agent_activity && Array.isArray(m.agent_activity) && m.agent_activity.length > 0);
      if (latestSwarmMsg) {
        setSwarmActivity(latestSwarmMsg.agent_activity);
      }
    } catch (err) {
      console.error('Load messages error:', err);
    }
  };

  const handleCreateNewSession = async () => {
    if (!swarm?.id) return;
    try {
      const prefix = language === 'zh' ? '库存对话' : language === 'en' ? 'Stock Chat' : 'Chat Persediaan';
      const title = `${prefix} #${sessions.length + 1}`;
      const newSession = await SupabaseDashboardService.createSwarmChatSession(swarm.id, title);
      if (newSession) {
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Create new session error:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmPrompt = language === 'zh' ? '确定要删除此对话吗？' : language === 'en' ? 'Are you sure you want to delete this session?' : 'Apakah Anda yakin ingin menghapus percakapan ini?';
    if (!confirm(confirmPrompt)) return;
    try {
      await SupabaseDashboardService.deleteSwarmChatSession(sessionId);
      const remaining = sessions.filter(s => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || !activeSessionId || !swarm?.id || sending) return;

    setInputPrompt('');
    setSending(true);

    // Optimistic User Message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId,
      swarm_id: swarm.id,
      sender_type: 'USER',
      sender_name: txt.ownerName,
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await SupabaseDashboardService.sendSwarmChatMessage({
        sessionId: activeSessionId,
        swarmId: swarm.id,
        prompt: text
      });

      if (response) {
        await loadMessages(activeSessionId);
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmMutation = async (msg: any) => {
    if (!msg.pending_mutation || confirmingMutation) return;
    setConfirmingMutation(true);

    try {
      const res = await SupabaseDashboardService.confirmSwarmChatMutation({
        sessionId: activeSessionId!,
        swarmId: swarm.id,
        confirmationToken: msg.pending_mutation.confirmationToken,
        action: msg.pending_mutation.action,
        params: msg.pending_mutation.params
      });

      if (res) {
        await loadMessages(activeSessionId!);
      }
    } catch (err) {
      console.error('Confirm mutation error:', err);
    } finally {
      setConfirmingMutation(false);
    }
  };

  const quickActions = txt.quickActions;

  return (
    <div className={`flex bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 ${
      isMaximized ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] shadow-orange-500/20 dark:shadow-emerald-950/40' : 'h-[calc(100vh-8rem)]'
    }`}>
      {/* ── COLUMN 1: SESSIONS & HISTORY LIST (LEFT) ── */}
      <div className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-emerald-500/20 border border-orange-200 dark:border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-orange-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{txt.controlPlane}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{txt.convoHistory}</p>
            </div>
          </div>
          <button
            onClick={handleCreateNewSession}
            className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title={txt.newChatBtn}
          >
            <Plus className="w-4 h-4" />
            <span>{txt.newChatBtn}</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">{txt.loadingSessions}</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">{txt.noSessions}</div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer border transition-all ${
                    isActive
                      ? 'bg-orange-50 dark:bg-emerald-950/40 border-orange-300 dark:border-emerald-500/50 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="text-xs font-bold truncate">{sess.title || 'Stock Swarm Chat'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-all"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{new Date(sess.updated_at || sess.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID')}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[9px] font-bold text-slate-600 dark:text-slate-400">
                      {sess.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Back Button */}
        {onBackToOverview && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onBackToOverview}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>{txt.backToOverview}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── COLUMN 2: CONVERSATION & INTERACTIVITY (CENTER) ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative">
        {/* Chat Top Banner */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 dark:from-emerald-500 dark:to-teal-600 flex items-center justify-center text-white dark:text-slate-950 font-bold shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">{swarm?.name || 'AI Swarm Stock Management'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                  {txt.activeSwarmBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{txt.agentsOnlineSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Custom Session Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />
                <span className="truncate max-w-[140px]">
                  {sessions.find(s => s.id === activeSessionId)?.title || 'Stock Chat'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSessionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSessionDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl p-1 space-y-1">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{txt.convoHistory}</span>
                    <button
                      type="button"
                      onClick={() => { handleCreateNewSession(); setIsSessionDropdownOpen(false); }}
                      className="px-2 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{txt.newChatBtn}</span>
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-1">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setActiveSessionId(s.id); setIsSessionDropdownOpen(false); }}
                        className={`w-full text-left p-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          s.id === activeSessionId
                            ? 'bg-orange-50 dark:bg-emerald-950/60 text-orange-700 dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{s.title || 'Stock Chat'}</span>
                        {s.id === activeSessionId && <Check className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inline Language Selector Pill */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-[10px] font-bold">
              {(['id', 'en', 'zh'] as const).map((langCode) => (
                <button
                  key={langCode}
                  type="button"
                  onClick={() => setLanguage(langCode)}
                  className={`px-2 py-0.5 rounded-lg transition-all uppercase cursor-pointer ${
                    language === langCode
                      ? 'bg-orange-500 dark:bg-emerald-500 text-white font-black shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {langCode}
                </button>
              ))}
            </div>

            {/* Maximize / Restore Window Button */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
              title={isMaximized ? 'Kecilkan Tampilan Chat' : 'Perbesar Tampilan Chat (Fullscreen)'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4 text-orange-500 dark:text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-slate-400 hover:text-orange-500 dark:hover:text-emerald-400" />}
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">{txt.stockHealthScore}</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">92/100</span>
            </div>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {quickActions.map((qa, idx) => {
            const IconComp = qa.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(qa.prompt)}
                disabled={sending}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-emerald-300 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <IconComp className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />
                <span>{qa.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-emerald-950/40 border border-orange-200 dark:border-emerald-500/30 flex items-center justify-center text-orange-600 dark:text-emerald-400 mb-4 shadow-md">
                <Box className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">{txt.emptyTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6 font-medium">
                {txt.emptyDesc}
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {quickActions.slice(0, 4).map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qa.prompt)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-emerald-500/40 text-left text-xs transition-all group cursor-pointer shadow-xs"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                      <qa.icon className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />
                      {qa.label}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{qa.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender_type === 'USER';
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-emerald-500/20 border border-orange-200 dark:border-emerald-500/40 flex items-center justify-center text-orange-600 dark:text-emerald-400 shrink-0 mt-1">
                      <Zap className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                    isUser
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-md font-medium'
                      : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between text-[11px] opacity-80 font-semibold border-b border-slate-200/50 dark:border-slate-800/80 pb-2">
                      <span>{msg.sender_name || (isUser ? txt.ownerName : 'Stock Swarm')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, msg.id)}
                          className="hover:text-orange-600 dark:hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                          title="Salin Dialog"
                        >
                          {copiedMsgId === msg.id ? (
                            <span className="flex items-center gap-1 text-[10px] text-orange-600 dark:text-emerald-300 font-bold">
                              <Check className="w-3 h-3 text-orange-600 dark:text-emerald-300" /> Disalin!
                            </span>
                          ) : (
                            <Copy className="w-3 h-3 opacity-70 hover:opacity-100" />
                          )}
                        </button>
                        <span>{new Date(msg.created_at).toLocaleTimeString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Grounded Tags */}
                    {msg.structured_payload?.groundedItems && Array.isArray(msg.structured_payload.groundedItems) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.structured_payload.groundedItems.map((gi: any, idx: number) => {
                          let badgeBg = 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30';
                          if (gi.type === 'FORECAST') badgeBg = 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30';
                          if (gi.type === 'RECOMMENDATION') badgeBg = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
                          if (gi.type === 'ASSUMPTION') badgeBg = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';

                          return (
                            <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${badgeBg}`} title={gi.detail}>
                              {gi.type}: {gi.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Structured Data Table */}
                    {msg.structured_payload?.tableData && Array.isArray(msg.structured_payload.tableData) && msg.structured_payload.tableData.length > 0 && (
                      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-2 shadow-xs">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-wider font-extrabold">
                            <tr>
                              <th className="p-2">Produk / SKU</th>
                              <th className="p-2 text-right">Stok Saat Ini</th>
                              <th className="p-2 text-right">Terjual</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {msg.structured_payload.tableData.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                                  {item.name || item.productName || item.sku}
                                  <div className="text-[9px] text-slate-400">{item.sku}</div>
                                </td>
                                <td className="p-2 text-right font-mono font-black text-amber-600 dark:text-amber-400">{item.stock ?? item.currentStock ?? 0}</td>
                                <td className="p-2 text-right font-mono text-slate-500 dark:text-slate-400">{item.sold ?? item.unitsSoldTotal ?? 0}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                    (item.stock === 0 || item.status === 'HABIS')
                                      ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                                  }`}>
                                    {item.status || 'KRITIS'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Mutation Confirmation Card */}
                    {msg.requires_confirmation && msg.pending_mutation && (
                      <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>{txt.confirmTitle}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300/80 font-medium">
                          {msg.pending_mutation.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleConfirmMutation(msg)}
                            disabled={confirmingMutation}
                            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{confirmingMutation ? txt.executing : txt.confirmExec}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 flex items-center justify-center text-orange-700 dark:text-slate-300 shrink-0 mt-1 font-bold text-xs">
                      U
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={txt.inputPlaceholder}
              disabled={sending}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 dark:focus:border-emerald-500/50 transition-colors font-medium shadow-xs"
            />
            <button
              type="submit"
              disabled={sending || !inputPrompt.trim()}
              className="px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>{sending ? txt.processing : txt.sendBtn}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ── COLUMN 3: LIVE SWARM ACTIVITY PANEL (RIGHT) ── */}
      <div className="w-80 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{txt.swarmActivityTitle}</h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold">
            {txt.liveTelemetryBadge}
          </span>
        </div>

        {/* Active Agents Roster */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{txt.agentRosterTitle}</h4>
          <div className="space-y-2">
            {[
              { role: 'COORDINATOR', name: 'Inventory Swarm Coordinator' },
              { role: 'INVENTORY_MONITOR', name: 'Stock Monitor Agent' },
              { role: 'STOCK_ANALYST', name: 'Stock Performance Analyst' },
              { role: 'REORDER_ADVISOR', name: 'Reorder Optimization Advisor' },
              { role: 'DEMAND_FORECASTER', name: 'Demand Forecast Agent' },
            ].map((ag, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[170px]">{ag.name}</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400">{ag.role.slice(0, 5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Swarm Execution Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{txt.recentExecTitle}</h4>
          {swarmActivity.length === 0 ? (
            <div className="text-center p-6 text-xs text-slate-400">
              {txt.noExecLogs}
            </div>
          ) : (
            swarmActivity.map((act, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs shadow-xs">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-orange-600 dark:text-emerald-400">{act.agentRole}</span>
                  <span className="font-mono text-slate-400">{act.latencyMs}ms</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{act.summary}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-900">
                  <span>Status: <strong className="text-emerald-600 dark:text-emerald-400">{act.status}</strong></span>
                  <span className="font-mono font-bold text-slate-500">READ_ONLY</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 justify-center font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />
          <span>{txt.securityBadge}</span>
        </div>
      </div>
    </div>
  );
};
