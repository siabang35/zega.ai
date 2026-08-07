import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  SlidersHorizontal,
  Copy,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } }
};

export interface ApiLogEntry {
  id: string;
  time: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  response_time_ms: number;
  ip_address: string;
  api_key_masked: string;
  user_agent: string;
  request_size_bytes: number;
  response_size_bytes: number;
  service: string;
}

interface ApiLogsTabProps {
  logs?: ApiLogEntry[];
  onTriggerToast?: (msg: string) => void;
  onInspectLog?: (log: ApiLogEntry) => void;
}

export function ApiLogsTab({ logs: propLogs, onTriggerToast, onInspectLog }: ApiLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [liveTail, setLiveTail] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);

  const defaultLogs: ApiLogEntry[] = [
    {
      id: 'apilog_1',
      time: 'May 27, 2025 14:32:15',
      method: 'POST',
      endpoint: '/v1/agents/run',
      status: 200,
      response_time_ms: 142,
      ip_address: '202.12.49.67',
      api_key_masked: 'zga_live_••••••••',
      user_agent: 'Mozilla/5.0...',
      request_size_bytes: 1228,
      response_size_bytes: 2457,
      service: 'API Gateway'
    },
    {
      id: 'apilog_2',
      time: 'May 27, 2025 14:32:14',
      method: 'GET',
      endpoint: '/v1/knowledge/search',
      status: 200,
      response_time_ms: 98,
      ip_address: '181.34.21.123',
      api_key_masked: 'zga_dev_••••••••',
      user_agent: 'PostmanRuntime...',
      request_size_bytes: 2252,
      response_size_bytes: 1126,
      service: 'Knowledge Hub'
    },
    {
      id: 'apilog_3',
      time: 'May 27, 2025 14:32:13',
      method: 'POST',
      endpoint: '/v1/workflows/execute',
      status: 429,
      response_time_ms: 521,
      ip_address: '203.0.113.45',
      api_key_masked: 'zga_dev_••••••••',
      user_agent: 'okhttp/4.12.0',
      request_size_bytes: 512,
      response_size_bytes: 1228,
      service: 'Workflow Engine'
    },
    {
      id: 'apilog_4',
      time: 'May 27, 2025 14:32:12',
      method: 'GET',
      endpoint: '/v1/analytics/usage',
      status: 200,
      response_time_ms: 231,
      ip_address: '64.233.16.01',
      api_key_masked: 'zga_live_••••••••',
      user_agent: 'Mozilla/5.0...',
      request_size_bytes: 3072,
      response_size_bytes: 5324,
      service: 'Analytics'
    },
    {
      id: 'apilog_5',
      time: 'May 27, 2025 14:32:11',
      method: 'POST',
      endpoint: '/v1/payments/checkout',
      status: 500,
      response_time_ms: 915,
      ip_address: '54.239.28.45',
      api_key_masked: 'zga_live_••••••••',
      user_agent: 'Mozilla/5.0...',
      request_size_bytes: 3584,
      response_size_bytes: 5242,
      service: 'Payments'
    },
    {
      id: 'apilog_6',
      time: 'May 27, 2025 14:32:10',
      method: 'GET',
      endpoint: '/v1/agents/list',
      status: 200,
      response_time_ms: 76,
      ip_address: '20.191.28.82',
      api_key_masked: 'zga_dev_••••••••',
      user_agent: 'Mozilla/5.0...',
      request_size_bytes: 3072,
      response_size_bytes: 1228,
      service: 'Agent Runtime'
    }
  ];

  const logList = propLogs && propLogs.length > 0 ? propLogs : defaultLogs;

  const filteredLogs = logList.filter((l) => {
    const matchesSearch =
      l.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip_address.includes(searchTerm) ||
      l.api_key_masked.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = serviceFilter === 'All Services' || l.service === serviceFilter;
    const matchesStatus =
      statusFilter === 'All Status' ||
      (statusFilter === '200 OK' && l.status === 200) ||
      (statusFilter === '429 Rate Limit' && l.status === 429) ||
      (statusFilter === '500 Error' && l.status === 500);
    return matchesSearch && matchesService && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* 5 TOP KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Requests (24h) */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Requests (24h)</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">2.45M</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight size={12} /> 18.4% vs last 7d
          </span>
        </div>

        {/* Successful Requests */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Successful Requests</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">2.43M</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">99.12%</span>
        </div>

        {/* Failed Requests */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Failed Requests</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">21,524</div>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> -8.68%
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Avg. Response Time</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">142ms</div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <ArrowDownRight size={12} /> -12ms
          </span>
        </div>

        {/* Requests Over Time Sparkline */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs">
          <span className="text-[10.5px] font-semibold text-slate-500">Requests Over Time</span>
          <div className="h-9">
            <Line
              data={{
                labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                datasets: [
                  {
                    data: [120, 240, 180, 310, 290, 420, 380, 490],
                    borderColor: '#6366f1',
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.08)'
                  }
                ]
              }}
              options={sparklineOptions}
            />
          </div>
        </div>
      </div>

      {/* FILTER BAR WITH SEARCH, DROPDOWNS & LIVE TAIL */}
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
                placeholder="Search by endpoint, IP, API key..."
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
              <option value="API Gateway">API Gateway</option>
              <option value="Knowledge Hub">Knowledge Hub</option>
              <option value="Workflow Engine">Workflow Engine</option>
              <option value="Analytics">Analytics</option>
              <option value="Payments">Payments</option>
              <option value="Agent Runtime">Agent Runtime</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="200 OK">200 OK</option>
              <option value="429 Rate Limit">429 Rate Limit</option>
              <option value="500 Error">500 Server Error</option>
            </select>

            <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs">
              Last 24 Hours
            </div>
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

      {/* API LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-2.5 px-3">TIME</th>
                <th className="py-2.5 px-3">METHOD</th>
                <th className="py-2.5 px-3">ENDPOINT</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">RESPONSE TIME</th>
                <th className="py-2.5 px-3">IP ADDRESS</th>
                <th className="py-2.5 px-3">API KEY</th>
                <th className="py-2.5 px-3">USER AGENT</th>
                <th className="py-2.5 px-3">REQ SIZE</th>
                <th className="py-2.5 px-3">RES SIZE</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{l.time}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold font-mono ${
                        l.method === 'POST'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {l.method}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{l.endpoint}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        l.status === 200
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : l.status === 429
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 font-bold">{l.response_time_ms}ms</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{l.ip_address}</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{l.api_key_masked}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[120px] truncate">{l.user_agent}</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{(l.request_size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{(l.response_size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedLog(l);
                        if (onInspectLog) onInspectLog(l);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
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
          <div>Showing 1 to 10 of 2,450,987 logs</div>

          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronLeft size={13} />
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs">1</span>
            <span className="px-2 py-1 cursor-pointer">2</span>
            <span className="px-2 py-1 cursor-pointer">3</span>
            <span>...</span>
            <span className="px-2 py-1 cursor-pointer">245,098</span>
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="font-semibold text-slate-700 dark:text-slate-300">
            <span>10 / page</span>
          </div>
        </div>
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">API Log Details</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLog.endpoint}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 font-mono text-xs p-3 bg-slate-950 rounded-xl text-emerald-400">
              <div><span className="text-slate-500">Method:</span> {selectedLog.method}</div>
              <div><span className="text-slate-500">Status:</span> {selectedLog.status}</div>
              <div><span className="text-slate-500">Latency:</span> {selectedLog.response_time_ms}ms</div>
              <div><span className="text-slate-500">IP:</span> {selectedLog.ip_address}</div>
              <div><span className="text-slate-500">API Key:</span> {selectedLog.api_key_masked}</div>
              <div><span className="text-slate-500">User Agent:</span> {selectedLog.user_agent}</div>
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
