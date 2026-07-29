import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Workflow, Target, Layers, Settings, 
  Search, Bell, Sun, Moon, X, LogOut, Sparkles, ChevronRight, ChevronDown, Menu,
  ShieldCheck, Bot, Key, CreditCard, UserCheck, Zap, Activity,
  MessageSquare, FileText, BarChart3, DollarSign, Database, ShieldAlert,
  Brain, PieChart, Store, Server, Lock, Link2, CheckCircle2, RefreshCw,
  Cpu, HardDrive, Shield, Terminal, ArrowUpRight, Copy, Plus
} from 'lucide-react';
import { DashboardTab } from './types';
import { OverviewView } from './views/OverviewView';
import { AgentRosterView } from './views/AgentRosterView';
import { SandboxWorkflowView } from './views/SandboxWorkflowView';
import { MissionControlView } from './views/MissionControlView';
import { UmkmDashboardView } from './views/UmkmDashboardView';
import { M2mPaymentsView } from './views/M2mPaymentsView';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../../i18n/translations';

import { SupabaseDashboardService } from './services/supabaseService';

interface UserDashboardProps {
  onClose: () => void;
  dark: boolean;
  setDark: (val: boolean) => void;
  userRole?: 'individual' | 'enterprise' | 'superadmin';
  userEmail?: string;
  userName?: string;
  isGuest?: boolean;
  onSwitchToAdminMode?: () => void;
}

export function UserDashboard({
  onClose,
  dark,
  setDark,
  userRole = 'individual',
  userEmail = 'guest@zegaai.site',
  userName = 'Guest Explorer (Demo Mode)',
  isGuest = true,
  onSwitchToAdminMode
}: UserDashboardProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(
    userRole === 'enterprise' ? 'console' : 'umkm'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Menu categorization for Enterprise User
  const enterpriseMenuCategories = [
    {
      category: 'Orchestration & Agents',
      items: [
        { id: 'console', label: 'AI Telemetry Hub', icon: LayoutDashboard, badge: 'Live' },
        { id: 'multi_agents', label: 'Multi-Agent Roster', icon: Bot, badge: 'Orchestrator' },
        { id: 'sandbox', label: 'Workflow Pipeline Builder', icon: Workflow, badge: 'v2.4' },
        { id: 'agent_swarms', label: 'Autonomous Agent Swarms', icon: Layers, badge: 'Autonomous' },
      ],
    },
    {
      category: 'Intelligence & MCP',
      items: [
        { id: 'knowledge_brain', label: 'RAG Knowledge Indexing', icon: Brain, badge: 'Qdrant' },
        { id: 'mcp_connectors', label: 'MCP Connectors Registry', icon: Database, badge: '14 Active' },
        { id: 'agent_evals', label: 'Agent Evals & Benchmarks', icon: Target, badge: '98.6%' },
      ],
    },
    {
      category: 'Autonomous Payments & Wallets',
      items: [
        { id: 'm2m_payments', label: 'Machine-to-Machine (x402)', icon: Zap, badge: 'x402 / Solana' },
        { id: 'crypto_wallets', label: 'Autonomous Multi-Sig Wallets', icon: Key, badge: 'Vault' },
        { id: 'usage_billing', label: 'Metered Usage & Tokens', icon: CreditCard, badge: 'Usage' },
      ],
    },
    {
      category: 'Governance & Security',
      items: [
        { id: 'ai_safety', label: 'OWASP AI Safety Guardrails', icon: ShieldAlert, badge: 'Firewall' },
        { id: 'audit_logs', label: 'Immutable Audit Ledger', icon: ShieldCheck, badge: 'SHA-256' },
        { id: 'rbac_sso', label: 'Enterprise RBAC & SAML SSO', icon: Lock, badge: 'Okta' },
      ],
    },
    {
      category: 'Infrastructure & Control',
      items: [
        { id: 'cost_telemetry', label: 'LLM Token & Cost Telemetry', icon: PieChart, badge: 'Telemetry' },
        { id: 'cluster_health', label: 'Cluster Nodes & GPU Pods', icon: Server, badge: '99.99%' },
      ],
    },
  ];

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Orchestration & Agents': true,
    'Intelligence & MCP': false,
    'Autonomous Payments & Wallets': false,
    'Governance & Security': false,
    'Infrastructure & Control': false,
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
              <img
                src="/assets/logo/zegalogo.png"
                alt="ZEGA AI Platform"
                className="h-7 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)] transition-[filter] duration-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">ZEGA AI Platform</span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {userRole === 'enterprise' ? 'ENTERPRISE HUB' : 'UMKM STARTER PRO'}
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
            <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded border ${
              userRole === 'enterprise' 
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
            }`}>
              {userRole === 'enterprise' ? 'ENTERPRISE' : 'UMKM'}
            </span>
          </div>

          {/* Render Categorized Menu Items */}
          <nav className="space-y-3 pt-2">
            {userRole === 'enterprise' ? (
              enterpriseMenuCategories.map((cat, idx) => {
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
              })
            ) : (
              [
                { id: 'umkm', label: 'UMKM Dashboard', icon: LayoutDashboard, badge: 'Solopreneur' },
                { id: 'wa_bot', label: 'WhatsApp CS Bot', icon: MessageSquare, badge: 'Auto' },
                { id: 'invoice_gen', label: 'Invoice & Tagihan PDF', icon: FileText, badge: 'PDF' },
                { id: 'ai_copywriter', label: 'AI Copywriter IG/TikTok', icon: Sparkles, badge: 'AI' },
                { id: 'sales_rekap', label: 'Rekap Penjualan Harian', icon: BarChart3, badge: 'Kas' },
                { id: 'integrations', label: 'Integrasi API & Toko', icon: Link2, badge: 'API' },
                { id: 'my_agents', label: 'My AI Agents', icon: Bot, badge: '4 Active' },
                { id: 'sandbox', label: 'Workflow Builder', icon: Workflow, badge: 'v2' },
                { id: 'settings', label: 'Setelan & Paket', icon: CreditCard, badge: 'Plan' },
              ].map((item: { id: string; label: string; icon: any; badge?: string }) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white font-semibold shadow-none'
                        : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {userRole === 'superadmin' && onSwitchToAdminMode && (
            <button
              onClick={onSwitchToAdminMode}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold cursor-pointer hover:bg-amber-500/20"
            >
              <ShieldCheck size={14} /> Mode SuperAdmin
            </button>
          )}
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await SupabaseDashboardService.signOut();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Guest Demo Mode Banner */}
        {isGuest && (
          <div className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-2 flex items-center gap-2 text-[11px] md:text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold uppercase border border-indigo-500/20 flex-shrink-0">
              Guest Mode
            </span>
            <span className="truncate">
              Exploring ZEGA AI Platform as <strong>{userRole === 'enterprise' ? 'Enterprise Guest' : 'Individual/UMKM Guest'}</strong>.
            </span>
          </div>
        )}

        {/* Top Header Navigation */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 px-3 md:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">STATUS</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-md">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Operational (All Nodes Online)</span>
              <span className="sm:hidden">Operational</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
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

        {/* View Renderer */}
        <div className="p-3 sm:p-4 md:p-6 flex-1">
          {(activeTab === 'console' || activeTab === 'overview') && (
            <OverviewView onNavigateToSandbox={() => setActiveTab('sandbox')} />
          )}

          {(activeTab === 'umkm' || activeTab === 'wa_bot' || activeTab === 'invoice_gen' || activeTab === 'ai_copywriter' || activeTab === 'sales_rekap' || activeTab === 'integrations') && (
            <UmkmDashboardView activeTab={activeTab} />
          )}

          {(activeTab === 'my_agents' || activeTab === 'multi_agents') && <AgentRosterView />}
          {activeTab === 'sandbox' && <SandboxWorkflowView />}

          {/* ENTERPRISE SUB-VIEW 1: AGENT SWARMS */}
          {activeTab === 'agent_swarms' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Hierarchical Agent Swarms & Team Orchestration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Topologi tim agen otonom dengan koordinasi Leader-Worker dan konsensus otomatis.
                  </p>
                </div>
                <button onClick={() => triggerToast('Tolak Swarm Baru')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer">
                  + Buat Swarm Agen Baru
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Swarm #1: Financial Audit Team</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">Running</span>
                  </div>
                  <div className="text-slate-500 font-normal">5 Agen • Leader: Finance Master Agent</div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">Status: Autonomous Executing (99.4% Consensus)</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Swarm #2: B2B Sales Lead Outreach</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <div className="text-slate-500 font-normal">8 Agen • Leader: CRM Dispatcher Agent</div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold pt-1 border-t border-slate-200 dark:border-slate-700">Status: 14,280 Kontak Terproses</div>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 2: KNOWLEDGE BRAIN & RAG */}
          {activeTab === 'knowledge_brain' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Brain size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Enterprise Knowledge & Vector RAG Indexing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Kelola basis data vektor, parameter chunking, dan konteks memori kognitif agen.
                  </p>
                </div>
                <button onClick={() => triggerToast('Sinkronisasi Vektor RAG Dimulai')} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold cursor-pointer">
                  Sync Knowledge Base
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Vector Database:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">Qdrant Cluster (34.2M Vektor)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Embedding Model:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">text-embedding-3-large (3072 dim)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Status Indexing:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Synced & Live (142kb/s)</span>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 3: MCP CONNECTORS */}
          {activeTab === 'mcp_connectors' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Database size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Model Context Protocol (MCP) Server Registry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Konektor standar API untuk integrasi basis data enterprise, alat internal & SaaS.
                  </p>
                </div>
                <button onClick={() => triggerToast('Tambah Server MCP')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer">
                  + Register MCP Server
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                {[
                  { name: 'Postgres MCP Server', tools: '8 Tools', status: 'Connected' },
                  { name: 'Salesforce CRM MCP', tools: '12 Tools', status: 'Connected' },
                  { name: 'GitHub Enterprise MCP', tools: '5 Tools', status: 'Connected' },
                  { name: 'Slack Bot MCP', tools: '4 Tools', status: 'Connected' },
                  { name: 'Notion Workspace MCP', tools: '6 Tools', status: 'Connected' },
                  { name: 'Stripe M2M MCP', tools: '10 Tools', status: 'Connected' },
                ].map((mcp, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{mcp.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">{mcp.tools} • ● {mcp.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 4: AGENT EVALS */}
          {activeTab === 'agent_evals' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Automated Agent Evals & Benchmark Testing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Deteksi halusinasi otomatis, skor akurasi agen, dan pengujian regresi.
                  </p>
                </div>
                <button onClick={() => triggerToast('Jalankan Eval Test Suite')} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold cursor-pointer">
                  Run Benchmark Suite
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Overall Accuracy Score:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">98.6%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hallucination Rate:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">0.12%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Latest Eval Run:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">Passed 420 Test Suites (100%)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'm2m_payments' && <M2mPaymentsView />}

          {/* ENTERPRISE SUB-VIEW 5: CRYPTO WALLETS */}
          {activeTab === 'crypto_wallets' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Key size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Autonomous Gas & Multi-Sig Vault Manager
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Kelola cadangan gas fee dan brankas multi-sig non-custodial untuk transaksi agen otonom.
                  </p>
                </div>
                <button onClick={() => triggerToast('Deposit Gas Solana')} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer">
                  + Deposit Gas Vault
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Solana Agent Gas Vault</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">45.8 SOL ($6,870)</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Address: 7xKX...9qLz (Active)</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase">Ethereum L2 Gas Tank</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">2.4 ETH ($7,200)</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Address: 0x48...91bA (Active)</div>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 6: METERED USAGE & BILLING */}
          {activeTab === 'usage_billing' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Metered Usage & Enterprise Credit Billing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Kalkulasi konsumsi token LLM real-time, kredit API unit, dan histori tagihan.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Credit Balance:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">$14,250.00 / $20,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Month LLM Token Usage:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">142.8M Tokens</span>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 7: AI SAFETY */}
          {activeTab === 'ai_safety' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />
                    OWASP AI Safety & Prompt Injection Guardrails
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Filter ancaman real-time, masking data PII, dan moderasi output LLM.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Firewall Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">● Active (0 Prompt Injections Blocked Today)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Standards Compliance:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">SOC2 Type II, ISO 27001, OWASP Top 10 LLM</span>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 8: AUDIT LOGS */}
          {activeTab === 'audit_logs' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Immutable Cryptographic Audit Log Ledger
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Log kejadian terenkripsi yang dapat diverifikasi dari seluruh eksekusi agen.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ledger Hash:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">0x8f9a...124b (SHA-256 Verified)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Recorded Events:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">1,489,200 events</span>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 9: RBAC & SSO */}
          {activeTab === 'rbac_sso' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Lock size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Enterprise RBAC & SAML/Okta SSO Integration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Hak akses granular, isolasi workspace, dan otentikasi single sign-on.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">SAML SSO Provider:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">● Okta SAML 2.0 (Domain: zega.ai)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Active Roles:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">SuperAdmin, Lead Architect, Operator, Viewer</span>
                </div>
              </div>
            </div>
          )}

          {/* ENTERPRISE SUB-VIEW 10: CLUSTER HEALTH */}
          {activeTab === 'cluster_health' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Server size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Kubernetes Pods & Edge Node Cluster Health
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Status node infrastruktur terdistribusi, penggunaan CPU/GPU, dan memori.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="text-slate-400 text-[10px] uppercase">GPU Pod Cluster</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">32 NVIDIA H100s (84% Load)</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="text-slate-400 text-[10px] uppercase">Memory Utilization</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">512 GB / 1024 GB (50%)</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="text-slate-400 text-[10px] uppercase">Cluster Uptime</div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">99.99% (90 hari)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cost_telemetry' && <MissionControlView />}

          {/* ENTERPRISE SUB-VIEW 11: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-none">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Pengaturan Akun & Kunci API Enterprise
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    Kelola paket aktif ({userRole}) dan token akses API ZEGA.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">API Access Token</div>
                  <div className="text-[11px] font-mono text-slate-400">zega_live_sec_8941294192412</div>
                </div>
                <button onClick={() => triggerToast('Kunci API Baru Berhasil Di-rotate!')} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold cursor-pointer">
                  Rotate API Key
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-sm">
          <aside className="w-72 bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 shadow-xl">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/logo/zegalogo.png"
                    alt="ZEGA AI"
                    className="h-7 w-auto object-contain [filter:none] dark:[filter:invert(1)_hue-rotate(180deg)]"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">ZEGA AI</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Profile Capsule */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                </div>
                <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded border bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  {userRole === 'enterprise' ? 'ENTERPRISE' : 'UMKM'}
                </span>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1 pt-2">
                {(userRole === 'enterprise' ? enterpriseMenuCategories.flatMap(c => c.items) : [
                  { id: 'umkm', label: 'UMKM Dashboard', icon: LayoutDashboard },
                  { id: 'wa_bot', label: 'WhatsApp CS Bot', icon: MessageSquare },
                  { id: 'invoice_gen', label: 'Invoice & Tagihan PDF', icon: FileText },
                  { id: 'ai_copywriter', label: 'AI Copywriter IG/TikTok', icon: Sparkles },
                  { id: 'sales_rekap', label: 'Rekap Penjualan Harian', icon: BarChart3 },
                  { id: 'integrations', label: 'Integrasi API & Toko', icon: Link2 },
                  { id: 'my_agents', label: 'My AI Agents', icon: Bot },
                  { id: 'sandbox', label: 'Workflow Builder', icon: Workflow },
                  { id: 'settings', label: 'Setelan & Paket', icon: CreditCard },
                ]).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await SupabaseDashboardService.signOut();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 mt-4"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </aside>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </div>
  );
}
