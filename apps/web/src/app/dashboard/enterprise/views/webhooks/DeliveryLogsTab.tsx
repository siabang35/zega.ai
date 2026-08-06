import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Code,
  Copy
} from 'lucide-react';

export interface WebhookDeliveryLogItem {
  id: string;
  delivery_id: string;
  event_id: string;
  endpoint_name: string;
  status: 'Success' | 'Failed' | 'Timeout';
  response_code: number;
  response_time_ms: number;
  attempts: number;
  delivered_at: string;
  payload_json?: any;
  response_body_text?: string;
}

interface DeliveryLogsTabProps {
  logs: WebhookDeliveryLogItem[];
  onTriggerToast?: (msg: string) => void;
}

export function DeliveryLogsTab({ logs, onTriggerToast }: DeliveryLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('All Endpoints');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLogItem | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  const defaultLogs: WebhookDeliveryLogItem[] = [
    {
      id: 'del_1',
      delivery_id: 'del_83H128383H837128383H3_1',
      event_id: 'evt_01H9812489182491290190',
      endpoint_name: 'Checkout Webhook',
      status: 'Success',
      response_code: 200,
      response_time_ms: 240,
      attempts: 1,
      delivered_at: 'May 27, 2025 10:30:45 AM',
      payload_json: {
        event: 'checkout.completed',
        order_id: 'ord_99812',
        amount: 499.00,
        currency: 'USD',
        customer: { email: 'client@company.com', id: 'usr_882' }
      },
      response_body_text: '{"status": "ok", "order_processed": true}'
    },
    {
      id: 'del_2',
      delivery_id: 'del_83H128383H837128383H3_2',
      event_id: 'evt_01H9812489182491290191',
      endpoint_name: 'Invoice Webhook',
      status: 'Success',
      response_code: 200,
      response_time_ms: 312,
      attempts: 1,
      delivered_at: 'May 27, 2025 10:30:42 AM',
      payload_json: { event: 'invoice.paid', invoice_id: 'inv_441' },
      response_body_text: '{"status": "ok"}'
    },
    {
      id: 'del_3',
      delivery_id: 'del_83H128383H837128383H3_3',
      event_id: 'evt_01H9812489182491290193',
      endpoint_name: 'Finance Events',
      status: 'Failed',
      response_code: 500,
      response_time_ms: 502,
      attempts: 3,
      delivered_at: 'May 27, 2025 10:30:30 AM',
      payload_json: { event: 'subscription.updated', sub_id: 'sub_112' },
      response_body_text: '{"error": "Internal Server Error"}'
    },
    {
      id: 'del_4',
      delivery_id: 'del_83H128383H837128383H3_4',
      event_id: 'evt_01H9812489182491290193',
      endpoint_name: 'Finance Events',
      status: 'Failed',
      response_code: 502,
      response_time_ms: 500,
      attempts: 2,
      delivered_at: 'May 27, 2025 10:29:43 AM',
      payload_json: { event: 'subscription.updated', sub_id: 'sub_112' },
      response_body_text: '{"error": "Bad Gateway"}'
    },
    {
      id: 'del_5',
      delivery_id: 'del_83H128383H837128383H3_5',
      event_id: 'evt_01H9812489182491290193',
      endpoint_name: 'Finance Events',
      status: 'Timeout',
      response_code: 408,
      response_time_ms: 10000,
      attempts: 1,
      delivered_at: 'May 27, 2025 10:29:18 AM',
      payload_json: { event: 'subscription.updated', sub_id: 'sub_112' },
      response_body_text: '{"error": "Request Timeout"}'
    }
  ];

  const displayList = logs.length > 0 ? logs : defaultLogs;

  const activeLog = selectedLog || displayList[0];

  const filteredLogs = displayList.filter((l) => {
    const matchesSearch =
      l.delivery_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.endpoint_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEp = selectedEndpoint === 'All Endpoints' || l.endpoint_name === selectedEndpoint;
    const matchesStatus = selectedStatus === 'All Statuses' || l.status === selectedStatus;
    return matchesSearch && matchesEp && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 5 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: TOTAL DELIVERIES */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Deliveries (24h)</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ▲ 18.4% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            12.45M
          </div>
        </div>

        {/* CARD 2: SUCCESSFUL DELIVERIES */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Successful Deliveries</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              ▲ 18.4% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            12.36M
          </div>
        </div>

        {/* CARD 3: FAILED DELIVERIES */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed Deliveries</span>
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
              ▼ 7.8% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            89,312
          </div>
        </div>

        {/* CARD 4: RETRY ATTEMPTS */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Retry Attempts</span>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
              ▲ 4.2% vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            243,671
          </div>
        </div>

        {/* CARD 5: AVERAGE LATENCY */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Latency</span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              -12ms vs last 7d
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            312ms
          </div>
        </div>
      </div>

      {/* SEARCH, TABLE & RIGHT DETAILS DRAWER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT (8 cols): SEARCH & LOGS TABLE */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search delivery logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                <option value="All Endpoints">All Endpoints</option>
                <option value="Checkout Webhook">Checkout Webhook</option>
                <option value="Invoice Webhook">Invoice Webhook</option>
                <option value="Finance Events">Finance Events</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Timeout">Timeout</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-black">
                  <th className="py-2.5 px-3">DELIVERY ID</th>
                  <th className="py-2.5 px-3">EVENT ID</th>
                  <th className="py-2.5 px-3">ENDPOINT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">CODE</th>
                  <th className="py-2.5 px-3">LATENCY</th>
                  <th className="py-2.5 px-3 text-right">DELIVERED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLogs.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedLog(l)}
                    className={`cursor-pointer transition-colors ${
                      activeLog?.id === l.id
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-bold'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-900 dark:text-slate-100 font-bold">
                      <span className="truncate max-w-[120px] block">{l.delivery_id}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      <span className="truncate max-w-[120px] block">{l.event_id}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{l.endpoint_name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'Success'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{l.response_code}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{l.response_time_ms}ms</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 text-right">{l.delivered_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT (4 cols): DELIVERY DETAILS DRAWER CARD */}
        {activeLog && (
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Delivery Details</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery ID</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold break-all">{activeLog.delivery_id}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Event ID</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold break-all">{activeLog.event_id}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Endpoint</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeLog.endpoint_name}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5 ${
                    activeLog.status === 'Success'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                  }`}
                >
                  {activeLog.status} ({activeLog.response_code})
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Response Code</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeLog.response_code} OK</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Response Time</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeLog.response_time_ms}ms</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attempts</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{activeLog.attempts}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivered At</span>
                <span className="font-mono text-slate-500 text-[11px]">{activeLog.delivered_at}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPayloadModal(true)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Code size={14} />
              <span>View Full Payload</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW FULL PAYLOAD MODAL */}
      {showPayloadModal && activeLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Webhook Payload JSON</h3>
                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{activeLog.event_id}</span>
              </div>
              <button
                onClick={() => setShowPayloadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                Close ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto max-h-[350px]">
              <pre>{JSON.stringify(activeLog.payload_json || { event: 'checkout.completed', status: 'success' }, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(activeLog.payload_json, null, 2));
                  if (onTriggerToast) onTriggerToast('📋 Payload copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={12} />
                <span>Copy Payload</span>
              </button>

              <button
                onClick={() => setShowPayloadModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
