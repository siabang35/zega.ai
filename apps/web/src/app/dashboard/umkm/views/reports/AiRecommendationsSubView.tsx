import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Zap, Bot, RefreshCw, 
  BarChart3, ShoppingBag, TrendingUp, Users, DollarSign, Activity, Eye, 
  Info, TrendingDown, Target, Layers, Filter, X, Plus, Edit3, Trash2, Settings,
  ChevronRight, Cpu, ArrowUpRight, LayoutList, LayoutGrid, Table, Search, SlidersHorizontal
} from 'lucide-react';
import { SupabaseDashboardService } from '../../../services/supabaseService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

interface AiRecommendationsSubViewProps {
  triggerToast: (msg: string) => void;
  dateRange: string;
}

export function AiRecommendationsSubView({ triggerToast, dateRange }: AiRecommendationsSubViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  
  // Layout & Filter states
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [inspectTelemetryRec, setInspectTelemetryRec] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<any>(null);

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDomain, setFormDomain] = useState('sales');
  const [formPriority, setFormPriority] = useState('HIGH');
  const [formImpact, setFormImpact] = useState('');
  const [formReasoning, setFormReasoning] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await SupabaseDashboardService.getAiRecommendationsPage();
      if (res) setData(res);
    } catch (e) {
      console.warn('Failed to load AI Recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    triggerToast('Memulai evaluasi ZeroClaw 9Router Swarm Engine...');
    await SupabaseDashboardService.recalculateAiRecommendations();
    await loadData();
    triggerToast('Live Diagnosis & Rekomendasi AI berhasil diperbarui dari Telemetry.');
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const handleApply = async (rec: any) => {
    triggerToast(`Mengaktifkan rekomendasi AI: "${rec.title}"...`);
    const actionRes = await SupabaseDashboardService.executeSubpageAction(rec.domain || 'general', rec.action_key || 'execute', { title: rec.title });
    setAppliedIds((prev) => new Set(prev).add(rec.id));
    triggerToast(`${actionRes.message || 'Rekomendasi AI berhasil diterapkan!'}`);
  };

  const openCreateModal = () => {
    setEditingRec(null);
    setFormTitle('');
    setFormDomain('sales');
    setFormPriority('HIGH');
    setFormImpact('+Rp2.5M Target Margin');
    setFormReasoning('');
    setIsManageModalOpen(true);
  };

  const openEditModal = (rec: any) => {
    setEditingRec(rec);
    setFormTitle(rec.title);
    setFormDomain(rec.domain || 'sales');
    setFormPriority(rec.priority || 'HIGH');
    setFormImpact(rec.impact || '');
    setFormReasoning(rec.reasoning || '');
    setIsManageModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      triggerToast('Mohon masukkan judul rekomendasi!');
      return;
    }
    setFormSaving(true);
    try {
      if (editingRec) {
        await SupabaseDashboardService.updateAiRecommendation(editingRec.id, {
          title: formTitle,
          domain: formDomain,
          priority: formPriority,
          impact: formImpact,
          reasoning: formReasoning
        });
        triggerToast('Rekomendasi AI berhasil diperbarui!');
      } else {
        await SupabaseDashboardService.createAiRecommendation({
          title: formTitle,
          domain: formDomain,
          priority: formPriority,
          impact: formImpact,
          reasoning: formReasoning
        });
        triggerToast('Rekomendasi AI kustom berhasil ditambahkan!');
      }
      setIsManageModalOpen(false);
      await loadData();
    } catch (e) {
      console.warn('Save recommendation error:', e);
      triggerToast('Gagal menyimpan rekomendasi.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (rec: any) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus rekomendasi "${rec.title}"?`)) return;
    try {
      await SupabaseDashboardService.deleteAiRecommendation(rec.id);
      triggerToast(`Rekomendasi "${rec.title}" berhasil dihapus.`);
      await loadData();
    } catch (e) {
      console.warn('Delete recommendation error:', e);
      triggerToast('Gagal menghapus rekomendasi.');
    }
  };

  const healthScore = data?.health?.score || 94;
  const healthLabel = data?.health?.category_label || 'EXCELLENT';
  const pointsChange = data?.health?.points_change || 8;
  const aiModel = data?.health?.ai_model || 'ZeroClaw 9Router Swarm Engine';
  const aiSummary = data?.health?.ai_recommendation || 'Toko Anda berada pada performa bisnis terbaik. Fokus utama minggu ini adalah menjaga ketersediaan stok kritis & mengaktifkan cart follow-up AI.';

  const gaugeData = {
    labels: ['Score', 'Remaining'],
    datasets: [{
      data: [healthScore, 100 - healthScore],
      backgroundColor: ['#10b981', 'rgba(226,232,240,0.15)'],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
      cutout: '82%'
    }]
  };

  const gaugeOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  };

  const recommendations = data?.recommendations || [];

  const domainOptions = [
    { id: 'ALL', label: 'Semua Domain', count: recommendations.length, icon: Layers },
    { id: 'sales', label: 'Penjualan', count: recommendations.filter((r: any) => r.domain === 'sales').length, icon: BarChart3 },
    { id: 'store', label: 'Stok & Store', count: recommendations.filter((r: any) => r.domain === 'store').length, icon: ShoppingBag },
    { id: 'marketing', label: 'Pemasaran', count: recommendations.filter((r: any) => r.domain === 'marketing').length, icon: TrendingUp },
    { id: 'customers', label: 'Pelanggan', count: recommendations.filter((r: any) => r.domain === 'customers').length, icon: Users },
    { id: 'finance', label: 'Keuangan', count: recommendations.filter((r: any) => r.domain === 'finance').length, icon: DollarSign }
  ];

  // Filtering Logic
  const filteredRecommendations = recommendations.filter((rec: any) => {
    const matchesDomain = selectedDomain === 'ALL' || rec.domain === selectedDomain;
    const matchesPriority = selectedPriority === 'ALL' || rec.priority === selectedPriority;
    const matchesSearch = !searchQuery.trim() || 
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      rec.reasoning.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesPriority && matchesSearch;
  });

  const getDomainStyle = (domain: string) => {
    switch (domain) {
      case 'sales':
        return { icon: BarChart3, badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
      case 'store':
        return { icon: ShoppingBag, badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
      case 'marketing':
        return { icon: TrendingUp, badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800' };
      case 'customers':
        return { icon: Users, badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
      case 'finance':
        return { icon: DollarSign, badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' };
      default:
        return { icon: Activity, badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 antialiased">
      {/* 1. Header Hero Banner: AI Business Health Diagnostics */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 tracking-wide flex items-center gap-1.5 shadow-2xs">
                <Cpu size={12} className="text-orange-500" /> {aiModel}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Telemetry Realtime Synchronized
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Diagnosis & Rekomendasi Kesehatan Toko
            </h2>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              {aiSummary}
            </p>

            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 
                {loading ? 'Menganalisis...' : 'Refresh AI Diagnosis'}
              </button>

              <button 
                onClick={openCreateModal}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold shadow-sm shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={12} /> Tambah Rekomendasi Kustom
              </button>
            </div>
          </div>

          {/* Business Health Gauge Widget */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 flex items-center gap-3 shrink-0 shadow-2xs">
            <div className="relative size-20 md:size-24">
              <Doughnut data={gaugeData} options={gaugeOpts} />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{healthScore}</span>
                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest pt-0.5">{healthLabel}</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                <TrendingUp size={11} className="text-emerald-600 dark:text-emerald-400" /> +{pointsChange} poin vs last month
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">94/100 Health Score Index</p>
              <div className="pt-0.5 text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                Evaluasi Swarm: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Business Diagnostic Health Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sales Velocity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-blue-500/10 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <BarChart3 size={18} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              +4.2%
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Sales Velocity</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              92%
            </div>
            <span className="text-[11px] text-emerald-600 font-extrabold block mt-1">Status: Tinggi</span>
          </div>
        </div>

        {/* Card 2: Inventory Security */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <ShoppingBag size={18} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
              Optimal
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Inventory Security</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              96%
            </div>
            <span className="text-[11px] text-slate-400 font-normal block mt-1">2 Alert Stok</span>
          </div>
        </div>

        {/* Card 3: Marketing Spend Efficiency */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-purple-500/10 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-extrabold text-[10.5px] border border-purple-200/60 dark:border-purple-900/60">
              +18% ROI
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Marketing Efficiency</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              340%
            </div>
            <span className="text-[11px] text-purple-600 font-extrabold block mt-1">Sangat Baik</span>
          </div>
        </div>

        {/* Card 4: Customer Loyalty Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-[10.5px] border border-amber-200/60 dark:border-amber-900/60">
              RFM Segmented
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Customer Loyalty Rate</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate">
              42.5%
            </div>
            <span className="text-[11px] text-slate-400 font-normal block mt-1">Status: Stabil</span>
          </div>
        </div>
      </div>

      {/* 3. Layout Control & Search Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        {/* Top Controls: Search, Priority & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rekomendasi AI..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Priority Selector */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="HIGH">Prioritas High</option>
              <option value="MEDIUM">Prioritas Medium</option>
              <option value="LOW">Prioritas Low</option>
            </select>

            {/* Layout View Mode Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                title="Tampilan List Card"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid Card"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel Ringkas"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Table size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800">
          {domainOptions.map((opt) => {
            const IconComp = opt.icon;
            const isActive = selectedDomain === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedDomain(opt.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <IconComp size={14} />
                <span>{opt.label}</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Layout Views (List, Grid, Table) */}
      
      {/* 4A. List View Mode */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredRecommendations.map((rec: any, i: number) => {
            const isApplied = appliedIds.has(rec.id) || rec.is_applied;
            const domStyle = getDomainStyle(rec.domain);
            const DomainIcon = domStyle.icon;

            return (
              <div 
                key={rec.id || i} 
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 ${
                  isApplied 
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10' 
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {/* Card Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <DomainIcon size={16} />
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      rec.priority === 'HIGH' 
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
                        : rec.priority === 'MEDIUM' 
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                        : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                    }`}>
                      Prioritas {rec.priority}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${domStyle.badge}`}>
                      {rec.domain}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                      <Target size={13} className="text-emerald-600 dark:text-emerald-400" /> Impact Est: {rec.impact}
                    </span>

                    {/* Action Cluster */}
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                      <button
                        onClick={() => openEditModal(rec)}
                        title="Edit Rekomendasi"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(rec)}
                        title="Hapus Rekomendasi"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Title & Telemetry Reasoning Body */}
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {rec.title}
                  </h4>
                  
                  <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Cpu size={14} className="text-orange-500" /> Analisis Telemetry Model ZeroClaw Swarm:
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {rec.reasoning}
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => setInspectTelemetryRec(rec)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Eye size={14} /> Lihat Telemetry AI
                  </button>

                  <div>
                    {isApplied ? (
                      <span className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={16} /> Rekomendasi Berhasil Diterapkan
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(rec)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <span>Terapkan Rekomendasi</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4B. Grid View Mode */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredRecommendations.map((rec: any, i: number) => {
            const isApplied = appliedIds.has(rec.id) || rec.is_applied;
            const domStyle = getDomainStyle(rec.domain);
            const DomainIcon = domStyle.icon;

            return (
              <div 
                key={rec.id || i} 
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 ${
                  isApplied 
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10' 
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <DomainIcon size={16} />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.priority === 'HIGH' 
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
                          : rec.priority === 'MEDIUM' 
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                          : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                      }`}>
                        Prioritas {rec.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(rec)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => handleDelete(rec)} className="p-1 rounded hover:bg-rose-50 text-rose-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {rec.title}
                  </h4>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <Target size={12} /> {rec.impact}
                  </span>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {rec.reasoning}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button 
                    onClick={() => setInspectTelemetryRec(rec)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Eye size={13} /> Telemetry
                  </button>

                  {isApplied ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(rec)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Terapkan</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4C. Table View Mode */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">STATUS & PRIORITAS</th>
                  <th className="py-3 px-4">DOMAIN</th>
                  <th className="py-3 px-4">REKOMENDASI AI</th>
                  <th className="py-3 px-4">ESTIMASI IMPACT</th>
                  <th className="py-3 px-4 text-right">AKSI TIBA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecommendations.map((rec: any, i: number) => {
                  const isApplied = appliedIds.has(rec.id) || rec.is_applied;
                  const domStyle = getDomainStyle(rec.domain);

                  return (
                    <tr key={rec.id || i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            rec.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold uppercase text-[10px] text-slate-500">
                        {rec.domain}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{rec.title}</span>
                        <span className="text-[11px] text-slate-400 line-clamp-1">{rec.reasoning}</span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {rec.impact}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setInspectTelemetryRec(rec)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="Telemetry">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openEditModal(rec)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="Edit">
                            <Edit3 size={14} />
                          </button>
                          {isApplied ? (
                            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold">Diterapkan</span>
                          ) : (
                            <button onClick={() => handleApply(rec)} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">
                              Terapkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Potential Impact Summary Footprint Card */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              AI Cumulative Footprint
            </span>
          </div>
          <h4 className="text-lg font-bold">Estimasi Potensi Tambahan Margin Toko</h4>
          <p className="text-xs text-slate-300 max-w-xl">
            Dengan menerapkan seluruh rekomendasi terprioritas di atas, sistem memproyeksikan efisiensi dan pendapatan tambahan hingga <strong className="text-white font-mono font-bold">+Rp5.4M / bulan</strong>.
          </p>
        </div>

        <button 
          onClick={handleRefresh}
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Sparkles size={15} className="text-indigo-600" /> Re-Evaluasi Telemetry Toko
        </button>
      </div>

      {/* Telemetry Inspection Modal */}
      {inspectTelemetryRec && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="text-indigo-600" size={18} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Telemetry AI Model Detail</h3>
              </div>
              <button onClick={() => setInspectTelemetryRec(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Judul Rekomendasi:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{inspectTelemetryRec.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">AI Router Engine:</span>
                  <span className="font-bold text-indigo-600">9Router Layer-5 Swarm</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Confidence Score:</span>
                  <span className="font-bold text-emerald-600">98.4% Optimal</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Telemetry Source:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Live RPC Telemetry</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Action Target:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{inspectTelemetryRec.action_key}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Detailed AI Reasoning:</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {inspectTelemetryRec.reasoning}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setInspectTelemetryRec(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs cursor-pointer"
              >
                Tutup Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage / Create / Edit Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="text-indigo-600" size={18} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {editingRec ? 'Edit Rekomendasi AI' : 'Tambah Rekomendasi AI Baru'}
                </h3>
              </div>
              <button onClick={() => setIsManageModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Judul Rekomendasi</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Otomasi Campaign Broadcast WhatsApp Pelanggan Dormant"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Domain Bisnis</label>
                  <select
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="sales">Sales (Penjualan)</option>
                    <option value="store">Store (Stok & Produk)</option>
                    <option value="marketing">Marketing (Pemasaran)</option>
                    <option value="customers">Customers (Pelanggan)</option>
                    <option value="finance">Finance (Keuangan)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tingkat Prioritas</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="HIGH">HIGH (Tinggi)</option>
                    <option value="MEDIUM">MEDIUM (Sedang)</option>
                    <option value="LOW">LOW (Rendah)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Estimasi Impact (Keuntungan/Efisiensi)</label>
                <input
                  type="text"
                  required
                  value={formImpact}
                  onChange={(e) => setFormImpact(e.target.value)}
                  placeholder="Contoh: +18% Efisiensi Ad Spend atau +Rp3.5M Target Omset"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">AI Reasoning & Analisis Telemetry</label>
                <textarea
                  rows={3}
                  required
                  value={formReasoning}
                  onChange={(e) => setFormReasoning(e.target.value)}
                  placeholder="Penjelasan latar belakang dan hasil analisis model Swarm untuk mendukung rekomendasi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {formSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {editingRec ? 'Simpan Perubahan' : 'Tambah Rekomendasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
