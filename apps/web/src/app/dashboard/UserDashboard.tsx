import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight,
  ShieldCheck, Bot, Key, CreditCard, UserCheck, Zap, Activity
} from 'lucide-react';
import { DashboardTab } from './types';
import { OverviewView } from './views/OverviewView';
import { AgentRosterView } from './views/AgentRosterView';
import { SandboxWorkflowView } from './views/SandboxWorkflowView';
import { MissionControlView } from './views/MissionControlView';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../../i18n/translations';

import { SupabaseDashboardService } from './services/supabaseService';

interface UserDashboardProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  userRole?: 'individual' | 'enterprise';
  userEmail?: string;
  userName?: string;
  onSwitchToAdminMode?: () => void;
}

export function UserDashboard({ 
  onClose, 
  dark, 
  setDark, 
  userRole = 'enterprise',
  userEmail = 'user@zega.ai',
  userName = 'Alex Morgan',
  onSwitchToAdminMode
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('console');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await SupabaseDashboardService.signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex bg-slate-900/40 backdrop-blur-xs font-sans text-slate-900 dark:text-slate-100 animate-fadeIn">
      {/* MOBILE OVERLAY BACKDROP */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 
        bg-white dark:bg-slate-900 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Logo + Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/logo/zegalogo.png"
                alt="ZEGA"
                className="h-7 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)]"
              />
              <span 
                className="rounded-none border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 px-2 py-0.5 text-[9.5px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] select-none"
                style={{ fontFamily: "'Chakra Petch', 'Space Grotesk', sans-serif" }}
              >
                {userRole === 'enterprise' ? 'ENTERPRISE USER' : 'USER PORTAL'}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* User Status Card */}
          <div className="mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate pr-1">{userName}</span>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                userEmail?.includes('guest') || userName?.includes('Guest')
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  : userRole === 'enterprise'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              }`}>
                {userEmail?.includes('guest') || userName?.includes('Guest') ? 'GUEST DEMO' : userRole}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{userEmail}</p>
          </div>

          {/* Sidebar Navigation Tabs */}
          <nav className="mt-4 space-y-1">
            {[
              { id: 'overview', label: 'My Workspace', icon: LayoutDashboard },
              { id: 'console', label: t.nav.console, icon: Workflow, badge: '5-Layer' },
              { id: 'my_agents', label: 'My AI Agents', icon: Bot, badge: '4' },
              { id: 'sandbox', label: t.console.sandbox, icon: Workflow, badge: 'v2' },
              { id: 'mission_control', label: t.console.missionControl, icon: Target },
              { id: 'integrations', label: t.console.integrations, icon: Layers, badge: 'Active' },
              { id: 'settings', label: 'Account & Billing', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e05638] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Exit */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>{userEmail?.includes('guest') || userName?.includes('Guest') ? 'Exit Guest Demo' : 'Sign Out Workspace'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN USER CONTENT VIEW */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        {/* Header Bar */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {activeTab === 'console' ? 'Console Suite' : activeTab.replace('_', ' ')}
            </h1>
            <span className="text-xs text-slate-400 font-mono">
              / {userRole}-workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={() => setDark(!dark)}
              className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={onClose}
              className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* View Renderer */}
        <div className="p-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Welcome to ZEGA User Workspace</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage your personal AI agents, visual workflows, and tool connectors seamlessly.
                </p>
                <div className="mt-6 grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="text-xs font-bold text-slate-500">ACTIVE USER AGENTS</div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">4 Agents</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="text-xs font-bold text-slate-500">WORKFLOW EXECUTIONS</div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">1,420 Runs</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="text-xs font-bold text-slate-500">CURRENT PLAN</div>
                    <div className="text-2xl font-black font-mono text-[#e05638] mt-1 uppercase">{userRole}</div>
                  </div>
                </div>
              </div>
              <OverviewView onNavigateToSandbox={() => setActiveTab('sandbox')} />
            </div>
          )}

          {activeTab === 'console' && (
            <OverviewView onNavigateToSandbox={() => setActiveTab('sandbox')} />
          )}

          {activeTab === 'my_agents' && <AgentRosterView />}
          {activeTab === 'sandbox' && <SandboxWorkflowView />}
          {activeTab === 'mission_control' && <MissionControlView />}
          {activeTab === 'integrations' && (
            <OverviewView onNavigateToSandbox={() => setActiveTab('sandbox')} />
          )}
          {activeTab === 'settings' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Account & Subscription Settings</h3>
              <p className="text-xs text-slate-500">Manage your active ZEGA plan ({userRole}) and API tokens.</p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">API Access Token</div>
                  <div className="text-[11px] font-mono text-slate-400">zega_live_sec_8941294192412</div>
                </div>
                <button className="rounded-lg bg-[#e05638] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer">
                  Rotate Secret Key
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
