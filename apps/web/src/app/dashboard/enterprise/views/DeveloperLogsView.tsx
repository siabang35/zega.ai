import React, { useState } from 'react';
import {
  Activity,
  Search,
  ChevronDown,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
    y: { display: false },
  },
};

interface DeveloperLogsViewProps {
  onTriggerToast?: (msg: string) => void;
}

interface LogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  request: string;
  status: number;
  responseTime: string;
  message: string;
}

export function DeveloperLogsView({ onTriggerToast }: DeveloperLogsViewProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'system' | 'audit' | 'error'>('api');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All Levels');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [liveTail, setLiveTail] = useState(true);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log_1',
      time: 'May 27, 2025 14:32:15',
      level: 'INFO',
      service: 'API Gateway',
      request: 'POST /v1/agents/run',
      status: 200,
      responseTime: '142ms',
      message: 'Request completed successfully',
    },
    {
      id: 'log_2',
      time: 'May 27, 2025 14:32:14',
      level: 'INFO',
      service: 'Agent Runtime',
      request: 'GET /v1/agents',
      status: 200,
      responseTime: '98ms',
      message: 'Agent list retrieved',
    },
    {
      id: 'log_3',
      time: 'May 27, 2025 14:32:13',
      level: 'WARN',
      service: 'Workflow Engine',
      request: 'POST /v1/workflows/execute',
      status: 200,
      responseTime: '521ms',
      message: 'Workflow step timeout',
    },
    {
      id: 'log_4',
      time: 'May 27, 2025 14:32:12',
      level: 'ERROR',
      service: 'Knowledge Hub',
      request: 'GET /v1/knowledge/search',
      status: 429,
      responseTime: '231ms',
      message: 'Rate limit exceeded',
    },
    {
      id: 'log_5',
      time: 'May 27, 2025 14:32:11',
      level: 'INFO',
      service: 'Payments Service',
      request: 'POST /v1/payments/checkout',
      status: 200,
      responseTime: '315ms',
      message: 'Payment session created',
    },
    {
      id: 'log_6',
      time: 'May 27, 2025 14:32:10',
      level: 'INFO',
      service: 'Vector Database',
      request: 'POST /v1/vector/search',
      status: 200,
      responseTime: '156ms',
      message: 'Vector search completed',
    },
  ]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'All Levels' || l.level === levelFilter;
    const matchesService = serviceFilter === 'All Services' || l.service === serviceFilter;
    return matchesSearch && matchesLevel && matchesService;
  });

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Logs
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time logs for API requests and system events.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
            <span>All Services</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300">
            <span>Last 24 Hours</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          <button
            onClick={() => onTriggerToast?.('Advanced log filters')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'api', label: 'API Logs' },
          { id: 'system', label: 'System Logs' },
          { id: 'audit', label: 'Audit Logs' },
          { id: 'error', label: 'Error Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOP METRICS & LOGS OVER TIME CHART */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Logs */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-none">
          <span className="text-[11px] font-semibold text-slate-500">Total Logs</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">24,831</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 16.7%
          </span>
        </div>

        {/* Error Logs */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-none">
          <span className="text-[11px] font-semibold text-slate-500">Error Logs</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">142</div>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 5.2%
          </span>
        </div>

        {/* Warning Logs */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-none">
          <span className="text-[11px] font-semibold text-slate-500">Warning Logs</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">512</div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> 3.1%
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-none">
          <span className="text-[11px] font-semibold text-slate-500">Avg. Response Time</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">142ms</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> 12ms
          </span>
        </div>

        {/* Logs Over Time Bar Chart */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-none">
          <span className="text-[10.5px] font-semibold text-slate-500">Logs Over Time</span>
          <div className="h-10">
            <Bar
              data={{
                labels: ['00:00', '06:00', '12:00', '18:00'],
                datasets: [
                  {
                    data: [1200, 2400, 3100, 1800],
                    backgroundColor: '#6366f1',
                    borderRadius: 3,
                  },
                ],
              }}
              options={barChartOptions}
            />
          </div>
        </div>
      </div>

      {/* FILTER BAR WITH SEARCH, DROPDOWNS & LIVE TAIL */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <span>{levelFilter}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {/* Service Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <span>{serviceFilter}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <span>{statusFilter}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>

          {/* Live Tail Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Live Tail</span>
            <button
              onClick={() => {
                setLiveTail(!liveTail);
                if (onTriggerToast) onTriggerToast(liveTail ? 'Live Tail Dimatikan' : 'Live Tail Diaktifkan');
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

      {/* LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">LEVEL</th>
                <th className="py-2.5 px-3">SERVICE</th>
                <th className="py-2.5 px-3">REQUEST</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">RESPONSE TIME</th>
                <th className="py-2.5 px-3">MESSAGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{l.time}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                        l.level === 'INFO'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          : l.level === 'WARN'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {l.level}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{l.service}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{l.request}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        l.status === 200
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{l.responseTime}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-medium">
          <div>Showing 1 to 50 of 24,831 logs</div>

          <div className="flex items-center gap-2">
            <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold">1</span>
            <span>2</span>
            <span>3</span>
            <span>...</span>
            <span>497</span>
            <button className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
              <ChevronRight size={14} />
            </button>
          </div>

          <div>
            <span>50 / page</span>
          </div>
        </div>
      </div>
    </div>
  );
}
