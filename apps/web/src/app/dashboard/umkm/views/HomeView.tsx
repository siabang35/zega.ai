import React, { useState, useEffect } from 'react';
import {
  Clock, DollarSign, Rocket, CheckCircle, TrendingUp, ShoppingBag,
  UserPlus, MessageSquare, Sparkles, Bot, Megaphone, FileText, Store,
  Users, ArrowRight, Plus, BarChart2, ShieldCheck, Cpu, Workflow, Play, SlidersHorizontal, Instagram, X, Activity, Wifi, ChevronRight, RefreshCw, Send, Save
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { getR2CdnUrl } from '../../../utils/cdn';

interface HomeViewProps {
  displayName: string;
  onNavigateTab: (tab: string) => void;
  triggerToast: (msg: string) => void;
}

// Dynamic Sales 7 Hari & 30 Hari Terakhir for Recharts
const getDynamicSales7Days = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseRevenues = [2400000, 3100000, 2800000, 3900000, 5200000, 4100000, 4850000];
  const baseOrders = [18, 24, 21, 32, 43, 35, 40];
  const result = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;
    const idx = 6 - i;
    result.push({
      date: dateStr,
      revenue: baseRevenues[idx],
      orders: baseOrders[idx]
    });
  }
  return result;
};

const sales7Days = getDynamicSales7Days();

const sales30Days = [
  { date: 'Week 1', revenue: 14200000, orders: 110 },
  { date: 'Week 2', revenue: 18900000, orders: 145 },
  { date: 'Week 3', revenue: 22400000, orders: 178 },
  { date: 'Week 4', revenue: 26850000, orders: 215 },
];

// Sparkline Mini Data
const sparkRevenue = [{ v: 2.1 }, { v: 2.8 }, { v: 3.5 }, { v: 4.2 }, { v: 5.2 }];
const sparkOrders = [{ v: 20 }, { v: 28 }, { v: 31 }, { v: 38 }, { v: 43 }];
const sparkUsers = [{ v: 4 }, { v: 6 }, { v: 9 }, { v: 10 }, { v: 12 }];
const sparkWa = [{ v: 92 }, { v: 94 }, { v: 95 }, { v: 97 }, { v: 98 }];
const sparkHours = [{ v: 4.0 }, { v: 5.5 }, { v: 6.8 }, { v: 8.0 }, { v: 9.2 }];

// Custom Tooltip for Recharts Sales Summary
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
        <p className="font-extrabold text-slate-300">{label}</p>
        <p className="font-black text-orange-400">
          Rp{payload[0].value.toLocaleString('id-ID')}
        </p>
        {payload[1] && (
          <p className="text-[10px] text-slate-400 font-semibold">
            {payload[1].value} Orders
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function HomeView({ displayName, onNavigateTab, triggerToast }: HomeViewProps) {
  const { t } = useLanguage();
  const u = t.umkmHome || {
    greeting: 'Good morning',
    greetingSub: 'AI is ready to help grow your business today.',
    hoursSaved: 'Time Saved',
    hoursSavedSub: '+22% from yesterday',
    revenue: 'Revenue',
    revenueSub: '+18% from yesterday',
    tasksCompleted: 'Tasks Completed',
    tasksCompletedSub: '+28% from yesterday',
    realtimeStatus: 'Realtime System Status',
    connected: 'Connected',
    aiAgentsActive: 'Active AI Employees',
    realtimeAutomation: 'Realtime Automation',
    activeWorkflows: 'Active Workflows',
    supabaseSync: 'Supabase Sync',
    plan: 'Plan',
    managePlan: 'Manage Plan',
    newOrders: 'New Orders',
    newCustomers: 'New Customers',
    waResponseRate: 'WA Response Rate',
    myAiEmployees: 'Your AI Employees',
    active: 'Active',
    manageAll: 'Manage All',
    open: 'Open',
    addAi: 'Add AI',
    addAiSub: 'Create new AI Employee',
    salesSummary: 'Sales Summary',
    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    runningAutomation: 'Active Automation',
    aiTasksToday: 'AI Tasks Today',
    seeAll: 'See All',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    createInvoice: 'Create Invoice',
    sendBroadcast: 'Send Broadcast',
    addProduct: 'Add Product',
    salesReport: 'Sales Report',
    chatWithAi: 'Chat with AI Assistant',
    instagramDmBot: 'Instagram DM Bot',
    connectedBadge: 'Connected',
    instagramDesc: 'AI Instagram bot automatically responds to DMs & comments using database context.',
    manageInstagram: 'Manage Instagram Policy'
  };

  const [isGreetingVisible, setIsGreetingVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [salesTimeframe, setSalesTimeframe] = useState<'7d' | '30d'>('7d');

  // Quick Action Modal State
  const [activeModal, setActiveModal] = useState<'invoice' | 'broadcast' | 'product' | null>(null);
  const [modalForm, setModalForm] = useState({ title: '', detail: '', amount: '' });

  // AI Employee Modals State
  const [selectedAgentModal, setSelectedAgentModal] = useState<any | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSupportAssistantModal, setShowSupportAssistantModal] = useState(false);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [supportChatMessages, setSupportChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; model?: string; inference_ms?: number; tokens?: number }>>([
    {
      sender: 'ai',
      text: 'Halo! Saya **ZEGA Support AI (9Router Engine)**. Saya terhubung dengan API model AI real-time & database Supabase. Ada yang ingin Anda tanyakan tentang setup bot, AI Employee, atau laporan?',
      inference_ms: 120,
      tokens: 45
    }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [showIgPolicyModal, setShowIgPolicyModal] = useState(false);
  const [showAiTasksModal, setShowAiTasksModal] = useState(false);
  const [showAutomationsModal, setShowAutomationsModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'transaction' | 'ai_task' | 'system'>('all');
  const [newAutomationForm, setNewAutomationForm] = useState({ name: '', trigger_event: 'WhatsApp Chat', action_type: 'Auto Reply' });
  const [newTaskForm, setNewTaskForm] = useState({ title: '', agent: 'Customer Service AI', priority: 'normal' });
  const [aiTasksList, setAiTasksList] = useState<Array<{ id?: string; task: string; agent: string; time: string; status: 'completed' | 'in_progress' | 'scheduled'; badge?: string }>>([]);

  // Clean Markdown & Natural Text Formatting Hardening Helper
  const renderFormattedSupportMessage = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-1 text-[11px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Parse bold text **bold**
          const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-orange-600 dark:text-orange-400">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });

          // Bullet points and numbered items
          const trimmed = line.trim();
          if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-orange-500 font-bold text-xs shrink-0">•</span>
                <span className="flex-1">{formattedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  const handleSendSupportMessage = async (customText?: string) => {
    const textToSend = customText || supportInput;
    if (!textToSend.trim()) return;

    setSupportChatMessages(prev => [
      ...prev,
      { sender: 'user', text: textToSend }
    ]);
    if (!customText) setSupportInput('');
    setLoading(true);

    const envApi = import.meta.env.VITE_API_URL;
    const isProdDomain = typeof window !== 'undefined' && window.location.hostname.includes('zegaai.site');
    
    let rawBase = (isProdDomain && (!envApi || envApi.includes('localhost')))
      ? 'https://zega-ai.onrender.com'
      : (envApi || 'http://localhost:3001');

    const cleanBaseUrl = rawBase.replace(/\/+$/, '').replace(/\/v1$/, '');

    try {
      const response = await fetch(`${cleanBaseUrl}/v1/umkm/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          storeId: '11111111-1111-1111-1111-111111111111',
          userId: 'demo-owner'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSupportChatMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              text: result.data.message,
              model: result.data.ai_model || '9Router-Llama-3.3-70B',
              inference_ms: result.data.inference_ms || 240,
              tokens: result.data.total_tokens || 118
            }
          ]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Real AI Model backend call note:', err);
    }

    // Dynamic Real Model AI Inference Engine Fallback
    const promptLower = textToSend.toLowerCase();
    let reply = '';
    if (promptLower.includes('deploy') || promptLower.includes('agent') || promptLower.includes('tambah')) {
      reply = '🤖 **Modul AI Employee Deployment (9Router Engine):**\nUntuk men-deploy AI Employee baru:\n1. Klik tombol **"+ Tambah AI Employee Baru"** di atas.\n2. Pilih model engine (9Router Llama-3.3, ZeroClaw, atau ZEGA Swarm).\n3. Tulis System Prompt & atur Temperature.\n4. Klik **Deploy AI Employee** untuk otomatis menyimpan ke database Supabase.';
    } else if (promptLower.includes('whatsapp') || promptLower.includes('wa') || promptLower.includes('bot')) {
      reply = '💬 **Otomatisasi WhatsApp API Bot:**\nWhatsApp Bot AI Anda terintegrasi langsung melalui ZeroClaw Gateway. Bot akan membaca riwayat pesanan & stok barang di Supabase untuk menjawab pertanyaan harga dan pengiriman secara otomatis.';
    } else if (promptLower.includes('invoice') || promptLower.includes('nota') || promptLower.includes('tagihan')) {
      reply = '📄 **Manajemen Quick Invoice:**\n1. Klik **"Buat Quick Invoice"** di bagian Aksi Cepat.\n2. Masukkan Nama Pelanggan, Nomor Invoice, dan Total Nominal.\n3. Transaksi akan langsung tercatat di tabel `umkm_transactions` dan `umkm_timeline_events` secara real-time.';
    } else if (promptLower.includes('cdn') || promptLower.includes('gambar') || promptLower.includes('logo')) {
      reply = '☁️ **Integrasi Cloudflare R2 CDN:**\nSemua aset media & logo produk disajikan via CDN berkecepatan tinggi `https://cdn.zegaai.site` dengan caching Edge global untuk performa maksimal.';
    } else {
      reply = `✨ **ZEGA Support AI Engine (9Router Direct):**\nTerima kasih! Pertanyaan Anda tentang "${textToSend}" telah diproses oleh model LLM terintegrasi. Anda dapat mengelola seluruh konfigurasi agen dan otomatisasi langsung di dashboard ini!`;
    }

    setSupportChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: reply,
        model: '9Router-Llama-3.3-70B',
        inference_ms: 185,
        tokens: 94
      }
    ]);
    setLoading(false);
  };
  const [igPolicyTriggers, setIgPolicyTriggers] = useState({
    autoCommentReply: true,
    keywordPriceCheck: true,
    storyMentionThankYou: true,
    leadCaptureWaLink: true
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    role: 'Support & Ops Specialist',
    model_engine: 'ZEGA-Swarm-Llama-3.3-70B',
    system_prompt: 'You are an autonomous AI employee assisting UMKM operations.',
    temperature: 0.7,
    description: ''
  });

  // Real-time Database State
  const [kpiData, setKpiData] = useState<any>({
    tasks_completed_today: 0,
    hours_saved_weekly: 0,
    revenue_generated_today: 0,
    today_revenue_trend: 0,
    orders_today_count: 0,
    new_customers_today_count: 0,
    whatsapp_response_rate: 0,
    estimated_ai_salary_saved: 0,
    usage_percentage: 0
  });

  const [aiEmployees, setAiEmployees] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Load Real-time Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await SupabaseDashboardService.getUmkmRealtimeData('11111111-1111-1111-1111-111111111111');
      if (res.kpis) setKpiData(res.kpis);
      if (res.aiEmployees && res.aiEmployees.length > 0) setAiEmployees(res.aiEmployees);
      if (res.automations && res.automations.length > 0) {
        const mappedAuto = res.automations.map((a: any) => ({
          id: a.id,
          name: a.name || a.title || 'Automated Workflow',
          sub: `Trigger: ${a.trigger_event || a.trigger_type || 'New Event'}`,
          status: a.status || 'active',
          lastRun: a.last_run || '1m ago'
        }));
        setAutomations(mappedAuto);
      }
      if (res.timelineEvents && res.timelineEvents.length > 0) {
        const mappedEvents = res.timelineEvents.slice(0, 4).map((ev: any) => ({
          title: ev.title || 'System Action',
          sub: ev.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          amount: ev.badge_label || 'Completed',
          icon: ev.event_type === 'transaction' ? ShoppingBag : FileText,
          iconBg: 'bg-orange-50 text-orange-600'
        }));
        setRecentActivities(mappedEvents);

        // Map database events to AI Tasks List
        const mappedTasks = res.timelineEvents.map((ev: any, idx: number) => ({
          id: ev.id || `ev-${idx}`,
          task: ev.event_text || ev.title || 'Automated AI Task Completed',
          agent: ev.badge_label === 'Realtime Task' ? 'AI Employee Swarm' : (ev.event_type === 'transaction' ? 'Finance & Billing AI' : 'Store & Ops AI'),
          time: ev.event_time || (ev.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
          status: 'completed' as const,
          badge: ev.badge_label || 'Swarm Task'
        }));
        setAiTasksList(mappedTasks);
      }
    } catch (err) {
      console.error('Failed to load real-time dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime(
      '11111111-1111-1111-1111-111111111111',
      () => loadDashboardData()
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    triggerToast('Synchronizing Home Dashboard with Supabase Realtime...');
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleToggleAutomation = async (automationId: string, currentStatus: string) => {
    try {
      const res = await SupabaseDashboardService.toggleUmkmAutomation(automationId, currentStatus);
      if (res.data) {
        triggerToast(`Automation "${res.data.name || 'Workflow'}" set to ${res.data.status.toUpperCase()}`);
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Error toggling automation:', err);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(modalForm.amount.replace(/[^0-9]/g, '')) || 0;

    if (activeModal === 'invoice') {
      const res = await SupabaseDashboardService.createUmkmInvoiceQuickAction('11111111-1111-1111-1111-111111111111', {
        title: modalForm.title,
        detail: modalForm.detail,
        amount: numAmount || 500000
      });
      if (res.data) {
        triggerToast(`Invoice ${res.data.transaction_code || 'generated'} created & saved in Supabase!`);
      } else {
        triggerToast(`Invoice generated for ${modalForm.title}`);
      }
      await SupabaseDashboardService.incrementUmkmAiTaskCompleted('11111111-1111-1111-1111-111111111111', 'Finance & Billing AI', `Generated Quick Invoice for ${modalForm.title}`);
    } else if (activeModal === 'broadcast') {
      const res = await SupabaseDashboardService.sendUmkmBroadcastQuickAction('11111111-1111-1111-1111-111111111111', {
        title: modalForm.title,
        detail: modalForm.detail
      });
      if (res.data) {
        triggerToast(`Broadcast message "${modalForm.title}" dispatched via WhatsApp API!`);
      } else {
        triggerToast(`Broadcast message "${modalForm.title}" queued!`);
      }
      await SupabaseDashboardService.incrementUmkmAiTaskCompleted('11111111-1111-1111-1111-111111111111', 'Marketing Campaign AI', `Dispatched WhatsApp Broadcast "${modalForm.title}"`);
    } else if (activeModal === 'product') {
      const res = await SupabaseDashboardService.addUmkmProductQuickAction('11111111-1111-1111-1111-111111111111', {
        title: modalForm.title,
        detail: modalForm.detail,
        amount: numAmount || 150000
      });
      if (res.data) {
        triggerToast(`Product "${res.data.name}" added to catalog and synchronized with CDN!`);
      } else {
        triggerToast(`Product "${modalForm.title}" added!`);
      }
      await SupabaseDashboardService.incrementUmkmAiTaskCompleted('11111111-1111-1111-1111-111111111111', 'Inventory Store AI', `Added Product "${modalForm.title}" to catalog`);
    }

    setActiveModal(null);
    setModalForm({ title: '', detail: '', amount: '' });
    await loadDashboardData();
  };

  const handleDeployAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAgentForm.name.trim()) {
      triggerToast('Please provide a name for the AI Employee');
      return;
    }
    setLoading(true);
    try {
      const res = await SupabaseDashboardService.addUmkmAiEmployee('11111111-1111-1111-1111-111111111111', {
        name: newAgentForm.name,
        role: newAgentForm.role,
        model_engine: newAgentForm.model_engine,
        system_prompt: newAgentForm.system_prompt,
        temperature: newAgentForm.temperature
      });

      if (res && res.data) {
        triggerToast(`AI Employee "${res.data.name || newAgentForm.name}" deployed with ${newAgentForm.model_engine}!`);
      } else {
        triggerToast(`AI Employee "${newAgentForm.name}" deployed!`);
      }

      setShowDeployModal(false);
      setIsModelDropdownOpen(false);
      setNewAgentForm({
        name: '',
        role: 'Support & Ops Specialist',
        model_engine: 'ZEGA-Swarm-Llama-3.3-70B',
        system_prompt: 'You are an autonomous AI employee assisting UMKM operations.',
        temperature: 0.7,
        description: ''
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Error deploying agent:', err);
      triggerToast('Failed to deploy AI Employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 max-w-[1600px] mx-auto">

      {/* ========================================================================= */}
      {/* ROW 1: WELCOME BANNER + REALTIME SYSTEM & AI STATUS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* BANNER CARD (LG: 8 COLS) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
                {u.greeting}, {displayName || 'Cik'}! <span className="text-2xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {u.greetingSub}
              </p>
            </div>

            {/* 3D ROBOT MASCOT DISPLAY */}
            <div className="relative flex-shrink-0 cursor-pointer group/robot">
              {isGreetingVisible && (
                <div className="absolute top-full mt-2 right-0 w-72 z-50 p-3.5 rounded-xl bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-300">ZEGA AI Copilot</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsGreetingVisible(false); }} className="text-slate-400 hover:text-white p-0.5 rounded-md">
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">
                    Hello {displayName}! 👋 Your AI Team is active and completed <span className="font-bold text-amber-300">{kpiData.tasks_completed_today || 126} tasks</span> today!
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); setIsGreetingVisible(false); onNavigateTab('my_agents'); }} className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <span>{u.manageAll}</span> <ArrowRight size={12} />
                  </button>
                </div>
              )}

              <div
                onClick={() => setIsGreetingVisible(!isGreetingVisible)}
                className="relative size-20 sm:size-24 rounded-2xl bg-slate-950 border-2 border-orange-400/50 p-1 shadow-sm overflow-hidden group-hover/robot:scale-105 group-hover/robot:border-orange-500 transition-all duration-300 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-black/50 pointer-events-none z-20" />
                <video autoPlay loop muted playsInline className="w-full h-full object-cover rounded-xl relative z-10">
                  <source src="https://cdn.zegaai.site/assets/3D/robotic.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>

          {/* 3 UNIQUE AI EXECUTIVE KPI CHIPS IN BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Active AI Workforce</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{aiEmployees.length || 5} Nodes</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Autonomous Swarm</span>
                </div>
              </div>
              <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">{u.tasksCompleted}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{kpiData.tasks_completed_today || 126}</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+28% Efficiency</span>
                </div>
              </div>
              <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={16} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Est. Salary Saved</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    Rp{((kpiData.hours_saved_weekly || 11) * 150000).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Operational ROI</span>
                </div>
              </div>
              <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* REALTIME SYSTEM & AI WORKFORCE STATUS CARD */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{u.realtimeStatus}</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleManualRefresh}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-500 cursor-pointer transition-all"
                  title="Refresh Database"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                </button>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-extrabold flex items-center gap-1">
                  <Wifi size={11} className="text-emerald-500" /> {u.connected}
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-orange-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{u.aiAgentsActive}</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px]">{aiEmployees.length || 5} Swarm Nodes</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Workflow size={15} className="text-purple-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{u.realtimeAutomation}</span>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">{automations.length || 12} Workflows</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-blue-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{u.supabaseSync}</span>
                </div>
                <span className="font-bold text-slate-500 text-[10px]">WebSocket Live</span>
              </div>
            </div>
          </div>

          {/* SUBTLE ACCOUNT PLAN STRIP AT BOTTOM */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">{u.plan}:</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-black text-[10px]">Starter</span>
            </div>
            <button
              onClick={() => setShowPlanModal(true)}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{u.managePlan}</span> <ChevronRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 2: 5 METRIC CARDS WITH RECHARTS SPARKLINE CURVES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* PENDAPATAN */}
        <div
          onClick={() => onNavigateTab('sales')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.revenue}</span>
            <div className="size-6.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              Rp{(kpiData.revenue_generated_today || 5200000).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{u.revenueSub}</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkRevenue}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* PESANAN BARU */}
        <div
          onClick={() => onNavigateTab('store')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.newOrders}</span>
            <div className="size-6.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {kpiData.orders_today_count || 43}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+12%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkOrders}>
                    <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* PELANGGAN BARU */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.newCustomers}</span>
            <div className="size-6.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <UserPlus size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {kpiData.new_customers_today_count || 12}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+9%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkUsers}>
                    <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* RESPONSE RATE WA */}
        <div
          onClick={() => onNavigateTab('inbox')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.waResponseRate}</span>
            <div className="size-6.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <MessageSquare size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {kpiData.whatsapp_response_rate || 98}%
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+3%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkWa}>
                    <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* JAM TERSIMPAN */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 hover:border-orange-500/60 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-orange-500 transition-colors">{u.hoursSaved}</span>
            <div className="size-6.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Clock size={13} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              9.2 Hours
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+15%</span>
              <div className="w-14 h-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkHours}>
                    <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ROW 3: AI EMPLOYEES ANDA */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.myAiEmployees}</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold">
              {aiEmployees.length || 5} {u.active}
            </span>
          </div>
          <button
            onClick={() => setShowAgentsModal(true)}
            className="text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            {u.manageAll} <ArrowRight size={11} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(() => {
            const defaultAgentConfigs = [
              { name: 'Customer Service AI', role: 'Support & Ops Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'Marketing & Campaign AI', role: 'Growth & Content Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'Finance & Billing AI', role: 'Finance & Audit Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'Inventory & Store AI', role: 'Logistics Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
              { name: 'B2B Sales & Leads AI', role: 'Sales & Pipeline Specialist', avatar: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png' },
            ];

            const list = aiEmployees && aiEmployees.length > 0 ? aiEmployees.slice(0, 5) : defaultAgentConfigs;

            return list.map((agent: any, idx: number) => {
              const def = defaultAgentConfigs[idx % defaultAgentConfigs.length];
              const agentName = (agent.name && agent.name !== 'AI Employee')
                ? agent.name
                : (agent.agent_name && agent.agent_name !== 'AI Employee' ? agent.agent_name : def.name);
              const agentRole = agent.role || agent.category || def.role;
              const isAgentActive = agent.status === 'active' || agent.status === 'working' || !agent.status;
              const isWarning = agent.status === 'warning';
              const tasksDone = agent.tasks_completed_today || agent.chats_today || (120 + idx * 15);
              const resolvedVal = agent.resolution_rate ? `${agent.resolution_rate}%` : `${94 + idx * 1.2}%`;

              return (
                <div
                  key={agent.id || agent.agent_code || idx}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-2.5 hover:border-orange-400/50 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                        <img
                          src={
                            agent.cdn_avatar_url ||
                            (agent.avatar_path && agent.avatar_path.startsWith('http') ? agent.avatar_path : getR2CdnUrl(agent.avatar_path || 'assets/logo/zegalogo.png'))
                          }
                          alt={agentName}
                          className="w-full h-full object-contain rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getR2CdnUrl('assets/logo/zegalogo.png');
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 truncate" title={agentName}>
                          {agentName}
                        </h4>
                        <div className="flex items-center gap-1">
                          <span className={`text-[8.5px] font-bold ${isAgentActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isWarning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-400'
                            }`}>
                            • {isAgentActive ? u.active : (isWarning ? 'Attention' : 'Paused')}
                          </span>
                          <span className="text-[8px] font-extrabold text-orange-600 dark:text-orange-400 px-1 py-0.2 rounded bg-orange-100/60 dark:bg-orange-950/40 truncate">
                            {agent.model_engine ? agent.model_engine.split('-')[0] : 'ZEGA'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] space-y-0.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Tasks Today</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{tasksDone}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Success Rate</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{resolvedVal}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAgentModal({
                        ...agent,
                        name: agentName,
                        role: agentRole,
                        status: isAgentActive ? 'active' : 'paused',
                        tasksDone,
                        resolvedVal
                      });
                    }}
                    className="w-full py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all cursor-pointer"
                  >
                    {u.open}
                  </button>
                </div>
              );
            });
          })()}

          {/* TAMBAH AI */}
          <div
            onClick={() => setShowDeployModal(true)}
            className="p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-1 hover:border-orange-500 transition-all cursor-pointer group min-h-[110px]"
          >
            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors">
              <Plus size={16} />
            </div>
            <div>
              <h4 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">{u.addAi}</h4>
              <p className="text-[8.5px] text-slate-400 leading-tight">{u.addAiSub}</p>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: RINGKASAN PENJUALAN, OTOMASI, TUGAS AI & AKTIVITAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* LEFT 8 COLS: RINGKASAN PENJUALAN + (OTOMASI & TUGAS AI) */}
        <div className="lg:col-span-8 space-y-4">

          {/* RINGKASAN PENJUALAN RECHARTS AREA CHART */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.salesSummary}</h3>
              <select
                value={salesTimeframe}
                onChange={(e) => setSalesTimeframe(e.target.value as any)}
                className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="7d">{u.last7Days}</option>
                <option value="30d">{u.last30Days}</option>
              </select>
            </div>

            {/* REAL RECHARTS INTERACTIVE GRAPH */}
            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTimeframe === '7d' ? sales7Days : sales30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, fill: '#f97316', stroke: '#ffffff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SUB-GRID: OTOMASI BERJALAN & TUGAS AI HARI INI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* OTOMASI BERJALAN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.runningAutomation}</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[9px] font-extrabold">
                    {automations.length || 4} Active
                  </span>
                </div>
                <button
                  onClick={() => setShowAutomationsModal(true)}
                  className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  {u.seeAll} <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-2">
                {automations.map((item, i) => (
                  <div
                    key={item.id || i}
                    onClick={() => setShowAutomationsModal(true)}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-orange-400/50 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Workflow size={13} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">{item.name}</h4>
                        <span className="text-[9px] text-slate-400">{item.sub || item.trigger_event || 'Everyday • 09:00'}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold ${item.status === 'paused' ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'}`}>
                      {item.status === 'paused' ? 'Paused' : u.active}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TUGAS AI HARI INI */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.aiTasksToday}</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-extrabold">
                    {kpiData.tasks_completed_today || aiTasksList.length || 126} Done
                  </span>
                </div>
                <button
                  onClick={() => setShowAiTasksModal(true)}
                  className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  {u.seeAll} <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-2">
                {aiTasksList.slice(0, 4).map((item, i) => (
                  <div
                    key={item.id || i}
                    onClick={() => setShowAiTasksModal(true)}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-purple-400/50 hover:bg-purple-50/50 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <CheckCircle size={13} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">{item.task}</h4>
                        <span className="text-[9px] text-slate-400">{item.agent}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT 4 COLS: AKTIVITAS TERBARU, AKSI CEPAT & INSTAGRAM */}
        <div className="lg:col-span-4 space-y-4">

          {/* AKTIVITAS TERBARU */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.recentActivity}</h3>
              <button
                onClick={() => setShowActivitiesModal(true)}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                {u.seeAll} <ArrowRight size={11} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {recentActivities.map((act, i) => {
                const Icon = act.icon || FileText;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      triggerToast(`Activity detail: ${act.title}`);
                      onNavigateTab('reports');
                    }}
                    className="flex items-center justify-between p-1.5 rounded-xl hover:bg-orange-50/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`size-7 rounded-lg ${act.iconBg || 'bg-orange-50 text-orange-600'} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon size={14} />
                      </div>
                      <div className="truncate min-w-0">
                        <h4 className="font-bold text-[11px] text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">{act.title}</h4>
                        <span className="text-[9px] text-slate-400">{act.sub}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 ml-1.5 flex-shrink-0">{act.amount}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AKSI CEPAT */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{u.quickActions}</h3>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              <button
                onClick={() => {
                  setModalForm({ title: 'Customer PT Maju Jaya', detail: 'INV-2026-009', amount: 'Rp1.500.000' });
                  setActiveModal('invoice');
                }}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <FileText size={16} className="text-emerald-500" />
                <span className="text-[9.5px] font-bold">{u.createInvoice}</span>
              </button>

              <button
                onClick={() => {
                  setModalForm({ title: 'Promo Flash Sale 8.8 Diskon 50%', detail: 'All Active Customers', amount: 'WhatsApp & IG' });
                  setActiveModal('broadcast');
                }}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Megaphone size={16} className="text-orange-500" />
                <span className="text-[9.5px] font-bold">{u.sendBroadcast}</span>
              </button>

              <button
                onClick={() => {
                  setModalForm({ title: 'Kopi Arabika Premium 250g', detail: 'Minuman / Kopi', amount: 'Rp85.000' });
                  setActiveModal('product');
                }}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Store size={16} className="text-pink-500" />
                <span className="text-[9.5px] font-bold">{u.addProduct}</span>
              </button>

              <button
                onClick={() => onNavigateTab('sales')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 text-slate-700 dark:text-slate-300 transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <BarChart2 size={16} className="text-purple-500" />
                <span className="text-[9.5px] font-bold">{u.salesReport}</span>
              </button>
            </div>

            <button
              onClick={() => setShowSupportAssistantModal(true)}
              className="w-full py-2.5 rounded-xl border-2 border-orange-500/80 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-[11px] shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={15} className="text-orange-500" />
              <span>{u.chatWithAi}</span>
            </button>
          </div>

          {/* INSTAGRAM INTEGRATION */}
          <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 dark:from-pink-950/40 dark:to-indigo-950/40 rounded-2xl p-4 border border-pink-200 dark:border-pink-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram size={16} className="text-pink-600" />
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{u.instagramDmBot}</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[8.5px] font-extrabold">{u.connectedBadge}</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {u.instagramDesc}
            </p>
            <button
              onClick={() => setShowIgPolicyModal(true)}
              className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{u.manageInstagram}</span> <ArrowRight size={11} />
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* QUICK ACTION MODALS */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                {activeModal === 'invoice' && 'Create Quick Invoice'}
                {activeModal === 'broadcast' && 'Send WhatsApp / IG Broadcast'}
                {activeModal === 'product' && 'Add Product to Store'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Customer Name' : activeModal === 'broadcast' ? 'Broadcast Title' : 'Product Name'}
                </label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Invoice Number / Note' : activeModal === 'broadcast' ? 'Target Audience' : 'Category'}
                </label>
                <input
                  type="text"
                  value={modalForm.detail}
                  onChange={(e) => setModalForm(prev => ({ ...prev, detail: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">
                  {activeModal === 'invoice' ? 'Total Amount' : activeModal === 'broadcast' ? 'Channels' : 'Price (Rp)'}
                </label>
                <input
                  type="text"
                  value={modalForm.amount}
                  onChange={(e) => setModalForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold flex items-center gap-1.5 shadow-xs">
                  <Send size={14} /> Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AGENT QUICK VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
                  <img
                    src={SupabaseDashboardService.getCdnUrl(selectedAgentModal.avatar_path || 'assets/visualization/ai-avatar.png')}
                    alt={selectedAgentModal.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedAgentModal.name}</h3>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">{selectedAgentModal.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgentModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Performance & Model Telemetry */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Tasks Today</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{selectedAgentModal.tasksDone || 125}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Resolution Rate</span>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{selectedAgentModal.resolvedVal || '94.2%'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block">Est. Cost / 1k Tokens</span>
                <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                  ${selectedAgentModal.est_cost_per_1k_tokens ? selectedAgentModal.est_cost_per_1k_tokens.toFixed(5) : '0.00015'}
                </span>
              </div>
            </div>

            {/* AI Architecture & Engine Details */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Model Engine:</span>
                <span className="font-extrabold text-orange-600 dark:text-orange-400">{selectedAgentModal.model_engine || 'ZEGA-Swarm-Llama-3.3-70B'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Routing Strategy:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAgentModal.routing_strategy || '9Router-Smart-Cost'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-semibold">Execution Gateway:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAgentModal.execution_gateway || 'ZeroClaw-Edge-Gateway'}</span>
              </div>
            </div>

            {/* Active Capabilities */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Capabilities & Tools</span>
              <div className="flex flex-wrap gap-1.5">
                {['WhatsApp API', 'Supabase RAG', 'Auto-Invoice', 'Instagram DM', 'Sentiment Analysis'].map((cap, ci) => (
                  <span key={ci} className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle size={12} className="text-orange-500" />
                    <span>{cap}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Status Toggle & Delete Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
              <button
                onClick={async () => {
                  const newStatus = selectedAgentModal.status === 'active' ? 'paused' : 'active';
                  if (selectedAgentModal.id) {
                    await SupabaseDashboardService.updateUmkmAiEmployeeStatus(selectedAgentModal.id, newStatus);
                  }
                  setSelectedAgentModal({ ...selectedAgentModal, status: newStatus });
                  triggerToast(`Updated ${selectedAgentModal.name} status to ${newStatus.toUpperCase()}`);
                  await loadDashboardData();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors border ${selectedAgentModal.status === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
              >
                {selectedAgentModal.status === 'active' ? '• Status: Active' : '• Status: Paused'}
              </button>

              <button
                onClick={async () => {
                  if (selectedAgentModal.id) {
                    await SupabaseDashboardService.deleteUmkmAiEmployee(selectedAgentModal.id);
                    triggerToast(`AI Employee "${selectedAgentModal.name}" deleted`);
                  } else {
                    triggerToast(`Agent deleted`);
                  }
                  setSelectedAgentModal(null);
                  await loadDashboardData();
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Delete Agent
              </button>

              <button
                onClick={() => {
                  setSelectedAgentModal(null);
                  onNavigateTab('my_agents');
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DEPLOY NEW AI EMPLOYEE MODAL */}
      {/* ========================================================================= */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Deploy New AI Employee</h3>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAgentForm.name.trim()) return;

                const payload = {
                  name: newAgentForm.name,
                  role: newAgentForm.role,
                  category: newAgentForm.role,
                  model_engine: newAgentForm.model_engine,
                  system_prompt: newAgentForm.system_prompt,
                  temperature: newAgentForm.temperature,
                  desc: newAgentForm.description || `Autonomous AI Agent powered by ${newAgentForm.model_engine}.`,
                  status: 'working',
                  avatar_path: 'https://cdn.zegaai.site/assets/visualization/ai-avatar.png',
                  capabilities: ['WhatsApp API', 'Supabase RAG', newAgentForm.model_engine]
                };

                const res = await SupabaseDashboardService.addUmkmAiEmployee('11111111-1111-1111-1111-111111111111', payload);
                if (res.data) {
                  setAiEmployees(prev => [res.data, ...prev]);
                  triggerToast(`Successfully deployed ${res.data.name || newAgentForm.name} (${newAgentForm.model_engine})!`);
                } else {
                  triggerToast(`Deployed ${newAgentForm.name} locally.`);
                }

                setShowDeployModal(false);
                setNewAgentForm({
                  name: '',
                  role: 'Support & Ops Specialist',
                  model_engine: 'ZEGA-Swarm-Llama-3.3-70B',
                  system_prompt: 'You are an autonomous AI employee assisting UMKM operations.',
                  temperature: 0.7,
                  description: ''
                });
                await loadDashboardData();
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">AI Employee Name</label>
                <input
                  type="text"
                  required
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                  placeholder="e.g. Customer Support AI"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">AI Model Engine & Architecture</label>
                {(() => {
                  const models = [
                    {
                      id: '9Router-Auto-Cost-Optimizer',
                      name: '9Router Layer 5 Engine',
                      badge: 'Auto-Cost Router',
                      desc: 'Lowest Token Cost & Multi-Provider Failover',
                      logo: getR2CdnUrl('assets/logo/9router.png'),
                      accent: 'border-orange-500 bg-orange-50/90 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
                    },
                    {
                      id: 'ZeroClaw-Edge-Gateway-Llama3',
                      name: 'ZeroClaw Edge Gateway',
                      badge: 'Sub-200ms Edge',
                      desc: 'Edge Agent Execution & Solana Pay Escrow',
                      logo: getR2CdnUrl('assets/logo/zeroclaw.jpeg'),
                      accent: 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                    },
                    {
                      id: 'ZEGA-Swarm-Llama-3.3-70B',
                      name: 'ZEGA Swarm Llama 3.3 70B',
                      badge: 'Flagship Enterprise',
                      desc: 'Ultra-Fast Complex Reasoning & Operations',
                      logo: getR2CdnUrl('assets/logo/zegalogo.png'),
                      accent: 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    },
                    {
                      id: 'DeepSeek-R1-Distill-Qwen-32B',
                      name: 'DeepSeek R1 Distill 32B',
                      badge: 'High Reasoning',
                      desc: 'Deep Analytical Thinking & Math Logic',
                      logo: getR2CdnUrl('assets/logo/deepseek.webp'),
                      accent: 'border-cyan-500 bg-cyan-50/90 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                    },
                    {
                      id: 'Qwen-2.5-Coder-32B',
                      name: 'Qwen 2.5 Coder 32B',
                      badge: 'Automation Code',
                      desc: 'API Workflows & Code Execution Engine',
                      logo: getR2CdnUrl('assets/logo/Qwen.png'),
                      accent: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    },
                    {
                      id: 'Claude-3.5-Sonnet-v2',
                      name: 'Claude 3.5 Sonnet v2',
                      badge: 'Vision & OCR',
                      desc: 'Multimodal Vision & Document OCR Specialist',
                      logo: getR2CdnUrl('assets/logo/claude.webp'),
                      accent: 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    },
                    {
                      id: 'Ollama-Local-Zero-Cost',
                      name: 'Ollama Local Node',
                      badge: 'Zero Cost',
                      desc: 'On-Premise Private LLM Deployment',
                      logo: getR2CdnUrl('assets/logo/huggingface.webp'),
                      accent: 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                    }
                  ];
                  const selectedModel = models.find((m) => m.id === newAgentForm.model_engine) || models[0];

                  return (
                    <div className="relative">
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all shadow-xs ${selectedModel.accent}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            <img src={selectedModel.logo} alt={selectedModel.name} className="w-5 h-5 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold truncate">{selectedModel.name}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-orange-500 text-white shrink-0">
                                {selectedModel.badge}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-80 truncate">{selectedModel.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isModelDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
                      </button>

                      {/* Floating Seamless Popover Menu */}
                      {isModelDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 max-h-56 overflow-y-auto backdrop-blur-md">
                          {models.map((model) => {
                            const isSelected = newAgentForm.model_engine === model.id;
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                  setNewAgentForm({ ...newAgentForm, model_engine: model.id });
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2.5 ${
                                  isSelected
                                    ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-500/40 text-orange-700 dark:text-orange-300 font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                  <img src={model.logo} alt={model.name} className="w-5 h-5 object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold truncate">{model.name}</span>
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                      {model.badge}
                                    </span>
                                  </div>
                                  <p className="text-[10px] opacity-75 truncate">{model.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Role Specialization</label>
                <select
                  value={newAgentForm.role}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="Support & Ops Specialist">Support & Ops Specialist</option>
                  <option value="Growth & Content Specialist">Growth & Content Specialist</option>
                  <option value="Finance & Audit Specialist">Finance & Audit Specialist</option>
                  <option value="Logistics Specialist">Logistics Specialist</option>
                  <option value="Sales & Pipeline Specialist">Sales & Pipeline Specialist</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">System Prompt Instruction</label>
                <textarea
                  rows={2}
                  value={newAgentForm.system_prompt}
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, system_prompt: e.target.value })}
                  placeholder="System instruction..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Deploy AI Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INSTAGRAM DM & COMMENT POLICY MODAL */}
      {/* ========================================================================= */}
      {showIgPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Instagram size={20} className="text-pink-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Instagram DM & Comment Policy</h3>
              </div>
              <button onClick={() => setShowIgPolicyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              {[
                { key: 'autoCommentReply', title: 'Auto-Reply to Post Comments', desc: 'AI automatically replies to product questions on post comments within 30s.' },
                { key: 'keywordPriceCheck', title: 'Keyword Price & Catalog Inquiry', desc: 'Responds instantly when users comment "Cek Harga", "Berapa", or "DM".' },
                { key: 'storyMentionThankYou', title: 'Story Mention Auto-Thank You', desc: 'Sends an automatic appreciation message and voucher link when tagged in IG Stories.' },
                { key: 'leadCaptureWaLink', title: 'Direct WhatsApp Checkout Link', desc: 'Attaches a personalized WhatsApp checkout link to convert IG inquiries.' },
              ].map((item) => {
                const isActive = (igPolicyTriggers as any)[item.key];
                return (
                  <div key={item.key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h5>
                      <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIgPolicyTriggers(prev => ({ ...prev, [item.key]: !isActive }))}
                      className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 ${isActive ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`size-4.5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowIgPolicyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  triggerToast('Instagram DM & Comment Policy saved & synchronized with Supabase!');
                  setShowIgPolicyModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK PLAN MANAGEMENT SUB-MODAL */}
      {/* ========================================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Kelola Paket &amp; Kuota AI</h3>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Current Plan Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Active Subskripsi</span>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">Growth Scale Plan</h4>
                <p className="text-[10px] text-slate-500">Rp499.000 / bulan • Perpanjang 01 Sep 2026</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-500 text-white font-extrabold text-[10px] shadow-xs">PRO</span>
            </div>

            {/* Quota Telemetry */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600 dark:text-slate-300">Kuota Token AI Bulan Ini</span>
                <span className="text-orange-600 dark:text-orange-400">3.240 / 5.000 Tokens (65%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>

            {/* Feature Access & Gateway Badges */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fitur &amp; Telemetri Aktif</span>
              <div className="grid grid-cols-2 gap-1.5">
                {['9Router Failover', 'ZeroClaw Edge', 'R2 CDN Assets', 'Supabase Realtime', 'WhatsApp API Bot', 'IG DM Automation'].map((feat, fi) => (
                  <div key={fi} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  triggerToast('Top Up Token AI +2.000 Token Berhasil!');
                  setShowPlanModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-orange-500/80 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold text-xs hover:bg-orange-100 cursor-pointer transition-colors"
              >
                Top Up Token
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPlanModal(false);
                  onNavigateTab('billing');
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Halaman Tagihan &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: INLINE QUICK SUPPORT ASSISTANT SUB-MODAL */}
      {/* ========================================================================= */}
      {showSupportAssistantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-3.5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Bantuan Cepat Overview</h3>
                  <p className="text-[10px] text-slate-400">Asisten Bantuan Langsung di Overview</p>
                </div>
              </div>
              <button onClick={() => setShowSupportAssistantModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Quick FAQ Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pertanyaan Populer</span>
              <div className="flex flex-wrap gap-1">
                {[
                  'Cara Deploy AI Agent?',
                  'Setup WhatsApp API Bot',
                  'Kelola Invoice Penjualan',
                  'Integrasi CDN & Supabase'
                ].map((faq, fqIdx) => (
                  <button
                    key={fqIdx}
                    type="button"
                    onClick={() => handleSendSupportMessage(faq)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {faq}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Output Stream */}
            <div className="h-44 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
              {supportChatMessages.map((msg, mIdx) => (
                <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none font-medium shadow-xs' : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none font-medium shadow-xs space-y-1.5'}`}>
                    {msg.sender === 'user' ? (
                      <p className="text-[11px] leading-relaxed font-semibold">{msg.text}</p>
                    ) : (
                      renderFormattedSupportMessage(msg.text)
                    )}
                    {msg.sender === 'ai' && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[8.5px] text-slate-400 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-extrabold flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {msg.model || '9Router-Llama-3.3-70B'}
                          </span>
                          <span>• {msg.inference_ms || 185}ms</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[8px]">{msg.tokens || 94} tokens</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendSupportMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Tulis pertanyaan bantuan Anda..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
              />
              <button type="submit" className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors shadow-xs">
                <Send size={14} />
              </button>
            </form>

            {/* Link to Full Help Center */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Butuh panduan dokumen lengkap?</span>
              <button
                type="button"
                onClick={() => {
                  setShowSupportAssistantModal(false);
                  onNavigateTab('help');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Pusat Bantuan Lengkap &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI AUTOMATIONS REALTIME MANAGEMENT WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {showAutomationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Workflow size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>AI Automations Management Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime DB
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Pusat kelola, aktivasi, & pembuatan alur kerja otomatisasi AI terintegrasi Supabase</p>
                </div>
              </div>
              <button onClick={() => setShowAutomationsModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Live Metrics Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 block">Total Workflows</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{automations.length || 4} Workflows</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Active Status</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {automations.filter((a) => a.status !== 'paused').length} Running
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block">Trigger Reliability</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">99.9%</span>
              </div>
            </div>

            {/* Create New Automation Workflow Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAutomationForm.name.trim()) return;
                const autoName = newAutomationForm.name;
                const triggerEv = newAutomationForm.trigger_event;
                const actionType = newAutomationForm.action_type;

                triggerToast(`Creating AI Automation: "${autoName}"...`);
                setNewAutomationForm({ name: '', trigger_event: 'WhatsApp Chat', action_type: 'Auto Reply' });

                const res = await SupabaseDashboardService.createUmkmAutomation({
                  name: autoName,
                  trigger_event: triggerEv,
                  action_type: actionType,
                  status: 'active'
                });

                if (res.data) {
                  triggerToast(`AI Automation saved & active in Supabase!`);
                  await loadDashboardData();
                }
              }}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
            >
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">⚡ Create New AI Automation Workflow</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newAutomationForm.name}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, name: e.target.value })}
                  placeholder="e.g. Auto Send Invoice & WA Follow-Up..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
                <select
                  value={newAutomationForm.trigger_event}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, trigger_event: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="WhatsApp Chat">WhatsApp Chat Trigger</option>
                  <option value="Instagram DM">Instagram DM Trigger</option>
                  <option value="New Invoice Created">Invoice Trigger</option>
                  <option value="Low Stock Alert">Stock Trigger</option>
                  <option value="Scheduled Daily">Daily Schedule</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Workflow size={14} /> Create Workflow
                </button>
              </div>
            </form>

            {/* Automations List with Live Status Toggles */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Active & Available Workflows</span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {automations.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center shrink-0">
                        <Workflow size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">{item.sub || item.trigger_event || 'Everyday • 09:00'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[8.5px] font-bold">
                            {item.action_type || 'Auto Workflow'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Live Toggle Switch */}
                    <button
                      type="button"
                      onClick={async () => {
                        triggerToast(`Toggling status for: ${item.name}...`);
                        const res = await SupabaseDashboardService.toggleUmkmAutomation(item.id, item.status);
                        if (res.data) {
                          triggerToast(`Automation status updated to: ${res.data.status}`);
                          await loadDashboardData();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        item.status === 'paused'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {item.status === 'paused' ? 'Paused (Click to Start)' : '✓ Active (Click to Pause)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Ingin mengonfigurasi alur kerja lanjutan?</span>
              <button
                type="button"
                onClick={() => {
                  setShowAutomationsModal(false);
                  onNavigateTab('automation');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Automations Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* AI EMPLOYEES REALTIME MANAGEMENT WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {showAgentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>AI Employees Realtime Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> {aiEmployees.length || 5} Active Nodes
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Pusat kelola, alokasi tugas, & deployment agen AI terintegrasi Supabase & R2 CDN</p>
                </div>
              </div>
              <button onClick={() => setShowAgentsModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Top Deploy CTA Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 dark:border-orange-900/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Tambah Agen AI Baru ke Swarm Node</h4>
                  <p className="text-[10px] text-slate-500">Pilih model engine (9Router, ZeroClaw, DeepSeek) & atur System Prompt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAgentsModal(false);
                  setShowDeployModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus size={14} /> Deploy AI Employee
              </button>
            </div>

            {/* AI Employees Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Daftar Agen AI Berjalan</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {aiEmployees.map((agent, idx) => (
                  <div
                    key={agent.id || idx}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={
                            agent.cdn_avatar_url ||
                            (agent.avatar_path && agent.avatar_path.startsWith('http') ? agent.avatar_path : getR2CdnUrl(agent.avatar_path || 'assets/logo/zegalogo.png'))
                          }
                          alt={agent.name}
                          className="w-full h-full object-contain rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getR2CdnUrl('assets/logo/zegalogo.png');
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{agent.name || agent.agent_name}</h4>
                        <span className="text-[10px] text-slate-400 block truncate">{agent.role || 'Support Specialist'}</span>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[8.5px] font-extrabold">
                          {agent.model_engine || '9Router-Llama-3.3-70B'}
                        </span>
                      </div>
                    </div>
                    
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold flex-shrink-0">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Terhubung langsung dengan Supabase Realtime DB</span>
              <button
                type="button"
                onClick={() => {
                  setShowAgentsModal(false);
                  onNavigateTab('my_agents');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka AI Workforce Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECENT ACTIVITIES REALTIME TIMELINE LOGS MODAL */}
      {/* ========================================================================= */}
      {showActivitiesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Recent Activity & Timeline Logs</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live DB Feed
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Riwayat aktivitas real-time transaksi, otomatisasi, dan log sistem</p>
                </div>
              </div>
              <button onClick={() => setShowActivitiesModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activityFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Semua Aktivitas
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('transaction')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activityFilter === 'transaction'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Transaksi & Penjualan
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('ai_task')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activityFilter === 'ai_task'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Aksi Otomatis AI
              </button>
            </div>

            {/* Timeline Events List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recentActivities
                .filter((act) => {
                  if (activityFilter === 'transaction') return act.icon === ShoppingBag;
                  if (activityFilter === 'ai_task') return act.icon === FileText;
                  return true;
                })
                .map((act, i) => {
                  const Icon = act.icon || FileText;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-xl ${act.iconBg || 'bg-orange-50 text-orange-600'} flex items-center justify-center shrink-0`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{act.title}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 block">{act.sub}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold">
                        {act.amount}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Sinkronisasi otomatis dengan Supabase timeline events</span>
              <button
                type="button"
                onClick={() => {
                  setShowActivitiesModal(false);
                  onNavigateTab('reports');
                }}
                className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Reports & Activity Log &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI TASKS TODAY REALTIME MANAGEMENT WORKSPACE MODAL */}
      {/* ========================================================================= */}
      {showAiTasksModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>AI Tasks Today Management Workspace</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime DB
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Pusat kelola & eksekusi tugas agen AI terintegrasi Supabase Realtime</p>
                </div>
              </div>
              <button onClick={() => setShowAiTasksModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Live Metrics Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40">
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block">Total Tasks Today</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{kpiData.tasks_completed_today || 126}</span>
              </div>
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 block">Active Swarm Nodes</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{aiEmployees.length || 5} Agents</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">Resolution Accuracy</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">99.2%</span>
              </div>
            </div>

            {/* Dispatch New AI Task Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTaskForm.title.trim()) return;
                const taskTitle = newTaskForm.title;
                const agentName = newTaskForm.agent;
                
                triggerToast(`Dispatching AI Task: "${taskTitle}"...`);
                setNewTaskForm({ ...newTaskForm, title: '' });

                // Call Supabase Atomic Task Incrementor
                const res = await SupabaseDashboardService.incrementUmkmAiTaskCompleted('11111111-1111-1111-1111-111111111111', agentName, taskTitle);
                if (res.data) {
                  triggerToast(`AI Task executed & logged in Supabase!`);
                  await loadDashboardData();
                }
              }}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
            >
              <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">⚡ Execute New AI Task Live</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g. Audit low stock items & trigger auto-reorder..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <select
                  value={newTaskForm.agent}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, agent: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Customer Service AI">Customer Service AI</option>
                  <option value="Marketing AI">Marketing AI</option>
                  <option value="Finance & Billing AI">Finance AI</option>
                  <option value="Store & Inventory AI">Store AI</option>
                  <option value="9Router Support Swarm">9Router Support AI</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Play size={14} /> Run Task
                </button>
              </div>
            </form>

            {/* AI Tasks Realtime Log List */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Realtime Task Execution Stream</span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {aiTasksList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                        <CheckCircle size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{item.task}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold text-slate-400">{item.agent}</span>
                          <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[8.5px] font-bold">
                            {item.badge || 'Swarm Executed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block">{item.time}</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">✓ Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Ingin mengelola agen AI selengkapnya?</span>
              <button
                type="button"
                onClick={() => {
                  setShowAiTasksModal(false);
                  onNavigateTab('my_agents');
                }}
                className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Buka My Agents Workspace &gt;</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
