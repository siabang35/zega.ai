import React, { useState } from 'react';
import { 
  DollarSign, Calendar, Download, Sparkles, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Layers, ChevronDown, CheckCircle2
} from 'lucide-react';

interface CostIntelligenceViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function CostIntelligenceView({ onTriggerToast }: CostIntelligenceViewProps) {
  const [dateRange, setDateRange] = useState<string>('Last 30 days');
  const [groupBy, setGroupBy] = useState<string>('Provider');

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="text-indigo-600 dark:text-indigo-400 size-6" />
            Cost Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track, analyze, and optimize your AI spending.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Group by Provider */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Layers size={14} className="text-slate-400" />
            <span>Group by: {groupBy}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Export Report Action */}
          <button 
            onClick={() => onTriggerToast?.('Laporan Biaya Diunduh')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS (5 Horizontal Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Spend */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Spend</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">$28,430.50</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +14.3%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 30 days</span>
        </div>

        {/* Card 2: Avg Cost per 1K Tokens */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg. Cost per 1K Tokens</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">$0.0187</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -6.2%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 30 days</span>
        </div>

        {/* Card 3: Total Tokens */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Tokens</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">1.52T</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +21.8%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 30 days</span>
        </div>

        {/* Card 4: Cost Savings */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cost Savings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">$4,218.40</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +18.7%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs previous 70 days</span>
        </div>

        {/* Card 5: Budget Utilization */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Budget Utilization</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">72.4%</span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">of $39,250 budget</span>
        </div>
      </div>

      {/* MAIN CHARTS SECTION (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3 width): Spend Over Time Multi-Series Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Spend Over Time
            </h3>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><span className="size-2.5 rounded-full bg-indigo-500" /> OpenAI</span>
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400"><span className="size-2.5 rounded-full bg-purple-500" /> Anthropic</span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><span className="size-2.5 rounded-full bg-blue-500" /> Google</span>
              <span className="flex items-center gap-1 text-amber-500"><span className="size-2.5 rounded-full bg-amber-500" /> Other</span>
            </div>
          </div>

          {/* Multi-series Area Chart */}
          <div className="relative h-56 w-full pt-4">
            <svg className="size-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <line x1="0" y1="40" x2="700" y2="40" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#E2E8F0" strokeDasharray="3 3" className="dark:stroke-slate-800" />
              <line x1="0" y1="190" x2="700" y2="190" stroke="#E2E8F0" className="dark:stroke-slate-800" />

              {/* Stacked area paths */}
              <path d="M 0 190 L 0 130 C 150 110, 300 140, 450 80 L 700 60 L 700 190 Z" fill="#6366F1" fillOpacity="0.2" />
              <path d="M 0 130 C 150 110, 300 140, 450 80 L 700 60" fill="none" stroke="#6366F1" strokeWidth="2.5" />

              <path d="M 0 160 C 150 135, 300 160, 450 110 L 700 95 L 700 190 Z" fill="#8B5CF6" fillOpacity="0.15" />
              <path d="M 0 160 C 150 135, 300 160, 450 110 L 700 95" fill="none" stroke="#8B5CF6" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Apr 28</span>
              <span>May 2</span>
              <span>May 9</span>
              <span>May 16</span>
              <span>May 23</span>
              <span>May 30</span>
            </div>
          </div>
        </div>

        {/* Right (1/3 width): Spend by Provider Donut + Legend */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Spend by Provider
          </h3>

          <div className="flex items-center justify-center py-2 relative">
            <svg className="size-28 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.8" className="dark:stroke-slate-800" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="3.8" strokeDasharray="50, 100" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8B5CF6" strokeWidth="3.8" strokeDasharray="26.9, 100" strokeDashoffset="-50" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="3.8" strokeDasharray="14.8, 100" strokeDashoffset="-76.9" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-slate-900 dark:text-slate-100">$28,430.50</span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase">Total Spend</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-indigo-500" /> OpenAI
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$14,230.40 <span className="text-slate-400 text-[10px] font-normal">(50.0%)</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-purple-500" /> Anthropic
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$7,645.30 <span className="text-slate-400 text-[10px] font-normal">(26.9%)</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-blue-500" /> Google
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$4,218.75 <span className="text-slate-400 text-[10px] font-normal">(14.8%)</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-emerald-500" /> Mistral AI
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$1,234.10 <span className="text-slate-400 text-[10px] font-normal">(4.3%)</span></span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="size-2 rounded-full bg-amber-500" /> Other
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">$1,102.00 <span className="text-slate-400 text-[10px] font-normal">(3.9%)</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Col 1: Top Workflows by Cost */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Top Workflows by Cost
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { name: 'Customer Support Escalation', cost: '$4,230.45', pct: '14.9%' },
              { name: 'Marketing Content Generation', cost: '$3,124.20', pct: '11.0%' },
              { name: 'Financial Report Analysis', cost: '$2,890.60', pct: '10.2%' },
              { name: 'Sales Lead Qualification', cost: '$2,456.30', pct: '8.6%' },
              { name: 'Research & Analysis', cost: '$2,120.80', pct: '7.5%' },
            ].map((wf, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">{wf.name}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{wf.cost}</span>
                  <span className="text-slate-400 text-[10px]">{wf.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Cost Optimization Insights */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Cost Optimization Insights
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-700 dark:text-rose-400">Model Routing Optimization</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">High Impact</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Save up to $1,240/month by routing simple intent classify tasks to Gemini 1.5 Flash.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400">Context Window Optimization</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Medium</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Truncate prompt history to reduce average context window by 15%.
              </p>
            </div>

            <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-700 dark:text-indigo-400">Caching Optimization</span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">Medium</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Promote vector cache hit rate from 42% to 60% with Redis edge TTL.
              </p>
            </div>
          </div>
        </div>

        {/* Col 3: Budget Overview Gauge Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Budget Overview
          </h3>

          <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
            <div className="relative size-24 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="4" strokeDasharray="72.4, 100" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-slate-900 dark:text-slate-100">72.4%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">$28,430.50 spent</p>
              <p className="text-[10px] text-slate-400">of $39,250 monthly budget</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-mono">Resets in 9 days</span>
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
