import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Search, ChevronDown, CheckCircle2, Clock, 
  ShieldCheck, Mail, ArrowUpRight, ShoppingBag, MessageSquare, 
  FileText, Users, ShoppingCart, BookOpen, ExternalLink, 
  Plus, Upload, Filter, Grid, List, Zap, DollarSign, AlertCircle,
  MoreVertical, X, Check, Trash2, Sliders, Sparkles, RefreshCw,
  FileCode, Code, CheckCircle, ArrowRight
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

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState(SAMPLE_JSON_BLUEPRINT);

  const [newAutomationForm, setNewAutomationForm] = useState({
    title: '',
    trigger_event: 'New Order (Online Store)',
    description: '',
    steps: 'Order Trigger -> AI Processor -> WA Alert'
  });

  // Real-time Database State
  const [automations, setAutomations] = useState<any[]>([
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      title: 'New Order -> Invoice -> WA -> Save -> Update Stock',
      description: 'Buat invoice otomatis saat ada pesanan baru',
      trigger_event: 'New Order (Online Store)',
      last_run: '2 menit yang lalu',
      status: 'active',
      success_rate: 100,
      created_at: '2026-05-12'
    },
    {
      id: 'c2222222-1111-1111-1111-111111111111',
      title: 'Customer Chat -> AI Reply -> Tag -> Follow Up',
      description: 'Balas chat pelanggan otomatis & follow up',
      trigger_event: 'New Message (WhatsApp)',
      last_run: '1 menit yang lalu',
      status: 'active',
      success_rate: 98,
      created_at: '2026-05-10'
    },
    {
      id: 'c3333333-1111-1111-1111-111111111111',
      title: 'Payment Reminder -> WA -> Email -> Update Status',
      description: 'Kirim pengingat pembayaran otomatis',
      trigger_event: 'Invoice Due (Finance AI)',
      last_run: '5 menit yang lalu',
      status: 'active',
      success_rate: 100,
      created_at: '2026-05-08'
    },
    {
      id: 'c4444444-1111-1111-1111-111111111111',
      title: 'New Lead -> CRM -> Email -> Add to List',
      description: 'Lead baru masuk ke CRM dan email list',
      trigger_event: 'New Lead (Form/Website)',
      last_run: '10 menit yang lalu',
      status: 'active',
      success_rate: 94,
      created_at: '2026-05-07'
    },
    {
      id: 'c5555555-1111-1111-1111-111111111111',
      title: 'Abandoned Cart -> WA -> Discount -> Recover',
      description: 'Pulihkan keranjang yang ditinggalkan',
      trigger_event: 'Abandoned Cart (Store)',
      last_run: '15 menit yang lalu',
      status: 'paused',
      success_rate: 86,
      created_at: '2026-05-05'
    },
    {
      id: 'c6666666-1111-1111-1111-111111111111',
      title: 'Stock Alert -> WA -> Order Suggestion',
      description: 'Notifikasi stok menipis & rekomendasi pembelian',
      trigger_event: 'Low Stock (Store AI)',
      last_run: '30 menit yang lalu',
      status: 'active',
      success_rate: 97,
      created_at: '2026-05-02'
    },
    {
      id: 'c7777777-1111-1111-1111-111111111111',
      title: 'Review Request -> WA -> Incentive -> Tag',
      description: 'Minta review pelanggan & beri insentif',
      trigger_event: 'Order Completed (Store)',
      last_run: '1 jam yang lalu',
      status: 'failed',
      success_rate: 72,
      created_at: '2026-05-01'
    }
  ]);

  // Load database data
  const loadAutomations = async () => {
    try {
      setLoading(true);
      const data = await SupabaseDashboardService.getUmkmAutomations('11111111-1111-1111-1111-111111111111');
      if (data && data.length > 0) {
        setAutomations(data);
      }
    } catch (e) {
      console.error('Failed to fetch automations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
    const unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime('11111111-1111-1111-1111-111111111111', () => {
      loadAutomations();
    });
    return () => { unsubscribe(); };
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

  // Calculate summary counts dynamically for 100% Realtime Donut Chart
  const totalCount = automations.length || 12;
  const runningCount = automations.filter(a => a.status === 'active' || a.status === 'running').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;
  const failedCount = automations.filter(a => a.status === 'failed').length;
  const completedCount = automations.filter(a => a.status === 'completed').length;

  const runningPct = Math.round((runningCount / (totalCount || 1)) * 100);
  const pausedPct = Math.round((pausedCount / (totalCount || 1)) * 100);
  const failedPct = Math.round((failedCount / (totalCount || 1)) * 100);
  const completedPct = 100 - (runningPct + pausedPct + failedPct);

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
    return { Icon: Zap, bg: 'bg-orange-50 text-orange-600 dark:bg-orange-950/60' };
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
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">{runningCount || 12}</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ 20% vs last month</span>
            </div>
          </div>
        </div>

        {/* CARD 2: TASKS AUTOMATED TODAY */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Tasks Automated Today</span>
            <div className="size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Zap size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">89</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ 18% vs yesterday</span>
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
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">96%</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ 2% vs yesterday</span>
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
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">56.2</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ 22% vs last week</span>
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
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">Rp2.100.000</div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>▲ 20% vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTION BAR & FILTER TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
          {['Semua', 'Berjalan', 'Dijeda', 'Gagal', 'Selesai'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
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
            <option value="Berjalan">Berjalan</option>
            <option value="Dijeda">Dijeda</option>
            <option value="Gagal">Gagal</option>
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

          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                    <th className="pb-3 pl-2">AUTOMATION</th>
                    <th className="pb-3">TRIGGER</th>
                    <th className="pb-3">AKSI TERAKHIR</th>
                    <th className="pb-3">STATUS</th>
                    <th className="pb-3 text-center">SUCCESS RATE</th>
                    <th className="pb-3">DIBUAT</th>
                    <th className="pb-3 pr-2 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAutomations.map((item) => {
                    const { Icon: TriggerIcon, bg: triggerBg } = getTriggerIconInfo(item.trigger_event || item.title);
                    const isRunning = item.status === 'active' || item.status === 'running';
                    const isPaused = item.status === 'paused';
                    const isFailed = item.status === 'failed';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 pl-2 pr-3 max-w-[220px]">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-500 transition-colors" title={item.title}>
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
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

                        <td className="py-3.5 text-[10.5px] text-slate-400 whitespace-nowrap">
                          {item.created_at ? item.created_at.slice(0, 10) : '12 Mei 2026'}
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
              {filteredAutomations.map((item) => {
                const { Icon: TriggerIcon, bg: triggerBg } = getTriggerIconInfo(item.trigger_event || item.title);
                const isRunning = item.status === 'active' || item.status === 'running';

                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3 hover:border-orange-400/50 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`size-7 rounded-xl ${triggerBg} flex items-center justify-center`}>
                          <TriggerIcon size={14} />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${isRunning ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          • {isRunning ? 'Berjalan' : 'Dijeda'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{item.description}</p>
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

          {/* Pagination Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tampilkan 1-{filteredAutomations.length} dari {automations.length} automation</span>
            <div className="flex items-center gap-1.5">
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer">&lt;</button>
              <button className="px-3 py-1 rounded-lg bg-orange-500 text-white font-extrabold">1</button>
              <button className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer">2</button>
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer">&gt;</button>
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
              <button onClick={() => triggerToast('Opening full templates gallery')} className="text-[10px] font-extrabold text-orange-500 hover:underline cursor-pointer">Lihat Semua &gt;</button>
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
            onClick={() => triggerToast('Opening enterprise documentation...')}
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
                  <Sparkles size={14} /> Import Workflow JSON Definition
                </div>
                <p className="text-[11px]">Paste JSON workflow blueprint below or select a predefined template.</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Workflow Definition (JSON)</label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportJsonText(SAMPLE_JSON_BLUEPRINT)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Load Order Preset
                </button>
                <button
                  type="button"
                  onClick={() => setImportJsonText(JSON.stringify({
                    title: "WhatsApp Auto Lead Qualifier",
                    trigger_event: "New Message (WhatsApp)",
                    description: "Qualifies incoming leads using RAG and tags CRM.",
                    workflow_steps: ["Message Ingest", "AI Intent Classification", "CRM Tagging"]
                  }, null, 2))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Load WA Bot Preset
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const parsed = JSON.parse(importJsonText);
                    const payload = {
                      title: parsed.title || 'Imported Workflow',
                      trigger_event: parsed.trigger_event || 'Imported Trigger',
                      description: parsed.description || 'Workflow imported from blueprint',
                      workflow_steps: parsed.workflow_steps || ['Trigger', 'AI Step', 'Action'],
                      status: 'active'
                    };

                    const res = await SupabaseDashboardService.createAutomation('11111111-1111-1111-1111-111111111111', payload);
                    if (res.data) {
                      setAutomations(prev => [res.data, ...prev]);
                      triggerToast(`Successfully imported ${res.data.title}!`);
                    } else {
                      triggerToast(`Imported ${payload.title} locally.`);
                    }

                    setShowImportModal(false);
                  } catch (err) {
                    triggerToast('Invalid JSON format! Please fix JSON syntax errors.');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={14} /> Validate & Import
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
                <Zap size={20} className="text-orange-500" />
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
                setNewAutomationForm({ title: '', trigger_event: 'New Order (Online Store)', description: '', steps: '' });
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
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Event Trigger</label>
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
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Simpan & Aktifkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
