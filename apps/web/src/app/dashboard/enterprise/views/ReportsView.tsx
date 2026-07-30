import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Calendar, Filter, Download, 
  RefreshCw, CheckCircle2, Clock, Sparkles, ChevronDown, MoreVertical, Eye
} from 'lucide-react';

interface ReportsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function ReportsView({ onTriggerToast }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'scheduled' | 'shared'>('my');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const reportTemplates = [
    {
      id: 'exec_summary',
      name: 'Executive Summary',
      desc: 'High-level overview of all AI operations and metrics.',
      schedule: 'Daily',
      next: 'May 28, 2025',
      badgeColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
    },
    {
      id: 'cost_analysis',
      name: 'Cost Analysis',
      desc: 'Detailed cost breakdown and trends by provider.',
      schedule: 'Weekly',
      next: 'May 28, 2025',
      badgeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
    },
    {
      id: 'usage_report',
      name: 'Usage Report',
      desc: 'AI usage and token consumption trends across agents.',
      schedule: 'Daily',
      next: 'May 27, 2025',
      badgeColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
    },
    {
      id: 'perf_report',
      name: 'Performance Report',
      desc: 'System performance metrics, latency, and uptime.',
      schedule: 'Weekly',
      next: 'May 28, 2025',
      badgeColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
    },
    {
      id: 'sec_report',
      name: 'Security Report',
      desc: 'Security events, compliance logs, and threat mitigations.',
      schedule: 'Weekly',
      next: 'May 28, 2025',
      badgeColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
    }
  ];

  const reportRows = [
    {
      name: 'Executive Summary - May 2025',
      type: 'Executive',
      status: 'Completed',
      schedule: 'Weekly',
      lastGenerated: 'May 21, 2025 09:30 AM',
    },
    {
      name: 'Cost Analysis - May 2025',
      type: 'Cost',
      status: 'Completed',
      schedule: 'Weekly',
      lastGenerated: 'May 21, 2025 08:00 AM',
    },
    {
      name: 'Usage Report - May 27, 2025',
      type: 'Usage',
      status: 'Completed',
      schedule: 'Daily',
      lastGenerated: 'May 21, 2025 09:30 AM',
    },
    {
      name: 'Performance Report - Week 21',
      type: 'Performance',
      status: 'Completed',
      schedule: 'Weekly',
      lastGenerated: 'May 21, 2025 07:30 AM',
    },
    {
      name: 'Security Report - May 2025',
      type: 'Security',
      status: 'Completed',
      schedule: 'Weekly',
      lastGenerated: 'May 21, 2025 06:00 AM',
    },
    {
      name: 'Custom Agent Report',
      type: 'Custom',
      status: 'Processing',
      schedule: 'On-Demand',
      lastGenerated: '-',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400 size-6" />
            Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and analyze comprehensive reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          {/* All Types */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>All Types</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* All Reports */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>All Reports</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400" />
            <span>Last 30 days</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Create Report Primary Action */}
          <button 
            onClick={() => onTriggerToast?.('Buat Laporan Baru')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Plus size={15} />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* FEATURED REPORT TEMPLATES GRID (5 Cards Grid/Carousel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {reportTemplates.map((tpl) => (
          <div 
            key={tpl.id}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2 shadow-2xs group flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${tpl.badgeColor}`}>
                  {tpl.name.split(' ')[0]}
                </span>
                <span className="size-2 rounded-full bg-indigo-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {tpl.name}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {tpl.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Schedule: <strong className="text-slate-700 dark:text-slate-300">{tpl.schedule}</strong></span>
              <span>Next: {tpl.next.split(',')[0]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT SECTION (2 Columns: Left 2/3 Table, Right 1/3 Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2/3 width): Reports Table with Tabs */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          {/* Sub-Tabs Nav */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {[
                { id: 'my', label: 'My Reports' },
                { id: 'scheduled', label: 'Scheduled Reports' },
                { id: 'shared', label: 'Shared Reports' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2 px-3">Report Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Schedule</th>
                  <th className="py-2 px-3">Last Generated</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {reportRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText size={14} className="text-indigo-500 shrink-0" />
                      <span className="truncate">{row.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {row.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9.5px]">
                          <CheckCircle2 size={10} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[9.5px]">
                          <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {row.schedule}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[10.5px]">
                      {row.lastGenerated}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => onTriggerToast?.(`Mengunduh ${row.name}`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={() => onTriggerToast?.(`Membuka preview ${row.name}`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1/3 width): Report Analytics Panel */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Report Analytics
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Reports Generated</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">128</span>
                <span className="text-[9px] font-bold text-emerald-600">+18.7%</span>
              </div>
              <span className="text-[8.5px] text-slate-400">vs last 30 days</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Scheduled Reports</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">24</span>
                <span className="text-[9px] font-bold text-indigo-600">Active</span>
              </div>
              <span className="text-[8.5px] text-slate-400">Auto-generated</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
            <span className="text-[10px] text-slate-400 block font-semibold">Success Rate</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">98.4%</span>
              <span className="text-[9px] font-bold text-emerald-600">+2.3%</span>
            </div>
            <span className="text-[8.5px] text-slate-400">vs last 30 days</span>
          </div>

          {/* Report Types Donut */}
          <div className="pt-2 space-y-2">
            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">Report Types</span>
            <div className="flex items-center justify-center py-2 relative">
              <svg className="size-24 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" className="dark:stroke-slate-800" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="4" strokeDasharray="35, 100" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="28, 100" strokeDashoffset="-35" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray="20, 100" strokeDashoffset="-63" />
              </svg>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-indigo-500" /> Executive</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-emerald-500" /> Cost</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-blue-500" /> Usage</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-purple-500" /> Performance</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-[11px]"><span className="size-2 rounded-full bg-rose-500" /> Security</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER BAR: RECENT ACTIVITY */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-wider">
          Recent Activity
        </span>

        <div className="flex items-center gap-6 overflow-x-auto text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-indigo-500" />
            <span>Executive Summary generated</span>
            <span className="text-slate-400 font-mono text-[10px]">May 21, 2025 09:30 AM</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Cost Analysis generated</span>
            <span className="text-slate-400 font-mono text-[10px]">May 21, 2025 08:00 AM</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span>Security Report scheduled</span>
            <span className="text-slate-400 font-mono text-[10px]">May 21, 2025 07:30 AM</span>
          </div>
        </div>

        <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          View all activity →
        </button>
      </div>
    </div>
  );
}
