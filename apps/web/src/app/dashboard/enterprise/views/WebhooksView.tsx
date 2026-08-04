import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface WebhooksViewProps {
  onTriggerToast?: (msg: string) => void;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  eventsCount: number;
  status: 'Active' | 'Paused';
  successRate: string;
  lastDelivery: string;
}

interface RecentDelivery {
  id: string;
  title: string;
  event: string;
  status: 'Success' | 'Failed';
  statusCode: number;
  timeAgo: string;
}

export function WebhooksView({ onTriggerToast }: WebhooksViewProps) {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'events' | 'logs' | 'settings'>('endpoints');
  const [showSecret, setShowSecret] = useState(false);
  const [testEvent, setTestEvent] = useState('checkout.completed');
  const [sendingTest, setSendingTest] = useState(false);

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([
    {
      id: 'ep_1',
      url: 'https://api.acme.com/webhooks/zega',
      eventsCount: 12,
      status: 'Active',
      successRate: '99.81%',
      lastDelivery: '8 sec ago',
    },
    {
      id: 'ep_2',
      url: 'https://hooks.acme.com/zega/finance',
      eventsCount: 8,
      status: 'Active',
      successRate: '99.62%',
      lastDelivery: '28 sec ago',
    },
    {
      id: 'ep_3',
      url: 'https://webhook.site/abc123',
      eventsCount: 5,
      status: 'Active',
      successRate: '98.99%',
      lastDelivery: '1 min ago',
    },
    {
      id: 'ep_4',
      url: 'https://app.acme.com/integrations/zega',
      eventsCount: 10,
      status: 'Paused',
      successRate: '-',
      lastDelivery: '1 day ago',
    },
  ]);

  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([
    { id: 'del_1', title: 'Checkout Completed', event: 'payment.checkout.completed', status: 'Success', statusCode: 200, timeAgo: '8 sec ago' },
    { id: 'del_2', title: 'Invoice Paid', event: 'invoice.paid', status: 'Success', statusCode: 200, timeAgo: '18 sec ago' },
    { id: 'del_3', title: 'Workflow Execution', event: 'workflow.execution.completed', status: 'Success', statusCode: 200, timeAgo: '28 sec ago' },
    { id: 'del_4', title: 'Refund Processed', event: 'refund.processed', status: 'Failed', statusCode: 400, timeAgo: '45 sec ago' },
    { id: 'del_5', title: 'Agent Error', event: 'agent.error', status: 'Success', statusCode: 200, timeAgo: '1 min ago' },
  ]);

  const handleAddEndpoint = () => {
    const newEp: WebhookEndpoint = {
      id: `ep_${Date.now()}`,
      url: 'https://api.acme.com/webhooks/custom',
      eventsCount: 4,
      status: 'Active',
      successRate: '100%',
      lastDelivery: 'Just now',
    };
    setEndpoints((prev) => [newEp, ...prev]);
    if (onTriggerToast) onTriggerToast('Endpoint Webhook Baru Berhasil Ditambahkan!');
  };

  const handleSendTest = () => {
    setSendingTest(true);
    setTimeout(() => {
      setSendingTest(false);
      const newDel: RecentDelivery = {
        id: `del_${Date.now()}`,
        title: 'Test Event Triggered',
        event: testEvent,
        status: 'Success',
        statusCode: 200,
        timeAgo: 'Just now',
      };
      setRecentDeliveries((prev) => [newDel, ...prev]);
      if (onTriggerToast) onTriggerToast(`Uji Coba Webhook Event ${testEvent} Berhasil Dikirim (200 OK)!`);
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Webhooks
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Configure and manage webhook endpoints for real-time events.
          </p>
        </div>

        <button
          onClick={handleAddEndpoint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>Add Endpoint</span>
        </button>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'endpoints', label: 'Endpoints' },
          { id: 'events', label: 'Events' },
          { id: 'logs', label: 'Delivery Logs' },
          { id: 'settings', label: 'Settings' },
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

      {/* SECTION 1: WEBHOOK ENDPOINTS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Webhook Endpoints</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-2.5 px-3">ENDPOINT</th>
                <th className="py-2.5 px-3">EVENTS</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">SUCCESS RATE</th>
                <th className="py-2.5 px-3">LAST DELIVERY</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {endpoints.map((ep) => (
                <tr key={ep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="truncate max-w-[280px] block">{ep.url}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{ep.eventsCount} events</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ep.status === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {ep.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{ep.successRate}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{ep.lastDelivery}</td>
                  <td className="py-3 px-3 text-right">
                    <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: RECENT DELIVERIES & ENDPOINT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left (7 cols): Recent Deliveries */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Deliveries</h3>
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Deliveries →
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentDeliveries.map((del) => (
              <div
                key={del.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                      del.status === 'Success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {del.status === 'Success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{del.title}</p>
                    <p className="text-[10.5px] font-mono text-slate-500">{del.event}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      del.status === 'Success'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                    }`}
                  >
                    {del.status} {del.statusCode}
                  </span>
                  <span className="text-slate-400">{del.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (5 cols): Endpoint Details & Test */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Endpoint Details</h3>
            <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
              https://api.acme.com/webhooks/zega
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Events</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">12</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Created</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">May 10, 2025</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Secret</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-700 dark:text-slate-300">{showSecret ? 'sec_88921a009fb24c' : 'sec_••••••••••••'}</span>
                <button onClick={() => setShowSecret(!showSecret)} className="text-indigo-600 text-[10.5px] font-bold hover:underline">
                  {showSecret ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Retry Policy</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">3 attempts</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Timeout</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">10 seconds</span>
            </div>
          </div>

          {/* Test Endpoint Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Test Endpoint</h4>
            <p className="text-[11px] text-slate-500">Send a test event to this endpoint.</p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono">
                <span>Test Event: {testEvent}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              <button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {sendingTest ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
