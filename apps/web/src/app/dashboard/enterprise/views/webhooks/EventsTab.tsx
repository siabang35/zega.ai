import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export interface WebhookEventItem {
  id: string;
  event_id: string;
  event_type: string;
  endpoint_name: string;
  status: 'Success' | 'Failed' | 'Pending' | 'Retrying';
  delivery_time: string;
  response_time_ms: number;
  timestamp: string;
}

interface EventsTabProps {
  events: WebhookEventItem[];
  onTriggerToast?: (msg: string) => void;
}

export function EventsTab({ events, onTriggerToast }: EventsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('All Endpoints');
  const [selectedEventType, setSelectedEventType] = useState('All Event Types');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);

  const defaultEvents: WebhookEventItem[] = [
    {
      id: 'evt_1',
      event_id: 'evt_01H9812489182491290190',
      event_type: 'checkout.completed',
      endpoint_name: 'Checkout Webhook',
      status: 'Success',
      delivery_time: '2 sec',
      response_time_ms: 240,
      timestamp: 'May 27, 2025 10:30:45 AM'
    },
    {
      id: 'evt_2',
      event_id: 'evt_01H9812489182491290191',
      event_type: 'invoice.paid',
      endpoint_name: 'Invoice Webhook',
      status: 'Success',
      delivery_time: '3 sec',
      response_time_ms: 312,
      timestamp: 'May 27, 2025 10:30:42 AM'
    },
    {
      id: 'evt_3',
      event_id: 'evt_01H9812489182491290192',
      event_type: 'user.created',
      endpoint_name: 'User Events',
      status: 'Success',
      delivery_time: '2 sec',
      response_time_ms: 210,
      timestamp: 'May 27, 2025 10:30:38 AM'
    },
    {
      id: 'evt_4',
      event_id: 'evt_01H9812489182491290193',
      event_type: 'subscription.updated',
      endpoint_name: 'Finance Events',
      status: 'Failed',
      delivery_time: '30 sec',
      response_time_ms: 502,
      timestamp: 'May 27, 2025 10:30:30 AM'
    },
    {
      id: 'evt_5',
      event_id: 'evt_01H9812489182491290194',
      event_type: 'payment.refunded',
      endpoint_name: 'Finance Events',
      status: 'Success',
      delivery_time: '4 sec',
      response_time_ms: 289,
      timestamp: 'May 27, 2025 10:30:18 AM'
    }
  ];

  const displayList = events.length > 0 ? events : defaultEvents;

  const filteredEvents = displayList.filter((evt) => {
    const matchesSearch =
      evt.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.endpoint_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEp = selectedEndpoint === 'All Endpoints' || evt.endpoint_name === selectedEndpoint;
    const matchesType = selectedEventType === 'All Event Types' || evt.event_type === selectedEventType;
    const matchesStatus = selectedStatus === 'All Statuses' || evt.status === selectedStatus;
    return matchesSearch && matchesEp && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 3 TOP KPI CARDS INCLUDING CHART */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: TOTAL EVENTS */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Events (24h)</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              ▲ 18.4% vs last 7d
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            12.45M
          </div>
        </div>

        {/* CARD 2: PROCESSED EVENTS */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Processed Events</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
              ▲ 17.2% vs last 7d
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              12.40M
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">99.58%</span>
          </div>
        </div>

        {/* CARD 3: EVENTS OVER TIME CHART MINI WIDGET */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Events Over Time (24h)</span>
            <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400">52,341 / sec</span>
          </div>
          {/* Sparkline Graphic */}
          <div className="h-10 w-full flex items-end gap-1 pt-2">
            {[40, 55, 35, 70, 85, 60, 95, 80, 100, 75, 90, 85, 110, 95, 120, 105].map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-indigo-500/80 hover:bg-indigo-600 rounded-xs transition-all"
                style={{ height: `${(val / 120) * 100}%` }}
              />
            ))}
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
              placeholder="Search event ID, type, endpoint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="All Endpoints">All Endpoints</option>
              <option value="Checkout Webhook">Checkout Webhook</option>
              <option value="Invoice Webhook">Invoice Webhook</option>
              <option value="User Events">User Events</option>
              <option value="Finance Events">Finance Events</option>
            </select>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="All Event Types">All Event Types</option>
              <option value="checkout.completed">checkout.completed</option>
              <option value="invoice.paid">invoice.paid</option>
              <option value="user.created">user.created</option>
              <option value="subscription.updated">subscription.updated</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* EVENTS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-black">
                <th className="py-2.5 px-3">EVENT ID</th>
                <th className="py-2.5 px-3">EVENT TYPE</th>
                <th className="py-2.5 px-3">ENDPOINT</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">DELIVERY TIME</th>
                <th className="py-2.5 px-3">RESPONSE TIME</th>
                <th className="py-2.5 px-3 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{evt.event_id}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{evt.event_type}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{evt.endpoint_name}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{evt.delivery_time}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">{evt.response_time_ms}ms</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 text-right">{evt.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Showing 1 to {filteredEvents.length} of 12,450,678 results</span>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">1</span>
            <span className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-semibold">2</span>
            <span className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-semibold">3</span>
            <span className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-semibold">4</span>
            <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
