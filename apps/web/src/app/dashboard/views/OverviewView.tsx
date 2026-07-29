import React, { useState } from 'react';
import { 
  Activity, Zap, CheckCircle2, ArrowUpRight, 
  ChevronRight, Plus, X, Search, Check, Layers, Sparkles,
  Globe, Clock, Network, Bot, Workflow, ShieldCheck, Database,
  Cpu, Lock, Server, BarChart3, ChevronDown
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { getR2CdnUrl } from '../../utils/cdn';

export interface IntegrationConnector {
  id: string;
  name: string;
  category: 'LLM Engine' | 'Data & Storage' | 'Messaging & CRM' | 'Payment & API' | 'Automation';
  description: string;
  logo: string;
  connected: boolean;
}

const ALL_INTEGRATIONS: IntegrationConnector[] = [
  { id: 'slack', name: 'Slack Business', category: 'Messaging & CRM', description: 'Real-time team events & alert triggers', logo: getR2CdnUrl('/assets/visualization/slack.png'), connected: true },
  { id: 'notion', name: 'Notion Workspace', category: 'Data & Storage', description: 'Knowledge retrieval & docs sync', logo: getR2CdnUrl('/assets/logo/notion.png'), connected: true },
  { id: 'zapier', name: 'Zapier Automation', category: 'Automation', description: 'Multi-app workflow automation routing', logo: getR2CdnUrl('/assets/logo/zapier.png'), connected: false },
  { id: 'dropbox', name: 'Dropbox Storage', category: 'Data & Storage', description: 'Document ingestion & vault storage', logo: getR2CdnUrl('/assets/logo/dropbox.png'), connected: true },
  { id: 'gdrive', name: 'Google Drive', category: 'Data & Storage', description: 'Enterprise shared files & drive data', logo: getR2CdnUrl('/assets/logo/google_drive.png'), connected: false },
  { id: 'stripe', name: 'Stripe Connect', category: 'Payment & API', description: 'Subscription & micro-payment processing', logo: getR2CdnUrl('/assets/visualization/stripe.webp'), connected: true },
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'Messaging & CRM', description: 'Direct customer support & AI chat', logo: getR2CdnUrl('/assets/visualization/whatsapp.jpeg'), connected: true },
  { id: 'gmaps', name: 'Google Maps API', category: 'Payment & API', description: 'Geocoding & spatial location routing', logo: getR2CdnUrl('/assets/visualization/gmaps.webp'), connected: false },
  { id: 'bigquery', name: 'Google BigQuery', category: 'Data & Storage', description: 'Data warehouse & analytics queries', logo: getR2CdnUrl('/assets/visualization/bigquery.webp'), connected: true },
  { id: 'metaapi', name: 'Meta Marketing API', category: 'Messaging & CRM', description: 'Social ad sync & campaign manager', logo: getR2CdnUrl('/assets/visualization/metaapi.png'), connected: false },
  { id: 'x402', name: 'x402 M2M Payment', category: 'Payment & API', description: 'Machine-to-machine micro-transactions', logo: getR2CdnUrl('/assets/visualization/x402.jpg'), connected: true },
  { id: 'spreadsheet', name: 'Google Sheets', category: 'Data & Storage', description: 'Tabular data import & spreadsheet sync', logo: getR2CdnUrl('/assets/visualization/sphreadsheet.webp'), connected: false },
  { id: 'gpt', name: 'OpenAI GPT-4o', category: 'LLM Engine', description: 'Primary cognitive & reasoning model', logo: getR2CdnUrl('/assets/visualization/gpt.webp'), connected: true },
  { id: 'claude', name: 'Anthropic Claude 3.5', category: 'LLM Engine', description: 'High-precision code & document analysis', logo: getR2CdnUrl('/assets/visualization/claude.webp'), connected: true },
  { id: 'deepseek', name: 'DeepSeek V3 / R1', category: 'LLM Engine', description: 'Open-weights reasoning & math engine', logo: getR2CdnUrl('/assets/visualization/deepseek.webp'), connected: true },
  { id: 'gemini', name: 'Google Gemini 1.5 Pro', category: 'LLM Engine', description: 'Multimodal vision & long-context model', logo: getR2CdnUrl('/assets/visualization/gemini.png'), connected: true },
  { id: 'mistral', name: 'Mistral Large 2', category: 'LLM Engine', description: 'Fast European open LLM orchestrator', logo: getR2CdnUrl('/assets/visualization/mistral.png'), connected: false },
  { id: 'qwen', name: 'Alibaba Qwen 2.5', category: 'LLM Engine', description: 'Multilingual & code intelligence LLM', logo: getR2CdnUrl('/assets/visualization/qwen.webp'), connected: false },
  { id: 'llama', name: 'Meta Llama 3.3', category: 'LLM Engine', description: 'Open source enterprise agent foundation', logo: getR2CdnUrl('/assets/visualization/llama.jpeg'), connected: false },
];

export function OverviewView({ onNavigateToSandbox }: { onNavigateToSandbox: () => void }) {
  const [integrations, setIntegrations] = useState<IntegrationConnector[]>(ALL_INTEGRATIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleConnector = (id: string) => {
    setIntegrations(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.connected;
        showToast(`${c.name} ${nextState ? 'connected' : 'disconnected'} successfully.`);
        return { ...c, connected: nextState };
      }
      return c;
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Connectors displayed on the main card (top 5 active)
  const activeConnectors = integrations.filter(c => c.connected).slice(0, 5);

  // Filtered connectors for Modal
  const categories = ['All', 'LLM Engine', 'Data & Storage', 'Messaging & CRM', 'Payment & API', 'Automation'];
  const filteredIntegrations = integrations.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Chart.js Configuration for Agent Throughput
  const chartData = {
    labels: ['01/11', '02/11', '03/11', '04/11', '05/11', '06/11', '07/11', '08/11', '09/11', '10/11', '11/11', '12/11'],
    datasets: [
      {
        label: 'Workflow Success (%)',
        data: [60, 75, 50, 85, 70, 95, 80, 65, 90, 88, 92, 96],
        backgroundColor: '#e05638',
        borderRadius: 6,
        barThickness: 14,
      },
      {
        label: 'Request Volume (k)',
        data: [30, 45, 25, 60, 40, 70, 50, 35, 65, 58, 62, 75],
        backgroundColor: '#0EA5E9',
        borderRadius: 6,
        barThickness: 14,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'monospace', size: 10 }, color: '#64748B' },
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.4)' },
        ticks: { font: { family: 'monospace', size: 10 }, color: '#64748B' },
      },
    },
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-xl border border-slate-700 dark:border-slate-200 animate-slideUp">
          <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Key Metrics Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>SUCCESSFUL RUNS</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              +13 TODAY
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight font-mono text-slate-900 dark:text-slate-50">780</span>
            <span className="text-xs text-slate-500 font-medium">executions</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>98.4% success rate across all agents</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>AUTOMATED ACTIONS</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              +42 TODAY
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight font-mono text-slate-900 dark:text-slate-50">124</span>
            <span className="text-xs text-slate-500 font-medium">tasks resolved</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Zap size={13} className="text-[#e05638]" />
            <span>Avg throughput: 1.8s / workflow</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>CREDITS USED</span>
            <span className="text-[11px] font-bold text-slate-400">RENEW: 20 OCT</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight font-mono text-slate-900 dark:text-slate-50">23,123.12</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Activity size={13} className="text-blue-500" />
            <span>Pending Balance: $0.00</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e05638]/30 bg-white dark:bg-slate-900 p-5 transition-all">
          <div className="flex items-center justify-between text-[#e05638] text-xs font-bold uppercase tracking-wider">
            <span>ORCHESTRATION TIER</span>
            <span className="rounded-md bg-[#e05638]/10 px-2 py-0.5 text-[9px] font-bold text-[#e05638]">ENTERPRISE</span>
          </div>
          <div className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">
            ZEGA Sandbox Active
          </div>
          <button 
            onClick={onNavigateToSandbox}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e05638] py-2 text-xs font-bold text-white transition-all hover:bg-[#c8462b] active:scale-[0.98] cursor-pointer"
          >
            <span>Launch Node Canvas</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* 5-LAYER ENTERPRISE AI ARCHITECTURE MATRIX (Design 1) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                ZEGA AI Orchestrator
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enterprise Autonomous Agent Orchestration Platform
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 flex items-center gap-2">
              <Bot size={14} className="text-[#e05638]" />
              <span>Active Agents: <strong>128</strong></span>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 flex items-center gap-2">
              <Workflow size={14} className="text-amber-500" />
              <span>Workflows: <strong>27</strong></span>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 flex items-center gap-2">
              <Zap size={14} className="text-blue-500" />
              <span>Avg Latency: <strong>142ms</strong></span>
            </div>
          </div>
        </div>

        {/* LAYER 1: Event Sources */}
        <div>
          <div className="text-[10px] font-mono font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            LAYER 1: Event Sources (Triggers)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { name: 'API (REST/GraphQL)', icon: Globe, badge: 'Active' },
              { name: 'Real-time Webhook', icon: Zap, badge: 'Active' },
              { name: 'Scheduler (Cron)', icon: Clock, badge: 'Active' },
              { name: 'Form Submitted', icon: Layers, badge: 'Active' },
              { name: 'MCP Context Protocol', icon: Network, badge: 'Active' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <item.icon size={14} className="text-[#e05638] shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER ARCHITECTURE FLOW: Integrations + Core Orchestrator + AI Agents */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* LAYER 2: Connected Integrations */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
            <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest mb-3">
              LAYER 2: Integrations
            </div>
            <div className="space-y-2">
              {[
                { name: 'Google Maps API', desc: 'Location & Geo Data', logo: getR2CdnUrl('/assets/visualization/gmaps.webp') },
                { name: 'WhatsApp Business', desc: 'Messaging API', logo: getR2CdnUrl('/assets/visualization/whatsapp.jpeg') },
                { name: 'Stripe Connect', desc: 'Payments & Billing', logo: getR2CdnUrl('/assets/visualization/stripe.webp') },
                { name: 'x402 Protocol', desc: 'M2M Micro-payments', logo: getR2CdnUrl('/assets/visualization/x402.jpg') },
                { name: 'Supabase Database', desc: 'Database & Auth', logo: getR2CdnUrl('/assets/logo/notion.png') },
                { name: 'BigQuery Warehouse', desc: 'Data Warehouse', logo: getR2CdnUrl('/assets/visualization/bigquery.webp') },
                { name: 'Slack Business', desc: 'Team Collaboration', logo: getR2CdnUrl('/assets/visualization/slack.png') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs">
                  <img src={item.logo} alt={item.name} className="size-5 object-contain rounded-xs shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LAYER 3: Core Orchestrator */}
          <div className="rounded-xl border border-[#e05638]/40 dark:border-[#e05638]/50 bg-gradient-to-b from-[#e05638]/10 via-white dark:via-slate-900 to-transparent p-5 text-center flex flex-col justify-between relative overflow-hidden">
            <div className="text-[10px] font-mono font-extrabold text-[#e05638] uppercase tracking-widest mb-2">
              LAYER 3: Agent Orchestrator Core
            </div>

            <div className="my-auto space-y-3 py-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                ZEGA.AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Enterprise Autonomous Agent Orchestrator
              </p>

              <div className="space-y-2 mt-4 text-left">
                {[
                  { step: 'Planning', desc: 'Analyze & Decompose Goal' },
                  { step: 'Reasoning', desc: 'Multi-step Chain-of-Thought' },
                  { step: 'Tool Calling', desc: 'Execute with Supabase & APIs' },
                  { step: 'Memory', desc: 'Retrieve Vector Store & Context' },
                  { step: 'Execution', desc: 'Deliver Real-time Results' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{s.step}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e05638]/20 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">● LIVE Running</span>
              <span className="text-slate-500">27 Workflows</span>
              <span className="text-slate-500">18 Agents</span>
            </div>
          </div>

          {/* LAYER 4: AI Agents */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
            <div className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest mb-3">
              LAYER 4: AI Agents
            </div>
            <div className="space-y-2">
              {[
                { name: 'Sales Agent', desc: 'HubSpot, LinkedIn, WhatsApp', status: 'Active' },
                { name: 'Finance Agent', desc: 'Stripe, x402, Invoices', status: 'Active' },
                { name: 'CS Agent', desc: 'WhatsApp, Telegram, Email', status: 'Active' },
                { name: 'SEO Agent', desc: 'GSC, GA4, Ads, Keywords', status: 'Active' },
                { name: 'Analytics Agent', desc: 'BigQuery, Metabase, Reports', status: 'Active' },
                { name: 'Research Agent', desc: 'Web, Papers, News, Data', status: 'Idle' },
                { name: 'Coding Agent', desc: 'GitHub, Code, Deployments', status: 'Idle' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs">
                  <div className="truncate">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LAYER 5: Model Router & 9Router Engine */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest">
                LAYER 5: Model Router
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Intelligent dynamic routing to top LLM engines
              </p>
            </div>
            <span className="rounded-md bg-[#e05638] px-2.5 py-1 text-xs font-mono font-extrabold text-white">
              9Router Engine Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { name: 'Claude 3.5', provider: 'Anthropic', logo: getR2CdnUrl('/assets/visualization/claude.webp') },
              { name: 'GPT-4.1', provider: 'OpenAI', logo: getR2CdnUrl('/assets/visualization/gpt.webp') },
              { name: 'Gemini 2.5', provider: 'Google', logo: getR2CdnUrl('/assets/visualization/gemini.png') },
              { name: 'DeepSeek R1', provider: 'DeepSeek', logo: getR2CdnUrl('/assets/visualization/deepseek.webp') },
              { name: 'Qwen 2.5', provider: 'Alibaba', logo: getR2CdnUrl('/assets/visualization/qwen.webp') },
              { name: 'Mistral Large', provider: 'Mistral AI', logo: getR2CdnUrl('/assets/visualization/mistral.png') },
              { name: 'Llama 3.3', provider: 'Meta AI', logo: getR2CdnUrl('/assets/visualization/llama.jpeg') },
            ].map((m, i) => (
              <div key={i} className="p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex items-center gap-2 text-xs">
                <img src={m.logo} alt={m.name} className="size-5 object-contain rounded-xs shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{m.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{m.provider}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE BUSINESS METRICS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {[
            { label: 'Active Agents', value: '2,847', change: '+12.5%' },
            { label: 'Workflows Executed', value: '18,291', change: '+8.4%' },
            { label: 'Payments (Stripe)', value: '$1.2M', change: '+14.2%' },
            { label: 'x402 Micro-Tx', value: '14,291', change: '+23.1%' },
            { label: 'Overall Success Rate', value: '99.7%', change: '+0.7%' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
              <div className="text-[10px] font-mono text-slate-500 font-semibold uppercase">{stat.label}</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-50 mt-1">{stat.value}</div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                <span>↑</span> {stat.change} vs last month
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Throughput Analytics Chart & Automation Connectors */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Throughput Metrics using Chart.js */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">AGENT THROUGHPUT METRICS</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Monitor execution volume, latency, and workflow success via Chart.js</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#e05638]" /> Success Rate</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0EA5E9]" /> Volume (k)</span>
            </div>
          </div>

          {/* Chart.js Component */}
          <div className="mt-6 h-56 w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Automation Connectors Toggle Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">AUTOMATION CONNECTORS</h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{integrations.filter(c => c.connected).length} Connected</span>
                <ChevronRight size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Active brand integrations for agent orchestration</p>

            <div className="mt-4 space-y-2.5">
              {activeConnectors.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                      <img src={c.logo} alt={c.name} className="size-full object-contain rounded-sm" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{c.description}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleConnector(c.id)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${c.connected ? 'bg-[#e05638]' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${c.connected ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#e05638] hover:underline cursor-pointer"
            >
              <Plus size={14} /> Add Connector
            </button>
            <button 
              onClick={() => showToast('Connector configurations saved to Supabase.')}
              className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTION PLANS Tiers */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">EXECUTION PLANS</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage deployment tiers and automation usage</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">5 Tiers Allocated</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { tag: 'Agent Runtime', name: 'STARTER PLAN', renewal: '20 Oct, 2026', featured: false },
            { tag: 'Automation Tier', name: 'TEAM PLAN', renewal: '20 Oct, 2026', featured: false },
            { tag: 'Execution Capacity', name: 'SCALE PLAN', renewal: '20 Oct, 2026', featured: false },
            { tag: 'Orchestration Tier', name: 'ENTERPRISE PLAN', renewal: '20 Oct, 2026', featured: true },
            { tag: 'Runtime Allocation', name: 'CUSTOM PLAN', renewal: '20 Oct, 2026', featured: false },
          ].map((plan, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                plan.featured
                  ? 'border-[#e05638] bg-[#e05638]/5'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <div>
                <div className={`text-[10px] font-medium ${plan.featured ? 'text-[#e05638] font-bold' : 'text-slate-500'}`}>
                  {plan.tag}
                </div>
                <div className={`text-xs font-bold font-mono mt-1 ${plan.featured ? 'text-[#e05638]' : 'text-slate-900 dark:text-slate-100'}`}>
                  {plan.name}
                </div>
                <div className="mt-3 text-[10px] text-slate-500">
                  Renewal: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{plan.renewal}</span>
                </div>
              </div>

              <button
                onClick={onNavigateToSandbox}
                className={`mt-4 w-full rounded-lg py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                  plan.featured
                    ? 'bg-[#e05638] text-white hover:bg-[#c8462b]'
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {plan.featured ? 'Manage Plan' : 'View Usage'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Integration Connector Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md dark:shadow-black/40 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <X size={14} />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#e05638] uppercase tracking-wider">
                <Layers size={14} /> Integration Directory
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Connect Enterprise Tools & Models
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable brand integrations and LLM engines for autonomous ZEGA workflow agents.
              </p>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs">
                <Search size={14} className="text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search integrations (Slack, Stripe, GPT-4, DeepSeek...)"
                  className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1 text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="mt-4 max-h-[360px] overflow-y-auto pr-1 space-y-2">
              {filteredIntegrations.map((tool) => (
                <div 
                  key={tool.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center p-2 shadow-2xs flex-shrink-0 overflow-hidden">
                      <img src={tool.logo} alt={tool.name} className="size-full object-contain rounded-sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{tool.name}</span>
                        <span className="rounded-md bg-slate-200/70 dark:bg-slate-700/60 px-2 py-0.5 text-[9.5px] font-medium text-slate-600 dark:text-slate-300">
                          {tool.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{tool.description}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleConnector(tool.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      tool.connected
                        ? 'border border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs'
                    }`}
                  >
                    {tool.connected ? (
                      <>
                        <Check size={13} />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                </div>
              ))}

              {filteredIntegrations.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No connectors found for "{searchQuery}".
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles size={13} className="text-[#e05638]" />
                <span>{integrations.filter(i => i.connected).length} of {integrations.length} connectors active</span>
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1.5 font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
