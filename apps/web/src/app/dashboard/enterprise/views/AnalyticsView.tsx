import React, { useState } from 'react';
import { 
  BarChart3, Calendar, SlidersHorizontal, Sparkles, 
  ArrowUpRight, ArrowDownRight, Bot, Activity, CheckCircle2, ChevronDown
} from 'lucide-react';

interface AnalyticsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AnalyticsView({ onTriggerToast }: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState<string>('Last 7 days');
  const [compareEnabled, setCompareEnabled] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400 size-6" />
            Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights and performance metrics across your AI operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Compare Toggle */}
          <button 
            onClick={() => setCompareEnabled(!compareEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              compareEnabled
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>Compare</span>
            <span className={`size-2 rounded-full ${compareEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
          </button>

          {/* Filters */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          {/* Customize Dashboard Action */}
          <button 
            onClick={() => onTriggerToast?.('Dashboard Customizer dibuka')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Sparkles size={14} />
            <span>Customize Dashboard</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS (6 Sparkline Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total AI Requests */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total AI Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">1.24M</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +26.4%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          {/* Sparkline */}
          <svg className="w-full h-7 mt-1 stroke-indigo-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 18 Q 15 10, 30 15 T 60 8 T 80 12 T 100 5" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 2: Successful Requests */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Successful Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">1.18M</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +26.1%
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">95.2% success rate</span>
          <svg className="w-full h-7 mt-1 stroke-emerald-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 20 Q 20 12, 40 16 T 70 6 T 100 4" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 3: Total Workflows */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Workflows</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">634</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +14.2%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-cyan-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 15 Q 25 22, 50 10 T 75 14 T 100 6" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 4: Active Agents */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Agents</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">128</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +18.7%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-purple-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 19 Q 20 8, 45 15 T 70 7 T 100 3" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 5: Avg. Response Time */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg. Response Time</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">2.43s</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -9.1%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-amber-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 6 Q 30 18, 60 12 T 100 20" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 6: Tokens Processed */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tokens Processed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">21.6B</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +32.5%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 7 days</span>
          <svg className="w-full h-7 mt-1 stroke-pink-500" fill="none" viewBox="0 0 100 25">
            <path d="M 0 22 Q 25 14, 50 18 T 80 5 T 100 2" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* MAIN CHARTS SECTION (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3 width): Requests Over Time Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Requests Over Time
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="size-2.5 rounded-full bg-indigo-500" /> Total Requests
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-2.5 rounded-full bg-emerald-500" /> Successful Requests
              </span>
            </div>
          </div>

          {/* Interactive SVG Chart Container */}
          <div className="relative h-56 w-full pt-4">
            <svg className="size-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="190" x2="700" y2="190" stroke="#E2E8F0" className="dark:stroke-slate-800" />

              {/* Total Requests Line (Indigo) */}
              <path 
                d="M 0 120 C 100 80, 200 130, 300 60 C 400 90, 500 40, 600 70 L 700 30" 
                fill="none" 
                stroke="#6366F1" 
                strokeWidth="2.5" 
              />

              {/* Successful Requests Line (Emerald) */}
              <path 
                d="M 0 145 C 100 105, 200 150, 300 80 C 400 110, 500 55, 600 85 L 700 45" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="2.5" 
              />
            </svg>

            {/* Timeline X-Axis Labels */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>May 20</span>
              <span>May 21</span>
              <span>May 22</span>
              <span>May 23</span>
              <span>May 24</span>
              <span>May 25</span>
              <span>May 26</span>
              <span>May 27</span>
            </div>
          </div>
        </div>

        {/* Right (1/3 width): Top Agents by Requests Progress Ranking */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Top Agents by Requests
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Sales Agent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bot size={13} className="text-indigo-600" /> Sales Agent
                </span>
                <span className="font-mono text-slate-400">245K <span className="text-slate-500 font-semibold">(19.8%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full w-[80%]" />
              </div>
            </div>

            {/* Support Agent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bot size={13} className="text-indigo-500" /> Support Agent
                </span>
                <span className="font-mono text-slate-400">198K <span className="text-slate-500 font-semibold">(16.0%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[65%]" />
              </div>
            </div>

            {/* Finance Agent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bot size={13} className="text-purple-500" /> Finance Agent
                </span>
                <span className="font-mono text-slate-400">176K <span className="text-slate-500 font-semibold">(14.2%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-[55%]" />
              </div>
            </div>

            {/* Research Agent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bot size={13} className="text-emerald-500" /> Research Agent
                </span>
                <span className="font-mono text-slate-400">153K <span className="text-slate-500 font-semibold">(12.3%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
              </div>
            </div>

            {/* Marketing Agent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bot size={13} className="text-pink-500" /> Marketing Agent
                </span>
                <span className="font-mono text-slate-400">128K <span className="text-slate-500 font-semibold">(10.3%)</span></span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full w-[38%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Col 1: Requests by Channel Donut */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Requests by Channel
          </h3>

          <div className="flex items-center justify-center py-2 relative">
            <svg className="size-28 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.8" className="dark:stroke-slate-800" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="3.8" strokeDasharray="42.4, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="3.8" strokeDasharray="28.7, 100" strokeDashoffset="-42.4" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8B5CF6" strokeWidth="3.8" strokeDasharray="15.3, 100" strokeDashoffset="-71.1" />
            </svg>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-indigo-500" /> Web App
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">42.4% <span className="text-slate-400 text-[10px] font-normal">(525.7K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-blue-500" /> API
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">28.7% <span className="text-slate-400 text-[10px] font-normal">(355.8K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-purple-500" /> Mobile App
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">15.3% <span className="text-slate-400 text-[10px] font-normal">(189.7K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500" /> WhatsApp
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">7.8% <span className="text-slate-400 text-[10px] font-normal">(96.7K)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" /> Other
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">5.8% <span className="text-slate-400 text-[10px] font-normal">(71.9K)</span></span>
            </div>
          </div>
        </div>

        {/* Col 2: Workflow Executions Stacked Bar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Workflow Executions
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1 text-rose-500">
                <span className="size-2 rounded-full bg-rose-500" /> Failed
              </span>
            </div>
          </div>

          {/* Stacked Bars Timeline */}
          <div className="h-36 flex items-end justify-between gap-1.5 pt-4">
            {[
              { day: 'May 20', c: 80, f: 5 },
              { day: 'May 21', c: 92, f: 3 },
              { day: 'May 22', c: 75, f: 8 },
              { day: 'May 23', c: 110, f: 4 },
              { day: 'May 24', c: 88, f: 6 },
              { day: 'May 25', c: 95, f: 2 },
              { day: 'May 26', c: 105, f: 5 },
              { day: 'May 27', c: 120, f: 4 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5 h-28 justify-end">
                  <div style={{ height: `${bar.f * 0.5}px` }} className="w-full bg-rose-500 rounded-t-xs" />
                  <div style={{ height: `${bar.c * 0.7}px` }} className="w-full bg-emerald-500 rounded-b-xs" />
                </div>
                <span className="text-[8px] font-mono text-slate-400 truncate">{bar.day.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: System Health Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              System Health
            </h3>
            <button className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'API Gateway', uptime: '99.99%', status: 'Healthy' },
              { name: 'Vector Database', uptime: '99.98%', status: 'Healthy' },
              { name: 'Redis Cache', uptime: '99.96%', status: 'Healthy' },
              { name: 'MCP Servers', uptime: '99.94%', status: 'Healthy' },
              { name: 'LLM Providers', uptime: '99.90%', status: 'Healthy' },
            ].map((sys, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-emerald-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{sys.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[10px]">{sys.uptime}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                    {sys.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
