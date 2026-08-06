import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight, ChevronLeft, ChevronDown, Menu,
  ShieldCheck, Bot, Key, CreditCard, UserCheck, Zap, Activity,
  MessageSquare, FileText, BarChart3, DollarSign, Database, ShieldAlert,
  Brain, PieChart, Store, Server, Lock, Link2, CheckCircle2, Cpu,
  Code, Building, Globe, HelpCircle
} from 'lucide-react';

import { OverviewView } from '../views/OverviewView';
import { SandboxWorkflowView } from '../views/SandboxWorkflowView';
import { WorkflowHubView } from '../views/WorkflowHubView';
import { M2mPaymentsView } from '../views/M2mPaymentsView';
import { HelpView } from './views/HelpView';
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
import { PaymentsBillingView } from './views/PaymentsBillingView';
import { ReportsView } from './views/ReportsView';
import { InfrastructureView } from './views/InfrastructureView';
import { DevPortalView } from './views/DevPortalView';
import { ApiSdkView } from './views/ApiSdkView';
import { WebhooksView } from './views/WebhooksView';
import { DeveloperLogsView } from './views/DeveloperLogsView';
import { OrganizationView } from './views/OrganizationView';
import { TeamRolesView } from './views/TeamRolesView';
import { SettingsView } from './views/SettingsView';
import { EnterpriseHeaderWidgets } from '../views/overview/EnterpriseHeaderWidgets';

interface EnterpriseDashboardProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  userEmail?: string;
  userName?: string;
}

export function EnterpriseDashboardView({
  onClose,
  dark,
  setDark,
  userEmail = '',
  userName = '',
}: EnterpriseDashboardProps) {
  const tabToSlugMap: Record<string, string> = {
    console: 'overview',
    overview: 'overview',
    ai_command: 'ai-command',
    multi_agents: 'agents',
    sandbox: 'workflow-studio',
    knowledge_brain: 'knowledge-hub',
    mcp_connectors: 'mcp-hub',
    integrations: 'integrations',
    help: 'bantuan',
    agent_evals: 'analytics',
    usage_billing: 'cost-intelligence',
    reports: 'reports',
    audit_logs: 'audit-logs',
    payments_bills: 'billing',
    zeroclaw_terminal: 'zeroclaw',
    ai_safety: 'security',
    infrastructure: 'infrastructure',
    audit_logs_platform: 'audit-logs',
    dev_portal: 'developer',
    api_sdk: 'api-sdk',
    webhooks: 'webhooks',
    system_logs: 'logs',
    rbac_sso: 'organization',
    team_roles: 'teams',
    settings: 'settings',
  };

  const slugToTabMap: Record<string, string> = {
    overview: 'console',
    'ai-command': 'ai_command',
    agents: 'multi_agents',
    'workflow-studio': 'sandbox',
    sandbox: 'sandbox',
    'knowledge-hub': 'knowledge_brain',
    rag: 'knowledge_brain',
    'mcp-hub': 'mcp_connectors',
    mcp: 'mcp_connectors',
    integrations: 'integrations',
    bantuan: 'help',
    help: 'help',
    analytics: 'agent_evals',
    evals: 'agent_evals',
    'cost-intelligence': 'usage_billing',
    billing: 'payments_bills',
    'payments-billing': 'payments_bills',
    reports: 'reports',
    'audit-logs': 'audit_logs',
    audit: 'audit_logs',
    zeroclaw: 'zeroclaw_terminal',
    security: 'ai_safety',
    safety: 'ai_safety',
    infrastructure: 'infrastructure',
    infra: 'infrastructure',
    developer: 'dev_portal',
    dev: 'dev_portal',
    'api-sdk': 'api_sdk',
    webhooks: 'webhooks',
    logs: 'system_logs',
    organization: 'rbac_sso',
    sso: 'rbac_sso',
    teams: 'team_roles',
    settings: 'settings',
  };

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'console') {
        const slug = parts[1];
        if (slugToTabMap[slug]) return slugToTabMap[slug];
        if (tabToSlugMap[slug]) return slug;
      }
    }
    return 'console';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const tabTitleMap: Record<string, string> = {
    console: 'Overview | ZEGA Enterprise',
    overview: 'Overview | ZEGA Enterprise',
    ai_command: 'AI Command Center | ZEGA Enterprise',
    multi_agents: 'AI Agents Fleet | ZEGA Enterprise',
    sandbox: 'Workflow Studio | ZEGA Enterprise',
    knowledge_brain: 'Knowledge Hub | ZEGA Enterprise',
    mcp_connectors: 'MCP Hub | ZEGA Enterprise',
    integrations: 'Integrations Gateway | ZEGA Enterprise',
    agent_evals: 'Analytics & Telemetry | ZEGA Enterprise',
    usage_billing: 'Cost Intelligence | ZEGA Enterprise',
    reports: 'Reports | ZEGA Enterprise',
    audit_logs: 'Audit Logs | ZEGA Enterprise',
    payments_bills: 'Payments & Billing | ZEGA Enterprise',
    zeroclaw_terminal: 'ZeroClaw Solana Terminal | ZEGA Enterprise',
    ai_safety: 'Security Center | ZEGA Enterprise',
    infrastructure: 'System Infrastructure | ZEGA Enterprise',
    dev_portal: 'Developer Portal | ZEGA Enterprise',
    api_sdk: 'API & SDK Vault | ZEGA Enterprise',
    webhooks: 'Webhooks Gateway | ZEGA Enterprise',
    system_logs: 'System Execution Logs | ZEGA Enterprise',
    rbac_sso: 'Organization Governance | ZEGA Enterprise',
    team_roles: 'Team & Roles | ZEGA Enterprise',
    settings: 'Console Settings | ZEGA Enterprise',
    help: 'Pusat Bantuan 24/7 | ZEGA Enterprise',
  };

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    if (typeof window !== 'undefined') {
      const slug = tabToSlugMap[tabId] || tabId;
      const newPath = `/console/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
      if (tabTitleMap[tabId]) {
        document.title = tabTitleMap[tabId];
      }
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined' && tabTitleMap[activeTab]) {
      document.title = tabTitleMap[activeTab];
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === 'console') {
          const slug = parts[1];
          if (slugToTabMap[slug]) {
            setActiveTabState(slugToTabMap[slug]);
          }
        } else if (parts.length === 1 && parts[0] === 'console') {
          setActiveTabState('console');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [workflowStudioMode, setWorkflowStudioMode] = useState<'catalog' | 'canvas'>('catalog');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('customer_support');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Determine displayed organization name based on auth state
  const displayOrgName = userName || 'Enterprise';
  const displayUserRole = 'Enterprise Admin';

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
        { id: 'help', label: 'Pusat Bantuan', icon: HelpCircle, badge: 'Support 24/7' },
      ],
    },
    {
      category: 'ANALYTICS',
      items: [
        { id: 'agent_evals', label: 'Analytics', icon: BarChart3, badge: '98.6%' },
        { id: 'usage_billing', label: 'Cost Intelligence', icon: DollarSign, badge: 'Savings' },
        { id: 'reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      category: 'PLATFORM',
      items: [
        { id: 'payments_bills', label: 'Payments & Billing', icon: CreditCard },
        { id: 'zeroclaw_terminal', label: 'ZeroClaw Solana Terminal', icon: Cpu, badge: 'Keyless Tier 1' },
        { id: 'ai_safety', label: 'Security Center', icon: ShieldCheck, badge: 'Firewall' },
        { id: 'infrastructure', label: 'Infrastructure', icon: Server },
        { id: 'audit_logs', label: 'Audit Logs', icon: ShieldAlert, badge: '54k-256' },
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

  const [enterpriseData, setEnterpriseData] = useState<any>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadRealtimeData = async () => {
      const data = await SupabaseDashboardService.getEnterpriseRealtimeData();
      setEnterpriseData(data);

      unsubscribe = SupabaseDashboardService.subscribeToEnterpriseRealtime('99999999-9999-9999-9999-999999999999', async () => {
        const fresh = await SupabaseDashboardService.getEnterpriseRealtimeData();
        setEnterpriseData(fresh);
      });
    };

    loadRealtimeData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  const toggleAllCategories = () => {
    const isAnyExpanded = Object.values(expandedCategories).some(Boolean);
    const newState: Record<string, boolean> = {};
    enterpriseMenuCategories.forEach(cat => {
      newState[cat.category] = !isAnyExpanded;
    });
    setExpandedCategories(newState);
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

      {/* SIDEBAR NAVIGATION (Collapsible Desktop w-64 vs w-20) */}
      <aside className={`relative ${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hidden md:flex transition-all duration-300 select-none`}>
        {/* Floating Chevron Collapse/Expand Button on Sidebar Right Border (High-Contrast Dark Indigo) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Buka Sidebar (Expand)" : "Tutup Sidebar (Collapse)"}
          className="absolute -right-3.5 top-[28px] -translate-y-1/2 z-50 size-7 rounded-full border border-slate-700 dark:border-indigo-400/60 bg-slate-900 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-950/30 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center cursor-pointer transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-110 active:scale-95 group"
        >
          <ChevronRight size={14} className={`transition-transform duration-300 text-white ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>
        <div className="p-3 space-y-4 overflow-y-auto">
          {/* Workspace Title & Logo Header */}
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-2.5">
                <ZegaLogo size={32} showText={false} />
                {!isSidebarCollapsed && (
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block tracking-tight">ZEGA Enterprise</span>
                    <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 block font-mono font-bold">
                      ORCHESTRATOR HUB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Top-Left Profile Photo Capsule (Directly Under Logo) */}
            <div 
              className={`p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 shadow-2xs ${isSidebarCollapsed ? 'flex justify-center' : 'space-y-2'}`}
              title={`${userName || 'Danz A.'} (${userEmail || 'admin@zegaai.site'}) - ENTERPRISE ADMIN`}
            >
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-2.5 truncate">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                    alt="Enterprise User Avatar"
                    className="size-9 rounded-full object-cover border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0"
                  />
                  {!isSidebarCollapsed && (
                    <div className="truncate text-left">
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{userName || 'Danz A.'}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail || 'admin@zegaai.site'}</p>
                    </div>
                  )}
                </div>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[9px] font-bold">
                  <span className="px-2 py-0.5 rounded-full border bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 uppercase font-mono tracking-wider">
                    ENTERPRISE ADMIN
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Render Categorized Menu Items (Buka-Tutup Accordion & Tooltip support) */}
          <nav className="space-y-2.5 pt-1">
            {enterpriseMenuCategories.map((cat, idx) => {
              const isExpanded = expandedCategories[cat.category] ?? (idx === 0);
              const hasActiveChild = cat.items.some(item => item.id === activeTab);
              return (
                <div key={idx} className={`space-y-1 rounded-2xl p-1 transition-all border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40 ${isSidebarCollapsed ? 'text-center' : ''}`}>
                  {!isSidebarCollapsed ? (
                    <button
                      onClick={() => toggleCategory(cat.category)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer select-none"
                      title={`Klik untuk ${isExpanded ? 'menutup' : 'membuka'} kategori ${cat.category}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ChevronRight 
                          size={13} 
                          className={`text-indigo-500 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} 
                        />
                        <span className="truncate">{cat.category}</span>
                      </span>
                      {hasActiveChild && !isExpanded && (
                        <span className="size-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                      )}
                    </button>
                  ) : (
                    <div className="py-1 border-b border-slate-200/40 dark:border-slate-800/40 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center truncate" title={cat.category}>
                      {cat.category.substring(0, 3)}
                    </div>
                  )}

                  {(isExpanded || isSidebarCollapsed) && (
                    <div className="space-y-1 pt-0.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={`${item.label} ${item.badge ? `(${item.badge})` : ''}`}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-1.5'} rounded-xl text-xs transition-all cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                                : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center' : 'truncate'}`}>
                              <Icon size={16} />
                              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                            </div>
                            {!isSidebarCollapsed && item.badge && (
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0 ml-1 ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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

        {/* Bottom Left Footer: Pusat Bantuan and Sign Out Button */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'} text-xs font-bold`}>
            {/* Pusat Bantuan Link */}
            <button
              onClick={() => setActiveTab('help')}
              title="Buka Pusat Bantuan 24/7 & Support Ticket"
              className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border border-indigo-200/60 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-all cursor-pointer text-[11px] ${isSidebarCollapsed ? 'w-full' : 'flex-1'}`}
            >
              <HelpCircle size={15} />
              {!isSidebarCollapsed && <span>Pusat Bantuan</span>}
            </button>

            {/* Sign Out Button in Bottom-Left Footer */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await SupabaseDashboardService.signOut();
                onClose();
              }}
              title="Keluar dari Akun (Sign Out)"
              className={`p-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 transition-all cursor-pointer ${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#f8f9fa] dark:bg-slate-950">


        {/* Top Header Navigation */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/95 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Buka Navigation Drawer"
              className="size-7 rounded-full border border-slate-700 dark:border-indigo-400/60 bg-slate-900 dark:bg-indigo-600 text-white shadow-md shadow-indigo-950/30 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center cursor-pointer transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-110 active:scale-95 md:hidden shrink-0"
            >
              <ChevronRight size={14} className="text-white" />
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

          <div className="flex items-center gap-2 shrink-0 flex-nowrap pt-2.5 pb-1 my-auto">
            {/* Unified Enterprise Controls (Upgrade Scale, Calendar, Notifications & Profile) */}
            <EnterpriseHeaderWidgets
              userName={displayOrgName}
              userEmail={userEmail || 'admin@zegaai.site'}
              dark={dark}
              setDark={setDark}
              triggerToast={triggerToast}
              timeRange="Last 24 hours"
              setTimeRange={() => {}}
            />

            <button
              onClick={() => setReleaseNotesOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Sparkles size={14} className="text-indigo-500 animate-pulse" />
              <span>Release v2.4</span>
            </button>

            <button
              onClick={() => setDark(!dark)}
              className="hidden sm:flex p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              title="Toggle Theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
          </div>
        </header>

        {/* Dynamic Sub-View Router */}
        <div className="p-3 sm:p-4 md:p-6 flex-1 pb-20 md:pb-6">
          {(activeTab === 'console' || activeTab === 'overview') && (
            <OverviewView 
              onNavigateToSandbox={() => setActiveTab('sandbox')} 
              isGuest={false}
              userName={displayOrgName}
              userEmail={userEmail}
            />
          )}
          {activeTab === 'ai_command' && <AiCommandCenterView onTriggerToast={triggerToast} />}
          {activeTab === 'sandbox' && (
            workflowStudioMode === 'catalog' ? (
              <WorkflowHubView 
                onOpenCanvas={(wfId) => {
                  setSelectedWorkflowId(wfId);
                  setWorkflowStudioMode('canvas');
                }}
                onTriggerToast={triggerToast}
              />
            ) : (
              <SandboxWorkflowView 
                initialWorkflowId={selectedWorkflowId}
                onBackToCatalog={() => setWorkflowStudioMode('catalog')}
                onTriggerToast={triggerToast}
              />
            )
          )}
          {(activeTab === 'agent_swarms' || activeTab === 'multi_agents') && (
            <AgentSwarmsView 
              onTriggerToast={triggerToast} 
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}
          {activeTab === 'knowledge_brain' && <KnowledgeBrainView onTriggerToast={triggerToast} />}
          {activeTab === 'integrations' && <IntegrationsView onTriggerToast={triggerToast} />}
          {activeTab === 'mcp_connectors' && <McpConnectorsView onTriggerToast={triggerToast} />}
          {activeTab === 'agent_evals' && <AnalyticsView onTriggerToast={triggerToast} />}
          {activeTab === 'dev_portal' && <DevPortalView onTriggerToast={triggerToast} />}
          {activeTab === 'api_sdk' && <ApiSdkView onTriggerToast={triggerToast} />}
          {activeTab === 'webhooks' && <WebhooksView onTriggerToast={triggerToast} />}
          {activeTab === 'system_logs' && <DeveloperLogsView onTriggerToast={triggerToast} />}
          {activeTab === 'zeroclaw_terminal' && <ZeroClawTerminalView onTriggerToast={triggerToast} isGuest={false} userEmail={userEmail} userName={userName} />}
          {activeTab === 'crypto_wallets' && <CryptoWalletsView onTriggerToast={triggerToast} />}
          {(activeTab === 'usage_billing' || activeTab === 'cost_intelligence' || activeTab === 'cost-intelligence') && (
            <CostIntelligenceView onTriggerToast={triggerToast} />
          )}
          {(activeTab === 'payments_bills' || activeTab === 'billing' || activeTab === 'payments-billing') && (
            <PaymentsBillingView mode="payments_billing" onTriggerToast={triggerToast} />
          )}
          {(activeTab === 'ai_safety' || activeTab === 'security_center') && <AiSafetyView onTriggerToast={triggerToast} />}
          {(activeTab === 'infrastructure' || activeTab === 'infrastructure_cluster' || activeTab === 'infra') && <InfrastructureView onTriggerToast={triggerToast} />}
          {activeTab === 'reports' && <ReportsView onTriggerToast={triggerToast} />}
          {(activeTab === 'audit_logs' || activeTab === 'audit_logs_platform' || activeTab === 'audit-logs') && <AuditLogsView onTriggerToast={triggerToast} />}
          {(activeTab === 'rbac_sso' || activeTab === 'organization') && <OrganizationView onTriggerToast={triggerToast} />}
          {activeTab === 'team_roles' && <TeamRolesView onTriggerToast={triggerToast} />}
          {activeTab === 'settings' && <SettingsView onTriggerToast={triggerToast} />}
          {(activeTab === 'help' || activeTab === 'bantuan') && (
            <HelpView 
              onTriggerToast={triggerToast} 
              onNavigateTab={(tab) => setActiveTab(tab)} 
            />
          )}
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 flex items-center justify-around text-[10px] font-bold text-slate-500 shadow-2xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview' || activeTab === 'console'
                ? 'text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50/80 dark:bg-indigo-950/60 scale-105'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('multi_agents')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'multi_agents' || activeTab === 'agent_swarms'
                ? 'text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50/80 dark:bg-indigo-950/60 scale-105'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bot size={18} />
            <span>Agents</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50/80 dark:bg-indigo-950/60 scale-105'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Workflow size={18} />
            <span>Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'help' || activeTab === 'bantuan'
                ? 'text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50/80 dark:bg-indigo-950/60 scale-105'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle size={18} />
            <span>Bantuan</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer relative"
          >
            <div className="size-6 rounded-full bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ChevronRight size={13} className="text-white" />
            </div>
            <span>Menu</span>
            <span className="absolute top-1 right-2 size-2 rounded-full bg-indigo-500 animate-pulse" />
          </button>
        </div>
      </main>

      {/* MOBILE SIDE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fadeIn"
          />

          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full flex flex-col justify-between p-4 z-10 shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-slideInLeft select-none">
            {/* Floating Chevron Close Button on Mobile Drawer Border (Unclipped) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              title="Tutup Menu Mobile"
              className="absolute -right-3.5 top-[28px] -translate-y-1/2 z-50 size-7 rounded-full border border-slate-700 dark:border-indigo-400/60 bg-slate-900 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-950/30 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center cursor-pointer transition-all hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-110 active:scale-95 group"
            >
              <ChevronLeft size={14} className="text-white" />
            </button>

            <div className="space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] pr-1">
              {/* Header Mobile Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ZegaLogo size={28} showText={false} />
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block tracking-tight">ZEGA Enterprise</span>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 block font-mono font-bold">MOBILE STUDIO</span>
                  </div>
                </div>
              </div>

              {/* Mobile Profile Photo Capsule (Top-Left under Logo Header) */}
              <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 shadow-2xs space-y-2">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                    alt="Enterprise User Avatar"
                    className="size-9 rounded-full object-cover border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">{userName || 'Danz A.'}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail || 'admin@zegaai.site'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[9px] font-bold">
                  <span className="px-2 py-0.5 rounded-full border bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 uppercase font-mono tracking-wider">
                    ENTERPRISE ADMIN
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
              </div>

              {/* Mobile Navigation Accordions */}
              <nav className="space-y-2.5 pt-1">
                {enterpriseMenuCategories.map((cat, idx) => {
                  const isExpanded = expandedCategories[cat.category] ?? (idx === 0);
                  const hasActiveChild = cat.items.some(item => item.id === activeTab);
                  return (
                    <div key={idx} className="space-y-1 rounded-2xl p-1 border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/40">
                      <button
                        onClick={() => toggleCategory(cat.category)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer select-none"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <ChevronRight 
                            size={13} 
                            className={`text-indigo-500 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} 
                          />
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
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <Icon size={15} />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {item.badge && (
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0 ml-1 ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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

            {/* Bottom Footer Mobile Drawer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
              <button
                onClick={() => {
                  setActiveTab('help');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <HelpCircle size={15} />
                <span>Pusat Bantuan 24/7</span>
              </button>

              <button
                onClick={async () => {
                  await SupabaseDashboardService.signOut();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RELEASE NOTES V2.4 MODAL (DESKTOP & MOBILE RESPONSIVE) */}
      {releaseNotesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 text-white flex items-center justify-between border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 p-2 flex items-center justify-center shrink-0">
                  <Sparkles className="text-indigo-400" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black tracking-tight">ZEGA Enterprise v2.4 Release</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase">
                      Official Flagship
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">9Router Engine • OWASP Level 3 Telemetry • Multi-LLM Swarm</p>
                </div>
              </div>
              <button
                onClick={() => setReleaseNotesOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
                <Zap className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">Release v2.4 Feature Highlights</h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Versi 2.4 membawa arsitektur AI kluster enterprise tingkat lanjut dengan integrasi 9Router Layer 5 Engine, OWASP Level 3 Security Telemetry, serta latensi inferensi sub-detik.
                  </p>
                </div>
              </div>

              {/* Grid Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                    <Cpu className="text-indigo-500" size={15} />
                    <span>Multi-LLM 9Router Failover</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dukungan multi-model paralel: DeepSeek V4/V3, Gemini 3.6/3.5 Flash, Groq 70B LPU, dan OpenRouter dengan failover latensi sub-detik.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                    <ShieldCheck className="text-emerald-500" size={15} />
                    <span>5-Layer OWASP Guardrails</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Perlindungan OWASP LLM01 Prompt Injection, OWASP LLM07 Data Leakage Redaction, Anti-Throttling 150ms, dan 1MB packet chunk limit.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                    <Database className="text-purple-500" size={15} />
                    <span>Supabase Realtime Telemetry</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sinkronisasi WebSocket real-time untuk 8 node infrastruktur enterprise, RLS policies, dan audit trail live activity.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                    <Zap className="text-amber-500" size={15} />
                    <span>ZeroClaw Keyless Terminal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Orkestrasi terminal ZeroClaw v0.8.3 dengan dompet terenkripsi Privy Solana Devnet & penyelesaian transaksi otomatis.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">ZEGA Enterprise AI • Build 2026.08.05</span>
              <button
                onClick={() => setReleaseNotesOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                Close Release Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
