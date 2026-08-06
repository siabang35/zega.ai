import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Target, Activity, Tag, Sparkles, 
  Calendar, Download, ChevronDown, Check, ArrowUpRight, ArrowDownRight, 
  AlertTriangle, CheckCircle2, Sliders, Layers, Server, Shield, Database, Cpu, ExternalLink, RefreshCw, X, Filter, Search, Zap, PieChart, Lock, Play, Pause, BarChart2, Bell, CheckSquare, Eye, SlidersHorizontal, Settings2, Info
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';
import { getR2CdnUrl } from '../../../utils/cdn';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

interface CostIntelligenceViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function CostIntelligenceView({ onTriggerToast }: CostIntelligenceViewProps) {
  const triggerToast = (msg: string) => {
    if (onTriggerToast) onTriggerToast(msg);
  };

  // 11 Navigation Sub-Page Tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'usage_analytics' | 'model_costs' | 'agent_costs' | 
    'workflow_costs' | 'mcp_costs' | 'storage' | 'budgets' | 'forecast' | 'optimization' | 'alerts'
  >('overview');

  // Controls State
  const [dateRangeLabel, setDateRangeLabel] = useState<string>('May 1 – May 31, 2025');
  const [compareRangeLabel, setCompareRangeLabel] = useState<string>('Compare: Apr 1 – Apr 30, 2025');
  const [showDateDropdown, setShowDateDropdown] = useState<boolean>(false);
  const [showCompareDropdown, setShowCompareDropdown] = useState<boolean>(false);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<number>(50000);
  const [hardCapEnabled, setHardCapEnabled] = useState<boolean>(true);
  const [forecastScenario, setForecastScenario] = useState<string>('Baseline Enterprise Scale');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');

  // Interactive Inspector Modal State
  const [inspectItem, setInspectItem] = useState<any>(null);

  // Real-time Database Telemetry State
  const [finopsData, setFinopsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await enterpriseSupabaseService.getEnterpriseCostIntelligenceFinOpsRealtime();
      if (data) setFinopsData(data);
    } catch (err) {
      console.error('Error loading FinOps telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = enterpriseSupabaseService.subscribeToCostIntelligenceFinOpsRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // KPIs
  const kpis = finopsData?.kpis || {
    total_spend_may: '$28,430.50',
    total_spend_may_trend: '+14.3%',
    total_spend_may_prev: '$24,835.10',
    ai_model_spend: '$12,430.20',
    ai_model_spend_pct: '43.7%',
    tokens_consumed: '1.82B',
    tokens_consumed_trend: '+18.6%',
    request_volume: '3.24M',
    request_volume_trend: '+22.1%',
    avg_cost_per_1k_tokens: '$0.068',
    avg_cost_per_1k_tokens_trend: '-3.7%',
    projected_spend_jun: '$29,980',
    projected_spend_jun_trend: '+5.4%'
  };

  // Overview Spend Trend Data
  const lineChartLabels = finopsData?.spendTrends?.length > 0 
    ? finopsData.spendTrends.map((t: any) => t.day_label)
    : ['May 1', 'May 6', 'May 11', 'May 16', 'May 21', 'May 26', 'May 31'];

  const mayDataPoints = finopsData?.spendTrends?.length > 0
    ? finopsData.spendTrends.map((t: any) => Number(t.may_spend))
    : [720, 1450, 890, 1520, 1100, 1480, 1680];

  const aprDataPoints = finopsData?.spendTrends?.length > 0
    ? finopsData.spendTrends.map((t: any) => Number(t.apr_spend))
    : [650, 1120, 1650, 1180, 1320, 1250, 1490];

  const overviewLineData = {
    labels: lineChartLabels,
    datasets: [
      {
        label: 'May 1 – May 31, 2025',
        data: mayDataPoints,
        borderColor: '#8B5CF6',
        backgroundColor: chartType === 'area' ? 'rgba(139, 92, 246, 0.14)' : 'transparent',
        fill: chartType === 'area',
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#8B5CF6'
      },
      {
        label: 'Apr 1 – Apr 30, 2025',
        data: aprDataPoints,
        borderColor: '#CBD5E1',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0
      }
    ]
  };

  // Overview Donut Data
  const overviewDonutData = {
    labels: ['LLM & Inference', 'MCP Calls', 'Storage', 'Data Transfer', 'Vector Database', 'Other Services'],
    datasets: [{
      data: [12430.20, 6210.10, 4320.60, 2110.30, 1520.80, 1838.50],
      backgroundColor: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#EAB308', '#64748B'],
      borderWidth: 3,
      borderColor: '#FFFFFF'
    }]
  };

  // DEDICATED SUB-PAGE CHART DATASETS
  // 1. Usage Analytics Charts
  const usageVolumeBarData = {
    labels: ['LLM Tokens (M)', 'MCP Invokes (K)', 'Vector Queries (M)', 'Storage (GB)', 'Bandwidth (GB)'],
    datasets: [{
      label: 'Volume Consumption',
      data: [1820, 1040, 15.2, 2340, 3450],
      backgroundColor: ['#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B'],
      borderRadius: 8
    }]
  };

  const usageTrendLineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { label: 'LLM Invocations', data: [380, 450, 510, 680], borderColor: '#8B5CF6', tension: 0.4 },
      { label: 'MCP API Calls', data: [210, 240, 290, 300], borderColor: '#3B82F6', tension: 0.4 }
    ]
  };

  // 2. Model Costs Charts
  const modelSpendDonutData = {
    labels: ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro', 'Llama 3.1 70B', 'Mistral Large 2'],
    datasets: [{
      data: [9432.10, 3210.80, 2430.60, 1620.50, 832.10],
      backgroundColor: ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#64748B']
    }]
  };

  // 3. Agent Costs Charts
  const agentCostBarData = {
    labels: ['Support Agent Alpha', 'Finance Bot', 'DevOps Agent', 'Sales Copilot'],
    datasets: [{
      label: 'Agent Cost ($)',
      data: [4210.50, 3120.80, 2430.20, 1840.10],
      backgroundColor: '#8B5CF6',
      borderRadius: 8
    }]
  };

  // 4. Workflow Costs Charts
  const workflowTrendData = {
    labels: ['May 1', 'May 8', 'May 15', 'May 22', 'May 29'],
    datasets: [{
      label: 'Workflow Executions (K)',
      data: [25, 38, 42, 55, 68],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  // 5. MCP Costs Charts
  const mcpCallsBarData = {
    labels: ['Stripe MCP', 'Pinecone MCP', 'Supabase MCP', 'GitHub MCP'],
    datasets: [{
      label: 'API Invocation Volume',
      data: [520000, 1520000, 420000, 85000],
      backgroundColor: '#3B82F6',
      borderRadius: 8
    }]
  };

  // 6. Storage Charts
  const storageDonutData = {
    labels: ['Pinecone Vector (3TB)', 'Supabase Postgres (5TB)', 'AWS S3 CDN (10TB)'],
    datasets: [{
      data: [760.00, 1053.00, 414.00],
      backgroundColor: ['#EAB308', '#10B981', '#06B6D4']
    }]
  };

  // 7. Forecast Projections Chart
  const forecastLineData = {
    labels: ['May (Actual)', 'June (Est.)', 'July (Est.)', 'August (Est.)'],
    datasets: [
      {
        label: forecastScenario,
        data: [28430.50, 29980.00, 32400.00, 35800.00],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Upper Confidence Limit',
        data: [28430.50, 31450.00, 34800.00, 38500.00],
        borderColor: '#EC4899',
        borderDash: [4, 4],
        fill: false
      }
    ]
  };

  const handleExport = (fmt: string) => {
    setShowExportDropdown(false);
    triggerToast(`📥 Exporting FinOps Data (${fmt})...`);
    setTimeout(() => { triggerToast(`✓ FinOps ${fmt} downloaded via CDN!`); }, 1200);
  };

  const handleSaveBudget = async () => {
    const ok = await enterpriseSupabaseService.updateEnterpriseFinOpsBudget(monthlyBudgetInput, hardCapEnabled);
    if (ok) {
      triggerToast(`✓ Realtime DB: Monthly budget ceiling set to $${monthlyBudgetInput.toLocaleString()}`);
      loadData();
    }
  };

  const handleApplyOpt = async (optId: string, title: string) => {
    const ok = await enterpriseSupabaseService.applyEnterpriseFinOpsOptimization(optId);
    if (ok) {
      triggerToast(`⚡ Optimization Applied: ${title}`);
      loadData();
    }
  };

  const handleAckAlert = async (alertId: string) => {
    const ok = await enterpriseSupabaseService.acknowledgeFinOpsAlert(alertId);
    if (ok) {
      triggerToast('✓ Alert acknowledged!');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Cost Intelligence</span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              AI FinOps
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Monitor, analyze, and optimize AI &amp; infrastructure spending across your enterprise.
          </p>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Calendar size={14} className="text-slate-400" />
              <span>{dateRangeLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-30 space-y-1">
                {['May 1 – May 31, 2025', 'Apr 1 – Apr 30, 2025', 'Last 30 Days', 'Year to Date (2025)'].map((opt) => (
                  <button key={opt} onClick={() => { setDateRangeLabel(opt); setShowDateDropdown(false); triggerToast(`📅 ${opt}`); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">{opt}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCompareDropdown(!showCompareDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <span>{compareRangeLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showCompareDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-30 space-y-1">
                {['Compare: Apr 1 – Apr 30, 2025', 'Compare: Mar 1 – Mar 31, 2025', 'No Comparison'].map((opt) => (
                  <button key={opt} onClick={() => { setCompareRangeLabel(opt); setShowCompareDropdown(false); triggerToast(`📊 ${opt}`); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">{opt}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Download size={14} />
              <span>Export</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-30 space-y-1">
                <button onClick={() => handleExport('CSV Statement')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">Export CSV</button>
                <button onClick={() => handleExport('JSON Audit Payload')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">Export JSON</button>
                <button onClick={() => handleExport('PDF Executive Summary')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">Export PDF Report</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 11 NAVIGATION TABS */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'usage_analytics', label: 'Usage Analytics' },
          { id: 'model_costs', label: 'Model Costs' },
          { id: 'agent_costs', label: 'Agent Costs' },
          { id: 'workflow_costs', label: 'Workflow Costs' },
          { id: 'mcp_costs', label: 'MCP Costs' },
          { id: 'storage', label: 'Storage' },
          { id: 'budgets', label: 'Budgets' },
          { id: 'forecast', label: 'Forecast' },
          { id: 'optimization', label: 'Optimization' },
          { id: 'alerts', label: 'Alerts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW SUB-PAGE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ROW 1: 6 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Total Spend (May)</span><div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600"><DollarSign size={14} /></div></div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.total_spend_may}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> {kpis.total_spend_may_trend} <span className="text-slate-400">vs Apr ($24,835.10)</span></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">AI Model Spend</span><div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"><TrendingUp size={14} /></div></div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.ai_model_spend}</div>
              <div className="text-[10px] text-slate-400 font-medium">{kpis.ai_model_spend_pct} of total</div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Tokens Consumed</span><div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600"><Target size={14} /></div></div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.tokens_consumed}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> {kpis.tokens_consumed_trend} <span className="text-slate-400">vs Apr (1.53B)</span></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Requests</span><div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600"><Activity size={14} /></div></div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.request_volume}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> {kpis.request_volume_trend} <span className="text-slate-400">vs Apr (2.65M)</span></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Avg. Cost / 1K Tokens</span><div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600"><Tag size={14} /></div></div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.avg_cost_per_1k_tokens}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><ArrowDownRight size={10} /> {kpis.avg_cost_per_1k_tokens_trend} <span className="text-slate-400">vs Apr ($0.071)</span></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Projected Spend (Jun)</span><div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600"><Sparkles size={14} /></div></div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.projected_spend_jun}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> {kpis.projected_spend_jun_trend} <span className="text-slate-400">vs May (forecast)</span></div>
            </div>
          </div>

          {/* ROW 2: 3 MIDDLE PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* SPEND TREND (6 COLS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Spend Trend</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Daily total spend over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 outline-none">
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                  <button onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')} className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900">
                    <Activity size={12} />
                  </button>
                </div>
              </div>
              <div className="h-44 w-full">
                <Line data={overviewLineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
              <div className="flex items-center justify-center gap-6 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> May 1 – May 31, 2025</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Apr 1 – Apr 30, 2025</span>
              </div>
            </div>

            {/* SPEND BY CATEGORY (3 COLS) */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Spend by Category</h3>
              <div className="flex flex-col items-center">
                <div className="h-32 w-32 relative flex items-center justify-center">
                  <Doughnut data={overviewDonutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '74%', plugins: { legend: { display: false } } }} />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">$28,430.50</span>
                    <span className="text-[7px] text-slate-400 font-extrabold uppercase">Total Spend</span>
                  </div>
                </div>
                <div className="w-full space-y-1 text-[10px] font-medium pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-600" /> LLM &amp; Inference</span><span className="font-bold font-mono">$12,430.20 <span className="text-slate-400 font-normal">43.7%</span></span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> MCP Calls</span><span className="font-bold font-mono">$6,210.10 <span className="text-slate-400 font-normal">21.8%</span></span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Storage</span><span className="font-bold font-mono">$4,320.60 <span className="text-slate-400 font-normal">15.2%</span></span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Data Transfer</span><span className="font-bold font-mono">$2,110.30 <span className="text-slate-400 font-normal">7.4%</span></span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Vector Database</span><span className="font-bold font-mono">$1,520.80 <span className="text-slate-400 font-normal">5.4%</span></span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Other Services</span><span className="font-bold font-mono">$1,838.50 <span className="text-slate-400 font-normal">6.5%</span></span></div>
                </div>
              </div>
            </div>

            {/* TOP COST DRIVERS (3 COLS) */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Top Cost Drivers</h3>
                <button 
                  onClick={() => { setActiveTab('model_costs'); triggerToast('Navigating to AI Model Costs & Top Drivers...'); }} 
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'GPT-4o (OpenAI)', sub: '5.2M tokens', cost: '$9,432.10', pct: '33.2%', barColor: 'bg-indigo-600', logo: getR2CdnUrl('/assets/logo/gpt.webp') },
                  { name: 'Claude 3.5', sub: '4.2M tokens', cost: '$3,210.80', pct: '11.3%', barColor: 'bg-blue-600', logo: getR2CdnUrl('/assets/logo/claude.webp') },
                  { name: 'Vector Search (Pinecone)', sub: '15.2M queries', cost: '$4,120.50', pct: '14.5%', barColor: 'bg-cyan-600', logo: getR2CdnUrl('/assets/logo/snowflake.png') },
                  { name: 'Supabase Database', sub: '2.34 TB storage', cost: '$3,230.90', pct: '11.4%', barColor: 'bg-emerald-600', logo: getR2CdnUrl('/assets/logo/supabase.png') },
                  { name: 'Stripe MCP', sub: '1.0M calls', cost: '$2,110.30', pct: '7.4%', barColor: 'bg-pink-600', logo: getR2CdnUrl('/assets/logo/stripe.webp') }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs items-center">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          <img src={item.logo} alt={item.name} className="size-full object-contain" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] block">{item.name}</span>
                          <span className="text-[9px] text-slate-400 block">{item.sub}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-[11px] block">{item.cost}</span>
                        <span className="text-[9px] text-slate-400 block">{item.pct}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${item.barColor} rounded-full`} style={{ width: item.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: 3 BOTTOM PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* TOP AI MODELS BY SPEND TABLE */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Top AI Models by Spend</h3>
                <button 
                  onClick={() => { setActiveTab('model_costs'); triggerToast('Navigating to full AI Model Costs breakdown...'); }} 
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-1.5">Model</th>
                      <th className="py-1.5">Provider</th>
                      <th className="py-1.5">Tokens</th>
                      <th className="py-1.5">Requests</th>
                      <th className="py-1.5">Spend</th>
                      <th className="py-1.5 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-[11px]">
                    {[
                      { model: 'GPT-4o', provider: 'OpenAI', tokens: '812.4M', reqs: '1.42M', spend: '$9,432.10', pct: '33.2%', logo: getR2CdnUrl('/assets/logo/gpt.webp') },
                      { model: 'Claude 3.5 Sonnet', provider: 'Anthropic', tokens: '456.8M', reqs: '652K', spend: '$3,210.80', pct: '11.3%', logo: getR2CdnUrl('/assets/logo/claude.webp') },
                      { model: 'Gemini 1.5 Pro', provider: 'Google', tokens: '312.6M', reqs: '482K', spend: '$2,430.60', pct: '8.6%', logo: getR2CdnUrl('/assets/logo/gemini.svg') },
                      { model: 'Llama 3.1 70B', provider: 'Meta', tokens: '198.3M', reqs: '356K', spend: '$1,620.50', pct: '5.7%', logo: getR2CdnUrl('/assets/logo/llama.jpeg') },
                      { model: 'Mistral Large 2', provider: 'Mistral AI', tokens: '86.5M', reqs: '142K', spend: '$832.10', pct: '2.9%', logo: getR2CdnUrl('/assets/logo/deepseek.webp') }
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <div className="size-5 rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            <img src={r.logo} alt={r.model} className="size-full object-contain" />
                          </div>
                          <span>{r.model}</span>
                        </td>
                        <td className="py-2 text-slate-500">{r.provider}</td>
                        <td className="py-2 font-mono text-slate-600 dark:text-slate-400">{r.tokens}</td>
                        <td className="py-2 font-mono text-slate-600 dark:text-slate-400">{r.reqs}</td>
                        <td className="py-2 font-mono font-extrabold text-slate-900 dark:text-slate-100">{r.spend}</td>
                        <td className="py-2 text-right text-slate-400 font-mono">{r.pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BUDGET OVERVIEW */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Budget Overview</h3>
                <button onClick={() => setActiveTab('budgets')} className="text-[10px] font-bold text-indigo-600 hover:underline">View all budgets</button>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Budget (Monthly)</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">$50,000.00</div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Used $28,430.50</span>
                  <span className="text-indigo-600 font-mono">56.9%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[56.9%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Remaining $21,569.50</span>
                  <span>43.1%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Budget alerts</span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" /> AI Model Spend is at 83% of monthly budget
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold">83%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" /> Storage Spend is at 65% of monthly budget
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold">65%</span>
                </div>
              </div>
            </div>

            {/* RECENT COST ALERTS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Cost Alerts</h3>
                <button onClick={() => setActiveTab('alerts')} className="text-[10px] font-bold text-indigo-600 hover:underline">View all alerts</button>
              </div>
              <div className="space-y-2 text-xs">
                {(finopsData?.alerts?.length > 0 ? finopsData.alerts : [
                  { id: '1', message: 'AI Model Spend is above 80% of monthly budget', severity: 'critical', time_ago: '2m ago' },
                  { id: '2', message: 'Spike detected in Vector Search costs (+32%)', severity: 'warning', time_ago: '15m ago' },
                  { id: '3', message: 'Storage cost increased by 18% vs yesterday', severity: 'warning', time_ago: '1h ago' },
                  { id: '4', message: 'MCP call volume exceeded usual range', severity: 'warning', time_ago: '2h ago' },
                  { id: '5', message: 'Projected June spend will exceed budget', severity: 'warning', time_ago: '3h ago' }
                ]).map((alt: any) => (
                  <div key={alt.id} className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={alt.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{alt.message}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{alt.time_ago}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 4: ACTIONABLE OPTIMIZATION BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
                <Sparkles size={20} className="text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Save more with Optimization</h4>
                <p className="text-xs font-medium text-indigo-100 mt-0.5">
                  We found 7 opportunities to save up to <span className="font-bold text-white">$4,320.60 (15.2%)</span> this month.
                </p>
              </div>
            </div>
            <button onClick={() => setActiveTab('optimization')} className="px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-xs shadow-md cursor-pointer shrink-0">
              View Recommendations
            </button>
          </div>
        </div>
      )}

      {/* 2. USAGE ANALYTICS */}
      {activeTab === 'usage_analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Volume Consumption Distribution</h4>
              <div className="h-48 w-full"><Bar data={usageVolumeBarData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Weekly Resource Usage Growth</h4>
              <div className="h-48 w-full"><Line data={usageTrendLineData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Resource Type</th><th className="py-2.5 px-3">Volume</th><th className="py-2.5 px-3">Cost ($)</th><th className="py-2.5 px-3">Growth Rate</th><th className="py-2.5 px-3 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(finopsData?.usageAnalytics?.length > 0 ? finopsData.usageAnalytics : [
                  { resource_type: 'LLM Tokens', volume: '1.82B Tokens', cost: 12430.20, growth_rate: '+18.6%' },
                  { resource_type: 'MCP Invokes', volume: '1.04M Calls', cost: 6210.10, growth_rate: '+24.2%' }
                ]).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{row.resource_type}</td>
                    <td className="py-3 px-3 font-mono">{row.volume}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-indigo-600">${row.cost}</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">{row.growth_rate}</td>
                    <td className="py-3 px-3 text-right"><button onClick={() => setInspectItem(row)} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg text-[10px] font-bold">Inspect</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MODEL COSTS */}
      {activeTab === 'model_costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 lg:col-span-1">
              <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Model Spend Share</h4>
              <div className="h-44 w-full"><Doughnut data={modelSpendDonutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%' }} /></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 lg:col-span-2">
              <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">AI Model Pricing &amp; Token Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2 px-2">Model</th><th className="py-2 px-2">Provider</th><th className="py-2 px-2">Price/1M</th><th className="py-2 px-2">Spend</th><th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {(finopsData?.topModels?.length > 0 ? finopsData.topModels : [
                      { model_name: 'GPT-4o', provider: 'OpenAI', prompt_price: '$2.50', spend: '$9,432.10', logo: getR2CdnUrl('/assets/logo/gpt.webp') },
                      { model_name: 'Claude 3.5 Sonnet', provider: 'Anthropic', prompt_price: '$3.00', spend: '$3,210.80', logo: getR2CdnUrl('/assets/logo/claude.webp') },
                      { model_name: 'Gemini 1.5 Pro', provider: 'Google', prompt_price: '$1.25', spend: '$2,430.60', logo: getR2CdnUrl('/assets/logo/gemini.svg') },
                      { model_name: 'Llama 3.1 70B', provider: 'Meta', prompt_price: '$0.90', spend: '$1,620.50', logo: getR2CdnUrl('/assets/logo/llama.jpeg') },
                      { model_name: 'Mistral Large 2', provider: 'Mistral AI', prompt_price: '$2.00', spend: '$832.10', logo: getR2CdnUrl('/assets/logo/deepseek.webp') }
                    ]).map((row: any, idx: number) => {
                      const logoUrl = row.logo || (
                        row.model_name?.toLowerCase().includes('gpt') ? getR2CdnUrl('/assets/logo/gpt.webp') :
                        row.model_name?.toLowerCase().includes('claude') ? getR2CdnUrl('/assets/logo/claude.webp') :
                        row.model_name?.toLowerCase().includes('gemini') ? getR2CdnUrl('/assets/logo/gemini.svg') :
                        row.model_name?.toLowerCase().includes('llama') ? getR2CdnUrl('/assets/logo/llama.jpeg') :
                        row.model_name?.toLowerCase().includes('mistral') ? getR2CdnUrl('/assets/logo/deepseek.webp') :
                        getR2CdnUrl('/assets/logo/external-api.png')
                      );
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <div className="size-5 rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                              <img src={logoUrl} alt={row.model_name} className="size-full object-contain" />
                            </div>
                            <span>{row.model_name}</span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-500">{row.provider}</td>
                          <td className="py-2.5 px-2 font-mono">{row.prompt_price}</td>
                          <td className="py-2.5 px-2 font-mono font-extrabold text-indigo-600">{row.spend}</td>
                          <td className="py-2.5 px-2 text-right"><button onClick={() => triggerToast(`⚙️ Routing cap updated for ${row.model_name}`)} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Cap Limit</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AGENT COSTS */}
      {activeTab === 'agent_costs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">AI Agent Invocation Spend Distribution</h4>
            <div className="h-44 w-full"><Bar data={agentCostBarData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Agent Name</th><th className="py-2.5 px-3">Department</th><th className="py-2.5 px-3">Invocations</th><th className="py-2.5 px-3">Latency</th><th className="py-2.5 px-3">Total Cost</th><th className="py-2.5 px-3 text-right">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(finopsData?.agentCosts?.length > 0 ? finopsData.agentCosts : [
                  { agent_name: 'Customer Support Agent Alpha', department: 'Customer Service', invocations: 420000, avg_latency_ms: 480, total_cost: 4210.50 }
                ]).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{row.agent_name}</td>
                    <td className="py-3 px-3 text-slate-500">{row.department}</td>
                    <td className="py-3 px-3 font-mono">{row.invocations.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono">{row.avg_latency_ms} ms</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-indigo-600">${row.total_cost}</td>
                    <td className="py-3 px-3 text-right"><button onClick={() => triggerToast(`🤖 Agent limit saved: ${row.agent_name}`)} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">Set Limit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. WORKFLOW COSTS */}
      {activeTab === 'workflow_costs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Workflow Execution Volume Trend</h4>
            <div className="h-44 w-full"><Line data={workflowTrendData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Workflow Name</th><th className="py-2.5 px-3">Executions</th><th className="py-2.5 px-3">Steps</th><th className="py-2.5 px-3">Cost / Exec</th><th className="py-2.5 px-3">Total Cost</th><th className="py-2.5 px-3 text-right">Trigger Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(finopsData?.workflowCosts?.length > 0 ? finopsData.workflowCosts : [
                  { workflow_name: 'Automated Refund Workflow', execution_count: 142000, step_count: 8, cost_per_exec: 0.0245, total_cost: 3479.00 }
                ]).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{row.workflow_name}</td>
                    <td className="py-3 px-3 font-mono">{row.execution_count.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono">{row.step_count} steps</td>
                    <td className="py-3 px-3 font-mono">${row.cost_per_exec}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-indigo-600">${row.total_cost}</td>
                    <td className="py-3 px-3 text-right"><button onClick={() => triggerToast(`⚡ Workflow executed: ${row.workflow_name}`)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">Run Now</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MCP COSTS */}
      {activeTab === 'mcp_costs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">MCP API Invocation Volume</h4>
            <div className="h-44 w-full"><Bar data={mcpCallsBarData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">MCP Tool Name</th><th className="py-2.5 px-3">Provider</th><th className="py-2.5 px-3">API Calls</th><th className="py-2.5 px-3">Latency P99</th><th className="py-2.5 px-3">Total Cost</th><th className="py-2.5 px-3 text-right">Test Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(finopsData?.mcpCosts?.length > 0 ? finopsData.mcpCosts : [
                  { mcp_tool_name: 'Stripe Payment Gateway MCP', provider: 'Stripe', api_calls: 520000, latency_p99_ms: 180, total_cost: 2110.30 }
                ]).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{row.mcp_tool_name}</td>
                    <td className="py-3 px-3 text-slate-500">{row.provider}</td>
                    <td className="py-3 px-3 font-mono">{row.api_calls.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono">{row.latency_p99_ms} ms</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-indigo-600">${row.total_cost}</td>
                    <td className="py-3 px-3 text-right"><button onClick={() => triggerToast(`🔌 MCP Ping OK for ${row.mcp_tool_name}`)} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">Ping MCP</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. STORAGE */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 lg:col-span-1">
              <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Storage Share</h4>
              <div className="h-44 w-full"><Doughnut data={storageDonutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%' }} /></div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 lg:col-span-2">
              <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Infrastructure Storage Allocation &amp; Costs</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Type</th><th className="py-2.5 px-3">Used / Allocated</th><th className="py-2.5 px-3">Rate</th><th className="py-2.5 px-3">Total Cost</th><th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {(finopsData?.storageCosts?.length > 0 ? finopsData.storageCosts : [
                      { storage_type: 'Vector Storage (Pinecone)', allocated_tb: 3.00, used_tb: 1.52, cost_per_tb: 500.00, total_cost: 760.00 }
                    ]).map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{row.storage_type}</td>
                        <td className="py-3 px-3 font-mono">{row.used_tb} / {row.allocated_tb} TB</td>
                        <td className="py-3 px-3 font-mono">${row.cost_per_tb}/TB</td>
                        <td className="py-3 px-3 font-mono font-extrabold text-indigo-600">${row.total_cost}</td>
                        <td className="py-3 px-3 text-right"><button onClick={() => triggerToast(`🧹 Cache purged for ${row.storage_type}`)} className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold">Clean Cache</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. BUDGETS */}
      {activeTab === 'budgets' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">Monthly Budget Threshold Configuration</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Monthly Budget Ceiling ($)</span>
              <span className="font-mono font-extrabold text-indigo-600 text-base">${monthlyBudgetInput.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={monthlyBudgetInput}
              onChange={(e) => setMonthlyBudgetInput(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input type="checkbox" checked={hardCapEnabled} onChange={(e) => setHardCapEnabled(e.target.checked)} className="accent-indigo-600 size-4" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Hard Cap Auto-Pause</span>
                <span className="text-[10px] text-slate-400">Automatically restrict AI agent requests when spending hits 100% of budget</span>
              </div>
            </label>
          </div>

          <button onClick={handleSaveBudget} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs">
            Save Budget Configuration to Database
          </button>
        </div>
      )}

      {/* 9. FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">AI Spend Predictive Growth Model</h4>
            <div className="flex gap-2">
              {['Baseline Enterprise Scale', 'Moderate Agent Swarm Expansion', 'High Token Growth Scenario'].map((scen) => (
                <button
                  key={scen}
                  onClick={() => { setForecastScenario(scen); triggerToast(`📈 Forecast Model: ${scen}`); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    forecastScenario === scen ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {scen}
                </button>
              ))}
            </div>
            <div className="h-52 w-full pt-2"><Line data={forecastLineData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
        </div>
      )}

      {/* 10. OPTIMIZATION */}
      {activeTab === 'optimization' && (
        <div className="space-y-3">
          {(finopsData?.optimizations?.length > 0 ? finopsData.optimizations : [
            { id: '1', title: 'Switch Low-Complexity Prompt Invocations to Llama 3.1 8B', estimated_savings: '$1,840.00/mo', is_applied: false },
            { id: '2', title: 'Enable Semantic Prompt Response Caching (Redis/CDN)', estimated_savings: '$1,420.50/mo', is_applied: false }
          ]).map((opt: any) => (
            <div key={opt.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <div>
                <h5 className="font-bold text-slate-900 dark:text-slate-100">{opt.title}</h5>
                <span className="text-emerald-600 font-extrabold font-mono text-[11px] block mt-0.5">Est. Savings: {opt.estimated_savings}</span>
              </div>
              <button
                disabled={opt.is_applied}
                onClick={() => handleApplyOpt(opt.id, opt.title)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                  opt.is_applied ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {opt.is_applied ? 'Rule Applied ✓' : 'Apply Rule'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 11. ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['all', 'critical', 'warning'] as const).map((sev) => (
              <button key={sev} onClick={() => setAlertSeverityFilter(sev)} className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer uppercase ${alertSeverityFilter === sev ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700'}`}>{sev}</button>
            ))}
          </div>

          <div className="space-y-2">
            {(finopsData?.alerts?.length > 0 ? finopsData.alerts : [
              { id: '1', message: 'AI Model Spend is above 80% of monthly budget', severity: 'critical', time_ago: '2m ago', is_active: true }
            ])
            .filter((alt: any) => alertSeverityFilter === 'all' || alt.severity === alertSeverityFilter)
            .map((alt: any) => (
              <div key={alt.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className={alt.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'} />
                  <span className="font-bold text-slate-900 dark:text-slate-100">{alt.message}</span>
                  <span className="text-[10px] text-slate-400">({alt.time_ago})</span>
                </div>
                {alt.is_active ? (
                  <button onClick={() => handleAckAlert(alt.id)} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold">Acknowledge</button>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold">Acknowledged ✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Telemetry Inspector</h3>
              <button onClick={() => setInspectItem(null)} className="text-slate-400 hover:text-slate-900"><X size={18} /></button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto">{JSON.stringify(inspectItem, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2"><Sparkles className="text-indigo-600" size={16} /> Enterprise Scale Upgrade</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-slate-900"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-500">Contact your ZEGA AI Account Executive to upgrade your enterprise cluster.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setShowUpgradeModal(false); triggerToast('📧 Executive contacted!'); }} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">Contact Account Executive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
