import React, { useState, useEffect } from 'react';
import { getR2CdnUrl } from '../../utils/cdn';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight, ChevronDown, Menu,
  ShieldCheck, Bot, Key, CreditCard, UserCheck, Zap, Activity,
  MessageSquare, FileText, BarChart3, DollarSign, Database, ShieldAlert,
  Brain, PieChart, Store, Server, Lock, Link2, CheckCircle2
} from 'lucide-react';

import { UmkmDashboardView } from './UmkmDashboard';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SupabaseDashboardService } from '../services/supabaseService';

interface UmkmDashboardContainerProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  userEmail?: string;
  userName?: string;
  isGuest?: boolean;
}

export function UmkmDashboardContainer({
  onClose,
  dark,
  setDark,
  userEmail = 'siabang35@gmail.com',
  userName = 'Toko UMKM',
  isGuest = false,
}: UmkmDashboardContainerProps) {
  const tabToSlugMap: Record<string, string> = {
    umkm: 'home',
    overview: 'home',
    home: 'home',
    my_agents: 'ai-employees',
    my_ai_employees: 'ai-employees',
    sandbox: 'automation',
    automation: 'automation',
    wa_bot: 'inbox',
    inbox: 'inbox',
    sales_rekap: 'sales',
    sales: 'sales',
    ai_copywriter: 'marketing',
    marketing: 'marketing',
    invoice_gen: 'finance',
    finance: 'finance',
    store: 'store',
    customers: 'customers',
    reports: 'reports',
    knowledge: 'knowledge',
    integrations: 'marketplace',
    marketplace: 'marketplace',
    billing: 'billing',
    settings: 'settings',
  };

  const slugToTabMap: Record<string, string> = {
    home: 'umkm',
    'ai-employees': 'my_agents',
    automation: 'sandbox',
    inbox: 'wa_bot',
    sales: 'sales_rekap',
    marketing: 'ai_copywriter',
    finance: 'invoice_gen',
    store: 'store',
    customers: 'customers',
    reports: 'reports',
    knowledge: 'knowledge',
    marketplace: 'integrations',
    billing: 'billing',
    settings: 'settings',
  };

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const slug = parts[1];
        if (slugToTabMap[slug]) return slugToTabMap[slug];
      }
    }
    return 'umkm';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    if (typeof window !== 'undefined') {
      const slug = tabToSlugMap[tabId] || tabId;
      const newPath = `/dashboard/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const slug = parts[1];
          if (slugToTabMap[slug]) {
            setActiveTabState(slugToTabMap[slug]);
          }
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [umkmData, setUmkmData] = useState<any>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadRealtimeData = async () => {
      const data = await SupabaseDashboardService.getUmkmRealtimeData('11111111-1111-1111-1111-111111111111');
      setUmkmData(data);

      unsubscribe = SupabaseDashboardService.subscribeToUmkmRealtime('11111111-1111-1111-1111-111111111111', async () => {
        const fresh = await SupabaseDashboardService.getUmkmRealtimeData('11111111-1111-1111-1111-111111111111');
        setUmkmData(fresh);
      });
    };

    loadRealtimeData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-sm">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold shadow-none flex items-center gap-2 border border-slate-700 dark:border-slate-300 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Workspace Title & Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <img
                src={getR2CdnUrl('/assets/logo/zegalogo.png')}
                alt="ZEGA AI Platform"
                className="h-7 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] transition-[filter] duration-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">ZEGA AI Platform</span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 block font-mono font-bold">
                  UMKM STARTER PRO
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Capsule */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
            </div>
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              UMKM
            </span>
          </div>

          {/* Render Menu Items */}
          <nav className="space-y-3 pt-2">
            <div>
              <div className="px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Business Overview
              </div>
              <div className="space-y-0.5 mt-1">
                {[
                  { id: 'umkm', label: 'Home', icon: LayoutDashboard },
                  { id: 'my_agents', label: 'My AI Employees', icon: Bot },
                  { id: 'sandbox', label: 'Automation', icon: Workflow },
                  { id: 'wa_bot', label: 'Inbox', icon: MessageSquare, badge: '8' },
                  { id: 'sales_rekap', label: 'Sales', icon: BarChart3 },
                  { id: 'ai_copywriter', label: 'Marketing', icon: Sparkles },
                  { id: 'invoice_gen', label: 'Finance', icon: FileText },
                  { id: 'store', label: 'Store', icon: Store },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'reports', label: 'Reports', icon: PieChart },
                  { id: 'knowledge', label: 'Knowledge', icon: Brain },
                  { id: 'integrations', label: 'Marketplace', icon: Link2 },
                  { id: 'billing', label: 'Billing', icon: CreditCard },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (activeTab === 'umkm' && item.id === 'umkm');
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/50 dark:border-orange-800/50'
                          : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? 'text-orange-500' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Current Plan Card */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Current Plan</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">Starter</span>
              </div>
              <button 
                onClick={() => triggerToast('Upgrade to Pro clicked')}
                className="px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 text-[11px] font-semibold hover:bg-orange-50 cursor-pointer"
              >
                Upgrade
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                <span>Usage</span>
                <span className="font-bold">38%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '38%' }} />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-mono">Resets on 1 Aug 2026</p>
          </div>
        </div>

        {/* Footer Profile & Sign Out */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces"
                alt="UMKM User"
                className="size-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await SupabaseDashboardService.signOut();
                onClose();
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#f8f9fa] dark:bg-slate-950">
        {/* Guest Demo Mode Banner */}
        {isGuest && (
          <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 px-4 md:px-6 py-2 flex items-center gap-2.5 text-[11px] md:text-xs text-amber-950 dark:text-amber-200 font-medium select-none">
            <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-sans text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 shadow-none border-none">
              UMKM Mode
            </span>
            <span className="truncate">
              Exploring ZEGA AI Platform in <strong>UMKM Mode (Guest Demo)</strong>.
            </span>
          </div>
        )}

        {/* Top Header Navigation */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/95 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div className="relative w-full hidden sm:block">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything... (⌘K)"
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <Sparkles size={14} className="text-orange-500" />
              <span>What's new</span>
              <span className="size-1.5 rounded-full bg-orange-500" />
            </button>
            
            <button className="relative p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <Bell size={16} />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-orange-500" />
            </button>

            {/* Store Selector */}
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
              <div className="size-7 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Store size={15} />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {isGuest ? 'Guest Store' : (userName && userName !== 'Guest Explorer (Demo Mode)' ? `Toko ${userName}` : 'Toko UMKM')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {isGuest ? 'Store ID: GUEST-1283' : `Store ID: ${userEmail.split('@')[0].toUpperCase()}`}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <LanguageSelector />
            
            {/* Close 'X' Button — Only available in Guest/Demo Mode to prevent accidental logout */}
            {isGuest && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                title="Exit Demo Sandbox"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </header>

        {/* View Renderer */}
        <div className="p-3 sm:p-4 md:p-6 flex-1 pb-20 md:pb-6">
          <UmkmDashboardView activeTab={activeTab} userName={userName} userEmail={userEmail} isGuest={isGuest} />
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('umkm')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'umkm' || activeTab === 'overview' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('my_agents')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'my_agents' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : ''}`}
          >
            <Bot size={18} />
            <span>Agents</span>
          </button>

          <button
            onClick={() => setActiveTab('wa_bot')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'wa_bot' || activeTab === 'inbox' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : ''}`}
          >
            <MessageSquare size={18} />
            <span>Inbox</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_rekap')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'sales_rekap' || activeTab === 'sales' ? 'text-orange-600 dark:text-orange-400 font-extrabold' : ''}`}
          >
            <BarChart3 size={18} />
            <span>Sales</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-700 dark:text-slate-300"
          >
            <Menu size={18} />
            <span>Menu</span>
          </button>
        </div>
      </main>

      {/* MOBILE SIDE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full flex flex-col justify-between p-4 z-10 shadow-2xl border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src={getR2CdnUrl('/assets/logo/zegalogo.png')}
                    alt="ZEGA AI Platform"
                    className="h-6 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)]"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">ZEGA UMKM</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                  UMKM
                </span>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'umkm', label: 'Home', icon: LayoutDashboard },
                  { id: 'my_agents', label: 'My AI Employees', icon: Bot },
                  { id: 'sandbox', label: 'Automation', icon: Workflow },
                  { id: 'wa_bot', label: 'Inbox', icon: MessageSquare, badge: '8' },
                  { id: 'sales_rekap', label: 'Sales', icon: BarChart3 },
                  { id: 'ai_copywriter', label: 'Marketing', icon: Sparkles },
                  { id: 'invoice_gen', label: 'Finance', icon: FileText },
                  { id: 'store', label: 'Store', icon: Store },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'reports', label: 'Reports', icon: PieChart },
                  { id: 'knowledge', label: 'Knowledge', icon: Brain },
                  { id: 'integrations', label: 'Marketplace', icon: Link2 },
                  { id: 'billing', label: 'Billing', icon: CreditCard },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (activeTab === 'umkm' && item.id === 'umkm');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={async () => {
                  await SupabaseDashboardService.signOut();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
