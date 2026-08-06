import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Eye,
  EyeOff,
  MoreHorizontal,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export interface WebhookEndpointItem {
  id: string;
  name: string;
  url: string;
  environment: 'Production' | 'Staging' | 'Development';
  events_count: number;
  success_rate: string;
  last_delivery: string;
  status: 'Active' | 'Paused' | 'Inactive';
  secret_key?: string;
}

interface EndpointsTabProps {
  endpoints: WebhookEndpointItem[];
  onTriggerToast?: (msg: string) => void;
  onAddEndpointModal: () => void;
  onRotateSecret: (id: string) => void;
  onDeleteEndpoint?: (id: string) => void;
}

export function EndpointsTab({
  endpoints,
  onTriggerToast,
  onAddEndpointModal,
  onRotateSecret,
  onDeleteEndpoint
}: EndpointsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('All Environments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch =
      ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnv = selectedEnv === 'All Environments' || ep.environment === selectedEnv;
    const matchesStatus = selectedStatus === 'All Statuses' || ep.status === selectedStatus;
    return matchesSearch && matchesEnv && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 5 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: TOTAL ENDPOINTS */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Endpoints</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ▲ 14.3% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {endpoints.length > 0 ? endpoints.length : 24}
          </div>
        </div>

        {/* CARD 2: ACTIVE ENDPOINTS */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Endpoints</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ▲ 12.5% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {endpoints.filter((e) => e.status === 'Active').length > 0
              ? endpoints.filter((e) => e.status === 'Active').length
              : 21}
          </div>
        </div>

        {/* CARD 3: EVENTS (24H) */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Events (24h)</span>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
              ▲ 18.4% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            12.45M
          </div>
        </div>

        {/* CARD 4: SUCCESS RATE */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Success Rate (24h)</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ▲ 0.8% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            99.42%
          </div>
        </div>

        {/* CARD 5: FAILED DELIVERIES */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed Deliveries (24h)</span>
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
              ▼ 8.4% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            2,341
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="All Environments">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={onAddEndpointModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Add Endpoint</span>
            </button>
          </div>
        </div>

        {/* ENDPOINTS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-black">
                <th className="py-2.5 px-3">ENDPOINT</th>
                <th className="py-2.5 px-3">URL</th>
                <th className="py-2.5 px-3">ENVIRONMENT</th>
                <th className="py-2.5 px-3">EVENTS</th>
                <th className="py-2.5 px-3">SUCCESS RATE</th>
                <th className="py-2.5 px-3">LAST DELIVERY</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredEndpoints.map((ep) => (
                <tr key={ep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{ep.name}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                    <span className="truncate max-w-[240px] block">{ep.url}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {ep.environment}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                    {typeof ep.events_count === 'number' ? (ep.events_count > 1000 ? (ep.events_count / 1000000).toFixed(2) + 'M' : ep.events_count) : ep.events_count}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{ep.success_rate}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{ep.last_delivery}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ep.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : ep.status === 'Paused'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {ep.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onTriggerToast && onTriggerToast(`📡 Testing endpoint: ${ep.url}`)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Send Test Event"
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={() => onRotateSecret(ep.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-600 cursor-pointer"
                        title="Rotate Secret"
                      >
                        <RefreshCw size={13} />
                      </button>
                      {onDeleteEndpoint && (
                        <button
                          onClick={() => onDeleteEndpoint(ep.id)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Endpoint"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
