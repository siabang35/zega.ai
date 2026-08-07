import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Server,
  AlertTriangle,
  Info,
  XCircle,
  AlertOctagon
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

export interface SystemLogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: string;
  component: string;
  message: string;
  host: string;
  environment: string;
}

interface SystemLogsTabProps {
  logs?: SystemLogEntry[];
  onTriggerToast?: (msg: string) => void;
}

export function SystemLogsTab({ logs: propLogs, onTriggerToast }: SystemLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All Levels');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [envFilter, setEnvFilter] = useState('All Environments');
  const [liveTail, setLiveTail] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);

  const defaultLogs: SystemLogEntry[] = [
    {
      id: 'syslog_1',
      time: 'May 27, 2025 14:32:15',
      level: 'INFO',
      service: 'API Gateway',
      component: 'Request Router',
      message: 'Request processed successfully',
      host: 'ip-10-0-2-12',
      environment: 'Production'
    },
    {
      id: 'syslog_2',
      time: 'May 27, 2025 14:32:14',
      level: 'INFO',
      service: 'Workflow Engine',
      component: 'Worker Pool',
      message: 'Workflow execution completed',
      host: 'ip-10-0-2-23',
      environment: 'Production'
    },
    {
      id: 'syslog_3',
      time: 'May 27, 2025 14:32:13',
      level: 'WARN',
      service: 'Vector Database',
      component: 'Index Service',
      message: 'Vector index updated',
      host: 'ip-10-0-4-15',
      environment: 'Staging'
    },
    {
      id: 'syslog_4',
      time: 'May 27, 2025 14:32:11',
      level: 'INFO',
      service: 'Agent Runtime',
      component: 'Model Runner',
      message: 'Model inference completed',
      host: 'ip-10-0-2-12',
      environment: 'Production'
    },
    {
      id: 'syslog_5',
      time: 'May 27, 2025 14:32:10',
      level: 'INFO',
      service: 'Payments Service',
      component: 'Payment Processor',
      message: 'Payment processed',
      host: 'ip-10-0-2-12',
      environment: 'Production'
    },
    {
      id: 'syslog_6',
      time: 'May 27, 2025 14:32:08',
      level: 'CRITICAL',
      service: 'Auth Service',
      component: 'Token Service',
      message: 'Token refreshed',
      host: 'ip-10-0-3-11',
      environment: 'Production'
    },
    {
      id: 'syslog_7',
      time: 'May 27, 2025 14:15:22',
      level: 'WARN',
      service: 'Infrastructure',
      component: 'Load Balancer',
      message: 'High memory usage detected',
      host: 'ip-10-0-4-12',
      environment: 'Production'
    },
    {
      id: 'syslog_8',
      time: 'May 27, 2025 14:10:41',
      level: 'ERROR',
      service: 'Infrastructure',
      component: 'Load Balancer',
      message: 'Service unavailable',
      host: 'ip-10-0-4-12',
      environment: 'Production'
    }
  ];

  const logList = propLogs && propLogs.length > 0 ? propLogs : defaultLogs;

  const filteredLogs = logList.filter((l) => {
    const matchesSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.host.includes(searchTerm);
    const matchesLevel = levelFilter === 'All Levels' || l.level === levelFilter;
    const matchesService = serviceFilter === 'All Services' || l.service === serviceFilter;
    const matchesEnv = envFilter === 'All Environments' || l.environment === envFilter;
    return matchesSearch && matchesLevel && matchesService && matchesEnv;
  });

  return (
    <div className="space-y-5">
      {/* 5 TOP KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Logs (24h) */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Logs (24h)</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">124,875</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 23.2% vs last 7d
          </span>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Info</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">98,521</div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">78.9%</span>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Warning</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">18,245</div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">14.6%</span>
        </div>

        {/* Error */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Error</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">6,231</div>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">5.0%</span>
        </div>

        {/* Critical */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Critical</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">1,878</div>
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">1.5%</span>
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
                placeholder="Search system logs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Levels">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Services">All Services</option>
              <option value="API Gateway">API Gateway</option>
              <option value="Workflow Engine">Workflow Engine</option>
              <option value="Vector Database">Vector Database</option>
              <option value="Agent Runtime">Agent Runtime</option>
              <option value="Payments Service">Payments Service</option>
              <option value="Auth Service">Auth Service</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>

            {/* Environment Filter */}
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Environments">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>

          {/* Live Tail Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Live Tail</span>
            <button
              onClick={() => {
                setLiveTail(!liveTail);
                if (onTriggerToast) onTriggerToast(liveTail ? 'Live Tail Disabled' : 'Live Tail Streaming Enabled');
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                liveTail ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`size-4 rounded-full bg-white transition-transform ${
                  liveTail ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">LEVEL</th>
                <th className="py-2.5 px-3">SERVICE</th>
                <th className="py-2.5 px-3">COMPONENT</th>
                <th className="py-2.5 px-3">MESSAGE</th>
                <th className="py-2.5 px-3">HOST</th>
                <th className="py-2.5 px-3">ENVIRONMENT</th>
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
                        l.level === 'INFO'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : l.level === 'WARN'
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : l.level === 'ERROR'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      {l.level}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{l.service}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{l.component}</td>
                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">{l.message}</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{l.host}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[9.5px] ${
                        l.environment === 'Production'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                          : l.environment === 'Staging'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'
                      }`}
                    >
                      {l.environment}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedLog(l)}
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
          <div>Showing 1 to 10 of 124,875 logs</div>

          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronLeft size={13} />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs">1</span>
            <span className="px-2 py-1 cursor-pointer">2</span>
            <span className="px-2 py-1 cursor-pointer">3</span>
            <span>...</span>
            <span className="px-2 py-1 cursor-pointer">12,488</span>
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="font-semibold text-slate-700 dark:text-slate-300">
            <span>10 / page</span>
          </div>
        </div>
      </div>

      {/* INSPECT SYSTEM LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">System Log Payload</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLog.service} ({selectedLog.component})</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 font-mono text-xs p-3 bg-slate-950 rounded-xl text-emerald-400">
              <div><span className="text-slate-500">Level:</span> {selectedLog.level}</div>
              <div><span className="text-slate-500">Message:</span> {selectedLog.message}</div>
              <div><span className="text-slate-500">Host:</span> {selectedLog.host}</div>
              <div><span className="text-slate-500">Environment:</span> {selectedLog.environment}</div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
