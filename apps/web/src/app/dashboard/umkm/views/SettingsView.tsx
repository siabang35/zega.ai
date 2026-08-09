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
  onUpdateAvatar?: (avatarUrl: string) => void;
  activeSubPage?: string;
}

const tabSlugMap: Record<string, string> = {
  'Overview & Profile': 'profile',
  'Profil & Akun': 'profile',
  'Tim & Pengguna': 'team',
  'Integrasi': 'integrations',
  'AI Preferences': 'ai-preferences',
  'Notifikasi': 'notifications',
  'Keamanan': 'security',
  'Billing & Invoice': 'billing',
  'API Keys': 'api-keys',
  'System': 'system',
};

const slugTabMap: Record<string, string> = {
  profile: 'Overview & Profile',
  'profil-akun': 'Overview & Profile',
  team: 'Tim & Pengguna',
  integrations: 'Integrasi',
  'ai-preferences': 'AI Preferences',
  notifications: 'Notifikasi',
  security: 'Keamanan',
  keamanan: 'Keamanan',
  billing: 'Billing & Invoice',
  'api-keys': 'API Keys',
  system: 'System',
  sistem: 'System',
};

export function SettingsView({ triggerToast, onUpdateAvatar, activeSubPage }: SettingsViewProps) {
  const { t } = useLanguage();

  const getInitialTabFromUrl = () => {
    if (activeSubPage) {
      const cleanSub = activeSubPage.replace(/^settings\/?/, '');
      if (slugTabMap[cleanSub]) return slugTabMap[cleanSub];
    }
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length >= 3 && parts[1] === 'settings') {
        const subSlug = parts[2];
        if (slugTabMap[subSlug]) return slugTabMap[subSlug];
      }
    }
    return 'Overview & Profile';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTabFromUrl);

  useEffect(() => {
    const tabFromUrl = getInitialTabFromUrl();
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [activeSubPage]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    if (typeof window !== 'undefined') {
      const slug = tabSlugMap[tabName] || 'profile';
      const newPath = `/dashboard/settings/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  };
  
  // API Keys & Integrations state
  const [webhookUrl, setWebhookUrl] = useState('https://zega-ai.onrender.com/api/v1/webhook');
  const [integrationsList, setIntegrationsList] = useState<any[]>([
    { id: 'wa', key: 'wa', name: 'WhatsApp Business', category: 'Channel Penjualan', status: 'Terhubung', account: '+62 812-3456-7890' },
    { id: 'ig', key: 'ig', name: 'Instagram', category: 'Social Commerce', status: 'Terhubung', account: '@tokocikcik.berluk' },
    { id: 'shopee', key: 'shopee', name: 'Shopee', category: 'Channel Penjualan', status: 'Terhubung', account: 'tokocikcik.berluk' },
    { id: 'tiktok', key: 'tiktok', name: 'TikTok Shop', category: 'Social Commerce', status: 'Terhubung', account: '@tokocikcik.berluk' },
    { id: 'stripe', key: 'stripe', name: 'Stripe Connect', category: 'Payment Gateway', status: 'Terhubung', account: '•••• •••• 4242' },
    { id: 'midtrans', key: 'midtrans', name: 'Midtrans', category: 'Payment Gateway', status: 'Terhubung', account: 'Merchant ID: 01234567' },
    { id: 'qris', key: 'qris', name: 'QRIS (VA)', category: 'Payment Gateway', status: 'Terhubung', account: 'Bank Permata •••• 8888' },
    { id: 'x402', key: 'x402', name: 'x402 Network', category: 'Web3 Crypto', status: 'Terhubung', account: 'Wallet: 0x773...a9b2' }
  ]);

  // Profile overview state
  const [profileOverview, setProfileOverview] = useState<any>({
    profile: null,
    security: null,
    preferences: null,
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
        if (settingsData.apiKeys?.webhook_url) {
          const rawUrl = settingsData.apiKeys.webhook_url;
          const cleanUrl = (!rawUrl || rawUrl.includes('app.zega.ai')) 
            ? 'https://zega-ai.onrender.com/api/v1/webhook' 
            : rawUrl;
          setWebhookUrl(cleanUrl);
        }
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
    'Overview & Profile',
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
          {t.settingsView?.title || (activeTab === 'Overview & Profile' || activeTab === 'Profil & Akun' ? 'Profil Saya' : (activeTab === 'System' ? 'System & Infrastructure Settings' : activeTab))}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
          {t.settingsView?.subtitle || (activeTab === 'Overview & Profile' || activeTab === 'Profil & Akun'
            ? 'Kelola informasi akun, preferensi, dan pengaturan pribadi Anda.' 
            : (activeTab === 'System' 
                ? 'Kelola kesehatan sistem, konektivitas database Supabase, CDN R2, dan audit trail.' 
                : 'Kelola akun, tim, integrasi, preferensi, dan keamanan sistem Anda.'))}
        </p>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto pb-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab || (tab === 'Overview & Profile' && activeTab === 'Profil & Akun');
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
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
      {(activeTab === 'Overview & Profile' || activeTab === 'Profil & Akun') && (
        <ProfileTab
          profileData={profileOverview.profile}
          securityData={profileOverview.security}
          preferencesData={profileOverview.preferences}
          devicesList={profileOverview.devices}
          activitiesList={profileOverview.activities}
          triggerToast={triggerToast}
          onRefresh={loadSettingsData}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onUpdateAvatar={onUpdateAvatar}
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
