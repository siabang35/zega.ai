import React, { useState } from 'react';
import { 
  Activity, Zap, CheckCircle2, ArrowUpRight, 
  ChevronRight, Plus, X, Search, Check, Layers, Sparkles,
  Globe, Clock, Network, Bot, Workflow, ShieldCheck, Database,
  Cpu, Lock, Server, BarChart3, ChevronDown, RefreshCw, Send,
  SlidersHorizontal, AlertTriangle, FileText, Mail, MessageSquare,
  HelpCircle, Settings, Bell, TrendingUp, Sparkle, UserCheck, ArrowRight
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { getR2CdnUrl } from '../../utils/cdn';

export interface ZegaOrchestratorViewProps {
  userRole?: 'individual' | 'enterprise';
  userName?: string;
  userEmail?: string;
  dark?: boolean;
  onNavigateToSandbox?: () => void;
  onSwitchWorkspace?: (workspace: 'enterprise' | 'umkm') => void;
}

export function ZegaOrchestratorView({
  userRole = 'enterprise',
  userName = 'Wildan Assyidiq',
  userEmail = 'wildan@zega.ai',
  dark = true,
  onNavigateToSandbox,
  onSwitchWorkspace
}: ZegaOrchestratorViewProps) {
  // State for Workspace Tier Mode (Enterprise vs Individual/UMKM)
  const [workspaceTier, setWorkspaceTier] = useState<'enterprise' | 'umkm'>(
    userRole === 'individual' ? 'umkm' : 'enterprise'
  );
  
  // State for Density (Detail vs Biasa/Standard)
  const [densityMode, setDensityMode] = useState<'detail' | 'biasa'>('detail');

  // State for AI Command Input
  const [commandInput, setCommandInput] = useState('');
  
  // State for Workflow Tab
  const [workflowTab, setWorkflowTab] = useState<'running' | 'waiting' | 'completed' | 'failed'>('running');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWorkspaceChange = (tier: 'enterprise' | 'umkm') => {
    setWorkspaceTier(tier);
    if (onSwitchWorkspace) onSwitchWorkspace(tier);
    triggerToast(`Switched workspace to ${tier === 'enterprise' ? 'ZEGA Enterprise (Scale Besar)' : 'Warung Digital / UMKM (Skala UMKM)'}`);
  };

  // Cost & Usage Chart Data
  const costChartData = {
    labels: ['May 1', 'May 5', 'May 10', 'May 15', 'May 22', 'May 31'],
    datasets: [
      {
        label: 'Daily Cost ($)',
        data: [120, 180, 240, 310, 290, 380],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#8b5cf6',
      },
    ],
  };

  const costChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#0f172a' : '#ffffff',
        titleColor: dark ? '#f8fafc' : '#0f172a',
        bodyColor: dark ? '#cbd5e1' : '#334155',
        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'monospace', size: 9 }, color: dark ? '#64748b' : '#94a3b8' },
      },
      y: {
        grid: { color: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: 'monospace', size: 9 }, color: dark ? '#64748b' : '#94a3b8' },
      },
    },
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-2xl border border-slate-700 dark:border-slate-200 animate-slideUp">
          <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER CONTROLS BAR: Workspace Selector & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 shadow-2xs">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WORKSPACE MODE</span>
              <span className="text-[9.5px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {workspaceTier === 'enterprise' ? 'ENTERPRISE (SKALA BESAR)' : 'UMKM / INDIVIDUAL'}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5">
              {workspaceTier === 'enterprise' ? 'ZEGA AI Orchestrator Enterprise Hub' : 'ZEGA AI Asisten & Otomatisasi UMKM'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Workspace Selector Switch */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1">
            <button
              onClick={() => handleWorkspaceChange('enterprise')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                workspaceTier === 'enterprise'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-none'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🏢 Enterprise (Besar)
            </button>
            <button
              onClick={() => handleWorkspaceChange('umkm')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                workspaceTier === 'umkm'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-none'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🏪 UMKM / Solopreneur
            </button>
          </div>

          {/* Density Switcher (Detail vs Biasa) */}
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1">
            <button
              onClick={() => {
                setDensityMode('detail');
                triggerToast('Density Mode: Detailed Telemetry View');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                densityMode === 'detail'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              📊 Detail
            </button>
            <button
              onClick={() => {
                setDensityMode('biasa');
                triggerToast('Density Mode: Standard Clean View');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                densityMode === 'biasa'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ✨ Biasa
            </button>
          </div>
        </div>
      </div>

      {/* GREETING & SUMMARY STRIP */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Good evening, {userName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {workspaceTier === 'enterprise' 
              ? 'Your AI organization is healthy and running smoothly.' 
              : 'Asisten AI UMKM Anda aktif & siap membantu otomatisasi bisnis harian.'}
          </p>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          {workspaceTier === 'enterprise' ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-purple-500 animate-pulse" />
                <span>28 Agents Online</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-sky-500 animate-pulse" />
                <span>6 Running Workflows</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>3 Pending Approvals</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>99.8% System Health</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>2 Bot UMKM Aktif</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>142 Chat WA / Hari</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs font-bold">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>99.4% Kepuasan Pelanggan</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOP ROW WIDGETS: AI Command Center (Left 2/3) + System Overview (Right 1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Command Center */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest">
              <span>AI COMMAND CENTER</span>
              <span className="font-mono text-[10px] text-slate-400">ZEGA AI v3.4 Live</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {workspaceTier === 'enterprise' ? 'What do you want ZEGA to do today?' : 'Mau AI bantu apa untuk bisnis UMKM Anda hari ini?'}
            </h2>

            {/* Input Bar */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950 p-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder={workspaceTier === 'enterprise' ? 'Ask ZEGA AI anything...' : 'Contoh: Buat invoice tagihan ke Toko Budi Rp 500.000...'}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none px-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commandInput) {
                    triggerToast(`Command executed: "${commandInput}"`);
                    setCommandInput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (commandInput) {
                    triggerToast(`Command executed: "${commandInput}"`);
                    setCommandInput('');
                  }
                }}
                className="size-9 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-all cursor-pointer shrink-0"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Action Chips */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-2">QUICK STARTERS</div>
            <div className="flex flex-wrap items-center gap-2">
              {(workspaceTier === 'enterprise' ? [
                { label: 'Build CRM Agent', icon: Bot },
                { label: 'Analyze Sales Data', icon: BarChart3 },
                { label: 'Generate Workflow', icon: Workflow },
                { label: 'Create Invoice Bot', icon: FileText },
                { label: 'Import Knowledge', icon: Database },
                { label: 'Deploy AI Team', icon: Zap },
              ] : [
                { label: 'Buat Tagihan Invoice', icon: FileText },
                { label: 'Balas Chat WhatsApp', icon: MessageSquare },
                { label: 'Promo Weekend IG', icon: Sparkle },
                { label: 'Rekap Penjualan Harian', icon: BarChart3 },
                { label: 'Katalog Produk WA', icon: Database },
              ]).map((chip, i) => (
                <button
                  key={i}
                  onClick={() => triggerToast(`Invoked Action: ${chip.label}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  <chip.icon size={13} className="text-violet-500" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System Overview (Radial Health & Progress Bars) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">SYSTEM OVERVIEW</span>
              <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9.5px] font-mono font-bold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>

            {/* Radial Dial Mockup */}
            <div className="mt-4 flex flex-col items-center justify-center text-center">
              <div className="relative size-32 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="99.8, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-50">99.8%</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Overall Health</span>
                </div>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                <CheckCircle2 size={11} /> Excellent
              </span>
            </div>
          </div>

          {/* Infrastructure Bar Indicators */}
          <div className="mt-5 space-y-2 text-xs">
            {[
              { name: 'Infrastructure', val: 100 },
              { name: 'Services', val: 99.6 },
              { name: 'Integrations', val: 99.9 },
              { name: 'Security', val: 100 },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">{item.name}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.val}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: AI Orchestration Map (Left 2/3) + Active Agents & Activity & Quick Actions (Right 1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Orchestration Map (Live DAG Flowchart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  AI ORCHESTRATION MAP
                </h3>
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9.5px] font-mono font-bold">
                  ● Live
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <button onClick={() => triggerToast('Search Nodes')} className="p-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                  <Search size={14} />
                </button>
                <button onClick={() => triggerToast('Expanded Canvas View')} className="p-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                  <SlidersHorizontal size={14} />
                </button>
                <button onClick={onNavigateToSandbox} className="p-1 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" title="Launch Node Canvas">
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* FLOWCHART GRAPH MATRIX */}
            <div className="mt-6 py-4 overflow-x-auto">
              <div className="min-w-[640px] grid grid-cols-5 gap-3 text-center items-center">
                {/* Column 1: Event Sources */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">Event Sources</div>
                  {[
                    { name: 'Webhook', icon: Zap, color: 'text-purple-500 bg-purple-500/10' },
                    { name: 'API', icon: Globe, color: 'text-sky-500 bg-sky-500/10' },
                    { name: 'Schedule', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
                    { name: 'Upload', icon: Database, color: 'text-emerald-500 bg-emerald-500/10' },
                  ].map((node, i) => (
                    <div key={i} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <div className={`p-1.5 rounded-lg ${node.color}`}>
                        <node.icon size={13} />
                      </div>
                      <span className="truncate">{node.name}</span>
                    </div>
                  ))}
                </div>

                {/* Column 2: Core Cognitive Nodes */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">Cognitive Core</div>
                  {[
                    { name: 'Planner Engine', desc: 'Decompose Goal', color: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200' },
                    { name: 'Reasoner DAG', desc: 'Chain-of-Thought', color: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200' },
                    { name: 'Memory Vector', desc: 'Context Retrieval', color: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200' },
                  ].map((node, i) => (
                    <div key={i} className={`p-2 rounded-xl border ${node.color} text-xs font-bold shadow-2xs`}>
                      <div>{node.name}</div>
                      {densityMode === 'detail' && <div className="text-[9px] text-slate-400 font-mono mt-0.5">{node.desc}</div>}
                    </div>
                  ))}
                </div>

                {/* Column 3: Model Router & M2M Payments */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">M2M Payments & Router</div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold space-y-2">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span>Model Router</span>
                      <span className="font-mono text-[9px] text-emerald-500 font-bold">12 Models</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-1.5 text-left text-[9.5px]">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-500">x402 Protocol:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">HTTP 402 Live</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-500">Stripe Non-Custodial:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">Connected</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-500">Solana Agent Kit:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">SOL/USDC Pay</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 4: AI Agents */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">AI Agents</div>
                  {[
                    { name: 'Sales Agent', status: 'Online' },
                    { name: 'Finance Agent', status: 'Online' },
                    { name: 'HR Agent', status: 'Online' },
                    { name: 'Support Agent', status: 'Online' },
                  ].map((agent, i) => (
                    <div key={i} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{agent.name}</span>
                      <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                  ))}
                  <div className="text-[10px] font-mono text-slate-400">+12 more active</div>
                </div>

                {/* Column 5: Outputs */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">Outputs</div>
                  {[
                    { name: 'Email', icon: Mail },
                    { name: 'CRM', icon: Bot },
                    { name: 'Database', icon: Database },
                    { name: 'Slack', icon: MessageSquare },
                    { name: 'Dashboard', icon: BarChart3 },
                  ].map((out, i) => (
                    <div key={i} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <out.icon size={13} className="text-sky-500 shrink-0" />
                      <span className="truncate">{out.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY METRICS FOOTER STRIP */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Events / min</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                246 <span className="text-[10px] text-emerald-500 font-bold">+12.5%</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tokens / min</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                1.2M <span className="text-[10px] text-emerald-500 font-bold">+8.4%</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                99.7% <span className="text-[10px] text-emerald-500 font-bold">+0.6%</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Avg. Latency</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                142ms <span className="text-[10px] text-emerald-500 font-bold">-5.6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE WIDGET STACK: Active Agents + Today's Activity + Quick Actions */}
        <div className="space-y-6">
          {/* Active Agents */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">ACTIVE AGENTS</h3>
              <button onClick={() => triggerToast('Viewing all 28 Agents')} className="text-[11px] font-bold text-violet-500 hover:underline cursor-pointer">
                View all
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {[
                { name: 'Sales Agent', desc: 'HubSpot, LinkedIn, Gmail', conv: '342 Conversations', rel: '99.8%', status: 'Online' },
                { name: 'Finance Agent', desc: 'Xero, Stripe, Invoices', conv: '156 Tasks', rel: '99.6%', status: 'Online' },
                { name: 'Support Agent', desc: 'Zendesk, WhatsApp, Email', conv: '532 Conversations', rel: '99.9%', status: 'Online' },
                { name: 'HR Agent', desc: 'BambooHR, Slack, Email', conv: '98 Tasks', rel: '99.7%', status: 'Online' },
                { name: 'Research Agent', desc: 'Web, Papers, Knowledge Base', conv: '-', rel: '-', status: 'Idle' },
              ].map((agent, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{agent.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        agent.status === 'Online' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        ● {agent.status}
                      </span>
                    </div>
                    {densityMode === 'detail' && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{agent.conv} • {agent.rel} Reliability</div>
                    )}
                  </div>

                  {/* Mini Sparkline Graph */}
                  <div className="w-12 h-6">
                    <svg className="w-full h-full" viewBox="0 0 40 20">
                      <path d="M0 15 Q 10 5, 20 12 T 40 4" fill="none" stroke={agent.status === 'Online' ? '#10b981' : '#64748b'} strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Activity Feed */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">TODAY'S ACTIVITY</h3>
              <button onClick={() => triggerToast('Viewing Activity Logs')} className="text-[11px] font-bold text-violet-500 hover:underline cursor-pointer">
                View all
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {[
                { title: 'Workflow "Invoice Processing" completed', time: '2 min ago', dot: 'bg-emerald-500' },
                { title: 'Sales Agent closed a deal worth $18,200', time: '5 min ago', dot: 'bg-emerald-500' },
                { title: 'New knowledge base "Product Docs" added', time: '15 min ago', dot: 'bg-sky-500' },
                { title: 'Finance Agent generated 32 invoices', time: '22 min ago', dot: 'bg-emerald-500' },
                { title: 'User approval for "Budget Report"', time: '33 min ago', dot: 'bg-amber-500' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`size-2 rounded-full ${log.dot} mt-1 shrink-0`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{log.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              QUICK ACTIONS
            </h3>

            <div className="mt-3 space-y-2">
              {[
                { label: 'Create New Agent', icon: Bot },
                { label: 'Create Workflow', icon: Workflow },
                { label: 'Upload Knowledge', icon: Database },
                { label: 'Connect Integration', icon: Layers },
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={() => triggerToast(`Clicked Quick Action: ${act.label}`)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                      <act.icon size={14} />
                    </div>
                    <span>{act.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Workflows Status (1/3) + Model Router (1/3) + Cost & Usage Chart (1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Workflows Status List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">WORKFLOWS</h3>
              <button onClick={() => triggerToast('View Workflows')} className="text-[11px] font-bold text-violet-500 hover:underline cursor-pointer">
                View all
              </button>
            </div>

            {/* Workflow Tabs */}
            <div className="mt-3 flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
              {[
                { key: 'running', label: 'Running (6)' },
                { key: 'waiting', label: 'Waiting (3)' },
                { key: 'completed', label: 'Completed' },
                { key: 'failed', label: 'Failed (1)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setWorkflowTab(tab.key as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    workflowTab === tab.key
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2.5">
              {[
                { name: 'Invoice Processing', team: 'Finance Team', time: '2m 34s', pct: '98%', status: 'Running' },
                { name: 'Lead Qualification', team: 'Sales Team', time: '4m 12s', pct: '76%', status: 'Running' },
                { name: 'Support Ticket Triage', team: 'Support Team', time: '1m 08s', pct: '92%', status: 'Running' },
              ].map((wf, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{wf.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{wf.team}</div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9.5px] font-bold">
                      ● {wf.status}
                    </span>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">{wf.time} • {wf.pct}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model Router Performance List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">MODEL ROUTER</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Smart routing across 12 models</p>
              </div>
              <button onClick={() => triggerToast('View Model Router Configuration')} className="text-[11px] font-bold text-violet-500 hover:underline cursor-pointer">
                View all
              </button>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {[
                { name: 'GPT-4o', latency: '872ms', cost: '$0.012', ctx: '128K', status: 'Optimal', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { name: 'Claude 3.5 Sonnet', latency: '732ms', cost: '$0.010', ctx: '200K', status: 'Optimal', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { name: 'Gemini 1.5 Pro', latency: '614ms', cost: '$0.007', ctx: '1M', status: 'Optimal', badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { name: 'Llama 3.1 70B', latency: '512ms', cost: '$0.002', ctx: '128K', status: 'Available', badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                    {densityMode === 'detail' && (
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {m.latency} • {m.cost} / 1k tok • {m.ctx}
                      </div>
                    )}
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold ${m.badgeBg}`}>
                    ● {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost & Usage Area Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">COST & USAGE</h3>
              <select className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 px-2 py-1 focus:outline-none">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-50">$3,241.12</span>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center">
                ↓ 18.6% vs last month
              </span>
            </div>

            {/* Area Chart Component */}
            <div className="mt-4 h-32 w-full">
              <Line data={costChartData} options={costChartOptions} />
            </div>

            {/* Breakdown Legend */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400">Models</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">$1,842.21 (56.8%)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400">Storage</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">$542.12 (16.7%)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400">Compute</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">$456.32 (14.1%)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400">Other</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">$400.47 (12.4%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Projected spend: $3,856.20</span>
              <span className="font-bold text-violet-500">77% of $5,000 limit</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-violet-600 w-[77%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
