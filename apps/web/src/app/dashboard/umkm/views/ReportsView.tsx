import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, TrendingUp, ShoppingBag, Users, DollarSign, 
  Calendar, Filter, ArrowRight, Sparkles, Clock, Check, ChevronDown, 
  Percent, ChevronRight, Eye, RefreshCw, FileText, PieChart, ShieldCheck
} from 'lucide-react';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../utils/cdn';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { 
  ExportReportModal, AIHealthRecommendationModal, 
  ScheduleReportModal, QuickAccessDetailModal,
  DatePickerModal, ReportsFilterModal, getRealtimeMonthDateRange
} from './reports/ReportModals';
import { CustomReportModal } from './reports/CustomReportModal';
import { AiRecommendationsSubView } from './reports/AiRecommendationsSubView';
import { SalesSubView } from './reports/SalesSubView';
import { MarketingSubView } from './reports/MarketingSubView';
import { StoreSubView } from './reports/StoreSubView';
import { FinanceSubView } from './reports/FinanceSubView';
import { CustomersSubView } from './reports/CustomersSubView';

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

const TAB_QUERY_MAP: Record<string, string> = {
  'overview': 'Ringkasan Overview',
  'sales': 'Laporan Penjualan',
  'marketing': 'Laporan Marketing',
  'store': 'Laporan Store',
  'store-report': 'Laporan Store',
  'store_report': 'Laporan Store',
  'finance': 'Laporan Keuangan',
  'money-reports': 'Laporan Keuangan',
  'money_reports': 'Laporan Keuangan',
  'customers': 'Laporan Pelanggan',
  'ai-recommendations': 'Rekomendasi AI',
};

const REVERSE_TAB_MAP: Record<string, string> = {
  'Ringkasan Overview': 'overview',
  'Laporan Penjualan': 'sales',
  'Laporan Marketing': 'marketing',
  'Laporan Store': 'store',
  'Laporan Keuangan': 'finance',
  'Laporan Pelanggan': 'customers',
  'Rekomendasi AI': 'ai-recommendations',
};

// Smart Brand Logo Resolver for Overview Sales Channels
export const getPerformerLogoUrl = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('whatsapp') || n.includes('wa')) {
    return '/assets/logo/whatsapp-for-business.webp';
  }
  if (n.includes('shopee')) {
    return '/assets/logo/shopee.png';
  }
  if (n.includes('instagram') || n.includes('ig')) {
    return '/assets/logo/instagram.png';
  }
  if (n.includes('tiktok')) {
    return '/assets/logo/tiktok.webp';
  }
  return '/assets/logo/zegalogo.png';
};

interface ReportsViewProps {
  triggerToast: (msg: string) => void;
}

export function ReportsView({ triggerToast }: ReportsViewProps) {
  const { language, t } = useLanguage();
  const r = t.reportsView;

  const getInitialSubTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab')?.toLowerCase();
      if (tabParam && TAB_QUERY_MAP[tabParam]) {
        return TAB_QUERY_MAP[tabParam];
      }
    }
    return 'Ringkasan Overview';
  };

  const [subTab, setSubTabState] = useState<string>(getInitialSubTab);

  const setSubTab = (t: string) => {
    setSubTabState(t);
    if (typeof window !== 'undefined') {
      const slug = REVERSE_TAB_MAP[t] || 'overview';
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') !== slug) {
        params.set('tab', slug);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab')?.toLowerCase();
        if (tabParam && TAB_QUERY_MAP[tabParam]) {
          setSubTabState(TAB_QUERY_MAP[tabParam]);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [timeHorizon, setTimeHorizon] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [dateRange, setDateRange] = useState(() => getRealtimeMonthDateRange(language, 0));

  useEffect(() => {
    setDateRange(getRealtimeMonthDateRange(language, 0));
  }, [language]);

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [quickAccessModalTitle, setQuickAccessModalTitle] = useState<string | null>(null);

  // Consolidated Reports Data State
  // Consolidated Reports Data State (Zero-Trust Data Integrity)
  const [reportsData, setReportsData] = useState<any>({
    metrics: {
      total_revenue_idr: 0,
      total_orders: 0,
      new_customers: 0,
      avg_order_value_idr: 0,
      conversion_rate_pct: 0,
      revenue_growth_pct: 0,
      orders_growth_pct: 0,
      customers_growth_pct: 0,
      aov_growth_pct: 0,
      conversion_growth_pct: 0
    },
    revenueTime: [],
    salesChannels: [],
    healthScore: {
      score: 0,
      category_label: '-',
      points_change: 0,
      percentile_comparison_pct: 0,
      ai_recommendation: 'Belum ada telemetry transaksi.'
    },
    topProducts: [],
    topCustomers: [],
    monthlySummary: {
      best_performing_day: '-',
      total_transactions: 0,
      total_customers: 0,
      repeat_customer_rate_pct: 0,
      returning_customer_value_idr: 0
    },
    schedules: []
  });

  // Load Realtime Data from Supabase with Subtab & Time Horizon filters
  const loadReportsOverview = async () => {
    try {
      const data = await SupabaseDashboardService.getUmkmAiIntelligenceOverview(subTab, timeHorizon, dateRange);
      if (data) {
        setReportsData({
          metrics: data.metrics || {
            total_revenue_idr: 0, total_orders: 0, new_customers: 0, avg_order_value_idr: 0,
            conversion_rate_pct: 0, revenue_growth_pct: 0, orders_growth_pct: 0,
            customers_growth_pct: 0, aov_growth_pct: 0, conversion_growth_pct: 0
          },
          revenueTime: data.revenueTime || [],
          salesChannels: data.salesChannels || [],
          healthScore: data.healthScore || { score: 0, category_label: '-', points_change: 0, percentile_comparison_pct: 0, ai_recommendation: 'Belum ada telemetry transaksi.' },
          topProducts: data.topProducts || [],
          topCustomers: data.topCustomers || [],
          monthlySummary: data.monthlySummary || { best_performing_day: '-', total_transactions: 0, total_customers: 0, repeat_customer_rate_pct: 0, returning_customer_value_idr: 0 },
          schedules: data.schedules || []
        });
      }
    } catch (e) {
      console.warn('AI Intelligence overview load error:', e);
    }
  };

  useEffect(() => {
    loadReportsOverview();
    const unsubscribe = SupabaseDashboardService.subscribeToReportsRealtime(() => {
      loadReportsOverview();
    });
    return () => unsubscribe();
  }, [subTab, timeHorizon, dateRange]);

  // 1. Multi-series Chart Data (Revenue & Orders Over Time)
  const revenueLabels = (reportsData.revenueTime || []).map((r: any) => r?.period_label || '');
  const revenueValues = (reportsData.revenueTime || []).map((r: any) => r?.revenue_idr || 0);
  const orderValues = (reportsData.revenueTime || []).map((r: any) => r?.orders_count || 0);

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
    labels: (reportsData.salesChannels || []).map((c: any) => c?.channel_name || ''),
    datasets: [
      {
        data: (reportsData.salesChannels || []).map((c: any) => c?.percentage || 0),
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
  const healthScoreVal = reportsData.healthScore?.score ?? 0;
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {t.reportsView?.title || 'Reports'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
            {t.reportsView?.subtitle || 'Laporan lengkap performa bisnis Anda. Analisis data, pantau tren, dan ambil keputusan lebih cerdas.'}
          </p>
        </div>

        {/* Top Controls: Show ONLY on Overview Tab */}
        {(subTab === 'Ringkasan Overview' || subTab === 'Overview') && (
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full lg:w-auto">
            {/* Date Picker Selector */}
            <button
              onClick={() => setIsDatePickerModalOpen(true)}
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 shadow-2xs hover:border-orange-500 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Calendar size={13} className="text-orange-500 shrink-0" />
              <span className="truncate">{dateRange}</span>
            </button>

            {/* Filter Button */}
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
            >
              <Filter size={13} className="shrink-0" /> <span>Filter</span>
            </button>

            {/* Export Report Action */}
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all whitespace-nowrap"
            >
              <Download size={14} className="shrink-0" /> <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar scrollbar-none pt-1">
        {[
          { key: 'Ringkasan Overview', label: t.reportsView?.overviewTab || 'Ringkasan Overview' },
          { key: 'Laporan Penjualan', label: t.reportsView?.salesTab || 'Laporan Penjualan' },
          { key: 'Laporan Marketing', label: t.reportsView?.marketingTab || 'Laporan Marketing' },
          { key: 'Laporan Store', label: t.reportsView?.storeTab || 'Laporan Store' },
          { key: 'Laporan Keuangan', label: t.reportsView?.financeTab || 'Laporan Keuangan' },
          { key: 'Laporan Pelanggan', label: t.reportsView?.customersTab || 'Laporan Pelanggan' },
          { key: 'Rekomendasi AI', label: t.reportsView?.aiRecommendationsTab || 'Rekomendasi AI' },
        ].map((tabObj) => (
          <button 
            key={tabObj.key}
            onClick={() => {
              setSubTab(tabObj.key);
              triggerToast(`Focus Laporan: ${tabObj.label}`);
            }}
            className={`pb-3 transition-all cursor-pointer whitespace-nowrap ${
              subTab === tabObj.key 
                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tabObj.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB CONTENT ROUTING */}
      {(subTab === 'Laporan Penjualan' || subTab === 'Sales') && <SalesSubView triggerToast={triggerToast} dateRange={dateRange} reportsData={reportsData} />}
      {(subTab === 'Laporan Marketing' || subTab === 'Marketing') && <MarketingSubView triggerToast={triggerToast} dateRange={dateRange} reportsData={reportsData} />}
      {(subTab === 'Laporan Store' || subTab === 'Store') && <StoreSubView triggerToast={triggerToast} dateRange={dateRange} reportsData={reportsData} />}
      {(subTab === 'Laporan Keuangan' || subTab === 'Finance') && <FinanceSubView triggerToast={triggerToast} dateRange={dateRange} reportsData={reportsData} />}
      {(subTab === 'Laporan Pelanggan' || subTab === 'Customers') && <CustomersSubView triggerToast={triggerToast} dateRange={dateRange} reportsData={reportsData} />}
      {subTab === 'Rekomendasi AI' && <AiRecommendationsSubView triggerToast={triggerToast} dateRange={dateRange} />}

      {/* OVERVIEW TAB CONTENT */}
      {(subTab === 'Ringkasan Overview' || subTab === 'Overview') && <>
      {/* 3. Top 5 ENTERPRISE Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-8 sm:size-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <DollarSign size={16} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              ↑ {reportsData.metrics?.revenue_growth_pct ?? 0}%
            </span>
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">Total Revenue</span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              Rp{(reportsData.metrics?.total_revenue_idr ?? 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block mt-0.5">vs last month</span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-8 sm:size-9 rounded-xl bg-orange-500/10 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center font-bold">
              <ShoppingBag size={16} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              ↑ {reportsData.metrics?.orders_growth_pct ?? 0}%
            </span>
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">Orders</span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              {reportsData.metrics?.total_orders ?? 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block mt-0.5">vs last month</span>
          </div>
        </div>

        {/* Card 3: New Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-8 sm:size-9 rounded-xl bg-blue-500/10 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              ↑ {reportsData.metrics?.customers_growth_pct ?? 0}%
            </span>
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">New Customers</span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              {reportsData.metrics?.new_customers ?? 0}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block mt-0.5">vs last month</span>
          </div>
        </div>

        {/* Card 4: Avg Order Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-8 sm:size-9 rounded-xl bg-purple-500/10 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
              <BarChart3 size={16} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              ↑ {reportsData.metrics?.aov_growth_pct ?? 0}%
            </span>
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">Avg Order Value</span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              Rp{(reportsData.metrics?.avg_order_value_idr ?? 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block mt-0.5">vs last month</span>
          </div>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="size-8 sm:size-9 rounded-xl bg-pink-500/10 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-500/20 flex items-center justify-center font-bold">
              <Percent size={16} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] sm:text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              ↑ {reportsData.metrics?.conversion_growth_pct ?? 0}%
            </span>
          </div>
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">Conversion Rate</span>
            <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              {reportsData.metrics?.conversion_rate_pct ?? 0}%
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal block mt-0.5">vs last month</span>
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
                  onClick={() => {
                    setTimeHorizon(tab);
                    triggerToast(`📅 Horizon Revenue Over Time: ${tab}`);
                  }}
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
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                Rp{((reportsData.metrics?.total_revenue_idr || 0) / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>

          {/* Channel Legend Breakdown with R2 CDN Logos */}
          <div className="space-y-2 text-xs font-bold">
            {(reportsData.salesChannels || []).map((c: any, i: number) => {
              const logoUrl = getPerformerLogoUrl(c?.channel_name || '');
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <img src={logoUrl} alt={c?.channel_name || ''} className="size-5 rounded-md object-contain shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{c?.channel_name || ''}</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {c?.percentage ?? 0}% <span className="text-slate-400 font-normal">(Rp{((c?.revenue_idr || 0) / 1000000).toFixed(1)}M)</span>
                  </span>
                </div>
              );
            })}
          </div>


          <button 
            onClick={() => setSubTab('Laporan Penjualan')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>{t.reportsView?.viewAllChannels || 'Lihat Semua Channel'}</span>
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
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{reportsData.healthScore?.score ?? 0}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{reportsData.healthScore?.category_label || '-'}</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-extrabold">
                <span>↑ {reportsData.healthScore?.points_change ?? 0} {t.reportsView?.pointsVsLastMonth || 'points vs last month'}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-1">
                {(() => {
                  const raw = reportsData.healthScore?.ai_recommendation;
                  if (!raw || raw.includes('Performa toko berjalan') || raw.includes('Belum ada telemetry') || raw.includes('Belum ada data') || raw.includes('Telemetry toko dipantau')) {
                    return t.reportsView?.aiDiagnosisDefault || 'Diagnosis AI: Performa toko berjalan pada kapasitas puncak. Fokus utama adalah menjaga ketersediaan stok kritis & mengaktifkan otomasi cart follow-up.';
                  }
                  return raw;
                })()}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setSubTab('Rekomendasi AI')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>{t.reportsView?.aiRecommendationsTab || 'Lihat Rekomendasi AI'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 5. Bottom Grid: Top Products, Top Customers, & Ringkasan Bulanan */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Top Products Table (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.topProductsTitle || 'Top Products'}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-1">#</th>
                  <th className="py-2 px-2">{r.colProductUpper || 'PRODUK'}</th>
                  <th className="py-2 px-2 text-center">{r.colUnitsSold || 'TERJUAL'}</th>
                  <th className="py-2 px-2 text-right">{r.colRevenueUpper || 'REVENUE'}</th>
                  <th className="py-2 px-2 text-right">{r.colTrend || 'TREND'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(reportsData.topProducts || []).map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-1 font-bold text-slate-400">{p?.rank ?? (i + 1)}</td>
                    <td className="py-2.5 px-2 font-extrabold text-slate-900 dark:text-slate-100 truncate">{p?.product_name || '-'}</td>
                    <td className="py-2.5 px-2 text-center font-bold">{p?.units_sold ?? 0}</td>
                    <td className="py-2.5 px-2 text-right font-black">Rp{(p?.revenue_idr ?? 0).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-2 text-right font-bold">
                      <span className={`inline-flex items-center gap-0.5 ${p?.trend_direction === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p?.trend_direction === 'up' ? '↑' : '↓'} {p?.trend_pct ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setQuickAccessModalTitle(r.topProductsReportTitle || 'Laporan Top Produk')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>{r.viewAllProducts || 'Lihat Semua Produk'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Top Customers Table (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.topCustomersTitle || 'Top Customers'}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-2">{r.colCustomerUpper || 'CUSTOMER'}</th>
                  <th className="py-2 px-2 text-center">{r.colOrdersUpper || 'ORDERS'}</th>
                  <th className="py-2 px-2 text-right">{r.colTotalSpend || 'TOTAL SPEND'}</th>
                  <th className="py-2 px-2 text-center">{r.colLastOrderUpper || 'LAST ORDER'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(reportsData.topCustomers || []).map((c: any, i: number) => {
                  const avatarSrc = (c?.avatar_url && c.avatar_url.startsWith('http'))
                    ? c.avatar_url
                    : getR2CdnUrl(c?.avatar_url || '', true);

                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={avatarSrc} 
                            alt={c?.customer_name || 'Customer'}
                            className="size-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-xs"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = generateInitialsAvatar(c?.customer_name || 'C');
                            }}
                          />
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{c?.customer_name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-extrabold text-slate-900 dark:text-slate-100">{c?.orders_count ?? 0}</td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900 dark:text-slate-100">Rp{(c?.total_spend_idr ?? 0).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-400">{c?.last_order_at || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setSubTab('Laporan Pelanggan')}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-1 flex items-center justify-center gap-1"
          >
            <span>{r.viewAllCustomers || 'Lihat Semua Pelanggan'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Ringkasan Bulanan Card (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3.5">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.monthlySummaryTitle || 'Ringkasan Bulanan'}</h3>

            <div className="space-y-2.5 text-xs font-bold">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">{r.bestPerformingDay || 'Best Performing Day'}</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">{reportsData.monthlySummary?.best_performing_day || '-'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">{r.totalTransactions || 'Total Transactions'}</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">{reportsData.monthlySummary?.total_transactions ?? 0}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">{r.totalCustomersLabel || 'Total Customers'}</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">{reportsData.monthlySummary?.total_customers ?? 0}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">{r.repeatCustomerRateLabel || 'Repeat Customer Rate'}</span>
                <span className="text-emerald-600 font-mono font-black">{reportsData.monthlySummary?.repeat_customer_rate_pct ?? 0}%</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">{r.returningCustomerValueLabel || 'Returning Customer Value'}</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono font-black">
                  Rp{(reportsData.monthlySummary?.returning_customer_value_idr ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>{r.viewFullReport || 'Lihat Laporan Lengkap'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 6. Quick Access & Report Schedule Row */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Quick Access Grid (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.quickAccessTitle || 'Quick Access'}</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { title: r.quickAccessSalesTitle || 'Laporan Penjualan', desc: r.quickAccessSalesDesc || 'Analisis penjualan & order', tab: 'Laporan Penjualan', icon: BarChart3, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' },
              { title: r.quickAccessMarketingTitle || 'Laporan Marketing', desc: r.quickAccessMarketingDesc || 'Evaluasi campaign & ROI', tab: 'Laporan Marketing', icon: TrendingUp, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' },
              { title: r.quickAccessStoreTitle || 'Laporan Store', desc: r.quickAccessStoreDesc || 'Produk, stok & performa', tab: 'Laporan Store', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
              { title: r.quickAccessFinanceTitle || 'Laporan Keuangan', desc: r.quickAccessFinanceDesc || 'Arus kas & profitabilitas', tab: 'Laporan Keuangan', icon: DollarSign, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60' },
              { title: r.quickAccessCustomerTitle || 'Laporan Pelanggan', desc: r.quickAccessCustomerDesc || 'Akuisisi & retensi', tab: 'Laporan Pelanggan', icon: Users, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/60' },
              { title: r.quickAccessCustomTitle || 'Custom Report', desc: r.quickAccessCustomDesc || 'Buat laporan kustom AI', tab: 'Custom', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' }
            ].map((item, i) => {
              const IconComp = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (item.tab === 'Custom') {
                      setIsCustomReportModalOpen(true);
                    } else {
                      setSubTab(item.tab);
                    }
                  }}
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
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.reportScheduleTitle || 'Jadwal Laporan'}</h3>

            <div className="space-y-2.5 text-xs font-semibold">
              {reportsData.schedules.map((s: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{s.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.cron_description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {s.is_active ? (r.activeStatus || 'Aktif') : (r.inactiveStatus || 'Non-aktif')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer pt-2 flex items-center justify-center gap-1"
          >
            <span>{r.manageScheduleBtn || 'Kelola Jadwal'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      </>}

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

      <CustomReportModal
        isOpen={isCustomReportModalOpen}
        onClose={() => setIsCustomReportModalOpen(false)}
        triggerToast={triggerToast}
      />

      <DatePickerModal
        isOpen={isDatePickerModalOpen}
        onClose={() => setIsDatePickerModalOpen(false)}
        currentRange={dateRange}
        onSelectRange={(range) => setDateRange(range)}
        triggerToast={triggerToast}
      />

      <ReportsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        subTab={subTab}
        triggerToast={triggerToast}
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
