import React, { useState, useMemo } from 'react';
import { CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { HomeView } from './views/HomeView';
import { MyAgentsView } from './views/MyAgentsView';
import { AutomationView } from './views/AutomationView';
import { InboxView } from './views/InboxView';
import { SalesView } from './views/SalesView';
import { FinanceView } from './views/FinanceView';
import { MarketingView } from './views/MarketingView';
import { StoreView } from './views/StoreView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { KnowledgeView } from './views/KnowledgeView';
import { MarketplaceView } from './views/MarketplaceView';
import { BillingView } from './views/BillingView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';

export interface UmkmDashboardProps {
  activeTab?: string;
  userName?: string;
  userEmail?: string;
  isGuest?: boolean;
  onNavigateTab?: (tab: string) => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export function UmkmDashboard({ activeTab: externalTab, userName, userEmail, isGuest, onNavigateTab, onUpdateAvatar }: UmkmDashboardProps) {
  const [internalTab, setInternalTab] = useState('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const displayName = useMemo(() => {
    return userName ? userName.split(' ')[0] : 'Pemilik Toko';
  }, [userName]);

  const currentTab = useMemo(() => {
    if (externalTab === 'umkm' || externalTab === 'home' || externalTab === 'overview' || !externalTab) return 'overview';
    if (externalTab === 'my_agents' || externalTab === 'my_ai_employees') return 'my_agents';
    if (externalTab === 'wa_bot' || externalTab === 'inbox') return 'inbox';
    if (externalTab === 'sales_rekap' || externalTab === 'sales') return 'sales';
    if (externalTab === 'ai_copywriter' || externalTab === 'marketing') return 'marketing';
    if (externalTab === 'invoice_gen' || externalTab === 'finance') return 'finance';
    if (externalTab === 'store') return 'store';
    if (externalTab === 'customers') return 'customers';
    if (externalTab === 'reports') return 'reports';
    if (externalTab === 'knowledge') return 'knowledge';
    if (externalTab === 'automation' || externalTab === 'sandbox') return 'automation';
    if (externalTab === 'marketplace' || externalTab === 'integrations') return 'marketplace';
    if (externalTab === 'billing') return 'billing';
    if (externalTab === 'settings') return 'settings';
    if (externalTab === 'help' || externalTab === 'bantuan') return 'help';
    return internalTab;
  }, [externalTab, internalTab]);

  const handleTabChange = (tab: string) => {
    setInternalTab(tab);
    if (onNavigateTab) onNavigateTab(tab);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-5 pb-16 font-sans text-slate-900 dark:text-slate-100">
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="text-orange-500" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* VIEW RENDERING */}
      {currentTab === 'overview' && (
        <HomeView 
          displayName={displayName} 
          onNavigateTab={handleTabChange} 
          triggerToast={triggerToast} 
        />
      )}
      {currentTab === 'my_agents' && <MyAgentsView triggerToast={triggerToast} />}
      {currentTab === 'automation' && <AutomationView triggerToast={triggerToast} />}
      {currentTab === 'inbox' && <InboxView triggerToast={triggerToast} />}
      {currentTab === 'sales' && <SalesView />}
      {currentTab === 'marketing' && <MarketingView triggerToast={triggerToast} />}
      {currentTab === 'finance' && <FinanceView triggerToast={triggerToast} isGuest={isGuest} userEmail={userEmail} userName={userName} />}
      {currentTab === 'store' && <StoreView triggerToast={triggerToast} />}
      {currentTab === 'customers' && <CustomersView triggerToast={triggerToast} />}
      {currentTab === 'reports' && <ReportsView triggerToast={triggerToast} />}
      {currentTab === 'knowledge' && <KnowledgeView triggerToast={triggerToast} />}
      {currentTab === 'marketplace' && <MarketplaceView triggerToast={triggerToast} />}
      {currentTab === 'billing' && <BillingView triggerToast={triggerToast} />}
      {currentTab === 'settings' && <SettingsView triggerToast={triggerToast} onUpdateAvatar={onUpdateAvatar} />}
      {currentTab === 'help' && <HelpView />}

      {/* FLOATING ZEGA COPILOT WIDGET */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
        <button 
          onClick={() => triggerToast('Opening ZEGA Copilot Assistant...')} 
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-md shadow-slate-900/10 dark:shadow-black/40 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer border border-slate-700 dark:border-slate-200"
        >
          <Sparkles size={15} className="text-orange-400" />
          <span className="text-[11px] sm:text-xs">ZEGA Copilot</span>
          <ChevronRight size={13} />
          <span className="size-4.5 sm:size-5 rounded-full bg-red-500 text-white text-[9.5px] sm:text-[10px] font-extrabold flex items-center justify-center ml-0.5">2</span>
        </button>
      </div>
    </div>
  );
}

// Re-export as UmkmDashboardView for backwards compatibility
export { UmkmDashboard as UmkmDashboardView };
