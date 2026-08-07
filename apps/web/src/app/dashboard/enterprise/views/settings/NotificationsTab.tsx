import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, ShieldAlert, Zap, Sliders, ArrowRight, X, ExternalLink, Settings, Check, RefreshCw } from 'lucide-react';
import { enterpriseSupabaseService } from '../../../services/enterpriseSupabaseService';

interface NotificationsTabProps {
  notificationsConfig: any;
  setNotificationsConfig: (n: any) => void;
  onTriggerToast?: (msg: string) => void;
}

export function NotificationsTab({ notificationsConfig, setNotificationsConfig, onTriggerToast }: NotificationsTabProps) {
  // Modals state
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXXX');
  const [slackChannel, setSlackChannel] = useState('#zega-alerts');

  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.acme.com/webhooks/zega-events');
  const [webhookSecret, setWebhookSecret] = useState('whsec_zega_live_9948271');

  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showAllNotificationsModal, setShowAllNotificationsModal] = useState(false);

  const handleToggle = async (key: string, val: boolean) => {
    const newConfig = { ...notificationsConfig, [key]: val };
    setNotificationsConfig(newConfig);
    await enterpriseSupabaseService.updateNotificationConfigRealtime(newConfig);
    if (onTriggerToast) onTriggerToast(`Notifikasi ${key} Berhasil Diperbarui di DB!`);
  };

  const handleSaveSlackConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = { ...notificationsConfig, slack_webhook: slackWebhookUrl, slack_channel: slackChannel };
    setNotificationsConfig(newConfig);
    await enterpriseSupabaseService.updateNotificationConfigRealtime(newConfig);
    if (onTriggerToast) onTriggerToast(`Konfigurasi Slack Channel (${slackChannel}) Berhasil Disimpan!`);
    setShowSlackModal(false);
  };

  const handleSaveWebhookConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig = { ...notificationsConfig, webhook_url: webhookUrl, webhook_secret: webhookSecret };
    setNotificationsConfig(newConfig);
    await enterpriseSupabaseService.updateNotificationConfigRealtime(newConfig);
    if (onTriggerToast) onTriggerToast('Konfigurasi Custom HTTP Webhook Berhasil Disimpan!');
    setShowWebhookModal(false);
  };

  // Recent Notifications Data matching Screenshot
  const recentNotifications = [
    { id: '1', time: 'May 27, 2025 10:30:45 AM', type: 'Security Alert', typeIcon: ShieldAlert, title: 'New login from unknown device', channel: 'Email', status: 'Delivered' },
    { id: '2', time: 'May 27, 2025 09:15:22 AM', type: 'System Alert', typeIcon: Bell, title: 'Scheduled maintenance completed', channel: 'In App', status: 'Delivered' },
    { id: '3', time: 'May 27, 2025 08:45:10 AM', type: 'Usage Alert', typeIcon: Zap, title: 'API quota usage is at 80%', channel: 'Email', status: 'Delivered' },
  ];

  return (
    <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
      {/* 1. TOP ROW: NOTIFICATION OVERVIEW (4 KPI CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Email Notifications</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
            {notificationsConfig.email_notifications !== false ? 'Enabled' : 'Disabled'}
          </span>
          <span className="text-[10px] text-slate-400 block">All systems</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">System Alerts</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
            {notificationsConfig.system_alerts !== false ? 'Enabled' : 'Disabled'}
          </span>
          <span className="text-[10px] text-slate-400 block">Critical events</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Security Alerts</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
            {notificationsConfig.security_alerts !== false ? 'Enabled' : 'Disabled'}
          </span>
          <span className="text-[10px] text-slate-400 block">Real-time</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block">Weekly Digest</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
            {notificationsConfig.weekly_digest !== false ? 'Enabled' : 'Disabled'}
          </span>
          <span className="text-[10px] text-slate-400 block">Every Monday</span>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: 2 COLUMNS (CHANNELS VS PREFERENCES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (7 cols): NOTIFICATION CHANNELS */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notification Channels</h3>

          <div className="space-y-3">
            {/* Row 1: Email */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Email Notifications</span>
                  <span className="text-[10px] text-slate-400">Receive notifications via email</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Enabled
                </span>
                <input
                  type="checkbox"
                  checked={notificationsConfig.email_notifications !== false}
                  onChange={(e) => handleToggle('email_notifications', e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Row 2: In-App */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">In-App Notifications</span>
                  <span className="text-[10px] text-slate-400">Receive notifications in the platform</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Enabled</span>
                <input
                  type="checkbox"
                  checked={notificationsConfig.in_app_notifications !== false}
                  onChange={(e) => handleToggle('in_app_notifications', e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Row 3: Slack */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Slack Notifications</span>
                  <span className="text-[10px] text-slate-400">Send notifications to Slack channels</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSlackModal(true)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  Configure
                </button>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Enabled</span>
                <input
                  type="checkbox"
                  checked={notificationsConfig.slack_notifications !== false}
                  onChange={(e) => handleToggle('slack_notifications', e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Row 4: Webhook */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Webhook Notifications</span>
                  <span className="text-[10px] text-slate-400">Send notifications to your webhook endpoints</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWebhookModal(true)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
                >
                  Configure
                </button>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Enabled</span>
                <input
                  type="checkbox"
                  checked={notificationsConfig.webhook_notifications !== false}
                  onChange={(e) => handleToggle('webhook_notifications', e.target.checked)}
                  className="size-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): NOTIFICATION PREFERENCES */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notification Preferences</h3>

            <div className="space-y-3">
              {[
                { key: 'security_alerts', label: 'Security Alerts', desc: 'Critical security events and login alerts', icon: ShieldAlert },
                { key: 'system_alerts', label: 'System Alerts', desc: 'System status and maintenance alerts', icon: Bell },
                { key: 'billing_alerts', label: 'Billing Alerts', desc: 'Billing and subscription notifications', icon: Zap },
                { key: 'usage_alerts', label: 'Usage Alerts', desc: 'Usage limit and quota notifications', icon: Sliders },
                { key: 'product_updates', label: 'Product Updates', desc: 'New features and product updates', icon: Mail },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig[item.key] !== false}
                    onChange={(e) => handleToggle(item.key, e.target.checked)}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Edit Preferences</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: RECENT NOTIFICATIONS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-none">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Notifications</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5">Time</th>
                <th className="pb-2.5">Type</th>
                <th className="pb-2.5">Title</th>
                <th className="pb-2.5">Channel</th>
                <th className="pb-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentNotifications.map((notif) => (
                <tr key={notif.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 text-slate-500 font-medium text-[11px]">{notif.time}</td>
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-1.5">
                      <notif.typeIcon size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{notif.type}</span>
                    </span>
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">{notif.title}</td>
                  <td className="py-3 text-slate-500 font-medium">{notif.channel}</td>
                  <td className="py-3 text-right">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {notif.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowAllNotificationsModal(true)}
            className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all notifications</span> <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* MODAL 1: CONFIGURE SLACK WEBHOOK */}
      {showSlackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configure Slack Webhook</h3>
              <button onClick={() => setShowSlackModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSlackConfig} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Slack Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Slack Channel Name</label>
                <input
                  type="text"
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowSlackModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Simpan Konfigurasi Slack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURE WEBHOOK ENDPOINT */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configure HTTP Webhook Endpoint</h3>
              <button onClick={() => setShowWebhookModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveWebhookConfig} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Payload Destination URL</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">HMAC Secret Signing Key</label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowWebhookModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Simpan Webhook Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PREFERENCES MODAL */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Detailed Alert Frequency & Rules</h3>
              <button onClick={() => setShowPreferencesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Immediate Incident Paging</span>
                <span className="text-[11px] text-slate-500 block">Trigger PagerDuty / Opsgenie alert when API response error rate exceeds 2%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Quiet Hours</span>
                <span className="text-[11px] text-slate-500 block">Suppress low-priority product update emails between 10:00 PM and 06:00 AM UTC</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowPreferencesModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW ALL NOTIFICATIONS */}
      {showAllNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-xl space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Audit Alert Log History</h3>
              <button onClick={() => setShowAllNotificationsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Message</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentNotifications.map((notif) => (
                    <tr key={notif.id}>
                      <td className="py-2.5 text-slate-500 font-mono text-[10px]">{notif.time}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{notif.type}</td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">{notif.title}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">{notif.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowAllNotificationsModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
