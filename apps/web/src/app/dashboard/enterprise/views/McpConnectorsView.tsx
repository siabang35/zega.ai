import React, { useState } from 'react';
import { 
  Database, Plus, Search, Filter, Cpu, CheckCircle2, TrendingUp, TrendingDown,
  ArrowRight, Layers, Activity, Server, Zap, Globe, ShieldCheck, Check,
  CreditCard, MessageSquare, Code2, FileText, Share2, Bell, HelpCircle,
  MoreVertical, X, ExternalLink, RefreshCw, LayoutGrid, List, SlidersHorizontal,
  ChevronDown, Brain, Box, Sparkles
} from 'lucide-react';

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
    { id: 'stripe', name: 'Stripe MCP', cat: 'Payments', status: 'Connected', latency: '132ms', tools: '183 Tools', icon: CreditCard, color: 'bg-indigo-600 text-white' },
    { id: 'supabase', name: 'Supabase MCP', cat: 'Database', status: 'Connected', latency: '96ms', tools: '98 Tools', icon: Database, color: 'bg-emerald-600 text-white' },
    { id: 'slack', name: 'Slack MCP', cat: 'Communication', status: 'Connected', latency: '121ms', tools: '92 Tools', icon: MessageSquare, color: 'bg-amber-500 text-white' },
    { id: 'github', name: 'GitHub MCP', cat: 'DevOps', status: 'Connected', latency: '110ms', tools: '132 Tools', icon: Code2, color: 'bg-slate-900 text-white' },
    { id: 'gdrive', name: 'Google Drive MCP', cat: 'Storage', status: 'Connected', latency: '145ms', tools: '63 Tools', icon: FileText, color: 'bg-sky-500 text-white' },
    { id: 'notion', name: 'Notion MCP', cat: 'Productivity', status: 'Connected', latency: '128ms', tools: '78 Tools', icon: FileText, color: 'bg-slate-800 text-white' },
    { id: 'jira', name: 'Jira MCP', cat: 'Project Mgmt', status: 'Connected', latency: '156ms', tools: '59 Tools', icon: Layers, color: 'bg-blue-600 text-white' },
    { id: 'hubspot', name: 'HubSpot MCP', cat: 'CRM', status: 'Connected', latency: '140ms', tools: '70 Tools', icon: Share2, color: 'bg-orange-500 text-white' },
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
                      <div className={`size-9 rounded-xl ${server.color} flex items-center justify-center font-bold shadow-2xs`}>
                        <Icon size={18} />
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

          {/* BOTTOM ROW: REAL ANIMATED SVG DATA FLOW MCP CONNECTION MAP, INTERACTIVE USAGE OVERVIEW, RECENT ACTIVITY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. MCP CONNECTION MAP WITH LIVE ANIMATED DATA PARTICLES */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">MCP Connection Map</h3>
                <MoreVertical size={14} className="text-slate-400" />
              </div>

              <div className="w-full overflow-hidden">
                <svg className="w-full h-auto" viewBox="0 0 500 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <path id="flow-agents-to-hub" d="M 100 75 L 145 75" />
                    <path id="flow-hub-to-stripe" d="M 235 75 C 260 75, 260 25, 285 25" />
                    <path id="flow-hub-to-supabase" d="M 235 75 C 260 75, 260 58, 285 58" />
                    <path id="flow-hub-to-slack1" d="M 235 75 C 260 75, 260 92, 285 92" />
                    <path id="flow-hub-to-slack2" d="M 235 75 C 260 75, 260 125, 285 125" />

                    <path id="flow-stripe-to-ext" d="M 370 25 C 392 25, 392 75, 415 75" />
                    <path id="flow-supabase-to-ext" d="M 370 58 C 392 58, 392 75, 415 75" />
                    <path id="flow-slack1-to-ext" d="M 370 92 C 392 92, 392 75, 415 75" />
                    <path id="flow-slack2-to-ext" d="M 370 125 C 392 125, 392 75, 415 75" />
                  </defs>

                  <use href="#flow-agents-to-hub" stroke="#818CF8" strokeWidth="2.5" strokeDasharray="4 4" className="animate-data-flow" />
                  
                  <use href="#flow-hub-to-stripe" stroke="#6366F1" strokeWidth="2" />
                  <use href="#flow-hub-to-supabase" stroke="#10B981" strokeWidth="2" />
                  <use href="#flow-hub-to-slack1" stroke="#F59E0B" strokeWidth="2" />
                  <use href="#flow-hub-to-slack2" stroke="#8B5CF6" strokeWidth="2" />

                  <use href="#flow-stripe-to-ext" stroke="#6366F1" strokeWidth="1.5" opacity="0.8" />
                  <use href="#flow-supabase-to-ext" stroke="#10B981" strokeWidth="1.5" opacity="0.8" />
                  <use href="#flow-slack1-to-ext" stroke="#F59E0B" strokeWidth="1.5" opacity="0.8" />
                  <use href="#flow-slack2-to-ext" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.8" />

                  <circle r="3.5" fill="#4F46E5" filter="drop-shadow(0 0 4px #4F46E5)">
                    <animateMotion dur="1.2s" repeatCount="indefinite">
                      <mpath href="#flow-agents-to-hub" />
                    </animateMotion>
                  </circle>

                  <circle r="3" fill="#6366F1" filter="drop-shadow(0 0 3px #6366F1)">
                    <animateMotion dur="1.8s" repeatCount="indefinite">
                      <mpath href="#flow-hub-to-stripe" />
                    </animateMotion>
                  </circle>

                  <circle r="3" fill="#10B981" filter="drop-shadow(0 0 3px #10B981)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.3s">
                      <mpath href="#flow-hub-to-supabase" />
                    </animateMotion>
                  </circle>

                  <circle r="3" fill="#F59E0B" filter="drop-shadow(0 0 3px #F59E0B)">
                    <animateMotion dur="1.7s" repeatCount="indefinite" begin="0.6s">
                      <mpath href="#flow-hub-to-slack1" />
                    </animateMotion>
                  </circle>

                  <circle r="3" fill="#8B5CF6" filter="drop-shadow(0 0 3px #8B5CF6)">
                    <animateMotion dur="2s" repeatCount="indefinite" begin="0.2s">
                      <mpath href="#flow-hub-to-slack2" />
                    </animateMotion>
                  </circle>

                  <circle r="2.5" fill="#6366F1">
                    <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.4s">
                      <mpath href="#flow-stripe-to-ext" />
                    </animateMotion>
                  </circle>
                  <circle r="2.5" fill="#10B981">
                    <animateMotion dur="1.4s" repeatCount="indefinite" begin="0.8s">
                      <mpath href="#flow-supabase-to-ext" />
                    </animateMotion>
                  </circle>
                  <circle r="2.5" fill="#F59E0B">
                    <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.1s">
                      <mpath href="#flow-slack1-to-ext" />
                    </animateMotion>
                  </circle>
                  <circle r="2.5" fill="#8B5CF6">
                    <animateMotion dur="1.9s" repeatCount="indefinite" begin="0.5s">
                      <mpath href="#flow-slack2-to-ext" />
                    </animateMotion>
                  </circle>

                  {/* NODE 1: AI AGENTS */}
                  <g transform="translate(10, 48)">
                    <rect width="90" height="54" rx="12" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5" />
                    <circle cx="26" cy="27" r="12" fill="#4F46E5" />
                    <path d="M 21 27 C 21 24, 24 22, 26 22 C 28 22, 31 24, 31 27 C 31 30, 28 32, 26 32 Z" fill="white" />
                    <text x="44" y="24" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#1E1B4B">AI Agents</text>
                    <text x="44" y="36" fontFamily="sans-serif" fontSize="8" fill="#6366F1">34 Agents</text>
                  </g>

                  {/* NODE 2: MCP HUB (CENTER HIGHLIGHTED) */}
                  <g transform="translate(145, 42)">
                    <rect width="90" height="66" rx="14" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" filter="drop-shadow(0 2px 4px rgba(79,70,229,0.15))" />
                    <rect x="5" y="5" width="80" height="56" rx="10" fill="#EEF2FF" />
                    <circle cx="45" cy="24" r="11" fill="#4F46E5" />
                    <text x="45" y="44" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fontWeight="900" fill="#4F46E5">MCP Hub</text>
                    <text x="45" y="54" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fontWeight="600" fill="#6366F1">24 Servers</text>
                  </g>

                  {/* NODE 3: STACKED MCP SERVERS (RIGHT TREE) */}
                  <g transform="translate(285, 12)">
                    <rect width="85" height="26" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <circle cx="12" cy="13" r="6" fill="#6366F1" />
                    <text x="10" y="16" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="white">S</text>
                    <text x="24" y="16" fontFamily="sans-serif" fontSize="8.5" fontWeight="bold" fill="#1E293B">Stripe</text>
                    <text x="56" y="16" fontFamily="sans-serif" fontSize="7" fill="#64748B">Payments</text>
                  </g>

                  <g transform="translate(285, 45)">
                    <rect width="85" height="26" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <circle cx="12" cy="13" r="6" fill="#10B981" />
                    <text x="9" y="16" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="white">⚡</text>
                    <text x="24" y="16" fontFamily="sans-serif" fontSize="8.5" fontWeight="bold" fill="#1E293B">Supabase</text>
                    <text x="60" y="16" fontFamily="sans-serif" fontSize="7" fill="#64748B">Database</text>
                  </g>

                  <g transform="translate(285, 79)">
                    <rect width="85" height="26" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <circle cx="12" cy="13" r="6" fill="#F59E0B" />
                    <text x="10" y="16" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="white">#</text>
                    <text x="24" y="16" fontFamily="sans-serif" fontSize="8.5" fontWeight="bold" fill="#1E293B">Slack</text>
                    <text x="52" y="16" fontFamily="sans-serif" fontSize="7" fill="#64748B">Comm</text>
                  </g>

                  <g transform="translate(285, 112)">
                    <rect width="85" height="26" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                    <circle cx="12" cy="13" r="6" fill="#8B5CF6" />
                    <text x="10" y="16" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="white">#</text>
                    <text x="24" y="16" fontFamily="sans-serif" fontSize="8.5" fontWeight="bold" fill="#1E293B">Slack</text>
                    <text x="52" y="16" fontFamily="sans-serif" fontSize="7" fill="#64748B">Comm</text>
                  </g>

                  {/* NODE 4: EXTERNAL SERVICES */}
                  <g transform="translate(415, 48)">
                    <rect width="78" height="54" rx="12" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1.5" />
                    <circle cx="39" cy="22" r="11" fill="#F59E0B" />
                    <text x="39" y="26" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="white">📦</text>
                    <text x="39" y="40" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#78350F">External</text>
                    <text x="39" y="49" textAnchor="middle" fontFamily="sans-serif" fontSize="7.5" fill="#B45309">120+ APIs</text>
                  </g>
                </svg>
              </div>

              <div className="flex items-center justify-center gap-4 text-[9.5px] font-semibold text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Flow</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" /> Warning</span>
                <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-rose-500" /> Error</span>
              </div>
            </div>

            {/* 2. INTERACTIVE USAGE OVERVIEW (7D) - SVG DONUT CHART */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Usage Overview (7D)</h3>
              
              <div className="flex items-center gap-3">
                {/* STATEFUL INTERACTIVE SVG DONUT CHART */}
                <div className="relative size-24 flex-shrink-0 flex items-center justify-center">
                  <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                    {donutData.map((item) => {
                      const isHovered = hoveredSlice === item.name;
                      return (
                        <path
                          key={item.name}
                          onMouseEnter={() => setHoveredSlice(item.name)}
                          strokeDasharray={item.dashArray}
                          strokeDashoffset={item.dashOffset}
                          stroke={item.color}
                          strokeWidth={isHovered ? 7.5 : 6}
                          fill="none"
                          className="transition-all duration-300 cursor-pointer"
                          opacity={hoveredSlice && !isHovered ? 0.45 : 1}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      );
                    })}
                  </svg>
                  {/* CENTRAL READOUT DISPLAY ON HOVER */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 leading-none">
                      {activeSegment.pct}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                      {activeSegment.calls}
                    </span>
                  </div>
                </div>

                {/* SYNCHRONIZED INTERACTIVE LEGEND */}
                <div className="space-y-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  {donutData.map((item) => {
                    const isHovered = hoveredSlice === item.name;
                    return (
                      <div
                        key={item.name}
                        onMouseEnter={() => setHoveredSlice(item.name)}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md cursor-pointer transition-all ${
                          isHovered 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold scale-102' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name} {item.pct}% ({item.calls})</span>
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
                  { icon: CreditCard, color: 'bg-indigo-50 text-indigo-600', server: 'Stripe MCP', msg: 'Payment intent created', time: '2m ago' },
                  { icon: Database, color: 'bg-emerald-50 text-emerald-600', server: 'Supabase MCP', msg: 'Query executed', time: '5m ago' },
                  { icon: MessageSquare, color: 'bg-amber-50 text-amber-600', server: 'Slack MCP', msg: 'Message posted', time: '8m ago' },
                  { icon: Layers, color: 'bg-blue-50 text-blue-600', server: 'Jira MCP', msg: 'Issue updated', time: '12m ago' },
                  { icon: Code2, color: 'bg-slate-100 text-slate-800', server: 'GitHub MCP', msg: 'Pull request created', time: '15m ago' },
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5 last:border-0">
                      <div className="flex items-center gap-2 truncate">
                        <div className={`size-6 rounded-lg ${act.color} flex items-center justify-center font-bold`}>
                          <Icon size={12} />
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

        {/* RIGHT DEDICATED INSPECTION DRAWER (4 COLS) */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Stripe MCP</h2>
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
