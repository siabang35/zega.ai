import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, BarChart3, TrendingUp, ChevronDown, 
  Filter, Calendar, Sparkles, ArrowUpRight, Target, RefreshCw, CheckCircle2, User, HelpCircle, Zap
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
  SetGoalModal, AllProductsModal, AllChannelsModal, 
  AiReportModal, DateFilterModal, FilterModal, HelpInfoModal,
  DeploySalesSwarmModal
} from './sales/SalesModals';

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
}

export function SalesView({ triggerToast = () => {} }: SalesViewProps) {
  const { t } = useLanguage();
  const [timeTab, setTimeTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time Database States
  const [metrics, setMetrics] = useState<any>({
    total_revenue: 13500000.00,
    total_orders: 116,
    avg_order_value: 116379.00,
    conversion_rate: 4.20,
    new_customers: 32,
    revenue_growth: 18.00,
    orders_growth: 21.00,
    aov_growth: 5.00,
    conversion_growth: 1.30,
    customers_growth: 14.00,
    period_label: '1 Jul - 31 Jul 2026'
  });

  const [channels, setChannels] = useState<any[]>([
    { channel_name: 'WhatsApp', percentage: 45, amount: 6100000, color_hex: '#10b981' },
    { channel_name: 'Shopee', percentage: 30, amount: 4100000, color_hex: '#f97316' },
    { channel_name: 'Instagram', percentage: 15, amount: 2000000, color_hex: '#a855f7' },
    { channel_name: 'TikTok', percentage: 10, amount: 1300000, color_hex: '#06b6d4' }
  ]);

  const [topProducts, setTopProducts] = useState<any[]>([
    { rank: 1, product_name: 'Paket Skincare Basic', units_sold: 32, revenue: 3840000, trend_growth: 16 },
    { rank: 2, product_name: 'Paket Skincare Premium', units_sold: 24, revenue: 3576000, trend_growth: 12 },
    { rank: 3, product_name: 'Serum Brightening', units_sold: 18, revenue: 2160000, trend_growth: 8 },
    { rank: 4, product_name: 'Face Wash', units_sold: 16, revenue: 1276000, trend_growth: 4 },
    { rank: 5, product_name: 'Moisturizer', units_sold: 12, revenue: 1020000, trend_growth: 6 }
  ]);

  const [activities, setActivities] = useState<any[]>([
    { id: '1', activity_type: 'order', title: 'Order baru dari Siti Aisyah', subtitle: 'Rp199.000', time_ago: '2 menit lalu' },
    { id: '2', activity_type: 'payment', title: 'Pembayaran berhasil diterima', subtitle: 'Order #INV-2026-0729', time_ago: '10 menit lalu' },
    { id: '3', activity_type: 'refund', title: 'Refund untuk Order #INV-2026-0721', subtitle: 'Rp99.000', time_ago: '1 jam lalu' },
    { id: '4', activity_type: 'customer', title: 'Customer baru Andi Saputra', subtitle: 'Channel: WhatsApp', time_ago: '2 jam lalu' }
  ]);

  const [salesGoal, setSalesGoal] = useState<any>({
    current_revenue: 13500000.00,
    target_revenue: 20000000.00,
    days_left: 3,
    period_month: 'Juli 2026'
  });

  const [insights, setInsights] = useState<any[]>([]);

  // Fetch Data from Supabase & Subscribe Realtime
  const loadSalesData = async () => {
    setLoading(true);
    const res = await SupabaseDashboardService.getUmkmSalesOverview();
    if (res.metrics) setMetrics(res.metrics);
    if (res.channels?.length) setChannels(res.channels);
    if (res.topProducts?.length) setTopProducts(res.topProducts);
    if (res.activities?.length) setActivities(res.activities);
    if (res.goal) setSalesGoal(res.goal);
    if (res.insights?.length) setInsights(res.insights);
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
    const totalRev = metrics.total_revenue || 13500000;
    if (timeTab === 'Daily') {
      return {
        labels: ['Sen (1 Agt)', 'Sel (2 Agt)', 'Rab (3 Agt)', 'Kam (4 Agt)', 'Jum (5 Agt)', 'Sab (6 Agt)', 'Ming (7 Agt)'],
        actualData: [0.42, 0.58, 0.65, 0.49, 0.78, 0.85, 0.92],
        targetData: [0.45, 0.45, 0.50, 0.50, 0.60, 0.70, 0.75],
        formatVal: (v: number) => `Rp${(v * 1000000).toLocaleString('id-ID')}`,
        yAxisFormat: (v: any) => `Rp${(v * 1000).toFixed(0)}k`,
        peakText: 'Puncak Penjualan: Minggu (Rp920.000)',
        avgText: 'Rata-rata: Rp670.000 / hari',
        growthBadge: '↑ +14.2% vs Mgg Lalu'
      };
    } else if (timeTab === 'Weekly') {
      return {
        labels: ['Minggu 1 (1-7 Jul)', 'Minggu 2 (8-14 Jul)', 'Minggu 3 (15-21 Jul)', 'Minggu 4 (22-31 Jul)'],
        actualData: [2.85, 3.10, 3.65, 3.90],
        targetData: [3.00, 3.00, 3.50, 4.00],
        formatVal: (v: number) => `Rp${(v * 1000000).toLocaleString('id-ID')}`,
        yAxisFormat: (v: any) => `Rp${v}M`,
        peakText: 'Puncak Penjualan: Minggu 4 (Rp3.90M)',
        avgText: 'Rata-rata: Rp3.37M / minggu',
        growthBadge: '↑ +21.0% vs Bln Lalu'
      };
    } else {
      return {
        labels: ['Feb 2026', 'Mar 2026', 'Apr 2026', 'Mei 2026', 'Jun 2026', 'Jul 2026'],
        actualData: [8.50, 9.20, 10.40, 11.80, 12.50, (totalRev / 1000000)],
        targetData: [8.00, 9.00, 10.00, 11.00, 12.00, 13.50],
        formatVal: (v: number) => `Rp${v.toFixed(2)}M`,
        yAxisFormat: (v: any) => `Rp${v}M`,
        peakText: 'Puncak Penjualan: Jul 2026 (Rp13.50M)',
        avgText: 'Rata-rata: Rp10.98M / bulan',
        growthBadge: '↑ +18.0% MoM'
      };
    }
  };

  const chartConfig = getChartConfig();

  // Dynamic Chart.js Line Data with Dual Datasets (Aktual vs Target)
  const lineData = {
    labels: chartConfig.labels,
    datasets: [
      {
        label: 'Aktual Revenue',
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
        label: 'Target Sales',
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

  const goalPct = Math.min(100, Math.round((salesGoal.current_revenue / salesGoal.target_revenue) * 100));

  return (
    <div className="space-y-6 font-sans pb-10">
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
        </div>

        <div className="flex items-center gap-2">
          {/* Deploy Real AI Sales Swarm Button */}
          <button
            onClick={() => setActiveModal('deploySwarm')}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>+ Deploy AI Swarm</span>
          </button>

          {/* Date Picker Button */}
          <button
            onClick={() => setActiveModal('dateFilter')}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-xs cursor-pointer hover:bg-slate-50 transition-all"
          >
            <span>{metrics.period_label || '1 Jul - 31 Jul 2026'}</span>
            <Calendar size={14} className="text-slate-400" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setActiveModal('filter')}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-slate-50 transition-all"
          >
            <Filter size={14} className="text-orange-500" />
            <span>{t.salesView.filter}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRICS GRID (5 CARDS WITH SPARKLINES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
              $
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">{t.salesView.totalRevenue}</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(metrics.total_revenue || 13500000).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.revenue_growth || 18}%</span>
              <span className="text-slate-400 font-normal">{t.salesView.vsLastMonth}</span>
            </div>
          </div>
          {/* Green Sparkline Curve */}
          <svg className="w-full h-6 mt-1 text-emerald-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 20 Q 25 5, 50 15 T 100 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Total Orders */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-xs">
              <ShoppingBag size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">{t.salesView.totalOrders}</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.total_orders || 116}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.orders_growth || 21}%</span>
              <span className="text-slate-400 font-normal">{t.salesView.vsLastMonth}</span>
            </div>
          </div>
          {/* Orange Sparkline Curve */}
          <svg className="w-full h-6 mt-1 text-orange-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 18 Q 20 22, 45 10 T 100 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-xs">
              <BarChart3 size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">{t.salesView.avgOrderValue}</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(metrics.avg_order_value || 116379).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.aov_growth || 5}%</span>
              <span className="text-slate-400 font-normal">{t.salesView.vsLastMonth}</span>
            </div>
          </div>
          {/* Purple Sparkline Curve */}
          <svg className="w-full h-6 mt-1 text-purple-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 15 Q 30 5, 60 18 T 100 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
              <TrendingUp size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">{t.salesView.conversionRate}</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.conversion_rate || 4.2}%
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.conversion_growth || 1.3}%</span>
              <span className="text-slate-400 font-normal">{t.salesView.vsLastMonth}</span>
            </div>
          </div>
          {/* Blue Sparkline Curve */}
          <svg className="w-full h-6 mt-1 text-blue-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 22 Q 25 8, 50 14 T 100 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 5: New Customers */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-xs">
              <User size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">{t.salesView.newCustomers}</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.new_customers || 32}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.customers_growth || 14}%</span>
              <span className="text-slate-400 font-normal">{t.salesView.vsLastMonth}</span>
            </div>
          </div>
          {/* Yellow Sparkline Curve */}
          <svg className="w-full h-6 mt-1 text-amber-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 19 Q 30 12, 60 20 T 100 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE CHARTS ROW: REVENUE OVER TIME & SALES BY CHANNEL */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t.salesView.revenueOverTime}</h3>
              <HelpCircle 
                size={12} 
                className="text-slate-400 hover:text-orange-500 cursor-pointer transition-colors" 
                onClick={() => setActiveModal('helpInfo')} 
              />
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-bold">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeTab(tab)}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                    timeTab === tab 
                      ? 'bg-orange-500 text-white shadow-xs font-black' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC METRIC PILLS & CHART INTERACTIVITY SUMMARY */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span>🔥</span> {chartConfig.peakText}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {chartConfig.avgText}
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              {chartConfig.growthBadge}
            </span>
          </div>

          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Sales by Channel Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t.salesView.salesByChannel}</h3>
            <button 
              onClick={() => setActiveModal('allChannels')}
              className="text-[11px] font-bold text-orange-500 hover:text-orange-600 cursor-pointer flex items-center gap-0.5"
            >
              {t.salesView.viewDetail} →
            </button>
          </div>

          <div className="h-44 relative flex items-center justify-center my-2">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">Rp13.5M</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] font-medium pt-1">
            {channels.map((ch, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: ch.color_hex || '#10b981' }} />
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{ch.channel_name}</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {ch.percentage}% <span className="text-slate-400 font-medium">(Rp{(ch.amount / 1000000).toFixed(1)}M)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. THIRD ROW: TOP PRODUCTS + PENJUALAN PER SUMBER + RINGKASAN & GOALS */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left Column: Top Products Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-3">{t.salesView.topProducts}</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-12 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="col-span-1">#</span>
                <span className="col-span-5">{t.salesView.colProduct}</span>
                <span className="col-span-2 text-center">{t.salesView.colSold}</span>
                <span className="col-span-2 text-right">{t.salesView.colRevenue}</span>
                <span className="col-span-2 text-right">{t.salesView.colTrend}</span>
              </div>

              {topProducts.map((p) => (
                <div key={p.rank} className="grid grid-cols-12 items-center p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="col-span-1 font-extrabold text-slate-400">{p.rank}</span>
                  <span className="col-span-5 font-extrabold text-slate-900 dark:text-slate-100 truncate">{p.product_name}</span>
                  <span className="col-span-2 text-center font-bold text-slate-500">{p.units_sold}</span>
                  <span className="col-span-2 text-right font-black text-slate-900 dark:text-slate-100">Rp{(p.revenue / 1000).toLocaleString('id-ID')}k</span>
                  <span className="col-span-2 text-right font-bold text-emerald-600 dark:text-emerald-400">↑ {p.trend_growth}%</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setActiveModal('allProducts')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 pt-2 cursor-pointer transition-colors"
          >
            {t.salesView.viewAllProducts} →
          </button>
        </div>

        {/* Center Column: Penjualan per Sumber Progress Bars */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-3">{t.salesView.salesBySource}</h3>
            
            <div className="space-y-4">
              {channels.map((ch, idx) => {
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
                    <div className="flex justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <img 
                          src={logoUrl} 
                          onError={(e: any) => { e.target.onerror = null; e.target.src = localFallback; }}
                          alt={ch.channel_name} 
                          className="size-4.5 object-contain rounded-md bg-white p-0.5 border border-slate-200/80 dark:border-slate-700" 
                        />
                        <span className="text-slate-700 dark:text-slate-300">{ch.channel_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-slate-100 font-black">Rp{ch.amount.toLocaleString('id-ID')}</span>
                        <span className="text-slate-400 font-medium text-[10px]">{ch.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${ch.percentage}%`, backgroundColor: ch.color_hex || '#10b981' }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => setActiveModal('allChannels')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 pt-2 cursor-pointer transition-colors"
          >
            {t.salesView.viewAllChannels} →
          </button>
        </div>

        {/* Right Column: Ringkasan Bulanan & Sales Goal */}
        <div className="lg:col-span-3 space-y-4">
          {/* Ringkasan Bulanan Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{t.salesView.monthlySummary}</h3>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.bestDay}</span>
                <span className="font-bold text-emerald-600">22 Juli 2026</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.totalRefund}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">Rp250.000</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.repeatCustomer}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">42%</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t.salesView.returningCustomerValue}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">Rp5.670.000</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveModal('aiReport')}
              className="w-full text-center text-[11px] font-extrabold text-orange-500 hover:text-orange-600 pt-1 cursor-pointer"
            >
              {t.salesView.viewFullReport} →
            </button>
          </div>

          {/* Sales Goal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{t.salesView.salesGoal}</h3>
              <span className="text-[10px] text-slate-400 font-bold">{salesGoal.period_month || 'Juli 2026'}</span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Rp{(salesGoal.current_revenue / 1000000).toFixed(1)}M
                  <span className="text-xs text-slate-400 font-normal"> / Rp{(salesGoal.target_revenue / 1000000).toFixed(0)}M</span>
                </span>
                <span className="text-xs font-black text-orange-500">{goalPct}%</span>
              </div>
              
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${goalPct}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-medium">{salesGoal.days_left || 3} {t.salesView.daysLeft}</span>
              <button 
                onClick={() => setActiveModal('setGoal')}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] cursor-pointer transition-all"
              >
                {t.salesView.setGoal}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM AI INSIGHT BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-orange-50/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 rounded-3xl p-5 border border-orange-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">AI Sales Optimization Swarm</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <img src={metrics.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'} alt="AI Model" className="size-3.5 object-contain bg-white rounded-xs" />
                <span>{metrics.model_engine || '9Router-Auto-Cost-Optimizer'}</span>
                <span>•</span>
                <span>{metrics.execution_gateway || 'ZeroClaw-Edge-Gateway'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveModal('aiReport')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-extrabold text-xs border border-orange-200 dark:border-slate-700 hover:bg-orange-100 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles size={12} />
              <span>{t.salesView.aiReportFull} →</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {insights.slice(0, 3).map((ins: any, idx: number) => (
            <div key={ins.id || idx} className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs font-medium space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-purple-600 dark:text-purple-400 font-extrabold flex items-center gap-1.5 truncate">
                  <img src={ins.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/9router.png'} alt="AI" className="size-4 object-contain bg-white p-0.5 rounded-xs" />
                  <span className="truncate">{ins.headline}</span>
                </p>
              </div>
              <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{ins.content}</p>
            </div>
          ))}
        </div>
      </div>

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
      />

      <AiReportModal
        isOpen={activeModal === 'aiReport'}
        onClose={() => setActiveModal(null)}
        insights={insights}
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
