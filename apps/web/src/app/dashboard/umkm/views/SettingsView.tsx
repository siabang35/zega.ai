import React, { useState, useEffect } from 'react';
import { SupabaseDashboardService } from '../../services/supabaseService';
import { useLanguage } from '../../../../i18n/translations';
import { ProfileTab } from './settings/ProfileTab';
import { TeamTab } from './settings/TeamTab';
import { IntegrationsTab } from './settings/IntegrationsTab';
import { AIPreferencesTab } from './settings/AIPreferencesTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { SecurityTab } from './settings/SecurityTab';
import { BillingTab } from './settings/BillingTab';
import { ApiKeysTab } from './settings/ApiKeysTab';
import { SystemTab } from './settings/SystemTab';

interface SettingsViewProps {
  triggerToast: (msg: string) => void;
}

export function SettingsView({ triggerToast }: SettingsViewProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Profil & Akun');
  
  // API Keys & Integrations state
  const [webhookUrl, setWebhookUrl] = useState('https://app.zega.ai/webhook/stripe');
  const [integrationsList, setIntegrationsList] = useState<any[]>([
    { id: 'wa', key: 'wa', name: 'WhatsApp Business', status: 'Terhubung', account: '+62 812-3456-7890' },
    { id: 'ig', key: 'ig', name: 'Instagram', status: 'Terhubung', account: '@tokocikcik.berluk' },
    { id: 'shopee', key: 'shopee', name: 'Shopee', status: 'Terhubung', account: 'tokocikcik.berluk' },
    { id: 'tiktok', key: 'tiktok', name: 'TikTok', status: 'Terhubung', account: '@tokocikcik.berluk' },
    { id: 'stripe', key: 'stripe', name: 'Stripe Connect', status: 'Terhubung', account: '•••• •••• 4242' },
    { id: 'midtrans', key: 'midtrans', name: 'Midtrans', status: 'Terhubung', account: 'Merchant ID: 01234567' },
    { id: 'qris', key: 'qris', name: 'QRIS (VA)', status: 'Terhubung', account: 'Bank Permata •••• 8888' },
    { id: 'x402', key: 'x402', name: 'x402 Network', status: 'Terhubung', account: 'Wallet: 0x773...a9b2' }
  ]);

  // Profile overview state
  const [profileOverview, setProfileOverview] = useState<any>({
    profile: null,
    security: null,
    devices: [],
    activities: []
  });

  const loadSettingsData = async () => {
    try {
      const [settingsData, profileData] = await Promise.all([
        SupabaseDashboardService.getUmkmSettingsOverview(),
        SupabaseDashboardService.getUmkmUserProfileOverview()
      ]);

      if (settingsData) {
        if (settingsData.apiKeys?.webhook_url) setWebhookUrl(settingsData.apiKeys.webhook_url);
        if (settingsData.integrations && Array.isArray(settingsData.integrations) && settingsData.integrations.length > 0) {
          setIntegrationsList(settingsData.integrations);
        }
      }

      if (profileData) {
        setProfileOverview(profileData);
      }
    } catch (e) {
      console.warn('Error loading settings overview:', e);
    }
  };

  useEffect(() => {
    loadSettingsData();
    const unsub1 = SupabaseDashboardService.subscribeToSettingsRealtime(() => {
      loadSettingsData();
    });
    const unsub2 = SupabaseDashboardService.subscribeToProfileRealtime(() => {
      loadSettingsData();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const tabs = [
    'Profil & Akun',
    'Tim & Pengguna',
    'Integrasi',
    'AI Preferences',
    'Notifikasi',
    'Keamanan',
    'Billing & Invoice',
    'API Keys',
    'System'
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t.settingsView?.title || (activeTab === 'Profil & Akun' ? 'Profil Saya' : activeTab)}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
          {t.settingsView?.subtitle || (activeTab === 'Profil & Akun' 
            ? 'Kelola informasi akun, preferensi, dan pengaturan pribadi Anda.' 
            : 'Kelola akun, tim, integrasi, preferensi, dan keamanan sistem Anda.')}
        </p>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto pb-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2.5 cursor-pointer transition-colors relative border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-orange-500 text-slate-900 dark:text-slate-100 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 3. Conditional Sub-Tab Rendering */}
      {activeTab === 'Profil & Akun' && (
        <ProfileTab
          profileData={profileOverview.profile}
          securityData={profileOverview.security}
          devicesList={profileOverview.devices}
          activitiesList={profileOverview.activities}
          triggerToast={triggerToast}
          onRefresh={loadSettingsData}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'Tim & Pengguna' && (
        <TeamTab triggerToast={triggerToast} />
      )}

      {activeTab === 'Integrasi' && (
        <IntegrationsTab
          triggerToast={triggerToast}
          integrationsList={integrationsList}
          webhookUrl={webhookUrl}
          onRefresh={loadSettingsData}
        />
      )}

      {activeTab === 'AI Preferences' && (
        <AIPreferencesTab triggerToast={triggerToast} />
      )}

      {activeTab === 'Notifikasi' && (
        <NotificationsTab triggerToast={triggerToast} />
      )}

      {activeTab === 'Keamanan' && (
        <SecurityTab
          triggerToast={triggerToast}
          securityData={profileOverview.security}
        />
      )}

      {activeTab === 'Billing & Invoice' && (
        <BillingTab
          triggerToast={triggerToast}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'API Keys' && (
        <ApiKeysTab triggerToast={triggerToast} />
      )}

      {activeTab === 'System' && (
        <SystemTab triggerToast={triggerToast} />
      )}
    </div>
  );
}
