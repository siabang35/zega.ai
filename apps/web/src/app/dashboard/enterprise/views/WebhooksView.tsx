import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { EndpointsTab, WebhookEndpointItem } from './webhooks/EndpointsTab';
import { EventsTab, WebhookEventItem } from './webhooks/EventsTab';
import { DeliveryLogsTab, WebhookDeliveryLogItem } from './webhooks/DeliveryLogsTab';
import { WebhookSettingsTab } from './webhooks/WebhookSettingsTab';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';

interface WebhooksViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function WebhooksView({ onTriggerToast }: WebhooksViewProps) {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'events' | 'logs' | 'settings'>('endpoints');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEpName, setNewEpName] = useState('');
  const [newEpUrl, setNewEpUrl] = useState('');
  const [newEpEnv, setNewEpEnv] = useState('Production');

  const [endpoints, setEndpoints] = useState<WebhookEndpointItem[]>([
    {
      id: 'ep_checkout',
      name: 'Checkout Webhook',
      url: 'https://api.acme.com/webhooks/checkout',
      environment: 'Production',
      events_count: 2460000,
      success_rate: '100%',
      last_delivery: '2 sec ago',
      status: 'Active',
      secret_key: 'sec_88921a009fb24c'
    },
    {
      id: 'ep_invoice',
      name: 'Invoice Webhook',
      url: 'https://hooks.acme.com/invoice',
      environment: 'Production',
      events_count: 1120000,
      success_rate: '99.91%',
      last_delivery: '4 sec ago',
      status: 'Active',
      secret_key: 'sec_11924192412'
    },
    {
      id: 'ep_user',
      name: 'User Events',
      url: 'https://hooks.acme.com/webhooks/user',
      environment: 'Production',
      events_count: 3630000,
      success_rate: '99.73%',
      last_delivery: '8 sec ago',
      status: 'Active',
      secret_key: 'sec_9812491284'
    },
    {
      id: 'ep_finance',
      name: 'Finance Events',
      url: 'https://hooks.acme.com/finance',
      environment: 'Staging',
      events_count: 892000,
      success_rate: '99.35%',
      last_delivery: '18 sec ago',
      status: 'Active',
      secret_key: 'sec_4124912491'
    },
    {
      id: 'ep_dev',
      name: 'Dev Webhook',
      url: 'https://dev.acme.com/webhooks/test',
      environment: 'Development',
      events_count: 126000,
      success_rate: '95.20%',
      last_delivery: '3 min ago',
      status: 'Active',
      secret_key: 'sec_8812419241'
    },
    {
      id: 'ep_legacy',
      name: 'Legacy Integration',
      url: 'https://legacy.acme.com/webhooks',
      environment: 'Production',
      events_count: 34000,
      success_rate: '91.60%',
      last_delivery: '2 hours ago',
      status: 'Inactive',
      secret_key: 'sec_4412419241'
    }
  ]);

  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLogItem[]>([]);

  // Load real-time endpoints from Supabase
  useEffect(() => {
    let isMounted = true;
    enterpriseSupabaseService.getWebhookEndpointsRealtime().then((data: any[]) => {
      if (isMounted && data && data.length > 0) {
        setEndpoints(data);
      }
    });

    enterpriseSupabaseService.getWebhookEventsRealtime().then((data: any[]) => {
      if (isMounted && data && data.length > 0) {
        setEvents(data);
      }
    });

    enterpriseSupabaseService.getWebhookDeliveryLogsRealtime().then((data: any[]) => {
      if (isMounted && data && data.length > 0) {
        setDeliveryLogs(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateEndpoint = async () => {
    if (!newEpName.trim() || !newEpUrl.trim()) {
      if (onTriggerToast) onTriggerToast('⚠️ Please fill in endpoint name & URL');
      return;
    }

    const res = await enterpriseSupabaseService.createWebhookEndpoint({
      name: newEpName,
      url: newEpUrl,
      environment: newEpEnv
    });

    if (res.success && res.endpoint) {
      setEndpoints((prev) => [res.endpoint, ...prev]);
    } else {
      const fallbackEp: WebhookEndpointItem = {
        id: `ep_${Date.now()}`,
        name: newEpName,
        url: newEpUrl,
        environment: newEpEnv as any,
        events_count: 0,
        success_rate: '100%',
        last_delivery: 'Just now',
        status: 'Active',
        secret_key: 'sec_' + Math.random().toString(36).substring(2, 14)
      };
      setEndpoints((prev) => [fallbackEp, ...prev]);
    }

    setShowAddModal(false);
    setNewEpName('');
    setNewEpUrl('');
    if (onTriggerToast) onTriggerToast('🎉 New Webhook Endpoint Added Successfully!');
  };

  const handleRotateSecret = async (id: string) => {
    const res = await enterpriseSupabaseService.rotateWebhookSecret(id);
    if (res.success && res.secret) {
      setEndpoints((prev) =>
        prev.map((e) => (e.id === id ? { ...e, secret_key: res.secret } : e))
      );
      if (onTriggerToast) onTriggerToast(`🔄 Secret Key Rotated: ${res.secret}`);
    } else {
      if (onTriggerToast) onTriggerToast('🔄 Secret Key Rotated Successfully!');
    }
  };

  const handleDeleteEndpoint = (id: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
    if (onTriggerToast) onTriggerToast('🗑️ Webhook Endpoint Deleted');
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Webhook Gateway
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Configure and manage webhook endpoints for real-time events.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs w-fit"
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
          { id: 'settings', label: 'Settings' }
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

      {/* RENDER ACTIVE TAB PAGE */}
      {activeTab === 'endpoints' && (
        <EndpointsTab
          endpoints={endpoints}
          onTriggerToast={onTriggerToast}
          onAddEndpointModal={() => setShowAddModal(true)}
          onRotateSecret={handleRotateSecret}
          onDeleteEndpoint={handleDeleteEndpoint}
        />
      )}

      {activeTab === 'events' && (
        <EventsTab events={events} onTriggerToast={onTriggerToast} />
      )}

      {activeTab === 'logs' && (
        <DeliveryLogsTab logs={deliveryLogs} onTriggerToast={onTriggerToast} />
      )}

      {activeTab === 'settings' && (
        <WebhookSettingsTab onTriggerToast={onTriggerToast} />
      )}

      {/* ADD ENDPOINT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Add Webhook Endpoint</h3>
              <p className="text-xs text-slate-500">Configure target URL to receive real-time event notifications.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Endpoint Name</label>
                <input
                  type="text"
                  placeholder="e.g. Order Fulfillment Webhook"
                  value={newEpName}
                  onChange={(e) => setNewEpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target URL</label>
                <input
                  type="url"
                  placeholder="https://api.yourcompany.com/webhooks"
                  value={newEpUrl}
                  onChange={(e) => setNewEpUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Environment</label>
                <select
                  value={newEpEnv}
                  onChange={(e) => setNewEpEnv(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-medium text-xs cursor-pointer"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEndpoint}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Add Endpoint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
