import React from 'react';
import { 
  Zap, Activity, CheckCircle2, TrendingUp, TrendingDown, Clock, 
  RefreshCw, Terminal, Layers, ArrowRight, ShieldCheck, AlertCircle, 
  Sparkles, Bot, Cpu, Database, Server, Radio, Play, Pause, ChevronRight,
  Filter, Search, Check
} from 'lucide-react';

interface AiCommandCenterViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AiCommandCenterView({ onTriggerToast }: AiCommandCenterViewProps) {
  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              AI Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Real-time Overview
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time overview of your AI operations
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Clock size={13} className="text-slate-400" />
            <span>Last 24 hours</span>
          </button>
          <button 
            onClick={() => onTriggerToast && onTriggerToast('Refreshing telemetry stream...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} className="text-slate-400" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all">
            <Terminal size={13} />
            <span>Command Palette</span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-indigo-700/60 rounded text-indigo-100">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* TOP 6 KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. AI Health Score */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Health Score</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">99.99%</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="px-1 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-bold">Excellent</span>
            <TrendingUp size={11} />
            <span>▲ 0.12%</span>
          </div>
        </div>

        {/* 2. AI Requests / min */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Requests / min</span>
            <Zap size={14} className="text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">23,856</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={11} />
            <span>▲ 28.4%</span>
          </div>
        </div>

        {/* 3. Active Workflows */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Workflows</span>
            <Layers size={14} className="text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">189</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={11} />
            <span>▲ 15.3%</span>
          </div>
        </div>

        {/* 4. Total Cost (This Month) */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cost (This Month)</span>
            <span className="text-xs font-mono font-bold text-slate-400">$</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">$3.24M</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingDown size={11} className="text-emerald-500" />
            <span>▼ 0.7%</span>
          </div>
        </div>

        {/* 5. Avg Latency */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Latency</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">142ms</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingDown size={11} />
            <span>▼ 6.3%</span>
          </div>
        </div>

        {/* 6. Success Rate */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">98.56%</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={11} />
            <span>▲ 1.7%</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: GLOBAL AI WORKFLOW DIAGRAM & SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* GLOBAL AI WORKFLOW (3 COLS) */}
        <div className="lg:col-span-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Global AI Workflow</h2>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">7 Connected Pipeline Stages</span>
          </div>

          {/* 7 STAGE FLOW NODES */}
          <div className="py-6 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] gap-2">
              {[
                { stage: 'Trigger', count: '12,856 /min', icon: Zap },
                { stage: 'Planner', count: '23,856 /min', icon: Layers },
                { stage: 'Reasoning', count: '23,102 /min', icon: Sparkles },
                { stage: 'Tools', count: '18,923 /min', icon: Terminal },
                { stage: 'Validation', count: '18,230 /min', icon: ShieldCheck },
                { stage: 'Execution', count: '17,399 /min', icon: Cpu },
                { stage: 'Completed', count: '16,864 /min', icon: CheckCircle2 },
              ].map((item, idx, arr) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.stage}>
                    <div className="flex flex-col items-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 min-w-[95px] text-center shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                      <div className="size-8 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-2xs">
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.stage}</span>
                      <span className="text-[9.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{item.count}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="flex items-center text-slate-300 dark:text-slate-700">
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS (1 COL) */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">System Status</h2>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">All Operational</span>
          </div>

          <div className="mt-3 space-y-2.5">
            {[
              { name: 'API Gateway', status: 'Operational' },
              { name: 'LLM Router', status: 'Operational' },
              { name: 'Vector Database', status: 'Operational' },
              { name: 'Supabase', status: 'Operational' },
              { name: 'Redis Cache', status: 'Operational' },
              { name: 'ZeroClaw Node', status: 'Operational' },
              { name: 'MCP Servers', status: 'Operational' },
            ].map((sys) => (
              <div key={sys.name} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{sys.name}</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {sys.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: ACTIVE AGENTS, AI QUEUE, RECENT ACTIVITIES, LIVE THROUGHPUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ACTIVE AGENTS */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Active Agents</h2>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">128</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {[
              { name: 'Sales Agent', status: 'Online', spark: '📈' },
              { name: 'Finance Agent', status: 'Online', spark: '📊' },
              { name: 'Support Agent', status: 'Online', spark: '📉' },
              { name: 'Research Agent', status: 'Online', spark: '📈' },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-indigo-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{agent.name}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{agent.status}</span>
              </div>
            ))}
            <button className="w-full text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1">
              +124 more active agents
            </button>
          </div>
        </div>

        {/* AI QUEUE */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">AI Queue</h2>
            <span className="text-[10px] font-mono text-slate-400">Live Buffer</span>
          </div>
          <div className="mt-3 space-y-3">
            {[
              { label: 'Processing', count: 142, color: 'bg-indigo-500' },
              { label: 'Waiting', count: 32, color: 'bg-amber-500' },
              { label: 'Retry', count: 8, color: 'bg-sky-500' },
              { label: 'Failed', count: 3, color: 'bg-rose-500' },
            ].map((q) => (
              <div key={q.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">{q.label}</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{q.count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full ${q.color}`} style={{ width: `${Math.min(100, (q.count / 150) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITIES */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Activities</h2>
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
          </div>
          <div className="mt-3 space-y-2.5">
            {[
              { time: '09:43:52', msg: 'Invoice processed by Finance Agent', val: '$12,450.00' },
              { time: '09:42:18', msg: 'Lead qualified by Sales Agent', val: 'ACME Corp' },
              { time: '09:41:03', msg: 'Support ticket resolved', val: '#TK-7832' },
              { time: '09:40:12', msg: 'Report generated by Research Agent', val: 'Market Analysis' },
            ].map((act) => (
              <div key={act.time} className="text-[11px] border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[9.5px]">
                  <span>{act.time}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{act.val}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-semibold truncate mt-0.5">{act.msg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE THROUGHPUT */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Live Throughput</h2>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">27K req/s</span>
          </div>
          <div className="mt-3 flex flex-col justify-between h-[120px]">
            {/* SVG Sparkline Area Chart */}
            <svg className="w-full h-20 text-emerald-500 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path
                d="M 0 35 Q 15 20, 30 25 T 60 10 T 80 15 T 100 5 L 100 40 L 0 40 Z"
                fill="currentColor"
                fillOpacity="0.1"
              />
              <path
                d="M 0 35 Q 15 20, 30 25 T 60 10 T 80 15 T 100 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>24:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
