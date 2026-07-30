import React, { useState } from 'react';
import { 
  FileText, Search, Calendar, Download, ChevronDown, 
  CheckCircle2, AlertTriangle, Filter, Eye, Code, ArrowUpRight, ArrowDownRight, UserCheck, Shield, Key
} from 'lucide-react';

interface AuditLogsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function AuditLogsView({ onTriggerToast }: AuditLogsViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLogRow, setSelectedLogRow] = useState<number>(0);

  const auditEvents = [
    {
      id: 'evt_217893120408461F912.28',
      time: 'May 27, 2025 14:32:18',
      user: 'wildan@zenith.co.id',
      action: 'Create Workflow',
      resource: 'Customer Support v2.4',
      application: 'Workflow Studio',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Chrome 125.0.0.0 / macOS'
    },
    {
      id: 'evt_217893120408461F912.27',
      time: 'May 27, 2025 14:31:02',
      user: 'finance.admin@zenith.co.id',
      action: 'Update Payment Method',
      resource: 'Visa **** 4242',
      application: 'Payments',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Firefox 126.0 / Windows'
    },
    {
      id: 'evt_217893120408461F912.26',
      time: 'May 27, 2025 14:29:45',
      user: 'api-service@zenith.co.id',
      action: 'API Key Generated',
      resource: 'ZK42-9981',
      application: 'MCP Hub',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'ZEGA CLI 2.4.0'
    },
    {
      id: 'evt_217893120408461F912.25',
      time: 'May 27, 2025 14:08:11',
      user: 'support.agent@zenith.co.id',
      action: 'Delete Document',
      resource: 'RefundPolicy.pdf',
      application: 'Knowledge Hub',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Chrome 125.0.0.0 / macOS'
    },
    {
      id: 'evt_217893120408461F912.24',
      time: 'May 27, 2025 14:01:33',
      user: 'hr.admin@zenith.co.id',
      action: 'Add New User',
      resource: 'jane.doe@zenith.co.id',
      application: 'Security Center',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Safari 17.4 / macOS'
    },
    {
      id: 'evt_217893120408461F912.23',
      time: 'May 27, 2025 14:24:09',
      user: 'marketing@zenith.co.id',
      action: 'Export Report',
      resource: 'Usage Report May 2025',
      application: 'Reports',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Chrome 125.0.0.0 / macOS'
    },
    {
      id: 'evt_217893120408461F912.22',
      time: 'May 27, 2025 14:22:54',
      user: 'system',
      action: 'Role Updated',
      resource: 'Finance Admin',
      application: 'Security Center',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'System Automated Worker'
    },
    {
      id: 'evt_217893120408461F912.21',
      time: 'May 27, 2025 16:21:31',
      user: 'legal@zenith.co.id',
      action: 'Approve Workflow',
      resource: 'Contract Review Flow',
      application: 'Workflow Studio',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Edge 125.0.0.0 / Windows'
    },
    {
      id: 'evt_217893120408461F912.20',
      time: 'May 27, 2025 16:19:22',
      user: 'api-service@zenith.co.id',
      action: 'Webhook Triggered',
      resource: 'Stripe Payment',
      application: 'Integrations',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Stripe-Webhook/v1'
    },
    {
      id: 'evt_217893120408461F912.19',
      time: 'May 27, 2025 16:17:18',
      user: 'security@zenith.co.id',
      action: 'Login',
      resource: 'sec-user@zenith.co.id',
      application: 'Console',
      ip: '103.12.45.67',
      status: 'Success',
      userAgent: 'Chrome 125.0.0.0 / macOS'
    },
  ];

  const selectedLog = auditEvents[selectedLogRow] || auditEvents[0];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400 size-6" />
            Audit Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track and review all system activities and changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          {/* All Actions Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>All Actions</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* All Users Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>All Users</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400" />
            <span>May 20 – May 27, 2025</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </div>

          {/* Export Action */}
          <button 
            onClick={() => onTriggerToast?.('Audit Logs Ekspor Selesai')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* TOP 6 AUDIT KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Events */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Events</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">24,831</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +18.3%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 7 days</span>
        </div>

        {/* Card 2: Critical Events */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Critical Events</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">142</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -6
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 7 days</span>
        </div>

        {/* Card 3: Users */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Users</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">318</span>
          </div>
          <span className="text-[9.5px] text-emerald-600 font-semibold block">Active users</span>
        </div>

        {/* Card 4: Applications */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Applications</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">24</span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">Integrated</span>
        </div>

        {/* Card 5: Data Changes */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Data Changes</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">1,247</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +12.1%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 7 days</span>
        </div>

        {/* Card 6: API Calls */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">API Calls</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">18,734</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +23.4%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 block">vs last 7 days</span>
        </div>
      </div>

      {/* MAIN SECTION (2 Columns: Left 3/4 Audit Log Table, Right 1/4 Log Details Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column (3/4 width): Audit Log Table */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Resource</th>
                  <th className="py-2 px-3">Application</th>
                  <th className="py-2 px-3">IP Address</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {auditEvents.map((evt, idx) => (
                  <tr 
                    key={idx}
                    onClick={() => setSelectedLogRow(idx)}
                    className={`cursor-pointer transition-colors ${
                      selectedLogRow === idx 
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[10.5px]">
                      {evt.time}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                      {evt.user}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                      {evt.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[10.5px]">
                      {evt.resource}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10.5px]">
                      {evt.application}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[10.5px]">
                      {evt.ip}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9.5px]">
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <span>Showing 1 to 10 of 24,831 results</span>

            <div className="flex items-center gap-1.5">
              <button className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-400">&lt;</button>
              <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">2</button>
              <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">3</button>
              <span>...</span>
              <button className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">2,484</button>
              <button className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-400">&gt;</button>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <span>10 / page</span>
            </div>
          </div>
        </div>

        {/* Right Column (1/4 width): Log Details Inspector */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Log Details
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Event ID</span>
              <span className="font-mono text-slate-900 dark:text-slate-100 font-bold text-[10.5px] break-all">{selectedLog.id}</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Action</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLog.action}</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Resource</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.resource}</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Application</span>
              <span className="text-slate-800 dark:text-slate-200">{selectedLog.application}</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">User</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{selectedLog.user}</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">IP Address</span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{selectedLog.ip}</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Time</span>
              <span className="font-mono text-slate-600 dark:text-slate-400 text-[10.5px]">{selectedLog.time} WIB</span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
              <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[9.5px]">
                {selectedLog.status}
              </span>
            </div>

            <div>
              <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block">User Agent</span>
              <span className="font-mono text-slate-500 text-[10px] block truncate">{selectedLog.userAgent}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => onTriggerToast?.(`JSON untuk ${selectedLog.id} disalin`)}
              className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Code size={14} />
              <span>View Full JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
