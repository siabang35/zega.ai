import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Key,
  CreditCard,
  Bell,
  Lock,
  Link2,
  Sliders,
  Save,
  Plus,
  X
} from 'lucide-react';
import { enterpriseSupabaseService } from '../../services/enterpriseSupabaseService';
import { useLanguage } from '../../../../i18n/translations';

import { GeneralTab } from './settings/GeneralTab';
import { SecurityTab } from './settings/SecurityTab';
import { ApiAccessTab } from './settings/ApiAccessTab';
import { BillingTab } from './settings/BillingTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { PrivacyTab } from './settings/PrivacyTab';
import { IntegrationsTab } from './settings/IntegrationsTab';
import { AdvancedTab } from './settings/AdvancedTab';

interface SettingsViewProps {
  onTriggerToast?: (msg: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export function SettingsView({ onTriggerToast, onUpdateAvatar }: SettingsViewProps) {
  const { t } = useLanguage();
  const v = t?.enterpriseViews?.settings || {
    title: 'System & Security Settings',
    subtitle: 'Manage your enterprise organization settings, security policies, API access, and integrations.',
    generalTab: 'General Profile',
    securityTab: 'Security & SSO',
    apiAccessTab: 'API & Access',
    billingTab: 'Billing & Plan',
    notificationsTab: 'Notifications',
    privacyTab: 'Data & Privacy',
    integrationsTab: 'Integrations',
    advancedTab: 'Advanced Config',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    createApiKey: 'Create API Key',
  };

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // States
  const [settings, setSettings] = useState<any>({
    organization_name: 'Acme Enterprise',
    website: 'https://acme.com',
    description: 'Acme Enterprise is building the future with AI-powered automation.',
    primary_contact_email: 'admin@acme.com',
    industry: 'Technology',
    organization_size: '1001+ employees',
    session_timeout_minutes: 30
  });

  const handleUpdateSettings = (newSettings: any) => {
    setSettings(newSettings);
    const newAvatar = newSettings.user_avatar || newSettings.logo_cdn_url;
    if (newAvatar && onUpdateAvatar) {
      onUpdateAvatar(newAvatar);
    }
  };

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [billingInvoices, setBillingInvoices] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [notificationsConfig, setNotificationsConfig] = useState<any>({
    email_notifications: true,
    in_app_notifications: true,
    slack_notifications: true,
    webhook_notifications: true,
    security_alerts: true,
    system_alerts: true,
    billing_alerts: true,
    usage_alerts: true
  });

  const [dataPrivacy, setDataPrivacy] = useState<any>({
    primary_region: 'Asia Pacific (Singapore)',
    backup_region: 'ap-southeast-3 (AWS Jakarta)',
    telemetry_retention: '12 Months',
    audit_logs_retention: '24 Months',
    user_activity_retention: '12 Months',
    api_logs_retention: '6 Months',
    chat_retention: '18 Months',
    anonymize_telemetry: true,
    allow_product_improvement: false
  });

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [advancedConfig, setAdvancedConfig] = useState<any>({
    environment: 'Production',
    log_level: 'Info',
    maintenance_mode: false,
    rate_limiting_mode: 'Standard',
    concurrency: 10,
    allow_legacy_api: false,
    api_response_caching: true,
    webhook_retries: 5,
    webhook_timeout: 30,
    enable_graphql: true,
    beta_features: true,
    ai_model_preview: true,
    vector_compression: false,
    custom_domains: true
  });

  // Modals
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState('Production');
  const [newKeyPerms, setNewKeyPerms] = useState('Full Access');

  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);
  const [newIntegName, setNewIntegName] = useState('');
  const [newIntegDomain, setNewIntegDomain] = useState('');
  const [newIntegCategory, setNewIntegCategory] = useState('Enterprise');

  // Realtime Subscriptions
  useEffect(() => {
    const unsubGen = enterpriseSupabaseService.getGeneralSettingsRealtime((d) => {
      setSettings(d);
      if (d?.user_avatar || d?.logo_cdn_url) {
        if (onUpdateAvatar) onUpdateAvatar(d.user_avatar || d.logo_cdn_url);
      }
    });
    const unsubKeys = enterpriseSupabaseService.getSettingsApiKeysRealtime((k) => setApiKeys(k));
    const unsubInv = enterpriseSupabaseService.getBillingInvoicesRealtime((i) => setBillingInvoices(i));
    const unsubSec = enterpriseSupabaseService.getSecurityEventsRealtime((s) => setSecurityEvents(s));
    const unsubNotif = enterpriseSupabaseService.getNotificationConfigRealtime((n) => setNotificationsConfig(n));

    const unsubPriv = enterpriseSupabaseService.getDataPrivacySettingsRealtime((p) => setDataPrivacy(p));
    const unsubInteg = enterpriseSupabaseService.getIntegrationsRealtime((ig) => setIntegrations(ig));
    const unsubAdv = enterpriseSupabaseService.getAdvancedConfigRealtime((a) => setAdvancedConfig(a));

    return () => {
      unsubGen(); unsubKeys(); unsubInv(); unsubSec(); unsubNotif();
      unsubPriv(); unsubInteg(); unsubAdv();
    };
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await enterpriseSupabaseService.updateOrganizationProfileRealtime(settings);
      await enterpriseSupabaseService.updateDataPrivacySettingsRealtime(dataPrivacy);
      await enterpriseSupabaseService.updateAdvancedConfigRealtime(advancedConfig);
      
      const newAvatar = settings.user_avatar || settings.logo_cdn_url;
      if (newAvatar && onUpdateAvatar) {
        onUpdateAvatar(newAvatar);
      }

      if (onTriggerToast) onTriggerToast('Pengaturan & Profil Avatar Berhasil Disimpan Realtime!');
    } catch (e: any) {
      if (onTriggerToast) onTriggerToast('Gagal Menyimpan: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const res = await enterpriseSupabaseService.createApiKeyRealtime(newKeyName, newKeyEnv, newKeyPerms);
    if (res.success) {
      if (onTriggerToast) onTriggerToast('API Key Berhasil Dibuat!');
      setShowApiKeyModal(false);
      setNewKeyName('');
    }
  };

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntegName.trim() || !newIntegDomain.trim()) return;
    const res = await enterpriseSupabaseService.addIntegrationRealtime(newIntegName, newIntegDomain, newIntegCategory);
    if (res.success) {
      if (onTriggerToast) onTriggerToast('Integrasi Berhasil Ditambahkan!');
      setShowAddIntegrationModal(false);
      setNewIntegName(''); setNewIntegDomain('');
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Enterprise Admin
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {v.title} / {
              activeTab === 'api_access' ? v.apiAccessTab :
              activeTab === 'billing' ? v.billingTab :
              activeTab === 'privacy' ? v.privacyTab :
              activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
            }
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {v.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'api_access' && (
            <button onClick={() => setShowApiKeyModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs">
              <Plus size={15} /> <span>{v.createApiKey}</span>
            </button>
          )}
          <button onClick={handleSaveAll} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold text-xs cursor-pointer shadow-xs">
            <Save size={15} className={isSaving ? 'animate-spin' : ''} /> <span>{isSaving ? v.saving : v.saveChanges}</span>
          </button>
        </div>
      </div>

      {/* MOBILE TAB SCROLLER & DROPDOWN (lg:hidden) */}
      <div className="lg:hidden space-y-3">
        {/* Dropdown Select for Small Mobile Screens */}
        <div className="sm:hidden">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
            Navigasi Sub-Menu Settings:
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs text-slate-900 dark:text-slate-100 shadow-2xs"
          >
            {[
              { id: 'general', label: 'General' },
              { id: 'security', label: 'Security' },
              { id: 'api_access', label: 'API & Access' },
              { id: 'billing', label: 'Billing & Plan' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'privacy', label: 'Data & Privacy' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'advanced', label: 'Advanced' },
            ].map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Horizontal Touch Scroll Pill Bar for Tablets & Large Mobiles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'security', label: 'Security', icon: ShieldCheck },
            { id: 'api_access', label: 'API & Access', icon: Key },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy', label: 'Privacy', icon: Lock },
            { id: 'integrations', label: 'Integrations', icon: Link2 },
            { id: 'advanced', label: 'Advanced', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* DESKTOP LEFT SIDEBAR NAVIGATION (hidden lg:block) */}
        <div className="hidden lg:block lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1 shadow-none">
          {[
            { id: 'general', label: 'General', desc: 'Organization profile and basic settings', icon: Settings },
            { id: 'security', label: 'Security', desc: 'Password, SSO, and security policies', icon: ShieldCheck },
            { id: 'api_access', label: 'API & Access', desc: 'API keys, tokens, and access control', icon: Key },
            { id: 'billing', label: 'Billing & Plan', desc: 'Subscription, invoices, and usage', icon: CreditCard },
            { id: 'notifications', label: 'Notifications', desc: 'Email and system notifications', icon: Bell },
            { id: 'privacy', label: 'Data & Privacy', desc: 'Data retention and privacy settings', icon: Lock },
            { id: 'integrations', label: 'Integrations', desc: 'Manage connected services', icon: Link2 },
            { id: 'advanced', label: 'Advanced', desc: 'Advanced configuration options', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400 mt-0.5' : 'text-slate-400 mt-0.5'} />
                <div className="truncate">
                  <span className="text-xs block font-bold leading-tight">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal block truncate mt-0.5">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="lg:col-span-9">
          {activeTab === 'general' && (
            <GeneralTab 
              settings={settings} 
              setSettings={handleUpdateSettings} 
              onTriggerToast={onTriggerToast} 
              onUpdateAvatar={onUpdateAvatar}
            />
          )}
          {activeTab === 'security' && <SecurityTab securityEvents={securityEvents} onTriggerToast={onTriggerToast} />}
          {activeTab === 'api_access' && <ApiAccessTab apiKeys={apiKeys} setShowApiKeyModal={setShowApiKeyModal} onTriggerToast={onTriggerToast} />}
          {activeTab === 'billing' && <BillingTab billingInvoices={billingInvoices} onTriggerToast={onTriggerToast} />}
          {activeTab === 'notifications' && <NotificationsTab notificationsConfig={notificationsConfig} setNotificationsConfig={setNotificationsConfig} onTriggerToast={onTriggerToast} />}
          {activeTab === 'privacy' && <PrivacyTab dataPrivacy={dataPrivacy} setDataPrivacy={setDataPrivacy} onTriggerToast={onTriggerToast} />}
          {activeTab === 'integrations' && <IntegrationsTab integrations={integrations} setShowAddIntegrationModal={setShowAddIntegrationModal} onTriggerToast={onTriggerToast} />}
          {activeTab === 'advanced' && <AdvancedTab advancedConfig={advancedConfig} setAdvancedConfig={setAdvancedConfig} onTriggerToast={onTriggerToast} />}
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New API Key</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateApiKey} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Key Description / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Analytics Pipeline Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Environment</label>
                <select
                  value={newKeyEnv}
                  onChange={(e) => setNewKeyEnv(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option>Production</option>
                  <option>Staging</option>
                  <option>Development</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Permissions</label>
                <select
                  value={newKeyPerms}
                  onChange={(e) => setNewKeyPerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option>Full Access</option>
                  <option>Read / Write</option>
                  <option>Read Only</option>
                  <option>Billing</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowApiKeyModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Generate API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INTEGRATION MODAL */}
      {showAddIntegrationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Integration</h3>
              <button onClick={() => setShowAddIntegrationModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddIntegration} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Integration Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jira Cloud"
                  value={newIntegName}
                  onChange={(e) => setNewIntegName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Domain</label>
                <input
                  type="text"
                  placeholder="e.g. atlassian.net"
                  value={newIntegDomain}
                  onChange={(e) => setNewIntegDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Category</label>
                <select
                  value={newIntegCategory}
                  onChange={(e) => setNewIntegCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option>Enterprise</option>
                  <option>Security</option>
                  <option>Data & Storage</option>
                  <option>Analytics</option>
                  <option>Communication</option>
                  <option>Development</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddIntegrationModal(false)} className="px-3.5 py-1.5 rounded-xl border text-slate-600 font-bold text-xs">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  Hubungkan Integrasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
