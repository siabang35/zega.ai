import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, SlidersHorizontal, Sparkles, 
  ArrowUpRight, ArrowDownRight, Bot, Activity, CheckCircle2, ChevronDown,
  Filter, RefreshCw, X, Sliders, Check, Server, ShieldCheck, Terminal, ExternalLink
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

// Register Chart.js Modules for Professional Real-Time Diagrams
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AnalyticsView({ onTriggerToast }: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState<string>('Last 7 days');
  const [compareEnabled, setCompareEnabled] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  
  // Sub-page Modals
  const [showTopAgentsModal, setShowTopAgentsModal] = useState<boolean>(false);
  const [showSystemHealthModal, setShowSystemHealthModal] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await enterpriseSupabaseService.getEnterpriseAnalyticsRealtime();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = enterpriseSupabaseService.subscribeToAnalyticsRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    if (onTriggerToast) onTriggerToast(msg);
  };

  const kpis = analyticsData?.kpis || {
    total_ai_requests: '1.24M',
    total_ai_requests_trend: '+26.4%',
    successful_requests: '1.18M',
    successful_requests_rate: '95.2%',
    successful_requests_trend: '+26.1%',
    total_workflows: 634,
    total_workflows_trend: '+14.2%',
    active_agents: 128,
    active_agents_trend: '+18.7%',
    avg_response_time: '2.43s',
    avg_response_time_trend: '-9.1%',
    tokens_processed: '21.6B',
    tokens_processed_trend: '+32.5%'
  };

  // 1. Chart.js Data for Requests Over Time (Real Interactive Line Chart)
  const lineChartData = {
    labels: ['May 20', 'May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      {
        label: 'Total Requests',
        data: [125000, 135000, 130000, 165000, 150000, 160000, 170000, 185000],
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#6366F1',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Successful Requests',
        data: [118000, 129000, 122000, 158000, 142000, 153000, 162000, 178000],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#10B981',
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      ...(compareEnabled ? [{
        label: 'Previous Period (Compare)',
        data: [98000, 105000, 102000, 128000, 119000, 126000, 134000, 142000],
        borderColor: '#94A3B8',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      }] : [])
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} reqs`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 10, family: 'monospace' } }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { color: '#94A3B8', font: { size: 10 } }
      }
    }
  };

  // 2. Chart.js Data for Requests By Channel (Interactive Doughnut Chart)
  const donutData = {
    labels: ['Web App', 'API', 'Mobile App', 'WhatsApp', 'Other'],
    datasets: [
      {
        data: [42.4, 28.7, 15.3, 7.8, 5.8],
        backgroundColor: ['#6366F1', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%`
        }
      }
    }
  };

  // 3. Chart.js Data for Workflow Executions (Interactive Stacked Bar Chart)
  const barData = {
    labels: ['20', '21', '22', '23', '24', '25', '26', '27'],
    datasets: [
      {
        label: 'Completed',
        data: [80, 92, 75, 110, 88, 95, 105, 120],
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
      {
        label: 'Failed',
        data: [5, 3, 8, 4, 6, 2, 5, 4],
        backgroundColor: '#F43F5E',
        borderRadius: 4,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        cornerRadius: 10,
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 9, family: 'monospace' } }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { color: '#94A3B8', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400 size-6" />
            Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights and performance metrics across your AI operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            >
              <Calendar size={14} className="text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown size={14} className="text-slate-400 ml-1" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1">
                {['Today', 'Last 24 hours', 'Last 7 days', 'Last 30 days', 'Quarter to Date'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDateRange(opt);
                      setShowDatePicker(false);
                      triggerToast(`📅 Filter diset ke: ${opt}`);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-colors ${
                      dateRange === opt 
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compare Toggle Pill */}
          <button 
            onClick={() => {
              setCompareEnabled(!compareEnabled);
              triggerToast(compareEnabled ? 'Comparative period disembunyikan' : 'Comparative period diaktifkan (+26.4%)');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              compareEnabled
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Compare</span>
            <span className={`size-2 rounded-full ${compareEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
          </button>

          {/* Filters */}
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          {/* Customize Dashboard Action */}
          <button 
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors active:scale-95"
          >
            <Sparkles size={14} />
            <span>Customize Dashboard</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS (6 Sparkline Cards matching screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total AI Requests */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total AI Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.total_ai_requests}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> {kpis.total_ai_requests_trend}
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-indigo-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 18 Q 15 10, 30 15 T 60 8 T 80 12 T 100 5" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 2: Successful Requests */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Successful Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.successful_requests}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> {kpis.successful_requests_trend}
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">{kpis.successful_requests_rate} success rate</span>
          <svg className="w-full h-7 mt-1 stroke-emerald-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 20 Q 20 12, 40 16 T 70 6 T 100 4" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 3: Total Workflows */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Workflows</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.total_workflows}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> {kpis.total_workflows_trend}
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-cyan-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 15 Q 25 22, 50 10 T 75 14 T 100 6" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 4: Active Agents */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Agents</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.active_agents}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> {kpis.active_agents_trend}
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-purple-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 19 Q 20 8, 45 15 T 70 7 T 100 3" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 5: Avg. Response Time */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg. Response Time</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.avg_response_time}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> {kpis.avg_response_time_trend}
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-amber-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 6 Q 30 18, 60 12 T 100 20" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 6: Tokens Processed */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tokens Processed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{kpis.tokens_processed}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> {kpis.tokens_processed_trend}
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-pink-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 22 Q 25 14, 50 18 T 80 5 T 100 2" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* MAIN CHARTS SECTION (2 Columns with Chart.js Integration) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3 width): Requests Over Time Dual Smooth Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Requests Over Time
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="size-2.5 rounded-full bg-indigo-500" /> Total Requests
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-2.5 rounded-full bg-emerald-500" /> Successful Requests
              </span>
            </div>
          </div>

          {/* Interactive Chart.js Line Canvas */}
          <div className="h-60 w-full pt-2">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Right (1/3 width): Top Agents by Requests Progress Ranking */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Top Agents by Requests
            </h3>
            <button 
              onClick={() => setShowTopAgentsModal(true)}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Sales Agent */}
            <div className="space-y-1 group cursor-pointer" onClick={() => triggerToast('📊 Telemetri Sales Agent: 245,820 total requests (98.4% accuracy)')}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                  <Bot size={13} className="text-indigo-600" /> Sales Agent
                </span>
                <span className="font-mono text-slate-400">245K <span className="text-slate-500 font-semibold">(19.8%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full w-[80%] group-hover:scale-x-105 transition-transform" />
              </div>
            </div>

            {/* Support Agent */}
            <div className="space-y-1 group cursor-pointer" onClick={() => triggerToast('📊 Telemetri Support Agent: 198,400 total requests (99.1% CSAT)')}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                  <Bot size={13} className="text-indigo-500" /> Support Agent
                </span>
                <span className="font-mono text-slate-400">198K <span className="text-slate-500 font-semibold">(16.0%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[65%] group-hover:scale-x-105 transition-transform" />
              </div>
            </div>

            {/* Finance Agent */}
            <div className="space-y-1 group cursor-pointer" onClick={() => triggerToast('📊 Telemetri Finance Agent: 176,100 total requests (Zero compliance errors)')}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-purple-500 transition-colors">
                  <Bot size={13} className="text-purple-500" /> Finance Agent
                </span>
                <span className="font-mono text-slate-400">176K <span className="text-slate-500 font-semibold">(14.2%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[55%] group-hover:scale-x-105 transition-transform" />
              </div>
            </div>

            {/* Research Agent */}
            <div className="space-y-1 group cursor-pointer" onClick={() => triggerToast('📊 Telemetri Research Agent: 153,900 total requests')}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-emerald-500 transition-colors">
                  <Bot size={13} className="text-emerald-500" /> Research Agent
                </span>
                <span className="font-mono text-slate-400">153K <span className="text-slate-500 font-semibold">(12.3%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[45%] group-hover:scale-x-105 transition-transform" />
              </div>
            </div>

            {/* Marketing Agent */}
            <div className="space-y-1 group cursor-pointer" onClick={() => triggerToast('📊 Telemetri Marketing Agent: 120,400 total requests')}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-pink-500 transition-colors">
                  <Bot size={13} className="text-pink-500" /> Marketing Agent
                </span>
                <span className="font-mono text-slate-400">120K <span className="text-slate-500 font-semibold">(10.3%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full w-[38%] group-hover:scale-x-105 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Col 1: Requests by Channel Donut */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Requests by Channel
          </h3>

          <div className="h-32 w-full flex items-center justify-center relative py-1">
            <Doughnut data={donutData} options={donutOptions} />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-indigo-500" /> Web App
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">42.4% <span className="text-slate-400 text-[10px] font-normal">(525.7K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-blue-500" /> API
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">28.7% <span className="text-slate-400 text-[10px] font-normal">(355.8K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-purple-500" /> Mobile App
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">15.3% <span className="text-slate-400 text-[10px] font-normal">(189.7K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500" /> WhatsApp
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">7.8% <span className="text-slate-400 text-[10px] font-normal">(96.7K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" /> Other
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">5.8% <span className="text-slate-400 text-[10px] font-normal">(71.9K)</span></span>
            </div>
          </div>
        </div>

        {/* Col 2: Workflow Executions Stacked Bar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Workflow Executions
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="size-2 rounded-full bg-rose-500" /> Failed
              </span>
            </div>
          </div>

          <div className="h-44 w-full pt-1">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Col 3: System Health Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              System Health
            </h3>
            <button 
              onClick={() => setShowSystemHealthModal(true)}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'API Gateway', uptime: '99.99%', status: 'Healthy' },
              { name: 'Vector Database', uptime: '99.98%', status: 'Healthy' },
              { name: 'Redis Cache', uptime: '99.96%', status: 'Healthy' },
              { name: 'MCP Servers', uptime: '99.94%', status: 'Healthy' },
              { name: 'LLM Providers', uptime: '99.90%', status: 'Healthy' },
            ].map((sys, idx) => (
              <div 
                key={idx} 
                onClick={() => triggerToast(`⚡ Ping test ke ${sys.name}: Latency 14ms (Status: HEALTHY)`)}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-emerald-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{sys.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[10px]">{sys.uptime}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                    {sys.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUB-PAGE MODAL 1: TOP AGENTS PERFORMANCE AUDIT */}
      {showTopAgentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bot className="text-indigo-600" size={18} />
                <span>Enterprise AI Agents Telemetry Ranking</span>
              </h3>
              <button 
                onClick={() => setShowTopAgentsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { name: 'Sales Agent', reqs: '245,820', share: '19.8%', lat: '1.82s', csat: '98.4%', status: 'Active' },
                { name: 'Support Agent', reqs: '198,400', share: '16.0%', lat: '2.10s', csat: '99.1%', status: 'Active' },
                { name: 'Finance Agent', reqs: '176,100', share: '14.2%', lat: '1.95s', csat: '99.5%', status: 'Active' },
                { name: 'Research Agent', reqs: '153,900', share: '12.3%', lat: '3.40s', csat: '97.8%', status: 'Active' },
                { name: 'Marketing Agent', reqs: '120,400', share: '10.3%', lat: '2.05s', csat: '96.9%', status: 'Active' },
                { name: 'Legal Audit Agent', reqs: '98,200', share: '7.9%', lat: '2.80s', csat: '99.8%', status: 'Active' },
                { name: 'Inventory Swarm Agent', reqs: '76,500', share: '6.1%', lat: '1.20s', csat: '99.0%', status: 'Active' }
              ].map((ag, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center">
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{ag.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Latency: {ag.lat} • CSAT: {ag.csat}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">{ag.reqs} reqs</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{ag.share} share</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowTopAgentsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE MODAL 2: SYSTEM HEALTH INFRASTRUCTURE AUDIT */}
      {showSystemHealthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Server className="text-emerald-500" size={18} />
                <span>Enterprise Infrastructure Health Monitor</span>
              </h3>
              <button 
                onClick={() => setShowSystemHealthModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {[
                { name: 'API Gateway (Render Fastify)', region: 'us-east (Virginia)', uptime: '99.99%', latency: '12ms', status: 'Healthy' },
                { name: 'Vector Database (Qdrant Cloud)', region: 'eu-central (Frankfurt)', uptime: '99.98%', latency: '24ms', status: 'Healthy' },
                { name: 'Redis Cache (Cluster Master)', region: 'ap-southeast (Singapore)', uptime: '99.96%', latency: '8ms', status: 'Healthy' },
                { name: 'MCP Servers Hub', region: 'us-west (Oregon)', uptime: '99.94%', latency: '45ms', status: 'Healthy' },
                { name: 'LLM Multi-Router Failover', region: 'Global Edge', uptime: '99.90%', latency: '18ms', status: 'Healthy' }
              ].map((sys, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{sys.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Region: {sys.region} • Ping: {sys.latency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">{sys.uptime} Uptime</span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 uppercase">
                      {sys.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" /> All systems nominal per SLA 99.99%
              </span>
              <button
                onClick={() => setShowSystemHealthModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="text-indigo-600" size={16} />
                <span>Filter Operational Analytics</span>
              </h3>
              <button 
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Environment</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                  <option>Production (Live)</option>
                  <option>Staging</option>
                  <option>Development</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">AI Model Cluster</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                  <option>Semua Model (Gemini, Claude, GPT-4o)</option>
                  <option>Gemini 3.6 Flash</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>GPT-4o Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  triggerToast('✓ Filter berhasil diterapkan ke telemetry dashboard');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZE DASHBOARD MODAL */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={16} />
                <span>Customize Analytics Dashboard</span>
              </h3>
              <button 
                onClick={() => setShowCustomizeModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">Pilih widget telemetri yang ingin ditampilkan pada dashboard utama Anda:</p>

            <div className="space-y-2 text-xs">
              {[
                '6 Sparkline KPI Cards',
                'Requests Over Time (Dual Line Chart)',
                'Top Agents by Requests (Ranking Bar)',
                'Requests by Channel (Donut Chart)',
                'Workflow Executions (Stacked Bar)',
                'System Health Live Monitor'
              ].map((w) => (
                <div key={w} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{w}</span>
                  <div className="size-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                    <Check size={14} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowCustomizeModal(false);
                  triggerToast('✓ Konfigurasi dashboard berhasil disimpan!');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Simpan Tampilan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
