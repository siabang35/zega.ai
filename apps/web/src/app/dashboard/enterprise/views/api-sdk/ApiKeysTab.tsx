import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Grid,
  List
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
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

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  full_key_preview?: string;
  environment: string;
  permissions: string;
  last_used_at?: string;
  status: 'Active' | 'Inactive' | 'Revoked';
  created_by?: string;
  created_at?: string;
}

interface ApiKeysTabProps {
  apiKeys: ApiKeyItem[];
  onTriggerToast?: (msg: string) => void;
  onCreateKeyModal: () => void;
  onRevokeKey: (id: string) => void;
  onRegenerateKey: (id: string) => void;
}

export function ApiKeysTab({
  apiKeys,
  onTriggerToast,
  onCreateKeyModal,
  onRevokeKey,
  onRegenerateKey
}: ApiKeysTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(
    apiKeys[0]?.id || null
  );
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});

  const toggleShowKey = (id: string) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onTriggerToast) onTriggerToast(`📋 ${label} copied to clipboard!`);
  };

  const filteredKeys = apiKeys.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.key_prefix.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = selectedEnv === 'All' || k.environment === selectedEnv;
    const matchesStatus = selectedStatus === 'All' || k.status === selectedStatus;
    return matchesSearch && matchesEnv && matchesStatus;
  });

  const selectedKey = apiKeys.find((k) => k.id === selectedKeyId) || apiKeys[0] || {
    id: 'key_prod',
    name: 'Production Key',
    key_prefix: 'zga_live_••••••••',
    full_key_preview: 'zga_live_981249124819241829481294',
    environment: 'Production',
    permissions: 'Full Access',
    created_at: 'May 20, 2025',
    created_by: 'cole.coe@zegaai.com',
    last_used_at: 'Just now',
    status: 'Active'
  };

  // Sparkline Chart Options
  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 }, line: { borderWidth: 2, tension: 0.4 } }
  };

  // API Usage Line Chart Data
  const usageChartData = {
    labels: ['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      {
        label: 'Total Requests',
        data: [180, 240, 230, 270, 260, 290, 310],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Successful Requests',
        data: [175, 232, 225, 265, 255, 285, 305],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="space-y-5">
      {/* 4 TOP KPI CARDS WITH SPARKLINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total API Keys</span>
            <div className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Key size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{apiKeys.length || 12}</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              ↑ +2 vs last 7d
            </span>
          </div>
          <div className="h-7 w-full pt-1">
            <Line
              data={{
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{ data: [8, 9, 9, 10, 10, 11, 12], borderColor: '#6366f1' }]
              }}
              options={sparklineOptions}
            />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Active Keys</span>
            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {apiKeys.filter((k) => k.status === 'Active').length || 9}
            </span>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
              ↓ 1 vs last 7d
            </span>
          </div>
          <div className="h-7 w-full pt-1">
            <Line
              data={{
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{ data: [10, 10, 10, 9, 9, 9, 9], borderColor: '#10b981' }]
              }}
              options={sparklineOptions}
            />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">API Requests (24h)</span>
            <div className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">2.45M</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              ↑ +18.5% vs yesterday
            </span>
          </div>
          <div className="h-7 w-full pt-1">
            <Line
              data={{
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{ data: [1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.45], borderColor: '#f43f5e' }]
              }}
              options={sparklineOptions}
            />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Success Rate (24h)</span>
            <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">99.42%</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              ↑ +0.8% vs yesterday
            </span>
          </div>
          <div className="h-7 w-full pt-1">
            <Line
              data={{
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{ data: [98.5, 98.8, 99.0, 99.1, 99.2, 99.4, 99.42], borderColor: '#f59e0b' }]
              }}
              options={sparklineOptions}
            />
          </div>
        </div>
      </div>

      {/* API KEYS TABLE CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">API Keys</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Use API keys to authenticate your requests to ZEGA AI API.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search API keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 w-44"
              />
            </div>

            {/* Environment Filter */}
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Environments</option>
              <option value="Production">Production</option>
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-extrabold">
                <th className="py-2.5 px-3">NAME</th>
                <th className="py-2.5 px-3">KEY</th>
                <th className="py-2.5 px-3">ENVIRONMENT</th>
                <th className="py-2.5 px-3">PERMISSIONS</th>
                <th className="py-2.5 px-3">LAST USED</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredKeys.map((k) => {
                const isSelected = k.id === selectedKey.id;
                return (
                  <tr
                    key={k.id}
                    onClick={() => setSelectedKeyId(k.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-bold'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{k.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{showKeyMap[k.id] && k.full_key_preview ? k.full_key_preview : k.key_prefix}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowKey(k.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showKeyMap[k.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                          k.environment === 'Production'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                            : k.environment === 'Development'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border border-purple-200 dark:border-purple-900'
                        }`}
                      >
                        {k.environment}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">{k.permissions}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{k.last_used_at || 'Just now'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          k.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                            : k.status === 'Inactive'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => copyText(k.full_key_preview || k.key_prefix, k.name)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                          title="Copy Key"
                        >
                          <Copy size={13} />
                        </button>
                        {k.status !== 'Revoked' && (
                          <button
                            onClick={() => onRevokeKey(k.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                            title="Revoke Key"
                          >
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KEY DETAILS & API USAGE DUAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* KEY DETAILS CARD */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Key Details</h4>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">{selectedKey.name}</h3>
            </div>

            <div className="space-y-2.5 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Environment</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[10px]">
                  {selectedKey.environment}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Permissions</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedKey.permissions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Created</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedKey.created_at || 'May 20, 2025'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Created by</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedKey.created_by || 'cole.coe@zegaai.com'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Last used</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedKey.last_used_at || 'Just now'}</span>
              </div>
            </div>

            {/* MASKED KEY BOX */}
            <div className="mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Your API Key</span>
              <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                <span className="truncate max-w-[200px]">
                  {showKeyMap[selectedKey.id] && selectedKey.full_key_preview
                    ? selectedKey.full_key_preview
                    : 'zga_live_••••••••••••••••••••••••'}
                </span>
                <button onClick={() => toggleShowKey(selectedKey.id)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showKeyMap[selectedKey.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => copyText(selectedKey.full_key_preview || selectedKey.key_prefix, selectedKey.name)}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Copy size={13} />
              <span>Copy</span>
            </button>
            <button
              onClick={() => onRegenerateKey(selectedKey.id)}
              className="flex-1 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw size={13} />
              <span>Regenerate Key</span>
            </button>
          </div>
        </div>

        {/* API USAGE CHART CARD */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">API Usage (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Real-time volume telemetry and success vs failed call distribution.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="size-2.5 rounded-full bg-indigo-600" />
                Total Requests
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                Successful Requests
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 h-48 w-full">
              <Line
                data={usageChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: 'rgba(226, 232, 240, 0.4)' }, ticks: { font: { size: 10 } } }
                  }
                }}
              />
            </div>

            <div className="md:col-span-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Requests</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">12.45M</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Successful Requests</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">12.36M</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Failed Requests</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">89K</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Success Rate</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">99.28%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECURITY TIPS CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-2xs">
        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600" />
          Security Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            'Store your API keys securely and never share them publicly.',
            'Use environment-specific keys with minimal required permissions.',
            'Rotate your keys regularly for better security.',
            'Monitor your API usage and set up alerts for unusual activity.'
          ].map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
