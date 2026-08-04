import React, { useState, useEffect } from 'react';
import { 
  Users, Megaphone, Sparkles, DollarSign, Target, TrendingUp, TrendingDown, 
  Filter, Calendar, ChevronDown, ArrowUpRight, Plus, RefreshCw, CheckCircle2, 
  MessageSquare, Instagram, Video, ShoppingBag, Mail, ShieldCheck, Zap
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
import { Line } from 'react-chartjs-2';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { 
  CreateCampaignModal, CreateContentModal, AllChannelsModal, 
  AllCampaignsModal, DateFilterModal, FilterModal 
} from './marketing/MarketingModals';

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

interface MarketingViewProps {
  triggerToast?: (msg: string) => void;
}

export function MarketingView({ triggerToast = () => {} }: MarketingViewProps) {
  const [timeTab, setTimeTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [contentTab, setContentTab] = useState<string>('Semua');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time Database States
  const [metrics, setMetrics] = useState<any>({
    total_reach: '125.4K',
    engagement_rate: 7.80,
    leads_generated: 456,
    revenue_campaign: 5200000.00,
    cost_per_lead: 11403.00,
    roas: 4.20,
    reach_growth: 12.00,
    engagement_growth: -1.20,
    leads_growth: 23.00,
    revenue_growth: 18.00,
    cpl_growth: -8.00,
    roas_growth: 15.00,
    period_label: '1 Jul - 31 Jul 2026'
  });

  const [channels, setChannels] = useState<any[]>([
    { channel_name: 'WhatsApp', reach_text: '56.2K', engagement_pct: 6.8, leads_count: 198, conversion_pct: 3.5, trend_color: '#10b981' },
    { channel_name: 'Instagram', reach_text: '32.8K', engagement_pct: 8.2, leads_count: 132, conversion_pct: 4.1, trend_color: '#a855f7' },
    { channel_name: 'Shopee', reach_text: '18.6K', engagement_pct: 5.6, leads_count: 76, conversion_pct: 3.2, trend_color: '#f97316' },
    { channel_name: 'TikTok', reach_text: '12.4K', engagement_pct: 9.1, leads_count: 50, conversion_pct: 4.0, trend_color: '#06b6d4' },
    { channel_name: 'Email', reach_text: '5.4K', engagement_pct: 4.2, leads_count: 28, conversion_pct: 2.6, trend_color: '#3b82f6' }
  ]);

  const [campaigns, setCampaigns] = useState<any[]>([
    { id: '1', campaign_name: 'Promo Agustus', date_range: '22 Jun - 22 Jul', reach_text: '45.2K', leads_count: 182, revenue: 2450000, roas_text: '3.8x', status: 'Aktif', image_url: '/design/dashboard_umkm/marketing/promo_skincare.jpeg' },
    { id: '2', campaign_name: 'Diskon Spesial Minggu Ini', date_range: '15 Jul - 31 Jul', reach_text: '32.1K', leads_count: 128, revenue: 1620000, roas_text: '2.9x', status: 'Aktif', image_url: '/design/dashboard_umkm/marketing/discount.jpeg' },
    { id: '3', campaign_name: 'Bundle Hemat', date_range: '10 Jul - 24 Jul', reach_text: '23.6K', leads_count: 84, revenue: 780000, roas_text: '2.1x', status: 'Aktif', image_url: '/design/dashboard_umkm/marketing/promo_skincare.jpeg' },
    { id: '4', campaign_name: 'Launching Produk Baru', date_range: '1 Jul - 20 Jul', reach_text: '18.9K', leads_count: 46, revenue: 350000, roas_text: '1.6x', status: 'Selesai', image_url: '/design/dashboard_umkm/marketing/tiktok_video.jpeg' },
    { id: '5', campaign_name: 'Remarketing Customer', date_range: '1 Jul - 31 Jul', reach_text: '7.6K', leads_count: 16, revenue: 0, roas_text: '-', status: 'Aktif', image_url: '/design/dashboard_umkm/marketing/instagram_story.jpeg' }
  ]);

  const [contentItems, setContentItems] = useState<any[]>([
    { id: '1', title: 'Promo Skincare', platform: 'Instagram', content_type: 'Instagram Post', image_url: '/design/dashboard_umkm/marketing/promo_skincare.jpeg' },
    { id: '2', title: 'Tips Perawatan Kulit', platform: 'Instagram', content_type: 'Instagram Story', image_url: '/design/dashboard_umkm/marketing/instagram_story.jpeg' },
    { id: '3', title: 'Diskon Spesial!', platform: 'WhatsApp', content_type: 'WhatsApp Template', image_url: '/design/dashboard_umkm/marketing/discount.jpeg' },
    { id: '4', title: 'Produk Baru', platform: 'TikTok', content_type: 'TikTok Video', image_url: '/design/dashboard_umkm/marketing/tiktok_video.jpeg' }
  ]);

  const [activities, setActivities] = useState<any[]>([
    { id: '1', activity_type: 'campaign', title: 'Campaign Promo Agustus diperbarui', time_ago: '2 menit lalu' },
    { id: '2', activity_type: 'content', title: 'Konten Instagram baru dipublish', time_ago: '15 menit lalu' },
    { id: '3', activity_type: 'leads', title: 'Leads dari WhatsApp bertambah 12', time_ago: '30 menit lalu' },
    { id: '4', activity_type: 'report', title: 'Laporan performa mingguan tersedia', time_ago: '1 jam lalu' }
  ]);

  // Load Real-time Data
  const fetchMarketingData = async () => {
    setLoading(true);
    const res = await SupabaseDashboardService.getUmkmMarketingOverview();
    if (res.metrics) setMetrics(res.metrics);
    if (res.channels?.length) setChannels(res.channels);
    if (res.campaigns?.length) setCampaigns(res.campaigns);
    if (res.contentItems?.length) setContentItems(res.contentItems);
    if (res.activities?.length) setActivities(res.activities);
    setLoading(false);
  };

  useEffect(() => {
    fetchMarketingData();

    // Subscribe to Supabase Realtime
    const unsubscribe = SupabaseDashboardService.subscribeToMarketingRealtime('11111111-1111-1111-1111-111111111111', () => {
      fetchMarketingData();
    });

    return () => unsubscribe();
  }, []);

  const handleCreateCampaign = async (newCamp: any) => {
    setCampaigns((prev) => [newCamp, ...prev]);
    await SupabaseDashboardService.createMarketingCampaign('11111111-1111-1111-1111-111111111111', newCamp);
  };

  const handleCreateContent = async (newItem: any) => {
    setContentItems((prev) => [newItem, ...prev]);
    await SupabaseDashboardService.createMarketingContent('11111111-1111-1111-1111-111111111111', newItem);
  };

  // Filtered AI Content Items
  const filteredContent = contentTab === 'Semua' 
    ? contentItems 
    : contentItems.filter(item => item.platform.toLowerCase() === contentTab.toLowerCase());

  // Chart Datasets per Time Horizon (Daily, Weekly, Monthly)
  const chartDatasets: Record<'Daily' | 'Weekly' | 'Monthly', { labels: string[]; reach: number[]; eng: number[] }> = {
    Daily: {
      labels: ['1 Jul', '6 Jul', '11 Jul', '16 Jul', '21 Jul', '26 Jul', '31 Jul'],
      reach: [15000, 35000, 52000, 38000, 62000, 88000, 72000],
      eng: [2.1, 4.8, 4.5, 3.2, 5.0, 7.8, 6.2],
    },
    Weekly: {
      labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
      reach: [120000, 240000, 310000, 450000],
      eng: [5.2, 6.4, 7.1, 8.5],
    },
    Monthly: {
      labels: ['Mei', 'Juni', 'Juli', 'Agustus'],
      reach: [450000, 680000, 890000, 1250000],
      eng: [4.9, 6.2, 7.8, 8.9],
    },
  };

  const currentChart = chartDatasets[timeTab];

  const lineChartData = {
    labels: currentChart.labels,
    datasets: [
      {
        label: 'Reach',
        data: currentChart.reach,
        borderColor: '#3b82f6',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointHoverRadius: 7,
        yAxisID: 'yReach',
      },
      {
        label: 'Engagement Rate (%)',
        data: currentChart.eng,
        borderColor: '#a855f7',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#a855f7',
        pointHoverRadius: 7,
        yAxisID: 'yEng',
      },
    ],
  };

  const lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11, weight: 'bold' },
        padding: 12,
        cornerRadius: 14,
        displayColors: true,
        callbacks: {
          label: (item: any) => {
            if (item.dataset.yAxisID === 'yReach') {
              return ` Reach: ${item.raw.toLocaleString('id-ID')}`;
            }
            return ` Engagement: ${item.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' },
      },
      yReach: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { 
          font: { size: 10, weight: 'bold' }, 
          color: '#3b82f6',
          callback: (val: any) => `${val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val}`
        },
      },
      yEng: {
        type: 'linear',
        position: 'right',
        grid: { display: false },
        ticks: { 
          font: { size: 10, weight: 'bold' }, 
          color: '#a855f7',
          callback: (val: any) => `${val}%`
        },
      },
    },
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Marketing Overview
            {loading && <RefreshCw size={16} className="animate-spin text-orange-500" />}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Pantau semua aktivitas marketing Anda dalam satu dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRICS GRID (6 CARDS WITH SPARKLINES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        {/* Card 1: Total Reach */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Users size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">Total Reach</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.total_reach || '125.4K'}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.reach_growth || 12}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <svg className="w-full h-6 mt-1 text-blue-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 20 Q 25 5, 50 15 T 100 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Engagement Rate */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Megaphone size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">Engagement Rate</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.engagement_rate || 7.8}%
            </div>
            <div className="text-[10px] font-bold text-rose-500 mt-0.5 flex items-center gap-1">
              <span>↓ {Math.abs(metrics.engagement_growth || 1.2)}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <svg className="w-full h-6 mt-1 text-purple-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 10 Q 30 22, 60 8 T 100 18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: Leads Generated */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Sparkles size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">Leads Generated</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.leads_generated || 456}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.leads_growth || 23}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <svg className="w-full h-6 mt-1 text-emerald-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 22 Q 25 18, 50 8 T 100 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Revenue from Campaign */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-xs">
              <DollarSign size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">Revenue Campaign</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(metrics.revenue_campaign || 5200000).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.revenue_growth || 18}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <svg className="w-full h-6 mt-1 text-orange-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 20 Q 30 15, 60 5 T 100 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 5: Cost per Lead */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Target size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">Cost per Lead</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              Rp{(metrics.cost_per_lead || 11403).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↓ {Math.abs(metrics.cpl_growth || 8)}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <svg className="w-full h-6 mt-1 text-amber-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 12 Q 30 20, 60 10 T 100 15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 6: ROAS */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-7 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center font-bold text-xs">
              <TrendingUp size={14} />
            </div>
            <span className="text-[11px] font-extrabold text-slate-400">ROAS</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {metrics.roas || 4.2}x
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span>↑ {metrics.roas_growth || 15}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          </div>
          <svg className="w-full h-6 mt-1 text-cyan-500" viewBox="0 0 100 25" fill="none">
            <path d="M0 18 Q 30 8, 60 16 T 100 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION: PERFORMA OVER TIME, CHANNEL, RINGKASAN BULANAN */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Performa Over Time Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Performa Over Time</h3>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-bold">
              {(['Daily', 'Weekly', 'Monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeTab(tab)}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                    timeTab === tab 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-blue-500" />
              <span>Reach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-purple-500" />
              <span>Engagement Rate</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Performa by Channel Table (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-3">Performa by Channel</h3>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                <span className="col-span-4">Channel</span>
                <span className="col-span-2 text-center">Reach</span>
                <span className="col-span-2 text-center">Eng</span>
                <span className="col-span-2 text-center">Leads</span>
                <span className="col-span-2 text-right">Conv</span>
              </div>

              {channels.map((ch, i) => (
                <div key={i} className="grid grid-cols-12 items-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                  <div className="col-span-4 flex items-center gap-1.5 truncate">
                    <div className="size-2 rounded-full" style={{ backgroundColor: ch.trend_color || '#10b981' }} />
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{ch.channel_name}</span>
                  </div>
                  <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px]">{ch.reach_text}</span>
                  <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px]">{ch.engagement_pct}%</span>
                  <span className="col-span-2 text-center font-bold text-slate-900 dark:text-slate-100 text-[11px]">{ch.leads_count}</span>
                  <span className="col-span-2 text-right font-extrabold text-emerald-600 text-[11px]">{ch.conversion_pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveModal('allChannels')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Lihat Semua Channel</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Ringkasan Bulanan Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Ringkasan Bulanan</h3>
            
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Best Performing Campaign</span>
              <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">Promo Agustus</div>
              <div className="font-black text-emerald-600 text-xs">Rp2.450.000</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>Total Leads</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">456</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>Total Customers</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">178</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>Repeat Customer Rate</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">42%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>Total Spend</span>
                <span className="font-black text-slate-900 dark:text-slate-100">Rp1.250.000</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => triggerToast('Membuka laporan bulanan komprehensif...')}
            className="w-full py-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 font-extrabold text-xs cursor-pointer text-center transition-all"
          >
            Lihat Laporan Lengkap →
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: TOP CAMPAIGNS, AI CONTENT STUDIO, AI RECOMMENDATION */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Top Campaigns Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Top Campaigns</h3>
              <button
                onClick={() => setActiveModal('createCampaign')}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Campaign Baru
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                <span className="col-span-5">Campaign</span>
                <span className="col-span-2 text-center">Reach</span>
                <span className="col-span-2 text-center">Leads</span>
                <span className="col-span-3 text-right">Revenue</span>
              </div>

              {campaigns.slice(0, 5).map((c, i) => (
                <div key={i} className="grid grid-cols-12 items-center p-2.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <img 
                      src={c.image_url} 
                      alt={c.campaign_name} 
                      className="size-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700" 
                    />
                    <div className="truncate">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate text-[11px]">{c.campaign_name}</div>
                      <div className="text-[10px] text-slate-400">{c.date_range}</div>
                    </div>
                  </div>

                  <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px]">{c.reach_text}</span>
                  <span className="col-span-2 text-center font-bold text-slate-900 dark:text-slate-100 text-[11px]">{c.leads_count}</span>
                  <div className="col-span-3 text-right">
                    <div className="font-black text-slate-900 dark:text-slate-100 text-[11px]">Rp{(c.revenue || 0).toLocaleString('id-ID')}</div>
                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold ${
                      c.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveModal('allCampaigns')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Lihat Semua Campaign</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* AI Content Studio Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">AI Content Studio</h3>
                <p className="text-[11px] text-slate-400 font-medium">Buat konten marketing dengan AI dalam hitungan detik.</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {['Semua', 'Instagram', 'TikTok', 'WhatsApp', 'Shopee'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setContentTab(tab)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    contentTab === tab 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grid Content Cards with Unsplash Image URLs */}
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {filteredContent.slice(0, 4).map((item, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent p-2.5 flex flex-col justify-end">
                    <span className="text-[9px] font-black text-orange-300 uppercase tracking-wider">{item.content_type}</span>
                    <h4 className="text-xs font-extrabold text-white truncate">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveModal('createContent')}
            className="w-full py-2.5 rounded-2xl border border-orange-500 text-orange-500 hover:bg-orange-50 font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles size={14} />
            <span>Buat Konten Baru</span>
          </button>
        </div>

        {/* AI Recommendation Purple Gradient Card & Live Activities (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Purple Gradient AI Recommendation Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white space-y-3 shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-purple-200 uppercase">
              <Sparkles size={16} className="text-amber-300" />
              <span>AI Recommendation</span>
            </div>
            
            <p className="text-xs text-purple-100 font-medium">
              Berdasarkan performa saat ini, AI merekomendasikan:
            </p>

            <div className="space-y-2 text-xs font-bold text-white">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-300 font-black">✓</span>
                <span>Tingkatkan budget di channel Instagram</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-300 font-black">✓</span>
                <span>Buat konten video pendek untuk TikTok</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-300 font-black">✓</span>
                <span>Kirim broadcast WhatsApp ke pelanggan aktif</span>
              </div>
            </div>

            <button
              onClick={() => triggerToast('AI Assistant mengeksekusi rekomendasi pemasaran!')}
              className="w-full py-2.5 rounded-2xl bg-white hover:bg-purple-50 text-purple-700 font-extrabold text-xs shadow-md cursor-pointer transition-all"
            >
              Terapkan Sekarang
            </button>
          </div>

          {/* Aktivitas Terbaru Live Feed */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Aktivitas Terbaru</h3>
              <button onClick={() => triggerToast('Viewing all activities')} className="text-[11px] font-bold text-slate-400 hover:text-orange-500">Lihat Semua</button>
            </div>

            <div className="space-y-2.5 text-xs">
              {activities.map((act, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="size-6 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight truncate">{act.title}</p>
                    <span className="text-[10px] font-medium text-slate-400">{act.time_ago}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RENDER ACTIVE MODALS */}
      {/* ========================================================================= */}
      <CreateCampaignModal
        isOpen={activeModal === 'createCampaign'}
        onClose={() => setActiveModal(null)}
        onCreate={handleCreateCampaign}
        triggerToast={triggerToast}
      />

      <CreateContentModal
        isOpen={activeModal === 'createContent'}
        onClose={() => setActiveModal(null)}
        onCreateContent={handleCreateContent}
        triggerToast={triggerToast}
      />

      <AllChannelsModal
        isOpen={activeModal === 'allChannels'}
        onClose={() => setActiveModal(null)}
      />

      <AllCampaignsModal
        isOpen={activeModal === 'allCampaigns'}
        onClose={() => setActiveModal(null)}
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
    </div>
  );
}
