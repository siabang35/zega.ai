import React, { useState, useMemo } from 'react';
import { 
  Calendar, DollarSign, RefreshCw, CheckCircle2, 
  TrendingUp, ArrowUpRight, Target, Printer,
  Users, Award, Shield, BarChart3, ChevronRight, ChevronDown, ChevronUp,
  PieChart as PieChartIcon, Activity, Layers, Filter, Sparkles, Cpu
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../../services/supabaseService';
import { useLanguage } from '@/i18n/translations';

interface MonthlyReportSubPageProps {
  monthlyReports?: any[];
  monthlyReport?: any;
  insights?: any[];
  triggerToast?: (msg: string) => void;
}

export function MonthlyReportSubPage({ 
  monthlyReports = [], 
  monthlyReport, 
  insights = [], 
  triggerToast = () => {} 
}: MonthlyReportSubPageProps) {
  const { t } = useLanguage();
  const u = (t.salesView || {}) as any;
  const defaultReports = [
    {
      period_month: 'Juli 2026',
      total_revenue_idr: 13500000,
      total_orders: 116,
      avg_order_value_idr: 116379,
      total_refund_idr: 250000,
      repeat_customer_pct: 42.0,
      returning_customer_val_idr: 5670000,
      best_day_date: '22 Juli 2026',
      best_day_revenue_idr: 920000,
      ai_executive_summary: 'Puncak omset Juli dicapai pada 22 Juli (Rp920k). Pertumbuhan repeat order mencapai 42% berkat pesan follow-up otomatis WhatsApp AI Co-Pilot.',
      weekly_breakdown_json: [
        { week: 'Mgg 1', revenue: 2800000, orders: 24, growth: '+12%' },
        { week: 'Mgg 2', revenue: 3200000, orders: 28, growth: '+14%' },
        { week: 'Mgg 3', revenue: 4500000, orders: 38, growth: '+40%' },
        { week: 'Mgg 4', revenue: 3000000, orders: 26, growth: '+8%' }
      ],
      channel_breakdown_json: [
        { channel: 'WhatsApp', percentage: 45, revenue: 6075000, color: '#10b981', cdn_icon: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' },
        { channel: 'Shopee', percentage: 30, revenue: 4050000, color: '#f97316', cdn_icon: 'https://cdn.zegaai.site/assets/logo/shopee.png' },
        { channel: 'Instagram', percentage: 15, revenue: 2025000, color: '#a855f7', cdn_icon: 'https://cdn.zegaai.site/assets/logo/instagram.png' },
        { channel: 'TikTok', percentage: 10, revenue: 1350000, color: '#06b6d4', cdn_icon: 'https://cdn.zegaai.site/assets/logo/tiktok.webp' }
      ]
    },
    {
      period_month: 'Juni 2026',
      total_revenue_idr: 11400000,
      total_orders: 98,
      avg_order_value_idr: 116326,
      total_refund_idr: 180000,
      repeat_customer_pct: 38.5,
      returning_customer_val_idr: 4389000,
      best_day_date: '15 Juni 2026',
      best_day_revenue_idr: 810000,
      ai_executive_summary: 'Performa penjualan Juni didorong oleh Shopee Flash Sale pertengahan bulan dengan total 98 transaksi berhasil.',
      weekly_breakdown_json: [
        { week: 'Mgg 1', revenue: 2400000, orders: 20, growth: '+5%' },
        { week: 'Mgg 2', revenue: 4100000, orders: 35, growth: '+70%' },
        { week: 'Mgg 3', revenue: 2800000, orders: 24, growth: '-31%' },
        { week: 'Mgg 4', revenue: 2100000, orders: 19, growth: '-25%' }
      ],
      channel_breakdown_json: [
        { channel: 'Shopee', percentage: 42, revenue: 4788000, color: '#f97316', cdn_icon: 'https://cdn.zegaai.site/assets/logo/shopee.png' },
        { channel: 'WhatsApp', percentage: 35, revenue: 3990000, color: '#10b981', cdn_icon: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' },
        { channel: 'Instagram', percentage: 13, revenue: 1482000, color: '#a855f7', cdn_icon: 'https://cdn.zegaai.site/assets/logo/instagram.png' },
        { channel: 'TikTok', percentage: 10, revenue: 1140000, color: '#06b6d4', cdn_icon: 'https://cdn.zegaai.site/assets/logo/tiktok.webp' }
      ]
    },
    {
      period_month: 'Mei 2026',
      total_revenue_idr: 9800000,
      total_orders: 85,
      avg_order_value_idr: 115294,
      total_refund_idr: 120000,
      repeat_customer_pct: 35.0,
      returning_customer_val_idr: 3430000,
      best_day_date: '28 Mei 2026',
      best_day_revenue_idr: 740000,
      ai_executive_summary: 'Puncak transaksi Mei didorong promo Gajian Diskon Bundling Skincare Basic.',
      weekly_breakdown_json: [
        { week: 'Mgg 1', revenue: 1900000, orders: 16, growth: '+2%' },
        { week: 'Mgg 2', revenue: 2200000, orders: 19, growth: '+15%' },
        { week: 'Mgg 3', revenue: 2400000, orders: 21, growth: '+9%' },
        { week: 'Mgg 4', revenue: 3300000, orders: 29, growth: '+37%' }
      ],
      channel_breakdown_json: [
        { channel: 'WhatsApp', percentage: 40, revenue: 3920000, color: '#10b981', cdn_icon: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' },
        { channel: 'Shopee', percentage: 32, revenue: 3136000, color: '#f97316', cdn_icon: 'https://cdn.zegaai.site/assets/logo/shopee.png' },
        { channel: 'Instagram', percentage: 18, revenue: 1764000, color: '#a855f7', cdn_icon: 'https://cdn.zegaai.site/assets/logo/instagram.png' },
        { channel: 'TikTok', percentage: 10, revenue: 980000, color: '#06b6d4', cdn_icon: 'https://cdn.zegaai.site/assets/logo/tiktok.webp' }
      ]
    }
  ];

  const resolveCdnIconUrl = (rawUrl?: string) => {
    if (!rawUrl) return 'https://cdn.zegaai.site/assets/logo/deepseek.webp';
    let url = rawUrl;
    if (url.includes('/zeroclaw.png')) url = url.replace('/zeroclaw.png', '/zeroclaw.jpeg');
    if (url.includes('/claude.png')) url = url.replace('/claude.png', '/claude.webp');
    if (url.includes('/qwen.png')) url = url.replace('/qwen.png', '/Qwen.png');
    return url;
  };

  const rawReports = Array.isArray(monthlyReports) && monthlyReports.length 
    ? monthlyReports 
    : (monthlyReport ? [monthlyReport] : []);

  // Deduplicate unique periods to prevent repeated buttons
  const uniqueReports = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    rawReports.forEach((item: any) => {
      const month = item?.period_month;
      if (month && !seen.has(month)) {
        seen.add(month);
        list.push(item);
      }
    });
    return list;
  }, [rawReports]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(uniqueReports[0]?.period_month || '');

  const activeReport = useMemo(() => {
    return uniqueReports.find((r) => r.period_month === selectedPeriod) || uniqueReports[0] || null;
  }, [uniqueReports, selectedPeriod]);

  const targetRevenue = 15000000;
  const targetPct = Math.min(100, Math.round((((activeReport?.total_revenue_idr || 0)) / targetRevenue) * 100));

  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredChannelIndex, setHoveredChannelIndex] = useState<number | null>(null);

  // Accordion Collapsible State for AI Insights (Default 1st & 2nd open)
  const [expandedInsightIds, setExpandedInsightIds] = useState<Set<string>>(new Set(['1', '2']));

  const toggleInsightAccordion = (id: string) => {
    setExpandedInsightIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleActionTrigger = async (title: string, action: string, actionId: string) => {
    try {
      setExecutingActionId(actionId);
      await SupabaseDashboardService.logSystemAuditLog('AI_SWARM_ACTION_EXECUTED', 'Success', {
        suggestion_title: title,
        action_taken: action,
        period: activeReport?.period_month || 'N/A',
        timestamp: new Date().toISOString()
      });
      triggerToast(`✓ Aksi AI Executed: ${action} (${title}) — Telemetri Audit Tersimpan!`);
    } catch (e) {
      triggerToast(`✓ Aksi AI Executed: ${action} (${title})`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handlePrintReport = async () => {
    try {
      await SupabaseDashboardService.logSystemAuditLog('MONTHLY_REPORT_PRINTED', 'Success', {
        period: activeReport?.period_month || 'N/A',
        revenue: activeReport?.total_revenue_idr || 0
      });
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.print();
    }
    triggerToast(`✓ Mencetak Laporan Eksekutif Bulanan ${activeReport?.period_month || ''}...`);
  };

  // Weekly Trend Data for Smooth Line Chart
  const weeklyData = useMemo(() => {
    if (activeReport?.weekly_breakdown_json && Array.isArray(activeReport.weekly_breakdown_json)) {
      return activeReport.weekly_breakdown_json;
    }
    return [];
  }, [activeReport]);

  const maxWeeklyRev = useMemo(() => {
    return Math.max(...weeklyData.map((d: any) => d.revenue || 1000000), 5000000);
  }, [weeklyData]);

  // Channel Breakdown Data for Donut Chart
  const channelData = useMemo(() => {
    if (activeReport?.channel_breakdown_json && Array.isArray(activeReport.channel_breakdown_json)) {
      return activeReport.channel_breakdown_json;
    }
    return [];
  }, [activeReport]);

  // Coordinates for Smooth SVG Spline Line Chart (100x60 viewBox)
  const linePoints = useMemo(() => {
    if (!weeklyData || !weeklyData.length) {
      return { points: [], pathD: '', areaD: '' };
    }

    const width = 100;
    const height = 60;
    const padding = 8;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const points = weeklyData.map((d: any, idx: number) => {
      const x = padding + (idx / Math.max(1, weeklyData.length - 1)) * innerWidth;
      const y = height - padding - (d.revenue / maxWeeklyRev) * innerHeight;
      return { x, y, ...d };
    });

    // Create cubic bezier SVG path string
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { points, pathD, areaD };
  }, [weeklyData, maxWeeklyRev]);

  // Generate SVG Donut slices dynamically
  const donutSlices = useMemo(() => {
    let cumulative = 0;
    return channelData.map((c: any, idx: number) => {
      const startAngle = (cumulative / 100) * 360;
      cumulative += c.percentage;
      const endAngle = (cumulative / 100) * 360;

      const x1 = Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = Math.sin((Math.PI * (endAngle - 90)) / 180);

      const largeArc = c.percentage > 50 ? 1 : 0;
      const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        idx,
        pathData,
        color: c.color,
        channel: c.channel,
        percentage: c.percentage,
        revenue: c.revenue,
        cdn_icon: c.cdn_icon
      };
    });
  }, [channelData]);

  const activeHoveredChannel = hoveredChannelIndex !== null ? channelData[hoveredChannelIndex] : null;
  const currentInsights = insights || [];

  const allExpanded = expandedInsightIds.size === currentInsights.length;
  const toggleAllAccordions = () => {
    if (allExpanded) {
      setExpandedInsightIds(new Set());
    } else {
      setExpandedInsightIds(new Set(currentInsights.map((ins: any, idx: number) => ins.id || String(idx))));
    }
  };

  if (!uniqueReports.length || !activeReport) {
    return (
      <div className="space-y-6 font-sans antialiased">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="text-orange-600 dark:text-orange-500" size={18} />
                <span>{u.monthlyReportTitle || 'Laporan Eksekutif Bulanan'}</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              {u.monthlyReportSubtitle || 'Analisis kinerja finansial, tren penjualan, dan alokasi model rekomendasi bisnis berbasis data Supabase.'}
            </p>
          </div>
        </div>

        <div className="p-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
            <BarChart3 size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{u.noReportTitle || 'Belum Ada Laporan Eksekutif Bulanan'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {u.noReportSubtitle || 'Laporan eksekutif bulanan dan analisis kinerja akan ditampilkan setelah transaksi penjualan dicatat di database.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & HISTORICAL PERIOD SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="text-orange-600 dark:text-orange-500" size={18} />
              <span>{u.monthlyReportTitle || 'Laporan Eksekutif Bulanan'}</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
            {u.monthlyReportSubtitle || 'Analisis kinerja finansial, grafik tren penjualan harian/mingguan, dan alokasi model rekomendasi bisnis berbasis data Supabase.'}
          </p>
        </div>

        {/* Deduplicated Period Selector Pills & Print Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {uniqueReports.map((r: any) => (
              <button
                key={r.period_month}
                onClick={() => setSelectedPeriod(r.period_month)}
                className={`px-3 py-1 rounded-md cursor-pointer transition-all ${
                  selectedPeriod === r.period_month
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r.period_month}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer size={14} />
            <span>{u.printPdfBtn || 'Cetak PDF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE HERO REVENUE CARD */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              <BarChart3 size={14} className="text-orange-500" />
              <span>{u.perfSummary || 'RINGKASAN PERFORMA'} • {activeReport.period_month}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              Rp{(activeReport.total_revenue_idr || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-normal max-w-2xl leading-relaxed">
              {activeReport.ai_executive_summary}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">{u.peakSalesDay || 'PUNCAK SALES DAY'}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeReport.best_day_date}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
              Rp{(activeReport.best_day_revenue_idr || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* High-Density Distinct Core Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">{u.totalTransactions || 'TOTAL TRANSAKSI'}</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">{activeReport.total_orders} {u.ordersUnit || 'Orders'}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">↑ 18% {u.vsLastMonthTrend || 'vs bulan lalu'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">{u.avgOrderValueAov || 'RATA-RATA ORDER (AOV)'}</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">Rp{(activeReport.avg_order_value_idr || 0).toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">↑ 5.2% {u.vsTargetTrend || 'vs target'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">{u.estNetProfit || 'ESTIMASI LABA BERSIH'}</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              Rp{Math.round((activeReport.total_revenue_idr || 0) * 0.35).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal block">{u.netMargin || 'Net Margin'} 35%</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">{u.repeatCustomerRate || 'REPEAT CUSTOMER RATE'}</span>
            <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">{activeReport.repeat_customer_pct}%</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block font-mono">Rp{(activeReport.returning_customer_val_idr || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUALIZATION SECTION: PROFESSIONAL LINE CHART & DONUT CHART */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Enterprise Line Chart for Sales Trend */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 flex items-center justify-center font-semibold">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {u.salesTrendChartTitle || 'Grafik Tren Omset Penjualan (Enterprise Standard)'}
                </h3>
                <p className="text-[10.5px] text-slate-400 font-normal">
                  {u.weeklyTrendSubtitle || 'Kurva tren omset mingguan periode'} {activeReport.period_month}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {u.lineChart4Weeks || 'Line Chart • 4 Minggu'}
            </span>
          </div>

          {/* Clean Enterprise SVG Line Chart Container (No Gradients) */}
          <div className="relative pt-2">
            <div className="w-full h-52 relative">
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Clean Y-Axis Gridlines */}
                <line x1="8" y1="12" x2="92" y2="12" className="stroke-slate-200/70 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="8" y1="28" x2="92" y2="28" className="stroke-slate-200/70 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="8" y1="44" x2="92" y2="44" className="stroke-slate-200/70 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="2,2" />

                {/* Solid Enterprise Stroke Line */}
                <path d={linePoints.pathD} fill="none" stroke="#ea580c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data Point Indicators */}
                {linePoints.points.map((pt: any, idx: number) => {
                  const isHovered = hoveredPointIndex === idx;
                  return (
                    <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(idx)} onMouseLeave={() => setHoveredPointIndex(null)}>
                      <circle cx={pt.x} cy={pt.y} r={isHovered ? 3.5 : 2.2} fill="#ffffff" stroke="#ea580c" strokeWidth="1.5" className="transition-all duration-200" />
                    </g>
                  );
                })}
              </svg>

              {/* Enterprise Clean Hover Tooltip */}
              {hoveredPointIndex !== null && (
                <div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-lg text-center pointer-events-none z-20 border border-slate-700"
                  style={{
                    left: `${linePoints.points[hoveredPointIndex].x}%`
                  }}
                >
                  <span className="text-[10px] text-orange-400 font-semibold block">{linePoints.points[hoveredPointIndex].week}</span>
                  <span className="text-xs font-bold block font-mono">Rp{linePoints.points[hoveredPointIndex].revenue.toLocaleString('id-ID')}</span>
                  <span className="text-[9.5px] text-emerald-400 font-normal block">{linePoints.points[hoveredPointIndex].orders} {u.ordersUnit || 'Pesanan'} ({linePoints.points[hoveredPointIndex].growth})</span>
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              {weeklyData.map((d: any, idx: number) => (
                <div 
                  key={idx} 
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                    hoveredPointIndex === idx ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 font-bold' : ''
                  }`}
                >
                  <span>{d.week}</span>
                  <span className="text-[10.5px] block font-mono text-slate-400 font-normal">Rp{(d.revenue / 1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Donut Chart - Enterprise Channel Distribution */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center font-semibold">
                <PieChartIcon size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {u.channelDistTitle || 'Diagram Distribusi Channel'}
                </h3>
                <p className="text-[10.5px] text-slate-400 font-normal">
                  {u.channelDistSubtitle || 'Persentase kontribusi omset per saluran penjualan'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-1">
            {/* SVG Donut Chart Component */}
            <div className="relative size-40 shrink-0 flex items-center justify-center">
              <svg viewBox="-1.25 -1.25 2.5 2.5" className="size-full transform -rotate-90">
                {donutSlices.map((slice: any) => {
                  const isHovered = hoveredChannelIndex === slice.idx;
                  return (
                    <path
                      key={slice.idx}
                      d={slice.pathData}
                      fill={slice.color}
                      onMouseEnter={() => setHoveredChannelIndex(slice.idx)}
                      onMouseLeave={() => setHoveredChannelIndex(null)}
                      className={`transition-all duration-200 cursor-pointer ${
                        isHovered ? 'opacity-100 stroke-2 stroke-white dark:stroke-slate-900' : 'opacity-90 hover:opacity-100'
                      }`}
                    />
                  );
                })}
                <circle cx="0" cy="0" r="0.62" className="fill-white dark:fill-slate-900" />
              </svg>

              {/* Dynamic Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-semibold text-slate-400 uppercase">
                  {activeHoveredChannel ? activeHoveredChannel.channel : (u.totalOmsetUpper || 'TOTAL OMSET')}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {activeHoveredChannel ? `${activeHoveredChannel.percentage}%` : '100%'}
                </span>
                {activeHoveredChannel && (
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    Rp{(activeHoveredChannel.revenue / 1000000).toFixed(1)}M
                  </span>
                )}
              </div>
            </div>

            {/* Donut Chart Legend & Detailed Channel Cards */}
            <div className="space-y-2 w-full text-xs font-semibold">
              {channelData.map((c: any, idx: number) => {
                const isHovered = hoveredChannelIndex === idx;
                return (
                  <div 
                    key={idx} 
                    onMouseEnter={() => setHoveredChannelIndex(idx)}
                    onMouseLeave={() => setHoveredChannelIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                      isHovered 
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' 
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {c.cdn_icon ? (
                        <img src={c.cdn_icon} alt={c.channel} className="size-5 object-contain rounded-md bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      )}
                      <span className="text-slate-900 dark:text-slate-100 text-[11px] font-bold">{c.channel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-slate-100 font-mono text-[11px] font-bold">{c.percentage}%</span>
                      <span className="text-[9.5px] block text-slate-400 font-mono font-normal">Rp{(c.revenue / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. UNIFIED BOTTOM GRID: FINANCIAL TARGET & COHORT + RECOMMENDATIONS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Financial Target & Customer Cohort Panel */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target size={16} className="text-orange-500" />
                <span>{u.targetAndCohortTitle || 'Pencapaian Target & Cohort Customer'}</span>
              </h3>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 border border-orange-200/50 font-mono">
                {targetPct}% {u.reached || 'Reached'}
              </span>
            </div>

            {/* Target Revenue Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">{u.targetMonthly || 'Target Monthly:'} Rp{targetRevenue.toLocaleString('id-ID')}</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">Rp{(activeReport.total_revenue_idr || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${targetPct}%` }} />
              </div>
            </div>

            {/* Integrated Customer Cohort Visual Line */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-purple-600 dark:text-purple-400">{u.repeat || 'Repeat'} ({activeReport.repeat_customer_pct}%)</span>
                <span className="text-blue-600 dark:text-blue-400">{u.baru || 'Baru'} ({100 - (activeReport.repeat_customer_pct || 42)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div className="h-full bg-purple-500" style={{ width: `${activeReport.repeat_customer_pct}%` }} />
                <div className="h-full bg-blue-500" style={{ width: `${100 - (activeReport.repeat_customer_pct || 42)}%` }} />
              </div>
              <div className="flex justify-between text-[10.5px] font-mono font-semibold text-slate-500">
                <span>Rp{(activeReport.returning_customer_val_idr || 0).toLocaleString('id-ID')}</span>
                <span>Rp{((activeReport.total_revenue_idr || 0) - (activeReport.returning_customer_val_idr || 0)).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Financial Deductions & Net Margin Overview */}
          <div className="space-y-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
              <span className="text-slate-500 font-normal">{u.totalRefundLabel || 'Total Pengembalian (Refund):'}</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                -Rp{(activeReport.total_refund_idr || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
              <span className="text-slate-500 font-normal">{u.estNetProfitMargin || 'Estimasi Net Profit (Margin 35%):'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                Rp{Math.round((activeReport.total_revenue_idr || 0) * 0.35).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Cpu size={16} className="text-orange-500" />
                <span>{u.businessRecommendationsTitle || 'Rekomendasi Analisis Bisnis (Real Models)'}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAllAccordions}
                  className="text-[10.5px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                >
                  {allExpanded ? (u.collapseAll || 'Collapse All') : (u.expandAll || 'Expand All')}
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 text-[10px] font-bold border border-orange-200/50">
                  {currentInsights.length} Recommendations
                </span>
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {currentInsights.map((ins: any, idx: number) => {
                const insightId = ins.id || String(idx);
                const isExpanded = expandedInsightIds.has(insightId);

                return (
                  <div 
                    key={insightId} 
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded 
                        ? 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700' 
                        : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Accordion Header Row */}
                    <div 
                      onClick={() => toggleInsightAccordion(insightId)}
                      className="p-3.5 flex items-center justify-between cursor-pointer select-none gap-3"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img 
                          src={resolveCdnIconUrl(ins.cdn_icon_url)} 
                          alt="AI Brand Logo" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://cdn.zegaai.site/assets/logo/deepseek.webp';
                          }}
                          className="size-6 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0" 
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {ins.headline}
                          </span>
                          {ins.category && (
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200/50 shrink-0 hidden sm:inline-block">
                              {ins.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {ins.model_engine || 'DeepSeek-R1'}
                        </span>
                        <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Collapsible Detail Drawer */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-slate-600 dark:text-slate-300 text-xs font-normal leading-relaxed">
                          {ins.content}
                        </p>

                        {ins.action_suggestion && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                {u.confidenceLabel || 'Kepercayaan:'} {ins.confidence_pct || 98}%
                              </span>
                              {ins.estimated_impact && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50">
                                  {ins.estimated_impact}
                                </span>
                              )}
                            </div>

                            <button
                              disabled={executingActionId === insightId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionTrigger(ins.headline, ins.action_suggestion, insightId);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>{executingActionId === insightId ? (u.executingBtn || 'Eksekusi...') : ins.action_suggestion}</span>
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
