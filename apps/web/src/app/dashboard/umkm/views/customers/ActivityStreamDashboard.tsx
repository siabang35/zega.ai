import React, { useState } from 'react';
import { 
  Activity, RefreshCw, Search, Filter, Sparkles, ShoppingBag, 
  MessageSquare, ShoppingCart, UserPlus, ExternalLink, ArrowUpRight, 
  Clock, CheckCircle2, ChevronDown, ChevronUp, Terminal, ShieldCheck, 
  Send, Eye, Zap, TrendingUp, BarChart2
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { getR2CdnUrl, generateInitialsAvatar } from '../../../../utils/cdn';

import { SupabaseDashboardService } from '../../../services/supabaseService';

interface ActivityStreamDashboardProps {
  activityStreamData: any[];
  triggerToast: (msg: string) => void;
  onSelectCustomer?: (customerName: string) => void;
}

const MOCK_EXTENDED_ACTIVITIES: any[] = [];

export function ActivityStreamDashboard({ activityStreamData, triggerToast, onSelectCustomer }: ActivityStreamDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [isAiSwarmOpen, setIsAiSwarmOpen] = useState<boolean>(false);

  const [dbActivities, setDbActivities] = useState<any[]>([]);

  React.useEffect(() => {
    async function loadTelemetry() {
      try {
        const res = await SupabaseDashboardService.getUmkmCrmActivityStreamTelemetry(activeFilter);
        if (res && Array.isArray(res.activities)) {
          setDbActivities(res.activities);
        }
      } catch (e) {
        console.warn('Failed to load activity stream telemetry:', e);
      }
    }
    loadTelemetry();
  }, [activeFilter]);

  // Combine DB telemetry or props data (zero fallback)
  const baseActivities = dbActivities.length > 0 ? dbActivities : (activityStreamData && activityStreamData.length > 0 ? activityStreamData : []);

  const combinedActivities = baseActivities.map((item, idx) => ({
    id: item.id || `act-${idx}`,
    customer_name: item.customer_name || 'Pelanggan UMKM',
    action_type: item.action_type || (item.action_description?.toLowerCase().includes('pembelian') ? 'checkout' :
                 item.action_description?.toLowerCase().includes('whatsapp') ? 'whatsapp' :
                 item.action_description?.toLowerCase().includes('keranjang') ? 'cart' :
                 item.action_description?.toLowerCase().includes('mendaftar') ? 'signup' : 'link_click'),
    action_description: item.action_description || 'Aktivitas Pelanggan',
    amount_idr: item.amount_idr || (item.action_description?.includes('Rp') ? parseInt(item.action_description.replace(/[^0-9]/g, '')) || 0 : 0),
    channel: item.channel || 'CRM Telemetry',
    time_ago: item.time_ago || 'Baru saja',
    timestamp: item.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
    avatar_url: item.avatar_url,
    payload: item.payload || { event_source: 'Supabase Realtime Telemetry', status: 'PROCESSED', latency_ms: 24 }
  }));

  const filteredActivities = combinedActivities.filter((item) => {
    const matchesSearch = 
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channel.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    return item.action_type === activeFilter;
  });

  // Dynamic Velocity Chart Data computed from combinedActivities
  const velocityChartData = (() => {
    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const checkoutData = new Array(8).fill(0);
    const waData = new Array(8).fill(0);
    const otherData = new Array(8).fill(0);

    combinedActivities.forEach((act) => {
      let hour = 12;
      if (act.timestamp) {
        const parsedHour = new Date(act.timestamp).getHours();
        if (!isNaN(parsedHour)) hour = parsedHour;
      }
      const index = Math.min(Math.floor(hour / 3), 7);
      if (act.action_type === 'checkout') checkoutData[index]++;
      else if (act.action_type === 'whatsapp') waData[index]++;
      else otherData[index]++;
    });

    return {
      labels: hours,
      datasets: [
        {
          label: 'Pembelian / Checkout',
          data: checkoutData,
          backgroundColor: '#10b981',
          borderRadius: 8,
        },
        {
          label: 'WhatsApp & Chat Engagement',
          data: waData,
          backgroundColor: '#3b82f6',
          borderRadius: 8,
        },
        {
          label: 'Keranjang & Klik Link',
          data: otherData,
          backgroundColor: '#f97316',
          borderRadius: 8,
        }
      ]
    };
  })();

  const velocityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          font: { size: 11, weight: 'bold' as const },
          usePointStyle: true,
          boxWidth: 8,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      }
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'checkout':
        return {
          icon: <ShoppingBag size={14} className="text-emerald-500" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
          label: 'Checkout Pembelian'
        };
      case 'whatsapp':
        return {
          icon: <MessageSquare size={14} className="text-blue-500" />,
          bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
          label: 'WhatsApp Engagement'
        };
      case 'cart':
        return {
          icon: <ShoppingCart size={14} className="text-amber-500" />,
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
          label: 'Keranjang Belanja'
        };
      case 'signup':
        return {
          icon: <UserPlus size={14} className="text-purple-500" />,
          bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
          label: 'Pendaftaran Pelanggan'
        };
      default:
        return {
          icon: <ExternalLink size={14} className="text-cyan-500" />,
          bg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
          label: 'Klik Promo'
        };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Top Header & Live Stream Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="text-orange-500" size={22} />
              <span>Activity Stream & Live Audit Telemetri</span>
            </h2>
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                isLiveStreaming
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`size-2 rounded-full ${isLiveStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isLiveStreaming ? 'Realtime Active' : 'Stream Paused'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit log aktivitas pelanggan, transaksi real-time, dan analitik performa per channel.
          </p>
        </div>

        <button
          onClick={() => triggerToast('Log aktivitas berhasil disinkronkan dengan Supabase RPC Audit')}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-2 shadow-xs self-start sm:self-center"
        >
          <RefreshCw size={14} className="text-orange-500" />
          <span>Refresh Live Stream</span>
        </button>
      </div>

      {/* 2. Top KPI Cards */}
      {(() => {
        const totalEventsCount = combinedActivities.length;
        const checkoutActivities = combinedActivities.filter(a => a.action_type === 'checkout');
        const checkoutTxCount = checkoutActivities.length;
        const totalRevenueIdr = checkoutActivities.reduce((sum, a) => sum + (a.amount_idr || 0), 0);
        const waEngagementCount = combinedActivities.filter(a => a.action_type === 'whatsapp').length;

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                <span>TOTAL EVENT (24H)</span>
                <div className="p-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600">
                  <Zap size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {totalEventsCount.toLocaleString('id-ID')} <span className="text-[10px] text-emerald-500 font-bold">Live</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Telemetri seluruh channel</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                <span>CHECKOUT & REVENUE</span>
                <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <ShoppingBag size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {checkoutTxCount} <span className="text-[10px] text-slate-400 font-normal">Tx</span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold truncate">
                Rp{totalRevenueIdr.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                <span>WA ENGAGEMENT</span>
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <MessageSquare size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {waEngagementCount} <span className="text-[10px] text-blue-500 font-bold">Respon</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Telemetri WA Agent Live</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                <span>JAM PUNCAK</span>
                <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {totalEventsCount > 0 ? `${totalEventsCount}` : '0'} <span className="text-[10px] text-slate-400 font-normal">event/jam</span>
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold truncate">
                {totalEventsCount > 0 ? 'Telemetri Terdeteksi' : 'Belum Ada Data'}
              </p>
            </div>
          </div>
        );
      })()}

      {/* 3. Restructured 2-Column Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): Main Live Timeline Stream */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          
          {/* Timeline Feed Container with Sticky Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            
            {/* Search & Channel Filter Bar */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  <span>Live Stream Log ({filteredActivities.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Urut Terbaru</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama pelanggan, event, channel, nominal..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'checkout', label: '🛒 Pembelian' },
                  { id: 'whatsapp', label: '💬 WA' },
                  { id: 'cart', label: '🛍️ Keranjang' },
                  { id: 'signup', label: '👤 User' },
                  { id: 'link_click', label: '🔗 Promo' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all border ${
                      activeFilter === f.id
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event List Items */}
            {filteredActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Activity size={28} className="mx-auto text-slate-300" />
                <p className="font-bold">Tidak ada log aktivitas yang cocok.</p>
              </div>
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {filteredActivities.map((act) => {
                  const badge = getActionBadge(act.action_type);
                  const isPayloadExpanded = expandedPayloadId === act.id;
                  const avatarSrc = (act.avatar_url && act.avatar_url.startsWith('http')) 
                    ? act.avatar_url 
                    : generateInitialsAvatar(act.customer_name);

                  return (
                    <div key={act.id} className="relative group">
                      {/* Node Bullet */}
                      <div className="absolute -left-5 top-1.5 size-4 rounded-full bg-white dark:bg-slate-900 border-2 border-orange-500 flex items-center justify-center shadow-xs z-10 group-hover:scale-125 transition-transform">
                        <span className="size-1 rounded-full bg-orange-500" />
                      </div>

                      {/* Card Content */}
                      <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-2 hover:border-orange-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs">
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={avatarSrc}
                              alt={act.customer_name}
                              className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs cursor-pointer"
                              onClick={() => onSelectCustomer && onSelectCustomer(act.customer_name)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = generateInitialsAvatar(act.customer_name);
                              }}
                            />
                            <div className="min-w-0 truncate">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span 
                                  onClick={() => onSelectCustomer && onSelectCustomer(act.customer_name)}
                                  className="font-extrabold text-slate-900 dark:text-slate-100 text-xs hover:text-orange-500 cursor-pointer truncate"
                                >
                                  {act.customer_name}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 ${badge.bg}`}>
                                  {badge.icon}
                                  <span>{badge.label}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {act.amount_idr > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono font-black text-[11px] border border-emerald-200 dark:border-emerald-800">
                                +Rp{act.amount_idr.toLocaleString('id-ID')}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">
                              {act.time_ago}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {act.action_description}
                        </p>

                        {/* Action Footer */}
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <button
                            onClick={() => setExpandedPayloadId(isPayloadExpanded ? null : act.id)}
                            className="font-mono text-slate-400 hover:text-orange-500 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Terminal size={11} />
                            <span>{isPayloadExpanded ? 'Sembunyikan' : 'Inspeksi JSON'}</span>
                            {isPayloadExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>

                          <button
                            onClick={() => triggerToast(`Mengirim pesan follow up WA otomatis ke ${act.customer_name}`)}
                            className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Send size={10} className="text-blue-500" />
                            <span>Follow Up WA</span>
                          </button>
                        </div>

                        {/* JSON Payload Inspector */}
                        {isPayloadExpanded && (
                          <div className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[10px] font-mono space-y-1.5 border border-slate-700 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <ShieldCheck size={12} />
                                <span>Payload Metadata</span>
                              </span>
                              <span>Timestamp: {act.timestamp}</span>
                            </div>
                            <pre className="overflow-x-auto text-[9px] text-amber-300 font-mono leading-relaxed">
                              {JSON.stringify(act.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Analytics Chart & AI Swarm Insights */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          
          {/* Card 1: Hourly Velocity Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BarChart2 className="text-orange-500" size={16} />
                <span>Tren Kecepatan Event per Jam</span>
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                {(['24h', '7d', '30d'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTimeframe(t)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                      chartTimeframe === t
                        ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-48 w-full pt-1">
              <Bar data={velocityChartData} options={velocityChartOptions} />
            </div>
          </div>

          {/* Card 2: Channel Engagement Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
            <h3 className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Filter className="text-blue-500" size={16} />
              <span>Distribusi Volume Channel CRM</span>
            </h3>

            {(() => {
              const channelCounts: Record<string, number> = {};
              combinedActivities.forEach(a => {
                const ch = a.channel || 'CRM Telemetry';
                channelCounts[ch] = (channelCounts[ch] || 0) + 1;
              });
              const totalChEvents = combinedActivities.length;
              const channelList = Object.entries(channelCounts).map(([name, count], idx) => ({
                name,
                events: count.toLocaleString('id-ID'),
                pct: totalChEvents > 0 ? Math.round((count / totalChEvents) * 100) : 0,
                color: ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'][idx % 4]
              }));

              if (channelList.length === 0) {
                return (
                  <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                    Belum ada data distribusi channel.
                  </div>
                );
              }

              return (
                <div className="space-y-2.5">
                  {channelList.map((ch, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{ch.name}</span>
                        <span className="font-mono text-slate-500">{ch.pct}% ({ch.events})</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${ch.color} rounded-full transition-all`} style={{ width: `${ch.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Card 3: AI Swarm Retention Campaign Insights (Seamless & Collapsible) */}
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs transition-all">
            <div 
              onClick={() => setIsAiSwarmOpen(!isAiSwarmOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>AI Swarm Telemetry</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[9px] font-mono font-bold uppercase">
                      ZeroClaw Engine
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Model AI konversi broadcast</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAiSwarmOpen(!isAiSwarmOpen);
                }}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title={isAiSwarmOpen ? 'Tutup Telemetri AI Swarm' : 'Buka Telemetri AI Swarm'}
              >
                {isAiSwarmOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {isAiSwarmOpen && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150 space-y-2">
                <div className="py-4 text-center text-slate-400 text-xs font-semibold space-y-1">
                  <Sparkles size={18} className="mx-auto text-orange-500 opacity-60" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">Siap Menjalankan Kampanye Swarm</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed px-2">
                    Gunakan tombol "Kirim Voucher AI" untuk memulai broadcast retensi otomatis.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
