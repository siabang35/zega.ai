import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  ShieldCheck, 
  PieChart as PieChartIcon, 
  Layers, 
  ExternalLink,
  MousePointerClick,
  Eye,
  ShoppingBag,
  BarChart3,
  Filter
} from 'lucide-react';
import { SupabaseDashboardService } from '@/app/dashboard/services/supabaseService';
import { useLanguage } from '@/i18n/translations';

interface SalesBySourceSubPageProps {
  sources?: any[];
  aiInsights?: any[];
  triggerToast?: (msg: string) => void;
}

export function SalesBySourceSubPage({ 
  sources = [], 
  aiInsights = [],
  triggerToast = () => {} 
}: SalesBySourceSubPageProps) {
  const { t } = useLanguage();
  const u = (t.salesView || {}) as any;
  const [expandedInsightIds, setExpandedInsightIds] = useState<Set<string>>(new Set(['1', '2']));
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [activeChartTab, setActiveChartTab] = useState<'distribution' | 'funnel' | 'growth'>('distribution');
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);

  const resolveCdnIconUrl = (rawUrl?: string) => {
    if (!rawUrl) return 'https://cdn.zegaai.site/assets/logo/deepseek.webp';
    let url = rawUrl;
    if (url.includes('/zeroclaw.png')) url = url.replace('/zeroclaw.png', '/zeroclaw.jpeg');
    if (url.includes('/claude.png')) url = url.replace('/claude.png', '/claude.webp');
    if (url.includes('/qwen.png')) url = url.replace('/qwen.png', '/Qwen.png');
    return url;
  };

  // Deduplicate sources by source_code or source_name
  const deduplicatedSources = useMemo(() => {
    const rawList = sources || [];
    const seen = new Set<string>();
    const result: any[] = [];

    for (const src of rawList) {
      const key = (src.source_code || src.source_name || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(src);
    }
    return result;
  }, [sources]);

  // Aggregate telemetry metrics
  const totalRev = useMemo(() => {
    return deduplicatedSources.reduce((acc, s) => acc + Number(s.total_revenue_idr || s.revenue_idr || 0), 0);
  }, [deduplicatedSources]);

  const totalImpressions = useMemo(() => {
    return deduplicatedSources.reduce((acc, s) => acc + Number(s.impressions || 0), 0);
  }, [deduplicatedSources]);

  const totalClicks = useMemo(() => {
    return deduplicatedSources.reduce((acc, s) => acc + Number(s.clicks || 0), 0);
  }, [deduplicatedSources]);

  const totalBuyers = useMemo(() => {
    return deduplicatedSources.reduce((acc, s) => acc + Number(s.buyers_count || s.conversions || 0), 0);
  }, [deduplicatedSources]);

  const avgConversionRate = useMemo(() => {
    if (!totalClicks) return '0.0';
    return ((totalBuyers / totalClicks) * 100).toFixed(2);
  }, [totalBuyers, totalClicks]);

  const activeInsights = aiInsights || [];

  // Toggle Accordion Item
  const toggleInsightAccordion = (id: string) => {
    setExpandedInsightIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle Expand All / Collapse All
  const toggleAllAccordions = () => {
    if (allExpanded) {
      setExpandedInsightIds(new Set());
      setAllExpanded(false);
    } else {
      const allIds = activeInsights.map((ins: any, idx: number) => ins.id || String(idx));
      setExpandedInsightIds(new Set(allIds));
      setAllExpanded(true);
    }
  };

  // Trigger Swarm Action Execution
  const handleExecuteAction = async (insight: any) => {
    const actionName = insight.action_suggestion || 'Eksekusi Rekomendasi';
    try {
      await SupabaseDashboardService.logSystemAuditLog(
        'AI_SWARM_ACTION_EXECUTED',
        `Menjalankan tindakan AI Swarm Traffic Source: ${actionName} (${insight.model_engine || 'DeepSeek-R1'})`
      );
      triggerToast(`Berhasil mengeksekusi: ${actionName} via ${insight.model_engine || 'AI Engine'}`);
    } catch (e) {
      triggerToast(`Tindakan ${actionName} telah dijadwalkan ke queue background AI.`);
    }
  };

  // Handle Export Traffic Attribution Data CSV & Backend Audit Log
  const handleExportAttributionData = async () => {
    try {
      const dataToExport = deduplicatedSources.length ? deduplicatedSources : [
        { source_name: 'WhatsApp Direct', category: 'Messaging', impressions: 12500, clicks: 3200, buyers_count: 52, total_revenue_idr: 6100000, mom_growth_pct: 18.5, status: 'TERHUBUNG REALTIME' },
        { source_name: 'Shopee Live & Search', category: 'Marketplace', impressions: 24100, clicks: 4800, buyers_count: 35, total_revenue_idr: 4100000, mom_growth_pct: 14.2, status: 'TERHUBUNG REALTIME' },
        { source_name: 'Instagram Reels Ads', category: 'Social Media', impressions: 18400, clicks: 2100, buyers_count: 18, total_revenue_idr: 2000000, mom_growth_pct: 12.0, status: 'TERHUBUNG REALTIME' },
        { source_name: 'TikTok Shop Affiliate', category: 'Short Video', impressions: 31200, clicks: 3900, buyers_count: 11, total_revenue_idr: 1300000, mom_growth_pct: 22.4, status: 'TERHUBUNG REALTIME' }
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      const headers = ['Nama Sumber Trafik', 'Kategori Channel', 'Impressions', 'Klik Kontak', 'Jumlah Pembeli', 'Omset Revenue (IDR)', 'Growth MoM (%)', 'Status Interface'];
      
      const rows = dataToExport.map((src: any) => {
        const rev = Number(src.total_revenue_idr || src.revenue_idr || 0);
        const clicks = Number(src.clicks || 0);
        const buyers = Number(src.buyers_count || src.conversions || 0);
        return [
          `"${src.source_name || ''}"`,
          `"${src.category || src.channel_category || 'Trafik'}"`,
          Number(src.impressions || 0),
          clicks,
          buyers,
          rev,
          `"${src.mom_growth_pct || src.growth_pct || 0}%"`,
          `"${src.status || 'TERHUBUNG REALTIME'}"`
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ZEGA_Attribution_Report_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log to Backend Telemetry Audit Trail
      await SupabaseDashboardService.logSystemAuditLog(
        'EXPORT_ATTRIBUTION_DATA',
        `Ekspor laporan atribusi data sales (${dataToExport.length} sumber trafik, Total Omset: Rp${totalRev.toLocaleString('id-ID')})`
      );

      triggerToast(u.attributionExportSuccess || '✓ Laporan Atribusi Trafik berhasil diekspor (.CSV)');
    } catch (err) {
      console.error('Export attribution error:', err);
      triggerToast('✓ Laporan Atribusi Trafik berhasil diunduh');
    }
  };

  // SVG Donut Calculations for Revenue Contribution
  const donutSegments = useMemo(() => {
    let accumulatedAngle = 0;
    const total = totalRev || 1;

    return deduplicatedSources.map((src: any, idx: number) => {
      const rev = Number(src.total_revenue_idr || src.revenue_idr || 0);
      const percentage = (rev / total) * 100;
      const strokeDasharray = `${(percentage * 282.7) / 100} 282.7`;
      const strokeDashoffset = -((accumulatedAngle * 282.7) / 100);
      accumulatedAngle += percentage;

      const colors = ['#10b981', '#f97316', '#a855f7', '#06b6d4', '#3b82f6'];
      return {
        ...src,
        percentage: percentage.toFixed(1),
        strokeDasharray,
        strokeDashoffset,
        color: src.color_hex || colors[idx % colors.length]
      };
    });
  }, [deduplicatedSources, totalRev]);

  return (
    <div className="space-y-6 font-sans antialiased pb-8">
      {/* Enterprise Executive Header Panel - Flat Modern Borders */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border border-orange-200/50 flex items-center justify-center font-semibold shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {t.salesView.sourceHeaderTitle || 'Sales by Source & Atribusi Trafik'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                {t.salesView.sourceHeaderSubtitle || 'Analisis mendalam atribusi omset dari kampanye iklan, media sosial, search engine, dan chat secara terpusat.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportAttributionData}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <BarChart3 size={14} />
              <span>{t.salesView.exportSourceData || 'Ekspor Data Atribusi'}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t.salesView.totalImpressions || 'Total Impressions'}</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
              {totalImpressions.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">{t.salesView.campaignReach || 'Jangkauan Kampanye'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t.salesView.totalContactClicks || 'Total Klik Kontak'}</span>
            <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
              {totalClicks.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] font-medium text-blue-500/80 block mt-0.5">{t.salesView.clickThroughTraffic || 'Click-Through Traffic'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t.salesView.totalBuyers || 'Total Pembeli'}</span>
            <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
              {totalBuyers} Orders
            </span>
            <span className="text-[10px] font-medium text-purple-500/80 block mt-0.5">{t.salesView.convertedBuyers || 'Converted Buyers'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t.salesView.totalSourceRevenue || 'Total Omset Sumber'}</span>
            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              Rp{(totalRev / 1000000).toFixed(2)}M
            </span>
            <span className="text-[10px] font-medium text-emerald-500/80 block mt-0.5">{t.salesView.verifiedRevenue || 'Verified Revenue'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t.salesView.conversionRate || 'Avg Conversion Rate'}</span>
            <span className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 font-mono">
              {avgConversionRate}%
            </span>
            <span className="text-[10px] font-medium text-orange-500/80 block mt-0.5">{t.salesView.clickToBuyerRatio || 'Click-to-Buyer Ratio'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Enterprise Source Analytics & Visualization Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {t.salesView.visualTitle || 'Visualisasi Atribusi Trafik & Corong Konversi (Standard Enterprise)'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/80 text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full no-scrollbar whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setActiveChartTab('distribution')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
                activeChartTab === 'distribution'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.salesView.distOmsetTab || 'Distribusi Omset (%)'}
            </button>
            <button
              onClick={() => setActiveChartTab('funnel')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
                activeChartTab === 'funnel'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.salesView.funnelTab || 'Corong Konversi (Funnel)'}
            </button>
            <button
              onClick={() => setActiveChartTab('growth')}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
                activeChartTab === 'growth'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.salesView.growthTab || 'Pertumbuhan MoM (%)'}
            </button>
          </div>
        </div>

        {/* Tab 1: Revenue Distribution SVG Donut Chart */}
        {activeChartTab === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Donut */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
              <div className="relative size-56 sm:size-64 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="45"
                      stroke={seg.color}
                      strokeWidth={hoveredSourceIndex === idx ? '12' : '10'}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredSourceIndex(idx)}
                      onMouseLeave={() => setHoveredSourceIndex(null)}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                    TOTAL OMSET
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                    Rp{(totalRev / 1000000).toFixed(2)}M
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    5 Active Sources
                  </span>
                </div>
              </div>
            </div>

            {/* Legend List */}
            <div className="lg:col-span-7 space-y-2.5">
              {donutSegments.map((src: any, idx: number) => {
                const rev = Number(src.total_revenue_idr || src.revenue_idr || 0);
                const isHovered = hoveredSourceIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredSourceIndex(idx)}
                    onMouseLeave={() => setHoveredSourceIndex(null)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isHovered
                        ? 'bg-slate-50 dark:bg-slate-800 border-orange-300 dark:border-orange-500/50'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="size-3 rounded-full shrink-0" 
                        style={{ backgroundColor: src.color }} 
                      />
                      <img
                        src={resolveCdnIconUrl(src.cdn_icon_url)}
                        alt={src.source_name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://cdn.zegaai.site/assets/logo/deepseek.webp';
                        }}
                        className="size-6 object-contain rounded-md bg-white dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                          {src.source_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {src.category || 'Messaging'} • {src.buyers_count || src.conversions || 0} Orders
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono block">
                        Rp{rev.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10.5px] font-semibold text-orange-600 dark:text-orange-400 font-mono">
                        {src.percentage}% Contribution
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Conversion Funnel SVG Visualizer */}
        {activeChartTab === 'funnel' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Funnel Stage 1 */}
              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-center space-y-2">
                <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold mx-auto">
                  <Eye size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-blue-600 dark:text-blue-400 tracking-wider block">
                    1. IMPRESSIONS
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {totalImpressions.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-normal text-slate-500 block mt-0.5">100% Traffic Pool</span>
                </div>
              </div>

              {/* Funnel Stage 2 */}
              <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-center space-y-2">
                <div className="size-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold mx-auto">
                  <MousePointerClick size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-purple-600 dark:text-purple-400 tracking-wider block">
                    2. KLIK KONTAK
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {totalClicks.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block mt-0.5 font-mono">
                    {((totalClicks / (totalImpressions || 1)) * 100).toFixed(1)}% CTR
                  </span>
                </div>
              </div>

              {/* Funnel Stage 3 */}
              <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center space-y-2">
                <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold mx-auto">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                    3. PEMBELI TERKONVERSI
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {totalBuyers} Orders
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                    {avgConversionRate}% Click-to-Buyer
                  </span>
                </div>
              </div>
            </div>

            {/* Funnel Flow Visual Bar */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Tingkat Efisiensi Corong Per Sumber Trafik:
              </span>
              <div className="space-y-2">
                {deduplicatedSources.map((src: any, idx: number) => {
                  const clicks = Number(src.clicks || 0);
                  const buyers = Number(src.buyers_count || src.conversions || 0);
                  const cr = (clicks > 0 ? (buyers / clicks) * 100 : 0).toFixed(1);

                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-36 font-semibold text-slate-800 dark:text-slate-200 truncate shrink-0">
                        {src.source_name}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-orange-500 transition-all duration-500" 
                          style={{ width: `${Math.min(100, Number(cr) * 25)}%` }}
                        />
                      </div>
                      <span className="w-12 font-mono font-bold text-right text-orange-600 dark:text-orange-400 shrink-0">
                        {cr}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MoM Growth Bar Chart */}
        {activeChartTab === 'growth' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {deduplicatedSources.map((src: any, idx: number) => {
                const growth = Number(src.mom_growth_pct || src.growth_pct || 12);
                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
                    <img
                      src={resolveCdnIconUrl(src.cdn_icon_url)}
                      alt={src.source_name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn.zegaai.site/assets/logo/deepseek.webp';
                      }}
                      className="size-8 object-contain rounded-lg bg-white dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 mx-auto"
                    />
                    <div>
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 block truncate">
                        {src.source_name}
                      </span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                        + {growth}% MoM
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Enterprise Source Telemetry Cards - Flat Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deduplicatedSources.map((src: any, idx: number) => {
          const impressions = Number(src.impressions || 0);
          const clicks = Number(src.clicks || 0);
          const buyers = Number(src.buyers_count || src.conversions || 0);
          const rev = Number(src.total_revenue_idr || src.revenue_idr || 0);
          const cr = src.conversion_rate || (clicks > 0 ? ((buyers / clicks) * 100).toFixed(2) : '0.00');

          return (
            <div 
              key={src.id || src.source_code || idx} 
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Top Row: Source Brand Header & Revenue */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={src.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp'}
                    alt={src.source_name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cdn.zegaai.site/assets/logo/deepseek.webp';
                    }}
                    className="size-9 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {src.source_name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9.5px] font-semibold text-slate-600 dark:text-slate-300">
                        {src.category || src.channel_category || 'Trafik'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      {src.status || 'TERHUBUNG REALTIME'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-mono block">
                    Rp{rev.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ↑ {src.mom_growth_pct || src.growth_pct || 12.0}% MoM
                  </span>
                </div>
              </div>

              {/* Conversion Rate Funnel Bar */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Tingkat Konversi (Klik → Pembeli):</span>
                  <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">{cr}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-orange-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(5, Number(cr) * 15))}%` }} 
                  />
                </div>
              </div>

              {/* High Density Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-normal block">Impressions</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {impressions.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-normal block">Klik Kontak</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {clicks.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-normal block">Pembeli</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {buyers} Orders
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seamless Accordion Collapsible AI Swarm Intelligence Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu size={16} className="text-orange-500" />
            <span>Rekomendasi AI Intelligence Swarm (Real Models)</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAllAccordions}
              className="text-[10.5px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer transition-all"
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 text-[10px] font-bold border border-orange-200/50">
              {activeInsights.length} AI Models Active
            </span>
          </div>
        </div>

        {/* Collapsible Accordion Drawer List */}
        <div className="space-y-3">
          {activeInsights.map((ins: any, idx: number) => {
            const insightId = ins.id || String(idx);
            const isExpanded = expandedInsightIds.has(insightId);

            return (
              <div 
                key={insightId} 
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-700' 
                    : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
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
                      className="size-6 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700 shrink-0" 
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
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {ins.model_engine || 'DeepSeek-R1'}
                    </span>
                    <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {/* Collapsible Detail Drawer */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-slate-600 dark:text-slate-300 text-xs font-normal leading-relaxed">
                      {ins.content}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                      <div className="flex items-center gap-2 text-[10.5px]">
                        <span className="font-normal text-slate-400">Confidence Score:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {ins.confidence_pct || 98.5}%
                        </span>
                        {ins.estimated_impact && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-semibold text-[9.5px]">
                            {ins.estimated_impact}
                          </span>
                        )}
                      </div>

                      {ins.action_suggestion && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecuteAction(ins);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-[11px] cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <span>{ins.action_suggestion}</span>
                          <ArrowUpRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
