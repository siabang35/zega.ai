import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight, ChevronDown, Menu,
  ShieldCheck, Bot, Key, CreditCard, UserCheck, Zap, Activity,
  MessageSquare, FileText, BarChart3, DollarSign, Database, ShieldAlert,
  Brain, PieChart, Store, Server, Lock, Link2, CheckCircle2, Cpu,
  Code, Building, Globe
} from 'lucide-react';

import { OverviewView } from '../views/OverviewView';
import { SandboxWorkflowView } from '../views/SandboxWorkflowView';
import { M2mPaymentsView } from '../views/M2mPaymentsView';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ZegaLogo } from '../../components/ZegaLogo';
import { SupabaseDashboardService } from '../services/supabaseService';

import { AiCommandCenterView } from './views/AiCommandCenterView';
import { AgentSwarmsView } from './views/AgentSwarmsView';
import { KnowledgeBrainView } from './views/KnowledgeBrainView';
import { McpConnectorsView } from './views/McpConnectorsView';
import { AgentEvalsView } from './views/AgentEvalsView';
import { CryptoWalletsView } from './views/CryptoWalletsView';
import { UsageBillingView } from './views/UsageBillingView';
import { AiSafetyView } from './views/AiSafetyView';
import { AuditLogsView } from './views/AuditLogsView';
import { RbacSsoView } from './views/RbacSsoView';
import { ZeroClawTerminalView } from './views/ZeroClawTerminalView';
import { IntegrationsView } from './views/IntegrationsView';
import { AnalyticsView } from './views/AnalyticsView';
import { CostIntelligenceView } from './views/CostIntelligenceView';
import { ReportsView } from './views/ReportsView';
import { InfrastructureView } from './views/InfrastructureView';
import { DevPortalView } from './views/DevPortalView';
import { ApiSdkView } from './views/ApiSdkView';
import { WebhooksView } from './views/WebhooksView';
import { DeveloperLogsView } from './views/DeveloperLogsView';
import { OrganizationView } from './views/OrganizationView';
import { TeamRolesView } from './views/TeamRolesView';
import { SettingsView } from './views/SettingsView';

interface EnterpriseDashboardProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  userEmail?: string;
  userName?: string;
  isGuest?: boolean;
}

export function EnterpriseDashboardView({
  onClose,
  dark,
  setDark,
  userEmail = 'enterprise.guest@zegaai.site',
  userName = 'Acme Enterprise Admin (Guest Demo)',
  isGuest = true,
}: EnterpriseDashboardProps) {
  const tabToSlugMap: Record<string, string> = {
    console: 'overview',
    overview: 'overview',
    multi_agents: 'agents',
    sandbox: 'automation',
    agent_swarms: 'swarms',
    knowledge_brain: 'rag',
    mcp_connectors: 'mcp',
    agent_evals: 'evals',
    payments_bills: 'payments',
    zeroclaw_terminal: 'zeroclaw',
    infrastructure: 'infra',
    usage_billing: 'billing',
    ai_safety: 'safety',
    audit_logs: 'audit',
    dev_portal: 'developer',
    api_sdk: 'api-sdk',
    webhooks: 'webhooks',
    system_logs: 'logs',
    rbac_sso: 'sso',
  };

  const slugToTabMap: Record<string, string> = {
    overview: 'console',
    agents: 'multi_agents',
    automation: 'sandbox',
    swarms: 'agent_swarms',
    rag: 'knowledge_brain',
    mcp: 'mcp_connectors',
    evals: 'agent_evals',
    payments: 'payments_bills',
    zeroclaw: 'zeroclaw_terminal',
    infra: 'infrastructure',
    billing: 'usage_billing',
    safety: 'ai_safety',
    audit: 'audit_logs',
    developer: 'dev_portal',
    'api-sdk': 'api_sdk',
    webhooks: 'webhooks',
    logs: 'system_logs',
    sso: 'rbac_sso',
  };

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const slug = parts[1];
        if (slugToTabMap[slug]) return slugToTabMap[slug];
      }
    }
    return 'console';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    if (typeof window !== 'undefined') {
      const slug = tabToSlugMap[tabId] || tabId;
      const newPath = `/console/${slug}`;
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Determine displayed organization name based on auth state
  const displayOrgName = isGuest 
    ? 'Guest Enterprise (Demo)' 
    : (userName && userName !== 'Acme Enterprise Admin (Guest Demo)' ? userName : 'PT Zenith Enterprise');
  const displayUserRole = isGuest ? 'Enterprise Guest Admin' : 'Enterprise Admin';

  const enterpriseMenuCategories = [
    {
      category: 'MAIN MENU',
      items: [
        { id: 'console', label: 'Overview', icon: LayoutDashboard, badge: 'Live' },
        { id: 'ai_command', label: 'AI Command Center', icon: Zap, badge: 'v2.4' },
        { id: 'multi_agents', label: 'AI Agents', icon: Bot, badge: '638 Active' },
        { id: 'sandbox', label: 'Workflow Studio', icon: Workflow, badge: 'Studio' },
        { id: 'knowledge_brain', label: 'Knowledge Hub', icon: Brain, badge: 'Qdrant' },
        { id: 'mcp_connectors', label: 'MCP Hub', icon: Database, badge: '14 Active' },
        { id: 'integrations', label: 'Integrations', icon: Layers, badge: 'Cloud' },
      ],
    },
    {
      category: 'ANALYTICS',
      items: [
        { id: 'agent_evals', label: 'Analytics', icon: BarChart3, badge: '98.6%' },
        { id: 'usage_billing', label: 'Cost Intelligence', icon: DollarSign, badge: 'Savings' },
        { id: 'audit_logs', label: 'Reports', icon: FileText },
      ],
    },
    {
      category: 'PLATFORM',
      items: [
        { id: 'payments_bills', label: 'Payments & Billing', icon: CreditCard, badge: 'Solana' },
        { id: 'zeroclaw_terminal', label: 'ZeroClaw Solana Terminal', icon: Cpu, badge: 'Keyless Tier 1' },
        { id: 'ai_safety', label: 'Security Center', icon: ShieldCheck, badge: 'Firewall' },
        { id: 'infrastructure', label: 'Infrastructure', icon: Server },
        { id: 'audit_logs_platform', label: 'Audit Logs', icon: ShieldAlert, badge: 'SHA-256' },
      ],
    },
    {
      category: 'DEVELOPERS',
      items: [
        { id: 'dev_portal', label: 'Developer Portal', icon: Code },
        { id: 'api_sdk', label: 'API & SDK', icon: Key },
        { id: 'webhooks', label: 'Webhooks', icon: Globe },
        { id: 'system_logs', label: 'Logs', icon: Activity },
      ],
    },
    {
      category: 'GOVERNANCE',
      items: [
        { id: 'rbac_sso', label: 'Organization', icon: Building },
        { id: 'team_roles', label: 'Team & Roles', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'MAIN MENU': true,
    'ANALYTICS': true,
    'PLATFORM': true,
    'DEVELOPERS': false,
    'GOVERNANCE': false,
  });

  useEffect(() => {
    const activeCat = enterpriseMenuCategories.find(cat => 
      cat.items.some(item => item.id === activeTab)
    );
    if (activeCat) {
      setExpandedCategories(prev => ({
        ...prev,
        [activeCat.category]: true,
      }));
    }
  }, [activeTab]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
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
              <ZegaLogo size={32} showText={false} />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">ZEGA Enterprise</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-mono font-bold">
                  ORCHESTRATOR HUB
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
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
              ENTERPRISE
            </span>
          </div>

          {/* Render Categorized Menu Items */}
          <nav className="space-y-3 pt-2">
            {enterpriseMenuCategories.map((cat, idx) => {
              const isExpanded = expandedCategories[cat.category] ?? (idx === 0);
              const hasActiveChild = cat.items.some(item => item.id === activeTab);
              return (
                <div key={idx} className="space-y-1 rounded-xl p-1 transition-all border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/50">
                  <button
                    onClick={() => toggleCategory(cat.category)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {isExpanded ? <ChevronDown size={13} className="text-indigo-500" /> : <ChevronRight size={13} className="text-slate-400" />}
                      <span className="truncate">{cat.category}</span>
                    </span>
                    {hasActiveChild && !isExpanded && (
                      <span className="size-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 pt-0.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                              isActive
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-none'
                                : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon size={15} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-md flex-shrink-0 ml-1 ${
                                isActive ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Sign Out */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                alt="Enterprise User"
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
          <div className="bg-indigo-500/10 dark:bg-indigo-950/40 border-b border-indigo-200/50 dark:border-indigo-800/50 px-4 md:px-6 py-2 flex items-center gap-2 text-[11px] md:text-xs text-indigo-700 dark:text-indigo-300 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold uppercase border border-indigo-500/30 flex-shrink-0">
              Enterprise Guest Mode
            </span>
            <span className="truncate">
              Exploring ZEGA AI Enterprise Platform as <strong>Enterprise Guest Admin</strong>.
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
                placeholder="Search telemetry, agents, vectors... (⌘K)"
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <Sparkles size={14} className="text-indigo-500" />
              <span>Release v2.4</span>
              <span className="size-1.5 rounded-full bg-indigo-500" />
            </button>
            
            <button className="relative p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <Bell size={16} />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-indigo-500" />
            </button>

            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <LanguageSelector />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Sub-View Router */}
        <div className="p-3 sm:p-4 md:p-6 flex-1 pb-20 md:pb-6">
          {(activeTab === 'console' || activeTab === 'overview') && (
            <OverviewView 
              onNavigateToSandbox={() => setActiveTab('sandbox')} 
              isGuest={isGuest}
              userName={displayOrgName}
              userEmail={userEmail}
            />
          )}
          {activeTab === 'ai_command' && <AiCommandCenterView onTriggerToast={triggerToast} />}
          {activeTab === 'sandbox' && <SandboxWorkflowView />}
          {(activeTab === 'agent_swarms' || activeTab === 'multi_agents') && <AgentSwarmsView onTriggerToast={triggerToast} />}
          {activeTab === 'knowledge_brain' && <KnowledgeBrainView onTriggerToast={triggerToast} />}
          {activeTab === 'integrations' && <IntegrationsView onTriggerToast={triggerToast} />}
          {activeTab === 'mcp_connectors' && <McpConnectorsView onTriggerToast={triggerToast} />}
          {activeTab === 'agent_evals' && <AnalyticsView onTriggerToast={triggerToast} />}
          {activeTab === 'dev_portal' && <DevPortalView onTriggerToast={triggerToast} />}
          {activeTab === 'api_sdk' && <ApiSdkView onTriggerToast={triggerToast} />}
          {activeTab === 'webhooks' && <WebhooksView onTriggerToast={triggerToast} />}
          {activeTab === 'system_logs' && <DeveloperLogsView onTriggerToast={triggerToast} />}
          {activeTab === 'zeroclaw_terminal' && <ZeroClawTerminalView onTriggerToast={triggerToast} />}
          {activeTab === 'crypto_wallets' && <CryptoWalletsView onTriggerToast={triggerToast} />}
          {(activeTab === 'usage_billing' || activeTab === 'payments_bills') && <UsageBillingView onTriggerToast={triggerToast} />}
          {(activeTab === 'ai_safety' || activeTab === 'security_center') && <AiSafetyView onTriggerToast={triggerToast} />}
          {activeTab === 'infrastructure' && <InfrastructureView onTriggerToast={triggerToast} />}
          {(activeTab === 'audit_logs' || activeTab === 'audit_logs_platform') && <AuditLogsView onTriggerToast={triggerToast} />}
          {(activeTab === 'rbac_sso' || activeTab === 'organization') && <OrganizationView onTriggerToast={triggerToast} />}
          {activeTab === 'team_roles' && <TeamRolesView onTriggerToast={triggerToast} />}
          {activeTab === 'settings' && <SettingsView onTriggerToast={triggerToast} />}
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'overview' || activeTab === 'console' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('agent_swarms')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'agent_swarms' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}
          >
            <Bot size={18} />
            <span>Swarms</span>
          </button>

          <button
            onClick={() => setActiveTab('zeroclaw_terminal')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'zeroclaw_terminal' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}
          >
            <Zap size={18} />
            <span>ZeroClaw</span>
          </button>

          <button
            onClick={() => setActiveTab('dev_portal')}
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'dev_portal' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}
          >
            <Code size={18} />
            <span>Dev Portal</span>
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
                  <ZegaLogo size={28} showText={false} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">ZEGA Enterprise</span>
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
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  ENTERPRISE
                </span>
              </div>

              <nav className="space-y-3">
                {enterpriseMenuCategories.map((cat, idx) => {
                  const isExpanded = expandedCategories[cat.category] ?? (idx === 0);
                  return (
                    <div key={idx} className="space-y-1 rounded-xl p-1 border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/50">
                      <button
                        onClick={() => toggleCategory(cat.category)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        <span className="flex items-center gap-1.5">
                          {isExpanded ? <ChevronDown size={13} className="text-indigo-500" /> : <ChevronRight size={13} className="text-slate-400" />}
                          <span>{cat.category}</span>
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-1 pt-0.5">
                          {cat.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Icon size={16} />
                                  <span>{item.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
