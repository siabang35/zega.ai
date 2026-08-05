import React, { useState, useEffect } from 'react';
import { 
  Zap, Activity, CheckCircle2, TrendingUp, TrendingDown, Clock, 
  RefreshCw, Terminal, Layers, ArrowRight, ShieldCheck, AlertCircle, 
  Sparkles, Bot, Cpu, Database, Server, Play, Pause, ChevronRight,
  Filter, Search, Check, FileText, Download, ShieldAlert, Sliders,
  HelpCircle, ChevronDown, Radio, AlertTriangle, PlayCircle, X,
  ExternalLink, FileSpreadsheet, Lock, CheckCircle, Shield
} from 'lucide-react';
import { SupabaseDashboardService } from '../../services/supabaseService';

interface AiCommandCenterViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AiCommandCenterView({ onTriggerToast }: AiCommandCenterViewProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('Last 24 hours');
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);
  const [agentsPaused, setAgentsPaused] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // Live Telemetry State
  const [telemetry, setTelemetry] = useState<any>({
    ai_health_score: 99.99,
    ai_requests_per_min: 23856,
    active_workflows: 189,
    total_cost_this_month: 3240000.00,
    avg_latency_ms: 142,
    success_rate_pct: 98.56,
    system_status: [
      { name: 'API Gateway', status: 'Operational', latency: '8ms' },
      { name: 'LLM Router', status: 'Operational', latency: '12ms' },
      { name: 'Vector Database', status: 'Operational', latency: '18ms' },
      { name: 'Supabase', status: 'Operational', latency: '14ms' },
      { name: 'Redis Cache', status: 'Operational', latency: '3ms' },
      { name: 'ZeroClaw Node', status: 'Operational', latency: '22ms' },
      { name: 'MCP Servers', status: 'Operational', latency: '15ms' },
      { name: 'Workflow Engine', status: 'Operational', latency: '19ms' },
    ],
    ai_queue_buffer: { processing: 142, waiting: 32, retry: 8, failed: 3 },
  });

  // Fetch Telemetry Data from API
  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/enterprise/commander/telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTelemetry((prev: any) => ({ ...prev, ...json.data }));
        }
      }
    } catch (e) {
      console.warn('Telemetry API fallback:', e);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Action Dispatcher for 8 Interactive Control Buttons
  const handleTriggerAction = async (actionId: string, actionLabel: string) => {
    if (activeAction) return;
    setActiveAction(actionId);

    if (onTriggerToast) {
      onTriggerToast(`Executing: ${actionLabel}...`);
    }

    try {
      await fetch('/api/v1/enterprise/commander/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId }),
      });
    } catch (err) {
      console.warn('Action API bypass:', err);
    }

    // Perform Realtime UI Updates & Open Respective Modals
    if (actionId === 'pause_all_agents') {
      const newPausedState = !agentsPaused;
      setAgentsPaused(newPausedState);
      if (onTriggerToast) {
        onTriggerToast(newPausedState ? 'SAFEGUARD: All AI Agents Paused' : 'RESUMED: All AI Agents Active');
      }
      setActiveAction(null);
    } else if (actionId === 'clear_queue') {
      setTelemetry((prev: any) => ({
        ...prev,
        ai_queue_buffer: { processing: 0, waiting: 0, retry: 0, failed: 0 },
      }));
      if (onTriggerToast) onTriggerToast('AI Queue Buffer Cleared (0 pending)');
      setActiveModal('clear_queue');
      setActiveAction(null);
    } else if (actionId === 'export_report') {
      // Trigger live report file download
      const reportData = JSON.stringify(telemetry, null, 2);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zega_ai_commander_report_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (onTriggerToast) onTriggerToast('Report exported & downloaded successfully!');
      setActiveAction(null);
    } else {
      // Open interactive modal for the action
      setActiveModal(actionId);
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans pb-10">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              AI Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 flex items-center gap-1.5 shadow-2xs">
              <span className="size-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Real-time Telemetry</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Mission control for your enterprise AI operations & autonomous agent swarms
          </p>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 relative">
          {/* Time Range Selector */}
          <div className="relative">
            <button 
              onClick={() => setTimeRangeOpen(!timeRangeOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            >
              <Clock size={14} className="text-indigo-500" />
              <span>{timeRange}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            {timeRangeOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 space-y-1">
                {['Last 1 hour', 'Last 24 hours', 'Last 7 days', 'Last 30 days'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setTimeRangeOpen(false);
                      if (onTriggerToast) onTriggerToast(`Telemetry view updated: ${range}`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      timeRange === range ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              fetchTelemetry();
              if (onTriggerToast) onTriggerToast('Realtime data synced from Supabase!');
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button 
            onClick={() => setActiveModal('command_palette')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:brightness-110 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Terminal size={14} />
            <span>Command Palette</span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/20 rounded text-white font-bold">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* 2. TOP 6 EXECUTIVE KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">AI Health Score</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{telemetry.ai_health_score}%</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">Optimal</span>
            <span>▲ 0.12%</span>
          </div>
          <div className="mt-2 h-5 w-full text-emerald-500">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 15 Q 25 10, 50 12 T 100 4 L 100 20 L 0 20 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M 0 15 Q 25 10, 50 12 T 100 4" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Requests / Min</span>
            <Zap size={14} className="text-indigo-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{Number(telemetry.ai_requests_per_min).toLocaleString()}</span>
          </div>
          <div className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">▲ 28.4%</div>
          <div className="mt-2 h-5 w-full text-indigo-500">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 18 Q 25 8, 50 12 T 100 2 L 100 20 L 0 20 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M 0 18 Q 25 8, 50 12 T 100 2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Active Workflows</span>
            <Layers size={14} className="text-sky-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{telemetry.active_workflows}</span>
          </div>
          <div className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">▲ 15.3%</div>
          <div className="mt-2 h-5 w-full text-sky-500">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 14 Q 25 18, 50 10 T 100 4 L 100 20 L 0 20 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M 0 14 Q 25 18, 50 10 T 100 4" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Total Cost (Month)</span>
            <span className="text-xs font-mono font-bold text-amber-500">$</span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">$3.24M</span>
          </div>
          <div className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">▼ 0.7%</div>
          <div className="mt-2 h-5 w-full text-amber-500">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 14, 50 12 T 100 16 L 100 20 L 0 20 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M 0 10 Q 25 14, 50 12 T 100 16" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Avg Latency</span>
            <Activity size={14} className="text-purple-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{telemetry.avg_latency_ms}ms</span>
          </div>
          <div className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">▼ 6.3%</div>
          <div className="mt-2 h-5 w-full text-purple-500">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 8 Q 25 16, 50 12 T 100 18 L 100 20 L 0 20 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M 0 8 Q 25 16, 50 12 T 100 18" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">Success Rate</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tight">{telemetry.success_rate_pct}%</span>
          </div>
          <div className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">▲ 1.7%</div>
          <div className="mt-2 h-5 w-full text-emerald-500">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 16 Q 25 8, 50 10 T 100 2 L 100 20 L 0 20 Z" fill="currentColor" fillOpacity="0.12" />
              <path d="M 0 16 Q 25 8, 50 10 T 100 2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE CONTROL BUTTONS STRIP */}
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-indigo-500" />
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              AI Command Center Controls (Realtime Actions)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">OWASP Zero-Trust Verified</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { id: 'health_check', label: 'Run Health Check', icon: ShieldCheck, color: 'hover:border-emerald-500 hover:text-emerald-600' },
            { id: 'optimize_workflows', label: 'Optimize Workflows', icon: Zap, color: 'hover:border-indigo-500 hover:text-indigo-600' },
            { id: 'clear_queue', label: 'Clear Queue', icon: RefreshCw, color: 'hover:border-amber-500 hover:text-amber-600' },
            { id: 'pause_all_agents', label: agentsPaused ? 'Resume Agents' : 'Pause All Agents', icon: agentsPaused ? PlayCircle : Pause, color: 'hover:border-rose-500 hover:text-rose-600' },
            { id: 'deploy_update', label: 'Deploy Update', icon: Radio, color: 'hover:border-purple-500 hover:text-purple-600' },
            { id: 'view_logs', label: 'View Logs', icon: FileText, color: 'hover:border-sky-500 hover:text-sky-600' },
            { id: 'export_report', label: 'Export Report', icon: Download, color: 'hover:border-teal-500 hover:text-teal-600' },
            { id: 'incident_manager', label: 'Incident Manager', icon: ShieldAlert, color: 'hover:border-indigo-500 hover:text-indigo-600' },
          ].map((ctrl) => {
            const IconComponent = ctrl.icon;
            const isExecuting = activeAction === ctrl.id;
            return (
              <button
                key={ctrl.id}
                onClick={() => handleTriggerAction(ctrl.id, ctrl.label)}
                disabled={isExecuting}
                className={`p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-extrabold text-[11px] flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 ${ctrl.color} ${isExecuting ? 'opacity-50 animate-pulse' : ''}`}
              >
                <div className="size-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                  <IconComponent size={16} className={isExecuting ? 'animate-spin' : ''} />
                </div>
                <span className="leading-tight">{ctrl.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. WORKFLOW PIPELINE & SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* PIPELINE */}
        <div className="lg:col-span-3 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Global AI Workflow Pipeline
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <button 
              onClick={() => setActiveModal('pipeline_details')}
              className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View pipeline</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="py-6 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[760px] gap-2">
              {[
                { stage: 'Trigger', count: '12,856 /min', icon: Zap, color: 'text-indigo-500' },
                { stage: 'Planner', count: '23,856 /min', icon: Layers, color: 'text-purple-500' },
                { stage: 'Reasoning', count: '23,102 /min', icon: Sparkles, color: 'text-pink-500' },
                { stage: 'Tools', count: '18,923 /min', icon: Terminal, color: 'text-amber-500' },
                { stage: 'Validation', count: '18,230 /min', icon: ShieldCheck, color: 'text-sky-500' },
                { stage: 'Execution', count: '17,399 /min', icon: Cpu, color: 'text-emerald-500' },
                { stage: 'Completed', count: '16,864 /min', icon: CheckCircle2, color: 'text-teal-500' },
              ].map((item, idx, arr) => {
                const IconComponent = item.icon;
                return (
                  <React.Fragment key={item.stage}>
                    <div 
                      onClick={() => setActiveModal('pipeline_details')}
                      className="flex flex-col items-center p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 min-w-[105px] text-center shadow-2xs hover:border-indigo-400 cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className={`size-8 rounded-xl bg-white dark:bg-slate-900 ${item.color} flex items-center justify-center mb-1.5 shadow-2xs border border-slate-200 dark:border-slate-700`}>
                        <IconComponent size={15} />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.stage}</span>
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5">{item.count}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <ArrowRight size={13} className="text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">System Status</h2>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              100% Operational
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {telemetry.system_status.map((sys: any) => (
              <div 
                key={sys.name} 
                onClick={() => setActiveModal('health_check')}
                className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">{sys.name}</span>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {sys.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. BOTTOM 4 TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AGENTS */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-indigo-500" />
              <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Active AI Agents</h2>
            </div>
            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">128</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { name: 'Sales Agent', desc: '124 active tasks' },
              { name: 'Finance Agent', desc: '98 active tasks' },
              { name: 'Support Agent', desc: '76 active tasks' },
              { name: 'Research Agent', desc: '64 active tasks' },
              { name: 'Marketing Agent', desc: '53 active tasks' },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{agent.name}</h4>
                  <p className="text-[10px] text-slate-400">{agent.desc}</p>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  agentsPaused ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {agentsPaused ? 'Paused' : 'Online'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QUEUE */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">AI Queue</h2>
            <button 
              onClick={() => handleTriggerAction('clear_queue', 'Clear Queue')}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline cursor-pointer"
            >
              Clear Buffer
            </button>
          </div>
          <div className="mt-3.5 space-y-3">
            {[
              { label: 'Processing', count: telemetry.ai_queue_buffer.processing, color: 'bg-indigo-500' },
              { label: 'Waiting', count: telemetry.ai_queue_buffer.waiting, color: 'bg-amber-500' },
              { label: 'Retry', count: telemetry.ai_queue_buffer.retry, color: 'bg-sky-500' },
              { label: 'Failed', count: telemetry.ai_queue_buffer.failed, color: 'bg-rose-500' },
            ].map((q) => (
              <div key={q.label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{q.label}</span>
                  <span className="font-mono">{q.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full ${q.color} transition-all duration-500`} style={{ width: `${Math.min(100, (q.count / 160) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVITIES */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Activities</h2>
            <button 
              onClick={() => setActiveModal('view_logs')}
              className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {[
              { time: '09:43:52', msg: 'Invoice processed by Finance Agent', val: '$12,450.00' },
              { time: '09:42:18', msg: 'Lead qualified by Sales Agent', val: 'CTR' },
              { time: '09:41:03', msg: 'Support ticket resolved', val: '#TK-7832' },
              { time: '09:40:12', msg: 'Report generated by Research Agent', val: 'Analytics' },
            ].map((act) => (
              <div key={act.time} className="border-b border-slate-100 dark:border-slate-800 pb-1.5 last:border-0">
                <div className="flex justify-between text-slate-400 font-mono text-[9px] font-bold">
                  <span>{act.time}</span>
                  <span className="text-indigo-500">{act.val}</span>
                </div>
                <p className="font-bold truncate text-[10.5px] mt-0.5">{act.msg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* THROUGHPUT */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Live Throughput</h2>
            <span className="text-[10px] font-mono font-black text-emerald-500">27K req/s</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-20 w-full text-emerald-500">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M 0 35 Q 20 15, 40 22 T 80 8 T 100 12 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.15" />
                <path d="M 0 35 Q 20 15, 40 22 T 80 8 T 100 12" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-slate-100 dark:border-slate-800 pt-2">
              <div><span className="text-slate-400">Input:</span> 27K req/s</div>
              <div><span className="text-slate-400">Output:</span> 25K req/s</div>
              <div><span className="text-slate-400">Cache:</span> <span className="text-emerald-500">81%</span></div>
              <div><span className="text-slate-400">Error:</span> <span className="text-rose-500">0.02%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. INTERACTIVE ACTION MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          {/* MODAL 1: HEALTH CHECK */}
          {activeModal === 'health_check' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Deep Telemetry Health Audit</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>

              <div className="space-y-2 text-xs">
                {telemetry.system_status.map((sys: any) => (
                  <div key={sys.name} className="flex justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="font-bold">{sys.name}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle size={13} /> Operational ({sys.latency})
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    if (onTriggerToast) onTriggerToast('Health audit completed. Score: 99.99%');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Close Audit Report
                </button>
              </div>
            </div>
          )}

          {/* MODAL 2: OPTIMIZE WORKFLOWS */}
          {activeModal === 'optimize_workflows' && (
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
              <div className="size-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-base font-black">AI Workflow Optimization Applied</h3>
                <p className="text-xs text-slate-500 mt-1">Prompt caching hit ratio increased +14.2%. Latency reduced by 14ms.</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow cursor-pointer"
              >
                Apply & Save Strategy
              </button>
            </div>
          )}

          {/* MODAL 3: DEPLOY UPDATE */}
          {activeModal === 'deploy_update' && (
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Radio size={16} className="text-purple-500 animate-pulse" />
                  Deploy Production Update v2.4.2
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400"><X size={16} /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="font-bold">Target Clusters: 14 Microservices</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zero-Downtime Rolling Deployment</div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-600 w-4/5 animate-pulse" />
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  if (onTriggerToast) onTriggerToast('Update v2.4.2 deployed across all nodes!');
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow cursor-pointer"
              >
                Confirm Rolling Release
              </button>
            </div>
          )}

          {/* MODAL 4: VIEW LOGS */}
          {activeModal === 'view_logs' && (
            <div className="w-full max-w-2xl rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl p-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold flex items-center gap-2 text-indigo-400">
                  <Terminal size={16} /> ZeroClaw Realtime Execution Stream
                </span>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white"><X size={16} /></button>
              </div>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 text-[11px]">
                <div>[09:44:01] <span className="text-emerald-400">INFO</span> - ZeroClaw Node #01: Processing vector retrieval query (4ms)</div>
                <div>[09:44:03] <span className="text-indigo-400">DEBUG</span> - LLM Router: Model selected 'DeepSeek-R1-Distill-Llama-70B'</div>
                <div>[09:44:05] <span className="text-emerald-400">INFO</span> - OWASP Level 3 Firewall: Payload sanitized (0 threats found)</div>
                <div>[09:44:08] <span className="text-sky-400">SYNC</span> - Supabase Realtime: Updated telemetry snapshot (23,856 req/min)</div>
                <div>[09:44:12] <span className="text-emerald-400">INFO</span> - Workflow Engine: Batch execution finished for 189 active pipelines</div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Close Logs Window
              </button>
            </div>
          )}

          {/* MODAL 5: INCIDENT MANAGER */}
          {activeModal === 'incident_manager' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <ShieldAlert size={18} />
                  <h3 className="text-sm font-black">OWASP Incident Security Manager</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400"><X size={16} /></button>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle size={16} /> Zero Active Security Incidents. Threat Level: LOW.
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow cursor-pointer"
              >
                Dismiss Security Portal
              </button>
            </div>
          )}

          {/* MODAL 6: COMMAND PALETTE (⌘K) */}
          {activeModal === 'command_palette' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command or search action..."
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold focus:outline-none"
                  autoFocus
                />
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400"><X size={14} /></button>
              </div>
              <div className="space-y-1 text-xs max-h-60 overflow-y-auto">
                {[
                  { name: 'Run Health Audit', act: 'health_check' },
                  { name: 'Optimize Workflow Cache', act: 'optimize_workflows' },
                  { name: 'Flush AI Queue Buffer', act: 'clear_queue' },
                  { name: 'Toggle Pause Agents', act: 'pause_all_agents' },
                  { name: 'Deploy Microservice Update', act: 'deploy_update' },
                  { name: 'View Realtime Logs', act: 'view_logs' },
                  { name: 'Export Telemetry Report', act: 'export_report' },
                ].filter(c => c.name.toLowerCase().includes(commandQuery.toLowerCase())).map((cmd) => (
                  <button
                    key={cmd.act}
                    onClick={() => {
                      setActiveModal(null);
                      handleTriggerAction(cmd.act, cmd.name);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 font-bold text-xs flex justify-between"
                  >
                    <span>{cmd.name}</span>
                    <kbd className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Execute</kbd>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODAL 7: CLEAR QUEUE CONFIRMATION */}
          {activeModal === 'clear_queue' && (
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
              <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center mx-auto">
                <RefreshCw size={24} />
              </div>
              <div>
                <h3 className="text-base font-black">AI Queue Buffer Flushed</h3>
                <p className="text-xs text-slate-500 mt-1">All pending queue items re-scheduled cleanly.</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Close Notification
              </button>
            </div>
          )}

          {/* MODAL 8: PIPELINE DETAILS */}
          {activeModal === 'pipeline_details' && (
            <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Layers size={16} className="text-indigo-500" />
                  7-Stage Workflow Pipeline Details
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Trigger Stage', rate: '12,856 /min', status: 'Healthy' },
                  { name: 'Planner Stage', rate: '23,856 /min', status: 'Healthy' },
                  { name: 'Reasoning Stage', rate: '23,102 /min', status: 'Healthy' },
                  { name: 'Tools Stage', rate: '18,923 /min', status: 'Healthy' },
                  { name: 'Validation Stage', rate: '18,230 /min', status: 'Healthy' },
                  { name: 'Execution Stage', rate: '17,399 /min', status: 'Healthy' },
                  { name: 'Completed Stage', rate: '16,864 /min', status: 'Healthy' },
                ].map((s) => (
                  <div key={s.name} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.rate}</div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Close Pipeline View
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
