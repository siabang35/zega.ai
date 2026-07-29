import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight,
  ShieldCheck, Bot, Key, CreditCard, UserCheck, Zap, Activity,
  Server, ShieldAlert, Cpu, Database, Network, Globe
} from 'lucide-react';
import { DashboardTab } from './types';
import { OverviewView } from './views/OverviewView';
import { AgentRosterView } from './views/AgentRosterView';
import { SandboxWorkflowView } from './views/SandboxWorkflowView';
import { MissionControlView } from './views/MissionControlView';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../../i18n/translations';

import { SupabaseDashboardService } from './services/supabaseService';

interface SuperAdminDashboardProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  onSwitchToUserMode?: () => void;
}

export function SuperAdminDashboard({ 
  onClose, 
  dark, 
  setDark,
  onSwitchToUserMode
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await SupabaseDashboardService.signOut();
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[99999] flex bg-slate-900/40 backdrop-blur-xs font-sans text-slate-900 dark:text-slate-100 animate-fadeIn ${dark ? 'dark' : ''}`}>
      {/* MOBILE BACKDROP */}
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
          {/* Header Branding */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/logo/zegalogo.png"
                alt="ZEGA"
                className="h-7 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)]"
              />
              <span 
                className="rounded-none border border-[#e05638]/60 bg-[#e05638]/10 px-2 py-0.5 text-[9.5px] font-extrabold text-[#e05638] uppercase tracking-[0.2em] select-none"
                style={{ fontFamily: "'Chakra Petch', 'Space Grotesk', sans-serif" }}
              >
                SUPERADMIN
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* SuperAdmin Identity Card */}
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                <span>👑</span> SuperAdmin Root
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-500 text-white">
                ROOT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">admin@zega.ai</p>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1">
            {[
              { id: 'overview', label: 'Overview Architecture', icon: LayoutDashboard, badge: '5-Layer' },
              { id: 'roster', label: 'Agents & Swarm Roster', icon: Users, badge: '2,847' },
              { id: 'sandbox', label: 'Sandbox Canvas v2', icon: Workflow, badge: 'v2' },
              { id: 'mission_control', label: 'Executive Mission Control', icon: Target },
              { id: 'guardrails', label: 'AI Safety Guardrails', icon: ShieldAlert, badge: 'OWASP' },
              { id: 'integrations', label: 'Global Integrations', icon: Layers, badge: '19 Tools' },
              { id: 'tenants', label: 'Tenant Management', icon: Server, badge: 'Enterprise' },
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

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {onSwitchToUserMode && (
            <button
              onClick={onSwitchToUserMode}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <UserCheck size={13} />
              <span>Switch to User View</span>
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN DISPLAY AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        {/* Header Bar */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {activeTab === 'overview' ? 'SuperAdmin Orchestrator Matrix' : activeTab.replace('_', ' ')}
            </h1>
            <span className="text-xs text-rose-500 font-mono font-bold">
              ● SUPERADMIN CONTROL MODE
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

        {/* Tab View Renderer */}
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
          {activeTab === 'guardrails' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-rose-500/30 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-500" /> OWASP 5-Layer AI Guardrails Protection Engine
                  </h3>
                  <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono font-bold">
                    PROTECTION ONLINE
                  </span>
                </div>
                <div className="grid sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { title: 'Input Sanitize', desc: 'XSS & Malformed JSON', count: '14,291 Checked' },
                    { title: 'PII Redaction', desc: 'SSN & Credit Cards', count: '0 Leakage' },
                    { title: 'Injection Shield', desc: 'Prompt Hijack Guard', count: '99.9% Block' },
                    { title: 'Output Filter', desc: 'Hallucination Check', count: '2 Filtered' },
                    { title: 'Audit Trail', desc: 'OWASP ASVS 4.0 Log', count: 'Active' },
                  ].map((g, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{g.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{g.desc}</div>
                      <div className="text-xs font-mono font-bold text-[#e05638] mt-2">{g.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'tenants' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Enterprise Tenant Roster</h3>
              <div className="space-y-2">
                {[
                  { name: 'Acme Global Enterprise', tier: 'Enterprise Plan', users: 48, status: 'Active' },
                  { name: 'TechCorp International', tier: 'Enterprise Plan', users: 120, status: 'Active' },
                  { name: 'Nexus Logistics', tier: 'Scale Plan', users: 18, status: 'Active' },
                ].map((t, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.tier} • {t.users} Allocated Seats</div>
                    </div>
                    <span className="rounded-md bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-bold">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
