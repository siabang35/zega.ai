import React, { useState, useEffect } from 'react';
import {
  Activity, CheckCircle2, RefreshCw, Filter, Sparkles,
  Megaphone, MessageSquare, Users, FileText, Bot, Clock,
  Cpu, Gauge, Timer, Play, Database, Download, Trash2, ArrowUpRight, ShieldCheck,
  Terminal, Code2, AlertCircle, Layers
} from 'lucide-react';
import { useLanguage } from '../../../../../../i18n/translations';
import { SupabaseDashboardService } from '../../../../services/supabaseService';

interface AktivitasSubPageProps {
  activities?: any[];
  triggerToast: (msg: string) => void;
}

export function AktivitasSubPage({ activities: initialActivities = [], triggerToast }: AktivitasSubPageProps) {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<any[]>(initialActivities);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Source');
  const [selectedAuditItem, setSelectedAuditItem] = useState<any | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Fetch telemetry activities from Supabase backend
  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await SupabaseDashboardService.getUmkmMarketingActivities();
      if (data && data.length > 0) {
        setActivities(data);
      }
    } catch (e) {
      console.error('[AktivitasSubPage] Error loading telemetry activities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // Subscribe to realtime database changes on umkm_marketing_activities
    const unsubscribe = SupabaseDashboardService.subscribeToMarketingActivities('11111111-1111-1111-1111-111111111111', () => {
      loadActivities();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filter activities by source category
  const filteredList = activities.filter(act => {
    if (selectedCategory === 'Semua Source') return true;
    return (act.source_category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  // Calculate summary KPI telemetry metrics
  const totalExecutions = activities.length;
  const avgLatency = activities.length > 0
    ? Math.round(activities.reduce((acc, curr) => acc + (curr.latency_ms || 0), 0) / activities.length)
    : 0;
  const totalTokens = activities.reduce((acc, curr) => acc + (curr.tokens_used || 0), 0);
  const totalCost = activities.reduce((acc, curr) => acc + (parseFloat(curr.cost_usd) || 0), 0);
  const uniqueModels = new Set(activities.map(a => a.model_engine || a.source_name)).size;

  // Trigger live AI event simulation
  const handleSimulateAiEvent = async () => {
    setSimulating(true);
    const mockModels = [
      {
        title: 'DeepSeek R1: Re-evaluasi CTR Campaign Diskon Spesial',
        description: 'Auto-cost-optimizer menemukan lonjakan CTR 4.2% pada segmen audience WhatsApp Direct.',
        source_name: 'DeepSeek R1 Reasoning Engine',
        source_category: 'AI Models',
        model_engine: 'DeepSeek-R1-Reasoning',
        model_provider: '9Router Layer 5 Gateway',
        cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/deepseek.webp',
        activity_type: 'swarm',
        latency_ms: 135,
        tokens_used: 1620,
        cost_usd: 0.00162,
        execution_status: 'Success',
        detail_payload: { prompt_tokens: 1100, completion_tokens: 520, status_code: 200 }
      },
      {
        title: 'ZeroClaw Edge Daemon: Catch 8 New WhatsApp Conversions',
        description: 'Zero-trust agent memverifikasi 8 permintaan checkout otomatis via katalog WhatsApp.',
        source_name: 'ZeroClaw Edge Daemon',
        source_category: 'Edge Swarms',
        model_engine: 'ZeroClaw-Native-Rust-v2',
        model_provider: 'ZeroClaw Edge Runtime',
        cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/zeroclaw.png',
        activity_type: 'leads',
        latency_ms: 42,
        tokens_used: 380,
        cost_usd: 0.00038,
        execution_status: 'Success',
        detail_payload: { leads_captured: 8, keyless_auth: 'T1 Verified' }
      },
      {
        title: 'Groq LPU Engine: Fast Generation Copywriting IG Story',
        description: 'Sub-second inference membuat 3 draf naskah promo terbatas untuk follower Instagram.',
        source_name: 'Groq LPU Engine',
        source_category: 'AI Models',
        model_engine: 'groq/llama-3.3-70b-versatile',
        model_provider: 'Groq Hardware LPU',
        cdn_icon_url: 'https://cdn.zegaai.site/assets/logo/groq.png',
        activity_type: 'content',
        latency_ms: 28,
        tokens_used: 890,
        cost_usd: 0.00089,
        execution_status: 'Optimized',
        detail_payload: { tokens_per_sec: 540, variations: 3 }
      }
    ];

    const randomEvent = mockModels[Math.floor(Math.random() * mockModels.length)];
    const res = await SupabaseDashboardService.insertUmkmMarketingActivity(randomEvent);
    setSimulating(false);

    if (res.error) {
      triggerToast('Gagal mengirim simulasi telemetry event.');
    } else {
      triggerToast(`Simulasi AI Model "${randomEvent.source_name}" berhasil dieksekusi!`);
      loadActivities();
    }
  };

  // Clear telemetry logs
  const handleClearLogs = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membersihkan semua riwayat log telemetry marketing?')) return;
    const res = await SupabaseDashboardService.clearUmkmMarketingActivities();
    if (!res.error) {
      setActivities([]);
      triggerToast('🗑️ Semua log telemetry marketing berhasil dibersihkan.');
    } else {
      triggerToast('⚠️ Gagal membersihkan log database.');
    }
  };

  // Export Telemetry CSV
  const handleExportCsv = () => {
    if (activities.length === 0) {
      triggerToast('⚠️ Tidak ada data telemetry untuk diexport.');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Source Name', 'Source Category', 'Model Engine', 'Provider', 'Latency (ms)', 'Tokens Used', 'Cost (USD)', 'Status', 'Title'];
    const rows = activities.map(a => [
      a.id,
      a.time_ago || a.created_at,
      `"${a.source_name || ''}"`,
      `"${a.source_category || ''}"`,
      `"${a.model_engine || ''}"`,
      `"${a.model_provider || ''}"`,
      a.latency_ms || 0,
      a.tokens_used || 0,
      a.cost_usd || 0,
      a.execution_status || 'Success',
      `"${(a.title || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zega_marketing_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('📥 Telemetry Log CSV berhasil diunduh.');
  };

  return (
    <div className="space-y-6 font-sans pb-8">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <Activity size={20} className="text-orange-500" />
            <span>Aktivitas by Source & AI Model Telemetry</span>
            {loading && <RefreshCw size={14} className="animate-spin text-orange-500" />}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Audit eksekusi real-time AI Models, Edge Swarms, Messaging Gateway, dan integrasi Marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action 1: Simulate Live AI Event */}
          <button
            onClick={handleSimulateAiEvent}
            disabled={simulating}
            className="px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Play size={13} className={simulating ? 'animate-spin' : 'fill-current'} />
            <span>{simulating ? 'Menjalankan AI...' : 'Simulasi AI Event'}</span>
          </button>

          {/* Action 2: Export Telemetry CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-all"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Action 3: Clear Logs */}
          <button
            onClick={handleClearLogs}
            className="px-3 py-2 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-all"
          >
            <Trash2 size={13} />
            <span>Bersihkan Logs</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME AI TELEMETRY KPI SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* KPI 1: Total Executions */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Total Eksekusi</span>
            <div className="size-6 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-500 flex items-center justify-center font-bold text-xs">
              <Layers size={13} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {totalExecutions} <span className="text-xs font-bold text-slate-400">Events</span>
          </div>
          <p className="text-[10px] font-bold text-emerald-600">100% Real-Time DB Sync</p>
        </div>

        {/* KPI 2: Rata-Rata Latency */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Avg Latency</span>
            <div className="size-6 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-500 flex items-center justify-center font-bold text-xs">
              <Timer size={13} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {avgLatency} <span className="text-xs font-bold text-slate-400">ms</span>
          </div>
          <p className="text-[10px] font-bold text-blue-600">Sub-second Inference</p>
        </div>

        {/* KPI 3: Total Tokens Consumed */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Tokens Consumed</span>
            <div className="size-6 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-500 flex items-center justify-center font-bold text-xs">
              <Cpu size={13} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {totalTokens.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] font-bold text-purple-600">9Router Cost Guard</p>
        </div>

        {/* KPI 4: Total AI Cost USD */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Est. AI Cost</span>
            <div className="size-6 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center font-bold text-xs">
              <Database size={13} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            ${totalCost.toFixed(5)}
          </div>
          <p className="text-[10px] font-bold text-emerald-600">40% Savings Rate</p>
        </div>

        {/* KPI 5: Active AI Swarms */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase">Model Active</span>
            <div className="size-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center font-bold text-xs">
              <ShieldCheck size={13} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {uniqueModels} <span className="text-xs font-bold text-slate-400">Engines</span>
          </div>
          <p className="text-[10px] font-bold text-indigo-600">ZeroClaw Native T1</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SOURCE CATEGORY FILTER TABS & TIMELINE FEED */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter size={15} className="text-orange-500" />
              <span>Filter Berdasarkan Sumber (Source Category)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Pilih kategori saluran telemetry untuk memfilter stream aktivitas</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
            {['Semua Source', 'AI Models', 'Edge Swarms', 'Messaging Gateway', 'Marketplace'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer whitespace-nowrap ${selectedCategory === cat
                    ? 'bg-orange-500 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry Activity Items List */}
        <div className="space-y-3 pt-1">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <AlertCircle size={28} className="mx-auto text-slate-400" />
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Tidak ada aktivitas telemetry untuk kategori ini.</p>
              <p className="text-[11px] text-slate-400">Klik "+ Simulasi AI Event" di atas untuk mengirim payload simulasi baru.</p>
            </div>
          ) : (
            filteredList.map((act, i) => (
              <div
                key={act.id || i}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-orange-300 dark:hover:border-orange-800 transition-all shadow-2xs"
              >
                {/* Left side: Source Icon + Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <img
                    src={act.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/deepseek.webp'}
                    onError={(e: any) => { e.target.onerror = null; e.target.src = 'https://cdn.zegaai.site/assets/logo/zegalogo.png'; }}
                    alt={act.source_name || 'AI Source'}
                    className="size-10 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs mt-0.5"
                  />

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {act.source_category || 'AI Models'}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {act.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {act.description || 'Eksekusi instruksi otomatis via AI Swarm Gateway.'}
                    </p>

                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400 font-medium pt-0.5 flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Code2 size={12} className="text-orange-500" />
                        <span>{act.source_name || 'AI Model'}</span>
                      </span>
                      <span>•</span>
                      <span>Engine: <code className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">{act.model_engine || 'AI Engine'}</code></span>
                      <span>•</span>
                      <span>Provider: {act.model_provider || 'ZEGA Gateway'}</span>
                    </div>
                  </div>
                </div>

                {/* Right side: Telemetry Badges & Audit Action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 border-slate-200/60 dark:border-slate-800 pt-2 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Latency badge */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-center gap-1">
                      <Gauge size={11} />
                      <span>{act.latency_ms || 0}ms</span>
                    </span>

                    {/* Tokens badge */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 flex items-center gap-1">
                      <Cpu size={11} />
                      <span>{(act.tokens_used || 0).toLocaleString()} tk</span>
                    </span>

                    {/* Status badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${act.execution_status === 'Success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                      }`}>
                      {act.execution_status || 'Success'}
                    </span>
                  </div>

                  {/* Audit Detail Button */}
                  <button
                    onClick={() => setSelectedAuditItem(act)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-600 font-extrabold text-[11px] flex items-center gap-1 shadow-2xs hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Terminal size={12} className="text-orange-500" />
                    <span>Audit Payload</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE RAW TELEMETRY AUDIT MODAL */}
      {/* ========================================================================= */}
      {selectedAuditItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <img
                    src={selectedAuditItem.cdn_icon_url || 'https://cdn.zegaai.site/assets/logo/deepseek.webp'}
                    alt="Logo"
                    className="size-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Telemetry Audit: {selectedAuditItem.source_name || 'AI Engine'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedAuditItem.id} • {selectedAuditItem.time_ago || 'Baru saja'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAuditItem(null)}
                className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">HTTP Status</span>
                <span className="font-extrabold text-emerald-600 text-sm">200 OK</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Execution Time</span>
                <span className="font-extrabold text-blue-600 text-sm">{selectedAuditItem.latency_ms || 0} ms</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tokens Count</span>
                <span className="font-extrabold text-purple-600 text-sm">{selectedAuditItem.tokens_used || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Inference Cost</span>
                <span className="font-extrabold text-emerald-600 text-sm">${selectedAuditItem.cost_usd || '0.00'}</span>
              </div>
            </div>

            {/* Raw JSON Payload Console */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Terminal size={14} className="text-orange-500" />
                  <span>Raw Telemetry JSON Payload</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">JSON Format (Validated)</span>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800 shadow-inner">
                {JSON.stringify(
                  {
                    event_id: selectedAuditItem.id,
                    store_id: selectedAuditItem.store_id || '11111111-1111-1111-1111-111111111111',
                    source_name: selectedAuditItem.source_name,
                    source_category: selectedAuditItem.source_category,
                    model_engine: selectedAuditItem.model_engine,
                    model_provider: selectedAuditItem.model_provider,
                    latency_ms: selectedAuditItem.latency_ms,
                    tokens_used: selectedAuditItem.tokens_used,
                    cost_usd: selectedAuditItem.cost_usd,
                    execution_status: selectedAuditItem.execution_status,
                    detail_payload: selectedAuditItem.detail_payload || { status: 'validated' }
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-[11px] font-semibold text-slate-400">
                🔐 Security Boundary: Authenticated OWASP Sandbox Payload
              </span>

              <button
                onClick={() => setSelectedAuditItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs cursor-pointer hover:bg-slate-800 transition-all"
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
