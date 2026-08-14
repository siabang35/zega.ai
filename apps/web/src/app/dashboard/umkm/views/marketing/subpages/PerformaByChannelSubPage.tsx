import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ArrowUpRight, TrendingUp, DollarSign, Users, 
  Layers, ShieldCheck, Filter, Download, Cpu, RefreshCw,
  Eye, MousePointerClick, CheckCircle2, Search, X, Sparkles
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../../services/supabaseService';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CHANNEL_CDN_LOGOS: Record<string, string> = {
  'WhatsApp Business': 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
  'WhatsApp': 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
  'Instagram Ads': 'https://cdn.zegaai.site/assets/logo/instagram.png',
  'Instagram': 'https://cdn.zegaai.site/assets/logo/instagram.png',
  'TikTok Shop': 'https://cdn.zegaai.site/assets/logo/tiktok.webp',
  'TikTok': 'https://cdn.zegaai.site/assets/logo/tiktok.webp',
  'Shopee Official': 'https://cdn.zegaai.site/assets/logo/shopee.png',
  'Shopee': 'https://cdn.zegaai.site/assets/logo/shopee.png',
  'Email Blast': 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/logo/sendgrid.webp',
  'Email': 'https://pub-2849e7b2ff1841e2a0fef0bbbeebf13e.r2.dev/assets/logo/sendgrid.webp',
};

const LOCAL_FALLBACKS: Record<string, string> = {
  'WhatsApp Business': '/assets/logo/whatsapp-for-business.webp',
  'Instagram Ads': '/assets/logo/instagram.png',
  'Shopee Official': '/assets/logo/shopee.png',
  'TikTok Shop': '/assets/logo/tiktok.webp',
  'Email Blast': '/assets/logo/sendgrid.webp',
};

import { useLanguage } from '../../../../../../i18n/translations';

interface PerformaByChannelSubPageProps {
  channels?: any[];
  getChannelLogo?: (name: string) => { cdn: string; fallback: string };
  triggerToast: (msg: string) => void;
}

export function PerformaByChannelSubPage({ triggerToast }: PerformaByChannelSubPageProps) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;
  const [channelData, setChannelData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'leads'>('revenue');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [selectedAuditChannel, setSelectedAuditChannel] = useState<any | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch real channel performance data from Supabase
  const loadChannelData = async () => {
    setIsLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmMarketingChannelPerformance();
      setChannelData(data || []);
    } catch (e) {
      console.warn('Error loading marketing channel performance:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChannelData();
    const unsubscribe = SupabaseDashboardService.subscribeToMarketingChannelPerformance('11111111-1111-1111-1111-111111111111', () => {
      loadChannelData();
    });
    return () => unsubscribe();
  }, []);

  // Calculate Metrics
  const totalRevenue = channelData.reduce((sum, ch) => sum + (parseFloat(ch.revenue_num) || 0), 0);
  const totalLeads = channelData.reduce((sum, ch) => sum + (ch.leads_count || 0), 0);
  const maxLeads = Math.max(...channelData.map(c => c.leads_count || 1), 1);
  const avgRoas = channelData.length > 0 
    ? (channelData.reduce((sum, ch) => sum + (parseFloat(ch.roas_val) || 0), 0) / channelData.length).toFixed(2)
    : '3.54';

  const topPerforming = channelData.length > 0 ? channelData[0] : null;
  const highestEng = channelData.length > 0 ? [...channelData].sort((a, b) => (b.engagement_pct || 0) - (a.engagement_pct || 0))[0] : null;

  // Filtered Channels for Table
  const filteredChannels = channelData.filter(ch =>
    !searchQuery ||
    (ch.channel_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ch.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart.js Bar Data
  const barChartData = {
    labels: channelData.map(ch => ch.channel_name || 'Channel'),
    datasets: [
      {
        label: chartMetric === 'revenue' ? (m.revenueRp || 'Pendapatan (Rp)') : (m.totalLeads || 'Total Leads'),
        data: channelData.map(ch => chartMetric === 'revenue' ? parseFloat(ch.revenue_num || 0) : (ch.leads_count || 0)),
        backgroundColor: chartMetric === 'revenue' 
          ? ['rgba(16, 185, 129, 0.85)', 'rgba(249, 115, 22, 0.85)', 'rgba(139, 92, 246, 0.85)', 'rgba(6, 182, 212, 0.85)', 'rgba(236, 72, 153, 0.85)']
          : ['rgba(59, 130, 246, 0.85)', 'rgba(14, 165, 233, 0.85)', 'rgba(99, 102, 241, 0.85)', 'rgba(168, 85, 247, 0.85)', 'rgba(236, 72, 153, 0.85)'],
        borderColor: chartMetric === 'revenue' 
          ? ['#10b981', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899']
          : ['#3b82f6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'],
        borderWidth: 1.5,
        borderRadius: 8,
      }
    ]
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            return chartMetric === 'revenue' 
              ? ` Pendapatan: Rp${val.toLocaleString('id-ID')}` 
              : ` Total Leads: ${val} Leads`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: {
          font: { size: 10 },
          color: '#94a3b8',
          callback: (value: any) => {
            if (chartMetric === 'revenue') {
              return `Rp${(value / 1000000).toFixed(1)}M`;
            }
            return value;
          }
        }
      }
    }
  };

  // Export PDF Document Function (.pdf)
  const handleExportPdfReport = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Performa Saluran Pemasaran ZEGA AI</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; background: #ffffff; }
    .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
    .logo span { color: #10b981; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
    .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; }
    .card-value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ZEGA <span>AI</span> PLATFORM</div>
      <h1 style="font-size: 20px; margin: 8px 0 4px 0;">Laporan Performa Saluran Pemasaran (Channel Performance)</h1>
      <p style="margin: 0; color: #64748b; font-size: 13px;">Diterbitkan via Realtime Telemetry Supabase DB • ${new Date().toLocaleDateString('id-ID')}</p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Total Pendapatan</div>
      <div class="card-value" style="color: #10b981;">Rp${totalRevenue.toLocaleString('id-ID')}</div>
    </div>
    <div class="card">
      <div class="card-title">Total Leads Terkonversi</div>
      <div class="card-value">${totalLeads} Leads</div>
    </div>
    <div class="card">
      <div class="card-title">Rata-Rata ROAS</div>
      <div class="card-value" style="color: #8b5cf6;">${avgRoas}x</div>
    </div>
    <div class="card">
      <div class="card-title">Saluran Teraktif</div>
      <div class="card-value">${topPerforming?.channel_name || 'WhatsApp'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Saluran Pemasaran</th>
        <th>Kategori</th>
        <th>Total Reach</th>
        <th>Engagement %</th>
        <th>Leads</th>
        <th>Conv %</th>
        <th>Pendapatan (IDR)</th>
        <th>ROAS</th>
      </tr>
    </thead>
    <tbody>
      ${channelData.map(ch => `
        <tr>
          <td style="font-weight: bold;">${ch.channel_name}</td>
          <td>${ch.category || 'Direct'}</td>
          <td>${ch.reach_text}</td>
          <td>${ch.engagement_pct}%</td>
          <td>${ch.leads_count}</td>
          <td style="color: #10b981; font-weight: bold;">${ch.conversion_pct}%</td>
          <td style="font-weight: bold;">Rp${parseFloat(ch.revenue_num || 0).toLocaleString('id-ID')}</td>
          <td>${ch.roas_val}x</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>Terautentikasi oleh ZEGA Telemetry Engine</div>
    <div>Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      triggerToast('📄 Mengunduh Laporan PDF Performa Saluran...');
    } else {
      triggerToast('⚠️ Gagal membuka jendela cetak PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Executive Metrics */}
      <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
            <BarChart3 size={18} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{m.channelPerfTitle || 'Analisis Performa Saluran (Channel Performance)'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {m.channelPerfSubtitle || 'Analisis efisiensi reach, engagement, konversi leads & omset per platform secara real-time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadChannelData()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-700"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{m.syncDataDb || 'Sync Data DB'}</span>
          </button>
          <button
            onClick={handleExportPdfReport}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Download size={14} />
            <span>{m.exportPdfReport || 'Ekspor Laporan PDF'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Top Performing Channel */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{m.topPerformingChannel || 'TOP PERFORMING CHANNEL'}</span>
            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{topPerforming?.channel_name || '-'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold">
              {topPerforming?.conversion_pct || 0}% Conv
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Omset Rp{(parseFloat(topPerforming?.revenue_num || 0)).toLocaleString('id-ID')} ({topPerforming?.leads_count || 0} Leads)
          </p>
        </div>

        {/* Card 2: Highest Engagement Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{m.highestEngagementRate || 'HIGHEST ENGAGEMENT RATE'}</span>
            <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <MousePointerClick size={16} />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>{highestEng?.channel_name || '-'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 font-extrabold">
              {highestEng?.engagement_pct || 0}% Eng
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {m.highestGrowth || 'Pertumbuhan tertinggi'} ({highestEng?.trend_pct || '0%'})
          </p>
        </div>

        {/* Card 3: Rata-Rata ROAS Channel */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{m.avgChannelRoas || 'RATA-RATA ROAS CHANNEL'}</span>
            <div className="size-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-lg font-black text-orange-600 dark:text-orange-400 flex items-center justify-between">
            <span>{avgRoas}x ROAS</span>
            <ArrowUpRight size={18} className="text-orange-500" />
          </div>
          <p className="text-xs text-slate-500 font-medium">{m.adCostEfficientDb || 'Biaya iklan efisien & terintegrasi DB'}</p>
        </div>

        {/* Card 4: Total Leads Generated */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:border-slate-400 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold">
            <span>{m.totalLeadsGenerated || 'TOTAL LEADS GENERATED'}</span>
            <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100">
            {totalLeads} Leads
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Omset total Rp{(totalRevenue / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      {/* 3. Professional Chart.js Bar Chart Visualization */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600" />
              <span>{m.channelComparisonTitle || 'Visualisasi Perbandingan Performa Saluran (Chart.js Bar Chart)'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {m.channelComparisonSubtitle || 'Perbandingan pendapatan & leads yang dihasilkan dari setiap saluran pemasaran'}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                chartMetric === 'revenue'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {m.revenueRp || 'Pendapatan (Rp)'}
            </button>
            <button
              onClick={() => setChartMetric('leads')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                chartMetric === 'leads'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {m.totalLeads || 'Total Leads'}
            </button>
          </div>
        </div>

        <div className="h-64 pt-2">
          {channelData.length > 0 ? (
            <Bar data={barChartData} options={barChartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              {m.loadingChannelChart || 'Memuat grafik perbandingan performa saluran...'}
            </div>
          )}
        </div>
      </div>

      {/* 4. Main Channel Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              {m.connectedChannelsList || 'Daftar Saluran Pemasaran Terhubung'}
            </h3>
            <p className="text-xs text-slate-400">
              {m.connectedChannelsSubtitle || 'Breakdown efisiensi reach, engagement, leads, & omset terintegrasi Supabase DB'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={m.searchChannels || 'Cari saluran...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none text-slate-900 dark:text-slate-100 w-40"
              />
            </div>
            <button
              onClick={handleExportPdfReport}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download size={13} />
              <span>{m.exportPdfReport || 'Ekspor PDF'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">CHANNEL NAME</th>
                <th className="py-2.5 px-3 text-center">TOTAL REACH</th>
                <th className="py-2.5 px-3 text-center">ENGAGEMENT %</th>
                <th className="py-2.5 px-3">LEADS GENERATED</th>
                <th className="py-2.5 px-3 text-center">CONV %</th>
                <th className="py-2.5 px-3 text-right">EST. REVENUE (RP)</th>
                <th className="py-2.5 px-3 text-right">ROAS</th>
                <th className="py-2.5 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                    {m.noChannelsFound || 'Tidak ada saluran pemasaran yang ditemukan.'}
                  </td>
                </tr>
              ) : (
                filteredChannels.map((ch, i) => {
                  const logoCdn = CHANNEL_CDN_LOGOS[ch.channel_name] || ch.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp';
                  const localFallback = LOCAL_FALLBACKS[ch.channel_name] || '/assets/logo/zegalogo.png';
                  const leadsPct = Math.round(((ch.leads_count || 10) / maxLeads) * 100);

                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={logoCdn}
                            alt={ch.channel_name}
                            className="size-7 object-contain rounded-lg bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                            onError={(e: any) => {
                              e.target.onerror = null;
                              e.target.src = localFallback;
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {ch.channel_name}
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="font-extrabold text-emerald-600">{ch.trend_pct || '+12%'}</span>
                              <span className="text-slate-400">• {ch.category || 'Direct'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {ch.reach_text}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {ch.engagement_pct}%
                      </td>

                      <td className="py-3 px-3 min-w-36">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-900 dark:text-slate-100">
                            <span>{ch.leads_count} Leads</span>
                            <span className="text-slate-400 font-mono">{leadsPct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${leadsPct}%`, backgroundColor: ch.color_hex || '#f97316' }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-extrabold text-emerald-600">
                        {ch.conversion_pct}%
                      </td>

                      <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-slate-100 font-mono">
                        Rp{parseFloat(ch.revenue_num || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-purple-600 dark:text-purple-400">
                        {ch.roas_val || '0.0'}x
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedAuditChannel(ch)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold cursor-pointer transition-colors"
                        >
                          Audit DB
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Audit Telemetri Detail Channel */}
      {selectedAuditChannel && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedAuditChannel.cdn_icon_url || CHANNEL_CDN_LOGOS[selectedAuditChannel.channel_name]}
                  alt={selectedAuditChannel.channel_name}
                  className="size-8 object-contain rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-700"
                  onError={(e: any) => { e.target.src = '/assets/logo/zegalogo.png'; }}
                />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {m.channelAuditTitle || 'Audit Detail Channel'}: {selectedAuditChannel.channel_name}
                  </h3>
                  <p className="text-xs text-slate-400">Record detail terautentikasi Supabase DB</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditChannel(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Estimasi Omset</span>
                <p className="text-base font-black text-emerald-600 mt-0.5">
                  Rp{parseFloat(selectedAuditChannel.revenue_num || 0).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">ROAS Biaya Iklan</span>
                <p className="text-base font-black text-purple-600 mt-0.5">
                  {selectedAuditChannel.roas_val || '0.0'}x ROAS
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Leads</span>
                <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedAuditChannel.leads_count} Leads ({selectedAuditChannel.conversion_pct}% Conv)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Target Reach</span>
                <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedAuditChannel.reach_text} Audiens
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> {selectedAuditChannel.status || 'TERHUBUNG REALTIME'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">ID: {selectedAuditChannel.id}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Model AI Engine: {selectedAuditChannel.model_engine || 'DeepSeek R1 & 9Router Layer 5'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAuditChannel(null)}
                className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-extrabold text-xs"
              >
                Tutup Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
