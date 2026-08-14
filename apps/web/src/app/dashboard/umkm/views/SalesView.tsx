import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, BarChart3, TrendingUp, ChevronDown, 
  Filter, Calendar, Sparkles, ArrowUpRight, Target, RefreshCw, CheckCircle2, Users, HelpCircle, Workflow
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  Filler 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  SetGoalModal, AllProductsModal, AllChannelsModal, SalesBySourceModal,
  AiReportModal, DateFilterModal, FilterModal, HelpInfoModal,
  DeploySalesSwarmModal
} from './sales/SalesModals';
import { SalesBySourceSubPage } from './sales/subpages/SalesBySourceSubPage';
import { SalesByChannelSubPage } from './sales/subpages/SalesByChannelSubPage';
import { MonthlyReportSubPage } from './sales/subpages/MonthlyReportSubPage';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  Filler
);

interface SalesViewProps {
  triggerToast?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function SalesView({ triggerToast = () => {}, onNavigateTab }: SalesViewProps) {
  const { t, language } = useLanguage();
  const u = (t.salesView || {}) as any;
  const [timeTab, setTimeTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  const getInitialSubTab = (): 'overview' | 'sales_by_source' | 'sales_by_channel' | 'monthly_report' => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab') || params.get('sub_page') || params.get('tab');
      if (sub === 'sales_by_source' || sub === 'sources' || sub === 'source') return 'sales_by_source';
      if (sub === 'sales_by_channel' || sub === 'channels' || sub === 'channel') return 'sales_by_channel';
      if (sub === 'monthly_report' || sub === 'monthly' || sub === 'report') return 'monthly_report';
    }
    return 'overview';
  };

  const [activeSubTab, setActiveSubTabState] = useState<'overview' | 'sales_by_source' | 'sales_by_channel' | 'monthly_report'>(getInitialSubTab);

  const setActiveSubTab = (tab: 'overview' | 'sales_by_source' | 'sales_by_channel' | 'monthly_report') => {
    setActiveSubTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('subtab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveSubTabState(getInitialSubTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time Database States (Zero-Trust Initializer)
  const [metrics, setMetrics] = useState<any>({
    total_revenue: 0,
    total_orders: 0,
    avg_order_value: 0,
    conversion_rate: 0,
    new_customers: 0,
    revenue_growth: 0,
    orders_growth: 0,
    aov_growth: 0,
    conversion_growth: 0,
    customers_growth: 0,
    period_label: 'No Data'
  });

  const [channels, setChannels] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [sourceSwarm, setSourceSwarm] = useState<any[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<any[]>([]);
  const [channelSwarm, setChannelSwarm] = useState<any[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const [salesGoal, setSalesGoal] = useState<any>({
    current_revenue: 0,
    target_revenue: 0,
    days_left: 0,
    period_month: '-'
  });

  const [insights, setInsights] = useState<any[]>([]);

  // Fetch Data from Supabase & Subscribe Realtime
  const loadSalesData = async () => {
    setLoading(true);
    const [res, srcRes, brkRes, chSwarmRes, rptRes, srcSwarmRes] = await Promise.all([
      SupabaseDashboardService.getUmkmSalesOverview(),
      SupabaseDashboardService.getUmkmSalesSources(),
      SupabaseDashboardService.getUmkmSalesChannelBreakdown(),
      SupabaseDashboardService.getUmkmSalesChannelAiSwarm(),
      SupabaseDashboardService.getUmkmSalesMonthlyReports(),
      SupabaseDashboardService.getUmkmSalesSourceAiSwarm()
    ]);

    if (res.metrics) setMetrics(res.metrics);
    if (res.channels?.length) setChannels(res.channels);
    if (res.topProducts?.length) setTopProducts(res.topProducts);
    if (res.activities?.length) setActivities(res.activities);
    if (res.goal) setSalesGoal(res.goal);
    if (res.insights?.length) setInsights(res.insights);

    if (srcRes?.length) setSources(srcRes);
    if (brkRes?.length) setChannelBreakdown(brkRes);
    if (chSwarmRes?.length) setChannelSwarm(chSwarmRes);
    if (rptRes) setMonthlyReport(rptRes);
    if (srcSwarmRes?.length) setSourceSwarm(srcSwarmRes);

    setLoading(false);
  };

  useEffect(() => {
    loadSalesData();
    const unsubscribe = SupabaseDashboardService.subscribeToSalesRealtime('11111111-1111-1111-1111-111111111111', () => {
      loadSalesData();
    });
    return () => unsubscribe();
  }, []);

  // Update Sales Goal Callback
  const handleSaveGoal = async (newTarget: number) => {
    setSalesGoal((prev: any) => ({ ...prev, target_revenue: newTarget }));
    await SupabaseDashboardService.updateSalesGoal('11111111-1111-1111-1111-111111111111', newTarget);
  };

  // Deploy Real AI Sales Swarm Callback
  const handleDeploySwarm = async (modelPayload: any) => {
    await SupabaseDashboardService.deploySalesAiSwarm('11111111-1111-1111-1111-111111111111', modelPayload);
    await loadSalesData();
  };

  // Dynamic Chart Configuration for Daily, Weekly, and Monthly Time Tabs
  const getChartConfig = () => {
    const totalRev = metrics.total_revenue || 0;
    const dayLabels = language === 'en' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : language === 'zh'
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ming'];

    const weekLabels = language === 'en'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : language === 'zh'
      ? ['第1周', '第2周', '第3周', '第4周']
      : ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];

    const monthLabels = language === 'en'
      ? ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']
      : language === 'zh'
      ? ['第1月', '第2月', '第3月', '第4月', '第5月', '第6月']
      : ['Bulan 1', 'Bulan 2', 'Bulan 3', 'Bulan 4', 'Bulan 5', 'Bulan 6'];

    if (totalRev === 0) {
      return {
        labels: dayLabels,
        actualData: [0, 0, 0, 0, 0, 0, 0],
        targetData: [0, 0, 0, 0, 0, 0, 0],
        formatVal: (v: number) => `Rp${v.toLocaleString('id-ID')}`,
        yAxisFormat: (v: any) => `Rp0`,
        peakText: u.peakSalesNoTx || 'Puncak Penjualan: Belum Ada Transaksi',
        avgText: u.avgSalesPerDay?.replace('{val}', 'Rp0') || 'Rata-rata: Rp0 / hari',
        growthBadge: `0% ${u.vsLastWeek || 'vs Mgg Lalu'}`
      };
    }
    if (timeTab === 'Daily') {
      return {
        labels: dayLabels,
        actualData: [0, 0, 0, 0, 0, 0, 0],
        targetData: [0, 0, 0, 0, 0, 0, 0],
        formatVal: (v: number) => `Rp${(v * 1000000).toLocaleString('id-ID')}`,
        yAxisFormat: (v: any) => `Rp${(v * 1000).toFixed(0)}k`,
        peakText: u.todaySales || 'Penjualan Hari Ini',
        avgText: u.avgDailySales || 'Rata-rata Penjualan Harian',
        growthBadge: `${metrics.revenue_growth || 0}% ${u.vsLastWeek || 'vs Mgg Lalu'}`
      };
    } else if (timeTab === 'Weekly') {
      return {
        labels: weekLabels,
        actualData: [0, 0, 0, 0],
        targetData: [0, 0, 0, 0],
        formatVal: (v: number) => `Rp${(v * 1000000).toLocaleString('id-ID')}`,
        yAxisFormat: (v: any) => `Rp${v}M`,
        peakText: u.weeklyPeakSales || 'Puncak Penjualan Mingguan',
        avgText: u.weeklyAvg || 'Rata-rata Mingguan',
        growthBadge: `${metrics.revenue_growth || 0}% ${u.vsLastMonth || 'vs Bln Lalu'}`
      };
    } else {
      return {
        labels: monthLabels,
        actualData: [0, 0, 0, 0, 0, (totalRev / 1000000)],
        targetData: [0, 0, 0, 0, 0, 0],
        formatVal: (v: number) => `Rp${v.toFixed(2)}M`,
        yAxisFormat: (v: any) => `Rp${v}M`,
        peakText: u.monthlyPeakSales || 'Puncak Penjualan Bulanan',
        avgText: u.monthlyAvg || 'Rata-rata Bulanan',
        growthBadge: `${metrics.revenue_growth || 0}% MoM`
      };
    }
  };

  const chartConfig = getChartConfig();

  // Dynamic Chart.js Line Data with Dual Datasets (Aktual vs Target)
  const lineData = {
    labels: chartConfig.labels,
    datasets: [
      {
        label: t.salesView.actualRevenue || 'Aktual Revenue',
        data: chartConfig.actualData,
        borderColor: '#f97316',
        borderWidth: 3,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: t.salesView.targetSales || 'Target Sales',
        data: chartConfig.targetData,
        borderColor: '#94a3b8',
        borderWidth: 2,
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#94a3b8',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
      }
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { size: 10, weight: 'bold' as const },
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 11, weight: 'bold' as const },
        padding: 12,
        cornerRadius: 14,
        callbacks: {
          label: (context: any) => {
            const labelName = context.dataset.label || '';
            const rawVal = context.raw;
            return ` ${labelName}: ${chartConfig.formatVal(rawVal)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' as const } },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { 
          color: '#94a3b8', 
          font: { size: 10, weight: 'bold' as const },
          callback: (value: any) => chartConfig.yAxisFormat(value)
        },
      },
    },
  };

  // Chart.js Doughnut Data
  const doughnutData = {
    labels: channels.map(c => c.channel_name),
    datasets: [
      {
        data: channels.map(c => c.percentage),
        backgroundColor: ['#10b981', '#f97316', '#a855f7', '#06b6d4'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
    },
  };

  const rawGoalPct = (salesGoal.target_revenue > 0) ? Math.min(100, Math.round(((salesGoal.current_revenue || 0) / salesGoal.target_revenue) * 100)) : 0;
  const goalPct = isNaN(rawGoalPct) ? 0 : rawGoalPct;

  return (
    <div className="space-y-6 font-sans pb-20 sm:pb-10">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {t.salesView.title}
            {loading && <RefreshCw size={16} className="animate-spin text-orange-500" />}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t.salesView.subtitle}
          </p>

          {/* Enterprise Sub-Menu Navigation Bar */}
          <div 
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-fit border border-slate-200 dark:border-slate-700/60 text-xs font-medium mt-2.5 overflow-x-auto whitespace-nowrap touch-pan-x min-w-0 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-[11px] sm:text-xs ${
                activeSubTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-semibold border border-slate-200/60 dark:border-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 size={14} className="flex-shrink-0" />
              <span>{t.salesView.subTabOverview || 'Overview'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sales_by_source')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-[11px] sm:text-xs ${
                activeSubTab === 'sales_by_source'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-semibold border border-slate-200/60 dark:border-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp size={14} className="flex-shrink-0" />
              <span>{t.salesView.subTabSalesBySource || 'Sales by Source'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sales_by_channel')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-[11px] sm:text-xs ${
                activeSubTab === 'sales_by_channel'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-semibold border border-slate-200/60 dark:border-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingBag size={14} className="flex-shrink-0" />
              <span>{t.salesView.subTabSalesByChannel || 'Sales by Channel'}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('monthly_report')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-[11px] sm:text-xs ${
                activeSubTab === 'monthly_report'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-semibold border border-slate-200/60 dark:border-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={14} className="flex-shrink-0" />
              <span>{t.salesView.subTabMonthlyReport || 'Monthly Report'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0 w-full sm:w-auto">
          {/* Optimasi Model Action Button */}
          <button
            onClick={() => setActiveModal('deploySwarm')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-none whitespace-nowrap min-w-0"
          >
            <Workflow size={14} className="flex-shrink-0" />
            <span className="truncate">{t.salesView.modelOptimization || 'Optimasi Model'}</span>
          </button>

          {/* Date Picker Button */}
          <button
            onClick={() => setActiveModal('dateFilter')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap min-w-0"
          >
            <span className="truncate">{metrics.period_label || '1 Jul - 31 Jul 2026'}</span>
            <Calendar size={14} className="text-slate-400 flex-shrink-0" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setActiveModal('filter')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <Filter size={14} className="text-slate-500 flex-shrink-0" />
            <span>{t.salesView.filter}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONDITIONAL SUB-PAGE RENDERING BASED ON ACTIVE SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales_by_source' && (
        <SalesBySourceSubPage sources={sources} aiInsights={sourceSwarm} triggerToast={triggerToast} />
      )}

      {activeSubTab === 'sales_by_channel' && (
        <SalesByChannelSubPage 
          channels={channelBreakdown.length ? channelBreakdown : channels} 
          aiInsights={channelSwarm}
          triggerToast={triggerToast} 
        />
      )}

      {activeSubTab === 'monthly_report' && (
        <MonthlyReportSubPage
          monthlyReports={Array.isArray(monthlyReport) ? monthlyReport : [monthlyReport]}
          monthlyReport={Array.isArray(monthlyReport) ? monthlyReport[0] : monthlyReport}
          insights={insights}
          triggerToast={triggerToast}
        />
      )}

      {activeSubTab === 'overview' && (
        <>
          {/* TOP METRICS GRID (5 ENTERPRISE KPI CARDS - Sleek, Clutter-Free) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Card 1: Total Revenue */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-center font-semibold">
                  <DollarSign size={16} />
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
                  ↑ {metrics.revenue_growth || 0}%
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t.salesView.totalRevenue}</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  Rp{(metrics.total_revenue || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{t.salesView.vsLastMonth}</span>
              </div>
            </div>

            {/* Card 2: Total Orders */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-900/60 flex items-center justify-center font-semibold">
                  <ShoppingBag size={16} />
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
                  ↑ {metrics.orders_growth || 0}%
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t.salesView.totalOrders}</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {(metrics.total_orders || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{t.salesView.vsLastMonth}</span>
              </div>
            </div>

            {/* Card 3: Average Order Value */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/60 flex items-center justify-center font-semibold">
                  <BarChart3 size={16} />
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
                  ↑ {metrics.aov_growth || 0}%
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t.salesView.avgOrderValue}</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  Rp{(metrics.avg_order_value || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{t.salesView.vsLastMonth}</span>
              </div>
            </div>

            {/* Card 4: Conversion Rate */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center font-semibold">
                  <TrendingUp size={16} />
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
                  ↑ {metrics.conversion_growth || 0}%
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t.salesView.conversionRate}</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {metrics.conversion_rate || 0}%
                </div>
                <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{t.salesView.vsLastMonth}</span>
              </div>
            </div>

            {/* Card 5: New Customers */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 flex items-center justify-center font-semibold">
                  <Users size={16} />
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
                  ↑ {metrics.customers_growth || 0}%
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t.salesView.newCustomers}</span>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {(metrics.new_customers || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{t.salesView.vsLastMonth}</span>
              </div>
            </div>
          </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE CHARTS ROW: REVENUE OVER TIME & SALES BY CHANNEL */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.salesView.revenueOverTime}</h3>
              <HelpCircle 
                size={13} 
                className="text-slate-400 hover:text-orange-500 cursor-pointer transition-colors" 
                onClick={() => setActiveModal('helpInfo')} 
              />
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeTab(tab)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    timeTab === tab 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold border border-slate-200/60 dark:border-slate-700' 
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC METRIC PILLS & CHART INTERACTIVITY SUMMARY */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {chartConfig.peakText}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {chartConfig.avgText}
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
              {chartConfig.growthBadge}
            </span>
          </div>

          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Sales by Channel Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.salesView.salesByChannel}</h3>
            <button 
              onClick={() => setActiveSubTab('sales_by_channel')}
              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-0.5"
            >
              {t.salesView.viewDetail} →
            </button>
          </div>

          <div className="h-44 relative flex items-center justify-center my-2">
            {channels.length > 0 ? (
              <>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{u.totalOmsetUpper || 'TOTAL'}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">Rp{(metrics.total_revenue || 0).toLocaleString('id-ID')}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <ShoppingBag size={28} className="mb-1 opacity-50 text-slate-400" />
                <span className="text-xs font-medium">{u.noChannelTx || 'Belum Ada Transaksi Channel'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-[11px] font-medium pt-1">
            {channels.length > 0 ? (
              channels.map((ch, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: ch.color_hex || '#10b981' }} />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{ch.channel_name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {ch.percentage}% <span className="text-slate-400 font-normal">(Rp{(ch.amount / 1000000).toFixed(1)}M)</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-[11px] font-medium text-slate-400 py-2">{u.noActiveChannelData || 'Tidak ada data channel aktif'}</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THIRD ROW: TOP PRODUCTS + PENJUALAN PER SUMBER + RINGKASAN & GOALS */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Column: Top Products Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">{t.salesView.topProducts}</h3>
            
            <div className="space-y-2 text-xs overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="min-w-[340px] sm:min-w-0">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">{t.salesView.colProduct}</span>
                  <span className="col-span-2 text-center">{t.salesView.colSold}</span>
                  <span className="col-span-2 text-right">{t.salesView.colRevenue}</span>
                  <span className="col-span-2 text-right">{t.salesView.colTrend}</span>
                </div>

                {topProducts.length > 0 ? (
                  topProducts.map((p) => (
                    <div key={p.rank} className="grid grid-cols-12 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs">
                      <span className="col-span-1 font-semibold text-slate-400">{p.rank}</span>
                      <span className="col-span-5 font-semibold text-slate-900 dark:text-slate-100 truncate">{p.product_name}</span>
                      <span className="col-span-2 text-center font-medium text-slate-600 dark:text-slate-300">{p.units_sold}</span>
                      <span className="col-span-2 text-right font-bold text-slate-900 dark:text-slate-100">Rp{((p.revenue ?? 0) / 1000).toLocaleString('id-ID')}k</span>
                      <span className="col-span-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">↑ {p.trend_growth}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs font-medium text-slate-400">{u.noProductsInDb || 'Belum ada produk terjual di database'}</div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              if (onNavigateTab) {
                triggerToast('Membuka menu Top Selling di Store Management...');
                onNavigateTab('top_selling');
              } else {
                setActiveModal('allProducts');
              }
            }}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-orange-600 pt-2 cursor-pointer transition-colors"
          >
            {t.salesView.viewAllProducts} →
          </button>
        </div>

        {/* Center Column: Penjualan per Sumber Progress Bars */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">{t.salesView.salesBySource}</h3>
            
            <div className="space-y-3.5">
              {channels.length > 0 ? (
                channels.map((ch, idx) => {
                  const isWa = ch.channel_name.toLowerCase().includes('whatsapp');
                  const isTikTok = ch.channel_name.toLowerCase().includes('tiktok');
                  const isShopee = ch.channel_name.toLowerCase().includes('shopee');
                  const isIg = ch.channel_name.toLowerCase().includes('instagram');

                  const localFallback = isWa ? '/assets/logo/whatsapp-for-business.webp' :
                                        isTikTok ? '/assets/logo/tiktok.webp' :
                                        isShopee ? '/assets/logo/shopee.png' :
                                        isIg ? '/assets/logo/instagram.png' :
                                        '/assets/logo/9router.png';

                  const primaryCdn = isWa ? 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' :
                                     isTikTok ? 'https://cdn.zegaai.site/assets/logo/tiktok.webp' :
                                     isShopee ? 'https://cdn.zegaai.site/assets/logo/shopee.png' :
                                     isIg ? 'https://cdn.zegaai.site/assets/logo/instagram.png' :
                                     'https://cdn.zegaai.site/assets/logo/9router.png';

                  const logoUrl = ch.cdn_icon_url || primaryCdn;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <img 
                            src={logoUrl} 
                            onError={(e: any) => { e.target.onerror = null; e.target.src = localFallback; }}
                            alt={ch.channel_name} 
                            className="size-4 object-contain rounded-xs bg-white p-0.5 border border-slate-200 dark:border-slate-700" 
                          />
                          <span className="text-slate-700 dark:text-slate-300">{ch.channel_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 dark:text-slate-100 font-bold">Rp{(ch.amount ?? 0).toLocaleString('id-ID')}</span>
                          <span className="text-slate-400 font-normal text-[10px]">{ch.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300" 
                          style={{ width: `${ch.percentage}%`, backgroundColor: ch.color_hex || '#10b981' }} 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs font-medium text-slate-400">{u.noSourceTx || 'Belum ada sumber transaksi tercatat'}</div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setActiveSubTab('sales_by_source')}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-orange-600 pt-2 cursor-pointer transition-colors"
          >
            {u.viewAllSources || 'Lihat Semua Sumber →'}
          </button>
        </div>

        {/* Right Column: Ringkasan Bulanan & Sales Goal */}
        <div className="lg:col-span-3 space-y-4">
          {/* Ringkasan Bulanan Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{t.salesView.monthlySummary}</h3>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.bestDay}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{metrics.monthly_best_day_date || u.noBestDayTx || 'Belum Ada Transaksi'}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.totalRefund}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Rp{(metrics.monthly_refund_idr || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.repeatCustomer}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{metrics.monthly_repeat_customer_pct || 0}%</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.returningCustomerValue}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Rp{(metrics.monthly_returning_customer_val_idr || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setActiveSubTab('monthly_report')}
              className="w-full text-center text-[11px] font-semibold text-orange-600 hover:text-orange-700 pt-1 cursor-pointer"
            >
              {t.salesView.viewFullReport} →
            </button>
          </div>

          {/* Sales Goal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{t.salesView.salesGoal}</h3>
              <span className="text-[10px] text-slate-400 font-medium">{salesGoal.period_month || 'Juli 2026'}</span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Rp{(salesGoal.current_revenue / 1000000).toFixed(1)}M
                  <span className="text-xs text-slate-400 font-normal"> / Rp{(salesGoal.target_revenue / 1000000).toFixed(0)}M</span>
                </span>
                <span className="text-xs font-bold text-orange-600">{goalPct}%</span>
              </div>
              
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${goalPct}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-medium">{salesGoal.days_left || 3} {t.salesView.daysLeft}</span>
              <button 
                onClick={() => setActiveModal('setGoal')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] cursor-pointer transition-colors"
              >
                {t.salesView.setGoal}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM ENTERPRISE INSIGHT BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center font-semibold">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{u.salesAnalysisRecs || 'Rekomendasi Analisis Penjualan'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {u.autoAnalysisDesc || 'Analisis otomatis berdasarkan data performa transaksi Supabase real-time'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => { window.location.href = '/dashboard/reports?tab=overview'; }}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span>{t.salesView.aiReportFull} →</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {insights.slice(0, 3).map((ins: any, idx: number) => (
            <div key={ins.id || idx} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs font-medium space-y-1">
              <p className="text-slate-900 dark:text-slate-100 font-bold truncate">
                {ins.headline}
              </p>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{ins.content}</p>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* 6. RENDER ACTIVE MODALS */}
      {/* ========================================================================= */}
      <SetGoalModal
        isOpen={activeModal === 'setGoal'}
        onClose={() => setActiveModal(null)}
        currentGoal={salesGoal.target_revenue}
        onSaveGoal={handleSaveGoal}
        triggerToast={triggerToast}
      />

      <DateFilterModal
        isOpen={activeModal === 'dateFilter'}
        onClose={() => setActiveModal(null)}
        onSelectRange={(label) => setMetrics((prev: any) => ({ ...prev, period_label: label }))}
        triggerToast={triggerToast}
      />

      <FilterModal
        isOpen={activeModal === 'filter'}
        onClose={() => setActiveModal(null)}
        triggerToast={triggerToast}
      />

      <HelpInfoModal
        isOpen={activeModal === 'helpInfo'}
        onClose={() => setActiveModal(null)}
      />

      <AllProductsModal
        isOpen={activeModal === 'allProducts'}
        onClose={() => setActiveModal(null)}
      />

      <AllChannelsModal
        isOpen={activeModal === 'allChannels'}
        onClose={() => setActiveModal(null)}
        channelData={channelBreakdown.length ? channelBreakdown : channels}
      />

      <SalesBySourceModal
        isOpen={activeModal === 'salesBySource'}
        onClose={() => setActiveModal(null)}
        sourceData={sources}
      />

      <AiReportModal
        isOpen={activeModal === 'aiReport'}
        onClose={() => setActiveModal(null)}
        insights={insights}
        monthlyReport={monthlyReport}
      />

      <DeploySalesSwarmModal
        isOpen={activeModal === 'deploySwarm'}
        onClose={() => setActiveModal(null)}
        onDeploySwarm={handleDeploySwarm}
        triggerToast={triggerToast}
      />
    </div>
  );
}
