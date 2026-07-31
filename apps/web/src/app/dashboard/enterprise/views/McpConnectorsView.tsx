import React, { useState } from 'react';
import { 
  Database, Plus, Search, Filter, Cpu, CheckCircle2, TrendingUp, TrendingDown,
  ArrowRight, Layers, Activity, Server, Zap, Globe, ShieldCheck, Check,
  CreditCard, MessageSquare, Code2, FileText, Share2, Bell, HelpCircle,
  MoreVertical, X, ExternalLink, RefreshCw, LayoutGrid, List, SlidersHorizontal,
  ChevronDown, Brain, Box, Sparkles
} from 'lucide-react';

import { getR2CdnUrl } from '../../../utils/cdn';

interface McpConnectorsViewProps {
  onTriggerToast?: (msg: string) => void;
}

export function McpConnectorsView({ onTriggerToast }: McpConnectorsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'connected' | 'marketplace' | 'tools'>('all');
  const [selectedServer, setSelectedServer] = useState<string | null>('Stripe MCP');
  const [drawerTab, setDrawerTab] = useState<'overview' | 'tools' | 'permissions' | 'analytics' | 'logs' | 'settings'>('overview');
  
  // Interactive Donut Chart hover state
  const [hoveredSlice, setHoveredSlice] = useState<string | null>('Stripe MCP');

  const donutData = [
    { name: 'Stripe MCP', pct: 32, calls: '396K', color: '#4F46E5', dashArray: '32 100', dashOffset: '0' },
    { name: 'Supabase MCP', pct: 24, calls: '298K', color: '#10B981', dashArray: '24 100', dashOffset: '-32' },
    { name: 'Slack MCP', pct: 18, calls: '223K', color: '#F59E0B', dashArray: '18 100', dashOffset: '-56' },
    { name: 'GitHub MCP', pct: 12, calls: '149K', color: '#8B5CF6', dashArray: '14 100', dashOffset: '-74' },
    { name: 'Others', pct: 14, calls: '174K', color: '#94A3B8', dashArray: '14 100', dashOffset: '-88' },
  ];

  const activeSegment = donutData.find(d => d.name === hoveredSlice) || donutData[0];

  const mcpServers = [
    { id: 'stripe', name: 'Stripe MCP', cat: 'Payments', status: 'Connected', latency: '132ms', tools: '183 Tools', icon: CreditCard, color: 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800', logo: getR2CdnUrl('/assets/visualization/stripe.webp') },
    { id: 'supabase', name: 'Supabase MCP', cat: 'Database', status: 'Connected', latency: '96ms', tools: '98 Tools', icon: Database, color: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800', logo: getR2CdnUrl('/assets/logo/supabase.png') },
    { id: 'slack', name: 'Slack MCP', cat: 'Communication', status: 'Connected', latency: '121ms', tools: '92 Tools', icon: MessageSquare, color: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800', logo: getR2CdnUrl('/assets/visualization/slack.webp') },
    { id: 'github', name: 'GitHub MCP', cat: 'DevOps', status: 'Connected', latency: '110ms', tools: '132 Tools', icon: Code2, color: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700', logo: getR2CdnUrl('/assets/logo/github.svg') },
    { id: 'gdrive', name: 'Google Drive MCP', cat: 'Storage', status: 'Connected', latency: '145ms', tools: '63 Tools', icon: FileText, color: 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800', logo: getR2CdnUrl('/assets/logo/google_drive.png') },
    { id: 'notion', name: 'Notion MCP', cat: 'Productivity', status: 'Connected', latency: '128ms', tools: '78 Tools', icon: FileText, color: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700', logo: getR2CdnUrl('/assets/logo/notion.png') },
    { id: 'jira', name: 'Jira MCP', cat: 'Project Mgmt', status: 'Connected', latency: '156ms', tools: '59 Tools', icon: Layers, color: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800', logo: getR2CdnUrl('/assets/logo/Jira.webp') },
    { id: 'hubspot', name: 'HubSpot MCP', cat: 'CRM', status: 'Connected', latency: '140ms', tools: '70 Tools', icon: Share2, color: 'bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800', logo: getR2CdnUrl('/assets/logo/hubspot.png') },
  ];

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100 font-sans">
      {/* STYLES FOR ANIMATED DASHED DATA FLOW LINES */}
      <style>{`
        @keyframes strokeFlow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-data-flow {
          stroke-dasharray: 6 6;
          animation: strokeFlow 1.2s linear infinite;
        }
      `}</style>

      {/* TOP HEADER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            MCP Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Manage and connect Model Context Protocol servers
          </p>
        </div>

        {/* TOP CONTROLS & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search MCP servers, tools, or actions..."
              className="pl-9 pr-10 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 md:w-80 shadow-2xs font-medium"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
              ⌘K
            </kbd>
          </div>

          <button className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer">
            <Bell size={16} />
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              12
            </span>
          </button>

          <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer">
            <HelpCircle size={16} />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Production</span>
            <ChevronDown size={12} className="text-slate-400 ml-1" />
          </div>

          <button 
            onClick={() => onTriggerToast && onTriggerToast('Opening MCP Server Registration Wizard...')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add MCP Server</span>
          </button>
        </div>
      </div>

      {/* TOP 6 KPI CARDS WITH SPARKLINES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Connected Servers</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">24</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ▲ 20%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">vs last 7 days</span>
          <svg className="w-full h-5 text-indigo-500 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 15 Q 25 5, 50 12 T 100 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Available Tools</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">312</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ▲ 18%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">vs last 7 days</span>
          <svg className="w-full h-5 text-amber-500 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 18 Q 20 8, 40 14 T 80 4 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total API Calls (7D)</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">1.24M</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ▲ 32%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">vs last 7 days</span>
          <svg className="w-full h-5 text-purple-500 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 14 Q 30 4, 60 16 T 100 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Avg Latency</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">132ms</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ▼ 6%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">vs last 7 days</span>
          <svg className="w-full h-5 text-teal-500 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 6 Q 25 18, 50 10 T 100 16" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Success Rate</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">99.74%</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ▲ 1.1%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">vs last 7 days</span>
          <svg className="w-full h-5 text-emerald-500 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 12 Q 35 16, 70 6 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Connections</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">98</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              ▲ 15%
            </span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">vs last 7 days</span>
          <svg className="w-full h-5 text-amber-500 mt-2" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M 0 16 Q 40 4, 70 12 T 100 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT & CENTER MAIN CONTENT (8 COLS) */}
        <div className="lg:col-span-8 space-y-5">
          {/* SUB TABS & FILTERS */}
          <div className="space-y-3">
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
              {[
                { id: 'all', label: 'All Servers' },
                { id: 'connected', label: 'Connected' },
                { id: 'marketplace', label: 'Marketplace' },
                { id: 'tools', label: 'My Tools' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {activeSubTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search MCP servers..."
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 font-medium"
                  />
                </div>
                <select className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer">
                  <option>All Categories</option>
                  <option>Payments</option>
                  <option>Database</option>
                  <option>Communication</option>
                </select>
                <select className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer">
                  <option>All Status</option>
                  <option>Connected</option>
                </select>
                <select className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer">
                  <option>Sort: Recently Used</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
                <button className="p-1 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs cursor-pointer">
                  <LayoutGrid size={13} />
                </button>
                <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* 8 MCP SERVER CARDS GRID (4x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {mcpServers.map((server) => {
              const Icon = server.icon;
              const isSelected = selectedServer === server.name;
              return (
                <div
                  key={server.name}
                  onClick={() => setSelectedServer(server.name)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-500'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-9 rounded-xl ${server.color} flex items-center justify-center p-1.5 shadow-2xs`}>
                        <img src={server.logo} alt={server.name} className="size-full object-contain rounded-md" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{server.name}</h3>
                        <span className="text-[10px] text-slate-400 font-medium">{server.cat}</span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {server.status}
                    </span>
                    <svg className="w-12 h-4 text-emerald-500" viewBox="0 0 50 15" preserveAspectRatio="none">
                      <path d="M 0 10 Q 15 2, 30 12 T 50 4" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{server.tools}</span>
                    <span className="font-mono text-slate-400 flex items-center gap-1">
                      <Zap size={10} className="text-amber-500" />
                      {server.latency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1">
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View all servers →
            </button>
          </div>

          {/* BOTTOM SECTION: ENLARGED MCP CONNECTION MAP (FULL WIDTH OF LEFT COLUMN) & 2-COLUMN ANALYTICS */}
          <div className="space-y-5 pt-2">
            {/* 1. ENLARGED FULL-WIDTH MCP CONNECTION MAP WITH LIVE ANIMATED DATA FLOWS */}
            <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                    MCP Enterprise Connection Map
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">Real-time data routing between AI Agents, ZEGA MCP Hub, Enterprise Connectors, and External APIs</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:border-emerald-800 border flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live 100% Active
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              {/* HIGH-RESOLUTION ENLARGED SVG DIAGRAM */}
              <div className="w-full overflow-x-auto rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 p-2">
                <svg className="w-full h-auto min-w-[700px]" viewBox="0 0 780 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="mcpHubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>

                    {/* PATH DEFINITIONS FROM AGENTS TO HUB */}
                    <path id="flow-agents-to-hub" d="M 125 115 L 210 115" />

                    {/* PATH DEFINITIONS FROM HUB TO DISTINCT MCP CONNECTORS */}
                    <path id="flow-hub-to-stripe" d="M 330 115 C 370 115, 370 25, 410 25" />
                    <path id="flow-hub-to-supabase" d="M 330 115 C 370 115, 370 61, 410 61" />
                    <path id="flow-hub-to-slack" d="M 330 115 C 370 115, 370 97, 410 97" />
                    <path id="flow-hub-to-github" d="M 330 115 C 370 115, 370 133, 410 133" />
                    <path id="flow-hub-to-jira" d="M 330 115 C 370 115, 370 169, 410 169" />
                    <path id="flow-hub-to-hubspot" d="M 330 115 C 370 115, 370 205, 410 205" />

                    {/* PATH DEFINITIONS FROM MCP CONNECTORS TO EXTERNAL SERVICES */}
                    <path id="flow-stripe-to-ext" d="M 545 25 C 590 25, 590 115, 635 115" />
                    <path id="flow-supabase-to-ext" d="M 545 61 C 590 61, 590 115, 635 115" />
                    <path id="flow-slack-to-ext" d="M 545 97 C 590 97, 590 115, 635 115" />
                    <path id="flow-github-to-ext" d="M 545 133 C 590 133, 590 115, 635 115" />
                    <path id="flow-jira-to-ext" d="M 545 169 C 590 169, 590 115, 635 115" />
                    <path id="flow-hubspot-to-ext" d="M 545 205 C 590 205, 590 115, 635 115" />
                  </defs>

                  {/* CONNECTING BEZIER LINES */}
                  <use href="#flow-agents-to-hub" stroke="#818CF8" strokeWidth="3" strokeDasharray="5 5" className="animate-data-flow" />

                  <use href="#flow-hub-to-stripe" stroke="#6366F1" strokeWidth="2" opacity="0.85" />
                  <use href="#flow-hub-to-supabase" stroke="#10B981" strokeWidth="2" opacity="0.85" />
                  <use href="#flow-hub-to-slack" stroke="#F59E0B" strokeWidth="2" opacity="0.85" />
                  <use href="#flow-hub-to-github" stroke="#8B5CF6" strokeWidth="2" opacity="0.85" />
                  <use href="#flow-hub-to-jira" stroke="#0284C7" strokeWidth="2" opacity="0.85" />
                  <use href="#flow-hub-to-hubspot" stroke="#F97316" strokeWidth="2" opacity="0.85" />

                  <use href="#flow-stripe-to-ext" stroke="#6366F1" strokeWidth="1.5" opacity="0.6" />
                  <use href="#flow-supabase-to-ext" stroke="#10B981" strokeWidth="1.5" opacity="0.6" />
                  <use href="#flow-slack-to-ext" stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" />
                  <use href="#flow-github-to-ext" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.6" />
                  <use href="#flow-jira-to-ext" stroke="#0284C7" strokeWidth="1.5" opacity="0.6" />
                  <use href="#flow-hubspot-to-ext" stroke="#F97316" strokeWidth="1.5" opacity="0.6" />

                  {/* LIVE ANIMATED DATA PARTICLES */}
                  <circle r="4" fill="#4F46E5" filter="drop-shadow(0 0 6px #4F46E5)">
                    <animateMotion dur="1.1s" repeatCount="indefinite">
                      <mpath href="#flow-agents-to-hub" />
                    </animateMotion>
                  </circle>

                  <circle r="3.5" fill="#6366F1" filter="drop-shadow(0 0 4px #6366F1)">
                    <animateMotion dur="1.7s" repeatCount="indefinite">
                      <mpath href="#flow-hub-to-stripe" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#10B981" filter="drop-shadow(0 0 4px #10B981)">
                    <animateMotion dur="1.4s" repeatCount="indefinite" begin="0.3s">
                      <mpath href="#flow-hub-to-supabase" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#F59E0B" filter="drop-shadow(0 0 4px #F59E0B)">
                    <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.6s">
                      <mpath href="#flow-hub-to-slack" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#8B5CF6" filter="drop-shadow(0 0 4px #8B5CF6)">
                    <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.2s">
                      <mpath href="#flow-hub-to-github" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#0284C7" filter="drop-shadow(0 0 4px #0284C7)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s">
                      <mpath href="#flow-hub-to-jira" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#F97316" filter="drop-shadow(0 0 4px #F97316)">
                    <animateMotion dur="1.9s" repeatCount="indefinite" begin="0.4s">
                      <mpath href="#flow-hub-to-hubspot" />
                    </animateMotion>
                  </circle>

                  {/* NODE 1: AI AGENTS CLUSTER */}
                  <g transform="translate(10, 78)">
                    <rect width="115" height="74" rx="14" className="fill-indigo-50/90 dark:fill-indigo-950/40 stroke-indigo-200 dark:stroke-indigo-800/60" strokeWidth="1.5" />
                    <rect x="8" y="21" width="32" height="32" rx="8" className="fill-indigo-600/10 dark:fill-indigo-400/20" />
                    <image href={getR2CdnUrl('/assets/logo/ai-agents.png')} x="10" y="23" width="28" height="28" />
                    <text x="46" y="32" fontFamily="sans-serif" fontSize="11" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">AI Agents</text>
                    <text x="46" y="46" fontFamily="sans-serif" fontSize="9" fontWeight="medium" className="fill-indigo-600 dark:fill-indigo-400">34 Agents Active</text>
                    <text x="46" y="58" fontFamily="sans-serif" fontSize="8" className="fill-slate-500 dark:fill-slate-400">Copilot · Sales · Code</text>
                  </g>

                  {/* NODE 2: ZEGA MCP ORCHESTRATOR HUB */}
                  <g transform="translate(210, 70)">
                    <rect width="120" height="90" rx="16" className="fill-white dark:fill-slate-900" stroke="url(#mcpHubGrad)" strokeWidth="3" filter="drop-shadow(0 4px 12px rgba(79,70,229,0.25))" />
                    <rect x="6" y="6" width="108" height="78" rx="12" className="fill-indigo-50/80 dark:fill-indigo-950/60" />
                    <image href={getR2CdnUrl('/assets/logo/zegalogo.png')} x="22" y="14" width="76" height="32" preserveAspectRatio="xMidYMid meet" className="[filter:none] dark:[filter:invert(1)_hue-rotate(180deg)]" />
                    <text x="60" y="60" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="900" className="fill-indigo-600 dark:fill-indigo-400">ZEGA MCP Hub</text>
                    <text x="60" y="73" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fontWeight="600" className="fill-indigo-500 dark:fill-indigo-300">24 Server Nodes</text>
                  </g>

                  {/* NODE 3: DISTINCT ENTERPRISE CONNECTORS WITH REAL LOGOS */}
                  {/* STRIPE */}
                  <g transform="translate(410, 10)">
                    <rect width="135" height="30" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1.5" />
                    <rect x="4" y="4" width="22" height="22" rx="6" className="fill-indigo-50 dark:fill-indigo-950/60" />
                    <image href={getR2CdnUrl('/assets/visualization/stripe.webp')} x="7" y="7" width="16" height="16" />
                    <text x="32" y="19" fontFamily="sans-serif" fontSize="9.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">Stripe MCP</text>
                    <text x="92" y="19" fontFamily="sans-serif" fontSize="8" fontWeight="medium" className="fill-indigo-600 dark:fill-indigo-400">Payments</text>
                  </g>

                  {/* SUPABASE */}
                  <g transform="translate(410, 46)">
                    <rect width="135" height="30" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1.5" />
                    <rect x="4" y="4" width="22" height="22" rx="6" className="fill-emerald-50 dark:fill-emerald-950/60" />
                    <image href={getR2CdnUrl('/assets/logo/supabase.png')} x="7" y="7" width="16" height="16" />
                    <text x="32" y="19" fontFamily="sans-serif" fontSize="9.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">Supabase MCP</text>
                    <text x="96" y="19" fontFamily="sans-serif" fontSize="8" fontWeight="medium" className="fill-emerald-600 dark:fill-emerald-400">Database</text>
                  </g>

                  {/* SLACK */}
                  <g transform="translate(410, 82)">
                    <rect width="135" height="30" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1.5" />
                    <rect x="4" y="4" width="22" height="22" rx="6" className="fill-amber-50 dark:fill-amber-950/60" />
                    <image href={getR2CdnUrl('/assets/visualization/slack.webp')} x="7" y="7" width="16" height="16" />
                    <text x="32" y="19" fontFamily="sans-serif" fontSize="9.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">Slack MCP</text>
                    <text x="94" y="19" fontFamily="sans-serif" fontSize="8" fontWeight="medium" className="fill-amber-600 dark:fill-amber-400">Comm</text>
                  </g>

                  {/* GITHUB */}
                  <g transform="translate(410, 118)">
                    <rect width="135" height="30" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1.5" />
                    <rect x="4" y="4" width="22" height="22" rx="6" className="fill-purple-50 dark:fill-purple-950/60" />
                    <image href={getR2CdnUrl('/assets/logo/github.svg')} x="7" y="7" width="16" height="16" className="dark:filter dark:invert" />
                    <text x="32" y="19" fontFamily="sans-serif" fontSize="9.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">GitHub MCP</text>
                    <text x="96" y="19" fontFamily="sans-serif" fontSize="8" fontWeight="medium" className="fill-purple-600 dark:fill-purple-400">DevOps</text>
                  </g>

                  {/* JIRA */}
                  <g transform="translate(410, 154)">
                    <rect width="135" height="30" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1.5" />
                    <rect x="4" y="4" width="22" height="22" rx="6" className="fill-sky-50 dark:fill-sky-950/60" />
                    <image href={getR2CdnUrl('/assets/logo/Jira.webp')} x="7" y="7" width="16" height="16" />
                    <text x="32" y="19" fontFamily="sans-serif" fontSize="9.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">Jira MCP</text>
                    <text x="90" y="19" fontFamily="sans-serif" fontSize="8" fontWeight="medium" className="fill-sky-600 dark:fill-sky-400">Projects</text>
                  </g>

                  {/* HUBSPOT */}
                  <g transform="translate(410, 190)">
                    <rect width="135" height="30" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1.5" />
                    <rect x="4" y="4" width="22" height="22" rx="6" className="fill-orange-50 dark:fill-orange-950/60" />
                    <image href={getR2CdnUrl('/assets/logo/hubspot.png')} x="7" y="7" width="16" height="16" />
                    <text x="32" y="19" fontFamily="sans-serif" fontSize="9.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">HubSpot MCP</text>
                    <text x="100" y="19" fontFamily="sans-serif" fontSize="8" fontWeight="medium" className="fill-orange-600 dark:fill-orange-400">CRM</text>
                  </g>

                  {/* NODE 4: EXTERNAL CLOUD SERVICES & WEBHOOKS */}
                  <g transform="translate(635, 78)">
                    <rect width="135" height="74" rx="14" className="fill-amber-50/90 dark:fill-amber-950/40 stroke-amber-200 dark:stroke-amber-800/60" strokeWidth="1.5" />
                    <rect x="8" y="21" width="32" height="32" rx="8" className="fill-amber-500/10 dark:fill-amber-400/20" />
                    <image href={getR2CdnUrl('/assets/logo/external-api.png')} x="10" y="23" width="28" height="28" />
                    <text x="46" y="32" fontFamily="sans-serif" fontSize="10.5" fontWeight="bold" className="fill-slate-900 dark:fill-slate-100">External APIs</text>
                    <text x="46" y="46" fontFamily="sans-serif" fontSize="9" fontWeight="medium" className="fill-amber-600 dark:fill-amber-400">120+ Microservices</text>
                    <text x="46" y="58" fontFamily="sans-serif" fontSize="8" className="fill-slate-500 dark:fill-slate-400">REST · gRPC · Webhook</text>
                  </g>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Active Flow (Normal)</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" /> Warning Threshold</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" /> Error Rate (&lt;0.01%)</span>
                </div>
                <span className="font-mono text-slate-400">Total Throughput: 1.24M req/day</span>
              </div>
            </div>

            {/* 2-COLUMN BOTTOM ROW: REAL INTERACTIVE USAGE OVERVIEW PIE CHART & RECENT ACTIVITY STREAM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. REAL INTERACTIVE USAGE OVERVIEW (7D) DONUT/PIE CHART */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Usage Overview (7D)</h3>
                  <span className="text-[10px] font-mono text-slate-400">Total: 1.24M Calls</span>
                </div>
                
                <div className="flex items-center gap-4 pt-1">
                  {/* STATEFUL INTERACTIVE SVG DONUT CHART */}
                  <div className="relative size-32 flex-shrink-0 flex items-center justify-center">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                      {[
                        { name: 'Stripe MCP', pct: 32, calls: '396K', color: '#6366F1', dashArray: '32 100', dashOffset: '0' },
                        { name: 'Supabase MCP', pct: 24, calls: '298K', color: '#10B981', dashArray: '24 100', dashOffset: '-32' },
                        { name: 'Slack MCP', pct: 18, calls: '223K', color: '#F59E0B', dashArray: '18 100', dashOffset: '-56' },
                        { name: 'GitHub MCP', pct: 12, calls: '149K', color: '#8B5CF6', dashArray: '12 100', dashOffset: '-74' },
                        { name: 'HubSpot MCP', pct: 8, calls: '99K', color: '#F97316', dashArray: '8 100', dashOffset: '-86' },
                        { name: 'Others', pct: 6, calls: '75K', color: '#64748B', dashArray: '6 100', dashOffset: '-94' },
                      ].map((item) => {
                        const isHovered = hoveredSlice === item.name;
                        return (
                          <path
                            key={item.name}
                            onMouseEnter={() => setHoveredSlice(item.name)}
                            strokeDasharray={item.dashArray}
                            strokeDashoffset={item.dashOffset}
                            stroke={item.color}
                            strokeWidth={isHovered ? 8 : 6}
                            fill="none"
                            className="transition-all duration-300 cursor-pointer"
                            opacity={hoveredSlice && !isHovered ? 0.35 : 1}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        );
                      })}
                    </svg>
                    {/* CENTRAL READOUT DISPLAY ON HOVER */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none">
                        {hoveredSlice ? ([
                          { name: 'Stripe MCP', pct: '32%' },
                          { name: 'Supabase MCP', pct: '24%' },
                          { name: 'Slack MCP', pct: '18%' },
                          { name: 'GitHub MCP', pct: '12%' },
                          { name: 'HubSpot MCP', pct: '8%' },
                          { name: 'Others', pct: '6%' },
                        ].find(d => d.name === hoveredSlice)?.pct || '32%') : '32%'}
                      </span>
                      <span className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight mt-0.5 max-w-[70px] truncate">
                        {hoveredSlice || 'Stripe MCP'}
                      </span>
                    </div>
                  </div>

                  {/* SYNCHRONIZED INTERACTIVE LEGEND */}
                  <div className="space-y-1.5 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 flex-1">
                    {[
                      { name: 'Stripe MCP', pct: 32, calls: '396K', color: '#6366F1' },
                      { name: 'Supabase MCP', pct: 24, calls: '298K', color: '#10B981' },
                      { name: 'Slack MCP', pct: 18, calls: '223K', color: '#F59E0B' },
                      { name: 'GitHub MCP', pct: 12, calls: '149K', color: '#8B5CF6' },
                      { name: 'HubSpot MCP', pct: 8, calls: '99K', color: '#F97316' },
                      { name: 'Others', pct: 6, calls: '75K', color: '#64748B' },
                    ].map((item) => {
                      const isHovered = hoveredSlice === item.name;
                      return (
                        <div
                          key={item.name}
                          onMouseEnter={() => setHoveredSlice(item.name)}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all ${
                            isHovered 
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 font-bold shadow-xs scale-102 border border-indigo-200 dark:border-indigo-800' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="font-mono text-[9.5px] text-slate-400 flex-shrink-0 ml-1">{item.pct}% ({item.calls})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. RECENT ACTIVITY STREAM */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Recent Activity</h3>
                  <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
                </div>

                <div className="space-y-2 text-[11px]">
                  {[
                    { logo: getR2CdnUrl('/assets/visualization/stripe.webp'), color: 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800', server: 'Stripe MCP', msg: 'Payment intent created', time: '2m ago' },
                    { logo: getR2CdnUrl('/assets/logo/supabase.png'), color: 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800', server: 'Supabase MCP', msg: 'Query executed', time: '5m ago' },
                    { logo: getR2CdnUrl('/assets/visualization/slack.webp'), color: 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800', server: 'Slack MCP', msg: 'Message posted', time: '8m ago' },
                    { logo: getR2CdnUrl('/assets/logo/Jira.webp'), color: 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800', server: 'Jira MCP', msg: 'Issue updated', time: '12m ago' },
                    { logo: getR2CdnUrl('/assets/logo/github.svg'), color: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700', server: 'GitHub MCP', msg: 'Pull request created', time: '15m ago' },
                  ].map((act, idx) => {
                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5 last:border-0">
                        <div className="flex items-center gap-2 truncate">
                          <div className={`size-6 rounded-lg ${act.color} flex items-center justify-center p-1 font-bold`}>
                            <img src={act.logo} alt={act.server} className="size-full object-contain rounded-xs" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] truncate">{act.server}</span>
                            <span className="text-[9.5px] text-slate-400 truncate block">{act.msg}</span>
                          </div>
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-400 flex-shrink-0">{act.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT DEDICATED INSPECTION DRAWER (4 COLS) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 p-2 flex items-center justify-center shadow-xs">
                <img 
                  src={mcpServers.find(s => s.name === selectedServer)?.logo || getR2CdnUrl('/assets/visualization/stripe.webp')} 
                  alt={selectedServer || 'MCP Server'} 
                  className="size-full object-contain rounded-md" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedServer || 'Stripe MCP'}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-medium">Payments</p>
                <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">v2.1.0 · Last synced: 2m ago</p>
              </div>
            </div>

            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'tools', label: 'Tools' },
              { id: 'permissions', label: 'Permissions' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'logs', label: 'Logs' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDrawerTab(tab.id as any)}
                className={`font-bold transition-colors cursor-pointer ${
                  drawerTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-2'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase">Health</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 block mt-0.5">99.98%</span>
              <svg className="w-full h-3 text-emerald-500 mt-1" viewBox="0 0 50 10" preserveAspectRatio="none">
                <path d="M 0 8 Q 25 2, 50 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase">Latency</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 block mt-0.5">132ms</span>
              <svg className="w-full h-3 text-emerald-500 mt-1" viewBox="0 0 50 10" preserveAspectRatio="none">
                <path d="M 0 5 Q 25 8, 50 2" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase">Uptime</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 block mt-0.5">100%</span>
              <svg className="w-full h-3 text-emerald-500 mt-1" viewBox="0 0 50 10" preserveAspectRatio="none">
                <path d="M 0 5 Q 25 5, 50 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Description</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Connect to Stripe for payments, subscriptions, customers, invoices, refunds and more.
            </p>
            <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1">
              View Documentation <ExternalLink size={11} />
            </a>
          </div>

          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[10.5px]">
            <div>
              <span className="text-slate-400 block font-medium">Server URL</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">https://mcp.stripe.com</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Protocol</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">SSE</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Authentication</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">OAuth 2.0</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">API Version</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 block">2024-04-10</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Rate Limit</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 block">1,000 req/min</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Owner</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Finance Team</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Popular Tools</h4>
              <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View all tools</button>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Create Payment Intent', desc: 'Create a new payment intent', tag: 'Payments' },
                { name: 'Retrieve Customer', desc: 'Retrieve customer details', tag: 'Customers' },
                { name: 'Create Invoice', desc: 'Create and send invoice', tag: 'Invoices' },
                { name: 'Process Refund', desc: 'Process a refund', tag: 'Refunds' },
                { name: 'List Subscriptions', desc: 'List customer subscriptions', tag: 'Subscriptions' },
              ].map((tool) => (
                <div key={tool.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="size-6 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                      <Zap size={12} />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">{tool.name}</span>
                      <span className="text-[9.5px] text-slate-400 truncate block">{tool.desc}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                    {tool.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
