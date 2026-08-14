import React, { useState, useEffect } from 'react';
import { 
  Users, Megaphone, Sparkles, DollarSign, Target, TrendingUp, TrendingDown, 
  Filter, Calendar, ChevronDown, ChevronUp, ArrowUpRight, Plus, RefreshCw, CheckCircle2, 
  MessageSquare, Instagram, Video, ShoppingBag, Mail, ShieldCheck, Zap,
  LayoutDashboard, BarChart3, FileText, Activity
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
import { useLanguage } from '../../../../i18n/translations';
import { 
  DeployMarketingSwarmModal, CreateCampaignModal, CreateContentModal, AllChannelsModal, 
  AllCampaignsModal, DateFilterModal, FilterModal, AllActivitiesModal 
} from './marketing/MarketingModals';
import { CampaignSubPage } from './marketing/subpages/CampaignSubPage';
import { PerformaByChannelSubPage } from './marketing/subpages/PerformaByChannelSubPage';
import { MarketingReportsSubPage } from './marketing/subpages/MarketingReportsSubPage';
import { ActivitiesSubPage } from './marketing/subpages/ActivitiesSubPage';
import { ContentStudioSubPage } from './marketing/subpages/ContentStudioSubPage';

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

export type MarketingSubTab = 'overview' | 'campaign' | 'channel' | 'reports' | 'activities' | 'konten';

interface MarketingViewProps {
  triggerToast?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function MarketingView({ triggerToast = () => {}, onNavigateTab }: MarketingViewProps) {
  const { t } = useLanguage();
  const m = (t.marketingView || {}) as any;

  const getInitialSubTab = (): MarketingSubTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab') || params.get('sub_page') || params.get('tab');
      if (sub === 'campaign' || sub === 'campaigns') return 'campaign';
      if (sub === 'channel' || sub === 'channels' || sub === 'performa_by_channel') return 'channel';
      if (sub === 'reports' || sub === 'report') return 'reports';
      if (sub === 'aktivitas' || sub === 'activities' || sub === 'activity') return 'activities';
      if (sub === 'konten' || sub === 'content' || sub === 'studio' || sub === 'content_studio') return 'konten';
    }
    return 'overview';
  };

  const [activeSubTab, setActiveSubTabState] = useState<MarketingSubTab>(getInitialSubTab);

  const setActiveSubTab = (tab: MarketingSubTab) => {
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

  const [timeTab, setTimeTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [contentTab, setContentTab] = useState<string>('Semua');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time Database States
  const [metrics, setMetrics] = useState<any>({
    total_reach: '0K',
    engagement_rate: 0.00,
    leads_generated: 0,
    revenue_campaign: 0.00,
    cost_per_lead: 0.00,
    roas: 0.00,
    reach_growth: 0.00,
    engagement_growth: 0.00,
    leads_growth: 0.00,
    revenue_growth: 0.00,
    cpl_growth: 0.00,
    roas_growth: 0.00,
    period_label: 'Realtime Data Engine',
    model_engine: 'DeepSeek R1 & ZeroClaw Engine',
    model_provider: 'ZEGA AI Gateway',
    execution_gateway: 'ZeroClaw-Edge-Gateway',
    cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
    success_rate: 100.0,
    latency_ms: 0
  });

  const [channels, setChannels] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [swarms, setSwarms] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);



  // Expand / Collapse State for Recommendations Accordion (Buka / Tutup UX)
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  // Telemetry Modal State for "Lihat Hasil"
  const [selectedInsightResult, setSelectedInsightResult] = useState<any | null>(null);

  // Load Real-time Data
  const fetchMarketingData = async () => {
    setLoading(true);
    const res = await SupabaseDashboardService.getUmkmMarketingOverview();
    if (res.metrics) setMetrics(res.metrics);
    if (res.channels?.length) setChannels(res.channels);
    if (res.campaigns?.length) setCampaigns(res.campaigns);
    if (res.contentItems?.length) setContentItems(res.contentItems);
    if (res.activities?.length) setActivities(res.activities);
    if (res.swarms?.length) setSwarms(res.swarms);
    if (res.insights?.length) setInsights(res.insights);
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

  const handleDeploySwarm = async (swarm: any) => {
    setLoading(true);
    await SupabaseDashboardService.deployMarketingAiSwarm('11111111-1111-1111-1111-111111111111', swarm);
    await fetchMarketingData();
  };

  const handleExecuteInsight = async (ins: any) => {
    setLoading(true);
    triggerToast(`🚀 AI Swarm mengeksekusi rekomendasi (${ins.model_engine}): "${ins.title}"`);
    await SupabaseDashboardService.executeMarketingInsightAction(ins.id, ins.action_label, 'applied');
    await fetchMarketingData();
  };

  const handleUndoInsight = async (ins: any) => {
    setLoading(true);
    triggerToast(`↩️ Pembatalan (Undo): Rekomendasi "${ins.title}" dikembalikan ke status Aktif di Database`);
    await SupabaseDashboardService.executeMarketingInsightAction(ins.id, ins.action_label, 'active');
    await fetchMarketingData();
  };

  const handleViewInsightResult = async (ins: any) => {
    setLoading(true);
    // Direct Real-time DB Telemetry Query
    const res = await SupabaseDashboardService.getUmkmMarketingOverview();
    const liveIns = res.insights?.find((i: any) => i.id === ins.id) || ins;
    setLoading(false);
    setSelectedInsightResult(liveIns);
  };

  const handlePreviewInsight = async (ins: any) => {
    triggerToast(`🔍 Pratinjau Realtime Model [${ins.model_engine}]: Estimasi Dampak ${ins.impact_level} | Gateway ${ins.execution_gateway}`);
  };

  const handleCreateCampaign = async (newCamp: any) => {
    setCampaigns((prev) => [newCamp, ...prev]);
    if (typeof (SupabaseDashboardService as any).createMarketingCampaign === 'function') {
      await (SupabaseDashboardService as any).createMarketingCampaign('11111111-1111-1111-1111-111111111111', newCamp);
    }
  };

  const handleCreateContent = async (newItem: any) => {
    setContentItems((prev) => [newItem, ...prev]);
    if (typeof (SupabaseDashboardService as any).createMarketingContent === 'function') {
      await (SupabaseDashboardService as any).createMarketingContent('11111111-1111-1111-1111-111111111111', newItem);
    }
  };

  // Channel Logo Lookup mapping R2 CDN & Local Fallbacks
  const getChannelLogo = (channelName: string) => {
    const nameLower = channelName.toLowerCase();
    if (nameLower.includes('whatsapp')) {
      return {
        cdn: 'https://cdn.zegaai.site/assets/logo/whatsapp-for-business.webp',
        fallback: '/assets/logo/whatsapp-for-business.webp'
      };
    }
    if (nameLower.includes('shopee')) {
      return {
        cdn: 'https://cdn.zegaai.site/assets/logo/shopee.png',
        fallback: '/assets/logo/shopee.png'
      };
    }
    if (nameLower.includes('instagram')) {
      return {
        cdn: 'https://cdn.zegaai.site/assets/logo/instagram.png',
        fallback: '/assets/logo/instagram.png'
      };
    }
    if (nameLower.includes('tiktok')) {
      return {
        cdn: 'https://cdn.zegaai.site/assets/logo/tiktok.webp',
        fallback: '/assets/logo/tiktok.webp'
      };
    }
    return {
      cdn: 'https://cdn.zegaai.site/assets/logo/zegalogo.png',
      fallback: '/assets/logo/zegalogo.png'
    };
  };

  // Filtered AI Content Items
  const filteredContent = contentTab === 'Semua' 
    ? contentItems 
    : contentItems.filter(item => item.platform.toLowerCase() === contentTab.toLowerCase());

  // Chart Datasets per Time Horizon (Daily, Weekly, Monthly) - Dynamically fetched or zero-state
  const chartDatasets: Record<'Daily' | 'Weekly' | 'Monthly', { labels: string[]; reach: number[]; eng: number[] }> = {
    Daily: {
      labels: metrics?.daily_labels || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      reach: metrics?.daily_reach || [0, 0, 0, 0, 0, 0, 0],
      eng: metrics?.daily_eng || [0, 0, 0, 0, 0, 0, 0],
    },
    Weekly: {
      labels: metrics?.weekly_labels || ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
      reach: metrics?.weekly_reach || [0, 0, 0, 0],
      eng: metrics?.weekly_eng || [0, 0, 0, 0],
    },
    Monthly: {
      labels: metrics?.monthly_labels || ['Bulan 1', 'Bulan 2', 'Bulan 3', 'Bulan 4'],
      reach: metrics?.monthly_reach || [0, 0, 0, 0],
      eng: metrics?.monthly_eng || [0, 0, 0, 0],
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
            {m.title || 'Marketing Overview'}
            {loading && <RefreshCw size={16} className="animate-spin text-orange-500" />}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {m.subtitle || 'Pantau semua aktivitas marketing Anda dalam satu dashboard.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Action: Deploy AI Swarm */}
          <button
            onClick={() => setActiveModal('deploySwarm')}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Zap size={14} className="fill-current" />
            <span>+ {m.deploySwarm || 'Deploy AI Swarm'}</span>
          </button>

          {/* Date Picker Button */}
          <button
            onClick={() => setActiveModal('dateFilter')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all"
          >
            <span>{metrics.period_label || '1 Jul - 31 Jul 2026'}</span>
            <Calendar size={14} className="text-slate-400" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setActiveModal('filter')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-all"
          >
            <Filter size={14} className="text-orange-500" />
            <span>{m.filter || 'Filter'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5 overflow-x-auto">
        {[
          { id: 'overview', label: m.overviewTab || 'Overview', icon: LayoutDashboard },
          { id: 'campaign', label: m.campaignTab || 'Campaign', icon: Megaphone },
          { id: 'konten', label: m.kontenTab || 'AI Content Studio', icon: Sparkles },
          { id: 'channel', label: m.channelTab || 'Performa by Channel', icon: BarChart3 },
          { id: 'reports', label: m.reportsTab || 'Reports', icon: FileText },
          { id: 'activities', label: m.activitiesTab || m.aktivitasTab || 'Activities', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as MarketingSubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBPAGE 1: CAMPAIGN */}
      {activeSubTab === 'campaign' && (
        <CampaignSubPage 
          campaigns={campaigns} 
          onOpenCreateCampaign={() => setActiveModal('createCampaign')} 
          triggerToast={triggerToast} 
        />
      )}

      {/* SUBPAGE: AI CONTENT STUDIO */}
      {activeSubTab === 'konten' && (
        <ContentStudioSubPage storeId="11111111-1111-1111-1111-111111111111" />
      )}

      {/* SUBPAGE 2: PERFORMA BY CHANNEL */}
      {activeSubTab === 'channel' && (
        <PerformaByChannelSubPage 
          channels={channels} 
          getChannelLogo={getChannelLogo} 
          triggerToast={triggerToast} 
        />
      )}

      {/* SUBPAGE 3: REPORTS */}
      {activeSubTab === 'reports' && (
        <MarketingReportsSubPage 
          metrics={metrics} 
          triggerToast={triggerToast} 
        />
      )}

      {/* SUBPAGE 4: ACTIVITIES */}
      {activeSubTab === 'activities' && (
        <ActivitiesSubPage 
          activities={activities} 
          triggerToast={triggerToast} 
        />
      )}

      {/* SUBPAGE 0: OVERVIEW MAIN DASHBOARD */}
      {activeSubTab === 'overview' && (
        <>
      {/* ========================================================================= */}
      {/* 2. TOP METRICS GRID (6 ENTERPRISE KPI CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        {/* Card 1: Total Reach */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reach</span>
            <div className="size-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              <Users size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics.total_reach || '0'}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                ↑ {metrics.reach_growth || 0}%
              </span>
              <span className="text-slate-400 font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Card 2: Engagement Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engagement</span>
            <div className="size-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <Megaphone size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics.engagement_rate || 0}%
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                ↓ {Math.abs(metrics.engagement_growth || 0)}%
              </span>
              <span className="text-slate-400 font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Card 3: Leads Generated */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leads</span>
            <div className="size-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Sparkles size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {(metrics.leads_generated || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                ↑ {metrics.leads_growth || 0}%
              </span>
              <span className="text-slate-400 font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Card 4: Revenue Campaign */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</span>
            <div className="size-7 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Rp {(metrics.revenue_campaign || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                ↑ {metrics.revenue_growth || 0}%
              </span>
              <span className="text-slate-400 font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Card 5: Cost per Lead */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost / Lead</span>
            <div className="size-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              <Target size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Rp {(metrics.cost_per_lead || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                ↓ {Math.abs(metrics.cpl_growth || 0)}%
              </span>
              <span className="text-slate-400 font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Card 6: ROAS */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROAS</span>
            <div className="size-7 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
              <TrendingUp size={14} />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {typeof metrics.roas === 'number' ? metrics.roas.toFixed(2) : metrics.roas || '0.00'}x
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                ↑ {metrics.roas_growth || 0}%
              </span>
              <span className="text-slate-400 font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION: PERFORMA OVER TIME, CHANNEL, RINGKASAN BULANAN */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Performa Over Time Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{m.performanceOverTime || 'Performa Over Time'}</h3>

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
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-3">{m.performanceByChannel || 'Performa by Channel'}</h3>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                <span className="col-span-4">Channel</span>
                <span className="col-span-2 text-center">Reach</span>
                <span className="col-span-2 text-center">Eng</span>
                <span className="col-span-2 text-center">Leads</span>
                <span className="col-span-2 text-right">Conv</span>
              </div>

              {channels.map((ch, i) => {
                const logo = getChannelLogo(ch.channel_name);
                return (
                  <div key={i} className="grid grid-cols-12 items-center p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <div className="col-span-4 flex items-center gap-2 truncate">
                      <img
                        src={logo.cdn}
                        onError={(e: any) => { e.target.onerror = null; e.target.src = logo.fallback; }}
                        alt={ch.channel_name}
                        className="size-4 object-contain rounded-md bg-white p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{ch.channel_name}</span>
                    </div>
                    <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px]">{ch.reach_text}</span>
                    <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px]">{ch.engagement_pct}%</span>
                    <span className="col-span-2 text-center font-bold text-slate-900 dark:text-slate-100 text-[11px]">{ch.leads_count}</span>
                    <span className="col-span-2 text-right font-extrabold text-emerald-600 text-[11px]">{ch.conversion_pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveSubTab('channel')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>{m.viewAll || 'Lihat Semua Channel'}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Ringkasan Bulanan Card (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{m.monthlySummary || 'Ringkasan Bulanan'}</h3>
            
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">{m.bestPerformingCampaign || 'Best Performing Campaign'}</span>
              <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
                {campaigns[0]?.campaign_name || m.noCampaignYet || 'Belum Ada Campaign'}
              </div>
              <div className="font-black text-emerald-600 text-xs">
                Rp{(campaigns[0]?.revenue || campaigns[0]?.revenue_num || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>Total Leads</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {(metrics?.leads_generated || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>Total Customers</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {(metrics?.total_customers || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>{m.repeatCustomerRate || 'Repeat Customer Rate'}</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {metrics?.repeat_customer_rate || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>{m.totalSpend || 'Total Spend'}</span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  Rp{(metrics?.total_spend || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveSubTab('reports')}
            className="w-full py-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 font-extrabold text-xs cursor-pointer text-center transition-all flex items-center justify-center gap-1.5"
          >
            <span>{m.seeFullReport || 'Lihat Laporan Lengkap'}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: TOP CAMPAIGNS, AI CONTENT STUDIO, AI RECOMMENDATIONS */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Top Campaigns Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{m.topCampaigns || 'Top Campaigns'}</h3>
              <button
                onClick={() => setActiveModal('createCampaign')}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> + {m.newCampaign || 'Campaign Baru'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                <span className="col-span-5">Campaign</span>
                <span className="col-span-2 text-center">Reach</span>
                <span className="col-span-2 text-center">Leads</span>
                <span className="col-span-3 text-right">Revenue</span>
              </div>

              {campaigns.slice(0, 5).map((c, i) => {
                const logo = getChannelLogo(c.channel_name || '');
                return (
                  <div key={i} className="grid grid-cols-12 items-center p-2.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="col-span-5 flex items-center gap-2 truncate">
                      <img 
                        src={c.cdn_icon_url || logo.cdn} 
                        alt={c.campaign_name || 'Campaign'} 
                        className="size-8 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0 shadow-2xs" 
                        onError={(e: any) => { 
                          e.target.onerror = null;
                          e.target.src = logo.fallback || logo.cdn; 
                        }}
                      />
                      <div className="truncate">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate text-[11px]">{c.campaign_name}</div>
                        <div className="text-[10px] text-slate-400">{c.date_range}</div>
                      </div>
                    </div>

                    <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300 text-[11px]">{c.reach_text}</span>
                    <span className="col-span-2 text-center font-bold text-slate-900 dark:text-slate-100 text-[11px]">{c.leads_count}</span>
                    <div className="col-span-3 text-right">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-[11px]">Rp{(c.revenue || c.revenue_num || 0).toLocaleString('id-ID')}</div>
                      <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold ${
                        c.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {campaigns.length === 0 && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <p className="font-extrabold text-xs text-slate-600 dark:text-slate-400">{m.noCampaignYet || 'Belum Ada Campaign'}</p>
                  <p className="text-[11px] text-slate-400">{m.noCampaignsFound || 'Tidak ada data campaign aktif'}</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveSubTab('campaign')}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors pt-2 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>{m.viewAll || 'Lihat Semua Campaign'}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* AI Content Studio Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{m.aiContentStudio || 'AI Content Studio'}</h3>
                <p className="text-[11px] text-slate-400 font-medium">{m.aiContentStudioSubtitle || 'Buat konten marketing dengan AI dalam hitungan detik.'}</p>
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

            {/* Grid Content Cards */}
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {filteredContent.slice(0, 4).map((item, i) => {
                const defaultCdnUrl = item.platform === 'Instagram' 
                  ? 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'
                  : item.platform === 'TikTok'
                  ? 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80'
                  : item.platform === 'WhatsApp'
                  ? 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80'
                  : 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80';
                
                return (
                  <div key={i} className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={item.cdn_image_url || item.creative_image_url || defaultCdnUrl} 
                      alt={item.title} 
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" 
                      onError={(e: any) => { 
                        e.target.onerror = null;
                        e.target.src = defaultCdnUrl; 
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/80 p-2.5 flex flex-col justify-end">
                      <span className="text-[9px] font-black text-orange-300 uppercase tracking-wider">{item.content_type}</span>
                      <h4 className="text-xs font-extrabold text-white truncate">{item.title}</h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveSubTab('konten')}
            className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <Sparkles size={14} />
            <span>{m.accessContentStudio || 'Akses Content AI Studio'}</span>
          </button>
        </div>

        {/* AI Recommendation High-Contrast Executive Card & Live Activities (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Executive AI Recommendations Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{m.realtimeOptimization || 'Rekomendasi Optimasi Realtime'}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">{insights.length} {m.activeInsights || 'Insight Aktif'}</span>
                {insights.length > 1 && (
                  <button
                    onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                    title={isInsightsExpanded ? "Tutup Rekomendasi" : "Buka Rekomendasi Lainnya"}
                    className="py-1 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/90 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-all cursor-pointer border border-indigo-200/90 dark:border-indigo-800/80 shadow-2xs flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                  >
                    <span>{isInsightsExpanded ? 'Tutup' : 'Buka'}</span>
                    {isInsightsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
              </div>
            </div>

            {/* Real-time Insights High-Contrast Seamless Accordion (Buka / Tutup Mode: Shows 1 by default) */}
            <div className="space-y-3">
              {(isInsightsExpanded ? insights : insights.slice(0, 1)).map((ins, i) => {
                const getImpactBadgeClass = (impact: string) => {
                  const imp = impact.toUpperCase();
                  if (imp.includes('CRITICAL')) {
                    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300/80';
                  }
                  if (imp.includes('HIGH')) {
                    return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80';
                  }
                  return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300/80';
                };

                return (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-2.5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={ins.cdn_icon_url}
                          alt={ins.model_engine}
                          className="size-5 object-contain rounded-md bg-white p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                        />
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${getImpactBadgeClass(ins.impact_level)}`}>
                          {ins.impact_level}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                        {ins.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug">{ins.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1 leading-normal line-clamp-2">{ins.description}</p>
                    </div>

                    {/* Dual Action Buttons & Dynamic Execution Controls */}
                    <div className="flex items-center gap-2 pt-1">
                      {ins.status === 'applied' ? (
                        <>
                          <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>✓ {m.applied || 'Telah Diterapkan'}</span>
                          </div>
                          <button
                            onClick={() => handleViewInsightResult(ins)}
                            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            <span>{m.viewAllResult || 'Lihat Hasil'}</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleExecuteInsight(ins)}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles size={13} className="text-amber-300" />
                            <span>{ins.action_label || m.applyNow || 'Terapkan Sekarang'}</span>
                          </button>
                          <button
                            onClick={() => handlePreviewInsight(ins)}
                            className="py-2 px-3 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-300/60 dark:border-slate-600/60"
                          >
                            <span>{m.preview || 'Pratinjau'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aktivitas Terbaru Live Feed */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{m.recentActivities || 'Aktivitas Terbaru'}</h3>
              <button onClick={() => setActiveSubTab('activities')} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-orange-500 cursor-pointer">{m.viewAll || 'Lihat Semua'} ↗</button>
            </div>

            <div className="space-y-2.5 text-xs">
              {activities.slice(0, 3).map((act, i) => (
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
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. RENDER ACTIVE MODALS */}
      {/* ========================================================================= */}
      <DeployMarketingSwarmModal
        isOpen={activeModal === 'deploySwarm'}
        onClose={() => setActiveModal(null)}
        onDeploy={handleDeploySwarm}
        triggerToast={triggerToast}
      />

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

      <AllActivitiesModal
        isOpen={activeModal === 'allActivities'}
        onClose={() => setActiveModal(null)}
        activities={activities}
      />

      {/* AI Telemetry & Result Audit Modal */}
      {selectedInsightResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedInsightResult.cdn_icon_url}
                  alt={selectedInsightResult.model_engine}
                  className="size-9 object-contain rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-xs"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">{m.aiAuditResultTitle || 'Hasil Audit Model AI'}</h3>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedInsightResult.model_engine}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInsightResult(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300">
                {m.dbStatusLabel || 'STATUS DATABASE'}: {selectedInsightResult.status.toUpperCase()}
              </span>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mt-1.5">{selectedInsightResult.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedInsightResult.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">{m.executionGatewayLabel || 'Gateway Eksekusi'}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedInsightResult.execution_gateway}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">{m.optimizationCategoryLabel || 'Kategori Optimasi'}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedInsightResult.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">{m.estimatedRoasLabel || 'Estimasi Performa (ROAS)'}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">+18.4% Efficiency</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">CDN Icon Path</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 truncate block">{selectedInsightResult.cdn_icon_url.split('/').pop()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const item = selectedInsightResult;
                  setSelectedInsightResult(null);
                  handleUndoInsight(item);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-300 transition-colors cursor-pointer"
              >
                {m.undoActionBtn || '↩ Batalkan (Undo)'}
              </button>
              <button
                onClick={() => setSelectedInsightResult(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                {m.closeAuditBtn || 'Tutup Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
