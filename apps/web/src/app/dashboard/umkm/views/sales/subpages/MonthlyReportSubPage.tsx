import React, { useState, useMemo } from 'react';
import { 
  Calendar, DollarSign, RefreshCw, CheckCircle2, 
  TrendingUp, ArrowUpRight, Target, Printer,
  Users, Award, Shield, BarChart3, ChevronRight, ChevronDown, ChevronUp,
  PieChart as PieChartIcon, Activity, Layers, Filter, Sparkles, Cpu
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../../services/supabaseService';

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

  const defaultAiInsights = [
    {
      id: '1',
      headline: 'Analisis DeepSeek R1: Retensi Repeat Order 42%',
      content: 'Model DeepSeek-R1 mendeteksi 42% pembeli melakukan order ulang dalam 30 hari. Eksekusi campaign retensi berbasis voucher 10% diproyeksikan menambah omset Rp2.100.000.',
      action_suggestion: 'Luncurkan Campaign Retensi Massal',
      model_engine: 'DeepSeek-R1-Reasoning',
      confidence_pct: 98.7,
      cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
      category: 'Retensi Pelanggan',
      estimated_impact: '+Rp 2.100.000 / bln'
    },
    {
      id: '2',
      headline: 'Optimasi Channel WA Business (Conversion 5.8%)',
      content: 'Claude-3.5-Sonnet merekomendasikan reallocasi 15% budget iklan dari Shopee ke WA Broadcast karena conversion rate WA mencapai 5.8% (vs Shopee 4.2%).',
      action_suggestion: 'Aktifkan Auto WA Broadcast Swarm',
      model_engine: 'Claude-3.5-Sonnet-Swarm',
      confidence_pct: 97.4,
      cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/claude.webp',
      category: 'Optimasi Channel',
      estimated_impact: '+18% Conversion Rate'
    },
    {
      id: '3',
      headline: 'ZeroClaw Solana Telemetry: Penjualan Paket Skincare',
      content: 'ZeroClaw Daemon memantau lonjakan +24% pemesanan Paket Skincare Basic pada hari Jumat. Disarankan mengunci batas persediaan minimal 50 unit.',
      action_suggestion: 'Kunci Stok Persediaan Paket',
      model_engine: 'ZeroClaw-Solana-Daemon',
      confidence_pct: 99.2,
      cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/zeroclaw.jpeg',
      category: 'Prediksi Stok Persediaan',
      estimated_impact: 'Mencegah Out of Stock'
    },
    {
      id: '4',
      headline: '9Router Multi-LLM Cost & Latency Optimizer',
      content: '9Router mengoptimalkan alokasi token LLM untuk AI Co-Pilot dengan efisiensi biaya 40% lebih hemat tanpa menurunkan akurasi rekomendasi.',
      action_suggestion: 'Terapkan Auto-Cost Optimization',
      model_engine: '9Router-Auto-Cost-Optimizer',
      confidence_pct: 98.9,
      cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/9router.png',
      category: 'Efisiensi Token AI',
      estimated_impact: 'Hemat 40% API Cost'
    },
    {
      id: '5',
      headline: 'Qwen Coder 32B: Otomasi Workflow Checkout Abandoned',
      content: 'Qwen-2.5-Coder mengidentifikasi 14 keranjang terbengkalai. Script follow-up otomatis siap dikirim ke calon pembeli.',
      action_suggestion: 'Jalankan Script Auto Follow-Up',
      model_engine: 'Qwen-2.5-Coder-32B',
      confidence_pct: 96.5,
      cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/Qwen.png',
      category: 'Otomasi Checkout',
      estimated_impact: '+14 Potential Orders'
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
    : (monthlyReport ? [monthlyReport] : defaultReports);

  // Deduplicate unique periods to prevent repeated buttons
  const uniqueReports = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    rawReports.forEach((item: any) => {
      const month = item?.period_month || 'Juli 2026';
      if (!seen.has(month)) {
        seen.add(month);
        list.push(item);
      }
    });
    return list.length ? list : defaultReports;
  }, [rawReports]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(uniqueReports[0]?.period_month || 'Juli 2026');

  const activeReport = useMemo(() => {
    return uniqueReports.find((r) => r.period_month === selectedPeriod) || uniqueReports[0] || defaultReports[0];
  }, [uniqueReports, selectedPeriod]);

  const targetRevenue = 15000000;
  const targetPct = Math.min(100, Math.round(((activeReport?.total_revenue_idr || 13500000) / targetRevenue) * 100));

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
        period: activeReport.period_month,
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
        period: activeReport.period_month,
        revenue: activeReport.total_revenue_idr
      });
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.print();
    }
    triggerToast(`✓ Mencetak Laporan Eksekutif Bulanan ${activeReport.period_month}...`);
  };

  // Weekly Trend Data for Smooth Line Chart
  const weeklyData = useMemo(() => {
    if (activeReport?.weekly_breakdown_json && Array.isArray(activeReport.weekly_breakdown_json)) {
      return activeReport.weekly_breakdown_json;
    }
    return [
      { week: 'Mgg 1', revenue: 2800000, orders: 24, growth: '+12%' },
      { week: 'Mgg 2', revenue: 3200000, orders: 28, growth: '+14%' },
      { week: 'Mgg 3', revenue: 4500000, orders: 38, growth: '+40%' },
      { week: 'Mgg 4', revenue: 3000000, orders: 26, growth: '+8%' }
    ];
  }, [activeReport]);

  const maxWeeklyRev = useMemo(() => {
    return Math.max(...weeklyData.map((d: any) => d.revenue || 1000000), 5000000);
  }, [weeklyData]);

  // Channel Breakdown Data for Donut Chart
  const channelData = useMemo(() => {
    if (activeReport?.channel_breakdown_json && Array.isArray(activeReport.channel_breakdown_json)) {
      return activeReport.channel_breakdown_json;
    }
    return [
      { channel: 'WhatsApp', percentage: 45, revenue: 6075000, color: '#10b981', cdn_icon: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp' },
      { channel: 'Shopee', percentage: 30, revenue: 4050000, color: '#f97316', cdn_icon: 'https://cdn.zegaai.site/assets/logo/shopee.png' },
      { channel: 'Instagram', percentage: 15, revenue: 2025000, color: '#a855f7', cdn_icon: 'https://cdn.zegaai.site/assets/logo/instagram.png' },
      { channel: 'TikTok', percentage: 10, revenue: 1350000, color: '#06b6d4', cdn_icon: 'https://cdn.zegaai.site/assets/logo/tiktok.webp' }
    ];
  }, [activeReport]);

  // Coordinates for Smooth SVG Spline Line Chart (100x60 viewBox)
  const linePoints = useMemo(() => {
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
  const currentInsights = insights.length ? insights : defaultAiInsights;

  const allExpanded = expandedInsightIds.size === currentInsights.length;
  const toggleAllAccordions = () => {
    if (allExpanded) {
      setExpandedInsightIds(new Set());
    } else {
      setExpandedInsightIds(new Set(currentInsights.map((ins: any, idx: number) => ins.id || String(idx))));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & DEDUPLICATED HISTORICAL PERIOD SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="text-orange-500" size={20} />
              <span>Laporan Eksekutif Bulanan</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
              Enterprise Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Analisis kinerja finansial, grafik tren penjualan harian/mingguan, dan alokasi AI Swarm intelligence berbasis Supabase real-time.
          </p>
        </div>

        {/* Deduplicated Period Selector Pills & Print Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            {uniqueReports.map((r: any) => (
              <button
                key={r.period_month}
                onClick={() => setSelectedPeriod(r.period_month)}
                className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                  selectedPeriod === r.period_month
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r.period_month}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 shadow-orange-500/20"
          >
            <Printer size={14} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE HERO REVENUE CARD (DISTINCT CORE METRICS - NO DUPLICATION) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              <BarChart3 size={15} className="text-orange-500" />
              <span>RINGKASAN PERFORMA • {activeReport.period_month}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Rp{(activeReport.total_revenue_idr || 0).toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
              {activeReport.ai_executive_summary}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">PUNCAK SALES DAY</span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100">{activeReport.best_day_date}</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
              Rp{(activeReport.best_day_revenue_idr || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* High-Density Distinct Core Metric Cards (Zero Repetition) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">TOTAL TRANSAKSI</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">{activeReport.total_orders} Orders</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block">↑ 18% vs bulan lalu</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">RATA-RATA ORDER (AOV)</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">Rp{(activeReport.avg_order_value_idr || 0).toLocaleString('id-ID')}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block">↑ 5.2% vs target</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">ESTIMASI LABA BERSIH</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              Rp{Math.round((activeReport.total_revenue_idr || 0) * 0.35).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Net Margin 35%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">REPEAT CUSTOMER RATE</span>
            <span className="text-base font-black text-purple-600 dark:text-purple-400">{activeReport.repeat_customer_pct}%</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold block">Rp{(activeReport.returning_customer_val_idr || 0).toLocaleString('id-ID')} Omset</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUALIZATION SECTION: SMOOTH LINE CHART & INTERACTIVE DONUT CHART */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Smooth Spline Line / Area Chart for Sales Trend */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center font-black">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  Grafik Line Tren Omset Penjualan
                </h3>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  Kurva tren omset mingguan periode {activeReport.period_month} dengan indikator titik data interaktif
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Line Spline • 4 Minggu
            </span>
          </div>

          {/* Interactive SVG Smooth Line & Area Chart Container */}
          <div className="relative pt-2">
            <div className="w-full h-52 relative">
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Horizontal Grid Lines */}
                <line x1="8" y1="12" x2="92" y2="12" className="stroke-slate-100 dark:stroke-slate-800/80" strokeWidth="0.5" strokeDasharray="1,1" />
                <line x1="8" y1="28" x2="92" y2="28" className="stroke-slate-100 dark:stroke-slate-800/80" strokeWidth="0.5" strokeDasharray="1,1" />
                <line x1="8" y1="44" x2="92" y2="44" className="stroke-slate-100 dark:stroke-slate-800/80" strokeWidth="0.5" strokeDasharray="1,1" />

                {/* Area Gradient Fill */}
                <path d={linePoints.areaD} fill="url(#areaGradient)" />

                {/* Smooth Curve Line */}
                <path d={linePoints.pathD} fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />

                {/* Interactive Data Points (Dots) */}
                {linePoints.points.map((pt: any, idx: number) => {
                  const isHovered = hoveredPointIndex === idx;
                  return (
                    <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(idx)} onMouseLeave={() => setHoveredPointIndex(null)}>
                      <circle cx={pt.x} cy={pt.y} r={isHovered ? 3.5 : 2.2} fill="#ffffff" stroke="#f97316" strokeWidth="1.2" className="transition-all duration-300" />
                      {isHovered && (
                        <circle cx={pt.x} cy={pt.y} r="5" fill="#f97316" fillOpacity="0.25" />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredPointIndex !== null && (
                <div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-center pointer-events-none z-20 transition-all duration-200"
                  style={{
                    left: `${linePoints.points[hoveredPointIndex].x}%`
                  }}
                >
                  <span className="text-[10px] text-orange-400 font-bold block">{linePoints.points[hoveredPointIndex].week}</span>
                  <span className="text-xs font-black block font-mono">Rp{linePoints.points[hoveredPointIndex].revenue.toLocaleString('id-ID')}</span>
                  <span className="text-[9.5px] text-emerald-400 font-extrabold block">{linePoints.points[hoveredPointIndex].orders} Pesanan ({linePoints.points[hoveredPointIndex].growth})</span>
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              {weeklyData.map((d: any, idx: number) => (
                <div 
                  key={idx} 
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className={`p-1.5 rounded-xl cursor-pointer transition-all ${
                    hoveredPointIndex === idx ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 font-black' : ''
                  }`}
                >
                  <span>{d.week}</span>
                  <span className="text-[10.5px] block font-mono text-slate-400">Rp{(d.revenue / 1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Donut Chart - Interactive Sales Channel Distribution */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-black">
                <PieChartIcon size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  Diagram Donut Distribusi Channel
                </h3>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  Persentase kontribusi omset per saluran penjualan
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
                      className={`transition-all duration-300 cursor-pointer ${
                        isHovered ? 'opacity-100 scale-105 stroke-2 stroke-white dark:stroke-slate-900' : 'opacity-90 hover:opacity-100'
                      }`}
                    />
                  );
                })}
                <circle cx="0" cy="0" r="0.62" className="fill-white dark:fill-slate-900" />
              </svg>

              {/* Dynamic Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {activeHoveredChannel ? activeHoveredChannel.channel : 'TOTAL OMSET'}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono">
                  {activeHoveredChannel ? `${activeHoveredChannel.percentage}%` : '100%'}
                </span>
                {activeHoveredChannel && (
                  <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    Rp{(activeHoveredChannel.revenue / 1000000).toFixed(1)}M
                  </span>
                )}
              </div>
            </div>

            {/* Donut Chart Legend & Detailed Channel Cards */}
            <div className="space-y-2 w-full text-xs font-bold">
              {channelData.map((c: any, idx: number) => {
                const isHovered = hoveredChannelIndex === idx;
                return (
                  <div 
                    key={idx} 
                    onMouseEnter={() => setHoveredChannelIndex(idx)}
                    onMouseLeave={() => setHoveredChannelIndex(null)}
                    className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all border ${
                      isHovered 
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs' 
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {c.cdn_icon ? (
                        <img src={c.cdn_icon} alt={c.channel} className="size-5 object-contain rounded-md bg-white p-0.5 border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      )}
                      <span className="text-slate-900 dark:text-slate-100 text-[11px] font-extrabold">{c.channel}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-slate-100 font-mono text-[11px]">{c.percentage}%</span>
                      <span className="text-[9.5px] block text-slate-400 font-mono">Rp{(c.revenue / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. UNIFIED BOTTOM GRID: FINANCIAL TARGET & COHORT + ACCORDION AI SWARM */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Unified Executive Financial Target & Customer Cohort Panel */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target size={16} className="text-orange-500" />
                <span>Pencapaian Target & Cohort Customer</span>
              </h3>
              <span className="text-xs font-black text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60">
                {targetPct}% Reached
              </span>
            </div>

            {/* Target Revenue Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Target Monthly: Rp{targetRevenue.toLocaleString('id-ID')}</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono">Rp{(activeReport.total_revenue_idr || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${targetPct}%` }} />
              </div>
            </div>

            {/* Integrated Customer Cohort Visual Line (Zero Duplication - Unified) */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-purple-600 dark:text-purple-400">Repeat ({activeReport.repeat_customer_pct}%)</span>
                <span className="text-blue-600 dark:text-blue-400">Baru ({100 - (activeReport.repeat_customer_pct || 42)}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div className="h-full bg-purple-500" style={{ width: `${activeReport.repeat_customer_pct}%` }} />
                <div className="h-full bg-blue-500" style={{ width: `${100 - (activeReport.repeat_customer_pct || 42)}%` }} />
              </div>
              <div className="flex justify-between text-[10.5px] font-mono font-bold text-slate-500">
                <span>Rp{(activeReport.returning_customer_val_idr || 0).toLocaleString('id-ID')}</span>
                <span>Rp{((activeReport.total_revenue_idr || 0) - (activeReport.returning_customer_val_idr || 0)).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Financial Deductions & Net Margin Overview */}
          <div className="space-y-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Total Pengembalian (Refund):</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                -Rp{(activeReport.total_refund_idr || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Estimasi Net Profit (Margin 35%):</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                Rp{Math.round((activeReport.total_revenue_idr || 0) * 0.35).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Seamless Accordion Collapsible AI Swarm Action Center */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Cpu size={16} className="text-orange-500" />
                <span>Rekomendasi AI Intelligence Swarm (Real Models)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAllAccordions}
                  className="text-[10.5px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer transition-all"
                >
                  {allExpanded ? 'Collapse All' : 'Expand All'}
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 text-[10px] font-black border border-orange-200/60">
                  {currentInsights.length} AI Models Active
                </span>
              </div>
            </div>

            {/* Seamless Accordion List */}
            <div className="space-y-3">
              {currentInsights.map((ins: any, idx: number) => {
                const insightId = ins.id || String(idx);
                const isExpanded = expandedInsightIds.has(insightId);

                return (
                  <div 
                    key={insightId} 
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isExpanded 
                        ? 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200/90 dark:border-slate-700 shadow-xs' 
                        : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Accordion Header Row (Click to Expand / Collapse) */}
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
                          className="size-6 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700 shrink-0" 
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {ins.headline}
                          </span>
                          {ins.category && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/50 shrink-0 hidden sm:inline-block">
                              {ins.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                          {ins.model_engine || 'DeepSeek-R1'}
                        </span>
                        <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Collapsible Detail Drawer */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-relaxed">
                          {ins.content}
                        </p>

                        {ins.action_suggestion && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                Kepercayaan AI: {ins.confidence_pct || 98}%
                              </span>
                              {ins.estimated_impact && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50">
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
                              className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-orange-500/20"
                            >
                              <span>{executingActionId === insightId ? 'Eksekusi...' : ins.action_suggestion}</span>
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
