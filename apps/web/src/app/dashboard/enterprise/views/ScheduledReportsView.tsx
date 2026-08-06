import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Play, Pause, AlertTriangle, Mail, Users, Filter, 
  ChevronDown, MoreVertical, Edit2, Plus, Upload, CheckCircle2, ArrowUpRight, ArrowDownRight, LayoutGrid, List, X, Download, Copy, Trash2, FileCode, RefreshCw
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

interface ScheduledReportsViewProps {
  onTriggerToast?: (msg: string) => void;
  onOpenNewModal?: () => void;
}

export function ScheduledReportsView({ onTriggerToast, onOpenNewModal }: ScheduledReportsViewProps) {
  const triggerToast = (msg: string) => { if (onTriggerToast) onTriggerToast(msg); };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [freqFilter, setFreqFilter] = useState('All Frequencies');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [showAdvancedFilterDrawer, setShowAdvancedFilterDrawer] = useState(false);

  const [kpis, setKpis] = useState({
    total_scheduled: 24, total_scheduled_trend: '+14.3%',
    active_count: 18, active_percentage: '75% of total',
    paused_count: 4, paused_percentage: '16.7% of total',
    failed_count: 2, failed_trend: '-33.3%',
    delivered_count: 126, delivered_trend: '+22.1%',
    recipients_count: 89
  });

  const [schedules, setSchedules] = useState<any[]>([
    { id: '1', name: 'Daily System Audit Summary', subtitle: 'System audit logs and security events', type: 'Audit Logs', typeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', freq: 'Daily', freqTime: '09:00 AM WIB', recipientsCount: 9, recipientsAvatars: ['W', 'S', 'A'], nextRun: 'May 28, 2025 09:00 AM WIB', lastRun: 'May 27, 2025 09:00 AM WIB', status: 'Success', owner: 'Wildan A.', ownerAvatar: 'W', isPaused: false },
    { id: '2', name: 'Weekly Security Report', subtitle: 'Security incidents and compliance overview', type: 'Security', typeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', freq: 'Weekly', freqTime: 'Monday, 08:00', recipientsCount: 6, recipientsAvatars: ['S', 'E'], nextRun: 'Jun 2, 2025 08:00 AM WIB', lastRun: 'May 26, 2025 08:00 AM WIB', status: 'Success', owner: 'Sarah K.', ownerAvatar: 'S', isPaused: false },
    { id: '3', name: 'Monthly Cost Intelligence Report', subtitle: 'AI FinOps and cost optimization insights', type: 'Cost Intelligence', typeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', freq: 'Monthly', freqTime: 'Day 1, 10:00 AM', recipientsCount: 8, recipientsAvatars: ['A', 'W', 'E'], nextRun: 'Jun 1, 2025 10:00 AM WIB', lastRun: 'May 1, 2025 10:00 AM WIB', status: 'Success', owner: 'Alex M.', ownerAvatar: 'A', isPaused: true },
    { id: '4', name: 'AI Agents Performance Report', subtitle: 'Performance metrics of all AI agents', type: 'AI Agents', typeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300', freq: 'Weekly', freqTime: 'Friday, 10:30', recipientsCount: 5, recipientsAvatars: ['E', 'S'], nextRun: 'May 30, 2025 10:30 AM WIB', lastRun: 'May 23, 2025 10:30 AM WIB', status: 'Success', owner: 'Elen R.', ownerAvatar: 'E', isPaused: false },
    { id: '5', name: 'Workflow Execution Report', subtitle: 'Workflow runs and execution status', type: 'Workflow Studio', typeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', freq: 'Daily', freqTime: '07:30 AM WIB', recipientsCount: 3, recipientsAvatars: ['W', 'R'], nextRun: 'May 28, 2025 07:30 AM WIB', lastRun: 'May 27, 2025 07:30 AM WIB', status: 'Success', owner: 'Wildan A.', ownerAvatar: 'W', isPaused: false },
    { id: '6', name: 'MCP Hub Usage Report', subtitle: 'MCP tools usage and statistics', type: 'MCP Hub', typeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', freq: 'Weekly', freqTime: 'Sunday, 09:00', recipientsCount: 2, recipientsAvatars: ['S'], nextRun: 'Jun 1, 2025 09:00 AM WIB', lastRun: 'May 25, 2025 09:00 AM WIB', status: 'Success', owner: 'Sarah K.', ownerAvatar: 'S', isPaused: true },
    { id: '7', name: 'Integration Health Report', subtitle: 'Integration status and error overview', type: 'Integrations', typeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', freq: 'Daily', freqTime: '06:00 AM WIB', recipientsCount: 7, recipientsAvatars: ['A', 'W', 'E'], nextRun: 'May 28, 2025 06:00 AM WIB', lastRun: 'May 27, 2025 06:00 AM WIB', status: 'Failed', owner: 'Alex M.', ownerAvatar: 'A', isPaused: false },
    { id: '8', name: 'Custom Compliance Report', subtitle: 'Custom compliance and audit report', type: 'Custom', typeColor: 'border border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400', freq: 'Monthly', freqTime: 'Day 15, 11:00 AM', recipientsCount: 10, recipientsAvatars: ['E', 'W', 'A'], nextRun: 'Jun 15, 2025 11:00 AM WIB', lastRun: 'May 15, 2025 11:00 AM WIB', status: 'Success', owner: 'Elen R.', ownerAvatar: 'E', isPaused: false }
  ]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const loadRealtimeTelemetry = async () => {
      const data = await enterpriseSupabaseService.getEnterpriseAuditLogsRealtime();
      if (data.schedules && data.schedules.length > 0) {
        setSchedules(data.schedules.map((sch: any) => ({
          id: sch.id,
          name: sch.report_name,
          subtitle: sch.subtitle || 'Automated scheduled report',
          type: sch.report_type,
          typeColor: sch.report_type === 'Security' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
          freq: sch.schedule_frequency,
          freqTime: sch.next_run ? sch.next_run.split(' ').slice(3).join(' ') : '09:00 AM WIB',
          recipientsCount: sch.recipients_count || 5,
          recipientsAvatars: ['W', 'S', 'A'],
          nextRun: sch.next_run || 'May 28, 2025 09:00 AM WIB',
          lastRun: sch.last_run || 'May 27, 2025 09:00 AM WIB',
          status: sch.status || 'Success',
          owner: sch.owner_name || 'Wildan A.',
          ownerAvatar: sch.owner_name ? sch.owner_name.charAt(0) : 'W',
          isPaused: sch.status === 'Paused'
        })));
      }
    };
    loadRealtimeTelemetry();
    unsubscribe = enterpriseSupabaseService.subscribeToAuditLogsRealtime(() => { loadRealtimeTelemetry(); });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const togglePause = (id: string) => {
    setSchedules(schedules.map(sch => {
      if (sch.id === id) {
        const nextState = !sch.isPaused;
        triggerToast(nextState ? `⏸️ Jadwal "${sch.name}" telah di-pause` : `▶️ Jadwal "${sch.name}" diaktifkan kembali`);
        return { ...sch, isPaused: nextState, status: nextState ? 'Paused' : 'Success' };
      }
      return sch;
    }));
  };

  const runNow = (name: string) => {
    triggerToast(`⚡ Laporan "${name}" sedang diproses & dikirim via Cloudflare R2 CDN...`);
  };

  const deleteSchedule = (id: string, name: string) => {
    setSchedules(schedules.filter(sch => sch.id !== id));
    setActiveMenuId(null);
    triggerToast(`🗑️ Scheduled report "${name}" berhasil dihapus`);
  };

  const duplicateSchedule = (sch: any) => {
    const newSch = {
      ...sch,
      id: Date.now().toString(),
      name: `${sch.name} (Copy)`,
      status: 'Success',
      isPaused: false
    };
    setSchedules([newSch, ...schedules]);
    setActiveMenuId(null);
    triggerToast(`📋 Jadwal "${sch.name}" berhasil diduplikasi!`);
  };

  const handleUpdateScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setSchedules(schedules.map(s => s.id === editingSchedule.id ? editingSchedule : s));
    setEditingSchedule(null);
    triggerToast(`✏️ Konfigurasi jadwal "${editingSchedule.name}" berhasil diperbarui!`);
  };

  const filteredSchedules = schedules.filter(sch => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || sch.name.toLowerCase().includes(q) || sch.subtitle.toLowerCase().includes(q) || sch.owner.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Status' || sch.status === statusFilter || (statusFilter === 'Paused' && sch.isPaused);
    const matchesType = typeFilter === 'All Types' || sch.type === typeFilter;
    const matchesFreq = freqFilter === 'All Frequencies' || sch.freq === freqFilter;
    const matchesOwner = ownerFilter === 'All Owners' || sch.owner === ownerFilter;
    return matchesSearch && matchesStatus && matchesType && matchesFreq && matchesOwner;
  });

  // Interactive Chart Data: Delivery & Execution History
  const deliveryTrendData = {
    labels: ['May 20', 'May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      { label: 'Delivered Reports', data: [14, 18, 16, 22, 19, 21, 12, 24], backgroundColor: 'rgba(79, 70, 229, 0.85)', borderColor: '#4F46E5', borderRadius: 6, fill: true },
      { label: 'Failed Reports', data: [1, 0, 1, 2, 0, 1, 0, 0], backgroundColor: 'rgba(239, 68, 68, 0.85)', borderColor: '#EF4444', borderRadius: 6, fill: true }
    ]
  };

  // Interactive Chart Data: Reports Distribution by Type
  const moduleCategories = ['Audit Logs', 'Security', 'Cost Intelligence', 'AI Agents', 'Workflow Studio', 'MCP Hub', 'Integrations', 'Custom'];
  const reportsByTypeData = {
    labels: moduleCategories,
    datasets: [{
      data: [5, 4, 4, 3, 3, 2, 2, 1],
      backgroundColor: ['#6366F1', '#10B981', '#4F46E5', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B', '#F59E0B'],
      borderWidth: 2, borderColor: '#ffffff'
    }]
  };

  const handleDoughnutClick = (event: any, elements: any[]) => {
    if (elements && elements.length > 0) {
      const index = elements[0].index;
      const selectedType = moduleCategories[index];
      setTypeFilter(selectedType);
      triggerToast(`🍩 Filter modul diaktifkan: ${selectedType}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* 6 TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Scheduled Reports */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Total Scheduled Reports</span><div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600"><Calendar size={14} /></div></div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.total_scheduled}</div>
          <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600"><ArrowUpRight size={10} /><span>{kpis.total_scheduled_trend}</span><span className="text-slate-400 font-normal">vs last 7 days</span></div>
        </div>

        {/* 2. Active */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Active</span><div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600"><Play size={14} /></div></div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.active_count}</div>
          <span className="text-[9.5px] text-slate-400 block">{kpis.active_percentage}</span>
        </div>

        {/* 3. Paused */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Paused</span><div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600"><Pause size={14} /></div></div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.paused_count}</div>
          <span className="text-[9.5px] text-slate-400 block">{kpis.paused_percentage}</span>
        </div>

        {/* 4. Failed */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Failed (Last 7 Days)</span><div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600"><AlertTriangle size={14} /></div></div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.failed_count}</div>
          <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600"><ArrowDownRight size={10} /><span>{kpis.failed_trend}</span><span className="text-slate-400 font-normal">vs last 7 days</span></div>
        </div>

        {/* 5. Delivered */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Delivered (Last 7 Days)</span><div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600"><Mail size={14} /></div></div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.delivered_count}</div>
          <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600"><ArrowUpRight size={10} /><span>{kpis.delivered_trend}</span><span className="text-slate-400 font-normal">vs last 7 days</span></div>
        </div>

        {/* 6. Recipients */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center"><span className="text-[11px] font-semibold text-slate-500">Recipients</span><div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600"><Users size={14} /></div></div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{kpis.recipients_count}</div>
          <span className="text-[9.5px] text-slate-400 block">Across all schedules</span>
        </div>
      </div>

      {/* INTERACTIVE VISUALIZATIONS SECTION FOR SCHEDULED REPORTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: Execution & Delivery History */}
        <div className="lg:col-span-8 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Report Execution & Delivery History</h3>
              <p className="text-[10px] text-slate-400">Daily delivery volume & execution success telemetry</p>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              <button onClick={() => setChartMode('bar')} className={`px-2.5 py-0.5 rounded-md cursor-pointer ${chartMode === 'bar' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-500'}`}>Bar</button>
              <button onClick={() => setChartMode('line')} className={`px-2.5 py-0.5 rounded-md cursor-pointer ${chartMode === 'line' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-500'}`}>Line</button>
            </div>
          </div>
          <div className="h-48 w-full">
            {chartMode === 'bar' ? (
              <Bar data={deliveryTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { grid: { color: 'rgba(226, 232, 240, 0.4)' }, ticks: { font: { size: 9 } } } } }} />
            ) : (
              <Line data={deliveryTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { grid: { color: 'rgba(226, 232, 240, 0.4)' }, ticks: { font: { size: 9 } } } } }} />
            )}
          </div>
        </div>

        {/* Panel 2: Reports Distribution by Type (INTERACTIVE DOUGHNUT) */}
        <div className="lg:col-span-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Reports by Module Type</h3>
              <p className="text-[10px] text-slate-400">Click segment or legend to filter table below</p>
            </div>
            {typeFilter !== 'All Types' && (
              <button onClick={() => setTypeFilter('All Types')} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Reset Filter</button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-36 w-36 relative shrink-0 cursor-pointer" title="Click slice to filter table">
              <Doughnut 
                data={reportsByTypeData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  cutout: '72%', 
                  plugins: { legend: { display: false } },
                  onClick: handleDoughnutClick
                }} 
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{filteredSchedules.length}</span>
                <span className="text-[8.5px] font-bold text-slate-400 uppercase">Schedules</span>
              </div>
            </div>
            <div className="space-y-1 text-[10px] font-medium flex-1">
              {[
                { name: 'Audit Logs', count: '5', color: 'bg-indigo-500' },
                { name: 'Security', count: '4', color: 'bg-emerald-500' },
                { name: 'Cost Intelligence', count: '4', color: 'bg-indigo-600' },
                { name: 'AI Agents', count: '3', color: 'bg-blue-500' },
                { name: 'Workflow Studio', count: '3', color: 'bg-purple-500' },
                { name: 'MCP Hub', count: '2', color: 'bg-pink-500' },
                { name: 'Integrations', count: '2', color: 'bg-slate-500' },
                { name: 'Custom', count: '1', color: 'bg-amber-500' }
              ].map((tp, idx) => {
                const isActive = typeFilter === tp.name;
                return (
                  <button 
                    key={idx} 
                    onClick={() => {
                      const nextType = typeFilter === tp.name ? 'All Types' : tp.name;
                      setTypeFilter(nextType);
                      triggerToast(`🍩 Filter modul disesuaikan: ${nextType}`);
                    }}
                    className={`w-full flex items-center justify-between p-1 rounded-lg transition-colors cursor-pointer text-left ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/80 font-bold text-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`size-2 rounded-full shrink-0 ${tp.color}`} />
                      <span className="truncate">{tp.name}</span>
                    </div>
                    <span className="font-mono text-[9.5px] text-slate-500 shrink-0 ml-1">{tp.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" placeholder="Search reports by name, type or owner..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="All Status">All Status</option><option value="Success">Success</option><option value="Failed">Failed</option><option value="Paused">Paused</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="All Types">All Types</option><option value="Audit Logs">Audit Logs</option><option value="Security">Security</option><option value="Cost Intelligence">Cost Intelligence</option><option value="AI Agents">AI Agents</option><option value="Workflow Studio">Workflow Studio</option><option value="MCP Hub">MCP Hub</option><option value="Integrations">Integrations</option><option value="Custom">Custom</option>
          </select>

          <select value={freqFilter} onChange={(e) => setFreqFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="All Frequencies">All Frequencies</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option>
          </select>

          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="All Owners">All Owners</option><option value="Wildan A.">Wildan A.</option><option value="Sarah K.">Sarah K.</option><option value="Alex M.">Alex M.</option><option value="Elen R.">Elen R.</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdvancedFilterDrawer(!showAdvancedFilterDrawer)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
            <Filter size={14} /><span>Filters</span>
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-400'}`}><List size={14} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-400'}`}><LayoutGrid size={14} /></button>
          </div>
        </div>
      </div>

      {/* SCHEDULED REPORTS VIEW: TABLE OR GRID */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">REPORT NAME</th>
                  <th className="py-2.5 px-3">TYPE</th>
                  <th className="py-2.5 px-3">FREQUENCY</th>
                  <th className="py-2.5 px-3">RECIPIENTS</th>
                  <th className="py-2.5 px-3">NEXT RUN</th>
                  <th className="py-2.5 px-3">LAST RUN</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">OWNER</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredSchedules.map((sch) => {
                  const isMenuOpen = activeMenuId === sch.id;
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">{sch.name}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{sch.subtitle}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${sch.typeColor}`}>{sch.type}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{sch.freq}</span>
                        <span className="text-[10px] text-slate-400">{sch.freqTime}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {sch.recipientsAvatars.map((av: string, i: number) => (
                              <div key={i} className="inline-block size-5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                                {av}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">+{sch.recipientsCount - sch.recipientsAvatars.length} recipients</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400 text-[11px]">{sch.nextRun}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-400 text-[10.5px]">{sch.lastRun}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] ${
                          sch.status === 'Success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : sch.status === 'Paused' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {sch.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="size-5 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">{sch.ownerAvatar}</div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{sch.owner}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => runNow(sch.name)} title="Run Now" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><Play size={14} /></button>
                          <button 
                            onClick={() => togglePause(sch.id)} 
                            title={sch.isPaused ? 'Resume' : 'Pause'} 
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                          >
                            {sch.isPaused ? <Play size={14} className="text-emerald-500" /> : <Pause size={14} />}
                          </button>
                          <button onClick={() => setEditingSchedule(sch)} title="Edit Schedule" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><Edit2 size={14} /></button>
                          <button onClick={() => setActiveMenuId(isMenuOpen ? null : sch.id)} title="Options" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"><MoreVertical size={14} /></button>
                        </div>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-10 z-30 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xl text-left space-y-1 animate-in fade-in zoom-in-95 duration-150">
                            <button onClick={() => duplicateSchedule(sch)} className="w-full text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"><Copy size={13} /><span>Duplicate Schedule</span></button>
                            <button onClick={() => { setActiveMenuId(null); triggerToast(`📜 Execution logs untuk "${sch.name}" dimuat`); }} className="w-full text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300"><FileCode size={13} /><span>View Execution Logs</span></button>
                            <button onClick={() => deleteSchedule(sch.id, sch.name)} className="w-full text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 rounded-xl flex items-center gap-2 cursor-pointer"><Trash2 size={13} /><span>Delete Schedule</span></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <span>Showing 1 to {filteredSchedules.length} of {schedules.length} results</span>
            <div className="flex items-center gap-1">
              <button disabled className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 opacity-40">&lt;</button>
              {[1, 2, 3].map((pg) => (
                <button key={pg} onClick={() => setCurrentPage(pg)} className={`px-2.5 py-1 rounded-lg font-bold ${currentPage === pg ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>{pg}</button>
              ))}
              <button onClick={() => setCurrentPage(2)} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">&gt;</button>
            </div>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2 py-0.5 text-xs font-bold cursor-pointer">
              <option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((sch) => (
            <div key={sch.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{sch.name}</h4>
                    <span className="text-[11px] text-slate-400 block">{sch.subtitle}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] ${
                  sch.status === 'Success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'
                }`}>{sch.status}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Frequency</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{sch.freq} ({sch.freqTime})</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${sch.typeColor}`}>{sch.type}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center">{sch.ownerAvatar}</div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sch.owner}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => runNow(sch.name)} className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 cursor-pointer" title="Run Now">
                    <Play size={14} />
                  </button>
                  <button onClick={() => togglePause(sch.id)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 cursor-pointer" title={sch.isPaused ? 'Resume' : 'Pause'}>
                    {sch.isPaused ? <Play size={14} className="text-emerald-500" /> : <Pause size={14} />}
                  </button>
                  <button onClick={() => setEditingSchedule(sch)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 cursor-pointer" title="Edit">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT SCHEDULE MODAL */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateScheduleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">✏️ Edit Scheduled Report</h3>
              <button type="button" onClick={() => setEditingSchedule(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Report Name</label>
                <input type="text" value={editingSchedule.name} onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle / Description</label>
                <input type="text" value={editingSchedule.subtitle} onChange={(e) => setEditingSchedule({ ...editingSchedule, subtitle: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                  <select value={editingSchedule.type} onChange={(e) => setEditingSchedule({ ...editingSchedule, type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {moduleCategories.map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Frequency</label>
                  <select value={editingSchedule.freq} onChange={(e) => setEditingSchedule({ ...editingSchedule, freq: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    <option>Daily</option><option>Weekly</option><option>Monthly</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setEditingSchedule(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">Save Changes</button>
            </div>
          </form>
        </div>
      )}
      {/* ADVANCED FILTER DRAWER MODAL */}
      {showAdvancedFilterDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filter Scheduled Reports</h3>
              </div>
              <button onClick={() => setShowAdvancedFilterDrawer(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {['All Status', 'Success', 'Paused', 'Failed'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold text-[11px] border cursor-pointer ${
                        statusFilter === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Module Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                  <option value="All Types">All Types</option>
                  {moduleCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Frequency</label>
                  <select value={freqFilter} onChange={(e) => setFreqFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    <option value="All Frequencies">All Frequencies</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Report Owner</label>
                  <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    <option value="All Owners">All Owners</option>
                    <option value="Wildan A.">Wildan A.</option>
                    <option value="Sarah K.">Sarah K.</option>
                    <option value="Alex M.">Alex M me</option>
                    <option value="Elen R.">Elen R.</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All Status');
                  setTypeFilter('All Types');
                  setFreqFilter('All Frequencies');
                  setOwnerFilter('All Owners');
                  setSearchQuery('');
                  triggerToast('🔄 Semua filter berhasil di-reset!');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
              >
                Reset All Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdvancedFilterDrawer(false);
                  triggerToast('🔍 Filter jadwal laporan berhasil diterapkan!');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
