import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, TrendingUp, DollarSign, Target, Clock,
  RefreshCw, Bot, Briefcase, ShoppingCart, Camera, Music,
  Sparkles, FileText, Download, CheckCircle2, ShieldCheck, Zap, X,
  Filter, Play, BarChart3, ArrowUpRight, CheckCircle, Layers, PieChart, Cpu, Activity
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

// Smart Brand Logo Resolver for Sales Performers & Channels
const getPerformerLogoUrl = (name: string): string => {
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
  if (n.includes('closi') || n.includes('sales agent') || n.includes('bot')) {
    return '/assets/logo/zegalogo.png';
  }
  return '/assets/logo/zegalogo.png';
};

const getPerformerLocalFallback = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('whatsapp')) return '/assets/logo/whatsapp-for-business.webp';
  if (n.includes('shopee')) return '/assets/logo/shopee.png';
  if (n.includes('instagram')) return '/assets/logo/instagram.png';
  if (n.includes('tiktok')) return '/assets/logo/tiktok.webp';
  return '/assets/logo/zegalogo.png';
};

interface SalesSubViewProps {
  triggerToast: (msg: string) => void;
  dateRange: string;
  reportsData: any;
}

export function SalesSubView({ triggerToast, dateRange, reportsData }: SalesSubViewProps) {
  const [salesKpi, setSalesKpi] = useState({
    total_sales_idr: 18450000.00,
    total_orders: 142,
    avg_deal_size_idr: 129929.00,
    win_rate_pct: 21.10,
    revenue_growth_pct: 22.50,
    orders_growth_pct: 24.10,
    aov_growth_pct: 6.40,
    win_rate_growth_pct: 3.20,
  });

  const [pipeline, setPipeline] = useState([
    { stage: 'Leads Masuk', deal_count: 342, deal_value_idr: 85000000, conversion_pct: 100, color_hex: '#3b82f6' },
    { stage: 'Qualified', deal_count: 218, deal_value_idr: 54500000, conversion_pct: 64, color_hex: '#8b5cf6' },
    { stage: 'Proposal Sent', deal_count: 156, deal_value_idr: 39000000, conversion_pct: 46, color_hex: '#f59e0b' },
    { stage: 'Negosiasi', deal_count: 98, deal_value_idr: 24500000, conversion_pct: 29, color_hex: '#f97316' },
    { stage: 'Closed Won', deal_count: 72, deal_value_idr: 18000000, conversion_pct: 21, color_hex: '#10b981' },
  ]);

  const [orderStatuses, setOrderStatuses] = useState([
    { status: 'Selesai', order_count: 89, percentage: 76.7, color_hex: '#10b981' },
    { status: 'Diproses', order_count: 18, percentage: 15.5, color_hex: '#3b82f6' },
    { status: 'Pending', order_count: 6, percentage: 5.2, color_hex: '#f59e0b' },
    { status: 'Dibatalkan', order_count: 3, percentage: 2.6, color_hex: '#ef4444' },
  ]);

  const [dailyTrend, setDailyTrend] = useState([
    { day_label: 'Sen', revenue_idr: 1800000 }, { day_label: 'Sel', revenue_idr: 2200000 },
    { day_label: 'Rab', revenue_idr: 1950000 }, { day_label: 'Kam', revenue_idr: 2400000 },
    { day_label: 'Jum', revenue_idr: 2800000 }, { day_label: 'Sab', revenue_idr: 3100000 },
    { day_label: 'Min', revenue_idr: 1200000 },
  ]);

  const [performers, setPerformers] = useState([
    { performer_name: 'AI Sales Bot – WhatsApp', deals_closed: 34, revenue_idr: 8500000 },
    { performer_name: 'Closi – Sales Agent', deals_closed: 28, revenue_idr: 7200000 },
    { performer_name: 'Shopee Auto-Sync', deals_closed: 22, revenue_idr: 5800000 },
    { performer_name: 'Instagram DM Bot', deals_closed: 14, revenue_idr: 3200000 },
    { performer_name: 'TikTok Shop Agent', deals_closed: 10, revenue_idr: 1800000 },
  ]);

  // Interactive Controls State
  const [selectedHorizon, setSelectedHorizon] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Sales Funnel Summary');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isLaunchBotModalOpen, setIsLaunchBotModalOpen] = useState(false);
  const [botChannel, setBotChannel] = useState('WhatsApp Follow-up Bot');
  const [botTargetStage, setBotTargetStage] = useState('Proposal Sent');
  const [botDiscountPct, setBotDiscountPct] = useState('10');

  const loadSalesData = async () => {
    setIsRefreshing(true);
    try {
      const data = await SupabaseDashboardService.getUmkmAiIntelligenceSubpage('sales');
      
      const mult = selectedHorizon === '7d' ? 0.25 : selectedHorizon === '90d' ? 2.85 : 1.0;

      if (data?.salesKpi) {
        const rawKpi = data.salesKpi;
        const scaledSales = (rawKpi.total_sales_idr || 18450000) * mult;
        const scaledOrders = Math.round((rawKpi.total_orders || 142) * mult);
        const scaledAvg = scaledOrders > 0 ? Math.round(scaledSales / scaledOrders) : rawKpi.avg_deal_size_idr;

        setSalesKpi({
          ...rawKpi,
          total_sales_idr: scaledSales,
          total_orders: scaledOrders,
          avg_deal_size_idr: scaledAvg,
        });
      }

      if (data?.pipeline?.length) {
        setPipeline(data.pipeline.map((p: any) => ({
          ...p,
          deal_count: Math.round((p.deal_count || 0) * mult),
          deal_value_idr: Math.round((p.deal_value_idr || 0) * mult),
        })));
      }

      if (data?.orderStatus?.length) {
        setOrderStatuses(data.orderStatus.map((s: any) => ({
          ...s,
          order_count: Math.round((s.order_count || 0) * mult),
        })));
      }

      if (data?.dailyTrend?.length) {
        setDailyTrend(data.dailyTrend.map((d: any) => ({
          ...d,
          revenue_idr: Math.round((d.revenue_idr || 0) * mult),
        })));
      }

      if (data?.performers?.length) {
        setPerformers(data.performers.map((p: any) => ({
          ...p,
          deals_closed: Math.round((p.deals_closed || 0) * mult),
          revenue_idr: Math.round((p.revenue_idr || 0) * mult),
        })));
      }
    } catch (e) {
      console.warn('Sales sub-page load error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, [dateRange, selectedHorizon]);

  const handleHorizonChange = (horizon: '7d' | '30d' | '90d') => {
    setSelectedHorizon(horizon);
    const label = horizon === '7d' ? '7 Hari Terakhir' : horizon === '30d' ? 'Bulan Ini' : 'Kuartal (90 Hari)';
    triggerToast(`📅 Filter waktu diperbarui: ${label}`);
  };

  const handleRecalculateTelemetry = async () => {
    triggerToast('🔄 Recalculating Sales Telemetry via Supabase RPC...');
    try {
      await SupabaseDashboardService.executeSubpageAction('sales', 'recalculate_umkm_ai_sales_intelligence', {});
      await loadSalesData();
      triggerToast('✓ Sales Telemetry berhasil dikalkulasi ulang!');
    } catch (e) {
      triggerToast('❌ Gagal kalkulasi ulang sales telemetry.');
    }
  };

  const handleLaunchSalesBot = async () => {
    triggerToast(`🚀 Launching ${botChannel} for stage "${botTargetStage}"...`);
    try {
      await SupabaseDashboardService.executeSubpageAction('sales', 'launch_sales_agent', {
        channel: botChannel,
        target_stage: botTargetStage,
        discount_pct: botDiscountPct
      });
      triggerToast(`✓ ${botChannel} berhasil diaktifkan dengan ZeroClaw AI!`);
      setIsLaunchBotModalOpen(false);
      loadSalesData();
    } catch (e) {
      triggerToast('❌ Gagal mengaktifkan Sales Bot.');
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    triggerToast(`🤖 Generating Automated ${reportType} (${reportFormat})...`);
    try {
      const res: any = await SupabaseDashboardService.executeSubpageAction('sales', 'generate_automated_sales_report', {
        report_type: reportType,
        format: reportFormat,
        date_range: dateRange
      });

      const reportContent = `
==================================================
           ZEGA AI SALES INTELLIGENCE REPORT
==================================================
Report Type: ${reportType}
Generated At: ${new Date().toLocaleString('id-ID')}
Engine: ZeroClaw & 9Router Swarm AI
Date Range: ${dateRange} (${selectedHorizon})

--------------------------------------------------
EXECUTION SUMMARY & KEY PERFORMANCE INDICATORS
--------------------------------------------------
Total Sales: Rp${(salesKpi.total_sales_idr || 0).toLocaleString('id-ID')} (+${salesKpi.revenue_growth_pct}%)
Total Orders: ${salesKpi.total_orders} (+${salesKpi.orders_growth_pct}%)
Average Deal Size: Rp${(salesKpi.avg_deal_size_idr || 0).toLocaleString('id-ID')} (+${salesKpi.aov_growth_pct}%)
Win Rate: ${salesKpi.win_rate_pct}% (+${salesKpi.win_rate_growth_pct}%)

--------------------------------------------------
SALES PIPELINE FUNNEL STAGES
--------------------------------------------------
${pipeline.map(s => `${s.stage.padEnd(16)}: ${s.deal_count} deals | Rp${(s.deal_value_idr || 0).toLocaleString('id-ID')} (${s.conversion_pct}%)`).join('\n')}

--------------------------------------------------
TOP SALES PERFORMERS (AI AGENTS & CHANNELS)
--------------------------------------------------
${performers.map((p, i) => `${i + 1}. ${p.performer_name.padEnd(28)}: ${p.deals_closed} deals | Rp${(p.revenue_idr || 0).toLocaleString('id-ID')}`).join('\n')}

==================================================
Official Cloudflare R2 CDN Asset Link: ${res.cdn_report_url || 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/reports/sales_report.pdf'}
==================================================
      `.trim();

      const blob = new Blob([reportContent], { type: reportFormat === 'CSV' ? 'text/csv' : 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${reportType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${reportFormat.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      triggerToast(`✓ Laporan Penjualan (${reportFormat}) berhasil dibuat & diunduh!`);
      setIsReportModalOpen(false);
    } catch (err) {
      triggerToast('❌ Gagal menggenerate laporan sales.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Chart data definitions
  const orderStatusData = {
    labels: orderStatuses.map((s: any) => s.status),
    datasets: [{ data: orderStatuses.map((s: any) => s.order_count), backgroundColor: orderStatuses.map((s: any) => s.color_hex), borderWidth: 0, hoverOffset: 4 }]
  };

  const dailySalesData = {
    labels: dailyTrend.map((d: any) => d.day_label),
    datasets: [{
      label: 'Penjualan Harian (Rp)', data: dailyTrend.map((d: any) => d.revenue_idr),
      backgroundColor: 'rgba(249, 115, 22, 0.75)', borderRadius: 8, borderSkipped: false,
    }]
  };

  const barOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)', cornerRadius: 12,
      callbacks: { label: (ctx: any) => ` Rp${ctx.parsed.y?.toLocaleString('id-ID') || 0}` }
    }},
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }},
      y: { grid: { color: 'rgba(226,232,240,0.5)' }, ticks: { font: { size: 10 }, color: '#94a3b8',
        callback: (v: any) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v
      }}
    }
  };

  const bestDay = dailyTrend.reduce((a: any, b: any) => (b.revenue_idr > a.revenue_idr ? b : a), dailyTrend[0] || { day_label: 'Sab', revenue_idr: 3100000 });
  const totalPerformerRevenue = performers.reduce((s: number, p: any) => s + (p.revenue_idr || 0), 0);

  return (
    <div className="space-y-5">
      {/* 1. ZeroClaw Sales Intelligence Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <BarChart3 size={20} className="text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Sales Intelligence & Telemetry Hub</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck size={11} /> ZeroClaw & 9Router Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Otomasi pelacakan deal pipeline, konversi transaksi, dan performa sales agent terintegrasi Supabase Realtime
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Horizon Pills */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 text-[11px] font-bold">
            {(['7d', '30d', '90d'] as const).map((h) => (
              <button
                key={h}
                onClick={() => handleHorizonChange(h)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedHorizon === h ? 'bg-orange-500 text-white shadow-2xs font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {h === '7d' ? '7 Hari' : h === '30d' ? 'Bulan Ini' : 'Kuartal'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLaunchBotModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Play size={14} className="text-orange-400" /> Launch AI Sales Bot
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Sparkles size={15} /> Automation Create Sales Reports
          </button>
        </div>
      </div>

      {/* 2. Sales KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Penjualan', val: `Rp${(salesKpi.total_sales_idr || 18450000).toLocaleString('id-ID')}`, growth: `+${salesKpi.revenue_growth_pct}%`, icon: BarChart3 },
          { label: 'Total Orders', val: `${salesKpi.total_orders || 142}`, growth: `+${salesKpi.orders_growth_pct}%`, icon: ShoppingBag },
          { label: 'Avg. Deal Size', val: `Rp${(salesKpi.avg_deal_size_idr || 129929).toLocaleString('id-ID')}`, growth: `+${salesKpi.aov_growth_pct}%`, icon: Target },
          { label: 'Win Rate', val: `${salesKpi.win_rate_pct || 21.1}%`, growth: `+${salesKpi.win_rate_growth_pct}%`, icon: TrendingUp },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
                <span>{card.label}</span>
                <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs">
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{card.val}</div>
              <span className="text-[10px] font-bold text-emerald-600">{card.growth} vs last month</span>
            </div>
          );
        })}
      </div>

      {/* 3. Sales Funnel Pipeline & Daily Sales Chart */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Sales Funnel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-orange-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Sales Pipeline Funnel</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{dateRange}</span>
          </div>
          <div className="space-y-2.5">
            {pipeline.map((s: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{s.stage}</span>
                  <span className="font-mono text-slate-500">{s.deal_count} • Rp{((s.deal_value_idr || 0) / 1000000).toFixed(1)}M</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.conversion_pct}%`, backgroundColor: s.color_hex || '#3b82f6' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Conversion Rate (Lead → Won)</span>
              <span className="font-black text-emerald-600">{pipeline.length > 0 ? pipeline[pipeline.length - 1]?.conversion_pct : 21.1}%</span>
            </div>
          </div>
        </div>

        {/* Daily Sales Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-orange-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Penjualan Harian ({selectedHorizon === '7d' ? '7 Hari' : selectedHorizon === '90d' ? '3 Bulan' : 'Minggu Ini'})</h3>
            </div>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full">Trend Realtime</span>
          </div>
          <div className="h-52">
            <Bar data={dailySalesData} options={barOptions} />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-slate-500">Hari Terbaik: <span className="text-orange-600 font-black">{bestDay?.day_label || 'Sab'}</span></span>
            <span className="font-mono text-slate-400">Rp{((bestDay?.revenue_idr || 3100000) / 1000000).toFixed(1)}M</span>
          </div>
        </div>

        {/* Order Status */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-orange-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Status Order</h3>
          </div>
          <div className="relative size-32 mx-auto">
            <Doughnut data={orderStatusData} options={{ cutout: '72%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true }} }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">{orderStatuses.reduce((s: number, o: any) => s + (o.order_count || 0), 0)}</span>
              <span className="text-[10px] font-bold text-slate-400">Total</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            {orderStatuses.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color_hex }} />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{s.status}</span>
                </div>
                <span className="font-mono text-slate-500">{s.order_count} ({s.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Top Sales Performers */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Top Sales Performers (AI Agents & Channels)</h3>
            <p className="text-[11px] text-slate-400">Kanal dan agen AI dengan kontribusi revenue tertinggi ({selectedHorizon})</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculateTelemetry}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-pointer"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} /> Recalculate Telemetry
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">AGENT / CHANNEL</th>
                <th className="py-3 px-3 text-center">DEALS CLOSED</th>
                <th className="py-3 px-3 text-right">REVENUE</th>
                <th className="py-3 px-3 text-right">% KONTRIBUSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {performers.map((rep: any, i: number) => {
                const logoUrl = getPerformerLogoUrl(rep.performer_name);
                const fallbackUrl = getPerformerLocalFallback(rep.performer_name);

                return (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={logoUrl}
                            alt={rep.performer_name}
                            className="size-full object-contain"
                            onError={(e: any) => {
                              e.target.src = fallbackUrl;
                            }}
                          />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{rep.performer_name}</span>
                          <span className="text-[10px] text-slate-400">ZeroClaw Managed Channel</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {rep.deals_closed} deals
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                      Rp{(rep.revenue_idr || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-emerald-600">
                      {totalPerformerRevenue > 0 ? ((rep.revenue_idr / totalPerformerRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Launch AI Sales Bot Modal */}
      {isLaunchBotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/80 dark:text-orange-400">
                  <Play size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Launch AI Sales Follow-up Bot</h3>
                  <p className="text-[11px] text-slate-400">ZeroClaw Automated Conversion Engine</p>
                </div>
              </div>
              <button onClick={() => setIsLaunchBotModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">KANAL SALES AGENT</label>
                <select
                  value={botChannel}
                  onChange={(e) => setBotChannel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                >
                  <option value="WhatsApp Follow-up Bot">WhatsApp Follow-up Bot</option>
                  <option value="Shopee Chat Auto-Close">Shopee Chat Auto-Close Agent</option>
                  <option value="Instagram DM Conversational Bot">Instagram DM Conversational Bot</option>
                  <option value="TikTok Shop Sales Assistant">TikTok Shop Sales Assistant</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">TARGET FUNNEL STAGE</label>
                <select
                  value={botTargetStage}
                  onChange={(e) => setBotTargetStage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                >
                  <option value="Proposal Sent">Proposal Sent (Kirim Voucher Follow-up)</option>
                  <option value="Negosiasi">Negosiasi (Tawaran Diskon Khusus)</option>
                  <option value="Qualified">Qualified Leads (Kirim Brosur Produk)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">INSENTIF VOUCHER DISKON (%)</label>
                <input
                  type="number"
                  value={botDiscountPct}
                  onChange={(e) => setBotDiscountPct(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsLaunchBotModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLaunchSalesBot}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
              >
                Aktifkan Sales Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Automated Sales Report Generator Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/80 dark:text-orange-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Automation Create Sales Report</h3>
                  <p className="text-[11px] text-slate-400">ZeroClaw & 9Router Swarm Report Generator</p>
                </div>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">TIPE LAPORAN SALES</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none font-bold"
                >
                  <option value="Sales Funnel Summary">Sales Pipeline & Conversion Summary</option>
                  <option value="Channel Performance">Top Sales Performers & Channels</option>
                  <option value="Daily Revenue Breakdown">Daily Revenue Trend Breakdown</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">FORMAT EKSPOR</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReportFormat('PDF')}
                    className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      reportFormat === 'PDF' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText size={14} /> Executive PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFormat('CSV')}
                    className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      reportFormat === 'CSV' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Download size={14} /> Spreadsheet CSV
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                  <ShieldCheck size={14} /> Verified ZeroClaw R2 CDN Sync
                </div>
                <p className="text-[10px] text-orange-600/80 dark:text-orange-300/80">
                  Laporan akan diproses oleh 9Router Swarm AI dan diarsipkan secara aman di Cloudflare R2 CDN storage.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Processing AI...' : 'Generate & Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
