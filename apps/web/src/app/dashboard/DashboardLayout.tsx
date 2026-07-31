import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight, Command
} from 'lucide-react';
import { DashboardTab } from './types';
import { OverviewView } from './views/OverviewView';
import { AgentRosterView } from './views/AgentRosterView';
import { SandboxWorkflowView } from './views/SandboxWorkflowView';
import { MissionControlView } from './views/MissionControlView';
import { LanguageSelector } from '../components/LanguageSelector';
import { ZegaLogo } from '../components/ZegaLogo';
import { useLanguage } from '../../i18n/translations';

interface DashboardLayoutProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
}

export function DashboardLayout({ onClose, dark, setDark }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { t } = useLanguage();

  const getTabLabel = (tabId: string) => {
    switch (tabId) {
      case 'overview': return t.console.dashboard;
      case 'roster': return t.console.agentRoster;
      case 'sandbox': return t.console.sandbox;
      case 'mission_control': return t.console.missionControl;
      default: return tabId;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row overflow-hidden animate-fadeIn"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}
    >
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="md:hidden h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-2">
          <ZegaLogo size={24} showText={false} />
          <span 
            className="rounded-none border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 px-2 py-0.5 text-[9.5px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] select-none shadow-none"
            style={{ fontFamily: "'Chakra Petch', 'Space Grotesk', sans-serif" }}
          >
            {t.nav.console}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <button
            onClick={() => setDark(!dark)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Command size={18} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR NAVIGATION (Collapsible on Mobile) */}
      <aside 
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo + Title — Fixed Height 76px Header across all tabs */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ZegaLogo size={28} showText={true} />
              <span 
                className="rounded-none border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/90 px-2 py-0.5 text-[9.5px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] select-none shadow-none"
                style={{ fontFamily: "'Chakra Petch', 'Space Grotesk', sans-serif" }}
              >
                {t.nav.console}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1">
            {[
              { id: 'overview', label: t.console.dashboard, icon: LayoutDashboard },
              { id: 'roster', label: t.console.agentRoster, icon: Users, badge: '6' },
              { id: 'sandbox', label: t.console.sandbox, icon: Workflow, badge: 'v2' },
              { id: 'mission_control', label: t.console.missionControl, icon: Target },
              { id: 'integrations', label: t.console.integrations, icon: Layers, badge: '19' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as DashboardTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e05638] text-white'
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

        {/* Bottom User Profile Section */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="size-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold shrink-0">
              AM
            </div>
            <div className="truncate min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Alex Morgan</div>
              <div className="text-[10px] text-slate-400 truncate">alex@zegaai.site</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Exit Console</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
              {getTabLabel(activeTab)}
            </h1>
            <span className="text-xs text-slate-400 font-mono">
              / zega-enterprise-sandbox
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
            <button className="relative size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#e05638]" />
            </button>
            <button
              onClick={onClose}
              className="hidden sm:flex size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* View Content Renderer */}
        <div className="p-6 flex-1">
          {activeTab === 'overview' && (
            <OverviewView onNavigateToSandbox={() => setActiveTab('sandbox')} />
          )}
          {activeTab === 'roster' && <AgentRosterView />}
          {activeTab === 'sandbox' && <SandboxWorkflowView />}
          {activeTab === 'mission_control' && <MissionControlView />}
          {activeTab === 'integrations' && (
            <OverviewView onNavigateToSandbox={() => setActiveTab('sandbox')} />
          )}
        </div>
      </main>
    </div>
  );
}
