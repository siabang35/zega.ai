import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, TrendingUp, ShoppingBag, Users, DollarSign, 
  Calendar, Filter, ArrowRight, Sparkles, Clock, Check, ChevronDown, 
  Percent, ChevronRight, Eye, RefreshCw, FileText, PieChart, ShieldCheck
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  ExportReportModal, AIHealthRecommendationModal, 
  ScheduleReportModal, QuickAccessDetailModal 
} from './reports/ReportModals';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportsViewProps {
  triggerToast: (msg: string) => void;
}

export function ReportsView({ triggerToast }: ReportsViewProps) {
  const [subTab, setSubTab] = useState('Overview');
  const [timeHorizon, setTimeHorizon] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [dateRange, setDateRange] = useState('1 Jul – 31 Jul 2026');

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [quickAccessModalTitle, setQuickAccessModalTitle] = useState<string | null>(null);

  // Consolidated Reports Data State
  const [reportsData, setReportsData] = useState<any>({
    metrics: {
      total_revenue_idr: 13500000.00,
      total_orders: 116,
      new_customers: 126,
      avg_order_value_idr: 116379.00,
      conversion_rate_pct: 4.20,
      revenue_growth_pct: 18.00,
      orders_growth_pct: 21.00,
      customers_growth_pct: 15.00,
      aov_growth_pct: 5.00,
      conversion_growth_pct: 1.30
    },
    revenueTime: [
      { period_label: '1 Jul', revenue_idr: 600000, orders_count: 5 },
      { period_label: '6 Jul', revenue_idr: 1400000, orders_count: 12 },
      { period_label: '11 Jul', revenue_idr: 1800000, orders_count: 15 },
      { period_label: '16 Jul', revenue_idr: 2160000, orders_count: 18 },
      { period_label: '21 Jul', revenue_idr: 2900000, orders_count: 24 },
      { period_label: '26 Jul', revenue_idr: 2100000, orders_count: 19 },
      { period_label: '31 Jul', revenue_idr: 2540000, orders_count: 23 }
    ],
    salesChannels: [
      { channel_name: 'WhatsApp', percentage: 45, revenue_idr: 6100000, color_hex: '#3b82f6' },
      { channel_name: 'Shopee', percentage: 30, revenue_idr: 4100000, color_hex: '#10b981' },
      { channel_name: 'Instagram', percentage: 15, revenue_idr: 2000000, color_hex: '#a855f7' },
      { channel_name: 'TikTok', percentage: 10, revenue_idr: 1300000, color_hex: '#f97316' }
    ],
    healthScore: {
      score: 78,
      category_label: 'Baik',
      points_change: 12,
      percentile_comparison_pct: 76,
      ai_recommendation: 'Performa bisnis Anda lebih baik dari 76% UMKM sejenis di industri Anda.'
    },
    topProducts: [
      { rank: 1, product_name: 'Kaos Polos Hitam', units_sold: 32, revenue_idr: 1920000, trend_pct: 18, trend_direction: 'up' },
      { rank: 2, product_name: 'Tumbler Premium', units_sold: 28, revenue_idr: 2800000, trend_pct: 12, trend_direction: 'up' },
      { rank: 3, product_name: 'Botol Minum 500ml', units_sold: 24, revenue_idr: 1680000, trend_pct: 8, trend_direction: 'up' },
      { rank: 4, product_name: 'Hoodie Full Zip', units_sold: 18, revenue_idr: 3600000, trend_pct: 4, trend_direction: 'down' },
      { rank: 5, product_name: 'Totebag Canvas', units_sold: 15, revenue_idr: 750000, trend_pct: 6, trend_direction: 'up' }
    ],
    topCustomers: [
      { customer_name: 'Siti Aisyah', orders_count: 12, total_spend_idr: 3200000, last_order_at: '28 Jul 2026', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { customer_name: 'Budi Santoso', orders_count: 9, total_spend_idr: 2180000, last_order_at: '27 Jul 2026', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { customer_name: 'Dewi Lestari', orders_count: 8, total_spend_idr: 1950000, last_order_at: '26 Jul 2026', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { customer_name: 'Rizky Pratama', orders_count: 7, total_spend_idr: 1120000, last_order_at: '26 Jul 2026', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { customer_name: 'Maya Putri', orders_count: 6, total_spend_idr: 1450000, last_order_at: '25 Jul 2026', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }
    ],
    monthlySummary: {
      best_performing_day: '22 Jul 2026',
      total_transactions: 128,
      total_customers: 86,
      repeat_customer_rate_pct: 42,
      returning_customer_value_idr: 5670000.00
    },
    schedules: [
      { schedule_type: 'Weekly', title: 'Laporan Mingguan', cron_description: 'Setiap Senin, 08:00', is_active: true },
      { schedule_type: 'Monthly', title: 'Laporan Bulanan', cron_description: 'Setiap 1 Bulan, 08:00', is_active: true }
    ]
  });

  // Load Realtime Data from Supabase
  const loadReportsOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmReportsOverview();
      if (data) {
        setReportsData((prev: any) => ({
          ...prev,
          metrics: data.metrics || prev.metrics,
          revenueTime: data.revenueTime?.length > 0 ? data.revenueTime : prev.revenueTime,
          salesChannels: data.salesChannels?.length > 0 ? data.salesChannels : prev.salesChannels,
          healthScore: data.healthScore || prev.healthScore,
          topProducts: data.topProducts?.length > 0 ? data.topProducts : prev.topProducts,
          topCustomers: data.topCustomers?.length > 0 ? data.topCustomers : prev.topCustomers,
          monthlySummary: data.monthlySummary || prev.monthlySummary,
          schedules: data.schedules?.length > 0 ? data.schedules : prev.schedules
        }));
      }
    } catch (e) {
      console.warn('Reports overview load error:', e);
    }
  };

  useEffect(() => {
    loadReportsOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToReportsRealtime(() => {
      loadReportsOverview();
    });
    return () => unsubscribe();
  }, []);

  // 1. Multi-series Chart Data (Revenue & Orders Over Time)
  const revenueLabels = reportsData.revenueTime.map((r: any) => r.period_label);
  const revenueValues = reportsData.revenueTime.map((r: any) => r.revenue_idr);
  const orderValues = reportsData.revenueTime.map((r: any) => r.orders_count);

  const lineData = {
    labels: revenueLabels,
    datasets: [
      {
        label: 'Revenue (Rp)',
        data: revenueValues,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        yAxisID: 'y'
      },
      {
        label: 'Orders',
        data: orderValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        yAxisID: 'y1'
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 11, weight: 'bold' as const },
        bodyFont: { size: 11, weight: 'normal' as const },
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (ctx: any) => {
            if (ctx.dataset.label === 'Revenue (Rp)') {
              return ` Revenue: Rp${ctx.parsed.y.toLocaleString('id-ID')}`;
            }
            return ` Orders: ${ctx.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          color: '#94a3b8',
          callback: (val: any) => val >= 1000000 ? `Rp${(val / 1000000).toFixed(0)}M` : `Rp${val}`
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: 'bold' as const },
          color: '#94a3b8'
        }
      }
    }
  };

  // 2. Sales Channel Donut Setup
  const channelData = {
    labels: reportsData.salesChannels.map((c: any) => c.channel_name),
    datasets: [
      {
        data: reportsData.salesChannels.map((c: any) => c.percentage),
        backgroundColor: ['#3b82f6', '#10b981', '#a855f7', '#f97316'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const channelOptions = {
    cutout: '76%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        bodyFont: { size: 11, weight: 'bold' as const },
        cornerRadius: 10
      }
    }
  };

  // 3. Business Health Gauge (Semi Doughnut) Setup
  const healthScoreVal = reportsData.healthScore.score;
  const gaugeData = {
    labels: ['Score', 'Remaining'],
    datasets: [
      {
        data: [healthScoreVal, 100 - healthScoreVal],
        backgroundColor: ['#10b981', '#e2e8f0'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      }
    ]
  };

  const gaugeOptions = {
    cutout: '80%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            Laporan lengkap performa bisnis Anda. Analisis data, pantau tren, dan ambil keputusan lebih cerdas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Selector */}
          <button
            onClick={() => {
              const ranges = ['1 Jul – 31 Jul 2026', '1 Jun – 30 Jun 2026', 'Q2 2026', 'Tahun 2026'];
              const next = ranges[(ranges.indexOf(dateRange) + 1) % ranges.length];
              setDateRange(next);
              triggerToast(`Periode Laporan disesuaikan ke: ${next}`);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 shadow-xs hover:border-orange-500 cursor-pointer transition-colors"
          >
            <Calendar size={14} className="text-orange-500" />
            <span>{dateRange}</span>
          </button>

          {/* Filter Button */}
          <button 
            onClick={() => triggerToast(`Filter Laporan Aktif: ${subTab} (${dateRange})`)}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Filter size={14} /> <span>Filter</span>
          </button>

          {/* Export Report Action */}
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Download size={16} /> <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold overflow-x-auto no-scrollbar">
        {['Overview', 'Sales', 'Marketing', 'Store', 'Finance', 'Customers'].map((t) => (
          <button 
            key={t}
            onClick={() => {
              setSubTab(t);
              triggerToast(`Focus Laporan: ${t}`);
            }}
            className={`pb-3 transition-all cursor-pointer whitespace-nowrap ${
              subTab === t 
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 3. Top 5 Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Total Revenue</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center font-black">
              $
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(reportsData.metrics.total_revenue_idr).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-bold text-emerald-600">
                ↑ {reportsData.metrics.revenue_growth_pct}% vs last month
              </span>
              <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 15">
                <path d="M 0 12 Q 12 2, 25 10 T 50 3" fill="none" stroke="#10b981" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-orange-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Orders</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 flex items-center justify-center font-black">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {reportsData.metrics.total_orders}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-bold text-emerald-600">
                ↑ {reportsData.metrics.orders_growth_pct}% vs last month
              </span>
              <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 15">
                <path d="M 0 14 Q 15 5, 30 12 T 50 2" fill="none" stroke="#f97316" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: New Customers */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>New Customers</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 flex items-center justify-center font-black">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {reportsData.metrics.new_customers}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-bold text-emerald-600">
                ↑ {reportsData.metrics.customers_growth_pct}% vs last month
              </span>
              <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 15">
                <path d="M 0 10 Q 15 14, 30 4 T 50 1" fill="none" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Avg Order Value */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Avg Order Value</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center font-black">
              <BarChart3 size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(reportsData.metrics.avg_order_value_idr).toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-bold text-emerald-600">
                ↑ {reportsData.metrics.aov_growth_pct}% vs last month
              </span>
              <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 15">
                <path d="M 0 12 Q 15 3, 30 9 T 50 2" fill="none" stroke="#a855f7" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs col-span-2 md:col-span-1 hover:border-pink-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>Conversion Rate</span>
            <div className="size-8 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/60 flex items-center justify-center font-black">
              <Percent size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {reportsData.metrics.conversion_rate_pct}%
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-bold text-emerald-600">
                ↑ {reportsData.metrics.conversion_growth_pct}% vs last month
              </span>
              <svg className="w-12 h-4 overflow-visible" viewBox="0 0 50 15">
                <path d="M 0 13 Q 15 6, 30 11 T 50 4" fill="none" stroke="#ec4899" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: Revenue Over Time, Sales by Channel, & Business Health Score */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Revenue Over Time Multi-line Chart (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Revenue Over Time</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Revenue (Rp)</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Orders</span>
              </div>
            </div>

            {/* Time Horizon Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-extrabold">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeHorizon(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    timeHorizon === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Sales by Channel Donut Chart (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Sales by Channel</h3>

          <div className="relative size-40 mx-auto">
            <Doughnut data={channelData} options={channelOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400">Total</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">Rp13.5M</span>
            </div>
          </div>

          {/* Channel Legend Breakdown */}
          <div className="space-y-2 text-xs font-bold">
            {reportsData.salesChannels.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color_hex }} />
                  <span className="text-slate-700 dark:text-slate-300">{c.channel_name}</span>
                </div>
                <span className="font-mono text-slate-900 dark:text-slate-100">
                  {c.percentage}% <span className="text-slate-400 font-normal">(Rp{(c.revenue_idr / 1000000).toFixed(1)}M)</span>
                </span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => { setQuickAccessModalTitle('Analisis Channel Penjualan'); }}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>Lihat Semua Channel</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Business Health Score Gauge (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Business Health Score</h3>

            {/* Gauge Canvas */}
            <div className="relative h-28 w-44 mx-auto pt-2">
              <Doughnut data={gaugeData} options={gaugeOptions} />
              <div className="absolute bottom-1 inset-x-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{reportsData.healthScore.score}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{reportsData.healthScore.category_label}</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                <span>↑ {reportsData.healthScore.points_change} poin vs last month</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-1">
                {reportsData.healthScore.ai_recommendation}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsHealthModalOpen(true)}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>Lihat Rekomendasi AI</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 5. Bottom Grid: Top Products, Top Customers, & Ringkasan Bulanan */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Top Products Table (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Top Products</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-1">#</th>
                  <th className="py-2 px-2">PRODUK</th>
                  <th className="py-2 px-2 text-center">TERJUAL</th>
                  <th className="py-2 px-2 text-right">REVENUE</th>
                  <th className="py-2 px-2 text-right">TREND</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportsData.topProducts.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-1 font-bold text-slate-400">{p.rank}</td>
                    <td className="py-2.5 px-2 font-extrabold text-slate-900 dark:text-slate-100 truncate">{p.product_name}</td>
                    <td className="py-2.5 px-2 text-center font-bold">{p.units_sold}</td>
                    <td className="py-2.5 px-2 text-right font-black">Rp{(p.revenue_idr).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-2 text-right font-bold">
                      <span className={`inline-flex items-center gap-0.5 ${p.trend_direction === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.trend_direction === 'up' ? '↑' : '↓'} {p.trend_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setQuickAccessModalTitle('Laporan Top Produk')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>Lihat Semua Produk</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Top Customers Table (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Top Customers</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-2">CUSTOMER</th>
                  <th className="py-2 px-2 text-center">ORDERS</th>
                  <th className="py-2 px-2 text-right">TOTAL SPEND</th>
                  <th className="py-2 px-2 text-center">LAST ORDER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportsData.topCustomers.map((c: any, i: number) => {
                  const avatarSrc = (c.avatar_url && c.avatar_url.startsWith('http'))
                    ? c.avatar_url
                    : getR2CdnUrl(c.avatar_url || '', true);

                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={avatarSrc} 
                            alt={c.customer_name}
                            className="size-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = generateInitialsAvatar(c.customer_name);
                            }}
                          />
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{c.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-extrabold text-slate-900 dark:text-slate-100">{c.orders_count}</td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900 dark:text-slate-100">Rp{(c.total_spend_idr).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-400">{c.last_order_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setQuickAccessModalTitle('Laporan Top Pelanggan')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>Lihat Semua Pelanggan</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Ringkasan Bulanan Card (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3.5">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Ringkasan Bulanan</h3>

            <div className="space-y-2.5 text-xs font-bold">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Best Performing Day</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">{reportsData.monthlySummary.best_performing_day}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Total Transactions</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">{reportsData.monthlySummary.total_transactions}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Total Customers</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">{reportsData.monthlySummary.total_customers}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Repeat Customer Rate</span>
                <span className="text-emerald-600 font-mono font-black">{reportsData.monthlySummary.repeat_customer_rate_pct}%</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Returning Customer Value</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono font-black">
                  Rp{(reportsData.monthlySummary.returning_customer_value_idr).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setQuickAccessModalTitle('Ringkasan Bulanan Komprehensif')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>Lihat Laporan Lengkap</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 6. Quick Access & Report Schedule Row */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Quick Access Grid (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Quick Access</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { title: 'Laporan Penjualan', desc: 'Analisis penjualan & order', icon: BarChart3, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
              { title: 'Laporan Marketing', desc: 'Evaluasi campaign & ROI', icon: TrendingUp, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
              { title: 'Laporan Store', desc: 'Produk, stok & performa', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
              { title: 'Laporan Keuangan', desc: 'Arus kas & profitabilitas', icon: DollarSign, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60' },
              { title: 'Laporan Pelanggan', desc: 'Akuisisi & retensi', icon: Users, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/60' },
              { title: 'Custom Report', desc: 'Buat laporan kustom', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' }
            ].map((item, i) => {
              const IconComp = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => setQuickAccessModalTitle(item.title)}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 text-left space-y-2 transition-all cursor-pointer group shadow-xs"
                >
                  <div className={`size-8 rounded-xl ${item.color} flex items-center justify-center`}>
                    <IconComp size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-orange-500 transition-colors">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Jadwal Laporan Card (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Jadwal Laporan</h3>

            <div className="space-y-2.5 text-xs font-semibold">
              {reportsData.schedules.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{s.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.cron_description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {s.is_active ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>Kelola Jadwal</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Action Modals */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadReportsOverview}
      />

      <AIHealthRecommendationModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadReportsOverview}
      />

      <ScheduleReportModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        triggerToast={triggerToast}
        onRefresh={loadReportsOverview}
      />

      {quickAccessModalTitle && (
        <QuickAccessDetailModal
          isOpen={true}
          onClose={() => setQuickAccessModalTitle(null)}
          title={quickAccessModalTitle}
          triggerToast={triggerToast}
          onRefresh={loadReportsOverview}
        />
      )}

    </div>
  );
}
