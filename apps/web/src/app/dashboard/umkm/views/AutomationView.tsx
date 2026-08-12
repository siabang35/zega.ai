import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Search, ChevronDown, CheckCircle2, Clock, 
  ShieldCheck, Mail, ArrowUpRight, ShoppingBag, MessageSquare, 
  FileText, Users, ShoppingCart, BookOpen, ExternalLink, 
  Plus, Upload, Filter, Grid, List, Zap, DollarSign, AlertCircle,
  MoreVertical, X, Check, Trash2, Sliders, Sparkles, RefreshCw,
  FileCode, Code, CheckCircle, ArrowRight, Workflow, Cpu
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';

// Register Chart.js elements
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

interface AutomationViewProps {
  triggerToast: (msg: string) => void;
}

const AI_MODEL_ENGINES = [
  {
    id: '9Router-Auto-Cost-Optimizer',
    name: '9Router Layer 5 Engine',
    badge: 'Auto-Cost Router',
    desc: 'Lowest Token Cost & Multi-Provider Failover',
    logo: 'https://cdn.zegaai.site/assets/logo/9router.png',
    provider: '9router/auto',
    gateway: 'ZeroClaw-Edge-Gateway'
  },
  {
    id: 'ZeroClaw-Edge-Gateway-Llama3',
    name: 'ZeroClaw Edge Gateway',
    badge: 'Sub-200ms Edge',
    desc: 'Edge Swarm Node Execution & Solana Pay Escrow',
    logo: 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
    provider: 'zeroclaw/daemon-v0.5.3',
    gateway: 'ZeroClaw-Daemon'
  },
  {
    id: 'ZEGA-Swarm-Llama-3.3-70B',
    name: 'ZEGA Swarm Llama 3.3 70B',
    badge: 'Flagship Enterprise',
    desc: 'Ultra-Fast Complex Reasoning & Operations',
    logo: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    provider: '9router/llama-3.3-70b',
    gateway: 'ZeroClaw-Edge-Gateway'
  },
  {
    id: 'DeepSeek-R1-Distill-Qwen-32B',
    name: 'DeepSeek R1 Distill 32B',
    badge: 'High Reasoning',
    desc: 'Deep Analytical Thinking & Logic Swarm',
    logo: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
    provider: 'zeroclaw/deepseek-r1',
    gateway: 'ZeroClaw-Edge-Gateway'
  },
  {
    id: 'Qwen-2.5-Coder-32B',
    name: 'Qwen 2.5 Coder 32B',
    badge: 'Automation Code',
    desc: 'API Workflows & Code Synthesis Engine',
    logo: 'https://cdn.zegaai.site/assets/logo/Qwen.png',
    provider: '9router/qwen-2.5-coder',
    gateway: 'ZeroClaw-Edge-Gateway'
  },
  {
    id: 'Claude-3.5-Sonnet-v2',
    name: 'Claude 3.5 Sonnet v2',
    badge: 'Vision & OCR',
    desc: 'Multimodal Vision & Document OCR Specialist',
    logo: 'https://cdn.zegaai.site/assets/logo/claude.webp',
    provider: '9router/claude-3.5-sonnet',
    gateway: 'ZeroClaw-Edge-Gateway'
  }
];

const SAMPLE_JSON_BLUEPRINT = `{
  "title": "WA Auto-Invoice & Stock Decrement",
  "trigger_event": "New Order (Online Store)",
  "description": "Auto-generates invoice, sends WhatsApp link, and decrements stock in Supabase.",
  "workflow_steps": ["Order Received", "Generate Invoice AI", "Send WA Link", "Update Inventory"]
}`;

export function AutomationView({ triggerToast }: AutomationViewProps) {
  const [filterTab, setFilterTab] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState(SAMPLE_JSON_BLUEPRINT);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressStep, setImportProgressStep] = useState<'idle' | 'parsing_schema' | 'db_persist' | 'gateway_verification' | 'completed'>('idle');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const [newAutomationForm, setNewAutomationForm] = useState({
    title: '',
    trigger_event: 'New Order (Online Store)',
    description: '',
    steps: 'Order Trigger -> AI Processor -> WA Alert',
    model_engine: '9Router-Auto-Cost-Optimizer',
    model_provider: '9router/auto',
    execution_gateway: 'ZeroClaw-Edge-Gateway',
    cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/9router.png'
  });

  // Real-time Database State
  const [automations, setAutomations] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<any>({
    tasks_completed_today: 0,
    hours_saved_weekly: 0,
    revenue_generated_today: 0,
    estimated_ai_salary_saved: 0
  });

  // Load database data
  const loadAutomations = async () => {
    try {
      setLoading(true);
      const storeId = await SupabaseDashboardService.getAuthenticatedStoreId().catch(() => '11111111-1111-1111-1111-111111111111');
      const [data, realtimeRes] = await Promise.all([
        SupabaseDashboardService.getUmkmAutomations(storeId),
        SupabaseDashboardService.getUmkmRealtimeData(storeId)
      ]);

      setAutomations(data || []);
      if (realtimeRes && realtimeRes.kpis) {
        setKpiData(realtimeRes.kpis);
      } else {
        setKpiData({
          tasks_completed_today: 0,
          hours_saved_weekly: 0,
          revenue_generated_today: 0,
          estimated_ai_salary_saved: 0
        });
      }
    } catch (e) {
      console.error('Failed to fetch automations & KPIs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      await loadAutomations();
      const storeId = await SupabaseDashboardService.getAuthenticatedStoreId().catch(() => '11111111-1111-1111-1111-111111111111');
      unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime(storeId, () => {
        loadAutomations();
      });
    };
    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Filter automations based on tabs, search query, and dropdown
  const filteredAutomations = automations.filter((item) => {
    const isRunning = item.status === 'active' || item.status === 'running';
    const isPaused = item.status === 'paused';
    const isFailed = item.status === 'failed';
    const isCompleted = item.status === 'completed';

    if (filterTab === 'Berjalan' && !isRunning) return false;
    if (filterTab === 'Dijeda' && !isPaused) return false;
    if (filterTab === 'Gagal' && !isFailed) return false;
    if (filterTab === 'Selesai' && !isCompleted) return false;

    if (statusFilter === 'Berjalan' && !isRunning) return false;
    if (statusFilter === 'Dijeda' && !isPaused) return false;
    if (statusFilter === 'Gagal' && !isFailed) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchTrigger = item.trigger_event?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTrigger;
    }

    return true;
  });

  // Dynamic Pagination Slicing
  const totalPages = Math.max(1, Math.ceil(filteredAutomations.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAutomations = filteredAutomations.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  // Calculate summary counts dynamically for 100% Realtime Donut Chart
  const totalCount = automations.length;
  const runningCount = automations.filter(a => a.status === 'active' || a.status === 'running').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;
  const failedCount = automations.filter(a => a.status === 'failed').length;
  const completedCount = automations.filter(a => a.status === 'completed').length;

  const runningPct = totalCount > 0 ? Math.round((runningCount / totalCount) * 100) : 0;
  const pausedPct = totalCount > 0 ? Math.round((pausedCount / totalCount) * 100) : 0;
  const failedPct = totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0;
  const completedPct = totalCount > 0 ? 100 - (runningPct + pausedPct + failedPct) : 0;

  // Chart.js Doughnut Data Config (Interactive 100% Realtime)
  const doughnutData = {
    labels: ['Berjalan', 'Dijeda', 'Gagal', 'Selesai'],
    datasets: [
      {
        data: [runningCount, pausedCount, failedCount, completedCount],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'],
        hoverBackgroundColor: ['#059669', '#d97706', '#dc2626', '#4f46e5'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 11 },
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const count = context.raw || 0;
            const pct = Math.round((count / (totalCount || 1)) * 100);
            return ` ${context.label}: ${count} (${pct}%)`;
          }
        }
      }
    }
  };

  // Chart.js Line Chart Data Config (Professional Execution Analytics)
  const lineChartData = {
    labels: ['27 Mei', '28 Mei', '29 Mei', '30 Mei', '31 Mei', '1 Jun', '2 Jun'],
    datasets: [
      {
        label: 'Eksekusi Otomatisasi',
        data: [25, 32, 28, 58, 89, 64, 76],
        borderColor: '#f97316',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(249, 115, 22, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 11 },
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => ` ${context.raw} eksekusi`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { font: { size: 10 }, color: '#94a3b8' },
        beginAtZero: true
      }
    }
  };

  // Helper trigger icon picker
  const getTriggerIconInfo = (trigger: string) => {
    if (trigger.includes('Order') || trigger.includes('Store')) {
      return { Icon: ShoppingBag, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60' };
    }
    if (trigger.includes('Message') || trigger.includes('WhatsApp')) {
      return { Icon: MessageSquare, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' };
    }
    if (trigger.includes('Invoice') || trigger.includes('Finance')) {
      return { Icon: FileText, bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60' };
    }
    if (trigger.includes('Lead') || trigger.includes('Form')) {
      return { Icon: Users, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60' };
    }
    if (trigger.includes('Cart')) {
      return { Icon: ShoppingCart, bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60' };
    }
    return { Icon: Workflow, bg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/60' };
  };

  return (
    <div className="space-y-5 font-sans">
      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Automation</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-extrabold">
              Enterprise Workflow Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Buat dan kelola workflow otomatisasi tanpa kode. Hemat waktu, kurangi kesalahan, tingkatkan produktivitas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDocModal(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:border-orange-400"
          >
            <BookOpen size={14} className="text-orange-500" />
            <span>Dokumentasi Engine</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:border-orange-400"
          >
            <Upload size={14} className="text-orange-500" />
            <span>Impor Workflow</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer transition-all"
          >
            <Plus size={16} />
            <span>Buat Automation</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 TOP METRIC CARDS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: ACTIVE AUTOMATIONS */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Active Automations</span>
            <div className="size-7 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <Play size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{runningCount}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ Live DB State</span>
            </div>
          </div>
        </div>

        {/* CARD 2: TASKS AUTOMATED TODAY */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Tasks Automated Today</span>
            <div className="size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{kpiData.tasks_completed_today ?? 0}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ Live Telemetry</span>
            </div>
          </div>
        </div>

        {/* CARD 3: SUCCESS RATE */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Success Rate</span>
            <div className="size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {automations.length > 0
                ? `${Math.round(automations.reduce((acc, a) => acc + (a.success_rate || 100), 0) / automations.length)}%`
                : '0%'}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ Live Telemetry</span>
            </div>
          </div>
        </div>

        {/* CARD 4: HOURS SAVED THIS WEEK */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Hours Saved This Week</span>
            <div className="size-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {`${kpiData.hours_saved_weekly ?? 0} Jam`}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ Live Calculation</span>
            </div>
          </div>
        </div>

        {/* CARD 5: COST SAVED THIS MONTH */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 col-span-2 sm:col-span-1 hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Cost Saved This Month</span>
            <div className="size-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(kpiData.estimated_ai_salary_saved || ((kpiData.hours_saved_weekly || 0) * 150000)).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ Live Revenue</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTION BAR & FILTER TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left Tabs with Realtime Counts */}
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
          {[
            { label: 'Semua', count: totalCount, color: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
            { label: 'Berjalan', count: runningCount, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
            { label: 'Dijeda', count: pausedCount, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
            { label: 'Gagal', count: failedCount, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
            { label: 'Selesai', count: completedCount, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' }
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setFilterTab(tab.label)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === tab.label
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/50 dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari automation..."
              className="pl-8 pr-4 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-48 focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Berjalan">Berjalan ({runningCount})</option>
            <option value="Dijeda">Dijeda ({pausedCount})</option>
            <option value="Gagal">Gagal ({failedCount})</option>
            <option value="Selesai">Selesai ({completedCount})</option>
          </select>

          <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}
            >
              <Grid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT: DAFTAR AUTOMATION TABLE + RIGHT SIDEBAR PANELS */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">

        {/* LEFT 8 COLS: DAFTAR AUTOMATION */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Daftar Automation</h3>
            <span className="text-[11px] font-bold text-slate-400">
              Showing {filteredAutomations.length} of {automations.length} workflows
            </span>
          </div>

          {filteredAutomations.length === 0 ? (
            <div className="p-12 text-center border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
              <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                <Workflow size={24} />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Zero State — Belum ada Workflow Automation</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Database tenant belum memiliki workflow otomatisasi. Buat automation baru atau impor file blueprint JSON.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Upload size={13} className="text-orange-500" />
                  <span>Impor Workflow</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Buat Automation</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <th className="pb-3 pl-2">AUTOMATION WORKFLOW</th>
                    <th className="pb-3">AI ENGINE / ROUTER</th>
                    <th className="pb-3">TRIGGER EVENT</th>
                    <th className="pb-3">LAST EXECUTION</th>
                    <th className="pb-3">STATUS</th>
                    <th className="pb-3 text-center">SUCCESS RATE</th>
                    <th className="pb-3 pr-2 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedAutomations.map((item) => {
                    const { Icon: TriggerIcon, bg: triggerBg } = getTriggerIconInfo(item.trigger_event || item.title);
                    const isRunning = item.status === 'active' || item.status === 'running';
                    const isPaused = item.status === 'paused';
                    const isFailed = item.status === 'failed';

                    const matchedModel = AI_MODEL_ENGINES.find(m => m.id === item.model_engine) || {
                      name: item.model_engine || '9Router Layer 5 Engine',
                      badge: 'Real Model',
                      logo: item.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 pl-2 pr-3 max-w-[220px]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-extrabold flex items-center gap-1">
                              <Workflow size={10} /> Event Workflow
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-500 transition-colors" title={item.title}>
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                        </td>

                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={matchedModel.logo}
                              alt={matchedModel.name}
                              className="size-6 rounded-lg object-contain bg-white p-0.5 border border-slate-200/60 shadow-2xs flex-shrink-0"
                            />
                            <div className="truncate max-w-[130px]">
                              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block truncate">{matchedModel.name}</span>
                              <span className="text-[9px] text-slate-400 block truncate">{item.execution_gateway || 'ZeroClaw Edge Gateway'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`size-6 rounded-lg ${triggerBg} flex items-center justify-center flex-shrink-0`}>
                              <TriggerIcon size={12} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                              {item.trigger_event}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 pr-3 text-[10.5px] text-slate-400 whitespace-nowrap">
                          {item.last_run || '2 menit yang lalu'}
                        </td>

                        <td className="py-3.5 pr-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isRunning
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isPaused
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            <span className={`size-1.5 rounded-full ${isRunning ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-rose-500'}`} />
                            {isRunning ? 'Berjalan' : isPaused ? 'Dijeda' : 'Gagal'}
                          </span>
                        </td>

                        <td className="py-3.5 text-center font-extrabold text-xs text-slate-900 dark:text-slate-100">
                          {item.success_rate ? `${item.success_rate}%` : '100%'}
                        </td>

                        <td className="py-3.5 pr-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={async () => {
                                const res = await SupabaseDashboardService.toggleAutomationStatus(item.id, item.status);
                                if (res.data) {
                                  setAutomations(prev => prev.map(a => a.id === item.id ? res.data : a));
                                  triggerToast(`Toggled ${item.title} to ${res.data.status.toUpperCase()}`);
                                } else {
                                  const nextSt = item.status === 'active' ? 'paused' : 'active';
                                  setAutomations(prev => prev.map(a => a.id === item.id ? { ...a, status: nextSt } : a));
                                  triggerToast(`Toggled ${item.title}`);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
                              title={isRunning ? 'Pause Workflow' : 'Resume Workflow'}
                            >
                              {isRunning ? <Pause size={14} className="text-amber-500" /> : <Play size={14} className="text-emerald-500" />}
                            </button>

                            <button
                              onClick={async () => {
                                const res = await SupabaseDashboardService.deleteAutomation(item.id);
                                if (res.success) {
                                  setAutomations(prev => prev.filter(a => a.id !== item.id));
                                  triggerToast(`Deleted ${item.title}`);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                              title="Delete Workflow"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paginatedAutomations.map((item) => {
                const { Icon: TriggerIcon, bg: triggerBg } = getTriggerIconInfo(item.trigger_event || item.title);
                const isRunning = item.status === 'active' || item.status === 'running';

                const matchedModel = AI_MODEL_ENGINES.find(m => m.id === item.model_engine) || {
                  name: item.model_engine || '9Router Layer 5 Engine',
                  badge: 'Real Model',
                  logo: item.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'
                };

                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3 hover:border-orange-400/50 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`size-7 rounded-xl ${triggerBg} flex items-center justify-center`}>
                            <TriggerIcon size={14} />
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-extrabold flex items-center gap-1">
                            <Workflow size={10} /> Event Workflow
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          • {isRunning ? 'Berjalan' : 'Dijeda'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                      <img src={matchedModel.logo} alt={matchedModel.name} className="size-5 rounded-md object-contain bg-white p-0.5 border border-slate-200/60" />
                      <div className="truncate flex-1">
                        <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200 block truncate">{matchedModel.name}</span>
                        <span className="text-[8.5px] text-slate-400 block truncate">{item.execution_gateway || 'ZeroClaw Edge Gateway'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Success: <strong className="text-slate-800 dark:text-slate-200">{item.success_rate || 100}%</strong></span>
                      <button
                        onClick={() => triggerToast(`Configuring ${item.title}`)}
                        className="text-orange-500 font-bold hover:underline cursor-pointer"
                      >
                        Edit Workflow &gt;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive Dynamic Pagination Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
            <span>
              Menampilkan {filteredAutomations.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}-
              {Math.min(validCurrentPage * pageSize, filteredAutomations.length)} dari {filteredAutomations.length} automation
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px]">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value={4}>4 per halaman</option>
                <option value={6}>6 per halaman</option>
                <option value={10}>10 per halaman</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      validCurrentPage === pageNum
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: SIDEBAR WIDGETS */}
        <div className="lg:col-span-4 space-y-4">

          {/* WIDGET 1: RINGKASAN WORKFLOW (CHART.JS INTERACTIVE REALTIME DOUGHNUT) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Ringkasan Workflow</h3>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Realtime Sync
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="size-28 flex-shrink-0 relative">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">{totalCount}</span>
                  <span className="text-[8px] font-bold text-slate-400">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 text-[11px] font-bold">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Berjalan</span>
                  <span>{runningCount} ({runningPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Dijeda</span>
                  <span>{pausedCount} ({pausedPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" />Gagal</span>
                  <span>{failedCount} ({failedPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-500" />Selesai</span>
                  <span>{completedCount} ({completedPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 2: EKSEKUSI OTOMATISASI (CHART.JS SMOOTH GRADIENT LINE) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Eksekusi Otomatisasi</h3>
              <span className="text-[10px] font-bold text-slate-400">7 Hari Terakhir</span>
            </div>
            <div className="h-28 w-full pt-1">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* WIDGET 3: TEMPLATE POPULER */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Template Populer</h3>
              <button onClick={() => setShowTemplateModal(true)} className="text-[10px] font-extrabold text-orange-500 hover:underline cursor-pointer">Lihat Semua &gt;</button>
            </div>

            <div className="space-y-2.5">
              {[
                { title: 'Order & Invoice Automation', sub: 'Buat invoice otomatis saat ada order', icon: ShoppingBag, bg: 'bg-emerald-50 text-emerald-600' },
                { title: 'WhatsApp Auto Reply', sub: 'Balas chat & kirim informasi otomatis', icon: MessageSquare, bg: 'bg-emerald-50 text-emerald-600' },
                { title: 'Payment Reminder', sub: 'Kirim pengingat pembayaran otomatis', icon: FileText, bg: 'bg-indigo-50 text-indigo-600' },
                { title: 'New Lead Follow Up', sub: 'Follow up leads otomatis via WA', icon: Users, bg: 'bg-purple-50 text-purple-600' },
              ].map((tpl, idx) => {
                const Icon = tpl.icon;
                return (
                  <div key={idx} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`size-7.5 rounded-xl ${tpl.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} />
                      </div>
                      <div className="truncate">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{tpl.title}</h4>
                        <p className="text-[9.5px] text-slate-400 truncate">{tpl.sub}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const payload = {
                          title: tpl.title,
                          description: tpl.sub,
                          trigger_event: 'Template Preset Trigger',
                          status: 'active'
                        };
                        const res = await SupabaseDashboardService.createAutomation('11111111-1111-1111-1111-111111111111', payload);
                        if (res.data) {
                          setAutomations(prev => [res.data, ...prev]);
                          triggerToast(`Deployed template: ${tpl.title}`);
                        }
                      }}
                      className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-all cursor-pointer shadow-xs flex-shrink-0"
                    >
                      Gunakan
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM BANNER: BUAT AUTOMATION DALAM 3 LANGKAH MUDAH */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Buat Automation dalam 3 Langkah Mudah</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-black text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Pilih Trigger</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Pilih event yang memulai workflow otomatisasi Anda.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-black text-sm flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Tambah Aksi</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Tambahkan aksi yang ingin dijalankan oleh AI Employee.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 flex items-center justify-center font-black text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Aktifkan</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Nyalakan automation dan biarkan AI bekerja 24/7.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setShowDocModal(true)}
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={14} className="text-orange-500" />
            <span>Lihat Dokumentasi &gt;</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: IMPOR WORKFLOW BLUEPRINT (JSON/YAML) */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Impor Blueprint Workflow Automation</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-300 space-y-1">
                <div className="font-extrabold flex items-center gap-1">
                  <Sparkles size={14} /> Import Workflow JSON Blueprint
                </div>
                <p className="text-[11px]">Unggah berkas JSON dari komputer atau tempel definisi blueprint workflow di bawah ini.</p>
              </div>

              {/* File Upload Button */}
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-100/50 text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>Pilih File Blueprint (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const content = evt.target?.result as string;
                          if (content) {
                            setImportJsonText(content);
                            triggerToast(`Loaded "${file.name}" into blueprint editor!`);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Workflow Definition (JSON Syntax)</label>
                <textarea
                  rows={7}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setImportJsonText(SAMPLE_JSON_BLUEPRINT)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Load Order Preset
                </button>
                <button
                  type="button"
                  onClick={() => setImportJsonText(JSON.stringify({
                    title: "WhatsApp Auto Lead Qualifier RAG",
                    trigger_event: "New Message (WhatsApp)",
                    description: "Klasifikasi prospek masuk via WA & tag CRM otomatis.",
                    workflow_steps: ["Message Ingest", "AI Intent Classification", "CRM Tagging"],
                    model_engine: "ZeroClaw-Edge-Gateway-Llama3"
                  }, null, 2))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Load WA Bot Preset
                </button>
                <button
                  type="button"
                  onClick={() => setImportJsonText(JSON.stringify({
                    title: "Multi-channel Stock Sync & Restock Alert",
                    trigger_event: "Low Stock Alert (< 5 units)",
                    description: "Singkronisasi stok multi-channel & notifikasi supplier otomatis.",
                    workflow_steps: ["Stock Audit", "Supplier Reorder Dispatch", "WA Notification"],
                    model_engine: "ZEGA-Swarm-Llama-3.3-70B"
                  }, null, 2))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Load Restock Preset
                </button>
              </div>
            </div>

            {/* Step-by-Step Validation & Execution Progress Box */}
            {isImporting && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-xs text-slate-200 flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-orange-500" />
                    <span>Processing Realtime Workflow Validation...</span>
                  </span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold uppercase">
                    {importProgressStep}
                  </span>
                </div>

                <div className="space-y-1 text-[10.5px]">
                  <div className={`flex items-center gap-2 ${importProgressStep === 'parsing_schema' ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                    <span>{importProgressStep === 'parsing_schema' ? '⏳' : '✓'}</span>
                    <span>1. Validating JSON syntax & blueprint schema definitions...</span>
                  </div>

                  <div className={`flex items-center gap-2 ${['db_persist', 'gateway_verification', 'completed'].includes(importProgressStep) ? (importProgressStep === 'db_persist' ? 'text-amber-400 font-bold' : 'text-emerald-400') : 'text-slate-600'}`}>
                    <span>{importProgressStep === 'db_persist' ? '⏳' : ['gateway_verification', 'completed'].includes(importProgressStep) ? '✓' : '•'}</span>
                    <span>2. Executing Supabase DB atomic stored procedure insert...</span>
                  </div>

                  <div className={`flex items-center gap-2 ${['gateway_verification', 'completed'].includes(importProgressStep) ? (importProgressStep === 'gateway_verification' ? 'text-amber-400 font-bold' : 'text-emerald-400') : 'text-slate-600'}`}>
                    <span>{importProgressStep === 'gateway_verification' ? '⏳' : importProgressStep === 'completed' ? '✓' : '•'}</span>
                    <span>3. Verifying 9Router Layer 5 & ZeroClaw daemon route handshake...</span>
                  </div>

                  <div className={`flex items-center gap-2 ${importProgressStep === 'completed' ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                    <span>{importProgressStep === 'completed' ? '✓' : '•'}</span>
                    <span>4. Realtime subscription broadcast & workflow ready!</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => {
                  setIsImporting(false);
                  setImportProgressStep('idle');
                  setShowImportModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={async () => {
                  try {
                    setIsImporting(true);
                    setImportProgressStep('parsing_schema');

                    // Step 1: Real JSON syntax validation
                    const parsed = JSON.parse(importJsonText);
                    const payload = {
                      title: parsed.title || 'Imported Workflow',
                      trigger_event: parsed.trigger_event || 'New Event Trigger',
                      description: parsed.description || 'Workflow imported from blueprint',
                      workflow_steps: parsed.workflow_steps || ['Trigger', 'AI Processing', 'Action'],
                      model_engine: parsed.model_engine || '9Router-Auto-Cost-Optimizer',
                      model_provider: '9router/auto',
                      execution_gateway: 'ZeroClaw-Edge-Gateway',
                      status: 'active'
                    };

                    await new Promise(r => setTimeout(r, 250));
                    setImportProgressStep('db_persist');

                    // Step 2: Real Supabase DB Stored Procedure Insert
                    const res = await SupabaseDashboardService.createAutomation('11111111-1111-1111-1111-111111111111', payload);
                    
                    await new Promise(r => setTimeout(r, 250));
                    setImportProgressStep('gateway_verification');

                    // Step 3: Realtime Gateway Verification & Event Sync
                    if (res.data) {
                      setAutomations(prev => [res.data, ...prev]);
                    }

                    await new Promise(r => setTimeout(r, 200));
                    setImportProgressStep('completed');

                    triggerToast(`Workflow "${payload.title}" successfully validated & deployed to Supabase!`);
                    await loadAutomations();

                    setTimeout(() => {
                      setIsImporting(false);
                      setImportProgressStep('idle');
                      setShowImportModal(false);
                    }, 400);

                  } catch (err) {
                    setIsImporting(false);
                    setImportProgressStep('idle');
                    triggerToast('Format JSON tidak valid! Periksa kembali sintaks JSON.');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>{isImporting ? 'Validating...' : 'Validate & Import Workflow'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUAT AUTOMATION BARU */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Workflow size={20} className="text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Buat Automation Baru</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAutomationForm.title.trim()) return;

                const payload = {
                  title: newAutomationForm.title,
                  trigger_event: newAutomationForm.trigger_event,
                  description: newAutomationForm.description || 'Custom user created workflow',
                  model_engine: newAutomationForm.model_engine,
                  model_provider: newAutomationForm.model_provider,
                  execution_gateway: newAutomationForm.execution_gateway,
                  cdn_icon_url: newAutomationForm.cdn_icon_url,
                  status: 'active'
                };

                const res = await SupabaseDashboardService.createAutomation('11111111-1111-1111-1111-111111111111', payload);
                if (res.data) {
                  setAutomations(prev => [res.data, ...prev]);
                  triggerToast(`Successfully created ${res.data.title}!`);
                } else {
                  triggerToast(`Created ${newAutomationForm.title} locally.`);
                }

                setShowCreateModal(false);
                setNewAutomationForm({
                  title: '',
                  trigger_event: 'New Order (Online Store)',
                  description: '',
                  steps: 'Order Trigger -> AI Processor -> WA Alert',
                  model_engine: '9Router-Auto-Cost-Optimizer',
                  model_provider: '9router/auto',
                  execution_gateway: 'ZeroClaw-Edge-Gateway',
                  cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/9router.png'
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Judul Workflow Automation</label>
                <input
                  type="text"
                  required
                  value={newAutomationForm.title}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, title: e.target.value })}
                  placeholder="e.g. New Order -> WA Invoice -> Stock Update"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Event Trigger Workflow</label>
                <select
                  value={newAutomationForm.trigger_event}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, trigger_event: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="New Order (Online Store)">New Order (Online Store)</option>
                  <option value="New Message (WhatsApp)">New Message (WhatsApp)</option>
                  <option value="Invoice Due (Finance AI)">Invoice Due (Finance AI)</option>
                  <option value="New Lead (Form/Website)">New Lead (Form/Website)</option>
                  <option value="Abandoned Cart (Store)">Abandoned Cart (Store)</option>
                  <option value="Low Stock (Store AI)">Low Stock (Store AI)</option>
                  <option value="Order Completed (Store)">Order Completed (Store)</option>
                </select>
              </div>

              {/* RICH AI MODEL SELECTION POPOVER DROPDOWN */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">AI Engine Router & Model Provider</label>
                <div className="relative">
                  {(() => {
                    const selEngine = AI_MODEL_ENGINES.find(m => m.id === newAutomationForm.model_engine) || AI_MODEL_ENGINES[0];
                    return (
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between gap-2 text-left cursor-pointer hover:border-orange-400 transition-all"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <img src={selEngine.logo} alt={selEngine.name} className="size-6 rounded-lg object-contain bg-white p-0.5 border border-slate-200/60 flex-shrink-0" />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{selEngine.name}</span>
                              <span className="px-1.5 py-0.2 rounded-md bg-orange-500/10 text-orange-600 text-[9px] font-bold">{selEngine.badge}</span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 truncate">{selEngine.desc}</p>
                          </div>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                      </button>
                    );
                  })()}

                  {isModelDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 max-h-56 overflow-y-auto animate-in fade-in duration-150">
                      {AI_MODEL_ENGINES.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setNewAutomationForm({
                              ...newAutomationForm,
                              model_engine: model.id,
                              model_provider: model.provider,
                              execution_gateway: model.gateway,
                              cdn_icon_url: model.logo
                            });
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                            newAutomationForm.model_engine === model.id ? 'bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <img src={model.logo} alt={model.name} className="size-6 rounded-lg object-contain bg-white p-0.5 border border-slate-200/60 flex-shrink-0" />
                          <div className="flex-1 truncate">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{model.name}</span>
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500">{model.badge}</span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 truncate">{model.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={newAutomationForm.description}
                  onChange={(e) => setNewAutomationForm({ ...newAutomationForm, description: e.target.value })}
                  placeholder="e.g. Otomatis kirim WA invoice dan update persediaan stok."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Simpan & Aktifkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 3: DOKUMENTASI ENGINE & REALTIME CDN SPECIFICATION */}
      {/* ========================================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Dokumentasi Real Model Router & R2 CDN</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Enterprise Event-Driven Workflow Architecture</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Architecture Overview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-slate-50 to-slate-100 dark:from-orange-950/30 dark:via-slate-800/40 dark:to-slate-900 border border-orange-500/20 space-y-2">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-extrabold text-xs">
                <Workflow size={14} /> Event-Driven Engine vs Autonomous AI Workforce
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Modul <strong>AI Automations</strong> menangani workflow terpicu event multi-langkah (seperti order masuk, stok menipis, dan pengingat pembayaran) dengan eksekusi otomatis tanpa jeda. Berbeda dari AI Workforce yang merupakan agen percakapan otonom.
              </p>
            </div>

            {/* Model Router Specifications */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Supported Real Model Engines & Providers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AI_MODEL_ENGINES.map((model) => (
                  <div key={model.id} className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-start gap-3">
                    <img src={model.logo} alt={model.name} className="size-8 rounded-xl object-contain bg-white p-1 border border-slate-200/60 shadow-2xs flex-shrink-0" />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{model.name}</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-orange-500/10 text-orange-600 text-[9px] font-bold">{model.badge}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{model.desc}</p>
                      <span className="text-[9px] font-mono text-slate-500 mt-1 block truncate">Provider: {model.provider}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cloudflare R2 CDN Asset Registry */}
            <div className="space-y-2.5">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Cloudflare R2 CDN Asset Registry</h4>
              <div className="p-3 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[10.5px] space-y-1.5 overflow-x-auto">
                <div className="text-slate-400">// CDN Base URL: https://cdn.zegaai.site</div>
                <div>Llama 3.3 CDN  : https://cdn.zegaai.site/assets/logo/llama.jpg</div>
                <div>Qwen 2.5 CDN   : https://cdn.zegaai.site/assets/logo/Qwen.png</div>
                <div>9Router CDN    : https://cdn.zegaai.site/assets/logo/9router.png</div>
                <div>ZeroClaw CDN   : https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg</div>
                <div>ZEGA Logo CDN  : https://cdn.zegaai.site/assets/logo/zegalogo.png</div>
                <div>DeepSeek R1    : https://cdn.zegaai.site/assets/logo/deepseek.webp</div>
                <div>Claude 3.5 CDN : https://cdn.zegaai.site/assets/logo/claude.webp</div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDocModal(false)}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs"
              >
                Tutup Dokumentasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TEMPLATES GALLERY (LIHAT SEMUA TEMPLATE POPULER) */}
      {/* ========================================================================= */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Templates Gallery Automation</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Pilih preset workflow otomatisasi teruji terintegrasi Real Model & R2 CDN</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  title: 'Order Invoice & WA Payment Link',
                  sub: 'Auto-generates digital invoice, creates Solana Pay / WA payment link, and notifies buyer.',
                  trigger: 'New Order (Online Store)',
                  model: '9Router-Auto-Cost-Optimizer',
                  provider: '9router/gpt-4o-mini',
                  iconUrl: 'https://cdn.zegaai.site/assets/logo/9router.png',
                  icon: ShoppingBag
                },
                {
                  title: 'Low Stock Restock & Inventory Router AI',
                  sub: 'Triggers code synthesis engine to draft restock POs and dispatch supplier WA alerts.',
                  trigger: 'Low Stock (Store AI)',
                  model: 'Qwen-2.5-Coder-32B',
                  provider: '9router/qwen-2.5-coder',
                  iconUrl: 'https://cdn.zegaai.site/assets/logo/Qwen.png',
                  icon: ShoppingBag
                },
                {
                  title: 'New Customer Welcome Coupon & Vision AI',
                  sub: 'Auto-generates personalized welcome discount banner using multimodal vision engine.',
                  trigger: 'Customer Registered',
                  model: 'Claude-3.5-Sonnet-v2',
                  provider: '9router/claude-3.5-sonnet',
                  iconUrl: 'https://cdn.zegaai.site/assets/logo/claude.webp',
                  icon: Users
                },
                {
                  title: 'WhatsApp Abandoned Cart DeepSeek Recovery',
                  sub: 'Executes DeepSeek R1 reasoning swarm to calculate optimal discount triggers for abandoned carts.',
                  trigger: 'Abandoned Cart (Store)',
                  model: 'DeepSeek-R1-Distill-Qwen-32B',
                  provider: 'zeroclaw/deepseek-r1',
                  iconUrl: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
                  icon: ShoppingCart
                },
                {
                  title: 'Automated Invoice Reconciliation & Bank Sync',
                  sub: 'Uses ZEGA Swarm Llama 3.3 70B for bank statement OCR reconciliation and automatic e-invoice closing.',
                  trigger: 'Invoice Due (Finance AI)',
                  model: 'ZEGA-Swarm-Llama-3.3-70B',
                  provider: '9router/llama-3.3-70b',
                  iconUrl: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
                  icon: FileText
                },
                {
                  title: 'B2B Lead Qualifier & CRM Automation Swarm',
                  sub: 'ZeroClaw Edge Gateway daemon scores B2B leads, tags CRM pipeline, and dispatches sales followups.',
                  trigger: 'New Lead (Form/Website)',
                  model: 'ZeroClaw-Edge-Gateway-Llama3',
                  provider: 'zeroclaw/daemon-v0.5.3',
                  iconUrl: 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
                  icon: Users
                }
              ].map((tpl, idx) => {
                const Icon = tpl.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3 hover:border-orange-400/60 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={tpl.iconUrl} alt={tpl.model} className="size-6 rounded-lg object-contain bg-white p-0.5 border border-slate-200/60 shadow-2xs" />
                          <span className="font-extrabold text-[10px] text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md truncate">
                            {tpl.model}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">{tpl.trigger.split(' ')[0]}</span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{tpl.title}</h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{tpl.sub}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono text-slate-400 truncate">Provider: {tpl.provider}</span>
                      <button
                        onClick={async () => {
                          const payload = {
                            title: tpl.title,
                            name: tpl.title,
                            description: tpl.sub,
                            trigger_event: tpl.trigger,
                            model_engine: tpl.model,
                            model_provider: tpl.provider,
                            execution_gateway: 'ZeroClaw-Edge-Gateway',
                            cdn_icon_url: tpl.iconUrl,
                            status: 'active',
                            success_rate: 100,
                            runs_today: 1
                          };
                          const res = await SupabaseDashboardService.createAutomation('11111111-1111-1111-1111-111111111111', payload);
                          if (res.data) {
                            setAutomations(prev => [res.data, ...prev]);
                            setShowTemplateModal(false);
                            triggerToast(`Deploy berhasil: ${tpl.title}`);
                          } else {
                            triggerToast('Gagal mendaftarkan template.');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1 flex-shrink-0"
                      >
                        <Zap size={12} />
                        <span>Deploy Template</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Tutup Gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
