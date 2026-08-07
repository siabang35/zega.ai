import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  AlertTriangle,
  Bug,
  Users,
  CheckCircle,
  Clock,
  Code
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } }
};

export interface ErrorLogEntry {
  id: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low';
  service: string;
  error_type: string;
  message: string;
  occurrences_count: number;
  affected_users_count: number;
  status: 'Open' | 'Investigating' | 'Resolved';
  environment: string;
}

interface ErrorLogsTabProps {
  logs?: ErrorLogEntry[];
  onTriggerToast?: (msg: string) => void;
}

export function ErrorLogsTab({ logs: propLogs, onTriggerToast }: ErrorLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [errorTypeFilter, setErrorTypeFilter] = useState('All Error Types');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);

  const defaultLogs: ErrorLogEntry[] = [
    {
      id: 'err_1',
      time: 'May 27, 2025 14:32:15',
      priority: 'High',
      service: 'Workflow Engine',
      error_type: 'TimeoutError',
      message: 'Workflow execution timeout after 30s',
      occurrences_count: 45,
      affected_users_count: 23,
      status: 'Open',
      environment: 'Production'
    },
    {
      id: 'err_2',
      time: 'May 27, 2025 14:28:12',
      priority: 'High',
      service: 'API Gateway',
      error_type: 'RateLimitExceeded',
      message: 'Rate limit exceeded for API key',
      occurrences_count: 123,
      affected_users_count: 67,
      status: 'Open',
      environment: 'Production'
    },
    {
      id: 'err_3',
      time: 'May 27, 2025 14:25:33',
      priority: 'Medium',
      service: 'Vector Database',
      error_type: 'QueryError',
      message: 'Vector search query failed',
      occurrences_count: 89,
      affected_users_count: 34,
      status: 'Investigating',
      environment: 'Production'
    },
    {
      id: 'err_4',
      time: 'May 27, 2025 14:20:11',
      priority: 'High',
      service: 'Agent Runtime',
      error_type: 'ModelError',
      message: 'AI model inference failed',
      occurrences_count: 67,
      affected_users_count: 28,
      status: 'Open',
      environment: 'Production'
    },
    {
      id: 'err_5',
      time: 'May 27, 2025 14:18:07',
      priority: 'Medium',
      service: 'Payments Service',
      error_type: 'NetworkError',
      message: 'Payment gateway connection timeout',
      occurrences_count: 34,
      affected_users_count: 12,
      status: 'Investigating',
      environment: 'Production'
    },
    {
      id: 'err_6',
      time: 'May 27, 2025 14:15:30',
      priority: 'Low',
      service: 'Knowledge Hub',
      error_type: 'NotFoundError',
      message: 'Document not found',
      occurrences_count: 28,
      affected_users_count: 8,
      status: 'Resolved',
      environment: 'Production'
    },
    {
      id: 'err_7',
      time: 'May 27, 2025 14:10:41',
      priority: 'High',
      service: 'Auth Service',
      error_type: 'TokenError',
      message: 'Invalid or expired token',
      occurrences_count: 25,
      affected_users_count: 7,
      status: 'Resolved',
      environment: 'Production'
    }
  ];

  const logList = propLogs && propLogs.length > 0 ? propLogs : defaultLogs;

  const filteredLogs = logList.filter((l) => {
    const matchesSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = serviceFilter === 'All Services' || l.service === serviceFilter;
    const matchesType = errorTypeFilter === 'All Error Types' || l.error_type === errorTypeFilter;
    const matchesPriority = priorityFilter === 'All Priorities' || l.priority === priorityFilter;
    return matchesSearch && matchesService && matchesType && matchesPriority;
  });

  return (
    <div className="space-y-5">
      {/* 5 TOP KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Errors (24h) */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Errors (24h)</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">2,341</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> -12.8% vs last 7d
          </span>
        </div>

        {/* High Priority */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">High Priority</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">512</div>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">21.9%</span>
        </div>

        {/* Medium Priority */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Medium Priority</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">1,245</div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">53.2%</span>
        </div>

        {/* Low Priority */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Low Priority</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">584</div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">24.9%</span>
        </div>

        {/* Affected Users */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Affected Users</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">342</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> -8.7% vs last 7d
          </span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search error messages..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Services">All Services</option>
              <option value="Workflow Engine">Workflow Engine</option>
              <option value="API Gateway">API Gateway</option>
              <option value="Vector Database">Vector Database</option>
              <option value="Agent Runtime">Agent Runtime</option>
              <option value="Payments Service">Payments Service</option>
              <option value="Auth Service">Auth Service</option>
            </select>

            {/* Error Type Filter */}
            <select
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Error Types">All Error Types</option>
              <option value="TimeoutError">TimeoutError</option>
              <option value="RateLimitExceeded">RateLimitExceeded</option>
              <option value="QueryError">QueryError</option>
              <option value="ModelError">ModelError</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERROR LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">PRIORITY</th>
                <th className="py-2.5 px-3">SERVICE</th>
                <th className="py-2.5 px-3">ERROR TYPE</th>
                <th className="py-2.5 px-3">MESSAGE</th>
                <th className="py-2.5 px-3">COUNT</th>
                <th className="py-2.5 px-3">AFFECTED USERS</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{l.time}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                        l.priority === 'High'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800'
                          : l.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {l.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{l.service}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{l.error_type}</td>
                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{l.message}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{l.occurrences_count}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{l.affected_users_count}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[9.5px] ${
                        l.status === 'Open'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80'
                          : l.status === 'Investigating'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedError(l)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-medium">
          <div>Showing 1 to 10 of 2,341 errors</div>

          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronLeft size={13} />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs">1</span>
            <span className="px-2 py-1 cursor-pointer">2</span>
            <span className="px-2 py-1 cursor-pointer">3</span>
            <span>...</span>
            <span className="px-2 py-1 cursor-pointer">235</span>
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="font-semibold text-slate-700 dark:text-slate-300">
            <span>10 / page</span>
          </div>
        </div>
      </div>

      {/* ERROR STACKTRACE MODAL */}
      {selectedError && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Error Exception & Stacktrace</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedError.error_type} in {selectedError.service}</p>
              </div>
              <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 font-mono text-xs p-3.5 bg-slate-950 rounded-xl text-rose-400">
              <div><span className="text-slate-500">Message:</span> {selectedError.message}</div>
              <div><span className="text-slate-500">Occurrences:</span> {selectedError.occurrences_count}</div>
              <div><span className="text-slate-500">Affected Users:</span> {selectedError.affected_users_count}</div>
              <div className="pt-2 text-slate-400 border-t border-slate-800">
                <span>Stacktrace:</span>
                <pre className="mt-1 text-[11px] text-slate-300 leading-tight">
{`Error: ${selectedError.message}
  at WorkflowRunner.executeStep (/app/dist/services/workflow.js:142:19)
  at async ProcessWorker.runTask (/app/dist/queue/worker.js:88:12)
  at async Engine.dispatch (/app/dist/engine.js:204:5)`}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={async () => {
                  const res = await enterpriseSupabaseService.resolveErrorLogRealtime(selectedError.id);
                  if (res.success) {
                    if (onTriggerToast) onTriggerToast(`✅ Error ${selectedError.id} marked as Resolved in Supabase Realtime!`);
                  } else {
                    if (onTriggerToast) onTriggerToast(`❌ Error resolving log: ${res.error}`);
                  }
                  setSelectedError(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Mark as Resolved
              </button>
              <button onClick={() => setSelectedError(null)} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
